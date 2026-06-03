-- Add missing content column to call_records
ALTER TABLE call_records ADD COLUMN IF NOT EXISTS content TEXT;








