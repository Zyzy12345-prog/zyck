const { FollowUpReminder, CustomerLead, LeadFollowUp, User } = require('../models');
const { Op } = require('sequelize');

// 创建提醒
exports.createReminder = async (req, res, next) => {
  try {
    const { leadId, followUpId, reminderTime, title, content, priority } = req.body;

    const reminder = await FollowUpReminder.create({
      leadId,
      followUpId,
      userId: req.user.id,
      reminderTime,
      title,
      content,
      priority: priority || 'normal',
      reminderType: 'scheduled'
    });

    res.status(201).json({
      success: true,
      message: '提醒创建成功',
      data: reminder
    });
  } catch (error) {
    next(error);
  }
};

// 获取用户的提醒列表
exports.getUserReminders = async (req, res, next) => {
  try {
    const { status, priority, startDate, endDate, page = 1, limit = 20 } = req.query;
    const userId = req.user.id;

    const where = { userId };

    // 状态筛选
    if (status === 'unread') {
      where.isRead = false;
    } else if (status === 'read') {
      where.isRead = true;
    } else if (status === 'completed') {
      where.isCompleted = true;
    } else if (status === 'pending') {
      where.isCompleted = false;
    }

    // 优先级筛选
    if (priority) {
      where.priority = priority;
    }

    // 时间范围筛选
    if (startDate || endDate) {
      where.reminderTime = {};
      if (startDate) {
        where.reminderTime[Op.gte] = new Date(startDate);
      }
      if (endDate) {
        where.reminderTime[Op.lte] = new Date(endDate);
      }
    }

    const offset = (page - 1) * limit;

    const { count, rows } = await FollowUpReminder.findAndCountAll({
      where,
      include: [
        {
          model: CustomerLead,
          as: 'lead',
          attributes: ['id', 'companyName', 'contactPerson', 'phone', 'status']
        },
        {
          model: LeadFollowUp,
          as: 'followUp',
          attributes: ['id', 'followUpType', 'content']
        }
      ],
      order: [
        ['isCompleted', 'ASC'],
        ['priority', 'DESC'],
        ['reminderTime', 'ASC']
      ],
      limit: parseInt(limit),
      offset
    });

    res.json({
      success: true,
      data: {
        reminders: rows,
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

// 获取即将到期的提醒（未来24小时内）
exports.getUpcomingReminders = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const reminders = await FollowUpReminder.findAll({
      where: {
        userId,
        isCompleted: false,
        reminderTime: {
          [Op.between]: [now, tomorrow]
        }
      },
      include: [
        {
          model: CustomerLead,
          as: 'lead',
          attributes: ['id', 'companyName', 'contactPerson', 'phone']
        }
      ],
      order: [['reminderTime', 'ASC']]
    });

    res.json({
      success: true,
      data: reminders
    });
  } catch (error) {
    next(error);
  }
};

// 获取逾期提醒
exports.getOverdueReminders = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const now = new Date();

    const reminders = await FollowUpReminder.findAll({
      where: {
        userId,
        isCompleted: false,
        reminderTime: {
          [Op.lt]: now
        }
      },
      include: [
        {
          model: CustomerLead,
          as: 'lead',
          attributes: ['id', 'companyName', 'contactPerson', 'phone']
        }
      ],
      order: [['reminderTime', 'ASC']]
    });

    // 更新提醒类型为逾期
    await FollowUpReminder.update(
      { reminderType: 'overdue' },
      {
        where: {
          id: { [Op.in]: reminders.map(r => r.id) }
        }
      }
    );

    res.json({
      success: true,
      data: reminders
    });
  } catch (error) {
    next(error);
  }
};

// 标记为已读
exports.markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const reminder = await FollowUpReminder.findOne({
      where: { id, userId }
    });

    if (!reminder) {
      return res.status(404).json({
        success: false,
        message: '提醒不存在'
      });
    }

    await reminder.update({ isRead: true });

    res.json({
      success: true,
      message: '已标记为已读',
      data: reminder
    });
  } catch (error) {
    next(error);
  }
};

// 批量标记为已读
exports.batchMarkAsRead = async (req, res, next) => {
  try {
    const { ids } = req.body;
    const userId = req.user.id;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请提供提醒ID列表'
      });
    }

    const result = await FollowUpReminder.update(
      { isRead: true },
      {
        where: {
          id: { [Op.in]: ids },
          userId
        }
      }
    );

    res.json({
      success: true,
      message: `已标记${result[0]}条提醒为已读`
    });
  } catch (error) {
    next(error);
  }
};

// 标记为已完成
exports.markAsCompleted = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const reminder = await FollowUpReminder.findOne({
      where: { id, userId }
    });

    if (!reminder) {
      return res.status(404).json({
        success: false,
        message: '提醒不存在'
      });
    }

    await reminder.update({
      isCompleted: true,
      completedAt: new Date()
    });

    res.json({
      success: true,
      message: '已标记为已完成',
      data: reminder
    });
  } catch (error) {
    next(error);
  }
};

