module.exports = (sequelize, DataTypes) => {
  const CustomerFile = sequelize.define('CustomerFile', {
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
    followUpId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'follow_up_id',
      comment: '关联的跟进记录ID'
    },
    fileName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'file_name',
      comment: '文件名'
    },
    filePath: {
      type: DataTypes.STRING(500),
      allowNull: false,
      field: 'file_path',
      comment: '文件路径'
    },
    fileSize: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'file_size',
      comment: '文件大小（字节）'
    },
    fileType: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'file_type',
      comment: '文件类型'
    },
    category: {
      type: DataTypes.ENUM('contract', 'invoice', 'certificate', 'report', 'other'),
      allowNull: false,
      defaultValue: 'other',
      comment: '文件分类'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '文件描述'
    },
    uploadedBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'uploaded_by',
      comment: '上传人ID'
    }
  }, {
    tableName: 'customer_files',
    timestamps: true,
    underscored: true
  });

  CustomerFile.associate = function(models) {
    CustomerFile.belongsTo(models.Client, {
      foreignKey: 'clientId',
      as: 'client'
    });
    CustomerFile.belongsTo(models.User, {
      foreignKey: 'uploadedBy',
      as: 'uploader'
    });
    CustomerFile.belongsTo(models.FollowUp, {
      foreignKey: 'followUpId',
      as: 'followUp'
    });
  };

  return CustomerFile;
};

