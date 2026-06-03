-- Extend call_records table for multi-channel communication
ALTER TABLE call_records ADD COLUMN IF NOT EXISTS communication_channel VARCHAR(20) DEFAULT 'phone';
ALTER TABLE call_records ADD COLUMN IF NOT EXISTS original_content TEXT;
ALTER TABLE call_records ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Add check constraint for communication_channel
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'call_records_communication_channel_check'
    ) THEN
        ALTER TABLE call_records ADD CONSTRAINT call_records_communication_channel_check 
        CHECK (communication_channel IN ('phone', 'sms', 'email', 'wechat', 'chat', 'other'));
    END IF;
END $$;

-- Create file_uploads table for managing uploaded files
CREATE TABLE IF NOT EXISTS file_uploads (
  id SERIAL PRIMARY KEY,
  file_name VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_url VARCHAR(500),
  file_type VARCHAR(50) NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type VARCHAR(100),
  category VARCHAR(50) DEFAULT 'other' CHECK (category IN ('recording', 'screenshot', 'document', 'image', 'video', 'other')),
  related_type VARCHAR(50) CHECK (related_type IN ('call_record', 'client', 'lead', 'task', 'other')),
  related_id INTEGER,
  uploaded_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_file_uploads_related ON file_uploads(related_type, related_id);
CREATE INDEX IF NOT EXISTS idx_file_uploads_category ON file_uploads(category);
CREATE INDEX IF NOT EXISTS idx_file_uploads_uploaded_by ON file_uploads(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_call_records_communication_channel ON call_records(communication_channel);

-- Create trigger for file_uploads
CREATE OR REPLACE FUNCTION update_file_uploads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_file_uploads_updated_at ON file_uploads;
CREATE TRIGGER trigger_update_file_uploads_updated_at
    BEFORE UPDATE ON file_uploads
    FOR EACH ROW
    EXECUTE FUNCTION update_file_uploads_updated_at();

COMMENT ON TABLE file_uploads IS 'File uploads management table';
COMMENT ON COLUMN call_records.communication_channel IS 'Communication channel: phone, sms, email, wechat, chat, other';
COMMENT ON COLUMN call_records.original_content IS 'Original content for SMS, email, chat messages';
COMMENT ON COLUMN call_records.metadata IS 'Additional metadata in JSON format';








