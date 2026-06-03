-- 检查客户表中是否有重复的ID
SELECT id, COUNT(*) as count
FROM clients
GROUP BY id
HAVING COUNT(*) > 1;

-- 检查客户评分表
SELECT client_id, COUNT(*) as count
FROM client_scores
GROUP BY client_id
HAVING COUNT(*) > 1;












