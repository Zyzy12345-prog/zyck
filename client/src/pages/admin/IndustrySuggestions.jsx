import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  message,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  Badge,
  Tooltip,
  Progress,
  Row,
  Col,
  Statistic,
  Alert
} from 'antd';
import {
  ReloadOutlined,
  CheckOutlined,
  CloseOutlined,
  LikeOutlined,
  DislikeOutlined,
  PlusOutlined,
  BulbOutlined,
  TrophyOutlined
} from '@ant-design/icons';
import { industryAPI } from '../../services/api';
import { IndustryCascader } from '../../components';
import './IndustrySuggestions.css';

const { TextArea } = Input;
const { Option } = Select;

/**
 * 行业建议和自学习页面
 * 用户可以提交新行业建议，管理员可以审批
 */
const IndustrySuggestions = () => {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [statistics, setStatistics] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  });
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    loadSuggestions();
    checkAdminRole();
  }, []);

  // 检查管理员权限
  const checkAdminRole = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setIsAdmin(user.role === 'admin');
  };

  // 加载建议列表
  const loadSuggestions = async () => {
    setLoading(true);
    try {
      const response = await industryAPI.getSuggestions();
      if (response.success) {
        const data = response.data;
        setSuggestions(data);

        // 计算统计信息
        setStatistics({
          total: data.length,
          pending: data.filter(s => s.status === 'pending').length,
          approved: data.filter(s => s.status === 'approved').length,
          rejected: data.filter(s => s.status === 'rejected').length
        });
      }
    } catch (error) {
      message.error('加载失败：' + (error.message || '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  // 提交新建议
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      await industryAPI.submitSuggestion({
        industryName: values.industryName,
        parentId: values.parentId,
        level: values.level,
        reason: values.reason,
        keywords: values.keywords ? values.keywords.split('\n').filter(k => k.trim()) : []
      });

      message.success('建议提交成功，等待管理员审核');
      setModalVisible(false);
      form.resetFields();
      loadSuggestions();
    } catch (error) {
      if (!error.errorFields) {
        message.error('提交失败：' + (error.message || '未知错误'));
      }
    }
  };

  // 批准建议
  const handleApprove = async (id) => {
    try {
      await industryAPI.approveSuggestion(id);
      message.success('已批准该建议');
      loadSuggestions();
    } catch (error) {
      message.error('操作失败：' + (error.message || '未知错误'));
    }
  };

  // 拒绝建议
  const handleReject = async (id) => {
    try {
      await industryAPI.rejectSuggestion(id);
      message.success('已拒绝该建议');
      loadSuggestions();
    } catch (error) {
      message.error('操作失败：' + (error.message || '未知错误'));
    }
  };

  // 投票
  const handleVote = async (id, vote) => {
    try {
      await industryAPI.voteSuggestion(id, vote);
      message.success(vote === 'up' ? '已支持' : '已反对');
      loadSuggestions();
    } catch (error) {
      message.error('投票失败：' + (error.message || '未知错误'));
    }
  };

  // 获取状态标签
  const getStatusTag = (status) => {
    const configs = {
      pending: { color: 'orange', text: '待审核' },
      approved: { color: 'green', text: '已批准' },
      rejected: { color: 'red', text: '已拒绝' }
    };
    const config = configs[status] || configs.pending;
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  // 获取优先级标签
  const getPriorityTag = (priority) => {
    const configs = {
      high: { color: 'red', text: '高' },
      medium: { color: 'orange', text: '中' },
      low: { color: 'blue', text: '低' }
    };
    const config = configs[priority] || configs.low;
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  // 表格列
  const columns = [
    {
      title: '建议行业',
      dataIndex: 'industryName',
      key: 'industryName',
      render: (text, record) => (
        <Space direction="vertical" size={0}>
          <strong style={{ fontSize: 14 }}>{text}</strong>
          {record.frequency && (
            <Tag color="blue" icon={<TrophyOutlined />}>
              出现 {record.frequency} 次
            </Tag>
          )}
        </Space>
      )
    },
    {
      title: '级别',
      dataIndex: 'level',
      key: 'level',
      width: 80,
      render: (level) => `第${level}级`
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 80,
      render: (priority) => getPriorityTag(priority)
    },
    {
      title: '提交原因',
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true,
      render: (text) => (
        <Tooltip title={text}>
          <span>{text}</span>
        </Tooltip>
      )
    },
    {
      title: '投票',
      key: 'votes',
      width: 120,
      render: (_, record) => (
        <Space>
          <Tooltip title="支持">
            <Button
              type="text"
              icon={<LikeOutlined />}
              onClick={() => handleVote(record.id, 'up')}
              disabled={record.status !== 'pending'}
            >
              {record.upvotes || 0}
            </Button>
          </Tooltip>
          <Tooltip title="反对">
            <Button
              type="text"
              icon={<DislikeOutlined />}
              onClick={() => handleVote(record.id, 'down')}
              disabled={record.status !== 'pending'}
            >
              {record.downvotes || 0}
            </Button>
          </Tooltip>
        </Space>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => getStatusTag(status)
    },
    {
      title: '提交人',
      dataIndex: 'submittedBy',
      key: 'submittedBy',
      width: 100
    },
    {
      title: '提交时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (date) => new Date(date).toLocaleString('zh-CN')
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_, record) => {
        if (record.status !== 'pending') return '-';
        
        if (isAdmin) {
          return (
            <Space>
              <Button
                type="primary"
                size="small"
                icon={<CheckOutlined />}
                onClick={() => handleApprove(record.id)}
              >
                批准
              </Button>
              <Button
                danger
                size="small"
                icon={<CloseOutlined />}
                onClick={() => handleReject(record.id)}
              >
                拒绝
              </Button>
            </Space>
          );
        }
        
        return '-';
      }
    }
  ];

  return (
    <div className="industry-suggestions">
      <Card
        title={
          <Space>
            <BulbOutlined style={{ fontSize: 20, color: '#1890ff' }} />
            <span>行业建议与自学习</span>
          </Space>
        }
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={loadSuggestions}>
              刷新
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setModalVisible(true)}
            >
              提交新建议
            </Button>
          </Space>
        }
      >
        {/* 统计信息 */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="总建议数"
                value={statistics.total}
                prefix={<BulbOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="待审核"
                value={statistics.pending}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="已批准"
                value={statistics.approved}
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="已拒绝"
                value={statistics.rejected}
                valueStyle={{ color: '#cf1322' }}
              />
            </Card>
          </Col>
        </Row>

        {/* 智能提示 */}
        {isAdmin && statistics.pending > 0 && (
          <Alert
            message="待处理建议"
            description={`当前有 ${statistics.pending} 条待审核的行业建议，请及时处理`}
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        {/* 建议列表 */}
        <Table
          columns={columns}
          dataSource={suggestions}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 20 }}
          scroll={{ x: 1400 }}
        />
      </Card>

      {/* 提交建议模态框 */}
      <Modal
        title="提交新行业建议"
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        onOk={handleSubmit}
        width={600}
        okText="提交"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Alert
            message="提交说明"
            description="如果您发现某个行业在系统中不存在或分类不合理，可以提交建议。管理员审核通过后，该行业将被添加到系统中。"
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <Form.Item
            name="industryName"
            label="行业名称"
            rules={[{ required: true, message: '请输入行业名称' }]}
          >
            <Input placeholder="例如：人工智能" />
          </Form.Item>

          <Form.Item
            name="level"
            label="建议级别"
            rules={[{ required: true, message: '请选择级别' }]}
            initialValue={3}
          >
            <Select>
              <Option value={1}>一级分类（大类）</Option>
              <Option value={2}>二级分类（中类）</Option>
              <Option value={3}>三级分类（小类）</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="parentId"
            label="父级行业"
            extra="如果是一级分类，可以不选"
          >
            <IndustryCascader placeholder="请选择父级行业" />
          </Form.Item>

          <Form.Item
            name="keywords"
            label="相关关键词"
            extra="每行一个关键词，用于智能匹配"
          >
            <TextArea
              rows={4}
              placeholder="例如：&#10;AI&#10;机器学习&#10;深度学习"
            />
          </Form.Item>

          <Form.Item
            name="reason"
            label="提交原因"
            rules={[{ required: true, message: '请说明提交原因' }]}
          >
            <TextArea
              rows={3}
              placeholder="请说明为什么需要添加这个行业，例如：在导入客户数据时经常遇到这个行业，但系统中没有对应的分类"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default IndustrySuggestions;











