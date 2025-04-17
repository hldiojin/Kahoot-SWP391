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
  alpha
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
  QuestionMark as QuestionIcon
} from '@mui/icons-material';
import MainLayout from '../components/MainLayout';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';

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
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([{
    id: '1',
    text: '',
    timeLimit: 30,
    points: 1000,
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

  // Steps for the quiz creation process
  const steps = ['Quiz Info', 'Add Questions', 'Preview & Finish'];

  // Function to add a new question
  const addQuestion = () => {
    const newQuestion: Question = {
      id: (questions.length + 1).toString(),
      text: '',
      timeLimit: 30,
      points: 1000,
      image: null,
      answers: [
        { id: `${questions.length + 1}-1`, text: '', isCorrect: false, color: 'red' },
        { id: `${questions.length + 1}-2`, text: '', isCorrect: false, color: 'blue' },
        { id: `${questions.length + 1}-3`, text: '', isCorrect: false, color: 'green' },
        { id: `${questions.length + 1}-4`, text: '', isCorrect: false, color: 'yellow' },
      ],
      questionType: 'multiple-choice',
    };
    setQuestions([...questions, newQuestion]);
    setCurrentQuestionIndex(questions.length);
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

  // Function to submit the quiz
  const submitQuiz = () => {
    // Here you would typically send the quiz data to your backend
    console.log({
      title: quizTitle,
      description: quizDescription,
      category: quizCategory,
      isPublic,
      coverImage,
      questions
    });

    // Show a success message and redirect to dashboard
    alert('Quiz created successfully!');
    router.push('/dashboard');
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
                  startIcon={<AddIcon />}
                  onClick={addQuestion}
                  color="primary"
                  sx={{ 
                    borderRadius: 8, 
                    px: 3,
                    boxShadow: 2,
                    background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)'
                  }}
                >
                  Add Question
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
                        <MenuItem value={500}>500 pts</MenuItem>
                        <MenuItem value={1000}>1000 pts</MenuItem>
                        <MenuItem value={2000}>2000 pts</MenuItem>
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
                    startIcon={<AddIcon />}
                  >
                    Add another question
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
                      icon={<QuestionIcon fontSize="small" />}
                      label={`${questions.length} questions`} 
                      size="small" 
                    />
                    <Chip 
                      icon={<TimerIcon fontSize="small" />}
                      label={`${Math.ceil(questions.reduce((total, q) => total + q.timeLimit, 0) / 60)} min`} 
                      size="small" 
                    />
                  </Box>
                </Box>
                <Button 
                  startIcon={<PreviewIcon />} 
                  variant="contained"
                  color="secondary"
                  onClick={() => window.open('/play-quiz-preview', '_blank')}
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
                  onClick={() => window.open('/play-quiz-preview', '_blank')}
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

  if (!user || (user.role !== 'teacher' && user.role !== 'admin')) {
    return (
      <MainLayout>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '80vh',
          gap: 3
        }}>
          <Paper 
            elevation={3}
            sx={{ 
              p: 4, 
              borderRadius: 3, 
              textAlign: 'center',
              maxWidth: 500
            }}
          >
            <PrivateIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Teacher Access Required
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              You need teacher privileges to create games. Please contact an administrator if you believe you should have access.
            </Typography>
            <Button 
              variant="contained" 
              onClick={() => router.push('/dashboard')}
            >
              Return to Dashboard
            </Button>
          </Paper>
        </Box>
      </MainLayout>
    );
  }

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
                startIcon={activeStep === steps.length - 1 ? <SaveIcon /> : null}
                endIcon={activeStep === steps.length - 1 ? null : <ForwardIcon />}
                onClick={activeStep === steps.length - 1 ? submitQuiz : handleNext}
                sx={{ 
                  borderRadius: 8,
                  px: 3
                }}
              >
                {activeStep === steps.length - 1 ? 'Save Quiz' : 'Continue'}
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
              disabled={activeStep === 0}
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
              sx={{ 
                borderRadius: 8, 
                px: 4,
                background: activeStep === steps.length - 1 
                  ? 'linear-gradient(45deg, #4CAF50 30%, #2E7D32 90%)' 
                  : 'linear-gradient(45deg, #2196F3 30%, #1976D2 90%)',
                boxShadow: '0 4px 10px rgba(0, 0, 0, 0.15)'
              }}
            >
              {activeStep === steps.length - 1 ? 'Finish & Save' : 'Next Step'}
            </Button>
          </Box>
        </Box>
      </Container>
    </MainLayout>
  );
};

export default CreateGamePage;