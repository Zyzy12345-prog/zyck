'use strict';

/** 即时通讯聊天系统 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 聊天室
    await queryInterface.createTable('chat_rooms', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      room_name: { type: Sequelize.STRING(255), allowNull: false },
      room_type: { type: Sequelize.STRING(50), defaultValue: 'client', comment: 'client/lead/group/direct' },
      client_id: { type: Sequelize.INTEGER, references: { model: 'clients', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      lead_id: { type: Sequelize.INTEGER },
      participants: { type: Sequelize.JSONB, defaultValue: [] },
      status: { type: Sequelize.STRING(20), defaultValue: 'active', comment: 'active/closed/archived' },
      last_message_at: { type: Sequelize.DATE },
      created_by: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    }).catch(() => {});

    // 聊天消息
    await queryInterface.createTable('chat_messages', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      room_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'chat_rooms', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      sender_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      sender_type: { type: Sequelize.STRING(20), defaultValue: 'user', comment: 'user/client/system' },
      message_type: { type: Sequelize.STRING(20), defaultValue: 'text', comment: 'text/image/file/audio/video/system' },
      content: { type: Sequelize.TEXT },
      file_id: { type: Sequelize.INTEGER },
      metadata: { type: Sequelize.JSONB },
      is_read: { type: Sequelize.BOOLEAN, defaultValue: false },
      read_at: { type: Sequelize.DATE },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    }).catch(() => {});

    // 聊天参与者
    await queryInterface.createTable('chat_participants', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      room_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'chat_rooms', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      user_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      role: { type: Sequelize.STRING(20), defaultValue: 'member', comment: 'owner/admin/member' },
      joined_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      last_seen_at: { type: Sequelize.DATE },
      unread_count: { type: Sequelize.INTEGER, defaultValue: 0 },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    }).catch(() => {});

    // 唯一约束
    await queryInterface.addConstraint('chat_participants', {
      fields: ['room_id', 'user_id'],
      type: 'unique',
      name: 'uq_chat_participants_room_user'
    }).catch(() => {});
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('chat_participants').catch(() => {});
    await queryInterface.dropTable('chat_messages').catch(() => {});
    await queryInterface.dropTable('chat_rooms').catch(() => {});
  }
};
