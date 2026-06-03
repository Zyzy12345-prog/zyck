// OpportunityStageHistory Model
module.exports = (sequelize, DataTypes) => {
  const OpportunityStageHistory = sequelize.define('OpportunityStageHistory', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    opportunityId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'opportunity_id'
    },
    fromStageId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'from_stage_id'
    },
    toStageId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'to_stage_id'
    },
    changedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'changed_by'
    },
    changedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
      field: 'changed_at'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'opportunity_stage_history',
    timestamps: false
  });

  OpportunityStageHistory.associate = function(models) {
    OpportunityStageHistory.belongsTo(models.SalesOpportunity, {
      foreignKey: 'opportunityId',
      as: 'opportunity'
    });
    OpportunityStageHistory.belongsTo(models.SalesStage, {
      foreignKey: 'fromStageId',
      as: 'fromStage'
    });
    OpportunityStageHistory.belongsTo(models.SalesStage, {
      foreignKey: 'toStageId',
      as: 'toStage'
    });
    OpportunityStageHistory.belongsTo(models.User, {
      foreignKey: 'changedBy',
      as: 'user'
    });
  };

  return OpportunityStageHistory;
};












