-- 检查 call_records 表是否存在以及数据
SELECT 
  'call_records table check' AS check_type,
  COUNT(*) AS record_count 
FROM call_records;

-- 检查表结构
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'call_records'
ORDER BY ordinal_position;

-- 如果表不存在或为空，这是正常的
-- Dashboard 会显示空数据，不应该报500错误












