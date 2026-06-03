-- Fix follow_up_reminders table - add missing columns
ALTER TABLE follow_up_reminders ADD COLUMN IF NOT EXISTS lead_id INTEGER REFERENCES customer_leads(id) ON DELETE CASCADE;
ALTER TABLE follow_up_reminders ADD COLUMN IF NOT EXISTS follow_up_id INTEGER REFERENCES lead_followups(id) ON DELETE CASCADE;
ALTER TABLE follow_up_reminders ADD COLUMN IF NOT EXISTS user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE follow_up_reminders ADD COLUMN IF NOT EXISTS reminder_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE follow_up_reminders ADD COLUMN IF NOT EXISTS reminder_type VARCHAR(20) NOT NULL DEFAULT 'scheduled';
ALTER TABLE follow_up_reminders ADD COLUMN IF NOT EXISTS title VARCHAR(200) NOT NULL DEFAULT '';
ALTER TABLE follow_up_reminders ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE follow_up_reminders ADD COLUMN IF NOT EXISTS is_read BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE follow_up_reminders ADD COLUMN IF NOT EXISTS is_completed BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE follow_up_reminders ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;
ALTER TABLE follow_up_reminders ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'normal';
ALTER TABLE follow_up_reminders ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE follow_up_reminders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Add constraints if not exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'follow_up_reminders_reminder_type_check'
    ) THEN
        ALTER TABLE follow_up_reminders ADD CONSTRAINT follow_up_reminders_reminder_type_check 
        CHECK (reminder_type IN ('scheduled', 'overdue', 'urgent'));
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'follow_up_reminders_priority_check'
    ) THEN
        ALTER TABLE follow_up_reminders ADD CONSTRAINT follow_up_reminders_priority_check 
        CHECK (priority IN ('low', 'normal', 'high', 'urgent'));
    END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_follow_up_reminders_lead_id ON follow_up_reminders(lead_id);
CREATE INDEX IF NOT EXISTS idx_follow_up_reminders_user_id ON follow_up_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_follow_up_reminders_reminder_time ON follow_up_reminders(reminder_time);
CREATE INDEX IF NOT EXISTS idx_follow_up_reminders_is_completed ON follow_up_reminders(is_completed);
CREATE INDEX IF NOT EXISTS idx_follow_up_reminders_is_read ON follow_up_reminders(is_read);

-- Create trigger
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








