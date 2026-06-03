-- 客户标签表
CREATE TABLE IF NOT EXISTS customer_tags (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  color VARCHAR(20) NOT NULL DEFAULT '#1890ff',
  category VARCHAR(20) NOT NULL DEFAULT 'custom' CHECK (category IN ('industry', 'scale', 'status', 'behavior', 'custom')),
  description VARCHAR(200),
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 客户-标签关联表
CREATE TABLE IF NOT EXISTS client_tag_relations (
  id SERIAL PRIMARY KEY,
  client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  tag_id INTEGER NOT NULL REFERENCES customer_tags(id) ON DELETE CASCADE,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(client_id, tag_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_customer_tags_category ON customer_tags(category);
CREATE INDEX IF NOT EXISTS idx_customer_tags_sort_order ON customer_tags(sort_order);
CREATE INDEX IF NOT EXISTS idx_client_tag_relations_client_id ON client_tag_relations(client_id);
CREATE INDEX IF NOT EXISTS idx_client_tag_relations_tag_id ON client_tag_relations(tag_id);

-- 插入默认标签
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

COMMENT ON TABLE customer_tags IS '客户标签表';
COMMENT ON TABLE client_tag_relations IS '客户-标签关联表';








