'use strict';

/** 外呼任务 + 外呼脚本模板 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 外呼任务
    await queryInterface.createTable('call_tasks', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      title: { type: Sequelize.STRING(200), allowNull: false },
      description: { type: Sequelize.TEXT },
      task_type: { type: Sequelize.STRING(20), defaultValue: 'single', comment: 'single/batch/campaign' },
      assigned_to: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      created_by: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      client_id: { type: Sequelize.INTEGER, references: { model: 'clients', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
      lead_id: { type: Sequelize.INTEGER, references: { model: 'customer_leads', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
      status: { type: Sequelize.STRING(20), defaultValue: 'pending', comment: 'pending/in_progress/completed/cancelled/overdue' },
      priority: { type: Sequelize.STRING(20), defaultValue: 'normal', comment: 'low/normal/high/urgent' },
      scheduled_time: { type: Sequelize.DATE },
      due_date: { type: Sequelize.DATE },
      deadline: { type: Sequelize.DATE },
      completed_at: { type: Sequelize.DATE },
      max_attempts: { type: Sequelize.INTEGER, defaultValue: 3 },
      current_attempts: { type: Sequelize.INTEGER, defaultValue: 0 },
      target_count: { type: Sequelize.INTEGER },
      auto_assign: { type: Sequelize.BOOLEAN, defaultValue: false },
      call_script: { type: Sequelize.TEXT },
      total_calls: { type: Sequelize.INTEGER, defaultValue: 0 },
      successful_calls: { type: Sequelize.INTEGER, defaultValue: 0 },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    }).catch(() => {});

    // 外呼脚本模板
    await queryInterface.createTable('call_script_templates', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: Sequelize.STRING(100), allowNull: false },
      description: { type: Sequelize.TEXT },
      category: { type: Sequelize.STRING(50) },
      opening: { type: Sequelize.TEXT, allowNull: false },
      main_content: { type: Sequelize.TEXT, allowNull: false },
      objection_handling: { type: Sequelize.TEXT },
      closing: { type: Sequelize.TEXT, allowNull: false },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      usage_count: { type: Sequelize.INTEGER, defaultValue: 0 },
      created_by: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    }).catch(() => {});
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('call_script_templates').catch(() => {});
    await queryInterface.dropTable('call_tasks').catch(() => {});
  }
};
