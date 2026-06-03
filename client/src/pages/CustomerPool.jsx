import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Table, Button, Input, Select, Tag, Space, Modal, message, Statistic, Row, Col, Tooltip, Badge } from 'antd';
import {
  SearchOutlined,
  ThunderboltOutlined,
  UserAddOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  LockOutlined,
  StarOutlined,
  FireOutlined
} from '@ant-design/icons';
import { customerPoolAPI } from '../services/api';
import './CustomerPool.css';

const { Option } = Select;

const CustomerPool = () => {
  const navigate = useNavigate();
  const [poolClients, setPoolClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statistics, setStatistics] = useState({});
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [filters, setFilters] = useState({
    search: '',
    status: 'available',
    sortBy: 'priority'
  });
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  useEffect(() => {
    fetchPoolClients();
    fetchStatistics();
  }, [pagination.current, filters]);

  const fetchPoolClients = async () => {
    try {
      setLoading(true);
      const response = await customerPoolAPI.getPoolClients({
        page: pagination.current,
        limit: pagination.pageSize,
        ...filters
      });
      setPoolClients(response.data);
      setPagination(prev => ({ ...prev, total: response.pagination.total }));
    } catch (error) {
      message.error('获取公海池列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await customerPoolAPI.getStatistics();
      setStatistics(response.data);
    } catch (error) {
      console.error('获取统计数据失败', error);
    }
  };

  const handleClaim = async (id) => {
    Modal.confirm({
      title: '确认领取',
      content: '确定要领取这个客户吗？',
      onOk: async () => {
        try {
          await customerPoolAPI.claimClient(id);
          message.success('客户领取成功');
          fetchPoolClients();
          fetchStatistics();
        } catch (error) {
          message.error('领取失败：' + (error.message || '未知错误'));
        }
      }
    });
  };

  const handleBatchClaim = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要领取的客户');
      return;
    }

    Modal.confirm({
      title: '批量领取',
      content: `确定要领取选中的 ${selectedRowKeys.length} 个客户吗？`,
      onOk: async () => {
        try {
          await customerPoolAPI.batchClaimClients(selectedRowKeys);
          message.success(`成功领取 ${selectedRowKeys.length} 个客户`);
          setSelectedRowKeys([]);
          fetchPoolClients();
          fetchStatistics();
        } catch (error) {
          message.error('批量领取失败');
        }
      }
    });
  };

  const handleUpdatePriority = async (id, priority) => {
    try {
      await customerPoolAPI.updatePriority(id, priority);
      message.success('优先级更新成功');
      fetchPoolClients();
    } catch (error) {
      message.error('更新失败');
    }
  };

  const statusColors = {
    available: 'success',
    claimed: 'default',
    locked: 'warning'
  };

  const statusLabels = {
    available: '可领取',
    claimed: '已领取',
    locked: '已锁定'
  };

  const reasonLabels = {
    unassigned: '未分配',
    inactive: '长期未跟进',
    returned: '主动退回',
    transferred: '转移'
  };

  const columns = [
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      render: (priority, record) => (
        <Space>
          {priority >= 5 ? (
            <Tooltip title="高优先级">
              <FireOutlined style={{ color: '#ff4d4f', fontSize: 18 }} />
            </Tooltip>
          ) : priority >= 3 ? (
            <Tooltip title="中优先级">
              <StarOutlined style={{ color: '#faad14', fontSize: 18 }} />
            </Tooltip>
          ) : (
            <Tooltip title="低优先级">
              <StarOutlined style={{ color: '#d9d9d9', fontSize: 18 }} />
            </Tooltip>
          )}
          <span>{priority}</span>
        </Space>
      ),
      sorter: (a, b) => b.priority - a.priority
    },
    {
      title: '公司名称',
      dataIndex: ['client', 'companyName'],
      key: 'companyName',
      width: 200,
      render: (text, record) => (
        <a onClick={() => navigate(`/clients/${record.client.id}`)}>{text}</a>
      )
    },
    {
      title: '联系人',
      dataIndex: ['client', 'contactPerson'],
      key: 'contactPerson',
      width: 120
    },
    {
      title: '联系方式',
      key: 'contact',
      width: 150,
      render: (_, record) => (
        <Space direction="vertical" size="small">
          {record.client.phone && <span>{record.client.phone}</span>}
          {record.client.email && <span style={{ fontSize: 12, color: '#999' }}>{record.client.email}</span>}
        </Space>
      )
    },
    {
      title: '客户等级',
      dataIndex: ['client', 'customerLevel'],
      key: 'customerLevel',
      width: 100,
      render: (level) => {
        const colors = { A: 'red', B: 'orange', C: 'blue', D: 'default' };
        return <Tag color={colors[level]}>{level}级</Tag>;
      }
    },
    {
      title: '进入原因',
      dataIndex: 'enteredReason',
      key: 'enteredReason',
      width: 120,
      render: (reason) => reasonLabels[reason] || reason
    },
    {
      title: '进入时间',
      dataIndex: 'enteredAt',
      key: 'enteredAt',
      width: 150,
      render: (date) => new Date(date).toLocaleString()
    },
    {
      title: '在池天数',
      key: 'daysInPool',
      width: 100,
      render: (_, record) => {
        const days = Math.floor((new Date() - new Date(record.enteredAt)) / (1000 * 60 * 60 * 24));
        return (
          <Tag color={days > 30 ? 'red' : days > 7 ? 'orange' : 'green'}>
            {days}天
          </Tag>
        );
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
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          {record.status === 'available' && (
            <Button
              type="primary"
              size="small"
              icon={<ThunderboltOutlined />}
              onClick={() => handleClaim(record.id)}
              className="claim-btn"
            >
              领取
            </Button>
          )}
          <Select
            size="small"
            value={record.priority}
            style={{ width: 80 }}
            onChange={(value) => handleUpdatePriority(record.id, value)}
          >
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(p => (
              <Option key={p} value={p}>{p}</Option>
            ))}
          </Select>
          <Button
            type="link"
            size="small"
            onClick={() => navigate(`/clients/${record.client.id}`)}
          >
            详情
          </Button>
        </Space>
      )
    }
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
    getCheckboxProps: (record) => ({
      disabled: record.status !== 'available'
    })
  };

  return (
    <div className="customer-pool-page">
      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="可领取客户"
              value={statistics.totalAvailable || 0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已领取"
              value={statistics.totalClaimed || 0}
              prefix={<UserAddOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已锁定"
              value={statistics.totalLocked || 0}
              prefix={<LockOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="高优先级"
              value={statistics.highPriority || 0}
              prefix={<FireOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 主内容卡片 */}
      <Card
        title={
          <Space>
            <span>客户公海池</span>
            <Badge count={statistics.totalAvailable || 0} showZero style={{ backgroundColor: '#52c41a' }} />
          </Space>
        }
        extra={
          <Space>
            <Button
              icon={<ThunderboltOutlined />}
              type="primary"
              onClick={handleBatchClaim}
              disabled={selectedRowKeys.length === 0}
            >
              批量领取 ({selectedRowKeys.length})
            </Button>
          </Space>
        }
      >
        {/* 筛选栏 */}
        <Space style={{ marginBottom: 16 }} wrap>
          <Input
            placeholder="搜索公司名称、联系人"
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
          >
            <Option value="available">可领取</Option>
            <Option value="claimed">已领取</Option>
            <Option value="locked">已锁定</Option>
          </Select>
          <Select
            placeholder="排序方式"
            style={{ width: 150 }}
            value={filters.sortBy}
            onChange={(value) => setFilters({ ...filters, sortBy: value })}
          >
            <Option value="priority">按优先级</Option>
            <Option value="time">按进入时间</Option>
          </Select>
        </Space>

        {/* 表格 */}
        <Table
          rowSelection={rowSelection}
          columns={columns}
          dataSource={poolClients}
          loading={loading}
          rowKey="id"
          scroll={{ x: 1400 }}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (page, pageSize) => setPagination({ ...pagination, current: page, pageSize })
          }}
        />
      </Card>
    </div>
  );
};

export default CustomerPool;

