import React from 'react';
import { Space, Tag, Progress, Tooltip, Button } from 'antd';
import { 
  CheckCircleOutlined, 
  QuestionCircleOutlined,
  EditOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import './IndustryMatchDisplay.css';

/**
 * 行业匹配结果显示组件
 * 显示原始输入、匹配结果、匹配类型和置信度
 */
const IndustryMatchDisplay = ({ 
  originalText,
  matchedIndustry,
  matchType,
  confidence,
  onEdit,
  showEdit = true,
  compact = false
}) => {
  // 获取匹配类型的配置
  const getMatchTypeConfig = (type) => {
    const configs = {
      exact: {
        color: 'green',
        icon: <CheckCircleOutlined />,
        text: '完全匹配',
        description: '行业名称完全一致'
      },
      keyword: {
        color: 'blue',
        icon: <ThunderboltOutlined />,
        text: '关键词匹配',
        description: '基于预定义关键词匹配'
      },
      synonym: {
        color: 'cyan',
        icon: <CheckCircleOutlined />,
        text: '同义词匹配',
        description: '使用同义词词典匹配'
      },
      fuzzy: {
        color: 'orange',
        icon: <QuestionCircleOutlined />,
        text: '模糊匹配',
        description: '基于相似度算法匹配'
      },
      manual: {
        color: 'purple',
        icon: <EditOutlined />,
        text: '手动选择',
        description: '用户手动修正'
      }
    };
    return configs[type] || configs.fuzzy;
  };

  // 获取置信度颜色
  const getConfidenceColor = (conf) => {
    if (conf >= 0.85) return '#52c41a'; // 绿色 (85%+)
    if (conf >= 0.70) return '#1890ff'; // 蓝色 (70-84%)
    if (conf >= 0.50) return '#faad14'; // 橙色 (50-69%)
    return '#ff4d4f'; // 红色 (<50%)
  };

  // 获取置信度状态
  const getConfidenceStatus = (conf) => {
    if (conf >= 0.85) return 'success';
    if (conf >= 0.70) return 'normal';
    if (conf >= 0.50) return 'active';
    return 'exception';
  };

  const matchConfig = matchType ? getMatchTypeConfig(matchType) : null;
  
  // 置信度处理：上限设为95%，即使完全匹配也不显示100%
  // 这样可以提醒用户始终保持审慎态度
  const rawPercent = Math.round((confidence || 0) * 100);
  const confidencePercent = Math.min(rawPercent, 95);

  // 紧凑模式
  if (compact) {
    return (
      <Space direction="vertical" size={4} style={{ width: '100%' }}>
        {matchedIndustry ? (
          <>
            <div style={{ fontSize: 14, fontWeight: 500 }}>
              {matchedIndustry}
            </div>
            <Space size={4}>
              {matchConfig && (
                <Tag 
                  color={matchConfig.color} 
                  icon={matchConfig.icon}
                  style={{ margin: 0, fontSize: 11 }}
                >
                  {matchConfig.text}
                </Tag>
              )}
              <Tag color={getConfidenceColor(confidence)} style={{ margin: 0, fontSize: 11 }}>
                {confidencePercent}%
              </Tag>
            </Space>
          </>
        ) : (
          <span style={{ color: '#999' }}>未匹配</span>
        )}
      </Space>
    );
  }

  // 完整模式
  return (
    <div className="industry-match-display">
      <Space direction="vertical" size={8} style={{ width: '100%' }}>
        {/* 原始输入 */}
        {originalText && (
          <div className="original-text">
            <span className="label">原始输入：</span>
            <span className="value">{originalText}</span>
          </div>
        )}

        {/* 匹配结果 */}
        {matchedIndustry ? (
          <div className="matched-industry">
            <div className="industry-name">
              <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
              <span style={{ fontSize: 15, fontWeight: 500 }}>{matchedIndustry}</span>
            </div>

            {/* 匹配类型标签 */}
            {matchConfig && (
              <Tooltip title={matchConfig.description}>
                <Tag 
                  color={matchConfig.color} 
                  icon={matchConfig.icon}
                  style={{ marginTop: 8 }}
                >
                  {matchConfig.text}
                </Tag>
              </Tooltip>
            )}

            {/* 置信度进度条 */}
            {confidence !== undefined && (
              <div className="confidence-bar" style={{ marginTop: 8 }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  marginBottom: 4,
                  fontSize: 12,
                  color: '#666'
                }}>
                  <span>置信度</span>
                  <Tooltip title="置信度上限为95%，建议人工复核">
                    <span style={{ 
                      fontWeight: 500,
                      color: getConfidenceColor(confidence)
                    }}>
                      {confidencePercent}%
                    </span>
                  </Tooltip>
                </div>
                <Progress 
                  percent={confidencePercent}
                  strokeColor={getConfidenceColor(confidence)}
                  status={getConfidenceStatus(confidence)}
                  showInfo={false}
                  size="small"
                />
              </div>
            )}

            {/* 编辑按钮 */}
            {showEdit && onEdit && (
              <Button 
                type="link" 
                size="small" 
                icon={<EditOutlined />}
                onClick={onEdit}
                style={{ marginTop: 8, padding: 0 }}
              >
                手动修正
              </Button>
            )}
          </div>
        ) : (
          <div className="no-match">
            <QuestionCircleOutlined style={{ color: '#faad14', marginRight: 8 }} />
            <span style={{ color: '#666' }}>未匹配到标准行业</span>
            {showEdit && onEdit && (
              <Button 
                type="link" 
                size="small" 
                icon={<EditOutlined />}
                onClick={onEdit}
                style={{ marginLeft: 8 }}
              >
                手动选择
              </Button>
            )}
          </div>
        )}
      </Space>
    </div>
  );
};

export default IndustryMatchDisplay;
