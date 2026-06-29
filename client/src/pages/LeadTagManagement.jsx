import React, { useState, useEffect, useCallback } from 'react';
import {
  Card, Table, Button, Modal, Form, Input, Select, Tag, Space,
  message, Popconfirm, Row, Col, Statistic, Tooltip, ColorPicker
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, TagsOutlined,
  ReloadOutlined, SearchOutlined, FilterOutlined,
  CrownOutlined, TagOutlined, AppstoreOutlined
} from '@ant-design/icons';
import { leadTagAPI } from '../services/api';
import './LeadTagManagement.css';

const LeadTagManagement = () => {
  const [loading, setLoading] = useState(false);
  const [tags, setTags] = useState([]);
  const [statistics, setStatistics] = useState([]);
  const [categories, setCategories] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTag, setEditingTag] = useState(null);
  const [filters, setFilters] = useState({ category: '', search: '' });
  const [form] = Form.useForm();
  const [selectedColor, setSelectedColor] = useState('#1890ff');

  const fetchTags = useCallback(async () => {
    try {
      setLoading(true);
      const response = await leadTagAPI.getTags(filters);
      if (response.success) {
        setTags(response.data);
      }
    } catch (error) {
      message.error('获取标签列表失败：' + (error.message || '未知错误'));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchStatistics = useCallback(async () => {
    try {
      const response = await leadTagAPI.getStatistics();
      if (response.success) {
        setStatistics(response.data);
      }
    } catch (error) {
      console.error('获取统计数据失败:', error);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await leadTagAPI.getCategories();
      if (response.success) {
        setCategories(response.data);
      }
    } catch (error) {
      console.error('获取分类列表失败:', error);
    }
  }, []);

  useEffect(() => {
    fetchTags();
    fetchStatistics();
    fetchCategories();
  }, [fetchTags, fetchStatistics, fetchCategories]);

  const handleCreate = () => {
    setEditingTag(null);
    setSelectedColor('#1890ff');
    form.resetFields();
    form.setFieldsValue({ color: '#1890ff', sortOrder: 0 });
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingTag(record);
    setSelectedColor(record.color || '#1890ff');
    form.setFieldsValue({
      name: record.name,
      color: record.color,
      category: record.category,
      description: record.description,
      sortOrder: record.sortOrder || 0
    });
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      const response = await leadTagAPI.deleteTag(id);
      if (response.success) {
        message.success('标签删除成功');
        fetchTags();
        fetchStatistics();
        fetchCategories();
      }
    } catch (error) {
      message.error('删除失败：' + (error.message || '未知错误'));
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      let response;
      if (editingTag) {
        response = await leadTagAPI.updateTag(editingTag.id, values);
      } else {
        response = await leadTagAPI.createTag(values);
      }

      if (response.success) {
        message.success(editingTag ? '标签更新成功' : '标签创建成功');
        setModalVisible(false);
        form.resetFields();
        fetchTags();
        fetchStatistics();
        fetchCategories();
      }
    } catch (error) {
      if (error.errorFields) {
        message.error('请检查表单填写');
      } else {
        message.error('操作失败：' + (error.message || '未知错误'));
      }
    }
  };

  // 预定义颜色列表
  const presetColors = [
    '#f5222d', '#fa541c', '#fa8c16', '#faad14', '#fadb14',
    '#a0d911', '#52c41a', '#13c2c2', '#1890ff', '#2f54eb',
    '#722ed1', '#eb2f96', '#8c8c8c', '#595959', '#262626'
  ];

  const columns = [
    {
      title: '标签名称',
      dataIndex: 'name',
      key: 'name',
      width: 180,
      fixed: 'left',
      render: (name, record) => (
        <Tag
          color={record.color}
          style={{ fontSize: 14, padding: '2px 10px', margin: '2px' }}
        >
          {record.isSystem && <CrownOutlined style={{ marginRight: 4 }} />}
          {name}
        </Tag>
      )
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 120,
      render: (category) => category ? <Tag>{category}</Tag> : <span style={{ color: '#ccc' }}>-</span>
    },
    {
      title: '颜色',
      dataIndex: 'color',
      key: 'color',
      width: 80,
      render: (color) => (
        <div style={{
          width: 24, height: 24, borderRadius: 4,
          backgroundColor: color, border: '1px solid #d9d9d9',
          display: 'inline-block'
        }} />
      )
    },
    {
      title: '使用次数',
      key: 'usage',
      width: 100,
      sorter: (a, b) => {
        const statA = statistics.find(s => s.id === a.id);
        const statB = statistics.find(s => s.id === b.id);
        return (statA?.lead_count || 0) - (statB?.lead_count || 0);
      },
      render: (_, record) => {
        const stat = statistics.find(s => s.id === record.id);
        const count = stat ? stat.lead_count : 0;
        return (
          <Tooltip title={`${count} 条线索使用此标签`}>
            <Tag color={count > 0 ? 'blue' : 'default'}>{count}</Tag>
          </Tooltip>
        );
      }
    },
    {
      title: '类型',
      dataIndex: 'isSystem',
      key: 'isSystem',
      width: 90,
      filters: [
        { text: '系统标签', value: true },
        { text: '自定义标签', value: false }
      ],
      onFilter: (value, record) => record.isSystem === value,
      render: (isSystem) => (
        <Tag color={isSystem ? 'blue' : 'green'} icon={isSystem ? <CrownOutlined /> : <TagOutlined />}>
          {isSystem ? '系统' : '自定义'}
        </Tag>
      )
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      width: 200,
      render: (desc) => desc || <span style={{ color: '#ccc' }}>暂无描述</span>
    },
    {
      title: '排序',
      dataIndex: 'sortOrder',
      key: 'sortOrder',
      width: 70,
      sorter: (a, b) => (a.sortOrder || 0) - (b.sortOrder || 0),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 130,
      render: (date) => date ? new Date(date).toLocaleDateString('zh-CN') : '-'
    },
    {
      title: '操作',
      key: 'action',
      width: 140,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            disabled={record.isSystem && record.category === '意向'}
          >
            编辑
          </Button>
          {!record.isSystem && (
            <Popconfirm
              title="确定删除此标签？"
              description="删除后关联的线索标签也会被移除"
              onConfirm={() => handleDelete(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                删除
              </Button>
            </Popconfirm>
          )}
        </Space>
      )
    }
  ];

  return (
    <div className="lead-tag-management-page">
      {/* 页面标题 */}
      <div className="page-header">
        <h2>
          <TagsOutlined /> 线索标签管理
        </h2>
        <p className="page-description">
          管理客户线索的标签体系，支持系统标签和自定义标签，用于线索分类、筛选和分析
        </p>
      </div>

      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card className="stat-card">
            <Statistic
              title="标签总数"
              value={tags.length}
              prefix={<TagsOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="stat-card">
            <Statistic
              title="系统标签"
              value={tags.filter(t => t.isSystem).length}
              prefix={<CrownOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="stat-card">
            <Statistic
              title="自定义标签"
              value={tags.filter(t => !t.isSystem).length}
              prefix={<TagOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="stat-card">
            <Statistic
              title="标签分类"
              value={categories.length}
              prefix={<AppstoreOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 标签列表 */}
      <Card
        title={
          <Space>
            <FilterOutlined />
            <span>标签列表</span>
          </Space>
        }
        extra={
          <Space>
            <Input
              placeholder="搜索标签名称..."
              prefix={<SearchOutlined />}
              style={{ width: 200 }}
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              allowClear
            />
            <Select
              placeholder="按分类筛选"
              style={{ width: 150 }}
              value={filters.category || undefined}
              onChange={(value) => setFilters({ ...filters, category: value || '' })}
              allowClear
            >
              {categories.map(cat => (
                <Select.Option key={cat.category} value={cat.category}>
                  {cat.category} ({cat.count})
                </Select.Option>
              ))}
            </Select>
            <Button icon={<ReloadOutlined />} onClick={() => { fetchTags(); fetchStatistics(); fetchCategories(); }}>
              刷新
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              新增标签
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={tags}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1200 }}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条标签`,
            defaultPageSize: 20,
            pageSizeOptions: ['10', '20', '50', '100']
          }}
        />
      </Card>

      {/* 标签使用统计 */}
      {statistics.length > 0 && (
        <Card title="标签使用排行" style={{ marginTop: 24 }}>
          <div className="tag-ranking">
            {statistics.slice(0, 10).map((stat, index) => (
              <div key={stat.id} className="tag-ranking-item">
                <span className="tag-ranking-index">{index + 1}</span>
                <Tag color={stat.color}>{stat.name}</Tag>
                <div className="tag-ranking-bar-container">
                  <div
                    className="tag-ranking-bar"
                    style={{
                      width: `${Math.min((stat.lead_count / Math.max(...statistics.map(s => s.lead_count), 1)) * 100, 100)}%`,
                      backgroundColor: stat.color
                    }}
                  />
                </div>
                <span className="tag-ranking-count">{stat.lead_count} 条线索</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 创建/编辑标签模态框 */}
      <Modal
        title={editingTag ? '编辑标签' : '新增标签'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        okText="保存"
        cancelText="取消"
        width={560}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" autoComplete="off">
          <Form.Item
            name="name"
            label="标签名称"
            rules={[
              { required: true, message: '请输入标签名称' },
              { max: 50, message: '标签名称不能超过50个字符' },
              { pattern: /^[一-龥a-zA-Z0-9_\-\s]+$/, message: '只支持中英文、数字、下划线和短横线' }
            ]}
          >
            <Input placeholder="例如：高意向客户、需回访、重点跟进" maxLength={50} showCount />
          </Form.Item>

          <Form.Item
            name="color"
            label="标签颜色"
            rules={[{ required: true, message: '请选择标签颜色' }]}
          >
            <div>
              <Space wrap style={{ marginBottom: 8 }}>
                {presetColors.map(color => (
                  <div
                    key={color}
                    onClick={() => {
                      setSelectedColor(color);
                      form.setFieldsValue({ color });
                    }}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 6,
                      backgroundColor: color,
                      cursor: 'pointer',
                      border: selectedColor === color ? '3px solid #000' : '2px solid transparent',
                      transition: 'all 0.2s',
                      boxShadow: selectedColor === color ? '0 0 8px rgba(0,0,0,0.3)' : 'none'
                    }}
                  />
                ))}
              </Space>
              <Form.Item name="color" noStyle>
                <Input placeholder="#1890ff" style={{ width: 160 }} />
              </Form.Item>
              <span style={{ marginLeft: 8, color: '#999', fontSize: 12 }}>点击色块快捷选择，或手动输入颜色值</span>
            </div>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="category"
                label="标签分类"
                tooltip="用于分组管理标签"
              >
                <Select
                  placeholder="选择或输入分类"
                  allowClear
                  showSearch
                  mode="tags"
                  maxCount={1}
                >
                  {categories.map(cat => (
                    <Select.Option key={cat.category} value={cat.category}>
                      {cat.category}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="sortOrder"
                label="排序顺序"
                tooltip="数字越小越靠前"
              >
                <Input type="number" placeholder="0" min={0} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="标签描述"
          >
            <Input.TextArea
              placeholder="描述此标签的用途和使用场景..."
              rows={3}
              maxLength={200}
              showCount
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default LeadTagManagement;
