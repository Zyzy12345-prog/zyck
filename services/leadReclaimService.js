/**
 * 线索自动回收规则引擎
 *
 * 当线索满足以下条件时，自动回收至公海池：
 * 1. 新线索超过 N 天未联系 → 回收
 * 2. 已分配线索超过 N 天未跟进 → 回收
 * 3. 已联系线索超过 N 天无更新 → 回收
 * 4. 低评分线索标记检查
 *
 * 规则支持数据库持久化，服务重启不丢失配置。
 */

const { ReclaimRule } = require('../models');

// 默认回收规则配置
const DEFAULT_RULES = {
  // 规则1: 新线索未联系回收
  newNoContact: {
    enabled: true,
    label: '新线索未联系回收',
    description: '状态为"新线索"且创建超过指定天数未分配或未联系的线索',
    statusCheck: ['new'],
    checkField: 'createdAt',
    thresholdDays: 7,
    action: 'reclaim'
  },
  // 规则2: 已分配未跟进回收
  assignedNoFollowUp: {
    enabled: true,
    label: '已分配未跟进回收',
    description: '已分配给销售但超过指定天数没有任何跟进记录的线索',
    statusCheck: ['new', 'contacted'],
    checkField: 'assignedAt',
    thresholdDays: 14,
    requireAssigned: true,
    action: 'reclaim'
  },
  // 规则3: 长期未联系回收
  longNoContact: {
    enabled: true,
    label: '长期未联系回收',
    description: '最后联系时间超过指定天数，线索处于停滞状态',
    statusCheck: ['contacted', 'qualified', 'negotiating'],
    checkField: 'lastContactTime',
    thresholdDays: 30,
    action: 'reclaim'
  },
  // 规则4: 低评分线索预警
  lowScoreWarning: {
    enabled: true,
    label: '低评分线索预警',
    description: '评分低于指定阈值且超过指定天数无进展的线索',
    statusCheck: ['new', 'contacted', 'qualified', 'negotiating'],
    maxScore: 40,
    checkField: 'updatedAt',
    thresholdDays: 21,
    action: 'warn'
  },
  // 规则5: 长时间未处理线索
  staleNegotiating: {
    enabled: true,
    label: '洽谈停滞回收',
    description: '处于洽谈中但超过指定天数未更新的线索',
    statusCheck: ['negotiating'],
    checkField: 'updatedAt',
    thresholdDays: 45,
    action: 'reclaim'
  }
};

// 运行时规则缓存
let activeRules = null;

/**
 * 将默认规则写入数据库
 */
async function seedDefaultRules() {
  const entries = Object.entries(DEFAULT_RULES).map(([key, rule]) => ({
    ruleKey: key,
    label: rule.label,
    description: rule.description,
    enabled: rule.enabled,
    statusCheck: rule.statusCheck || [],
    checkField: rule.checkField,
    thresholdDays: rule.thresholdDays || null,
    maxScore: rule.maxScore || null,
    requireAssigned: rule.requireAssigned || false,
    action: rule.action
  }));
  try {
    await ReclaimRule.bulkCreate(entries, { ignoreDuplicates: true });
  } catch (e) {
    // 如果 bulkCreate 不支持 ignoreDuplicates，逐个 upsert
    for (const entry of entries) {
      await ReclaimRule.findOrCreate({
        where: { ruleKey: entry.ruleKey },
        defaults: entry
      });
    }
  }
}

/**
 * 从数据库加载规则到内存
 */
async function loadRulesFromDB() {
  const dbRules = await ReclaimRule.findAll();
  if (dbRules.length > 0) {
    activeRules = {};
    for (const rule of dbRules) {
      activeRules[rule.ruleKey] = {
        enabled: rule.enabled,
        label: rule.label,
        description: rule.description,
        statusCheck: rule.statusCheck || [],
        checkField: rule.checkField,
        thresholdDays: rule.thresholdDays,
        maxScore: rule.maxScore,
        requireAssigned: rule.requireAssigned || false,
        action: rule.action
      };
    }
  } else {
    // 数据库无记录，使用默认规则并写入
    activeRules = { ...DEFAULT_RULES };
    await seedDefaultRules();
  }
}

/**
 * 初始化规则（服务启动时调用）
 */
async function initRules() {
  if (activeRules) return activeRules;
  await loadRulesFromDB();
  console.log(`✅ 回收规则已初始化 (${Object.keys(activeRules).length} 条规则)`);
  return activeRules;
}

/**
 * 获取当前规则配置
 */
async function getRules() {
  if (!activeRules) await initRules();
  return { ...activeRules };
}

/**
 * 更新规则配置（同步内存 + 异步写库）
 * @param {object} newRules
 */
