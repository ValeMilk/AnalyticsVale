import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 120000,
});

// Logout automático ao receber 401 (token expirado/inválido)
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
