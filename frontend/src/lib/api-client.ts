import axios from 'axios';
import type { AxiosInstance } from 'axios';

export const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const rawError = error.response?.data?.error;
    const message =
      (typeof rawError === 'string' ? rawError : rawError?.message) ||
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred';
    const customError = new Error(message);
    Object.assign(customError, { status: error.response?.status });
    return Promise.reject(customError);
  }
);
