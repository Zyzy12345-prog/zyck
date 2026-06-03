// 格式化日期
export const formatDate = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

// 格式化日期时间
export const formatDateTime = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// 格式化时长（秒转为分:秒）
export const formatDuration = (seconds) => {
  if (!seconds) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// 格式化金额
export const formatCurrency = (amount) => {
  if (!amount) return '¥0';
  return `¥${amount.toLocaleString('zh-CN')}`;
};

// 格式化电话号码
export const formatPhone = (phone) => {
  if (!phone) return '-';
  // 格式化为 xxx-xxxx-xxxx
  return phone.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
};

// 获取状态标签样式
export const getStatusBadgeClass = (status) => {
  const statusMap = {
    pending: 'badge-warning',
    processing: 'badge-info',
    completed: 'badge-success',
    cancelled: 'badge-error',
    active: 'badge-success',
    inactive: 'badge-error',
    suspended: 'badge-warning',
  };
  return statusMap[status] || 'badge-info';
};

// 获取状态文本
export const getStatusText = (status) => {
  const statusMap = {
    pending: '待处理',
    processing: '处理中',
    completed: '已完成',
    cancelled: '已取消',
    active: '活跃',
    inactive: '停用',
    suspended: '暂停',
    answered: '已接听',
    no_answer: '未接听',
    busy: '忙线',
    failed: '失败',
    inbound: '呼入',
    outbound: '呼出',
  };
  return statusMap[status] || status;
};

// 获取角色文本
export const getRoleText = (role) => {
  const roleMap = {
    admin: '管理员',
    manager: '经理',
    sales: '销售',
    operator: '操作员',
  };
  return roleMap[role] || role;
};

// 获取角色颜色
export const getRoleBadgeClass = (role) => {
  const roleMap = {
    admin: 'badge-error',
    manager: 'badge-warning',
    sales: 'badge-info',
    operator: 'badge-success',
  };
  return roleMap[role] || 'badge-info';
};

// 防抖函数
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// 节流函数
export const throttle = (func, limit) => {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// 复制到剪贴板
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy:', err);
    return false;
  }
};

// 下载文件
export const downloadFile = (url, filename) => {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// 验证邮箱
export const isValidEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

// 验证手机号
export const isValidPhone = (phone) => {
  const re = /^1[3-9]\d{9}$/;
  return re.test(phone);
};





