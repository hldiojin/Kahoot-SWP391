'use client';

import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Tabs, Tab, Divider, Button, Avatar, Chip, Grid } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useAuth, withAuth } from '../context/AuthContext';
import MainLayout from '../components/MainLayout';
import GameCard from '../components/GameCard';
import { Add as AddIcon, TrendingUp as TrendingIcon, AccessTime as RecentIcon } from '@mui/icons-material';

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
  const router = useRouter();
  const [tabValue, setTabValue] = useState(0);
  const { user, isLoading } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Set mounted after client-side hydration to prevent errors
    setMounted(true);
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  const handleCreateGame = () => {
    router.push('/create-game');
  };

  // Prevent rendering until client-side hydration is complete
  if (!mounted) {
    return null;
  }

  return (
    <MainLayout>
      <Box sx={{ mb: 4 }}>
        {/* Welcome section with user info */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar 
              sx={{ 
                width: 64, 
                height: 64, 
                mr: 2,
                background: 'linear-gradient(45deg, #2196F3 30%, #9C27B0 90%)'
              }}
            >
              {user?.firstName?.charAt(0) || 'T'}{user?.lastName?.charAt(0) || 'D'}
            </Avatar>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                Welcome back, {user?.firstName || 'Teacher'}!
              </Typography>
              <Chip 
                label="Teacher" 
                color="primary" 
                size="small" 
                sx={{ mt: 0.5 }}
              />
            </Box>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateGame}
            sx={{
              background: 'linear-gradient(45deg, #2196F3 30%, #9C27B0 90%)',
              color: 'white',
              fontWeight: 'bold',
              borderRadius: 2,
              px: 3
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
            borderRadius: 2, 
            mb: 4, 
            background: 'linear-gradient(to right, #E0EAFC, #CFDEF3)',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-around',
            gap: 2
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
                py: 2
              }
            }}
          >
            <Tab icon={<RecentIcon />} label="Your Recent Quizzes" iconPosition="start" />
            <Tab icon={<TrendingIcon />} label="Community Quizzes" iconPosition="start" />
          </Tabs>
        </Box>

        {/* Game cards based on selected tab */}
        <Box>
          {tabValue === 0 ? (
            <Grid container spacing={3}>
              {sampleGames.map((game) => (
                <Grid key={game.id} item xs={12} sm={6} md={4} lg={3}>
                  <GameCard
                    title={game.title}
                    description={game.description}
                    imageUrl={game.imageUrl}
                    questionsCount={game.questionsCount}
                    playsCount={game.playsCount}
                    creator={game.creator}
                  />
                </Grid>
              ))}
            </Grid>
          ) : (
            <Grid container spacing={3}>
              {suggestedGames.concat(sampleGames.slice(0, 2)).map((game) => (
                <Grid key={`suggested-${game.id}`} item xs={12} sm={6} md={4} lg={3}>
                  <GameCard
                    title={game.title}
                    description={game.description}
                    imageUrl={game.imageUrl}
                    questionsCount={game.questionsCount}
                    playsCount={game.playsCount}
                    creator={game.creator}
                  />
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      </Box>
    </MainLayout>
  );
}

// Wrap component with auth HOC
export default withAuth(Dashboard);