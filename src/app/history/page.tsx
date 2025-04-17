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
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  Avatar,
  IconButton,
  Chip,
  MenuItem,
  FormControl,
  Select,
  SelectChangeEvent,
} from '@mui/material';
import {
  Search as SearchIcon,
  DeleteOutline as DeleteIcon,
  Reply as ReplayIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  BarChart as StatsIcon,
  AccessTime as TimeIcon,
} from '@mui/icons-material';

// Sample data for the user's play history
const historyItems = [
  {
    id: 1,
    gameTitle: 'World Geography',
    date: 'Today at 10:30 AM',
    score: '85%',
    imageUrl: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5ce?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
    creator: 'GeoExpert',
    isFavorite: true,
  },
  {
    id: 2,
    gameTitle: 'Math Challenge',
    date: 'Yesterday at 3:45 PM',
    score: '92%',
    imageUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
    creator: 'MathWhiz',
    isFavorite: false,
  },
  {
    id: 3,
    gameTitle: 'Science Quiz',
    date: 'May 12, 2023',
    score: '78%',
    imageUrl: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
    creator: 'ScienceTeacher',
    isFavorite: true,
  },
  {
    id: 4,
    gameTitle: 'History Timeline',
    date: 'May 8, 2023',
    score: '65%',
    imageUrl: 'https://images.unsplash.com/photo-1447069387593-a5de0862481e?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
    creator: 'HistoryBuff',
    isFavorite: false,
  },
  {
    id: 5,
    gameTitle: 'Literature Classics',
    date: 'May 5, 2023',
    score: '95%',
    imageUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
    creator: 'BookWorm',
    isFavorite: false,
  }
];

export default function HistoryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [timeFilter, setTimeFilter] = useState('all');

  const handleTimeFilterChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setTimeFilter(event.target.value as string);
  };

  const handleClearHistory = () => {
    // TODO: Implement clear history functionality
    console.log('Clearing history');
  };

  const handleToggleFavorite = (id: number) => {
    // TODO: Implement toggle favorite functionality
    console.log(`Toggling favorite status for game ${id}`);
  };

  const handleReplay = (id: number) => {
    // TODO: Implement replay functionality
    console.log(`Replaying game ${id}`);
  };

  const handleViewStats = (id: number) => {
    // TODO: Implement view stats functionality
    console.log(`Viewing stats for game ${id}`);
  };

  return (
    <MainLayout>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
            History
          </Typography>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={handleClearHistory}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
            }}
          >
            Clear History
          </Button>
        </Box>

        <Paper
          sx={{
            p: 2,
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: 'center',
            gap: 2,
            bgcolor: 'background.paper',
            borderRadius: 2,
            boxShadow: 1,
            mb: 3,
          }}
        >
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search history..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
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
          <FormControl 
            variant="outlined" 
            sx={{ 
              minWidth: 120,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              }
            }}
          >
            <Select
              value={timeFilter}
              onChange={(event) => handleTimeFilterChange(event as any)}
              displayEmpty
              sx={{ bgcolor: 'background.default' }}
            >
              <MenuItem value="all">All Time</MenuItem>
              <MenuItem value="today">Today</MenuItem>
              <MenuItem value="week">This Week</MenuItem>
              <MenuItem value="month">This Month</MenuItem>
            </Select>
          </FormControl>
        </Paper>

        <Paper sx={{ borderRadius: 2, overflow: 'hidden', boxShadow: 1 }}>
          <List disablePadding>
            {historyItems.map((item, index) => (
              <React.Fragment key={item.id}>
                {index > 0 && <Divider />}
                <ListItem sx={{ py: 2 }}>
                  <ListItemAvatar>
                    <Avatar 
                      variant="rounded" 
                      src={item.imageUrl} 
                      alt={item.gameTitle}
                      sx={{ width: 56, height: 56, borderRadius: 2 }}
                    />
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography variant="subtitle1" component="div" fontWeight="medium">
                        {item.gameTitle}
                      </Typography>
                    }
                    secondary={
                      <Typography variant="body2" color="text.secondary" component="div">
                        by {item.creator}
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                          <Chip 
                            size="small" 
                            label={item.score} 
                            color="primary" 
                            sx={{ mr: 1, height: 24 }} 
                          />
                          <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
                            <TimeIcon fontSize="small" sx={{ fontSize: 14, mr: 0.5 }} />
                            <Typography variant="caption" component="span">
                              {item.date}
                            </Typography>
                          </Box>
                        </Box>
                      </Typography>
                    }
                    sx={{ ml: 1 }}
                  />
                  <ListItemSecondaryAction>
                    <Box sx={{ display: 'flex' }}>
                      <IconButton 
                        edge="end" 
                        aria-label="replay" 
                        onClick={() => handleReplay(item.id)}
                        sx={{ mr: 1 }}
                      >
                        <ReplayIcon />
                      </IconButton>
                      <IconButton 
                        edge="end" 
                        aria-label="favorite" 
                        onClick={() => handleToggleFavorite(item.id)}
                        color={item.isFavorite ? "error" : "default"}
                        sx={{ mr: 1 }}
                      >
                        {item.isFavorite ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                      </IconButton>
                      <IconButton 
                        edge="end" 
                        aria-label="stats" 
                        onClick={() => handleViewStats(item.id)}
                      >
                        <StatsIcon />
                      </IconButton>
                    </Box>
                  </ListItemSecondaryAction>
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        </Paper>

        {historyItems.length === 0 && (
          <Paper
            sx={{
              p: 6,
              borderRadius: 2,
              textAlign: 'center',
              bgcolor: 'background.paper',
              boxShadow: 1,
            }}
          >
            <TimeIcon sx={{ fontSize: 60, color: 'text.secondary', opacity: 0.3, mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No history yet
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Your recently played games will appear here so you can easily replay them.
            </Typography>
            <Button 
              variant="contained" 
              color="primary"
              component="a"
              href="/discover"
              sx={{ borderRadius: 2, textTransform: 'none' }}
            >
              Browse Games
            </Button>
          </Paper>
        )}
      </Box>
    </MainLayout>
  );
}