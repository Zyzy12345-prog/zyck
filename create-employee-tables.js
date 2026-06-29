/**
 * 创建员工管理相关的表
 * - departments (部门表)
 * - employee_roles (员工角色关联表)
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

async function createEmployeeTables() {
  try {
    console.log('🔧 开始创建员工管理相关表...\n');

    // 1. 检查现有表
    const [tables] = await sequelize.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);
    
    const tableNames = tables.map(t => t.tablename);
    console.log('📋 现有表：', tableNames.join(', '));
    console.log('');

    // 2. 创建 departments 表
    if (!tableNames.includes('departments')) {
      console.log('🔧 创建 departments 表...');
      await sequelize.query(`
        CREATE TABLE departments (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          code VARCHAR(50) UNIQUE,
          "parentId" INTEGER REFERENCES departments(id) ON DELETE SET NULL,
          "managerId" INTEGER REFERENCES employees(id) ON DELETE SET NULL,
          description TEXT,
          level INTEGER DEFAULT 1,
          path VARCHAR(500),
          "sortOrder" INTEGER DEFAULT 0,
          status VARCHAR(20) DEFAULT 'active',
          "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          "deletedAt" TIMESTAMP WITH TIME ZONE
        )
      `);
      
      await sequelize.query(`
        CREATE INDEX idx_departments_parent ON departments("parentId")
      `);
      await sequelize.query(`
        CREATE INDEX idx_departments_manager ON departments("managerId")
      `);
      await sequelize.query(`
        CREATE INDEX idx_departments_status ON departments(status)
      `);
      
      console.log('✅ departments 表创建成功\n');
    } else {
      console.log('✅ departments 表已存在\n');
    }

    // 3. 创建 employee_roles 表
    if (!tableNames.includes('employee_roles')) {
      console.log('🔧 创建 employee_roles 表...');
      await sequelize.query(`
        CREATE TABLE employee_roles (
          id SERIAL PRIMARY KEY,
          "employeeId" INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
          "roleId" INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
          "assignedBy" INTEGER REFERENCES employees(id) ON DELETE SET NULL,
          "assignedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE("employeeId", "roleId")
        )
      `);
      
      await sequelize.query(`
        CREATE INDEX idx_employee_roles_employee ON employee_roles("employeeId")
      `);
      await sequelize.query(`
        CREATE INDEX idx_employee_roles_role ON employee_roles("roleId")
      `);
      
      console.log('✅ employee_roles 表创建成功\n');
    } else {
      console.log('✅ employee_roles 表已存在\n');
    }

    // 4. 检查 employees 表是否需要添加字段
    console.log('📋 检查 employees 表结构...');
    const [empColumns] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'employees'
      ORDER BY ordinal_position
    `);
    
    const empColumnNames = empColumns.map(c => c.column_name);
    console.log('employees 表字段：', empColumnNames.join(', '));
    console.log('');

    // 添加缺失的字段
    const requiredEmpFields = [
      { name: 'departmentId', type: 'INTEGER', ref: 'departments(id)' },
      { name: 'username', type: 'VARCHAR(50) UNIQUE' },
      { name: 'password', type: 'VARCHAR(255)' },
      { name: 'phone', type: 'VARCHAR(20)' },
      { name: 'email', type: 'VARCHAR(100)' },
      { name: 'position', type: 'VARCHAR(100)' },
      { name: 'status', type: 'VARCHAR(20) DEFAULT \'active\'' },
      { name: 'hireDate', type: 'DATE' },
      { name: 'resignDate', type: 'DATE' }
    ];

    for (const field of requiredEmpFields) {
      if (!empColumnNames.includes(field.name)) {
        console.log(`🔧 添加 employees.${field.name} 字段...`);
        
        if (field.ref) {
          await sequelize.query(`
            ALTER TABLE employees 
            ADD COLUMN "${field.name}" ${field.type} REFERENCES ${field.ref} ON DELETE SET NULL
          `);
        } else {
          await sequelize.query(`
            ALTER TABLE employees 
            ADD COLUMN "${field.name}" ${field.type}
          `);
        }
        
        console.log(`✅ 字段已添加\n`);
      }
    }

    // 5. 初始化默认部门
    console.log('🔧 初始化默认部门...');
    const [deptCount] = await sequelize.query(`
      SELECT COUNT(*) as count FROM departments
    `);
    
    if (deptCount[0].count === '0') {
      await sequelize.query(`
        INSERT INTO departments (name, code, description, level, path, status)
        VALUES 
          ('总公司', 'ROOT', '公司总部', 1, '/1', 'active'),
          ('销售部', 'SALES', '销售部门', 2, '/1/2', 'active'),
          ('技术部', 'TECH', '技术部门', 2, '/1/3', 'active'),
          ('财务部', 'FINANCE', '财务部门', 2, '/1/4', 'active')
      `);
      console.log('✅ 默认部门已创建\n');
    } else {
      console.log('✅ 部门数据已存在\n');
    }

    // 6. 为现有员工分配默认角色
    console.log('🔧 检查员工角色分配...');
    const [empWithoutRole] = await sequelize.query(`
      SELECT e.id, e.name
      FROM employees e
      LEFT JOIN employee_roles er ON e.id = er."employeeId"
      WHERE er.id IS NULL
      LIMIT 5
    `);
    
    if (empWithoutRole.length > 0) {
      console.log(`发现 ${empWithoutRole.length} 个员工没有角色，分配默认角色...`);
      
      // 获取"销售人员"角色ID
      const [employeeRole] = await sequelize.query(`
        SELECT id FROM roles WHERE code = 'SALES' LIMIT 1
      `);
      
      if (employeeRole.length > 0) {
        const roleId = employeeRole[0].id;
        
        for (const emp of empWithoutRole) {
          await sequelize.query(`
            INSERT INTO employee_roles ("employeeId", "roleId", "createdAt", "updatedAt")
            VALUES (:employeeId, :roleId, NOW(), NOW())
            ON CONFLICT DO NOTHING
          `, {
            replacements: {
              employeeId: emp.id,
              roleId: roleId
            }
          });
          console.log(`  ✅ 为员工 ${emp.name} 分配角色`);
        }
      }
    } else {
      console.log('✅ 所有员工都已分配角色\n');
    }

    // 7. 显示统计信息
    console.log('\n📊 数据统计：');
    
    const [deptStats] = await sequelize.query(`
      SELECT COUNT(*) as count FROM departments WHERE status = 'active'
    `);
    console.log(`  部门数量: ${deptStats[0].count}`);
    
    const [empStats] = await sequelize.query(`
      SELECT COUNT(*) as count FROM employees
    `);
    console.log(`  员工数量: ${empStats[0].count}`);
    
    const [roleStats] = await sequelize.query(`
      SELECT COUNT(*) as count FROM roles WHERE status = 'active'
    `);
    console.log(`  角色数量: ${roleStats[0].count}`);
    
    const [empRoleStats] = await sequelize.query(`
      SELECT COUNT(*) as count FROM employee_roles
    `);
    console.log(`  员工角色关联: ${empRoleStats[0].count}`);
    
    console.log('\n✅ 员工管理表结构创建完成！');
    console.log('\n现在可以重启应用了: npm start\n');

  } catch (error) {
    console.error('\n❌ 创建失败:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

// 运行创建
createEmployeeTables();

