'use client';

import React, { createContext, useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/navigation';

// Define user type
interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
}

// Define context type
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{success: boolean; errorType?: string}>;
  signup: (userData: SignupData) => Promise<{success: boolean; errorType?: string}>;
  logout: () => void;
}

// Signup data type
interface SignupData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: 'student' | 'teacher' | 'admin';
}

// Hard-coded users for demonstration
const DEMO_USERS: User[] = [
  {
    id: '1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    role: 'teacher'
  },
  {
    id: '2',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane@example.com',
    role: 'student'
  }
];

// Hard-coded passwords (in a real app, NEVER store passwords like this)
const DEMO_PASSWORDS: Record<string, string> = {
  'john@example.com': 'password123',
  'jane@example.com': 'password123'
};

// Create context with default values to prevent null checks
const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: async () => ({ success: false }),
  signup: async () => ({ success: false }),
  logout: () => {}
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Check for existing user on mount - only run on client side
  useEffect(() => {
    // Get stored user from localStorage
    const getStoredUser = () => {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Error restoring auth state:', error);
        localStorage.removeItem('user'); // Clear corrupted data
      }
      setIsLoading(false);
    };

    // Only run on client-side to prevent hydration mismatch
    if (typeof window !== 'undefined') {
      getStoredUser();
    } else {
      // On server-side, just mark as not loading without trying to access localStorage
      setIsLoading(false);
    }
  }, []);

  // Login function with improved error handling
  const login = async (email: string, password: string) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Input validation
    if (!email.trim()) {
      return { success: false, errorType: 'email_required' };
    }
    
    if (!password) {
      return { success: false, errorType: 'password_required' };
    }
    
    // Check if user exists
    const foundUser = DEMO_USERS.find(user => user.email.toLowerCase() === email.toLowerCase());
    
    // User doesn't exist
    if (!foundUser) {
      return { success: false, errorType: 'invalid_email' };
    }
    
    // Check if password matches
    if (DEMO_PASSWORDS[foundUser.email] !== password) {
      return { success: false, errorType: 'invalid_password' };
    }
    
    // Success - set user and save to localStorage
    setUser(foundUser);
    
    // Only use localStorage on the client
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(foundUser));
    }
    
    return { success: true };
  };

  // Signup function with improved error handling
  const signup = async (userData: SignupData) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Input validation
    if (!userData.email.trim()) {
      return { success: false, errorType: 'email_required' };
    }
    
    if (!userData.password) {
      return { success: false, errorType: 'password_required' };
    }
    
    if (!userData.firstName.trim() || !userData.lastName.trim()) {
      return { success: false, errorType: 'name_required' };
    }
    
    // Check if email already exists (case insensitive)
    const emailExists = DEMO_USERS.some(
      user => user.email.toLowerCase() === userData.email.toLowerCase()
    );
    
    if (emailExists) {
      return { success: false, errorType: 'email_exists' };
    }
    
    // Create new user (in a real app, this would be a database operation)
    const newUser: User = {
      id: Date.now().toString(), // Generate a dummy ID
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      role: userData.role
    };
    
    // Update our demo arrays (this is just for demonstration)
    // In a real app, you'd call your API here
    DEMO_USERS.push(newUser);
    DEMO_PASSWORDS[userData.email] = userData.password;
    
    // Log the user in
    setUser(newUser);
    
    // Only use localStorage on the client
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(newUser));
    }
    
    return { success: true };
  };

  // Logout function
  const logout = () => {
    setUser(null);
    
    // Only use localStorage on the client
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
    }
    
    router.push('/');
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout }}>
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

// Example: Add a function to check if a user can create a game
const canCreateGame = (role: 'student' | 'teacher' | 'admin') => {
  return role === 'student' || role === 'teacher' || role === 'admin';
};

// Use this function where necessary to check permissions
// For example, in a component where game creation is handled, you might do:
// if (!canCreateGame(user.role)) {
//   // Show an error or redirect
// }