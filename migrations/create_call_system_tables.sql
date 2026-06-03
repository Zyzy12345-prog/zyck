-- Call Records Table (外呼记录表)
CREATE TABLE IF NOT EXISTS call_records (
  id SERIAL PRIMARY KEY,
  
  -- 关联信息
  client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
  lead_id INTEGER REFERENCES customer_leads(id) ON DELETE SET NULL,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_id INTEGER REFERENCES call_tasks(id) ON DELETE SET NULL,
  
  -- 外呼基本信息
  call_type VARCHAR(20) NOT NULL DEFAULT 'outbound' CHECK (call_type IN ('outbound', 'inbound', 'callback')),
  phone_number VARCHAR(20) NOT NULL,
  contact_person VARCHAR(100),
  
  -- 外呼状态和结果
  call_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (call_status IN ('pending', 'connected', 'no_answer', 'busy', 'rejected', 'failed', 'voicemail')),
  call_result VARCHAR(20) CHECK (call_result IN ('success', 'follow_up_needed', 'not_interested', 'wrong_number', 'callback_requested', 'other')),
  
  -- 时间信息
  call_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  duration INTEGER DEFAULT 0, -- 通话时长（秒）
  
  -- 内容信息
  subject VARCHAR(200),
  content TEXT,
  notes TEXT,
  next_action TEXT,
  next_call_date TIMESTAMP,
  
  -- 质量评分
  quality_score INTEGER CHECK (quality_score >= 0 AND quality_score <= 100),
  customer_satisfaction VARCHAR(20) CHECK (customer_satisfaction IN ('very_satisfied', 'satisfied', 'neutral', 'dissatisfied', 'very_dissatisfied')),
  
  -- 附加信息
  tags TEXT[],
  attachments JSONB,
  recording_url VARCHAR(500),
  is_important BOOLEAN DEFAULT FALSE,
  is_flagged BOOLEAN DEFAULT FALSE,
  
  -- 时间戳
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Call Tasks Table (外呼任务表)
CREATE TABLE IF NOT EXISTS call_tasks (
  id SERIAL PRIMARY KEY,
  
  -- 任务基本信息
  title VARCHAR(200) NOT NULL,
  description TEXT,
  task_type VARCHAR(20) NOT NULL DEFAULT 'single' CHECK (task_type IN ('single', 'batch', 'campaign')),
  
  -- 关联信息
  assigned_to INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
  lead_id INTEGER REFERENCES customer_leads(id) ON DELETE SET NULL,
  
  -- 任务状态
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled', 'overdue')),
  priority VARCHAR(20) NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  
  -- 时间信息
  scheduled_time TIMESTAMP,
  due_date TIMESTAMP,
  completed_at TIMESTAMP,
  
  -- 任务配置
  max_attempts INTEGER DEFAULT 3,
  current_attempts INTEGER DEFAULT 0,
  auto_assign BOOLEAN DEFAULT FALSE,
  
  -- 脚本和模板
  script_template_id INTEGER,
  call_script TEXT,
  
  -- 统计信息
  total_calls INTEGER DEFAULT 0,
  successful_calls INTEGER DEFAULT 0,
  
  -- 时间戳
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Call Script Templates Table (外呼脚本模板表)
CREATE TABLE IF NOT EXISTS call_script_templates (
  id SERIAL PRIMARY KEY,
  
  -- 模板信息
  name VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(50),
  
  -- 脚本内容
  opening TEXT NOT NULL,
  main_content TEXT NOT NULL,
  objection_handling TEXT,
  closing TEXT NOT NULL,
  
  -- 使用信息
  is_active BOOLEAN DEFAULT TRUE,
  usage_count INTEGER DEFAULT 0,
  
  -- 创建信息
  created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- 时间戳
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for call_records
CREATE INDEX IF NOT EXISTS idx_call_records_client_id ON call_records(client_id);
CREATE INDEX IF NOT EXISTS idx_call_records_lead_id ON call_records(lead_id);
CREATE INDEX IF NOT EXISTS idx_call_records_user_id ON call_records(user_id);
CREATE INDEX IF NOT EXISTS idx_call_records_task_id ON call_records(task_id);
CREATE INDEX IF NOT EXISTS idx_call_records_call_time ON call_records(call_time);
CREATE INDEX IF NOT EXISTS idx_call_records_call_status ON call_records(call_status);
CREATE INDEX IF NOT EXISTS idx_call_records_call_result ON call_records(call_result);

-- Indexes for call_tasks
CREATE INDEX IF NOT EXISTS idx_call_tasks_assigned_to ON call_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_call_tasks_created_by ON call_tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_call_tasks_status ON call_tasks(status);
CREATE INDEX IF NOT EXISTS idx_call_tasks_priority ON call_tasks(priority);
CREATE INDEX IF NOT EXISTS idx_call_tasks_scheduled_time ON call_tasks(scheduled_time);
CREATE INDEX IF NOT EXISTS idx_call_tasks_due_date ON call_tasks(due_date);

-- Indexes for call_script_templates
CREATE INDEX IF NOT EXISTS idx_call_script_templates_category ON call_script_templates(category);
CREATE INDEX IF NOT EXISTS idx_call_script_templates_is_active ON call_script_templates(is_active);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_call_records_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_call_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_call_script_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_call_records_updated_at ON call_records;
CREATE TRIGGER trigger_update_call_records_updated_at
    BEFORE UPDATE ON call_records
    FOR EACH ROW
    EXECUTE FUNCTION update_call_records_updated_at();

DROP TRIGGER IF EXISTS trigger_update_call_tasks_updated_at ON call_tasks;
CREATE TRIGGER trigger_update_call_tasks_updated_at
    BEFORE UPDATE ON call_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_call_tasks_updated_at();

DROP TRIGGER IF EXISTS trigger_update_call_script_templates_updated_at ON call_script_templates;
CREATE TRIGGER trigger_update_call_script_templates_updated_at
    BEFORE UPDATE ON call_script_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_call_script_templates_updated_at();

-- Comments
COMMENT ON TABLE call_records IS '外呼记录表';
COMMENT ON TABLE call_tasks IS '外呼任务表';
COMMENT ON TABLE call_script_templates IS '外呼脚本模板表';








