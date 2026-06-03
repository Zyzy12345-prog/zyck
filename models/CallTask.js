// 外呼任务模型
module.exports = (sequelize, DataTypes) => {
  const CallTask = sequelize.define('CallTask', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    // 任务基本信息
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
      comment: '任务标题'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '任务描述'
    },
    taskType: {
      type: DataTypes.ENUM('single', 'batch', 'campaign'),
      allowNull: false,
      defaultValue: 'single',
      field: 'task_type',
      comment: '任务类型'
    },
    // 关联信息
    assignedTo: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'assigned_to',
      comment: '分配给'
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'created_by',
      comment: '创建人'
    },
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
    // 任务状态
    status: {
      type: DataTypes.ENUM('pending', 'in_progress', 'completed', 'cancelled', 'overdue'),
      allowNull: false,
      defaultValue: 'pending',
      comment: '任务状态'
    },
    priority: {
      type: DataTypes.ENUM('low', 'normal', 'high', 'urgent'),
      allowNull: false,
      defaultValue: 'normal',
      comment: '优先级'
    },
    // 时间信息
    scheduledTime: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'scheduled_time',
      comment: '计划时间'
    },
    dueDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'due_date',
      comment: '截止日期'
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'completed_at',
      comment: '完成时间'
    },
    // 任务配置
    maxAttempts: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 3,
      field: 'max_attempts',
      comment: '最大尝试次数'
    },
    currentAttempts: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'current_attempts',
      comment: '当前尝试次数'
    },
    autoAssign: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'auto_assign',
      comment: '自动分配'
    },
    // 脚本和模板
    scriptTemplateId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'script_template_id',
      comment: '脚本模板ID'
    },
    callScript: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'call_script',
      comment: '外呼脚本'
    },
    // 统计信息
    totalCalls: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'total_calls',
      comment: '总外呼数'
    },
    successfulCalls: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'successful_calls',
      comment: '成功外呼数'
    }
  }, {
    tableName: 'call_tasks',
    timestamps: true,
    underscored: true
  });

  CallTask.associate = function(models) {
    CallTask.belongsTo(models.User, {
      foreignKey: 'assignedTo',
      as: 'assignee'
    });
    CallTask.belongsTo(models.User, {
      foreignKey: 'createdBy',
      as: 'creator'
    });
    CallTask.belongsTo(models.Client, {
      foreignKey: 'clientId',
      as: 'client'
    });
    CallTask.belongsTo(models.CustomerLead, {
      foreignKey: 'leadId',
      as: 'lead'
    });
    CallTask.belongsTo(models.CallScriptTemplate, {
      foreignKey: 'scriptTemplateId',
      as: 'scriptTemplate'
    });
    CallTask.hasMany(models.CallRecord, {
      foreignKey: 'taskId',
      as: 'callRecords'
    });
  };

  return CallTask;
};








