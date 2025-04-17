'use client';

import React, { useState } from 'react';
import MainLayout from '../components/MainLayout';
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  Button,
  Paper,
  Chip,
  Stack,
  IconButton,
  Tab,
  Tabs,
  Grid,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  TrendingUp as TrendingIcon,
  Star as StarIcon,
  NewReleases as NewIcon,
  Category as CategoryIcon,
  School as SchoolIcon,
} from '@mui/icons-material';
import GameCard from '../components/GameCard';

// Sample data for games
const sampleGames = [
  {
    id: 1,
    title: 'Science Quiz',
    description: 'Test your knowledge of basic science concepts and discoveries',
    imageUrl: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
    questionsCount: 15,
    playsCount: 2300,
    creator: 'ScienceTeacher',
  },
  {
    id: 2,
    title: 'Geography Challenge',
    description: 'Explore countries, capitals, and landmarks around the world',
    imageUrl: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5ce?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
    questionsCount: 20,
    playsCount: 1850,
    creator: 'GeoExplorer',
  },
  {
    id: 3,
    title: 'Math Masters',
    description: 'Challenge yourself with algebra, geometry, and more',
    imageUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
    questionsCount: 25,
    playsCount: 3100,
    creator: 'MathWhiz',
  },
  {
    id: 4,
    title: 'History Timeline',
    description: 'Journey through significant historical events and figures',
    imageUrl: 'https://images.unsplash.com/photo-1447069387593-a5de0862481e?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
    questionsCount: 18,
    playsCount: 1650,
    creator: 'HistoryBuff',
  },
  {
    id: 5,
    title: 'Literary Classics',
    description: 'Test your knowledge of famous books and authors',
    imageUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
    questionsCount: 22,
    playsCount: 1200,
    creator: 'BookWorm',
  },
  {
    id: 6,
    title: 'Coding Basics',
    description: 'Learn programming concepts through fun questions',
    imageUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
    questionsCount: 30,
    playsCount: 4200,
    creator: 'CodeMaster',
  },
];

// Define categories for tabs
const categories = [
  { value: 'all', label: 'All' },
  { value: 'science', label: 'Science' },
  { value: 'math', label: 'Mathematics' },
  { value: 'english', label: 'English' },
  { value: 'history', label: 'History' },
  { value: 'geography', label: 'Geography' },
  { value: 'programming', label: 'Programming' },
];

export default function DiscoverPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
    setActiveTab(newValue);
  };

  return (
    <MainLayout>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: 'text.primary', mb: 2 }}>
          Discover Games
        </Typography>
        
        <Paper
          elevation={0}
          sx={{
            p: 2,
            display: 'flex',
            alignItems: 'center',
            bgcolor: 'background.paper',
            borderRadius: 2,
            boxShadow: 1,
            mb: 3,
          }}
        >
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search games..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton color="primary">
                    <FilterIcon />
                  </IconButton>
                </InputAdornment>
              ),
              sx: {
                '& fieldset': {
                  border: 'none',
                },
              },
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: 'background.default',
                borderRadius: 2,
              },
            }}
          />
          <Button
            variant="contained"
            color="primary"
            sx={{
              ml: 2,
              px: 4,
              py: 1.5,
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 'bold',
            }}
          >
            Search
          </Button>
        </Paper>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            aria-label="category tabs"
            sx={{ 
              '& .MuiTab-root': { 
                textTransform: 'none',
                minWidth: 'auto',
                px: 2,
                fontWeight: 500,
              }
            }}
          >
            {categories.map((category) => (
              <Tab 
                key={category.value} 
                value={category.value} 
                label={category.label}
              />
            ))}
          </Tabs>
          
          <Stack direction="row" spacing={1}>
            <Chip
              icon={<TrendingIcon />}
              label="Trending"
              color="primary"
              variant="outlined"
              clickable
            />
            <Chip
              icon={<StarIcon />}
              label="Popular"
              color="primary"
              variant="outlined"
              clickable
            />
            <Chip
              icon={<NewIcon />}
              label="New"
              color="primary"
              variant="outlined"
              clickable
            />
          </Stack>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 'medium', color: 'text.secondary', mb: 1 }}>
            Featured Collections
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 2 }}>
            <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 6', md: 'span 3' } }}>
              <Paper
                sx={{
                  p: 2,
                  borderRadius: 2,
                  height: '120px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  background: 'linear-gradient(45deg, #FF5252 30%, #FF1744 90%)',
                  color: 'white',
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                  },
                }}
              >
                <SchoolIcon sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="subtitle1" fontWeight="bold">
                  Education
                </Typography>
              </Paper>
            </Box>
            <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 6', md: 'span 3' } }}>
              <Paper
                sx={{
                  p: 2,
                  borderRadius: 2,
                  height: '120px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  background: 'linear-gradient(45deg, #2196F3 30%, #1976D2 90%)',
                  color: 'white',
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                  },
                }}
              >
                <CategoryIcon sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="subtitle1" fontWeight="bold">
                  Science
                </Typography>
              </Paper>
            </Box>
            <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 6', md: 'span 3' } }}>
              <Paper
                sx={{
                  p: 2,
                  borderRadius: 2,
                  height: '120px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  background: 'linear-gradient(45deg, #4CAF50 30%, #388E3C 90%)',
                  color: 'white',
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                  },
                }}
              >
                <CategoryIcon sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="subtitle1" fontWeight="bold">
                  Math
                </Typography>
              </Paper>
            </Box>
            <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 6', md: 'span 3' } }}>
              <Paper
                sx={{
                  p: 2,
                  borderRadius: 2,
                  height: '120px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  background: 'linear-gradient(45deg, #9C27B0 30%, #7B1FA2 90%)',
                  color: 'white',
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                  },
                }}
              >
                <CategoryIcon sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="subtitle1" fontWeight="bold">
                  History
                </Typography>
              </Paper>
            </Box>
          </Box>
        </Box>
      </Box>

      <Typography variant="h6" sx={{ fontWeight: 'medium', mb: 2 }}>
        All Games
      </Typography>
      
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        {sampleGames.map((game) => (
          <Box key={game.id} sx={{ width: { xs: '100%', sm: '45%', md: '30%' } }}>
            <GameCard
              title={game.title}
              description={game.description}
              imageUrl={game.imageUrl}
              questionsCount={game.questionsCount}
              playsCount={game.playsCount}
              creator={game.creator}
            />
          </Box>
        ))}
      </Box>
    </MainLayout>
  );
} 