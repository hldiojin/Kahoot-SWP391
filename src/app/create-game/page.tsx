'use client';

import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Paper, 
  IconButton, 
  FormControl, 
  InputLabel, 
  MenuItem, 
  Select,
  Chip,
  Stack,
  Divider,
  Card,
  CardContent,
  Tooltip,
  Stepper,
  Step,
  StepLabel,
  Container,
  Avatar,
  CardMedia,
  CardActions,
  useTheme,
  alpha,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  ToggleButton,
  ToggleButtonGroup,
  CircularProgress,
  Snackbar,
  Alert,
  Slider,
  FormControlLabel,
  Checkbox,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Grid
} from '@mui/material';
import { 
  Add as AddIcon, 
  Delete as DeleteIcon, 
  DragIndicator as DragIcon, 
  Image as ImageIcon,
  Save as SaveIcon,
  Preview as PreviewIcon,
  Edit as EditIcon,
  ArrowBack as BackIcon,
  ArrowForward as ForwardIcon,
  Help as HelpIcon,
  Timer as TimerIcon,
  VisibilityOff as PrivateIcon,
  Public as PublicIcon,
  CheckCircleOutline as CorrectIcon,
  HighlightOff as IncorrectIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon,
  PlayArrow as PlayIcon,
  QuestionMark as QuestionIcon,
  ContentCopy as ContentCopy,
  Person as PersonIcon,
  Groups as GroupsIcon,
  People as PeopleIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon
} from '@mui/icons-material';
import MainLayout from '../components/MainLayout';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import quizService from '@/services/quizService';
import questionService from '@/services/questionService';
import authService from '@/services/authService';
import groupService from '@/services/groupService';

// Interface for Question object
interface Question {
  id: string;
  text: string;
  timeLimit: number; // in seconds
  points: number;
  image: string | null;
  answers: Answer[];
  questionType: 'multiple-choice' | 'true-false' | 'quiz';
}

// Interface for Answer object
interface Answer {
  id: string;
  text: string;
  isCorrect: boolean;
  color: 'red' | 'blue' | 'green' | 'yellow';
}

// Default colors for answers
const answerColors: ('red' | 'blue' | 'green' | 'yellow')[] = ['red', 'blue', 'green', 'yellow'];

