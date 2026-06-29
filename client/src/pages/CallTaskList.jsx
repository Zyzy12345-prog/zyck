import { useState, useEffect } from 'react';
import {
  Card, Table, Button, Select, Tag, Space, Modal, Form,
  Input, message, Statistic, Row, Col, Popconfirm
} from 'antd';
import {
  PlusOutlined, PhoneOutlined, ClockCircleOutlined,
  CheckCircleOutlined, CloseCircleOutlined
} from '@ant-design/icons';
import { callSystemAPI, userAPI } from '../services/api';
import dayjs from 'dayjs';
import './CallRecords.css';

const { Option } = Select;
const { TextArea } = Input;

const CallTaskList = () => {
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [users, setUsers] = useState([]);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchTasks();
    fetchStatistics();
    fetchUsers();
  }, [pagination.current]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const params = { page: pagination.current, limit: pagination.pageSize };
      const response = await callSystemAPI.getCallTasks(params);
      if (response.success) {
        setTasks(response.data?.tasks || []);
        setPagination(prev => ({ ...prev, total: response.data?.pagination?.total || 0 }));
      }
    } catch (e) {
      message.error('获取任务列表失败');
    } finally { setLoading(false); }
  };

  const fetchStatistics = async () => {
    try {
      const response = await callSystemAPI.getTaskStatistics();
      if (response.success) setStatistics(response.data || {});
    } catch (e) { /* silent */ }
  };

  const fetchUsers = async () => {
    try {
      const response = await userAPI.getUsers({ limit: 200 });
      if (response.success) setUsers(response.data?.users || response.data || []);
    } catch (e) { /* silent */ }
  };

  const handleCreate = () => {
    setEditingTask(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingTask(record);
    form.setFieldsValue({ ...record });
    setModalVisible(true);
  };

  const handleSubmit = async (values) => {
    try {
      if (editingTask) {
        await callSystemAPI.updateCallTask(editingTask.id, values);
        message.success('任务更新成功');
      } else {
        await callSystemAPI.createCallTask(values);
        message.success('任务创建成功');
      }
      setModalVisible(false);
      fetchTasks();
      fetchStatistics();
    } catch (e) {
      message.error('操作失败：' + (e.message || '未知错误'));
    }
  };

  const handleDelete = async (id) => {
    try {
      await callSystemAPI.deleteCallTask(id);
      message.success('任务已删除');
      fetchTasks();
      fetchStatistics();
    } catch (e) {
      message.error('删除失败');
    }
  };

  const handleComplete = async (id) => {
    try {
      await callSystemAPI.completeCallTask(id);
      message.success('任务已完成');
      fetchTasks();
      fetchStatistics();
    } catch (e) { message.error('操作失败'); }
  };

  const handleCancel = async (id) => {
    try {
      await callSystemAPI.cancelCallTask(id);
      message.success('任务已取消');
      fetchTasks();
      fetchStatistics();
    } catch (e) { message.error('操作失败'); }
  };

  const statusConfig = {
    pending: { text: '待执行', color: 'default' },
    in_progress: { text: '执行中', color: 'processing' },
    completed: { text: '已完成', color: 'success' },
    cancelled: { text: '已取消', color: 'error' },
  };

  const typeConfig = {
    single: { text: '单次', color: 'blue' },
    batch: { text: '批量', color: 'purple' },
    campaign: { text: '活动', color: 'orange' },
  };

  const priorityConfig = {
    low: { text: '低', color: 'default' },
    normal: { text: '中', color: 'blue' },
    high: { text: '高', color: 'orange' },
    urgent: { text: '紧急', color: 'red' },
  };

  const columns = [
    { title: '任务标题', dataIndex: 'title', width: 200, ellipsis: true },
    { title: '类型', dataIndex: 'taskType', width: 80,
      render: t => <Tag color={typeConfig[t]?.color}>{typeConfig[t]?.text || t}</Tag> },
    { title: '状态', dataIndex: 'status', width: 80,
      render: s => <Tag color={statusConfig[s]?.color}>{statusConfig[s]?.text || s}</Tag> },
    { title: '优先级', dataIndex: 'priority', width: 80,
      render: p => <Tag color={priorityConfig[p]?.color}>{priorityConfig[p]?.text || p}</Tag> },
    { title: '负责人', dataIndex: ['assignedUser', 'username'], width: 80 },
    { title: '呼叫次数', dataIndex: 'totalCalls', width: 80 },
    { title: '成功次数', dataIndex: 'successfulCalls', width: 80 },
    { title: '截止日期', dataIndex: 'deadline', width: 100,
      render: d => d ? dayjs(d).format('MM-DD') : '-' },
    { title: '操作', key: 'action', width: 180, fixed: 'right',
      render: (_, r) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => handleEdit(r)}>编辑</Button>
          {r.status === 'pending' && (
            <Button type="link" size="small" onClick={() => handleComplete(r.id)}>完成</Button>
          )}
          {r.status === 'pending' && (
            <Button type="link" size="small" danger onClick={() => handleCancel(r.id)}>取消</Button>
          )}
          <Popconfirm title="确定删除?" onConfirm={() => handleDelete(r.id)}>
            <Button type="link" size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div className="call-records-page fade-in">
      <div className="page-header">
        <h1 className="page-title">外呼任务管理</h1>
        <p className="page-subtitle">管理外呼任务分配和执行</p>
      </div>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card><Statistic title="任务总数" value={statistics.total || 0} prefix={<PhoneOutlined />} /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title="待执行" value={statistics.pending || 0} valueStyle={{ color: '#1890ff' }} prefix={<ClockCircleOutlined />} /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title="已完成" value={statistics.completed || 0} valueStyle={{ color: '#52c41a' }} prefix={<CheckCircleOutlined />} /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title="平均成功率" value={statistics.successRate ? `${statistics.successRate}%` : '-'} prefix={<PhoneOutlined />} /></Card>
        </Col>
      </Row>

      <Card
        title="外呼任务列表"
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>新增任务</Button>}
      >
        <Table
          columns={columns}
          dataSource={tasks}
          loading={loading}
          rowKey="id"
          scroll={{ x: 1200 }}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showTotal: t => `共 ${t} 条`,
            onChange: (page, ps) => setPagination({ ...pagination, current: page, pageSize: ps })
          }}
        />
      </Card>

      <Modal
        title={editingTask ? '编辑任务' : '新增任务'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={600}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="title" label="任务标题" rules={[{ required: true, message: '请输入任务标题' }]}>
            <Input placeholder="请输入任务标题" />
          </Form.Item>
          <Form.Item name="description" label="任务描述">
            <TextArea rows={3} placeholder="请输入任务描述" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="taskType" label="任务类型">
                <Select>
                  <Option value="single">单次</Option>
                  <Option value="batch">批量</Option>
                  <Option value="campaign">活动</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="priority" label="优先级">
                <Select>
                  <Option value="low">低</Option>
                  <Option value="normal">中</Option>
                  <Option value="high">高</Option>
                  <Option value="urgent">紧急</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="assignedTo" label="负责人" rules={[{ required: true, message: '请选择负责人' }]}>
                <Select placeholder="选择负责人" showSearch optionFilterProp="label">
                  {users.map(u => (
                    <Option key={u.id} value={u.id} label={u.username}>{u.username}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="deadline" label="截止日期">
                <Input type="date" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="targetCount" label="目标通话数">
            <Input type="number" placeholder="批量任务的目标数量" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CallTaskList;
