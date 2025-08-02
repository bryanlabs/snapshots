import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { authConfig } from "./auth.config";

// Validation schemas
const LoginSchema = z.object({
  email: z.string().min(1), // Accept any string, not just email format
  password: z.string().min(1), // Minimum 1 character to match API requirements
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

        const { email: username, password } = parsed.data;

        // Check if this is the premium user
        const PREMIUM_USERNAME = process.env.PREMIUM_USERNAME;
        const PREMIUM_PASSWORD_HASH = process.env.PREMIUM_PASSWORD_HASH;
        
        if (!PREMIUM_USERNAME || !PREMIUM_PASSWORD_HASH) {
          // Premium user not configured, skip this check
          // This is not an error - premium user is optional
        } else
        
        if (username === PREMIUM_USERNAME) {
          // Verify password for premium user
          const isValid = await bcrypt.compare(password, PREMIUM_PASSWORD_HASH);
          if (!isValid) return null;
          
          // Return premium user data
          return {
            id: 'premium-user',
            email: `${username}@snapshots.bryanlabs.net`,
            name: 'Premium User',
            image: null,
          };
        }

        // Otherwise, find user by email in database
        const user = await prisma.user.findUnique({
          where: { email: username }, // username might be an email
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

        // Import verification functions
        const { verifyCosmosSignature, validateSignatureMessage } = await import("@/lib/auth/cosmos-verify");

        // Validate message format and timestamp
        if (!validateSignatureMessage(message)) {
          console.error("Invalid signature message format or expired timestamp");
          return null;
        }

        // Verify the signature server-side
        const isValidSignature = await verifyCosmosSignature({
          walletAddress,
          signature,
          message,
        });

        if (!isValidSignature) {
          console.error("Invalid wallet signature");
          return null;
        }

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
        
        // Handle premium user specially
        if (token.id === 'premium-user') {
          session.user.name = 'Ultimate User';
          session.user.email = 'ultimate_user@snapshots.bryanlabs.net';
          session.user.tier = 'unlimited';
          session.user.tierId = 'unlimited-tier'; // Add a dummy tier ID
          session.user.creditBalance = 9999; // Unlimited for ultimate
          session.user.teams = [];
          session.user.walletAddress = undefined;
          session.user.image = undefined;
          session.user.avatarUrl = undefined;
          return session;
        }
        
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
          session.user.role = user.role;
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