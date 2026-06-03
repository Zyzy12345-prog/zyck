// Analytics Controller - 数据分析控制器
const { SalesOpportunity, SalesStage, Client, User, FollowUp, CallRecord } = require('../models');
const { Op } = require('sequelize');

// 获取销售数据分析
exports.getSalesAnalytics = async (req, res, next) => {
  try {
    const { startDate, endDate, userId } = req.query;
    
    const where = { status: 'active' };
    if (userId) where.assigned_to = userId;
    
    if (startDate || endDate) {
      where.created_at = {};
      if (startDate) where.created_at[Op.gte] = new Date(startDate);
      if (endDate) where.created_at[Op.lte] = new Date(endDate);
    }

    // 1. 销售趋势数据（按月统计）- PostgreSQL
    const salesTrend = await SalesOpportunity.findAll({
      where,
      attributes: [
        [SalesOpportunity.sequelize.fn('DATE_TRUNC', 'month', SalesOpportunity.sequelize.col('created_at')), 'month'],
        [SalesOpportunity.sequelize.fn('COUNT', SalesOpportunity.sequelize.col('id')), 'count'],
        [SalesOpportunity.sequelize.fn('SUM', SalesOpportunity.sequelize.col('expected_amount')), 'totalAmount']
      ],
      group: [SalesOpportunity.sequelize.fn('DATE_TRUNC', 'month', SalesOpportunity.sequelize.col('created_at'))],
      order: [[SalesOpportunity.sequelize.fn('DATE_TRUNC', 'month', SalesOpportunity.sequelize.col('created_at')), 'ASC']],
      raw: true
    });

    // 2. 销售漏斗转化数据
    const funnelData = await SalesStage.findAll({
      where: { isActive: true },
      order: [['sortOrder', 'ASC']],
      include: [{
        model: SalesOpportunity,
        as: 'opportunities',
        where,
        required: false,
        attributes: []
      }],
      attributes: [
        'id',
        'name',
        'sortOrder',
        [SalesOpportunity.sequelize.fn('COUNT', SalesOpportunity.sequelize.col('opportunities.id')), 'count']
      ],
      group: ['SalesStage.id'],
      raw: true
    });

    // 3. 销售额统计
    const amountStats = await SalesOpportunity.findOne({
      where,
      attributes: [
        [SalesOpportunity.sequelize.fn('COALESCE', SalesOpportunity.sequelize.fn('SUM', SalesOpportunity.sequelize.col('expected_amount')), 0), 'totalAmount'],
        [SalesOpportunity.sequelize.fn('COALESCE', SalesOpportunity.sequelize.fn('AVG', SalesOpportunity.sequelize.col('expected_amount')), 0), 'avgAmount'],
        [SalesOpportunity.sequelize.fn('COUNT', SalesOpportunity.sequelize.col('id')), 'totalCount']
      ],
      raw: true
    });

    // 4. 成交率统计
    const wonCount = await SalesOpportunity.count({
      where: { ...where, status: 'won' }
    });
    const totalCount = await SalesOpportunity.count({ where });
    const winRate = totalCount > 0 ? (wonCount / totalCount * 100).toFixed(2) : 0;

    // 5. 按销售人员统计
    const salesByUser = await SalesOpportunity.findAll({
      where,
      include: [{
        model: User,
        as: 'assignedUser',
        attributes: ['id', 'username'],
        required: false
      }],
      attributes: [
        'assigned_to',
        [SalesOpportunity.sequelize.fn('COUNT', SalesOpportunity.sequelize.col('SalesOpportunity.id')), 'count'],
        [SalesOpportunity.sequelize.fn('COALESCE', SalesOpportunity.sequelize.fn('SUM', SalesOpportunity.sequelize.col('expected_amount')), 0), 'totalAmount']
      ],
      group: ['SalesOpportunity.assigned_to', 'assignedUser.id'],
      order: [[SalesOpportunity.sequelize.fn('SUM', SalesOpportunity.sequelize.col('expected_amount')), 'DESC']],
      limit: 10,
      raw: true
    });

    res.json({
      success: true,
      data: {
        salesTrend,
        funnelData,
        amountStats: {
          totalAmount: parseFloat(amountStats.totalAmount || 0),
          avgAmount: parseFloat(amountStats.avgAmount || 0),
          totalCount: parseInt(amountStats.totalCount || 0)
        },
        winRate: parseFloat(winRate),
        salesByUser
      }
    });
  } catch (error) {
    console.error('获取销售分析数据失败:', error);
    next(error);
  }
};

// 获取客户分析数据
exports.getCustomerAnalytics = async (req, res, next) => {
  try {
    // 1. 客户等级分布
    const levelDistribution = await Client.findAll({
      attributes: [
        'customerLevel',
        [Client.sequelize.fn('COUNT', Client.sequelize.col('id')), 'count']
      ],
      group: ['customerLevel'],
      raw: true
    });

    // 2. 客户来源分布
    const sourceDistribution = await Client.findAll({
      attributes: [
        'customerSource',
        [Client.sequelize.fn('COUNT', Client.sequelize.col('id')), 'count']
      ],
      group: ['customerSource'],
      raw: true
    });

    // 3. 客户增长趋势 - PostgreSQL (使用 createdAt)
    const growthTrend = await Client.findAll({
      attributes: [
        [Client.sequelize.fn('DATE_TRUNC', 'month', Client.sequelize.col('createdAt')), 'month'],
        [Client.sequelize.fn('COUNT', Client.sequelize.col('id')), 'count']
      ],
      group: [Client.sequelize.fn('DATE_TRUNC', 'month', Client.sequelize.col('createdAt'))],
      order: [[Client.sequelize.fn('DATE_TRUNC', 'month', Client.sequelize.col('createdAt')), 'ASC']],
      raw: true
    });

    res.json({
      success: true,
      data: {
        levelDistribution,
        sourceDistribution,
        growthTrend
      }
    });
  } catch (error) {
    console.error('获取客户分析数据失败:', error);
    next(error);
  }
};

