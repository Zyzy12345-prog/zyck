// 聊天参与者模型
module.exports = (sequelize, DataTypes) => {
  const ChatParticipant = sequelize.define('ChatParticipant', {
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
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id',
      comment: '用户ID'
    },
    role: {
      type: DataTypes.ENUM('owner', 'admin', 'member'),
      allowNull: false,
      defaultValue: 'member',
      comment: '角色'
    },
    joinedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'joined_at',
      comment: '加入时间'
    },
    lastSeenAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_seen_at',
      comment: '最后查看时间'
    },
    unreadCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'unread_count',
      comment: '未读消息数'
    }
  }, {
    tableName: 'chat_participants',
    timestamps: false
  });

  ChatParticipant.associate = function(models) {
    ChatParticipant.belongsTo(models.ChatRoom, {
      foreignKey: 'roomId',
      as: 'room'
    });
    
    ChatParticipant.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
  };

  return ChatParticipant;
};








