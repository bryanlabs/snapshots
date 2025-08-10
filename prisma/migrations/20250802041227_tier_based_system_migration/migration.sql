/*
  Warnings:

  - You are about to drop the column `credit_balance` on the `users` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "api_usage_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "hour_bucket" DATETIME NOT NULL,
    "request_count" INTEGER NOT NULL DEFAULT 0,
    "endpoint" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "api_usage_records_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_tiers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "bandwidth_mbps" INTEGER NOT NULL,
    "burst_bandwidth_mbps" INTEGER,
    "daily_download_gb" INTEGER NOT NULL,
    "monthly_download_gb" INTEGER NOT NULL,
    "max_concurrent_downloads" INTEGER NOT NULL,
    "queue_priority" INTEGER NOT NULL DEFAULT 0,
    "api_rate_limit_hourly" INTEGER NOT NULL DEFAULT 50,
    "can_request_snapshots" BOOLEAN NOT NULL DEFAULT false,
    "can_access_api" BOOLEAN NOT NULL DEFAULT true,
    "can_create_teams" BOOLEAN NOT NULL DEFAULT false,
    "download_price_per_gb" INTEGER NOT NULL DEFAULT 0,
    "snapshot_request_price" INTEGER NOT NULL DEFAULT 0,
    "badge_color" TEXT,
    "description" TEXT,
    "features" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);
INSERT INTO "new_tiers" ("badge_color", "bandwidth_mbps", "burst_bandwidth_mbps", "can_access_api", "can_create_teams", "can_request_snapshots", "created_at", "daily_download_gb", "description", "display_name", "download_price_per_gb", "features", "id", "is_active", "max_concurrent_downloads", "monthly_download_gb", "name", "queue_priority", "snapshot_request_price", "updated_at") SELECT "badge_color", "bandwidth_mbps", "burst_bandwidth_mbps", "can_access_api", "can_create_teams", "can_request_snapshots", "created_at", "daily_download_gb", "description", "display_name", "download_price_per_gb", "features", "id", "is_active", "max_concurrent_downloads", "monthly_download_gb", "name", "queue_priority", "snapshot_request_price", "updated_at" FROM "tiers";
DROP TABLE "tiers";
ALTER TABLE "new_tiers" RENAME TO "tiers";
CREATE UNIQUE INDEX "tiers_name_key" ON "tiers"("name");
CREATE INDEX "tiers_name_idx" ON "tiers"("name");
CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT,
    "email_verified" DATETIME,
    "wallet_address" TEXT,
    "password_hash" TEXT,
    "display_name" TEXT,
    "avatar_url" TEXT,
    "role" TEXT NOT NULL DEFAULT 'user',
    "personal_tier_id" TEXT,
    "subscription_status" TEXT NOT NULL DEFAULT 'free',
    "subscription_expires_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "last_login_at" DATETIME,
    CONSTRAINT "users_personal_tier_id_fkey" FOREIGN KEY ("personal_tier_id") REFERENCES "tiers" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_users" ("avatar_url", "created_at", "display_name", "email", "email_verified", "id", "last_login_at", "password_hash", "personal_tier_id", "role", "updated_at", "wallet_address") SELECT "avatar_url", "created_at", "display_name", "email", "email_verified", "id", "last_login_at", "password_hash", "personal_tier_id", "role", "updated_at", "wallet_address" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "users_wallet_address_key" ON "users"("wallet_address");
CREATE INDEX "users_email_idx" ON "users"("email");
CREATE INDEX "users_wallet_address_idx" ON "users"("wallet_address");
CREATE INDEX "users_personal_tier_id_idx" ON "users"("personal_tier_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "api_usage_records_user_id_hour_bucket_idx" ON "api_usage_records"("user_id", "hour_bucket");

-- CreateIndex
CREATE INDEX "api_usage_records_hour_bucket_idx" ON "api_usage_records"("hour_bucket");

-- CreateIndex
CREATE UNIQUE INDEX "api_usage_records_user_id_hour_bucket_endpoint_key" ON "api_usage_records"("user_id", "hour_bucket", "endpoint");
