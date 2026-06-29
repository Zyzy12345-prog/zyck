const { CustomerLead, Client, User, IndustryCategory, LeadTag, LeadFollowUp } = require('../models');
const { Op, fn, col } = require('sequelize');
const XLSX = require('xlsx');
const path = require('path');
const { calculateLeadScore, getScoringConfig, updateScoringConfig } = require('../services/leadScoringService');
const { initRules, getRules, updateRules, resetRules, batchCheckReclaimable, reclaimLead } = require('../services/leadReclaimService');

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
      tagIds,
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

    // 标签筛选
    const tagInclude = tagIds ? {
      model: LeadTag,
      as: 'tags',
      where: { id: { [Op.in]: Array.isArray(tagIds) ? tagIds.map(Number) : tagIds.split(',').map(Number) } },
      through: { attributes: [] },
      required: true
    } : {
      model: LeadTag,
      as: 'tags',
      through: { attributes: [] },
      required: false
    };

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
        },
        tagInclude
      ],
      distinct: true
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
        },
        {
          model: LeadTag,
          as: 'tags',
          through: { attributes: [] },
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

    // 附加评分详情
    const { totalScore, level, breakdown } = calculateLeadScore(lead);

    res.json({
      success: true,
      data: {
        ...lead.toJSON(),
        scoreDetail: { totalScore, level, breakdown }
      }
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

    // 重复检测：公司名称 + 电话
    if (leadData.companyName && leadData.phone) {
      const existing = await CustomerLead.findOne({
        where: {
          companyName: leadData.companyName,
          phone: leadData.phone,
          status: { [Op.ne]: 'lost' }
        }
      });
      if (existing) {
        return res.status(409).json({
          success: false,
          message: `线索"${leadData.companyName}"（${leadData.phone}）已存在，请勿重复创建`,
          duplicate: {
            id: existing.id,
            companyName: existing.companyName,
            phone: existing.phone,
            status: existing.status,
            createdAt: existing.createdAt
          }
        });
      }
    }

    // 自动计算评分
    const { totalScore } = calculateLeadScore(leadData);
    leadData.score = totalScore;

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
      data: {
        ...createdLead.toJSON(),
        scoreDetail: calculateLeadScore(createdLead)
      }
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

    // 重新计算评分（如果相关字段发生变化）
    const scoringFields = ['priority', 'status', 'source', 'estimatedValue', 'companyScale', 'lastContactTime'];
    const needRecalc = scoringFields.some(field => req.body[field] !== undefined);
    if (needRecalc) {
      const { totalScore } = calculateLeadScore(lead);
      await lead.update({ score: totalScore }, { hooks: false });
    }

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
      convertedAt: new Date(),
      score: 100
    });

    res.json({
      success: true,
      message: '线索转化成功',
      data: { lead, client }
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
      { assignedTo: userId, assignedAt: new Date() },
      { where: { id: { [Op.in]: leadIds } } }
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

    await CustomerLead.update({ status }, { where: { id: { [Op.in]: leadIds } } });

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

    const totalLeads = await CustomerLead.count({ where });
    const byStatus = await CustomerLead.findAll({
      where,
      attributes: ['status', [CustomerLead.sequelize.fn('COUNT', CustomerLead.sequelize.col('id')), 'count']],
      group: ['status']
    });
    const byPriority = await CustomerLead.findAll({
      where,
      attributes: ['priority', [CustomerLead.sequelize.fn('COUNT', CustomerLead.sequelize.col('id')), 'count']],
      group: ['priority']
    });
    const bySource = await CustomerLead.findAll({
      where,
      attributes: ['source', [CustomerLead.sequelize.fn('COUNT', CustomerLead.sequelize.col('id')), 'count']],
      group: ['source']
    });

    const convertedCount = await CustomerLead.count({ where: { ...where, status: 'converted' } });
    const conversionRate = totalLeads > 0 ? ((convertedCount / totalLeads) * 100).toFixed(2) : 0;

    // 评分等级分布
    const allLeads = await CustomerLead.findAll({ where, attributes: ['score'] });
    const distribution = { S: 0, A: 0, B: 0, C: 0, D: 0 };
    allLeads.forEach(l => {
      const s = l.score || 0;
      if (s >= 85) distribution.S++;
      else if (s >= 70) distribution.A++;
      else if (s >= 55) distribution.B++;
      else if (s >= 40) distribution.C++;
      else distribution.D++;
    });

    // 平均评分
    const avgScore = allLeads.length > 0
      ? Math.round(allLeads.reduce((sum, l) => sum + (l.score || 0), 0) / allLeads.length)
      : 0;

    res.json({
      success: true,
      data: {
        totalLeads, convertedCount, conversionRate, avgScore, scoreDistribution: distribution,
        byStatus: byStatus.reduce((acc, item) => { acc[item.status] = parseInt(item.dataValues.count); return acc; }, {}),
        byPriority: byPriority.reduce((acc, item) => { acc[item.priority] = parseInt(item.dataValues.count); return acc; }, {}),
        bySource: bySource.reduce((acc, item) => { acc[item.source] = parseInt(item.dataValues.count); return acc; }, {})
      }
    });
  } catch (error) {
    next(error);
  }
};

// ==================== 评分相关端点 ====================

// 重新计算单条线索评分
exports.recalculateScore = async (req, res, next) => {
  try {
    const { id } = req.params;
    const lead = await CustomerLead.findByPk(id);

    if (!lead) {
      return res.status(404).json({ success: false, message: '线索不存在' });
    }

    const { totalScore, level, breakdown } = calculateLeadScore(lead);
    await lead.update({ score: totalScore }, { hooks: false });

    res.json({
      success: true,
      message: '评分已更新',
      data: { totalScore, level, breakdown }
    });
  } catch (error) {
    next(error);
  }
};

// 批量重新计算所有线索评分
exports.batchRecalculateScores = async (req, res, next) => {
  try {
    // 只查评分需要的字段，避免全表字段加载
    const leads = await CustomerLead.findAll({
      attributes: ['id', 'companyName', 'score', 'priority', 'status', 'source', 'estimatedValue', 'companyScale', 'lastContactTime']
    });

    let updated = 0;
    const results = [];
    const BATCH_SIZE = 200;

    // 分批处理并批量更新
    for (let i = 0; i < leads.length; i += BATCH_SIZE) {
      const batch = leads.slice(i, i + BATCH_SIZE);
      const updates = [];

      for (const lead of batch) {
        const { totalScore, level } = calculateLeadScore(lead);
        if (lead.score !== totalScore) {
          updates.push({ id: lead.id, score: totalScore });
          updated++;
        }
        results.push({ id: lead.id, companyName: lead.companyName, score: totalScore, level });
      }

      if (updates.length > 0) {
        await CustomerLead.bulkCreate(updates, { updateOnDuplicate: ['score'] });
      }
    }

    const distribution = { S: 0, A: 0, B: 0, C: 0, D: 0 };
    results.forEach(r => distribution[r.level]++);

    res.json({
      success: true,
      message: `评分完成，更新了 ${updated} 条线索`,
      data: { total: leads.length, updated, distribution, results }
    });
  } catch (error) {
    next(error);
  }
};

// 获取评分配置
exports.getScoringConfig = async (req, res, next) => {
  try {
    const config = getScoringConfig();
    res.json({ success: true, data: config });
  } catch (error) {
    next(error);
  }
};

// 更新评分配置
exports.updateScoringConfig = async (req, res, next) => {
  try {
    const config = updateScoringConfig(req.body);
    res.json({ success: true, message: '评分配置已更新', data: config });
  } catch (error) {
    next(error);
  }
};

// ==================== 回收相关端点 ====================

// 检查可回收线索
exports.checkReclaimable = async (req, res, next) => {
  try {
    const { status } = req.query;
    const where = {};
    // 只检查活跃状态
    if (status) {
      where.status = status;
    } else {
      where.status = { [Op.in]: ['new', 'contacted', 'qualified', 'negotiating'] };
    }

    const leads = await CustomerLead.findAll({
      where,
      include: [
        { model: User, as: 'assignedUser', attributes: ['id', 'username'], required: false }
      ],
      order: [['createdAt', 'ASC']]
    });

    // 获取每条线索的跟进次数（批量聚合查询避免 N+1）
    const leadIds = leads.map(l => l.id);
    const followUpCounts = await LeadFollowUp.findAll({
      where: { leadId: { [Op.in]: leadIds } },
      attributes: ['leadId', [fn('COUNT', col('id')), 'count']],
      group: ['leadId'],
      raw: true
    });
    const countMap = {};
    followUpCounts.forEach(f => { countMap[f.leadId] = parseInt(f.count); });

    const leadsWithCounts = leads.map(l => ({
      ...l.toJSON(),
      followUpCount: countMap[l.id] || 0
    }));

    const { reclaimable, warnings } = await batchCheckReclaimable(leadsWithCounts);

    res.json({
      success: true,
      data: {
        reclaimable,
        warnings,
        total: leads.length,
        reclaimableCount: reclaimable.length,
        warningCount: warnings.length
      }
    });
  } catch (error) {
    next(error);
  }
};

// 批量回收线索
exports.batchReclaimLeads = async (req, res, next) => {
  try {
    const { leadIds, reason } = req.body;

    if (!Array.isArray(leadIds) || leadIds.length === 0) {
      return res.status(400).json({ success: false, message: '请选择要回收的线索' });
    }

    const leads = await CustomerLead.findAll({ where: { id: { [Op.in]: leadIds } } });
    const results = [];
    let reclaimed = 0;

    for (const lead of leads) {
      if (['converted', 'lost'].includes(lead.status)) {
        results.push({ id: lead.id, companyName: lead.companyName, reclaimed: false, reason: '已转化或已丢失' });
        continue;
      }
      await reclaimLead(lead, reason || '手动回收');
      reclaimed++;
      results.push({ id: lead.id, companyName: lead.companyName, reclaimed: true });
    }

    res.json({
      success: true,
      message: `成功回收 ${reclaimed} 条线索`,
      data: { total: leads.length, reclaimed, results }
    });
  } catch (error) {
    next(error);
  }
};

// 获取回收规则
exports.getReclaimRules = async (req, res, next) => {
  try {
    const rules = await getRules();
    res.json({ success: true, data: rules });
  } catch (error) {
    next(error);
  }
};

// 更新回收规则
exports.updateReclaimRules = async (req, res, next) => {
  try {
    const rules = await updateRules(req.body);
    res.json({ success: true, message: '规则已更新', data: rules });
  } catch (error) {
    next(error);
  }
};

// ==================== 导入导出 ====================

// 线索导出 Excel
exports.exportLeads = async (req, res, next) => {
  try {
    const { status, priority, source, search } = req.query;
    const where = {};

    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (source) where.source = source;
    if (search) {
      where[Op.or] = [
        { companyName: { [Op.like]: `%${search}%` } },
        { contactPerson: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } }
      ];
    }

    const leads = await CustomerLead.findAll({
      where,
      order: [['createdAt', 'DESC']],
      include: [
        { model: User, as: 'assignedUser', attributes: ['username'], required: false },
        { model: LeadTag, as: 'tags', through: { attributes: [] }, required: false }
      ]
    });

    // 转换为导出数据
    const exportData = leads.map(lead => ({
      '公司名称': lead.companyName,
      '联系人': lead.contactPerson || '',
      '电话': lead.phone || '',
      '邮箱': lead.email || '',
      '微信': lead.wechat || '',
      '来源': lead.source || '',
      '优先级': lead.priority || '',
      '状态': lead.status || '',
      '预估价值': lead.estimatedValue || '',
      '评分': lead.score || 0,
      '负责人': lead.assignedUser?.username || '',
      '标签': (lead.tags || []).map(t => t.name).join(', '),
      '备注': lead.notes || '',
      '地址': lead.address || '',
      '网址': lead.website || '',
      '创建时间': lead.createdAt ? new Date(lead.createdAt).toLocaleDateString('zh-CN') : '',
      '最后联系': lead.lastContactTime ? new Date(lead.lastContactTime).toLocaleDateString('zh-CN') : ''
    }));

    // 创建工作簿
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);

    // 设置列宽
    ws['!cols'] = [
      { wch: 25 }, { wch: 12 }, { wch: 15 }, { wch: 25 }, { wch: 15 },
      { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 8 },
      { wch: 12 }, { wch: 20 }, { wch: 30 }, { wch: 30 }, { wch: 25 },
      { wch: 12 }, { wch: 12 }
    ];

    XLSX.utils.book_append_sheet(wb, ws, '线索数据');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const filename = `线索导出_${new Date().toISOString().slice(0, 10)}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
    res.send(buffer);
  } catch (error) {
    next(error);
  }
};

// 下载导入模板
exports.downloadTemplate = async (req, res, next) => {
  try {
    const templateData = [{
      '公司名称': '示例科技有限公司',
      '联系人': '张三',
      '电话': '13800138000',
      '邮箱': 'zhangsan@example.com',
      '微信': 'zhangsan_wx',
      '来源': 'website',
      '优先级': 'medium',
      '预估价值': 50000,
      '备注': '通过官网咨询',
      '地址': '北京市朝阳区',
      '网址': 'www.example.com'
    }];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(templateData);

    // 添加说明 sheet
    const instructionData = [
      { '字段': '公司名称', '必填': '是', '说明': '公司全称，最多200字' },
      { '字段': '联系人', '必填': '否', '说明': '联系人姓名' },
      { '字段': '电话', '必填': '否', '说明': '11位手机号' },
      { '字段': '邮箱', '必填': '否', '说明': '有效邮箱地址' },
      { '字段': '微信', '必填': '否', '说明': '微信号' },
      { '字段': '来源', '必填': '否', '说明': 'website/referral/cold_call/exhibition/social_media/partner/other' },
      { '字段': '优先级', '必填': '否', '说明': 'low/medium/high/urgent，默认medium' },
      { '字段': '预估价值', '必填': '否', '说明': '数字，单位为元' },
      { '字段': '备注', '必填': '否', '说明': '任意文本' },
      { '字段': '地址', '必填': '否', '说明': '公司地址' },
      { '字段': '网址', '必填': '否', '说明': '公司网址' }
    ];
    const ws2 = XLSX.utils.json_to_sheet(instructionData);
    ws2['!cols'] = [{ wch: 12 }, { wch: 8 }, { wch: 50 }];

    XLSX.utils.book_append_sheet(wb, ws, '导入模板');
    XLSX.utils.book_append_sheet(wb, ws2, '字段说明');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent('线索导入模板.xlsx')}`);
    res.send(buffer);
  } catch (error) {
    next(error);
  }
};