// 获取跟进效率分析
exports.getFollowUpAnalytics = async (req, res, next) => {
  try {
    const { startDate, endDate, userId } = req.query;
    
    const where = {};
    if (userId) where.user_id = userId;
    
    if (startDate || endDate) {
      where.follow_time = {};
      if (startDate) where.follow_time[Op.gte] = new Date(startDate);
      if (endDate) where.follow_time[Op.lte] = new Date(endDate);
    }

    // 1. 跟进方式分布
    const typeDistribution = await FollowUp.findAll({
      where,
      attributes: [
        'followType',
        [FollowUp.sequelize.fn('COUNT', FollowUp.sequelize.col('id')), 'count']
      ],
      group: ['followType'],
      raw: true
    });

    // 2. 跟进结果分布
    const resultDistribution = await FollowUp.findAll({
      where,
      attributes: [
        'result',
        [FollowUp.sequelize.fn('COUNT', FollowUp.sequelize.col('id')), 'count']
      ],
      group: ['result'],
      raw: true
    });

    // 3. 员工跟进排行
    const userRanking = await FollowUp.findAll({
      where,
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'username'],
        required: false
      }],
      attributes: [
        'user_id',
        [FollowUp.sequelize.fn('COUNT', FollowUp.sequelize.col('FollowUp.id')), 'count']
      ],
      group: ['FollowUp.user_id', 'user.id'],
      order: [[FollowUp.sequelize.fn('COUNT', FollowUp.sequelize.col('FollowUp.id')), 'DESC']],
      limit: 10,
      raw: true
    });

    // 4. 跟进趋势 - PostgreSQL
    const followUpTrend = await FollowUp.findAll({
      where,
      attributes: [
        [FollowUp.sequelize.fn('DATE_TRUNC', 'day', FollowUp.sequelize.col('follow_time')), 'date'],
        [FollowUp.sequelize.fn('COUNT', FollowUp.sequelize.col('id')), 'count']
      ],
      group: [FollowUp.sequelize.fn('DATE_TRUNC', 'day', FollowUp.sequelize.col('follow_time'))],
      order: [[FollowUp.sequelize.fn('DATE_TRUNC', 'day', FollowUp.sequelize.col('follow_time')), 'ASC']],
      limit: 30,
      raw: true
    });

    res.json({
      success: true,
      data: {
        typeDistribution,
        resultDistribution,
        userRanking,
        followUpTrend
      }
    });
  } catch (error) {
    console.error('获取跟进分析数据失败:', error);
    next(error);
  }
};

// 获取外呼数据分析
exports.getCallAnalytics = async (req, res, next) => {
  try {
    const { startDate, endDate, userId } = req.query;
    
    const where = {};
    if (userId) where.user_id = userId;
    
    if (startDate || endDate) {
      where.call_time = {};
      if (startDate) where.call_time[Op.gte] = new Date(startDate);
      if (endDate) where.call_time[Op.lte] = new Date(endDate);
    }

    // 1. 外呼量趋势 - PostgreSQL
    const callTrend = await CallRecord.findAll({
      where,
      attributes: [
        [CallRecord.sequelize.fn('DATE_TRUNC', 'day', CallRecord.sequelize.col('call_time')), 'date'],
        [CallRecord.sequelize.fn('COUNT', CallRecord.sequelize.col('id')), 'count']
      ],
      group: [CallRecord.sequelize.fn('DATE_TRUNC', 'day', CallRecord.sequelize.col('call_time'))],
      order: [[CallRecord.sequelize.fn('DATE_TRUNC', 'day', CallRecord.sequelize.col('call_time')), 'ASC']],
      limit: 30,
      raw: true
    });

    // 2. 外呼结果分布
    const statusDistribution = await CallRecord.findAll({
      where,
      attributes: [
        'status',
        [CallRecord.sequelize.fn('COUNT', CallRecord.sequelize.col('id')), 'count']
      ],
      group: ['status'],
      raw: true
    });

    // 3. 通话时长统计
    const durationStats = await CallRecord.findOne({
      where,
      attributes: [
        [CallRecord.sequelize.fn('COALESCE', CallRecord.sequelize.fn('AVG', CallRecord.sequelize.col('duration')), 0), 'avgDuration'],
        [CallRecord.sequelize.fn('COALESCE', CallRecord.sequelize.fn('SUM', CallRecord.sequelize.col('duration')), 0), 'totalDuration'],
        [CallRecord.sequelize.fn('COALESCE', CallRecord.sequelize.fn('MAX', CallRecord.sequelize.col('duration')), 0), 'maxDuration']
      ],
      raw: true
    });

    // 4. 接通率统计
    const totalCalls = await CallRecord.count({ where });
    const answeredCalls = await CallRecord.count({
      where: { ...where, status: 'answered' }
    });
    const answerRate = totalCalls > 0 ? (answeredCalls / totalCalls * 100).toFixed(2) : 0;

    res.json({
      success: true,
      data: {
        callTrend,
        statusDistribution,
        durationStats: {
          avgDuration: Math.round(durationStats.avgDuration || 0),
          totalDuration: parseInt(durationStats.totalDuration || 0),
          maxDuration: parseInt(durationStats.maxDuration || 0)
        },
        answerRate: parseFloat(answerRate),
        totalCalls,
        answeredCalls
      }
    });
  } catch (error) {
    console.error('获取外呼分析数据失败:', error);
    next(error);
  }
};

module.exports = exports;

