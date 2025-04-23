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
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ContentCopy as DuplicateIcon,
  PlayArrow as PlayIcon,
} from '@mui/icons-material';
import GameCard from '../components/GameCard';

// Sample data for user's created games
const sampleSets = [
  {
    id: 1,
    title: 'World Geography',
    description: 'A comprehensive quiz on countries, capitals, and landmarks',
    imageUrl: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5ce?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
    questionsCount: 25,
    playsCount: 1200,
    creator: 'You',
    gameCode: '123456',
  },
  {
    id: 2,
    title: 'Math Fundamentals',
    description: 'Basic mathematical concepts for middle school students',
    imageUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
    questionsCount: 20,
    playsCount: 850,
    creator: 'You',
    gameCode: '234567',
  },
  {
    id: 3,
    title: 'Science Facts',
    description: 'Interesting science facts and discoveries',
    imageUrl: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
    questionsCount: 18,
    playsCount: 730,
    creator: 'You',
    gameCode: '345678',
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
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [mySets, setMySets] = useState<any[]>([]);
  const [codeDialogOpen, setCodeDialogOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState<any>(null);
  const [completedGames, setCompletedGames] = useState<any[]>([]);
  const [resultsDialogOpen, setResultsDialogOpen] = useState(false);
  const [gameResults, setGameResults] = useState<any[]>([]);

  // Load sets from localStorage when component mounts
  useEffect(() => {
    const storedSets = localStorage.getItem('mySets');
    if (storedSets) {
      setMySets(JSON.parse(storedSets));
    } else {
      // Use sample data if no stored sets found
      setMySets(sampleSets);
    }

    // Load completed games data
    const storedCompletedGames = localStorage.getItem('completedGames');
    if (storedCompletedGames) {
      setCompletedGames(JSON.parse(storedCompletedGames));
    }
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, gameId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedGameId(gameId);
    setSelectedGame(mySets.find(game => game.id === gameId));
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleDeleteClick = () => {
    handleMenuClose();
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    const updatedSets = mySets.filter(game => game.id !== selectedGameId);
    setMySets(updatedSets);
    localStorage.setItem('mySets', JSON.stringify(updatedSets));
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

  const handleShowCode = () => {
    handleMenuClose();
    setCodeDialogOpen(true);
  };

  const handleCloseCodeDialog = () => {
    setCodeDialogOpen(false);
  };

  const handleShowResults = (game: any) => {
    handleMenuClose();
    setGameResults(game.playerResults || []);
    setSelectedGame(game);
    setResultsDialogOpen(true);
  };

  const handleCloseResultsDialog = () => {
    setResultsDialogOpen(false);
  };

  const filteredSets = mySets.filter(game => 
    game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    game.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            href="/create-game"
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
            <Tab label="Completed Games" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          {filteredSets.length > 0 ? (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
              {filteredSets.map((game) => (
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
                    imageUrl={game.coverImage || game.imageUrl}
                    questionsCount={game.questions ? game.questions.length : game.questionsCount}
                    playsCount={game.playsCount}
                    creator={game.createdBy || game.creator}
                  />
                </Box>
              ))}
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Typography variant="h6" color="text.secondary">
                No sets found
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                Create your first set to get started
              </Typography>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                href="/create-game"
                sx={{
                  mt: 3,
                  borderRadius: 2,
                  textTransform: 'none',
                }}
              >
                Create New Set
              </Button>
            </Box>
          )}
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          {filteredSets.length > 0 ? (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
              {filteredSets.map((game) => (
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
                    imageUrl={game.coverImage || game.imageUrl}
                    questionsCount={game.questions ? game.questions.length : game.questionsCount}
                    playsCount={game.playsCount}
                    creator={game.createdBy || game.creator}
                  />
                </Box>
              ))}
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Typography variant="h6" color="text.secondary">
                No sets found
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                Create your first set to get started
              </Typography>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                href="/create-game"
                sx={{
                  mt: 3,
                  borderRadius: 2,
                  textTransform: 'none',
                }}
              >
                Create New Set
              </Button>
            </Box>
          )}
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
        
        <TabPanel value={tabValue} index={3}>
          {completedGames.length > 0 ? (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
              {completedGames
                .filter(game => 
                  game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  (game.description && game.description.toLowerCase().includes(searchQuery.toLowerCase()))
                )
                .map((game) => (
                <Box key={game.id} sx={{ width: { xs: '100%', sm: '45%', md: '30%' }, position: 'relative' }}>
                  <Box sx={{ position: 'absolute', top: 10, right: 10, zIndex: 1 }}>
                    <IconButton
                      aria-label="show results"
                      onClick={() => handleShowResults(game)}
                      sx={{ bgcolor: 'rgba(255, 255, 255, 0.8)', '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.9)' } }}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </Box>
                  <Paper
                    elevation={3}
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      height: '100%',
                      borderRadius: 3,
                      overflow: 'hidden',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 6,
                      },
                    }}
                  >
                    <Box
                      sx={{
                        height: 140,
                        position: 'relative',
                        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.6)), url(${game.coverImage})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        display: 'flex',
                        alignItems: 'flex-end',
                        p: 2,
                      }}
                    >
                      <Box sx={{ width: '100%' }}>
                        <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                          {game.title}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.8)', mt: 0.5 }}>
                            Completed: {new Date(game.dateCompleted).toLocaleDateString()}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>

                    <Box sx={{ p: 2, flexGrow: 1 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {game.description}
                      </Typography>

                      <Box sx={{ mt: 2 }}>
                        <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
                          <span style={{ fontWeight: 'bold', marginRight: '4px' }}>{game.playerResults?.length || 0}</span> players
                        </Typography>
                        <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
                          <span style={{ fontWeight: 'bold', marginRight: '4px' }}>{game.questions?.length || 0}</span> questions
                        </Typography>
                      </Box>
                    </Box>

                    <Divider />

                    <Box sx={{ p: 2, bgcolor: 'background.default' }}>
                      <Button
                        size="small"
                        onClick={() => handleShowResults(game)}
                        sx={{ textTransform: 'none', color: 'primary.main' }}
                      >
                        View Results
                      </Button>
                    </Box>
                  </Paper>
                </Box>
              ))}
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Typography variant="h6" color="text.secondary">
                No completed games yet
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                Games played by students will appear here
              </Typography>
            </Box>
          )}
        </TabPanel>
      </Box>

      {/* Menu for game actions */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleShowCode}>
          <Typography color="primary" sx={{ display: 'flex', alignItems: 'center' }}>
            <PlayIcon fontSize="small" sx={{ mr: 1 }} />
            Show Game Code
          </Typography>
        </MenuItem>
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
        <DialogTitle id="alert-dialog-title" component="div">
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

      {/* Game Code Dialog */}
      <Dialog
        open={codeDialogOpen}
        onClose={handleCloseCodeDialog}
        aria-labelledby="code-dialog-title"
      >
        <DialogTitle id="code-dialog-title" component="div" sx={{ textAlign: 'center' }}>
          Game Join Code
        </DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Share this code with students to join your game:
            </Typography>
            <Typography 
              variant="h3" 
              sx={{ 
                fontWeight: 'bold', 
                letterSpacing: 2,
                p: 2,
                borderRadius: 2,
                bgcolor: 'primary.light',
                color: 'primary.contrastText',
                display: 'inline-block'
              }}
            >
              {selectedGame?.gameCode}
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
            Students can enter this code on the home page
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
          <Button onClick={handleCloseCodeDialog} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Game Results Dialog */}
      <Dialog
        open={resultsDialogOpen}
        onClose={handleCloseResultsDialog}
        aria-labelledby="results-dialog-title"
        maxWidth="md"
        fullWidth
      >
        <DialogTitle id="results-dialog-title" component="div" sx={{ textAlign: 'center' }}>
          <Typography variant="h5" fontWeight="bold">
            Game Results: {selectedGame?.title}
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ py: 2 }}>
            <Typography variant="subtitle1" sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Completed: {selectedGame?.dateCompleted ? new Date(selectedGame.dateCompleted).toLocaleString() : 'Unknown'}</span>
              <span>{gameResults.length} Players</span>
            </Typography>
            
            {/* Scoring system explanation for teachers */}
            <Paper
              elevation={1}
              sx={{ 
                p: 2, 
                mb: 3, 
                borderRadius: 2, 
                backgroundColor: 'rgba(237, 247, 255, 0.7)',
                borderLeft: '4px solid #1976d2'
              }}
            >
              <Typography variant="subtitle2" color="primary" fontWeight="medium">
                Scoring System
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                • Students earn 100 base points for each correct answer
              </Typography>
              <Typography variant="body2">
                • Speed bonuses of up to 150 additional points are awarded based on answer speed
              </Typography>
              <Typography variant="body2">
                • Faster responses earn higher bonuses, encouraging quick thinking
              </Typography>
            </Paper>
            
            <List>
              {gameResults
                .sort((a, b) => b.score - a.score)
                .map((player, index) => (
                <React.Fragment key={index}>
                  {index > 0 && <Divider component="li" />}
                  <ListItem
                    sx={{
                      py: 2,
                      px: 3,
                      bgcolor: index < 3 ? `rgba(${index === 0 ? '255, 215, 0' : index === 1 ? '192, 192, 192' : '205, 127, 50'}, 0.1)` : 'transparent',
                      borderRadius: 1,
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <Box 
                        sx={{ 
                          width: 32, 
                          height: 32, 
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: index < 3 ? 'primary.main' : 'grey.300',
                          color: '#fff',
                          fontWeight: 'bold'
                        }}
                      >
                        {index + 1}
                      </Box>
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="subtitle1" component="div" sx={{ fontWeight: index < 3 ? 'bold' : 'regular' }}>
                            {player.name}
                          </Typography>
                          <Box sx={{ textAlign: 'right' }}>
                            <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', color: index < 3 ? 'primary.main' : 'text.primary' }}>
                              {player.score} points
                            </Typography>
                            {player.timeBonus > 0 && (
                              <Typography variant="caption" component="div" sx={{ color: 'secondary.main' }}>
                                includes {player.timeBonus} speed bonus
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      }
                      secondary={
                        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', mt: 0.5 }}>
                          <Typography variant="body2" component="div" sx={{ color: 'text.secondary' }}>
                            Correct answers: {player.correctAnswers}/{player.totalQuestions} 
                            {player.timeBonus ? ` • Time bonus: +${player.timeBonus}` : ''}
                          </Typography>
                          
                          {player.averageAnswerTime && (
                            <Typography variant="body2" component="div" color="text.secondary">
                              Avg. answer time: <strong>{player.averageAnswerTime}s</strong>
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                </React.Fragment>
              ))}
            </List>
            
            {/* Performance summary */}
            {gameResults.length > 0 && (
              <Paper
                elevation={1}
                sx={{ 
                  p: 2, 
                  mt: 3, 
                  borderRadius: 2, 
                  backgroundColor: 'rgba(246, 246, 246, 0.7)'
                }}
              >
                <Typography variant="subtitle2" component="div" gutterBottom>
                  Performance Summary
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: { xs: 2, sm: 4 }, justifyContent: 'space-around' }}>
                  <Box>
                    <Typography variant="body2" component="div" color="text.secondary">
                      Average Score
                    </Typography>
                    <Typography variant="h6" component="div" fontWeight="medium">
                      {Math.round(gameResults.reduce((sum, player) => sum + player.score, 0) / gameResults.length)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" component="div" color="text.secondary">
                      Correct Answer Rate
                    </Typography>
                    <Typography variant="h6" component="div" fontWeight="medium">
                      {Math.round((gameResults.reduce((sum, player) => sum + player.correctAnswers, 0) / 
                      (gameResults.reduce((sum, player) => sum + player.totalQuestions, 0))) * 100)}%
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" component="div" color="text.secondary">
                      Avg. Response Time
                    </Typography>
                    <Typography variant="h6" component="div" fontWeight="medium">
                      {gameResults[0].averageAnswerTime ? 
                        Math.round((gameResults.reduce((sum, player) => 
                          sum + (player.averageAnswerTime || 0), 0) / gameResults.length) * 10) / 10 + 's' :
                        'N/A'}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', p: 3 }}>
          <Button onClick={handleCloseResultsDialog} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </MainLayout>
  );
} 