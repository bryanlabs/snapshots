import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      walletAddress?: string;
      tier: string;
      tierId?: string;
      role?: string;
      creditBalance: number;
      avatarUrl?: string;
      teams: Array<{
        id: string;
        name: string;
        role: string;
      }>;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    email?: string | null;
    name?: string | null;
    image?: string | null;
    role: string;
    tier: string;
    walletAddress?: string;
  }
}