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
import { useAuth } from '../context/AuthContext';

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

  const { login, user } = useAuth();
  const router = useRouter();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
    setMounted(true);
  }, [user, router]);

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
      
      const result = await login(formData.email, formData.password);
      
      if (result.success) {
        setShowSuccessMessage(true);
        // Redirect handled by the auth effect above
      } else {
        // Show appropriate error message based on error type
        switch (result.errorType) {
          case 'email_required':
            setError('Email is required');
            break;
          case 'password_required':
            setError('Password is required');
            break;
          case 'invalid_email':
            setError('No account found with this email');
            break;
          case 'invalid_password':
            setError('Incorrect password');
            break;
          default:
            setError('Invalid email or password');
        }
      }
    } catch (err) {
      setError('An error occurred during login');
      console.error(err);
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
        Teacher: john@example.com / password123<br />
        Student: jane@example.com / password123
      </Typography>
    </Alert>
  );

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
          maxWidth: '450px',
          width: '100%',
          borderRadius: 4,
        }}>
          <LoginTitle variant="h4">Log in to Blooket Clone</LoginTitle>
        </Paper>
      </Container>
    );
  }

  // Full animated version for client
  return (
    <LoginContainer 
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

      <LoginPaper 
        elevation={3}
        variants={itemVariants}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <LoginTitle variant="h4">Log in to Blooket Clone</LoginTitle>
        </motion.div>
        
        {demoCredentials}
        
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
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            autoFocus
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
            variants={itemVariants}
            disabled={isSubmitting}
          />
          
          <LoginButton
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
              'Log In'
            )}
          </LoginButton>
          
          <MotionBox 
            sx={{ mt: 2, textAlign: 'center' }}
            variants={itemVariants}
          >
            <MuiLink 
              component={Link} 
              href="/forgot-password"
              underline="hover"
              sx={{ cursor: 'pointer' }}
            >
              Forgot password?
            </MuiLink>
          </MotionBox>
          
          <MotionBox 
            sx={{ mt: 3, textAlign: 'center' }}
            variants={itemVariants}
          >
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
          </MotionBox>
        </Box>
      </LoginPaper>
      
      <Snackbar
        open={showSuccessMessage}
        autoHideDuration={3000}
        onClose={() => setShowSuccessMessage(false)}
        message="Login successful! Redirecting..."
      />
    </LoginContainer>
  );
}