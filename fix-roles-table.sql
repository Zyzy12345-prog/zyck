-- 修复 roles 表结构
-- 添加缺失的字段

-- 1. 添加 code 字段（如果不存在）
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'roles' AND column_name = 'code'
    ) THEN
        ALTER TABLE roles ADD COLUMN code VARCHAR(50);
        RAISE NOTICE '✅ 添加 code 字段';
    ELSE
        RAISE NOTICE 'ℹ️  code 字段已存在';
    END IF;
END $$;

-- 2. 为现有角色生成 code 值
UPDATE roles 
SET code = UPPER(REPLACE(name, ' ', '_'))
WHERE code IS NULL;

-- 3. 设置 code 字段为 NOT NULL 和 UNIQUE
ALTER TABLE roles ALTER COLUMN code SET NOT NULL;

-- 4. 添加 code 唯一索引（如果不存在）
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'roles' AND indexname = 'idx_role_code'
    ) THEN
        CREATE UNIQUE INDEX idx_role_code ON roles(code);
        RAISE NOTICE '✅ 创建 idx_role_code 索引';
    ELSE
        RAISE NOTICE 'ℹ️  idx_role_code 索引已存在';
    END IF;
END $$;

-- 5. 添加 level 字段（如果不存在）
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'roles' AND column_name = 'level'
    ) THEN
        ALTER TABLE roles ADD COLUMN level INTEGER NOT NULL DEFAULT 1;
        RAISE NOTICE '✅ 添加 level 字段';
    ELSE
        RAISE NOTICE 'ℹ️  level 字段已存在';
    END IF;
END $$;

-- 6. 添加 is_active 字段（如果不存在）
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'roles' AND column_name = 'is_active'
    ) THEN
        ALTER TABLE roles ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;
        RAISE NOTICE '✅ 添加 is_active 字段';
    ELSE
        RAISE NOTICE 'ℹ️  is_active 字段已存在';
    END IF;
END $$;

-- 7. 添加 is_system 字段（如果不存在）
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'roles' AND column_name = 'is_system'
    ) THEN
        ALTER TABLE roles ADD COLUMN is_system BOOLEAN NOT NULL DEFAULT false;
        RAISE NOTICE '✅ 添加 is_system 字段';
    ELSE
        RAISE NOTICE 'ℹ️  is_system 字段已存在';
    END IF;
END $$;

-- 8. 创建其他索引
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'roles' AND indexname = 'idx_role_active'
    ) THEN
        CREATE INDEX idx_role_active ON roles(is_active);
        RAISE NOTICE '✅ 创建 idx_role_active 索引';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'roles' AND indexname = 'idx_role_level'
    ) THEN
        CREATE INDEX idx_role_level ON roles(level);
        RAISE NOTICE '✅ 创建 idx_role_level 索引';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'roles' AND indexname = 'idx_role_system'
    ) THEN
        CREATE INDEX idx_role_system ON roles(is_system);
        RAISE NOTICE '✅ 创建 idx_role_system 索引';
    END IF;
END $$;

-- 9. 显示最终的表结构
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'roles' 
ORDER BY ordinal_position;

RAISE NOTICE '✅ roles 表结构修复完成！';




