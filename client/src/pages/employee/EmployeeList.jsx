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
  message,
  Row,
  Col,
  Statistic,
  Badge,
  Tooltip,
  Dropdown
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  ReloadOutlined,
  UserOutlined,
  LockOutlined,
  UnlockOutlined,
  DownOutlined,
  ImportOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { employeeAPI } from '../../services/api';
import EmployeeImport from './EmployeeImport';
import './EmployeeList.css';

const { Search } = Input;
const { Option } = Select;

const EmployeeList = () => {
  const navigate = useNavigate();
  
  // 状态管理
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [statistics, setStatistics] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    suspended: 0
  });
  
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0
  });
  
  const [filters, setFilters] = useState({
    search: '',
    departmentId: undefined,
    position: undefined,
    status: undefined,
    roleId: undefined
  });
  
  // 筛选选项
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [roles, setRoles] = useState([]);
  
  // 导入模态框
  const [importModalVisible, setImportModalVisible] = useState(false);

  // 初始化加载
  useEffect(() => {
    fetchEmployees();
    fetchStatistics();
    fetchFilterOptions();
  }, []);

  // 分页和筛选变化时重新加载
  useEffect(() => {
    fetchEmployees();
  }, [pagination.current, pagination.pageSize, filters]);

  // 获取员工列表
  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
        ...filters
      };

      // 过滤空值
      Object.keys(params).forEach(key => {
        if (params[key] === undefined || params[key] === '') {
          delete params[key];
        }
      });

      const response = await employeeAPI.getEmployees(params);

      if (response.success) {
        setEmployees(response.data?.employees || []);
        setPagination(prev => ({
          ...prev,
          total: response.data?.pagination?.total || 0
        }));
      }
    } catch (error) {
      console.error('获取员工列表失败:', error);
      message.error(error.response?.data?.message || '获取员工列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取统计数据
  const fetchStatistics = async () => {
    try {
      const response = await employeeAPI.getStatistics();

      if (response.success) {
        setStatistics(response.data);
      } else {
        console.error('统计数据获取失败:', response.message);
      }
    } catch (error) {
      console.error('获取统计数据失败:', error);
    }
  };

  // 获取筛选选项
  const fetchFilterOptions = async () => {
    try {
      const [deptRes, posRes, roleRes] = await Promise.all([
        employeeAPI.getDepartmentOptions(),
        employeeAPI.getPositionOptions(),
        employeeAPI.getRoleOptions()
      ]);

      if (deptRes.success) setDepartments(deptRes.data || []);
      if (posRes.success) setPositions(posRes.data || []);
      if (roleRes.success) setRoles(roleRes.data || []);
    } catch (error) {
      console.error('获取筛选选项失败:', error);
    }
  };

  // 处理搜索
  const handleSearch = (value) => {
    setFilters(prev => ({ ...prev, search: value }));
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  // 处理筛选变化
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  // 重置筛选
  const handleReset = () => {
    setFilters({
      search: '',
      departmentId: undefined,
      position: undefined,
      status: undefined,
      roleId: undefined
    });
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  // 刷新列表
  const handleRefresh = () => {
    fetchEmployees();
    fetchStatistics();
    message.success('列表已刷新');
  };

  // 表格分页变化
  const handleTableChange = (newPagination) => {
    setPagination(prev => ({
      ...prev,
      current: newPagination.current,
      pageSize: newPagination.pageSize
    }));
  };

  // 查看详情
  const handleView = (record) => {
    navigate(`/employees/${record.id}`);
  };

  // 编辑员工
  const handleEdit = (record) => {
    navigate(`/employees/${record.id}/edit`);
  };

  // 删除员工
  const handleDelete = (record) => {
    Modal.confirm({
      title: '确认停用员工',
      content: `确定要停用员工 ${record.name} 吗？停用后该员工将无法登录系统。`,
      okText: '确定',
      cancelText: '取消',
      okType: 'danger',
      onOk: async () => {
        try {
          const response = await employeeAPI.deleteEmployee(record.id);

          if (response.success) {
            message.success('员工已停用');
            fetchEmployees();
            fetchStatistics();
          }
        } catch (error) {
          message.error(error.response?.data?.message || '停用失败');
        }
      }
    });
  };

  // 修改状态
  const handleChangeStatus = (record, newStatus) => {
    const statusText = {
      active: '激活',
      inactive: '停用',
      suspended: '暂停'
    };

    Modal.confirm({
      title: `确认${statusText[newStatus]}员工`,
      content: `确定要${statusText[newStatus]}员工 ${record.name} 吗？`,
      okText: '确定',
      cancelText: '取消',
      onOk: async () => {
        try {
          const response = await employeeAPI.updateEmployeeStatus(record.id, newStatus);

          if (response.success) {
            message.success(`员工已${statusText[newStatus]}`);
            fetchEmployees();
            fetchStatistics();
          }
        } catch (error) {
          message.error(error.response?.data?.message || '操作失败');
        }
      }
    });
  };

  // 重置密码
  const handleResetPassword = (record) => {
    Modal.confirm({
      title: '确认重置密码',
      content: `确定要重置员工 ${record.name} 的密码吗？`,
      okText: '确定',
      cancelText: '取消',
      onOk: async () => {
        try {
          const response = await employeeAPI.resetPassword(record.id);

          if (response.success) {
            Modal.info({
              title: '密码重置成功',
              content: (
                <div>
                  <p>新密码：<strong style={{ color: '#1890ff', fontSize: '16px' }}>{response.data.data.newPassword}</strong></p>
                  <p style={{ color: '#999', fontSize: '12px', marginTop: '10px' }}>
                    请妥善保管并告知员工，建议首次登录后修改密码。
                  </p>
                </div>
              )
            });
          }
        } catch (error) {
          message.error(error.response?.data?.message || '重置失败');
        }
      }
    });
  };

  // 获取状态标签
  const getStatusBadge = (status) => {
    const statusMap = {
      active: { status: 'success', text: '在职' },
      inactive: { status: 'default', text: '离职' },
      suspended: { status: 'warning', text: '停用' }
    };
    const config = statusMap[status] || { status: 'default', text: status };
    return <Badge status={config.status} text={config.text} />;
  };

  // 操作菜单
  const getActionMenu = (record) => ({
    items: [
      {
        key: 'view',
        label: '查看详情',
        icon: <EyeOutlined />,
        onClick: () => handleView(record)
      },
      {
        key: 'edit',
        label: '编辑信息',
        icon: <EditOutlined />,
        onClick: () => handleEdit(record)
      },
      { type: 'divider' },
      ...(record.status === 'active' ? [{
        key: 'suspend',
        label: '暂停账号',
        icon: <LockOutlined />,
        onClick: () => handleChangeStatus(record, 'suspended')
      }] : []),
      ...(record.status === 'suspended' ? [{
        key: 'activate',
        label: '激活账号',
        icon: <UnlockOutlined />,
        onClick: () => handleChangeStatus(record, 'active')
      }] : []),
      {
        key: 'reset-password',
        label: '重置密码',
        icon: <LockOutlined />,
        onClick: () => handleResetPassword(record)
      },
      { type: 'divider' },
      {
        key: 'delete',
        label: '停用员工',
        icon: <DeleteOutlined />,
        danger: true,
        onClick: () => handleDelete(record)
      }
    ]
  });

  // 表格列定义
  const columns = [
    {
      title: '工号',
      dataIndex: 'employeeNo',
      key: 'employeeNo',
      width: 120,
      fixed: 'left'
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      width: 120,
      fixed: 'left',
      render: (text) => <strong>{text}</strong>
    },
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      width: 120
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      width: 200,
      ellipsis: true
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
      width: 130
    },
    {
      title: '部门',
      dataIndex: ['department', 'name'],
      key: 'department',
      width: 120,
      render: (text) => text || '-'
    },
    {
      title: '职位',
      dataIndex: 'position',
      key: 'position',
      width: 120,
      render: (text) => text || '-'
    },
    {
      title: '角色',
      dataIndex: ['role', 'name'],
      key: 'role',
      width: 100,
      render: (text) => text ? <Tag color="blue">{text}</Tag> : '-'
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => getStatusBadge(status)
    },
    {
      title: '入职日期',
      dataIndex: 'hireDate',
      key: 'hireDate',
      width: 120,
      render: (date) => date ? new Date(date).toLocaleDateString('zh-CN') : '-'
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="查看">
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleView(record)}
            />
          </Tooltip>
          <Tooltip title="编辑">
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Dropdown menu={getActionMenu(record)} trigger={['click']}>
            <Button type="link" size="small">
              更多 <DownOutlined />
            </Button>
          </Dropdown>
        </Space>
      )
    }
  ];

  return (
    <div className="employee-list-container">
      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="员工总数"
              value={statistics.total}
              prefix={<UserOutlined />}
              styles={{ value: { color: '#1890ff' } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="在职员工"
              value={statistics.active}
              styles={{ value: { color: '#52c41a' } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="停用账号"
              value={statistics.suspended}
              styles={{ value: { color: '#faad14' } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="离职员工"
              value={statistics.inactive}
              styles={{ value: { color: '#999' } }}
            />
          </Card>
        </Col>
      </Row>

      {/* 主卡片 */}
      <Card
        title={
          <Space>
            <UserOutlined />
            <span>员工管理</span>
          </Space>
        }
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
              刷新
            </Button>
            <Button
              icon={<ImportOutlined />}
              onClick={() => setImportModalVisible(true)}
            >
              批量导入
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate('/employees/create')}
            >
              新增员工
            </Button>
          </Space>
        }
      >
        {/* 筛选区域 */}
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={8}>
            <Search
              placeholder="搜索姓名、工号、邮箱、手机号"
              allowClear
              enterButton={<SearchOutlined />}
              onSearch={handleSearch}
            />
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              placeholder="选择部门"
              allowClear
              style={{ width: '100%' }}
              value={filters.departmentId}
              onChange={(value) => handleFilterChange('departmentId', value)}
            >
              {departments.map(dept => (
                <Option key={dept.id} value={dept.id}>{dept.name}</Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              placeholder="选择职位"
              allowClear
              style={{ width: '100%' }}
              value={filters.position}
              onChange={(value) => handleFilterChange('position', value)}
            >
              {positions.map(pos => (
                <Option key={pos} value={pos}>{pos}</Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              placeholder="选择角色"
              allowClear
              style={{ width: '100%' }}
              value={filters.roleId}
              onChange={(value) => handleFilterChange('roleId', value)}
            >
              {roles.map(role => (
                <Option key={role.id} value={role.id}>{role.name}</Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              placeholder="选择状态"
              allowClear
              style={{ width: '100%' }}
              value={filters.status}
              onChange={(value) => handleFilterChange('status', value)}
            >
              <Option value="active">在职</Option>
              <Option value="inactive">离职</Option>
              <Option value="suspended">停用</Option>
            </Select>
          </Col>
        </Row>

        {/* 员工表格 */}
        <Table
          columns={columns}
          dataSource={employees}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
            pageSizeOptions: ['10', '20', '50', '100']
          }}
          onChange={handleTableChange}
          scroll={{ x: 1500 }}
        />
      </Card>

      {/* 批量导入模态框 */}
      <EmployeeImport
        visible={importModalVisible}
        onClose={() => setImportModalVisible(false)}
        onSuccess={() => {
          fetchEmployees();
          fetchStatistics();
          message.success('员工导入成功');
        }}
      />
    </div>
  );
};

export default EmployeeList;

