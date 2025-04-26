import axiosInstance from '@/api/axiosInstance';
import axios from 'axios';

interface LoginCredentials {
  email: string;
  password: string;
}

interface LoginResponse {
  data: string; 
  message: string;
  status: any;
}

interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
}

interface RegisterResponse {
  status: number;
  message: string;
  data: {
    username: string;
    email: string;
    password: string;
  };
}

interface UserProfile {
  id: number;
  username: string;
  email: string;
}

const authService = {
  /**
   * Login user with email and password
   * @param credentials User login credentials
   * @returns Promise with login response
   */
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    try {
      const response = await axiosInstance.post('/api/auth/login', credentials);
      
      // Store the token in localStorage for future requests
      if (response.data && response.data.data) {
        const token = response.data.data;
        localStorage.setItem('token', token);
        
        // Set the default Authorization header for future requests
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
      
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Register a new user
   * @param credentials User registration data
   * @returns Promise with register response
   */
  register: async (credentials: RegisterCredentials): Promise<RegisterResponse> => {
    try {
      const response = await axiosInstance.post('/api/auth/register', credentials);
      
      // Success is determined by the status field
      if (response.data && response.data.status === 1) {
        console.log('Registration successful:', response.data);
      }
      
      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  /**
   * Logout user by calling API and removing token
   * @returns Promise with logout response
   */
  logout: async (): Promise<{status: number, message: string, data: any}> => {
    try {
      // Lưu token hiện tại để xóa khỏi header
      const token = localStorage.getItem('token');
      
      // Xóa token và thông tin người dùng từ local storage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Xóa authorization header
      delete axios.defaults.headers.common['Authorization'];
      
      // Nếu không có token, không cần gọi API
      if (!token) {
        return { status: 1, message: "Logged out successfully (no token).", data: null };
      }
      
      // Thêm lại token vào header tạm thời để gọi API logout
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Gọi API logout
      const response = await axiosInstance.post('/api/auth/logout');
      
      // Đảm bảo xóa header authorization sau khi gọi API
      delete axios.defaults.headers.common['Authorization'];
      
      return response.data;
    } catch (error) {
      console.error('Logout error:', error);
      
      // Đảm bảo xóa header authorization khi có lỗi
      delete axios.defaults.headers.common['Authorization'];
      
      // Trả về thông báo lỗi nhưng vẫn coi như đã đăng xuất
      return { status: 0, message: "Logout failed, but local session cleared.", data: null };
    }
  },

  /**
   * Check if user is authenticated
   * @returns boolean indicating authentication status
   */
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('token');
  },

  /**
   * Get the current JWT token
   * @returns The JWT token or null if not logged in
   */
  getToken: (): string | null => {
    return localStorage.getItem('token');
  },

  /**
   * Get the JWT payload data
   * @returns Decoded JWT payload or null
   */
  getTokenPayload: () => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    
    try {
      // JWT format: header.payload.signature
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      
      return JSON.parse(jsonPayload);
    } catch (e) {
      console.error('Error decoding token:', e);
      return null;
    }
  },

  /**
   * Get user information from the JWT token
   */
  getCurrentUser: () => {
    const payload = authService.getTokenPayload();
    if (!payload) return null;
    
    // Based on your token structure, extract user information
    return {
      id: payload.nameid,
      role: payload.role
    };
  },

  /**
   * Get current user profile
   * @returns Promise with user profile data
   */
  getCurrentUserProfile: async (): Promise<UserProfile> => {
    try {
      const response = await axiosInstance.get('/api/auth/me');
      return response.data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  }
};

export default authService;