const { LeadFollowUp, CustomerLead, User } = require('../models');
const { Op } = require('sequelize');

// 获取线索的跟进记录列表
exports.getFollowUps = async (req, res, next) => {
  try {
    const { leadId } = req.params;
    const { page = 1, limit = 10, followUpType, result } = req.query;

    const offset = (page - 1) * limit;
    const where = { leadId };

    if (followUpType) {
      where.followUpType = followUpType;
    }

    if (result) {
      where.result = result;
    }

    const { count, rows } = await LeadFollowUp.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['followUpDate', 'DESC']],
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'email'],
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

// 获取单个跟进记录
exports.getFollowUp = async (req, res, next) => {
  try {
    const { id } = req.params;

    const followUp = await LeadFollowUp.findByPk(id, {
      include: [
        {
          model: CustomerLead,
          as: 'lead',
          attributes: ['id', 'companyName', 'contactPerson', 'phone']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'email']
        }
      ]
    });

    if (!followUp) {
      return res.status(404).json({
        success: false,
        message: '跟进记录不存在'
      });
    }

    res.json({
      success: true,
      data: followUp
    });
  } catch (error) {
    next(error);
  }
};

// 创建跟进记录
exports.createFollowUp = async (req, res, next) => {
  try {
    const { leadId } = req.params;

    // 验证线索是否存在
    const lead = await CustomerLead.findByPk(leadId);
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: '线索不存在'
      });
    }

    const followUpData = {
      ...req.body,
      leadId,
      createdBy: req.user.id
    };

    const followUp = await LeadFollowUp.create(followUpData);

    // 更新线索的最后联系时间
    await lead.update({
      lastContactTime: followUpData.followUpDate || new Date(),
      nextFollowTime: followUpData.nextFollowUpDate
    });

    const createdFollowUp = await LeadFollowUp.findByPk(followUp.id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'email']
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

    const followUp = await LeadFollowUp.findByPk(id);
    if (!followUp) {
      return res.status(404).json({
        success: false,
        message: '跟进记录不存在'
      });
    }

    // 检查权限：只有创建人可以编辑
    if (followUp.createdBy !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '无权限编辑此跟进记录'
      });
    }

    await followUp.update(req.body);

    // 如果更新了下次跟进时间，同步更新线索
    if (req.body.nextFollowUpDate) {
      await CustomerLead.update(
        { nextFollowTime: req.body.nextFollowUpDate },
        { where: { id: followUp.leadId } }
      );
    }

    const updatedFollowUp = await LeadFollowUp.findByPk(id, {
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

    const followUp = await LeadFollowUp.findByPk(id);
    if (!followUp) {
      return res.status(404).json({
        success: false,
        message: '跟进记录不存在'
      });
    }

    // 检查权限：只有创建人或管理员可以删除
    if (followUp.createdBy !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '无权限删除此跟进记录'
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

// 获取跟进统计
exports.getFollowUpStatistics = async (req, res, next) => {
  try {
    const { leadId } = req.params;

    // 总跟进次数
    const totalFollowUps = await LeadFollowUp.count({
      where: { leadId }
    });

    // 按跟进方式统计
    const byType = await LeadFollowUp.findAll({
      where: { leadId },
      attributes: [
        'followUpType',
        [LeadFollowUp.sequelize.fn('COUNT', LeadFollowUp.sequelize.col('id')), 'count']
      ],
      group: ['followUpType']
    });

    // 按结果统计
    const byResult = await LeadFollowUp.findAll({
      where: { leadId },
      attributes: [
        'result',
        [LeadFollowUp.sequelize.fn('COUNT', LeadFollowUp.sequelize.col('id')), 'count']
      ],
      group: ['result']
    });

    // 最近一次跟进
    const lastFollowUp = await LeadFollowUp.findOne({
      where: { leadId },
      order: [['followUpDate', 'DESC']],
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username']
        }
      ]
    });

    // 下次跟进
    const nextFollowUp = await LeadFollowUp.findOne({
      where: {
        leadId,
        nextFollowUpDate: {
          [Op.gte]: new Date()
        }
      },
      order: [['nextFollowUpDate', 'ASC']]
    });

    res.json({
      success: true,
      data: {
        totalFollowUps,
        byType: byType.reduce((acc, item) => {
          acc[item.followUpType] = parseInt(item.dataValues.count);
          return acc;
        }, {}),
        byResult: byResult.reduce((acc, item) => {
          if (item.result) {
            acc[item.result] = parseInt(item.dataValues.count);
          }
          return acc;
        }, {}),
        lastFollowUp,
        nextFollowUp
      }
    });
  } catch (error) {
    next(error);
  }
};

// 获取待跟进列表
exports.getPendingFollowUps = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    // 查找有下次跟进计划且时间已到的记录
    const { count, rows } = await LeadFollowUp.findAndCountAll({
      where: {
        nextFollowUpDate: {
          [Op.lte]: new Date()
        }
      },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['nextFollowUpDate', 'ASC']],
      include: [
        {
          model: CustomerLead,
          as: 'lead',
          attributes: ['id', 'companyName', 'contactPerson', 'phone', 'status', 'priority']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username']
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

module.exports = exports;










