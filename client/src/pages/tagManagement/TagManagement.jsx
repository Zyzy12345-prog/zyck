import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Tag,
  Space,
  message,
  Popconfirm,
  Row,
  Col,
  Statistic
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  TagsOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { customerTagAPI } from '../../services/api';
import './TagManagement.css';

const { Option } = Select;

const TagManagement = () => {
  const [loading, setLoading] = useState(false);
  const [tags, setTags] = useState([]);
  const [statistics, setStatistics] = useState([]);
  const [categories, setCategories] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTag, setEditingTag] = useState(null);
  const [form] = Form.useForm();

  // 预定义颜色
  const colors = [
    '#f5222d', '#fa541c', '#fa8c16', '#faad14', '#fadb14',
    '#a0d911', '#52c41a', '#13c2c2', '#1890ff', '#2f54eb',
    '#722ed1', '#eb2f96', '#8c8c8c'
  ];

  // 预定义图标
  const icons = [
    'star', 'heart', 'crown', 'fire', 'rocket', 'trophy',
    'dollar', 'thunderbolt', 'bulb', 'flag', 'gift',
    'clock-circle', 'user-add', 'team', 'stop'
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tagsRes, statsRes, catsRes] = await Promise.all([
        customerTagAPI.getTags(),
        customerTagAPI.getTagStatistics(),
        customerTagAPI.getTagCategories()
      ]);

      if (tagsRes.success) {
        setTags(tagsRes.data);
      }

      if (statsRes.success) {
        setStatistics(statsRes.data);
      }

      if (catsRes.success) {
        setCategories(catsRes.data);
      }
    } catch (error) {
      message.error('获取数据失败：' + (error.message || '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingTag(null);
    form.resetFields();
    form.setFieldsValue({
      color: '#1890ff',
      icon: 'tag'
    });
    setModalVisible(true);
  };

  const handleEdit = (tag) => {
    setEditingTag(tag);
    form.setFieldsValue(tag);
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (editingTag) {
        await customerTagAPI.updateTag(editingTag.id, values);
        message.success('标签更新成功');
      } else {
        await customerTagAPI.createTag(values);
        message.success('标签创建成功');
      }

      setModalVisible(false);
      form.resetFields();
      fetchData();
    } catch (error) {
      if (error.errorFields) {
        message.error('请检查表单填写是否正确');
      } else {
        message.error('操作失败：' + (error.message || '未知错误'));
      }
    }
  };

  const handleDelete = async (id) => {
    try {
      await customerTagAPI.deleteTag(id);
      message.success('标签删除成功');
      fetchData();
    } catch (error) {
      message.error('删除失败：' + (error.message || '未知错误'));
    }
  };

  const columns = [
    {
      title: '标签名称',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Tag color={record.color} icon={<TagsOutlined />}>
          {text}
        </Tag>
      )
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      render: (text) => text || '-'
    },
    {
      title: '图标',
      dataIndex: 'icon',
      key: 'icon',
      render: (text) => text || '-'
    },
    {
      title: '使用次数',
      dataIndex: 'clientCount',
      key: 'clientCount',
      render: (text) => text || 0,
      sorter: (a, b) => (a.clientCount || 0) - (b.clientCount || 0)
    },
    {
      title: '类型',
      dataIndex: 'isSystem',
      key: 'isSystem',
      render: (isSystem) => (
        <Tag color={isSystem ? 'blue' : 'default'}>
          {isSystem ? '系统标签' : '自定义'}
        </Tag>
      )
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (text) => text || '-'
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            disabled={record.isSystem}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个标签吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
            disabled={record.isSystem}
          >
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
              disabled={record.isSystem}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div className="tag-management-container">
      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="标签总数"
              value={tags.length}
              prefix={<TagsOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="系统标签"
              value={tags.filter(t => t.isSystem).length}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="自定义标签"
              value={tags.filter(t => !t.isSystem).length}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="标签分类"
              value={categories.length}
            />
          </Card>
        </Col>
      </Row>

      {/* 标签列表 */}
      <Card
        title="标签管理"
        extra={
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchData}
            >
              刷新
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreate}
            >
              新增标签
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={statistics}
          rowKey="id"
          loading={loading}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`
          }}
        />
      </Card>

      {/* 创建/编辑标签模态框 */}
      <Modal
        title={editingTag ? '编辑标签' : '新增标签'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
        okText="保存"
        cancelText="取消"
      >
        <Form
          form={form}
          layout="vertical"
          autoComplete="off"
        >
          <Form.Item
            label="标签名称"
            name="name"
            rules={[
              { required: true, message: '请输入标签名称' },
              { max: 50, message: '标签名称不能超过50个字符' }
            ]}
          >
            <Input placeholder="请输入标签名称" />
          </Form.Item>

          <Form.Item
            label="标签颜色"
            name="color"
            rules={[{ required: true, message: '请选择标签颜色' }]}
          >
            <Select placeholder="选择颜色">
              {colors.map(color => (
                <Option key={color} value={color}>
                  <Tag color={color}>{color}</Tag>
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="图标"
            name="icon"
          >
            <Select placeholder="选择图标（可选）" allowClear>
              {icons.map(icon => (
                <Option key={icon} value={icon}>
                  {icon}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="标签分类"
            name="category"
          >
            <Select
              placeholder="选择或输入分类（可选）"
              allowClear
              showSearch
              mode="tags"
              maxTagCount={1}
            >
              {categories.map(cat => (
                <Option key={cat.category} value={cat.category}>
                  {cat.category}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="描述"
            name="description"
          >
            <Input.TextArea
              placeholder="请输入标签描述（可选）"
              rows={4}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TagManagement;





