import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Table, Button, Input, Select, Tag, Space, Modal, Form, message, Statistic, Row, Col, Tooltip, Badge } from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  FilterOutlined,
  UserAddOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  PhoneOutlined,
  MailOutlined,
  TrophyOutlined,
  RocketOutlined,
  FileTextOutlined,
  BellOutlined
} from '@ant-design/icons';
import { customerLeadAPI, leadTagAPI, followUpReminderAPI } from '../services/api';
import LeadFollowUp from '../components/LeadFollowUp';
import LeadTagManager from '../components/LeadTagManager';
import FollowUpReminderModal from '../components/FollowUpReminderModal';
import './CustomerLeads.css';

const { Option } = Select;

const CustomerLeads = () => {
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statistics, setStatistics] = useState({});
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    priority: '',
    source: ''
  });
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState('create');
  const [form] = Form.useForm();
  const [followUpVisible, setFollowUpVisible] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState(null);
  const [tagManagerVisible, setTagManagerVisible] = useState(false);
  const [reminderVisible, setReminderVisible] = useState(false);
  const [reminderCount, setReminderCount] = useState(0);

  useEffect(() => {
    fetchLeads();
    fetchStatistics();
    fetchReminderCount();
  }, [pagination.current, filters]);

  const fetchReminderCount = async () => {
    try {
      const response = await followUpReminderAPI.getReminderStatistics();
      if (response.success) {
        setReminderCount(response.data.unread);
      }
    } catch (error) {
      console.error('获取提醒数量失败', error);
    }
  };

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const response = await customerLeadAPI.getLeads({
        page: pagination.current,
        limit: pagination.pageSize,
        ...filters
      });
      setLeads(response.data);
      setPagination(prev => ({ ...prev, total: response.pagination.total }));
    } catch (error) {
      message.error('获取线索列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await customerLeadAPI.getStatistics();
      setStatistics(response.data);
    } catch (error) {
      console.error('获取统计数据失败', error);
    }
  };

  const handleCreateLead = () => {
    setModalType('create');
    form.resetFields();
    setModalVisible(true);
  };

  const handleEditLead = (record) => {
    setModalType('edit');
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleSubmit = async (values) => {
    try {
      if (modalType === 'create') {
        await customerLeadAPI.createLead(values);
        message.success('线索创建成功');
      } else {
        await customerLeadAPI.updateLead(values.id, values);
        message.success('线索更新成功');
      }
      setModalVisible(false);
      fetchLeads();
      fetchStatistics();
    } catch (error) {
      message.error(modalType === 'create' ? '创建失败' : '更新失败');
    }
  };

  const handleConvert = async (id) => {
    Modal.confirm({
      title: '确认转化',
      content: '确定要将此线索转化为正式客户吗？',
      onOk: async () => {
        try {
          await customerLeadAPI.convertLead(id);
          message.success('线索转化成功');
          fetchLeads();
          fetchStatistics();
        } catch (error) {
          message.error('转化失败');
        }
      }
    });
  };

  const handleBatchAssign = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要分配的线索');
      return;
    }
    Modal.confirm({
      title: '批量分配',
      content: (
        <Form>
          <Form.Item label="分配给" name="userId">
            <Select placeholder="选择销售人员">
              <Option value={1}>销售员A</Option>
              <Option value={2}>销售员B</Option>
            </Select>
          </Form.Item>
        </Form>
      ),
      onOk: async () => {
        // 实现批量分配逻辑
        message.success('批量分配成功');
        setSelectedRowKeys([]);
        fetchLeads();
      }
    });
  };

  const handleShowFollowUp = (leadId) => {
    setSelectedLeadId(leadId);
    setFollowUpVisible(true);
  };

  const statusColors = {
    new: 'blue',
    contacted: 'cyan',
    qualified: 'green',
    negotiating: 'orange',
    converted: 'success',
    lost: 'default'
  };

  const statusLabels = {
    new: '新线索',
    contacted: '已联系',
    qualified: '已验证',
    negotiating: '洽谈中',
    converted: '已转化',
    lost: '已丢失'
  };

  const priorityColors = {
    low: 'default',
    medium: 'blue',
    high: 'orange',
    urgent: 'red'
  };

  const priorityLabels = {
    low: '低',
    medium: '中',
    high: '高',
    urgent: '紧急'
  };

  const columns = [
    {
      title: '公司名称',
      dataIndex: 'companyName',
      key: 'companyName',
      width: 200,
      fixed: 'left',
      render: (text, record) => (
        <a onClick={() => navigate(`/leads/${record.id}`)}>{text}</a>
      )
    },
    {
      title: '联系人',
      dataIndex: 'contactPerson',
      key: 'contactPerson',
      width: 120
    },
    {
      title: '联系方式',
      key: 'contact',
      width: 180,
      render: (_, record) => (
        <Space direction="vertical" size="small">
          {record.phone && (
            <span><PhoneOutlined /> {record.phone}</span>
          )}
          {record.email && (
            <span><MailOutlined /> {record.email}</span>
          )}
        </Space>
      )
    },
    {
      title: '来源',
      dataIndex: 'source',
      key: 'source',
      width: 100,
      render: (source) => {
        const sourceLabels = {
          website: '官网',
          referral: '推荐',
          cold_call: '陌拜',
          exhibition: '展会',
          social_media: '社交媒体',
          partner: '合作伙伴',
          other: '其他'
        };
        return sourceLabels[source] || source;
      }
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => (
        <Tag color={statusColors[status]}>{statusLabels[status]}</Tag>
      )
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      render: (priority) => (
        <Tag color={priorityColors[priority]}>{priorityLabels[priority]}</Tag>
      )
    },
    {
      title: '评分',
      dataIndex: 'score',
      key: 'score',
      width: 80,
      render: (score) => (
        <Tooltip title="线索评分">
          <Tag color={score >= 80 ? 'green' : score >= 60 ? 'orange' : 'default'}>
            {score || 0}分
          </Tag>
        </Tooltip>
      )
    },
    {
      title: '负责人',
      dataIndex: ['assignedUser', 'username'],
      key: 'assignedUser',
      width: 100,
      render: (username) => username || '-'
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (date) => new Date(date).toLocaleDateString()
    },
    {
      title: '操作',
      key: 'action',
      width: 250,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" onClick={() => handleEditLead(record)}>
            编辑
          </Button>
          <Button 
            type="link" 
            size="small" 
            icon={<FileTextOutlined />}
            onClick={() => handleShowFollowUp(record.id)}
          >
            跟进
          </Button>
          {record.status !== 'converted' && (
            <Button type="link" size="small" onClick={() => handleConvert(record.id)}>
              转化
            </Button>
          )}
          <Button type="link" size="small" onClick={() => navigate(`/leads/${record.id}`)}>
            详情
          </Button>
        </Space>
      )
    }
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: setSelectedRowKeys
  };

  return (
    <div className="customer-leads-page">
      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总线索数"
              value={statistics.totalLeads || 0}
              prefix={<RocketOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已转化"
              value={statistics.convertedCount || 0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="转化率"
              value={statistics.conversionRate || 0}
              suffix="%"
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="待跟进"
              value={statistics.byStatus?.new || 0}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* 主内容卡片 */}
      <Card
        title="客户线索管理"
        extra={
          <Space>
            <Badge count={reminderCount} offset={[10, 0]}>
              <Button 
                icon={<BellOutlined />} 
                onClick={() => setReminderVisible(true)}
              >
                跟进提醒
              </Button>
            </Badge>
            <Button icon={<PlusOutlined />} type="primary" onClick={handleCreateLead}>
              新增线索
            </Button>
            <Button icon={<UserAddOutlined />} onClick={handleBatchAssign} disabled={selectedRowKeys.length === 0}>
              批量分配
            </Button>
            <Button onClick={() => setTagManagerVisible(true)}>
              标签管理
            </Button>
          </Space>
        }
      >
        {/* 筛选栏 */}
        <Space style={{ marginBottom: 16 }} wrap>
          <Input
            placeholder="搜索公司名称、联系人、电话"
            prefix={<SearchOutlined />}
            style={{ width: 300 }}
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            allowClear
          />
          <Select
            placeholder="状态"
            style={{ width: 120 }}
            value={filters.status}
            onChange={(value) => setFilters({ ...filters, status: value })}
            allowClear
          >
            <Option value="new">新线索</Option>
            <Option value="contacted">已联系</Option>
            <Option value="qualified">已验证</Option>
            <Option value="negotiating">洽谈中</Option>
            <Option value="converted">已转化</Option>
            <Option value="lost">已丢失</Option>
          </Select>
          <Select
            placeholder="优先级"
            style={{ width: 120 }}
            value={filters.priority}
            onChange={(value) => setFilters({ ...filters, priority: value })}
            allowClear
          >
            <Option value="low">低</Option>
            <Option value="medium">中</Option>
            <Option value="high">高</Option>
            <Option value="urgent">紧急</Option>
          </Select>
          <Select
            placeholder="来源"
            style={{ width: 120 }}
            value={filters.source}
            onChange={(value) => setFilters({ ...filters, source: value })}
            allowClear
          >
            <Option value="website">官网</Option>
            <Option value="referral">推荐</Option>
            <Option value="cold_call">陌拜</Option>
            <Option value="exhibition">展会</Option>
            <Option value="social_media">社交媒体</Option>
          </Select>
        </Space>

        {/* 表格 */}
        <Table
          rowSelection={rowSelection}
          columns={columns}
          dataSource={leads}
          loading={loading}
          rowKey="id"
          scroll={{ x: 1500 }}
          pagination={{
            ...pagination,
            onChange: (page) => setPagination({ ...pagination, current: page })
          }}
        />
      </Card>

      {/* 创建/编辑模态框 */}
      <Modal
        title={modalType === 'create' ? '新增线索' : '编辑线索'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={800}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="companyName" label="公司名称" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="contactPerson" label="联系人">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="phone" label="电话">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="email" label="邮箱">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="source" label="来源" rules={[{ required: true }]}>
                <Select>
                  <Option value="website">官网</Option>
                  <Option value="referral">推荐</Option>
                  <Option value="cold_call">陌拜</Option>
                  <Option value="exhibition">展会</Option>
                  <Option value="social_media">社交媒体</Option>
                  <Option value="partner">合作伙伴</Option>
                  <Option value="other">其他</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="priority" label="优先级" rules={[{ required: true }]}>
                <Select>
                  <Option value="low">低</Option>
                  <Option value="medium">中</Option>
                  <Option value="high">高</Option>
                  <Option value="urgent">紧急</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="notes" label="备注">
            <Input.TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>

      {/* 跟进记录模态框 */}
      <LeadFollowUp
        leadId={selectedLeadId}
        visible={followUpVisible}
        onClose={() => {
          setFollowUpVisible(false);
          setSelectedLeadId(null);
        }}
      />

      {/* 标签管理模态框 */}
      <LeadTagManager
        visible={tagManagerVisible}
        onClose={() => setTagManagerVisible(false)}
        onTagsChange={() => fetchLeads()}
      />

      {/* 跟进提醒模态框 */}
      <FollowUpReminderModal
        visible={reminderVisible}
        onClose={() => {
          setReminderVisible(false);
          fetchReminderCount();
        }}
      />
    </div>
  );
};

export default CustomerLeads;

