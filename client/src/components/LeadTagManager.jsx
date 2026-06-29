import React, { useState, useEffect } from 'react';
import {
  Modal, Form, Input, Select, Button, Table, Tag, Space,
  message, Popconfirm, Card, Row, Col, Statistic, Tooltip
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, TagOutlined,
  TagsOutlined, CrownOutlined, SearchOutlined
} from '@ant-design/icons';
import { leadTagAPI } from '../services/api';
import './LeadTagManager.css';

const LeadTagManager = ({ visible, onClose, onTagsChange }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [tags, setTags] = useState([]);
  const [statistics, setStatistics] = useState([]);
  const [categories, setCategories] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTag, setEditingTag] = useState(null);
  const [filters, setFilters] = useState({ category: '', search: '' });
  const [selectedColor, setSelectedColor] = useState('#1890ff');

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
        fetchCategories();
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
      width: 160,
      render: (name, record) => (
        <Tag color={record.color} style={{ fontSize: 13, padding: '2px 8px' }}>
          {record.isSystem && <CrownOutlined style={{ marginRight: 4 }} />}
          {name}
        </Tag>
      )
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 100,
      render: (category) => category ? <Tag>{category}</Tag> : '-'
    },
    {
      title: '使用次数',
      key: 'usage',
      width: 90,
      render: (_, record) => {
        const stat = statistics.find(s => s.id === record.id);
        const count = stat ? stat.lead_count : 0;
        return (
          <Tooltip title={`${count} 条线索使用`}>
            <Tag color={count > 0 ? 'blue' : 'default'}>{count}</Tag>
          </Tooltip>
        );
      }
    },
    {
      title: '类型',
      dataIndex: 'isSystem',
      key: 'isSystem',
      width: 80,
      render: (isSystem) => (
        <Tag color={isSystem ? 'blue' : 'green'}>
          {isSystem ? '系统' : '自定义'}
        </Tag>
      )
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
          >
            编辑
          </Button>
          {!record.isSystem && (
            <Popconfirm
              title="确定删除此标签？"
              description="删除后关联线索的标签也会被移除"
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
    <Modal
      title={
        <Space>
          <TagsOutlined />
          <span>线索标签管理</span>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      width={900}
      footer={[
        <Button key="close" onClick={onClose}>
          关闭
        </Button>,
        <Button key="full" type="link" onClick={() => {
          onClose();
          window.location.href = '/lead-tags';
        }}>
          进入完整管理页面
        </Button>
      ]}
      destroyOnHidden
    >
      <div className="lead-tag-manager-container">
        {/* 统计信息 */}
        <Row gutter={12} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="总标签数"
                value={tags.length}
                prefix={<TagOutlined />}
                valueStyle={{ fontSize: 20 }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="系统标签"
                value={tags.filter(t => t.isSystem).length}
                prefix={<CrownOutlined />}
                valueStyle={{ color: '#722ed1', fontSize: 20 }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="自定义标签"
                value={tags.filter(t => !t.isSystem).length}
                prefix={<TagOutlined />}
                valueStyle={{ color: '#52c41a', fontSize: 20 }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="分类数"
                value={categories.length}
                valueStyle={{ color: '#fa8c16', fontSize: 20 }}
              />
            </Card>
          </Col>
        </Row>

        {/* 筛选和操作 */}
        <Space style={{ marginBottom: 16 }} wrap>
          <Input
            placeholder="搜索标签名称"
            prefix={<SearchOutlined />}
            style={{ width: 200 }}
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            allowClear
          />
          <Select
            placeholder="选择分类"
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
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增标签
          </Button>
        </Space>

        {/* 标签表格 */}
        <Table
          columns={columns}
          dataSource={tags}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 条` }}
          scroll={{ x: 600 }}
          size="small"
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
          okText="保存"
          cancelText="取消"
          width={500}
          destroyOnHidden
        >
          <Form form={form} layout="vertical" autoComplete="off">
            <Form.Item
              name="name"
              label="标签名称"
              rules={[
                { required: true, message: '请输入标签名称' },
                { max: 50, message: '标签名称不能超过50个字符' }
              ]}
            >
              <Input placeholder="例如：高意向客户" maxLength={50} showCount />
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
                        width: 28,
                        height: 28,
                        borderRadius: 4,
                        backgroundColor: color,
                        cursor: 'pointer',
                        border: selectedColor === color ? '2px solid #000' : '2px solid transparent',
                        transition: 'all 0.15s',
                      }}
                    />
                  ))}
                </Space>
                <Form.Item name="color" noStyle>
                  <Input placeholder="#1890ff" style={{ width: 140 }} />
                </Form.Item>
              </div>
            </Form.Item>

            <Form.Item name="category" label="标签分类">
              <Select placeholder="选择或输入分类" allowClear showSearch mode="tags" maxCount={1}>
                {categories.map(cat => (
                  <Select.Option key={cat.category} value={cat.category}>
                    {cat.category}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item name="sortOrder" label="排序顺序">
              <Input type="number" placeholder="数字越小越靠前" />
            </Form.Item>

            <Form.Item name="description" label="标签描述">
              <Input.TextArea rows={3} placeholder="描述此标签的用途..." maxLength={200} showCount />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </Modal>
  );
};

export default LeadTagManager;
