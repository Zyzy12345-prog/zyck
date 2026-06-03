-- Create lead tags table
CREATE TABLE IF NOT EXISTS lead_tags (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  color VARCHAR(20) DEFAULT '#1890ff',
  category VARCHAR(50),
  description TEXT,
  is_system BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create lead-tag relation table (many-to-many)
CREATE TABLE IF NOT EXISTS lead_tag_relations (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER NOT NULL REFERENCES customer_leads(id) ON DELETE CASCADE,
  tag_id INTEGER NOT NULL REFERENCES lead_tags(id) ON DELETE CASCADE,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(lead_id, tag_id)
);

-- Create indexes
CREATE INDEX idx_lead_tags_category ON lead_tags(category);
CREATE INDEX idx_lead_tags_name ON lead_tags(name);
CREATE INDEX idx_lead_tag_relations_lead_id ON lead_tag_relations(lead_id);
CREATE INDEX idx_lead_tag_relations_tag_id ON lead_tag_relations(tag_id);

-- Add comments
COMMENT ON TABLE lead_tags IS 'Lead tags table';
COMMENT ON TABLE lead_tag_relations IS 'Lead-tag relation table';

-- Create trigger for auto-updating updated_at
CREATE OR REPLACE FUNCTION update_lead_tags_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_lead_tags_updated_at
  BEFORE UPDATE ON lead_tags
  FOR EACH ROW
  EXECUTE FUNCTION update_lead_tags_updated_at();

-- Insert default system tags
INSERT INTO lead_tags (name, color, category, description, is_system, sort_order) VALUES
  ('High Intent', '#52c41a', 'intent', 'Customer shows high purchase intent', true, 1),
  ('Budget Confirmed', '#1890ff', 'budget', 'Budget has been confirmed', true, 2),
  ('Decision Maker', '#722ed1', 'role', 'Contact is the decision maker', true, 3),
  ('Competitor User', '#fa8c16', 'competition', 'Currently using competitor product', true, 4),
  ('Urgent Need', '#f5222d', 'urgency', 'Has urgent business need', true, 5),
  ('Long Term', '#13c2c2', 'timeline', 'Long-term potential customer', true, 6),
  ('Referral', '#eb2f96', 'source', 'Came from referral', true, 7),
  ('VIP', '#faad14', 'level', 'VIP customer', true, 8),
  ('Follow Up Required', '#fa541c', 'action', 'Needs immediate follow-up', true, 9),
  ('On Hold', '#8c8c8c', 'status', 'Temporarily on hold', true, 10);

COMMIT;










