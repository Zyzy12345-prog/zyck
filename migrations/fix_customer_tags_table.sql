-- Fix customer_tags table - add missing sort_order column
ALTER TABLE customer_tags ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;

-- Create index if not exists
CREATE INDEX IF NOT EXISTS idx_customer_tags_sort_order ON customer_tags(sort_order);

-- Insert default tags (will skip if already exist due to UNIQUE constraint on name)
INSERT INTO customer_tags (name, color, category, is_system, sort_order) VALUES
  ('重点客户', '#f5222d', 'status', TRUE, 1),
  ('潜在客户', '#fa8c16', 'status', TRUE, 2),
  ('成交客户', '#52c41a', 'status', TRUE, 3),
  ('流失客户', '#8c8c8c', 'status', TRUE, 4),
  ('大型企业', '#1890ff', 'scale', TRUE, 5),
  ('中型企业', '#13c2c2', 'scale', TRUE, 6),
  ('小型企业', '#722ed1', 'scale', TRUE, 7),
  ('制造业', '#eb2f96', 'industry', TRUE, 8),
  ('服务业', '#faad14', 'industry', TRUE, 9),
  ('科技行业', '#52c41a', 'industry', TRUE, 10),
  ('高活跃度', '#f5222d', 'behavior', TRUE, 11),
  ('中活跃度', '#fa8c16', 'behavior', TRUE, 12),
  ('低活跃度', '#8c8c8c', 'behavior', TRUE, 13)
ON CONFLICT (name) DO NOTHING;








