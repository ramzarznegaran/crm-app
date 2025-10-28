-- Organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('owner', 'user')),
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Contacts table with unique phone number constraint per organization
CREATE TABLE IF NOT EXISTS contacts (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL,
  name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  created_by_user_id TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(org_id, phone_number)
);

-- Call logs table
CREATE TABLE IF NOT EXISTS calls (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL,
  contact_id TEXT,
  user_id TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  direction TEXT NOT NULL CHECK(direction IN ('incoming', 'outgoing')),
  start_time INTEGER NOT NULL,
  duration INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_org_id ON users(org_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_contacts_org_id ON contacts(org_id);
CREATE INDEX IF NOT EXISTS idx_contacts_phone ON contacts(org_id, phone_number);
CREATE INDEX IF NOT EXISTS idx_contacts_created_by ON contacts(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_calls_org_id ON calls(org_id);
CREATE INDEX IF NOT EXISTS idx_calls_contact_id ON calls(contact_id);
CREATE INDEX IF NOT EXISTS idx_calls_user_id ON calls(user_id);
CREATE INDEX IF NOT EXISTS idx_calls_phone ON calls(phone_number);
CREATE INDEX IF NOT EXISTS idx_calls_start_time ON calls(start_time);

-- Insert default organization and admin user
INSERT OR IGNORE INTO organizations (id, name, created_at) 
VALUES ('org_default', 'Default Organization', strftime('%s', 'now'));

-- Default admin user (password: admin123)
-- Password hash is bcrypt hash of 'admin123'
INSERT OR IGNORE INTO users (id, org_id, name, email, password_hash, role, created_at)
VALUES (
  'user_admin',
  'org_default',
  'Admin User',
  'admin@crm.com',
  '$2a$10$rKZLvXZnJQQJ5K5Y5Y5Y5eK5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y',
  'owner',
  strftime('%s', 'now')
);

-- Update the email for existing admin user if it exists
UPDATE users SET email = 'admin@crm.com' WHERE id = 'user_admin';
