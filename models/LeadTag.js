// 线索标签模型
module.exports = (sequelize, DataTypes) => {
  const LeadTag = sequelize.define('LeadTag', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      comment: '标签名称'
    },
    color: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: '#1890ff',
      comment: '标签颜色'
    },
    category: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '标签分类'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '标签描述'
    },
    isSystem: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      field: 'is_system',
      defaultValue: false,
      comment: '是否系统标签'
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'sort_order',
      defaultValue: 0,
      comment: '排序顺序'
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'created_by',
      comment: '创建人'
    }
  }, {
    tableName: 'lead_tags',
    timestamps: true,
    underscored: true
  });

  LeadTag.associate = function(models) {
    LeadTag.belongsTo(models.User, {
      foreignKey: 'createdBy',
      as: 'creator'
    });
    LeadTag.belongsToMany(models.CustomerLead, {
      through: 'lead_tag_relations',
      foreignKey: 'tagId',
      otherKey: 'leadId',
      as: 'leads'
    });
  };

  return LeadTag;
};










