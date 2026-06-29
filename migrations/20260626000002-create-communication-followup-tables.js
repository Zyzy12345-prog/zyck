'use strict';

/** 通讯记录 + 跟进提醒 + 客户文件/讨论 + 文件上传 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 通讯记录
    await queryInterface.createTable('communication_records', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      client_id: { type: Sequelize.INTEGER, references: { model: 'clients', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      lead_id: { type: Sequelize.INTEGER, references: { model: 'customer_leads', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      user_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      communication_type: { type: Sequelize.STRING(20), allowNull: false, comment: 'phone/sms/email/wechat' },
      direction: { type: Sequelize.STRING(20), defaultValue: 'outbound' },
      status: { type: Sequelize.STRING(20), defaultValue: 'completed' },
      phone_number: { type: Sequelize.STRING(50) },
      call_duration: { type: Sequelize.INTEGER, defaultValue: 0 },
      recording_url: { type: Sequelize.TEXT },
      content: { type: Sequelize.TEXT },
      notes: { type: Sequelize.TEXT },
      result: { type: Sequelize.STRING(50) },
      attachments: { type: Sequelize.JSONB, defaultValue: [] },
      metadata: { type: Sequelize.JSONB, defaultValue: {} },
      started_at: { type: Sequelize.DATE },
      ended_at: { type: Sequelize.DATE },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    }).catch(() => {});

    // 跟进提醒
    await queryInterface.createTable('follow_up_reminders', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      lead_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'customer_leads', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      follow_up_id: { type: Sequelize.INTEGER, references: { model: 'lead_follow_ups', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      user_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      reminder_time: { type: Sequelize.DATE, allowNull: false },
      reminder_type: { type: Sequelize.STRING(20), defaultValue: 'scheduled', comment: 'scheduled/overdue/urgent' },
      title: { type: Sequelize.STRING(200), allowNull: false },
      content: { type: Sequelize.TEXT },
      is_read: { type: Sequelize.BOOLEAN, defaultValue: false },
      is_completed: { type: Sequelize.BOOLEAN, defaultValue: false },
      completed_at: { type: Sequelize.DATE },
      priority: { type: Sequelize.STRING(20), defaultValue: 'normal', comment: 'low/normal/high/urgent' },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    }).catch(() => {});

    // 客户文件
    await queryInterface.createTable('customer_files', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      client_id: { type: Sequelize.INTEGER, references: { model: 'clients', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      follow_up_id: { type: Sequelize.INTEGER },
      file_name: { type: Sequelize.STRING(255), allowNull: false },
      file_path: { type: Sequelize.STRING(500), allowNull: false },
      file_size: { type: Sequelize.INTEGER },
      file_type: { type: Sequelize.STRING(100) },
      category: { type: Sequelize.STRING(50), comment: 'contract/invoice/certificate/report/other' },
      uploaded_by: { type: Sequelize.INTEGER, references: { model: 'users', key: 'id' } },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    }).catch(() => {});

    // 客户讨论
    await queryInterface.createTable('customer_discussions', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      client_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'clients', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      user_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      content: { type: Sequelize.TEXT, allowNull: false },
      parent_id: { type: Sequelize.INTEGER, references: { model: 'customer_discussions', key: 'id' } },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    }).catch(() => {});

    // 文件上传
    await queryInterface.createTable('file_uploads', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      original_name: { type: Sequelize.STRING(255), allowNull: false },
      file_name: { type: Sequelize.STRING(255), allowNull: false },
      file_path: { type: Sequelize.STRING(500), allowNull: false },
      file_size: { type: Sequelize.INTEGER },
      mime_type: { type: Sequelize.STRING(100) },
      uploaded_by: { type: Sequelize.INTEGER, references: { model: 'users', key: 'id' } },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    }).catch(() => {});

    // 跟进评论
    await queryInterface.createTable('follow_up_comments', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      follow_up_id: { type: Sequelize.INTEGER, allowNull: false },
      user_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'users', key: 'id' } },
      content: { type: Sequelize.TEXT, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    }).catch(() => {});

    // 客户跟进记录
    await queryInterface.createTable('follow_ups', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      client_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'clients', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      user_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'users', key: 'id' } },
      follow_type: { type: Sequelize.STRING(20), defaultValue: 'phone', comment: 'phone/visit/email/wechat/meeting/other' },
      follow_time: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      content: { type: Sequelize.TEXT, allowNull: false },
      next_follow_time: { type: Sequelize.DATE },
      status: { type: Sequelize.STRING(20), defaultValue: 'completed', comment: 'pending/completed/cancelled' },
      result: { type: Sequelize.STRING(20), comment: 'success/failed/pending/no_answer/next_stage/need_follow' },
      attachments: { type: Sequelize.JSONB },
      is_reminded: { type: Sequelize.BOOLEAN, defaultValue: false },
      reminded_at: { type: Sequelize.DATE },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    }).catch(() => {});
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('follow_up_comments').catch(() => {});
    await queryInterface.dropTable('customer_discussions').catch(() => {});
    await queryInterface.dropTable('customer_files').catch(() => {});
    await queryInterface.dropTable('file_uploads').catch(() => {});
    await queryInterface.dropTable('follow_up_reminders').catch(() => {});
    await queryInterface.dropTable('follow_ups').catch(() => {});
    await queryInterface.dropTable('communication_records').catch(() => {});
  }
};
