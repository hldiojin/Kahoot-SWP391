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
  Tabs,
  Tab,
  IconButton,
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
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ContentCopy as DuplicateIcon,
} from '@mui/icons-material';
import GameCard from '../components/GameCard';

// Sample data for user's created games
const mySets = [
  {
    id: 1,
    title: 'World Geography',
    description: 'A comprehensive quiz on countries, capitals, and landmarks',
    imageUrl: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5ce?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
    questionsCount: 25,
    playsCount: 1200,
    creator: 'You',
  },
  {
    id: 2,
    title: 'Math Fundamentals',
    description: 'Basic mathematical concepts for middle school students',
    imageUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
    questionsCount: 20,
    playsCount: 850,
    creator: 'You',
  },
  {
    id: 3,
    title: 'Science Facts',
    description: 'Interesting science facts and discoveries',
    imageUrl: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
    questionsCount: 18,
    playsCount: 730,
    creator: 'You',
  },
];

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function MySetsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedGameId, setSelectedGameId] = useState<number | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, gameId: number) => {
    setAnchorEl(event.currentTarget);
    setSelectedGameId(gameId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleDeleteClick = () => {
    handleMenuClose();
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    // TODO: Implement delete functionality
    console.log(`Deleting game ${selectedGameId}`);
    setDeleteDialogOpen(false);
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
  };

  const handleEditClick = () => {
    handleMenuClose();
    // TODO: Implement edit functionality
    console.log(`Editing game ${selectedGameId}`);
  };

  const handleDuplicateClick = () => {
    handleMenuClose();
    // TODO: Implement duplicate functionality
    console.log(`Duplicating game ${selectedGameId}`);
  };

  return (
    <MainLayout>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
            My Sets
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 'bold',
            }}
          >
            Create New
          </Button>
        </Box>
        
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
            placeholder="Search your sets..."
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
        </Paper>

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            aria-label="my sets tabs"
            sx={{ 
              '& .MuiTab-root': { 
                textTransform: 'none',
                minWidth: 'auto',
                px: 3,
                fontWeight: 500,
              }
            }}
          >
            <Tab label="All Sets" />
            <Tab label="Created by Me" />
            <Tab label="Shared with Me" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            {mySets.map((game) => (
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
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            {mySets.map((game) => (
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
        </TabPanel>
        
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant="h6" color="text.secondary">
              No shared sets yet
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
              Sets shared with you will appear here
            </Typography>
          </Box>
        </TabPanel>
      </Box>

      {/* Menu for game actions */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEditClick}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem onClick={handleDuplicateClick}>
          <DuplicateIcon fontSize="small" sx={{ mr: 1 }} />
          Duplicate
        </MenuItem>
        <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {"Delete this set?"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            This action cannot be undone. This will permanently delete your set and remove all associated data.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </MainLayout>
  );
} 