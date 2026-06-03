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
  Tabs,
  Modal,
  Descriptions
} from 'antd';
import {
  TrophyOutlined,
  RiseOutlined,
  FallOutlined,
  ReloadOutlined,
  CalculatorOutlined,
  EyeOutlined,
  WarningOutlined
} from '@ant-design/icons';
import { clientScoringAPI, clientAPI } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import './ClientGrading.css';



const ClientGrading = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [distribution, setDistribution] = useState({});
  const [highValueClients, setHighValueClients] = useState([]);
  const [atRiskClients, setAtRiskClients] = useState([]);
  const [selectedLevel, setSelectedLevel] = useState('A');
  const [levelClients, setLevelClients] = useState([]);
  const [scoreModalVisible, setScoreModalVisible] = useState(false);
  const [selectedScore, setSelectedScore] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedLevel) {
      fetchLevelClients(selectedLevel);
    }
  }, [selectedLevel]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [distRes, highValueRes, atRiskRes] = await Promise.all([
        clientScoringAPI.getLevelDistribution(),
        clientScoringAPI.getHighValueClients({ limit: 10 }),
        clientScoringAPI.getAtRiskClients({ limit: 10, threshold: 60 })
      ]);

      if (distRes.success) {
        setDistribution(distRes.data);
      }

      if (highValueRes.success) {
        setHighValueClients(highValueRes.data.clients);
      }

      if (atRiskRes.success) {
        setAtRiskClients(atRiskRes.data.clients);
      }
    } catch (error) {
      message.error('获取数据失败：' + (error.message || '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  const fetchLevelClients = async (level) => {
    setLoading(true);
    try {
      const response = await clientScoringAPI.getClientsByLevel(level);
      if (response.success) {
        setLevelClients(response.data);
      }
    } catch (error) {
      message.error('获取客户列表失败：' + (error.message || '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  const handleCalculateScore = async (clientId) => {
    try {
      message.loading({ content: '正在计算评分...', key: 'calc' });
      const response = await clientScoringAPI.calculateClientScore(clientId);
      if (response.success) {
        message.success({ content: '评分计算完成', key: 'calc' });
        fetchData();
        fetchLevelClients(selectedLevel);
      }
    } catch (error) {
      message.error({ content: '计算失败：' + (error.message || '未知错误'), key: 'calc' });
    }
  };

  const handleBatchCalculate = async () => {
    Modal.confirm({
      title: '批量计算评分',
      content: '确定要为所有客户重新计算评分吗？这可能需要一些时间。',
      okText: '确定',
      cancelText: '取消',
      onOk: async () => {
        try {
          message.loading({ content: '正在批量计算...', key: 'batch' });
          const response = await clientScoringAPI.batchCalculateScores();
          if (response.success) {
            message.success({
              content: `批量计算完成！成功: ${response.data.successful}, 失败: ${response.data.failed}`,
              key: 'batch',
              duration: 5
            });
            fetchData();
            fetchLevelClients(selectedLevel);
          }
        } catch (error) {
          message.error({ content: '批量计算失败：' + (error.message || '未知错误'), key: 'batch' });
        }
      }
    });
  };

  const handleViewScore = async (clientId) => {
    try {
      const response = await clientScoringAPI.getClientScore(clientId);
      if (response.success) {
        setSelectedScore(response.data);
        setScoreModalVisible(true);
      }
    } catch (error) {
      message.error('获取评分详情失败：' + (error.message || '未知错误'));
    }
  };

  const getLevelColor = (level) => {
    const colors = {
      'A': '#f5222d',
      'B': '#faad14',
      'C': '#1890ff',
      'D': '#8c8c8c'
    };
    return colors[level] || '#8c8c8c';
  };

  const getLevelName = (level) => {
    const names = {
      'A': '优质客户',
      'B': '重要客户',
      'C': '普通客户',
      'D': '潜力客户'
    };
    return names[level] || level;
  };

  const totalClients = Object.values(distribution).reduce((sum, count) => sum + count, 0);

  const levelColumns = [
    {
      title: '客户名称',
      dataIndex: 'companyName',
      key: 'companyName',
      render: (text, record) => (
        <a onClick={() => navigate(`/customers/${record.id}`)}>
          {text}
        </a>
      )
    },
    {
      title: '客户等级',
      dataIndex: 'customerLevel',
      key: 'customerLevel',
      render: (level) => (
        <Tag color={getLevelColor(level)}>
          {level}级 - {getLevelName(level)}
        </Tag>
      )
    },
    {
      title: '总分',
      dataIndex: ['score', 'totalScore'],
      key: 'totalScore',
      render: (score) => score || '-',
      sorter: (a, b) => (a.score?.totalScore || 0) - (b.score?.totalScore || 0)
    },
    {
      title: '跟进评分',
      dataIndex: ['score', 'followUpScore'],
      key: 'followUpScore',
      render: (score) => score || '-'
    },
    {
      title: '交易评分',
      dataIndex: ['score', 'dealAmountScore'],
      key: 'dealAmountScore',
      render: (score) => score || '-'
    },
    {
      title: '互动评分',
      dataIndex: ['score', 'interactionScore'],
      key: 'interactionScore',
      render: (score) => score || '-'
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewScore(record.id)}
          >
            查看详情
          </Button>
          <Button
            type="link"
            size="small"
            icon={<CalculatorOutlined />}
            onClick={() => handleCalculateScore(record.id)}
          >
            重新计算
          </Button>
        </Space>
      )
    }
  ];

  const atRiskColumns = [
    {
      title: '客户名称',
      dataIndex: 'companyName',
      key: 'companyName',
      render: (text, record) => (
        <a onClick={() => navigate(`/customers/${record.id}`)}>
          {text}
        </a>
      )
    },
    {
      title: '流失风险',
      dataIndex: 'churnRiskScore',
      key: 'churnRiskScore',
      render: (score) => (
        <Progress
          percent={score}
          status={score >= 80 ? 'exception' : score >= 60 ? 'normal' : 'success'}
          size="small"
        />
      ),
      sorter: (a, b) => a.churnRiskScore - b.churnRiskScore
    },
    {
      title: '最后跟进',
      dataIndex: 'lastFollowUpDate',
      key: 'lastFollowUpDate',
      render: (date) => date || '从未跟进'
    },
    {
      title: '客户等级',
      dataIndex: 'customerLevel',
      key: 'customerLevel',
      render: (level) => level ? (
        <Tag color={getLevelColor(level)}>{level}级</Tag>
      ) : '-'
    }
  ];

  return (
    <div className="client-grading-container">
      {/* 等级分布统计 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="A级客户（优质）"
              value={distribution.A || 0}
              suffix={`/ ${totalClients}`}
              valueStyle={{ color: '#f5222d' }}
              prefix={<TrophyOutlined />}
            />
            <Progress
              percent={totalClients > 0 ? ((distribution.A || 0) / totalClients * 100).toFixed(1) : 0}
              strokeColor="#f5222d"
              showInfo={false}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="B级客户（重要）"
              value={distribution.B || 0}
              suffix={`/ ${totalClients}`}
              valueStyle={{ color: '#faad14' }}
              prefix={<RiseOutlined />}
            />
            <Progress
              percent={totalClients > 0 ? ((distribution.B || 0) / totalClients * 100).toFixed(1) : 0}
              strokeColor="#faad14"
              showInfo={false}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="C级客户（普通）"
              value={distribution.C || 0}
              suffix={`/ ${totalClients}`}
              valueStyle={{ color: '#1890ff' }}
            />
            <Progress
              percent={totalClients > 0 ? ((distribution.C || 0) / totalClients * 100).toFixed(1) : 0}
              strokeColor="#1890ff"
              showInfo={false}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="D级客户（潜力）"
              value={distribution.D || 0}
              suffix={`/ ${totalClients}`}
              valueStyle={{ color: '#8c8c8c' }}
              prefix={<FallOutlined />}
            />
            <Progress
              percent={totalClients > 0 ? ((distribution.D || 0) / totalClients * 100).toFixed(1) : 0}
              strokeColor="#8c8c8c"
              showInfo={false}
            />
          </Card>
        </Col>
      </Row>

      {/* 主要内容 */}
      <Card
        title="客户分级管理"
        extra={
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchData}
            >
              刷新
            </Button>
            <Button
              type="primary"
              icon={<CalculatorOutlined />}
              onClick={handleBatchCalculate}
            >
              批量计算评分
            </Button>
          </Space>
        }
      >
        <Tabs 
          activeKey={selectedLevel} 
          onChange={setSelectedLevel}
          items={[
            {
              key: 'A',
              label: `A级客户 (${distribution.A || 0})`,
              children: (
                <Table
                  columns={levelColumns}
                  dataSource={levelClients}
                  rowKey={(record, index) => `${record.id}-${index}`}
                  loading={loading}
                  pagination={{
                    showSizeChanger: true,
                    showTotal: (total) => `共 ${total} 条记录`
                  }}
                />
              )
            },
            {
              key: 'B',
              label: `B级客户 (${distribution.B || 0})`,
              children: (
                <Table
                  columns={levelColumns}
                  dataSource={levelClients}
                  rowKey={(record, index) => `${record.id}-${index}`}
                  loading={loading}
                  pagination={{
                    showSizeChanger: true,
                    showTotal: (total) => `共 ${total} 条记录`
                  }}
                />
              )
            },
            {
              key: 'C',
              label: `C级客户 (${distribution.C || 0})`,
              children: (
                <Table
                  columns={levelColumns}
                  dataSource={levelClients}
                  rowKey={(record, index) => `${record.id}-${index}`}
                  loading={loading}
                  pagination={{
                    showSizeChanger: true,
                    showTotal: (total) => `共 ${total} 条记录`
                  }}
                />
              )
            },
            {
              key: 'D',
              label: `D级客户 (${distribution.D || 0})`,
              children: (
                <Table
                  columns={levelColumns}
                  dataSource={levelClients}
                  rowKey={(record, index) => `${record.id}-${index}`}
                  loading={loading}
                  pagination={{
                    showSizeChanger: true,
                    showTotal: (total) => `共 ${total} 条记录`
                  }}
                />
              )
            },
            {
              key: 'at-risk',
              label: (
                <span>
                  <WarningOutlined /> 流失风险客户
                </span>
              ),
              children: (
                <Table
                  columns={atRiskColumns}
                  dataSource={atRiskClients}
                  rowKey={(record, index) => `${record.id}-${index}`}
                  loading={loading}
                  pagination={{
                    showSizeChanger: true,
                    showTotal: (total) => `共 ${total} 条记录`
                  }}
                />
              )
            }
          ]}
        />
      </Card>

      {/* 评分详情模态框 */}
      <Modal
        title="客户评分详情"
        open={scoreModalVisible}
        onCancel={() => setScoreModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setScoreModalVisible(false)}>
            关闭
          </Button>
        ]}
        width={700}
      >
        {selectedScore && (
          <Descriptions bordered column={2}>
            <Descriptions.Item label="客户名称" span={2}>
              {selectedScore.client?.companyName}
            </Descriptions.Item>
            <Descriptions.Item label="客户等级">
              <Tag color={getLevelColor(selectedScore.calculatedLevel)}>
                {selectedScore.calculatedLevel}级 - {getLevelName(selectedScore.calculatedLevel)}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="总分">
              <span style={{ fontSize: 20, fontWeight: 'bold', color: '#1890ff' }}>
                {selectedScore.totalScore}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="跟进频率评分">
              <Progress percent={selectedScore.followUpScore} size="small" />
            </Descriptions.Item>
            <Descriptions.Item label="交易金额评分">
              <Progress percent={selectedScore.dealAmountScore} size="small" />
            </Descriptions.Item>
            <Descriptions.Item label="互动质量评分">
              <Progress percent={selectedScore.interactionScore} size="small" />
            </Descriptions.Item>
            <Descriptions.Item label="潜力评分">
              <Progress percent={selectedScore.potentialScore} size="small" />
            </Descriptions.Item>
            <Descriptions.Item label="计算时间" span={2}>
              {new Date(selectedScore.calculationDate).toLocaleString('zh-CN')}
            </Descriptions.Item>
            {selectedScore.notes && (
              <Descriptions.Item label="备注" span={2}>
                {selectedScore.notes}
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default ClientGrading;

