import axios from 'axios';

const API_BASE_URL = 'https://kahootclone-f7hkd0hwafgbfrfa.southeastasia-01.azurewebsites.net';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor
axiosInstance.interceptors.request.use(
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

// Add a response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    // For successful responses, extract the token if it exists in the data field
    if (response.data && 
        response.data.status === 1 && 
        response.data.data && 
        typeof response.data.data === 'string' && 
        response.config.url?.includes('/api/auth/login')) {
      // This appears to be a login response with a token
      const token = response.data.data;
      localStorage.setItem('token', token);
      
      // Set the default Authorization header for future requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    return response;
  },
  (error) => {
    // Handle errors (e.g., 401 Unauthorized)
    if (error.response && error.response.status === 401) {
      // Handle unauthorized access (e.g., redirect to login)
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // You could add window.location.href = '/login'; here if you want automatic redirect
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;