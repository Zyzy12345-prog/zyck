// Sales Funnel Controller
const { SalesOpportunity, SalesStage, Client, User, OpportunityStageHistory } = require('../models');
const { Op } = require('sequelize');

// Get all sales stages
exports.getSalesStages = async (req, res, next) => {
  try {
    const stages = await SalesStage.findAll({
      where: { isActive: true },
      order: [['sortOrder', 'ASC']]
    });

    res.json({
      success: true,
      data: stages
    });
  } catch (error) {
    next(error);
  }
};

// Get opportunities by stage (for Kanban board)
exports.getOpportunitiesByStage = async (req, res, next) => {
  try {
    const { status = 'active', assignedTo } = req.query;

    const where = { status };
    if (assignedTo) {
      where.assignedTo = assignedTo;
    }

    const stages = await SalesStage.findAll({
      where: { isActive: true },
      order: [['sortOrder', 'ASC']],
      include: [{
        model: SalesOpportunity,
        as: 'opportunities',
        where,
        required: false,
        include: [
          {
            model: Client,
            as: 'client',
            attributes: ['id', 'companyName', 'contactPerson', 'phone', 'customerLevel']
          },
          {
            model: User,
            as: 'assignedUser',
            attributes: ['id', 'username', 'email']
          }
        ],
        order: [['createdAt', 'DESC']]
      }]
    });

    res.json({
      success: true,
      data: stages
    });
  } catch (error) {
    next(error);
  }
};

// Get all opportunities with filters
exports.getOpportunities = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      stageId,
      status,
      assignedTo,
      clientId,
      search
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};

    if (stageId) where.stageId = stageId;
    if (status) where.status = status;
    if (assignedTo) where.assignedTo = assignedTo;
    if (clientId) where.clientId = clientId;

    if (search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await SalesOpportunity.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: Client,
          as: 'client',
          attributes: ['id', 'companyName', 'contactPerson', 'phone', 'customerLevel']
        },
        {
          model: SalesStage,
          as: 'stage'
        },
        {
          model: User,
          as: 'assignedUser',
          attributes: ['id', 'username', 'email']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'email']
        }
      ]
    });

    res.json({
      success: true,
      data: {
        opportunities: rows,
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

// Get single opportunity
exports.getOpportunity = async (req, res, next) => {
  try {
    const { id } = req.params;

    const opportunity = await SalesOpportunity.findByPk(id, {
      include: [
        {
          model: Client,
          as: 'client'
        },
        {
          model: SalesStage,
          as: 'stage'
        },
        {
          model: User,
          as: 'assignedUser',
          attributes: ['id', 'username', 'email']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'email']
        },
        {
          model: OpportunityStageHistory,
          as: 'stageHistory',
          include: [
            {
              model: SalesStage,
              as: 'fromStage'
            },
            {
              model: SalesStage,
              as: 'toStage'
            },
            {
              model: User,
              as: 'user',
              attributes: ['id', 'username']
            }
          ],
          order: [['changedAt', 'DESC']]
        }
      ]
    });

    if (!opportunity) {
      return res.status(404).json({
        success: false,
        message: '商机不存在'
      });
    }

    res.json({
      success: true,
      data: opportunity
    });
  } catch (error) {
    next(error);
  }
};

// Create opportunity
exports.createOpportunity = async (req, res, next) => {
  try {
    const {
      clientId,
      stageId,
      title,
      description,
      expectedAmount,
      probability,
      expectedCloseDate,
      assignedTo
    } = req.body;

    // Check if client exists
    const client = await Client.findByPk(clientId);
    if (!client) {
      return res.status(404).json({
        success: false,
        message: '客户不存在'
      });
    }

    // Create opportunity
    const opportunity = await SalesOpportunity.create({
      clientId,
      stageId,
      title,
      description,
      expectedAmount,
      probability,
      expectedCloseDate,
      assignedTo: assignedTo || req.user.id,
      createdBy: req.user.id,
      status: 'active'
    });

    // Create stage history
    await OpportunityStageHistory.create({
      opportunityId: opportunity.id,
      fromStageId: null,
      toStageId: stageId,
      changedBy: req.user.id,
      notes: '创建商机'
    });

    // Get complete opportunity data
    const createdOpportunity = await SalesOpportunity.findByPk(opportunity.id, {
      include: [
        { model: Client, as: 'client' },
        { model: SalesStage, as: 'stage' },
        { model: User, as: 'assignedUser', attributes: ['id', 'username', 'email'] }
      ]
    });

    res.status(201).json({
      success: true,
      message: '商机创建成功',
      data: createdOpportunity
    });
  } catch (error) {
    next(error);
  }
};

// Update opportunity
exports.updateOpportunity = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const opportunity = await SalesOpportunity.findByPk(id);
    if (!opportunity) {
      return res.status(404).json({
        success: false,
        message: '商机不存在'
      });
    }

    // If stage changed, record history
    if (updateData.stageId && updateData.stageId !== opportunity.stageId) {
      await OpportunityStageHistory.create({
        opportunityId: id,
        fromStageId: opportunity.stageId,
        toStageId: updateData.stageId,
        changedBy: req.user.id,
        notes: updateData.stageChangeNotes || '阶段变更'
      });
    }

    // Update opportunity
    await opportunity.update(updateData);

    const updatedOpportunity = await SalesOpportunity.findByPk(id, {
      include: [
        { model: Client, as: 'client' },
        { model: SalesStage, as: 'stage' },
        { model: User, as: 'assignedUser', attributes: ['id', 'username', 'email'] }
      ]
    });

    res.json({
      success: true,
      message: '商机更新成功',
      data: updatedOpportunity
    });
  } catch (error) {
    next(error);
  }
};

