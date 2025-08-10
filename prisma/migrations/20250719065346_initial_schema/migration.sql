-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT,
    "email_verified" DATETIME,
    "wallet_address" TEXT,
    "password_hash" TEXT,
    "display_name" TEXT,
    "avatar_url" TEXT,
    "personal_tier_id" TEXT,
    "credit_balance" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "last_login_at" DATETIME,
    CONSTRAINT "users_personal_tier_id_fkey" FOREIGN KEY ("personal_tier_id") REFERENCES "tiers" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "teams" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "tier_id" TEXT NOT NULL,
    "credit_balance" INTEGER NOT NULL DEFAULT 0,
    "daily_download_gb" INTEGER,
    "monthly_download_gb" INTEGER,
    "max_concurrent_downloads" INTEGER,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "teams_tier_id_fkey" FOREIGN KEY ("tier_id") REFERENCES "tiers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "team_members" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "team_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "daily_download_gb" INTEGER,
    "joined_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "invited_by" TEXT,
    CONSTRAINT "team_members_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "team_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tiers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "bandwidth_mbps" INTEGER NOT NULL,
    "burst_bandwidth_mbps" INTEGER,
    "daily_download_gb" INTEGER NOT NULL,
    "monthly_download_gb" INTEGER NOT NULL,
    "max_concurrent_downloads" INTEGER NOT NULL,
    "queue_priority" INTEGER NOT NULL DEFAULT 0,
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

-- CreateTable
CREATE TABLE "snapshots" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "chain_id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "file_size_bytes" BIGINT NOT NULL,
    "block_height" BIGINT NOT NULL,
    "pruning_mode" TEXT NOT NULL,
    "compression_type" TEXT NOT NULL,
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT,
    "request_id" TEXT,
    "regions" TEXT NOT NULL DEFAULT 'us-east',
    "snapshot_taken_at" DATETIME NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" DATETIME
);

-- CreateTable
CREATE TABLE "snapshot_access" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "snapshot_id" TEXT NOT NULL,
    "user_id" TEXT,
    "team_id" TEXT,
    "expires_at" DATETIME,
    "max_downloads" INTEGER,
    "downloads_used" INTEGER NOT NULL DEFAULT 0,
    "granted_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "granted_by" TEXT NOT NULL,
    "reason" TEXT,
    CONSTRAINT "snapshot_access_snapshot_id_fkey" FOREIGN KEY ("snapshot_id") REFERENCES "snapshots" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "snapshot_access_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "snapshot_access_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "snapshot_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "chain_id" TEXT NOT NULL,
    "block_height" BIGINT NOT NULL,
    "pruning_mode" TEXT NOT NULL,
    "compression_type" TEXT NOT NULL,
    "scheduleType" TEXT NOT NULL DEFAULT 'once',
    "schedule_cron" TEXT,
    "next_run_at" DATETIME,
    "last_run_at" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "error_message" TEXT,
    "result_snapshot_id" TEXT,
    "credits_cost" INTEGER NOT NULL DEFAULT 0,
    "retention_days" INTEGER NOT NULL DEFAULT 30,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "completed_at" DATETIME,
    CONSTRAINT "snapshot_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "downloads" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "team_id" TEXT,
    "snapshot_id" TEXT NOT NULL,
    "file_size_bytes" BIGINT NOT NULL,
    "bytes_transferred" BIGINT NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "queue_position" INTEGER,
    "download_token" TEXT,
    "allocated_bandwidth_mbps" INTEGER,
    "actual_bandwidth_mbps" REAL,
    "credits_cost" INTEGER NOT NULL DEFAULT 0,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "region" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "queued_at" DATETIME,
    "started_at" DATETIME,
    "completed_at" DATETIME,
    CONSTRAINT "downloads_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "downloads_snapshot_id_fkey" FOREIGN KEY ("snapshot_id") REFERENCES "snapshots" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "usage_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT,
    "team_id" TEXT,
    "record_type" TEXT NOT NULL,
    "record_date" DATETIME NOT NULL,
    "download_gb" REAL NOT NULL DEFAULT 0,
    "snapshot_requests" INTEGER NOT NULL DEFAULT 0,
    "storage_gb_hours" REAL NOT NULL DEFAULT 0,
    "credits_cost" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "usage_records_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "usage_records_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "credit_transactions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT,
    "team_id" TEXT,
    "amount" INTEGER NOT NULL,
    "balance" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "reference_type" TEXT,
    "reference_id" TEXT,
    "payment_method" TEXT,
    "payment_reference" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "credit_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "credit_transactions_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "download_metrics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "hour" INTEGER NOT NULL,
    "chain_id" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "region" TEXT,
    "download_count" INTEGER NOT NULL DEFAULT 0,
    "unique_users" INTEGER NOT NULL DEFAULT 0,
    "total_bytes" BIGINT NOT NULL DEFAULT 0,
    "avg_duration_ms" INTEGER NOT NULL DEFAULT 0,
    "failure_count" INTEGER NOT NULL DEFAULT 0,
    "queued_count" INTEGER NOT NULL DEFAULT 0,
    "avg_queue_time_ms" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "system_config" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'system',
    "total_bandwidth_mbps" INTEGER NOT NULL DEFAULT 1000,
    "reserved_bandwidth_mbps" INTEGER NOT NULL DEFAULT 100,
    "used_bandwidth_mbps" INTEGER NOT NULL DEFAULT 0,
    "active_downloads" INTEGER NOT NULL DEFAULT 0,
    "queue_length" INTEGER NOT NULL DEFAULT 0,
    "maintenance_mode" BOOLEAN NOT NULL DEFAULT false,
    "queue_enabled" BOOLEAN NOT NULL DEFAULT true,
    "signups_enabled" BOOLEAN NOT NULL DEFAULT true,
    "default_tier_id" TEXT NOT NULL DEFAULT 'free',
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_account_id" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "session_token" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires" DATETIME NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_wallet_address_key" ON "users"("wallet_address");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_wallet_address_idx" ON "users"("wallet_address");

