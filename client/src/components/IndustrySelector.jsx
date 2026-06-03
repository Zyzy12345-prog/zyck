import React, { useState, useEffect } from 'react';
import { Modal, Input, Tree, Space, Tag, Button, message, Spin, Empty } from 'antd';
import { SearchOutlined, PlusOutlined } from '@ant-design/icons';
import { industryAPI } from '../services/api';
import './IndustrySelector.css';

const { Search } = Input;

/**
 * 行业选择器模态框
 * 支持搜索、树形选择和添加到字典（管理员）
 */
const IndustrySelector = ({ 
  visible, 
  onClose, 
  onSelect,
  currentIndustry,
  originalText,
  isAdmin = false
}) => {
  const [loading, setLoading] = useState(false);
  const [treeData, setTreeData] = useState([]);
  const [expandedKeys, setExpandedKeys] = useState([]);
  const [searchValue, setSearchValue] = useState('');
  const [autoExpandParent, setAutoExpandParent] = useState(true);
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [flatList, setFlatList] = useState([]);

  useEffect(() => {
    if (visible) {
      loadIndustryTree();
      if (currentIndustry) {
        setSelectedKeys([currentIndustry.id.toString()]);
      }
    }
  }, [visible, currentIndustry]);

  // 加载行业树
  const loadIndustryTree = async () => {
    setLoading(true);
    try {
      const response = await industryAPI.getIndustriesTree();
      if (response.success) {
        const tree = buildTreeData(response.data);
        setTreeData(tree);
        
        // 构建扁平列表用于搜索
        const flat = flattenTree(response.data);
        setFlatList(flat);
      }
    } catch (error) {
      message.error('加载行业分类失败');
    } finally {
      setLoading(false);
    }
  };

  // 构建树形数据
  const buildTreeData = (data) => {
    return data.map(node => ({
      title: (
        <Space>
          <span>{node.name}</span>
          {node.code && <Tag color="blue" style={{ fontSize: 11 }}>{node.code}</Tag>}
        </Space>
      ),
      key: node.id.toString(),
      value: node.id,
      data: node,
      children: node.children && node.children.length > 0 
        ? buildTreeData(node.children)
        : undefined
    }));
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

  // 搜索处理
  const handleSearch = (value) => {
    setSearchValue(value);
    
    if (!value) {
      setExpandedKeys([]);
      setAutoExpandParent(false);
      return;
    }

    // 查找匹配的节点
    const matchedKeys = [];
    const expandKeys = new Set();

    flatList.forEach(item => {
      if (item.name.toLowerCase().includes(value.toLowerCase())) {
        matchedKeys.push(item.key);
        
        // 展开所有父节点
        let parent = item.parent;
        while (parent) {
          expandKeys.add(parent.id.toString());
          parent = flatList.find(n => n.id === parent.parentId)?.parent;
        }
      }
    });

    setExpandedKeys(Array.from(expandKeys));
    setAutoExpandParent(true);
  };

  // 选择节点
  const handleSelect = (selectedKeys, info) => {
    if (selectedKeys.length > 0) {
      setSelectedKeys(selectedKeys);
    }
  };

  // 确认选择
  const handleConfirm = () => {
    if (selectedKeys.length === 0) {
      message.warning('请选择一个行业');
      return;
    }

    const selectedId = parseInt(selectedKeys[0]);
    const selectedNode = flatList.find(item => item.id === selectedId);
    
    if (selectedNode) {
      onSelect({
        id: selectedNode.id,
        name: selectedNode.name,
        code: selectedNode.code,
        level: selectedNode.level,
        matchType: 'manual'
      });
      onClose();
    }
  };

  // 添加到字典（管理员功能）
  const handleAddToDictionary = async () => {
    if (!originalText || !selectedKeys.length) {
      message.warning('请先选择目标行业');
      return;
    }

    try {
      const selectedId = parseInt(selectedKeys[0]);
      const selectedNode = flatList.find(item => item.id === selectedId);
      
      if (!selectedNode) return;

      // 获取当前关键词
      const response = await industryAPI.getIndustriesList({ level: selectedNode.level });
      const industry = response.data.find(ind => ind.id === selectedId);
      
      if (!industry) {
        message.error('获取行业信息失败');
        return;
      }

      const currentKeywords = industry.keywords || [];
      
      // 检查是否已存在
      if (currentKeywords.includes(originalText)) {
        message.info('该关键词已存在');
        return;
      }

      // 添加新关键词
      const newKeywords = [...currentKeywords, originalText];
      await industryAPI.updateIndustryKeywords(selectedId, newKeywords);
      
      message.success(`已将"${originalText}"添加到"${selectedNode.name}"的关键词字典`);
    } catch (error) {
      message.error('添加失败：' + (error.message || '未知错误'));
    }
  };

  // 高亮搜索文本
  const highlightText = (text) => {
    if (!searchValue) return text;
    
    const index = text.toLowerCase().indexOf(searchValue.toLowerCase());
    if (index === -1) return text;
    
    const before = text.substring(0, index);
    const match = text.substring(index, index + searchValue.length);
    const after = text.substring(index + searchValue.length);
    
    return (
      <>
        {before}
        <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>{match}</span>
        {after}
      </>
    );
  };

  return (
    <Modal
      title="选择行业分类"
      open={visible}
      onCancel={onClose}
      width={700}
      footer={[
        <Button key="cancel" onClick={onClose}>
          取消
        </Button>,
        isAdmin && originalText && (
          <Button 
            key="add" 
            icon={<PlusOutlined />}
            onClick={handleAddToDictionary}
            disabled={selectedKeys.length === 0}
          >
            添加到字典
          </Button>
        ),
        <Button key="confirm" type="primary" onClick={handleConfirm}>
          确定
        </Button>
      ]}
    >
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        {/* 原始文本提示 */}
        {originalText && (
          <div style={{ 
            padding: '8px 12px', 
            background: '#f0f2f5', 
            borderRadius: 4,
            fontSize: 13
          }}>
            <span style={{ color: '#666' }}>原始输入：</span>
            <span style={{ fontWeight: 500 }}>{originalText}</span>
          </div>
        )}

        {/* 搜索框 */}
        <Search
          placeholder="搜索行业名称"
          allowClear
          enterButton={<SearchOutlined />}
          onSearch={handleSearch}
          onChange={(e) => handleSearch(e.target.value)}
        />

        {/* 树形选择 */}
        <div style={{ 
          maxHeight: 400, 
          overflow: 'auto',
          border: '1px solid #d9d9d9',
          borderRadius: 4,
          padding: 12
        }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <Spin />
            </div>
          ) : treeData.length > 0 ? (
            <Tree
              treeData={treeData}
              expandedKeys={expandedKeys}
              selectedKeys={selectedKeys}
              autoExpandParent={autoExpandParent}
              onExpand={(keys) => {
                setExpandedKeys(keys);
                setAutoExpandParent(false);
              }}
              onSelect={handleSelect}
              showLine
              showIcon={false}
            />
          ) : (
            <Empty description="暂无数据" />
          )}
        </div>

        {/* 管理员提示 */}
        {isAdmin && originalText && (
          <div style={{ 
            padding: '8px 12px', 
            background: '#e6f7ff', 
            border: '1px solid #91d5ff',
            borderRadius: 4,
            fontSize: 12,
            color: '#666'
          }}>
            💡 提示：选择目标行业后，点击"添加到字典"可将"{originalText}"添加为该行业的关键词，
            以后系统会自动匹配。
          </div>
        )}
      </Space>
    </Modal>
  );
};

export default IndustrySelector;











