'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import authService from '@/services/authService';

interface User {
  id: string;
  role: string;
  username?: string; // Thêm trường username
  name?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<any>;
  logout: () => void;
  register: (username: string, email: string, password: string) => Promise<any>;
  checkAuth: () => Promise<boolean>;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// API URL
const API_URL = 'https://kahootclone-f7hkd0hwafgbfrfa.southeastasia-01.azurewebsites.net';

// In the AuthProvider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Add client-side indicator
  const [isMounted, setIsMounted] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false); // Change initial value to false

  // Helper function to decode JWT
  const decodeToken = (token: string) => {
    try {
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
  };

  // Check for existing user session on mount - only client side
  useEffect(() => {
    setIsMounted(true);
    
    // Move the auth check to useEffect to run only on client
    const initialAuthCheck = async () => {
      setIsLoading(true);
      try {
        // Check for token in localStorage (only available on client)
        const token = localStorage.getItem('token');
        
        if (!token) {
          setIsLoading(false);
          return;
        }
        
        // Set authorization header
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Decode and check token
        const decodedToken = decodeToken(token);
        
        if (!decodedToken) {
          localStorage.removeItem('token');
          setIsLoading(false);
          return;
        }
        
        // Check if token has expired
        const currentTime = Math.floor(Date.now() / 1000);
        if (decodedToken.exp && decodedToken.exp < currentTime) {
          localStorage.removeItem('token');
          delete axios.defaults.headers.common['Authorization'];
          setIsLoading(false);
          return;
        }
        
        // Token is valid, update user
        setUser({
          id: decodedToken.nameid,
          role: decodedToken.role,
        });
      } catch (error) {
        console.error('Error during initial auth check:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    initialAuthCheck();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      
      // Call the API directly
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        email,
        password
      });
      
      console.log('Login response:', response.data);
      
      if (response.data && response.data.status === 1 && response.data.data) {
        const token = response.data.data;
        
        // Save token to localStorage
        localStorage.setItem('token', token);
        
        // Set the authorization header
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Decode token to get user info
        const decodedToken = decodeToken(token);
        
        if (decodedToken) {
          const userData = {
            id: decodedToken.nameid,
            role: decodedToken.role,
          };
          
          setUser(userData);
          return { success: true, user: userData };
        }
      }
      
      return { success: false, message: response.data?.message || 'Login failed' };
    } catch (error: any) {
      console.error('Login error:', error);
      
      if (error.response?.data?.message) {
        return { success: false, message: error.response.data.message };
      }
      
      return { success: false, message: 'An error occurred during login' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Gọi API logout thông qua authService
      await authService.logout();
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      // Luôn đảm bảo xóa dữ liệu người dùng cục bộ
      setUser(null);
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
    }
  };

  const register = async (username: string, email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await authService.register({ username, email, password });
      return { 
        success: response.status === 1,
        message: response.message,
        data: response.data
      };
    } catch (error: any) {
      console.error('Registration error:', error);
      
      if (error.response?.data?.message) {
        return { success: false, message: error.response.data.message };
      }
      
      return { success: false, message: 'An error occurred during registration' };
    } finally {
      setIsLoading(false);
    }
  };
  
  // Function to check if user is authenticated and token is valid
  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        return false;
      }
      
      // Set the authorization header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // You can add a call to a validation endpoint here if available
      // const response = await axios.get(`${API_URL}/api/auth/validate`);
      
      // For now, just check if token can be decoded
      const decodedToken = decodeToken(token);
      
      if (!decodedToken) {
        return false;
      }
      
      // Check if token has expired
      const currentTime = Math.floor(Date.now() / 1000);
      if (decodedToken.exp && decodedToken.exp < currentTime) {
        // Token has expired
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
        setUser(null);
        return false;
      }
      
      // Update user info from token if needed
      if (!user) {
        setUser({
          id: decodedToken.nameid,
          role: decodedToken.role,
        });
      }
      
      return true;
    } catch (error) {
      console.error('Error checking authentication:', error);
      return false;
    }
  };

  // Only provide the context value if client-side
  const contextValue = {
    user,
    isLoading,
    login,
    logout,
    register,
    checkAuth
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// HOC to protect routes
export const withAuth = (Component: React.ComponentType) => {
  return function WithAuth(props: any) {
    const { user, isLoading, checkAuth } = useAuth();
    const [isClient, setIsClient] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [authChecked, setAuthChecked] = useState(false);
    
    useEffect(() => {
      setIsClient(true);
      
      const validateAuth = async () => {
        const isValid = await checkAuth();
        setIsAuthenticated(isValid);
        setAuthChecked(true);
      };
      
      validateAuth();
    }, [checkAuth]);
    
    // If on server or loading, show loading state
    if (!isClient || isLoading || !authChecked) {
      return <div>Loading...</div>;
    }
    
    // If not authenticated, redirect to login
    if (!isAuthenticated) {
      // Use window.location for hard redirect to ensure auth state is cleared
      window.location.href = '/login';
      return null;
    }
    
    // User is authenticated, render the component
    return <Component {...props} />;
  };
};