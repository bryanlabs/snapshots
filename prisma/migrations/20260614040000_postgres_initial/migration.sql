-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "email_verified" TIMESTAMP(3),
    "wallet_address" TEXT,
    "password_hash" TEXT,
    "display_name" TEXT,
    "avatar_url" TEXT,
    "role" TEXT NOT NULL DEFAULT 'user',
    "personal_tier_id" TEXT,
    "subscription_status" TEXT NOT NULL DEFAULT 'free',
    "subscription_expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_login_at" TIMESTAMP(3),
    "telegram_username" TEXT,
    "telegram_user_id" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_audit_logs" (
    "id" TEXT NOT NULL,
    "admin_user_id" TEXT,
    "target_user_id" TEXT,
    "action" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teams" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "tier_id" TEXT NOT NULL,
    "credit_balance" INTEGER NOT NULL DEFAULT 0,
    "daily_download_gb" INTEGER,
    "monthly_download_gb" INTEGER,
    "max_concurrent_downloads" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_members" (
    "id" TEXT NOT NULL,
    "team_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "daily_download_gb" INTEGER,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "invited_by" TEXT,

    CONSTRAINT "team_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tiers" (
    "id" TEXT NOT NULL,
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
    "telegram_group_access" TEXT,
    "telegram_group_name" TEXT,
    "download_price_per_gb" INTEGER NOT NULL DEFAULT 0,
    "snapshot_request_price" INTEGER NOT NULL DEFAULT 0,
    "badge_color" TEXT,
    "description" TEXT,
    "features" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "snapshots" (
    "id" TEXT NOT NULL,
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
    "snapshot_taken_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),

    CONSTRAINT "snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "snapshot_access" (
    "id" TEXT NOT NULL,
    "snapshot_id" TEXT NOT NULL,
    "user_id" TEXT,
    "team_id" TEXT,
    "expires_at" TIMESTAMP(3),
    "max_downloads" INTEGER,
    "downloads_used" INTEGER NOT NULL DEFAULT 0,
    "granted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "granted_by" TEXT NOT NULL,
    "reason" TEXT,

    CONSTRAINT "snapshot_access_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "snapshot_requests" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "chain_id" TEXT NOT NULL,
    "block_height" BIGINT NOT NULL,
    "pruning_mode" TEXT NOT NULL,
    "compression_type" TEXT NOT NULL,
    "scheduleType" TEXT NOT NULL DEFAULT 'once',
    "schedule_cron" TEXT,
    "next_run_at" TIMESTAMP(3),
    "last_run_at" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "error_message" TEXT,
    "result_snapshot_id" TEXT,
    "credits_cost" INTEGER NOT NULL DEFAULT 0,
    "retention_days" INTEGER NOT NULL DEFAULT 30,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "snapshot_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "downloads" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "team_id" TEXT,
    "snapshot_id" TEXT NOT NULL,
    "file_size_bytes" BIGINT NOT NULL,
    "bytes_transferred" BIGINT NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "queue_position" INTEGER,
    "download_token" TEXT,
    "allocated_bandwidth_mbps" INTEGER,
    "actual_bandwidth_mbps" DOUBLE PRECISION,
    "credits_cost" INTEGER NOT NULL DEFAULT 0,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "region" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "queued_at" TIMESTAMP(3),
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "downloads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usage_records" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "team_id" TEXT,
    "record_type" TEXT NOT NULL,
    "record_date" TIMESTAMP(3) NOT NULL,
    "download_gb" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "snapshot_requests" INTEGER NOT NULL DEFAULT 0,
    "storage_gb_hours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "credits_cost" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usage_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_transactions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "team_id" TEXT,
    "amount" INTEGER NOT NULL,
    "balance" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "reference_type" TEXT,
    "reference_id" TEXT,
    "payment_method" TEXT,
    "payment_reference" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "credit_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_usage_records" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "hour_bucket" TIMESTAMP(3) NOT NULL,
    "request_count" INTEGER NOT NULL DEFAULT 0,
    "endpoint" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "api_usage_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "download_metrics" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
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
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "download_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_config" (
    "id" TEXT NOT NULL DEFAULT 'system',
    "total_bandwidth_mbps" INTEGER NOT NULL DEFAULT 1000,
    "reserved_bandwidth_mbps" INTEGER NOT NULL DEFAULT 100,
    "used_bandwidth_mbps" INTEGER NOT NULL DEFAULT 0,
    "active_downloads" INTEGER NOT NULL DEFAULT 0,
    "queue_length" INTEGER NOT NULL DEFAULT 0,
    "maintenance_mode" BOOLEAN NOT NULL DEFAULT false,
    "queue_enabled" BOOLEAN NOT NULL DEFAULT true,
    "signups_enabled" BOOLEAN NOT NULL DEFAULT true,
    "default_tier_id" TEXT NOT NULL DEFAULT 'free',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
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
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "session_token" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "telegram_invitations" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "group_type" TEXT NOT NULL,
    "group_name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "invitation_method" TEXT NOT NULL DEFAULT 'link',
    "invite_token" TEXT,
    "invited_at" TIMESTAMP(3),
    "joined_at" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "telegram_chat_id" TEXT,
    "invite_link" TEXT,
    "invited_by" TEXT,
    "revoked_by" TEXT,
    "revoked_reason" TEXT,
    "email_sent" BOOLEAN NOT NULL DEFAULT false,
    "email_sent_at" TIMESTAMP(3),
    "reminders_sent" INTEGER NOT NULL DEFAULT 0,
    "last_reminder_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "telegram_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_wallet_address_key" ON "users"("wallet_address");

-- CreateIndex
CREATE UNIQUE INDEX "users_telegram_user_id_key" ON "users"("telegram_user_id");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_wallet_address_idx" ON "users"("wallet_address");

-- CreateIndex
CREATE INDEX "users_personal_tier_id_idx" ON "users"("personal_tier_id");

-- CreateIndex
CREATE INDEX "admin_audit_logs_admin_user_id_created_at_idx" ON "admin_audit_logs"("admin_user_id", "created_at");

-- CreateIndex
CREATE INDEX "admin_audit_logs_target_user_id_created_at_idx" ON "admin_audit_logs"("target_user_id", "created_at");

-- CreateIndex
CREATE INDEX "admin_audit_logs_action_created_at_idx" ON "admin_audit_logs"("action", "created_at");

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
CREATE INDEX "api_usage_records_user_id_hour_bucket_idx" ON "api_usage_records"("user_id", "hour_bucket");

-- CreateIndex
CREATE INDEX "api_usage_records_hour_bucket_idx" ON "api_usage_records"("hour_bucket");

-- CreateIndex
CREATE UNIQUE INDEX "api_usage_records_user_id_hour_bucket_endpoint_key" ON "api_usage_records"("user_id", "hour_bucket", "endpoint");

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

-- CreateIndex
CREATE UNIQUE INDEX "telegram_invitations_invite_token_key" ON "telegram_invitations"("invite_token");

-- CreateIndex
CREATE INDEX "telegram_invitations_user_id_group_type_idx" ON "telegram_invitations"("user_id", "group_type");

-- CreateIndex
CREATE INDEX "telegram_invitations_status_group_type_idx" ON "telegram_invitations"("status", "group_type");

-- CreateIndex
CREATE INDEX "telegram_invitations_invite_token_idx" ON "telegram_invitations"("invite_token");

-- CreateIndex
CREATE INDEX "telegram_invitations_expires_at_idx" ON "telegram_invitations"("expires_at");

-- CreateIndex
CREATE INDEX "telegram_invitations_created_at_idx" ON "telegram_invitations"("created_at");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_personal_tier_id_fkey" FOREIGN KEY ("personal_tier_id") REFERENCES "tiers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teams" ADD CONSTRAINT "teams_tier_id_fkey" FOREIGN KEY ("tier_id") REFERENCES "tiers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "snapshot_access" ADD CONSTRAINT "snapshot_access_snapshot_id_fkey" FOREIGN KEY ("snapshot_id") REFERENCES "snapshots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "snapshot_access" ADD CONSTRAINT "snapshot_access_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "snapshot_access" ADD CONSTRAINT "snapshot_access_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "snapshot_requests" ADD CONSTRAINT "snapshot_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "downloads" ADD CONSTRAINT "downloads_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "downloads" ADD CONSTRAINT "downloads_snapshot_id_fkey" FOREIGN KEY ("snapshot_id") REFERENCES "snapshots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage_records" ADD CONSTRAINT "usage_records_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage_records" ADD CONSTRAINT "usage_records_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_usage_records" ADD CONSTRAINT "api_usage_records_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "telegram_invitations" ADD CONSTRAINT "telegram_invitations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

