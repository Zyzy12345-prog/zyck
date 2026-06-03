// 线索跟进记录模型
module.exports = (sequelize, DataTypes) => {
  const LeadFollowUp = sequelize.define('LeadFollowUp', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    leadId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'lead_id',
      comment: '线索ID'
    },
    followUpType: {
      type: DataTypes.ENUM('phone', 'email', 'visit', 'wechat', 'other'),
      allowNull: false,
      field: 'follow_up_type',
      defaultValue: 'phone',
      comment: '跟进方式'
    },
    followUpDate: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'follow_up_date',
      defaultValue: DataTypes.NOW,
      comment: '跟进时间'
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: '跟进内容'
    },
    result: {
      type: DataTypes.ENUM('positive', 'neutral', 'negative', 'no_response'),
      allowNull: true,
      comment: '跟进结果'
    },
    nextFollowUpDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'next_follow_up_date',
      comment: '下次跟进时间'
    },
    nextFollowUpPlan: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'next_follow_up_plan',
      comment: '下次跟进计划'
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '跟进时长（分钟）'
    },
    attachments: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '附件列表'
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
      comment: '标签'
    },
    isImportant: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      field: 'is_important',
      defaultValue: false,
      comment: '是否重要'
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'created_by',
      comment: '创建人'
    }
  }, {
    tableName: 'lead_follow_ups',
    timestamps: true,
    underscored: true
  });

  LeadFollowUp.associate = function(models) {
    LeadFollowUp.belongsTo(models.CustomerLead, {
      foreignKey: 'leadId',
      as: 'lead'
    });
    LeadFollowUp.belongsTo(models.User, {
      foreignKey: 'createdBy',
      as: 'creator'
    });
  };

  return LeadFollowUp;
};










