// SalesStage Model
module.exports = (sequelize, DataTypes) => {
  const SalesStage = sequelize.define('SalesStage', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'sort_order'
    },
    color: {
      type: DataTypes.STRING(20),
      allowNull: true,
      defaultValue: '#1890ff'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: true,
      field: 'is_active'
    }
  }, {
    tableName: 'sales_stages',
    timestamps: true,
    underscored: true
  });

  SalesStage.associate = function(models) {
    SalesStage.hasMany(models.SalesOpportunity, {
      foreignKey: 'stageId',
      as: 'opportunities'
    });
  };

  return SalesStage;
};












