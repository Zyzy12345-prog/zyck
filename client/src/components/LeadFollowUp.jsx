import React, { useState, useEffect } from 'react';
import { 
  Modal, Form, Input, Select, DatePicker, Button, Table, Tag, Space, 
  message, Popconfirm, Timeline, Card, Row, Col, Statistic 
} from 'antd';
import { 
  PlusOutlined, EditOutlined, DeleteOutlined, PhoneOutlined, 
  MailOutlined, UserOutlined, WechatOutlined, ClockCircleOutlined 
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { customerLeadAPI } from '../services/api';
import './LeadFollowUp.css';

const { TextArea } = Input;
const { Option } = Select;

const LeadFollowUp = ({ leadId, visible, onClose }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [followUps, setFollowUps] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingFollowUp, setEditingFollowUp] = useState(null);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  useEffect(() => {
    if (visible && leadId) {
      fetchFollowUps();
      fetchStatistics();
    }
  }, [visible, leadId, pagination.current]);

  const fetchFollowUps = async () => {
    try {
      setLoading(true);
      const response = await customerLeadAPI.getFollowUps(leadId, {
        page: pagination.current,
        limit: pagination.pageSize
      });
      
      if (response.success) {
        setFollowUps(response.data);
        setPagination(prev => ({
          ...prev,
          total: response.pagination.total
        }));
      }
    } catch (error) {
      message.error('获取跟进记录失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await customerLeadAPI.getFollowUpStatistics(leadId);
      if (response.success) {
        setStatistics(response.data);
      }
    } catch (error) {
      console.error('获取统计数据失败:', error);
    }
  };

  const handleAdd = () => {
    setEditingFollowUp(null);
    form.resetFields();
    form.setFieldsValue({
      followUpDate: dayjs(),
      followUpType: 'phone',
      isImportant: false
    });
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingFollowUp(record);
    form.setFieldsValue({
      ...record,
      followUpDate: dayjs(record.followUpDate),
      nextFollowUpDate: record.nextFollowUpDate ? dayjs(record.nextFollowUpDate) : null,
      isImportant: record.isImportant || false
    });
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      const response = await customerLeadAPI.deleteFollowUp(id);
      if (response.success) {
        message.success('删除成功');
        fetchFollowUps();
        fetchStatistics();
      }
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const data = {
        ...values,
        followUpDate: values.followUpDate.toISOString(),
        nextFollowUpDate: values.nextFollowUpDate ? values.nextFollowUpDate.toISOString() : null
      };

      let response;
      if (editingFollowUp) {
        response = await customerLeadAPI.updateFollowUp(editingFollowUp.id, data);
      } else {
        response = await customerLeadAPI.createFollowUp(leadId, data);
      }

      if (response.success) {
        message.success(editingFollowUp ? '更新成功' : '创建成功');
        setModalVisible(false);
        form.resetFields();
        fetchFollowUps();
        fetchStatistics();
      }
    } catch (error) {
      if (error.errorFields) {
        message.error('请填写必填项');
      } else {
        message.error('操作失败');
      }
    }
  };

  const getFollowUpTypeIcon = (type) => {
    const icons = {
      phone: <PhoneOutlined />,
      email: <MailOutlined />,
      visit: <UserOutlined />,
      wechat: <WechatOutlined />,
      other: <ClockCircleOutlined />
    };
    return icons[type] || <ClockCircleOutlined />;
  };

  const getFollowUpTypeText = (type) => {
    const texts = {
      phone: '电话',
      email: '邮件',
      visit: '拜访',
      wechat: '微信',
      other: '其他'
    };
    return texts[type] || type;
  };

  const getResultColor = (result) => {
    const colors = {
      positive: 'success',
      neutral: 'default',
      negative: 'error',
      no_response: 'warning'
    };
    return colors[result] || 'default';
  };

  const getResultText = (result) => {
    const texts = {
      positive: '积极',
      neutral: '中性',
      negative: '消极',
      no_response: '未响应'
    };
    return texts[result] || result;
  };

  const columns = [
    {
      title: '跟进时间',
      dataIndex: 'followUpDate',
      key: 'followUpDate',
      width: 180,
      render: (date) => dayjs(date).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '跟进方式',
      dataIndex: 'followUpType',
      key: 'followUpType',
      width: 100,
      render: (type) => (
        <Space>
          {getFollowUpTypeIcon(type)}
          {getFollowUpTypeText(type)}
        </Space>
      )
    },
    {
      title: '跟进内容',
      dataIndex: 'content',
      key: 'content',
      ellipsis: true
    },
    {
      title: '跟进结果',
      dataIndex: 'result',
      key: 'result',
      width: 100,
      render: (result) => result ? (
        <Tag color={getResultColor(result)}>{getResultText(result)}</Tag>
      ) : '-'
    },
    {
      title: '下次跟进',
      dataIndex: 'nextFollowUpDate',
      key: 'nextFollowUpDate',
      width: 120,
      render: (date) => date ? dayjs(date).format('YYYY-MM-DD') : '-'
    },
    {
      title: '跟进人',
      dataIndex: 'creator',
      key: 'creator',
      width: 100,
      render: (creator) => creator?.username || '-'
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除此跟进记录？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <Modal
      title="跟进记录"
      open={visible}
      onCancel={onClose}
      width={1200}
      footer={null}
      destroyOnHidden
    >
      <div className="lead-follow-up-container">
        {/* 统计信息 */}
        {statistics && (
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={6}>
              <Card>
                <Statistic
                  title="总跟进次数"
                  value={statistics.totalFollowUps}
                  prefix={<ClockCircleOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="最近跟进"
                  value={statistics.lastFollowUp ? 
                    dayjs(statistics.lastFollowUp.followUpDate).format('MM-DD') : '-'}
                  valueStyle={{ fontSize: 20 }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="下次跟进"
                  value={statistics.nextFollowUp ? 
                    dayjs(statistics.nextFollowUp.nextFollowUpDate).format('MM-DD') : '-'}
                  valueStyle={{ fontSize: 20 }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="积极反馈"
                  value={statistics.byResult?.positive || 0}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
          </Row>
        )}

        {/* 操作按钮 */}
        <div style={{ marginBottom: 16 }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            新增跟进记录
          </Button>
        </div>

        {/* 跟进记录表格 */}
        <Table
          columns={columns}
          dataSource={followUps}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            onChange: (page) => setPagination(prev => ({ ...prev, current: page }))
          }}
          scroll={{ x: 1000 }}
        />

        {/* 新增/编辑模态框 */}
        <Modal
          title={editingFollowUp ? '编辑跟进记录' : '新增跟进记录'}
          open={modalVisible}
          onOk={handleSubmit}
          onCancel={() => {
            setModalVisible(false);
            form.resetFields();
          }}
          width={600}
          okText="确定"
          cancelText="取消"
        >
          <Form
            form={form}
            layout="vertical"
          >
            <Form.Item
              name="followUpType"
              label="跟进方式"
              rules={[{ required: true, message: '请选择跟进方式' }]}
            >
              <Select>
                <Option value="phone">电话</Option>
                <Option value="email">邮件</Option>
                <Option value="visit">拜访</Option>
                <Option value="wechat">微信</Option>
                <Option value="other">其他</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="followUpDate"
              label="跟进时间"
              rules={[{ required: true, message: '请选择跟进时间' }]}
            >
              <DatePicker showTime style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              name="content"
              label="跟进内容"
              rules={[{ required: true, message: '请输入跟进内容' }]}
            >
              <TextArea rows={4} placeholder="请详细描述本次跟进的内容..." />
            </Form.Item>

            <Form.Item
              name="result"
              label="跟进结果"
            >
              <Select placeholder="请选择跟进结果" allowClear>
                <Option value="positive">积极</Option>
                <Option value="neutral">中性</Option>
                <Option value="negative">消极</Option>
                <Option value="no_response">未响应</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="duration"
              label="跟进时长（分钟）"
            >
              <Input type="number" placeholder="例如：30" />
            </Form.Item>

            <Form.Item
              name="isImportant"
              label="标记为重要"
              valuePropName="value"
            >
              <Select>
                <Option value={true}>⭐ 重要</Option>
                <Option value={false}>普通</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="nextFollowUpDate"
              label="下次跟进时间"
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              name="nextFollowUpPlan"
              label="下次跟进计划"
            >
              <TextArea rows={3} placeholder="计划下次跟进的内容..." />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </Modal>
  );
};

export default LeadFollowUp;

