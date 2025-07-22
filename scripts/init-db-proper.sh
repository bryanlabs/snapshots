#!/bin/sh

echo "Initializing database with Prisma schema..."

# Remove old database
rm -f /app/prisma/dev.db

# Create new database with correct schema
sqlite3 /app/prisma/dev.db <<'EOF'
-- Users table with correct column names
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE,
    email_verified DATETIME,
    wallet_address TEXT UNIQUE,
    password_hash TEXT,
    display_name TEXT,
    avatar_url TEXT,
    personal_tier_id TEXT,
    credit_balance INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login_at DATETIME
);

-- Tiers table
CREATE TABLE tiers (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    bandwidth_mbps INTEGER NOT NULL DEFAULT 50,
    burst_bandwidth_mbps INTEGER NOT NULL DEFAULT 50,
    daily_download_gb INTEGER NOT NULL DEFAULT 10,
    monthly_download_gb INTEGER NOT NULL DEFAULT 100,
    max_concurrent_downloads INTEGER NOT NULL DEFAULT 1,
    queue_priority INTEGER NOT NULL DEFAULT 0,
    can_request_snapshots BOOLEAN NOT NULL DEFAULT false,
    can_access_api BOOLEAN NOT NULL DEFAULT true,
    can_create_teams BOOLEAN NOT NULL DEFAULT false,
    download_price_per_gb INTEGER NOT NULL DEFAULT 0,
    snapshot_request_price INTEGER NOT NULL DEFAULT 0,
    badge_color TEXT,
    description TEXT,
    features TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- NextAuth tables
CREATE TABLE accounts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL,
    provider TEXT NOT NULL,
    provider_account_id TEXT NOT NULL,
    refresh_token TEXT,
    access_token TEXT,
    expires_at INTEGER,
    token_type TEXT,
    scope TEXT,
    id_token TEXT,
    session_state TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE sessions (
    id TEXT PRIMARY KEY,
    session_token TEXT UNIQUE NOT NULL,
    user_id TEXT NOT NULL,
    expires DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Insert default tiers
INSERT INTO tiers (id, name, display_name, bandwidth_mbps, burst_bandwidth_mbps, daily_download_gb, monthly_download_gb, max_concurrent_downloads, queue_priority) 
VALUES 
  ('free-tier-id', 'free', 'Free Tier', 50, 50, 10, 100, 1, 0),
  ('premium-tier-id', 'premium', 'Premium Tier', 250, 250, 100, 1000, 5, 10);

-- Teams table
CREATE TABLE teams (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    tier_id TEXT NOT NULL,
    credit_balance INTEGER NOT NULL DEFAULT 0,
    daily_download_gb INTEGER,
    monthly_download_gb INTEGER,
    max_concurrent_downloads INTEGER,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- TeamMembers table
CREATE TABLE team_members (
    id TEXT PRIMARY KEY,
    team_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'member',
    daily_download_gb INTEGER,
    joined_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    invited_by TEXT,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(team_id, user_id)
);

-- Downloads table (minimal)
CREATE TABLE downloads (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    team_id TEXT,
    snapshot_id TEXT NOT NULL,
    file_size_bytes INTEGER NOT NULL,
    bytes_transferred INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending',
    queue_position INTEGER,
    download_token TEXT UNIQUE,
    allocated_bandwidth_mbps INTEGER,
    actual_bandwidth_mbps REAL,
    credits_cost INTEGER NOT NULL DEFAULT 0,
    ip_address TEXT,
    user_agent TEXT,
    region TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    queued_at DATETIME,
    started_at DATETIME,
    completed_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Snapshots table (minimal)
CREATE TABLE snapshots (
    id TEXT PRIMARY KEY,
    chain_id TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size_bytes INTEGER NOT NULL,
    block_height INTEGER NOT NULL,
    pruning_mode TEXT NOT NULL,
    compression_type TEXT NOT NULL,
    is_public BOOLEAN NOT NULL DEFAULT true,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by TEXT,
    request_id TEXT,
    regions TEXT DEFAULT 'us-east',
    snapshot_taken_at DATETIME NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME,
    UNIQUE(chain_id, file_name)
);

-- Insert test users with password hash for 'snapshot123'
INSERT INTO users (id, email, password_hash, display_name, personal_tier_id, is_active) 
VALUES 
  ('test-user-123', 'test@example.com', '$2a$10$LRtBX3YR6TqFRNss/Ji33OFGsAG.WZS3zJxHzQDsinscMJYbBTC5e', 'Test User', 'free-tier-id', true),
  ('premium-user-123', 'premium@example.com', '$2a$10$LRtBX3YR6TqFRNss/Ji33OFGsAG.WZS3zJxHzQDsinscMJYbBTC5e', 'Premium User', 'premium-tier-id', true);

EOF

echo "Database initialized successfully"

# Start the application
exec node server.js