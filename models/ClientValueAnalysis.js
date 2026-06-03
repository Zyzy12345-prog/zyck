// ClientValueAnalysis Model
module.exports = (sequelize, DataTypes) => {
  const ClientValueAnalysis = sequelize.define('ClientValueAnalysis', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    clientId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'client_id'
    },
    totalRevenue: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      defaultValue: 0,
      field: 'total_revenue'
    },
    totalOrders: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
      field: 'total_orders'
    },
    avgOrderAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      defaultValue: 0,
      field: 'avg_order_amount'
    },
    lastOrderDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'last_order_date'
    },
    followUpCount: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
      field: 'follow_up_count'
    },
    lastFollowUpDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'last_follow_up_date'
    },
    customerLifetimeDays: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
      field: 'customer_lifetime_days'
    },
    churnRiskScore: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
      field: 'churn_risk_score'
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
      field: 'updated_at'
    }
  }, {
    tableName: 'client_value_analysis',
    timestamps: false
  });

  ClientValueAnalysis.associate = function(models) {
    ClientValueAnalysis.belongsTo(models.Client, {
      foreignKey: 'clientId',
      as: 'client'
    });
  };

  return ClientValueAnalysis;
};












