import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// 创建axios实例
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - 添加token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 处理错误
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // Token过期或无效，清除本地存储并跳转到登录页
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    if (error.response?.data) {
      const data = error.response.data;
      const msg = data.detail || data.sql || data.message || error.message;
      return Promise.reject({ ...data, message: msg });
    }
    return Promise.reject(error);
  }
);

// 认证相关API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getCurrentUser: () => api.get('/auth/me'),
  updatePassword: (data) => api.put('/auth/change-password', data),
  updateProfile: (data) => api.put('/auth/profile', data),
};

// 客户相关API
export const clientAPI = {
  getClients: (params) => api.get('/clients', { params }),
  getClient: (id) => api.get(`/clients/${id}`),
  createClient: (data) => api.post('/clients', data),
  updateClient: (id, data) => api.put(`/clients/${id}`, data),
  deleteClient: (id) => api.delete(`/clients/${id}`),
  assignClient: (data) => api.post('/clients/assign', data),
  importClients: (formData) => api.post('/clients/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

// 行业相关API
export const industryAPI = {
  // 查询
  getIndustriesTree: () => api.get('/clients/industries/tree'),
  getIndustriesList: (params) => api.get('/clients/industries/list', { params }),
  getIndustry: (id) => api.get(`/clients/industries/${id}`),
  
  // 匹配
  matchIndustry: (text, threshold = 0.7) => api.post('/clients/industries/match', { text, threshold }),
  batchMatchIndustries: (texts, threshold = 0.7) => api.post('/clients/industries/batch-match', { texts, threshold }),
  
  // 管理（管理员）
  createIndustry: (data) => api.post('/clients/industries', data),
  updateIndustry: (id, data) => api.put(`/clients/industries/${id}`, data),
  deleteIndustry: (id) => api.delete(`/clients/industries/${id}`),
  updateIndustryKeywords: (id, keywords) => api.put(`/clients/industries/${id}/keywords`, { keywords }),
  
  // 字典管理
  exportDictionary: () => api.get('/clients/industries/export'),
  importDictionary: (data) => api.post('/clients/industries/import', data),
  
  // 统计
  getStatistics: () => api.get('/clients/industries/statistics'),
  
  // 自学习功能
  getSuggestions: () => api.get('/clients/industries/suggestions'),
  approveSuggestion: (id) => api.post(`/clients/industries/suggestions/${id}/approve`),
  rejectSuggestion: (id) => api.post(`/clients/industries/suggestions/${id}/reject`),
  submitSuggestion: (data) => api.post('/clients/industries/suggestions', data),
  voteSuggestion: (id, vote) => api.post(`/clients/industries/suggestions/${id}/vote`, { vote }),
};

// 外呼记录相关API
export const callAPI = {
  getCalls: (params) => api.get('/calls', { params }),
  getCall: (id) => api.get(`/calls/${id}`),
  createCall: (data) => api.post('/calls', data),
  updateCall: (id, data) => api.put(`/calls/${id}`, data),
  deleteCall: (id) => api.delete(`/calls/${id}`),
  getStatistics: (params) => api.get('/calls/statistics', { params }),
};

// 用户相关API
export const userAPI = {
  getUsers: (params) => api.get('/users', { params }),
  getUser: (id) => api.get(`/users/${id}`),
  createUser: (data) => api.post('/users', data),
  updateUser: (id, data) => api.put(`/users/${id}`, data),
  deleteUser: (id) => api.delete(`/users/${id}`),
  getUserClients: (id, params) => api.get(`/users/${id}/clients`, { params }),
};

// 员工相关API
export const employeeAPI = {
  getEmployees: (params) => api.get('/employees', { params }),
  getEmployee: (id) => api.get(`/employees/${id}`),
  createEmployee: (data) => api.post('/employees', data),
  updateEmployee: (id, data) => api.put(`/employees/${id}`, data),
  deleteEmployee: (id) => api.delete(`/employees/${id}`),
  getEmployeeStats: (id) => api.get(`/employees/${id}/stats`),
  updateEmployeeStatus: (id, status) => api.patch(`/employees/${id}/status`, { status }),
  resetPassword: (id) => api.post(`/employees/${id}/reset-password`),
  uploadAvatar: (id, formData) => api.post(`/employees/${id}/avatar`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

// 角色相关API
export const roleAPI = {
  getRoles: (params) => api.get('/roles', { params }),
  getRole: (id) => api.get(`/roles/${id}`),
  createRole: (data) => api.post('/roles', data),
  updateRole: (id, data) => api.put(`/roles/${id}`, data),
  deleteRole: (id) => api.delete(`/roles/${id}`),
};

// 权限相关API
export const permissionAPI = {
  getPermissions: (params) => api.get('/permissions', { params }),
  getPermission: (id) => api.get(`/permissions/${id}`),
  createPermission: (data) => api.post('/permissions', data),
  updatePermission: (id, data) => api.put(`/permissions/${id}`, data),
  deletePermission: (id) => api.delete(`/permissions/${id}`),
};

// ==================== Phase 2: Sales Funnel & Customer Grading ====================

// 销售漏斗相关API
export const salesFunnelAPI = {
  // 销售阶段
  getStages: () => api.get('/sales-funnel/stages'),
  
  // 商机管理
  getOpportunities: (params) => api.get('/sales-funnel/opportunities', { params }),
  getOpportunitiesByStage: (params) => api.get('/sales-funnel/opportunities/by-stage', { params }),
  getOpportunity: (id) => api.get(`/sales-funnel/opportunities/${id}`),
  createOpportunity: (data) => api.post('/sales-funnel/opportunities', data),
  updateOpportunity: (id, data) => api.put(`/sales-funnel/opportunities/${id}`, data),
  deleteOpportunity: (id) => api.delete(`/sales-funnel/opportunities/${id}`),
  
  // 阶段管理
  moveOpportunityStage: (id, data) => api.put(`/sales-funnel/opportunities/${id}/move-stage`, data),
  markOpportunityWon: (id, data) => api.put(`/sales-funnel/opportunities/${id}/mark-won`, data),
  markOpportunityLost: (id, data) => api.put(`/sales-funnel/opportunities/${id}/mark-lost`, data),
  
  // 统计
  getFunnelStatistics: (params) => api.get('/sales-funnel/statistics', { params }),
};

// 客户标签相关API
export const customerTagAPI = {
  // 标签管理
  getTags: (params) => api.get('/customer-tags/tags', { params }),
  getTagCategories: () => api.get('/customer-tags/tags/categories'),
  getTagStatistics: () => api.get('/customer-tags/tags/statistics'),
  createTag: (data) => api.post('/customer-tags/tags', data),
  updateTag: (id, data) => api.put(`/customer-tags/tags/${id}`, data),
  deleteTag: (id) => api.delete(`/customer-tags/tags/${id}`),
  
  // 客户-标签关联
  addTagToClient: (data) => api.post('/customer-tags/client-tags', data),
  batchAddTagsToClient: (data) => api.post('/customer-tags/client-tags/batch', data),
  removeTagFromClient: (clientId, tagId) => api.delete(`/customer-tags/client-tags/${clientId}/${tagId}`),
  getClientTags: (clientId) => api.get(`/customer-tags/clients/${clientId}/tags`),
  getClientsByTag: (tagId, params) => api.get(`/customer-tags/tags/${tagId}/clients`, { params }),
};

// 客户评分相关API
export const clientScoringAPI = {
  // 评分计算
  calculateClientScore: (clientId) => api.post(`/client-scoring/clients/${clientId}/calculate-score`),
  batchCalculateScores: (clientIds) => api.post('/client-scoring/clients/batch-calculate-scores', { clientIds }),
  getClientScore: (clientId) => api.get(`/client-scoring/clients/${clientId}/score`),
  
  // 价值分析
  updateClientValueAnalysis: (clientId) => api.post(`/client-scoring/clients/${clientId}/update-value-analysis`),
  getClientValueAnalysis: (clientId) => api.get(`/client-scoring/clients/${clientId}/value-analysis`),
  
  // 等级查询
  getClientsByLevel: (level, params) => api.get(`/client-scoring/clients/level/${level}`, { params }),
  getLevelDistribution: () => api.get('/client-scoring/clients/level-distribution'),
  getHighValueClients: (params) => api.get('/client-scoring/clients/high-value', { params }),
  getAtRiskClients: (params) => api.get('/client-scoring/clients/at-risk', { params }),
};

// ==================== Phase 3: Analytics ====================

// 数据分析相关API
export const analyticsAPI = {
  // 销售数据分析
  getSalesAnalytics: (params) => api.get('/analytics/sales', { params }),
  
  // 客户分析
  getCustomerAnalytics: (params) => api.get('/analytics/customers', { params }),
  
  // 跟进效率分析
  getFollowUpAnalytics: (params) => api.get('/analytics/follow-ups', { params }),
  
  // 外呼数据分析
  getCallAnalytics: (params) => api.get('/analytics/calls', { params }),
};

// ==================== Phase 4: Customer Expansion ====================

// 客户线索相关API
export const customerLeadAPI = {
  getLeads: (params) => api.get('/leads', { params }),
  getLead: (id) => api.get(`/leads/${id}`),
  createLead: (data) => api.post('/leads', data),
  updateLead: (id, data) => api.put(`/leads/${id}`, data),
  deleteLead: (id) => api.delete(`/leads/${id}`),
  assignLead: (id, userId) => api.post(`/leads/${id}/assign`, { userId }),
  convertLead: (id) => api.post(`/leads/${id}/convert`),
  batchAssignLeads: (leadIds, userId) => api.post('/leads/batch-assign', { leadIds, userId }),
  batchUpdateStatus: (leadIds, status) => api.post('/leads/batch-update-status', { leadIds, status }),
  getStatistics: (params) => api.get('/leads/statistics', { params }),
  
  // 跟进记录
  getFollowUps: (leadId, params) => api.get(`/leads/${leadId}/follow-ups`, { params }),
  getFollowUpStatistics: (leadId) => api.get(`/leads/${leadId}/follow-ups/statistics`),
  createFollowUp: (leadId, data) => api.post(`/leads/${leadId}/follow-ups`, data),
  getFollowUp: (id) => api.get(`/follow-ups/${id}`),
  updateFollowUp: (id, data) => api.put(`/follow-ups/${id}`, data),
  deleteFollowUp: (id) => api.delete(`/follow-ups/${id}`),
  getPendingFollowUps: (params) => api.get('/follow-ups/pending', { params }),

  // 评分相关
  recalculateScore: (id) => api.post(`/leads/${id}/recalculate-score`),
  batchRecalculateScores: () => api.post('/leads/batch-recalculate-scores'),
  getScoringConfig: () => api.get('/leads/scoring-config'),
  updateScoringConfig: (config) => api.put('/leads/scoring-config', config),

  // 回收相关
  checkReclaimable: (params) => api.get('/leads/reclaim-check', { params }),
  batchReclaimLeads: (leadIds, reason) => api.post('/leads/batch-reclaim', { leadIds, reason }),
  getReclaimRules: () => api.get('/leads/reclaim-rules'),
  updateReclaimRules: (rules) => api.put('/leads/reclaim-rules', rules),

  // 导入导出
  exportLeads: (params) => api.get('/leads/export', { params, responseType: 'blob' }),
  importLeads: (formData) => api.post('/leads/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  downloadTemplate: () => api.get('/leads/template', { responseType: 'blob' }),
};

// 线索标签相关API
export const leadTagAPI = {
  getTags: (params) => api.get('/lead-tags/tags', { params }),
  getCategories: () => api.get('/lead-tags/tags/categories'),
  getStatistics: () => api.get('/lead-tags/tags/statistics'),
  createTag: (data) => api.post('/lead-tags/tags', data),
  updateTag: (id, data) => api.put(`/lead-tags/tags/${id}`, data),
  deleteTag: (id) => api.delete(`/lead-tags/tags/${id}`),
  
  // 线索-标签关联
  addTagToLead: (leadId, tagId) => api.post('/lead-tags/lead-tags', { leadId, tagId }),
  removeTagFromLead: (leadId, tagId) => api.delete('/lead-tags/lead-tags', { data: { leadId, tagId } }),
  batchAddTags: (leadIds, tagIds) => api.post('/lead-tags/lead-tags/batch', { leadIds, tagIds }),
  getLeadTags: (leadId) => api.get(`/lead-tags/leads/${leadId}/tags`),
  
  // 按标签搜索
  searchLeadsByTags: (params) => api.get('/lead-tags/leads/search/by-tags', { params }),
};

// 客户公海池相关API
export const customerPoolAPI = {
  getPoolClients: (params) => api.get('/customer-pool', { params }),
  addToPool: (data) => api.post('/customer-pool/add', data),
  claimClient: (id) => api.post(`/customer-pool/${id}/claim`),
  batchClaimClients: (poolIds) => api.post('/customer-pool/batch-claim', { poolIds }),
  updatePriority: (id, priority) => api.put(`/customer-pool/${id}/priority`, { priority }),
  getStatistics: () => api.get('/customer-pool/statistics'),
};

// 客户标签相关API (Phase 4 扩展)
export const tagAPI = {
  getTags: (params) => api.get('/customer-tags', { params }),
  createTag: (data) => api.post('/customer-tags', data),
  updateTag: (id, data) => api.put(`/customer-tags/${id}`, data),
  deleteTag: (id) => api.delete(`/customer-tags/${id}`),
  addTagToClient: (data) => api.post('/customer-tags/client-tags', data),
  removeTagFromClient: (data) => api.delete('/customer-tags/client-tags', { data }),
  batchAddTags: (data) => api.post('/customer-tags/batch-add', data),
  getClientTags: (clientId) => api.get(`/customer-tags/clients/${clientId}`),
  getStatistics: () => api.get('/customer-tags/statistics'),
  searchClientsByTags: (params) => api.get('/customer-tags/search-clients', { params }),
};

// 跟进提醒相关API
export const followUpReminderAPI = {
  // 提醒管理
  createReminder: (data) => api.post('/reminders', data),
  getReminders: (params) => api.get('/reminders', { params }),
  getUpcomingReminders: () => api.get('/reminders/upcoming'),
  getOverdueReminders: () => api.get('/reminders/overdue'),
  getReminderStatistics: () => api.get('/reminders/statistics'),
  markAsRead: (id) => api.put(`/reminders/${id}/read`),
  batchMarkAsRead: (ids) => api.put('/reminders/batch-read', { ids }),
  markAsCompleted: (id) => api.put(`/reminders/${id}/complete`),
  deleteReminder: (id) => api.delete(`/reminders/${id}`),
  
  // 跟进统计
  getFollowUpStatistics: (params) => api.get('/follow-up-statistics', { params })
};

// 外呼系统相关API
export const callSystemAPI = {
  // 外呼记录
  createCallRecord: (data) => api.post('/call/records', data),
  getCallRecords: (params) => api.get('/call/records', { params }),
  getCallRecord: (id) => api.get(`/call/records/${id}`),
  updateCallRecord: (id, data) => api.put(`/call/records/${id}`, data),
  deleteCallRecord: (id) => api.delete(`/call/records/${id}`),
  getCallStatistics: (params) => api.get('/call/records/statistics', { params }),
  getUserCallRanking: (params) => api.get('/call/records/ranking', { params }),
  
  // 外呼任务
  createCallTask: (data) => api.post('/call/tasks', data),
  getCallTasks: (params) => api.get('/call/tasks', { params }),
  getCallTask: (id) => api.get(`/call/tasks/${id}`),
  updateCallTask: (id, data) => api.put(`/call/tasks/${id}`, data),
  deleteCallTask: (id) => api.delete(`/call/tasks/${id}`),
  completeCallTask: (id) => api.put(`/call/tasks/${id}/complete`),
  cancelCallTask: (id) => api.put(`/call/tasks/${id}/cancel`),
  getMyCallTasks: (params) => api.get('/call/tasks/my', { params }),
  getTaskStatistics: (params) => api.get('/call/tasks/statistics', { params }),
  batchAssignTasks: (data) => api.post('/call/tasks/batch-assign', data),
  
  // 脚本模板
  createScriptTemplate: (data) => api.post('/call/templates', data),
  getScriptTemplates: (params) => api.get('/call/templates', { params }),
  getScriptTemplate: (id) => api.get(`/call/templates/${id}`),
  updateScriptTemplate: (id, data) => api.put(`/call/templates/${id}`, data),
  deleteScriptTemplate: (id) => api.delete(`/call/templates/${id}`),
  toggleScriptTemplate: (id) => api.put(`/call/templates/${id}/toggle`),
  getTemplateCategories: () => api.get('/call/templates/categories')
};

// 文件上传相关API
export const fileUploadAPI = {
  uploadFile: (formData) => api.post('/files/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  uploadMultiple: (formData) => api.post('/files/upload-multiple', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getFiles: (params) => api.get('/files', { params }),
  getFile: (id) => api.get(`/files/${id}`),
  downloadFile: (id) => api.get(`/files/${id}/download`, { responseType: 'blob' }),
  deleteFile: (id) => api.delete(`/files/${id}`)
};

// 聊天系统相关API
export const chatAPI = {
  // 聊天室管理
  getOrCreateRoom: (data) => api.post('/chat/rooms', data),
  getUserRooms: (params) => api.get('/chat/rooms', { params }),
  getRoomDetail: (roomId) => api.get(`/chat/rooms/${roomId}`),
  closeRoom: (roomId) => api.put(`/chat/rooms/${roomId}/close`),
  
  // 消息管理
  getRoomMessages: (roomId, params) => api.get(`/chat/rooms/${roomId}/messages`, { params }),
  sendMessage: (data) => api.post('/chat/messages', data),
  markAsRead: (roomId) => api.put(`/chat/rooms/${roomId}/read`)
};

// 联系客户（Mock 通讯适配层，正式上线替换为真实供应商）
export const communicationAPI = {
  list: (params) => api.get('/communications', { params }),
  mockCall: (data) => api.post('/communications/mock/call', data),
  mockSms: (data) => api.post('/communications/mock/sms', data),
  mockEmail: (data) => api.post('/communications/mock/email', data),
  mockWechat: (data) => api.post('/communications/mock/wechat', data),
  mockChat: (data) => api.post('/communications/mock/chat', data)
};

export default api;
