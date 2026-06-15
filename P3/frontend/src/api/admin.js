import axios from 'axios';

const adminClient = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

adminClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

adminClient.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

export const adminLogin = (data) => adminClient.post('/admin/login', data);
export const initAdmin = (adminCode) => adminClient.post('/admin/init', { adminCode });
export const getAdminDashboard = () => adminClient.get('/admin/dashboard');
export const getAdminUsers = (page = 0, size = 20) => adminClient.get(`/admin/users?page=${page}&size=${size}`);
export const deleteAdminUser = (userId) => adminClient.delete(`/admin/users/${userId}`);
export const getRefundPolicy = () => adminClient.get('/admin/refund-policy');
export const updateRefundPolicy = (threshold) => adminClient.put('/admin/refund-policy', { threshold });
