const { Client, Assignment, User, IndustryCategory, FollowUp, CustomerFile, CustomerDiscussion, FollowUpComment, FollowUpReminder } = require('../models');
const { Op } = require('sequelize');
const XLSX = require('xlsx');
const industryMatchingService = require('../services/IndustryMatchingService');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// 获取客户列表
exports.getClients = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      industryId,
      taxStatus,
      userId
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};

    // 搜索条件
    if (search) {
      where[Op.or] = [
        { companyName: { [Op.like]: `%${search}%` } },
        { contactPerson: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } }
      ];
    }

    if (industryId) {
      where.industryId = industryId;
    }

    if (taxStatus) {
      where.taxStatus = taxStatus;
    }

    // 如果指定了userId，只返回分配给该用户的客户
    if (userId) {
      const assignments = await Assignment.findAll({
        where: { userId, status: 'active' },
        attributes: ['clientId']
      });
      const clientIds = assignments.map(a => a.clientId);
      where.id = { [Op.in]: clientIds };
    }

    const { count, rows } = await Client.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: Assignment,
          as: 'assignments',
          where: { status: 'active' },
          required: false,
          include: [{
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'email']
          }]
        },
        {
          model: IndustryCategory,
          as: 'industry',
          required: false
        }
      ]
    });

    res.json({
      success: true,
      data: {
        clients: rows,
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

// 获取单个客户详情（360度视图）
exports.getClient = async (req, res, next) => {
  try {
    const { id } = req.params;

    const client = await Client.findByPk(id, {
      include: [
        {
          model: Assignment,
          as: 'assignments',
          include: [{
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'email']
          }]
        },
        {
          model: IndustryCategory,
          as: 'industry',
          required: false
        },
        {
          model: FollowUp,
          as: 'followUps',
          limit: 20,
          order: [['followTime', 'DESC']],
          include: [{
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'email']
          }]
        },
        {
          model: CustomerFile,
          as: 'files',
          limit: 50,
          order: [['createdAt', 'DESC']],
          include: [{
            model: User,
            as: 'uploader',
            attributes: ['id', 'username', 'email']
          }]
        },
        {
          model: CustomerDiscussion,
          as: 'discussions',
          where: { parentId: null },
          required: false,
          limit: 20,
          order: [['createdAt', 'DESC']],
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'username', 'email']
            },
            {
              model: CustomerDiscussion,
              as: 'replies',
              include: [{
                model: User,
                as: 'user',
                attributes: ['id', 'username', 'email']
              }]
            }
          ]
        }
      ]
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: '客户不存在'
      });
    }

    res.json({
      success: true,
      data: client
    });
  } catch (error) {
    console.error('获取客户详情失败:', error);
    next(error);
  }
};

