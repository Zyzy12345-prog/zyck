import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Tabs,
  Descriptions,
  Tag,
  Button,
  Space,
  Timeline,
  Upload,
  Table,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  message,
  Spin,
  Empty,
  Avatar,
  Divider,
  Row,
  Col,
  Statistic,
  Badge,
  Tooltip,
  List
} from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  PhoneOutlined,
  MailOutlined,
  GlobalOutlined,
  UserOutlined,
  CalendarOutlined,
  FileTextOutlined,
  UploadOutlined,
  PlusOutlined,
  DeleteOutlined,
  DownloadOutlined,
  CommentOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  MessageOutlined,
  RiseOutlined
} from '@ant-design/icons';
import api from '../../services/api';
import dayjs from 'dayjs';
import FollowUpForm from '../../components/FollowUpForm';
import FollowUpCalendar from '../../components/FollowUpCalendar';
import CommunicationPanel from '../../components/CommunicationPanel';
import CommunicationTimeline from '../../components/CommunicationTimeline';
import LiveChat from '../../components/LiveChat';
import { customerTagAPI, clientScoringAPI, salesFunnelAPI } from '../../services/api';
import './CustomerDetail.css';


const { TextArea } = Input;
const { Option } = Select;

const CustomerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState(null);
  const [activeTab, setActiveTab] = useState('basic');
  const [followUpModalVisible, setFollowUpModalVisible] = useState(false);
  const [discussionModalVisible, setDiscussionModalVisible] = useState(false);
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [selectedFollowUp, setSelectedFollowUp] = useState(null);
  const [commentContent, setCommentContent] = useState('');
  const [form] = Form.useForm();
  const [discussionForm] = Form.useForm();
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editForm] = Form.useForm();
  
  // Phase 2: 新增状态
  const [tags, setTags] = useState([]);
  const [allTags, setAllTags] = useState([]);
  const [tagModalVisible, setTagModalVisible] = useState(false);
  const [selectedTags, setSelectedTags] = useState([]);
  const [score, setScore] = useState(null);
  const [opportunities, setOpportunities] = useState([]);
  const [opportunityModalVisible, setOpportunityModalVisible] = useState(false);
  const [opportunityForm] = Form.useForm();
  
  // 通讯面板状态
  const [communicationPanelVisible, setCommunicationPanelVisible] = useState(false);
  const [communicationRefreshKey, setCommunicationRefreshKey] = useState(0);
  
  // 实时聊天状态
  const [liveChatVisible, setLiveChatVisible] = useState(false);

  // 获取客户详情
  const fetchCustomerDetail = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await api.get(`http://localhost:3000/api/clients/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setCustomer(response.data.data);
      }
    } catch (error) {
      console.error('获取客户详情失败:', error);
      message.error('获取客户详情失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomerDetail();
    fetchClientTags();
    fetchAllTags();
    fetchClientScore();
    fetchOpportunities();
  }, [id]);

  // 获取客户标签
  const fetchClientTags = async () => {
    try {
      const response = await customerTagAPI.getClientTags(id);
      if (response.success) {
        setTags(response.data);
      }
    } catch (error) {
      console.error('获取客户标签失败:', error);
    }
  };

  // 获取所有标签
  const fetchAllTags = async () => {
    try {
      const response = await customerTagAPI.getTags();
      if (response.success) {
        setAllTags(response.data);
      }
    } catch (error) {
      console.error('获取标签列表失败:', error);
    }
  };

  // 获取客户评分
  const fetchClientScore = async () => {
    try {
      const response = await clientScoringAPI.getClientScore(id);
      if (response.success) {
        setScore(response.data);
      }
    } catch (error) {
      console.log('客户评分不存在');
    }
  };

  // 获取客户商机
  const fetchOpportunities = async () => {
    try {
      const response = await salesFunnelAPI.getOpportunities({ clientId: id });
      if (response.success) {
        setOpportunities(response.data.opportunities);
      }
    } catch (error) {
      console.error('获取商机列表失败:', error);
    }
  };

  // 添加标签
  const handleAddTags = async () => {
    try {
      await customerTagAPI.batchAddTagsToClient({
        clientIds: [parseInt(id)],
        tagIds: selectedTags
      });
      message.success('标签添加成功');
      setTagModalVisible(false);
      setSelectedTags([]);
      fetchClientTags();
    } catch (error) {
      message.error('添加标签失败：' + (error.message || '未知错误'));
    }
  };

  // 移除标签
  const handleRemoveTag = async (tagId) => {
    try {
      await customerTagAPI.removeTagFromClient(id, tagId);
      message.success('标签移除成功');
      fetchClientTags();
    } catch (error) {
      message.error('移除标签失败：' + (error.message || '未知错误'));
    }
  };

  // 重新计算评分
  const handleCalculateScore = async () => {
    try {
      message.loading({ content: '正在计算评分...', key: 'calc' });
      const response = await clientScoringAPI.calculateClientScore(id);
      if (response.success) {
        message.success({ content: '评分计算完成', key: 'calc' });
        setScore(response.data);
        fetchCustomerDetail(); // 刷新客户等级
      }
    } catch (error) {
      message.error({ content: '计算失败：' + (error.message || '未知错误'), key: 'calc' });
    }
  };

  // 创建商机
  const handleCreateOpportunity = async (values) => {
    try {
      const response = await salesFunnelAPI.createOpportunity({
        ...values,
        clientId: id,
        expectedCloseDate: values.expectedCloseDate ? values.expectedCloseDate.format('YYYY-MM-DD') : null
      });
      
      if (response.success) {
        message.success('商机创建成功');
        setOpportunityModalVisible(false);
        opportunityForm.resetFields();
        fetchOpportunities();
      }
    } catch (error) {
      message.error('创建失败：' + (error.message || '未知错误'));
    }
  };

  // 客户等级配置
  const levelConfig = {
    A: { text: 'A级-重点客户', color: 'red' },
    B: { text: 'B级-优质客户', color: 'orange' },
    C: { text: 'C级-普通客户', color: 'blue' },
    D: { text: 'D级-潜在客户', color: 'default' }
  };

  // 公司规模配置
  const scaleConfig = {
    micro: '微型(1-9人)',
    small: '小型(10-49人)',
    medium: '中型(50-299人)',
    large: '大型(300人以上)'
  };

  // 财税状态配置
  const statusConfig = {
    pending: { text: '待处理', color: 'default' },
    processing: { text: '处理中', color: 'processing' },
    completed: { text: '已完成', color: 'success' },
    cancelled: { text: '已取消', color: 'error' }
  };

  // 跟进方式配置
  const followTypeConfig = {
    phone: { text: '电话', icon: <PhoneOutlined /> },
    visit: { text: '拜访', icon: <UserOutlined /> },
    email: { text: '邮件', icon: <MailOutlined /> },
    wechat: { text: '微信', icon: <CommentOutlined /> },
    meeting: { text: '会议', icon: <CalendarOutlined /> },
    other: { text: '其他', icon: <FileTextOutlined /> }
  };

  // 跟进结果配置
  const resultConfig = {
    success: { text: '成功', color: 'success' },
    next_stage: { text: '推动到下一阶段', color: 'processing' },
    need_follow: { text: '需要再次跟进', color: 'warning' },
    failed: { text: '失败', color: 'error' },
    pending: { text: '待定', color: 'warning' },
    no_answer: { text: '未接通', color: 'default' }
  };

  // 文件分类配置
  const fileCategoryConfig = {
    contract: '合同',
    invoice: '发票',
    certificate: '证书',
    report: '报告',
    other: '其他'
  };

  // 创建跟进记录
  const handleCreateFollowUp = async (values) => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.post(
        `http://localhost:3000/api/clients/${id}/follow-ups`,
        {
          ...values,
          followTime: values.followTime ? values.followTime.toISOString() : new Date().toISOString(),
          nextFollowTime: values.nextFollowTime ? values.nextFollowTime.toISOString() : null
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        message.success('跟进记录创建成功');
        setFollowUpModalVisible(false);
        form.resetFields();
        fetchCustomerDetail();
      }
    } catch (error) {
      console.error('创建跟进记录失败:', error);
      message.error('创建跟进记录失败');
    }
  };

  // 添加跟进记录评论
  const handleAddComment = async (followUpId) => {
    if (!commentContent.trim()) {
      message.warning('请输入评论内容');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await api.post(
        `http://localhost:3000/api/clients/follow-ups/${followUpId}/comments`,
        { content: commentContent },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        message.success('评论添加成功');
        setCommentContent('');
        setCommentModalVisible(false);
        setSelectedFollowUp(null);
        fetchCustomerDetail();
      }
    } catch (error) {
      console.error('添加评论失败:', error);
      message.error('添加评论失败');
    }
  };

  // 删除评论
  const handleDeleteComment = async (commentId) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这条评论吗？',
      onOk: async () => {
        try {
          const token = localStorage.getItem('token');
          await api.delete(`http://localhost:3000/api/clients/follow-up-comments/${commentId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          message.success('删除成功');
          fetchCustomerDetail();
        } catch (error) {
          message.error('删除失败');
        }
      }
    });
  };

  // 创建讨论
  const handleCreateDiscussion = async (values) => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.post(
        `http://localhost:3000/api/clients/${id}/discussions`,
        values,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        message.success('讨论发布成功');
        setDiscussionModalVisible(false);
        discussionForm.resetFields();
        fetchCustomerDetail();
      }
    } catch (error) {
      console.error('创建讨论失败:', error);
      message.error('创建讨论失败');
    }
  };

  // 删除跟进记录
  const handleDeleteFollowUp = async (followUpId) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这条跟进记录吗？',
      onOk: async () => {
        try {
          const token = localStorage.getItem('token');
          await api.delete(`http://localhost:3000/api/clients/follow-ups/${followUpId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          message.success('删除成功');
          fetchCustomerDetail();
        } catch (error) {
          message.error('删除失败');
        }
      }
    });
  };

  // 删除讨论
  const handleDeleteDiscussion = async (discussionId) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这条讨论吗？',
      onOk: async () => {
        try {
          const token = localStorage.getItem('token');
          await api.delete(`http://localhost:3000/api/clients/discussions/${discussionId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          message.success('删除成功');
          fetchCustomerDetail();
        } catch (error) {
          message.error('删除失败');
        }
      }
    });
  };

  // 打开编辑模态框
  const handleOpenEdit = () => {
    editForm.setFieldsValue({
      companyName: customer.companyName,
      contactPerson: customer.contactPerson,
      phone: customer.phone,
      email: customer.email,
      wechat: customer.wechat,
      address: customer.address,
      website: customer.website,
      industry: customer.originalIndustry || customer.industry?.name,
      companyScale: customer.companyScale,
      employeeCount: customer.employeeCount,
      registeredCapital: customer.registeredCapital,
      establishedDate: customer.establishedDate,
      legalRepresentative: customer.legalRepresentative,
      customerLevel: customer.customerLevel,
      customerSource: customer.customerSource,
      taxStatus: customer.taxStatus,
      businessScope: customer.businessScope,
      remarks: customer.remarks
    });
    setEditModalVisible(true);
  };

  // 更新客户信息
  const handleUpdateClient = async (values) => {
    try {
      console.log('提交的表单数据:', values);
      const token = localStorage.getItem('token');
      const response = await api.put(
        `http://localhost:3000/api/clients/${id}`,
        values,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        message.success('客户信息更新成功');
        setEditModalVisible(false);
        editForm.resetFields();
        fetchCustomerDetail();
      }
    } catch (error) {
      console.error('更新客户信息失败:', error);
      console.error('错误响应:', error.response?.data);
      
      // 显示详细的验证错误
      if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        const errorMessages = error.response.data.errors.map(e => `${e.field}: ${e.message}`).join('\n');
        message.error({
          content: (
            <div>
              <div>更新失败：</div>
              <div style={{ whiteSpace: 'pre-line', marginTop: 8 }}>{errorMessages}</div>
            </div>
          ),
          duration: 5
        });
      } else {
        message.error('更新客户信息失败：' + (error.response?.data?.message || '未知错误'));
      }
    }
  };

  if (loading) {
    return (
      <div className="customer-detail-loading">
        <Spin size="large">
          <div style={{ marginTop: 8 }}>加载中...</div>
        </Spin>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="customer-detail-empty">
        <Empty description="客户不存在" />
        <Button type="primary" onClick={() => navigate('/customers')}>
          返回列表
        </Button>
      </div>
    );
  }

  return (
    <div className="customer-detail-container">
      {/* 头部操作栏 */}
      <div className="customer-detail-header">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/customers')}
        >
          返回
        </Button>
        <Space>
          <Button icon={<EditOutlined />} type="primary" onClick={handleOpenEdit}>
            编辑客户
          </Button>
          <Button 
            icon={<PhoneOutlined />}
            type="primary"
            onClick={() => setCommunicationPanelVisible(true)}
          >
            联系客户
          </Button>
          <Button 
            icon={<CommentOutlined />}
            type="primary"
            style={{ background: '#52c41a', borderColor: '#52c41a' }}
            onClick={() => setLiveChatVisible(true)}
          >
            在线聊天
          </Button>
        </Space>
      </div>

      {/* 客户基本信息卡片 */}
      <Card className="customer-info-card">
        <Row gutter={24}>
          <Col span={18}>
            <div className="customer-header">
              <Avatar size={64} icon={<UserOutlined />} className="customer-avatar" />
              <div className="customer-title">
                <h1>{customer.companyName}</h1>
                <Space size="large" wrap>
                  <Tag color={levelConfig[customer.customerLevel]?.color || 'default'}>
                    {levelConfig[customer.customerLevel]?.text || '未设置'}
                  </Tag>
                  {score && (
                    <Tooltip title={`总分: ${score.totalScore}`}>
                      <Tag color="purple">评分: {score.totalScore}</Tag>
                    </Tooltip>
                  )}
                  <Tag color={statusConfig[customer.taxStatus]?.color}>
                    {statusConfig[customer.taxStatus]?.text}
                  </Tag>
                  {customer.industry && (
                    <Tag color="blue">{customer.industry.name}</Tag>
                  )}
                  {/* 显示客户标签 */}
                  {tags.map(tag => (
                    <Tag
                      key={tag.id}
                      color={tag.color}
                      closable
                      onClose={() => handleRemoveTag(tag.id)}
                    >
                      {tag.name}
                    </Tag>
                  ))}
                  <Tag
                    icon={<PlusOutlined />}
                    style={{ cursor: 'pointer', borderStyle: 'dashed' }}
                    onClick={() => setTagModalVisible(true)}
                  >
                    添加标签
                  </Tag>
                </Space>
              </div>
            </div>

            <Divider />

            <Row gutter={[16, 16]}>
              <Col span={8}>
                <div className="info-item">
                  <UserOutlined className="info-icon" />
                  <div>
                    <div className="info-label">联系人</div>
                    <div className="info-value">{customer.contactPerson || '-'}</div>
                  </div>
                </div>
              </Col>
              <Col span={8}>
                <div className="info-item">
                  <PhoneOutlined className="info-icon" />
                  <div>
                    <div className="info-label">电话</div>
                    <div className="info-value">{customer.phone || '-'}</div>
                  </div>
                </div>
              </Col>
              <Col span={8}>
                <div className="info-item">
                  <MailOutlined className="info-icon" />
                  <div>
                    <div className="info-label">邮箱</div>
                    <div className="info-value">{customer.email || '-'}</div>
                  </div>
                </div>
              </Col>
            </Row>
          </Col>

          <Col span={6}>
            <div className="customer-stats">
              <Statistic
                title="跟进次数"
                value={customer.followUps?.length || 0}
                prefix={<ClockCircleOutlined />}
              />
              <Divider />
              <Statistic
                title="商机数量"
                value={opportunities.length}
                prefix={<RiseOutlined />}
              />
              <Divider />
              <Statistic
                title="相关文件"
                value={customer.files?.length || 0}
                prefix={<FileTextOutlined />}
              />
              <Divider />
              {score ? (
                <div style={{ textAlign: 'center' }}>
                  <Button
                    type="link"
                    size="small"
                    onClick={handleCalculateScore}
                  >
                    重新计算评分
                  </Button>
                </div>
              ) : (
                <Button
                  type="primary"
                  size="small"
                  block
                  onClick={handleCalculateScore}
                >
                  计算评分
                </Button>
              )}
            </div>
          </Col>
        </Row>
      </Card>

      {/* 标签页内容 */}
      <Card className="customer-tabs-card">
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          items={[
            {
              key: 'basic',
              label: '基本信息',
              children: (
                <Descriptions bordered column={2}>
              <Descriptions.Item label="公司名称" span={2}>
                {customer.companyName}
              </Descriptions.Item>
              <Descriptions.Item label="联系人">
                {customer.contactPerson || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="联系电话">
                {customer.phone || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="邮箱">
                {customer.email || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="微信">
                {customer.wechat || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="公司地址" span={2}>
                {customer.address || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="公司网址" span={2}>
                {customer.website ? (
                  <a href={customer.website} target="_blank" rel="noopener noreferrer">
                    {customer.website}
                  </a>
                ) : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="所属行业">
                {customer.industry?.name || customer.originalIndustry || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="公司规模">
                {scaleConfig[customer.companyScale] || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="员工人数">
                {customer.employeeCount || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="注册资本">
                {customer.registeredCapital ? `${customer.registeredCapital}万元` : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="成立日期">
                {customer.establishedDate || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="法定代表人">
                {customer.legalRepresentative || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="客户等级">
                <Tag color={levelConfig[customer.customerLevel]?.color}>
                  {levelConfig[customer.customerLevel]?.text}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="客户来源">
                {customer.customerSource || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="经营范围" span={2}>
                {customer.businessScope || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="备注" span={2}>
                {customer.remarks || '-'}
              </Descriptions.Item>
            </Descriptions>
              )
            },
            {
              key: 'score',
              label: '客户评分',
              children: (
                <>
            {score ? (
              <div>
                <Row gutter={16} style={{ marginBottom: 24 }}>
                  <Col span={6}>
                    <Card>
                      <Statistic
                        title="总分"
                        value={score.totalScore}
                        suffix="/ 100"
                        valueStyle={{ color: '#1890ff', fontSize: 32 }}
                      />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card>
                      <Statistic
                        title="跟进频率"
                        value={score.followUpScore}
                        suffix="/ 100"
                      />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card>
                      <Statistic
                        title="交易金额"
                        value={score.dealAmountScore}
                        suffix="/ 100"
                      />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card>
                      <Statistic
                        title="互动质量"
                        value={score.interactionScore}
                        suffix="/ 100"
                      />
                    </Card>
                  </Col>
                </Row>
                <Descriptions bordered>
                  <Descriptions.Item label="计算等级">
                    <Tag color={levelConfig[score.calculatedLevel]?.color}>
                      {score.calculatedLevel}级
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="潜力评分">
                    {score.potentialScore} / 100
                  </Descriptions.Item>
                  <Descriptions.Item label="计算时间">
                    {dayjs(score.calculationDate).format('YYYY-MM-DD HH:mm')}
                  </Descriptions.Item>
                  {score.notes && (
                    <Descriptions.Item label="备注" span={3}>
                      {score.notes}
                    </Descriptions.Item>
                  )}
                </Descriptions>
                <div style={{ marginTop: 16, textAlign: 'center' }}>
                  <Button type="primary" onClick={handleCalculateScore}>
                    重新计算评分
                  </Button>
                </div>
              </div>
            ) : (
              <Empty
                description="暂无评分数据"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              >
                <Button type="primary" onClick={handleCalculateScore}>
                  立即计算评分
                </Button>
              </Empty>
            )}
                </>
              )
            },
            {
              key: 'opportunities',
              label: `商机列表 (${opportunities.length})`,
              children: (
                <>
            <div className="tab-header">
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setOpportunityModalVisible(true)}
              >
                新增商机
              </Button>
            </div>

            {opportunities.length > 0 ? (
              <Table
                dataSource={opportunities}
                rowKey="id"
                pagination={false}
                columns={[
                  {
                    title: '商机标题',
                    dataIndex: 'title',
                    key: 'title'
                  },
                  {
                    title: '销售阶段',
                    dataIndex: ['stage', 'name'],
                    key: 'stage',
                    render: (text, record) => (
                      <Tag color={record.stage?.color}>{text}</Tag>
                    )
                  },
                  {
                    title: '预期金额',
                    dataIndex: 'expectedAmount',
                    key: 'expectedAmount',
                    render: (amount) => `¥${amount?.toLocaleString() || 0}`
                  },
                  {
                    title: '成交概率',
                    dataIndex: 'probability',
                    key: 'probability',
                    render: (prob) => `${prob}%`
                  },
                  {
                    title: '预计成交日期',
                    dataIndex: 'expectedCloseDate',
                    key: 'expectedCloseDate',
                    render: (date) => date ? dayjs(date).format('YYYY-MM-DD') : '-'
                  },
                  {
                    title: '状态',
                    dataIndex: 'status',
                    key: 'status',
                    render: (status) => {
                      const statusMap = {
                        active: { text: '进行中', color: 'processing' },
                        won: { text: '已成交', color: 'success' },
                        lost: { text: '已流失', color: 'error' }
                      };
                      return (
                        <Tag color={statusMap[status]?.color}>
                          {statusMap[status]?.text}
                        </Tag>
                      );
                    }
                  },
                  {
                    title: '负责人',
                    dataIndex: ['assignedUser', 'username'],
                    key: 'assignedUser'
                  }
                ]}
              />
            ) : (
              <Empty description="暂无商机" />
            )}
                </>
              )
            },
            {
              key: 'followups',
              label: `跟进记录 (${customer.followUps?.length || 0})`,
              children: (
                <>
            <div className="tab-header">
              <Space>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setFollowUpModalVisible(true)}
                >
                  新增跟进
                </Button>
                <Button
                  icon={<CalendarOutlined />}
                  onClick={() => setActiveTab('calendar')}
                >
                  查看日历
                </Button>
              </Space>
            </div>

            {customer.followUps && customer.followUps.length > 0 ? (
              <Timeline mode="left" className="follow-up-timeline">
                {customer.followUps.map((followUp) => (
                  <Timeline.Item
                    key={followUp.id}
                    label={dayjs(followUp.followTime).format('YYYY-MM-DD HH:mm')}
                    color={followUp.result ? resultConfig[followUp.result]?.color : 'blue'}
                  >
                    <Card size="small" className="follow-up-card">
                      <div className="follow-up-header">
                        <Space>
                          {followTypeConfig[followUp.followType]?.icon}
                          <span className="follow-type">
                            {followTypeConfig[followUp.followType]?.text}
                          </span>
                          {followUp.result && (
                            <Tag color={resultConfig[followUp.result]?.color}>
                              {resultConfig[followUp.result]?.text}
                            </Tag>
                          )}
                        </Space>
                        <Space>
                          <Button
                            type="text"
                            size="small"
                            icon={<MessageOutlined />}
                            onClick={() => {
                              setSelectedFollowUp(followUp);
                              setCommentModalVisible(true);
                            }}
                          >
                            评论 ({followUp.comments?.length || 0})
                          </Button>
                          <Button
                            type="text"
                            danger
                            size="small"
                            icon={<DeleteOutlined />}
                            onClick={() => handleDeleteFollowUp(followUp.id)}
                          />
                        </Space>
                      </div>
                      
                      <div className="follow-up-content" dangerouslySetInnerHTML={{ __html: followUp.content }} />
                      
                      {followUp.nextFollowTime && (
                        <div className="follow-up-next">
                          <ClockCircleOutlined />
                          <span>下次跟进: {dayjs(followUp.nextFollowTime).format('YYYY-MM-DD HH:mm')}</span>
                        </div>
                      )}

                      {/* 显示附件 */}
                      {followUp.files && followUp.files.length > 0 && (
                        <div className="follow-up-files">
                          <Divider style={{ margin: '12px 0' }} />
                          <Space wrap>
                            {followUp.files.map(file => (
                              <Tag key={file.id} icon={<FileTextOutlined />}>
                                {file.fileName}
                              </Tag>
                            ))}
                          </Space>
                        </div>
                      )}

                      {/* 显示评论 */}
                      {followUp.comments && followUp.comments.length > 0 && (
                        <div className="follow-up-comments">
                          <Divider style={{ margin: '12px 0' }}>评论</Divider>
                          <List
                            dataSource={followUp.comments}
                            renderItem={comment => (
                              <List.Item
                                key={comment.id}
                                actions={[
                                  <Button
                                    type="link"
                                    danger
                                    size="small"
                                    onClick={() => handleDeleteComment(comment.id)}
                                  >
                                    删除
                                  </Button>
                                ]}
                              >
                                <List.Item.Meta
                                  avatar={<Avatar icon={<UserOutlined />} />}
                                  title={
                                    <Space>
                                      <span>{comment.user?.username}</span>
                                      <span style={{ fontSize: 12, color: '#999' }}>
                                        {dayjs(comment.createdAt).format('YYYY-MM-DD HH:mm')}
                                      </span>
                                    </Space>
                                  }
                                  description={comment.content}
                                />
                              </List.Item>
                            )}
                          />
                        </div>
                      )}

                      <div className="follow-up-footer">
                        <span>跟进人: {followUp.user?.username}</span>
                      </div>
                    </Card>
                  </Timeline.Item>
                ))}
              </Timeline>
            ) : (
              <Empty description="暂无跟进记录" />
            )}
                </>
              )
            },
            {
              key: 'files',
              label: `相关文件 (${customer.files?.length || 0})`,
              children: (
                <>
            <div className="tab-header">
              <Button type="primary" icon={<UploadOutlined />}>
                上传文件
              </Button>
            </div>

            {customer.files && customer.files.length > 0 ? (
              <Table
                dataSource={customer.files}
                rowKey="id"
                pagination={false}
                columns={[
                  {
                    title: '文件名',
                    dataIndex: 'fileName',
                    key: 'fileName',
                    render: (text) => (
                      <Space>
                        <FileTextOutlined />
                        {text}
                      </Space>
                    )
                  },
                  {
                    title: '分类',
                    dataIndex: 'category',
                    key: 'category',
                    render: (category) => (
                      <Tag>{fileCategoryConfig[category]}</Tag>
                    )
                  },
                  {
                    title: '大小',
                    dataIndex: 'fileSize',
                    key: 'fileSize',
                    render: (size) => size ? `${(size / 1024).toFixed(2)} KB` : '-'
                  },
                  {
                    title: '上传人',
                    dataIndex: ['uploader', 'username'],
                    key: 'uploader'
                  },
                  {
                    title: '上传时间',
                    dataIndex: 'createdAt',
                    key: 'createdAt',
                    render: (date) => dayjs(date).format('YYYY-MM-DD HH:mm')
                  },
                  {
                    title: '操作',
                    key: 'action',
                    render: (_, record) => (
                      <Space>
                        <Button type="link" icon={<DownloadOutlined />}>
                          下载
                        </Button>
                        <Button type="link" danger icon={<DeleteOutlined />}>
                          删除
                        </Button>
                      </Space>
                    )
                  }
                ]}
              />
            ) : (
              <Empty description="暂无相关文件" />
            )}
                </>
              )
            },
            {
              key: 'finance',
              label: '财务信息',
              children: (
            <Descriptions bordered column={2}>
              <Descriptions.Item label="注册资本">
                {customer.registeredCapital ? `${customer.registeredCapital}万元` : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="财税状态">
                <Tag color={statusConfig[customer.taxStatus]?.color}>
                  {statusConfig[customer.taxStatus]?.text}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="开票信息" span={2}>
                暂无数据
              </Descriptions.Item>
              <Descriptions.Item label="合同金额" span={2}>
                暂无数据
              </Descriptions.Item>
            </Descriptions>
              )
            },
            {
              key: 'discussions',
              label: `内部讨论 (${customer.discussions?.length || 0})`,
              children: (
                <>
            <div className="tab-header">
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setDiscussionModalVisible(true)}
              >
                发表讨论
              </Button>
            </div>

            {customer.discussions && customer.discussions.length > 0 ? (
              <div className="discussions-list">
                {customer.discussions.map((discussion) => (
                  <Card key={discussion.id} className="discussion-card" size="small">
                    <div className="discussion-header">
                      <Space>
                        <Avatar size="small" icon={<UserOutlined />} />
                        <span className="discussion-user">{discussion.user?.username}</span>
                        <span className="discussion-time">
                          {dayjs(discussion.createdAt).format('YYYY-MM-DD HH:mm')}
                        </span>
                      </Space>
                      <Button
                        type="text"
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={() => handleDeleteDiscussion(discussion.id)}
                      />
                    </div>
                    <div className="discussion-content">{discussion.content}</div>
                    {discussion.replies && discussion.replies.length > 0 && (
                      <div className="discussion-replies">
                        {discussion.replies.map((reply) => (
                          <div key={reply.id} className="reply-item">
                            <Space>
                              <Avatar size="small" icon={<UserOutlined />} />
                              <span className="reply-user">{reply.user?.username}</span>
                              <span className="reply-time">
                                {dayjs(reply.createdAt).format('YYYY-MM-DD HH:mm')}
                              </span>
                            </Space>
                            <div className="reply-content">{reply.content}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            ) : (
              <Empty description="暂无讨论" />
            )}
                </>
              )
            },
            {
              key: 'calendar',
              label: '跟进日历',
              children: (
            <FollowUpCalendar userId={null} />
              )
            },
            {
              key: 'communications',
              label: '通讯记录',
              children: (
                <>
            <div className="tab-header">
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setCommunicationPanelVisible(true)}
              >
                新增通讯记录
              </Button>
            </div>
            <CommunicationTimeline clientId={id} refreshKey={communicationRefreshKey} />
                </>
              )
            }
          ]}
        />
      </Card>

      {/* 新增跟进记录弹窗 - 使用新组件 */}
      <FollowUpForm
        visible={followUpModalVisible}
        onClose={() => setFollowUpModalVisible(false)}
        onSuccess={fetchCustomerDetail}
        clientId={id}
      />

      {/* 评论模态框 */}
      <Modal
        title="添加评论"
        open={commentModalVisible}
        onCancel={() => {
          setCommentModalVisible(false);
          setSelectedFollowUp(null);
          setCommentContent('');
        }}
        onOk={() => selectedFollowUp && handleAddComment(selectedFollowUp.id)}
        width={500}
      >
        <Input.TextArea
          rows={4}
          placeholder="请输入评论内容..."
          value={commentContent}
          onChange={(e) => setCommentContent(e.target.value)}
          maxLength={500}
          showCount
        />
      </Modal>

      {/* 发表讨论弹窗 */}
      <Modal
        title="发表讨论"
        open={discussionModalVisible}
        onCancel={() => {
          setDiscussionModalVisible(false);
          discussionForm.resetFields();
        }}
        onOk={() => discussionForm.submit()}
        width={600}
      >
        <Form form={discussionForm} layout="vertical" onFinish={handleCreateDiscussion}>
          <Form.Item
            name="content"
            label="讨论内容"
            rules={[{ required: true, message: '请输入讨论内容' }]}
          >
            <TextArea rows={6} placeholder="请输入讨论内容" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 添加标签模态框 */}
      <Modal
        title="添加标签"
        open={tagModalVisible}
        onCancel={() => {
          setTagModalVisible(false);
          setSelectedTags([]);
        }}
        onOk={handleAddTags}
        width={600}
      >
        <Select
          mode="multiple"
          style={{ width: '100%' }}
          placeholder="选择标签"
          value={selectedTags}
          onChange={setSelectedTags}
          optionFilterProp="children"
        >
          {allTags
            .filter(tag => !tags.find(t => t.id === tag.id))
            .map(tag => (
              <Option key={tag.id} value={tag.id}>
                <Tag color={tag.color}>{tag.name}</Tag>
              </Option>
            ))}
        </Select>
      </Modal>

      {/* 创建商机模态框 */}
      <Modal
        title="新增商机"
        open={opportunityModalVisible}
        onCancel={() => {
          setOpportunityModalVisible(false);
          opportunityForm.resetFields();
        }}
        onOk={() => opportunityForm.submit()}
        width={600}
      >
        <Form
          form={opportunityForm}
          layout="vertical"
          onFinish={handleCreateOpportunity}
        >
          <Form.Item
            label="商机标题"
            name="title"
            rules={[{ required: true, message: '请输入商机标题' }]}
          >
            <Input placeholder="请输入商机标题" />
          </Form.Item>

          <Form.Item
            label="销售阶段"
            name="stageId"
            rules={[{ required: true, message: '请选择销售阶段' }]}
          >
            <Select placeholder="选择销售阶段">
              <Option value={1}>线索</Option>
              <Option value={2}>意向</Option>
              <Option value={3}>报价</Option>
              <Option value={4}>谈判</Option>
              <Option value={5}>成交</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="商机描述"
            name="description"
          >
            <TextArea rows={4} placeholder="请输入商机描述" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="预期金额（元）"
                name="expectedAmount"
                rules={[{ required: true, message: '请输入预期金额' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  placeholder="请输入预期金额"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="成交概率（%）"
                name="probability"
                initialValue={50}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  max={100}
                  placeholder="请输入成交概率"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="预计成交日期"
            name="expectedCloseDate"
          >
            <DatePicker
              style={{ width: '100%' }}
              placeholder="选择预计成交日期"
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 编辑客户模态框 */}
      <Modal
        title="编辑客户信息"
        open={editModalVisible}
        onCancel={() => {
          setEditModalVisible(false);
          editForm.resetFields();
        }}
        onOk={() => editForm.submit()}
        width={800}
        okText="保存"
        cancelText="取消"
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleUpdateClient}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="公司名称"
                name="companyName"
                rules={[{ required: true, message: '请输入公司名称' }]}
              >
                <Input placeholder="请输入公司名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="联系人"
                name="contactPerson"
                rules={[
                  { required: true, message: '请输入联系人姓名' },
                  { min: 2, message: '联系人姓名至少2个字符' },
                  { max: 50, message: '联系人姓名不能超过50个字符' }
                ]}
              >
                <Input placeholder="请输入联系人姓名" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="联系电话"
                name="phone"
                rules={[
                  { required: true, message: '请输入联系电话' },
                  { pattern: /^[0-9-+()\s]{7,20}$/, message: '请输入正确的电话号码格式' }
                ]}
              >
                <Input placeholder="请输入联系电话" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="邮箱"
                name="email"
                rules={[
                  { required: true, message: '请输入邮箱地址' },
                  { type: 'email', message: '请输入正确的邮箱格式' }
                ]}
              >
                <Input placeholder="请输入邮箱地址" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="微信"
                name="wechat"
              >
                <Input placeholder="请输入微信号" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="公司网址"
                name="website"
                rules={[
                  { required: true, message: '请输入公司网址' },
                  { 
                    pattern: /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/, 
                    message: '请输入正确的网址格式（如：www.example.com 或 http://example.com）' 
                  }
                ]}
              >
                <Input placeholder="请输入公司网址（如：www.example.com）" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="公司地址"
            name="address"
          >
            <Input placeholder="请输入公司地址" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="所属行业"
                name="industry"
              >
                <Input placeholder="请输入所属行业" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="公司规模"
                name="companyScale"
              >
                <Select placeholder="请选择公司规模">
                  <Option value="micro">微型(1-9人)</Option>
                  <Option value="small">小型(10-49人)</Option>
                  <Option value="medium">中型(50-299人)</Option>
                  <Option value="large">大型(300人以上)</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="员工人数"
                name="employeeCount"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  placeholder="请输入员工人数"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="注册资本（万元）"
                name="registeredCapital"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  placeholder="请输入注册资本"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="成立日期"
                name="establishedDate"
              >
                <Input placeholder="请输入成立日期" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="法定代表人"
                name="legalRepresentative"
              >
                <Input placeholder="请输入法定代表人" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="客户等级"
                name="customerLevel"
              >
                <Select placeholder="请选择客户等级">
                  <Option value="A">A级-重点客户</Option>
                  <Option value="B">B级-优质客户</Option>
                  <Option value="C">C级-普通客户</Option>
                  <Option value="D">D级-潜在客户</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="客户来源"
                name="customerSource"
              >
                <Input placeholder="请输入客户来源" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="财税状态"
            name="taxStatus"
          >
            <Select placeholder="请选择财税状态">
              <Option value="pending">待处理</Option>
              <Option value="processing">处理中</Option>
              <Option value="completed">已完成</Option>
              <Option value="cancelled">已取消</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="经营范围"
            name="businessScope"
          >
            <TextArea rows={3} placeholder="请输入经营范围" />
          </Form.Item>

          <Form.Item
            label="备注"
            name="remarks"
          >
            <TextArea rows={3} placeholder="请输入备注信息" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 通讯面板 */}
      <CommunicationPanel
        visible={communicationPanelVisible}
        onClose={() => {
          setCommunicationPanelVisible(false);
          fetchCustomerDetail(); // 刷新客户数据
        }}
        onSuccess={() => {
          // 触发通讯记录时间线立即刷新
          setCommunicationRefreshKey((k) => k + 1);
        }}
        clientId={id}
        clientInfo={{
          companyName: customer?.companyName,
          contactPerson: customer?.contactPerson,
          phone: customer?.phone,
          email: customer?.email
        }}
      />

      {/* 实时聊天 */}
      <LiveChat
        visible={liveChatVisible}
        onClose={() => setLiveChatVisible(false)}
        clientId={id}
        clientInfo={{
          companyName: customer?.companyName,
          contactPerson: customer?.contactPerson,
          phone: customer?.phone,
          email: customer?.email
        }}
      />
    </div>
  );
};

export default CustomerDetail;

