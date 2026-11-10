import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor to add JWT Authorization header
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('attendance_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor to handle session expiration or unauthorized response
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If unauthorized and not already on auth page, clear token and redirect
      if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/forgot-password')) {
        localStorage.removeItem('attendance_token');
        localStorage.removeItem('attendance_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

