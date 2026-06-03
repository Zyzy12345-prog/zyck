-- Fix customer_tags table - add missing sort_order column
ALTER TABLE customer_tags ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;

-- Create index if not exists
CREATE INDEX IF NOT EXISTS idx_customer_tags_sort_order ON customer_tags(sort_order);

-- Insert default tags (will skip if already exist due to UNIQUE constraint on name)
INSERT INTO customer_tags (name, color, category, is_system, sort_order) VALUES
  ('Key Customer', '#f5222d', 'status', TRUE, 1),
  ('Potential Customer', '#fa8c16', 'status', TRUE, 2),
  ('Closed Customer', '#52c41a', 'status', TRUE, 3),
  ('Lost Customer', '#8c8c8c', 'status', TRUE, 4),
  ('Large Enterprise', '#1890ff', 'scale', TRUE, 5),
  ('Medium Enterprise', '#13c2c2', 'scale', TRUE, 6),
  ('Small Enterprise', '#722ed1', 'scale', TRUE, 7),
  ('Manufacturing', '#eb2f96', 'industry', TRUE, 8),
  ('Service', '#faad14', 'industry', TRUE, 9),
  ('Technology', '#52c41a', 'industry', TRUE, 10),
  ('High Activity', '#f5222d', 'behavior', TRUE, 11),
  ('Medium Activity', '#fa8c16', 'behavior', TRUE, 12),
  ('Low Activity', '#8c8c8c', 'behavior', TRUE, 13)
ON CONFLICT (name) DO NOTHING;








