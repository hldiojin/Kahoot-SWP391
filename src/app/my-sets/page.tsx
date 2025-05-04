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
  ListItemSecondaryAction,
  Divider,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Chip,
  Avatar,
  Badge,
  Tooltip,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ContentCopy as DuplicateIcon,
  PlayArrow as PlayIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircleOutline as CheckCircleIcon,
  QuestionAnswer as QuestionAnswerIcon,
  Info as InfoIcon,
  Close as CloseIcon,
  Timer as TimerIcon,
  EmojiEvents as TrophyIcon,
  ContentCopy as CopyIcon,
  Group as GroupIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import GameCard from '../components/GameCard';
import authService from '@/services/authService';
import quizService from '@/services/quizService';
import questionService from '@/services/questionService';

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
  const [quizDetailsOpen, setQuizDetailsOpen] = useState(false);
  const [quizDetails, setQuizDetails] = useState<any>(null);
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  // Helper function to ensure data is properly formatted for GameCard
  const formatQuizForDisplay = (quiz: any) => {
    return {
      id: quiz.id || 0,
      title: String(quiz.title || "Untitled Quiz"),
      description: String(quiz.description || "No description available"),
      imageUrl: quiz.thumbnailUrl || quiz.coverImage || quiz.imageUrl || "https://img.freepik.com/free-vector/quiz-neon-sign_1262-15536.jpg",
      questionsCount: Array.isArray(quiz.questions) ? quiz.questions.length : (quiz.questionsCount || 0),
      playsCount: quiz.playsCount || 0,
      creator: String(quiz.createdBy || quiz.creator || "You"),
      gameCode: String(quiz.quizCode || ""),
      gameMode: quiz.gameMode || 'solo',
      minPlayer: quiz.minPlayer || 1,
      maxPlayer: quiz.maxPlayer || 50,
      teamCount: quiz.teamCount || 0,
      membersPerTeam: quiz.membersPerTeam || 0
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
            console.log("Fetching quizzes from API for user", currentUser.id);
            const response = await quizService.getMyQuizzes(parseInt(currentUser.id));
            
            if (response && response.data) {
              const formattedQuizzes = Array.isArray(response.data) 
                ? response.data.map(formatQuizForDisplay)
                : [];
              
              // Save quizzes to sessionStorage for future reference
              sessionStorage.setItem('myQuizzes', JSON.stringify(formattedQuizzes));
              console.log("Saved fetched quizzes to sessionStorage:", formattedQuizzes);
              
              setMySets(formattedQuizzes);
            } else {
              console.warn("Quiz API returned null or undefined data");
              setMySets([]);
              setError("No quiz data available. The server returned an empty response.");
            }
          } catch (error: any) {
            console.error("Error fetching quizzes:", error);
            
            // Try to use any quizzes from sessionStorage as fallback
            const storedQuizzes = sessionStorage.getItem('myQuizzes');
            if (storedQuizzes) {
              try {
                const parsedQuizzes = JSON.parse(storedQuizzes);
                console.log("Using cached quizzes as fallback:", parsedQuizzes);
                
                // Map the API quiz format to the format expected by GameCard component
                const formattedQuizzes = Array.isArray(parsedQuizzes) 
                  ? parsedQuizzes.map(formatQuizForDisplay)
                  : [];
                
                setMySets(formattedQuizzes);
                setError("⚠️ Using cached quiz data. Server returned an error: " + (error.message || "Unknown error"));
              } catch (parseError) {
                console.error("Error parsing cached quizzes:", parseError);
                setMySets([]);
                setError("Failed to load your quiz sets. " + (error.message || "Please try again."));
              }
            } else {
              setMySets([]);
              setError("Failed to load your quiz sets. " + (error.message || "Please try again."));
            }
          }
        } else {
          setError("User information not available. Please try logging in again.");
          setMySets([]);
        }
      } else {
        setError("You need to be logged in to view your sets.");
        setMySets([]);
      }
    } catch (error: any) {
      console.error("Error in fetchQuizzesFromAPI:", error);
      setError("An unexpected error occurred: " + (error.message || "Please try again."));
      
      // Try to use any existing quizzes in state or sessionStorage
      if (mySets.length === 0) {
        const storedQuizzes = sessionStorage.getItem('myQuizzes');
        if (storedQuizzes) {
          try {
            const parsedQuizzes = JSON.parse(storedQuizzes);
            const formattedQuizzes = Array.isArray(parsedQuizzes) 
              ? parsedQuizzes.map(formatQuizForDisplay)
              : [];
            
            setMySets(formattedQuizzes);
            console.log("Using cached quizzes after error:", formattedQuizzes);
          } catch (e) {
            console.error("Error parsing cached quizzes after global error:", e);
          }
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Load sets from sessionStorage when component mounts
  useEffect(() => {
    // Try to get quizzes from sessionStorage (should only contain the latest created quiz)
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
        // Start with empty array instead of fetching from API
        setMySets([]);
        setLoading(false);
      }
    } else {
      // If not in sessionStorage, use empty array instead of fetching from API
      setMySets([]);
      setLoading(false);
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

  const handleViewDetails = async (game: any) => {
    try {
      setLoadingDetails(true);
      setDetailsError(null);
      setQuizDetails(game);
      
      // Fetch questions for this quiz
      if (game && game.id) {
        try {
          const questionsResponse = await questionService.getQuestionsByQuizId(parseInt(game.id));
          if (questionsResponse && questionsResponse.data) {
            setQuizQuestions(Array.isArray(questionsResponse.data) ? questionsResponse.data : []);
          } else {
            setQuizQuestions([]);
          }
        } catch (questionError) {
          console.error("Error fetching quiz questions:", questionError);
          setQuizQuestions([]);
          setDetailsError("Could not load quiz questions. Using empty list.");
        }
      }
      
      setQuizDetailsOpen(true);
    } catch (error) {
      console.error("Error fetching quiz details:", error);
      setDetailsError("Failed to load quiz details. Please try again.");
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleCloseQuizDetails = () => {
    setQuizDetailsOpen(false);
  };

  // Helper function to display correct answer letter
  const getCorrectAnswerText = (question: any) => {
    if (!question.isCorrect) return 'N/A';
    
    switch(question.isCorrect.toUpperCase()) {
      case 'A': return question.optionA;
      case 'B': return question.optionB;
      case 'C': return question.optionC;
      case 'D': return question.optionD;
      default: return 'N/A';
    }
  };

  const filteredSets = mySets.filter(game => 
    game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    game.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Function to clear all quizzes
  const clearAllQuizzes = () => {
    // Clear sessionStorage
    sessionStorage.removeItem('myQuizzes');
    // Clear state
    setMySets([]);
    // Show confirmation
    setError(null);
  };

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
              color="secondary"
              onClick={clearAllQuizzes}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
              }}
            >
              Clear All
            </Button>
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
                      <Box onClick={() => handleViewDetails(game)} sx={{ cursor: 'pointer' }}>
                        <GameCard
                          title={String(game.title || "Untitled Quiz")}
                          description={String(game.description || "No description")}
                          imageUrl={game.imageUrl || "https://img.freepik.com/free-vector/quiz-neon-sign_1262-15536.jpg"}
                          questionsCount={typeof game.questionsCount === 'number' ? game.questionsCount : 0}
                          playsCount={typeof game.playsCount === 'number' ? game.playsCount : 0}
                          creator={String(game.creator || "You")}
                          gameCode={String(game.gameCode || "")}
                          gameMode={game.gameMode || "solo"}
                        />
                      </Box>
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
                      <Box onClick={() => handleViewDetails(game)} sx={{ cursor: 'pointer' }}>
                        <GameCard
                          title={String(game.title || "Untitled Quiz")}
                          description={String(game.description || "No description")}
                          imageUrl={game.imageUrl || "https://img.freepik.com/free-vector/quiz-neon-sign_1262-15536.jpg"}
                          questionsCount={typeof game.questionsCount === 'number' ? game.questionsCount : 0}
                          playsCount={typeof game.playsCount === 'number' ? game.playsCount : 0}
                          creator={String(game.creator || "You")}
                          gameCode={String(game.gameCode || "")}
                          gameMode={game.gameMode || "solo"}
                        />
                      </Box>
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

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEditClick}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Edit" />
        </MenuItem>
        <MenuItem onClick={handleDuplicateClick}>
          <ListItemIcon>
            <DuplicateIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Duplicate" />
        </MenuItem>
        <MenuItem onClick={handleShowCode}>
          <ListItemIcon>
            <PlayIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Show Game Code" />
        </MenuItem>
        <MenuItem onClick={handleDeleteClick}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText primary="Delete" sx={{ color: 'error.main' }} />
        </MenuItem>
      </Menu>

      <Dialog
        open={quizDetailsOpen}
        onClose={handleCloseQuizDetails}
        maxWidth="md"
        fullWidth
        aria-labelledby="quiz-details-dialog-title"
        PaperProps={{
          sx: {
            borderRadius: 2,
            overflow: 'hidden'
          }
        }}
      >
        {quizDetails && (
          <>
            <Box sx={{ position: 'relative' }}>
              <CardMedia
                component="img"
                height="240"
                image={quizDetails.imageUrl || quizDetails.coverImage || "https://img.freepik.com/free-vector/quiz-neon-sign_1262-15536.jpg"}
                alt={quizDetails.title}
              />
              <Box sx={{ 
                position: 'absolute', 
                top: 0, 
                left: 0, 
                width: '100%',
                height: '100%', 
                background: 'linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.7))',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                p: 3
              }}>
                <Typography variant="h4" component="h2" sx={{ color: 'white', fontWeight: 'bold', mb: 1 }}>
                  {quizDetails.title}
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  <Chip 
                    size="small"
                    icon={<QuestionAnswerIcon />} 
                    label={`${quizQuestions.length} Questions`}
                    sx={{ bgcolor: 'rgba(255,255,255,0.9)' }}
                  />
                  <Chip 
                    size="small"
                    icon={quizDetails.gameMode === 'team' ? <GroupIcon /> : <PersonIcon />} 
                    label={quizDetails.gameMode === 'team' ? `Team Mode` : `Solo Mode`}
                    sx={{ bgcolor: 'rgba(255,255,255,0.9)', color: quizDetails.gameMode === 'team' ? 'success.main' : 'primary.main' }}
                  />
                  <Chip 
                    size="small"
                    icon={<PersonIcon />} 
                    label={`${quizDetails.minPlayer || 1}-${quizDetails.maxPlayer || 50} Players`}
                    sx={{ bgcolor: 'rgba(255,255,255,0.9)' }}
                  />
                  <Chip 
                    size="small"
                    icon={<CopyIcon />} 
                    label={`Code: ${quizDetails.gameCode || 'N/A'}`}
                    color="primary"
                    sx={{ bgcolor: 'rgba(255,255,255,0.9)' }}
                  />
                </Box>
              </Box>
              <IconButton
                aria-label="close"
                onClick={handleCloseQuizDetails}
                sx={{ position: 'absolute', right: 8, top: 8, bgcolor: 'rgba(255,255,255,0.7)' }}
              >
                <CloseIcon />
              </IconButton>
            </Box>
            
            <DialogContent>
              {loadingDetails ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : detailsError ? (
                <Typography color="error">{detailsError}</Typography>
              ) : quizDetails ? (
                <>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body1" paragraph>
                      {quizDetails.description}
                    </Typography>
                    
                    <Box sx={{ 
                      display: 'flex', 
                      flexWrap: 'wrap', 
                      gap: 2, 
                      mb: 3,
                      p: 2,
                      bgcolor: 'rgba(0,0,0,0.03)',
                      borderRadius: 2
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                          <PersonIcon fontSize="small" />
                        </Avatar>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Creator
                          </Typography>
                          <Typography variant="body2">
                            {quizDetails.creator || "You"}
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ bgcolor: 'secondary.main', width: 32, height: 32 }}>
                          <TimerIcon fontSize="small" />
                        </Avatar>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Estimated Time
                          </Typography>
                          <Typography variant="body2">
                            {Math.ceil((quizQuestions.reduce((total, q) => total + (q.timeLimit || 30), 0)) / 60)} minutes
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ bgcolor: 'success.main', width: 32, height: 32 }}>
                          <TrophyIcon fontSize="small" />
                        </Avatar>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Total Points
                          </Typography>
                          <Typography variant="body2">
                            {quizQuestions.reduce((total, q) => total + (q.score || 0), 0)} points
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                    
                    {quizDetails.gameMode === 'team' && (
                      <Paper elevation={0} sx={{ 
                        p: 2, 
                        bgcolor: 'rgba(76, 175, 80, 0.08)', 
                        borderRadius: 2,
                        mb: 3,
                        border: '1px solid rgba(76, 175, 80, 0.2)'
                      }}>
                        <Typography variant="subtitle2" sx={{ 
                          display: 'flex', 
                          alignItems: 'center',
                          gap: 1,
                          color: 'success.main',
                          fontWeight: 'bold',
                          mb: 1
                        }}>
                          <GroupIcon fontSize="small" />
                          Team Mode Configuration
                        </Typography>
                        
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mt: 2 }}>
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Number of Teams
                            </Typography>
                            <Typography variant="body2" fontWeight="medium">
                              {quizDetails.teamCount || 4} teams
                            </Typography>
                          </Box>
                          
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Members per Team
                            </Typography>
                            <Typography variant="body2" fontWeight="medium">
                              {quizDetails.membersPerTeam || 5} players
                            </Typography>
                          </Box>
                          
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Total Capacity
                            </Typography>
                            <Typography variant="body2" fontWeight="medium">
                              {(quizDetails.teamCount || 4) * (quizDetails.membersPerTeam || 5)} players
                            </Typography>
                          </Box>
                        </Box>
                      </Paper>
                    )}
                  </Box>

                  <Typography variant="h6" gutterBottom sx={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    gap: 1,
                    pb: 1,
                    borderBottom: '1px solid',
                    borderColor: 'divider'
                  }}>
                    <QuestionAnswerIcon color="primary" />
                    Questions
                  </Typography>
                  
                  {quizQuestions.length > 0 ? (
                    quizQuestions.map((question, index) => (
                      <Accordion key={question.id || index} sx={{ mb: 1, borderRadius: 1, overflow: 'hidden' }}>
                        <AccordionSummary 
                          expandIcon={<ExpandMoreIcon />}
                          sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}
                        >
                          <Typography>{`${index + 1}. ${question.text}`}</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          <List dense>
                            <ListItem sx={{ 
                              color: question.isCorrect === 'A' ? 'success.main' : 'text.primary',
                              bgcolor: question.isCorrect === 'A' ? 'rgba(76, 175, 80, 0.1)' : 'transparent',
                              borderRadius: 1
                            }}>
                              {question.isCorrect === 'A' && <CheckCircleIcon color="success" sx={{ mr: 1 }} />}
                              <ListItemText primary={`A: ${question.optionA}`} />
                            </ListItem>
                            <ListItem sx={{ 
                              color: question.isCorrect === 'B' ? 'success.main' : 'text.primary',
                              bgcolor: question.isCorrect === 'B' ? 'rgba(76, 175, 80, 0.1)' : 'transparent',
                              borderRadius: 1
                            }}>
                              {question.isCorrect === 'B' && <CheckCircleIcon color="success" sx={{ mr: 1 }} />}
                              <ListItemText primary={`B: ${question.optionB}`} />
                            </ListItem>
                            {question.optionC && (
                              <ListItem sx={{ 
                                color: question.isCorrect === 'C' ? 'success.main' : 'text.primary',
                                bgcolor: question.isCorrect === 'C' ? 'rgba(76, 175, 80, 0.1)' : 'transparent',
                                borderRadius: 1
                              }}>
                                {question.isCorrect === 'C' && <CheckCircleIcon color="success" sx={{ mr: 1 }} />}
                                <ListItemText primary={`C: ${question.optionC}`} />
                              </ListItem>
                            )}
                            {question.optionD && (
                              <ListItem sx={{ 
                                color: question.isCorrect === 'D' ? 'success.main' : 'text.primary',
                                bgcolor: question.isCorrect === 'D' ? 'rgba(76, 175, 80, 0.1)' : 'transparent',
                                borderRadius: 1
                              }}>
                                {question.isCorrect === 'D' && <CheckCircleIcon color="success" sx={{ mr: 1 }} />}
                                <ListItemText primary={`D: ${question.optionD}`} />
                              </ListItem>
                            )}
                          </List>
                          <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                            <Chip
                              size="small"
                              icon={<TimerIcon fontSize="small" />}
                              label={`${question.timeLimit || 30} seconds`}
                              variant="outlined"
                            />
                            <Chip
                              size="small"
                              icon={<TrophyIcon fontSize="small" />}
                              label={`${question.score || 100} points`}
                              variant="outlined"
                            />
                          </Box>
                        </AccordionDetails>
                      </Accordion>
                    ))
                  ) : (
                    <Typography color="text.secondary" sx={{ py: 2 }}>
                      No questions found for this quiz.
                    </Typography>
                  )}
                </>
              ) : (
                <Typography color="text.secondary">Select a quiz to view details.</Typography>
              )}
            </DialogContent>
            <DialogActions sx={{ p: 2, gap: 1 }}>
              <Button 
                variant="outlined" 
                onClick={handleCloseQuizDetails}
              >
                Close
              </Button>
              <Button 
                variant="contained" 
                color="primary"
                startIcon={<PlayIcon />}
                onClick={() => {
                  // Store preview data for the demo
                  if (quizDetails && quizQuestions) {
                    const previewData = {
                      id: quizDetails.id,
                      title: quizDetails.title || 'Untitled Quiz',
                      description: quizDetails.description || 'Preview of your quiz',
                      gameMode: quizDetails.gameMode || 'solo',
                      questions: quizQuestions.map(q => ({
                        id: q.id,
                        question: q.text || 'Question',
                        options: [q.optionA, q.optionB, q.optionC, q.optionD].filter(Boolean),
                        correctAnswer: ['A', 'B', 'C', 'D'].indexOf(q.isCorrect) || 0,
                        timeLimit: q.timeLimit || 30,
                        points: q.score || 100
                      })),
                      category: 'Uncategorized',
                      isPublic: true,
                      coverImage: quizDetails.imageUrl || quizDetails.coverImage || 'https://source.unsplash.com/random/300x200?quiz',
                      createdBy: quizDetails.creator || 'User',
                      createdAt: new Date().toISOString()
                    };
                    
                    // Save to sessionStorage before opening preview
                    sessionStorage.setItem('quizPreviewData', JSON.stringify(previewData));
                    window.open('/play-quiz-preview', '_blank');
                  }
                }}
              >
                Play Demo
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </MainLayout>
  );
}