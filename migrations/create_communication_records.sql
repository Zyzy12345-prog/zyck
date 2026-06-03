-- Drop old tables if exist
DROP TABLE IF EXISTS call_records CASCADE;
DROP TABLE IF EXISTS call_tasks CASCADE;
DROP TABLE IF EXISTS call_script_templates CASCADE;

-- Create communication records table
CREATE TABLE IF NOT EXISTS communication_records (
  id SERIAL PRIMARY KEY,
  client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
  lead_id INTEGER REFERENCES customer_leads(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Communication type: phone, sms, email, wechat
  communication_type VARCHAR(20) NOT NULL,
  
  -- Direction: outbound, inbound
  direction VARCHAR(20) DEFAULT 'outbound',
  
  -- Status: initiated, connecting, connected, completed, failed, cancelled
  status VARCHAR(20) DEFAULT 'initiated',
  
  -- Call specific fields
  phone_number VARCHAR(50),
  call_duration INTEGER DEFAULT 0, -- in seconds
  recording_url TEXT,
  
  -- SMS specific fields
  sms_content TEXT,
  sms_status VARCHAR(20), -- sent, delivered, failed
  
  -- Email specific fields
  email_subject VARCHAR(255),
  email_content TEXT,
  email_to VARCHAR(255),
  email_cc TEXT,
  email_status VARCHAR(20), -- sent, delivered, failed, bounced
  
  -- WeChat specific fields
  wechat_content TEXT,
  wechat_msg_type VARCHAR(20), -- text, image, file, voice
  
  -- Common fields
  content TEXT, -- General content/notes
  attachments JSONB DEFAULT '[]', -- Array of file URLs
  metadata JSONB DEFAULT '{}', -- Additional data
  
  -- Result and notes
  result VARCHAR(50), -- success, no_answer, busy, rejected, failed
  notes TEXT,
  
  -- Timestamps
  started_at TIMESTAMP,
  ended_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT check_client_or_lead CHECK (
    (client_id IS NOT NULL AND lead_id IS NULL) OR 
    (client_id IS NULL AND lead_id IS NOT NULL)
  )
);

-- Create indexes
CREATE INDEX idx_communication_records_client ON communication_records(client_id);
CREATE INDEX idx_communication_records_lead ON communication_records(lead_id);
CREATE INDEX idx_communication_records_user ON communication_records(user_id);
CREATE INDEX idx_communication_records_type ON communication_records(communication_type);
CREATE INDEX idx_communication_records_created ON communication_records(created_at DESC);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_communication_records_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_communication_records_updated_at
  BEFORE UPDATE ON communication_records
  FOR EACH ROW
  EXECUTE FUNCTION update_communication_records_updated_at();

-- Insert sample data for testing
INSERT INTO communication_records (
  client_id, user_id, communication_type, direction, status,
  phone_number, call_duration, result, content, started_at, ended_at
) VALUES (
  1, 1, 'phone', 'outbound', 'completed',
  '13800138000', 180, 'success', 'Discussed tax planning services', 
  CURRENT_TIMESTAMP - INTERVAL '1 hour', CURRENT_TIMESTAMP - INTERVAL '57 minutes'
);

COMMENT ON TABLE communication_records IS 'Unified communication records for phone, SMS, email, WeChat';
COMMENT ON COLUMN communication_records.communication_type IS 'Type: phone, sms, email, wechat';
COMMENT ON COLUMN communication_records.direction IS 'Direction: outbound (we initiate), inbound (customer initiates)';
COMMENT ON COLUMN communication_records.status IS 'Status: initiated, connecting, connected, completed, failed, cancelled';
COMMENT ON COLUMN communication_records.result IS 'Result: success, no_answer, busy, rejected, failed';





