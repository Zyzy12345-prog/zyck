-- Customer Detail Migration Script (UTF-8 Encoding)
-- Execute this script to create all necessary tables and fields

-- 1. Extend clients table
ALTER TABLE clients ADD COLUMN IF NOT EXISTS address VARCHAR(500);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS website VARCHAR(200);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS employee_count INTEGER;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS established_date DATE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS legal_representative VARCHAR(100);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS business_scope TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS customer_source VARCHAR(100);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS wechat VARCHAR(100);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS qq VARCHAR(20);

-- Create ENUM types
DO $$ BEGIN
  CREATE TYPE enum_clients_company_scale AS ENUM('micro', 'small', 'medium', 'large');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE enum_clients_customer_level AS ENUM('A', 'B', 'C', 'D');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

ALTER TABLE clients ADD COLUMN IF NOT EXISTS company_scale enum_clients_company_scale DEFAULT 'small';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS customer_level enum_clients_customer_level DEFAULT 'C';

-- 2. Create follow_ups table
DO $$ BEGIN
  CREATE TYPE enum_follow_ups_follow_type AS ENUM('phone', 'visit', 'email', 'wechat', 'meeting', 'other');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE enum_follow_ups_status AS ENUM('pending', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE enum_follow_ups_result AS ENUM('success', 'failed', 'pending', 'no_answer', 'next_stage', 'need_follow');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS follow_ups (
  id SERIAL PRIMARY KEY,
  client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE ON UPDATE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  follow_type enum_follow_ups_follow_type NOT NULL DEFAULT 'phone',
  follow_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  content TEXT NOT NULL,
  next_follow_time TIMESTAMP WITH TIME ZONE,
  status enum_follow_ups_status NOT NULL DEFAULT 'completed',
  result enum_follow_ups_result,
  attachments JSON,
  is_reminded BOOLEAN DEFAULT FALSE,
  reminded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create follow_up_comments table
CREATE TABLE IF NOT EXISTS follow_up_comments (
  id SERIAL PRIMARY KEY,
  follow_up_id INTEGER NOT NULL REFERENCES follow_ups(id) ON DELETE CASCADE ON UPDATE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create customer_files table
DO $$ BEGIN
  CREATE TYPE enum_customer_files_category AS ENUM('contract', 'invoice', 'certificate', 'report', 'other');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS customer_files (
  id SERIAL PRIMARY KEY,
  client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE ON UPDATE CASCADE,
  follow_up_id INTEGER REFERENCES follow_ups(id) ON DELETE SET NULL ON UPDATE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size INTEGER,
  file_type VARCHAR(50),
  category enum_customer_files_category NOT NULL DEFAULT 'other',
  description TEXT,
  uploaded_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. Create customer_discussions table
CREATE TABLE IF NOT EXISTS customer_discussions (
  id SERIAL PRIMARY KEY,
  client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE ON UPDATE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  content TEXT NOT NULL,
  parent_id INTEGER REFERENCES customer_discussions(id) ON DELETE CASCADE ON UPDATE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 6. Create follow_up_reminders table
DO $$ BEGIN
  CREATE TYPE enum_reminders_type AS ENUM('email', 'system', 'sms');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE enum_reminders_status AS ENUM('pending', 'sent', 'failed');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS follow_up_reminders (
  id SERIAL PRIMARY KEY,
  follow_up_id INTEGER NOT NULL REFERENCES follow_ups(id) ON DELETE CASCADE ON UPDATE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  reminder_type enum_reminders_type NOT NULL DEFAULT 'system',
  reminder_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status enum_reminders_status NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 7. Create indexes
CREATE INDEX IF NOT EXISTS idx_follow_ups_client_id ON follow_ups(client_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_user_id ON follow_ups(user_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_follow_time ON follow_ups(follow_time);
CREATE INDEX IF NOT EXISTS idx_follow_ups_next_follow_time ON follow_ups(next_follow_time);
CREATE INDEX IF NOT EXISTS idx_follow_ups_status ON follow_ups(status);

CREATE INDEX IF NOT EXISTS idx_follow_up_comments_follow_up_id ON follow_up_comments(follow_up_id);
CREATE INDEX IF NOT EXISTS idx_follow_up_comments_user_id ON follow_up_comments(user_id);

CREATE INDEX IF NOT EXISTS idx_customer_files_client_id ON customer_files(client_id);
CREATE INDEX IF NOT EXISTS idx_customer_files_follow_up_id ON customer_files(follow_up_id);
CREATE INDEX IF NOT EXISTS idx_customer_files_uploaded_by ON customer_files(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_customer_files_category ON customer_files(category);

CREATE INDEX IF NOT EXISTS idx_customer_discussions_client_id ON customer_discussions(client_id);
CREATE INDEX IF NOT EXISTS idx_customer_discussions_user_id ON customer_discussions(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_discussions_parent_id ON customer_discussions(parent_id);

CREATE INDEX IF NOT EXISTS idx_follow_up_reminders_follow_up_id ON follow_up_reminders(follow_up_id);
CREATE INDEX IF NOT EXISTS idx_follow_up_reminders_user_id ON follow_up_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_follow_up_reminders_reminder_time ON follow_up_reminders(reminder_time);
CREATE INDEX IF NOT EXISTS idx_follow_up_reminders_status ON follow_up_reminders(status);

-- 8. Verify tables created
SELECT 
  'Migration completed successfully!' AS message,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'address') AS clients_extended,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'follow_ups') AS follow_ups_created,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'follow_up_comments') AS comments_created,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'customer_files') AS files_created,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'customer_discussions') AS discussions_created,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'follow_up_reminders') AS reminders_created;














