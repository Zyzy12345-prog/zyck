module.exports = (sequelize, DataTypes) => {
  const FollowUpComment = sequelize.define('FollowUpComment', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    followUpId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'follow_up_id',
      comment: '跟进记录ID'
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id',
      comment: '评论人ID'
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: '评论内容'
    }
  }, {
    tableName: 'follow_up_comments',
    timestamps: true,
    underscored: true
  });

  FollowUpComment.associate = function(models) {
    FollowUpComment.belongsTo(models.FollowUp, {
      foreignKey: 'followUpId',
      as: 'followUp'
    });
    FollowUpComment.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
  };

  return FollowUpComment;
};














