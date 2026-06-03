-- Create lead follow-ups table
CREATE TABLE IF NOT EXISTS lead_follow_ups (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER NOT NULL REFERENCES customer_leads(id) ON DELETE CASCADE,
  follow_up_type VARCHAR(20) NOT NULL DEFAULT 'phone' CHECK (follow_up_type IN ('phone', 'email', 'visit', 'wechat', 'other')),
  follow_up_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  content TEXT NOT NULL,
  result VARCHAR(20) CHECK (result IN ('positive', 'neutral', 'negative', 'no_response')),
  next_follow_up_date TIMESTAMP,
  next_follow_up_plan TEXT,
  duration INTEGER,
  attachments JSONB,
  tags TEXT[],
  is_important BOOLEAN NOT NULL DEFAULT FALSE,
  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_lead_follow_ups_lead_id ON lead_follow_ups(lead_id);
CREATE INDEX idx_lead_follow_ups_follow_up_date ON lead_follow_ups(follow_up_date);
CREATE INDEX idx_lead_follow_ups_next_follow_up_date ON lead_follow_ups(next_follow_up_date);
CREATE INDEX idx_lead_follow_ups_created_by ON lead_follow_ups(created_by);
CREATE INDEX idx_lead_follow_ups_result ON lead_follow_ups(result);
CREATE INDEX idx_lead_follow_ups_follow_up_type ON lead_follow_ups(follow_up_type);

-- Add table and column comments
COMMENT ON TABLE lead_follow_ups IS 'Lead follow-up records table';
COMMENT ON COLUMN lead_follow_ups.id IS 'Primary key';
COMMENT ON COLUMN lead_follow_ups.lead_id IS 'Lead ID';
COMMENT ON COLUMN lead_follow_ups.follow_up_type IS 'Follow-up type: phone, email, visit, wechat, other';
COMMENT ON COLUMN lead_follow_ups.follow_up_date IS 'Follow-up date and time';
COMMENT ON COLUMN lead_follow_ups.content IS 'Follow-up content';
COMMENT ON COLUMN lead_follow_ups.result IS 'Follow-up result: positive, neutral, negative, no_response';
COMMENT ON COLUMN lead_follow_ups.next_follow_up_date IS 'Next follow-up date';
COMMENT ON COLUMN lead_follow_ups.next_follow_up_plan IS 'Next follow-up plan';
COMMENT ON COLUMN lead_follow_ups.duration IS 'Follow-up duration in minutes';
COMMENT ON COLUMN lead_follow_ups.attachments IS 'Attachments list in JSON format';
COMMENT ON COLUMN lead_follow_ups.tags IS 'Tags array';
COMMENT ON COLUMN lead_follow_ups.is_important IS 'Is important flag';
COMMENT ON COLUMN lead_follow_ups.created_by IS 'Creator user ID';
COMMENT ON COLUMN lead_follow_ups.created_at IS 'Created timestamp';
COMMENT ON COLUMN lead_follow_ups.updated_at IS 'Updated timestamp';

-- Create trigger for auto-updating updated_at
CREATE OR REPLACE FUNCTION update_lead_follow_ups_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_lead_follow_ups_updated_at
  BEFORE UPDATE ON lead_follow_ups
  FOR EACH ROW
  EXECUTE FUNCTION update_lead_follow_ups_updated_at();

COMMIT;










