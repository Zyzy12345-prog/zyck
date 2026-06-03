const { LeadTag, CustomerLead, User, sequelize } = require('../models');
const { Op } = require('sequelize');

// 获取所有标签
exports.getTags = async (req, res, next) => {
  try {
    const { category, search } = req.query;
    const where = {};

    if (category) {
      where.category = category;
    }

    if (search) {
      where.name = { [Op.like]: `%${search}%` };
    }

    const tags = await LeadTag.findAll({
      where,
      order: [['sortOrder', 'ASC'], ['createdAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username'],
          required: false
        }
      ]
    });

    res.json({
      success: true,
      data: tags
    });
  } catch (error) {
    next(error);
  }
};

// 获取标签分类列表
exports.getCategories = async (req, res, next) => {
  try {
    const categories = await LeadTag.findAll({
      attributes: [
        'category',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: {
        category: { [Op.ne]: null }
      },
      group: ['category']
    });

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    next(error);
  }
};

// 创建标签
exports.createTag = async (req, res, next) => {
  try {
    const tagData = {
      ...req.body,
      createdBy: req.user.id
    };

    const tag = await LeadTag.create(tagData);

    res.status(201).json({
      success: true,
      message: '标签创建成功',
      data: tag
    });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: '标签名称已存在'
      });
    }
    next(error);
  }
};

// 更新标签
exports.updateTag = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tag = await LeadTag.findByPk(id);

    if (!tag) {
      return res.status(404).json({
        success: false,
        message: '标签不存在'
      });
    }

    // 系统标签不允许修改名称和分类
    if (tag.isSystem && (req.body.name || req.body.category)) {
      return res.status(403).json({
        success: false,
        message: '系统标签不允许修改名称和分类'
      });
    }

    await tag.update(req.body);

    res.json({
      success: true,
      message: '标签更新成功',
      data: tag
    });
  } catch (error) {
    next(error);
  }
};

// 删除标签
exports.deleteTag = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tag = await LeadTag.findByPk(id);

    if (!tag) {
      return res.status(404).json({
        success: false,
        message: '标签不存在'
      });
    }

    if (tag.isSystem) {
      return res.status(403).json({
        success: false,
        message: '系统标签不允许删除'
      });
    }

    await tag.destroy();

    res.json({
      success: true,
      message: '标签删除成功'
    });
  } catch (error) {
    next(error);
  }
};

// 为线索添加标签
exports.addTagToLead = async (req, res, next) => {
  try {
    const { leadId, tagId } = req.body;

    const lead = await CustomerLead.findByPk(leadId);
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: '线索不存在'
      });
    }

    const tag = await LeadTag.findByPk(tagId);
    if (!tag) {
      return res.status(404).json({
        success: false,
        message: '标签不存在'
      });
    }

    await lead.addTag(tag);

    res.json({
      success: true,
      message: '标签添加成功'
    });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: '该标签已存在'
      });
    }
    next(error);
  }
};

// 从线索移除标签
exports.removeTagFromLead = async (req, res, next) => {
  try {
    const { leadId, tagId } = req.body;

    const lead = await CustomerLead.findByPk(leadId);
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: '线索不存在'
      });
    }

    await lead.removeTag(tagId);

    res.json({
      success: true,
      message: '标签移除成功'
    });
  } catch (error) {
    next(error);
  }
};

// 批量为线索添加标签
exports.batchAddTags = async (req, res, next) => {
  try {
    const { leadIds, tagIds } = req.body;

    if (!Array.isArray(leadIds) || !Array.isArray(tagIds)) {
      return res.status(400).json({
        success: false,
        message: '参数格式错误'
      });
    }

    const leads = await CustomerLead.findAll({
      where: { id: { [Op.in]: leadIds } }
    });

    const tags = await LeadTag.findAll({
      where: { id: { [Op.in]: tagIds } }
    });

    for (const lead of leads) {
      await lead.addTags(tags);
    }

    res.json({
      success: true,
      message: `成功为${leads.length}个线索添加${tags.length}个标签`
    });
  } catch (error) {
    next(error);
  }
};

// 获取线索的标签
exports.getLeadTags = async (req, res, next) => {
  try {
    const { leadId } = req.params;

    const lead = await CustomerLead.findByPk(leadId, {
      include: [
        {
          model: LeadTag,
          as: 'tags',
          through: { attributes: [] }
        }
      ]
    });

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: '线索不存在'
      });
    }

    res.json({
      success: true,
      data: lead.tags
    });
  } catch (error) {
    next(error);
  }
};

// 按标签搜索线索
exports.searchLeadsByTags = async (req, res, next) => {
  try {
    const { tagIds, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    if (!tagIds) {
      return res.status(400).json({
        success: false,
        message: '请提供标签ID'
      });
    }

    const tagIdArray = Array.isArray(tagIds) ? tagIds : tagIds.split(',').map(id => parseInt(id));

    const { count, rows } = await CustomerLead.findAndCountAll({
      include: [
        {
          model: LeadTag,
          as: 'tags',
          where: { id: { [Op.in]: tagIdArray } },
          through: { attributes: [] }
        },
        {
          model: User,
          as: 'assignedUser',
          attributes: ['id', 'username'],
          required: false
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true
    });

    res.json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// 获取标签统计
exports.getTagStatistics = async (req, res, next) => {
  try {
    const stats = await sequelize.query(`
      SELECT 
        lt.id,
        lt.name,
        lt.color,
        lt.category,
        COUNT(ltr.lead_id) as lead_count
      FROM lead_tags lt
      LEFT JOIN lead_tag_relations ltr ON lt.id = ltr.tag_id
      GROUP BY lt.id, lt.name, lt.color, lt.category
      ORDER BY lead_count DESC
    `, {
      type: sequelize.QueryTypes.SELECT
    });

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

module.exports = exports;










