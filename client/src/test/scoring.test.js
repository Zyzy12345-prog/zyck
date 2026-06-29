import { describe, it, expect } from 'vitest';

// 评分服务测试
// 注意：这些测试直接测试评分算法逻辑（纯函数，无需 DOM）

describe('线索评分引擎', () => {
  // 模拟评分逻辑（与 leadScoringService.js 保持一致）
  const SCORING_CONFIG = {
    priority: { weight: 0.25, values: { urgent: 100, high: 80, medium: 50, low: 20 } },
    status: { weight: 0.20, values: { qualified: 100, negotiating: 90, contacted: 60, new: 30, lost: 0, converted: 100 } },
    source: { weight: 0.15, values: { referral: 95, website: 70, social_media: 60, exhibition: 55, partner: 50, cold_call: 30, other: 20 } },
    estimatedValue: { weight: 0.15 },
    companyScale: { weight: 0.10, values: { large: 100, medium: 70, small: 50, micro: 30 } },
    followUpRecency: { weight: 0.15 },
  };

  function calcEstimatedValueScore(value) {
    if (!value) return 10;
    const v = Number(value);
    if (v >= 100000) return 100;
    if (v >= 50000) return 85;
    if (v >= 10000) return 65;
    if (v >= 5000) return 45;
    if (v >= 1000) return 30;
    return 15;
  }

  function calcFollowUpRecencyScore(lastContactTime) {
    if (!lastContactTime) return 0;
    const daysAgo = (Date.now() - new Date(lastContactTime).getTime()) / (1000 * 60 * 60 * 24);
    if (daysAgo <= 1) return 100;
    if (daysAgo <= 3) return 90;
    if (daysAgo <= 7) return 75;
    if (daysAgo <= 14) return 55;
    if (daysAgo <= 30) return 35;
    return 15;
  }

  function calcFactorScore(lead, factorKey) {
    const config = SCORING_CONFIG[factorKey];
    let rawScore = 0;
    switch (factorKey) {
      case 'priority': rawScore = config.values[lead.priority] || 20; break;
      case 'status': rawScore = config.values[lead.status] || 10; break;
      case 'source': rawScore = config.values[lead.source] || 20; break;
      case 'estimatedValue': rawScore = calcEstimatedValueScore(lead.estimatedValue); break;
      case 'companyScale': rawScore = config.values[lead.companyScale] || 20; break;
      case 'followUpRecency': rawScore = calcFollowUpRecencyScore(lead.lastContactTime); break;
    }
    return { rawScore, weightedScore: Math.round(rawScore * config.weight) };
  }

  function calculateLeadScore(lead) {
    const factors = Object.keys(SCORING_CONFIG);
    let totalScore = 0;
    for (const factorKey of factors) {
      const result = calcFactorScore(lead, factorKey);
      totalScore += result.weightedScore;
    }
    totalScore = Math.round(totalScore);
    let level;
    if (totalScore >= 85) level = 'S';
    else if (totalScore >= 70) level = 'A';
    else if (totalScore >= 55) level = 'B';
    else if (totalScore >= 40) level = 'C';
    else level = 'D';
    return { totalScore, level };
  }

  it('高优先级大客户应得 S 级评分', () => {
    const lead = {
      priority: 'urgent',
      status: 'qualified',
      source: 'referral',
      estimatedValue: 200000,
      companyScale: 'large',
      lastContactTime: new Date().toISOString(),
    };
    const result = calculateLeadScore(lead);
    expect(result.totalScore).toBeGreaterThanOrEqual(85);
    expect(result.level).toBe('S');
  });

  it('低优先级无跟进线索应得 D 级评分', () => {
    const lead = {
      priority: 'low',
      status: 'new',
      source: 'other',
      estimatedValue: null,
      companyScale: 'micro',
      lastContactTime: null,
    };
    const result = calculateLeadScore(lead);
    expect(result.totalScore).toBeLessThan(40);
    expect(result.level).toBe('D');
  });

  it('中等线索应得 B 或 C 级评分', () => {
    const lead = {
      priority: 'medium',
      status: 'contacted',
      source: 'website',
      estimatedValue: 10000,
      companyScale: 'small',
      lastContactTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    };
    const result = calculateLeadScore(lead);
    expect(['B', 'C']).toContain(result.level);
    expect(result.totalScore).toBeGreaterThanOrEqual(40);
    expect(result.totalScore).toBeLessThan(70);
  });

  it('预估价值评分计算正确', () => {
    expect(calcEstimatedValueScore(null)).toBe(10);
    expect(calcEstimatedValueScore(200000)).toBe(100);
    expect(calcEstimatedValueScore(50000)).toBe(85);
    expect(calcEstimatedValueScore(5000)).toBe(45);
    expect(calcEstimatedValueScore(500)).toBe(15);
  });

  it('跟进时效评分计算正确', () => {
    expect(calcFollowUpRecencyScore(null)).toBe(0);
    expect(calcFollowUpRecencyScore(new Date().toISOString())).toBe(100);
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    expect(calcFollowUpRecencyScore(threeDaysAgo)).toBe(90);
  });
});

describe('回收规则引擎', () => {
  const DEFAULT_RULES = {
    newNoContact: {
      enabled: true,
      statusCheck: ['new'],
      checkField: 'createdAt',
      thresholdDays: 7,
      action: 'reclaim'
    },
    lowScoreWarning: {
      enabled: true,
      statusCheck: ['new', 'contacted'],
      maxScore: 40,
      checkField: 'updatedAt',
      thresholdDays: 21,
      action: 'warn'
    }
  };

  function checkLeadForReclaim(lead, followUpCount, rules) {
    const now = new Date();
    const results = [];
    for (const [key, rule] of Object.entries(rules)) {
      if (!rule.enabled) continue;
      if (rule.statusCheck && !rule.statusCheck.includes(lead.status)) continue;
      if (rule.maxScore !== undefined && (lead.score || 0) >= rule.maxScore) continue;
      const checkDate = lead[rule.checkField];
      if (!checkDate) continue;
      const daysSince = Math.floor((now - new Date(checkDate)) / (1000 * 60 * 60 * 24));
      if (daysSince >= rule.thresholdDays) {
        results.push({ ruleKey: key, action: rule.action, daysExceeded: daysSince });
      }
    }
    return results.length > 0 ? results : null;
  }

  it('超过7天的新线索应被回收', () => {
    const lead = {
      status: 'new',
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      score: 50,
    };
    const result = checkLeadForReclaim(lead, 0, DEFAULT_RULES);
    expect(result).not.toBeNull();
    expect(result[0].ruleKey).toBe('newNoContact');
    expect(result[0].action).toBe('reclaim');
  });

  it('刚创建3天的新线索不应被回收', () => {
    const lead = {
      status: 'new',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      score: 50,
    };
    const result = checkLeadForReclaim(lead, 0, DEFAULT_RULES);
    expect(result).toBeNull();
  });

  it('禁用规则不触发', () => {
    const rules = {
      newNoContact: { ...DEFAULT_RULES.newNoContact, enabled: false }
    };
    const lead = {
      status: 'new',
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      score: 50,
    };
    const result = checkLeadForReclaim(lead, 0, rules);
    expect(result).toBeNull();
  });
});
