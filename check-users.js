/**
 * 检查 users 表状态和数据
 */

const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'tax_crm',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false
  }
);

async function checkUsers() {
  try {
    console.log('🔍 检查 users 表状态...\n');

    // 1. 检查表是否存在
    const [tables] = await sequelize.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' AND tablename = 'users'
    `);

    if (tables.length === 0) {
      console.log('❌ users 表不存在！\n');
      return;
    }

    console.log('✅ users 表存在\n');

    // 2. 检查表结构
    console.log('📋 users 表结构：');
    const [columns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `);
    
    columns.forEach(c => {
      console.log(`  - ${c.column_name.padEnd(20)} ${c.data_type.padEnd(30)} ${c.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    console.log('');

    // 3. 检查用户数据
    console.log('📊 用户数据统计：');
    const [userCount] = await sequelize.query(`
      SELECT COUNT(*) as count FROM users
    `);
    console.log(`  总用户数: ${userCount[0].count}\n`);

    // 4. 查看所有用户
    const [users] = await sequelize.query(`
      SELECT id, username, email, role, status, "createdAt"
      FROM users
      ORDER BY id
    `);

    if (users.length > 0) {
      console.log('👥 用户列表：');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      users.forEach(u => {
        console.log(`  ID: ${u.id}`);
        console.log(`  用户名: ${u.username}`);
        console.log(`  邮箱: ${u.email}`);
        console.log(`  角色: ${u.role}`);
        console.log(`  状态: ${u.status}`);
        console.log(`  创建时间: ${u.createdAt}`);
        console.log('  ─────────────────────────────────────────────────────────────');
      });
      console.log('');
    } else {
      console.log('⚠️  没有找到任何用户！\n');
      console.log('💡 需要创建测试用户吗？(Y/n)');
    }

    // 5. 检查密码字段
    console.log('🔐 检查密码加密：');
    const [passwordCheck] = await sequelize.query(`
      SELECT id, username, 
             LENGTH(password) as pwd_length,
             LEFT(password, 7) as pwd_prefix
      FROM users
      LIMIT 3
    `);

    if (passwordCheck.length > 0) {
      passwordCheck.forEach(p => {
        const isBcrypt = p.pwd_prefix === '$2a$10$' || p.pwd_prefix === '$2b$10$';
        console.log(`  用户 ${p.username}: 密码长度=${p.pwd_length}, 加密=${isBcrypt ? '✅ bcrypt' : '❌ 未加密'}`);
      });
      console.log('');
    }

    // 6. 按状态统计
    const [statusStats] = await sequelize.query(`
      SELECT status, COUNT(*) as count
      FROM users
      GROUP BY status
    `);

    if (statusStats.length > 0) {
      console.log('📊 用户状态统计：');
      statusStats.forEach(s => {
        console.log(`  ${s.status}: ${s.count} 个用户`);
      });
      console.log('');
    }

    // 7. 按角色统计
    const [roleStats] = await sequelize.query(`
      SELECT role, COUNT(*) as count
      FROM users
      GROUP BY role
    `);

    if (roleStats.length > 0) {
      console.log('📊 用户角色统计：');
      roleStats.forEach(r => {
        console.log(`  ${r.role}: ${r.count} 个用户`);
      });
      console.log('');
    }

    console.log('✅ 检查完成！\n');

  } catch (error) {
    console.error('\n❌ 检查失败:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

// 运行检查
checkUsers();










