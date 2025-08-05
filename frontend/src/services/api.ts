import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { jwtDecode } from 'jwt-decode';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    const tokens = localStorage.getItem('tokens');
    if (tokens) {
      try {
        const parsedTokens = JSON.parse(tokens);
        if (parsedTokens.access) {
          config.headers = {
            ...config.headers,
            Authorization: `Bearer ${parsedTokens.access}`,
          };
        }
      } catch (error) {
        console.error('Error parsing tokens:', error);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // If the error is 401 and we haven't already tried to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const tokens = localStorage.getItem('tokens');
      if (tokens) {
        try {
          const parsedTokens = JSON.parse(tokens);
          
          // Check if refresh token is expired
          const isRefreshExpired = (token: string): boolean => {
            try {
              const decoded = jwtDecode(token);
              const currentTime = Date.now() / 1000;
              return decoded.exp ? decoded.exp < currentTime : true;
            } catch {
              return true;
            }
          };

          if (!isRefreshExpired(parsedTokens.refresh)) {
            // Try to refresh the token
            const response = await axios.post(
              `${process.env.REACT_APP_API_URL || 'http://localhost:8000/api'}/auth/token/refresh/`,
              { refresh: parsedTokens.refresh }
            );

            const newTokens = {
              access: response.data.access,
              refresh: parsedTokens.refresh,
            };

            // Update localStorage
            localStorage.setItem('tokens', JSON.stringify(newTokens));

            // Update the original request with new token
            originalRequest.headers.Authorization = `Bearer ${newTokens.access}`;

            // Retry the original request
            return api(originalRequest);
          }
        } catch (refreshError) {
          // If refresh fails, clear tokens and redirect to login
          localStorage.removeItem('tokens');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

// API service functions
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login/', { email, password }),
  
  register: (userData: any) =>
    api.post('/auth/register/', userData),
  
  logout: (refreshToken: string) =>
    api.post('/auth/logout/', { refresh_token: refreshToken }),
  
  refreshToken: (refreshToken: string) =>
    api.post('/auth/token/refresh/', { refresh: refreshToken }),
  
  getProfile: () => api.get('/auth/me/'),
  
  updateProfile: (userData: any) =>
    api.put('/auth/profile/', userData),
  
  changePassword: (passwordData: any) =>
    api.post('/auth/change-password/', passwordData),
};

export const tenantsAPI = {
  getTenants: () => api.get('/tenants/'),
  
  getTenant: (id: number) => api.get(`/tenants/${id}/`),
  
  createTenant: (tenantData: any) =>
    api.post('/tenants/', tenantData),
  
  updateTenant: (id: number, tenantData: any) =>
    api.put(`/tenants/${id}/`, tenantData),
  
  deleteTenant: (id: number) => api.delete(`/tenants/${id}/`),
};

export const plansAPI = {
  getPlans: () => api.get('/plans/'),
  
  getPlan: (id: number) => api.get(`/plans/${id}/`),
  
  createPlan: (planData: any) =>
    api.post('/plans/', planData),
  
  updatePlan: (id: number, planData: any) =>
    api.put(`/plans/${id}/`, planData),
  
  deletePlan: (id: number) => api.delete(`/plans/${id}/`),
};

export const subscriptionsAPI = {
  getSubscriptions: () => api.get('/subscriptions/'),
  
  getSubscription: (id: number) => api.get(`/subscriptions/${id}/`),
  
  createSubscription: (subscriptionData: any) =>
    api.post('/subscriptions/', subscriptionData),
  
  updateSubscription: (id: number, subscriptionData: any) =>
    api.put(`/subscriptions/${id}/`, subscriptionData),
  
  cancelSubscription: (id: number) =>
    api.delete(`/subscriptions/${id}/`),
};

export const billingAPI = {
  getInvoices: () => api.get('/billing/invoices/'),
  
  getInvoice: (id: number) => api.get(`/billing/invoices/${id}/`),
  
  processPayment: (paymentData: any) =>
    api.post('/billing/process-payment/', paymentData),
  
  getBillingHistory: () => api.get('/billing/history/'),
};

export const usersAPI = {
  getUsers: () => api.get('/users/'),
  
  getUser: (id: number) => api.get(`/users/${id}/`),
  
  createUser: (userData: any) =>
    api.post('/users/', userData),
  
  updateUser: (id: number, userData: any) =>
    api.put(`/users/${id}/`, userData),
  
  deleteUser: (id: number) => api.delete(`/users/${id}/`),
};

export { api }; 