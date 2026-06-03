import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Input,
  Select,
  Space,
  Tag,
  Modal,
  Form,
  DatePicker,
  InputNumber,
  message,
  Statistic,
  Row,
  Col,
  Tooltip,
  Popconfirm
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  PhoneOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EditOutlined,
  DeleteOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import { callSystemAPI } from '../services/api';
import dayjs from 'dayjs';
import './CallRecords.css';

const { Option } = Select;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

const CallRecords = () => {
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [filters, setFilters] = useState({
    search: '',
    callStatus: '',
    callResult: '',
    callType: '',
    startDate: null,
    endDate: null
  });
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchRecords();
    fetchStatistics();
  }, [pagination.current, filters]);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
        search: filters.search,
        callStatus: filters.callStatus,
        callResult: filters.callResult,
        callType: filters.callType,
        startDate: filters.startDate?.format('YYYY-MM-DD'),
        endDate: filters.endDate?.format('YYYY-MM-DD')
      };

      const response = await callSystemAPI.getCallRecords(params);
      if (response.success) {
        setRecords(response.data.records);
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination.total
        }));
      }
    } catch (error) {
      message.error('获取外呼记录失败：' + (error.message || '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const params = {
        startDate: filters.startDate?.format('YYYY-MM-DD'),
        endDate: filters.endDate?.format('YYYY-MM-DD')
      };
      const response = await callSystemAPI.getCallStatistics(params);
      if (response.success) {
        setStatistics(response.data);
      }
    } catch (error) {
      console.error('获取统计数据失败', error);
    }
  };

  const handleCreate = () => {
    setEditingRecord(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    form.setFieldsValue({
      ...record,
      callTime: record.callTime ? dayjs(record.callTime) : null,
      startTime: record.startTime ? dayjs(record.startTime) : null,
      endTime: record.endTime ? dayjs(record.endTime) : null,
      nextCallDate: record.nextCallDate ? dayjs(record.nextCallDate) : null
    });
    setModalVisible(true);
  };

  const handleSubmit = async (values) => {
    try {
      const data = {
        ...values,
        callTime: values.callTime?.toISOString(),
        startTime: values.startTime?.toISOString(),
        endTime: values.endTime?.toISOString(),
        nextCallDate: values.nextCallDate?.toISOString()
      };

      if (editingRecord) {
        await callSystemAPI.updateCallRecord(editingRecord.id, data);
        message.success('外呼记录更新成功');
      } else {
        await callSystemAPI.createCallRecord(data);
        message.success('外呼记录创建成功');
      }

      setModalVisible(false);
      fetchRecords();
      fetchStatistics();
    } catch (error) {
      message.error('操作失败：' + (error.message || '未知错误'));
    }
  };

  const handleDelete = async (id) => {
    try {
      await callSystemAPI.deleteCallRecord(id);
      message.success('外呼记录删除成功');
      fetchRecords();
      fetchStatistics();
    } catch (error) {
      message.error('删除失败：' + (error.message || '未知错误'));
    }
  };

  const callStatusConfig = {
    pending: { text: '待处理', color: 'default' },
    connected: { text: '已接通', color: 'success' },
    no_answer: { text: '未接听', color: 'warning' },
    busy: { text: '忙线', color: 'orange' },
    rejected: { text: '拒接', color: 'error' },
    failed: { text: '失败', color: 'error' },
    voicemail: { text: '语音留言', color: 'blue' }
  };

  const callResultConfig = {
    success: { text: '成功', color: 'success' },
    follow_up_needed: { text: '需跟进', color: 'warning' },
    not_interested: { text: '不感兴趣', color: 'default' },
    wrong_number: { text: '错误号码', color: 'error' },
    callback_requested: { text: '请求回拨', color: 'blue' },
    other: { text: '其他', color: 'default' }
  };

  const callTypeConfig = {
    outbound: { text: '呼出', icon: <PhoneOutlined /> },
    inbound: { text: '呼入', icon: <PhoneOutlined rotate={180} /> },
    callback: { text: '回拨', icon: <PhoneOutlined /> }
  };

  const columns = [
    {
      title: '外呼时间',
      dataIndex: 'callTime',
      key: 'callTime',
      width: 150,
      render: (date) => dayjs(date).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '类型',
      dataIndex: 'callType',
      key: 'callType',
      width: 80,
      render: (type) => (
        <Space>
          {callTypeConfig[type]?.icon}
          <span>{callTypeConfig[type]?.text}</span>
        </Space>
      )
    },
    {
      title: '电话号码',
      dataIndex: 'phoneNumber',
      key: 'phoneNumber',
      width: 120
    },
    {
      title: '联系人',
      dataIndex: 'contactPerson',
      key: 'contactPerson',
      width: 100
    },
    {
      title: '客户/线索',
      key: 'target',
      width: 150,
      render: (_, record) => {
        if (record.client) {
          return <Tag color="blue">{record.client.companyName}</Tag>;
        }
        if (record.lead) {
          return <Tag color="cyan">{record.lead.companyName}</Tag>;
        }
        return '-';
      }
    },
    {
      title: '状态',
      dataIndex: 'callStatus',
      key: 'callStatus',
      width: 100,
      render: (status) => (
        <Tag color={callStatusConfig[status]?.color}>
          {callStatusConfig[status]?.text}
        </Tag>
      )
    },
    {
      title: '结果',
      dataIndex: 'callResult',
      key: 'callResult',
      width: 100,
      render: (result) => result ? (
        <Tag color={callResultConfig[result]?.color}>
          {callResultConfig[result]?.text}
        </Tag>
      ) : '-'
    },
    {
      title: '时长',
      dataIndex: 'duration',
      key: 'duration',
      width: 80,
      render: (duration) => {
        if (!duration) return '-';
        const minutes = Math.floor(duration / 60);
        const seconds = duration % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
      }
    },
    {
      title: '外呼人',
      dataIndex: ['user', 'username'],
      key: 'user',
      width: 100
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
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
            title="确定要删除这条记录吗？"
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
    <div className="call-records-page">
      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总外呼数"
              value={statistics.totalCalls || 0}
              prefix={<PhoneOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="接通数"
              value={statistics.connectedCount || 0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="接通率"
              value={statistics.connectionRate || 0}
              suffix="%"
              prefix={<BarChartOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="平均时长"
              value={statistics.avgDuration || 0}
              suffix="秒"
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* 主内容卡片 */}
      <Card
        title="外呼记录管理"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreate}
          >
            新增记录
          </Button>
        }
      >
        {/* 筛选栏 */}
        <Space style={{ marginBottom: 16 }} wrap>
          <Input
            placeholder="搜索电话号码、联系人"
            prefix={<SearchOutlined />}
            style={{ width: 250 }}
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            allowClear
          />
          <Select
            placeholder="外呼类型"
            style={{ width: 120 }}
            value={filters.callType}
            onChange={(value) => setFilters({ ...filters, callType: value })}
            allowClear
          >
            <Option value="outbound">呼出</Option>
            <Option value="inbound">呼入</Option>
            <Option value="callback">回拨</Option>
          </Select>
          <Select
            placeholder="外呼状态"
            style={{ width: 120 }}
            value={filters.callStatus}
            onChange={(value) => setFilters({ ...filters, callStatus: value })}
            allowClear
          >
            <Option value="pending">待处理</Option>
            <Option value="connected">已接通</Option>
            <Option value="no_answer">未接听</Option>
            <Option value="busy">忙线</Option>
            <Option value="rejected">拒接</Option>
            <Option value="failed">失败</Option>
          </Select>
          <Select
            placeholder="外呼结果"
            style={{ width: 120 }}
            value={filters.callResult}
            onChange={(value) => setFilters({ ...filters, callResult: value })}
            allowClear
          >
            <Option value="success">成功</Option>
            <Option value="follow_up_needed">需跟进</Option>
            <Option value="not_interested">不感兴趣</Option>
            <Option value="wrong_number">错误号码</Option>
            <Option value="callback_requested">请求回拨</Option>
          </Select>
          <RangePicker
            value={[filters.startDate, filters.endDate]}
            onChange={(dates) => setFilters({
              ...filters,
              startDate: dates?.[0],
              endDate: dates?.[1]
            })}
          />
        </Space>

        {/* 表格 */}
        <Table
          columns={columns}
          dataSource={records}
          loading={loading}
          rowKey="id"
          scroll={{ x: 1500 }}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
            onChange: (page, pageSize) => setPagination({ ...pagination, current: page, pageSize })
          }}
        />
      </Card>

      {/* 创建/编辑模态框 */}
      <Modal
        title={editingRecord ? '编辑外呼记录' : '新增外呼记录'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={800}
        okText="保存"
        cancelText="取消"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="phoneNumber"
                label="电话号码"
                rules={[{ required: true, message: '请输入电话号码' }]}
              >
                <Input placeholder="请输入电话号码" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="contactPerson" label="联系人">
                <Input placeholder="请输入联系人" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="callType"
                label="外呼类型"
                rules={[{ required: true, message: '请选择外呼类型' }]}
              >
                <Select placeholder="选择外呼类型">
                  <Option value="outbound">呼出</Option>
                  <Option value="inbound">呼入</Option>
                  <Option value="callback">回拨</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="callStatus"
                label="外呼状态"
                rules={[{ required: true, message: '请选择外呼状态' }]}
              >
                <Select placeholder="选择外呼状态">
                  <Option value="pending">待处理</Option>
                  <Option value="connected">已接通</Option>
                  <Option value="no_answer">未接听</Option>
                  <Option value="busy">忙线</Option>
                  <Option value="rejected">拒接</Option>
                  <Option value="failed">失败</Option>
                  <Option value="voicemail">语音留言</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="callResult" label="外呼结果">
                <Select placeholder="选择外呼结果" allowClear>
                  <Option value="success">成功</Option>
                  <Option value="follow_up_needed">需跟进</Option>
                  <Option value="not_interested">不感兴趣</Option>
                  <Option value="wrong_number">错误号码</Option>
                  <Option value="callback_requested">请求回拨</Option>
                  <Option value="other">其他</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="callTime" label="外呼时间">
                <DatePicker showTime style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="startTime" label="开始时间">
                <DatePicker showTime style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="endTime" label="结束时间">
                <DatePicker showTime style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="duration" label="通话时长（秒）">
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="nextCallDate" label="下次外呼时间">
                <DatePicker showTime style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="subject" label="主题">
            <Input placeholder="请输入主题" />
          </Form.Item>

          <Form.Item name="content" label="通话内容">
            <TextArea rows={4} placeholder="请输入通话内容" />
          </Form.Item>

          <Form.Item name="notes" label="备注">
            <TextArea rows={3} placeholder="请输入备注" />
          </Form.Item>

          <Form.Item name="nextAction" label="下一步行动">
            <TextArea rows={2} placeholder="请输入下一步行动计划" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CallRecords;








