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
  Stack,
  IconButton,
  alpha,
  useTheme,
  Tooltip
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Person as PersonIcon,
  School as SchoolIcon,
  Email as EmailIcon,
  Badge as BadgeIcon,
  Cake as CakeIcon,
  LocationOn as LocationIcon,
  VerifiedUser as VerifiedUserIcon,
  PhotoCamera as PhotoCameraIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import MainLayout from '../components/MainLayout';
import authService from '@/services/authService';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const theme = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [userData, setUserData] = useState({
    id: 0,
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    role: '',
    organization: 'FPT University',
    bio: 'Educational enthusiast passionate about interactive learning.',
    location: 'Ho Chi Minh City, Vietnam',
    joinDate: '2023'
  });

  // Handle client-side only code
  useEffect(() => {
    setIsClient(true);
    
    // Check authentication immediately
    if (!authService.isAuthenticated()) {
      router.push('/login');
      return;
    }
  }, [router]);

  // Fetch user profile data - only run on client side
  useEffect(() => {
    if (!isClient) return;

    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        const profileData = await authService.getCurrentUserProfile();
        
        const nameParts = profileData.username.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        
        setUserData({
          id: profileData.id,
          username: profileData.username,
          email: profileData.email,
          firstName: firstName,
          lastName: lastName,
          role: user?.role || 'User',
          organization: 'FPT University',
          bio: 'Educational enthusiast passionate about interactive learning.',
          location: 'Ho Chi Minh City, Vietnam',
          joinDate: '2023'
        });
        
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
        setErrorMessage('Failed to load profile data. Please try again later.');
        setLoading(false);
      }
    };

    if (authService.isAuthenticated()) {
      fetchUserProfile();
    } else {
      setLoading(false);
    }
  }, [isClient, user]);

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
    // In a real implementation, you would call an API to update the user profile
    // For now, we'll just simulate an API call
    setTimeout(() => {
      setLoading(false);
      setEditMode(false);
      setSuccessMessage('Profile updated successfully!');
    }, 1000);
  };

  const handleCancel = () => {
    // Reset editable fields to their original values
    const nameParts = userData.username.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    
    setUserData({
      ...userData,
      firstName: firstName,
      lastName: lastName,
      organization: 'FPT University',
      bio: 'Educational enthusiast passionate about interactive learning.',
      location: 'Ho Chi Minh City, Vietnam'
    });
    setEditMode(false);
  };

  const handleCloseSnackbar = () => {
    setSuccessMessage('');
    setErrorMessage('');
  };

  // Show loading state during initial client-side render
  if (!isClient || loading) {
    return (
      <MainLayout>
        <Container>
          <Box 
            sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              justifyContent: 'center', 
              alignItems: 'center', 
              height: '70vh' 
            }}
          >
            <CircularProgress size={60} thickness={4} sx={{ 
              color: theme.palette.primary.main,
              mb: 3
            }} />
            <Typography variant="h6" color="text.secondary">
              Loading your profile...
            </Typography>
          </Box>
        </Container>
      </MainLayout>
    );
  }

  // Create a stable gradient background that doesn't cause hydration issues
  const getBackgroundGradient = (username: string) => {
    if (!username) return 'linear-gradient(135deg, hsl(180, 80%, 55%) 0%, hsl(240, 80%, 65%) 100%)';
    
    // Use a deterministic algorithm that will be consistent across renders
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
      hash = ((hash << 5) - hash) + username.charCodeAt(i);
      hash = hash & hash; // Convert to 32bit integer
    }
    const hue1 = Math.abs(hash % 360);
    const hue2 = (hue1 + 60) % 360;
    return `linear-gradient(135deg, hsl(${hue1}, 80%, 55%) 0%, hsl(${hue2}, 80%, 65%) 100%)`;
  };

  const gradientBg = getBackgroundGradient(userData.username);
  const avatarInitials = userData.firstName.charAt(0) + (userData.lastName ? userData.lastName.charAt(0) : '');

  return (
    <MainLayout>
      <Box 
        sx={{ 
          position: 'relative',
          width: '100%',
          height: '200px',
          backgroundColor: theme.palette.background.default,
          backgroundImage: gradientBg,
          mb: -10,
          zIndex: 0
        }} 
      />

      <Container maxWidth="lg" sx={{ py: 4, position: 'relative', zIndex: 1 }}>
        <Snackbar 
          open={!!successMessage} 
          autoHideDuration={6000} 
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert 
            onClose={handleCloseSnackbar} 
            severity="success" 
            variant="filled"
            sx={{ width: '100%', boxShadow: theme.shadows[3] }}
          >
            {successMessage}
          </Alert>
        </Snackbar>
        
        <Snackbar 
          open={!!errorMessage} 
          autoHideDuration={6000} 
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert 
            onClose={handleCloseSnackbar} 
            severity="error" 
            variant="filled"
            sx={{ width: '100%', boxShadow: theme.shadows[3] }}
          >
            {errorMessage}
          </Alert>
        </Snackbar>

        <Paper 
          elevation={6} 
          sx={{ 
            p: { xs: 3, md: 4 }, 
            borderRadius: 3, 
            background: theme.palette.background.paper,
            boxShadow: '0 10px 40px -10px rgba(0,0,0,0.2)',
            overflow: 'hidden'
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 700,
                background: gradientBg,
                backgroundClip: 'text',
                textFillColor: 'transparent',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              My Profile
            </Typography>
            {!editMode ? (
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={handleEditToggle}
                size="large"
                sx={{ 
                  background: gradientBg,
                  color: 'white',
                  px: 3,
                  py: 1,
                  borderRadius: 2,
                  transition: 'all 0.3s',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                  '&:hover': {
                    boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                Edit Profile
              </Button>
            ) : (
              <Stack direction="row" spacing={1}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<SaveIcon />}
                  onClick={handleSave}
                  size="large"
                  sx={{ 
                    px: 3, 
                    py: 1,
                    borderRadius: 2,
                    background: theme.palette.success.main,
                    transition: 'all 0.3s',
                    '&:hover': {
                      background: theme.palette.success.dark,
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                  Save
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<CancelIcon />}
                  onClick={handleCancel}
                  size="large"
                  sx={{ 
                    px: 3, 
                    py: 1,
                    borderRadius: 2,
                    borderColor: theme.palette.error.main,
                    color: theme.palette.error.main,
                    transition: 'all 0.3s',
                    '&:hover': {
                      borderColor: theme.palette.error.dark,
                      background: alpha(theme.palette.error.main, 0.04),
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                  Cancel
                </Button>
              </Stack>
            )}
          </Box>
          
          <Stack 
            direction={{ xs: 'column', md: 'row' }} 
            spacing={5}
            sx={{ alignItems: { xs: 'center', md: 'flex-start' } }}
          >
            <Box 
              sx={{ 
                width: { xs: '100%', md: '33.33%' },
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center'
              }}
            >
              <Box sx={{ position: 'relative' }}>
                <Avatar
                  sx={{
                    width: 180,
                    height: 180,
                    mb: 3,
                    fontSize: '4rem',
                    fontWeight: 'bold',
                    background: gradientBg,
                    border: `4px solid ${theme.palette.background.paper}`,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                  }}
                >
                  {avatarInitials}
                </Avatar>
                
                {editMode && (
                  <Tooltip title="Change profile picture">
                    <IconButton
                      sx={{
                        position: 'absolute',
                        bottom: 16,
                        right: 0,
                        backgroundColor: theme.palette.background.paper,
                        boxShadow: theme.shadows[2],
                        '&:hover': {
                          backgroundColor: theme.palette.action.hover,
                        }
                      }}
                    >
                      <PhotoCameraIcon />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
              
              <Typography 
                variant="h5" 
                sx={{ 
                  fontWeight: 'bold', 
                  mb: 1.5,
                  textAlign: 'center'
                }}
              >
                {userData.username}
                <Box 
                  component="span" 
                  sx={{ 
                    display: 'inline-flex',
                    ml: 1,
                    color: theme.palette.primary.main
                  }}
                >
                  <VerifiedUserIcon sx={{ fontSize: 20 }} />
                </Box>
              </Typography>
              
              <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
                <Chip 
                  label={userData.role.charAt(0).toUpperCase() + userData.role.slice(1)} 
                  color="primary" 
                  icon={<PersonIcon />} 
                  sx={{ 
                    fontWeight: 500,
                    borderRadius: '16px',
                    background: gradientBg,
                    px: 0.8,
                    py: 0.4,
                    '& .MuiChip-label': {
                      fontWeight: 600,
                      color: 'white'
                    },
                    '& .MuiChip-icon': {
                      color: 'white',
                      ml: 0.5
                    }
                  }}
                />
                
                <Chip 
                  label={userData.organization} 
                  color="secondary" 
                  icon={<SchoolIcon />} 
                  sx={{ 
                    fontWeight: 500,
                    borderRadius: '16px'
                  }}
                />
              </Stack>
              
              <Paper
                elevation={1}
                sx={{ 
                  width: '100%', 
                  p: 2.5, 
                  mt: 2,
                  mb: 3,
                  backgroundColor: theme.palette.background.paper,
                  borderRadius: 2,
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                }}
              >
                <Stack spacing={2.5}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      backgroundColor: alpha(theme.palette.warning.main, 0.1),
                      mr: 2
                    }}>
                      <BadgeIcon sx={{ color: theme.palette.warning.main, fontSize: 20 }} />
                    </Box>
                    <Box>
                      <Typography component="span" sx={{ fontWeight: 'bold', mr: 1, display: 'block', fontSize: '0.75rem', color: theme.palette.text.secondary }}>
                        ID
                      </Typography>
                      <Typography component="span" sx={{ color: theme.palette.text.primary, fontWeight: 500 }}>
                        {userData.id}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Divider />
                  
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      backgroundColor: alpha(theme.palette.error.main, 0.1),
                      mr: 2
                    }}>
                      <LocationIcon sx={{ color: theme.palette.error.main, fontSize: 20 }} />
                    </Box>
                    <Box>
                      <Typography component="span" sx={{ fontWeight: 'bold', mr: 1, display: 'block', fontSize: '0.75rem', color: theme.palette.text.secondary }}>
                        Location
                      </Typography>
                      <Typography component="span" sx={{ color: theme.palette.text.primary, fontWeight: 500 }}>
                        {userData.location}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Divider />
                  
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      backgroundColor: alpha(theme.palette.success.main, 0.1),
                      mr: 2
                    }}>
                      <CakeIcon sx={{ color: theme.palette.success.main, fontSize: 20 }} />
                    </Box>
                    <Box>
                      <Typography component="span" sx={{ fontWeight: 'bold', mr: 1, display: 'block', fontSize: '0.75rem', color: theme.palette.text.secondary }}>
                        Joined
                      </Typography>
                      <Typography component="span" sx={{ color: theme.palette.text.primary, fontWeight: 500 }}>
                        {userData.joinDate}
                      </Typography>
                    </Box>
                  </Box>
                </Stack>
              </Paper>
            </Box>
            
            <Box sx={{ 
              width: { xs: '100%', md: '66.67%' },
              height: '100%',
            }}>
              <Paper 
                elevation={1} 
                sx={{ 
                  p: { xs: 3, md: 4 }, 
                  borderRadius: 3, 
                  height: '100%',
                  backgroundColor: theme.palette.background.paper,
                  border: `1px solid ${alpha(theme.palette.divider, 0.2)}`
                }}
              >
                <Typography 
                  variant="h5" 
                  sx={{ 
                    mb: 3, 
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    '&:after': {
                      content: '""',
                      flexGrow: 1,
                      ml: 2,
                      height: '2px',
                      background: alpha(theme.palette.divider, 0.2)
                    }
                  }}
                >
                  Personal Information
                </Typography>
                
                <Stack spacing={3}>
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
                        startAdornment: (
                          <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            mr: 1.5,
                            color: theme.palette.text.secondary,
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            backgroundColor: alpha(theme.palette.info.main, 0.1),
                          }}>
                            <PersonIcon sx={{ 
                              color: theme.palette.info.main,
                              fontSize: 20,
                            }} />
                          </Box>
                        ),
                      }}
                      sx={{ 
                        '& .MuiFilledInput-root': {
                          borderRadius: 2,
                          backgroundColor: alpha(theme.palette.background.default, 0.5),
                          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                          transition: 'all 0.3s',
                          '&:hover': {
                            backgroundColor: alpha(theme.palette.background.default, 0.8),
                          },
                        },
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2
                        },
                        '& .MuiInputBase-root': {
                          alignItems: 'center',
                        }
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
                        startAdornment: (
                          <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            mr: 1.5,
                            color: theme.palette.text.secondary,
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            backgroundColor: alpha(theme.palette.warning.main, 0.1),
                          }}>
                            <BadgeIcon sx={{ 
                              color: theme.palette.warning.main,
                              fontSize: 20,
                            }} />
                          </Box>
                        ),
                      }}
                      sx={{ 
                        '& .MuiFilledInput-root': {
                          borderRadius: 2,
                          backgroundColor: alpha(theme.palette.background.default, 0.5),
                          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                          transition: 'all 0.3s',
                          '&:hover': {
                            backgroundColor: alpha(theme.palette.background.default, 0.8),
                          },
                        },
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2
                        },
                        '& .MuiInputBase-root': {
                          alignItems: 'center',
                        }
                      }}
                    />
                  </Stack>
                  
                  <TextField
                    fullWidth
                    label="Email"
                    name="email"
                    value={userData.email}
                    onChange={handleInputChange}
                    disabled={true}
                    variant="filled"
                    InputProps={{
                      readOnly: true,
                      startAdornment: (
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          mr: 1.5,
                          color: theme.palette.text.secondary,
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          backgroundColor: alpha(theme.palette.primary.main, 0.1),
                        }}>
                          <EmailIcon sx={{ 
                            color: theme.palette.primary.main,
                            fontSize: 20,
                          }} />
                        </Box>
                      ),
                    }}
                    sx={{ 
                      '& .MuiFilledInput-root': {
                        borderRadius: 2,
                        backgroundColor: alpha(theme.palette.background.default, 0.5),
                        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                        transition: 'all 0.3s',
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.background.default, 0.8),
                        },
                      },
                      '& .MuiInputBase-root': {
                        alignItems: 'center',
                      }
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
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          mr: 1.5,
                          color: theme.palette.text.secondary,
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          backgroundColor: alpha(theme.palette.secondary.main, 0.1),
                        }}>
                          <SchoolIcon sx={{ 
                            color: theme.palette.secondary.main,
                            fontSize: 20,
                          }} />
                        </Box>
                      ),
                    }}
                    sx={{ 
                      '& .MuiFilledInput-root': {
                        borderRadius: 2,
                        backgroundColor: alpha(theme.palette.background.default, 0.5),
                        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                        transition: 'all 0.3s',
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.background.default, 0.8),
                        },
                      },
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2
                      },
                      '& .MuiInputBase-root': {
                        alignItems: 'center',
                      }
                    }}
                  />
                  
                  <TextField
                    fullWidth
                    label="Location"
                    name="location"
                    value={userData.location}
                    onChange={handleInputChange}
                    disabled={!editMode}
                    variant={editMode ? "outlined" : "filled"}
                    InputProps={{
                      readOnly: !editMode,
                      startAdornment: (
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          mr: 1.5,
                          color: theme.palette.text.secondary,
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          backgroundColor: alpha(theme.palette.error.main, 0.1),
                        }}>
                          <LocationIcon sx={{ 
                            color: theme.palette.error.main,
                            fontSize: 20,
                          }} />
                        </Box>
                      ),
                    }}
                    sx={{ 
                      '& .MuiFilledInput-root': {
                        borderRadius: 2,
                        backgroundColor: alpha(theme.palette.background.default, 0.5),
                        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                        transition: 'all 0.3s',
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.background.default, 0.8),
                        },
                      },
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2
                      },
                      '& .MuiInputBase-root': {
                        alignItems: 'center',
                      }
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
                    multiline={true}
                    rows={4}
                    InputProps={{
                      readOnly: !editMode,
                      startAdornment: (
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'flex-start', 
                          justifyContent: 'center',
                          mr: 1.5,
                          color: theme.palette.text.secondary,
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          backgroundColor: alpha(theme.palette.success.main, 0.1),
                          mt: 1,
                        }}>
                          <PersonIcon sx={{ 
                            color: theme.palette.success.main,
                            fontSize: 20,
                          }} />
                        </Box>
                      ),
                    }}
                    sx={{ 
                      '& .MuiFilledInput-root': {
                        borderRadius: 2,
                        backgroundColor: alpha(theme.palette.background.default, 0.5),
                        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                        transition: 'all 0.3s',
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.background.default, 0.8),
                        },
                      },
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2
                      },
                      '& .MuiInputBase-root': {
                        alignItems: 'flex-start',
                      }
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