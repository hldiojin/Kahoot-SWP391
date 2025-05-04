'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from './context/AuthContext';

// List of protected routes
const PROTECTED_ROUTES = [
  '/dashboard',
  '/my-sets',
  '/create-game',
  '/upgrade-success',
  '/upgrade-failed',
  '/profile',
];

// Routes that require special access conditions
const SPECIAL_ROUTES: Record<string, (localStorage: Storage, sessionStorage: Storage) => boolean> = {
  '/upgrade-success': (localStorage: Storage, sessionStorage: Storage) => {
    return localStorage.getItem('paymentVerified') === 'true' || 
           (sessionStorage.getItem('paymentStartTime') !== null);
  },
  '/upgrade-failed': (localStorage: Storage, sessionStorage: Storage) => {
    return localStorage.getItem('paymentFailed') === 'true' || 
           (sessionStorage.getItem('paymentStartTime') !== null);
  }
};

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Skip during initial loading
    if (isLoading) return;

    // Function to check if route requires auth
    const isProtectedRoute = PROTECTED_ROUTES.some(route => 
      pathname === route || pathname.startsWith(`${route}/`)
    );

    // Check if route has special conditions
    const checkSpecialConditions = () => {
      // We need to check if window is defined since this is used in a SSR environment
      if (typeof window === 'undefined') return true;
      
      // Get the special check function for this route
      const specialCheck = Object.entries(SPECIAL_ROUTES).find(([route]) => 
        pathname === route || pathname.startsWith(`${route}/`)
      );

      // If no special check, allow access
      if (!specialCheck) return true;

      // Run the special check function with localStorage and sessionStorage
      return specialCheck[1](localStorage, sessionStorage);
    };

    // Handle redirection logic
    if (isProtectedRoute) {
      // If user is not authenticated, redirect to login
      if (!user) {
        console.log('User not authenticated, redirecting to login');
        router.replace('/login');
      } 
      // If route has special conditions, check them
      else if (!checkSpecialConditions()) {
        console.log('Special conditions not met, redirecting to dashboard');
        router.replace('/dashboard');
      }
    } else if (pathname === '/login' || pathname === '/signup') {
      // If user is already authenticated and tries to access login/signup, redirect to dashboard
      if (user) {
        console.log('User already authenticated, redirecting to dashboard');
        router.replace('/dashboard');
      }
    }
  }, [user, pathname, isLoading, router]);

  // Show nothing during initial authentication check
  if (isLoading) {
    return null;
  }

  return <>{children}</>;
}

export default RouteGuard; 