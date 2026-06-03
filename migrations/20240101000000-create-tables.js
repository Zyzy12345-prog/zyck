'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // 创建用户表
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      username: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
      },
      email: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true
      },
      password: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      role: {
        type: Sequelize.ENUM('admin', 'manager', 'sales', 'operator'),
        allowNull: false,
        defaultValue: 'operator'
      },
      status: {
        type: Sequelize.ENUM('active', 'inactive', 'suspended'),
        allowNull: false,
        defaultValue: 'active'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // 创建客户表
    await queryInterface.createTable('clients', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      companyName: {
        type: Sequelize.STRING(200),
        allowNull: false,
        field: 'company_name'
      },
      contactPerson: {
        type: Sequelize.STRING(100),
        allowNull: true,
        field: 'contact_person'
      },
      phone: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      email: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      industry: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      registeredCapital: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true,
        field: 'registered_capital',
        defaultValue: 0
      },
      taxStatus: {
        type: Sequelize.ENUM('pending', 'processing', 'completed', 'cancelled'),
        allowNull: false,
        field: 'tax_status',
        defaultValue: 'pending'
      },
      remarks: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // 创建外呼记录表
    await queryInterface.createTable('call_records', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      clientId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        field: 'client_id',
        references: {
          model: 'clients',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        field: 'user_id',
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      callTime: {
        type: Sequelize.DATE,
        allowNull: false,
        field: 'call_time',
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      duration: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: '通话时长（秒）'
      },
      recordingPath: {
        type: Sequelize.STRING(500),
        allowNull: true,
        field: 'recording_path'
      },
      summary: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: '通话摘要'
      },
      callType: {
        type: Sequelize.ENUM('inbound', 'outbound'),
        allowNull: false,
        field: 'call_type',
        defaultValue: 'outbound'
      },
      result: {
        type: Sequelize.ENUM('answered', 'no_answer', 'busy', 'failed'),
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // 创建分配记录表
    await queryInterface.createTable('assignments', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      clientId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        field: 'client_id',
        references: {
          model: 'clients',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        field: 'user_id',
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      assignedBy: {
        type: Sequelize.INTEGER,
        allowNull: true,
        field: 'assigned_by',
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      assignedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        field: 'assigned_at',
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      status: {
        type: Sequelize.ENUM('active', 'completed', 'transferred'),
        allowNull: false,
        defaultValue: 'active'
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // 创建角色表
    await queryInterface.createTable('roles', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
      },
      permissions: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: {}
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // 创建索引
    await queryInterface.addIndex('clients', ['company_name']);
    await queryInterface.addIndex('clients', ['tax_status']);
    await queryInterface.addIndex('call_records', ['client_id']);
    await queryInterface.addIndex('call_records', ['user_id']);
    await queryInterface.addIndex('call_records', ['call_time']);
    await queryInterface.addIndex('assignments', ['client_id']);
    await queryInterface.addIndex('assignments', ['user_id']);
    await queryInterface.addIndex('assignments', ['status']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('assignments');
    await queryInterface.dropTable('call_records');
    await queryInterface.dropTable('roles');
    await queryInterface.dropTable('clients');
    await queryInterface.dropTable('users');
  }
};
