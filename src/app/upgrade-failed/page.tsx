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
  Stack,
  Avatar,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  ErrorOutline as ErrorOutlineIcon,
  ArrowBackIos as ArrowBackIosIcon,
  Refresh as RefreshIcon,
  LiveHelp as LiveHelpIcon,
  SentimentDissatisfied as SentimentDissatisfiedIcon
} from '@mui/icons-material';
import { useRouter, usePathname } from 'next/navigation';
import MainLayout from '../components/MainLayout';
import { useAuth, withAuth } from '../context/AuthContext';

function UpgradeFailedPage() {
  const theme = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [countdown, setCountdown] = useState(10);
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
    
    if ((paymentStatus === 'failed' && paymentTimeValid) || localStorage.getItem('paymentFailed') === 'true') {
      setPaymentVerified(true);
      localStorage.setItem('paymentFailed', 'true');
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
          Invalid page access. Redirecting you to the dashboard...
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
        <Typography variant="h6">Processing payment information...</Typography>
      </Box>
    );
  }

  const handleTryAgain = () => {
    router.push('/dashboard');
  };

  const handleContactSupport = () => {
    // This could open a support form or mailto link
    window.open('mailto:support@kahoot-clone.com?subject=Payment%20Issue', '_blank');
  };

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
              background: 'linear-gradient(to bottom right, #FFFFFF, #FFF5F5)'
            }}
          >
            {/* Error badge */}
            <Box
              sx={{
                width: '100%',
                height: '8px',
                background: 'linear-gradient(90deg, #F44336 0%, #E53935 100%)',
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
                    backgroundColor: 'error.light',
                    borderRadius: '50%',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    margin: '0 auto 24px auto',
                    boxShadow: '0 6px 20px rgba(244, 67, 54, 0.4)'
                  }}
                >
                  <ErrorOutlineIcon sx={{ fontSize: 48, color: 'white' }} />
                </Box>

                <Typography variant="h4" component="h1" fontWeight="bold" color="error.main" gutterBottom>
                  Payment Failed
                </Typography>

                <Typography variant="subtitle1" color="text.secondary" paragraph>
                  We couldn't process your payment for the Pro Account upgrade.
                </Typography>

                {/* Sad face visualization */}
                <Box sx={{ mt: 2, mb: 3, display: 'flex', justifyContent: 'center' }}>
                  <Avatar
                    sx={{
                      width: 100,
                      height: 100,
                      bgcolor: 'grey.200',
                      border: '3px solid',
                      borderColor: 'error.light',
                      boxShadow: '0 8px 15px rgba(0, 0, 0, 0.1)',
                    }}
                  >
                    <SentimentDissatisfiedIcon sx={{ fontSize: 60, color: 'text.secondary' }} />
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
                      borderColor: 'error.light',
                      maxWidth: 500,
                      mx: 'auto',
                      my: 3
                    }}
                  >
                    <Typography variant="h6" color="error.dark" sx={{ mb: 2 }}>
                      Possible reasons:
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Box sx={{ textAlign: 'left', ml: 2 }}>
                      <Typography component="ul" sx={{ listStyleType: 'disc', pl: 2 }}>
                        <li>Your card was declined by the payment processor</li>
                        <li>Insufficient funds in your account</li>
                        <li>Payment session timed out</li>
                        <li>Network connection issues during payment</li>
                        <li>Temporary technical issue with our payment system</li>
                      </Typography>
                    </Box>
                  </Paper>
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Redirecting to dashboard in {countdown} seconds...
                </Typography>

                <Stack 
                  direction={{ xs: 'column', sm: 'row' }} 
                  spacing={2}
                  justifyContent="center"
                  sx={{ mt: 2 }}
                >
                  <Button
                    variant="outlined"
                    color="inherit"
                    startIcon={<ArrowBackIosIcon />}
                    onClick={() => router.push('/dashboard')}
                    sx={{
                      borderRadius: 2,
                      py: 1.2,
                      px: 3,
                      fontWeight: 'medium'
                    }}
                  >
                    Back to Dashboard
                  </Button>
                  
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<LiveHelpIcon />}
                    onClick={handleContactSupport}
                    sx={{
                      borderRadius: 2,
                      py: 1.2,
                      px: 3,
                      fontWeight: 'medium'
                    }}
                  >
                    Contact Support
                  </Button>
                  
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<RefreshIcon />}
                    onClick={handleTryAgain}
                    sx={{
                      borderRadius: 2,
                      py: 1.2,
                      px: 3,
                      fontWeight: 'bold',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                      transition: 'all 0.3s',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 6px 25px rgba(0,0,0,0.18)',
                      }
                    }}
                  >
                    Try Again
                  </Button>
                </Stack>
              </Box>
            </Fade>
          </Paper>
        </Grow>
      </Container>
    </MainLayout>
  );
}

export default withAuth(UpgradeFailedPage); 