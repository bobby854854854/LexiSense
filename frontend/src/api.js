import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
};

// Contracts API
export const contractsAPI = {
  list: (params) => api.get('/contracts', { params }),
  get: (id) => api.get(`/contracts/${id}`),
  upload: (formData) => api.post('/contracts', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  bulkUpload: (formData) => api.post('/contracts/bulk', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  update: (id, data) => api.patch(`/contracts/${id}`, data),
  delete: (id) => api.delete(`/contracts/${id}`),
  chat: (id, question) => api.post(`/contracts/${id}/chat`, { question }),
};

// Team API
export const teamAPI = {
  listMembers: () => api.get('/team/members'),
  listInvitations: () => api.get('/team/invitations'),
  invite: (email, role) => api.post('/team/invite', { email, role }),
  cancelInvitation: (id) => api.delete(`/team/invitations/${id}`),
  updateRole: (memberId, role) => api.patch(`/team/members/${memberId}/role`, null, { params: { role } }),
  removeMember: (memberId) => api.delete(`/team/members/${memberId}`),
  acceptInvite: (token, password, firstName, lastName) => 
    api.post('/team/accept-invite', null, { params: { token, password, firstName, lastName } }),
};

// Dashboard API
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
  getActivity: () => api.get('/dashboard/activity'),
};

// Alerts API
export const alertsAPI = {
  getSettings: () => api.get('/alerts/settings'),
  updateSettings: (alertDays, emailEnabled) => 
    api.put('/alerts/settings', null, { params: { alertDays, emailEnabled } }),
  getExpiring: (days = 30) => api.get('/alerts/expiring', { params: { days } }),
  checkAndSend: () => api.post('/alerts/check-and-send'),
  getHistory: (limit = 50) => api.get('/alerts/history', { params: { limit } }),
};

// Contract Versions API
export const versionsAPI = {
  getVersions: (contractId) => api.get(`/contracts/${contractId}/versions`),
  getVersion: (contractId, versionNum) => api.get(`/contracts/${contractId}/versions/${versionNum}`),
  restore: (contractId, versionNum) => api.post(`/contracts/${contractId}/restore/${versionNum}`),
};

// Templates API
export const templatesAPI = {
  list: (params) => api.get('/templates', { params }),
  get: (id) => api.get(`/templates/${id}`),
  getDefault: () => api.get('/templates/default'),
  create: (data) => api.post('/templates', data),
  delete: (id) => api.delete(`/templates/${id}`),
};

// Export API
export const exportAPI = {
  contractPDF: (contractId) => api.get(`/export/contract/${contractId}/pdf`, { responseType: 'blob' }),
  analyticsPDF: () => api.get('/export/analytics/pdf', { responseType: 'blob' }),
};

// Analytics API
export const analyticsAPI = {
  getOverview: () => api.get('/analytics/overview'),
  compare: (id1, id2) => api.get(`/analytics/contracts/${id1}/compare/${id2}`),
};

// Workflow API
export const workflowAPI = {
  getStates: () => api.get('/contracts/workflow/states'),
  performAction: (contractId, action, comment) =>
    api.post(`/contracts/${contractId}/workflow/${action}`, null, { params: { comment } }),
  getHistory: (contractId) => api.get(`/contracts/${contractId}/workflow/history`),
};

// Notifications API
export const notificationsAPI = {
  list: (limit = 30) => api.get('/notifications', { params: { limit } }),
  unreadCount: () => api.get('/notifications/unread-count'),
  markRead: (id) => api.post(`/notifications/${id}/read`),
  markAllRead: () => api.post('/notifications/read-all'),
};

// Audit API
export const auditAPI = {
  list: (params) => api.get('/audit', { params }),
};

export default api;
