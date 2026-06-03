const { CustomerLead, Client, User, IndustryCategory } = require('../models');
const { Op } = require('sequelize');

// 获取线索列表
exports.getLeads = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      priority,
      source,
      assignedTo,
      startDate,
      endDate
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

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    if (source) {
      where.source = source;
    }

    if (assignedTo) {
      where.assignedTo = assignedTo;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt[Op.gte] = new Date(startDate);
      }
      if (endDate) {
        where.createdAt[Op.lte] = new Date(endDate);
      }
    }

    const { count, rows } = await CustomerLead.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'assignedUser',
          attributes: ['id', 'username', 'email'],
          required: false
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'email'],
          required: false
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

// 获取单个线索详情
exports.getLead = async (req, res, next) => {
  try {
    const { id } = req.params;

    const lead = await CustomerLead.findByPk(id, {
      include: [
        {
          model: User,
          as: 'assignedUser',
          attributes: ['id', 'username', 'email'],
          required: false
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'email'],
          required: false
        },
        {
          model: IndustryCategory,
          as: 'industry',
          required: false
        },
        {
          model: Client,
          as: 'convertedClient',
          required: false
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
      data: lead
    });
  } catch (error) {
    next(error);
  }
};

// 创建线索
exports.createLead = async (req, res, next) => {
  try {
    const leadData = {
      ...req.body,
      createdBy: req.user.id
    };

    const lead = await CustomerLead.create(leadData);

    const createdLead = await CustomerLead.findByPk(lead.id, {
      include: [
        {
          model: User,
          as: 'assignedUser',
          attributes: ['id', 'username', 'email'],
          required: false
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
      message: '线索创建成功',
      data: createdLead
    });
  } catch (error) {
    next(error);
  }
};

// 更新线索
exports.updateLead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const lead = await CustomerLead.findByPk(id);

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: '线索不存在'
      });
    }

    await lead.update(req.body);

    const updatedLead = await CustomerLead.findByPk(id, {
      include: [
        {
          model: User,
          as: 'assignedUser',
          attributes: ['id', 'username', 'email'],
          required: false
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
      message: '线索更新成功',
      data: updatedLead
    });
  } catch (error) {
    next(error);
  }
};

// 删除线索
exports.deleteLead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const lead = await CustomerLead.findByPk(id);

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: '线索不存在'
      });
    }

    await lead.destroy();

    res.json({
      success: true,
      message: '线索删除成功'
    });
  } catch (error) {
    next(error);
  }
};

// 分配线索
exports.assignLead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    const lead = await CustomerLead.findByPk(id);
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: '线索不存在'
      });
    }

    await lead.update({
      assignedTo: userId,
      assignedAt: new Date()
    });

    const updatedLead = await CustomerLead.findByPk(id, {
      include: [
        {
          model: User,
          as: 'assignedUser',
          attributes: ['id', 'username', 'email']
        }
      ]
    });

    res.json({
      success: true,
      message: '线索分配成功',
      data: updatedLead
    });
  } catch (error) {
    next(error);
  }
};

// 转化线索为客户
exports.convertLead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const lead = await CustomerLead.findByPk(id);

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: '线索不存在'
      });
    }

    if (lead.status === 'converted') {
      return res.status(400).json({
        success: false,
        message: '线索已转化'
      });
    }

    // 创建客户
    const clientData = {
      companyName: lead.companyName,
      contactPerson: lead.contactPerson,
      phone: lead.phone,
      email: lead.email,
      wechat: lead.wechat,
      address: lead.address,
      website: lead.website,
      industryId: lead.industryId,
      companyScale: lead.companyScale,
      customerSource: lead.source,
      remarks: lead.notes
    };

    const client = await Client.create(clientData);

    // 更新线索状态
    await lead.update({
      status: 'converted',
      convertedClientId: client.id,
      convertedAt: new Date()
    });

    res.json({
      success: true,
      message: '线索转化成功',
      data: {
        lead,
        client
      }
    });
  } catch (error) {
    next(error);
  }
};

// 批量分配线索
exports.batchAssignLeads = async (req, res, next) => {
  try {
    const { leadIds, userId } = req.body;

    if (!Array.isArray(leadIds) || leadIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请选择要分配的线索'
      });
    }

    await CustomerLead.update(
      {
        assignedTo: userId,
        assignedAt: new Date()
      },
      {
        where: { id: { [Op.in]: leadIds } }
      }
    );

    res.json({
      success: true,
      message: `成功分配${leadIds.length}条线索`
    });
  } catch (error) {
    next(error);
  }
};

// 批量更新线索状态
exports.batchUpdateLeadStatus = async (req, res, next) => {
  try {
    const { leadIds, status } = req.body;

    if (!Array.isArray(leadIds) || leadIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请选择要更新的线索'
      });
    }

    await CustomerLead.update(
      { status },
      {
        where: { id: { [Op.in]: leadIds } }
      }
    );

    res.json({
      success: true,
      message: `成功更新${leadIds.length}条线索状态`
    });
  } catch (error) {
    next(error);
  }
};

// 获取线索统计
exports.getLeadStatistics = async (req, res, next) => {
  try {
    const { startDate, endDate, userId } = req.query;
    const where = {};

    if (userId) {
      where.assignedTo = userId;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt[Op.gte] = new Date(startDate);
      }
      if (endDate) {
        where.createdAt[Op.lte] = new Date(endDate);
      }
    }

    // 总线索数
    const totalLeads = await CustomerLead.count({ where });

    // 按状态统计
    const byStatus = await CustomerLead.findAll({
      where,
      attributes: [
        'status',
        [CustomerLead.sequelize.fn('COUNT', CustomerLead.sequelize.col('id')), 'count']
      ],
      group: ['status']
    });

    // 按优先级统计
    const byPriority = await CustomerLead.findAll({
      where,
      attributes: [
        'priority',
        [CustomerLead.sequelize.fn('COUNT', CustomerLead.sequelize.col('id')), 'count']
      ],
      group: ['priority']
    });

    // 按来源统计
    const bySource = await CustomerLead.findAll({
      where,
      attributes: [
        'source',
        [CustomerLead.sequelize.fn('COUNT', CustomerLead.sequelize.col('id')), 'count']
      ],
      group: ['source']
    });

    // 转化率
    const convertedCount = await CustomerLead.count({
      where: { ...where, status: 'converted' }
    });
    const conversionRate = totalLeads > 0 ? ((convertedCount / totalLeads) * 100).toFixed(2) : 0;

    res.json({
      success: true,
      data: {
        totalLeads,
        convertedCount,
        conversionRate,
        byStatus: byStatus.reduce((acc, item) => {
          acc[item.status] = parseInt(item.dataValues.count);
          return acc;
        }, {}),
        byPriority: byPriority.reduce((acc, item) => {
          acc[item.priority] = parseInt(item.dataValues.count);
          return acc;
        }, {}),
        bySource: bySource.reduce((acc, item) => {
          acc[item.source] = parseInt(item.dataValues.count);
          return acc;
        }, {})
      }
    });
  } catch (error) {
    next(error);
  }
};


