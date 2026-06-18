-- Durable audit stream for signed URL issuance and nginx transfer callbacks.
-- This intentionally does not reference "snapshots" because the live public
-- catalog is discovered from nginx-hosted artifacts.
CREATE TABLE "download_events" (
    "id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "result" TEXT NOT NULL DEFAULT 'unknown',
    "chain_id" TEXT NOT NULL,
    "storage_chain_id" TEXT,
    "snapshot_id" TEXT NOT NULL,
    "file_name" TEXT,
    "database_backend" TEXT,
    "visibility" TEXT,
    "snapshot_height" BIGINT,
    "file_size_bytes" BIGINT,
    "user_id" TEXT,
    "tier" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "referer" TEXT,
    "request_path" TEXT,
    "request_method" TEXT,
    "range_header" TEXT,
    "http_status" INTEGER,
    "response_time_ms" INTEGER,
    "bytes_transferred" BIGINT,
    "transfer_status" TEXT,
    "download_token_hash" TEXT,
    "signed_url_expires_at" TIMESTAMP(3),
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "download_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "download_events_created_at_idx" ON "download_events"("created_at");
CREATE INDEX "download_events_chain_id_created_at_idx" ON "download_events"("chain_id", "created_at");
CREATE INDEX "download_events_snapshot_id_created_at_idx" ON "download_events"("snapshot_id", "created_at");
CREATE INDEX "download_events_user_id_created_at_idx" ON "download_events"("user_id", "created_at");
CREATE INDEX "download_events_event_type_result_created_at_idx" ON "download_events"("event_type", "result", "created_at");

ALTER TABLE "download_events"
  ADD CONSTRAINT "download_events_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
