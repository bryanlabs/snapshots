-- Create Tier table
CREATE TABLE IF NOT EXISTS "Tier" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "bandwidthMbps" INTEGER NOT NULL DEFAULT 50,
    "burstBandwidthMbps" INTEGER NOT NULL DEFAULT 50,
    "dailyDownloadGb" INTEGER NOT NULL DEFAULT 10,
    "monthlyDownloadGb" INTEGER NOT NULL DEFAULT 100,
    "maxConcurrentDownloads" INTEGER NOT NULL DEFAULT 1,
    "queuePriority" INTEGER NOT NULL DEFAULT 0,
    "canRequestSnapshots" BOOLEAN NOT NULL DEFAULT false,
    "canAccessApi" BOOLEAN NOT NULL DEFAULT true,
    "canCreateTeams" BOOLEAN NOT NULL DEFAULT false,
    "downloadPricePerGb" INTEGER NOT NULL DEFAULT 0,
    "snapshotRequestPrice" INTEGER NOT NULL DEFAULT 0,
    "badgeColor" TEXT,
    "description" TEXT,
    "features" TEXT
);

-- Create unique index
CREATE UNIQUE INDEX IF NOT EXISTS "Tier_name_key" ON "Tier"("name");

-- Insert default free tier
INSERT OR IGNORE INTO "Tier" (
    "id",
    "name",
    "displayName",
    "bandwidthMbps",
    "burstBandwidthMbps",
    "dailyDownloadGb",
    "monthlyDownloadGb",
    "maxConcurrentDownloads",
    "queuePriority",
    "canRequestSnapshots",
    "canAccessApi",
    "canCreateTeams",
    "downloadPricePerGb",
    "snapshotRequestPrice",
    "badgeColor",
    "description",
    "features"
) VALUES (
    'clzfree0000000tier',
    'free',
    'Free Tier',
    50,
    75,
    10,
    100,
    1,
    0,
    false,
    true,
    false,
    0,
    0,
    '#6B7280',
    'Basic access with shared bandwidth',
    '["10GB daily download limit","50 Mbps shared bandwidth","Access to public snapshots","Basic API access"]'
);

-- Create User table
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT,
    "walletAddress" TEXT,
    "passwordHash" TEXT,
    "displayName" TEXT,
    "avatarUrl" TEXT,
    "personalTierId" TEXT,
    "creditBalance" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "emailVerified" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastLoginAt" DATETIME,
    CONSTRAINT "User_personalTierId_fkey" FOREIGN KEY ("personalTierId") REFERENCES "Tier" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Create unique indexes for User
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "User_walletAddress_key" ON "User"("walletAddress");

-- Create Session table for NextAuth
CREATE TABLE IF NOT EXISTS "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" DATETIME NOT NULL,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "Session_sessionToken_key" ON "Session"("sessionToken");

-- Create Account table for NextAuth
CREATE TABLE IF NOT EXISTS "Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- Create VerificationToken table for NextAuth
CREATE TABLE IF NOT EXISTS "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" DATETIME NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "VerificationToken_token_key" ON "VerificationToken"("token");
CREATE UNIQUE INDEX IF NOT EXISTS "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");