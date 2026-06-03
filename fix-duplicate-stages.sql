-- 查看销售阶段数据
SELECT * FROM sales_stages ORDER BY sort_order, id;

-- 删除重复的销售阶段（保留ID较小的）
DELETE FROM sales_stages 
WHERE id NOT IN (
    SELECT MIN(id) 
    FROM sales_stages 
    GROUP BY name
);

-- 验证结果
SELECT * FROM sales_stages ORDER BY sort_order;












