'use client';

import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Tabs, Tab, Divider, Button, Avatar, Chip, Grid } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import MainLayout from '../components/MainLayout';
import GameCard from '../components/GameCard';
import { Add as AddIcon, TrendingUp as TrendingIcon, AccessTime as RecentIcon } from '@mui/icons-material';

const sampleGames = [
  {
    id: '1',
    title: 'Math Challenge',
    description: 'Test your math skills with addition, subtraction, multiplication, and division problems.',
    imageUrl: 'https://source.unsplash.com/random/300x200?math',
    questionsCount: 20,
    playsCount: 1245,
    creator: 'John Doe'
  },
  {
    id: '2',
    title: 'Science Quiz',
    description: 'Explore the world of science with questions about biology, chemistry, and physics.',
    imageUrl: 'https://source.unsplash.com/random/300x200?science',
    questionsCount: 15,
    playsCount: 987,
    creator: 'Jane Smith'
  },
  {
    id: '3',
    title: 'History Test',
    description: 'Journey through time with questions about major historical events and figures.',
    imageUrl: 'https://source.unsplash.com/random/300x200?history',
    questionsCount: 25,
    playsCount: 756,
    creator: 'Alex Johnson'
  },
  {
    id: '4',
    title: 'Geography Quiz',
    description: 'Test your knowledge of countries, capitals, and geographical features.',
    imageUrl: 'https://source.unsplash.com/random/300x200?geography',
    questionsCount: 18,
    playsCount: 632,
    creator: 'Sarah Williams'
  }
];

const suggestedGames = [
  {
    id: '5',
    title: 'Literature Classics',
    description: 'Test your knowledge of famous authors and their works.',
    imageUrl: 'https://source.unsplash.com/random/300x200?books',
    questionsCount: 22,
    playsCount: 1832,
    creator: 'Michael Brown'
  },
  {
    id: '6',
    title: 'Computer Science',
    description: 'Coding, algorithms, and computer science concepts for all levels.',
    imageUrl: 'https://source.unsplash.com/random/300x200?programming',
    questionsCount: 30,
    playsCount: 2154,
    creator: 'Emily Davis'
  },
];

export default function Dashboard() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [tabValue, setTabValue] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Redirect if not authenticated
    if (!isLoading && !user) {
      router.push('/login');
    }
    setMounted(true);
  }, [user, isLoading, router]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Show nothing while checking authentication or redirecting
  if (isLoading || !user || !mounted) {
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
              {user.firstName.charAt(0)}{user.lastName.charAt(0)}
            </Avatar>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                Welcome back, {user.firstName}!
              </Typography>
              <Chip 
                label={user.role === 'teacher' ? 'Teacher' : 'Student'} 
                color={user.role === 'teacher' ? 'primary' : 'secondary'} 
                size="small" 
                sx={{ mt: 0.5 }}
              />
            </Box>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            sx={{
              background: 'linear-gradient(45deg, #2196F3 30%, #9C27B0 90%)',
              color: 'white',
              fontWeight: 'bold',
              borderRadius: 2,
              px: 3
            }}
          >
            Create New Set
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
            <Typography variant="h6" color="text.secondary">Sets Created</Typography>
            <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
              {user.role === 'teacher' ? '12' : '5'}
            </Typography>
          </Box>
          <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />
          <Box sx={{ textAlign: 'center', flex: 1, minWidth: 150 }}>
            <Typography variant="h6" color="text.secondary">Games Played</Typography>
            <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
              {user.role === 'teacher' ? '28' : '43'}
            </Typography>
          </Box>
          <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />
          <Box sx={{ textAlign: 'center', flex: 1, minWidth: 150 }}>
            <Typography variant="h6" color="text.secondary">Favorites</Typography>
            <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
              {user.role === 'teacher' ? '8' : '15'}
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
            <Tab icon={<RecentIcon />} label="Your Recent Sets" iconPosition="start" />
            <Tab icon={<TrendingIcon />} label="Recommended for You" iconPosition="start" />
          </Tabs>
        </Box>

        {/* Game cards based on selected tab */}
        <Box>
          {tabValue === 0 ? (
            <Grid container spacing={3}>
              {sampleGames.map((game) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={game.id}>
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
                <Grid item xs={12} sm={6} md={4} lg={3} key={`suggested-${game.id}`}>
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