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
  IconButton,
  Chip,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Star as StarIcon,
  MoreVert as MoreVertIcon,
  StarBorder as StarBorderIcon,
  PlayArrow as PlayArrowIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
} from '@mui/icons-material';
import GameCard from '../components/GameCard';
import authService from '@/services/authService';
import quizService from '@/services/quizService';
import { useRouter } from 'next/navigation';

export default function FavoritesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [favoriteGames, setFavoriteGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    type: 'info'
  });
  const [favoriteLoading, setFavoriteLoading] = useState<{[key: string]: boolean}>({});

  // Function to format quiz data for display
  const formatQuizForDisplay = (quiz: any) => {
    return {
      id: quiz.id || 0,
      title: String(quiz.title || "Untitled Quiz"),
      description: String(quiz.description || "No description available"),
      imageUrl: quiz.thumbnailUrl || quiz.coverImage || quiz.imageUrl || "https://img.freepik.com/free-vector/quiz-neon-sign_1262-15536.jpg",
      questionsCount: Array.isArray(quiz.questions) ? quiz.questions.length : (quiz.questionsCount || 0),
      playsCount: quiz.playsCount || 0,
      creator: String(quiz.createdBy || quiz.creator || "Unknown"),
      gameCode: String(quiz.quizCode || ""),
      gameMode: quiz.gameMode || 'solo',
      favorite: true // Since these are all from the favorites API
    };
  };

  // Fetch favorite quizzes when component mounts
  useEffect(() => {
    fetchFavoriteQuizzes();
  }, []);

  // Function to fetch favorite quizzes from API
  const fetchFavoriteQuizzes = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if the user is authenticated
      if (authService.isAuthenticated()) {
        // Get the current user
        const currentUser = authService.getCurrentUser();
        if (currentUser && currentUser.id) {
          try {
            console.log("Fetching favorite quizzes from API for user", currentUser.id);
            const response = await quizService.getFavoriteQuizzes(parseInt(currentUser.id));
            
            if (response && response.data) {
              // Format the quizzes from server
              const formattedQuizzes = Array.isArray(response.data) 
                ? response.data.map(formatQuizForDisplay)
                : [];
              
              setFavoriteGames(formattedQuizzes);
              
              if (formattedQuizzes.length === 0) {
                setError("You don't have any favorite quizzes yet.");
              }
            } else {
              console.warn("Favorites API returned null or undefined data");
              setFavoriteGames([]);
              setError("No favorite quiz data available.");
            }
          } catch (error: any) {
            console.error("Error fetching favorite quizzes:", error);
            setFavoriteGames([]);
            setError("Failed to load your favorite quizzes. " + (error.message || "Please try again."));
          }
        } else {
          setError("User information not available. Please try logging in again.");
          setFavoriteGames([]);
        }
      } else {
        setError("You need to be logged in to view your favorites.");
        setFavoriteGames([]);
      }
    } catch (error: any) {
      console.error("Error in fetchFavoriteQuizzes:", error);
      setError("An unexpected error occurred: " + (error.message || "Please try again."));
      setFavoriteGames([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, gameId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedGameId(gameId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleRemoveClick = () => {
    handleMenuClose();
    setRemoveDialogOpen(true);
  };

  const handleRemoveConfirm = async () => {
    if (!selectedGameId) return;
    
    try {
      setFavoriteLoading(prev => ({ ...prev, [selectedGameId]: true }));
      
      // Use quizService to toggle favorite status (unfavorite it)
      await quizService.toggleFavorite(parseInt(selectedGameId));
      
      // Update the local state by removing the quiz
      const updatedFavorites = favoriteGames.filter(game => game.id !== selectedGameId);
      setFavoriteGames(updatedFavorites);
      
      // Show notification
      setNotification({
        open: true,
        message: "Quiz removed from favorites!",
        type: "success"
      });
      
      setRemoveDialogOpen(false);
    } catch (error) {
      console.error("Error removing from favorites:", error);
      setNotification({
        open: true,
        message: `Failed to remove from favorites: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: "error"
      });
    } finally {
      setFavoriteLoading(prev => ({ ...prev, [selectedGameId]: false }));
      setRemoveDialogOpen(false);
    }
  };

  const handleRemoveCancel = () => {
    setRemoveDialogOpen(false);
  };

  const handlePlayClick = () => {
    handleMenuClose();
    if (selectedGameId) {
      router.push(`/play-quiz/${selectedGameId}`);
    }
  };

  // Function to handle toggling favorite status directly from the UI
  const handleToggleFavorite = async (event: React.MouseEvent<HTMLElement>, gameId: string) => {
    event.stopPropagation(); // Prevent triggering the card click
    
    try {
      // Set loading state for this specific quiz
      setFavoriteLoading(prev => ({ ...prev, [gameId]: true }));
      
      // Use quizService to toggle favorite status
      await quizService.toggleFavorite(parseInt(gameId));
      
      // Update the local state by removing the quiz
      const updatedFavorites = favoriteGames.filter(game => game.id !== gameId);
      setFavoriteGames(updatedFavorites);
      
      // Show notification
      setNotification({
        open: true,
        message: "Quiz removed from favorites!",
        type: "success"
      });
      
    } catch (error) {
      console.error("Error toggling favorite:", error);
      setNotification({
        open: true,
        message: `Failed to update favorite status: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: "error"
      });
    } finally {
      // Clear loading state for this quiz
      setFavoriteLoading(prev => ({ ...prev, [gameId]: false }));
    }
  };

  // Function to handle notification close
  const handleCloseNotification = () => {
    setNotification({...notification, open: false});
  };

  // Filter quizzes based on search query
  const filteredGames = favoriteGames.filter(game => 
    game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    game.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <MainLayout>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: 'text.primary', mb: 3 }}>
          Favorites
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
            mb: 4,
          }}
        >
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search favorites..."
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
        </Paper>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 10 }}>
            <CircularProgress />
            <Typography sx={{ ml: 2 }}>Loading your favorite quizzes...</Typography>
          </Box>
        ) : error && favoriteGames.length === 0 ? (
          <Paper
            sx={{
              p: 6,
              borderRadius: 2,
              textAlign: 'center',
              bgcolor: 'background.paper',
              boxShadow: 1,
            }}
          >
            <StarIcon sx={{ fontSize: 60, color: 'text.secondary', opacity: 0.3, mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {error}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 400, mx: 'auto' }}>
              Browse through quizzes and click the heart icon to add them to your favorites.
            </Typography>
            <Button 
              variant="contained" 
              color="primary"
              component="a"
              href="/my-sets"
              sx={{ borderRadius: 2, textTransform: 'none' }}
            >
              View My Sets
            </Button>
          </Paper>
        ) : filteredGames.length > 0 ? (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            {filteredGames.map((game) => (
              <Box key={game.id} sx={{ width: { xs: '100%', sm: '45%', md: '30%' }, position: 'relative' }}>
                <Box sx={{ position: 'absolute', top: 10, right: 10, zIndex: 1 }}>
                  <IconButton
                    aria-label="more"
                    onClick={(e) => handleMenuOpen(e, game.id)}
                    sx={{ bgcolor: 'rgba(255, 255, 255, 0.8)', '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.9)' } }}
                  >
                    <MoreVertIcon />
                  </IconButton>
                </Box>
                
                {/* Add favorite button */}
                <Box sx={{ position: 'absolute', top: 10, left: 10, zIndex: 1 }}>
                  <IconButton
                    aria-label="Remove from favorites"
                    onClick={(e) => handleToggleFavorite(e, game.id)}
                    disabled={favoriteLoading[game.id]}
                    sx={{ 
                      bgcolor: 'rgba(255, 255, 255, 0.8)', 
                      '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.9)' },
                      color: 'error.main'
                    }}
                  >
                    {favoriteLoading[game.id] ? 
                      <CircularProgress size={24} color="inherit" /> : 
                      <FavoriteIcon />
                    }
                  </IconButton>
                </Box>
                
                <Box onClick={() => router.push(`/quiz-details/${game.id}`)} sx={{ cursor: 'pointer' }}>
                  <GameCard
                    title={game.title}
                    description={game.description}
                    imageUrl={game.imageUrl}
                    questionsCount={game.questionsCount}
                    playsCount={game.playsCount}
                    creator={game.creator}
                    gameCode={game.gameCode}
                    gameMode={game.gameMode}
                  />
                </Box>
              </Box>
            ))}
          </Box>
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
            <SearchIcon sx={{ fontSize: 60, color: 'text.secondary', opacity: 0.3, mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No matching quizzes found
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 400, mx: 'auto' }}>
              We couldn't find any favorites matching your search query. Try a different search term.
            </Typography>
            <Button 
              variant="outlined" 
              color="primary"
              onClick={() => setSearchQuery('')}
              sx={{ borderRadius: 2, textTransform: 'none' }}
            >
              Clear Search
            </Button>
          </Paper>
        )}
      </Box>

      {/* Menu for game actions */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handlePlayClick}>
          <PlayArrowIcon fontSize="small" sx={{ mr: 1 }} />
          Play
        </MenuItem>
        <MenuItem onClick={handleRemoveClick} sx={{ color: 'error.main' }}>
          <StarBorderIcon fontSize="small" sx={{ mr: 1 }} />
          Remove from Favorites
        </MenuItem>
      </Menu>

      {/* Remove from favorites confirmation dialog */}
      <Dialog
        open={removeDialogOpen}
        onClose={handleRemoveCancel}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {"Remove from Favorites?"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to remove this quiz from your favorites? You can always add it back later.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleRemoveCancel}>Cancel</Button>
          <Button 
            onClick={handleRemoveConfirm} 
            color="primary" 
            autoFocus
            disabled={favoriteLoading[selectedGameId || '']}
          >
            {favoriteLoading[selectedGameId || ''] ? 
              <CircularProgress size={24} /> : 
              'Remove'
            }
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notification snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.type}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </MainLayout>
  );
} 