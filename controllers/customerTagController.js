const { CustomerTag, Client, CustomerLead, User, ClientTagRelation } = require('../models');
const { Op } = require('sequelize');

// 获取标签列表
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

    const tags = await CustomerTag.findAll({
      where,
      order: [['sortOrder', 'ASC'], ['createdAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'email']
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

// 创建标签
exports.createTag = async (req, res, next) => {
  try {
    const { name, color, category, description } = req.body;

    // 检查标签名是否已存在
    const existing = await CustomerTag.findOne({ where: { name } });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: '标签名称已存在'
      });
    }

    const tag = await CustomerTag.create({
      name,
      color: color || '#1890ff',
      category: category || 'custom',
      description,
      createdBy: req.user.id
    });

    res.status(201).json({
      success: true,
      message: '标签创建成功',
      data: tag
    });
  } catch (error) {
    next(error);
  }
};

// 更新标签
exports.updateTag = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tag = await CustomerTag.findByPk(id);

    if (!tag) {
      return res.status(404).json({
        success: false,
        message: '标签不存在'
      });
    }

    // 系统标签不允许修改
    if (tag.isSystem && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '系统标签不允许修改'
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
    const tag = await CustomerTag.findByPk(id);

    if (!tag) {
      return res.status(404).json({
        success: false,
        message: '标签不存在'
      });
    }

    // 系统标签不允许删除
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

// 为客户添加标签
exports.addTagToClient = async (req, res, next) => {
  try {
    const { clientId, tagId } = req.body;

    const client = await Client.findByPk(clientId);
    if (!client) {
      return res.status(404).json({
        success: false,
        message: '客户不存在'
      });
    }

    const tag = await CustomerTag.findByPk(tagId);
    if (!tag) {
      return res.status(404).json({
        success: false,
        message: '标签不存在'
      });
    }

    // 检查是否已存在
    const existing = await ClientTagRelation.findOne({
      where: { clientId, tagId }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: '标签已存在'
      });
    }

    await ClientTagRelation.create({
      clientId,
      tagId,
      createdBy: req.user.id
    });

    res.json({
      success: true,
      message: '标签添加成功'
    });
  } catch (error) {
    next(error);
  }
};

// 从客户移除标签
exports.removeTagFromClient = async (req, res, next) => {
  try {
    const { clientId, tagId } = req.body;

    const relation = await ClientTagRelation.findOne({
      where: { clientId, tagId }
    });

    if (!relation) {
      return res.status(404).json({
        success: false,
        message: '标签关系不存在'
      });
    }

    await relation.destroy();

    res.json({
      success: true,
      message: '标签移除成功'
    });
  } catch (error) {
    next(error);
  }
};

// 批量为客户添加标签
exports.batchAddTagsToClients = async (req, res, next) => {
  try {
    const { clientIds, tagIds } = req.body;
    console.log('Batch add tags request:', { clientIds, tagIds });

    if (!Array.isArray(clientIds) || !Array.isArray(tagIds)) {
      console.log('Invalid parameter format:', { 
        clientIds: typeof clientIds, 
        tagIds: typeof tagIds,
        isClientIdsArray: Array.isArray(clientIds),
        isTagIdsArray: Array.isArray(tagIds)
      });
      return res.status(400).json({
        success: false,
        message: '参数格式错误，clientIds和tagIds必须是数组'
      });
    }

    if (clientIds.length === 0 || tagIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'clientIds和tagIds不能为空'
      });
    }

    const relations = [];
    for (const clientId of clientIds) {
      for (const tagId of tagIds) {
        // 检查是否已存在
        const existing = await ClientTagRelation.findOne({
          where: { clientId, tagId }
        });
        if (!existing) {
          relations.push({
            clientId,
            tagId,
            createdBy: req.user.id
          });
        }
      }
    }

    if (relations.length > 0) {
      await ClientTagRelation.bulkCreate(relations);
    }

    res.json({
      success: true,
      message: `成功添加${relations.length}个标签关系`
    });
  } catch (error) {
    next(error);
  }
};

// 获取客户的标签
exports.getClientTags = async (req, res, next) => {
  try {
    const { clientId } = req.params;

    const client = await Client.findByPk(clientId, {
      include: [
        {
          model: CustomerTag,
          as: 'tags',
          through: { attributes: ['createdAt'] }
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
      data: client.tags
    });
  } catch (error) {
    next(error);
  }
};

// 获取标签统计
exports.getTagStatistics = async (req, res, next) => {
  try {
    const { sequelize } = CustomerTag;
    const tags = await CustomerTag.findAll({
      attributes: [
        'id',
        'name',
        'color',
        'category',
        [
          sequelize.literal(`(
            SELECT COUNT(*)
            FROM client_tag_relations
            WHERE client_tag_relations.tag_id = "CustomerTag"."id"
          )`),
          'clientCount'
        ]
      ],
      order: [[sequelize.literal('"clientCount"'), 'DESC']],
      raw: true
    });

    res.json({
      success: true,
      data: tags
    });
  } catch (error) {
    console.error('Get tag statistics error:', error);
    next(error);
  }
};

// 获取标签分类列表
exports.getTagCategories = async (req, res, next) => {
  try {
    const { sequelize } = CustomerTag;
    const categories = await CustomerTag.findAll({
      attributes: [
        'category',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
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
    console.error('Get tag categories error:', error);
    next(error);
  }
};

// 根据标签搜索客户
exports.searchClientsByTags = async (req, res, next) => {
  try {
    const { tagIds, matchType = 'any' } = req.query;

    if (!tagIds) {
      return res.status(400).json({
        success: false,
        message: '请提供标签ID'
      });
    }

    const tagIdArray = Array.isArray(tagIds) ? tagIds : tagIds.split(',').map(id => parseInt(id));

    let clients;
    if (matchType === 'all') {
      // 匹配所有标签
      clients = await Client.findAll({
        include: [
          {
            model: CustomerTag,
            as: 'tags',
            where: { id: { [Op.in]: tagIdArray } },
            through: { attributes: [] }
          }
        ],
        group: ['Client.id'],
        having: CustomerTag.sequelize.literal(`COUNT(DISTINCT tags.id) = ${tagIdArray.length}`)
      });
    } else {
      // 匹配任意标签
      clients = await Client.findAll({
        include: [
          {
            model: CustomerTag,
            as: 'tags',
            where: { id: { [Op.in]: tagIdArray } },
            through: { attributes: [] }
          }
        ]
      });
    }

    res.json({
      success: true,
      data: clients
    });
  } catch (error) {
    next(error);
  }
};
