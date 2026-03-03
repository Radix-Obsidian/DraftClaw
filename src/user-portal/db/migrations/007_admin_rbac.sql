-- Migration: 007_admin_rbac
-- Add proper is_admin boolean column for RBAC

ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin) WHERE is_admin = true;
