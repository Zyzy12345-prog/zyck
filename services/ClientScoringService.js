// Client Scoring Service - Intelligent customer grading algorithm
const { Client, FollowUp, SalesOpportunity, ClientScore, ClientValueAnalysis } = require('../models');
const { Op } = require('sequelize');

class ClientScoringService {
  /**
   * Calculate comprehensive client score
   * @param {number} clientId - Client ID
   * @returns {Object} Score breakdown and calculated level
   */
  async calculateClientScore(clientId) {
    try {
      const client = await Client.findByPk(clientId);
      if (!client) {
        throw new Error('客户不存在');
      }

      // Get follow-up data
      const followUpCount = await FollowUp.count({
        where: { clientId }
      });

      const recentFollowUps = await FollowUp.count({
        where: {
          clientId,
          followTime: {
            [Op.gte]: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // Last 90 days
          }
        }
      });

      // Get opportunity data
      const opportunities = await SalesOpportunity.findAll({
        where: { clientId }
      });

      const totalExpectedAmount = opportunities.reduce((sum, opp) => {
        return sum + parseFloat(opp.expectedAmount || 0);
      }, 0);

      const wonOpportunities = opportunities.filter(opp => opp.status === 'won').length;

      // Calculate scores (0-100 for each dimension)
      const followUpScore = this.calculateFollowUpScore(followUpCount, recentFollowUps);
      const dealAmountScore = this.calculateDealAmountScore(totalExpectedAmount);
      const interactionScore = this.calculateInteractionScore(recentFollowUps, wonOpportunities);
      const potentialScore = this.calculatePotentialScore(client, opportunities);

      // Calculate total score (weighted average)
      const totalScore = Math.round(
        followUpScore * 0.25 +
        dealAmountScore * 0.35 +
        interactionScore * 0.20 +
        potentialScore * 0.20
      );

      // Determine level based on total score
      const calculatedLevel = this.determineLevel(totalScore);

      // Save score to database
      await ClientScore.upsert({
        clientId,
        totalScore,
        followUpScore,
        dealAmountScore,
        interactionScore,
        potentialScore,
        calculatedLevel,
        calculationDate: new Date()
      });

      // Update client level
      await client.update({ customerLevel: calculatedLevel });

      return {
        clientId,
        totalScore,
        followUpScore,
        dealAmountScore,
        interactionScore,
        potentialScore,
        calculatedLevel,
        breakdown: {
          followUpCount,
          recentFollowUps,
          totalExpectedAmount,
          wonOpportunities
        }
      };
    } catch (error) {
      console.error('Calculate client score error:', error);
      throw error;
    }
  }

  /**
   * Calculate follow-up score (0-100)
   * Based on total follow-ups and recent activity
   */
  calculateFollowUpScore(totalFollowUps, recentFollowUps) {
    let score = 0;

    // Total follow-ups contribution (max 50 points)
    if (totalFollowUps >= 20) score += 50;
    else if (totalFollowUps >= 10) score += 40;
    else if (totalFollowUps >= 5) score += 30;
    else if (totalFollowUps >= 2) score += 20;
    else if (totalFollowUps >= 1) score += 10;

    // Recent activity contribution (max 50 points)
    if (recentFollowUps >= 10) score += 50;
    else if (recentFollowUps >= 5) score += 40;
    else if (recentFollowUps >= 3) score += 30;
    else if (recentFollowUps >= 1) score += 20;

    return Math.min(score, 100);
  }

  /**
   * Calculate deal amount score (0-100)
   * Based on total expected revenue
   */
  calculateDealAmountScore(totalAmount) {
    if (totalAmount >= 1000000) return 100;
    if (totalAmount >= 500000) return 90;
    if (totalAmount >= 200000) return 80;
    if (totalAmount >= 100000) return 70;
    if (totalAmount >= 50000) return 60;
    if (totalAmount >= 20000) return 50;
    if (totalAmount >= 10000) return 40;
    if (totalAmount >= 5000) return 30;
    if (totalAmount >= 1000) return 20;
    if (totalAmount > 0) return 10;
    return 0;
  }

  /**
   * Calculate interaction score (0-100)
   * Based on recent engagement and conversion
   */
  calculateInteractionScore(recentFollowUps, wonOpportunities) {
    let score = 0;

    // Recent engagement (max 60 points)
    if (recentFollowUps >= 8) score += 60;
    else if (recentFollowUps >= 5) score += 50;
    else if (recentFollowUps >= 3) score += 40;
    else if (recentFollowUps >= 1) score += 30;

    // Conversion success (max 40 points)
    if (wonOpportunities >= 5) score += 40;
    else if (wonOpportunities >= 3) score += 35;
    else if (wonOpportunities >= 2) score += 30;
    else if (wonOpportunities >= 1) score += 25;

    return Math.min(score, 100);
  }

