import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Card, 
  Table, 
  Button, 
  Input, 
  Space, 
  Tag, 
  Modal, 
  message,
  Tooltip,
  Select,
  Row,
  Col,
  Form
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  UserOutlined,
  UploadOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { clientAPI, industryAPI } from '../../services/api';
import CustomerImport from './CustomerImport';
import './CustomerList.css';

const { Search } = Input;
const { Option } = Select;

const CustomerList = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0
  });
  const [searchText, setSearchText] = useState('');
  const [industryFilter, setIndustryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [industries, setIndustries] = useState([]);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchCustomers();
  }, [pagination.current, pagination.pageSize, searchText, industryFilter, statusFilter]);

  useEffect(() => {
    fetchIndustries();
  }, []);

  // 获取客户列表
  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
        search: searchText
      };

      // 添加筛选条件 - 使用 industryId 而不是 industry
      if (industryFilter) {
        params.industryId = industryFilter;
      }
      if (statusFilter) {
        params.taxStatus = statusFilter;
      }

      const response = await clientAPI.getClients(params);
      
      if (response.success) {
        setCustomers(response.data.clients || []);
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination?.total || 0
        }));
      }
    } catch (error) {
      message.error('获取客户列表失败：' + (error.message || '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  // 获取行业列表 - 从行业分类表获取
  const fetchIndustries = async () => {
    try {
      const response = await industryAPI.getIndustriesList();
      if (response.success) {
        setIndustries(response.data || []);
      }
    } catch (error) {
      console.error('获取行业列表失败:', error);
    }
  };

  // 处理搜索
  const handleSearch = (value) => {
    setSearchText(value);
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  // 处理行业筛选变化
  const handleIndustryChange = (value) => {
    setIndustryFilter(value);
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  // 处理状态筛选变化
  const handleStatusChange = (value) => {
    setStatusFilter(value);
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  // 重置所有筛选
  const handleResetFilters = () => {
    setSearchText('');
    setIndustryFilter('');
    setStatusFilter('');
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  // 处理表格变化
  const handleTableChange = (newPagination) => {
    setPagination(prev => ({
      ...prev,
      current: newPagination.current,
      pageSize: newPagination.pageSize
    }));
  };

  // 打开新增客户模态框
  const handleOpenCreateModal = () => {
    form.resetFields();
    setCreateModalVisible(true);
  };

  // 关闭新增客户模态框
  const handleCloseCreateModal = () => {
    setCreateModalVisible(false);
    form.resetFields();
  };

  // 打开导入模态框
  const handleOpenImportModal = () => {
    setImportModalVisible(true);
  };

  // 关闭导入模态框
  const handleCloseImportModal = () => {
    setImportModalVisible(false);
  };

  // 导入成功回调
  const handleImportSuccess = () => {
    fetchCustomers();
    fetchIndustries();
  };

  // 提交新增客户表单
  const handleCreateSubmit = async () => {
    try {
      const values = await form.validateFields();

      const clientData = {
        companyName: values.companyName,
        contactPerson: values.contactPerson,
        phone: values.phone,
        email: values.email,
        industry: values.industry, // 传入行业文本，后端会自动匹配
        registeredCapital: values.registeredCapital,
        remarks: values.remarks,
        taxStatus: 'pending'
      };

      const response = await clientAPI.createClient(clientData);
      
      if (response.success) {
        message.success('客户创建成功');
        handleCloseCreateModal();
        fetchCustomers();
        fetchIndustries();
      }
    } catch (error) {
      if (error.errorFields) {
        message.error('请检查表单填写是否正确');
      } else {
        message.error('创建失败：' + (error.message || '未知错误'));
      }
    }
  };

  // 删除客户
  const handleDelete = (record) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除客户 ${record.companyName} 吗？此操作不可恢复。`,
      okText: '确定',
      cancelText: '取消',
      okType: 'danger',
      onOk: async () => {
        try {
          const response = await clientAPI.deleteClient(record.id);
          if (response.success) {
            message.success('客户已删除');
            fetchCustomers();
          }
        } catch (error) {
          message.error('删除失败：' + (error.message || '未知错误'));
        }
      }
    });
  };

  // 状态标签颜色
  const getStatusColor = (status) => {
    const colors = {
      'pending': 'default',
      'processing': 'processing',
      'completed': 'success',
      'cancelled': 'error'
    };
    return colors[status] || 'default';
  };

  // 状态文本
  const getStatusText = (status) => {
    const texts = {
      'pending': '待处理',
      'processing': '处理中',
      'completed': '已完成',
      'cancelled': '已取消'
    };
    return texts[status] || status;
  };

  // 格式化时间
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 表格列定义
  const columns = [
    {
      title: '客户名称',
      dataIndex: 'companyName',
      key: 'companyName',
      width: 200,
      fixed: 'left',
      render: (text, record) => (
        <a 
          onClick={() => navigate(`/customers/${record.id}`)}
          style={{ color: '#1890ff', cursor: 'pointer' }}
        >
          <Space>
            <UserOutlined />
            <span>{text}</span>
          </Space>
        </a>
      )
    },
    {
      title: '联系人',
      dataIndex: 'contactPerson',
      key: 'contactPerson',
      width: 120,
      render: (text) => text || '-'
    },
    {
      title: '电话',
      dataIndex: 'phone',
      key: 'phone',
      width: 150,
      render: (text) => text || '-'
    },
    {
      title: '行业',
      dataIndex: 'industry',
      key: 'industry',
      width: 180,
      render: (industry) => {
        // industry 是关联的 IndustryCategory 对象
        if (industry && industry.name) {
          return industry.name;
        }
        return '-';
      }
    },
    {
      title: '财税状态',
      dataIndex: 'taxStatus',
      key: 'taxStatus',
      width: 100,
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      )
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (date) => formatDate(date)
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => navigate(`/customers/${record.id}`)}
            >
              详情
            </Button>
          </Tooltip>
          <Tooltip title="删除">
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record)}
            >
              删除
            </Button>
          </Tooltip>
        </Space>
      )
    }
  ];

  return (
    <div className="customer-list-container">
      <Card 
        title={
          <Space>
            <UserOutlined />
            <span>客户管理</span>
          </Space>
        }
        extra={
          <Space>
            <Button
              icon={<UploadOutlined />}
              onClick={handleOpenImportModal}
            >
              导入
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleOpenCreateModal}
            >
              新增客户
            </Button>
          </Space>
        }
      >
        {/* 搜索和筛选区域 */}
        <div className="search-section">
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={24} md={12} lg={10}>
              <Search
                placeholder="搜索客户名称、联系人、电话"
                allowClear
                enterButton={<SearchOutlined />}
                onSearch={handleSearch}
              />
            </Col>
            <Col xs={12} sm={12} md={6} lg={4}>
              <Select
                placeholder="选择行业"
                allowClear
                style={{ width: '100%' }}
                value={industryFilter || undefined}
                onChange={handleIndustryChange}
              >
                {industries.map(industry => (
                  <Option key={industry.id} value={industry.id}>
                    {industry.name}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col xs={12} sm={12} md={6} lg={4}>
              <Select
                placeholder="选择状态"
                allowClear
                style={{ width: '100%' }}
                value={statusFilter || undefined}
                onChange={handleStatusChange}
              >
                <Option value="pending">待处理</Option>
                <Option value="processing">处理中</Option>
                <Option value="completed">已完成</Option>
                <Option value="cancelled">已取消</Option>
              </Select>
            </Col>
            <Col xs={24} sm={24} md={24} lg={6}>
              <Space>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={handleResetFilters}
                >
                  重置
                </Button>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={fetchCustomers}
                >
                  刷新
                </Button>
              </Space>
            </Col>
          </Row>
        </div>

        {/* 客户表格 */}
        <Table
          columns={columns}
          dataSource={customers}
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
          scroll={{ x: 1200 }}
          className="customer-table"
        />
      </Card>

      {/* 新增客户模态框 */}
      <Modal
        title="新增客户"
        open={createModalVisible}
        onOk={handleCreateSubmit}
        onCancel={handleCloseCreateModal}
        width={600}
        okText="提交"
        cancelText="取消"
      >
        <Form
          form={form}
          layout="vertical"
          autoComplete="off"
        >
          <Form.Item
            label="客户名称"
            name="companyName"
            rules={[
              { required: true, message: '请输入客户名称' },
              { max: 200, message: '客户名称不能超过200个字符' }
            ]}
          >
            <Input placeholder="请输入客户名称" />
          </Form.Item>

          <Form.Item
            label="联系人"
            name="contactPerson"
            rules={[
              { max: 100, message: '联系人不能超过100个字符' }
            ]}
          >
            <Input placeholder="请输入联系人姓名" />
          </Form.Item>

          <Form.Item
            label="电话"
            name="phone"
            rules={[
              { required: true, message: '请输入电话号码' },
              { 
                pattern: /^1[3-9]\d{9}$|^0\d{2,3}-?\d{7,8}$/, 
                message: '请输入正确的手机号或固定电话' 
              }
            ]}
          >
            <Input placeholder="请输入电话号码" />
          </Form.Item>

          <Form.Item
            label="邮箱"
            name="email"
            rules={[
              { type: 'email', message: '请输入正确的邮箱地址' }
            ]}
          >
            <Input placeholder="请输入邮箱地址（可选）" />
          </Form.Item>

          <Form.Item
            label="行业"
            name="industry"
            tooltip="输入行业名称，系统会自动匹配到标准分类"
          >
            <Input placeholder="例如：科研、金融、教育等" />
          </Form.Item>

          <Form.Item
            label="注册资本"
            name="registeredCapital"
          >
            <Input type="number" placeholder="请输入注册资本（元）" />
          </Form.Item>

          <Form.Item
            label="备注"
            name="remarks"
          >
            <Input.TextArea 
              placeholder="请输入备注信息（可选）" 
              rows={4}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 导入客户模态框 */}
      <CustomerImport
        visible={importModalVisible}
        onClose={handleCloseImportModal}
        onSuccess={handleImportSuccess}
      />
    </div>
  );
};

export default CustomerList;