// Move opportunity to different stage (for drag-and-drop)
exports.moveOpportunityStage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { stageId, notes } = req.body;

    // 添加调试日志
    console.log('=== moveOpportunityStage 调试信息 ===');
    console.log('商机ID:', id, '类型:', typeof id);
    console.log('目标阶段ID:', stageId, '类型:', typeof stageId);
    console.log('请求体:', req.body);

    // Validate stageId
    if (!stageId) {
      return res.status(400).json({
        success: false,
        message: '阶段ID不能为空'
      });
    }

    // Check if opportunity exists
    const opportunity = await SalesOpportunity.findByPk(id, {
      include: [
        { model: Client, as: 'client', required: false },
        { model: SalesStage, as: 'stage', required: false }
      ]
    });
    
    if (!opportunity) {
      console.log('错误: 商机不存在, ID:', id);
      return res.status(404).json({
        success: false,
        message: '商机不存在'
      });
    }

    console.log('找到商机:', opportunity.title, '当前阶段ID:', opportunity.stageId);

    // Check if client exists
    if (!opportunity.client) {
      console.log('错误: 客户信息缺失');
      return res.status(400).json({
        success: false,
        message: '关联数据不存在：客户信息缺失'
      });
    }

    // Check if target stage exists
    const targetStage = await SalesStage.findByPk(stageId);
    console.log('查询目标阶段, ID:', stageId, '结果:', targetStage ? targetStage.name : 'null');
    
    if (!targetStage) {
      return res.status(404).json({
        success: false,
        message: '目标阶段不存在'
      });
    }

    const oldStageId = opportunity.stageId;

    // If stage hasn't changed, no need to update
    if (oldStageId === parseInt(stageId)) {
      console.log('阶段未变化');
      return res.json({
        success: true,
        message: '阶段未变化',
        data: opportunity
      });
    }

    console.log('准备更新阶段: 从', oldStageId, '到', stageId);

    // Update stage
    await opportunity.update({ stageId: parseInt(stageId) });

    // Record history
    try {
      const historyData = {
        opportunityId: parseInt(id),
        fromStageId: oldStageId,
        toStageId: parseInt(stageId),
        notes: notes || '拖拽移动阶段'
      };

      // Only add changedBy if user exists
      if (req.user && req.user.id) {
        historyData.changedBy = req.user.id;
      }

      await OpportunityStageHistory.create(historyData);
      console.log('历史记录创建成功');
    } catch (historyError) {
      console.error('创建历史记录失败:', historyError);
      // 历史记录失败不影响主流程
    }

    // Reload with associations
    const updatedOpportunity = await SalesOpportunity.findByPk(id, {
      include: [
        { model: Client, as: 'client' },
        { model: SalesStage, as: 'stage' }
      ]
    });

    console.log('更新成功, 新阶段:', updatedOpportunity.stage.name);

    res.json({
      success: true,
      message: '阶段更新成功',
      data: updatedOpportunity
    });
  } catch (error) {
    console.error('移动商机阶段错误:', error);
    
    // 提供更详细的错误信息
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({
        success: false,
        message: '关联数据不存在：请检查客户、阶段或用户信息是否完整'
      });
    }
    
    next(error);
  }
};

