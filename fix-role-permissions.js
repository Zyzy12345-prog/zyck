/**
 * 修复 role_permissions 表问题
 * 
 * 问题：旧的迁移文件创建了 role_permissions 表，但新的员工模型使用 JSONB 存储权限
 * 解决方案：删除旧表，确保使用新的表结构
 */

const { Sequelize } = require('sequelize');
const path = require('path');
const dotenv = require('dotenv');

// 加载环境变量
const rootEnvPath = path.join(__dirname, '.env');
dotenv.config({ path: rootEnvPath });

// 创建 Sequelize 实例
const sequelize = new Sequelize(
  process.env.DB_NAME || 'tax_crm',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'your_password',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

async function fixRolePermissions() {
  try {
    console.log('🔧 开始修复 role_permissions 表问题...\n');

    // 1. 检查当前数据库中的表
    console.log('📋 检查数据库表...');
    const [tables] = await sequelize.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);
    
    console.log('当前数据库表：');
    tables.forEach(t => console.log(`  - ${t.tablename}`));
    console.log('');

    // 2. 检查是否存在旧的 role_permissions 表
    const hasOldTable = tables.some(t => t.tablename === 'role_permissions');
    
    if (hasOldTable) {
      console.log('⚠️  发现旧的 role_permissions 表');
      console.log('🗑️  删除旧表...');
      
      // 删除旧表
      await sequelize.query('DROP TABLE IF EXISTS role_permissions CASCADE');
      console.log('✅ 旧表已删除\n');
    } else {
      console.log('✅ 没有发现旧的 role_permissions 表\n');
    }

    // 3. 检查 roles 表结构
    console.log('📋 检查 roles 表结构...');
    const hasRolesTable = tables.some(t => t.tablename === 'roles');
    
    if (!hasRolesTable) {
      console.log('⚠️  roles 表不存在，需要运行迁移');
      console.log('请运行: npm run migrate\n');
      return;
    }

    // 检查 roles 表的列
    const [columns] = await sequelize.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'roles'
      ORDER BY ordinal_position
    `);
    
    console.log('roles 表的列：');
    columns.forEach(c => console.log(`  - ${c.column_name} (${c.data_type})`));
    console.log('');

    // 4. 检查是否有 permissions 字段
    const hasPermissionsColumn = columns.some(c => c.column_name === 'permissions');
    
    if (!hasPermissionsColumn) {
      console.log('⚠️  roles 表缺少 permissions 列');
      console.log('🔧 添加 permissions 列...');
      
      await sequelize.query(`
        ALTER TABLE roles 
        ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}'::jsonb
      `);
      
      console.log('✅ permissions 列已添加\n');
    } else {
      console.log('✅ roles 表已有 permissions 列\n');
    }

    // 5. 检查 employees 表
    console.log('📋 检查 employees 表...');
    const hasEmployeesTable = tables.some(t => t.tablename === 'employees');
    
    if (!hasEmployeesTable) {
      console.log('⚠️  employees 表不存在');
      console.log('需要运行员工表迁移\n');
    } else {
      console.log('✅ employees 表存在\n');
    }

    // 6. 检查 employee_roles 表
    console.log('📋 检查 employee_roles 表...');
    const hasEmployeeRolesTable = tables.some(t => t.tablename === 'employee_roles');
    
    if (!hasEmployeeRolesTable) {
      console.log('⚠️  employee_roles 表不存在');
      console.log('需要运行员工角色关联表迁移\n');
    } else {
      console.log('✅ employee_roles 表存在\n');
    }

    // 7. 初始化系统角色
    console.log('🔧 初始化系统角色...');
    
    const systemRoles = [
      {
        name: '超级管理员',
        code: 'SUPER_ADMIN',
        description: '拥有系统所有权限',
        permissions: { '*': true },
        isSystem: true,
        status: 'active'
      },
      {
        name: '管理员',
        code: 'ADMIN',
        description: '管理系统配置和用户',
        permissions: {
          'system.manage': true,
          'employee.manage': true,
          'employee.create': true,
          'employee.read': true,
          'employee.update': true,
          'employee.delete': true,
          'department.manage': true,
          'role.manage': true,
          'client.manage': true,
          'client.view': true,
          'client.create': true,
          'client.edit': true,
          'client.delete': true,
          'call.manage': true,
          'call.view': true,
          'report.view': true
        },
        isSystem: true,
        status: 'active'
      },
      {
        name: '部门经理',
        code: 'MANAGER',
        description: '管理部门员工和客户',
        permissions: {
          'employee.view': true,
          'employee.read': true,
          'client.manage': true,
          'client.view': true,
          'client.create': true,
          'client.edit': true,
          'client.assign': true,
          'call.view': true,
          'call.create': true,
          'report.view': true
        },
        isSystem: true,
        status: 'active'
      },
      {
        name: '销售人员',
        code: 'SALES',
        description: '管理客户和外呼记录',
        permissions: {
          'client.view': true,
          'client.create': true,
          'client.edit': true,
          'call.view': true,
          'call.create': true,
          'call.edit': true
        },
        isSystem: true,
        status: 'active'
      },
      {
        name: '普通员工',
        code: 'EMPLOYEE',
        description: '基本查看权限',
        permissions: {
          'client.view': true,
          'call.view': true
        },
        isSystem: true,
        status: 'active'
      }
    ];

    for (const roleData of systemRoles) {
      // 检查角色是否存在
      const [existing] = await sequelize.query(`
        SELECT id FROM roles WHERE code = :code
      `, {
        replacements: { code: roleData.code }
      });

      if (existing.length === 0) {
        // 创建新角色
        await sequelize.query(`
          INSERT INTO roles (name, code, description, permissions, "isSystem", status, "sortOrder", "createdAt", "updatedAt")
          VALUES (:name, :code, :description, :permissions, :isSystem, :status, 0, NOW(), NOW())
        `, {
          replacements: {
            name: roleData.name,
            code: roleData.code,
            description: roleData.description,
            permissions: JSON.stringify(roleData.permissions),
            isSystem: roleData.isSystem,
            status: roleData.status
          }
        });
        console.log(`  ✅ 创建角色: ${roleData.name}`);
      } else {
        // 更新现有角色的权限
        await sequelize.query(`
          UPDATE roles 
          SET permissions = :permissions,
              description = :description,
              "updatedAt" = NOW()
          WHERE code = :code
        `, {
          replacements: {
            code: roleData.code,
            permissions: JSON.stringify(roleData.permissions),
            description: roleData.description
          }
        });
        console.log(`  ✅ 更新角色: ${roleData.name}`);
      }
    }

    console.log('\n✅ 所有系统角色已初始化');
    console.log('\n🎉 修复完成！\n');
    
    // 显示最终的角色列表
    const [roles] = await sequelize.query(`
      SELECT id, name, code, description, "isSystem", status
      FROM roles
      ORDER BY id
    `);
    
    console.log('📋 当前系统角色：');
    roles.forEach(role => {
      console.log(`  ${role.id}. ${role.name} (${role.code}) - ${role.status}`);
      console.log(`     ${role.description}`);
    });
    
    console.log('\n✅ 数据库修复完成，可以正常使用了！');

  } catch (error) {
    console.error('\n❌ 修复失败:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

// 运行修复
fixRolePermissions();

