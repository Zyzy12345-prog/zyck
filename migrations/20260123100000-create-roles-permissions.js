'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. 更新roles表
    await queryInterface.createTable('roles', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: '角色ID'
      },
      name: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
        comment: '角色名称'
      },
      code: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
        comment: '角色代码'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: '角色描述'
      },
      permissions: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: [],
        comment: '权限代码列表（JSON数组）'
      },
      level: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
        comment: '角色等级（1-100）'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: '是否启用'
      },
      is_system: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: '是否系统内置角色'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        comment: '创建时间'
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        comment: '更新时间'
      }
    });

    // 2. 创建permissions表
    await queryInterface.createTable('permissions', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: '权限ID'
      },
      code: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
        comment: '权限代码'
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: '权限名称'
      },
      module: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: '所属模块'
      },
      action: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: '权限动作'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: '权限描述'
      },
      group: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: '权限分组'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: '是否启用'
      },
      is_system: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: '是否系统内置权限'
      },
      sort_order: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: '排序顺序'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        comment: '创建时间'
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        comment: '更新时间'
      }
    });

    // 3. 创建role_permissions关联表（多对多）
    await queryInterface.createTable('role_permissions', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: '关联ID'
      },
      role_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'roles',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: '角色ID'
      },
      permission_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'permissions',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: '权限ID'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        comment: '创建时间'
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        comment: '更新时间'
      }
    });

    // 创建roles表索引
    await queryInterface.addIndex('roles', ['name'], {
      unique: true,
      name: 'idx_role_name'
    });
    await queryInterface.addIndex('roles', ['code'], {
      unique: true,
      name: 'idx_role_code'
    });
    await queryInterface.addIndex('roles', ['is_active'], {
      name: 'idx_role_active'
    });
    await queryInterface.addIndex('roles', ['level'], {
      name: 'idx_role_level'
    });
    await queryInterface.addIndex('roles', ['is_system'], {
      name: 'idx_role_system'
    });

    // 创建permissions表索引
    await queryInterface.addIndex('permissions', ['code'], {
      unique: true,
      name: 'idx_permission_code'
    });
    await queryInterface.addIndex('permissions', ['module'], {
      name: 'idx_permission_module'
    });
    await queryInterface.addIndex('permissions', ['action'], {
      name: 'idx_permission_action'
    });
    await queryInterface.addIndex('permissions', ['is_active'], {
      name: 'idx_permission_active'
    });
    await queryInterface.addIndex('permissions', ['is_system'], {
      name: 'idx_permission_system'
    });
    await queryInterface.addIndex('permissions', ['group'], {
      name: 'idx_permission_group'
    });
    await queryInterface.addIndex('permissions', ['sort_order'], {
      name: 'idx_permission_sort'
    });
    await queryInterface.addIndex('permissions', ['module', 'action'], {
      name: 'idx_permission_module_action'
    });

    // 创建role_permissions表索引
    await queryInterface.addIndex('role_permissions', ['role_id'], {
      name: 'idx_rp_role_id'
    });
    await queryInterface.addIndex('role_permissions', ['permission_id'], {
      name: 'idx_rp_permission_id'
    });
    await queryInterface.addIndex('role_permissions', ['role_id', 'permission_id'], {
      unique: true,
      name: 'idx_rp_role_permission'
    });

    console.log('✅ 角色和权限表创建成功');
  },

  down: async (queryInterface, Sequelize) => {
    // 删除索引
    await queryInterface.removeIndex('role_permissions', 'idx_rp_role_id');
    await queryInterface.removeIndex('role_permissions', 'idx_rp_permission_id');
    await queryInterface.removeIndex('role_permissions', 'idx_rp_role_permission');
    
    await queryInterface.removeIndex('permissions', 'idx_permission_code');
    await queryInterface.removeIndex('permissions', 'idx_permission_module');
    await queryInterface.removeIndex('permissions', 'idx_permission_action');
    await queryInterface.removeIndex('permissions', 'idx_permission_active');
    await queryInterface.removeIndex('permissions', 'idx_permission_system');
    await queryInterface.removeIndex('permissions', 'idx_permission_group');
    await queryInterface.removeIndex('permissions', 'idx_permission_sort');
    await queryInterface.removeIndex('permissions', 'idx_permission_module_action');
    
    await queryInterface.removeIndex('roles', 'idx_role_name');
    await queryInterface.removeIndex('roles', 'idx_role_code');
    await queryInterface.removeIndex('roles', 'idx_role_active');
    await queryInterface.removeIndex('roles', 'idx_role_level');
    await queryInterface.removeIndex('roles', 'idx_role_system');

    // 删除表
    await queryInterface.dropTable('role_permissions');
    await queryInterface.dropTable('permissions');
    await queryInterface.dropTable('roles');
    
    console.log('✅ 角色和权限表删除成功');
  }
};




