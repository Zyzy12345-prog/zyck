module.exports = (sequelize, DataTypes) => {
  const CommunicationRecord = sequelize.define('CommunicationRecord', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  clientId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'client_id'
  },
  leadId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'lead_id'
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id'
  },
  communicationType: {
    type: DataTypes.STRING(20),
    allowNull: false,
    field: 'communication_type',
    comment: 'phone, sms, email, wechat'
  },
  direction: {
    type: DataTypes.STRING(20),
    defaultValue: 'outbound',
    comment: 'outbound, inbound'
  },
  status: {
    type: DataTypes.STRING(20),
    defaultValue: 'initiated',
    comment: 'initiated, connecting, connected, completed, failed, cancelled'
  },
  phoneNumber: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'phone_number'
  },
  callDuration: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'call_duration',
    comment: 'Duration in seconds'
  },
  recordingUrl: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'recording_url'
  },
  smsContent: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'sms_content'
  },
  smsStatus: {
    type: DataTypes.STRING(20),
    allowNull: true,
    field: 'sms_status',
    comment: 'sent, delivered, failed'
  },
  emailSubject: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'email_subject'
  },
  emailContent: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'email_content'
  },
  emailTo: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'email_to'
  },
  emailCc: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'email_cc'
  },
  emailStatus: {
    type: DataTypes.STRING(20),
    allowNull: true,
    field: 'email_status',
    comment: 'sent, delivered, failed, bounced'
  },
  wechatContent: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'wechat_content'
  },
  wechatMsgType: {
    type: DataTypes.STRING(20),
    allowNull: true,
    field: 'wechat_msg_type',
    comment: 'text, image, file, voice'
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'General content/notes'
  },
  attachments: {
    type: DataTypes.JSONB,
    defaultValue: [],
    comment: 'Array of attachment objects'
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {},
    comment: 'Additional metadata'
  },
  result: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'success, no_answer, busy, rejected, failed'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  startedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'started_at'
  },
  endedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'ended_at'
  }
}, {
  tableName: 'communication_records',
  timestamps: true,
  underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  CommunicationRecord.associate = function(models) {
    // 创建人（兼容旧系统 user 表）
    CommunicationRecord.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'creator'
    });
  };

  return CommunicationRecord;
};



