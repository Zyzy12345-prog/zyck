module.exports = (sequelize, DataTypes) => {
  const Assignment = sequelize.define('Assignment', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    clientId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'client_id',
      references: {
        model: 'clients',
        key: 'id'
      }
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    assignedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'assigned_by',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    assignedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'assigned_at',
      defaultValue: DataTypes.NOW
    },
    status: {
      type: DataTypes.ENUM('active', 'completed', 'transferred'),
      allowNull: false,
      defaultValue: 'active'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'assignments',
    timestamps: true
  });

  Assignment.associate = function(models) {
    Assignment.belongsTo(models.Client, {
      foreignKey: 'clientId',
      as: 'client'
    });
    Assignment.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
    Assignment.belongsTo(models.User, {
      foreignKey: 'assignedBy',
      as: 'assigner'
    });
  };

  return Assignment;
};
