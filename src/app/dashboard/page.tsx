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
  Alert
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useAuth, withAuth } from '../context/AuthContext';
import MainLayout from '../components/MainLayout';
import { 
  Add as AddIcon, 
  TrendingUp as TrendingIcon, 
  AccessTime as RecentIcon 
} from '@mui/icons-material';
import authService from '@/services/authService';
import quizService from '@/services/quizService';

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

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  const handleCreateGame = async () => {
    try {
      setCreatingQuiz(true);
      
      // Get current user information
      const currentUser = authService.getCurrentUser();
      if (!currentUser || !currentUser.id) {
        console.error("User ID not available");
        setNotificationMessage("User identification failed. Please try logging in again.");
        setNotificationType("error");
        setNotificationOpen(true);
        return;
      }

      // Generate a random quiz code
      const generatedQuizCode = quizService.generateQuizCode();

      // Create a default quiz
      const defaultQuizData = {
        id: 0,
        title: `New Quiz ${new Date().toLocaleDateString()}`,
        quizCode: generatedQuizCode,
        description: "My new interactive quiz",
        createdBy: parseInt(currentUser.id),
        categoryId: 1, // Default to Education category
        isPublic: true,
        thumbnailUrl: "https://img.freepik.com/free-vector/quiz-neon-sign_1262-15536.jpg",
        createdAt: new Date().toISOString()
      };

      // Call API to create quiz
      const response = await quizService.createQuiz(defaultQuizData);
      console.log("Default quiz created successfully:", response);

      // Show success notification
      setNotificationMessage("Quiz created successfully! Redirecting to editor...");
      setNotificationType("success");
      setNotificationOpen(true);

      // After a short delay, redirect to the quiz editor
      setTimeout(() => {
        router.push('/create-game');
      }, 1500);
      
    } catch (error) {
      console.error("Error creating quiz:", error);
      setNotificationMessage("Failed to create quiz. Please try again.");
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