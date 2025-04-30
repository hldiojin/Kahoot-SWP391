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
  CircularProgress,
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
import authService from '@/services/authService';
import quizService from '@/services/quizService';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper function to ensure data is properly formatted for GameCard
  const formatQuizForDisplay = (quiz: any) => {
    return {
      id: quiz.id || 0,
      title: String(quiz.title || "Untitled Quiz"),
      description: String(quiz.description || "No description available"),
      imageUrl: quiz.thumbnailUrl || "https://img.freepik.com/free-vector/quiz-neon-sign_1262-15536.jpg",
      questionsCount: Array.isArray(quiz.questions) ? quiz.questions.length : (quiz.questionsCount || 0),
      playsCount: quiz.playsCount || 0,
      creator: String(quiz.createdBy || "You"),
      gameCode: String(quiz.quizCode || "")
    };
  };

  // Function to fetch quizzes from API
  const fetchQuizzesFromAPI = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if the user is authenticated
      if (authService.isAuthenticated()) {
        // Get the current user
        const currentUser = authService.getCurrentUser();
        if (currentUser && currentUser.id) {
          try {
            const response = await quizService.getMyQuizzes(parseInt(currentUser.id));
            
            if (response && response.data) {
              const formattedQuizzes = Array.isArray(response.data) 
                ? response.data.map(formatQuizForDisplay)
                : [];
              
              setMySets(formattedQuizzes);
            } else {
              setMySets([]);
            }
          } catch (error) {
            console.error("Error fetching quizzes:", error);
            setMySets([]);
            setError("Failed to load your quiz sets. Please try again.");
          }
        } else {
          setError("User information not available. Please try logging in again.");
          setMySets([]);
        }
      } else {
        setError("You need to be logged in to view your sets.");
        setMySets([]);
      }
    } catch (error) {
      console.error("Error in fetchQuizzesFromAPI:", error);
      setError("An unexpected error occurred. Please try again.");
      setMySets([]);
    } finally {
      setLoading(false);
    }
  };

  // Load sets from sessionStorage when component mounts
  useEffect(() => {
    // First try to get quizzes from sessionStorage (freshly created/updated)
    const storedQuizzes = sessionStorage.getItem('myQuizzes');
    
    if (storedQuizzes) {
      try {
        setLoading(true);
        const parsedQuizzes = JSON.parse(storedQuizzes);
        console.log("Loaded quizzes from sessionStorage:", parsedQuizzes);
        
        // Map the API quiz format to the format expected by GameCard component
        const formattedQuizzes = Array.isArray(parsedQuizzes) 
          ? parsedQuizzes.map(formatQuizForDisplay)
          : [];
        
        setMySets(formattedQuizzes);
        setLoading(false);
      } catch (error) {
        console.error("Error parsing quizzes from sessionStorage:", error);
        fetchQuizzesFromAPI();
      }
    } else {
      // If not in sessionStorage, try to fetch from API
      fetchQuizzesFromAPI();
    }

    // Load completed games data
    const storedCompletedGames = localStorage.getItem('completedGames');
    if (storedCompletedGames) {
      try {
        setCompletedGames(JSON.parse(storedCompletedGames));
      } catch (error) {
        console.error("Error parsing completed games:", error);
        setCompletedGames([]);
      }
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

  const handleDeleteConfirm = async () => {
    if (!selectedGameId) return;
    
    try {
      setLoading(true);
      // Call API to delete the quiz
      await quizService.deleteQuiz(parseInt(selectedGameId));
      
      // Update local state after successful deletion
      const updatedSets = mySets.filter(game => game.id !== selectedGameId);
      setMySets(updatedSets);
      
      // Close the dialog
      setDeleteDialogOpen(false);
      
      // Fetch updated quizzes to ensure our data is in sync with the server
      fetchQuizzesFromAPI();
    } catch (error) {
      console.error("Error deleting quiz:", error);
      setError("Failed to delete quiz. Please try again.");
      setLoading(false);
    }
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
  
  const handleRefreshQuizzes = () => {
    fetchQuizzesFromAPI();
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
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              color="primary"
              onClick={handleRefreshQuizzes}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
              }}
              disabled={loading}
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </Button>
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

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant="h6" color="error">
              {error}
            </Typography>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={fetchQuizzesFromAPI}
              sx={{ mt: 2 }}
            >
              Try Again
            </Button>
          </Box>
        ) : (
          <>
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
                        title={String(game.title || "Untitled Quiz")}
                        description={String(game.description || "No description")}
                        imageUrl={game.coverImage || game.imageUrl || "https://img.freepik.com/free-vector/quiz-neon-sign_1262-15536.jpg"}
                        questionsCount={typeof game.questionsCount === 'number' ? game.questionsCount : 0}
                        playsCount={typeof game.playsCount === 'number' ? game.playsCount : 0}
                        creator={String(game.creator || "You")}
                        gameCode={String(game.gameCode || "")}
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
            
            {/* Other tab panels with similar pattern - removed sample sets here too */}
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
                        title={String(game.title || "Untitled Quiz")}
                        description={String(game.description || "No description")}
                        imageUrl={game.coverImage || game.imageUrl || "https://img.freepik.com/free-vector/quiz-neon-sign_1262-15536.jpg"}
                        questionsCount={typeof game.questionsCount === 'number' ? game.questionsCount : 0}
                        playsCount={typeof game.playsCount === 'number' ? game.playsCount : 0}
                        creator={String(game.creator || "You")}
                        gameCode={String(game.gameCode || "")}
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
                  {/* Completed games content */}
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
          </>
        )}
      </Box>

      {/* Dialogs - unchanged */}
    </MainLayout>
  );
}