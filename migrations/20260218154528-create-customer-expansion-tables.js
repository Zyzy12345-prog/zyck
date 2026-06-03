'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. 创建客户标签表
    await queryInterface.createTable('customer_tags', {
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
      color: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: '#1890ff'
      },
      category: {
        type: Sequelize.ENUM('industry', 'scale', 'status', 'behavior', 'custom'),
        allowNull: false,
        defaultValue: 'custom'
      },
      description: {
        type: Sequelize.STRING(200),
        allowNull: true
      },
      is_system: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      sort_order: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      created_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // 2. 创建客户标签关系表
    await queryInterface.createTable('client_tag_relations', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      client_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'clients',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      tag_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'customer_tags',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      created_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // 添加唯一索引
    await queryInterface.addIndex('client_tag_relations', ['client_id', 'tag_id'], {
      unique: true,
      name: 'unique_client_tag'
    });

    // 3. 创建客户线索表
    await queryInterface.createTable('customer_leads', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      company_name: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      contact_person: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      phone: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      email: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      wechat: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      source: {
        type: Sequelize.ENUM('website', 'referral', 'cold_call', 'exhibition', 'social_media', 'partner', 'other'),
        allowNull: false,
        defaultValue: 'other'
      },
      source_detail: {
        type: Sequelize.STRING(200),
        allowNull: true
      },
      industry_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'industry_categories',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      company_scale: {
        type: Sequelize.ENUM('micro', 'small', 'medium', 'large'),
        allowNull: true
      },
      estimated_value: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true
      },
      priority: {
        type: Sequelize.ENUM('low', 'medium', 'high', 'urgent'),
        allowNull: false,
        defaultValue: 'medium'
      },
      status: {
        type: Sequelize.ENUM('new', 'contacted', 'qualified', 'negotiating', 'converted', 'lost'),
        allowNull: false,
        defaultValue: 'new'
      },
      assigned_to: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      assigned_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      converted_client_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'clients',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      converted_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      lost_reason: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      address: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      website: {
        type: Sequelize.STRING(200),
        allowNull: true
      },
      last_contact_time: {
        type: Sequelize.DATE,
        allowNull: true
      },
      next_follow_time: {
        type: Sequelize.DATE,
        allowNull: true
      },
      score: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0
      },
      created_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // 添加索引
    await queryInterface.addIndex('customer_leads', ['status']);
    await queryInterface.addIndex('customer_leads', ['assigned_to']);
    await queryInterface.addIndex('customer_leads', ['created_at']);

    // 4. 创建线索标签关系表
    await queryInterface.createTable('lead_tag_relations', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      lead_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'customer_leads',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      tag_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'customer_tags',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.addIndex('lead_tag_relations', ['lead_id', 'tag_id'], {
      unique: true,
      name: 'unique_lead_tag'
    });

    // 5. 创建客户公海池表
    await queryInterface.createTable('customer_pool', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      client_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'clients',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      entered_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      entered_reason: {
        type: Sequelize.ENUM('unassigned', 'inactive', 'returned', 'transferred'),
        allowNull: false
      },
      previous_owner_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      claimed_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      claimed_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('available', 'claimed', 'locked'),
        allowNull: false,
        defaultValue: 'available'
      },
      priority: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // 添加索引
    await queryInterface.addIndex('customer_pool', ['client_id']);
    await queryInterface.addIndex('customer_pool', ['status']);
    await queryInterface.addIndex('customer_pool', ['entered_at']);
  },

  down: async (queryInterface, Sequelize) => {
    // 删除表（按依赖关系逆序）
    await queryInterface.dropTable('customer_pool');
    await queryInterface.dropTable('lead_tag_relations');
    await queryInterface.dropTable('customer_leads');
    await queryInterface.dropTable('client_tag_relations');
    await queryInterface.dropTable('customer_tags');
  }
};