// 创建客户
exports.createClient = async (req, res, next) => {
  try {
    // 准备客户数据
    const clientData = {
      companyName: req.body.companyName,
      contactPerson: req.body.contactPerson,
      phone: req.body.phone,
      email: req.body.email,
      registeredCapital: req.body.registeredCapital,
      taxStatus: req.body.taxStatus || 'pending',
      remarks: req.body.remarks
    };
    
    // 如果提供了行业文本，进行智能匹配
    if (req.body.industry && typeof req.body.industry === 'string') {
      try {
        const matchResult = await industryMatchingService.matchIndustry(req.body.industry);
        
        if (matchResult.matched) {
          clientData.industryId = matchResult.matchedIndustry.id;
          clientData.originalIndustry = req.body.industry;
          console.log(`行业匹配成功: "${req.body.industry}" -> "${matchResult.matchedIndustry.name}"`);
        } else {
          // 未匹配到，只保存原始文本
          clientData.originalIndustry = req.body.industry;
          clientData.industryId = null;
          console.log(`行业未匹配: "${req.body.industry}"`);
        }
      } catch (matchError) {
        console.error('行业匹配失败:', matchError);
        // 匹配失败时，只保存原始文本
        clientData.originalIndustry = req.body.industry;
        clientData.industryId = null;
      }
    }

    // 创建客户
    const client = await Client.create(clientData);

    // 如果指定了userId，自动创建分配记录
    if (req.body.userId) {
      await Assignment.create({
        clientId: client.id,
        userId: req.body.userId,
        assignedBy: req.user.id
      });
    }

    // 获取完整的客户信息（包含关联）
    const createdClient = await Client.findByPk(client.id, {
      include: [
        {
          model: Assignment,
          as: 'assignments',
          include: [{
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'email']
          }]
        },
        {
          model: IndustryCategory,
          as: 'industry',
          required: false
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: '客户创建成功',
      data: createdClient
    });
  } catch (error) {
    console.error('创建客户失败:', error);
    next(error);
  }
};

// 更新客户
exports.updateClient = async (req, res, next) => {
  try {
    const { id } = req.params;
    const client = await Client.findByPk(id);

    if (!client) {
      return res.status(404).json({
        success: false,
        message: '客户不存在'
      });
    }

    console.log('收到的更新数据:', req.body);

    // 准备更新数据 - 包含所有可能的字段
    const updateData = {
      companyName: req.body.companyName,
      contactPerson: req.body.contactPerson,
      phone: req.body.phone,
      email: req.body.email,
      wechat: req.body.wechat,
      address: req.body.address,
      website: req.body.website,
      companyScale: req.body.companyScale,
      employeeCount: req.body.employeeCount,
      registeredCapital: req.body.registeredCapital,
      establishedDate: req.body.establishedDate,
      legalRepresentative: req.body.legalRepresentative,
      customerLevel: req.body.customerLevel,
      customerSource: req.body.customerSource,
      taxStatus: req.body.taxStatus,
      businessScope: req.body.businessScope,
      remarks: req.body.remarks
    };

    // 移除 undefined 的字段
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    console.log('处理后的更新数据:', updateData);
    
    // 如果更新了行业文本，进行智能匹配
    if (req.body.industry && typeof req.body.industry === 'string') {
      try {
        const matchResult = await industryMatchingService.matchIndustry(req.body.industry);
        
        if (matchResult.matched) {
          updateData.industryId = matchResult.matchedIndustry.id;
          updateData.originalIndustry = req.body.industry;
        } else {
          updateData.originalIndustry = req.body.industry;
          updateData.industryId = null;
        }
      } catch (matchError) {
        console.error('行业匹配失败:', matchError);
        updateData.originalIndustry = req.body.industry;
        updateData.industryId = null;
      }
    }

    await client.update(updateData);

    const updatedClient = await Client.findByPk(id, {
      include: [
        {
          model: Assignment,
          as: 'assignments',
          include: [{
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'email']
          }]
        },
        {
          model: IndustryCategory,
          as: 'industry',
          required: false
        }
      ]
    });

    res.json({
      success: true,
      message: '客户更新成功',
      data: updatedClient
    });
  } catch (error) {
    console.error('更新客户失败:', error);
    console.error('错误详情:', error.message);
    if (error.errors) {
      console.error('验证错误:', error.errors.map(e => ({ field: e.path, message: e.message })));
    }
    next(error);
  }
};

// 删除客户
exports.deleteClient = async (req, res, next) => {
  try {
    const { id } = req.params;
    const client = await Client.findByPk(id);

    if (!client) {
      return res.status(404).json({
        success: false,
        message: '客户不存在'
      });
    }

    await client.destroy();

    res.json({
      success: true,
      message: '客户删除成功'
    });
  } catch (error) {
    next(error);
  }
};

// 分配客户给员工
exports.assignClient = async (req, res, next) => {
  try {
    const { clientId, userId } = req.body;

    // 检查客户是否存在
    const client = await Client.findByPk(clientId);
    if (!client) {
      return res.status(404).json({
        success: false,
        message: '客户不存在'
      });
    }

    // 检查用户是否存在
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 将之前的分配标记为transferred
    await Assignment.update(
      { status: 'transferred' },
      { where: { clientId, status: 'active' } }
    );

    // 创建新的分配记录
    const assignment = await Assignment.create({
      clientId,
      userId,
      assignedBy: req.user.id,
      notes: req.body.notes
    });

    res.status(201).json({
      success: true,
      message: '客户分配成功',
      data: assignment
    });
  } catch (error) {
    next(error);
  }
};

// 智能匹配行业
exports.matchIndustry = async (req, res, next) => {
  try {
    const { text, threshold = 0.7 } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        message: '请提供行业文本'
      });
    }

    const result = await industryMatchingService.matchIndustry(text, threshold);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// 批量匹配行业
