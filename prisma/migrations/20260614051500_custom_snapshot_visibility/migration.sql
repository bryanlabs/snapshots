-- Add durable ownership and community visibility fields for custom snapshots.
ALTER TABLE "snapshot_requests"
  ADD COLUMN "processor_request_id" TEXT,
  ADD COLUMN "database_backend" TEXT NOT NULL DEFAULT 'goleveldb',
  ADD COLUMN "request_note" TEXT,
  ADD COLUMN "visibility" TEXT NOT NULL DEFAULT 'private',
  ADD COLUMN "publish_status" TEXT NOT NULL DEFAULT 'private',
  ADD COLUMN "is_pinned" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "is_featured" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "deleted_at" TIMESTAMP(3),
  ADD COLUMN "admin_note" TEXT,
  ADD COLUMN "result_storage_chain_id" TEXT,
  ADD COLUMN "result_file_name" TEXT,
  ADD COLUMN "result_file_size_bytes" BIGINT,
  ADD COLUMN "result_height" BIGINT,
  ADD COLUMN "result_metadata" JSONB,
  ADD COLUMN "verified_at" TIMESTAMP(3),
  ADD COLUMN "restore_verified_at" TIMESTAMP(3);

CREATE UNIQUE INDEX "snapshot_requests_processor_request_id_key"
  ON "snapshot_requests"("processor_request_id");

CREATE INDEX "snapshot_requests_chain_id_block_height_compression_type_idx"
  ON "snapshot_requests"("chain_id", "block_height", "compression_type");

CREATE INDEX "snapshot_requests_visibility_publish_status_idx"
  ON "snapshot_requests"("visibility", "publish_status");
