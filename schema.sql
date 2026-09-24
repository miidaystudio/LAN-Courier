-- LAN Courier: Zero-Cloud P2P File & Secret Sharing Ledger
-- Database Schema for Neon Serverless PostgreSQL

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_code VARCHAR(64) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_active TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rooms_room_code ON rooms(room_code);

CREATE TABLE IF NOT EXISTS transfer_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_code VARCHAR(64) NOT NULL,
    file_name TEXT NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    mime_type VARCHAR(120),
    sender_device TEXT NOT NULL,
    receiver_device TEXT NOT NULL,
    duration_ms INT NOT NULL,
    status VARCHAR(30) DEFAULT 'COMPLETED',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transfer_logs_created_at ON transfer_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transfer_logs_room_code ON transfer_logs(room_code);
