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
  CircularProgress,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  FormLabel
} from '@mui/material';
import { Visibility, VisibilityOff, ArrowBack } from '@mui/icons-material';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import axios from 'axios';

// Motion components
const MotionContainer = motion(Container);
const MotionPaper = motion(Paper);
const MotionBox = motion(Box);
const MotionTextField = motion(TextField);
const MotionButton = motion(Button);

// Styled components
const SignupContainer = styled(MotionContainer)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '100vh',
  padding: theme.spacing(3),
}));

const SignupPaper = styled(MotionPaper)(({ theme }) => ({
  padding: theme.spacing(4),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  maxWidth: '500px',
  width: '100%',
  borderRadius: theme.shape.borderRadius * 2,
}));

const SignupTitle = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  fontWeight: 'bold',
  background: 'linear-gradient(45deg, #2196F3 30%, #9C27B0 90%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
}));

const SignupButton = styled(MotionButton)(({ theme }) => ({
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

export default function SignupPage() {
  // State for client-side rendering only
  const [mounted, setMounted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const router = useRouter();

  // Check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      router.push('/dashboard');
    }
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
      if (!formData.username || !formData.email || !formData.password || !formData.confirmPassword) {
        setError('Please fill in all fields');
        setIsSubmitting(false);
        return;
      }
      
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        setIsSubmitting(false);
        return;
      }
      
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters long');
        setIsSubmitting(false);
        return;
      }
      
      // Call the API with the exact request format
      const response = await axios.post(`${API_URL}/api/auth/register`, {
        username: formData.username,
        email: formData.email,
        password: formData.password
      });
      
      console.log('API Response:', response.data);
      
      // Check if the response is successful (status: 1)
      if (response.data && response.data.status === 1) {
        setShowSuccessMessage(true);
        
        // Redirect after successful signup
        setTimeout(() => {
          router.push('/login');
        }, 1500);
      } else {
        // Handle unsuccessful response with status != 1
        setError(response.data.message || 'Registration failed');
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      
      if (err.response) {
        // Handle different error responses
        const errorData = err.response.data;
        console.log('Error response data:', errorData);
        
        if (errorData && errorData.message) {
          setError(errorData.message);
        } else if (err.response.status === 409) {
          setError('Email is already in use');
        } else if (err.response.status === 400) {
          setError('Invalid registration data. Please check your information.');
        } else {
          setError('Registration failed. Please try again.');
        }
      } else if (err.request) {
        setError('No response from server. Please check your internet connection.');
      } else {
        setError('An error occurred during registration');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTogglePassword = () => {
    setShowPassword(prev => !prev);
  };

  // If not mounted yet, render a simple version for SSR
  if (!mounted) {
    return (
      <Container maxWidth={false} sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: 3
      }}>
        <Paper elevation={3} sx={{
          padding: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          maxWidth: '500px',
          width: '100%',
          borderRadius: 4,
        }}>
          <SignupTitle variant="h4">Create your account</SignupTitle>
        </Paper>
      </Container>
    );
  }

  // Full animated version for client
  return (
    <SignupContainer 
      maxWidth={false}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <MotionBox 
        sx={{ position: 'absolute', top: 20, left: 20 }}
        variants={itemVariants}
      >
        <Button
          component={Link}
          href="/"
          startIcon={<ArrowBack />}
          sx={{ textTransform: 'none' }}
        >
          Back to Home
        </Button>
      </MotionBox>

      <SignupPaper 
        elevation={3}
        variants={itemVariants}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <SignupTitle variant="h4">Create your account</SignupTitle>
        </motion.div>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2, width: '100%' }}>
            {error}
          </Alert>
        )}
        
        <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
          <MotionTextField
            margin="normal"
            required
            fullWidth
            id="username"
            label="Username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            sx={{ mb: 2 }}
            variants={itemVariants}
            disabled={isSubmitting}
          />
          
          <MotionTextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            value={formData.email}
            onChange={handleChange}
            sx={{ mb: 2 }}
            variants={itemVariants}
            disabled={isSubmitting}
          />
          
          <MotionTextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type={showPassword ? 'text' : 'password'}
            id="password"
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
            sx={{ mb: 2 }}
            variants={itemVariants}
            disabled={isSubmitting}
          />
          
          <MotionTextField
            margin="normal"
            required
            fullWidth
            name="confirmPassword"
            label="Confirm Password"
            type={showPassword ? 'text' : 'password'}
            id="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            sx={{ mb: 2 }}
            variants={itemVariants}
            disabled={isSubmitting}
          />
          
          <SignupButton
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            variants={buttonVariants}
            initial="initial"
            whileHover="hover"
            whileTap="tap"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'Sign Up'
            )}
          </SignupButton>
          
          <MotionBox 
            sx={{ mt: 3, textAlign: 'center' }}
            variants={itemVariants}
          >
            <Typography variant="body2">
              Already have an account?{' '}
              <MuiLink 
                component={Link} 
                href="/login"
                underline="hover"
                sx={{ fontWeight: 'bold', cursor: 'pointer' }}
              >
                Log in
              </MuiLink>
            </Typography>
          </MotionBox>
        </Box>
      </SignupPaper>
      
      <Snackbar
        open={showSuccessMessage}
        autoHideDuration={3000}
        onClose={() => setShowSuccessMessage(false)}
        message="Account created successfully! Redirecting..."
      />
    </SignupContainer>
  );
}