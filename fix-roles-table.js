/**
 * 修复 roles 表结构
 * 添加缺失的字段并初始化系统角色
 */

const { Sequelize } = require('sequelize');
const path = require('path');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config();

// 创建 Sequelize 实例
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

async function fixRolesTable() {
  try {
    console.log('🔧 开始修复 roles 表...\n');

    // 1. 检查当前表结构
    console.log('📋 检查 roles 表结构...');
    const [columns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'roles'
      ORDER BY ordinal_position
    `);
    
    console.log('当前字段：');
    columns.forEach(c => {
      console.log(`  - ${c.column_name} (${c.data_type})`);
    });
    console.log('');

    // 2. 添加缺失的字段
    const requiredFields = [
      { name: 'isSystem', type: 'BOOLEAN', default: 'false' },
      { name: 'status', type: 'VARCHAR(20)', default: "'active'" },
      { name: 'sortOrder', type: 'INTEGER', default: '0' }
    ];

    for (const field of requiredFields) {
      const exists = columns.some(c => c.column_name === field.name);
      
      if (!exists) {
        console.log(`🔧 添加字段: ${field.name}...`);
        await sequelize.query(`
          ALTER TABLE roles 
          ADD COLUMN "${field.name}" ${field.type} DEFAULT ${field.default}
        `);
        console.log(`✅ 字段 ${field.name} 已添加\n`);
      }
    }

    // 3. 确保 permissions 字段是 JSONB 类型
    const permissionsCol = columns.find(c => c.column_name === 'permissions');
    if (permissionsCol && permissionsCol.data_type === 'json') {
      console.log('🔧 将 permissions 字段转换为 JSONB...');
      await sequelize.query(`
        ALTER TABLE roles 
        ALTER COLUMN permissions TYPE JSONB USING permissions::jsonb
      `);
      console.log('✅ permissions 字段已转换为 JSONB\n');
    }

    // 4. 初始化系统角色
    console.log('🔧 初始化系统角色...\n');
    
    const systemRoles = [
      {
        name: '超级管理员',
        code: 'SUPER_ADMIN',
        description: '拥有系统所有权限',
        permissions: { '*': true }
      },
      {
        name: '管理员',
        code: 'ADMIN',
        description: '管理系统配置和用户',
        permissions: {
          'employee:read': true,
          'employee:create': true,
          'employee:update': true,
          'employee:delete': true,
          'employee:manage': true,
          'client:read': true,
          'client:create': true,
          'client:update': true,
          'client:delete': true,
          'client:manage': true,
          'call:read': true,
          'call:create': true,
          'call:manage': true
        }
      },
      {
        name: '部门经理',
        code: 'MANAGER',
        description: '管理部门员工和客户',
        permissions: {
          'employee:read': true,
          'client:read': true,
          'client:create': true,
          'client:update': true,
          'call:read': true,
          'call:create': true
        }
      },
      {
        name: '销售人员',
        code: 'SALES',
        description: '管理客户和外呼记录',
        permissions: {
          'client:read': true,
          'client:create': true,
          'client:update': true,
          'call:read': true,
          'call:create': true
        }
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
          VALUES (:name, :code, :description, :permissions::jsonb, true, 'active', 0, NOW(), NOW())
        `, {
          replacements: {
            name: roleData.name,
            code: roleData.code,
            description: roleData.description,
            permissions: JSON.stringify(roleData.permissions)
          }
        });
        console.log(`  ✅ 创建角色: ${roleData.name}`);
      } else {
        // 更新现有角色的权限
        await sequelize.query(`
          UPDATE roles 
          SET permissions = :permissions::jsonb,
              description = :description,
              "isSystem" = true,
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

    console.log('\n✅ 所有系统角色已初始化\n');
    
    // 5. 显示最终的角色列表
    const [roles] = await sequelize.query(`
      SELECT id, name, code, description, "isSystem", status
      FROM roles
      ORDER BY id
    `);
    
    console.log('📋 当前系统角色：');
    roles.forEach(role => {
      console.log(`  ${role.id}. ${role.name} (${role.code})`);
      console.log(`     ${role.description}`);
      console.log(`     系统角色: ${role.isSystem ? '是' : '否'}, 状态: ${role.status}`);
      console.log('');
    });
    
    console.log('✅ roles 表修复完成！\n');
    console.log('现在可以重启应用了: npm start\n');

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
fixRolesTable();