-- CreateIndex
CREATE INDEX "users_personal_tier_id_idx" ON "users"("personal_tier_id");

-- CreateIndex
CREATE UNIQUE INDEX "teams_slug_key" ON "teams"("slug");

-- CreateIndex
CREATE INDEX "teams_slug_idx" ON "teams"("slug");

-- CreateIndex
CREATE INDEX "teams_tier_id_idx" ON "teams"("tier_id");

-- CreateIndex
CREATE INDEX "team_members_user_id_idx" ON "team_members"("user_id");

-- CreateIndex
CREATE INDEX "team_members_team_id_role_idx" ON "team_members"("team_id", "role");

-- CreateIndex
CREATE UNIQUE INDEX "team_members_team_id_user_id_key" ON "team_members"("team_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "tiers_name_key" ON "tiers"("name");

-- CreateIndex
CREATE INDEX "tiers_name_idx" ON "tiers"("name");

-- CreateIndex
CREATE INDEX "snapshots_chain_id_is_public_is_active_idx" ON "snapshots"("chain_id", "is_public", "is_active");

-- CreateIndex
CREATE INDEX "snapshots_block_height_idx" ON "snapshots"("block_height");

-- CreateIndex
CREATE INDEX "snapshots_created_at_idx" ON "snapshots"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "snapshots_chain_id_file_name_key" ON "snapshots"("chain_id", "file_name");

-- CreateIndex
CREATE INDEX "snapshot_access_snapshot_id_user_id_idx" ON "snapshot_access"("snapshot_id", "user_id");

-- CreateIndex
CREATE INDEX "snapshot_access_snapshot_id_team_id_idx" ON "snapshot_access"("snapshot_id", "team_id");

-- CreateIndex
CREATE INDEX "snapshot_access_expires_at_idx" ON "snapshot_access"("expires_at");

-- CreateIndex
CREATE INDEX "snapshot_requests_user_id_status_idx" ON "snapshot_requests"("user_id", "status");

-- CreateIndex
CREATE INDEX "snapshot_requests_status_priority_created_at_idx" ON "snapshot_requests"("status", "priority", "created_at");

-- CreateIndex
CREATE INDEX "snapshot_requests_next_run_at_idx" ON "snapshot_requests"("next_run_at");

-- CreateIndex
CREATE UNIQUE INDEX "downloads_download_token_key" ON "downloads"("download_token");

-- CreateIndex
CREATE INDEX "downloads_user_id_status_idx" ON "downloads"("user_id", "status");

-- CreateIndex
CREATE INDEX "downloads_team_id_status_idx" ON "downloads"("team_id", "status");

-- CreateIndex
CREATE INDEX "downloads_status_queue_position_idx" ON "downloads"("status", "queue_position");

-- CreateIndex
CREATE INDEX "downloads_download_token_idx" ON "downloads"("download_token");

-- CreateIndex
CREATE INDEX "downloads_completed_at_idx" ON "downloads"("completed_at");

-- CreateIndex
CREATE INDEX "usage_records_record_date_idx" ON "usage_records"("record_date");

-- CreateIndex
CREATE UNIQUE INDEX "usage_records_user_id_record_type_record_date_key" ON "usage_records"("user_id", "record_type", "record_date");

-- CreateIndex
CREATE UNIQUE INDEX "usage_records_team_id_record_type_record_date_key" ON "usage_records"("team_id", "record_type", "record_date");

-- CreateIndex
CREATE INDEX "credit_transactions_user_id_created_at_idx" ON "credit_transactions"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "credit_transactions_team_id_created_at_idx" ON "credit_transactions"("team_id", "created_at");

-- CreateIndex
CREATE INDEX "download_metrics_date_chain_id_idx" ON "download_metrics"("date", "chain_id");

-- CreateIndex
CREATE INDEX "download_metrics_date_tier_idx" ON "download_metrics"("date", "tier");

-- CreateIndex
CREATE UNIQUE INDEX "download_metrics_date_hour_chain_id_tier_key" ON "download_metrics"("date", "hour", "chain_id", "tier");

-- CreateIndex
CREATE INDEX "accounts_user_id_idx" ON "accounts"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_provider_account_id_key" ON "accounts"("provider", "provider_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_session_token_key" ON "sessions"("session_token");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

-- CreateIndex
CREATE INDEX "sessions_expires_idx" ON "sessions"("expires");