  /**
   * Calculate potential score (0-100)
   * Based on company size, industry, and active opportunities
   */
  calculatePotentialScore(client, opportunities) {
    let score = 0;

    // Company scale (max 30 points)
    const scaleScores = {
      'large': 30,
      'medium': 25,
      'small': 20,
      'micro': 15
    };
    score += scaleScores[client.companyScale] || 15;

    // Registered capital (max 30 points)
    const capital = parseFloat(client.registeredCapital || 0);
    if (capital >= 10000000) score += 30;
    else if (capital >= 5000000) score += 25;
    else if (capital >= 1000000) score += 20;
    else if (capital >= 500000) score += 15;
    else if (capital >= 100000) score += 10;

    // Active opportunities (max 40 points)
    const activeOpps = opportunities.filter(opp => opp.status === 'active').length;
    if (activeOpps >= 5) score += 40;
    else if (activeOpps >= 3) score += 35;
    else if (activeOpps >= 2) score += 30;
    else if (activeOpps >= 1) score += 25;

    return Math.min(score, 100);
  }

  /**
   * Determine customer level based on total score
   * A: 80-100, B: 60-79, C: 40-59, D: 0-39
   */
  determineLevel(totalScore) {
    if (totalScore >= 80) return 'A';
    if (totalScore >= 60) return 'B';
    if (totalScore >= 40) return 'C';
    return 'D';
  }

  /**
   * Batch calculate scores for all clients (optimized: 3 batch queries instead of 3N)
   */
  async batchCalculateScores(clientIds = null) {
    try {
      const where = clientIds ? { id: { [Op.in]: clientIds } } : {};
      const clients = await Client.findAll({ where, attributes: ['id', 'companyScale', 'registeredCapital', 'customerLevel'] });

      if (clients.length === 0) {
        return { total: 0, successful: 0, failed: 0, results: [] };
      }

      const ids = clients.map(c => c.id);

      // Batch 1: total follow-up counts per client
      const followUpCounts = await FollowUp.findAll({
        attributes: ['clientId', [FollowUp.sequelize.fn('COUNT', '*'), 'count']],
        where: { clientId: { [Op.in]: ids } },
        group: ['clientId'],
        raw: true
      });

      // Batch 2: recent follow-up counts (last 90 days)
      const recentFollowUpCounts = await FollowUp.findAll({
        attributes: ['clientId', [FollowUp.sequelize.fn('COUNT', '*'), 'count']],
        where: {
          clientId: { [Op.in]: ids },
          followTime: { [Op.gte]: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }
        },
        group: ['clientId'],
        raw: true
      });

      // Batch 3: all opportunities for these clients
      const allOpportunities = await SalesOpportunity.findAll({
        where: { clientId: { [Op.in]: ids } },
        attributes: ['id', 'clientId', 'status', 'expectedAmount'],
        raw: true
      });

      // Index by clientId for fast lookup
      const followUpMap = {};
      followUpCounts.forEach(r => { followUpMap[r.clientId] = { total: parseInt(r.count) || 0, recent: 0 }; });
      recentFollowUpCounts.forEach(r => {
        if (!followUpMap[r.clientId]) followUpMap[r.clientId] = { total: 0, recent: 0 };
        followUpMap[r.clientId].recent = parseInt(r.count) || 0;
      });

      const oppsByClient = {};
      allOpportunities.forEach(o => {
        if (!oppsByClient[o.clientId]) oppsByClient[o.clientId] = [];
        oppsByClient[o.clientId].push(o);
      });

      const results = [];
      for (const client of clients) {
        try {
          const fu = followUpMap[client.id] || { total: 0, recent: 0 };
          const opps = oppsByClient[client.id] || [];

          const followUpScore = this.calculateFollowUpScore(fu.total, fu.recent);

          const totalExpectedAmount = opps.reduce((sum, opp) => sum + parseFloat(opp.expectedAmount || 0), 0);
          const wonCount = opps.filter(opp => opp.status === 'won').length;

          const dealAmountScore = this.calculateDealAmountScore(totalExpectedAmount);
          const interactionScore = this.calculateInteractionScore(fu.recent, wonCount);
          const potentialScore = this.calculatePotentialScore(client, opps);

          const totalScore = Math.round(
            followUpScore * 0.25 +
            dealAmountScore * 0.35 +
            interactionScore * 0.20 +
            potentialScore * 0.20
          );

          const calculatedLevel = this.determineLevel(totalScore);

          await ClientScore.upsert({
            clientId: client.id,
            totalScore,
            followUpScore,
            dealAmountScore,
            interactionScore,
            potentialScore,
            calculatedLevel,
            calculationDate: new Date()
          });

          if (client.customerLevel !== calculatedLevel) {
            await Client.update({ customerLevel: calculatedLevel }, { where: { id: client.id } });
          }

          results.push({
            clientId: client.id,
            totalScore,
            followUpScore,
            dealAmountScore,
            interactionScore,
            potentialScore,
            calculatedLevel,
            breakdown: {
              followUpCount: fu.total,
              recentFollowUps: fu.recent,
              totalExpectedAmount,
              wonOpportunities: wonCount
            }
          });
        } catch (error) {
          console.error(`Error calculating score for client ${client.id}:`, error);
          results.push({ clientId: client.id, error: error.message });
        }
      }

      return {
        total: clients.length,
        successful: results.filter(r => !r.error).length,
        failed: results.filter(r => r.error).length,
        results
      };
    } catch (error) {
      console.error('Batch calculate scores error:', error);
      throw error;
    }
  }

