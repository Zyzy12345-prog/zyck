-- 验证数据库迁移是否成功
-- 在 pgAdmin 或 psql 中执行此查询

-- 1. 检查客户表新增字段
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'clients' 
AND column_name IN ('address', 'website', 'company_scale', 'customer_level', 'employee_count')
ORDER BY column_name;

-- 2. 检查新建的表
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
AND table_name IN ('follow_ups', 'follow_up_comments', 'customer_files', 'customer_discussions', 'follow_up_reminders')
ORDER BY table_name;

-- 3. 检查 follow_ups 表结构
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'follow_ups'
ORDER BY ordinal_position;

-- 4. 检查索引
SELECT indexname 
FROM pg_indexes 
WHERE tablename IN ('follow_ups', 'follow_up_comments', 'customer_files', 'follow_up_reminders')
ORDER BY tablename, indexname;
