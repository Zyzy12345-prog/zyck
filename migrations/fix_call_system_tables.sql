-- Fix call_records table - add missing columns
ALTER TABLE call_records ADD COLUMN IF NOT EXISTS lead_id INTEGER REFERENCES customer_leads(id) ON DELETE SET NULL;
ALTER TABLE call_records ADD COLUMN IF NOT EXISTS task_id INTEGER REFERENCES call_tasks(id) ON DELETE SET NULL;
ALTER TABLE call_records ADD COLUMN IF NOT EXISTS call_status VARCHAR(20) NOT NULL DEFAULT 'pending';
ALTER TABLE call_records ADD COLUMN IF NOT EXISTS call_result VARCHAR(20);
ALTER TABLE call_records ADD COLUMN IF NOT EXISTS call_type VARCHAR(20) NOT NULL DEFAULT 'outbound';
ALTER TABLE call_records ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);
ALTER TABLE call_records ADD COLUMN IF NOT EXISTS contact_person VARCHAR(100);
ALTER TABLE call_records ADD COLUMN IF NOT EXISTS start_time TIMESTAMP;
ALTER TABLE call_records ADD COLUMN IF NOT EXISTS end_time TIMESTAMP;
ALTER TABLE call_records ADD COLUMN IF NOT EXISTS subject VARCHAR(200);
ALTER TABLE call_records ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE call_records ADD COLUMN IF NOT EXISTS next_action TEXT;
ALTER TABLE call_records ADD COLUMN IF NOT EXISTS next_call_date TIMESTAMP;
ALTER TABLE call_records ADD COLUMN IF NOT EXISTS quality_score INTEGER;
ALTER TABLE call_records ADD COLUMN IF NOT EXISTS customer_satisfaction VARCHAR(20);
ALTER TABLE call_records ADD COLUMN IF NOT EXISTS tags TEXT[];
ALTER TABLE call_records ADD COLUMN IF NOT EXISTS attachments JSONB;
ALTER TABLE call_records ADD COLUMN IF NOT EXISTS recording_url VARCHAR(500);
ALTER TABLE call_records ADD COLUMN IF NOT EXISTS is_important BOOLEAN DEFAULT FALSE;
ALTER TABLE call_records ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN DEFAULT FALSE;

-- Create call_tasks table
CREATE TABLE IF NOT EXISTS call_tasks (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  task_type VARCHAR(20) NOT NULL DEFAULT 'single',
  assigned_to INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
  lead_id INTEGER REFERENCES customer_leads(id) ON DELETE SET NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  priority VARCHAR(20) NOT NULL DEFAULT 'normal',
  scheduled_time TIMESTAMP,
  due_date TIMESTAMP,
  completed_at TIMESTAMP,
  max_attempts INTEGER DEFAULT 3,
  current_attempts INTEGER DEFAULT 0,
  auto_assign BOOLEAN DEFAULT FALSE,
  script_template_id INTEGER,
  call_script TEXT,
  total_calls INTEGER DEFAULT 0,
  successful_calls INTEGER DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create call_script_templates table
CREATE TABLE IF NOT EXISTS call_script_templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(50),
  opening TEXT NOT NULL,
  main_content TEXT NOT NULL,
  objection_handling TEXT,
  closing TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  usage_count INTEGER DEFAULT 0,
  created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_call_records_lead_id ON call_records(lead_id);
CREATE INDEX IF NOT EXISTS idx_call_records_task_id ON call_records(task_id);
CREATE INDEX IF NOT EXISTS idx_call_records_call_status ON call_records(call_status);
CREATE INDEX IF NOT EXISTS idx_call_records_call_result ON call_records(call_result);

CREATE INDEX IF NOT EXISTS idx_call_tasks_assigned_to ON call_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_call_tasks_created_by ON call_tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_call_tasks_status ON call_tasks(status);
CREATE INDEX IF NOT EXISTS idx_call_tasks_priority ON call_tasks(priority);
CREATE INDEX IF NOT EXISTS idx_call_tasks_scheduled_time ON call_tasks(scheduled_time);
CREATE INDEX IF NOT EXISTS idx_call_tasks_due_date ON call_tasks(due_date);

CREATE INDEX IF NOT EXISTS idx_call_script_templates_category ON call_script_templates(category);
CREATE INDEX IF NOT EXISTS idx_call_script_templates_is_active ON call_script_templates(is_active);

-- Create triggers
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








