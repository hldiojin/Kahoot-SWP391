'use client';

import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Avatar,
  Divider,
  Button,
  TextField,
  CircularProgress,
  Chip,
  Snackbar,
  Alert,
  Stack
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Person as PersonIcon,
  School as SchoolIcon,
  Email as EmailIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import MainLayout from '../components/MainLayout';

export default function ProfilePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [userData, setUserData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: '',
    organization: '',
    bio: ''
  });

  // Simulate loading user data
  useEffect(() => {
    const timer = setTimeout(() => {
      if (user) {
        setUserData({
          firstName: user.firstName || 'John',
          lastName: user.lastName || 'Doe',
          email: user.email || 'john.doe@example.com',
          role: user.role || 'student',
          organization: 'FPT University',
          bio: 'Educational enthusiast passionate about interactive learning.'
        });
      }
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [user]);

  const handleEditToggle = () => {
    setEditMode(!editMode);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserData({
      ...userData,
      [name]: value
    });
  };

  const handleSave = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setEditMode(false);
      setSuccessMessage('Profile updated successfully!');
    }, 1000);
  };

  const handleCancel = () => {
    // Reset form data to original values
    if (user) {
      setUserData({
        firstName: user.firstName || 'John',
        lastName: user.lastName || 'Doe',
        email: user.email || 'john.doe@example.com',
        role: user.role || 'student',
        organization: 'FPT University',
        bio: 'Educational enthusiast passionate about interactive learning.'
      });
    }
    setEditMode(false);
  };

  const handleCloseSnackbar = () => {
    setSuccessMessage('');
    setErrorMessage('');
  };

  if (loading) {
    return (
      <MainLayout>
        <Container>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
            <CircularProgress />
          </Box>
        </Container>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Snackbar open={!!successMessage} autoHideDuration={6000} onClose={handleCloseSnackbar}>
          <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
            {successMessage}
          </Alert>
        </Snackbar>
        
        <Snackbar open={!!errorMessage} autoHideDuration={6000} onClose={handleCloseSnackbar}>
          <Alert onClose={handleCloseSnackbar} severity="error" sx={{ width: '100%' }}>
            {errorMessage}
          </Alert>
        </Snackbar>

        <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
              My Profile
            </Typography>
            {!editMode ? (
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={handleEditToggle}
                sx={{ 
                  background: 'linear-gradient(45deg, #2196F3 30%, #9C27B0 90%)',
                  color: 'white'
                }}
              >
                Edit Profile
              </Button>
            ) : (
              <Box>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<SaveIcon />}
                  onClick={handleSave}
                  sx={{ mr: 1 }}
                >
                  Save
                </Button>
                <Button
                  variant="outlined"
                  color="secondary"
                  startIcon={<CancelIcon />}
                  onClick={handleCancel}
                >
                  Cancel
                </Button>
              </Box>
            )}
          </Box>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={4}>
            <Box sx={{ width: { xs: '100%', md: '33.33%' } }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Avatar
                  sx={{
                    width: 150,
                    height: 150,
                    mb: 2,
                    background: 'linear-gradient(45deg, #2196F3 30%, #9C27B0 90%)',
                    fontSize: '3rem'
                  }}
                >
                  {userData.firstName.charAt(0)}{userData.lastName.charAt(0)}
                </Avatar>
                
                <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {userData.firstName} {userData.lastName}
                </Typography>
                
                <Chip 
                  label={userData.role.charAt(0).toUpperCase() + userData.role.slice(1)} 
                  color="primary" 
                  icon={<PersonIcon />} 
                  sx={{ mb: 1 }}
                />
                
                <Chip 
                  label={userData.organization} 
                  color="secondary" 
                  icon={<SchoolIcon />} 
                  sx={{ mb: 3 }}
                />
              </Box>
            </Box>
            
            <Box sx={{ width: { xs: '100%', md: '66.67%' } }}>
              <Paper elevation={1} sx={{ p: 3, borderRadius: 2, height: '100%' }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                  Personal Information
                </Typography>
                
                <Divider sx={{ mb: 3 }} />
                
                <Stack spacing={2}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <TextField
                      fullWidth
                      label="First Name"
                      name="firstName"
                      value={userData.firstName}
                      onChange={handleInputChange}
                      disabled={!editMode}
                      variant={editMode ? "outlined" : "filled"}
                      InputProps={{
                        readOnly: !editMode,
                      }}
                    />
                    
                    <TextField
                      fullWidth
                      label="Last Name"
                      name="lastName"
                      value={userData.lastName}
                      onChange={handleInputChange}
                      disabled={!editMode}
                      variant={editMode ? "outlined" : "filled"}
                      InputProps={{
                        readOnly: !editMode,
                      }}
                    />
                  </Stack>
                  
                  <TextField
                    fullWidth
                    label="Email"
                    name="email"
                    value={userData.email}
                    onChange={handleInputChange}
                    disabled={!editMode}
                    variant={editMode ? "outlined" : "filled"}
                    InputProps={{
                      readOnly: !editMode,
                      startAdornment: (
                        <EmailIcon color="action" sx={{ mr: 1 }} />
                      ),
                    }}
                  />
                  
                  <TextField
                    fullWidth
                    label="Organization"
                    name="organization"
                    value={userData.organization}
                    onChange={handleInputChange}
                    disabled={!editMode}
                    variant={editMode ? "outlined" : "filled"}
                    InputProps={{
                      readOnly: !editMode,
                      startAdornment: (
                        <SchoolIcon color="action" sx={{ mr: 1 }} />
                      ),
                    }}
                  />
                  
                  <TextField
                    fullWidth
                    label="Bio"
                    name="bio"
                    value={userData.bio}
                    onChange={handleInputChange}
                    disabled={!editMode}
                    variant={editMode ? "outlined" : "filled"}
                    multiline
                    rows={4}
                    InputProps={{
                      readOnly: !editMode,
                    }}
                  />
                </Stack>
              </Paper>
            </Box>
          </Stack>
        </Paper>
      </Container>
    </MainLayout>
  );
} 