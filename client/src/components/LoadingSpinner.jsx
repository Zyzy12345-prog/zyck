import React from 'react';
import { Spin } from 'antd';
import './LoadingSpinner.css';

/**
 * 加载中组件
 * @param {boolean} spinning - 是否显示加载
 * @param {string} tip - 加载提示文字
 * @param {string} size - 大小 (small, default, large)
 * @param {boolean} fullscreen - 是否全屏显示
 * @param {React.ReactNode} children - 子组件
 */
const LoadingSpinner = ({ 
  spinning = true, 
  tip, 
  size = 'large', 
  fullscreen = false,
  children 
}) => {
  if (fullscreen) {
    return (
      <div className="loading-fullscreen">
        <Spin size={size} spinning={spinning}>
          {tip && <div className="loading-tip">{tip}</div>}
        </Spin>
      </div>
    );
  }

  if (children) {
    return (
      <Spin spinning={spinning} size={size} tip={tip}>
        {children}
      </Spin>
    );
  }

  return (
    <div className="loading-container">
      <Spin size={size} spinning={spinning}>
        {tip && <div className="loading-tip">{tip}</div>}
      </Spin>
    </div>
  );
};

export default LoadingSpinner;