exports.batchMatchIndustries = async (req, res, next) => {
  try {
    const { texts, threshold = 0.7 } = req.body;

    if (!Array.isArray(texts) || texts.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请提供行业文本数组'
      });
    }

    const results = await industryMatchingService.batchMatchIndustries(texts, threshold);
    const statistics = industryMatchingService.getMatchStatistics(results);

    res.json({
      success: true,
      data: {
        results,
        statistics
      }
    });
  } catch (error) {
    next(error);
  }
};

// 导入客户（Excel）- 增强版，支持智能行业匹配
exports.importClients = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '请上传Excel文件'
      });
    }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    const clients = [];
    const errors = [];
    const industryMatchResults = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      try {
        const clientData = {
          companyName: row['公司名称'] || row['companyName'],
          contactPerson: row['联系人'] || row['contactPerson'],
          phone: row['电话'] || row['phone'],
          email: row['邮箱'] || row['email'],
          registeredCapital: row['注册资本'] || row['registeredCapital'] || 0,
          taxStatus: row['财税状态'] || row['taxStatus'] || 'pending',
          remarks: row['备注'] || row['remarks']
        };

        // 智能匹配行业
        const industryText = row['行业'] || row['industry'];
        if (industryText) {
          const matchResult = await industryMatchingService.matchIndustry(industryText);
          
          if (matchResult.matched) {
            clientData.industryId = matchResult.matchedIndustry.id;
            clientData.originalIndustry = industryText;
            
            industryMatchResults.push({
              row: i + 2,
              originalText: industryText,
              matchedIndustry: matchResult.matchedIndustry.name,
              matchType: matchResult.matchType,
              confidence: matchResult.confidence
            });
          } else {
            clientData.originalIndustry = industryText;
            clientData.industryId = null;
            
            industryMatchResults.push({
              row: i + 2,
              originalText: industryText,
              matchedIndustry: null,
              matchType: null,
              confidence: 0,
              suggestions: matchResult.suggestions
            });
          }
        }

        const client = await Client.create(clientData);
        clients.push(client);
      } catch (error) {
        errors.push({
          row: i + 2,
          data: row['公司名称'] || row['companyName'],
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      message: `成功导入${clients.length}条客户记录`,
      data: {
        imported: clients.length,
        failed: errors.length,
        errors,
        industryMatchResults
      }
    });
  } catch (error) {
    next(error);
  }
};

// 获取所有行业分类（树形结构）
exports.getIndustries = async (req, res, next) => {
  try {
    const tree = await IndustryCategory.getTree();

    res.json({
      success: true,
      data: tree
    });
  } catch (error) {
    next(error);
  }
};

// 获取行业分类列表（扁平）
exports.getIndustriesList = async (req, res, next) => {
  try {
    const { level, parentId } = req.query;
    const where = { isActive: true };

    if (level) {
      where.level = parseInt(level);
    }

    if (parentId !== undefined) {
      where.parentId = parseInt(parentId);
    }

    const industries = await IndustryCategory.findAll({
      where,
      order: [['sortOrder', 'ASC'], ['id', 'ASC']]
    });

    res.json({
      success: true,
      data: industries
    });
  } catch (error) {
    next(error);
  }
};

// 更新行业关键词（管理员功能）
exports.updateIndustryKeywords = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { keywords } = req.body;

    if (!Array.isArray(keywords)) {
      return res.status(400).json({
        success: false,
        message: '关键词必须是数组'
      });
    }

    const industry = await industryMatchingService.updateIndustryKeywords(
      parseInt(id),
      keywords
    );

    res.json({
      success: true,
      message: '关键词更新成功',
      data: industry
    });
  } catch (error) {
    next(error);
  }
};

// ==================== 跟进记录管理 ====================

