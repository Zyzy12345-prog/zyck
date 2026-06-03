// 客户标签关系模型
module.exports = (sequelize, DataTypes) => {
  const ClientTagRelation = sequelize.define('ClientTagRelation', {
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
    tagId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'tag_id',
      comment: '标签ID'
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'created_by',
      comment: '创建人'
    }
  }, {
    tableName: 'client_tag_relations',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['client_id', 'tag_id']
      }
    ]
  });

  ClientTagRelation.associate = function(models) {
    ClientTagRelation.belongsTo(models.Client, {
      foreignKey: 'clientId',
      as: 'client'
    });
    ClientTagRelation.belongsTo(models.CustomerTag, {
      foreignKey: 'tagId',
      as: 'tag'
    });
    ClientTagRelation.belongsTo(models.User, {
      foreignKey: 'createdBy',
      as: 'creator'
    });
  };

  return ClientTagRelation;
};
