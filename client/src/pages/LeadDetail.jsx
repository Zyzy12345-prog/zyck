import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card, Descriptions, Tag, Button, Space, Timeline, Modal, Form, Input,
  Select, DatePicker, message, Row, Col, Statistic, Popconfirm, Badge,
  Tooltip, Typography, Divider, Spin, Empty, Progress
} from 'antd';
import {
  ArrowLeftOutlined, EditOutlined, DeleteOutlined, PlusOutlined,
  PhoneOutlined, MailOutlined, UserOutlined, WechatOutlined,
  ClockCircleOutlined, CheckCircleOutlined, TrophyOutlined,
  TagsOutlined, StarOutlined, StarFilled, FileTextOutlined,
  RocketOutlined, ExclamationCircleOutlined, ArrowUpOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { customerLeadAPI, leadTagAPI } from '../services/api';
import './LeadDetail.css';

const { TextArea } = Input;
const { Title, Text } = Typography;

const LeadDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scoreDetail, setScoreDetail] = useState(null);
  const [followUps, setFollowUps] = useState([]);
  const [followUpLoading, setFollowUpLoading] = useState(false);
  const [statistics, setStatistics] = useState(null);
  const [leadTags, setLeadTags] = useState([]);
  const [allTags, setAllTags] = useState([]);
  const [editVisible, setEditVisible] = useState(false);
  const [followUpVisible, setFollowUpVisible] = useState(false);
  const [editingFollowUp, setEditingFollowUp] = useState(null);
  const [tagAssignVisible, setTagAssignVisible] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [editForm] = Form.useForm();
  const [followUpForm] = Form.useForm();

  const fetchLead = useCallback(async () => {
    try {
      setLoading(true);
      const response = await customerLeadAPI.getLead(id);
      if (response.success) {
        setLead(response.data);
        setLeadTags(response.data.tags || []);
        if (response.data.scoreDetail) {
          setScoreDetail(response.data.scoreDetail);
        }
      }
    } catch (error) {
      message.error('获取线索详情失败');
      navigate('/leads');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  const fetchFollowUps = useCallback(async () => {
    try {
      setFollowUpLoading(true);
      const response = await customerLeadAPI.getFollowUps(id, { limit: 50 });
      if (response.success) {
        setFollowUps(response.data);
      }
    } catch (error) {
      console.error('获取跟进记录失败:', error);
    } finally {
      setFollowUpLoading(false);
    }
  }, [id]);

  const fetchStatistics = useCallback(async () => {
    try {
      const response = await customerLeadAPI.getFollowUpStatistics(id);
      if (response.success) {
        setStatistics(response.data);
      }
    } catch (error) {
      console.error('获取统计数据失败:', error);
    }
  }, [id]);

  const fetchAllTags = useCallback(async () => {
    try {
      const response = await leadTagAPI.getTags({});
      if (response.success) {
        setAllTags(response.data);
      }
    } catch (error) {
      console.error('获取标签失败:', error);
    }
  }, []);

  useEffect(() => {
    fetchLead();
    fetchFollowUps();
    fetchStatistics();
    fetchAllTags();
  }, [fetchLead, fetchFollowUps, fetchStatistics, fetchAllTags]);

  // === 编辑线索 ===
  const handleEditLead = () => {
    editForm.setFieldsValue({
      ...lead,
      tags: undefined
    });
    setEditVisible(true);
  };

  const handleSaveLead = async () => {
    try {
      const values = await editForm.validateFields();
      await customerLeadAPI.updateLead(id, values);
      message.success('线索信息已更新');
      setEditVisible(false);
      fetchLead();
    } catch (error) {
      if (!error.errorFields) {
        message.error('更新失败');
      }
    }
  };

  // === 跟进记录 ===
  const handleAddFollowUp = () => {
    setEditingFollowUp(null);
    followUpForm.resetFields();
    followUpForm.setFieldsValue({
      followUpDate: dayjs(),
      followUpType: 'phone'
    });
    setFollowUpVisible(true);
  };

  const handleEditFollowUp = (record) => {
    setEditingFollowUp(record);
    followUpForm.setFieldsValue({
      ...record,
      followUpDate: dayjs(record.followUpDate),
      nextFollowUpDate: record.nextFollowUpDate ? dayjs(record.nextFollowUpDate) : null
    });
    setFollowUpVisible(true);
  };

  const handleDeleteFollowUp = async (followUpId) => {
    try {
      const response = await customerLeadAPI.deleteFollowUp(followUpId);
      if (response.success) {
        message.success('跟进记录已删除');
        fetchFollowUps();
        fetchStatistics();
      } else {
        message.error(response.message || '删除失败');
      }
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleSubmitFollowUp = async () => {
    try {
      const values = await followUpForm.validateFields();
      const data = {
        ...values,
        followUpDate: values.followUpDate.toISOString(),
        nextFollowUpDate: values.nextFollowUpDate ? values.nextFollowUpDate.toISOString() : null
      };

      if (editingFollowUp) {
        await customerLeadAPI.updateFollowUp(editingFollowUp.id, data);
        message.success('跟进记录已更新');
      } else {
        await customerLeadAPI.createFollowUp(id, data);
        message.success('跟进记录已创建');
      }
      setFollowUpVisible(false);
      followUpForm.resetFields();
      fetchFollowUps();
      fetchStatistics();
      fetchLead();
    } catch (error) {
      if (!error.errorFields) {
        message.error('操作失败');
      }
    }
  };

  // === 标签管理 ===
  const handleAddTag = async (tagId) => {
    try {
      await leadTagAPI.addTagToLead(id, tagId);
      message.success('标签已添加');
      fetchLead();
    } catch (error) {
      message.error('添加标签失败');
    }
  };

  const handleRemoveTag = async (tagId) => {
    try {
      await leadTagAPI.removeTagFromLead(id, tagId);
      message.success('标签已移除');
      fetchLead();
    } catch (error) {
      message.error('移除标签失败');
    }
  };

  // === 重算评分 ===
  const handleRecalculate = async () => {
    try {
      setRecalculating(true);
      const response = await customerLeadAPI.recalculateScore(id);
      if (response.success) {
        setScoreDetail(response.data);
        fetchLead();
        message.success(`评分已更新: ${response.data.totalScore}分 (${response.data.level}级)`);
      }
    } catch (error) {
      message.error('重算评分失败');
    } finally {
      setRecalculating(false);
    }
  };

  // === 转化 ===
  const handleConvert = () => {
    Modal.confirm({
      title: '确认转化',
      content: '确定要将此线索转化为正式客户吗？',
      icon: <ExclamationCircleOutlined />,
      onOk: async () => {
        try {
          await customerLeadAPI.convertLead(id);
          message.success('线索转化成功！');
          fetchLead();
          fetchStatistics();
        } catch (error) {
          message.error('转化失败');
        }
      }
    });
  };

  // === 渲染辅助 ===
  const followUpTypeIcons = {
    phone: <PhoneOutlined />,
    email: <MailOutlined />,
    visit: <UserOutlined />,
    wechat: <WechatOutlined />,
    other: <ClockCircleOutlined />
  };
  const followUpTypeLabels = {
    phone: '电话', email: '邮件', visit: '拜访', wechat: '微信', other: '其他'
  };
  const resultColors = { positive: 'success', neutral: 'default', negative: 'error', no_response: 'warning' };
  const resultLabels = { positive: '积极', neutral: '中性', negative: '消极', no_response: '未响应' };
  const statusLabels = {
    new: '新线索', contacted: '已联系', qualified: '已验证',
    negotiating: '洽谈中', converted: '已转化', lost: '已丢失'
  };
  const statusColors = {
    new: 'blue', contacted: 'cyan', qualified: 'green',
    negotiating: 'orange', converted: 'success', lost: 'default'
  };
  const priorityLabels = { low: '低', medium: '中', high: '高', urgent: '紧急' };
  const priorityColors = { low: 'default', medium: 'blue', high: 'orange', urgent: 'red' };

  if (loading) {
    return (
      <div className="lead-detail-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="lead-detail-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <Empty description="线索不存在" />
      </div>
    );
  }

  return (
    <div className="lead-detail-page">
      {/* 返回按钮 + 标题 */}
      <div className="page-header">
        <Space align="center" size={16}>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/leads')}>
            返回列表
          </Button>
          <Title level={3} style={{ margin: 0 }}>
            {lead.companyName}
          </Title>
          <Tag color={statusColors[lead.status]}>{statusLabels[lead.status]}</Tag>
          <Tag color={priorityColors[lead.priority]}>{priorityLabels[lead.priority]}优先级</Tag>
          <Tag color={lead.score >= 80 ? 'green' : lead.score >= 60 ? 'orange' : 'default'}>
            {lead.score || 0}分
          </Tag>
        </Space>
        <Space>
          <Button icon={<EditOutlined />} onClick={handleEditLead}>编辑线索</Button>
          {lead.status !== 'converted' && lead.status !== 'lost' && (
            <Button type="primary" icon={<ArrowUpOutlined />} onClick={handleConvert}>
              转化为客户
            </Button>
          )}
        </Space>
      </div>

      <Row gutter={24}>
        {/* 左侧：基本信息 + 标签 */}
        <Col xs={24} lg={10}>
          <Card title="基本信息" className="info-card" style={{ marginBottom: 24 }}>
            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="公司名称">{lead.companyName}</Descriptions.Item>
              <Descriptions.Item label="联系人">{lead.contactPerson || '-'}</Descriptions.Item>
              <Descriptions.Item label="电话">{lead.phone || '-'}</Descriptions.Item>
              <Descriptions.Item label="邮箱">{lead.email || '-'}</Descriptions.Item>
              <Descriptions.Item label="微信">{lead.wechat || '-'}</Descriptions.Item>
              <Descriptions.Item label="来源">
                <Tag>{lead.source === 'website' ? '官网' : lead.source === 'referral' ? '推荐' :
                  lead.source === 'cold_call' ? '陌拜' : lead.source === 'exhibition' ? '展会' :
                  lead.source === 'social_media' ? '社交媒体' : lead.source === 'partner' ? '合作伙伴' :
                  lead.source || '-'}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="预估价值">
                {lead.estimatedValue ? `¥${Number(lead.estimatedValue).toLocaleString()}` : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="负责人">
                {lead.assignedUser?.username || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {dayjs(lead.createdAt).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label="最后联系">
                {lead.lastContactTime ? dayjs(lead.lastContactTime).format('YYYY-MM-DD HH:mm') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="下次跟进">
                {lead.nextFollowTime ? dayjs(lead.nextFollowTime).format('YYYY-MM-DD') : '-'}
              </Descriptions.Item>
              {lead.notes && (
                <Descriptions.Item label="备注" span={2}>{lead.notes}</Descriptions.Item>
              )}
              {lead.status === 'lost' && lead.lostReason && (
                <Descriptions.Item label="丢失原因" span={2}>
                  <Text type="danger">{lead.lostReason}</Text>
                </Descriptions.Item>
              )}
              {lead.status === 'converted' && lead.convertedAt && (
                <Descriptions.Item label="转化时间" span={2}>
                  <Tag color="success">{dayjs(lead.convertedAt).format('YYYY-MM-DD HH:mm')}</Tag>
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>

          {/* 评分详情 */}
          {scoreDetail && (
            <Card
              title={
                <Space>
                  <TrophyOutlined />
                  <span>智能评分</span>
                  <Tag color={
                    scoreDetail.level === 'S' ? 'red' : scoreDetail.level === 'A' ? 'orange' :
                    scoreDetail.level === 'B' ? 'blue' : scoreDetail.level === 'C' ? 'default' : 'default'
                  }>
                    {scoreDetail.level}级
                  </Tag>
                </Space>
              }
              className="info-card"
              extra={
                <Button size="small" loading={recalculating} onClick={handleRecalculate}>
                  重新计算
                </Button>
              }
            >
              <div className="score-main">
                <Progress
                  type="circle"
                  percent={scoreDetail.totalScore}
                  size={100}
                  strokeColor={{
                    '0%': scoreDetail.totalScore >= 70 ? '#52c41a' : scoreDetail.totalScore >= 40 ? '#faad14' : '#f5222d',
                    '100%': scoreDetail.totalScore >= 70 ? '#1890ff' : scoreDetail.totalScore >= 40 ? '#fa8c16' : '#ff4d4f'
                  }}
                  format={(pct) => (
                    <div>
                      <div style={{ fontSize: 24, fontWeight: 700 }}>{pct}</div>
                      <div style={{ fontSize: 12, color: '#999' }}>总分</div>
                    </div>
                  )}
                />
              </div>
              <Divider style={{ margin: '12px 0' }} />
              <div className="score-breakdown">
                {scoreDetail.breakdown.map((factor, idx) => (
                  <div key={idx} className="score-factor">
                    <div className="factor-header">
                      <Text className="factor-label">{factor.label}</Text>
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        权重 {(factor.weight * 100).toFixed(0)}%
                      </Text>
                      <Text strong style={{ fontSize: 13, color: factor.percentage >= 70 ? '#52c41a' : factor.percentage >= 40 ? '#faad14' : '#f5222d' }}>
                        {factor.weightedScore}分
                      </Text>
                    </div>
                    <Progress
                      percent={factor.percentage}
                      size="small"
                      strokeColor={factor.percentage >= 70 ? '#52c41a' : factor.percentage >= 40 ? '#faad14' : '#ff4d4f'}
                      format={() => `${factor.percentage}%`}
                    />
                    <Text type="secondary" style={{ fontSize: 11 }}>{factor.displayValue}</Text>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* 标签管理 */}
          <Card
            title={<Space><TagsOutlined /><span>线索标签</span></Space>}
            className="info-card"
            extra={
              <Button size="small" onClick={() => setTagAssignVisible(true)}>
                管理标签
              </Button>
            }
          >
            <div style={{ minHeight: 40, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {leadTags.length === 0 ? (
                <Text type="secondary">暂无标签，点击"管理标签"添加</Text>
              ) : (
                leadTags.map(tag => (
                  <Tag
                    key={tag.id}
                    color={tag.color}
                    closable
                    onClose={() => handleRemoveTag(tag.id)}
                  >
                    {tag.name}
                  </Tag>
                ))
              )}
            </div>
          </Card>
        </Col>

        {/* 右侧：跟进记录时间线 */}
        <Col xs={24} lg={14}>
          {/* 跟进统计 */}
          {statistics && (
            <Row gutter={16} style={{ marginBottom: 24 }}>
              <Col span={6}>
                <Card size="small" className="stat-mini-card">
                  <Statistic title="总跟进" value={statistics.totalFollowUps || 0}
                    prefix={<FileTextOutlined />} valueStyle={{ fontSize: 22 }} />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small" className="stat-mini-card">
                  <Statistic title="积极反馈" value={statistics.byResult?.positive || 0}
                    valueStyle={{ color: '#52c41a', fontSize: 22 }} />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small" className="stat-mini-card">
                  <Statistic title="最近跟进"
                    value={statistics.lastFollowUp ?
                      dayjs(statistics.lastFollowUp.followUpDate).format('MM-DD') : '-'}
                    valueStyle={{ fontSize: 22 }} />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small" className="stat-mini-card">
                  <Statistic title="下次跟进"
                    value={statistics.nextFollowUp ?
                      dayjs(statistics.nextFollowUp.nextFollowUpDate).format('MM-DD') : '-'}
                    valueStyle={{ fontSize: 22, color: '#1890ff' }} />
                </Card>
              </Col>
            </Row>
          )}

          {/* 跟进记录标题 + 新增按钮 */}
          <Card
            title={<Space><ClockCircleOutlined /><span>跟进记录</span></Space>}
            className="follow-up-card"
            extra={
              <Button type="primary" size="small" icon={<PlusOutlined />} onClick={handleAddFollowUp}>
                新增跟进
              </Button>
            }
          >
            {followUps.length === 0 ? (
              <Empty description="暂无跟进记录" style={{ padding: '40px 0' }}>
                <Button type="primary" icon={<PlusOutlined />} onClick={handleAddFollowUp}>
                  添加第一条跟进记录
                </Button>
              </Empty>
            ) : (
              <Timeline
                mode="left"
                className="follow-up-timeline"
                items={followUps.map(fu => ({
                  dot: (
                    <div className="timeline-dot" style={{ background: fu.isImportant ? '#faad14' : '#1890ff' }}>
                      {followUpTypeIcons[fu.followUpType]}
                    </div>
                  ),
                  children: (
                    <div className="timeline-item">
                      <div className="timeline-header">
                        <Space size={8} wrap>
                          <Tag icon={followUpTypeIcons[fu.followUpType]}>
                            {followUpTypeLabels[fu.followUpType]}
                          </Tag>
                          {fu.result && (
                            <Tag color={resultColors[fu.result]}>
                              {resultLabels[fu.result]}
                            </Tag>
                          )}
                          {fu.isImportant && (
                            <StarFilled style={{ color: '#faad14' }} />
                          )}
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {dayjs(fu.followUpDate).format('YYYY-MM-DD HH:mm')}
                          </Text>
                          {fu.duration && (
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              时长: {fu.duration}分钟
                            </Text>
                          )}
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            跟进人: {fu.creator?.username || '-'}
                          </Text>
                        </Space>
                        <Space size={4}>
                          <Button type="link" size="small"
                            onClick={() => handleEditFollowUp(fu)}>
                            编辑
                          </Button>
                          <Popconfirm
                            title="确定删除此跟进记录？"
                            onConfirm={() => handleDeleteFollowUp(fu.id)}
                            okText="确定" cancelText="取消"
                          >
                            <Button type="link" size="small" danger>删除</Button>
                          </Popconfirm>
                        </Space>
                      </div>
                      <div className="timeline-content">
                        <div className="content-text">{fu.content}</div>
                        {fu.nextFollowUpPlan && (
                          <div className="next-plan">
                            <Text strong>📋 下次计划：</Text>
                            <Text>{fu.nextFollowUpPlan}</Text>
                          </div>
                        )}
                        {fu.nextFollowUpDate && (
                          <div className="next-date">
                            <ClockCircleOutlined /> 下次跟进: {dayjs(fu.nextFollowUpDate).format('YYYY-MM-DD')}
                          </div>
                        )}
                        {fu.tags && fu.tags.length > 0 && (
                          <div className="follow-up-tags">
                            {fu.tags.map((t, i) => <Tag key={i}>{t}</Tag>)}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                }))}
              />
            )}
          </Card>
        </Col>
      </Row>

      {/* 编辑线索弹窗 */}
      <Modal
        title="编辑线索信息"
        open={editVisible}
        onOk={handleSaveLead}
        onCancel={() => setEditVisible(false)}
        width={700}
        destroyOnHidden
      >
        <Form form={editForm} layout="vertical">
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
            <Col span={8}>
              <Form.Item name="phone" label="电话"><Input /></Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="email" label="邮箱"><Input /></Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="wechat" label="微信"><Input /></Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="status" label="状态">
                <Select>
                  <Select.Option value="new">新线索</Select.Option>
                  <Select.Option value="contacted">已联系</Select.Option>
                  <Select.Option value="qualified">已验证</Select.Option>
                  <Select.Option value="negotiating">洽谈中</Select.Option>
                  <Select.Option value="lost">已丢失</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="priority" label="优先级">
                <Select>
                  <Select.Option value="low">低</Select.Option>
                  <Select.Option value="medium">中</Select.Option>
                  <Select.Option value="high">高</Select.Option>
                  <Select.Option value="urgent">紧急</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="score" label="评分 (0-100)">
                <Input type="number" min={0} max={100} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="source" label="来源">
                <Select>
                  <Select.Option value="website">官网</Select.Option>
                  <Select.Option value="referral">推荐</Select.Option>
                  <Select.Option value="cold_call">陌拜</Select.Option>
                  <Select.Option value="exhibition">展会</Select.Option>
                  <Select.Option value="social_media">社交媒体</Select.Option>
                  <Select.Option value="partner">合作伙伴</Select.Option>
                  <Select.Option value="other">其他</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="estimatedValue" label="预估价值">
                <Input type="number" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="nextFollowTime" label="下次跟进时间">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="notes" label="备注">
            <TextArea rows={3} />
          </Form.Item>
          {lead?.status === 'lost' && (
            <Form.Item name="lostReason" label="丢失原因">
              <TextArea rows={2} />
            </Form.Item>
          )}
        </Form>
      </Modal>

      {/* 新增/编辑跟进弹窗 */}
      <Modal
        title={editingFollowUp ? '编辑跟进记录' : '新增跟进记录'}
        open={followUpVisible}
        onOk={handleSubmitFollowUp}
        onCancel={() => { setFollowUpVisible(false); followUpForm.resetFields(); }}
        width={600}
        destroyOnHidden
      >
        <Form form={followUpForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="followUpType" label="跟进方式" rules={[{ required: true }]}>
                <Select>
                  <Select.Option value="phone">📞 电话</Select.Option>
                  <Select.Option value="email">✉️ 邮件</Select.Option>
                  <Select.Option value="visit">👤 拜访</Select.Option>
                  <Select.Option value="wechat">💬 微信</Select.Option>
                  <Select.Option value="other">📌 其他</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="followUpDate" label="跟进时间" rules={[{ required: true }]}>
                <DatePicker showTime style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="content" label="跟进内容" rules={[{ required: true, message: '请输入跟进内容' }]}>
            <TextArea rows={4} placeholder="请详细描述本次跟进的内容..." />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="result" label="跟进结果">
                <Select placeholder="选择结果" allowClear>
                  <Select.Option value="positive">✅ 积极</Select.Option>
                  <Select.Option value="neutral">➖ 中性</Select.Option>
                  <Select.Option value="negative">❌ 消极</Select.Option>
                  <Select.Option value="no_response">⏳ 未响应</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="duration" label="跟进时长（分钟）">
                <Input type="number" placeholder="30" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="nextFollowUpDate" label="下次跟进时间">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="isImportant" label="标记为重要" valuePropName="checked">
                <Select>
                  <Select.Option value={true}>⭐ 重要</Select.Option>
                  <Select.Option value={false}>普通</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="nextFollowUpPlan" label="下次跟进计划">
            <TextArea rows={2} placeholder="计划下次跟进的内容..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* 标签管理弹窗 */}
      <Modal
        title={<Space><TagsOutlined /><span>管理线索标签</span></Space>}
        open={tagAssignVisible}
        onCancel={() => setTagAssignVisible(false)}
        footer={null}
        width={500}
        destroyOnHidden
      >
        <div style={{ marginBottom: 16 }}>
          <Text strong>当前标签：</Text>
          <div style={{ minHeight: 32, padding: 8, background: '#fafafa', borderRadius: 6, marginTop: 8,
            display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {leadTags.length === 0 ? (
              <Text type="secondary">暂无标签</Text>
            ) : (
              leadTags.map(tag => (
                <Tag key={tag.id} color={tag.color} closable onClose={() => handleRemoveTag(tag.id)}>
                  {tag.name}
                </Tag>
              ))
            )}
          </div>
        </div>
        <Divider />
        <div>
          <Text strong>可用标签（点击添加）：</Text>
          <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6,
            maxHeight: 200, overflowY: 'auto', padding: 8, background: '#fafafa', borderRadius: 6 }}>
            {allTags.filter(t => !leadTags.some(lt => lt.id === t.id)).map(tag => (
              <Tooltip key={tag.id} title={tag.description || tag.category}>
                <Tag color={tag.color} style={{ cursor: 'pointer', opacity: 0.85 }}
                  onClick={() => handleAddTag(tag.id)}
                  onMouseEnter={e => e.target.style.opacity = '1'}
                  onMouseLeave={e => e.target.style.opacity = '0.85'}>
                  + {tag.name}
                </Tag>
              </Tooltip>
            ))}
            {allTags.filter(t => !leadTags.some(lt => lt.id === t.id)).length === 0 && (
              <Text type="secondary">所有标签已添加</Text>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default LeadDetail;
