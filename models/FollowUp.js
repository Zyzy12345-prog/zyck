module.exports = (sequelize, DataTypes) => {
  const FollowUp = sequelize.define('FollowUp', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    clientId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'client_id',
      comment: '客户ID'
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id',
      comment: '跟进人ID'
    },
    followType: {
      type: DataTypes.ENUM('phone', 'visit', 'email', 'wechat', 'meeting', 'other'),
      allowNull: false,
      defaultValue: 'phone',
      field: 'follow_type',
      comment: '跟进方式'
    },
    followTime: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'follow_time',
      comment: '跟进时间'
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: '跟进内容'
    },
    nextFollowTime: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'next_follow_time',
      comment: '下次跟进时间'
    },
    status: {
      type: DataTypes.ENUM('pending', 'completed', 'cancelled'),
      allowNull: false,
      defaultValue: 'completed',
      comment: '状态'
    },
    result: {
      type: DataTypes.ENUM('success', 'failed', 'pending', 'no_answer', 'next_stage', 'need_follow'),
      allowNull: true,
      comment: '跟进结果'
    },
    attachments: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '附件信息'
    },
    isReminded: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
      field: 'is_reminded',
      comment: '是否已发送提醒'
    },
    remindedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'reminded_at',
      comment: '提醒发送时间'
    }
  }, {
    tableName: 'follow_ups',
    timestamps: true,
    underscored: true
  });

  FollowUp.associate = function(models) {
    FollowUp.belongsTo(models.Client, {
      foreignKey: 'clientId',
      as: 'client'
    });
    FollowUp.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
    FollowUp.hasMany(models.FollowUpComment, {
      foreignKey: 'followUpId',
      as: 'comments'
    });
    FollowUp.hasMany(models.CustomerFile, {
      foreignKey: 'followUpId',
      as: 'files'
    });
    FollowUp.hasMany(models.FollowUpReminder, {
      foreignKey: 'followUpId',
      as: 'reminders'
    });
  };

  return FollowUp;
};

