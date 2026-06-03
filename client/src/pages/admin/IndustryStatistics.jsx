import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  message,
  Row,
  Col,
  Statistic,
  Progress,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  Tabs,
  Empty
} from 'antd';
import {
  ReloadOutlined,
  PlusOutlined,
  BarChartOutlined,
  QuestionCircleOutlined
} from '@ant-design/icons';
import { industryAPI, clientAPI } from '../../services/api';
import { IndustrySelector } from '../../components';
import './IndustryStatistics.css';



/**
 * 行业匹配统计页面
 * 显示匹配统计、未匹配数据、批量处理等
 */
const IndustryStatistics = () => {
  const [loading, setLoading] = useState(false);
  const [statistics, setStatistics] = useState({
    total: 0,
    matched: 0,
    unmatched: 0,
    matchRate: 0,
    byType: {}
  });
  const [industryStats, setIndustryStats] = useState([]);
  const [unmatchedList, setUnmatchedList] = useState([]);
  const [selectorVisible, setSelectorVisible] = useState(false);
  const [selectedUnmatched, setSelectedUnmatched] = useState(null);
  const [batchModalVisible, setBatchModalVisible] = useState(false);
  const [batchForm] = Form.useForm();

  useEffect(() => {
    loadStatistics();
  }, []);

  // 加载统计数据
  const loadStatistics = async () => {
    setLoading(true);
    try {
      // 获取所有客户数据
      const clientResponse = await clientAPI.getClients({ limit: 10000 });
      if (clientResponse.success) {
        const clients = clientResponse.data.data;
        
        // 计算基础统计
        const total = clients.length;
        const matched = clients.filter(c => c.industryId).length;
        const unmatched = total - matched;
        const matchRate = total > 0 ? Math.round((matched / total) * 100) : 0;

        // 按匹配类型统计
        const byType = {
          exact: clients.filter(c => c.matchType === 'exact').length,
          keyword: clients.filter(c => c.matchType === 'keyword').length,
          synonym: clients.filter(c => c.matchType === 'synonym').length,
          fuzzy: clients.filter(c => c.matchType === 'fuzzy').length,
          manual: clients.filter(c => c.matchType === 'manual').length
        };

        setStatistics({
          total,
          matched,
          unmatched,
          matchRate,
          byType
        });

        // 统计各行业的使用次数
        const industryCount = {};
        clients.forEach(client => {
          if (client.industryId) {
            const key = `${client.industryId}_${client.industryName}`;
            industryCount[key] = (industryCount[key] || 0) + 1;
          }
        });

        const industryStatsData = Object.entries(industryCount)
          .map(([key, count]) => {
            const [id, name] = key.split('_');
            return { id: parseInt(id), name, count };
          })
          .sort((a, b) => b.count - a.count);

        setIndustryStats(industryStatsData);

        // 统计未匹配的原始行业
        const unmatchedIndustries = {};
        clients.forEach(client => {
          if (!client.industryId && client.originalIndustry) {
            const text = client.originalIndustry;
            if (!unmatchedIndustries[text]) {
              unmatchedIndustries[text] = {
                text,
                count: 0,
                clients: []
              };
            }
            unmatchedIndustries[text].count++;
            unmatchedIndustries[text].clients.push(client);
          }
        });

        const unmatchedData = Object.values(unmatchedIndustries)
          .sort((a, b) => b.count - a.count);

        setUnmatchedList(unmatchedData);
      }

      message.success('统计数据加载成功');
    } catch (error) {
      message.error('加载失败：' + (error.message || '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  // 打开行业选择器
  const handleMapIndustry = (unmatchedItem) => {
    setSelectedUnmatched(unmatchedItem);
    setSelectorVisible(true);
  };

  // 选择行业后批量更新
  const handleSelectIndustry = async (industry) => {
    if (!selectedUnmatched) return;

    try {
      // 批量更新客户的行业
      const updatePromises = selectedUnmatched.clients.map(client =>
        clientAPI.updateClient(client.id, {
          industryId: industry.id,
          matchType: 'manual'
        })
      );

      await Promise.all(updatePromises);

      message.success(
        `成功将 ${selectedUnmatched.count} 个客户的行业更新为"${industry.name}"`
      );

      setSelectorVisible(false);
      setSelectedUnmatched(null);
      loadStatistics();
    } catch (error) {
      message.error('批量更新失败：' + (error.message || '未知错误'));
    }
  };

  // 批量添加新行业
  const handleBatchAdd = () => {
    batchForm.resetFields();
    setBatchModalVisible(true);
  };

  // 提交批量添加
  const handleBatchSubmit = async () => {
    try {
      const values = await batchForm.validateFields();
      const industries = values.industries
        .split('\n')
        .map(line => line.trim())
        .filter(line => line);

      if (industries.length === 0) {
        message.warning('请输入至少一个行业名称');
        return;
      }

      // 批量创建行业
      const createPromises = industries.map(name =>
        industryAPI.createIndustry({
          name,
          level: values.level,
          parentId: values.parentId
        })
      );

      await Promise.all(createPromises);

      message.success(`成功添加 ${industries.length} 个行业`);
      setBatchModalVisible(false);
      loadStatistics();
    } catch (error) {
      message.error('批量添加失败：' + (error.message || '未知错误'));
    }
  };

  // 行业使用统计表格列
  const industryColumns = [
    {
      title: '排名',
      key: 'rank',
      width: 80,
      render: (_, __, index) => index + 1
    },
    {
      title: '行业名称',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: '使用次数',
      dataIndex: 'count',
      key: 'count',
      sorter: (a, b) => a.count - b.count,
      render: (count) => (
        <Tag color="blue" style={{ fontSize: 14 }}>
          {count}
        </Tag>
      )
    },
    {
      title: '占比',
      key: 'percentage',
      render: (_, record) => {
        const percentage = statistics.total > 0
          ? ((record.count / statistics.total) * 100).toFixed(1)
          : 0;
        return (
          <Space>
            <Progress
              percent={parseFloat(percentage)}
              size="small"
              style={{ width: 100 }}
            />
            <span>{percentage}%</span>
          </Space>
        );
      }
    }
  ];

  // 未匹配数据表格列
  const unmatchedColumns = [
    {
      title: '排名',
      key: 'rank',
      width: 80,
      render: (_, __, index) => index + 1
    },
    {
      title: '原始行业文本',
      dataIndex: 'text',
      key: 'text',
      render: (text) => (
        <Tag color="orange" style={{ fontSize: 13 }}>
          {text}
        </Tag>
      )
    },
    {
      title: '出现次数',
      dataIndex: 'count',
      key: 'count',
      sorter: (a, b) => a.count - b.count,
      render: (count) => (
        <Tag color="red" style={{ fontSize: 14 }}>
          {count}
        </Tag>
      )
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          onClick={() => handleMapIndustry(record)}
        >
          映射到标准行业
        </Button>
      )
    }
  ];

  return (
    <div className="industry-statistics">
      <Card
        title="行业匹配统计"
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={loadStatistics}>
              刷新
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleBatchAdd}
            >
              批量添加新行业
            </Button>
          </Space>
        }
      >
        {/* 总体统计 */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="总客户数"
                value={statistics.total}
                prefix={<BarChartOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="已匹配"
                value={statistics.matched}
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="未匹配"
                value={statistics.unmatched}
                valueStyle={{ color: '#cf1322' }}
                prefix={<QuestionCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <div style={{ textAlign: 'center' }}>
                <div style={{ marginBottom: 8, color: '#666' }}>匹配率</div>
                <Progress
                  type="circle"
                  percent={statistics.matchRate}
                  width={80}
                  strokeColor={
                    statistics.matchRate >= 90
                      ? '#52c41a'
                      : statistics.matchRate >= 70
                      ? '#1890ff'
                      : '#faad14'
                  }
                />
              </div>
            </Card>
          </Col>
        </Row>

        {/* 按匹配类型统计 */}
        <Card title="匹配类型分布" style={{ marginBottom: 24 }}>
          <Row gutter={16}>
            <Col span={4}>
              <Statistic
                title="完全匹配"
                value={statistics.byType.exact || 0}
                valueStyle={{ color: '#52c41a' }}
              />
            </Col>
            <Col span={4}>
              <Statistic
                title="关键词匹配"
                value={statistics.byType.keyword || 0}
                valueStyle={{ color: '#1890ff' }}
              />
            </Col>
            <Col span={4}>
              <Statistic
                title="同义词匹配"
                value={statistics.byType.synonym || 0}
                valueStyle={{ color: '#13c2c2' }}
              />
            </Col>
            <Col span={4}>
              <Statistic
                title="模糊匹配"
                value={statistics.byType.fuzzy || 0}
                valueStyle={{ color: '#faad14' }}
              />
            </Col>
            <Col span={4}>
              <Statistic
                title="手动选择"
                value={statistics.byType.manual || 0}
                valueStyle={{ color: '#722ed1' }}
              />
            </Col>
          </Row>
        </Card>

        {/* 详细统计表格 */}
        <Tabs 
          defaultActiveKey="1"
          items={[
            {
              key: '1',
              label: '行业使用排行',
              children: (
                <Table
                  columns={industryColumns}
                  dataSource={industryStats}
                  rowKey="id"
                  loading={loading}
                  pagination={{ pageSize: 20 }}
                />
              )
            },
            {
              key: '2',
              label: (
                <span>
                  未匹配数据
                  {unmatchedList.length > 0 && (
                    <Tag color="red" style={{ marginLeft: 8 }}>
                      {unmatchedList.length}
                    </Tag>
                  )}
                </span>
              ),
              children: unmatchedList.length > 0 ? (
                <Table
                  columns={unmatchedColumns}
                  dataSource={unmatchedList}
                  rowKey="text"
                  loading={loading}
                  pagination={{ pageSize: 20 }}
                />
              ) : (
                <Empty description="暂无未匹配数据" />
              )
            }
          ]}
        />
      </Card>

      {/* 行业选择器 */}
      <IndustrySelector
        visible={selectorVisible}
        onClose={() => {
          setSelectorVisible(false);
          setSelectedUnmatched(null);
        }}
        onSelect={handleSelectIndustry}
        originalText={selectedUnmatched?.text}
        isAdmin={true}
      />

      {/* 批量添加模态框 */}
      <Modal
        title="批量添加新行业"
        open={batchModalVisible}
        onCancel={() => setBatchModalVisible(false)}
        onOk={handleBatchSubmit}
        width={600}
        okText="确定"
        cancelText="取消"
      >
        <Form form={batchForm} layout="vertical">
          <Form.Item
            name="level"
            label="行业级别"
            rules={[{ required: true, message: '请选择行业级别' }]}
            initialValue={3}
          >
            <Select>
              <Select.Option value={1}>一级分类</Select.Option>
              <Select.Option value={2}>二级分类</Select.Option>
              <Select.Option value={3}>三级分类</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="parentId"
            label="父节点ID"
            extra="如果是一级分类，可以不填"
          >
            <Input placeholder="请输入父节点ID" type="number" />
          </Form.Item>

          <Form.Item
            name="industries"
            label="行业名称列表"
            rules={[{ required: true, message: '请输入行业名称' }]}
            extra="每行一个行业名称"
          >
            <Input.TextArea
              rows={10}
              placeholder="例如：&#10;软件开发&#10;网络安全&#10;人工智能&#10;大数据分析"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default IndustryStatistics;











