import axios, { AxiosInstance, AxiosError } from 'axios';
import Constants from 'expo-constants';

// Get API URL from environment or use default
const API_BASE_URL = Constants.expoConfig?.extra?.apiUrl || 
                     process.env.EXPO_PUBLIC_API_URL || 
                     'http://localhost:3000/api';

// Create axios instance with base configuration
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth tokens
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if available
    // const token = getAuthToken(); // Implement based on your auth strategy
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - redirect to login
      console.log('Unauthorized access - redirect to login');
    } else if (error.response?.status === 500) {
      // Handle server errors
      console.log('Server error occurred');
    }
    return Promise.reject(error);
  }
);

// API endpoints
export const api = {
  // Messages endpoints
  messages: {
    getAll: () => apiClient.get('/messages'),
    getById: (id: string) => apiClient.get(`/messages/${id}`),
    markAsRead: (id: string) => apiClient.patch(`/messages/${id}/read`),
    create: (data: any) => apiClient.post('/messages', data),
  },
  
  // Actions endpoints
  actions: {
    complete: (id: string) => apiClient.patch(`/actions/${id}/complete`),
    getByMessage: (messageId: string) => apiClient.get(`/messages/${messageId}/actions`),
  },
  
  // Notifications endpoints
  notifications: {
    registerDevice: (token: string) => apiClient.post('/notifications/register', { token }),
    updatePreferences: (preferences: any) => apiClient.patch('/notifications/preferences', preferences),
  },
  
  // User endpoints
  user: {
    getProfile: () => apiClient.get('/user/profile'),
    updateProfile: (data: any) => apiClient.patch('/user/profile', data),
    getSettings: () => apiClient.get('/user/settings'),
    updateSettings: (data: any) => apiClient.patch('/user/settings', data),
  },
};

export default apiClient;