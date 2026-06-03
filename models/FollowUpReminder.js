// 跟进提醒模型
module.exports = (sequelize, DataTypes) => {
  const FollowUpReminder = sequelize.define('FollowUpReminder', {
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
    followUpId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'follow_up_id',
      comment: '跟进记录ID'
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id',
      comment: '用户ID'
    },
    reminderTime: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'reminder_time',
      comment: '提醒时间'
    },
    reminderType: {
      type: DataTypes.ENUM('scheduled', 'overdue', 'urgent'),
      allowNull: false,
      defaultValue: 'scheduled',
      field: 'reminder_type',
      comment: '提醒类型'
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
      comment: '提醒标题'
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '提醒内容'
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_read',
      comment: '是否已读'
    },
    isCompleted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_completed',
      comment: '是否已完成'
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'completed_at',
      comment: '完成时间'
    },
    priority: {
      type: DataTypes.ENUM('low', 'normal', 'high', 'urgent'),
      allowNull: false,
      defaultValue: 'normal',
      comment: '优先级'
    }
  }, {
    tableName: 'follow_up_reminders',
    timestamps: true,
    underscored: true
  });

  FollowUpReminder.associate = function(models) {
    FollowUpReminder.belongsTo(models.CustomerLead, {
      foreignKey: 'leadId',
      as: 'lead'
    });
    FollowUpReminder.belongsTo(models.LeadFollowUp, {
      foreignKey: 'followUpId',
      as: 'followUp'
    });
    FollowUpReminder.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
  };

  return FollowUpReminder;
};
