/**
 * 完整的数据库初始化脚本
 * 确保所有表和数据都正确初始化
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

async function initDatabase() {
  try {
    console.log('🔧 开始初始化数据库...\n');

    // 1. 测试连接
    console.log('📡 测试数据库连接...');
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功\n');

    // 2. 检查所有表
    console.log('📋 检查数据库表...');
    const [tables] = await sequelize.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);
    
    const tableNames = tables.map(t => t.tablename);
    console.log('现有表：', tableNames.join(', '));
    console.log('');

    // 3. 检查必需的表
    const requiredTables = [
      'roles',
      'departments', 
      'employees',
      'employee_roles',
      'clients',
      'call_records'
    ];

    const missingTables = requiredTables.filter(t => !tableNames.includes(t));
    
    if (missingTables.length > 0) {
      console.log('⚠️  缺少以下表：', missingTables.join(', '));
      console.log('请运行迁移: npm run migrate\n');
    } else {
      console.log('✅ 所有必需的表都存在\n');
    }

    // 4. 检查并修复 roles 表
    console.log('📋 检查 roles 表...');
    const [roleColumns] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'roles'
    `);
    
    const roleColumnNames = roleColumns.map(c => c.column_name);
    
    if (!roleColumnNames.includes('isSystem')) {
      console.log('⚠️  roles 表缺少必要字段，请运行: node fix-roles-table.js\n');
      return;
    }

    // 5. 检查系统角色
    console.log('📋 检查系统角色...');
    const [roles] = await sequelize.query(`
      SELECT id, name, code, "isSystem", status
      FROM roles
      WHERE "isSystem" = true
      ORDER BY id
    `);
    
    if (roles.length === 0) {
      console.log('⚠️  没有系统角色，请运行: node fix-roles-table.js\n');
      return;
    }
    
    console.log(`✅ 找到 ${roles.length} 个系统角色：`);
    roles.forEach(r => console.log(`   - ${r.name} (${r.code})`));
    console.log('');

    // 6. 检查部门
    console.log('📋 检查部门数据...');
    const [depts] = await sequelize.query(`
      SELECT id, name, code, status
      FROM departments
      WHERE status = 'active'
      ORDER BY id
    `);
    
    console.log(`✅ 找到 ${depts.length} 个部门：`);
    depts.forEach(d => console.log(`   - ${d.name} (${d.code})`));
    console.log('');

    // 7. 检查员工
    console.log('📋 检查员工数据...');
    const [empCount] = await sequelize.query(`
      SELECT COUNT(*) as count FROM employees
    `);
    console.log(`✅ 员工数量: ${empCount[0].count}\n`);

    // 8. 检查员工角色关联
    console.log('📋 检查员工角色关联...');
    const [empRoleCount] = await sequelize.query(`
      SELECT COUNT(*) as count FROM employee_roles
    `);
    console.log(`✅ 员工角色关联数量: ${empRoleCount[0].count}\n`);

    // 9. 显示完整统计
    console.log('📊 数据库统计信息：');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const stats = [
      { table: 'roles', label: '角色' },
      { table: 'departments', label: '部门' },
      { table: 'employees', label: '员工' },
      { table: 'employee_roles', label: '员工角色关联' },
      { table: 'clients', label: '客户' },
      { table: 'call_records', label: '外呼记录' }
    ];

    for (const stat of stats) {
      const [result] = await sequelize.query(`
        SELECT COUNT(*) as count FROM ${stat.table}
      `);
      console.log(`  ${stat.label.padEnd(12, ' ')}: ${result[0].count}`);
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // 10. 测试查询
    console.log('🧪 测试数据查询...');
    
    // 测试角色查询
    const [testRoles] = await sequelize.query(`
      SELECT r.id, r.name, r.code, 
             COUNT(er."employeeId") as employee_count
      FROM roles r
      LEFT JOIN employee_roles er ON r.id = er."roleId"
      WHERE r.status = 'active'
      GROUP BY r.id, r.name, r.code
      ORDER BY r.id
    `);
    
    console.log('角色统计：');
    testRoles.forEach(r => {
      console.log(`  ${r.name.padEnd(12, ' ')}: ${r.employee_count} 个员工`);
    });
    console.log('');

    // 测试部门查询
    const [testDepts] = await sequelize.query(`
      SELECT d.id, d.name, d.code,
             COUNT(e.id) as employee_count
      FROM departments d
      LEFT JOIN employees e ON d.id = e."departmentId"
      WHERE d.status = 'active'
      GROUP BY d.id, d.name, d.code
      ORDER BY d.id
    `);
    
    console.log('部门统计：');
    testDepts.forEach(d => {
      console.log(`  ${d.name.padEnd(12, ' ')}: ${d.employee_count} 个员工`);
    });
    console.log('');

    console.log('✅ 数据库初始化检查完成！\n');
    console.log('🎉 数据库状态正常，可以启动应用了！\n');
    console.log('启动命令: npm start\n');

  } catch (error) {
    console.error('\n❌ 初始化检查失败:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

// 运行初始化
initDatabase();










