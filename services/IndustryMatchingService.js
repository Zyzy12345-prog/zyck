const { IndustryCategory } = require('../models');
const { Op } = require('sequelize');

/**
 * 行业智能匹配服务
 * 实现完全匹配、关键词匹配、同义词匹配、模糊匹配
 */
class IndustryMatchingService {
  constructor() {
    // 同义词字典
    this.synonyms = {
      '科技': ['科学技术', '高新技术', 'IT', '信息技术', '互联网', '软件', '硬件', '电子'],
      '科研': ['科学研究', '研发', 'R&D', '技术研发', '研究开发'],
      '技术服务': ['技术咨询', '技术支持', '技术开发'],
      '金融': ['银行', '证券', '保险', '基金', '投资', '理财'],
      '制造': ['生产', '加工', '制造业', '工厂'],
      '零售': ['商贸', '销售', '批发', '电商', '商业'],
      '房地产': ['地产', '物业', '房产', '建筑'],
      '教育': ['培训', '学校', '教学', '教培'],
      '医疗': ['医院', '诊所', '健康', '医药', '卫生'],
      '咨询': ['顾问', '咨询服务', '管理咨询'],
      '传媒': ['媒体', '广告', '文化', '出版', '影视'],
      '餐饮': ['餐厅', '饮食', '食品'],
      '物流': ['运输', '快递', '仓储', '配送'],
      '农业': ['种植', '养殖', '农产品', '林业', '渔业']
    };

    // 缓存行业数据
    this.industriesCache = null;
    this.cacheTime = null;
    this.cacheDuration = 5 * 60 * 1000; // 5分钟缓存
  }

  /**
   * 获取所有行业分类（带缓存）
   */
  async getAllIndustries() {
    const now = Date.now();
    
    // 如果缓存有效，直接返回
    if (this.industriesCache && this.cacheTime && (now - this.cacheTime < this.cacheDuration)) {
      return this.industriesCache;
    }

    // 重新加载
    const industries = await IndustryCategory.findAll({
      where: { isActive: true },
      order: [['level', 'DESC'], ['sortOrder', 'ASC']] // 优先匹配更具体的分类
    });

    this.industriesCache = industries;
    this.cacheTime = now;

    return industries;
  }

  /**
   * 清除缓存
   */
  clearCache() {
    this.industriesCache = null;
    this.cacheTime = null;
  }

  /**
   * 计算字符串相似度（Levenshtein距离）
   */
  calculateSimilarity(str1, str2) {
    if (!str1 || !str2) return 0;
    
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();
    
    if (s1 === s2) return 1;
    
    const len1 = s1.length;
    const len2 = s2.length;
    
    if (len1 === 0 || len2 === 0) return 0;
    
    const matrix = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(0));
    