// 获取客户跟进记录列表（增强版）
exports.getFollowUps = async (req, res, next) => {
  try {
    const { clientId } = req.params;
    const { page = 1, limit = 20, status, result } = req.query;

    const offset = (page - 1) * limit;
    const where = { clientId };

    if (status) {
      where.status = status;
    }
    if (result) {
      where.result = result;
    }

    const { count, rows } = await FollowUp.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['followTime', 'DESC']],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'email']
        },
        {
          model: FollowUpComment,
          as: 'comments',
          include: [{
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'email']
          }],
          order: [['createdAt', 'ASC']]
        },
        {
          model: CustomerFile,
          as: 'files',
          attributes: ['id', 'fileName', 'filePath', 'fileSize', 'fileType']
        }
      ]
    });

    res.json({
      success: true,
      data: {
        followUps: rows,
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

// 创建跟进记录（增强版，支持文件上传）
exports.createFollowUp = async (req, res, next) => {
  try {
    const { clientId } = req.params;

    // 检查客户是否存在
    const client = await Client.findByPk(clientId);
    if (!client) {
      return res.status(404).json({
        success: false,
        message: '客户不存在'
      });
    }

    // 创建跟进记录
    const followUp = await FollowUp.create({
      clientId,
      userId: req.user.id,
      followType: req.body.followType,
      followTime: req.body.followTime || new Date(),
      content: req.body.content,
      nextFollowTime: req.body.nextFollowTime,
      status: req.body.status || 'completed',
      result: req.body.result,
      attachments: req.body.attachments
    });

    // 如果设置了下次跟进时间，创建提醒
    if (req.body.nextFollowTime) {
      await FollowUpReminder.create({
        followUpId: followUp.id,
        userId: req.user.id,
        reminderType: 'system',
        reminderTime: new Date(req.body.nextFollowTime)
      });
    }

    // 获取完整的跟进记录信息
    const createdFollowUp = await FollowUp.findByPk(followUp.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'email']
        },
        {
          model: FollowUpComment,
          as: 'comments'
        },
        {
          model: CustomerFile,
          as: 'files'
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: '跟进记录创建成功',
      data: createdFollowUp
    });
  } catch (error) {
    next(error);
  }
};

// 更新跟进记录
exports.updateFollowUp = async (req, res, next) => {
  try {
    const { id } = req.params;

    const followUp = await FollowUp.findByPk(id);
    if (!followUp) {
      return res.status(404).json({
        success: false,
        message: '跟进记录不存在'
      });
    }

    // 更新跟进记录
    await followUp.update({
      followType: req.body.followType,
      followTime: req.body.followTime,
      content: req.body.content,
      nextFollowTime: req.body.nextFollowTime,
      status: req.body.status,
      result: req.body.result,
      attachments: req.body.attachments
    });

    // 如果更新了下次跟进时间，更新或创建提醒
    if (req.body.nextFollowTime) {
      const existingReminder = await FollowUpReminder.findOne({
        where: { followUpId: id, status: 'pending' }
      });

      if (existingReminder) {
        await existingReminder.update({
          reminderTime: new Date(req.body.nextFollowTime)
        });
      } else {
        await FollowUpReminder.create({
          followUpId: id,
          userId: followUp.userId,
          reminderType: 'system',
          reminderTime: new Date(req.body.nextFollowTime)
        });
      }
    }

    const updatedFollowUp = await FollowUp.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'email']
        },
        {
          model: FollowUpComment,
          as: 'comments',
          include: [{
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'email']
          }]
        },
        {
          model: CustomerFile,
          as: 'files'
        }
      ]
    });

    res.json({
      success: true,
      message: '跟进记录更新成功',
      data: updatedFollowUp
    });
  } catch (error) {
    next(error);
  }
};

// 删除跟进记录
exports.deleteFollowUp = async (req, res, next) => {
  try {
    const { id } = req.params;

    const followUp = await FollowUp.findByPk(id);
    if (!followUp) {
      return res.status(404).json({
        success: false,
        message: '跟进记录不存在'
      });
    }

    await followUp.destroy();

    res.json({
      success: true,
      message: '跟进记录删除成功'
    });
  } catch (error) {
    next(error);
  }
};

// ==================== 跟进记录评论管理 ====================

// 获取跟进记录的评论列表
exports.getFollowUpComments = async (req, res, next) => {
  try {
    const { followUpId } = req.params;

    const comments = await FollowUpComment.findAll({
      where: { followUpId },
      order: [['createdAt', 'ASC']],
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'email']
      }]
    });

    res.json({
      success: true,
      data: comments
    });
  } catch (error) {
    next(error);
  }
};

// 添加跟进记录评论
exports.createFollowUpComment = async (req, res, next) => {
  try {
    const { followUpId } = req.params;

    // 检查跟进记录是否存在
    const followUp = await FollowUp.findByPk(followUpId);
    if (!followUp) {
      return res.status(404).json({
        success: false,
        message: '跟进记录不存在'
      });
    }

    const comment = await FollowUpComment.create({
      followUpId,
      userId: req.user.id,
      content: req.body.content
    });

    const createdComment = await FollowUpComment.findByPk(comment.id, {
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'email']
      }]
    });

    res.status(201).json({
      success: true,
      message: '评论添加成功',
      data: createdComment
    });
  } catch (error) {
    next(error);
  }
};

