// 客户公海池模型
module.exports = (sequelize, DataTypes) => {
  const CustomerPool = sequelize.define('CustomerPool', {
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
    enteredAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'entered_at',
      comment: '进入公海时间'
    },
    enteredReason: {
      type: DataTypes.ENUM('unassigned', 'inactive', 'returned', 'transferred'),
      allowNull: false,
      field: 'entered_reason',
      comment: '进入原因'
    },
    previousOwnerId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'previous_owner_id',
      comment: '之前的负责人'
    },
    claimedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'claimed_by',
      comment: '领取人'
    },
    claimedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'claimed_at',
      comment: '领取时间'
    },
    status: {
      type: DataTypes.ENUM('available', 'claimed', 'locked'),
      allowNull: false,
      defaultValue: 'available',
      comment: '状态'
    },
    priority: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '优先级（数字越大越优先）'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '备注'
    }
  }, {
    tableName: 'customer_pool',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['client_id']
      },
      {
        fields: ['status']
      },
      {
        fields: ['entered_at']
      }
    ]
  });

  CustomerPool.associate = function(models) {
    CustomerPool.belongsTo(models.Client, {
      foreignKey: 'clientId',
      as: 'client'
    });
    CustomerPool.belongsTo(models.User, {
      foreignKey: 'previousOwnerId',
      as: 'previousOwner'
    });
    CustomerPool.belongsTo(models.User, {
      foreignKey: 'claimedBy',
      as: 'claimer'
    });
  };

  return CustomerPool;
};











