module.exports = (sequelize, DataTypes) => {
  const CustomerDiscussion = sequelize.define('CustomerDiscussion', {
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
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id',
      comment: '发言人ID'
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: '讨论内容'
    },
    parentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'parent_id',
      comment: '父评论ID'
    }
  }, {
    tableName: 'customer_discussions',
    timestamps: true,
    underscored: true
  });

  CustomerDiscussion.associate = function(models) {
    CustomerDiscussion.belongsTo(models.Client, {
      foreignKey: 'clientId',
      as: 'client'
    });
    CustomerDiscussion.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
    CustomerDiscussion.belongsTo(CustomerDiscussion, {
      foreignKey: 'parentId',
      as: 'parent'
    });
    CustomerDiscussion.hasMany(CustomerDiscussion, {
      foreignKey: 'parentId',
      as: 'replies'
    });
  };

  return CustomerDiscussion;
};














