// 文件上传模型
module.exports = (sequelize, DataTypes) => {
  const FileUpload = sequelize.define('FileUpload', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    fileName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'file_name',
      comment: '文件名'
    },
    originalName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'original_name',
      comment: '原始文件名'
    },
    filePath: {
      type: DataTypes.STRING(500),
      allowNull: false,
      field: 'file_path',
      comment: '文件路径'
    },
    fileUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'file_url',
      comment: '文件URL'
    },
    fileType: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'file_type',
      comment: '文件类型'
    },
    fileSize: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'file_size',
      comment: '文件大小（字节）'
    },
    mimeType: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'mime_type',
      comment: 'MIME类型'
    },
    category: {
      type: DataTypes.ENUM('recording', 'screenshot', 'document', 'image', 'video', 'other'),
      allowNull: false,
      defaultValue: 'other',
      comment: '文件分类'
    },
    relatedType: {
      type: DataTypes.ENUM('call_record', 'client', 'lead', 'task', 'other'),
      allowNull: true,
      field: 'related_type',
      comment: '关联类型'
    },
    relatedId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'related_id',
      comment: '关联ID'
    },
    uploadedBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'uploaded_by',
      comment: '上传人'
    }
  }, {
    tableName: 'file_uploads',
    timestamps: true,
    underscored: true
  });

  FileUpload.associate = function(models) {
    FileUpload.belongsTo(models.User, {
      foreignKey: 'uploadedBy',
      as: 'uploader'
    });
  };

  return FileUpload;
};








