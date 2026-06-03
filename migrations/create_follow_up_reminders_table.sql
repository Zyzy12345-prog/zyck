-- Follow-up Reminders Table
CREATE TABLE IF NOT EXISTS follow_up_reminders (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER NOT NULL REFERENCES customer_leads(id) ON DELETE CASCADE,
  follow_up_id INTEGER REFERENCES lead_followups(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reminder_time TIMESTAMP NOT NULL,
  reminder_type VARCHAR(20) NOT NULL DEFAULT 'scheduled' CHECK (reminder_type IN ('scheduled', 'overdue', 'urgent')),
  title VARCHAR(200) NOT NULL,
  content TEXT,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMP,
  priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_follow_up_reminders_lead_id ON follow_up_reminders(lead_id);
CREATE INDEX IF NOT EXISTS idx_follow_up_reminders_user_id ON follow_up_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_follow_up_reminders_reminder_time ON follow_up_reminders(reminder_time);
CREATE INDEX IF NOT EXISTS idx_follow_up_reminders_is_completed ON follow_up_reminders(is_completed);
CREATE INDEX IF NOT EXISTS idx_follow_up_reminders_is_read ON follow_up_reminders(is_read);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_follow_up_reminders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_follow_up_reminders_updated_at ON follow_up_reminders;
CREATE TRIGGER trigger_update_follow_up_reminders_updated_at
    BEFORE UPDATE ON follow_up_reminders
    FOR EACH ROW
    EXECUTE FUNCTION update_follow_up_reminders_updated_at();

COMMENT ON TABLE follow_up_reminders IS 'Follow-up reminders table';
COMMENT ON COLUMN follow_up_reminders.reminder_type IS 'Reminder type: scheduled, overdue, urgent';
COMMENT ON COLUMN follow_up_reminders.priority IS 'Priority: low, normal, high, urgent';








