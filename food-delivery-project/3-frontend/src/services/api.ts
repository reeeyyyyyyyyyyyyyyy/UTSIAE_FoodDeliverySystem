import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - only redirect if not already on login/register page
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: async (data: { name: string; email: string; password: string; phone?: string }) => {
    const response = await api.post('/users/auth/register', data);
    return response.data;
  },
  login: async (data: { email: string; password: string }) => {
    const response = await api.post('/users/auth/login', data);
    return response.data;
  },
};

// User API
export const userAPI = {
  getProfile: async () => {
    const response = await api.get('/users/profile/me');
    return response.data;
  },
  getAddresses: async () => {
    const response = await api.get('/users/addresses');
    return response.data;
  },
  createAddress: async (data: { label: string; full_address: string; latitude?: number; longitude?: number; is_default?: boolean }) => {
    const response = await api.post('/users/addresses', data);
    return response.data;
  },
};

// Restaurant API
export const restaurantAPI = {
  getRestaurants: async (cuisineType?: string) => {
    const params = cuisineType ? { cuisine_type: cuisineType } : {};
    const response = await api.get('/restaurants', { params });
    return response.data;
  },
  getRestaurantMenu: async (restaurantId: number) => {
    const response = await api.get(`/restaurants/${restaurantId}/menu`);
    return response.data;
  },
};

// Order API
export const orderAPI = {
  createOrder: async (data: { restaurant_id: number; address_id: number; items: Array<{ menu_item_id: number; quantity: number }> }) => {
    const response = await api.post('/orders', data);
    return response.data;
  },
  getOrders: async () => {
    const response = await api.get('/orders');
    return response.data;
  },
  getOrderById: async (orderId: number) => {
    const response = await api.get(`/orders/${orderId}`);
    return response.data;
  },
};

// Payment API
export const paymentAPI = {
  simulatePayment: async (data: { order_id: number; payment_id: number; payment_method?: string }) => {
    const response = await api.post('/payments/simulate', data);
    return response.data;
  },
};

// Fix: Add simulatePayment to orderAPI for backward compatibility (but use paymentAPI instead)
export const orderAPIWithPayment = {
  ...orderAPI,
  simulatePayment: paymentAPI.simulatePayment,
};

export default api;

