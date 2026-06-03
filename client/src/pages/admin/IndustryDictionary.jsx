import React, { useState, useEffect } from 'react';
import {
  Card,
  Tree,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  message,
  Popconfirm,
  Tag,
  Tooltip,
  Spin,
  Row,
  Col,
  Statistic
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  ExportOutlined,
  ImportOutlined,
  FolderOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import { industryAPI } from '../../services/api';
import './IndustryDictionary.css';

const { TextArea } = Input;
const { Option } = Select;

/**
 * 行业字典管理页面
 * 管理员可以管理行业分类、关键词和同义词
 */
const IndustryDictionary = () => {
  const [treeData, setTreeData] = useState([]);
  const [flatList, setFlatList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState('add'); // add, edit, addChild
  const [form] = Form.useForm();
  const [expandedKeys, setExpandedKeys] = useState([]);
  const [statistics, setStatistics] = useState({
    total: 0,
    level1: 0,
    level2: 0,
    level3: 0
  });

  useEffect(() => {
    loadIndustryTree();
  }, []);

  // 加载行业树
  const loadIndustryTree = async () => {
    setLoading(true);
    try {
      const response = await industryAPI.getIndustriesTree();
      if (response.success) {
        const tree = buildTreeData(response.data);
        setTreeData(tree);
        
        const flat = flattenTree(response.data);
        setFlatList(flat);
        
        // 计算统计信息
        calculateStatistics(flat);
        
        message.success('加载成功');
      }
    } catch (error) {
      message.error('加载失败：' + (error.message || '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  // 构建树形数据
  const buildTreeData = (data) => {
    return data.map(node => ({
      title: renderTreeNode(node),
      key: node.id.toString(),
      icon: node.level === 1 ? <FolderOutlined /> : <FileTextOutlined />,
      data: node,
      children: node.children && node.children.length > 0 
        ? buildTreeData(node.children)
        : undefined
    }));
  };

  // 渲染树节点
  const renderTreeNode = (node) => {
    return (
      <div className="tree-node">
        <Space>
          <span className="node-name">{node.name}</span>
          {node.code && <Tag color="blue">{node.code}</Tag>}
          {node.keywords && node.keywords.length > 0 && (
            <Tag color="green">{node.keywords.length}个关键词</Tag>
          )}
        </Space>
      </div>
    );
  };

  // 扁平化树形数据
  const flattenTree = (tree, parent = null) => {
    let result = [];
    tree.forEach(node => {
      result.push({
        ...node,
        parent,
        key: node.id.toString()
      });
      if (node.children && node.children.length > 0) {
        result = result.concat(flattenTree(node.children, node));
      }
    });
    return result;
  };

  // 计算统计信息
  const calculateStatistics = (flat) => {
    setStatistics({
      total: flat.length,
      level1: flat.filter(n => n.level === 1).length,
      level2: flat.filter(n => n.level === 2).length,
      level3: flat.filter(n => n.level === 3).length
    });
  };

  // 选择节点
  const handleSelect = (selectedKeys, info) => {
    if (selectedKeys.length > 0) {
      const nodeData = info.node.data;
      setSelectedNode(nodeData);
    } else {
      setSelectedNode(null);
    }
  };

  // 打开添加模态框
  const handleAdd = (type = 'add') => {
    if (type === 'addChild' && !selectedNode) {
      message.warning('请先选择一个父节点');
      return;
    }
    
    setModalType(type);
    form.resetFields();
    
    if (type === 'addChild') {
      form.setFieldsValue({
        parentId: selectedNode.id,
        level: selectedNode.level + 1
      });
    } else {
      form.setFieldsValue({
        level: 1
      });
    }
    
    setModalVisible(true);
  };

  // 打开编辑模态框
  const handleEdit = () => {
    if (!selectedNode) {
      message.warning('请先选择一个节点');
      return;
    }
    
    setModalType('edit');
    form.setFieldsValue({
      name: selectedNode.name,
      code: selectedNode.code,
      level: selectedNode.level,
      keywords: selectedNode.keywords ? selectedNode.keywords.join('\n') : '',
      synonyms: selectedNode.synonyms ? selectedNode.synonyms.join('\n') : '',
      description: selectedNode.description
    });
    setModalVisible(true);
  };

  // 删除节点
  const handleDelete = async () => {
    if (!selectedNode) {
      message.warning('请先选择一个节点');
      return;
    }

    // 检查是否有子节点
    const hasChildren = flatList.some(n => n.parentId === selectedNode.id);
    if (hasChildren) {
      message.error('该节点有子节点，无法删除');
      return;
    }

    try {
      await industryAPI.deleteIndustry(selectedNode.id);
      message.success('删除成功');
      setSelectedNode(null);
      loadIndustryTree();
    } catch (error) {
      message.error('删除失败：' + (error.message || '未知错误'));
    }
  };

  // 提交表单
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      // 处理关键词和同义词
      const data = {
        ...values,
        keywords: values.keywords 
          ? values.keywords.split('\n').map(k => k.trim()).filter(k => k)
          : [],
        synonyms: values.synonyms
          ? values.synonyms.split('\n').map(s => s.trim()).filter(s => s)
          : []
      };

      if (modalType === 'edit') {
        await industryAPI.updateIndustry(selectedNode.id, data);
        message.success('更新成功');
      } else {
        await industryAPI.createIndustry(data);
        message.success('创建成功');
      }

      setModalVisible(false);
      loadIndustryTree();
    } catch (error) {
      if (error.errorFields) {
        message.error('请填写必填字段');
      } else {
        message.error('操作失败：' + (error.message || '未知错误'));
      }
    }
  };

  // 导出字典
  const handleExport = async () => {
    try {
      const response = await industryAPI.exportDictionary();
      
      // 创建下载链接
      const blob = new Blob([JSON.stringify(response.data, null, 2)], {
        type: 'application/json'
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `industry_dictionary_${new Date().getTime()}.json`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      message.success('导出成功');
    } catch (error) {
      message.error('导出失败：' + (error.message || '未知错误'));
    }
  };

  // 导入字典
  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        const text = await file.text();
        const data = JSON.parse(text);
        
        await industryAPI.importDictionary(data);
        message.success('导入成功');
        loadIndustryTree();
      } catch (error) {
        message.error('导入失败：' + (error.message || '未知错误'));
      }
    };
    input.click();
  };

  return (
    <div className="industry-dictionary">
      <Card
        title="行业字典管理"
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={loadIndustryTree}>
              刷新
            </Button>
            <Button icon={<ExportOutlined />} onClick={handleExport}>
              导出
            </Button>
            <Button icon={<ImportOutlined />} onClick={handleImport}>
              导入
            </Button>
          </Space>
        }
      >
        {/* 统计信息 */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card>
              <Statistic title="总行业数" value={statistics.total} />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic title="一级分类" value={statistics.level1} />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic title="二级分类" value={statistics.level2} />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic title="三级分类" value={statistics.level3} />
            </Card>
          </Col>
        </Row>

        <Row gutter={16}>
          {/* 左侧：树形结构 */}
          <Col span={12}>
            <Card
              title="行业分类树"
              extra={
                <Space>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => handleAdd('add')}
                    size="small"
                  >
                    添加根节点
                  </Button>
                  <Button
                    icon={<PlusOutlined />}
                    onClick={() => handleAdd('addChild')}
                    disabled={!selectedNode}
                    size="small"
                  >
                    添加子节点
                  </Button>
                </Space>
              }
              style={{ height: 600, overflow: 'auto' }}
            >
              {loading ? (
                <div style={{ textAlign: 'center', padding: 40 }}>
                  <Spin />
                </div>
              ) : (
                <Tree
                  treeData={treeData}
                  expandedKeys={expandedKeys}
                  onExpand={setExpandedKeys}
                  onSelect={handleSelect}
                  showLine
                  showIcon
                />
              )}
            </Card>
          </Col>

          {/* 右侧：节点详情 */}
          <Col span={12}>
            <Card
              title="节点详情"
              extra={
                selectedNode && (
                  <Space>
                    <Button
                      type="primary"
                      icon={<EditOutlined />}
                      onClick={handleEdit}
                      size="small"
                    >
                      编辑
                    </Button>
                    <Popconfirm
                      title="确定要删除这个节点吗？"
                      onConfirm={handleDelete}
                      okText="确定"
                      cancelText="取消"
                    >
                      <Button
                        danger
                        icon={<DeleteOutlined />}
                        size="small"
                      >
                        删除
                      </Button>
                    </Popconfirm>
                  </Space>
                )
              }
              style={{ height: 600, overflow: 'auto' }}
            >
              {selectedNode ? (
                <div className="node-detail">
                  <div className="detail-item">
                    <label>行业名称：</label>
                    <span>{selectedNode.name}</span>
                  </div>
                  
                  <div className="detail-item">
                    <label>行业代码：</label>
                    <span>{selectedNode.code || '-'}</span>
                  </div>
                  
                  <div className="detail-item">
                    <label>层级：</label>
                    <span>第 {selectedNode.level} 级</span>
                  </div>
                  
                  <div className="detail-item">
                    <label>父节点：</label>
                    <span>{selectedNode.parent?.name || '无'}</span>
                  </div>
                  
                  <div className="detail-item">
                    <label>关键词：</label>
                    <div>
                      {selectedNode.keywords && selectedNode.keywords.length > 0 ? (
                        <Space wrap>
                          {selectedNode.keywords.map((keyword, index) => (
                            <Tag key={index} color="blue">{keyword}</Tag>
                          ))}
                        </Space>
                      ) : (
                        <span style={{ color: '#999' }}>未配置</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="detail-item">
                    <label>同义词：</label>
                    <div>
                      {selectedNode.synonyms && selectedNode.synonyms.length > 0 ? (
                        <Space wrap>
                          {selectedNode.synonyms.map((synonym, index) => (
                            <Tag key={index} color="green">{synonym}</Tag>
                          ))}
                        </Space>
                      ) : (
                        <span style={{ color: '#999' }}>未配置</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="detail-item">
                    <label>描述：</label>
                    <span>{selectedNode.description || '-'}</span>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
                  请选择一个节点查看详情
                </div>
              )}
            </Card>
          </Col>
        </Row>
      </Card>

      {/* 添加/编辑模态框 */}
      <Modal
        title={
          modalType === 'edit' 
            ? '编辑行业' 
            : modalType === 'addChild'
            ? '添加子节点'
            : '添加根节点'
        }
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSubmit}
        width={600}
        okText="确定"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="行业名称"
            rules={[{ required: true, message: '请输入行业名称' }]}
          >
            <Input placeholder="请输入行业名称" />
          </Form.Item>

          <Form.Item
            name="code"
            label="行业代码"
          >
            <Input placeholder="请输入行业代码（可选）" />
          </Form.Item>

          <Form.Item
            name="level"
            label="层级"
          >
            <Select disabled>
              <Option value={1}>第一级</Option>
              <Option value={2}>第二级</Option>
              <Option value={3}>第三级</Option>
            </Select>
          </Form.Item>

          {modalType === 'addChild' && (
            <Form.Item name="parentId" label="父节点ID" hidden>
              <Input />
            </Form.Item>
          )}

          <Form.Item
            name="keywords"
            label="关键词"
            extra="每行一个关键词，用于智能匹配"
          >
            <TextArea
              rows={4}
              placeholder="例如：&#10;软件开发&#10;软件服务&#10;IT服务"
            />
          </Form.Item>

          <Form.Item
            name="synonyms"
            label="同义词"
            extra="每行一个同义词，用于扩展匹配"
          >
            <TextArea
              rows={4}
              placeholder="例如：&#10;信息技术&#10;计算机服务&#10;互联网服务"
            />
          </Form.Item>

          <Form.Item
            name="description"
            label="描述"
          >
            <TextArea rows={2} placeholder="请输入行业描述（可选）" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default IndustryDictionary;











