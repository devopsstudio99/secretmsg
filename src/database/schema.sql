-- Secret Message App Database Schema

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    path VARCHAR(255) NOT NULL UNIQUE,
    content TEXT NOT NULL CHECK (char_length(content) <= 10000),
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Index for fast path lookups
CREATE INDEX IF NOT EXISTS idx_messages_path ON messages(path);

-- Index for cleanup of expired messages
CREATE INDEX IF NOT EXISTS idx_messages_expires_at ON messages(expires_at) WHERE expires_at IS NOT NULL;

-- Comments
COMMENT ON TABLE messages IS 'Stores password-protected secret messages';
COMMENT ON COLUMN messages.id IS 'Primary key (UUID)';
COMMENT ON COLUMN messages.path IS 'Unique random URL path';
COMMENT ON COLUMN messages.content IS 'Secret message content (max 10000 chars)';
COMMENT ON COLUMN messages.password_hash IS 'Bcrypt hashed password';
COMMENT ON COLUMN messages.created_at IS 'Message creation timestamp';
COMMENT ON COLUMN messages.expires_at IS 'Optional expiration timestamp';
