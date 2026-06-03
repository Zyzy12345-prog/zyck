// ClientScore Model
module.exports = (sequelize, DataTypes) => {
  const ClientScore = sequelize.define('ClientScore', {
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
    totalScore: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
      field: 'total_score'
    },
    followUpScore: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
      field: 'follow_up_score'
    },
    dealAmountScore: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
      field: 'deal_amount_score'
    },
    interactionScore: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
      field: 'interaction_score'
    },
    potentialScore: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
      field: 'potential_score'
    },
    calculatedLevel: {
      type: DataTypes.STRING(1),
      allowNull: true,
      field: 'calculated_level'
    },
    calculationDate: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
      field: 'calculation_date'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'client_scores',
    timestamps: false
  });

  ClientScore.associate = function(models) {
    ClientScore.belongsTo(models.Client, {
      foreignKey: 'clientId',
      as: 'client'
    });
  };

  return ClientScore;
};












