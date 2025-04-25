'use client';

import React, { createContext, useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/navigation';
import authService from '@/services/authService';

// Define user type
interface User {
  id: string;
  userName?: string;
  username?: string;
  email?: string;
  role?: string;
}

// Define register data type
interface RegisterData {
  username: string;
  email: string;
  password: string;
}

// Define context type
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{success: boolean; errorType?: string}>;
  register: (data: RegisterData) => Promise<{success: boolean; errorType?: string}>;
  logout: () => void;
  isAuthenticated: () => boolean;
}

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: async () => ({ success: false }),
  register: async () => ({ success: false }),
  logout: () => {},
  isAuthenticated: () => false
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Check for existing user on mount - only run on client side
  useEffect(() => {
    const getStoredUser = () => {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Error restoring auth state:', error);
        localStorage.removeItem('user');
      }
      setIsLoading(false);
    };

    if (typeof window !== 'undefined') {
      getStoredUser();
    } else {
      setIsLoading(false);
    }
  }, []);

  // Login function using the auth service
  const login = async (userName: string, password: string) => {
    try {
      // Input validation
      if (!userName.trim()) {
        return { success: false, errorType: 'username_required' };
      }
      
      if (!password) {
        return { success: false, errorType: 'password_required' };
      }
      
      // Call the actual API through authService
      const response = await authService.login({ userName, password });
      
      // Set user state with the returned user data
      setUser(response.user);
      
      // Save user data in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(response.user));
      }
      
      return { success: true };
    } catch (error: any) {
      // Handle specific error types
      if (error.response) {
        if (error.response.status === 401) {
          return { success: false, errorType: 'invalid_credentials' };
        } else if (error.response.status === 404) {
          return { success: false, errorType: 'user_not_found' };
        }
      }
      
      // Generic error
      return { success: false, errorType: 'server_error' };
    }
  };

  // Register function using auth service
  const register = async (data: RegisterData) => {
    try {
      // Input validation
      if (!data.username.trim()) {
        return { success: false, errorType: 'username_required' };
      }
      
      if (!data.email.trim()) {
        return { success: false, errorType: 'email_required' };
      }
      
      if (!data.password) {
        return { success: false, errorType: 'password_required' };
      }
      
      // Call the actual API through authService
      const response = await authService.register(data);
      
      // Set user state with the returned user data
      setUser(response.user);
      
      // Save user data in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(response.user));
      }
      
      return { success: true };
    } catch (error: any) {
      // Handle specific error types
      if (error.response) {
        if (error.response.status === 400) {
          if (error.response.data?.message?.includes('email')) {
            return { success: false, errorType: 'email_exists' };
          } else if (error.response.data?.message?.includes('username')) {
            return { success: false, errorType: 'username_exists' };
          }
        }
      }
      
      // Generic error
      return { success: false, errorType: 'server_error' };
    }
  };

  // Logout function
  const logout = () => {
    authService.logout();
    setUser(null);
    
    router.push('/');
  };

  // Check authentication status
  const isAuthenticated = () => {
    return authService.isAuthenticated();
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isLoading, 
      login, 
      register,
      logout,
      isAuthenticated 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};