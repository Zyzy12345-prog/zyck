-- 客户详情页数据库扩展脚本
-- 手动执行此脚本以添加新字段和表

-- 1. 扩展客户表
ALTER TABLE clients ADD COLUMN IF NOT EXISTS address VARCHAR(500);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS website VARCHAR(200);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS employee_count INTEGER;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS established_date DATE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS legal_representative VARCHAR(100);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS business_scope TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS customer_source VARCHAR(100);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS wechat VARCHAR(100);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS qq VARCHAR(20);

-- 创建 ENUM 类型
DO $$ BEGIN
  CREATE TYPE enum_clients_company_scale AS ENUM('micro', 'small', 'medium', 'large');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE enum_clients_customer_level AS ENUM('A', 'B', 'C', 'D');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 添加 ENUM 字段
ALTER TABLE clients ADD COLUMN IF NOT EXISTS company_scale enum_clients_company_scale DEFAULT 'small';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS customer_level enum_clients_customer_level DEFAULT 'C';

-- 2. 创建跟进记录表
DO $$ BEGIN
  CREATE TYPE enum_follow_ups_follow_type AS ENUM('phone', 'visit', 'email', 'wechat', 'meeting', 'other');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE enum_follow_ups_status AS ENUM('pending', 'completed', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE enum_follow_ups_result AS ENUM('success', 'failed', 'pending', 'no_answer');
EXCEPTION
  WHEN duplicate_object THEN null;
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
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. 创建客户文件表
DO $$ BEGIN
  CREATE TYPE enum_customer_files_category AS ENUM('contract', 'invoice', 'certificate', 'report', 'other');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS customer_files (
  id SERIAL PRIMARY KEY,
  client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE ON UPDATE CASCADE,
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

-- 4. 创建内部讨论表
CREATE TABLE IF NOT EXISTS customer_discussions (
  id SERIAL PRIMARY KEY,
  client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE ON UPDATE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  content TEXT NOT NULL,
  parent_id INTEGER REFERENCES customer_discussions(id) ON DELETE CASCADE ON UPDATE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. 创建索引
CREATE INDEX IF NOT EXISTS idx_follow_ups_client_id ON follow_ups(client_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_user_id ON follow_ups(user_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_follow_time ON follow_ups(follow_time);
CREATE INDEX IF NOT EXISTS idx_follow_ups_next_follow_time ON follow_ups(next_follow_time);

CREATE INDEX IF NOT EXISTS idx_customer_files_client_id ON customer_files(client_id);
CREATE INDEX IF NOT EXISTS idx_customer_files_uploaded_by ON customer_files(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_customer_files_category ON customer_files(category);

CREATE INDEX IF NOT EXISTS idx_customer_discussions_client_id ON customer_discussions(client_id);
CREATE INDEX IF NOT EXISTS idx_customer_discussions_user_id ON customer_discussions(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_discussions_parent_id ON customer_discussions(parent_id);

-- 完成
SELECT '客户详情页数据库扩展完成！' AS message;














