const { CallScriptTemplate, User } = require('../models');
const { Op } = require('sequelize');

// 创建脚本模板
exports.createScriptTemplate = async (req, res, next) => {
  try {
    const {
      name,
      description,
      category,
      opening,
      mainContent,
      objectionHandling,
      closing
    } = req.body;

    const template = await CallScriptTemplate.create({
      name,
      description,
      category,
      opening,
      mainContent,
      objectionHandling,
      closing,
      createdBy: req.user.id
    });

    res.status(201).json({
      success: true,
      message: '脚本模板创建成功',
      data: template
    });
  } catch (error) {
    next(error);
  }
};

// 获取脚本模板列表
exports.getScriptTemplates = async (req, res, next) => {
  try {
    const { category, isActive, search } = req.query;
    const where = {};

    if (category) where.category = category;
    if (isActive !== undefined) where.isActive = isActive === 'true';
    
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }

    const templates = await CallScriptTemplate.findAll({
      where,
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'email']
        }
      ],
      order: [
        ['usageCount', 'DESC'],
        ['createdAt', 'DESC']
      ]
    });

    res.json({
      success: true,
      data: templates
    });
  } catch (error) {
    next(error);
  }
};

// 获取单个脚本模板
exports.getScriptTemplate = async (req, res, next) => {
  try {
    const { id } = req.params;

    const template = await CallScriptTemplate.findByPk(id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'email']
        }
      ]
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        message: '脚本模板不存在'
      });
    }

    // 增加使用次数
    await template.increment('usageCount');

    res.json({
      success: true,
      data: template
    });
  } catch (error) {
    next(error);
  }
};

// 更新脚本模板
exports.updateScriptTemplate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const template = await CallScriptTemplate.findByPk(id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: '脚本模板不存在'
      });
    }

    // 检查权限
    if (template.createdBy !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '无权限修改此模板'
      });
    }

    await template.update(req.body);

    res.json({
      success: true,
      message: '脚本模板更新成功',
      data: template
    });
  } catch (error) {
    next(error);
  }
};

// 删除脚本模板
exports.deleteScriptTemplate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const template = await CallScriptTemplate.findByPk(id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: '脚本模板不存在'
      });
    }

    // 检查权限
    if (template.createdBy !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '无权限删除此模板'
      });
    }

    await template.destroy();

    res.json({
      success: true,
      message: '脚本模板删除成功'
    });
  } catch (error) {
    next(error);
  }
};

// 切换模板状态
exports.toggleScriptTemplate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const template = await CallScriptTemplate.findByPk(id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: '脚本模板不存在'
      });
    }

    await template.update({
      isActive: !template.isActive
    });

    res.json({
      success: true,
      message: `模板已${template.isActive ? '启用' : '禁用'}`,
      data: template
    });
  } catch (error) {
    next(error);
  }
};

// 获取模板分类列表
exports.getTemplateCategories = async (req, res, next) => {
  try {
    const categories = await CallScriptTemplate.findAll({
      attributes: [
        'category',
        [CallScriptTemplate.sequelize.fn('COUNT', CallScriptTemplate.sequelize.col('id')), 'count']
      ],
      where: {
        category: { [Op.ne]: null }
      },
      group: ['category'],
      raw: true
    });

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    next(error);
  }
};








