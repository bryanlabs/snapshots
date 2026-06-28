import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import type { Provider } from "next-auth/providers";
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
  pubkey: z.string().min(1),
});

// Bryanlabs unified login via Authentik (OIDC). Enabled only when configured.
const authentikIssuer = process.env.AUTH_AUTHENTIK_ISSUER;
const authentikClientId = process.env.AUTH_AUTHENTIK_ID;
const authentikClientSecret = process.env.AUTH_AUTHENTIK_SECRET;
const authentikProvider: Provider | null =
  authentikIssuer && authentikClientId && authentikClientSecret
    ? {
        id: "authentik",
        name: "Bryanlabs",
        type: "oidc",
        issuer: authentikIssuer,
        clientId: authentikClientId,
        clientSecret: authentikClientSecret,
        authorization: { params: { scope: "openid email profile" } },
      }
    : null;

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
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
        pubkey: { label: "Public Key", type: "text" },
      },
      async authorize(credentials) {
        const parsed = WalletLoginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { walletAddress, signature, message, pubkey } = parsed.data;

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
          pubkey,
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

    // Bryanlabs unified SSO (Authentik). Added only when env vars are present.
    ...(authentikProvider ? [authentikProvider] : []),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, account, profile }) {
      // Authentik SSO: upsert the snapshots user and key the session to it.
      if (account?.provider === "authentik") {
        const email = typeof profile?.email === "string" ? profile.email : undefined;
        let dbUser = email
          ? await prisma.user.findUnique({ where: { email } })
          : null;
        if (!dbUser) {
          const freeTier = await prisma.tier.findUnique({ where: { name: "free" } });
          dbUser = await prisma.user.create({
            data: {
              email,
              displayName: typeof profile?.name === "string" ? profile.name : email,
              avatarUrl: typeof profile?.picture === "string" ? profile.picture : null,
              personalTierId: freeTier?.id,
              lastLoginAt: new Date(),
            },
          });
        } else {
          await prisma.user.update({
            where: { id: dbUser.id },
            data: { lastLoginAt: new Date() },
          });
        }
        token.id = dbUser.id;
        token.provider = "authentik";
        return token;
      }
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
          session.user.tier = 'ultra';
          session.user.tierId = 'ultra-tier'; // Add a dummy tier ID
          session.user.subscriptionStatus = 'active';
          session.user.subscriptionExpiresAt = undefined; // Never expires
          session.user.apiRateLimit = 2000; // Ultra tier limit
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
          // Import subscription utilities
          const { getEffectiveTier } = await import("@/lib/utils/subscription");
          const { getTierRateLimit } = await import("@/lib/utils/tier");
          
          // Calculate effective tier considering subscription status
          const effectiveTierName = getEffectiveTier(
            user.personalTier?.name || 'free',
            user.subscriptionStatus as any,
            user.subscriptionExpiresAt
          );
          
          // Get API rate limit for effective tier
          const apiRateLimit = getTierRateLimit(effectiveTierName);

          session.user.name = user.displayName || user.email?.split('@')[0] || undefined;
          session.user.email = user.email || "";
          session.user.walletAddress = user.walletAddress || undefined;
          session.user.image = user.avatarUrl || undefined;
          session.user.avatarUrl = user.avatarUrl || undefined;
          session.user.tier = effectiveTierName;
          session.user.tierId = user.personalTier?.id;
          session.user.role = user.role;
          
          // New subscription fields
          session.user.subscriptionStatus = user.subscriptionStatus;
          session.user.subscriptionExpiresAt = user.subscriptionExpiresAt || undefined;
          session.user.apiRateLimit = apiRateLimit;
          
          session.user.teams = []; // Empty for now
        } else {
          // User in session but not in database - this can happen during development
          const isDevelopment = process.env.NODE_ENV === 'development';
          if (isDevelopment) {
            console.warn(`[Dev] Session user ${token.id} not found in database - clearing session`);
          } else {
            console.error(`Session user ${token.id} not found in database`);
          }
          // Return null to invalidate the session
          return null as any;
        }
      }
      return session;
    },
  },
});