// 删除跟进记录评论
exports.deleteFollowUpComment = async (req, res, next) => {
  try {
    const { id } = req.params;

    const comment = await FollowUpComment.findByPk(id);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: '评论不存在'
      });
    }

    // 只允许评论作者或管理员删除
    if (comment.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '无权删除此评论'
      });
    }

    await comment.destroy();

    res.json({
      success: true,
      message: '评论删除成功'
    });
  } catch (error) {
    next(error);
  }
};

// ==================== 客户文件管理 ====================

// 配置文件上传
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/customer-files');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    // 允许的文件类型
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|zip|rar/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('不支持的文件类型'));
    }
  }
});

// 获取客户文件列表
exports.getCustomerFiles = async (req, res, next) => {
  try {
    const { clientId } = req.params;
    const { category, followUpId } = req.query;

    const where = { clientId };
    if (category) {
      where.category = category;
    }
    if (followUpId) {
      where.followUpId = followUpId;
    }

    const files = await CustomerFile.findAll({
      where,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'uploader',
          attributes: ['id', 'username', 'email']
        },
        {
          model: FollowUp,
          as: 'followUp',
          attributes: ['id', 'followType', 'followTime']
        }
      ]
    });

    res.json({
      success: true,
      data: files
    });
  } catch (error) {
    next(error);
  }
};

// 上传客户文件（增强版）
exports.uploadCustomerFile = async (req, res, next) => {
  // 使用 multer 中间件
  upload.single('file')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }

    try {
      const { clientId } = req.params;

      // 检查客户是否存在
      const client = await Client.findByPk(clientId);
      if (!client) {
        return res.status(404).json({
          success: false,
          message: '客户不存在'
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: '请上传文件'
        });
      }

      const file = await CustomerFile.create({
        clientId,
        followUpId: req.body.followUpId || null,
        fileName: req.file.originalname,
        filePath: req.file.path,
        fileSize: req.file.size,
        fileType: req.file.mimetype,
        category: req.body.category || 'other',
        description: req.body.description,
        uploadedBy: req.user.id
      });

      const createdFile = await CustomerFile.findByPk(file.id, {
        include: [{
          model: User,
          as: 'uploader',
          attributes: ['id', 'username', 'email']
        }]
      });

      res.status(201).json({
        success: true,
        message: '文件上传成功',
        data: createdFile
      });
    } catch (error) {
      next(error);
    }
  });
};

// 下载客户文件
exports.downloadCustomerFile = async (req, res, next) => {
  try {
    const { id } = req.params;

    const file = await CustomerFile.findByPk(id);
    if (!file) {
      return res.status(404).json({
        success: false,
        message: '文件不存在'
      });
    }

    res.download(file.filePath, file.fileName);
  } catch (error) {
    next(error);
  }
};

// 删除客户文件
exports.deleteCustomerFile = async (req, res, next) => {
  try {
    const { id } = req.params;

    const file = await CustomerFile.findByPk(id);
    if (!file) {
      return res.status(404).json({
        success: false,
        message: '文件不存在'
      });
    }

    // 删除物理文件
    try {
      await fs.unlink(file.filePath);
    } catch (error) {
      console.error('删除物理文件失败:', error);
    }

    await file.destroy();

    res.json({
      success: true,
      message: '文件删除成功'
    });
  } catch (error) {
    next(error);
  }
};

// ==================== 内部讨论管理 ====================

// 获取客户讨论列表
exports.getDiscussions = async (req, res, next) => {
  try {
    const { clientId } = req.params;

    const discussions = await CustomerDiscussion.findAll({
      where: { clientId, parentId: null },
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'email']
        },
        {
          model: CustomerDiscussion,
          as: 'replies',
          order: [['createdAt', 'ASC']],
          include: [{
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'email']
          }]
        }
      ]
    });

    res.json({
      success: true,
      data: discussions
    });
  } catch (error) {
    next(error);
  }
};