// 线索批量导入
exports.importLeads = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: '请上传Excel文件' });
    }

    // 解析 Excel
    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    if (data.length === 0) {
      return res.status(400).json({ success: false, message: '文件中没有数据' });
    }

    const results = { total: data.length, created: 0, skipped: 0, errors: [] };
    const sourceMap = { '官网': 'website', '推荐': 'referral', '陌拜': 'cold_call', '展会': 'exhibition', '社交媒体': 'social_media', '合作伙伴': 'partner', '其他': 'other' };
    const priorityMap = { '低': 'low', '中': 'medium', '高': 'high', '紧急': 'urgent' };

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNum = i + 2; // Excel row number (1-indexed + header)

      try {
        // 验证必填字段
        const companyName = row['公司名称'] || row['companyName'];
        if (!companyName || !companyName.toString().trim()) {
          results.errors.push({ row: rowNum, message: '公司名称为空' });
          results.skipped++;
          continue;
        }

        const leadData = {
          companyName: companyName.toString().trim(),
          contactPerson: (row['联系人'] || row['contactPerson'] || '').toString().trim(),
          phone: (row['电话'] || row['phone'] || '').toString().trim(),
          email: (row['邮箱'] || row['email'] || '').toString().trim(),
          wechat: (row['微信'] || row['wechat'] || '').toString().trim(),
          source: sourceMap[row['来源']] || row['source'] || 'other',
          priority: priorityMap[row['优先级']] || row['priority'] || 'medium',
          estimatedValue: parseFloat(row['预估价值'] || row['estimatedValue'] || 0) || null,
          notes: (row['备注'] || row['notes'] || '').toString().trim(),
          address: (row['地址'] || row['address'] || '').toString().trim(),
          website: (row['网址'] || row['website'] || '').toString().trim(),
          createdBy: req.user.id
        };

        // 自动计算评分
        const { totalScore } = calculateLeadScore(leadData);
        leadData.score = totalScore;

        // 检查重复（公司名称+电话）
        const existing = await CustomerLead.findOne({
          where: {
            companyName: leadData.companyName,
            ...(leadData.phone ? { phone: leadData.phone } : {})
          }
        });

        if (existing) {
          results.errors.push({ row: rowNum, message: `"${leadData.companyName}" 已存在（重复检测）` });
          results.skipped++;
          continue;
        }

        await CustomerLead.create(leadData);
        results.created++;
      } catch (err) {
        results.errors.push({ row: rowNum, message: err.message });
        results.skipped++;
      }
    }

    // 清理上传文件
    const fs = require('fs');
    if (req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.json({
      success: true,
      message: `导入完成：成功 ${results.created} 条，跳过 ${results.skipped} 条`,
      data: results
    });
  } catch (error) {
    next(error);
  }
};
