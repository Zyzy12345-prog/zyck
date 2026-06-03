-- Step 1: Create call_tasks table first (without foreign key to call_records)
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

-- Step 2: Now add task_id to call_records
ALTER TABLE call_records ADD COLUMN IF NOT EXISTS task_id INTEGER REFERENCES call_tasks(id) ON DELETE SET NULL;

-- Step 3: Create index for task_id
CREATE INDEX IF NOT EXISTS idx_call_records_task_id ON call_records(task_id);








