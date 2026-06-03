// 聊天消息模型
module.exports = (sequelize, DataTypes) => {
  const ChatMessage = sequelize.define('ChatMessage', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    roomId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'room_id',
      comment: '聊天室ID'
    },
    senderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'sender_id',
      comment: '发送者ID'
    },
    senderType: {
      type: DataTypes.ENUM('user', 'client', 'system'),
      allowNull: false,
      defaultValue: 'user',
      field: 'sender_type',
      comment: '发送者类型'
    },
    messageType: {
      type: DataTypes.ENUM('text', 'image', 'file', 'audio', 'video', 'system'),
      allowNull: false,
      defaultValue: 'text',
      field: 'message_type',
      comment: '消息类型'
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '消息内容'
    },
    fileId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'file_id',
      comment: '文件ID'
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: '元数据'
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_read',
      comment: '是否已读'
    },
    readAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'read_at',
      comment: '阅读时间'
    }
  }, {
    tableName: 'chat_messages',
    timestamps: true,
    underscored: true
  });

  ChatMessage.associate = function(models) {
    ChatMessage.belongsTo(models.ChatRoom, {
      foreignKey: 'roomId',
      as: 'room'
    });
    
    ChatMessage.belongsTo(models.User, {
      foreignKey: 'senderId',
      as: 'sender'
    });
    
    ChatMessage.belongsTo(models.FileUpload, {
      foreignKey: 'fileId',
      as: 'file'
    });
  };

  return ChatMessage;
};








