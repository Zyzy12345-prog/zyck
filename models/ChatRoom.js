// 聊天室模型
module.exports = (sequelize, DataTypes) => {
  const ChatRoom = sequelize.define('ChatRoom', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    roomName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'room_name',
      comment: '聊天室名称'
    },
    roomType: {
      type: DataTypes.ENUM('client', 'lead', 'group', 'direct'),
      allowNull: false,
      defaultValue: 'client',
      field: 'room_type',
      comment: '聊天室类型'
    },
    clientId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'client_id',
      comment: '关联客户ID'
    },
    leadId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'lead_id',
      comment: '关联线索ID'
    },
    participants: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
      comment: '参与者列表'
    },
    status: {
      type: DataTypes.ENUM('active', 'closed', 'archived'),
      allowNull: false,
      defaultValue: 'active',
      comment: '状态'
    },
    lastMessageAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_message_at',
      comment: '最后消息时间'
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'created_by',
      comment: '创建人'
    }
  }, {
    tableName: 'chat_rooms',
    timestamps: true,
    underscored: true
  });

  ChatRoom.associate = function(models) {
    ChatRoom.belongsTo(models.Client, {
      foreignKey: 'clientId',
      as: 'client'
    });
    
    // 只有当 Lead 模型存在时才关联
    if (models.Lead) {
      ChatRoom.belongsTo(models.Lead, {
        foreignKey: 'leadId',
        as: 'lead'
      });
    }
    
    ChatRoom.belongsTo(models.User, {
      foreignKey: 'createdBy',
      as: 'creator'
    });
    
    ChatRoom.hasMany(models.ChatMessage, {
      foreignKey: 'roomId',
      as: 'messages'
    });
    
    ChatRoom.hasMany(models.ChatParticipant, {
      foreignKey: 'roomId',
      as: 'roomParticipants'  // 改名避免冲突
    });
  };

  return ChatRoom;
};

