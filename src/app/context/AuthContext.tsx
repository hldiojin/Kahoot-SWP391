'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  name?: string;
  firstName?: string; 
  lastName?: string;
  role: 'teacher' | 'student' | 'admin';
  createdAt: string;
  quizzes?: any[];
  isVerified: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  signup: (email: string, password: string, firstName: string, lastName: string, role: 'teacher' | 'student') => Promise<void>;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hardcoded teacher account for development
const hardcodedTeacher: User = {
  id: "teacher123",
  email: "teacher@example.com",
  firstName: "Teacher",
  lastName: "Demo",
  name: "Teacher Demo",
  role: "teacher",
  createdAt: new Date().toISOString(),
  quizzes: [],
  isVerified: true
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing user session on mount
  useEffect(() => {
    // Set loading while checking authentication
    setIsLoading(true);
    
    try {
      // For development: automatically use hardcoded teacher account
      setUser(hardcodedTeacher);
      localStorage.setItem('currentUser', JSON.stringify(hardcodedTeacher));
      localStorage.setItem('isAuthenticated', 'true');
      
      /* Uncomment this section when real authentication is needed
      const storedUser = localStorage.getItem('currentUser');
      const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
      
      if (isAuthenticated && storedUser) {
        setUser(JSON.parse(storedUser));
      }
      */
    } catch (error) {
      console.error('Error checking authentication:', error);
    } finally {
      // Always finish loading
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      
      // In a real app, this would be an API call
      // For demo purposes, we'll just accept any credentials and use our hardcoded teacher
      setUser(hardcodedTeacher);
      localStorage.setItem('currentUser', JSON.stringify(hardcodedTeacher));
      localStorage.setItem('isAuthenticated', 'true');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
    localStorage.removeItem('isAuthenticated');
    
    // In a real app, we might also invalidate tokens on the server, etc.
  };

  const signup = async (email: string, password: string, firstName: string, lastName: string, role: 'teacher' | 'student') => {
    try {
      setIsLoading(true);
      
      // In a real app, this would be an API call
      // For demo purposes, we'll just create a mock account
      const newUser: User = {
        id: 'user_' + Date.now().toString(),
        email,
        firstName,
        lastName,
        name: `${firstName} ${lastName}`,
        role,
        createdAt: new Date().toISOString(),
        quizzes: [],
        isVerified: true
      };
      
      setUser(newUser);
      localStorage.setItem('currentUser', JSON.stringify(newUser));
      localStorage.setItem('isAuthenticated', 'true');
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    isLoading,
    login,
    logout,
    signup
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
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
    const { user, isLoading } = useAuth();
    const [isClient, setIsClient] = useState(false);
    
    useEffect(() => {
      setIsClient(true);
    }, []);
    
    // Only render component if authenticated and on client
    if (!isClient || isLoading) {
      return null; // Return nothing during SSR or loading
    }
    
    // Skip authentication check for development
    return <Component {...props} />;
    
    /* Enable this when real auth is needed
    if (!user) {
      if (isClient) {
        // Only redirect on client side
        window.location.href = '/login';
      }
      return null;
    }
    
    return <Component {...props} />;
    */
  };
};