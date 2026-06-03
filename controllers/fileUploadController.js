const { FileUpload } = require('../models');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 确保上传目录存在
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 配置 multer 存储
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const category = req.body.category || 'other';
    const categoryDir = path.join(uploadDir, category);
    
    if (!fs.existsSync(categoryDir)) {
      fs.mkdirSync(categoryDir, { recursive: true });
    }
    
    cb(null, categoryDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// 文件过滤器
const fileFilter = (req, file, cb) => {
  // 允许的文件类型
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'audio/mpeg',
    'audio/wav',
    'audio/mp3',
    'video/mp4',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('不支持的文件类型'), false);
  }
};

// 配置 multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  }
});

// 上传单个文件
exports.uploadSingle = upload.single('file');

// 上传多个文件
exports.uploadMultiple = upload.array('files', 10);

// 处理文件上传
exports.handleFileUpload = async (req, res, next) => {
  try {
    if (!req.file && !req.files) {
      return res.status(400).json({
        success: false,
        message: '没有上传文件'
      });
    }

    const files = req.files || [req.file];
    const { category = 'other', relatedType, relatedId } = req.body;
    
    const uploadedFiles = [];

    for (const file of files) {
      const fileUrl = `/uploads/${category}/${file.filename}`;
      
      const fileRecord = await FileUpload.create({
        fileName: file.filename,
        originalName: file.originalname,
        filePath: file.path,
        fileUrl: fileUrl,
        fileType: path.extname(file.originalname).substring(1),
        fileSize: file.size,
        mimeType: file.mimetype,
        category: category,
        relatedType: relatedType || null,
        relatedId: relatedId || null,
        uploadedBy: req.user.id
      });

      uploadedFiles.push(fileRecord);
    }

    res.json({
      success: true,
      message: '文件上传成功',
      data: uploadedFiles.length === 1 ? uploadedFiles[0] : uploadedFiles
    });
  } catch (error) {
    next(error);
  }
};

// 获取文件列表
exports.getFiles = async (req, res, next) => {
  try {
    const { category, relatedType, relatedId, page = 1, limit = 20 } = req.query;
    const where = {};

    if (category) where.category = category;
    if (relatedType) where.relatedType = relatedType;
    if (relatedId) where.relatedId = relatedId;

    const offset = (page - 1) * limit;

    const { count, rows } = await FileUpload.findAndCountAll({
      where,
      include: [
        {
          model: require('../models').User,
          as: 'uploader',
          attributes: ['id', 'username', 'email']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    res.json({
      success: true,
      data: {
        files: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// 获取单个文件信息
exports.getFile = async (req, res, next) => {
  try {
    const { id } = req.params;

    const file = await FileUpload.findByPk(id, {
      include: [
        {
          model: require('../models').User,
          as: 'uploader',
          attributes: ['id', 'username', 'email']
        }
      ]
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: '文件不存在'
      });
    }

    res.json({
      success: true,
      data: file
    });
  } catch (error) {
    next(error);
  }
};

// 删除文件
exports.deleteFile = async (req, res, next) => {
  try {
    const { id } = req.params;

    const file = await FileUpload.findByPk(id);

    if (!file) {
      return res.status(404).json({
        success: false,
        message: '文件不存在'
      });
    }

    // 检查权限
    if (file.uploadedBy !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '无权限删除此文件'
      });
    }

    // 删除物理文件
    if (fs.existsSync(file.filePath)) {
      fs.unlinkSync(file.filePath);
    }

    // 删除数据库记录
    await file.destroy();

    res.json({
      success: true,
      message: '文件删除成功'
    });
  } catch (error) {
    next(error);
  }
};

// 下载文件
exports.downloadFile = async (req, res, next) => {
  try {
    const { id } = req.params;

    const file = await FileUpload.findByPk(id);

    if (!file) {
      return res.status(404).json({
        success: false,
        message: '文件不存在'
      });
    }

    if (!fs.existsSync(file.filePath)) {
      return res.status(404).json({
        success: false,
        message: '文件已被删除'
      });
    }

    res.download(file.filePath, file.originalName);
  } catch (error) {
    next(error);
  }
};








