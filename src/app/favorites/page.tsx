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
  IconButton,
  Chip,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Star as StarIcon,
  MoreVert as MoreVertIcon,
  StarBorder as StarBorderIcon,
  PlayArrow as PlayArrowIcon,
} from '@mui/icons-material';
import GameCard from '../components/GameCard';

// Sample data for favorite games
const favoriteGames = [
  {
    id: 1,
    title: 'Ancient History',
    description: 'Explore the fascinating world of ancient civilizations and their contributions',
    imageUrl: 'https://images.unsplash.com/photo-1564399580075-5dfe9c5068f2?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
    questionsCount: 30,
    playsCount: 3500,
    creator: 'HistoryProf',
  },
  {
    id: 2,
    title: 'Coding Challenges',
    description: 'Test your programming knowledge with these fun coding questions',
    imageUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
    questionsCount: 25,
    playsCount: 2800,
    creator: 'CodeMaster',
  },
  {
    id: 3,
    title: 'Literature Classics',
    description: 'Quiz on famous books, authors, and literary movements throughout history',
    imageUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
    questionsCount: 20,
    playsCount: 1600,
    creator: 'LitTeacher',
  },
  {
    id: 4,
    title: 'World Capitals',
    description: 'Test your knowledge of capital cities around the globe',
    imageUrl: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
    questionsCount: 50,
    playsCount: 5600,
    creator: 'GeoExpert',
  },
];

export default function FavoritesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedGameId, setSelectedGameId] = useState<number | null>(null);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, gameId: number) => {
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

  const handleRemoveConfirm = () => {
    // TODO: Implement remove from favorites functionality
    console.log(`Removing game ${selectedGameId} from favorites`);
    setRemoveDialogOpen(false);
  };

  const handleRemoveCancel = () => {
    setRemoveDialogOpen(false);
  };

  const handlePlayClick = () => {
    handleMenuClose();
    // TODO: Implement play game functionality
    console.log(`Playing game ${selectedGameId}`);
  };

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

        {favoriteGames.length > 0 ? (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            {favoriteGames.map((game) => (
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
            <StarIcon sx={{ fontSize: 60, color: 'text.secondary', opacity: 0.3, mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No favorites yet
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 400, mx: 'auto' }}>
              Start browsing and add games to your favorites. They will appear here for quick access.
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
            Are you sure you want to remove this game from your favorites? You can always add it back later.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleRemoveCancel}>Cancel</Button>
          <Button onClick={handleRemoveConfirm} color="primary" autoFocus>
            Remove
          </Button>
        </DialogActions>
      </Dialog>
    </MainLayout>
  );
} 