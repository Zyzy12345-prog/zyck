'use strict';

/** 销售漏斗 + 客户评分系统表 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 销售阶段
    await queryInterface.createTable('sales_stages', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: Sequelize.STRING(50), allowNull: false },
      order: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      color: { type: Sequelize.STRING(20), allowNull: false, defaultValue: '#1890ff' },
      probability: { type: Sequelize.INTEGER, defaultValue: 0, comment: '成交概率(%)' },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    }).catch(() => {});

    // 商机
    await queryInterface.createTable('sales_opportunities', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      title: { type: Sequelize.STRING(200), allowNull: false },
      client_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'clients', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      stage_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'sales_stages', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
      assigned_to: { type: Sequelize.INTEGER, references: { model: 'users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
      expected_amount: { type: Sequelize.DECIMAL(15, 2), defaultValue: 0 },
      probability: { type: Sequelize.INTEGER, defaultValue: 0, comment: '成交概率(%)' },
      expected_close_date: { type: Sequelize.DATEONLY },
      status: { type: Sequelize.STRING(20), defaultValue: 'active', comment: 'active/won/lost' },
      description: { type: Sequelize.TEXT },
      won_amount: { type: Sequelize.DECIMAL(15, 2) },
      lost_reason: { type: Sequelize.TEXT },
      created_by: { type: Sequelize.INTEGER, references: { model: 'users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    }).catch(() => {});

    // 商机阶段变更历史
    await queryInterface.createTable('opportunity_stage_histories', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      opportunity_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'sales_opportunities', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      from_stage_id: { type: Sequelize.INTEGER, references: { model: 'sales_stages', key: 'id' } },
      to_stage_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'sales_stages', key: 'id' } },
      changed_by: { type: Sequelize.INTEGER, references: { model: 'users', key: 'id' } },
      notes: { type: Sequelize.TEXT },
      changed_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    }).catch(() => {});

    // 客户评分
    await queryInterface.createTable('client_scores', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      client_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'clients', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      total_score: { type: Sequelize.DECIMAL(5, 1), defaultValue: 0 },
      level: { type: Sequelize.STRING(10), comment: 'S/A/B/C/D' },
      potential_score: { type: Sequelize.DECIMAL(5, 1), defaultValue: 0 },
      frequency_score: { type: Sequelize.DECIMAL(5, 1), defaultValue: 0 },
      amount_score: { type: Sequelize.DECIMAL(5, 1), defaultValue: 0 },
      interaction_score: { type: Sequelize.DECIMAL(5, 1), defaultValue: 0 },
      calculated_at: { type: Sequelize.DATE },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    }).catch(() => {});

    // 客户价值分析
    await queryInterface.createTable('client_value_analyses', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      client_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'clients', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      total_revenue: { type: Sequelize.DECIMAL(15, 2), defaultValue: 0 },
      total_orders: { type: Sequelize.INTEGER, defaultValue: 0 },
      avg_order_value: { type: Sequelize.DECIMAL(15, 2), defaultValue: 0 },
      purchase_frequency: { type: Sequelize.DECIMAL(5, 1), defaultValue: 0 },
      churn_risk: { type: Sequelize.STRING(20), comment: 'low/medium/high' },
      growth_potential: { type: Sequelize.STRING(20), comment: 'low/medium/high' },
      recommendations: { type: Sequelize.TEXT },
      calculated_at: { type: Sequelize.DATE },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    }).catch(() => {});

    // 种子数据：默认销售阶段
    await queryInterface.bulkInsert('sales_stages', [
      { name: '初步接触', order: 1, color: '#1890ff', probability: 10, created_at: new Date(), updated_at: new Date() },
      { name: '需求分析', order: 2, color: '#722ed1', probability: 25, created_at: new Date(), updated_at: new Date() },
      { name: '方案演示', order: 3, color: '#fa8c16', probability: 50, created_at: new Date(), updated_at: new Date() },
      { name: '报价谈判', order: 4, color: '#eb2f96', probability: 75, created_at: new Date(), updated_at: new Date() },
      { name: '合同签订', order: 5, color: '#52c41a', probability: 90, created_at: new Date(), updated_at: new Date() },
      { name: '赢单', order: 6, color: '#52c41a', probability: 100, created_at: new Date(), updated_at: new Date() },
      { name: '输单', order: 7, color: '#f5222d', probability: 0, created_at: new Date(), updated_at: new Date() },
    ]).catch(() => {});
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('opportunity_stage_histories').catch(() => {});
    await queryInterface.dropTable('sales_opportunities').catch(() => {});
    await queryInterface.dropTable('sales_stages').catch(() => {});
    await queryInterface.dropTable('client_value_analyses').catch(() => {});
    await queryInterface.dropTable('client_scores').catch(() => {});
  }
};
