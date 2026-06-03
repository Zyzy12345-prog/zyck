-- ==========================================
-- 第二阶段：销售漏斗 + 客户分级系统
-- ==========================================

-- 1. 销售阶段表
CREATE TABLE IF NOT EXISTS sales_stages (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL COMMENT '阶段名称',
    description TEXT COMMENT '阶段描述',
    sort_order INTEGER NOT NULL DEFAULT 0 COMMENT '排序顺序',
    color VARCHAR(20) DEFAULT '#1890ff' COMMENT '显示颜色',
    is_active BOOLEAN DEFAULT true COMMENT '是否启用',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 插入默认销售阶段
INSERT INTO sales_stages (name, description, sort_order, color) VALUES
('线索', '初步接触的潜在客户', 1, '#8c8c8c'),
('意向', '表达明确合作意向', 2, '#1890ff'),
('报价', '已提供报价方案', 3, '#faad14'),
('谈判', '商务谈判中', 4, '#fa8c16'),
('成交', '签约成功', 5, '#52c41a'),
('流失', '客户流失', 6, '#f5222d')
ON CONFLICT DO NOTHING;

-- 2. 销售机会表（商机）
CREATE TABLE IF NOT EXISTS sales_opportunities (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    stage_id INTEGER NOT NULL REFERENCES sales_stages(id),
    title VARCHAR(200) NOT NULL COMMENT '商机标题',
    description TEXT COMMENT '商机描述',
    expected_amount DECIMAL(15, 2) DEFAULT 0 COMMENT '预期金额',
    probability INTEGER DEFAULT 50 COMMENT '成交概率(0-100)',
    expected_close_date DATE COMMENT '预计成交日期',
    actual_close_date DATE COMMENT '实际成交日期',
    status VARCHAR(20) DEFAULT 'active' COMMENT '状态: active, won, lost',
    lost_reason TEXT COMMENT '流失原因',
    assigned_to INTEGER REFERENCES users(id) COMMENT '负责人',
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_probability CHECK (probability >= 0 AND probability <= 100)
);

-- 3. 商机阶段变更历史表
CREATE TABLE IF NOT EXISTS opportunity_stage_history (
    id SERIAL PRIMARY KEY,
    opportunity_id INTEGER NOT NULL REFERENCES sales_opportunities(id) ON DELETE CASCADE,
    from_stage_id INTEGER REFERENCES sales_stages(id),
    to_stage_id INTEGER NOT NULL REFERENCES sales_stages(id),
    changed_by INTEGER REFERENCES users(id),
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT COMMENT '变更备注'
);

-- 4. 客户标签表
CREATE TABLE IF NOT EXISTS customer_tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE COMMENT '标签名称',
    color VARCHAR(20) DEFAULT '#1890ff' COMMENT '标签颜色',
    icon VARCHAR(50) COMMENT '图标名称',
    category VARCHAR(50) COMMENT '标签分类',
    description TEXT COMMENT '标签描述',
    is_system BOOLEAN DEFAULT false COMMENT '是否系统标签',
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 插入默认系统标签
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

-- 5. 客户-标签关联表
CREATE TABLE IF NOT EXISTS client_tag_relations (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    tag_id INTEGER NOT NULL REFERENCES customer_tags(id) ON DELETE CASCADE,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(client_id, tag_id)
);

-- 6. 客户评分记录表
CREATE TABLE IF NOT EXISTS client_scores (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    total_score INTEGER DEFAULT 0 COMMENT '总分',
    follow_up_score INTEGER DEFAULT 0 COMMENT '跟进频率得分',
    deal_amount_score INTEGER DEFAULT 0 COMMENT '交易金额得分',
    interaction_score INTEGER DEFAULT 0 COMMENT '互动质量得分',
    potential_score INTEGER DEFAULT 0 COMMENT '潜力得分',
    calculated_level VARCHAR(1) COMMENT '计算出的等级 A/B/C/D',
    calculation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '计算时间',
    notes TEXT COMMENT '评分备注'
);

-- 7. 客户价值分析表
CREATE TABLE IF NOT EXISTS client_value_analysis (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    total_revenue DECIMAL(15, 2) DEFAULT 0 COMMENT '总收入',
    total_orders INTEGER DEFAULT 0 COMMENT '订单总数',
    avg_order_amount DECIMAL(15, 2) DEFAULT 0 COMMENT '平均订单金额',
    last_order_date DATE COMMENT '最后订单日期',
    follow_up_count INTEGER DEFAULT 0 COMMENT '跟进次数',
    last_follow_up_date DATE COMMENT '最后跟进日期',
    customer_lifetime_days INTEGER DEFAULT 0 COMMENT '客户生命周期(天)',
    churn_risk_score INTEGER DEFAULT 0 COMMENT '流失风险评分(0-100)',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
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

-- 添加注释
COMMENT ON TABLE sales_stages IS '销售阶段表';
COMMENT ON TABLE sales_opportunities IS '销售机会表（商机）';
COMMENT ON TABLE opportunity_stage_history IS '商机阶段变更历史';
COMMENT ON TABLE customer_tags IS '客户标签表';
COMMENT ON TABLE client_tag_relations IS '客户-标签关联表';
COMMENT ON TABLE client_scores IS '客户评分记录表';
COMMENT ON TABLE client_value_analysis IS '客户价值分析表';

-- 完成提示
SELECT '第二阶段数据库表创建完成！' AS message;