// 创建讨论
exports.createDiscussion = async (req, res, next) => {
  try {
    const { clientId } = req.params;

    // 检查客户是否存在
    const client = await Client.findByPk(clientId);
    if (!client) {
      return res.status(404).json({
        success: false,
        message: '客户不存在'
      });
    }

    const discussion = await CustomerDiscussion.create({
      clientId,
      userId: req.user.id,
      content: req.body.content,
      parentId: req.body.parentId || null
    });

    const createdDiscussion = await CustomerDiscussion.findByPk(discussion.id, {
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'email']
      }]
    });

    res.status(201).json({
      success: true,
      message: '讨论创建成功',
      data: createdDiscussion
    });
  } catch (error) {
    next(error);
  }
};

// 删除讨论
exports.deleteDiscussion = async (req, res, next) => {
  try {
    const { id } = req.params;

    const discussion = await CustomerDiscussion.findByPk(id);
    if (!discussion) {
      return res.status(404).json({
        success: false,
        message: '讨论不存在'
      });
    }

    await discussion.destroy();

    res.json({
      success: true,
      message: '讨论删除成功'
    });
  } catch (error) {
    next(error);
  }
};

// ==================== 跟进提醒管理 ====================

// 获取待处理的提醒列表
exports.getPendingReminders = async (req, res, next) => {
  try {
    const { userId } = req.query;

    const where = {
      status: 'pending',
      reminderTime: {
        [Op.lte]: new Date()
      }
    };

    if (userId) {
      where.userId = userId;
    }

    const reminders = await FollowUpReminder.findAll({
      where,
      order: [['reminderTime', 'ASC']],
      include: [
        {
          model: FollowUp,
          as: 'followUp',
          include: [
            {
              model: Client,
              as: 'client',
              attributes: ['id', 'companyName', 'contactPerson', 'phone']
            }
          ]
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'email']
        }
      ]
    });

    res.json({
      success: true,
      data: reminders
    });
  } catch (error) {
    next(error);
  }
};

// 获取用户的所有提醒（包括未来的）
exports.getUserReminders = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate, status } = req.query;

    const where = { userId };

    if (startDate && endDate) {
      where.reminderTime = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    if (status) {
      where.status = status;
    }

    const reminders = await FollowUpReminder.findAll({
      where,
      order: [['reminderTime', 'ASC']],
      include: [
        {
          model: FollowUp,
          as: 'followUp',
          include: [
            {
              model: Client,
              as: 'client',
              attributes: ['id', 'companyName', 'contactPerson', 'phone']
            }
          ]
        }
      ]
    });

    res.json({
      success: true,
      data: reminders
    });
  } catch (error) {
    next(error);
  }
};

// 标记提醒为已发送
exports.markReminderAsSent = async (req, res, next) => {
  try {
    const { id } = req.params;

    const reminder = await FollowUpReminder.findByPk(id);
    if (!reminder) {
      return res.status(404).json({
        success: false,
        message: '提醒不存在'
      });
    }

    await reminder.update({
      status: 'sent',
      sentAt: new Date()
    });

    // 同时更新跟进记录的提醒状态
    await FollowUp.update(
      { isReminded: true, remindedAt: new Date() },
      { where: { id: reminder.followUpId } }
    );

    res.json({
      success: true,
      message: '提醒已标记为已发送'
    });
  } catch (error) {
    next(error);
  }
};

// 获取日历数据（用于日历视图）
exports.getCalendarData = async (req, res, next) => {
  try {
    const { startDate, endDate, userId } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: '请提供开始和结束日期'
      });
    }

    const where = {
      nextFollowTime: {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      }
    };

    if (userId) {
      where.userId = userId;
    }

    const followUps = await FollowUp.findAll({
      where,
      include: [
        {
          model: Client,
          as: 'client',
          attributes: ['id', 'companyName', 'contactPerson', 'phone']
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username']
        }
      ]
    });

    // 转换为日历事件格式
    const events = followUps.map(followUp => ({
      id: followUp.id,
      title: `跟进: ${followUp.client.companyName}`,
      start: followUp.nextFollowTime,
      end: followUp.nextFollowTime,
      type: followUp.followType,
      clientId: followUp.clientId,
      clientName: followUp.client.companyName,
      contactPerson: followUp.client.contactPerson,
      phone: followUp.client.phone,
      assignedTo: followUp.user.username,
      description: followUp.content.substring(0, 100) + '...'
    }));

    res.json({
      success: true,
      data: events
    });
  } catch (error) {
    next(error);
  }
};
