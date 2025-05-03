import axios from 'axios';

const API_BASE_URL = 'https://kahootclone-f7hkd0hwafgbfrfa.southeastasia-01.azurewebsites.net';

// Helper to check if we're in a browser context
const isBrowser = typeof window !== 'undefined';

// Safe storage access functions
const safeGetItem = (key: string): string | null => {
  if (isBrowser) {
    return localStorage.getItem(key);
  }
  return null;
};

const safeSetItem = (key: string, value: string): void => {
  if (isBrowser) {
    localStorage.setItem(key, value);
  }
};

const safeRemoveItem = (key: string): void => {
  if (isBrowser) {
    localStorage.removeItem(key);
  }
};

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    // Only access localStorage on the client side
    const token = safeGetItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    // Only run this logic on the client side
    if (isBrowser) {
      // For successful responses, extract the token if it exists in the data field
      if (response.data && 
          response.data.status === 1 && 
          response.data.data && 
          typeof response.data.data === 'string' && 
          response.config.url?.includes('/api/auth/login')) {
        // This appears to be a login response with a token
        const token = response.data.data;
        safeSetItem('token', token);
        
        // Set the default Authorization header for future requests
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
    }
    return response;
  },
  (error) => {
    // Only run this logic on the client side
    if (isBrowser && error.response && error.response.status === 401) {
      // Handle unauthorized access (e.g., redirect to login)
      safeRemoveItem('token');
      safeRemoveItem('user');
      // You could add window.location.href = '/login'; here if you want automatic redirect
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;