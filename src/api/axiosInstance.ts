import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://swp391kahootclone-emgyasc9g0e2athc.southeastasia-01.azurewebsites.net';

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
  (response) => response,
  (error) => {
    // Handle errors (e.g., 401 Unauthorized)
    if (error.response && error.response.status === 401) {
      // Handle unauthorized access (e.g., redirect to login)
      localStorage.removeItem('token');
      // You could add window.location.href = '/login'; here if you want automatic redirect
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;