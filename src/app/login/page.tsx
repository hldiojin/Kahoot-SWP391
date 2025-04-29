'use client';

import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  InputAdornment,
  IconButton,
  styled,
  Link as MuiLink,
  Alert,
  Snackbar,
  CircularProgress
} from '@mui/material';
import { Visibility, VisibilityOff, ArrowBack } from '@mui/icons-material';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import axios from 'axios';

// Motion components - make sure these are only used on the client
const MotionContainer = motion(Container);
const MotionPaper = motion(Paper);
const MotionBox = motion(Box);
const MotionTextField = motion(TextField);
const MotionButton = motion(Button);

// Styled components
const LoginContainer = styled(MotionContainer)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '100vh',
  padding: theme.spacing(3),
}));

const LoginPaper = styled(MotionPaper)(({ theme }) => ({
  padding: theme.spacing(4),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  maxWidth: '450px',
  width: '100%',
  borderRadius: theme.shape.borderRadius * 2,
}));

const LoginTitle = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  fontWeight: 'bold',
  background: 'linear-gradient(45deg, #2196F3 30%, #9C27B0 90%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
}));

const LoginButton = styled(MotionButton)(({ theme }) => ({
  padding: theme.spacing(1.2),
  fontSize: '1rem',
  marginTop: theme.spacing(3),
  borderRadius: theme.shape.borderRadius * 2,
  textTransform: 'none',
  fontWeight: 'bold',
}));

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { 
      duration: 0.5,
      when: "beforeChildren",
      staggerChildren: 0.1
    } 
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { 
    y: 0, 
    opacity: 1,
    transition: { type: "spring", stiffness: 300, damping: 24 }
  }
};

const buttonVariants = {
  initial: { scale: 1 },
  hover: { scale: 1.05, transition: { duration: 0.2 } },
  tap: { scale: 0.95, transition: { duration: 0.2 } }
};

// API URL
const API_URL = 'https://kahootclone-f7hkd0hwafgbfrfa.southeastasia-01.azurewebsites.net';

export default function LoginPage() {
  // State for client-side rendering only
  const [mounted, setMounted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const router = useRouter();

  // Check if user is already logged in - moved to useEffect only
  useEffect(() => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        setIsLoggedIn(true);
        router.push('/dashboard');
      }
    } catch (e) {
      // Handle error silently
    }
    
    // Set mounted after checking local storage
    setMounted(true);
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    
    try {
      // Validate form
      if (!formData.email || !formData.password) {
        setError('Please fill in all fields');
        setIsSubmitting(false);
        return;
      }
      
      // Log request data for debugging
      console.log('Sending login request with:', {
        url: `${API_URL}/api/auth/login`,
        body: {
          email: formData.email,
          password: formData.password
        }
      });
      
      // Call the API with the exact request format
      try {
        const response = await axios.post(`${API_URL}/api/auth/login`, {
          email: formData.email,
          password: formData.password
        }, {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });
        
        console.log('API Response:', response.data);
        
        // Check if the response is successful (status: 1)
        if (response.data && response.data.status === 1 && response.data.data) {
          // The token is directly in the data field
          const token = response.data.data;
          
          // Save token to localStorage
          localStorage.setItem('token', token);
          
          // Set the default Authorization header for future requests
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          setShowSuccessMessage(true);
          
          // Redirect after successful login
          setTimeout(() => {
            router.push('/dashboard');
          }, 1500);
        } else {
          // Handle unsuccessful response with status != 1
          setError(response.data.message || 'Login failed');
        }
      } catch (err: any) {
        console.error('Login error:', err);
        
        if (err.response) {
          // Log detailed error info
          console.error('Error status:', err.response.status);
          console.error('Error headers:', err.response.headers);
          console.error('Error data:', err.response.data);
          
          // Handle different error responses
          const errorData = err.response.data;
          console.log('Error response data:', errorData);
          
          if (errorData && errorData.message) {
            setError(errorData.message);
          } else if (err.response.status === 400) {
            setError('Invalid credentials. Please check your email and password.');
          } else if (err.response.status === 401) {
            setError('Invalid email or password');
          } else {
            setError('Login failed. Please try again.');
          }
        } else if (err.request) {
          console.error('No response received:', err.request);
          setError('No response from server. Please check your internet connection.');
        } else {
          console.error('Error message:', err.message);
          setError('An error occurred during login');
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTogglePassword = () => {
    setShowPassword(prev => !prev);
  };

  // Demo credentials alert
  const demoCredentials = (
    <Alert severity="info" sx={{ mb: 2, width: '100%' }}>
      <Typography variant="body2">
        <strong>Demo credentials:</strong><br />
        Email: lamhoangdanh01@gmail.com<br />
        Password: 18012003
      </Typography>
    </Alert>
  );

  // Use simple, non-animated components for initial render to prevent hydration mismatch
  // Use a consistent structure between server and client renders
  return (
    <Container maxWidth={false} sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: 3
    }}>
      {mounted && (
        <Box sx={{ position: 'absolute', top: 20, left: 20 }}>
          <Button
            component={Link}
            href="/"
            startIcon={<ArrowBack />}
            sx={{ textTransform: 'none' }}
          >
            Back to Home
          </Button>
        </Box>
      )}

      <Paper elevation={3} sx={{
        padding: 4,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        maxWidth: '450px',
        width: '100%',
        borderRadius: 4,
      }}>
        <LoginTitle variant="h4">Log in to Blooket Clone</LoginTitle>
        
        {/* Only show these elements when client-side has mounted */}
        {mounted && (
          <>
            {demoCredentials}
            
            {error && (
              <Alert severity="error" sx={{ mb: 2, width: '100%' }}>
                {error}
              </Alert>
            )}
            
            <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                autoFocus
                value={formData.email}
                onChange={handleChange}
                sx={{ mb: 2 }}
                disabled={isSubmitting}
              />
              
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                id="password"
                autoComplete="current-password"
                value={formData.password}
                onChange={handleChange}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={handleTogglePassword}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                disabled={isSubmitting}
              />
              
              <Button
                type="submit"
                fullWidth
                variant="contained"
                color="primary"
                sx={{
                  padding: 1.2,
                  fontSize: '1rem',
                  marginTop: 3,
                  borderRadius: 4,
                  textTransform: 'none',
                  fontWeight: 'bold',
                }}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'Log In'
                )}
              </Button>
              
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <MuiLink 
                  component={Link} 
                  href="/forgot-password"
                  underline="hover"
                  sx={{ cursor: 'pointer' }}
                >
                  Forgot password?
                </MuiLink>
              </Box>
              
              <Box sx={{ mt: 3, textAlign: 'center' }}>
                <Typography variant="body2">
                  Don't have an account?{' '}
                  <MuiLink 
                    component={Link} 
                    href="/signup"
                    underline="hover"
                    sx={{ fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    Sign up
                  </MuiLink>
                </Typography>
              </Box>
            </Box>
          </>
        )}
      </Paper>
      
      <Snackbar
        open={showSuccessMessage}
        autoHideDuration={3000}
        onClose={() => setShowSuccessMessage(false)}
        message="Login successful! Redirecting..."
      />
    </Container>
  );
}