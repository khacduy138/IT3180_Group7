import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = window.localStorage.getItem('bm_token');
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      'Request failed';

    return Promise.reject({
      message,
      status: error?.response?.status,
      data: error?.response?.data,
      original: error,
    });
  }
);

export function setAuthToken(token) {
  if (!token) {
    window.localStorage.removeItem('bm_token');
    return;
  }
  window.localStorage.setItem('bm_token', token);
}
