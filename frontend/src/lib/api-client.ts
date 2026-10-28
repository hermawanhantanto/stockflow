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
    let message = '';

    if (typeof rawError === 'string') {
      message = rawError;
    } else if (rawError?.code === 'INSUFFICIENT_STOCK') {
      message = `Insufficient stock: only ${rawError.available} available`;
    } else if (rawError?.message) {
      message = rawError.message;
    } else if (error.response?.data?.message) {
      message = error.response.data.message;
    } else if (error.message) {
      message = error.message;
    } else {
      message = 'An unexpected error occurred';
    }

    const customError = new Error(message);
    Object.assign(customError, {
      status: error.response?.status,
      data: error.response?.data,
      response: error.response,
    });
    return Promise.reject(customError);
  }
);