async function updateRules(newRules) {
  if (!activeRules) await initRules();
  for (const [key, value] of Object.entries(newRules)) {
    if (activeRules[key]) {
      // 更新内存
      Object.assign(activeRules[key], value);
      // 持久化到数据库
      const dbUpdate = {};
      if (value.enabled !== undefined) dbUpdate.enabled = value.enabled;
      if (value.thresholdDays !== undefined) dbUpdate.thresholdDays = value.thresholdDays;
      if (value.maxScore !== undefined) dbUpdate.maxScore = value.maxScore;
      if (value.statusCheck !== undefined) dbUpdate.statusCheck = value.statusCheck;
      if (value.checkField !== undefined) dbUpdate.checkField = value.checkField;
      if (value.action !== undefined) dbUpdate.action = value.action;
      await ReclaimRule.update(dbUpdate, { where: { ruleKey: key } });
    }
  }
  return activeRules;
}

/**
 * 重置为默认规则
 */
async function resetRules() {
  activeRules = { ...DEFAULT_RULES };
  // 同步到数据库
  for (const [key, rule] of Object.entries(DEFAULT_RULES)) {
    await ReclaimRule.update(
      { enabled: rule.enabled, thresholdDays: rule.thresholdDays, maxScore: rule.maxScore, action: rule.action },
      { where: { ruleKey: key } }
    );
  }
  return activeRules;
}

/**
 * 检查单条线索是否需要回收
 * @param {object} lead - CustomerLead 实例
 * @param {number} followUpCount - 跟进次数
 * @returns {object|null} 回收建议或 null
 */
async function checkLeadForReclaim(lead, followUpCount = 0) {
  if (!activeRules) await initRules();
  const now = new Date();
  const results = [];

  for (const [key, rule] of Object.entries(activeRules)) {
    if (!rule.enabled) continue;

    // 状态检查
    if (rule.statusCheck && !rule.statusCheck.includes(lead.status)) continue;

    // 已分配检查
    if (rule.requireAssigned && !lead.assignedTo) continue;

    // 评分阈值检查
    if (rule.maxScore !== undefined && (lead.score || 0) >= rule.maxScore) continue;

    // 时间检查
    const checkDate = lead[rule.checkField];
    if (!checkDate) {
      // 如果检查字段为 null（如从未联系），使用 createdAt
      if (rule.checkField === 'lastContactTime' && !lead.lastContactTime) {
        const daysSinceCreate = Math.floor((now - new Date(lead.createdAt)) / (1000 * 60 * 60 * 24));
        if (daysSinceCreate >= rule.thresholdDays) {
          results.push({
            ruleKey: key,
            label: rule.label,
            action: rule.action,
            daysExceeded: daysSinceCreate,
            reason: `创建后从未联系，已过 ${daysSinceCreate} 天`
          });
        }
      }
      continue;
    }

    const daysSince = Math.floor((now - new Date(checkDate)) / (1000 * 60 * 60 * 24));
    if (daysSince < rule.thresholdDays) continue;

    // 跟进次数额外检查：如果有跟进记录但最近未联系
    if (rule.checkField === 'lastContactTime' && followUpCount > 0) {
      // 放宽阈值：有跟进但最近未联系
      const relaxedThreshold = Math.floor(rule.thresholdDays * 1.5);
      if (daysSince < relaxedThreshold) continue;
    }

    results.push({
      ruleKey: key,
      label: rule.label,
      action: rule.action,
      daysExceeded: daysSince,
      reason: `已超过 ${rule.thresholdDays} 天阈值（实际 ${daysSince} 天）`
    });
  }

  return results.length > 0 ? results : null;
}

/**
 * 批量检查可回收线索
 * @param {Array} leads - 线索列表（需包含 followUpCount）
 * @returns {Array} 可回收线索列表
 */
async function batchCheckReclaimable(leads) {
  if (!activeRules) await initRules();
  const reclaimable = [];
  const warnings = [];

  for (const lead of leads) {
    const result = await checkLeadForReclaim(lead, lead.followUpCount || 0);
    if (!result) continue;

    const hasReclaim = result.some(r => r.action === 'reclaim');
    const hasWarn = result.some(r => r.action === 'warn');

    const entry = {
      id: lead.id,
      companyName: lead.companyName,
      contactPerson: lead.contactPerson,
      status: lead.status,
      priority: lead.priority,
      score: lead.score,
      assignedUser: lead.assignedUser?.username || null,
      createdAt: lead.createdAt,
      lastContactTime: lead.lastContactTime,
      followUpCount: lead.followUpCount || 0,
      rules: result
    };

    if (hasReclaim) reclaimable.push(entry);
    else if (hasWarn) warnings.push(entry);
  }

  return { reclaimable, warnings };
}

/**
 * 执行回收操作
 * @param {object} lead - 线索实例
 * @param {string} reason - 回收原因
 * @returns {object} 回收结果
 */
async function reclaimLead(lead, reason = '自动回收规则') {
  // 更新线索状态为 lost，标记丢失原因
  const oldStatus = lead.status;
  await lead.update({
    status: 'lost',
    lostReason: `${reason}（原状态: ${oldStatus}）`,
    assignedTo: null,
    assignedAt: null
  });
  return {
    id: lead.id,
    companyName: lead.companyName,
    oldStatus,
    newStatus: 'lost',
    reason
  };
}

module.exports = {
  DEFAULT_RULES,
  initRules,
  getRules,
  updateRules,
  resetRules,
  checkLeadForReclaim,
  batchCheckReclaimable,
  reclaimLead
};
