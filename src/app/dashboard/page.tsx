'use client';

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Tabs, 
  Tab, 
  Divider, 
  Button, 
  Avatar, 
  Chip, 
  Stack,
  Card,
  CardContent,
  alpha,
  Grow,
  useTheme,
  Fade,
  CircularProgress,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Grid,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Tooltip
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useAuth, withAuth } from '../context/AuthContext';
import MainLayout from '../components/MainLayout';
import { 
  Add as AddIcon, 
  TrendingUp as TrendingIcon, 
  AccessTime as RecentIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  StarOutline as StarOutlineIcon,
  StarRate as StarRateIcon,
  SpeedOutlined as SpeedIcon,
  EmojiEvents as TrophyIcon,
  Storage as StorageIcon
} from '@mui/icons-material';
import authService from '@/services/authService';
import quizService from '@/services/quizService';
import axios from 'axios';

// Sample games data for the dashboard
const sampleGames = [
  {
    id: '1',
    title: 'Math Fundamentals',
    description: 'Basic mathematics quiz covering arithmetic, algebra, and geometry',
    imageUrl: 'https://img.freepik.com/free-vector/realistic-math-chalkboard-background_23-2148163817.jpg',
    questionsCount: 15,
    playsCount: 250,
    creator: 'Teacher Demo'
  },
  {
    id: '2',
    title: 'Science Quiz',
    description: 'Fun science questions about physics, chemistry, and biology',
    imageUrl: 'https://img.freepik.com/free-vector/hand-drawn-science-education-background_23-2148499325.jpg',
    questionsCount: 20,
    playsCount: 180,
    creator: 'Teacher Demo'
  },
  {
    id: '3',
    title: 'World Geography',
    description: 'Test your knowledge about countries, capitals, and landmarks',
    imageUrl: 'https://img.freepik.com/free-vector/hand-drawn-geography-background_23-2148201628.jpg',
    questionsCount: 25,
    playsCount: 320,
    creator: 'Teacher Demo'
  },
  {
    id: '4',
    title: 'Literature Classics',
    description: 'Questions about famous novels, authors, and literary works',
    imageUrl: 'https://img.freepik.com/free-photo/pile-books-with-copy-space_23-2148898747.jpg',
    questionsCount: 18,
    playsCount: 120,
    creator: 'Teacher Demo'
  }
];

// Extra suggested games
const suggestedGames = [
  {
    id: '5',
    title: 'Computer Science',
    description: 'Coding, algorithms, and computer science concepts for all levels',
    imageUrl: 'https://img.freepik.com/free-vector/hand-drawn-flat-design-stack-overflow-background_23-2149219038.jpg',
    questionsCount: 30,
    playsCount: 210,
    creator: 'Community'
  },
  {
    id: '6',
    title: 'Art History',
    description: 'Explore famous artworks, artists, and artistic movements through history',
    imageUrl: 'https://img.freepik.com/free-vector/hand-painted-watercolor-banksy-graffiti-background_23-2149629192.jpg',
    questionsCount: 22,
    playsCount: 175,
    creator: 'Community'
  },
];

