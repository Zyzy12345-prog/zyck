// ============================================
// 智能行业匹配组件 - 使用示例代码
// ============================================

// ============================================
// 示例1：在表单中使用级联选择器
// ============================================
import React, { useState } from 'react';
import { Form, Button, Input, message } from 'antd';
import { IndustryCascader } from '../../components';
import { clientAPI } from '../../services/api';

const ClientForm = () => {
  const [form] = Form.useForm();

  const handleSubmit = async (values) => {
    try {
      await clientAPI.createClient(values);
      message.success('创建成功！');
    } catch (error) {
      message.error('创建失败：' + error.message);
    }
  };

  return (
    <Form form={form} onFinish={handleSubmit} layout="vertical">
      <Form.Item 
        label="公司名称" 
        name="companyName" 
        rules={[{ required: true, message: '请输入公司名称' }]}
      >
        <Input placeholder="请输入公司名称" />
      </Form.Item>

      <Form.Item 
        label="所属行业" 
        name="industryId"
        rules={[{ required: true, message: '请选择行业' }]}
      >
        <IndustryCascader placeholder="请选择行业" />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit">
          提交
        </Button>
      </Form.Item>
    </Form>
  );
};

// ============================================
// 示例2：在表格中显示匹配结果（紧凑模式）
// ============================================
import React from 'react';
import { Table } from 'antd';
import { IndustryMatchDisplay } from '../../components';

const ClientTable = ({ dataSource }) => {
  const columns = [
    {
      title: '公司名称',
      dataIndex: 'companyName',
      key: 'companyName',
    },
    {
      title: '行业',
      key: 'industry',
      width: 250,
      render: (_, record) => (
        <IndustryMatchDisplay
          matchedIndustry={record.industryName}
          matchType={record.matchType}
          confidence={record.matchConfidence}
          compact={true}
        />
      )
    },
    // ... 其他列
  ];

  return <Table columns={columns} dataSource={dataSource} />;
};

// ============================================
// 示例3：显示完整的匹配信息（详情页）
// ============================================
import React from 'react';
import { Card } from 'antd';
import { IndustryMatchDisplay } from '../../components';

const ClientDetail = ({ client }) => {
  return (
    <Card title="行业信息">
      <IndustryMatchDisplay
        originalText={client.originalIndustry}
        matchedIndustry={client.industryName}
        matchType={client.matchType}
        confidence={client.matchConfidence}
        onEdit={() => handleEditIndustry(client)}
        compact={false}
      />
    </Card>
  );
};

// ============================================
// 示例4：手动选择行业（带搜索）
// ============================================
import React, { useState } from 'react';
import { Button, Space } from 'antd';
import { IndustrySelector } from '../../components';

const IndustryPicker = ({ value, onChange, originalText }) => {
  const [visible, setVisible] = useState(false);
  const [selectedIndustry, setSelectedIndustry] = useState(null);

  const handleSelect = (industry) => {
    setSelectedIndustry(industry);
    onChange?.(industry.id);
    setVisible(false);
  };

  return (
    <>
      <Space>
        <span>{selectedIndustry?.name || '未选择'}</span>
        <Button type="link" onClick={() => setVisible(true)}>
          选择行业
        </Button>
      </Space>

      <IndustrySelector
        visible={visible}
        onClose={() => setVisible(false)}
        onSelect={handleSelect}
        currentIndustry={selectedIndustry}
        originalText={originalText}
        isAdmin={false}
      />
    </>
  );
};

// ============================================
// 示例5：智能匹配单个行业
// ============================================
import React, { useState } from 'react';
import { Input, Button, Space, message } from 'antd';
import { IndustryMatchDisplay } from '../../components';
import { industryAPI } from '../../services/api';

