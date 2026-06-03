// 外呼脚本模板模型
module.exports = (sequelize, DataTypes) => {
  const CallScriptTemplate = sequelize.define('CallScriptTemplate', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    // 模板信息
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '模板名称'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '模板描述'
    },
    category: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '分类'
    },
    // 脚本内容
    opening: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: '开场白'
    },
    mainContent: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'main_content',
      comment: '主要内容'
    },
    objectionHandling: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'objection_handling',
      comment: '异议处理'
    },
    closing: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: '结束语'
    },
    // 使用信息
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_active',
      comment: '是否启用'
    },
    usageCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'usage_count',
      comment: '使用次数'
    },
    // 创建信息
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'created_by',
      comment: '创建人'
    }
  }, {
    tableName: 'call_script_templates',
    timestamps: true,
    underscored: true
  });

  CallScriptTemplate.associate = function(models) {
    CallScriptTemplate.belongsTo(models.User, {
      foreignKey: 'createdBy',
      as: 'creator'
    });
    CallScriptTemplate.hasMany(models.CallTask, {
      foreignKey: 'scriptTemplateId',
      as: 'callTasks'
    });
  };

  return CallScriptTemplate;
};








