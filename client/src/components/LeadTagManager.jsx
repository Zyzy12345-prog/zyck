import React, { useState, useEffect } from 'react';
import { 
  Modal, Form, Input, Select, Button, Table, Tag, Space, 
  message, Popconfirm, Card, Row, Col, Statistic 
} from 'antd';
import { 
  PlusOutlined, EditOutlined, DeleteOutlined, TagOutlined 
} from '@ant-design/icons';
import { leadTagAPI } from '../services/api';
import './LeadTagManager.css';

const { Option } = Select;

const LeadTagManager = ({ visible, onClose, onTagsChange }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [tags, setTags] = useState([]);
  const [statistics, setStatistics] = useState([]);
  const [categories, setCategories] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTag, setEditingTag] = useState(null);
  const [filters, setFilters] = useState({ category: '', search: '' });

  useEffect(() => {
    if (visible) {
      fetchTags();
      fetchStatistics();
      fetchCategories();
    }
  }, [visible, filters]);

  const fetchTags = async () => {
    try {
      setLoading(true);
      const response = await leadTagAPI.getTags(filters);
      if (response.success) {
        setTags(response.data);
      }
    } catch (error) {
      message.error('获取标签列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await leadTagAPI.getStatistics();
      if (response.success) {
        setStatistics(response.data);
      }
    } catch (error) {
      console.error('获取统计数据失败:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await leadTagAPI.getCategories();
      if (response.success) {
        setCategories(response.data);
      }
    } catch (error) {
      console.error('获取分类列表失败:', error);
    }
  };

  const handleAdd = () => {
    setEditingTag(null);
    form.resetFields();
    form.setFieldsValue({ color: '#1890ff' });
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingTag(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      const response = await leadTagAPI.deleteTag(id);
      if (response.success) {
        message.success('删除成功');
        fetchTags();
        fetchStatistics();
        if (onTagsChange) onTagsChange();
      }
    } catch (error) {
      message.error(error.message || '删除失败');
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
        message.success(editingTag ? '更新成功' : '创建成功');
        setModalVisible(false);
        form.resetFields();
        fetchTags();
        fetchStatistics();
        if (onTagsChange) onTagsChange();
      }
    } catch (error) {
      if (error.errorFields) {
        message.error('请填写必填项');
      } else {
        message.error(error.message || '操作失败');
      }
    }
  };

  const colorOptions = [
    { value: '#f5222d', label: '红色' },
    { value: '#fa541c', label: '橙红' },
    { value: '#fa8c16', label: '橙色' },
    { value: '#faad14', label: '金色' },
    { value: '#52c41a', label: '绿色' },
    { value: '#13c2c2', label: '青色' },
    { value: '#1890ff', label: '蓝色' },
    { value: '#2f54eb', label: '深蓝' },
    { value: '#722ed1', label: '紫色' },
    { value: '#eb2f96', label: '粉色' },
    { value: '#8c8c8c', label: '灰色' }
  ];

  const columns = [
    {
      title: '标签名称',
      dataIndex: 'name',
      key: 'name',
      render: (name, record) => (
        <Tag color={record.color}>{name}</Tag>
      )
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      render: (category) => category || '-'
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (desc) => desc || '-'
    },
    {
      title: '使用次数',
      key: 'usage',
      width: 100,
      render: (_, record) => {
        const stat = statistics.find(s => s.id === record.id);
        return stat ? stat.lead_count : 0;
      }
    },
    {
      title: '类型',
      dataIndex: 'isSystem',
      key: 'isSystem',
      width: 80,
      render: (isSystem) => (
        <Tag color={isSystem ? 'blue' : 'default'}>
          {isSystem ? '系统' : '自定义'}
        </Tag>
      )
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
          {!record.isSystem && (
            <Popconfirm
              title="确定删除此标签？"
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
          )}
        </Space>
      )
    }
  ];

  return (
    <Modal
      title="标签管理"
      open={visible}
      onCancel={onClose}
      width={1000}
      footer={null}
      destroyOnHidden
    >
      <div className="lead-tag-manager-container">
        {/* 统计信息 */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={8}>
            <Card>
              <Statistic
                title="总标签数"
                value={tags.length}
                prefix={<TagOutlined />}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="系统标签"
                value={tags.filter(t => t.isSystem).length}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="自定义标签"
                value={tags.filter(t => !t.isSystem).length}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
        </Row>

        {/* 筛选和操作 */}
        <Space style={{ marginBottom: 16 }} wrap>
          <Input
            placeholder="搜索标签名称"
            style={{ width: 200 }}
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            allowClear
          />
          <Select
            placeholder="选择分类"
            style={{ width: 150 }}
            value={filters.category}
            onChange={(value) => setFilters({ ...filters, category: value })}
            allowClear
          >
            {categories.map(cat => (
              <Option key={cat.category} value={cat.category}>
                {cat.category} ({cat.count})
              </Option>
            ))}
          </Select>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            新增标签
          </Button>
        </Space>

        {/* 标签表格 */}
        <Table
          columns={columns}
          dataSource={tags}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 800 }}
        />

        {/* 新增/编辑模态框 */}
        <Modal
          title={editingTag ? '编辑标签' : '新增标签'}
          open={modalVisible}
          onOk={handleSubmit}
          onCancel={() => {
            setModalVisible(false);
            form.resetFields();
          }}
          okText="确定"
          cancelText="取消"
        >
          <Form
            form={form}
            layout="vertical"
          >
            <Form.Item
              name="name"
              label="标签名称"
              rules={[
                { required: true, message: '请输入标签名称' },
                { max: 50, message: '标签名称不能超过50个字符' }
              ]}
            >
              <Input placeholder="例如：高意向" />
            </Form.Item>

            <Form.Item
              name="color"
              label="标签颜色"
              rules={[{ required: true, message: '请选择标签颜色' }]}
            >
              <Select>
                {colorOptions.map(opt => (
                  <Option key={opt.value} value={opt.value}>
                    <Tag color={opt.value}>{opt.label}</Tag>
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="category"
              label="标签分类"
            >
              <Input placeholder="例如：意向、预算、角色等" />
            </Form.Item>

            <Form.Item
              name="description"
              label="标签描述"
            >
              <Input.TextArea rows={3} placeholder="描述此标签的用途..." />
            </Form.Item>

            <Form.Item
              name="sortOrder"
              label="排序顺序"
            >
              <Input type="number" placeholder="数字越小越靠前" />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </Modal>
  );
};

export default LeadTagManager;