  /**
   * Update client value analysis
   */
  async updateClientValueAnalysis(clientId) {
    try {
      const client = await Client.findByPk(clientId, {
        include: [
          { model: FollowUp, as: 'followUps' },
          { model: SalesOpportunity, as: 'opportunities' }
        ]
      });

      if (!client) {
        throw new Error('客户不存在');
      }

      // Calculate metrics
      const wonOpportunities = client.opportunities.filter(opp => opp.status === 'won');
      const totalRevenue = wonOpportunities.reduce((sum, opp) => {
        return sum + parseFloat(opp.expectedAmount || 0);
      }, 0);

      const totalOrders = wonOpportunities.length;
      const avgOrderAmount = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      const lastOrder = wonOpportunities
        .sort((a, b) => new Date(b.actualCloseDate) - new Date(a.actualCloseDate))[0];
      const lastOrderDate = lastOrder ? lastOrder.actualCloseDate : null;

      const followUpCount = client.followUps.length;
      const lastFollowUp = client.followUps
        .sort((a, b) => new Date(b.followTime) - new Date(a.followTime))[0];
      const lastFollowUpDate = lastFollowUp ? lastFollowUp.followTime : null;

      // Calculate customer lifetime
      const createdDate = new Date(client.createdAt);
      const now = new Date();
      const customerLifetimeDays = Math.floor((now - createdDate) / (1000 * 60 * 60 * 24));

      // Calculate churn risk (0-100, higher = more risk)
      const churnRiskScore = this.calculateChurnRisk(lastFollowUpDate, lastOrderDate, followUpCount);

      // Save analysis
      await ClientValueAnalysis.upsert({
        clientId,
        totalRevenue,
        totalOrders,
        avgOrderAmount,
        lastOrderDate,
        followUpCount,
        lastFollowUpDate,
        customerLifetimeDays,
        churnRiskScore,
        updatedAt: new Date()
      });

      return {
        clientId,
        totalRevenue,
        totalOrders,
        avgOrderAmount,
        lastOrderDate,
        followUpCount,
        lastFollowUpDate,
        customerLifetimeDays,
        churnRiskScore
      };
    } catch (error) {
      console.error('Update client value analysis error:', error);
      throw error;
    }
  }

  /**
   * Calculate churn risk score (0-100)
   */
  calculateChurnRisk(lastFollowUpDate, lastOrderDate, followUpCount) {
    let risk = 0;

    // Days since last follow-up
    if (lastFollowUpDate) {
      const daysSinceFollowUp = Math.floor((new Date() - new Date(lastFollowUpDate)) / (1000 * 60 * 60 * 24));
      if (daysSinceFollowUp > 180) risk += 40;
      else if (daysSinceFollowUp > 90) risk += 30;
      else if (daysSinceFollowUp > 60) risk += 20;
      else if (daysSinceFollowUp > 30) risk += 10;
    } else {
      risk += 50; // Never followed up
    }

    // Days since last order
    if (lastOrderDate) {
      const daysSinceOrder = Math.floor((new Date() - new Date(lastOrderDate)) / (1000 * 60 * 60 * 24));
      if (daysSinceOrder > 365) risk += 30;
      else if (daysSinceOrder > 180) risk += 20;
      else if (daysSinceOrder > 90) risk += 10;
    } else {
      risk += 20; // Never ordered
    }

    // Follow-up frequency
    if (followUpCount === 0) risk += 30;
    else if (followUpCount < 3) risk += 20;
    else if (followUpCount < 5) risk += 10;

    return Math.min(risk, 100);
  }

  /**
   * Get clients by level
   */
  async getClientsByLevel(level) {
    return await Client.findAll({
      where: { customerLevel: level },
      include: [
        { model: ClientScore, as: 'score' },
        { model: ClientValueAnalysis, as: 'valueAnalysis' }
      ],
      order: [['updatedAt', 'DESC']]
    });
  }

  /**
   * Get level distribution statistics
   */
  async getLevelDistribution() {
    const levels = ['A', 'B', 'C', 'D'];
    const distribution = {};

    for (const level of levels) {
      const count = await Client.count({
        where: { customerLevel: level }
      });
      distribution[level] = count;
    }

    return distribution;
  }
}

module.exports = new ClientScoringService();












