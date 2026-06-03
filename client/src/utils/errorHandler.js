/**
 * 统一错误处理工具
 */

import { message } from 'antd';

/**
 * 错误类型映射
 */
const ERROR_MESSAGES = {
  // 网络错误
  'Network Error': '网络连接失败，请检查网络设置',
  'timeout': '请求超时，请稍后重试',
  
  // 认证错误
  401: '登录已过期，请重新登录',
  403: '没有权限执行此操作',
  
  // 客户端错误
  400: '请求参数错误',
  404: '请求的资源不存在',
  
  // 服务器错误
  500: '服务器错误，请稍后重试',
  502: '网关错误',
  503: '服务暂时不可用',
};

/**
 * 处理 API 错误
 * @param {Error|Object} error - 错误对象
 * @param {string} defaultMessage - 默认错误消息
 * @returns {string} 错误消息
 */
export const handleApiError = (error, defaultMessage = '操作失败') => {
  console.error('API Error:', error);

  // 如果是字符串，直接返回
  if (typeof error === 'string') {
    return error;
  }

  // 处理 Axios 错误
  if (error.response) {
    const { status, data } = error.response;
    
    // 优先使用服务器返回的错误消息
    if (data && data.message) {
      return data.message;
    }
    
    // 使用预定义的错误消息
    if (ERROR_MESSAGES[status]) {
      return ERROR_MESSAGES[status];
    }
    
    return `请求失败 (${status})`;
  }

  // 处理网络错误
  if (error.request) {
    if (error.message === 'Network Error') {
      return ERROR_MESSAGES['Network Error'];
    }
    if (error.code === 'ECONNABORTED') {
      return ERROR_MESSAGES['timeout'];
    }
    return '网络请求失败，请检查网络连接';
  }

  // 处理业务错误
  if (error.message) {
    return error.message;
  }

  return defaultMessage;
};

/**
 * 显示错误消息
 * @param {Error|Object} error - 错误对象
 * @param {string} defaultMessage - 默认错误消息
 */
export const showError = (error, defaultMessage) => {
  const errorMessage = handleApiError(error, defaultMessage);
  message.error(errorMessage);
};

/**
 * 显示成功消息
 * @param {string} msg - 成功消息
 */
export const showSuccess = (msg) => {
  message.success(msg);
};

/**
 * 显示警告消息
 * @param {string} msg - 警告消息
 */
export const showWarning = (msg) => {
  message.warning(msg);
};

/**
 * 显示信息消息
 * @param {string} msg - 信息消息
 */
export const showInfo = (msg) => {
  message.info(msg);
};

/**
 * 显示加载中消息
 * @param {string} msg - 加载消息
 * @param {number} duration - 持续时间（秒），0 表示不自动关闭
 * @returns {Function} 关闭函数
 */
export const showLoading = (msg = '加载中...', duration = 0) => {
  return message.loading(msg, duration);
};

/**
 * 确认对话框
 * @param {Object} options - 配置选项
 * @returns {Promise}
 */
export const confirm = (options) => {
  return new Promise((resolve, reject) => {
    const { Modal } = require('antd');
    Modal.confirm({
      title: options.title || '确认操作',
      content: options.content || '确定要执行此操作吗？',
      okText: options.okText || '确定',
      cancelText: options.cancelText || '取消',
      onOk: () => resolve(true),
      onCancel: () => resolve(false),
      ...options
    });
  });
};

/**
 * 验证表单错误
 * @param {Object} error - 表单验证错误
 * @returns {string} 错误消息
 */
export const handleFormError = (error) => {
  if (error.errorFields && error.errorFields.length > 0) {
    const firstError = error.errorFields[0];
    return firstError.errors[0] || '请检查表单填写是否正确';
  }
  return '表单验证失败';
};

export default {
  handleApiError,
  showError,
  showSuccess,
  showWarning,
  showInfo,
  showLoading,
  confirm,
  handleFormError
};











