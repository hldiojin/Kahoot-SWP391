'use client';

import React, { useState, useEffect } from 'react';
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
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Alert
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
import { useRouter } from 'next/navigation';

// Interface for history item
interface HistoryItem {
  id: number;
  gameTitle: string;
  date: string;
  score: string;
  imageUrl: string;
  creator: string;
  isFavorite: boolean;
  quizId: number;
  quizCode: string;
  gameMode: 'solo' | 'team';
  correctAnswers: number;
  totalQuestions: number;
}

export default function HistoryPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [timeFilter, setTimeFilter] = useState('all');
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [openStatsDialog, setOpenStatsDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [noHistoryFound, setNoHistoryFound] = useState(false);

  // Load history from sessionStorage/localStorage on component mount
  useEffect(() => {
    loadHistoryData();
  }, []);

  // Function to load history data from storage
  const loadHistoryData = () => {
    setLoading(true);
    
    try {
      // Try to get saved history from localStorage (more persistent)
      const savedHistory = localStorage.getItem('quizHistory');
      let historyData: HistoryItem[] = [];
      
      if (savedHistory) {
        historyData = JSON.parse(savedHistory);
      } else {
        // If no history in localStorage, try to get the most recent game from sessionStorage
        const recentGameResults = sessionStorage.getItem('gameResults');
        const recentQuizData = sessionStorage.getItem('currentQuiz');
        const completeGameData = sessionStorage.getItem('completeGameData');
        
        if (recentGameResults && recentQuizData && completeGameData) {
          const parsedResults = JSON.parse(recentGameResults);
          const parsedQuiz = JSON.parse(recentQuizData);
          const parsedGameData = JSON.parse(completeGameData);
          
          if (parsedResults.length > 0 && parsedQuiz) {
            const playerResult = parsedResults[0];
            
            // Create a history item from the most recent game
            const newHistoryItem: HistoryItem = {
              id: Date.now(), // Use timestamp as ID
              gameTitle: parsedQuiz.title || 'Untitled Quiz',
              date: new Date().toLocaleString(),
              score: `${playerResult.score}`,
              imageUrl: parsedQuiz.thumbnailUrl || 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
              creator: 'You', // Default creator
              isFavorite: false,
              quizId: parsedQuiz.id || 0,
              quizCode: parsedQuiz.quizCode?.toString() || '000000',
              gameMode: (parsedQuiz.gameMode === 'team' || playerResult.group) ? 'team' : 'solo',
              correctAnswers: playerResult.correctAnswers || 0,
              totalQuestions: playerResult.totalQuestions || 0
            };
            
            historyData = [newHistoryItem];
            
            // Save this to localStorage for persistence
            localStorage.setItem('quizHistory', JSON.stringify(historyData));
          }
        }
      }
      
      if (historyData.length === 0) {
        setNoHistoryFound(true);
      }
      
      // Apply time filtering if needed
      const filteredItems = filterHistoryByTime(historyData, timeFilter);
      setHistoryItems(filteredItems);
    } catch (error) {
      console.error('Error loading history data:', error);
      setNoHistoryFound(true);
    } finally {
      setLoading(false);
    }
  };

  // Filter history items by time period
  const filterHistoryByTime = (items: HistoryItem[], filter: string) => {
    if (filter === 'all') return items;
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    return items.filter(item => {
      const itemDate = new Date(item.date);
      
      switch(filter) {
        case 'today':
          return itemDate >= today;
        case 'week':
          return itemDate >= weekStart;
        case 'month':
          return itemDate >= monthStart;
        default:
          return true;
      }
    });
  };

  // Handle time filter change
  const handleTimeFilterChange = (event: SelectChangeEvent<string>) => {
    const newFilter = event.target.value;
    setTimeFilter(newFilter);
    
    // Update filtered history items
    const allItems = localStorage.getItem('quizHistory');
    if (allItems) {
      const parsedItems = JSON.parse(allItems);
      const filteredItems = filterHistoryByTime(parsedItems, newFilter);
      setHistoryItems(filteredItems);
    }
  };

  // Handle clearing history
  const handleClearHistory = () => {
    setConfirmClearOpen(true);
  };

  // Confirm clearing history
  const confirmClearHistory = () => {
    localStorage.removeItem('quizHistory');
    setHistoryItems([]);
    setNoHistoryFound(true);
    setConfirmClearOpen(false);
  };

  // Handle toggling favorite status
  const handleToggleFavorite = (id: number) => {
    const updatedItems = historyItems.map(item => {
      if (item.id === id) {
        return {...item, isFavorite: !item.isFavorite};
      }
      return item;
    });
    
    setHistoryItems(updatedItems);
    localStorage.setItem('quizHistory', JSON.stringify(updatedItems));
  };

  // Handle replaying a quiz
  const handleReplay = (quizCode: string) => {
    if (!quizCode) return;
    
    // Store the quiz code in sessionStorage for the play-game page
    sessionStorage.setItem('quizCode', quizCode);
    router.push(`/play-game?code=${quizCode}`);
  };

  // Handle viewing statistics for a quiz
  const handleViewStats = (item: HistoryItem) => {
    setSelectedItem(item);
    setOpenStatsDialog(true);
  };

  // Filter history items by search query
  const filteredHistoryItems = historyItems.filter(item => 
    item.gameTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.creator.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            disabled={historyItems.length === 0}
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
              onChange={handleTimeFilterChange}
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

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 8 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {filteredHistoryItems.length > 0 ? (
              <Paper sx={{ borderRadius: 2, overflow: 'hidden', boxShadow: 1 }}>
                <List disablePadding>
                  {filteredHistoryItems.map((item, index) => (
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
                                <Chip
                                  size="small"
                                  label={item.gameMode === 'team' ? 'Team' : 'Solo'}
                                  color={item.gameMode === 'team' ? 'secondary' : 'default'}
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
                              onClick={() => handleReplay(item.quizCode)}
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
                              onClick={() => handleViewStats(item)}
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
            ) : (
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
                  {noHistoryFound ? 'No history yet' : 'No matches found'}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  {noHistoryFound 
                    ? 'Your recently played games will appear here so you can easily replay them.'
                    : 'Try adjusting your search or filter settings.'}
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
          </>
        )}
      </Box>

      {/* Stats Dialog */}
      <Dialog 
        open={openStatsDialog} 
        onClose={() => setOpenStatsDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Quiz Statistics
        </DialogTitle>
        <DialogContent dividers>
          {selectedItem && (
            <Stack spacing={2}>
              <Typography variant="h6">{selectedItem.gameTitle}</Typography>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography>Score:</Typography>
                <Typography variant="h6" color="primary">{selectedItem.score}</Typography>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography>Correct Answers:</Typography>
                <Typography>{`${selectedItem.correctAnswers} / ${selectedItem.totalQuestions}`}</Typography>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography>Accuracy:</Typography>
                <Typography>{`${Math.round((selectedItem.correctAnswers / selectedItem.totalQuestions) * 100)}%`}</Typography>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography>Game Mode:</Typography>
                <Chip label={selectedItem.gameMode === 'team' ? 'Team' : 'Solo'} 
                      color={selectedItem.gameMode === 'team' ? 'secondary' : 'default'} />
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography>Date Played:</Typography>
                <Typography>{selectedItem.date}</Typography>
              </Box>
              
              <Alert severity="info" sx={{ mt: 2 }}>
                You can replay this quiz to improve your score!
              </Alert>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenStatsDialog(false)}>Close</Button>
          <Button 
            variant="contained" 
            onClick={() => {
              setOpenStatsDialog(false);
              if (selectedItem) handleReplay(selectedItem.quizCode);
            }}
            startIcon={<ReplayIcon />}
          >
            Replay Quiz
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm Clear Dialog */}
      <Dialog
        open={confirmClearOpen}
        onClose={() => setConfirmClearOpen(false)}
      >
        <DialogTitle>Clear History?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to clear all your play history? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmClearOpen(false)}>Cancel</Button>
          <Button 
            onClick={confirmClearHistory} 
            color="error" 
            variant="contained"
          >
            Clear
          </Button>
        </DialogActions>
      </Dialog>
    </MainLayout>
  );
}