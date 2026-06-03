'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. 插入权限数据
    const permissions = [
      // ==================== 客户管理权限 ====================
      { code: 'client:read', name: '查看客户', module: 'client', action: 'read', description: '查看客户列表和详情', group: '客户管理', is_system: true, sort_order: 1 },
      { code: 'client:create', name: '创建客户', module: 'client', action: 'create', description: '创建新客户', group: '客户管理', is_system: true, sort_order: 2 },
      { code: 'client:update', name: '编辑客户', module: 'client', action: 'update', description: '编辑客户信息', group: '客户管理', is_system: true, sort_order: 3 },
      { code: 'client:delete', name: '删除客户', module: 'client', action: 'delete', description: '删除客户', group: '客户管理', is_system: true, sort_order: 4 },
      { code: 'client:export', name: '导出客户', module: 'client', action: 'export', description: '导出客户数据', group: '客户管理', is_system: true, sort_order: 5 },
      { code: 'client:import', name: '导入客户', module: 'client', action: 'import', description: '批量导入客户', group: '客户管理', is_system: true, sort_order: 6 },

      // ==================== 外呼管理权限 ====================
      { code: 'call:read', name: '查看外呼记录', module: 'call', action: 'read', description: '查看外呼记录列表和详情', group: '外呼管理', is_system: true, sort_order: 11 },
      { code: 'call:create', name: '创建外呼记录', module: 'call', action: 'create', description: '创建新的外呼记录', group: '外呼管理', is_system: true, sort_order: 12 },
      { code: 'call:update', name: '编辑外呼记录', module: 'call', action: 'update', description: '编辑外呼记录', group: '外呼管理', is_system: true, sort_order: 13 },
      { code: 'call:delete', name: '删除外呼记录', module: 'call', action: 'delete', description: '删除外呼记录', group: '外呼管理', is_system: true, sort_order: 14 },
      { code: 'call:export', name: '导出外呼记录', module: 'call', action: 'export', description: '导出外呼数据', group: '外呼管理', is_system: true, sort_order: 15 },

      // ==================== 员工管理权限 ====================
      { code: 'employee:read', name: '查看员工', module: 'employee', action: 'read', description: '查看员工列表和详情', group: '员工管理', is_system: true, sort_order: 21 },
      { code: 'employee:create', name: '创建员工', module: 'employee', action: 'create', description: '创建新员工', group: '员工管理', is_system: true, sort_order: 22 },
      { code: 'employee:update', name: '编辑员工', module: 'employee', action: 'update', description: '编辑员工信息', group: '员工管理', is_system: true, sort_order: 23 },
      { code: 'employee:delete', name: '删除员工', module: 'employee', action: 'delete', description: '删除员工', group: '员工管理', is_system: true, sort_order: 24 },

      // ==================== 角色管理权限 ====================
      { code: 'role:read', name: '查看角色', module: 'role', action: 'read', description: '查看角色列表和详情', group: '角色管理', is_system: true, sort_order: 31 },
      { code: 'role:create', name: '创建角色', module: 'role', action: 'create', description: '创建新角色', group: '角色管理', is_system: true, sort_order: 32 },
      { code: 'role:update', name: '编辑角色', module: 'role', action: 'update', description: '编辑角色信息', group: '角色管理', is_system: true, sort_order: 33 },
      { code: 'role:delete', name: '删除角色', module: 'role', action: 'delete', description: '删除角色', group: '角色管理', is_system: true, sort_order: 34 },

      // ==================== 权限管理权限 ====================
      { code: 'permission:read', name: '查看权限', module: 'permission', action: 'read', description: '查看权限列表', group: '权限管理', is_system: true, sort_order: 41 },
      { code: 'permission:manage', name: '管理权限', module: 'permission', action: 'manage', description: '管理权限配置', group: '权限管理', is_system: true, sort_order: 42 },

      // ==================== 分配管理权限 ====================
      { code: 'assignment:read', name: '查看分配', module: 'assignment', action: 'read', description: '查看客户分配记录', group: '分配管理', is_system: true, sort_order: 51 },
      { code: 'assignment:create', name: '创建分配', module: 'assignment', action: 'create', description: '分配客户给员工', group: '分配管理', is_system: true, sort_order: 52 },
      { code: 'assignment:update', name: '编辑分配', module: 'assignment', action: 'update', description: '修改客户分配', group: '分配管理', is_system: true, sort_order: 53 },
      { code: 'assignment:delete', name: '删除分配', module: 'assignment', action: 'delete', description: '取消客户分配', group: '分配管理', is_system: true, sort_order: 54 },

      // ==================== 报表权限 ====================
      { code: 'report:view', name: '查看报表', module: 'report', action: 'view', description: '查看各类统计报表', group: '报表管理', is_system: true, sort_order: 61 },
      { code: 'report:export', name: '导出报表', module: 'report', action: 'export', description: '导出报表数据', group: '报表管理', is_system: true, sort_order: 62 },

      // ==================== 仪表盘权限 ====================
      { code: 'dashboard:view', name: '查看仪表盘', module: 'dashboard', action: 'view', description: '查看数据仪表盘', group: '仪表盘', is_system: true, sort_order: 71 },

      // ==================== 系统管理权限 ====================
      { code: 'system:read', name: '查看系统设置', module: 'system', action: 'read', description: '查看系统配置', group: '系统管理', is_system: true, sort_order: 81 },
      { code: 'system:manage', name: '管理系统设置', module: 'system', action: 'manage', description: '管理系统配置', group: '系统管理', is_system: true, sort_order: 82 },

      // ==================== 超级权限 ====================
      { code: '*', name: '所有权限', module: 'system', action: 'manage', description: '拥有系统所有权限', group: '系统管理', is_system: true, sort_order: 99 }
    ];

    await queryInterface.bulkInsert('permissions', permissions.map(p => ({
      ...p,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    })));

    console.log('✅ 权限数据插入成功，共 ' + permissions.length + ' 条');

    // 2. 插入角色数据
    const roles = [
      {
        name: '超级管理员',
        code: 'SUPER_ADMIN',
        description: '系统超级管理员，拥有所有权限',
        permissions: ['*'],
        level: 100,
        is_active: true,
        is_system: true
      },
      {
        name: '系统管理员',
        code: 'ADMIN',
        description: '系统管理员，拥有大部分管理权限',
        permissions: [
          'client:read', 'client:create', 'client:update', 'client:delete', 'client:export', 'client:import',
          'call:read', 'call:create', 'call:update', 'call:delete', 'call:export',
          'employee:read', 'employee:create', 'employee:update', 'employee:delete',
          'role:read', 'role:create', 'role:update', 'role:delete',
          'permission:read', 'permission:manage',
          'assignment:read', 'assignment:create', 'assignment:update', 'assignment:delete',
          'report:view', 'report:export',
          'dashboard:view',
          'system:read', 'system:manage'
        ],
        level: 90,
        is_active: true,
        is_system: true
      },
      {
        name: '部门经理',
        code: 'MANAGER',
        description: '部门经理，可以管理本部门员工和客户',
        permissions: [
          'client:read', 'client:create', 'client:update', 'client:export',
          'call:read', 'call:create', 'call:update', 'call:export',
          'employee:read',
          'assignment:read', 'assignment:create', 'assignment:update', 'assignment:delete',
          'report:view', 'report:export',
          'dashboard:view'
        ],
        level: 70,
        is_active: true,
        is_system: true
      },
      {
        name: '销售主管',
        code: 'SALES_SUPERVISOR',
        description: '销售主管，可以管理销售团队和客户',
        permissions: [
          'client:read', 'client:create', 'client:update', 'client:export',
          'call:read', 'call:create', 'call:update', 'call:export',
          'assignment:read', 'assignment:create', 'assignment:update',
          'report:view',
          'dashboard:view'
        ],
        level: 60,
        is_active: true,
        is_system: true
      },
      {
        name: '销售员',
        code: 'SALES',
        description: '销售员，可以管理自己的客户和外呼记录',
        permissions: [
          'client:read', 'client:create', 'client:update',
          'call:read', 'call:create', 'call:update',
          'assignment:read',
          'dashboard:view'
        ],
        level: 40,
        is_active: true,
        is_system: true
      },
      {
        name: '客服专员',
        code: 'CUSTOMER_SERVICE',
        description: '客服专员，可以查看客户和处理外呼',
        permissions: [
          'client:read',
          'call:read', 'call:create', 'call:update',
          'dashboard:view'
        ],
        level: 30,
        is_active: true,
        is_system: true
      },
      {
        name: '普通员工',
        code: 'EMPLOYEE',
        description: '普通员工，只有基本查看权限',
        permissions: [
          'client:read',
          'call:read',
          'dashboard:view'
        ],
        level: 20,
        is_active: true,
        is_system: true
      },
      {
        name: '访客',
        code: 'GUEST',
        description: '访客角色，只能查看仪表盘',
        permissions: [
          'dashboard:view'
        ],
        level: 10,
        is_active: true,
        is_system: true
      }
    ];

    await queryInterface.bulkInsert('roles', roles.map(r => ({
      ...r,
      permissions: JSON.stringify(r.permissions),
      created_at: new Date(),
      updated_at: new Date()
    })));

    console.log('✅ 角色数据插入成功，共 ' + roles.length + ' 条');

    // 3. 建立角色和权限的关联关系
    const rolePermissions = [];
    
    // 获取插入的角色和权限ID（这里简化处理，实际应该查询数据库）
    // 超级管理员 - 所有权限
    for (let i = 1; i <= 31; i++) {
      rolePermissions.push({ role_id: 1, permission_id: i });
    }

    // 系统管理员 - 除超级权限外的所有权限
    for (let i = 1; i <= 30; i++) {
      rolePermissions.push({ role_id: 2, permission_id: i });
    }

    // 部门经理 - 客户、外呼、分配、报表权限
    [1, 2, 3, 5, 6, 7, 8, 9, 11, 12, 22, 23, 24, 25, 26, 27, 28, 29].forEach(permId => {
      rolePermissions.push({ role_id: 3, permission_id: permId });
    });

    // 销售主管 - 客户、外呼、部分分配、报表权限
    [1, 2, 3, 5, 7, 8, 9, 11, 23, 24, 25, 27, 29].forEach(permId => {
      rolePermissions.push({ role_id: 4, permission_id: permId });
    });

    // 销售员 - 客户、外呼基本权限
    [1, 2, 3, 7, 8, 9, 23, 29].forEach(permId => {
      rolePermissions.push({ role_id: 5, permission_id: permId });
    });

    // 客服专员 - 客户查看、外呼权限
    [1, 7, 8, 9, 29].forEach(permId => {
      rolePermissions.push({ role_id: 6, permission_id: permId });
    });

    // 普通员工 - 基本查看权限
    [1, 7, 29].forEach(permId => {
      rolePermissions.push({ role_id: 7, permission_id: permId });
    });

    // 访客 - 仪表盘权限
    [29].forEach(permId => {
      rolePermissions.push({ role_id: 8, permission_id: permId });
    });

    await queryInterface.bulkInsert('role_permissions', rolePermissions.map(rp => ({
      ...rp,
      created_at: new Date(),
      updated_at: new Date()
    })));

    console.log('✅ 角色权限关联数据插入成功，共 ' + rolePermissions.length + ' 条');
    console.log('');
    console.log('📋 预定义角色列表：');
    console.log('   1. 超级管理员 (SUPER_ADMIN) - 等级100');
    console.log('   2. 系统管理员 (ADMIN) - 等级90');
    console.log('   3. 部门经理 (MANAGER) - 等级70');
    console.log('   4. 销售主管 (SALES_SUPERVISOR) - 等级60');
    console.log('   5. 销售员 (SALES) - 等级40');
    console.log('   6. 客服专员 (CUSTOMER_SERVICE) - 等级30');
    console.log('   7. 普通员工 (EMPLOYEE) - 等级20');
    console.log('   8. 访客 (GUEST) - 等级10');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('role_permissions', null, {});
    await queryInterface.bulkDelete('roles', null, {});
    await queryInterface.bulkDelete('permissions', null, {});
    console.log('✅ 角色和权限数据删除成功');
  }
};




