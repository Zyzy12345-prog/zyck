// 客户标签模型
module.exports = (sequelize, DataTypes) => {
  const CustomerTag = sequelize.define('CustomerTag', {
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
      type: DataTypes.ENUM('industry', 'scale', 'status', 'behavior', 'custom'),
      allowNull: false,
      defaultValue: 'custom',
      comment: '标签分类'
    },
    description: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: '标签描述'
    },
    isSystem: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_system',
      comment: '是否系统标签'
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'sort_order',
      comment: '排序'
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'created_by',
      comment: '创建人'
    }
  }, {
    tableName: 'customer_tags',
    timestamps: true,
    underscored: true
  });

  CustomerTag.associate = function(models) {
    CustomerTag.belongsTo(models.User, {
      foreignKey: 'createdBy',
      as: 'creator'
    });
    CustomerTag.belongsToMany(models.Client, {
      through: models.ClientTagRelation,
      foreignKey: 'tagId',
      otherKey: 'clientId',
      as: 'clients'
    });
    // 注意：CustomerTag 通过 client_tag_relations 关联 Client
    // LeadTag 通过 lead_tag_relations 关联 CustomerLead
    // 两者使用不同的关联表，互不干扰
  };

  return CustomerTag;
};
