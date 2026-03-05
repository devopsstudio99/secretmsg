-- SQLite Schema for Secret Message App

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    path TEXT NOT NULL UNIQUE,
    content TEXT NOT NULL CHECK (length(content) <= 10000),
    password_hash TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    expires_at TEXT
);

-- Index for fast path lookups
CREATE INDEX IF NOT EXISTS idx_messages_path ON messages(path);

-- Index for cleanup of expired messages
CREATE INDEX IF NOT EXISTS idx_messages_expires_at ON messages(expires_at) WHERE expires_at IS NOT NULL;