const IndustryMatcher = () => {
  const [inputText, setInputText] = useState('');
  const [matchResult, setMatchResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleMatch = async () => {
    if (!inputText.trim()) {
      message.warning('请输入行业名称');
      return;
    }

    setLoading(true);
    try {
      const response = await industryAPI.matchIndustry(inputText, 0.7);
      
      if (response.success && response.data.matched) {
        setMatchResult({
          originalText: inputText,
          matchedIndustry: response.data.matchedIndustry.name,
          matchType: response.data.matchType,
          confidence: response.data.confidence
        });
        message.success('匹配成功！');
      } else {
        setMatchResult({
          originalText: inputText,
          matchedIndustry: null,
          matchType: null,
          confidence: 0
        });
        message.warning('未找到匹配的行业');
      }
    } catch (error) {
      message.error('匹配失败：' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Input
          placeholder="输入行业名称"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onPressEnter={handleMatch}
          style={{ width: 300 }}
        />
        <Button type="primary" onClick={handleMatch} loading={loading}>
          智能匹配
        </Button>
      </Space>

      {matchResult && (
        <IndustryMatchDisplay
          originalText={matchResult.originalText}
          matchedIndustry={matchResult.matchedIndustry}
          matchType={matchResult.matchType}
          confidence={matchResult.confidence}
          compact={false}
        />
      )}
    </div>
  );
};

// ============================================
// 示例6：批量匹配行业
// ============================================
import React, { useState } from 'react';
import { Button, Table, message } from 'antd';
import { IndustryMatchDisplay } from '../../components';
import { industryAPI } from '../../services/api';

const BatchIndustryMatcher = ({ data }) => {
  const [matchedData, setMatchedData] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleBatchMatch = async () => {
    setLoading(true);
    try {
      const texts = data.map(item => item.industry).filter(Boolean);
      const response = await industryAPI.batchMatchIndustries(texts, 0.7);

      if (response.success) {
        const results = response.data.results;
        const newData = data.map((item, index) => {
          const matchResult = results[index];
          return {
            ...item,
            industryId: matchResult.matched ? matchResult.matchedIndustry.id : null,
            industryName: matchResult.matched ? matchResult.matchedIndustry.name : null,
            matchType: matchResult.matchType,
            matchConfidence: matchResult.confidence
          };
        });

        setMatchedData(newData);
        message.success(
          `匹配完成！成功 ${response.data.statistics.matched} 条`
        );
      }
    } catch (error) {
      message.error('批量匹配失败：' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: '公司名称',
      dataIndex: 'companyName',
      key: 'companyName',
    },
    {
      title: '原始行业',
      dataIndex: 'industry',
      key: 'industry',
    },
    {
      title: '匹配结果',
      key: 'matchResult',
      render: (_, record) => (
        <IndustryMatchDisplay
          matchedIndustry={record.industryName}
          matchType={record.matchType}
          confidence={record.matchConfidence}
          compact={true}
        />
      )
    }
  ];

  return (
    <div>
      <Button 
        type="primary" 
        onClick={handleBatchMatch} 
        loading={loading}
        style={{ marginBottom: 16 }}
      >
        批量匹配行业
      </Button>

      <Table 
        columns={columns} 
        dataSource={matchedData.length > 0 ? matchedData : data}
        rowKey="key"
      />
    </div>
  );
};

// ============================================
// 示例7：管理员添加关键词到字典
// ============================================
import React, { useState } from 'react';
import { Button, Input, Space, message } from 'antd';
import { IndustrySelector } from '../../components';
import { industryAPI } from '../../services/api';

const KeywordManager = () => {
  const [keyword, setKeyword] = useState('');
  const [selectorVisible, setSelectorVisible] = useState(false);

  const handleAddKeyword = async (industry) => {
    if (!keyword.trim()) {
      message.warning('请输入关键词');
      return;
    }

    try {
      // 获取当前关键词
      const response = await industryAPI.getIndustriesList();
      const targetIndustry = response.data.find(ind => ind.id === industry.id);
      
      if (!targetIndustry) {
        message.error('获取行业信息失败');
        return;
      }

      const currentKeywords = targetIndustry.keywords || [];
      
      // 检查是否已存在
      if (currentKeywords.includes(keyword)) {
        message.info('该关键词已存在');
        return;
      }

      // 添加新关键词
      const newKeywords = [...currentKeywords, keyword];
      await industryAPI.updateIndustryKeywords(industry.id, newKeywords);
      
      message.success(`已将"${keyword}"添加到"${industry.name}"的关键词字典`);
      setKeyword('');
      setSelectorVisible(false);
    } catch (error) {
      message.error('添加失败：' + error.message);
    }
  };

  return (
    <>
      <Space>
        <Input
          placeholder="输入关键词"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          style={{ width: 200 }}
        />
        <Button type="primary" onClick={() => setSelectorVisible(true)}>
          选择目标行业
        </Button>
      </Space>

      <IndustrySelector
        visible={selectorVisible}
        onClose={() => setSelectorVisible(false)}
        onSelect={handleAddKeyword}
        originalText={keyword}
        isAdmin={true}
      />
    </>
  );
};

// ============================================
// 示例8：在筛选器中使用
// ============================================
import React, { useState } from 'react';
import { Form, Button, Space } from 'antd';
import { IndustryCascader } from '../../components';

const ClientFilter = ({ onFilter }) => {
  const [form] = Form.useForm();

  const handleFilter = (values) => {
    onFilter(values);
  };

  const handleReset = () => {
    form.resetFields();
    onFilter({});
  };

  return (
    <Form form={form} onFinish={handleFilter} layout="inline">
      <Form.Item name="industryId" label="行业">
        <IndustryCascader 
          placeholder="选择行业" 
          style={{ width: 300 }}
        />
      </Form.Item>

      <Form.Item>
        <Space>
          <Button type="primary" htmlType="submit">
            筛选
          </Button>
          <Button onClick={handleReset}>
            重置
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
};

// ============================================
// 示例9：编辑时保留原始匹配信息
// ============================================
import React, { useState, useEffect } from 'react';
import { Form, Input, Button, message } from 'antd';
import { IndustryCascader, IndustryMatchDisplay } from '../../components';
import { clientAPI } from '../../services/api';

const ClientEditForm = ({ clientId }) => {
  const [form] = Form.useForm();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadClient();
  }, [clientId]);

  const loadClient = async () => {
    try {
      const response = await clientAPI.getClient(clientId);
      if (response.success) {
        setClient(response.data);
        form.setFieldsValue(response.data);
      }
    } catch (error) {
      message.error('加载失败：' + error.message);
    }
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      await clientAPI.updateClient(clientId, values);
      message.success('更新成功！');
    } catch (error) {
      message.error('更新失败：' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form form={form} onFinish={handleSubmit} layout="vertical">
      <Form.Item label="公司名称" name="companyName">
        <Input />
      </Form.Item>

      {/* 显示原始匹配信息 */}
      {client?.matchType && (
        <Form.Item label="原始匹配信息">
          <IndustryMatchDisplay
            originalText={client.originalIndustry}
            matchedIndustry={client.industryName}
            matchType={client.matchType}
            confidence={client.matchConfidence}
            compact={true}
            showEdit={false}
          />
        </Form.Item>
      )}

      {/* 允许修改行业 */}
      <Form.Item label="当前行业" name="industryId">
        <IndustryCascader placeholder="请选择行业" />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading}>
          保存
        </Button>
      </Form.Item>
    </Form>
  );
};

// ============================================
// 示例10：统计匹配准确率
// ============================================
import React, { useState, useEffect } from 'react';
import { Card, Statistic, Row, Col, Progress } from 'antd';
import { clientAPI } from '../../services/api';

const IndustryMatchStatistics = () => {
  const [stats, setStats] = useState({
    total: 0,
    matched: 0,
    exact: 0,
    keyword: 0,
    fuzzy: 0,
    manual: 0,
    unmatched: 0
  });

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      const response = await clientAPI.getClients({ limit: 1000 });
      if (response.success) {
        const clients = response.data.data;
        
        const newStats = {
          total: clients.length,
          matched: clients.filter(c => c.industryId).length,
          exact: clients.filter(c => c.matchType === 'exact').length,
          keyword: clients.filter(c => c.matchType === 'keyword').length,
          fuzzy: clients.filter(c => c.matchType === 'fuzzy').length,
          manual: clients.filter(c => c.matchType === 'manual').length,
          unmatched: clients.filter(c => !c.industryId).length
        };

        setStats(newStats);
      }
    } catch (error) {
      console.error('加载统计失败:', error);
    }
  };

  const matchRate = stats.total > 0 
    ? Math.round((stats.matched / stats.total) * 100) 
    : 0;

  return (
    <Card title="行业匹配统计">
      <Row gutter={16}>
        <Col span={6}>
          <Statistic title="总客户数" value={stats.total} />
        </Col>
        <Col span={6}>
          <Statistic title="已匹配" value={stats.matched} />
        </Col>
        <Col span={6}>
          <Statistic title="未匹配" value={stats.unmatched} />
        </Col>
        <Col span={6}>
          <div>
            <div style={{ marginBottom: 8 }}>匹配率</div>
            <Progress 
              type="circle" 
              percent={matchRate} 
              width={80}
              strokeColor={matchRate >= 90 ? '#52c41a' : matchRate >= 70 ? '#1890ff' : '#faad14'}
            />
          </div>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 24 }}>
        <Col span={6}>
          <Statistic title="完全匹配" value={stats.exact} suffix="条" />
        </Col>
        <Col span={6}>
          <Statistic title="关键词匹配" value={stats.keyword} suffix="条" />
        </Col>
        <Col span={6}>
          <Statistic title="模糊匹配" value={stats.fuzzy} suffix="条" />
        </Col>
        <Col span={6}>
          <Statistic title="手动选择" value={stats.manual} suffix="条" />
        </Col>
      </Row>
    </Card>
  );
};

export {
  ClientForm,
  ClientTable,
  ClientDetail,
  IndustryPicker,
  IndustryMatcher,
  BatchIndustryMatcher,
  KeywordManager,
  ClientFilter,
  ClientEditForm,
  IndustryMatchStatistics
};











