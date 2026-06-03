// 外呼记录模型
module.exports = (sequelize, DataTypes) => {
  const CallRecord = sequelize.define('CallRecord', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    // 关联信息
    clientId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'client_id',
      comment: '客户ID'
    },
    leadId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'lead_id',
      comment: '线索ID'
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id',
      comment: '外呼人员ID'
    },
    taskId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'task_id',
      comment: '任务ID'
    },
    // 外呼基本信息
    callType: {
      type: DataTypes.ENUM('outbound', 'inbound', 'callback'),
      allowNull: false,
      defaultValue: 'outbound',
      field: 'call_type',
      comment: '外呼类型'
    },
    communicationChannel: {
      type: DataTypes.ENUM('phone', 'sms', 'email', 'wechat', 'chat', 'other'),
      allowNull: false,
      defaultValue: 'phone',
      field: 'communication_channel',
      comment: '通讯渠道'
    },
    phoneNumber: {
      type: DataTypes.STRING(20),
      allowNull: false,
      field: 'phone_number',
      comment: '电话号码'
    },
    contactPerson: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'contact_person',
      comment: '联系人'
    },
    // 外呼状态和结果
    callStatus: {
      type: DataTypes.ENUM('pending', 'connected', 'no_answer', 'busy', 'rejected', 'failed', 'voicemail'),
      allowNull: false,
      defaultValue: 'pending',
      field: 'call_status',
      comment: '外呼状态'
    },
    callResult: {
      type: DataTypes.ENUM('success', 'follow_up_needed', 'not_interested', 'wrong_number', 'callback_requested', 'other'),
      allowNull: true,
      field: 'call_result',
      comment: '外呼结果'
    },
    // 时间信息
    callTime: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'call_time',
      comment: '外呼时间'
    },
    startTime: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'start_time',
      comment: '开始时间'
    },
    endTime: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'end_time',
      comment: '结束时间'
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '通话时长（秒）'
    },
    // 内容信息
    subject: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: '主题'
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '通话内容'
    },
    originalContent: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'original_content',
      comment: '原始内容（短信/邮件/聊天）'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '备注'
    },
    nextAction: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'next_action',
      comment: '下一步行动'
    },
    nextCallDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'next_call_date',
      comment: '下次外呼时间'
    },
    // 质量评分
    qualityScore: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'quality_score',
      comment: '质量评分'
    },
    customerSatisfaction: {
      type: DataTypes.ENUM('very_satisfied', 'satisfied', 'neutral', 'dissatisfied', 'very_dissatisfied'),
      allowNull: true,
      field: 'customer_satisfaction',
      comment: '客户满意度'
    },
    // 附加信息
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
      comment: '标签'
    },
    attachments: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: '附件'
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: '额外元数据'
    },
    recordingUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'recording_url',
      comment: '录音URL'
    },
    isImportant: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_important',
      comment: '是否重要'
    },
    isFlagged: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_flagged',
      comment: '是否标记'
    }
  }, {
    tableName: 'call_records',
    timestamps: true,
    underscored: true
  });

  CallRecord.associate = function(models) {
    CallRecord.belongsTo(models.Client, {
      foreignKey: 'clientId',
      as: 'client'
    });
    CallRecord.belongsTo(models.CustomerLead, {
      foreignKey: 'leadId',
      as: 'lead'
    });
    CallRecord.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
    CallRecord.belongsTo(models.CallTask, {
      foreignKey: 'taskId',
      as: 'task'
    });
  };

  return CallRecord;
};