const CreateGamePage = () => {
  const router = useRouter();
  const { user } = useAuth();
  const theme = useTheme();
  const [activeStep, setActiveStep] = useState(0);
  const [quizTitle, setQuizTitle] = useState('');
  const [quizDescription, setQuizDescription] = useState('');
  const [quizCategory, setQuizCategory] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [gameMode, setGameMode] = useState<'solo' | 'team'>('solo');
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [minPlayers, setMinPlayers] = useState(1);
  const [maxPlayers, setMaxPlayers] = useState(50);
  const [isFavorite, setIsFavorite] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([{
    id: '1',
    text: '',
    timeLimit: 30,
    points: 100,
    image: null,
    answers: [
      { id: '1-1', text: '', isCorrect: false, color: 'red' },
      { id: '1-2', text: '', isCorrect: false, color: 'blue' },
      { id: '1-3', text: '', isCorrect: false, color: 'green' },
      { id: '1-4', text: '', isCorrect: false, color: 'yellow' },
    ],
    questionType: 'multiple-choice',
  }]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [gameCode, setGameCode] = useState('');
  
  // New state variables for API operations
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addingQuestion, setAddingQuestion] = useState(false);
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    type: 'info' as 'success' | 'error' | 'info' | 'warning'
  });
  const [createdQuizId, setCreatedQuizId] = useState<number | null>(null);

  // Add new state variables for team configuration
  const [teamCount, setTeamCount] = useState(4);
  const [membersPerTeam, setMembersPerTeam] = useState(5);
  const [teamNames, setTeamNames] = useState<string[]>(['Red Team', 'Blue Team', 'Green Team', 'Yellow Team']);

  // Steps for the quiz creation process
  const steps = ['Quiz Info', 'Add Questions', 'Preview & Finish'];

  // Function to add a new question
  const addQuestion = async () => {
    // Create the new question locally first
    const newQuestion: Question = {
      id: (questions.length + 1).toString(),
      text: '',
      timeLimit: 30,
      points: 100,
      image: null,
      answers: [
        { id: `${questions.length + 1}-1`, text: '', isCorrect: false, color: 'red' },
        { id: `${questions.length + 1}-2`, text: '', isCorrect: false, color: 'blue' },
        { id: `${questions.length + 1}-3`, text: '', isCorrect: false, color: 'green' },
        { id: `${questions.length + 1}-4`, text: '', isCorrect: false, color: 'yellow' },
      ],
      questionType: 'multiple-choice',
    };
    
    // Add to local state immediately for UI
    setQuestions([...questions, newQuestion]);
    setCurrentQuestionIndex(questions.length);
    
    // If we have a created quiz ID from submit, also add to the API
    if (createdQuizId) {
      try {
        setAddingQuestion(true);
        
        // Format the question for the API
        const questionApiData = questionService.formatQuestionForApi(
          newQuestion,
          createdQuizId,
          questions.length + 1 // Arrange property - 1-indexed position
        );
        
        // Call API to create question
        const response = await questionService.createQuestion(questionApiData);
        
        if (response.status === 201 || response.status === 200) {
          console.log("Question created successfully:", response);
          
          // Update the local question with the server-assigned ID
          if (response.data && response.data.id) {
            const updatedQuestions = [...questions, newQuestion];
            updatedQuestions[updatedQuestions.length - 1].id = response.data.id.toString();
            setQuestions(updatedQuestions);
          }
          
          setNotification({
            open: true,
            message: "Question added successfully!",
            type: "success"
          });
        } else {
          console.error("Failed to create question:", response);
          setNotification({
            open: true,
            message: `Failed to save question: ${response.message}`,
            type: "error"
          });
        }
      } catch (error) {
        console.error("Error creating question:", error);
        setNotification({
          open: true,
          message: `Error adding question: ${error instanceof Error ? error.message : 'Unknown error'}`,
          type: "error"
        });
      } finally {
        setAddingQuestion(false);
      }
    }
  };

  // Function to delete a question
  const deleteQuestion = (index: number) => {
    const newQuestions = [...questions];
    newQuestions.splice(index, 1);
    setQuestions(newQuestions);
    if (currentQuestionIndex >= newQuestions.length) {
      setCurrentQuestionIndex(Math.max(0, newQuestions.length - 1));
    }
  };

  // Function to handle question text change
  const handleQuestionChange = (index: number, text: string) => {
    const newQuestions = [...questions];
    newQuestions[index].text = text;
    setQuestions(newQuestions);
  };

  // Function to handle answer text change
  const handleAnswerChange = (questionIndex: number, answerIndex: number, text: string) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].answers[answerIndex].text = text;
    setQuestions(newQuestions);
  };

  // Function to toggle if an answer is correct
  const toggleAnswerCorrect = (questionIndex: number, answerIndex: number) => {
    const newQuestions = [...questions];
    if (newQuestions[questionIndex].questionType === 'multiple-choice') {
      newQuestions[questionIndex].answers[answerIndex].isCorrect = 
        !newQuestions[questionIndex].answers[answerIndex].isCorrect;
    } else {
      // For true-false or quiz type, only one answer can be correct
      newQuestions[questionIndex].answers.forEach((answer, idx) => {
        answer.isCorrect = idx === answerIndex;
      });
    }
    setQuestions(newQuestions);
  };

  // Function to handle question type change
  const handleQuestionTypeChange = (questionIndex: number, type: 'multiple-choice' | 'true-false' | 'quiz') => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].questionType = type;
    
    // Reset answers based on the question type
    if (type === 'true-false') {
      newQuestions[questionIndex].answers = [
        { id: `${questionIndex + 1}-1`, text: 'True', isCorrect: false, color: 'green' },
        { id: `${questionIndex + 1}-2`, text: 'False', isCorrect: false, color: 'red' },
      ];
    } else if (newQuestions[questionIndex].answers.length < 4 && type === 'multiple-choice') {
      // Add back answers if changing from true-false to multiple-choice
      const currentAnswers = newQuestions[questionIndex].answers;
      while (currentAnswers.length < 4) {
        currentAnswers.push({ 
          id: `${questionIndex + 1}-${currentAnswers.length + 1}`, 
          text: '', 
          isCorrect: false, 
          color: answerColors[currentAnswers.length] 
        });
      }
    }
    
    setQuestions(newQuestions);
  };

  // Function to handle time limit change
  const handleTimeLimitChange = (questionIndex: number, timeLimit: number) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].timeLimit = timeLimit;
    setQuestions(newQuestions);
  };

  // Function to handle points change
  const handlePointsChange = (questionIndex: number, points: number) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].points = points;
    setQuestions(newQuestions);
  };

  // Function to handle mock file upload
  const handleFileUpload = (questionIndex: number) => {
    // This would typically involve an actual file upload to a server
    // For now, we'll just set a random image URL
    const randomImageId = Math.floor(Math.random() * 1000);
    const newQuestions = [...questions];
    newQuestions[questionIndex].image = `https://source.unsplash.com/random/600x400?quiz,${randomImageId}`;
    setQuestions(newQuestions);
  };

  // Function to remove an image
  const removeImage = (questionIndex: number) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].image = null;
    setQuestions(newQuestions);
  };

  // Function to handle quiz cover image upload
  const handleCoverImageUpload = () => {
    // Mock upload
    const randomImageId = Math.floor(Math.random() * 1000);
    setCoverImage(`https://source.unsplash.com/random/900x600?quiz,${randomImageId}`);
  };

  // Functions to reorder questions with arrow buttons
  const moveQuestionUp = (index: number) => {
    if (index > 0) {
      const newQuestions = [...questions];
      const temp = newQuestions[index];
      newQuestions[index] = newQuestions[index - 1];
      newQuestions[index - 1] = temp;
      setQuestions(newQuestions);
      setCurrentQuestionIndex(index - 1);
    }
  };

  const moveQuestionDown = (index: number) => {
    if (index < questions.length - 1) {
      const newQuestions = [...questions];
      const temp = newQuestions[index];
      newQuestions[index] = newQuestions[index + 1];
      newQuestions[index + 1] = temp;
      setQuestions(newQuestions);
      setCurrentQuestionIndex(index + 1);
    }
  };

  // Function to navigate quiz creation steps
  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  // Function to handle team name changes
  const handleTeamNameChange = (index: number, newName: string) => {
    const newTeamNames = [...teamNames];
    newTeamNames[index] = newName;
    setTeamNames(newTeamNames);
  };

  // Function to handle game mode change
  const handleGameModeChange = (
    event: React.MouseEvent<HTMLElement>,
    newMode: 'solo' | 'team' | null,
  ) => {
    if (newMode !== null) {
      setGameMode(newMode);
      // Reset to default values when switching to team mode
      if (newMode === 'team') {
        setTeamCount(4); // Default to 4 teams
        setMembersPerTeam(5); // Default to 5 members per team
        setMinPlayers(4); // Minimum players needed (at least 1 per team)
        setMaxPlayers(4 * 5); // Default max players (teamCount * membersPerTeam)
        // Reset team names to defaults if they've been modified
        setTeamNames(['Red Team', 'Blue Team', 'Green Team', 'Yellow Team']);
      } else {
        // Reset to solo mode defaults
        setMinPlayers(1);
        setMaxPlayers(50);
      }
    }
  };

  // Function to submit the quiz
  const submitQuiz = async () => {
    try {
      setIsSubmitting(true);
      
      // Generate a unique 6-digit game code
      const generatedQuizCode = quizService.generateQuizCode();
      setGameCode(generatedQuizCode.toString());
      
      // Get current user information
      const currentUser = authService.getCurrentUser();
      if (!currentUser || !currentUser.id) {
        console.error("User ID not available");
        setNotification({
          open: true,
          message: "User ID not available. Please log in again.",
          type: "error"
        });
        return;
      }

      // Create the game data object for API
      const quizApiData = {
        title: quizTitle || 'Untitled Quiz',
        description: quizDescription || '',
        createdBy: parseInt(currentUser.id),
        categoryId: quizCategory ? getCategoryId(quizCategory) : 1,
        isPublic: isPublic,
        thumbnailUrl: coverImage || 'https://img.freepik.com/free-vector/quiz-neon-sign_1262-15536.jpg',
        createdAt: new Date().toISOString(),
        quizCode: generatedQuizCode,
        maxPlayer: maxPlayers, // Maximum players allowed
        minPlayer: minPlayers, // Minimum players required
        favorite: isFavorite, // Set favorite status
        gameMode: gameMode, // 'solo' or 'team'
        // Add team configuration
        teamCount: gameMode === 'team' ? teamCount : undefined,
        membersPerTeam: gameMode === 'team' ? membersPerTeam : undefined
      };

      console.log("Sending quiz data to API:", quizApiData);
      
      // Call API to create quiz
      const response = await quizService.createQuiz(quizApiData);
      console.log("Quiz created successfully:", response);
      
      // Check result from API
      if (response.status === 201 || response.status === 200) {
        // Save new quiz ID
        const quizId = response.data && response.data.id;
        if (quizId) {
          setCreatedQuizId(quizId);
          
          // Create teams if in team mode
          if (gameMode === 'team') {
            try {
              // Use only the number of teams selected by the user
              const selectedTeamNames = teamNames.slice(0, teamCount);
              
              const teamPromises = selectedTeamNames.map((teamName, index) => {
                const groupData = {
                  id: 0,
                  name: teamName,
                  description: `${teamName} for quiz ${quizId}`,
                  rank: index + 1,
                  maxMembers: membersPerTeam,
                  totalPoint: 0,
                  createdBy: currentUser.id,
                  createdAt: new Date().toISOString(),
                  quizId: quizId
                };
                
                return groupService.createGroup(groupData);
              });
              
              const teamResults = await Promise.allSettled(teamPromises);
              console.log("Team creation results:", teamResults);
              
              // Count successful team creations
              const successfulTeams = teamResults.filter(result => result.status === 'fulfilled').length;
              console.log(`Successfully created ${successfulTeams} teams for quiz ${quizId}`);
            } catch (teamError) {
              console.error("Error creating teams:", teamError);
              // Continue even if team creation fails
            }
          }
        }
        
        // Save quiz code for created game
        if (response.data && response.data.quizCode) {
          setGameCode(response.data.quizCode.toString());
        }

        // Show success notification
        setNotification({
          open: true,
          message: "Quiz created successfully!",
          type: "success"
        });
        
        // Show success dialog with code
        setSuccessDialogOpen(true);
        
        // Create questions
        if (questions.length > 0 && response.data.id) {
          // Create questions in parallel - don't wait for each other
          const questionPromises = questions.map((question, index) => {
            try {
              const questionApiData = questionService.formatQuestionForApi(
                question,
                response.data.id,
                index + 1
              );
              return questionService.createQuestion(questionApiData);
            } catch (error) {
              console.error(`Error creating question ${index + 1}:`, error);
              return Promise.reject(error);
            }
          });
          
          // Wait for all questions to be created
          try {
            await Promise.allSettled(questionPromises);
            console.log("All questions created or attempted");
          } catch (questionErrors) {
            console.error("Some questions failed to create:", questionErrors);
          }
        }
      } else {
        throw new Error(response.message || "Failed to create quiz");
      }
    } catch (error) {
      console.error("Error creating quiz:", error);
      setNotification({
        open: true,
        message: `Failed to create quiz: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: "error"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to map category string to category ID
  const getCategoryId = (category: string): number => {
    const categoryMap: { [key: string]: number } = {
      'education': 1,
      'science': 2,
      'math': 3,
      'language': 4,
      'geography': 5,
      'history': 6,
      'art': 7,
      'music': 8,
      'sports': 9,
      'other': 10
    };
    return categoryMap[category] || 0;
  };

  // Add copy to clipboard function
  const copyCodeToClipboard = () => {
    navigator.clipboard.writeText(gameCode);
    
    // Show notification when copied
    setNotification({
      open: true,
      message: "Game code copied to clipboard!",
      type: "success"
    });
  };

  // Function to generate colors based on question index
  const generateQuestionColor = (index: number) => {
    const colors = [
      '#2196F3', // Blue
      '#9C27B0', // Purple
      '#F44336', // Red
      '#4CAF50', // Green
      '#FF9800', // Orange
      '#009688', // Teal
      '#673AB7', // Deep Purple
      '#3F51B5', // Indigo
    ];
    return colors[index % colors.length];
  };

  // Handle preview quiz - saves current quiz data to sessionStorage
  const handlePreview = () => {
    const quizData = {
      id: 'preview-' + Date.now(),
      title: quizTitle || 'Untitled Quiz',
      description: quizDescription || 'Preview of your quiz',
      gameMode: gameMode,
      questions: questions.map(q => ({
        id: q.id,
        question: q.text || 'Question',
        options: q.answers.map(a => a.text || 'Option'),
        correctAnswer: q.answers.findIndex(a => a.isCorrect) || 0,
        timeLimit: q.timeLimit || 20,
        points: q.points || 100
      })),
      category: quizCategory || 'Uncategorized',
      isPublic: isPublic,
      coverImage: coverImage || 'https://source.unsplash.com/random/300x200?quiz',
      createdBy: user?.firstName + ' ' + user?.lastName || 'User',
      createdAt: new Date().toISOString()
    };

    // Save to sessionStorage before opening preview
    sessionStorage.setItem('quizPreviewData', JSON.stringify(quizData));
    window.open('/play-quiz-preview', '_blank');
  };

  // Function to handle notification close
  const handleNotificationClose = () => {
    setNotification({ ...notification, open: false });
  };

  // Render the current step content
  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ mt: 4, maxWidth: 700, mx: 'auto' }}>
            <Card 
              elevation={3} 
              sx={{ 
                borderRadius: 3, 
                overflow: 'hidden',
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)'
                }
              }}
            >
              {coverImage ? (
                <Box sx={{ position: 'relative' }}>
                  <CardMedia
                    component="img"
                    height="200"
                    image={coverImage}
                    alt="Quiz cover"
                  />
                  <Box sx={{ 
                    position: 'absolute', 
                    bottom: 0, 
                    left: 0, 
                    width: '100%', 
                    p: 2,
                    background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                    color: 'white'
                  }}>
                    <Typography variant="h6" fontWeight="bold">
                      {quizTitle || 'Your New Quiz'}
                    </Typography>
                  </Box>
                  <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
                    <IconButton 
                      color="error" 
                      sx={{ bgcolor: 'rgba(255,255,255,0.8)' }}
                      onClick={() => setCoverImage(null)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>
              ) : null}
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom color="primary">
                  Quiz Details
                </Typography>
                <Box sx={{ mb: 3 }}>
                  <TextField
                    required
                    fullWidth
                    label="Quiz Title"
                    value={quizTitle}
                    onChange={(e) => setQuizTitle(e.target.value)}
                    variant="outlined"
                    sx={{ mb: 3 }}
                  />
                  <TextField
                    fullWidth
                    label="Description"
                    multiline
                    rows={3}
                    value={quizDescription}
                    onChange={(e) => setQuizDescription(e.target.value)}
                    variant="outlined"
                    sx={{ mb: 3 }}
                    placeholder="Describe what this quiz is about..."
                  />
                  <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 3 }}>
                    <FormControl fullWidth>
                      <InputLabel>Category</InputLabel>
                      <Select
                        value={quizCategory}
                        label="Category"
                        onChange={(e) => setQuizCategory(e.target.value)}
                      >
                        <MenuItem value="education">Education</MenuItem>
                        <MenuItem value="science">Science</MenuItem>
                        <MenuItem value="math">Math</MenuItem>
                        <MenuItem value="language">Language</MenuItem>
                        <MenuItem value="geography">Geography</MenuItem>
                        <MenuItem value="history">History</MenuItem>
                        <MenuItem value="art">Art</MenuItem>
                        <MenuItem value="music">Music</MenuItem>
                        <MenuItem value="sports">Sports</MenuItem>
                        <MenuItem value="other">Other</MenuItem>
                      </Select>
                    </FormControl>
                    <FormControl fullWidth>
                      <InputLabel>Visibility</InputLabel>
                      <Select
                        value={isPublic ? 'true' : 'false'}
                        label="Visibility"
                        onChange={(e) => setIsPublic(e.target.value === 'true')}
                      >
                        <MenuItem value="true">
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <PublicIcon fontSize="small" sx={{ mr: 1 }} />
                            Public
                          </Box>
                        </MenuItem>
                        <MenuItem value="false">
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <PrivateIcon fontSize="small" sx={{ mr: 1 }} />
                            Private
                          </Box>
                        </MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                  
                  {/* Game Mode Selection */}
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Game Mode
                    </Typography>
                    <ToggleButtonGroup
                      value={gameMode}
                      exclusive
                      onChange={handleGameModeChange}
                      aria-label="game mode"
                      fullWidth
                      sx={{ 
                        '& .MuiToggleButton-root': {
                          py: 1.5,
                          borderRadius: 2,
                          border: '1px solid',
                          borderColor: 'divider'
                        },
                        '& .MuiToggleButton-root.Mui-selected': {
                          backgroundColor: theme => alpha(theme.palette.primary.main, 0.1),
                          borderColor: theme => theme.palette.primary.main,
                          fontWeight: 'bold'
                        }
                      }}
                    >
                      <ToggleButton value="solo" aria-label="solo mode">
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                          <PersonIcon />
                          <Typography variant="body2">Solo Mode</Typography>
                          <Typography variant="caption" color="text.secondary">
                            Every player competes individually
                          </Typography>
                        </Box>
                      </ToggleButton>
                      <ToggleButton value="team" aria-label="team mode">
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                          <GroupsIcon />
                          <Typography variant="body2">Team Mode</Typography>
                          <Typography variant="caption" color="text.secondary">
                            Players are grouped into teams
                          </Typography>
                        </Box>
                      </ToggleButton>
                    </ToggleButtonGroup>
                  </Box>
                  
                  {/* Team Configuration (only shown when team mode is selected) */}
                  {gameMode === 'team' && (
                    <Paper sx={{ p: 2, mb: 3, borderRadius: 2, bgcolor: alpha(theme.palette.info.light, 0.1) }}>
                      <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                        <GroupsIcon sx={{ mr: 1, fontSize: '1.2rem' }} />
                        Team Configuration
                      </Typography>
                      
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" gutterBottom color="text.secondary">
                          Number of Teams: {teamCount}
                        </Typography>
                        <Slider
                          value={teamCount}
                          onChange={(_, value) => {
                            setTeamCount(value as number);
                            setMaxPlayers((value as number) * membersPerTeam);
                          }}
                          step={1}
                          marks
                          min={1}
                          max={4}
                          valueLabelDisplay="auto"
                          aria-labelledby="team-count-slider"
                        />
                      </Box>
                      
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="body2" gutterBottom color="text.secondary">
                          Players per Team: {membersPerTeam}
                        </Typography>
                        <Slider
                          value={membersPerTeam}
                          onChange={(_, value) => {
                            setMembersPerTeam(value as number);
                            setMaxPlayers(teamCount * (value as number));
                          }}
                          step={1}
                          marks
                          min={1}
                          max={10}
                          valueLabelDisplay="auto"
                          aria-labelledby="members-per-team-slider"
                        />
                      </Box>
                      
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="body2" gutterBottom color="text.secondary" sx={{ mb: 1 }}>
                          Team Names:
                        </Typography>
                        <List sx={{ bgcolor: 'background.paper', borderRadius: 1 }}>
                          {teamNames.slice(0, teamCount).map((teamName, index) => (
                            <ListItem 
                              key={index}
                              sx={{
                                borderBottom: index < teamCount - 1 ? '1px solid' : 'none',
                                borderColor: 'divider',
                                py: 1
                              }}
                            >
                              <ListItemIcon>
                                <Avatar
                                  sx={{
                                    bgcolor: index === 0 ? '#F44336' : 
                                           index === 1 ? '#2196F3' : 
                                           index === 2 ? '#4CAF50' : 
                                           '#FFC107',
                                    width: 32,
                                    height: 32,
                                    fontSize: '0.875rem'
                                  }}
                                >
                                  {index + 1}
                                </Avatar>
                              </ListItemIcon>
                              <ListItemText
                                disableTypography
                                primary={
                                  <TextField
                                    fullWidth
                                    size="small"
                                    value={teamName}
                                    onChange={(e) => handleTeamNameChange(index, e.target.value)}
                                    label={`Team ${index + 1} Name`}
                                    variant="outlined"
                                    sx={{ my: 0.5 }}
                                  />
                                }
                              />
                            </ListItem>
                          ))}
                        </List>
                      </Box>
                      
                      <Box sx={{ mt: 2, p: 1, bgcolor: 'rgba(255,255,255,0.7)', borderRadius: 1, borderLeft: '3px solid', borderColor: 'info.main' }}>
                        <Typography variant="caption" color="info.main">
                          This will create {teamCount} teams with {membersPerTeam} members each. Total capacity: {teamCount * membersPerTeam} players.
                        </Typography>
                      </Box>
                    </Paper>
                  )}
                  
                  {/* Player Settings - Only show in solo mode */}
                  {gameMode === 'solo' && (
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                        <PeopleIcon sx={{ mr: 1, fontSize: '1.2rem' }} />
                        Player Settings
                      </Typography>
                      
                      <Paper sx={{ p: 2, borderRadius: 2, bgcolor: alpha(theme.palette.background.paper, 0.7) }}>
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" gutterBottom color="text.secondary">
                            Minimum Players: {minPlayers}
                          </Typography>
                          <Slider
                            value={minPlayers}
                            onChange={(_, value) => setMinPlayers(value as number)}
                            step={1}
                            marks
                            min={1}
                            max={100}
                            valueLabelDisplay="auto"
                            aria-labelledby="min-players-slider"
                          />
                        </Box>
                        
                        <Box>
                          <Typography variant="body2" gutterBottom color="text.secondary">
                            Maximum Players: {maxPlayers}
                          </Typography>
                          <Slider
                            value={maxPlayers}
                            onChange={(_, value) => setMaxPlayers(value as number)}
                            step={1}
                            marks
                            min={1}
                            max={100}
                            valueLabelDisplay="auto"
                            aria-labelledby="max-players-slider"
                          />
                        </Box>
                      </Paper>
                    </Box>
                  )}
                  
                  {/* Favorite Option */}
                  <Box sx={{ mb: 3 }}>
                    <FormControlLabel
                      control={
                        <Checkbox 
                          checked={isFavorite}
                          onChange={(e) => setIsFavorite(e.target.checked)}
                          icon={<StarBorderIcon />}
                          checkedIcon={<StarIcon />}
                          sx={{ color: theme.palette.warning.main }}
                        />
                      }
                      label={
                        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                          <Typography variant="body2">Add to Favorites</Typography>
                          <Typography variant="caption" color="text.secondary">
                            This quiz will appear in your favorites list
                          </Typography>
                        </Box>
                      }
                    />
                  </Box>
                </Box>

                {!coverImage && (
                  <Box sx={{ mt: 3 }}>
                    <Button 
                      variant="outlined" 
                      startIcon={<ImageIcon />}
                      onClick={handleCoverImageUpload}
                      sx={{ 
                        height: 120, 
                        width: '100%', 
                        borderStyle: 'dashed',
                        borderWidth: 2,
                        borderRadius: 3,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1
                      }}
                    >
                      <ImageIcon fontSize="large" />
                      Add Cover Image
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Box>
        );
      case 1:
        return (
          <Box sx={{ mt: 4 }}>
            {/* Question Navigation */}
            <Paper 
              elevation={3} 
              sx={{ 
                p: 2, 
                mb: 3, 
                borderRadius: 3, 
                background: 'linear-gradient(to right, #f5f7fa, #c3cfe2)'
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>
                  Questions ({currentQuestionIndex + 1}/{questions.length})
                </Typography>
                <Button
                  variant="contained"
                  startIcon={addingQuestion ? <CircularProgress size={20} color="inherit" /> : <AddIcon />}
                  onClick={addQuestion}
                  color="primary"
                  disabled={addingQuestion}
                  sx={{ 
                    borderRadius: 8, 
                    px: 3,
                    boxShadow: 2,
                    background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)'
                  }}
                >
                  {addingQuestion ? 'Adding...' : 'Add Question'}
                </Button>
              </Box>
              
              <Box sx={{ 
                display: 'flex', 
                overflowX: 'auto', 
                gap: 1, 
                pb: 1, 
                '&::-webkit-scrollbar': {
                  height: 6,
                },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.5),
                  borderRadius: 3,
                }
              }}>
                {questions.map((_, index) => (
                  <Chip
                    key={index}
                    label={`Q${index + 1}`}
                    onClick={() => setCurrentQuestionIndex(index)}
                    color={index === currentQuestionIndex ? "primary" : "default"}
                    variant={index === currentQuestionIndex ? "filled" : "outlined"}
                    sx={{ 
                      minWidth: 50,
                      borderRadius: '12px',
                      fontWeight: 'bold',
                      borderWidth: 2,
                      transition: 'all 0.2s',
                      transform: index === currentQuestionIndex ? 'scale(1.1)' : 'scale(1)',
                      borderColor: index === currentQuestionIndex ? 'transparent' : generateQuestionColor(index),
                      '&:hover': {
                        backgroundColor: index === currentQuestionIndex 
                          ? '' 
                          : alpha(generateQuestionColor(index), 0.1)
                      }
                    }}
                  />
                ))}
              </Box>
            </Paper>

            {/* Current Question Editor */}
            {questions.length > 0 && (
              <Paper 
                elevation={3} 
                sx={{ 
                  p: 3, 
                  borderRadius: 3,
                  borderLeft: `6px solid ${generateQuestionColor(currentQuestionIndex)}`
                }}
              >
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', mb: 3, gap: 2 }}>
                  <FormControl sx={{ minWidth: 200 }}>
                    <InputLabel>Question Type</InputLabel>
                    <Select
                      value={questions[currentQuestionIndex].questionType}
                      label="Question Type"
                      onChange={(e) => handleQuestionTypeChange(
                        currentQuestionIndex, 
                        e.target.value as 'multiple-choice' | 'true-false' | 'quiz'
                      )}
                    >
                      <MenuItem value="multiple-choice">Multiple Choice</MenuItem>
                      <MenuItem value="true-false">True/False</MenuItem>
                      <MenuItem value="quiz">Quiz</MenuItem>
                    </Select>
                  </FormControl>
                  
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                    <FormControl sx={{ minWidth: 120 }}>
                      <InputLabel>Time Limit</InputLabel>
                      <Select
                        value={questions[currentQuestionIndex].timeLimit}
                        label="Time Limit"
                        startAdornment={<TimerIcon fontSize="small" sx={{ mr: 1, opacity: 0.7 }} />}
                        onChange={(e) => handleTimeLimitChange(currentQuestionIndex, Number(e.target.value))}
                      >
                        <MenuItem value={10}>10 sec</MenuItem>
                        <MenuItem value={20}>20 sec</MenuItem>
                        <MenuItem value={30}>30 sec</MenuItem>
                        <MenuItem value={60}>60 sec</MenuItem>
                        <MenuItem value={90}>90 sec</MenuItem>
                        <MenuItem value={120}>120 sec</MenuItem>
                      </Select>
                    </FormControl>
                    
                    <FormControl sx={{ minWidth: 120 }}>
                      <InputLabel>Points</InputLabel>
                      <Select
                        value={questions[currentQuestionIndex].points}
                        label="Points"
                        onChange={(e) => handlePointsChange(currentQuestionIndex, Number(e.target.value))}
                      >
                        <MenuItem value={100}>100 pts</MenuItem>
                        <MenuItem value={150}>150 pts</MenuItem>
                        <MenuItem value={200}>200 pts</MenuItem>
                      </Select>
                    </FormControl>
                    
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="Move question up">
                        <span>
                          <IconButton
                            size="small"
                            disabled={currentQuestionIndex === 0}
                            onClick={() => moveQuestionUp(currentQuestionIndex)}
                            sx={{ border: '1px solid', borderColor: 'divider' }}
                          >
                            <ArrowUpIcon />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Move question down">
                        <span>
                          <IconButton
                            size="small"
                            disabled={currentQuestionIndex === questions.length - 1}
                            onClick={() => moveQuestionDown(currentQuestionIndex)}
                            sx={{ border: '1px solid', borderColor: 'divider' }}
                          >
                            <ArrowDownIcon />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Delete question">
                        <span>
                          <IconButton 
                            color="error" 
                            onClick={() => deleteQuestion(currentQuestionIndex)}
                            disabled={questions.length <= 1}
                            sx={{ border: '1px solid', borderColor: questions.length <= 1 ? 'divider' : 'error.main' }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Box>
                  </Box>
                </Box>
                
                <TextField
                  fullWidth
                  label="Question Text"
                  value={questions[currentQuestionIndex].text}
                  onChange={(e) => handleQuestionChange(currentQuestionIndex, e.target.value)}
                  sx={{ mb: 3 }}
                  variant="outlined"
                  placeholder="Enter your question here..."
                />
                
                {/* Question Image */}
                <Box sx={{ mb: 3 }}>
                  {questions[currentQuestionIndex].image ? (
                    <Box sx={{ 
                      position: 'relative', 
                      borderRadius: 3, 
                      overflow: 'hidden',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}>
                      <img 
                        src={questions[currentQuestionIndex].image} 
                        alt={`Question ${currentQuestionIndex + 1}`} 
                        style={{ 
                          width: '100%', 
                          height: 200, 
                          objectFit: 'cover'
                        }} 
                      />
                      <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
                        <IconButton 
                          color="error" 
                          sx={{ bgcolor: 'white', boxShadow: 2 }}
                          onClick={() => removeImage(currentQuestionIndex)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </Box>
                  ) : (
                    <Button 
                      variant="outlined" 
                      startIcon={<ImageIcon />}
                      onClick={() => handleFileUpload(currentQuestionIndex)}
                      sx={{ 
                        height: 100, 
                        width: '100%', 
                        borderStyle: 'dashed',
                        borderRadius: 3,
                        borderWidth: 2
                      }}
                    >
                      Add Image to Question
                    </Button>
                  )}
                </Box>
                
                <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mr: 1 }}>
                    Answer Options
                  </Typography>
                  <Tooltip title={questions[currentQuestionIndex].questionType === 'multiple-choice' ? "Multiple answers can be correct" : "Only one answer can be correct"}>
                    <Chip 
                      label={questions[currentQuestionIndex].questionType === 'multiple-choice' ? "Multiple answers allowed" : "Single answer only"}
                      size="small"
                      color="secondary"
                      variant="outlined"
                      sx={{ fontSize: '0.7rem' }}
                    />
                  </Tooltip>
                </Box>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {questions[currentQuestionIndex].answers.map((answer, answerIndex) => (
                    <Box 
                      key={answer.id} 
                      sx={{ 
                        display: 'flex', 
                        width: '100%', 
                        gap: { xs: 1, sm: 2 }
                      }}
                    >
                      <Box 
                        sx={{ 
                          minWidth: { xs: 40, sm: 50 },
                          height: { xs: 40, sm: 50 },
                          borderRadius: '50%',
                          backgroundColor: answer.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontWeight: 'bold',
                          fontSize: '1.2rem',
                          boxShadow: answer.isCorrect ? 
                            `0 0 0 3px ${theme.palette.success.main}` : 
                            'none',
                          border: answer.isCorrect ?
                            `2px solid ${theme.palette.success.light}` :
                            'none',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {answerIndex === 0 ? 'A' : answerIndex === 1 ? 'B' : answerIndex === 2 ? 'C' : 'D'}
                      </Box>
                      <Box 
                        sx={{ 
                          flex: 1, 
                          display: 'flex', 
                          alignItems: 'center',
                          backgroundColor: answer.isCorrect ? alpha(theme.palette.success.light, 0.2) : alpha(theme.palette.grey[100], 0.7),
                          borderRadius: 2,
                          border: `1px solid ${answer.isCorrect ? theme.palette.success.light : theme.palette.divider}`,
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            backgroundColor: answer.isCorrect ? alpha(theme.palette.success.light, 0.3) : alpha(theme.palette.grey[200], 0.7),
                          }
                        }}
                      >
                        <Box sx={{ flex: 1, p: 1 }}>
                          <TextField
                            fullWidth
                            placeholder={`Enter answer option ${answerIndex + 1}`}
                            value={answer.text}
                            onChange={(e) => handleAnswerChange(currentQuestionIndex, answerIndex, e.target.value)}
                            variant="standard"
                            InputProps={{ 
                              disableUnderline: true
                            }}
                            sx={{ 
                              '& .MuiInputBase-root': { 
                                px: 1,
                                fontWeight: answer.isCorrect ? 500 : 400,
                                color: answer.isCorrect ? theme.palette.success.dark : 'inherit'
                              }
                            }}
                          />
                        </Box>
                        <Box>
                          <Tooltip title={answer.isCorrect ? "Mark as incorrect" : "Mark as correct"}>
                            <IconButton 
                              onClick={() => toggleAnswerCorrect(currentQuestionIndex, answerIndex)}
                              color={answer.isCorrect ? "success" : "default"}
                              sx={{ borderLeft: `1px solid ${answer.isCorrect ? theme.palette.success.light : theme.palette.divider}` }}
                            >
                              {answer.isCorrect ? <CorrectIcon /> : <EditIcon />}
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>
                    </Box>
                  ))}
                </Box>
                
                <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={addQuestion}
                    startIcon={addingQuestion ? <CircularProgress size={16} color="primary" /> : <AddIcon />}
                    disabled={addingQuestion}
                  >
                    {addingQuestion ? 'Adding...' : 'Add another question'}
                  </Button>
                </Box>
              </Paper>
            )}
          </Box>
        );
      case 2:
        return (
          <Box sx={{ mt: 4 }}>
            <Paper 
              elevation={3} 
              sx={{ 
                p: 3, 
                mb: 4, 
                borderRadius: 3,
                background: `linear-gradient(to right bottom, ${alpha(theme.palette.background.paper, 0.9)}, ${alpha(theme.palette.background.paper, 0.95)}),
                            url(${coverImage || 'https://source.unsplash.com/random/1200x600?abstract'})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundBlendMode: 'overlay',
                boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                <Avatar 
                  sx={{ 
                    width: 60, 
                    height: 60, 
                    background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                    mr: 2,
                    boxShadow: 2,
                    fontSize: '1.5rem'
                  }}
                >
                  {quizTitle ? quizTitle.charAt(0).toUpperCase() : 'Q'}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                    {quizTitle || 'Untitled Quiz'}
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
                    {quizCategory && (
                      <Chip 
                        label={quizCategory} 
                        size="small" 
                        color="primary" 
                        variant="outlined" 
                      />
                    )}
                    <Chip 
                      icon={isPublic ? <PublicIcon fontSize="small" /> : <PrivateIcon fontSize="small" />}
                      label={isPublic ? "Public" : "Private"} 
                      size="small" 
                      color={isPublic ? "info" : "default"}
                    />
                    <Chip 
                      icon={gameMode === 'solo' ? <PersonIcon fontSize="small" /> : <GroupsIcon fontSize="small" />}
                      label={gameMode === 'solo' ? "Solo Mode" : "Team Mode"} 
                      size="small" 
                      color="secondary"
                    />
                    <Chip 
                      icon={<PeopleIcon fontSize="small" />}
                      label={`${minPlayers}-${maxPlayers} players`} 
                      size="small" 
                      color="default"
                    />
                    <Chip 
                      icon={<QuestionIcon fontSize="small" />}
                      label={`${questions.length} questions`} 
                      size="small" 
                    />
                    <Chip 
                      icon={<TimerIcon fontSize="small" />}
                      label={`${Math.ceil(questions.reduce((total, q) => total + q.timeLimit, 0) / 60)} min`} 
                      size="small" 
                    />
                    {isFavorite && (
                      <Chip 
                        icon={<StarIcon fontSize="small" />}
                        label="Favorite" 
                        size="small"
                        color="warning"
                      />
                    )}
                  </Box>
                </Box>
                <Button 
                  startIcon={<PreviewIcon />} 
                  variant="contained"
                  color="secondary"
                  onClick={handlePreview}
                  sx={{ borderRadius: 8, px: 3 }}
                >
                  Preview Game
                </Button>
              </Box>
              
              {quizDescription && (
                <Box sx={{ 
                  mb: 3, 
                  p: 2, 
                  backgroundColor: alpha(theme.palette.background.paper, 0.7),
                  borderRadius: 2,
                  borderLeft: `4px solid ${theme.palette.primary.main}`
                }}>
                  <Typography variant="body1">
                    {quizDescription}
                  </Typography>
                </Box>
              )}
              
              <Divider sx={{ mb: 3, mt: 2 }} />
              
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                Questions Summary
              </Typography>
                
              <Box sx={{ mb: 3 }}>
                {questions.map((question, index) => (
                  <Paper
                    key={question.id}
                    elevation={1}
                    sx={{ 
                      p: 2, 
                      mb: 2, 
                      borderRadius: 2,
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: 3
                      },
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: { xs: 'column', sm: 'row' },
                      alignItems: { xs: 'flex-start', sm: 'center' },
                      gap: 2
                    }}
                    onClick={() => { setCurrentQuestionIndex(index); setActiveStep(1); }}
                  >
                    <Box 
                      sx={{ 
                        minWidth: 40, 
                        height: 40, 
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: generateQuestionColor(index),
                        color: 'white',
                        fontWeight: 'bold'
                      }}
                    >
                      {index + 1}
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                        {question.text || `[Question ${index + 1}]`}
                      </Typography>
                      
                      {question.answers.some(a => a.isCorrect) ? (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                          {question.answers.map((answer, aIndex) => (
                            answer.isCorrect && (
                              <Chip 
                                key={aIndex}
                                label={answer.text || `Answer ${aIndex + 1}`}
                                size="small"
                                color="success"
                                variant="outlined"
                                sx={{ fontSize: '0.7rem' }}
                                icon={<CorrectIcon fontSize="small" />}
                              />
                            )
                          ))}
                        </Box>
                      ) : (
                        <Typography variant="caption" color="error">
                          No correct answer selected
                        </Typography>
                      )}
                    </Box>
                    
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap', justifyContent: { xs: 'flex-start', sm: 'flex-end' } }}>
                      <Chip 
                        label={`${question.timeLimit}s`} 
                        size="small" 
                        icon={<TimerIcon fontSize="small" />} 
                      />
                      <Chip 
                        label={question.questionType} 
                        size="small" 
                        color="primary" 
                        variant="outlined"
                      />
                      <Tooltip title="Edit question">
                        <IconButton 
                          size="small" 
                          color="primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCurrentQuestionIndex(index);
                            setActiveStep(1);
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Paper>
                ))}
              </Box>
              
              <Box 
                sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  mt: 4,
                  p: 3,
                  borderRadius: 2,
                  backgroundColor: alpha(theme.palette.primary.light, 0.1),
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
                }}
              >
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Total Questions
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {questions.length}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Estimated Duration
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {Math.ceil(questions.reduce((total, q) => total + q.timeLimit, 0) / 60)} minutes
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Total Points
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {questions.reduce((total, q) => total + q.points, 0)}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <Button
                  variant="contained"
                  size="large"
                  color="primary"
                  startIcon={<PlayIcon />}
                  onClick={handlePreview}
                  sx={{ 
                    borderRadius: 8, 
                    px: 4, 
                    py: 1.5,
                    background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                    boxShadow: '0 5px 15px rgba(33, 150, 243, 0.3)'
                  }}
                >
                  Start Demo Game
                </Button>
              </Box>
            </Paper>
          </Box>
        );
      default:
        return "Unknown step";
    }
  };

  return (
    <MainLayout>
      <Container>
        <Box sx={{ mt: 3, mb: 5 }}>
          <Paper 
            elevation={1} 
            sx={{ 
              p: 3, 
              mb: 4, 
              borderRadius: 3,
              background: 'linear-gradient(to right, #f5f7fa, #f2f3fe)',
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 2
            }}
          >
            <Typography variant="h4" component="h1" sx={{ 
              fontWeight: 'bold',
              background: 'linear-gradient(45deg, #2196F3 30%, #9C27B0 90%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Create New Quiz
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button 
                variant="outlined"
                startIcon={<HelpIcon />}
                sx={{ borderRadius: 8 }}
              >
                Help
              </Button>
              <Button 
                variant="contained"
                color="secondary"
                startIcon={activeStep === steps.length - 1 ? (isSubmitting ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />) : null}
                endIcon={activeStep === steps.length - 1 ? null : <ForwardIcon />}
                onClick={activeStep === steps.length - 1 ? submitQuiz : handleNext}
                disabled={isSubmitting}
                sx={{ 
                  borderRadius: 8,
                  px: 3
                }}
              >
                {activeStep === steps.length - 1 ? (isSubmitting ? 'Saving...' : 'Save Quiz') : 'Continue'}
              </Button>
            </Box>
          </Paper>
          
          <Stepper 
            activeStep={activeStep} 
            sx={{ 
              mb: 4, 
              '.MuiStepLabel-label.Mui-active': {
                fontWeight: 'bold',
                color: theme.palette.primary.main
              }
            }}
          >
            {steps.map((label, index) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          
          {getStepContent(activeStep)}
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button
              color="inherit"
              disabled={activeStep === 0 || isSubmitting}
              onClick={handleBack}
              startIcon={<BackIcon />}
              variant="outlined"
              sx={{ 
                borderRadius: 8,
                px: 3,
                visibility: activeStep === 0 ? 'hidden' : 'visible'
              }}
            >
              Back
            </Button>
            <Button
              variant="contained"
              onClick={activeStep === steps.length - 1 ? submitQuiz : handleNext}
              endIcon={activeStep === steps.length - 1 ? <SaveIcon /> : <ForwardIcon />}
              disabled={isSubmitting}
              sx={{ 
                borderRadius: 8, 
                px: 4,
                background: activeStep === steps.length - 1 
                  ? 'linear-gradient(45deg, #4CAF50 30%, #2E7D32 90%)' 
                  : 'linear-gradient(45deg, #2196F3 30%, #1976D2 90%)',
                boxShadow: '0 4px 10px rgba(0, 0, 0, 0.15)'
              }}
            >
              {activeStep === steps.length - 1 ? (isSubmitting ? 'Saving...' : 'Finish & Save') : 'Next Step'}
            </Button>
          </Box>
        </Box>
      </Container>
      <Dialog 
        open={successDialogOpen} 
        onClose={() => setSuccessDialogOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: 3,
            maxWidth: 500,
            width: '90%',
            overflow: 'hidden'
          }
        }}
      >
        <Box sx={{ 
          py: 2, 
          px: 3, 
          background: 'linear-gradient(45deg, #2196F3 30%, #9C27B0 90%)',
          color: 'white'
        }}>
          <DialogTitle sx={{ 
            textAlign: 'center', 
            fontWeight: 'bold',
            fontSize: '1.6rem',
            color: 'white',
            p: 1
          }}
          component="div"
          >
            Quiz Created Successfully!
          </DialogTitle>
        </Box>
        <DialogContent>
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Typography variant="body1" sx={{ mb: 3 }}>
              Share this code with your students to join the game:
            </Typography>
            
            <Box 
              sx={{ 
                p: 3, 
                backgroundColor: alpha(theme.palette.primary.light, 0.1),
                borderRadius: 2,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                mb: 3,
                border: `2px dashed ${alpha(theme.palette.primary.main, 0.3)}`
              }}
            >
              <Typography 
                variant="h2" 
                sx={{ 
                  letterSpacing: 6,
                  fontWeight: 'bold',
                  color: theme.palette.primary.main,
                  mb: 2,
                  fontFamily: 'monospace'
                }}
              >
                {gameCode}
              </Typography>
              
              <Button 
                variant="outlined" 
                onClick={copyCodeToClipboard}
                startIcon={<ContentCopy />}
                sx={{ borderRadius: 8, px: 3 }}
              >
                Copy Code
              </Button>
            </Box>
            
            <Typography variant="body2" color="text.secondary">
              Students can enter this code on the home page to join your game.
            </Typography>
            
            <Box 
              sx={{ 
                mt: 3, 
                p: 2, 
                backgroundColor: alpha(theme.palette.info.light, 0.1),
                borderRadius: 2,
                borderLeft: `4px solid ${theme.palette.info.main}`
              }}
            >
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'left' }}>
                <strong>Note:</strong> Your quiz is now ready for play! Students can enter the code above to join the game anytime.
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ 
          justifyContent: 'center', 
          pb: 3, 
          px: 3, 
          gap: 2  
        }}>
          <Button 
            onClick={() => setSuccessDialogOpen(false)} 
            variant="outlined" 
            color="primary"
            sx={{ 
              borderRadius: 8,
              px: 3
            }}
          >
            Continue Editing
          </Button>
          <Button 
            onClick={() => router.push('/my-sets')} 
            variant="contained" 
            color="primary"
            sx={{ 
              borderRadius: 8,
              px: 3,
              background: 'linear-gradient(45deg, #2196F3 30%, #9C27B0 90%)',
              boxShadow: '0 4px 10px rgba(33, 150, 243, 0.3)',
            }}
          >
            Go to My Sets
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Notification Snackbar */}
      <Snackbar 
        open={notification.open} 
        autoHideDuration={6000}
        onClose={handleNotificationClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleNotificationClose} 
          severity={notification.type}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </MainLayout>
  );
};

export default CreateGamePage;