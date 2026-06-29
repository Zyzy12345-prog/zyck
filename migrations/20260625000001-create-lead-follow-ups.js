'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('lead_follow_ups', {
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
        onDelete: 'CASCADE',
        comment: '线索ID'
      },
      follow_up_type: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'phone',
        comment: '跟进方式: phone/email/visit/wechat/other'
      },
      follow_up_date: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        comment: '跟进时间'
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: '跟进内容'
      },
      result: {
        type: Sequelize.STRING(20),
        allowNull: true,
        comment: '跟进结果: positive/neutral/negative/no_response'
      },
      next_follow_up_date: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: '下次跟进时间'
      },
      next_follow_up_plan: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: '下次跟进计划'
      },
      duration: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: '跟进时长（分钟）'
      },
      attachments: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: '附件列表'
      },
      tags: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: true,
        comment: '跟进标签'
      },
      is_important: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: '是否重要'
      },
      created_by: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: '创建人'
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

    // 创建索引
    await queryInterface.addIndex('lead_follow_ups', ['lead_id'], { name: 'idx_lead_follow_ups_lead_id' });
    await queryInterface.addIndex('lead_follow_ups', ['follow_up_date'], { name: 'idx_lead_follow_ups_follow_up_date' });
    await queryInterface.addIndex('lead_follow_ups', ['next_follow_up_date'], { name: 'idx_lead_follow_ups_next_follow_up_date' });
    await queryInterface.addIndex('lead_follow_ups', ['created_by'], { name: 'idx_lead_follow_ups_created_by' });
    await queryInterface.addIndex('lead_follow_ups', ['result'], { name: 'idx_lead_follow_ups_result' });
    await queryInterface.addIndex('lead_follow_ups', ['follow_up_type'], { name: 'idx_lead_follow_ups_follow_up_type' });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('lead_follow_ups');
  }
};
