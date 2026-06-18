ALTER TABLE "snapshot_requests"
  ADD COLUMN IF NOT EXISTS "progress_phase" TEXT,
  ADD COLUMN IF NOT EXISTS "progress_message" TEXT,
  ADD COLUMN IF NOT EXISTS "progress_percent" INTEGER,
  ADD COLUMN IF NOT EXISTS "progress_eta_seconds" INTEGER,
  ADD COLUMN IF NOT EXISTS "progress_updated_at" TIMESTAMP(3);