function Dashboard() {
  const theme = useTheme();
  const router = useRouter();
  const [tabValue, setTabValue] = useState(0);
  const { user, isLoading } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [profileData, setProfileData] = useState({
    id: 0,
    username: '',
    firstName: '',
    lastName: '',
    email: '',
    role: ''
  });
  const [loading, setLoading] = useState(true);
  const [creatingQuiz, setCreatingQuiz] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState<'success' | 'error'>('success');
  
  // New states for Pro Account dialog
  const [openProDialog, setOpenProDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('monthly');
  const [servicePacks, setServicePacks] = useState<any[]>([]);
  const [loadingServicePacks, setLoadingServicePacks] = useState(false);
  const [upgradingAccount, setUpgradingAccount] = useState(false);

  useEffect(() => {
    // Set mounted after client-side hydration to prevent errors
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const fetchUserProfile = async () => {
      try {
        const userData = await authService.getCurrentUserProfile();
        
        // Parse name parts if needed
        const nameParts = userData.username ? userData.username.split(' ') : [''];
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        
        setProfileData({
          id: userData.id,
          username: userData.username,
          firstName: firstName,
          lastName: lastName,
          email: userData.email,
          role: user?.role || 'User'
        });
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
      } finally {
        setLoading(false);
      }
    };

    if (authService.isAuthenticated()) {
      fetchUserProfile();
    } else {
      setLoading(false);
    }
  }, [mounted, user]);

  // Fetch service packs when dialog opens
  useEffect(() => {
    const fetchServicePacks = async () => {
      if (!openProDialog) return;
      
      try {
        setLoadingServicePacks(true);
        const response = await axios.get('https://kahootclone-f7hkd0hwafgbfrfa.southeastasia-01.azurewebsites.net/api/ServicePack');
        console.log('Service packs API response:', response.data);
        
        if (response.data && Array.isArray(response.data)) {
          // If API returns flat array of service packs
          setServicePacks(response.data);
        } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
          // If API returns wrapper object with data array
          setServicePacks(response.data.data);
        } else {
          // Fallback data if API doesn't return expected format
          setServicePacks([
            { 
              id: 1, 
              name: 'Monthly Pro', 
              description: 'Full access to premium features for one month',
              price: 9.99,
              durationDays: 30,
              features: 'Unlimited quizzes, Advanced analytics, Priority support'
            },
            { 
              id: 2, 
              name: 'Annual Pro', 
              description: 'Full access to premium features with a discount',
              price: 99.99,
              durationDays: 365,
              features: 'Unlimited quizzes, Advanced analytics, Priority support, 20% discount'
            }
          ]);
        }
      } catch (error) {
        console.error('Error fetching service packs:', error);
        // Fallback data if API fails
        setServicePacks([
          { 
            id: 1, 
            name: 'Monthly Pro', 
            description: 'Full access to premium features for one month',
            price: 9.99,
            durationDays: 30,
            features: 'Unlimited quizzes, Advanced analytics, Priority support'
          },
          { 
            id: 2, 
              name: 'Annual Pro', 
              description: 'Full access to premium features with a discount',
              price: 99.99,
              durationDays: 365,
              features: 'Unlimited quizzes, Advanced analytics, Priority support, 20% discount'
          }
        ]);
      } finally {
        setLoadingServicePacks(false);
      }
    };

    fetchServicePacks();
  }, [openProDialog]);

  // Handle Pro Account dialog functions
  const handleOpenProDialog = () => {
    setOpenProDialog(true);
  };

  const handleCloseProDialog = () => {
    setOpenProDialog(false);
  };

  const handlePlanChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedPlan(event.target.value);
  };

  const handleUpgradeToPro = async () => {
    try {
      setUpgradingAccount(true);
      
      // Always use servicePackId = 9 as requested
      console.log('Using fixed servicePackId: 9');
      createPayment(9);
      
    } catch (error) {
      console.error("Error initiating payment:", error);
      setNotificationMessage("Failed to initiate payment. Please try again.");
      setNotificationType("error");
      setNotificationOpen(true);
      setUpgradingAccount(false);
    }
  };
  
  // Function to create payment with PayOS
  const createPayment = async (servicePackId: number) => {
    try {
      const paymentUrl = `https://kahootclone-f7hkd0hwafgbfrfa.southeastasia-01.azurewebsites.net/api/Payment`;
      
      // Create full URLs for success and failure redirects
      const baseUrl = window.location.origin;
      const successUrl = `${baseUrl}/upgrade-success?status=success`;
      const failureUrl = `${baseUrl}/upgrade-failed?status=failed`;
      
      // Clean previous payment status from localStorage
      localStorage.removeItem('paymentVerified');
      localStorage.removeItem('paymentFailed');
      
      const response = await axios.post(paymentUrl, null, {
        params: {
          servicePackId: servicePackId,
          successUrl: successUrl,
          failureUrl: failureUrl
        }
      });
      
      console.log("Payment API response:", response.data);
      
      if (response.data && response.data.status === 200 && response.data.data && response.data.data.payOSUrl) {
        // Store current timestamp before redirect to verify return journey
        sessionStorage.setItem('paymentStartTime', Date.now().toString());
        
        // Navigate to PayOS payment URL
        window.location.href = response.data.data.payOSUrl;
        
        // Show notification before redirect
        setNotificationMessage("Redirecting to payment gateway...");
        setNotificationType("success");
        setNotificationOpen(true);
      } else {
        throw new Error("Invalid payment response format");
      }
    } catch (error) {
      console.error("Payment creation error:", error);
      setNotificationMessage("Failed to create payment link. Please try again.");
      setNotificationType("error");
      setNotificationOpen(true);
      setUpgradingAccount(false);
    }
  };
  
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  const handleCreateGame = async () => {
    try {
      setCreatingQuiz(true);
      
      // Show notification about redirecting to editor
      setNotificationMessage("Redirecting to quiz editor...");
      setNotificationType("success");
      setNotificationOpen(true);

      // After a short delay, redirect to the quiz editor
      setTimeout(() => {
        router.push('/create-game');
      }, 1000);
      
    } catch (error) {
      console.error("Error navigating to quiz editor:", error);
      setNotificationMessage("Failed to navigate to quiz editor. Please try again.");
      setNotificationType("error");
      setNotificationOpen(true);
    } finally {
      setCreatingQuiz(false);
    }
  };

  const handleCloseNotification = () => {
    setNotificationOpen(false);
  };

  // Prevent rendering until client-side hydration is complete
  if (!mounted) {
    return null;
  }

  return (
    <MainLayout>
      <Box sx={{ mb: 4 }}>
        {/* Welcome section with user info */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar 
              sx={{ 
                width: 64, 
                height: 64, 
                mr: 2,
                background: 'linear-gradient(45deg, #2196F3 30%, #9C27B0 90%)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
              }}
            >
              {profileData.firstName?.charAt(0) || ''}{profileData.lastName?.charAt(0) || ''}
            </Avatar>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                Welcome back, {profileData.username || 'User'}!
              </Typography>
              <Chip 
                label={profileData.role?.charAt(0).toUpperCase() + profileData.role?.slice(1) || 'User'} 
                color="primary" 
                size="small" 
                sx={{ mt: 0.5 }}
              />
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {/* Nút Upgrade to Pro */}
            <Button
              variant="outlined"
              color="warning"
              startIcon={<StarRateIcon />}
              onClick={handleOpenProDialog}
              sx={{
                borderRadius: 8,
                px: 3,
                py: 1,
                fontWeight: 'bold',
                borderWidth: 2,
                borderColor: 'warning.main',
                color: 'warning.main',
                '&:hover': {
                  borderWidth: 2,
                  borderColor: 'warning.dark',
                  backgroundColor: alpha('#ff9800', 0.05),
                  transform: 'translateY(-2px)',
                }
              }}
            >
              Upgrade to Pro
            </Button>
            
            {/* Nút Create New Quiz */}
            <Button
              variant="contained"
              startIcon={creatingQuiz ? <CircularProgress size={20} color="inherit" /> : <AddIcon />}
              onClick={handleCreateGame}
              disabled={creatingQuiz}
              sx={{
                background: 'linear-gradient(45deg, #2196F3 30%, #9C27B0 90%)',
                color: 'white',
                fontWeight: 'bold',
                borderRadius: 8,
                px: 3,
                py: 1,
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                transition: 'all 0.3s',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 25px rgba(0,0,0,0.18)',
                }
              }}
            >
              Create New Quiz
            </Button>
          </Box>
        </Box>

        {/* Quick stats paper */}
        <Paper 
          elevation={2} 
          sx={{ 
            p: 3, 
            borderRadius: 4, 
            mb: 4, 
            background: 'linear-gradient(to right, #E0EAFC, #CFDEF3)',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-around',
            gap: 2,
            boxShadow: '0 10px 30px rgba(0,0,0,0.05)'
          }}
        >
          <Box sx={{ textAlign: 'center', flex: 1, minWidth: 150 }}>
            <Typography variant="h6" color="text.secondary">Quizzes Created</Typography>
            <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
              {sampleGames.length}
            </Typography>
          </Box>
          <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />
          <Box sx={{ textAlign: 'center', flex: 1, minWidth: 150 }}>
            <Typography variant="h6" color="text.secondary">Games Played</Typography>
            <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
              28
            </Typography>
          </Box>
          <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />
          <Box sx={{ textAlign: 'center', flex: 1, minWidth: 150 }}>
            <Typography variant="h6" color="text.secondary">Student Participants</Typography>
            <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
              156
            </Typography>
          </Box>
        </Paper>

        {/* Tabs for different content sections */}
        <Box sx={{ mb: 3 }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{
              '& .MuiTab-root': {
                fontWeight: 'bold',
                py: 2,
                transition: 'all 0.3s',
                borderRadius: '8px 8px 0 0',
              },
              '& .Mui-selected': {
                backgroundColor: alpha(theme.palette.primary.main, 0.05),
              }
            }}
          >
            <Tab icon={<RecentIcon />} label="Your Recent Quizzes" iconPosition="start" />
            <Tab icon={<TrendingIcon />} label="Community Quizzes" iconPosition="start" />
          </Tabs>
        </Box>

        {/* Game cards based on selected tab - using Masonry-like layout */}
        <Box>
          {tabValue === 0 ? (
            <Box 
              sx={{ 
                display: 'flex', 
                flexWrap: 'wrap',
                gap: 3,
              }}
            >
              {sampleGames.map((game, index) => (
                <Grow 
                  key={game.id}
                  in={true}
                  style={{ transformOrigin: '0 0 0' }}
                  timeout={300 + index * 100}
                >
                  <Box
                    sx={{
                      flexBasis: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(33.333% - 16px)', lg: 'calc(25% - 18px)' },
                      minWidth: 260,
                      flexGrow: 1,
                    }}
                  >
                    <Card
                      sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        borderRadius: 3,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-8px)',
                          boxShadow: '0 16px 40px rgba(0,0,0,0.12)'
                        }
                      }}
                    >
                      <Box
                        sx={{
                          position: 'relative',
                          paddingTop: '60%',
                          backgroundImage: `url(${game.imageUrl})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          borderTopLeftRadius: 12,
                          borderTopRightRadius: 12,
                          '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            backgroundColor: 'rgba(0,0,0,0.2)',
                            borderTopLeftRadius: 12,
                            borderTopRightRadius: 12,
                          }
                        }}
                      >
                        <Box
                          sx={{
                            position: 'absolute',
                            top: 16,
                            right: 16,
                            backgroundColor: alpha(theme.palette.background.paper, 0.9),
                            borderRadius: 4,
                            px: 1.5,
                            py: 0.5,
                            display: 'flex',
                            alignItems: 'center'
                          }}
                        >
                          <Typography variant="body2" fontWeight="bold" color="primary">
                            {game.questionsCount} Questions
                          </Typography>
                        </Box>
                      </Box>
                      
                      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', p: 3 }}>
                        <Box>
                          <Typography variant="h6" component="h3" gutterBottom fontWeight="bold" sx={{ mb: 1 }}>
                            {game.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {game.description}
                          </Typography>
                        </Box>
                        
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                          <Chip 
                            size="small"
                            label={`${game.playsCount} Plays`}
                            sx={{ 
                              fontWeight: 500,
                              backgroundColor: alpha(theme.palette.success.main, 0.1),
                              color: theme.palette.success.dark
                            }} 
                          />
                          <Typography variant="caption" color="text.secondary">
                            by {game.creator}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Box>
                </Grow>
              ))}
            </Box>
          ) : (
            <Box 
              sx={{ 
                display: 'flex', 
                flexWrap: 'wrap',
                gap: 3,
              }}
            >
              {suggestedGames.concat(sampleGames.slice(0, 2)).map((game, index) => (
                <Fade 
                  key={`suggested-${game.id}`}
                  in={true}
                  timeout={500 + index * 100}
                >
                  <Box
                    sx={{
                      flexBasis: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(33.333% - 16px)', lg: 'calc(25% - 18px)' },
                      minWidth: 260,
                      flexGrow: 1,
                    }}
                  >
                    <Card
                      sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        borderRadius: 3,
                        overflow: 'hidden',
                        position: 'relative',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-8px)',
                          boxShadow: '0 16px 40px rgba(0,0,0,0.12)'
                        }
                      }}
                    >
                      <Box
                        sx={{
                          position: 'relative',
                          paddingTop: '60%',
                          backgroundImage: `url(${game.imageUrl})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            backgroundColor: 'rgba(0,0,0,0.2)',
                          }
                        }}
                      >
                        <Box
                          sx={{
                            position: 'absolute',
                            top: 16,
                            right: 16,
                            backgroundColor: alpha(theme.palette.background.paper, 0.9),
                            borderRadius: 4,
                            px: 1.5,
                            py: 0.5,
                            display: 'flex',
                            alignItems: 'center'
                          }}
                        >
                          <Typography variant="body2" fontWeight="bold" color="primary">
                            {game.questionsCount} Questions
                          </Typography>
                        </Box>
                      </Box>
                      
                      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', p: 3 }}>
                        <Box>
                          <Typography variant="h6" component="h3" gutterBottom fontWeight="bold" sx={{ mb: 1 }}>
                            {game.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {game.description}
                          </Typography>
                        </Box>
                        
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                          <Chip 
                            size="small"
                            label={`${game.playsCount} Plays`}
                            sx={{ 
                              fontWeight: 500,
                              backgroundColor: alpha(theme.palette.success.main, 0.1),
                              color: theme.palette.success.dark
                            }} 
                          />
                          <Typography variant="caption" color="text.secondary">
                            by {game.creator}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Box>
                </Fade>
              ))}
            </Box>
          )}
        </Box>
      </Box>

      {/* Pro Account Upgrade Dialog */}
      <Dialog
        open={openProDialog}
        onClose={handleCloseProDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(249,249,249,1) 100%)',
            overflow: 'hidden'
          }
        }}
      >
        <Box sx={{ position: 'relative' }}>
          {/* Header gradient bar */}
          <Box
            sx={{
              height: '8px',
              width: '100%',
              background: 'linear-gradient(90deg, #FF9800 0%, #F57C00 100%)',
            }}
          />
          
          <DialogTitle sx={{ 
            textAlign: 'center',
            pt: 4,
            pb: 2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            <IconButton
              aria-label="close"
              onClick={handleCloseProDialog}
              sx={{
                position: 'absolute',
                right: 16,
                top: 16,
                color: 'grey.500',
              }}
            >
              <CloseIcon />
            </IconButton>
            
            <StarRateIcon sx={{ color: 'warning.main', fontSize: 48, mb: 1 }} />
            <Typography variant="h4" component="div" fontWeight="bold">
              Upgrade to Pro Account
            </Typography>
            <Typography variant="subtitle1" component="p" color="text.secondary" sx={{ mt: 1, maxWidth: '70%', mx: 'auto' }}>
              Unlock premium features and take your quizzes to the next level
            </Typography>
          </DialogTitle>
          
          <DialogContent sx={{ px: 4, py: 3 }}>
            {/* Plan Selection */}
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'center' }}>
              <FormControl component="fieldset">
                <RadioGroup
                  row
                  name="subscription-plan"
                  value={selectedPlan}
                  onChange={handlePlanChange}
                >
                  <Paper 
                    elevation={0}
                    sx={{ 
                      borderRadius: 2, 
                      display: 'flex', 
                      overflow: 'hidden',
                      border: '1px solid',
                      borderColor: 'divider'
                    }}
                  >
                    <FormControlLabel
                      value="monthly"
                      control={<Radio />}
                      label={
                        <Box sx={{ 
                          px: 3, 
                          py: 1.5,
                          bgcolor: selectedPlan === 'monthly' ? 'primary.50' : 'transparent',
                          borderRadius: 1
                        }}>
                          <Typography variant="subtitle1" fontWeight={600}>Monthly</Typography>
                        </Box>
                      }
                      sx={{ 
                        m: 0,
                        pr: 2
                      }}
                    />
                    <FormControlLabel
                      value="annual"
                      control={<Radio />}
                      label={
                        <Box sx={{ 
                          px: 3, 
                          py: 1.5, 
                          bgcolor: selectedPlan === 'annual' ? 'primary.50' : 'transparent',
                          borderRadius: 1,
                          position: 'relative'
                        }}>
                          <Typography variant="subtitle1" fontWeight={600}>Annual</Typography>
                          <Chip 
                            size="small" 
                            label="Save 20%" 
                            color="success" 
                            sx={{ 
                              position: 'absolute', 
                              top: -10, 
                              right: -20,
                              fontWeight: 'bold',
                              fontSize: '0.65rem'
                            }} 
                          />
                        </Box>
                      }
                      sx={{ 
                        m: 0,
                        pl: 2
                      }}
                    />
                  </Paper>
                </RadioGroup>
              </FormControl>
            </Box>

            {/* Loading state */}
            {loadingServicePacks && (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                <CircularProgress />
              </Box>
            )}
            
            {/* Plan features */}
            {!loadingServicePacks && (
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={4} sx={{ width: '100%' }}>
                {/* Basic Plan */}
                <Box sx={{ width: { xs: '100%', md: '50%' } }}>
                  <Paper
                    elevation={1}
                    sx={{
                      p: 3,
                      borderRadius: 4,
                      height: '100%',
                      borderWidth: 2,
                      borderStyle: 'solid',
                      borderColor: 'divider',
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                  >
                    <Typography variant="h6" gutterBottom fontWeight="medium" color="text.secondary">
                      Current Free Plan
                    </Typography>
                    <Typography variant="h4" component="div" fontWeight="bold" sx={{ mb: 2 }}>
                      $0 <Typography component="span" variant="body2">/ forever</Typography>
                    </Typography>
                    
                    <List dense sx={{ mb: 2, flexGrow: 1 }}>
                      <ListItem>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <CheckCircleIcon fontSize="small" color="primary" />
                        </ListItemIcon>
                        <ListItemText primary="Create up to 5 quizzes" />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <CheckCircleIcon fontSize="small" color="primary" />
                        </ListItemIcon>
                        <ListItemText primary="Basic analytics" />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <CheckCircleIcon fontSize="small" color="primary" />
                        </ListItemIcon>
                        <ListItemText primary="Standard support" />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <CheckCircleIcon fontSize="small" color="primary" />
                        </ListItemIcon>
                        <ListItemText primary="Community templates" />
                      </ListItem>
                    </List>
                    
                    <Button
                      variant="outlined"
                      fullWidth
                      disabled
                      sx={{ mt: 2, borderRadius: 2, py: 1 }}
                    >
                      Current Plan
                    </Button>
                  </Paper>
                </Box>
                
                {/* Pro Plan */}
                <Box sx={{ width: { xs: '100%', md: '50%' } }}>
                  <Paper
                    elevation={4}
                    sx={{
                      p: 3,
                      borderRadius: 4,
                      height: '100%',
                      position: 'relative',
                      background: 'linear-gradient(to bottom right, #FFFFFF, #FFFAF0)',
                      borderWidth: 2,
                      borderStyle: 'solid',
                      borderColor: 'warning.main',
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                  >
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 12,
                        right: 12,
                        bgcolor: 'warning.main',
                        color: 'white',
                        px: 2,
                        py: 0.5,
                        borderRadius: 1,
                        fontWeight: 'bold',
                        fontSize: '0.75rem',
                        textTransform: 'uppercase',
                        letterSpacing: 1
                      }}
                    >
                      Most Popular
                    </Box>
                    
                    <Typography variant="h6" gutterBottom fontWeight="bold" color="warning.dark" sx={{ display: 'flex', alignItems: 'center' }}>
                      <StarRateIcon sx={{ mr: 1 }} /> Pro Account
                    </Typography>
                    
                    <Typography variant="h4" component="div" fontWeight="bold" color="warning.dark" sx={{ mb: 2 }}>
                      ${selectedPlan === 'monthly' ? '9.99' : '99.99'} <Typography component="span" variant="body2">/ {selectedPlan === 'monthly' ? 'month' : 'year'}</Typography>
                    </Typography>
                    
                    <List dense sx={{ mb: 2, flexGrow: 1 }}>
                      <ListItem>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <StarRateIcon fontSize="small" color="warning" />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Unlimited quizzes" 
                          primaryTypographyProps={{ fontWeight: 'bold' }} 
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <TrophyIcon fontSize="small" color="warning" />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Advanced analytics & leaderboards" 
                          primaryTypographyProps={{ fontWeight: 'bold' }} 
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <SpeedIcon fontSize="small" color="warning" />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Priority support (24h response)" 
                          primaryTypographyProps={{ fontWeight: 'bold' }} 
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <StorageIcon fontSize="small" color="warning" />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Premium templates & advanced customization" 
                          primaryTypographyProps={{ fontWeight: 'bold' }} 
                        />
                      </ListItem>
                      {selectedPlan === 'annual' && (
                        <ListItem>
                          <ListItemIcon sx={{ minWidth: 36 }}>
                            <CheckCircleIcon fontSize="small" color="success" />
                          </ListItemIcon>
                          <ListItemText 
                            primary="20% discount compared to monthly plan" 
                            primaryTypographyProps={{ fontWeight: 'bold', color: 'success.main' }} 
                          />
                        </ListItem>
                      )}
                    </List>
                    
                    <Button
                      variant="contained"
                      color="warning"
                      fullWidth
                      onClick={handleUpgradeToPro}
                      disabled={upgradingAccount}
                      startIcon={upgradingAccount ? <CircularProgress size={20} color="inherit" /> : null}
                      sx={{ 
                        mt: 2, 
                        borderRadius: 2, 
                        py: 1.5, 
                        fontWeight: 'bold',
                        boxShadow: 3
                      }}
                    >
                      {upgradingAccount ? 'Processing...' : 'Upgrade Now'}
                    </Button>
                  </Paper>
                </Box>
              </Stack>
            )}
          </DialogContent>
          
          <DialogActions sx={{ px: 4, pb: 4, justifyContent: 'center' }}>
            <Typography variant="caption" color="text.secondary" align="center">
              By upgrading, you agree to our Terms of Service and Privacy Policy.
              You can cancel your subscription at any time.
            </Typography>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Notification snackbar */}
      <Snackbar
        open={notificationOpen}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notificationType} 
          variant="filled"
          sx={{ width: '100%' }}
        >
          {notificationMessage}
        </Alert>
      </Snackbar>
    </MainLayout>
  );
}

// Wrap component with auth HOC
export default withAuth(Dashboard);