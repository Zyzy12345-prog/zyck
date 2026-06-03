const { CallTask, CallRecord, CallScriptTemplate, Client, CustomerLead, User } = require('../models');
const { Op } = require('sequelize');

// 创建外呼任务
exports.createCallTask = async (req, res, next) => {
  try {
    const {
      title,
      description,
      taskType,
      assignedTo,
      clientId,
      leadId,
      priority,
      scheduledTime,
      dueDate,
      maxAttempts,
      scriptTemplateId,
      callScript
    } = req.body;

    const task = await CallTask.create({
      title,
      description,
      taskType: taskType || 'single',
      assignedTo,
      createdBy: req.user.id,
      clientId,
      leadId,
      priority: priority || 'normal',
      scheduledTime,
      dueDate,
      maxAttempts: maxAttempts || 3,
      scriptTemplateId,
      callScript,
      status: 'pending'
    });

    res.status(201).json({
      success: true,
      message: '外呼任务创建成功',
      data: task
    });
  } catch (error) {
    next(error);
  }
};

// 获取外呼任务列表
exports.getCallTasks = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      priority,
      assignedTo,
      taskType,
      startDate,
      endDate
    } = req.query;

    const where = {};

    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (assignedTo) where.assignedTo = assignedTo;
    if (taskType) where.taskType = taskType;

    // 时间范围
    if (startDate || endDate) {
      where.scheduledTime = {};
      if (startDate) where.scheduledTime[Op.gte] = new Date(startDate);
      if (endDate) where.scheduledTime[Op.lte] = new Date(endDate);
    }

    const offset = (page - 1) * limit;

    const { count, rows } = await CallTask.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'username', 'email']
        },
        {
          model: User,
          as: 'creator',
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
          model: CallScriptTemplate,
          as: 'scriptTemplate',
          attributes: ['id', 'name']
        }
      ],
      order: [
        ['priority', 'DESC'],
        ['scheduledTime', 'ASC']
      ],
      limit: parseInt(limit),
      offset
    });

    res.json({
      success: true,
      data: {
        tasks: rows,
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

// 获取单个外呼任务
exports.getCallTask = async (req, res, next) => {
  try {
    const { id } = req.params;

    const task = await CallTask.findByPk(id, {
      include: [
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'username', 'email']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'email']
        },
        {
          model: Client,
          as: 'client'
        },
        {
          model: CustomerLead,
          as: 'lead'
        },
        {
          model: CallScriptTemplate,
          as: 'scriptTemplate'
        },
        {
          model: CallRecord,
          as: 'callRecords',
          limit: 10,
          order: [['callTime', 'DESC']]
        }
      ]
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: '外呼任务不存在'
      });
    }

    res.json({
      success: true,
      data: task
    });
  } catch (error) {
    next(error);
  }
};

// 更新外呼任务
exports.updateCallTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const task = await CallTask.findByPk(id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: '外呼任务不存在'
      });
    }

    // 检查权限
    if (task.createdBy !== req.user.id && task.assignedTo !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '无权限修改此任务'
      });
    }

    await task.update(req.body);

    res.json({
      success: true,
      message: '外呼任务更新成功',
      data: task
    });
  } catch (error) {
    next(error);
  }
};

// 删除外呼任务
exports.deleteCallTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const task = await CallTask.findByPk(id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: '外呼任务不存在'
      });
    }

    // 检查权限
    if (task.createdBy !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '无权限删除此任务'
      });
    }

    await task.destroy();

    res.json({
      success: true,
      message: '外呼任务删除成功'
    });
  } catch (error) {
    next(error);
  }
};

// 完成外呼任务
exports.completeCallTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const task = await CallTask.findByPk(id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: '外呼任务不存在'
      });
    }

    await task.update({
      status: 'completed',
      completedAt: new Date()
    });

    res.json({
      success: true,
      message: '外呼任务已完成',
      data: task
    });
  } catch (error) {
    next(error);
  }
};

// 取消外呼任务
exports.cancelCallTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const task = await CallTask.findByPk(id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: '外呼任务不存在'
      });
    }

    await task.update({
      status: 'cancelled'
    });

    res.json({
      success: true,
      message: '外呼任务已取消',
      data: task
    });
  } catch (error) {
    next(error);
  }
};

// 批量分配外呼任务
exports.batchAssignTasks = async (req, res, next) => {
  try {
    const { taskIds, assignedTo } = req.body;

    if (!Array.isArray(taskIds) || taskIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请提供任务ID列表'
      });
    }

    const result = await CallTask.update(
      { assignedTo },
      {
        where: {
          id: { [Op.in]: taskIds }
        }
      }
    );

    res.json({
      success: true,
      message: `成功分配${result[0]}个任务`
    });
  } catch (error) {
    next(error);
  }
};

// 获取我的外呼任务
exports.getMyCallTasks = async (req, res, next) => {
  try {
    const { status, priority } = req.query;
    const where = { assignedTo: req.user.id };

    if (status) where.status = status;
    if (priority) where.priority = priority;

    const tasks = await CallTask.findAll({
      where,
      include: [
        {
          model: Client,
          as: 'client',
          attributes: ['id', 'companyName', 'contactPerson', 'phone']
        },
        {
          model: CustomerLead,
          as: 'lead',
          attributes: ['id', 'companyName', 'contactPerson', 'phone']
        }
      ],
      order: [
        ['priority', 'DESC'],
        ['scheduledTime', 'ASC']
      ]
    });

    res.json({
      success: true,
      data: tasks
    });
  } catch (error) {
    next(error);
  }
};

// 获取待处理任务统计
exports.getTaskStatistics = async (req, res, next) => {
  try {
    const userId = req.query.userId || req.user.id;

    // 总任务数
    const totalTasks = await CallTask.count({
      where: { assignedTo: userId }
    });

    // 待处理任务
    const pendingTasks = await CallTask.count({
      where: { assignedTo: userId, status: 'pending' }
    });

    // 进行中任务
    const inProgressTasks = await CallTask.count({
      where: { assignedTo: userId, status: 'in_progress' }
    });

    // 已完成任务
    const completedTasks = await CallTask.count({
      where: { assignedTo: userId, status: 'completed' }
    });

    // 逾期任务
    const overdueTasks = await CallTask.count({
      where: {
        assignedTo: userId,
        status: { [Op.in]: ['pending', 'in_progress'] },
        dueDate: { [Op.lt]: new Date() }
      }
    });

    // 今日任务
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayTasks = await CallTask.count({
      where: {
        assignedTo: userId,
        scheduledTime: {
          [Op.between]: [today, tomorrow]
        }
      }
    });

    // 按优先级统计
    const byPriority = await CallTask.findAll({
      attributes: [
        'priority',
        [CallTask.sequelize.fn('COUNT', CallTask.sequelize.col('id')), 'count']
      ],
      where: {
        assignedTo: userId,
        status: { [Op.in]: ['pending', 'in_progress'] }
      },
      group: ['priority'],
      raw: true
    });

    res.json({
      success: true,
      data: {
        totalTasks,
        pendingTasks,
        inProgressTasks,
        completedTasks,
        overdueTasks,
        todayTasks,
        byPriority
      }
    });
  } catch (error) {
    next(error);
  }
};








