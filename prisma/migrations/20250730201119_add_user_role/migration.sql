-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
    "credit_balance" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "last_login_at" DATETIME,
    CONSTRAINT "users_personal_tier_id_fkey" FOREIGN KEY ("personal_tier_id") REFERENCES "tiers" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_users" ("avatar_url", "created_at", "credit_balance", "display_name", "email", "email_verified", "id", "last_login_at", "password_hash", "personal_tier_id", "updated_at", "wallet_address") SELECT "avatar_url", "created_at", "credit_balance", "display_name", "email", "email_verified", "id", "last_login_at", "password_hash", "personal_tier_id", "updated_at", "wallet_address" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "users_wallet_address_key" ON "users"("wallet_address");
CREATE INDEX "users_email_idx" ON "users"("email");
CREATE INDEX "users_wallet_address_idx" ON "users"("wallet_address");
CREATE INDEX "users_personal_tier_id_idx" ON "users"("personal_tier_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
