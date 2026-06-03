import React, { useState, useEffect } from 'react';
import { Modal, Table, Button, Tag, Space, Tooltip, Select, message, Alert, Progress } from 'antd';
import { CheckCircleOutlined, WarningOutlined, SyncOutlined, EditOutlined } from '@ant-design/icons';
import { industryAPI } from '../../services/api';

const { Option } = Select;

/**
 * 行业智能匹配组件
 * 用于在客户导入时智能匹配行业分类
 */
const IndustryMatcher = ({ data, onMatchComplete, visible, onClose }) => {
  const [matching, setMatching] = useState(false);
  const [matchResults, setMatchResults] = useState([]);
  const [industries, setIndustries] = useState([]);
  const [editingKey, setEditingKey] = useState('');
  const [progress, setProgress] = useState(0);

  // 加载行业列表
  useEffect(() => {
    if (visible) {
      loadIndustries();
    }
  }, [visible]);

  const loadIndustries = async () => {
    try {
      const response = await industryAPI.getIndustriesList();
      if (response.success) {
        setIndustries(response.data);
      }
    } catch (error) {
      message.error('加载行业列表失败：' + (error.message || '未知错误'));
    }
  };

  // 开始智能匹配
  const startMatching = async () => {
    setMatching(true);
    setProgress(0);

    try {
      // 提取所有行业文本
      const industryTexts = data.map(item => item.industry || '').filter(text => text.trim() !== '');

      if (industryTexts.length === 0) {
        message.warning('没有需要匹配的行业数据');
        setMatching(false);
        return;
      }

      // 批量匹配
      const response = await industryAPI.batchMatchIndustries(industryTexts, 0.7);

      if (response.success) {
        const results = response.data.results;
        const statistics = response.data.statistics;

        // 将匹配结果映射回原始数据
        const mappedResults = data.map((item, index) => {
          const industryText = item.industry || '';
          
          if (!industryText.trim()) {
            return {
              ...item,
              rowIndex: index,
              matchResult: null,
              matched: false
            };
          }

          // 找到对应的匹配结果
          const matchIndex = industryTexts.indexOf(industryText);
          const matchResult = results[matchIndex];

          return {
            ...item,
            rowIndex: index,
            matchResult: matchResult,
            matched: matchResult?.matched || false,
            matchedIndustry: matchResult?.matchedIndustry || null,
            matchType: matchResult?.matchType || null,
            confidence: matchResult?.confidence || 0,
            suggestions: matchResult?.suggestions || []
          };
        });

        setMatchResults(mappedResults);
        setProgress(100);

        message.success(
          `匹配完成！总计 ${statistics.total} 条，成功 ${statistics.matched} 条，未匹配 ${statistics.unmatched} 条`
        );
      }
    } catch (error) {
      message.error('行业匹配失败：' + (error.message || '未知错误'));
    } finally {
      setMatching(false);
    }
  };

  // 手动修改行业
  const handleIndustryChange = (rowIndex, industryId) => {
    const newResults = [...matchResults];
    const industry = industries.find(ind => ind.id === industryId);
    
    newResults[rowIndex] = {
      ...newResults[rowIndex],
      matchedIndustry: industry,
      matched: true,
      confidence: 1.0,
      matchType: 'manual'
    };

    setMatchResults(newResults);
    setEditingKey('');
  };

  // 应用匹配结果
  const handleApply = () => {
    const updatedData = matchResults.map(result => ({
      ...result,
      industryId: result.matchedIndustry?.id || null,
      industryName: result.matchedIndustry?.name || result.industry || null,
      originalIndustry: result.industry
    }));

    onMatchComplete(updatedData);
    onClose();
  };

  // 获取匹配类型标签
  const getMatchTypeTag = (matchType, confidence) => {
    const typeMap = {
      exact: { color: 'green', text: '完全匹配' },
      keyword: { color: 'blue', text: '关键词匹配' },
      synonym: { color: 'cyan', text: '同义词匹配' },
      fuzzy: { color: 'orange', text: '模糊匹配' },
      manual: { color: 'purple', text: '手动修正' }
    };

    const config = typeMap[matchType] || { color: 'default', text: '未知' };
    
    return (
      <Tag color={config.color}>
        {config.text} ({(confidence * 100).toFixed(0)}%)
      </Tag>
    );
  };

  // 表格列定义
  const columns = [
    {
      title: '行号',
      key: 'rowNumber',
      width: 70,
      render: (_, record) => record.rowIndex + 2
    },
    {
      title: '公司名称',
      dataIndex: 'companyName',
      key: 'companyName',
      width: 200,
      ellipsis: true
    },
    {
      title: '原始行业',
      dataIndex: 'industry',
      key: 'industry',
      width: 150,
      render: (text) => text || '-'
    },
    {
      title: '匹配状态',
      key: 'matchStatus',
      width: 100,
      align: 'center',
      render: (_, record) => {
        if (!record.industry) {
          return <Tag>无数据</Tag>;
        }
        
        if (record.matched) {
          return (
            <Tooltip title={`置信度：${(record.confidence * 100).toFixed(1)}%`}>
              <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 20 }} />
            </Tooltip>
          );
        }
        
        return (
          <Tooltip title="未匹配到合适的行业">
            <WarningOutlined style={{ color: '#ff4d4f', fontSize: 20 }} />
          </Tooltip>
        );
      }
    },
    {
      title: '匹配结果',
      key: 'matchedIndustry',
      width: 200,
      render: (_, record) => {
        const isEditing = editingKey === record.rowIndex;

        if (isEditing) {
          return (
            <Select
              style={{ width: '100%' }}
              value={record.matchedIndustry?.id}
              onChange={(value) => handleIndustryChange(record.rowIndex, value)}
              showSearch
              optionFilterProp="children"
              placeholder="选择行业"
            >
              {industries.map(ind => (
                <Option key={ind.id} value={ind.id}>
                  {ind.name}
                </Option>
              ))}
            </Select>
          );
        }

        return record.matchedIndustry ? (
          <Space direction="vertical" size={0}>
            <span>{record.matchedIndustry.name}</span>
            {record.matchType && getMatchTypeTag(record.matchType, record.confidence)}
          </Space>
        ) : (
          <span style={{ color: '#999' }}>未匹配</span>
        );
      }
    },
    {
      title: '建议',
      key: 'suggestions',
      width: 200,
      render: (_, record) => {
        if (!record.suggestions || record.suggestions.length === 0) {
          return '-';
        }

        return (
          <Tooltip
            title={
              <div>
                {record.suggestions.map((sug, idx) => (
                  <div key={idx}>
                    {sug.name} ({(sug.confidence * 100).toFixed(0)}%)
                  </div>
                ))}
              </div>
            }
          >
            <Tag color="blue" style={{ cursor: 'pointer' }}>
              {record.suggestions.length} 个建议
            </Tag>
          </Tooltip>
        );
      }
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      fixed: 'right',
      render: (_, record) => {
        const isEditing = editingKey === record.rowIndex;

        return isEditing ? (
          <Button type="link" size="small" onClick={() => setEditingKey('')}>
            取消
          </Button>
        ) : (
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => setEditingKey(record.rowIndex)}
            disabled={editingKey !== ''}
          >
            修改
          </Button>
        );
      }
    }
  ];

  // 统计信息
  const getStatistics = () => {
    if (matchResults.length === 0) return null;

    const total = matchResults.filter(r => r.industry).length;
    const matched = matchResults.filter(r => r.matched).length;
    const unmatched = total - matched;
    const avgConfidence = matched > 0
      ? (matchResults.filter(r => r.matched).reduce((sum, r) => sum + r.confidence, 0) / matched * 100).toFixed(1)
      : 0;

    return { total, matched, unmatched, avgConfidence };
  };

  const stats = getStatistics();

  return (
    <Modal
      title="智能行业匹配"
      open={visible}
      onCancel={onClose}
      width={1200}
      footer={[
        <Button key="close" onClick={onClose}>
          取消
        </Button>,
        <Button
          key="match"
          type="primary"
          icon={<SyncOutlined />}
          onClick={startMatching}
          loading={matching}
          disabled={matchResults.length > 0}
        >
          开始智能匹配
        </Button>,
        <Button
          key="apply"
          type="primary"
          onClick={handleApply}
          disabled={matchResults.length === 0}
        >
          应用匹配结果
        </Button>
      ]}
    >
      <Alert
        message="智能行业匹配说明"
        description={
          <div>
            <p>系统将自动匹配Excel中的行业文本到标准行业分类：</p>
            <ul>
              <li><strong>完全匹配</strong>：行业名称完全一致</li>
              <li><strong>关键词匹配</strong>：包含行业关键词（如"科研"匹配到"科学研究和技术服务业"）</li>
              <li><strong>同义词匹配</strong>：使用同义词词典匹配</li>
              <li><strong>模糊匹配</strong>：基于相似度算法匹配</li>
            </ul>
            <p>匹配完成后，您可以手动修正不准确的匹配结果。</p>
          </div>
        }
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      {matching && (
        <div style={{ marginBottom: 16 }}>
          <Progress percent={progress} status="active" />
          <p style={{ textAlign: 'center', marginTop: 8 }}>正在智能匹配行业...</p>
        </div>
      )}

      {stats && (
        <Alert
          message="匹配统计"
          description={
            <Space size="large">
              <span>总计：<strong>{stats.total}</strong> 条</span>
              <span style={{ color: '#52c41a' }}>已匹配：<strong>{stats.matched}</strong> 条</span>
              <span style={{ color: '#ff4d4f' }}>未匹配：<strong>{stats.unmatched}</strong> 条</span>
              <span>平均置信度：<strong>{stats.avgConfidence}%</strong></span>
            </Space>
          }
          type="success"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Table
        columns={columns}
        dataSource={matchResults.length > 0 ? matchResults : data.map((item, index) => ({ ...item, rowIndex: index }))}
        rowKey="rowIndex"
        pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `共 ${total} 条` }}
        scroll={{ x: 1000, y: 400 }}
        size="small"
      />
    </Modal>
  );
};

export default IndustryMatcher;











