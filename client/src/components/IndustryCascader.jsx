import React, { useState, useEffect } from 'react';
import { Cascader, Spin, message } from 'antd';
import { industryAPI } from '../../services/api';

/**
 * 行业级联选择器组件
 * 支持三级行业分类选择
 */
const IndustryCascader = ({ value, onChange, placeholder = '请选择行业', style, disabled }) => {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadIndustryTree();
  }, []);

  // 加载行业树形数据
  const loadIndustryTree = async () => {
    setLoading(true);
    try {
      const response = await industryAPI.getIndustriesTree();
      if (response.success) {
        const treeOptions = buildCascaderOptions(response.data);
        setOptions(treeOptions);
      }
    } catch (error) {
      message.error('加载行业分类失败：' + (error.message || '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  // 构建级联选择器选项
  const buildCascaderOptions = (treeData) => {
    return treeData.map(node => ({
      value: node.id,
      label: node.name,
      children: node.children && node.children.length > 0 
        ? buildCascaderOptions(node.children)
        : undefined
    }));
  };

  // 处理选择变化
  const handleChange = (selectedValues) => {
    if (selectedValues && selectedValues.length > 0) {
      // 返回最后一级的ID
      const industryId = selectedValues[selectedValues.length - 1];
      onChange?.(industryId);
    } else {
      onChange?.(null);
    }
  };

  // 查找选中路径
  const findPath = (id, tree, path = []) => {
    for (const node of tree) {
      const currentPath = [...path, node.id];
      if (node.id === id) {
        return currentPath;
      }
      if (node.children && node.children.length > 0) {
        const result = findPath(id, node.children, currentPath);
        if (result) return result;
      }
    }
    return null;
  };

  // 获取当前值的路径
  const getCurrentValue = () => {
    if (!value || options.length === 0) return undefined;
    
    // 从树形数据中查找路径
    const flatTree = flattenTree(options);
    return findPath(value, flatTree);
  };

  // 扁平化树形数据
  const flattenTree = (tree) => {
    const result = [];
    const traverse = (nodes) => {
      nodes.forEach(node => {
        result.push({
          id: node.value,
          children: node.children || []
        });
        if (node.children) {
          traverse(node.children);
        }
      });
    };
    traverse(tree);
    return result;
  };

  return (
    <Cascader
      options={options}
      value={getCurrentValue()}
      onChange={handleChange}
      placeholder={placeholder}
      style={style}
      disabled={disabled || loading}
      showSearch={{
        filter: (inputValue, path) =>
          path.some(option => 
            option.label.toLowerCase().includes(inputValue.toLowerCase())
          )
      }}
      changeOnSelect={false}
      expandTrigger="hover"
      notFoundContent={loading ? <Spin size="small" /> : '暂无数据'}
    />
  );
};

export default IndustryCascader;











