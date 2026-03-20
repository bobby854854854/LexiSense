// client/src/lib/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://lexisense-api.onrender.com',   // ← Your live backend
  withCredentials: true,   // important for sessions/cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auto-attach CSRF token if present
api.interceptors.request.use((config) => {
  const csrfToken = document.cookie
    .split('; ')
    .find(row => row.startsWith('XSRF-TOKEN='))
    ?.split('=')[1];

  if (csrfToken) {
    config.headers['X-CSRF-Token'] = csrfToken;
  }
  return config;
});

export default api;