    for (let i = 0; i <= len1; i++) matrix[i][0] = i;
    for (let j = 0; j <= len2; j++) matrix[0][j] = j;
    
    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,      // 删除
          matrix[i][j - 1] + 1,      // 插入
          matrix[i - 1][j - 1] + cost // 替换
        );
      }
    }
    
    const distance = matrix[len1][len2];
    const maxLen = Math.max(len1, len2);
    return 1 - distance / maxLen;
  }

  /**
   * 获取同义词列表
   */
  getSynonyms(word) {
    const synonymList = [];
    
    // 查找包含该词的同义词组
    for (const [key, values] of Object.entries(this.synonyms)) {
      if (key === word || values.includes(word)) {
        synonymList.push(key, ...values);
      }
    }
    
    // 去重
    return [...new Set(synonymList)];
  }

  /**
   * 智能匹配行业
   * @param {string} text - 用户输入的行业文本
   * @param {number} threshold - 置信度阈值（默认0.7）
   * @returns {Object} 匹配结果
   */
  async matchIndustry(text, threshold = 0.7) {
    if (!text || typeof text !== 'string') {
      return {
        matched: false,
        matchedIndustry: null,
        matchType: null,
        confidence: 0,
        suggestions: []
      };
    }

    const inputText = text.trim();
    const industries = await this.getAllIndustries();
    
    let bestMatch = null;
    let bestScore = 0;
    let matchType = null;
    const suggestions = [];

    // 1. 完全匹配（优先级最高）
    for (const industry of industries) {
      if (industry.name === inputText) {
        return {
          matched: true,
          matchedIndustry: industry,
          matchType: 'exact',
          confidence: 1.0,
          suggestions: []
        };
      }
    }

    // 2. 关键词匹配
    for (const industry of industries) {
      const keywords = industry.keywords || [];
      
      for (const keyword of keywords) {
        if (inputText.includes(keyword) || keyword.includes(inputText)) {
          const score = Math.max(
            inputText.length / keyword.length,
            keyword.length / inputText.length
          ) * 0.95; // 关键词匹配给予0.95的基础分
          
          if (score > bestScore) {
            bestScore = score;
            bestMatch = industry;
            matchType = 'keyword';
          }
        }
      }
    }

    // 3. 同义词匹配
    const synonyms = this.getSynonyms(inputText);
    if (synonyms.length > 0) {
      for (const industry of industries) {
        const keywords = industry.keywords || [];
        
        for (const synonym of synonyms) {
          if (keywords.includes(synonym) || industry.name.includes(synonym)) {
            const score = 0.9; // 同义词匹配给予0.9的分数
            
            if (score > bestScore) {
              bestScore = score;
              bestMatch = industry;
              matchType = 'synonym';
            }
          }
        }
      }
    }

    // 4. 模糊匹配（基于相似度）
    for (const industry of industries) {
      // 与行业名称比较
      const nameSimilarity = this.calculateSimilarity(inputText, industry.name);
      
      if (nameSimilarity > bestScore && nameSimilarity > 0.6) {
        bestScore = nameSimilarity;
        bestMatch = industry;
        matchType = 'fuzzy';
      }

      // 与关键词比较
      const keywords = industry.keywords || [];
      for (const keyword of keywords) {
        const keywordSimilarity = this.calculateSimilarity(inputText, keyword);
        
        if (keywordSimilarity > bestScore && keywordSimilarity > 0.6) {
          bestScore = keywordSimilarity;
          bestMatch = industry;
          matchType = 'fuzzy';
        }
      }

      // 收集建议（相似度 > 0.5）
      if (nameSimilarity > 0.5 && suggestions.length < 5) {
        suggestions.push({
          industry: industry,
          similarity: nameSimilarity
        });
      }
    }

    // 排序建议
    suggestions.sort((a, b) => b.similarity - a.similarity);

    // 判断是否达到阈值
    const matched = bestScore >= threshold;

    return {
      matched,
      matchedIndustry: matched ? bestMatch : null,
      matchType: matched ? matchType : null,
      confidence: bestScore,
      suggestions: suggestions.slice(0, 5).map(s => ({
        id: s.industry.id,
        name: s.industry.name,
        code: s.industry.code,
        level: s.industry.level,
        parentId: s.industry.parentId,
        confidence: s.similarity
      })),
      originalText: inputText
    };
  }

  /**
   * 批量匹配行业
   * @param {Array<string>} texts - 行业文本数组
   * @param {number} threshold - 置信度阈值
   * @returns {Array<Object>} 匹配结果数组
   */
  async batchMatchIndustries(texts, threshold = 0.7) {
    const results = [];
    
    for (const text of texts) {
      const result = await this.matchIndustry(text, threshold);
      results.push(result);
    }
    
    return results;
  }

  /**
   * 获取行业完整路径
   * @param {number} industryId - 行业ID
   * @returns {string} 完整路径
   */
  async getIndustryFullPath(industryId) {
    const industry = await IndustryCategory.findByPk(industryId);
    
    if (!industry) {
      return null;
    }
    
    return await industry.getFullPath();
  }

  /**
   * 添加自定义同义词（管理员功能）
   * @param {string} keyword - 关键词
   * @param {Array<string>} synonyms - 同义词列表
   */
  addSynonyms(keyword, synonyms) {
    if (!this.synonyms[keyword]) {
      this.synonyms[keyword] = [];
    }
    
    this.synonyms[keyword] = [...new Set([...this.synonyms[keyword], ...synonyms])];
  }

  /**
   * 更新行业关键词（管理员功能）
   * @param {number} industryId - 行业ID
   * @param {Array<string>} keywords - 新的关键词列表
   */
  async updateIndustryKeywords(industryId, keywords) {
    const industry = await IndustryCategory.findByPk(industryId);
    
    if (!industry) {
      throw new Error('行业不存在');
    }
    
    await industry.update({ keywords });
    
    // 清除缓存
    this.clearCache();
    
    return industry;
  }

  /**
   * 获取匹配统计信息
   * @param {Array<Object>} matchResults - 匹配结果数组
   * @returns {Object} 统计信息
   */
  getMatchStatistics(matchResults) {
    const stats = {
      total: matchResults.length,
      matched: 0,
      unmatched: 0,
      byMatchType: {
        exact: 0,
        keyword: 0,
        synonym: 0,
        fuzzy: 0
      },
      averageConfidence: 0,
      lowConfidence: [] // 低置信度匹配（0.7-0.8）
    };

    let totalConfidence = 0;

    matchResults.forEach((result, index) => {
      if (result.matched) {
        stats.matched++;
        stats.byMatchType[result.matchType]++;
        totalConfidence += result.confidence;

        // 记录低置信度匹配
        if (result.confidence >= 0.7 && result.confidence < 0.8) {
          stats.lowConfidence.push({
            index,
            text: result.originalText,
            matchedIndustry: result.matchedIndustry.name,
            confidence: result.confidence
          });
        }
      } else {
        stats.unmatched++;
      }
    });

    stats.averageConfidence = stats.matched > 0 
      ? (totalConfidence / stats.matched).toFixed(3)
      : 0;

    return stats;
  }
}

// 导出单例
module.exports = new IndustryMatchingService();











