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
  FormControlLabel,
  Checkbox,
  FormHelperText,
  Stepper,
  Step,
  StepLabel,
  MenuItem,
  Alert,
  CircularProgress,
  Snackbar
} from '@mui/material';
import { Visibility, VisibilityOff, ArrowBack } from '@mui/icons-material';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';

// Motion components
const MotionContainer = motion(Container);
const MotionPaper = motion(Paper);
const MotionBox = motion(Box);
const MotionButton = motion(Button);
const MotionTextField = motion(TextField);

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
  maxWidth: '550px',
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

// Role options for the dropdown
const roles = [
  { value: 'student', label: 'Student' },
  { value: 'teacher', label: 'Teacher' },
];

export default function SignupPage() {
  const [mounted, setMounted] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
    agreeTerms: false
  });

  const [errors, setErrors] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeTerms: ''
  });

  const { signup, user } = useAuth();
  const router = useRouter();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
    setMounted(true);
  }, [user, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
    
    // Clear error when field is modified
    if (name in errors && errors[name as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (error) setError('');
  };

  const validate = (): boolean => {
    const newErrors = { ...errors };
    let isValid = true;

    // Step 1 validation
    if (activeStep === 0) {
      if (!formData.firstName.trim()) {
        newErrors.firstName = 'First name is required';
        isValid = false;
      }
      
      if (!formData.lastName.trim()) {
        newErrors.lastName = 'Last name is required';
        isValid = false;
      }
      
      if (!formData.email) {
        newErrors.email = 'Email is required';
        isValid = false;
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'Email address is invalid';
        isValid = false;
      }
    }
    
    // Step 2 validation
    if (activeStep === 1) {
      if (!formData.password) {
        newErrors.password = 'Password is required';
        isValid = false;
      } else if (formData.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters';
        isValid = false;
      }
      
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password';
        isValid = false;
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
        isValid = false;
      }
      
      if (!formData.agreeTerms) {
        newErrors.agreeTerms = 'You must agree to the Terms of Service';
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleNext = () => {
    if (validate()) {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validate()) {
      setIsSubmitting(true);
      try {
        const result = await signup({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          role: formData.role as 'student' | 'teacher'
        });
        
        if (result.success) {
          setShowSuccessMessage(true);
          // Redirect handled by the auth effect above
        } else {
          // Show appropriate error message based on error type
          switch (result.errorType) {
            case 'email_exists':
              setError('This email is already registered');
              break;
            case 'email_required':
              setError('Email is required');
              break;
            case 'password_required':
              setError('Password is required');
              break;
            case 'name_required':
              setError('First name and last name are required');
              break;
            default:
              setError('An error occurred during registration');
          }
        }
      } catch (err) {
        setError('An error occurred during registration');
        console.error(err);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleTogglePassword = () => {
    setShowPassword(prev => !prev);
  };

  const handleToggleConfirmPassword = () => {
    setShowConfirmPassword(prev => !prev);
  };

  const steps = ['Account information', 'Security details'];

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
          maxWidth: '550px',
          width: '100%',
          borderRadius: 4,
        }}>
          <SignupTitle variant="h4">Create your account</SignupTitle>
        </Paper>
      </Container>
    );
  }

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
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <SignupTitle variant="h4">Create your account</SignupTitle>
        </motion.div>
        
        <MotionBox 
          variants={itemVariants}
          sx={{ width: '100%', mb: 4 }}
        >
          <Stepper activeStep={activeStep}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </MotionBox>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2, width: '100%' }}>
            {error}
          </Alert>
        )}
        
        <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
          {activeStep === 0 ? (
            // Step 1: Basic Information
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                <MotionBox variants={itemVariants}>
                  <TextField
                    required
                    fullWidth
                    id="firstName"
                    label="First Name"
                    name="firstName"
                    autoComplete="given-name"
                    value={formData.firstName}
                    onChange={handleChange}
                    error={!!errors.firstName}
                    helperText={errors.firstName}
                    disabled={isSubmitting}
                  />
                </MotionBox>
                <MotionBox variants={itemVariants}>
                  <TextField
                    required
                    fullWidth
                    id="lastName"
                    label="Last Name"
                    name="lastName"
                    autoComplete="family-name"
                    value={formData.lastName}
                    onChange={handleChange}
                    error={!!errors.lastName}
                    helperText={errors.lastName}
                    disabled={isSubmitting}
                  />
                </MotionBox>
                <MotionBox 
                  variants={itemVariants} 
                  sx={{ gridColumn: { xs: '1', sm: '1 / span 2' } }}
                >
                  <TextField
                    required
                    fullWidth
                    id="email"
                    label="Email Address"
                    name="email"
                    autoComplete="email"
                    value={formData.email}
                    onChange={handleChange}
                    error={!!errors.email}
                    helperText={errors.email}
                    disabled={isSubmitting}
                  />
                </MotionBox>
                <MotionBox 
                  variants={itemVariants}
                  sx={{ gridColumn: { xs: '1', sm: '1 / span 2' } }}
                >
                  <TextField
                    select
                    fullWidth
                    id="role"
                    name="role"
                    label="I am a..."
                    value={formData.role}
                    onChange={handleChange}
                    disabled={isSubmitting}
                  >
                    {roles.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </MotionBox>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                <SignupButton
                  variant="contained"
                  color="primary"
                  onClick={handleNext}
                  variants={buttonVariants}
                  initial="initial"
                  whileHover="hover"
                  whileTap="tap"
                  disabled={isSubmitting}
                >
                  Continue
                </SignupButton>
              </Box>
            </motion.div>
          ) : (
            // Step 2: Password and Agreement
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <MotionTextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                id="password"
                autoComplete="new-password"
                value={formData.password}
                onChange={handleChange}
                error={!!errors.password}
                helperText={errors.password}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={handleTogglePassword}
                        edge="end"
                        disabled={isSubmitting}
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
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                autoComplete="new-password"
                value={formData.confirmPassword}
                onChange={handleChange}
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={handleToggleConfirmPassword}
                        edge="end"
                        disabled={isSubmitting}
                      >
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                variants={itemVariants}
                disabled={isSubmitting}
              />
              
              <MotionBox variants={itemVariants} sx={{ mt: 2 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      name="agreeTerms"
                      color="primary"
                      checked={formData.agreeTerms}
                      onChange={handleChange}
                      disabled={isSubmitting}
                    />
                  }
                  label="I agree to the Terms of Service and Privacy Policy"
                />
                {errors.agreeTerms && (
                  <FormHelperText error>{errors.agreeTerms}</FormHelperText>
                )}
              </MotionBox>
              
              <MotionBox 
                variants={itemVariants}
                sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}
              >
                <MotionButton
                  onClick={handleBack}
                  sx={{ textTransform: 'none' }}
                  variants={buttonVariants}
                  initial="initial"
                  whileHover="hover"
                  whileTap="tap"
                  disabled={isSubmitting}
                >
                  Back
                </MotionButton>
                <SignupButton
                  type="submit"
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
              </MotionBox>
            </motion.div>
          )}
          
          <MotionBox 
            variants={itemVariants}
            sx={{ mt: 3, textAlign: 'center' }}
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