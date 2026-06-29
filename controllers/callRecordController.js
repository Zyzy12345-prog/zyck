const { CallRecord, CallTask, Client, CustomerLead, User } = require('../models');
const { Op } = require('sequelize');

// 创建外呼记录
exports.createCallRecord = async (req, res, next) => {
  try {
    const {
      clientId,
      leadId,
      taskId,
      callType,
      phoneNumber,
      contactPerson,
      callStatus,
      callResult,
      startTime,
      endTime,
      duration,
      subject,
      content,
      notes,
      nextAction,
      nextCallDate,
      qualityScore,
      customerSatisfaction,
      tags,
      isImportant
    } = req.body;

    const callRecord = await CallRecord.create({
      clientId,
      leadId,
      taskId,
      userId: req.user.id,
      callType: callType || 'outbound',
      phoneNumber,
      contactPerson,
      callStatus: callStatus || 'pending',
      callResult,
      callTime: callTime || new Date(),
      startTime,
      endTime,
      duration: duration || 0,
      subject,
      content,
      notes,
      nextAction,
      nextCallDate,
      qualityScore,
      customerSatisfaction,
      tags,
      isImportant: isImportant || false
    });

    // 如果有关联任务，更新任务统计
    if (taskId) {
      const task = await CallTask.findByPk(taskId);
      if (task) {
        await task.update({
          totalCalls: task.totalCalls + 1,
          successfulCalls: callStatus === 'connected' ? task.successfulCalls + 1 : task.successfulCalls,
          currentAttempts: task.currentAttempts + 1
        });
      }
    }

    // 更新关联客户/线索的最后联系时间
    if (clientId) {
      const { Client } = require('../models');
      await Client.update(
        { updatedAt: new Date() },
        { where: { id: clientId } }
      );
    }
    if (leadId) {
      await CustomerLead.update(
        { lastContactTime: callTime || new Date() },
        { where: { id: leadId } }
      );
    }

    res.status(201).json({
      success: true,
      message: '外呼记录创建成功',
      data: callRecord
    });
  } catch (error) {
    next(error);
  }
};

// 获取外呼记录列表
exports.getCallRecords = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      callStatus,
      callResult,
      callType,
      startDate,
      endDate,
      userId,
      clientId,
      leadId,
      search
    } = req.query;

    const where = {};

    // 筛选条件
    if (callStatus) where.callStatus = callStatus;
    if (callResult) where.callResult = callResult;
    if (callType) where.callType = callType;
    if (userId) where.userId = userId;
    if (clientId) where.clientId = clientId;
    if (leadId) where.leadId = leadId;

    // 时间范围
    if (startDate || endDate) {
      where.callTime = {};
      if (startDate) where.callTime[Op.gte] = new Date(startDate);
      if (endDate) where.callTime[Op.lte] = new Date(endDate);
    }

    // 搜索
    if (search) {
      where[Op.or] = [
        { phoneNumber: { [Op.like]: `%${search}%` } },
        { contactPerson: { [Op.like]: `%${search}%` } },
        { subject: { [Op.like]: `%${search}%` } }
      ];
    }

    const offset = (page - 1) * limit;

    const { count, rows } = await CallRecord.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'email']
        },
        {
          model: Client,
          as: 'client',
          attributes: ['id', 'companyName', 'contactPerson']
        },
        {
          model: CustomerLead,
          as: 'lead',
          attributes: ['id', 'companyName', 'contactPerson']
        },
        {
          model: CallTask,
          as: 'task',
          attributes: ['id', 'title']
        }
      ],
      order: [['callTime', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    res.json({
      success: true,
      data: {
        records: rows,
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

// 获取单个外呼记录
exports.getCallRecord = async (req, res, next) => {
  try {
    const { id } = req.params;

    const callRecord = await CallRecord.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'email']
        },
        {
          model: Client,
          as: 'client',
          attributes: ['id', 'companyName', 'contactPerson', 'phone']
        },
        {
          model: CustomerLead,
          as: 'lead',
          attributes: ['id', 'companyName', 'contactPerson', 'phone']
        },
        {
          model: CallTask,
          as: 'task',
          attributes: ['id', 'title', 'description']
        }
      ]
    });

    if (!callRecord) {
      return res.status(404).json({
        success: false,
        message: '外呼记录不存在'
      });
    }

    res.json({
      success: true,
      data: callRecord
    });
  } catch (error) {
    next(error);
  }
};

// 更新外呼记录
exports.updateCallRecord = async (req, res, next) => {
  try {
    const { id } = req.params;
    const callRecord = await CallRecord.findByPk(id);

    if (!callRecord) {
      return res.status(404).json({
        success: false,
        message: '外呼记录不存在'
      });
    }

    // 检查权限
    if (callRecord.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '无权限修改此记录'
      });
    }

    await callRecord.update(req.body);

    res.json({
      success: true,
      message: '外呼记录更新成功',
      data: callRecord
    });
  } catch (error) {
    next(error);
  }
};

// 删除外呼记录
exports.deleteCallRecord = async (req, res, next) => {
  try {
    const { id } = req.params;
    const callRecord = await CallRecord.findByPk(id);

    if (!callRecord) {
      return res.status(404).json({
        success: false,
        message: '外呼记录不存在'
      });
    }

    // 检查权限
    if (callRecord.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '无权限删除此记录'
      });
    }

    await callRecord.destroy();

    res.json({
      success: true,
      message: '外呼记录删除成功'
    });
  } catch (error) {
    next(error);
  }
};

