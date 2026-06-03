-- Phase 2: Insert Chinese data
-- Run this AFTER phase2-tables-only.sql

-- Insert default sales stages
INSERT INTO sales_stages (name, description, sort_order, color) 
SELECT * FROM (VALUES
    ('线索', '初步接触的潜在客户', 1, '#8c8c8c'),
    ('意向', '表达明确合作意向', 2, '#1890ff'),
    ('报价', '已提供报价方案', 3, '#faad14'),
    ('谈判', '商务谈判中', 4, '#fa8c16'),
    ('成交', '签约成功', 5, '#52c41a'),
    ('流失', '客户流失', 6, '#f5222d')
) AS v(name, description, sort_order, color)
WHERE NOT EXISTS (SELECT 1 FROM sales_stages WHERE sales_stages.name = v.name);

-- Insert default system tags
INSERT INTO customer_tags (name, color, icon, category, is_system)
SELECT * FROM (VALUES
    ('重点客户', '#f5222d', 'star', '客户价值', true),
    ('潜力客户', '#faad14', 'rocket', '客户价值', true),
    ('长期合作', '#52c41a', 'heart', '合作状态', true),
    ('新客户', '#1890ff', 'user-add', '客户状态', true),
    ('高价值', '#722ed1', 'dollar', '客户价值', true),
    ('需跟进', '#fa8c16', 'clock-circle', '跟进状态', true),
    ('已流失', '#8c8c8c', 'stop', '客户状态', true),
    ('VIP', '#eb2f96', 'crown', '客户等级', true)
) AS v(name, color, icon, category, is_system)
WHERE NOT EXISTS (SELECT 1 FROM customer_tags WHERE customer_tags.name = v.name);

SELECT 'Phase 2 data inserted successfully!' AS message;












