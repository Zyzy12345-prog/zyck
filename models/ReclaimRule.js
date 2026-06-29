module.exports = (sequelize, DataTypes) => {
  const ReclaimRule = sequelize.define('ReclaimRule', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    ruleKey: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      field: 'rule_key',
      comment: '规则标识符'
    },
    label: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '规则显示名称'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '规则描述'
    },
    enabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: '是否启用'
    },
    statusCheck: {
      type: DataTypes.JSONB,
      allowNull: true,
      field: 'status_check',
      comment: '检查的状态列表'
    },
    checkField: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'check_field',
      comment: '检查的日期字段'
    },
    thresholdDays: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'threshold_days',
      comment: '天数阈值'
    },
    maxScore: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'max_score',
      comment: '最高分阈值'
    },
    requireAssigned: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'require_assigned',
      comment: '是否要求已分配'
    },
    action: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'reclaim',
      comment: '动作类型: reclaim / warn'
    }
  }, {
    tableName: 'reclaim_rules',
    timestamps: true,
    underscored: true
  });

  return ReclaimRule;
};