// 删除提醒
exports.deleteReminder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const reminder = await FollowUpReminder.findOne({
      where: { id, userId }
    });

    if (!reminder) {
      return res.status(404).json({
        success: false,
        message: '提醒不存在'
      });
    }

    await reminder.destroy();

    res.json({
      success: true,
      message: '提醒删除成功'
    });
  } catch (error) {
    next(error);
  }
};

// 获取提醒统计
exports.getReminderStatistics = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const now = new Date();

    // 总提醒数
    const total = await FollowUpReminder.count({
      where: { userId }
    });

    // 未完成提醒数
    const pending = await FollowUpReminder.count({
      where: { userId, isCompleted: false }
    });

    // 已完成提醒数
    const completed = await FollowUpReminder.count({
      where: { userId, isCompleted: true }
    });

    // 逾期提醒数
    const overdue = await FollowUpReminder.count({
      where: {
        userId,
        isCompleted: false,
        reminderTime: { [Op.lt]: now }
      }
    });

    // 今日提醒数
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayCount = await FollowUpReminder.count({
      where: {
        userId,
        reminderTime: {
          [Op.between]: [today, tomorrow]
        }
      }
    });

    // 未读提醒数
    const unread = await FollowUpReminder.count({
      where: { userId, isRead: false, isCompleted: false }
    });

    // 按优先级统计
    const byPriority = await FollowUpReminder.findAll({
      attributes: [
        'priority',
        [FollowUpReminder.sequelize.fn('COUNT', FollowUpReminder.sequelize.col('id')), 'count']
      ],
      where: { userId, isCompleted: false },
      group: ['priority'],
      raw: true
    });

    // 按类型统计
    const byType = await FollowUpReminder.findAll({
      attributes: [
        'reminderType',
        [FollowUpReminder.sequelize.fn('COUNT', FollowUpReminder.sequelize.col('id')), 'count']
      ],
      where: { userId, isCompleted: false },
      group: ['reminderType'],
      raw: true
    });

    res.json({
      success: true,
      data: {
        total,
        pending,
        completed,
        overdue,
        today: todayCount,
        unread,
        byPriority,
        byType,
        completionRate: total > 0 ? ((completed / total) * 100).toFixed(2) : 0
      }
    });
  } catch (error) {
    next(error);
  }
};

// 获取跟进统计（按时间、类型、结果）
exports.getFollowUpStatistics = async (req, res, next) => {
  try {
    const { startDate, endDate, leadId } = req.query;
    const userId = req.user.id;

    const where = { createdBy: userId };

    // 时间范围
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt[Op.gte] = new Date(startDate);
      }
      if (endDate) {
        where.createdAt[Op.lte] = new Date(endDate);
      }
    }

    // 特定线索
    if (leadId) {
      where.leadId = leadId;
    }

    // 总跟进次数
    const totalFollowUps = await LeadFollowUp.count({ where });

    // 按类型统计
    const byType = await LeadFollowUp.findAll({
      attributes: [
        'followUpType',
        [LeadFollowUp.sequelize.fn('COUNT', LeadFollowUp.sequelize.col('id')), 'count']
      ],
      where,
      group: ['followUpType'],
      raw: true
    });

    // 按结果统计
    const byResult = await LeadFollowUp.findAll({
      attributes: [
        'result',
        [LeadFollowUp.sequelize.fn('COUNT', LeadFollowUp.sequelize.col('id')), 'count']
      ],
      where: {
        ...where,
        result: { [Op.ne]: null }
      },
      group: ['result'],
      raw: true
    });

    // 按日期统计（最近7天）
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const byDate = await LeadFollowUp.findAll({
      attributes: [
        [LeadFollowUp.sequelize.fn('DATE', LeadFollowUp.sequelize.col('created_at')), 'date'],
        [LeadFollowUp.sequelize.fn('COUNT', LeadFollowUp.sequelize.col('id')), 'count']
      ],
      where: {
        ...where,
        createdAt: { [Op.gte]: sevenDaysAgo }
      },
      group: [LeadFollowUp.sequelize.fn('DATE', LeadFollowUp.sequelize.col('created_at'))],
      order: [[LeadFollowUp.sequelize.fn('DATE', LeadFollowUp.sequelize.col('created_at')), 'ASC']],
      raw: true
    });

    // 平均跟进间隔（天）
    const followUps = await LeadFollowUp.findAll({
      where,
      attributes: ['createdAt'],
      order: [['createdAt', 'ASC']],
      raw: true
    });

    let avgInterval = 0;
    if (followUps.length > 1) {
      let totalInterval = 0;
      for (let i = 1; i < followUps.length; i++) {
        const diff = new Date(followUps[i].createdAt) - new Date(followUps[i - 1].createdAt);
        totalInterval += diff;
      }
      avgInterval = (totalInterval / (followUps.length - 1) / (1000 * 60 * 60 * 24)).toFixed(1);
    }

    res.json({
      success: true,
      data: {
        totalFollowUps,
        byType,
        byStatus: byResult, // 改名为 byStatus 以匹配前端
        byDate,
        avgInterval
      }
    });
  } catch (error) {
    next(error);
  }
};

