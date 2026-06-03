// Client Scoring Controller
const clientScoringService = require('../services/ClientScoringService');
const { Client, ClientScore, ClientValueAnalysis } = require('../models');

// Calculate score for a single client
exports.calculateClientScore = async (req, res, next) => {
  try {
    const { clientId } = req.params;

    const result = await clientScoringService.calculateClientScore(clientId);

    res.json({
      success: true,
      message: '客户评分计算完成',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// Batch calculate scores
exports.batchCalculateScores = async (req, res, next) => {
  try {
    const { clientIds } = req.body;

    const result = await clientScoringService.batchCalculateScores(clientIds);

    res.json({
      success: true,
      message: '批量评分计算完成',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// Get client score
exports.getClientScore = async (req, res, next) => {
  try {
    const { clientId } = req.params;

    const score = await ClientScore.findOne({
      where: { clientId },
      include: [{
        model: Client,
        as: 'client',
        attributes: ['id', 'companyName', 'customerLevel']
      }]
    });

    if (!score) {
      return res.status(404).json({
        success: false,
        message: '客户评分不存在，请先计算评分'
      });
    }

    res.json({
      success: true,
      data: score
    });
  } catch (error) {
    next(error);
  }
};

// Update client value analysis
exports.updateClientValueAnalysis = async (req, res, next) => {
  try {
    const { clientId } = req.params;

    const result = await clientScoringService.updateClientValueAnalysis(clientId);

    res.json({
      success: true,
      message: '客户价值分析更新完成',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// Get client value analysis
exports.getClientValueAnalysis = async (req, res, next) => {
  try {
    const { clientId } = req.params;

    const analysis = await ClientValueAnalysis.findOne({
      where: { clientId },
      include: [{
        model: Client,
        as: 'client',
        attributes: ['id', 'companyName', 'customerLevel']
      }]
    });

    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: '客户价值分析不存在，请先更新分析'
      });
    }

    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    next(error);
  }
};

// Get clients by level
exports.getClientsByLevel = async (req, res, next) => {
  try {
    const { level } = req.params;

    if (!['A', 'B', 'C', 'D'].includes(level)) {
      return res.status(400).json({
        success: false,
        message: '无效的客户等级'
      });
    }

    const clients = await clientScoringService.getClientsByLevel(level);

    res.json({
      success: true,
      data: clients
    });
  } catch (error) {
    next(error);
  }
};

// Get level distribution
exports.getLevelDistribution = async (req, res, next) => {
  try {
    const distribution = await clientScoringService.getLevelDistribution();

    res.json({
      success: true,
      data: distribution
    });
  } catch (error) {
    next(error);
  }
};

// Get high-value clients (A and B level)
exports.getHighValueClients = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows } = await Client.findAndCountAll({
      where: {
        customerLevel: ['A', 'B']
      },
      include: [
        {
          model: ClientScore,
          as: 'score'
        },
        {
          model: ClientValueAnalysis,
          as: 'valueAnalysis'
        }
      ],
      order: [
        ['customerLevel', 'ASC'],
        [{ model: ClientScore, as: 'score' }, 'totalScore', 'DESC']
      ],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        clients: rows,
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

// Get at-risk clients (high churn risk)
exports.getAtRiskClients = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, threshold = 60 } = req.query;
    const offset = (page - 1) * limit;

    const analyses = await ClientValueAnalysis.findAll({
      where: {
        churnRiskScore: {
          [require('sequelize').Op.gte]: threshold
        }
      },
      include: [{
        model: Client,
        as: 'client',
        include: [{
          model: ClientScore,
          as: 'score'
        }]
      }],
      order: [['churnRiskScore', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const totalCount = await ClientValueAnalysis.count({
      where: {
        churnRiskScore: {
          [require('sequelize').Op.gte]: threshold
        }
      }
    });

    res.json({
      success: true,
      data: {
        clients: analyses.map(a => ({
          ...a.client.toJSON(),
          churnRiskScore: a.churnRiskScore,
          lastFollowUpDate: a.lastFollowUpDate
        })),
        pagination: {
          total: totalCount,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(totalCount / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};












