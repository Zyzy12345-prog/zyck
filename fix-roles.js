const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// 加载环境变量
const rootEnvPath = path.join(process.cwd(), '.env');
const serverEnvPath = path.join(process.cwd(), 'server', '.env');
dotenv.config({ path: fs.existsSync(rootEnvPath) ? rootEnvPath : serverEnvPath });

const { Sequelize } = require('sequelize');

// 创建数据库连接
const sequelize = new Sequelize(
  process.env.DB_NAME || 'tax_crm',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'postgres',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false
  }
);

async function fixRolesTable() {
  try {
    console.log('🔧 开始修复 roles 表结构...\n');

    // 1. 检查并添加 code 字段
    console.log('1️⃣  检查 code 字段...');
    const [codeExists] = await sequelize.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'roles' AND column_name = 'code'
      ) as exists;
    `);
    
    if (!codeExists[0].exists) {
      await sequelize.query('ALTER TABLE roles ADD COLUMN code VARCHAR(50);');
      console.log('   ✅ 添加 code 字段');
      
      // 为现有角色生成 code 值
      await sequelize.query(`
        UPDATE roles 
        SET code = UPPER(REPLACE(name, ' ', '_'))
        WHERE code IS NULL;
      `);
      console.log('   ✅ 为现有角色生成 code 值');
      
      // 设置为 NOT NULL
      await sequelize.query('ALTER TABLE roles ALTER COLUMN code SET NOT NULL;');
      console.log('   ✅ 设置 code 字段为 NOT NULL');
    } else {
      console.log('   ℹ️  code 字段已存在');
    }

    // 2. 创建 code 唯一索引
    console.log('\n2️⃣  检查 code 索引...');
    try {
      await sequelize.query('CREATE UNIQUE INDEX IF NOT EXISTS idx_role_code ON roles(code);');
      console.log('   ✅ 创建 idx_role_code 索引');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('   ℹ️  idx_role_code 索引已存在');
      } else {
        throw error;
      }
    }

    // 3. 添加 level 字段
    console.log('\n3️⃣  检查 level 字段...');
    const [levelExists] = await sequelize.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'roles' AND column_name = 'level'
      ) as exists;
    `);
    
    if (!levelExists[0].exists) {
      await sequelize.query('ALTER TABLE roles ADD COLUMN level INTEGER NOT NULL DEFAULT 1;');
      console.log('   ✅ 添加 level 字段');
    } else {
      console.log('   ℹ️  level 字段已存在');
    }

    // 4. 添加 is_active 字段
    console.log('\n4️⃣  检查 is_active 字段...');
    const [isActiveExists] = await sequelize.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'roles' AND column_name = 'is_active'
      ) as exists;
    `);
    
    if (!isActiveExists[0].exists) {
      await sequelize.query('ALTER TABLE roles ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;');
      console.log('   ✅ 添加 is_active 字段');
    } else {
      console.log('   ℹ️  is_active 字段已存在');
    }

    // 5. 添加 is_system 字段
    console.log('\n5️⃣  检查 is_system 字段...');
    const [isSystemExists] = await sequelize.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'roles' AND column_name = 'is_system'
      ) as exists;
    `);
    
    if (!isSystemExists[0].exists) {
      await sequelize.query('ALTER TABLE roles ADD COLUMN is_system BOOLEAN NOT NULL DEFAULT false;');
      console.log('   ✅ 添加 is_system 字段');
    } else {
      console.log('   ℹ️  is_system 字段已存在');
    }

    // 6. 创建其他索引
    console.log('\n6️⃣  创建其他索引...');
    const indexes = [
      { name: 'idx_role_active', column: 'is_active' },
      { name: 'idx_role_level', column: 'level' },
      { name: 'idx_role_system', column: 'is_system' }
    ];

    for (const index of indexes) {
      try {
        await sequelize.query(`CREATE INDEX IF NOT EXISTS ${index.name} ON roles(${index.column});`);
        console.log(`   ✅ 创建 ${index.name} 索引`);
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`   ℹ️  ${index.name} 索引已存在`);
        }
      }
    }

    // 7. 显示最终的表结构
    console.log('\n7️⃣  当前 roles 表结构：');
    const [columns] = await sequelize.query(`
      SELECT 
        column_name, 
        data_type, 
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'roles' 
      ORDER BY ordinal_position;
    `);
    
    console.table(columns);

    console.log('\n✅ roles 表结构修复完成！');
    console.log('\n现在可以运行: npm run dev');

  } catch (error) {
    console.error('\n❌ 修复失败：', error.message);
    console.error('\n完整错误：', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// 执行修复
fixRolesTable();




