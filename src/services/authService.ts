import axiosInstance from '@/api/axiosInstance';

interface LoginCredentials {
  userName: string;
  password: string;
}

interface LoginResponse {
  token: string;
  user: {
    id: string;
    userName: string;
  };
}

interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
}

interface RegisterResponse {
  token: string;
  user: {
    id: string;
    username: string;
    email: string;
  };
}

const authService = {
  /**
   * Login user with username and password
   * @param credentials User login credentials
   * @returns Promise with login response
   */
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    try {
      const response = await axiosInstance.post('/api/auth/login', credentials);
      
      // Store the token in localStorage for future requests
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
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
      
      // Store the token in localStorage for future requests if login is automatic
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
      }
      
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Logout user by removing token
   */
  logout: (): void => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  /**
   * Check if user is authenticated
   * @returns boolean indicating authentication status
   */
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('token');
  },
};

export default authService;