// Mark opportunity as won
exports.markOpportunityWon = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { actualCloseDate, actualAmount } = req.body;

    const opportunity = await SalesOpportunity.findByPk(id);
    if (!opportunity) {
      return res.status(404).json({
        success: false,
        message: '商机不存在'
      });
    }

    await opportunity.update({
      status: 'won',
      actualCloseDate: actualCloseDate || new Date(),
      expectedAmount: actualAmount || opportunity.expectedAmount
    });

    res.json({
      success: true,
      message: '商机标记为成交'
    });
  } catch (error) {
    next(error);
  }
};

// Mark opportunity as lost
exports.markOpportunityLost = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { lostReason } = req.body;

    const opportunity = await SalesOpportunity.findByPk(id);
    if (!opportunity) {
      return res.status(404).json({
        success: false,
        message: '商机不存在'
      });
    }

    await opportunity.update({
      status: 'lost',
      lostReason
    });

    res.json({
      success: true,
      message: '商机标记为流失'
    });
  } catch (error) {
    next(error);
  }
};

// Delete opportunity
exports.deleteOpportunity = async (req, res, next) => {
  try {
    const { id } = req.params;

    const opportunity = await SalesOpportunity.findByPk(id);
    if (!opportunity) {
      return res.status(404).json({
        success: false,
        message: '商机不存在'
      });
    }

    await opportunity.destroy();

    res.json({
      success: true,
      message: '商机删除成功'
    });
  } catch (error) {
    next(error);
  }
};

// Get funnel statistics
exports.getFunnelStatistics = async (req, res, next) => {
  try {
    const { startDate, endDate, assignedTo } = req.query;

    const where = { status: 'active' };
    if (assignedTo) where.assignedTo = assignedTo;

    if (startDate && endDate) {
      where.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    // Get opportunities by stage
    const stages = await SalesStage.findAll({
      where: { isActive: true },
      order: [['sortOrder', 'ASC']],
      include: [{
        model: SalesOpportunity,
        as: 'opportunities',
        where,
        required: false,
        attributes: ['id', 'expectedAmount', 'probability']
      }]
    });

    const statistics = stages.map(stage => {
      const opps = stage.opportunities || [];
      const count = opps.length;
      const totalAmount = opps.reduce((sum, opp) => sum + parseFloat(opp.expectedAmount || 0), 0);
      const weightedAmount = opps.reduce((sum, opp) => {
        return sum + (parseFloat(opp.expectedAmount || 0) * (opp.probability / 100));
      }, 0);

      return {
        stageId: stage.id,
        stageName: stage.name,
        color: stage.color,
        count,
        totalAmount,
        weightedAmount
      };
    });

    // Calculate conversion rates
    const conversionRates = [];
    for (let i = 0; i < statistics.length - 1; i++) {
      const current = statistics[i];
      const next = statistics[i + 1];
      const rate = current.count > 0 ? (next.count / current.count * 100).toFixed(2) : 0;
      conversionRates.push({
        from: current.stageName,
        to: next.stageName,
        rate: parseFloat(rate)
      });
    }

    res.json({
      success: true,
      data: {
        stages: statistics,
        conversionRates,
        totalOpportunities: statistics.reduce((sum, s) => sum + s.count, 0),
        totalAmount: statistics.reduce((sum, s) => sum + s.totalAmount, 0),
        totalWeightedAmount: statistics.reduce((sum, s) => sum + s.weightedAmount, 0)
      }
    });
  } catch (error) {
    next(error);
  }
};


