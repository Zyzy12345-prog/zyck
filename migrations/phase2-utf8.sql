-- Phase 2: Sales Funnel and Customer Grading System
-- Encoding: UTF-8

-- 1. Sales Stages Table
CREATE TABLE IF NOT EXISTS sales_stages (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    color VARCHAR(20) DEFAULT '#1890ff',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default sales stages
INSERT INTO sales_stages (name, description, sort_order, color) VALUES
('线索', '初步接触的潜在客户', 1, '#8c8c8c'),
('意向', '表达明确合作意向', 2, '#1890ff'),
('报价', '已提供报价方案', 3, '#faad14'),
('谈判', '商务谈判中', 4, '#fa8c16'),
('成交', '签约成功', 5, '#52c41a'),
('流失', '客户流失', 6, '#f5222d')
ON CONFLICT DO NOTHING;

-- 2. Sales Opportunities Table
CREATE TABLE IF NOT EXISTS sales_opportunities (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    stage_id INTEGER NOT NULL REFERENCES sales_stages(id),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    expected_amount DECIMAL(15, 2) DEFAULT 0,
    probability INTEGER DEFAULT 50,
    expected_close_date DATE,
    actual_close_date DATE,
    status VARCHAR(20) DEFAULT 'active',
    lost_reason TEXT,
    assigned_to INTEGER REFERENCES users(id),
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_probability CHECK (probability >= 0 AND probability <= 100)
);

-- 3. Opportunity Stage History Table
CREATE TABLE IF NOT EXISTS opportunity_stage_history (
    id SERIAL PRIMARY KEY,
    opportunity_id INTEGER NOT NULL REFERENCES sales_opportunities(id) ON DELETE CASCADE,
    from_stage_id INTEGER REFERENCES sales_stages(id),
    to_stage_id INTEGER NOT NULL REFERENCES sales_stages(id),
    changed_by INTEGER REFERENCES users(id),
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);

-- 4. Customer Tags Table
CREATE TABLE IF NOT EXISTS customer_tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    color VARCHAR(20) DEFAULT '#1890ff',
    icon VARCHAR(50),
    category VARCHAR(50),
    description TEXT,
    is_system BOOLEAN DEFAULT false,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default system tags
INSERT INTO customer_tags (name, color, icon, category, is_system) VALUES
('重点客户', '#f5222d', 'star', '客户价值', true),
('潜力客户', '#faad14', 'rocket', '客户价值', true),
('长期合作', '#52c41a', 'heart', '合作状态', true),
('新客户', '#1890ff', 'user-add', '客户状态', true),
('高价值', '#722ed1', 'dollar', '客户价值', true),
('需跟进', '#fa8c16', 'clock-circle', '跟进状态', true),
('已流失', '#8c8c8c', 'stop', '客户状态', true),
('VIP', '#eb2f96', 'crown', '客户等级', true)
ON CONFLICT DO NOTHING;

-- 5. Client-Tag Relations Table
CREATE TABLE IF NOT EXISTS client_tag_relations (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    tag_id INTEGER NOT NULL REFERENCES customer_tags(id) ON DELETE CASCADE,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(client_id, tag_id)
);

-- 6. Client Scores Table
CREATE TABLE IF NOT EXISTS client_scores (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    total_score INTEGER DEFAULT 0,
    follow_up_score INTEGER DEFAULT 0,
    deal_amount_score INTEGER DEFAULT 0,
    interaction_score INTEGER DEFAULT 0,
    potential_score INTEGER DEFAULT 0,
    calculated_level VARCHAR(1),
    calculation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);

-- 7. Client Value Analysis Table
CREATE TABLE IF NOT EXISTS client_value_analysis (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    total_revenue DECIMAL(15, 2) DEFAULT 0,
    total_orders INTEGER DEFAULT 0,
    avg_order_amount DECIMAL(15, 2) DEFAULT 0,
    last_order_date DATE,
    follow_up_count INTEGER DEFAULT 0,
    last_follow_up_date DATE,
    customer_lifetime_days INTEGER DEFAULT 0,
    churn_risk_score INTEGER DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Indexes
CREATE INDEX IF NOT EXISTS idx_sales_opportunities_client ON sales_opportunities(client_id);
CREATE INDEX IF NOT EXISTS idx_sales_opportunities_stage ON sales_opportunities(stage_id);
CREATE INDEX IF NOT EXISTS idx_sales_opportunities_status ON sales_opportunities(status);
CREATE INDEX IF NOT EXISTS idx_sales_opportunities_assigned ON sales_opportunities(assigned_to);
CREATE INDEX IF NOT EXISTS idx_opportunity_history_opportunity ON opportunity_stage_history(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_client_tags_category ON customer_tags(category);
CREATE INDEX IF NOT EXISTS idx_client_tag_relations_client ON client_tag_relations(client_id);
CREATE INDEX IF NOT EXISTS idx_client_tag_relations_tag ON client_tag_relations(tag_id);
CREATE INDEX IF NOT EXISTS idx_client_scores_client ON client_scores(client_id);
CREATE INDEX IF NOT EXISTS idx_client_scores_level ON client_scores(calculated_level);
CREATE INDEX IF NOT EXISTS idx_client_value_client ON client_value_analysis(client_id);

-- Success message
SELECT 'Phase 2 database migration completed successfully!' AS message;
