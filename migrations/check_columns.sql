-- Check if updated_at column exists in both tables
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'client_tag_relations'
ORDER BY ordinal_position;

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'customer_tags'
ORDER BY ordinal_position;