// 获取外呼统计
exports.getCallStatistics = async (req, res, next) => {
  try {
    const { startDate, endDate, userId } = req.query;
    const where = {};

    // 时间范围
    if (startDate || endDate) {
      where.callTime = {};
      if (startDate) where.callTime[Op.gte] = new Date(startDate);
      if (endDate) where.callTime[Op.lte] = new Date(endDate);
    }

    // 用户筛选
    if (userId) {
      where.userId = userId;
    }

    // 总外呼数
    const totalCalls = await CallRecord.count({ where });

    // 按状态统计
    const byStatus = await CallRecord.findAll({
      attributes: [
        'callStatus',
        [CallRecord.sequelize.fn('COUNT', CallRecord.sequelize.col('id')), 'count']
      ],
      where,
      group: ['callStatus'],
      raw: true
    });

    // 按结果统计
    const byResult = await CallRecord.findAll({
      attributes: [
        'callResult',
        [CallRecord.sequelize.fn('COUNT', CallRecord.sequelize.col('id')), 'count']
      ],
      where: {
        ...where,
        callResult: { [Op.ne]: null }
      },
      group: ['callResult'],
      raw: true
    });

    // 按类型统计
    const byType = await CallRecord.findAll({
      attributes: [
        'callType',
        [CallRecord.sequelize.fn('COUNT', CallRecord.sequelize.col('id')), 'count']
      ],
      where,
      group: ['callType'],
      raw: true
    });

    // 接通率
    const connectedCount = await CallRecord.count({
      where: { ...where, callStatus: 'connected' }
    });
    const connectionRate = totalCalls > 0 ? ((connectedCount / totalCalls) * 100).toFixed(2) : 0;

    // 平均通话时长
    const avgDuration = await CallRecord.findOne({
      attributes: [
        [CallRecord.sequelize.fn('AVG', CallRecord.sequelize.col('duration')), 'avgDuration']
      ],
      where: { ...where, callStatus: 'connected' },
      raw: true
    });

    // 按日期统计（最近7天）
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const byDate = await CallRecord.findAll({
      attributes: [
        [CallRecord.sequelize.fn('DATE', CallRecord.sequelize.col('call_time')), 'date'],
        [CallRecord.sequelize.fn('COUNT', CallRecord.sequelize.col('id')), 'count']
      ],
      where: {
        ...where,
        callTime: { [Op.gte]: sevenDaysAgo }
      },
      group: [CallRecord.sequelize.fn('DATE', CallRecord.sequelize.col('call_time'))],
      order: [[CallRecord.sequelize.fn('DATE', CallRecord.sequelize.col('call_time')), 'ASC']],
      raw: true
    });

    // 按小时统计（今日）
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const byHour = await CallRecord.findAll({
      attributes: [
        [CallRecord.sequelize.fn('EXTRACT', CallRecord.sequelize.literal('HOUR FROM call_time')), 'hour'],
        [CallRecord.sequelize.fn('COUNT', CallRecord.sequelize.col('id')), 'count']
      ],
      where: {
        ...where,
        callTime: { [Op.gte]: today }
      },
      group: [CallRecord.sequelize.fn('EXTRACT', CallRecord.sequelize.literal('HOUR FROM call_time'))],
      order: [[CallRecord.sequelize.fn('EXTRACT', CallRecord.sequelize.literal('HOUR FROM call_time')), 'ASC']],
      raw: true
    });

    res.json({
      success: true,
      data: {
        totalCalls,
        connectedCount,
        connectionRate,
        avgDuration: avgDuration?.avgDuration ? Math.round(avgDuration.avgDuration) : 0,
        byStatus,
        byResult,
        byType,
        byDate,
        byHour
      }
    });
  } catch (error) {
    next(error);
  }
};

// 获取用户外呼排行
exports.getUserCallRanking = async (req, res, next) => {
  try {
    const { startDate, endDate, limit = 10 } = req.query;
    const where = {};

    if (startDate || endDate) {
      where.callTime = {};
      if (startDate) where.callTime[Op.gte] = new Date(startDate);
      if (endDate) where.callTime[Op.lte] = new Date(endDate);
    }

    const ranking = await CallRecord.findAll({
      attributes: [
        'userId',
        [CallRecord.sequelize.fn('COUNT', CallRecord.sequelize.col('CallRecord.id')), 'totalCalls'],
        [CallRecord.sequelize.fn('SUM', CallRecord.sequelize.literal('CASE WHEN call_status = \'connected\' THEN 1 ELSE 0 END')), 'connectedCalls'],
        [CallRecord.sequelize.fn('AVG', CallRecord.sequelize.col('duration')), 'avgDuration']
      ],
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'email']
        }
      ],
      group: ['userId', 'user.id', 'user.username', 'user.email'],
      order: [[CallRecord.sequelize.literal('totalCalls'), 'DESC']],
      limit: parseInt(limit),
      raw: false
    });

    res.json({
      success: true,
      data: ranking
    });
  } catch (error) {
    next(error);
  }
};
