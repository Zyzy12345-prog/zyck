/**
 * 线索自动评分引擎
 *
 * 基于多因素加权算法，综合考虑：
 * - 优先级 (25%)
 * - 线索状态 (20%)
 * - 来源质量 (15%)
 * - 预估价值 (15%)
 * - 公司规模 (10%)
 * - 跟进时效 (15%)
 *
 * 总分: 0-100
 * 等级: S(>=85) / A(70-84) / B(55-69) / C(40-54) / D(<40)
 */

// 评分因子配置
let SCORING_CONFIG = {
  priority: {
    label: '优先级',
    weight: 0.25,
    values: { urgent: 100, high: 80, medium: 50, low: 20 }
  },
  status: {
    label: '线索状态',
    weight: 0.20,
    values: { qualified: 100, negotiating: 90, contacted: 60, new: 30, lost: 0, converted: 100 }
  },
  source: {
    label: '来源质量',
    weight: 0.15,
    values: { referral: 95, website: 70, social_media: 60, exhibition: 55, partner: 50, cold_call: 30, other: 20 }
  },
  estimatedValue: {
    label: '预估价值',
    weight: 0.15,
    // 动态计算，不在 values 中
  },
  companyScale: {
    label: '公司规模',
    weight: 0.10,
    values: { large: 100, medium: 70, small: 50, micro: 30 }
  },
  followUpRecency: {
    label: '跟进时效',
    weight: 0.15,
    // 动态计算，基于 lastContactTime
  }
};

/**
 * 计算预估值评分
 * @param {number|null} value
 * @returns {number} 0-100
 */
function calcEstimatedValueScore(value) {
  if (!value) return 10; // 未填写，给最低分
  const v = Number(value);
  if (v >= 100000) return 100;
  if (v >= 50000) return 85;
  if (v >= 10000) return 65;
  if (v >= 5000) return 45;
  if (v >= 1000) return 30;
  return 15;
}

/**
 * 计算跟进时效评分
 * @param {Date|null} lastContactTime
 * @returns {number} 0-100
 */
function calcFollowUpRecencyScore(lastContactTime) {
  if (!lastContactTime) return 0; // 从未联系
  const daysAgo = (Date.now() - new Date(lastContactTime).getTime()) / (1000 * 60 * 60 * 24);
  if (daysAgo <= 1) return 100;  // 今天/昨天
  if (daysAgo <= 3) return 90;
  if (daysAgo <= 7) return 75;
  if (daysAgo <= 14) return 55;
  if (daysAgo <= 30) return 35;
  return 15; // 超过30天
}

/**
 * 计算单个因素的得分
 * @param {object} lead - 线索数据
 * @param {string} factorKey - 因素键名
 * @returns {{ score: number, label: string, weight: number, value: string }}
 */
function calcFactorScore(lead, factorKey) {
  const config = SCORING_CONFIG[factorKey];
  let rawScore = 0;
  let displayValue = '';

  switch (factorKey) {
    case 'priority':
      rawScore = config.values[lead.priority] || 20;
      displayValue = lead.priority || 'unknown';
      break;
    case 'status':
      rawScore = config.values[lead.status] || 10;
      displayValue = lead.status || 'unknown';
      break;
    case 'source':
      rawScore = config.values[lead.source] || 20;
      displayValue = lead.source || 'unknown';
      break;
    case 'estimatedValue':
      rawScore = calcEstimatedValueScore(lead.estimatedValue);
      displayValue = lead.estimatedValue ? `¥${Number(lead.estimatedValue).toLocaleString()}` : '未填写';
      break;
    case 'companyScale':
      rawScore = config.values[lead.companyScale] || 20;
      displayValue = lead.companyScale || 'unknown';
      break;
    case 'followUpRecency':
      rawScore = calcFollowUpRecencyScore(lead.lastContactTime);
      displayValue = lead.lastContactTime
        ? `${Math.floor((Date.now() - new Date(lead.lastContactTime).getTime()) / (1000 * 60 * 60 * 24))}天前`
        : '从未联系';
      break;
    default:
      rawScore = 0;
  }

  return {
    label: config.label,
    weight: config.weight,
    rawScore,
    weightedScore: Math.round(rawScore * config.weight),
    displayValue,
    percentage: Math.round(rawScore)
  };
}

/**
 * 计算线索总分
 * @param {object} lead - 线索实例 (Sequelize model instance or plain object)
 * @returns {{ totalScore: number, level: string, breakdown: array }}
 */
function calculateLeadScore(lead) {
  const factors = Object.keys(SCORING_CONFIG);
  const breakdown = [];
  let totalScore = 0;

  for (const factorKey of factors) {
    const result = calcFactorScore(lead, factorKey);
    breakdown.push(result);
    totalScore += result.weightedScore;
  }

  // 四舍五入
  totalScore = Math.round(totalScore);

  // 确定等级
  let level;
  if (totalScore >= 85) level = 'S';
  else if (totalScore >= 70) level = 'A';
  else if (totalScore >= 55) level = 'B';
  else if (totalScore >= 40) level = 'C';
  else level = 'D';

  return { totalScore, level, breakdown };
}

/**
 * 获取评分配置（供前端使用）
 */
function getScoringConfig() {
  const config = {};
  for (const [key, value] of Object.entries(SCORING_CONFIG)) {
    config[key] = {
      label: value.label,
      weight: value.weight,
      values: value.values || null,
      dynamic: !value.values // 标记动态计算的因素
    };
  }
  return config;
}

/**
 * 更新评分配置
 * @param {object} newConfig - 部分或全部配置覆盖
 * @returns {object} 更新后的配置
 */
function updateScoringConfig(newConfig) {
  for (const [key, value] of Object.entries(newConfig)) {
    if (SCORING_CONFIG[key]) {
      if (value.weight !== undefined) {
        SCORING_CONFIG[key].weight = value.weight;
      }
      if (value.values !== undefined) {
        SCORING_CONFIG[key].values = value.values;
      }
    }
  }
  return getScoringConfig();
}

/**
 * 重置评分配置为默认值
 */
function resetScoringConfig() {
  SCORING_CONFIG = {
    priority: {
      label: '优先级',
      weight: 0.25,
      values: { urgent: 100, high: 80, medium: 50, low: 20 }
    },
    status: {
      label: '线索状态',
      weight: 0.20,
      values: { qualified: 100, negotiating: 90, contacted: 60, new: 30, lost: 0, converted: 100 }
    },
    source: {
      label: '来源质量',
      weight: 0.15,
      values: { referral: 95, website: 70, social_media: 60, exhibition: 55, partner: 50, cold_call: 30, other: 20 }
    },
    estimatedValue: {
      label: '预估价值',
      weight: 0.15,
    },
    companyScale: {
      label: '公司规模',
      weight: 0.10,
      values: { large: 100, medium: 70, small: 50, micro: 30 }
    },
    followUpRecency: {
      label: '跟进时效',
      weight: 0.15,
    }
  };
  return getScoringConfig();
}

module.exports = {
  calculateLeadScore,
  getScoringConfig,
  updateScoringConfig,
  resetScoringConfig,
  SCORING_CONFIG
};
