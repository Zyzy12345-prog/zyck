'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('employees', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: '员工ID'
      },
      
      // 员工基本信息
      employee_no: {
        type: Sequelize.STRING(20),
        allowNull: false,
        unique: true,
        comment: '员工工号（唯一）'
      },
      username: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
        comment: '用户名（登录用）'
      },
      password: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: '密码（加密存储）'
      },
      full_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: '员工姓名'
      },
      email: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
        comment: '邮箱'
      },
      phone: {
        type: Sequelize.STRING(20),
        allowNull: true,
        comment: '电话号码'
      },
      department: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: '部门'
      },
      position: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: '职位'
      },
      avatar: {
        type: Sequelize.STRING(500),
        allowNull: true,
        comment: '头像URL'
      },

      // 工作信息
      status: {
        type: Sequelize.ENUM('active', 'inactive', 'suspended'),
        allowNull: false,
        defaultValue: 'active',
        comment: '员工状态：active-在职，inactive-离职，suspended-停用'
      },
      hire_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
        comment: '入职日期'
      },
      last_login: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: '最后登录时间'
      },
      login_ip: {
        type: Sequelize.STRING(45),
        allowNull: true,
        comment: '最后登录IP（支持IPv4和IPv6）'
      },

      // 权限信息
      role_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'roles',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: '角色ID（外键关联角色表）'
      },
      permissions: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: true,
        defaultValue: [],
        comment: '权限数组（存储具体权限）'
      },
      access_level: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
        comment: '访问等级（1-10）'
      },

      // 统计信息
      total_clients: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: '分配的客户总数'
      },
      active_clients: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: '当前跟进客户数'
      },
      completed_calls: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: '完成通话数'
      },
      success_rate: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0.00,
        comment: '转化成功率（百分比，0-100）'
      },

      // 时间戳
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

    // 创建索引
    await queryInterface.addIndex('employees', ['employee_no'], {
      unique: true,
      name: 'idx_employee_no'
    });

    await queryInterface.addIndex('employees', ['username'], {
      unique: true,
      name: 'idx_username'
    });

    await queryInterface.addIndex('employees', ['email'], {
      unique: true,
      name: 'idx_email'
    });

    await queryInterface.addIndex('employees', ['status'], {
      name: 'idx_status'
    });

    await queryInterface.addIndex('employees', ['department'], {
      name: 'idx_department'
    });

    await queryInterface.addIndex('employees', ['role_id'], {
      name: 'idx_role_id'
    });

    await queryInterface.addIndex('employees', ['hire_date'], {
      name: 'idx_hire_date'
    });

    await queryInterface.addIndex('employees', ['access_level'], {
      name: 'idx_access_level'
    });

    await queryInterface.addIndex('employees', ['status', 'department'], {
      name: 'idx_status_department'
    });

    await queryInterface.addIndex('employees', ['created_at', 'status'], {
      name: 'idx_created_status'
    });

    console.log('✅ 员工表创建成功');
  },

  down: async (queryInterface, Sequelize) => {
    // 删除索引
    await queryInterface.removeIndex('employees', 'idx_employee_no');
    await queryInterface.removeIndex('employees', 'idx_username');
    await queryInterface.removeIndex('employees', 'idx_email');
    await queryInterface.removeIndex('employees', 'idx_status');
    await queryInterface.removeIndex('employees', 'idx_department');
    await queryInterface.removeIndex('employees', 'idx_role_id');
    await queryInterface.removeIndex('employees', 'idx_hire_date');
    await queryInterface.removeIndex('employees', 'idx_access_level');
    await queryInterface.removeIndex('employees', 'idx_status_department');
    await queryInterface.removeIndex('employees', 'idx_created_status');

    // 删除表
    await queryInterface.dropTable('employees');
    
    console.log('✅ 员工表删除成功');
  }
};




