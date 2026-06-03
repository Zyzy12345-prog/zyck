const { CustomerPool, Client, User, Assignment } = require('../models');
const { Op } = require('sequelize');

// 获取公海池列表
exports.getPoolClients = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      status = 'available',
      sortBy = 'priority'
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};

    if (status) {
      where.status = status;
    }

    // 排序规则
    let order = [];
    if (sortBy === 'priority') {
      order = [['priority', 'DESC'], ['enteredAt', 'ASC']];
    } else if (sortBy === 'time') {
      order = [['enteredAt', 'ASC']];
    }

    const { count, rows } = await CustomerPool.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order,
      include: [
        {
          model: Client,
          as: 'client',
          where: search ? {
            [Op.or]: [
              { companyName: { [Op.like]: `%${search}%` } },
              { contactPerson: { [Op.like]: `%${search}%` } },
              { phone: { [Op.like]: `%${search}%` } }
            ]
          } : undefined
        },
        {
          model: User,
          as: 'previousOwner',
          attributes: ['id', 'username', 'email']
        },
        {
          model: User,
          as: 'claimer',
          attributes: ['id', 'username', 'email']
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

// 将客户放入公海池
exports.addToPool = async (req, res, next) => {
  try {
    const { clientId, reason, notes } = req.body;

    // 检查客户是否存在
    const client = await Client.findByPk(clientId);
    if (!client) {
      return res.status(404).json({
        success: false,
        message: '客户不存在'
      });
    }

    // 检查是否已在公海池
    const existing = await CustomerPool.findOne({
      where: {
        clientId,
        status: { [Op.in]: ['available', 'locked'] }
      }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: '客户已在公海池中'
      });
    }

    // 获取当前负责人
    const activeAssignment = await Assignment.findOne({
      where: { clientId, status: 'active' }
    });

    // 创建公海池记录
    const poolRecord = await CustomerPool.create({
      clientId,
      enteredReason: reason || 'returned',
      previousOwnerId: activeAssignment ? activeAssignment.userId : null,
      notes,
      priority: 0
    });

    // 将当前分配标记为已返回
    if (activeAssignment) {
      await activeAssignment.update({ status: 'returned' });
    }

    res.status(201).json({
      success: true,
      message: '客户已放入公海池',
      data: poolRecord
    });
  } catch (error) {
    next(error);
  }
};

// 从公海池领取客户
exports.claimClient = async (req, res, next) => {
  try {
    const { id } = req.params;

    const poolRecord = await CustomerPool.findByPk(id, {
      include: [
        {
          model: Client,
          as: 'client'
        }
      ]
    });

    if (!poolRecord) {
      return res.status(404).json({
        success: false,
        message: '公海池记录不存在'
      });
    }

    if (poolRecord.status !== 'available') {
      return res.status(400).json({
        success: false,
        message: '该客户不可领取'
      });
    }

    // 更新公海池记录
    await poolRecord.update({
      status: 'claimed',
      claimedBy: req.user.id,
      claimedAt: new Date()
    });

    // 创建新的分配记录
    await Assignment.create({
      clientId: poolRecord.clientId,
      userId: req.user.id,
      assignedBy: req.user.id,
      notes: '从公海池领取'
    });

    res.json({
      success: true,
      message: '客户领取成功',
      data: poolRecord
    });
  } catch (error) {
    next(error);
  }
};

// 批量领取客户
exports.batchClaimClients = async (req, res, next) => {
  try {
    const { poolIds } = req.body;

    if (!Array.isArray(poolIds) || poolIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请选择要领取的客户'
      });
    }

    const poolRecords = await CustomerPool.findAll({
      where: {
        id: { [Op.in]: poolIds },
        status: 'available'
      }
    });

    if (poolRecords.length === 0) {
      return res.status(400).json({
        success: false,
        message: '没有可领取的客户'
      });
    }

    // 批量更新公海池记录
    await CustomerPool.update(
      {
        status: 'claimed',
        claimedBy: req.user.id,
        claimedAt: new Date()
      },
      {
        where: { id: { [Op.in]: poolRecords.map(r => r.id) } }
      }
    );

    // 批量创建分配记录
    const assignments = poolRecords.map(record => ({
      clientId: record.clientId,
      userId: req.user.id,
      assignedBy: req.user.id,
      notes: '从公海池批量领取'
    }));

    await Assignment.bulkCreate(assignments);

    res.json({
      success: true,
      message: `成功领取${poolRecords.length}个客户`
    });
  } catch (error) {
    next(error);
  }
};

// 更新公海池客户优先级
exports.updatePriority = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { priority } = req.body;

    const poolRecord = await CustomerPool.findByPk(id);
    if (!poolRecord) {
      return res.status(404).json({
        success: false,
        message: '公海池记录不存在'
      });
    }

    await poolRecord.update({ priority });

    res.json({
      success: true,
      message: '优先级更新成功',
      data: poolRecord
    });
  } catch (error) {
    next(error);
  }
};

// 获取公海池统计
exports.getPoolStatistics = async (req, res, next) => {
  try {
    const totalAvailable = await CustomerPool.count({
      where: { status: 'available' }
    });

    const totalClaimed = await CustomerPool.count({
      where: { status: 'claimed' }
    });

    const totalLocked = await CustomerPool.count({
      where: { status: 'locked' }
    });

    // 按进入原因统计
    const byReason = await CustomerPool.findAll({
      where: { status: 'available' },
      attributes: [
        'enteredReason',
        [CustomerPool.sequelize.fn('COUNT', CustomerPool.sequelize.col('id')), 'count']
      ],
      group: ['enteredReason']
    });

    // 高优先级客户数
    const highPriority = await CustomerPool.count({
      where: {
        status: 'available',
        priority: { [Op.gte]: 5 }
      }
    });

    res.json({
      success: true,
      data: {
        totalAvailable,
        totalClaimed,
        totalLocked,
        highPriority,
        byReason: byReason.reduce((acc, item) => {
          acc[item.enteredReason] = parseInt(item.dataValues.count);
          return acc;
        }, {})
      }
    });
  } catch (error) {
    next(error);
  }
};

