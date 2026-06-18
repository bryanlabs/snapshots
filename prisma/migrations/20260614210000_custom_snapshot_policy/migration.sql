-- Admin-editable custom snapshot retention/quota policy on the singleton system_config row.
ALTER TABLE "system_config"
    ADD COLUMN "custom_snapshot_retention_hours" INTEGER NOT NULL DEFAULT 24,
    ADD COLUMN "custom_snapshot_max_per_user_free" INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN "custom_snapshot_max_per_user_premium" INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN "custom_snapshot_max_per_user_ultra" INTEGER NOT NULL DEFAULT 3,
    ADD COLUMN "custom_snapshot_global_cap_gb" INTEGER NOT NULL DEFAULT 100;
