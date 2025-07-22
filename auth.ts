import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { authConfig } from "./auth.config";

// Validation schemas
const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const WalletLoginSchema = z.object({
  walletAddress: z.string().min(1),
  signature: z.string().min(1),
  message: z.string().min(1),
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    // Email/Password authentication
    CredentialsProvider({
      id: "credentials",
      name: "Email and Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = LoginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        // Find user by email
        const user = await prisma.user.findUnique({
          where: { email },
          include: {
            personalTier: true,
          },
        });

        if (!user || !user.passwordHash) return null;

        // Verify password
        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) return null;

        // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        // Return user data for session
        return {
          id: user.id,
          email: user.email,
          name: user.displayName,
          image: user.avatarUrl,
        };
      },
    }),

    // Web3 wallet authentication (Keplr)
    CredentialsProvider({
      id: "wallet",
      name: "Keplr Wallet",
      credentials: {
        walletAddress: { label: "Wallet Address", type: "text" },
        signature: { label: "Signature", type: "text" },
        message: { label: "Message", type: "text" },
      },
      async authorize(credentials) {
        const parsed = WalletLoginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { walletAddress, signature, message } = parsed.data;

        // TODO: Verify signature with Cosmos SDK
        // For now, we trust the client-side verification done by graz
        // In production, implement server-side signature verification

        // Find or create user by wallet address
        let user = await prisma.user.findUnique({
          where: { walletAddress },
          include: {
            personalTier: true,
          },
        });

        if (!user) {
          // Get default tier
          const defaultTier = await prisma.tier.findUnique({
            where: { name: "free" },
          });

          // Create new user
          user = await prisma.user.create({
            data: {
              walletAddress,
              personalTierId: defaultTier?.id,
              lastLoginAt: new Date(),
            },
            include: {
              personalTier: true,
            },
          });
        } else {
          // Update last login
          await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
          });
        }

        // Return user data for session
        return {
          id: user.id,
          email: user.email || undefined,
          name: user.displayName || user.walletAddress,
          image: user.avatarUrl,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.provider = account?.provider;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        
        // Fetch fresh user data including tier info
        const user = await prisma.user.findUnique({
          where: { id: token.id as string },
          include: {
            personalTier: true,
          },
        });

        if (user) {
          // Use personal tier for now (team support can be added later)
          const effectiveTier = user.personalTier;

          session.user.name = user.displayName || user.email?.split('@')[0] || undefined;
          session.user.email = user.email || undefined;
          session.user.walletAddress = user.walletAddress || undefined;
          session.user.image = user.avatarUrl || undefined;
          session.user.avatarUrl = user.avatarUrl || undefined;
          session.user.tier = effectiveTier?.name || "free";
          session.user.tierId = effectiveTier?.id;
          session.user.creditBalance = user.creditBalance;
          session.user.teams = []; // Empty for now
        } else {
          // User in session but not in database - this shouldn't happen but handle gracefully
          console.error(`Session user ${token.id} not found in database`);
          // Return null to invalidate the session
          return null as any;
        }
      }
      return session;
    },
  },
});