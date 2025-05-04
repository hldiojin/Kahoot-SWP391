'use client';

import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  Divider,
  Grow,
  useTheme,
  Container,
  Fade,
  Avatar,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  StarRate as StarRateIcon,
  AccessTime as AccessTimeIcon,
  EmojiEvents as TrophyIcon,
  Storage as StorageIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { useRouter, usePathname } from 'next/navigation';
import MainLayout from '../components/MainLayout';
import { useAuth, withAuth } from '../context/AuthContext';
import Image from 'next/image';

function UpgradeSuccessPage() {
  const theme = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [paymentVerified, setPaymentVerified] = useState(false);
  const [showAlert, setShowAlert] = useState(false);

  // Handle browser history and back button
  useEffect(() => {
    // This function will run when the component is mounted
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Cancel the event to show a confirmation dialog
      e.preventDefault();
      // Chrome requires returnValue to be set
      e.returnValue = '';
    };

    // Add event listener for page refresh
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Replace current history state to prevent going back to payment gateway
    if (window.history && typeof window.history.replaceState === 'function') {
      window.history.replaceState(null, '', pathname);
    }

    // Push a new state so that back button goes to dashboard
    if (window.history && typeof window.history.pushState === 'function') {
      window.history.pushState(null, '', pathname);
    }

    // Listen for popstate (back/forward buttons)
    const handlePopState = () => {
      // Navigate to dashboard when back button is pressed
      router.push('/dashboard');
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      // Clean up event listeners
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [pathname, router]);

  useEffect(() => {
    setMounted(true);
    
    // Check if the user came from a legitimate payment flow
    // This is a simple example - in production you would validate payment token from URL
    const queryParams = new URLSearchParams(window.location.search);
    const paymentStatus = queryParams.get('status');
    
    // Get payment start time from session storage to verify the flow
    const paymentStartTime = sessionStorage.getItem('paymentStartTime');
    const currentTime = Date.now();
    const paymentTimeValid = paymentStartTime && 
                             (currentTime - parseInt(paymentStartTime)) < 30 * 60 * 1000; // 30 minutes max
    
    if ((paymentStatus === 'success' && paymentTimeValid) || localStorage.getItem('paymentVerified') === 'true') {
      setPaymentVerified(true);
      localStorage.setItem('paymentVerified', 'true');
      localStorage.setItem('userIsPro', 'true');
      // Clear the payment start time to prevent reuse
      sessionStorage.removeItem('paymentStartTime');
      
      // Auto-redirect countdown
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            // Redirect to dashboard after countdown
            router.push('/dashboard');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(timer);
    } else {
      // If no payment verification, show alert
      setShowAlert(true);
      // Redirect to dashboard after short delay
      const timer = setTimeout(() => {
        router.push('/dashboard');
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [router]);

  // If not authenticated, redirect to login
  useEffect(() => {
    if (mounted && !isLoading && !user) {
      router.push('/login');
    }
  }, [mounted, isLoading, user, router]);

  if (!mounted || isLoading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        flexDirection: 'column',
        gap: 2
      }}>
        <CircularProgress size={60} />
        <Typography variant="h6">Verifying payment...</Typography>
      </Box>
    );
  }

  if (showAlert) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        p: 3
      }}>
        <Alert 
          severity="warning" 
          sx={{ maxWidth: 500 }}
          action={
            <Button 
              color="inherit" 
              size="small" 
              onClick={() => router.push('/dashboard')}
            >
              GO TO DASHBOARD
            </Button>
          }
        >
          Invalid payment verification. Redirecting you to the dashboard...
        </Alert>
      </Box>
    );
  }

  if (!paymentVerified) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        flexDirection: 'column',
        gap: 2
      }}>
        <CircularProgress size={60} />
        <Typography variant="h6">Verifying payment...</Typography>
      </Box>
    );
  }

  return (
    <MainLayout>
      <Container maxWidth="md">
        <Grow in={true} timeout={800}>
          <Paper
            elevation={3}
            sx={{
              p: 4,
              borderRadius: 4,
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden',
              background: 'linear-gradient(to bottom right, #FFFFFF, #FFFAF0)'
            }}
          >
            {/* Success badge */}
            <Box
              sx={{
                width: '100%',
                height: '8px',
                background: 'linear-gradient(90deg, #4CAF50 0%, #8BC34A 100%)',
                position: 'absolute',
                top: 0,
                left: 0
              }}
            />

            <Fade in={true} timeout={1200}>
              <Box>
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    backgroundColor: 'success.light',
                    borderRadius: '50%',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    margin: '0 auto 24px auto',
                    boxShadow: '0 6px 20px rgba(76, 175, 80, 0.4)'
                  }}
                >
                  <CheckCircleIcon sx={{ fontSize: 48, color: 'white' }} />
                </Box>

                <Typography variant="h4" component="h1" fontWeight="bold" color="success.main" gutterBottom>
                  Upgrade Successful!
                </Typography>

                <Typography variant="subtitle1" color="text.secondary" paragraph>
                  Thank you for upgrading to Pro Account. Your payment has been processed successfully.
                </Typography>

                {/* Trophy image */}
                <Box sx={{ mt: 2, mb: 3, display: 'flex', justifyContent: 'center' }}>
                  <Avatar
                    sx={{
                      width: 120,
                      height: 120,
                      bgcolor: 'warning.light',
                      border: '4px solid',
                      borderColor: 'warning.main',
                      boxShadow: '0 8px 20px rgba(255, 152, 0, 0.3)',
                    }}
                  >
                    <TrophyIcon sx={{ fontSize: 64, color: 'warning.dark' }} />
                  </Avatar>
                </Box>

                <Box sx={{ my: 4 }}>
                  <Paper
                    elevation={2}
                    sx={{
                      p: 3,
                      borderRadius: 3,
                      backgroundColor: 'rgba(255, 255, 255, 0.7)',
                      border: '1px solid',
                      borderColor: 'success.light',
                      maxWidth: 500,
                      mx: 'auto',
                      my: 3
                    }}
                  >
                    <Typography variant="h6" color="success.dark" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                      <StarRateIcon sx={{ mr: 1, color: 'warning.main' }} /> Your Pro Benefits
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Box sx={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <StarRateIcon fontSize="small" color="warning" sx={{ mr: 1.5 }} />
                        <Typography>Unlimited quizzes</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <TrophyIcon fontSize="small" color="warning" sx={{ mr: 1.5 }} />
                        <Typography>Advanced analytics & leaderboards</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <AccessTimeIcon fontSize="small" color="warning" sx={{ mr: 1.5 }} />
                        <Typography>Priority support (24h response)</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <StorageIcon fontSize="small" color="warning" sx={{ mr: 1.5 }} />
                        <Typography>Premium templates & advanced customization</Typography>
                      </Box>
                    </Box>
                  </Paper>
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Redirecting to dashboard in {countdown} seconds...
                </Typography>

                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  startIcon={<ArrowBackIcon />}
                  onClick={() => router.push('/dashboard')}
                  sx={{
                    borderRadius: 2,
                    py: 1.2,
                    px: 4,
                    fontWeight: 'bold',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    transition: 'all 0.3s',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 6px 25px rgba(0,0,0,0.18)',
                    }
                  }}
                >
                  Go to Dashboard
                </Button>
              </Box>
            </Fade>
          </Paper>
        </Grow>
      </Container>
    </MainLayout>
  );
}

export default withAuth(UpgradeSuccessPage); 