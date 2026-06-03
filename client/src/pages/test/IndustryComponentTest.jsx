import React, { useState } from 'react';
import { Card, Space, Button, Divider, Typography, message } from 'antd';
import { IndustryCascader, IndustryMatchDisplay, IndustrySelector } from '../../components';
import { industryAPI } from '../../services/api';

const { Title, Paragraph } = Typography;

/**
 * 行业组件测试页面
 * 用于测试和演示行业相关组件
 */
const IndustryComponentTest = () => {
  const [cascaderValue, setCascaderValue] = useState(null);
  const [selectorVisible, setSelectorVisible] = useState(false);
  const [selectedIndustry, setSelectedIndustry] = useState(null);
  const [matchResult, setMatchResult] = useState(null);
  const [testText, setTestText] = useState('软件开发');

  // 测试单个匹配
  const handleTestMatch = async () => {
    try {
      message.loading('正在匹配...', 0);
      const response = await industryAPI.matchIndustry(testText, 0.7);
      message.destroy();
      
      if (response.success && response.data.matched) {
        setMatchResult({
          originalText: testText,
          matchedIndustry: response.data.matchedIndustry.name,
          matchType: response.data.matchType,
          confidence: response.data.confidence
        });
        message.success('匹配成功！');
      } else {
        setMatchResult({
          originalText: testText,
          matchedIndustry: null,
          matchType: null,
          confidence: 0
        });
        message.warning('未找到匹配的行业');
      }
    } catch (error) {
      message.error('匹配失败：' + (error.message || '未知错误'));
    }
  };

  // 测试批量匹配
  const handleTestBatchMatch = async () => {
    const texts = ['软件开发', '金融服务', '制造业', '餐饮', '教育培训'];
    
    try {
      message.loading('正在批量匹配...', 0);
      const response = await industryAPI.batchMatchIndustries(texts, 0.7);
      message.destroy();
      
      if (response.success) {
        const { results, statistics } = response.data;
        console.log('批量匹配结果：', results);
        message.success(
          `批量匹配完成！成功 ${statistics.matched} 条，未匹配 ${statistics.unmatched} 条`
        );
      }
    } catch (error) {
      message.error('批量匹配失败：' + (error.message || '未知错误'));
    }
  };

  return (
    <div style={{ padding: 24, background: '#f0f2f5', minHeight: '100vh' }}>
      <Title level={2}>行业组件测试页面</Title>
      <Paragraph>测试和演示行业相关组件的功能</Paragraph>

      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 1. 级联选择器测试 */}
        <Card title="1. IndustryCascader - 行业级联选择器" bordered={false}>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Paragraph>
              三级行业分类选择，支持搜索过滤
            </Paragraph>
            
            <IndustryCascader
              value={cascaderValue}
              onChange={(value) => {
                setCascaderValue(value);
                message.success(`选择了行业ID: ${value}`);
              }}
              placeholder="请选择行业"
              style={{ width: 400 }}
            />
            
            {cascaderValue && (
              <div style={{ padding: 12, background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 4 }}>
                <strong>当前选择的行业ID：</strong> {cascaderValue}
              </div>
            )}
          </Space>
        </Card>

        {/* 2. 匹配显示组件测试 */}
        <Card title="2. IndustryMatchDisplay - 行业匹配结果显示" bordered={false}>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Paragraph>
              展示智能匹配结果，包含原始输入、匹配结果、匹配类型和置信度
            </Paragraph>
            
            <Space>
              <input
                type="text"
                value={testText}
                onChange={(e) => setTestText(e.target.value)}
                placeholder="输入行业名称"
                style={{ 
                  padding: '8px 12px', 
                  borderRadius: 4, 
                  border: '1px solid #d9d9d9',
                  width: 200
                }}
              />
              <Button type="primary" onClick={handleTestMatch}>
                测试匹配
              </Button>
              <Button onClick={handleTestBatchMatch}>
                测试批量匹配
              </Button>
            </Space>

            {matchResult && (
              <>
                <Divider>完整模式</Divider>
                <IndustryMatchDisplay
                  originalText={matchResult.originalText}
                  matchedIndustry={matchResult.matchedIndustry}
                  matchType={matchResult.matchType}
                  confidence={matchResult.confidence}
                  onEdit={() => message.info('点击了编辑按钮')}
                  compact={false}
                />

                <Divider>紧凑模式</Divider>
                <IndustryMatchDisplay
                  originalText={matchResult.originalText}
                  matchedIndustry={matchResult.matchedIndustry}
                  matchType={matchResult.matchType}
                  confidence={matchResult.confidence}
                  onEdit={() => message.info('点击了编辑按钮')}
                  compact={true}
                />
              </>
            )}

            <Divider>示例展示</Divider>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <strong>完全匹配（90%+）：</strong>
                <IndustryMatchDisplay
                  originalText="软件和信息技术服务业"
                  matchedIndustry="软件和信息技术服务业"
                  matchType="exact"
                  confidence={1.0}
                  compact={true}
                />
              </div>

              <div>
                <strong>关键词匹配（70-89%）：</strong>
                <IndustryMatchDisplay
                  originalText="软件开发"
                  matchedIndustry="软件和信息技术服务业"
                  matchType="keyword"
                  confidence={0.85}
                  compact={true}
                />
              </div>

              <div>
                <strong>模糊匹配（50-69%）：</strong>
                <IndustryMatchDisplay
                  originalText="IT服务"
                  matchedIndustry="软件和信息技术服务业"
                  matchType="fuzzy"
                  confidence={0.65}
                  compact={true}
                />
              </div>

              <div>
                <strong>手动选择：</strong>
                <IndustryMatchDisplay
                  originalText="科技公司"
                  matchedIndustry="科学研究和技术服务业"
                  matchType="manual"
                  confidence={1.0}
                  compact={true}
                />
              </div>

              <div>
                <strong>未匹配：</strong>
                <IndustryMatchDisplay
                  originalText="未知行业"
                  matchedIndustry={null}
                  matchType={null}
                  confidence={0}
                  onEdit={() => message.info('点击了手动选择')}
                  compact={true}
                />
              </div>
            </Space>
          </Space>
        </Card>

        {/* 3. 行业选择器测试 */}
        <Card title="3. IndustrySelector - 行业选择器模态框" bordered={false}>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Paragraph>
              提供搜索、树形选择和添加到字典的完整功能
            </Paragraph>
            
            <Button type="primary" onClick={() => setSelectorVisible(true)}>
              打开行业选择器
            </Button>

            {selectedIndustry && (
              <div style={{ padding: 12, background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 4 }}>
                <strong>选择的行业：</strong>
                <div>ID: {selectedIndustry.id}</div>
                <div>名称: {selectedIndustry.name}</div>
                <div>代码: {selectedIndustry.code}</div>
                <div>级别: {selectedIndustry.level}</div>
              </div>
            )}
          </Space>
        </Card>

        {/* API测试 */}
        <Card title="4. API接口测试" bordered={false}>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Paragraph>
              测试行业相关的API接口
            </Paragraph>
            
            <Space wrap>
              <Button onClick={async () => {
                try {
                  const response = await industryAPI.getIndustriesTree();
                  console.log('行业树形结构：', response);
                  message.success('获取成功，请查看控制台');
                } catch (error) {
                  message.error('获取失败：' + error.message);
                }
              }}>
                获取行业树形结构
              </Button>

              <Button onClick={async () => {
                try {
                  const response = await industryAPI.getIndustriesList();
                  console.log('行业列表：', response);
                  message.success(`获取成功！共 ${response.data?.length || 0} 条数据`);
                } catch (error) {
                  message.error('获取失败：' + error.message);
                }
              }}>
                获取行业列表
              </Button>

              <Button onClick={async () => {
                try {
                  const response = await industryAPI.matchIndustry('软件开发', 0.7);
                  console.log('匹配结果：', response);
                  if (response.success && response.data.matched) {
                    message.success(`匹配成功：${response.data.matchedIndustry.name}`);
                  } else {
                    message.warning('未找到匹配的行业');
                  }
                } catch (error) {
                  message.error('匹配失败：' + error.message);
                }
              }}>
                测试单个匹配
              </Button>

              <Button onClick={handleTestBatchMatch}>
                测试批量匹配
              </Button>
            </Space>
          </Space>
        </Card>
      </Space>

      {/* 行业选择器模态框 */}
      <IndustrySelector
        visible={selectorVisible}
        onClose={() => setSelectorVisible(false)}
        onSelect={(industry) => {
          setSelectedIndustry(industry);
          message.success(`选择了：${industry.name}`);
        }}
        currentIndustry={selectedIndustry}
        originalText="软件开发"
        isAdmin={true}
      />
    </div>
  );
};

export default IndustryComponentTest;











