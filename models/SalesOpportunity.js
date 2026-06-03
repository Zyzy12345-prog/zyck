// SalesOpportunity Model
module.exports = (sequelize, DataTypes) => {
  const SalesOpportunity = sequelize.define('SalesOpportunity', {
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
    stageId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'stage_id'
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    expectedAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      defaultValue: 0,
      field: 'expected_amount'
    },
    probability: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 50,
      validate: {
        min: 0,
        max: 100
      }
    },
    expectedCloseDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'expected_close_date'
    },
    actualCloseDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'actual_close_date'
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: true,
      defaultValue: 'active'
    },
    lostReason: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'lost_reason'
    },
    assignedTo: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'assigned_to'
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'created_by'
    }
  }, {
    tableName: 'sales_opportunities',
    timestamps: true,
    underscored: true
  });

  SalesOpportunity.associate = function(models) {
    SalesOpportunity.belongsTo(models.Client, {
      foreignKey: 'clientId',
      as: 'client'
    });
    SalesOpportunity.belongsTo(models.SalesStage, {
      foreignKey: 'stageId',
      as: 'stage'
    });
    SalesOpportunity.belongsTo(models.User, {
      foreignKey: 'assignedTo',
      as: 'assignedUser'
    });
    SalesOpportunity.belongsTo(models.User, {
      foreignKey: 'createdBy',
      as: 'creator'
    });
    SalesOpportunity.hasMany(models.OpportunityStageHistory, {
      foreignKey: 'opportunityId',
      as: 'stageHistory'
    });
  };

  return SalesOpportunity;
};












