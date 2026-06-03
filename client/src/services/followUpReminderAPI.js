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
  getFollowUpStatistics: (params) => api.get('/follow-ups/statistics', { params })
};








