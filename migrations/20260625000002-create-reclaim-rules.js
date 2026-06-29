'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('reclaim_rules', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      rule_key: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
        comment: '规则标识符'
      },
      label: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: '规则显示名称'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: '规则描述'
      },
      enabled: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: '是否启用'
      },
      status_check: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: '检查的状态列表'
      },
      check_field: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: '检查的日期字段'
      },
      threshold_days: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: '天数阈值'
      },
      max_score: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: '最高分阈值（用于低评分规则）'
      },
      require_assigned: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: '是否要求已分配'
      },
      action: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'reclaim',
        comment: '动作类型: reclaim / warn'
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

    // 预置5条默认规则
    await queryInterface.bulkInsert('reclaim_rules', [
      {
        rule_key: 'newNoContact',
        label: '新线索未联系回收',
        description: '状态为"新线索"且创建超过7天未分配或未联系的线索',
        enabled: true,
        status_check: JSON.stringify(['new']),
        check_field: 'createdAt',
        threshold_days: 7,
        max_score: null,
        require_assigned: false,
        action: 'reclaim',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        rule_key: 'assignedNoFollowUp',
        label: '已分配未跟进回收',
        description: '已分配给销售但超过14天没有任何跟进记录的线索',
        enabled: true,
        status_check: JSON.stringify(['new', 'contacted']),
        check_field: 'assignedAt',
        threshold_days: 14,
        max_score: null,
        require_assigned: true,
        action: 'reclaim',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        rule_key: 'longNoContact',
        label: '长期未联系回收',
        description: '最后联系时间超过30天，线索处于停滞状态',
        enabled: true,
        status_check: JSON.stringify(['contacted', 'qualified', 'negotiating']),
        check_field: 'lastContactTime',
        threshold_days: 30,
        max_score: null,
        require_assigned: false,
        action: 'reclaim',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        rule_key: 'lowScoreWarning',
        label: '低评分线索预警',
        description: '评分低于40且超过21天无进展的线索',
        enabled: true,
        status_check: JSON.stringify(['new', 'contacted', 'qualified', 'negotiating']),
        check_field: 'updatedAt',
        threshold_days: 21,
        max_score: 40,
        require_assigned: false,
        action: 'warn',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        rule_key: 'staleNegotiating',
        label: '洽谈停滞回收',
        description: '处于洽谈中但超过45天未更新的线索',
        enabled: true,
        status_check: JSON.stringify(['negotiating']),
        check_field: 'updatedAt',
        threshold_days: 45,
        max_score: null,
        require_assigned: false,
        action: 'reclaim',
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('reclaim_rules');
  }
};
