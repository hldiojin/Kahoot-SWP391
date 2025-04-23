'use client';

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  Divider,
  LinearProgress,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  Container,
  CircularProgress
} from '@mui/material';
import { 
  PlayArrow as PlayIcon,
  CheckCircle as CorrectIcon,
  Cancel as IncorrectIcon,
  ArrowForward as NextIcon,
  Home as HomeIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import PublicLayout from '../components/PublicLayout';

// Define types for the quiz data
interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  timeLimit: number;
}

interface QuizData {
  title: string;
  description: string;
  questions: QuizQuestion[];
  category: string;
  isPublic: boolean;
  coverImage: string;
  [key: string]: any; // Allow for additional properties
}

// Default quiz data as a fallback
const defaultQuizData: QuizData = {
  title: 'Sample Quiz',
  description: 'This is a demo quiz',
  questions: [
    {
      id: '1',
      question: 'What is the capital of France?',
      options: ['London', 'Berlin', 'Paris', 'Madrid'],
      correctAnswer: 2, // Paris
      timeLimit: 20
    },
    {
      id: '2',
      question: 'Which planet is known as the Red Planet?',
      options: ['Venus', 'Mars', 'Jupiter', 'Saturn'],
      correctAnswer: 1, // Mars
      timeLimit: 20
    }
  ],
  category: 'General Knowledge',
  isPublic: true,
  coverImage: 'https://source.unsplash.com/random/300x200?quiz'
};

interface AnswerRecord {
  questionId: string;
  selectedOption: number | null;
  isCorrect: boolean;
  points?: number;
  timeBonus?: number;
  answerTime?: number; // Time taken to answer in seconds
}

export default function PlayQuizPreview() {
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [playerName, setPlayerName] = useState('Anonymous');
  const [answerTimes, setAnswerTimes] = useState<number[]>([]);
  const [questionStartTime, setQuestionStartTime] = useState<number>(0);

  // Load quiz data from sessionStorage when component mounts
  useEffect(() => {
    setMounted(true);
    
    try {
      // Log what's in sessionStorage for debugging
      console.log("Available sessionStorage items:", 
        Object.keys(sessionStorage).map(key => ({ key, length: sessionStorage.getItem(key)?.length || 0 }))
      );

      // Retrieve data when the page loads
      const storedData = sessionStorage.getItem('quizPreviewData');
      if (storedData) {
        console.log(`Loaded quizPreviewData from sessionStorage (${storedData.length} bytes)`);
        
        try {
          const parsedData = JSON.parse(storedData);
          console.log('Parsed data structure:', Object.keys(parsedData));
          
          if (!parsedData.questions || !Array.isArray(parsedData.questions) || parsedData.questions.length === 0) {
            console.warn('Quiz data has no questions or invalid question format!', parsedData);
            setQuizData(defaultQuizData);
            return;
          }
          
          // Ensure the parsedData has the correct format for the quiz
          const formattedData: QuizData = {
            title: parsedData.title || 'Quiz',
            description: parsedData.description || '',
            category: parsedData.category || 'General Knowledge',
            isPublic: parsedData.isPublic ?? true,
            coverImage: parsedData.coverImage || parsedData.imageUrl || 'https://source.unsplash.com/random/300x200?quiz',
            questions: parsedData.questions.map((q: any) => {
              console.log('Processing question:', q.question || q.text);
              return {
                id: q.id || `q-${Math.random().toString(36).substr(2, 9)}`,
                question: q.question || q.text || '',
                options: q.options || (Array.isArray(q.answers) ? q.answers.map((a: any) => a.text || a) : ['Option 1', 'Option 2', 'Option 3', 'Option 4']),
                correctAnswer: typeof q.correctAnswer === 'number' ? q.correctAnswer : 
                  (Array.isArray(q.answers) ? q.answers.findIndex((a: any) => a.isCorrect) : 0),
                timeLimit: q.timeLimit || 20
              };
            })
          };
          
          console.log(`Formatted quiz: ${formattedData.title} with ${formattedData.questions.length} questions`);
          
          setQuizData(formattedData);
          
          // Get player name if available
          const currentPlayer = sessionStorage.getItem('currentPlayer');
          if (currentPlayer) {
            setPlayerName(currentPlayer);
          }
        } catch (parseError) {
          console.error('Error parsing quiz data JSON:', parseError);
          setQuizData(defaultQuizData);
        }
      } else {
        console.log('No quiz data found in sessionStorage, using default data');
        setQuizData(defaultQuizData);
      }
    } catch (error) {
      console.error('Error loading quiz data:', error);
      setQuizData(defaultQuizData);
    }
  }, []);

  // Timer effect for questions
  useEffect(() => {
    if (!quizData) return;
    
    let timer: NodeJS.Timeout;
    
    if (gameStarted && !isAnswered && !showResults) {
      const currentQuestion = quizData.questions[currentQuestionIndex];
      setTimeLeft(currentQuestion.timeLimit || 20);
      
      // Record when the question started for timing
      setQuestionStartTime(Date.now());
      
      timer = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(timer);
            handleTimeUp();
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [gameStarted, currentQuestionIndex, isAnswered, showResults, quizData]);

  const handleTimeUp = () => {
    if (!quizData) return;
    
    if (!isAnswered) {
      // Calculate how long it took (full time in this case)
      const currentQuestion = quizData.questions[currentQuestionIndex];
      const answerTime = currentQuestion.timeLimit || 20;
      
      // Record this answer time
      setAnswerTimes(prev => [...prev, answerTime]);
      
      const answerRecord: AnswerRecord = {
        questionId: currentQuestion.id,
        selectedOption: null,
        isCorrect: false,
        answerTime: answerTime
      };
      
      setAnswers(prev => [...prev, answerRecord]);
      setIsAnswered(true);
      setShowFeedback(true);
    }
  };

  const startGame = () => {
    console.log(`Starting game with ${quizData?.questions?.length || 0} questions`);
    setGameStarted(true);
    setScore(0);
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setAnswers([]);
    setShowResults(false);
  };

  const handleOptionSelect = (optionIndex: number) => {
    if (!quizData) return;
    
    if (isAnswered) return;
    
    // Calculate how long it took to answer
    const currentQuestion = quizData.questions[currentQuestionIndex];
    const answerTime = (currentQuestion.timeLimit || 20) - timeLeft;
    
    // Record this answer time
    setAnswerTimes(prev => [...prev, answerTime]);
    
    setSelectedOption(optionIndex);
    setIsAnswered(true);
    
    const isCorrect = optionIndex === currentQuestion.correctAnswer;
    
    const answerRecord: AnswerRecord = {
      questionId: currentQuestion.id,
      selectedOption: optionIndex,
      isCorrect,
      answerTime: answerTime
    };
    
    if (isCorrect) {
      // Calculate points based on speed:
      // 1. Base points for a correct answer
      const basePoints = 100;
      
      // 2. Time bonus calculation - faster answers get more points
      // If user answers in the first 20% of available time, they get maximum bonus
      const maxTimeBonus = 150;
      const questionTimeLimit = currentQuestion.timeLimit || 20;
      const timeTaken = questionTimeLimit - timeLeft;
      
      // Calculate percentage of maximum time used (inverted so faster = higher percentage)
      const timePercentage = Math.max(0, 1 - (timeTaken / questionTimeLimit));
      
      // Calculate time bonus based on speed (exponential curve to reward quick answers more)
      const timeBonus = Math.round(maxTimeBonus * Math.pow(timePercentage, 1.5));
      
      // Total points for this question
      const pointsEarned = basePoints + timeBonus;
      
      // Update the score
      setScore(prev => prev + pointsEarned);
      
      // For feedback in UI
      answerRecord.points = pointsEarned;
      answerRecord.timeBonus = timeBonus;
      
      console.log(`Correct answer! +${basePoints} base points, +${timeBonus} time bonus (answered in ${timeTaken}s of ${questionTimeLimit}s)`);
    }
    
    setAnswers(prev => [...prev, answerRecord]);
    setShowFeedback(true);
  };

  const nextQuestion = () => {
    if (!quizData) return;
    
    setShowFeedback(false);
    
    if (currentQuestionIndex < quizData.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      // Quiz is finished - update game results and redirect to results page
      try {
        // Get existing game results from session storage
        const resultsData = sessionStorage.getItem('gameResults');
        if (resultsData) {
          const gameResults = JSON.parse(resultsData);
          
          // Update the current player's score and stats
          const currentPlayerResult = gameResults.find((player: any) => 
            player.name === playerName
          );
          
          if (currentPlayerResult) {
            const correctAnswers = answers.filter(a => a.isCorrect).length;
            
            // Calculate average answer time
            const totalAnswerTime = answerTimes.reduce((sum, time) => sum + time, 0);
            const avgAnswerTime = Math.round((totalAnswerTime / answerTimes.length) * 10) / 10;
            
            // Calculate total time bonus earned
            const totalTimeBonus = answers.reduce((sum, a) => sum + (a.timeBonus || 0), 0);
            
            // Update the player result data
            currentPlayerResult.score = score;
            currentPlayerResult.correctAnswers = correctAnswers;
            currentPlayerResult.totalQuestions = quizData.questions.length;
            currentPlayerResult.timeBonus = totalTimeBonus;
            currentPlayerResult.averageAnswerTime = avgAnswerTime;
            
            // Save updated results back to session storage
            sessionStorage.setItem('gameResults', JSON.stringify(gameResults));
            
            // Redirect to the results page
            window.location.href = '/game-results';
          } else {
            // Fallback if player not found in results
            setShowResults(true);
          }
        } else {
          setShowResults(true);
        }
      } catch (error) {
        console.error('Error updating game results:', error);
        setShowResults(true);
      }
    }
  };

  const restartGame = () => {
    startGame();
  };

  const closeWindow = () => {
    // Redirect to home instead of closing window
    window.location.href = '/';
  };

  // Don't render until client-side and data is loaded
  if (!mounted) {
    return null;
  }
  
  // Show loading state when no data is available
  if (!quizData) {
    return (
      <PublicLayout>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          minHeight: '60vh' 
        }}>
          <CircularProgress size={60} sx={{ mb: 3 }} />
          <Typography variant="h6">Loading quiz preview...</Typography>
        </Box>
      </PublicLayout>
    );
  }

  if (showResults) {
    // Update the game results before showing
    try {
      // Get existing game results from session storage
      const resultsData = sessionStorage.getItem('gameResults');
      if (resultsData) {
        const gameResults = JSON.parse(resultsData);
        
        // Update the current player's score and stats
        const currentPlayerResult = gameResults.find((player: any) => 
          player.name === playerName
        );
        
        if (currentPlayerResult) {
          const correctAnswers = answers.filter(a => a.isCorrect).length;
          
          // Calculate average answer time
          const totalAnswerTime = answerTimes.reduce((sum, time) => sum + time, 0);
          const avgAnswerTime = Math.round((totalAnswerTime / answerTimes.length) * 10) / 10;
          
          // Calculate total time bonus earned
          const totalTimeBonus = answers.reduce((sum, a) => sum + (a.timeBonus || 0), 0);
          
          // Update the player result data
          currentPlayerResult.score = score;
          currentPlayerResult.correctAnswers = correctAnswers;
          currentPlayerResult.totalQuestions = quizData.questions.length;
          currentPlayerResult.timeBonus = totalTimeBonus;
          currentPlayerResult.averageAnswerTime = avgAnswerTime;
          
          // Save updated results back to session storage
          sessionStorage.setItem('gameResults', JSON.stringify(gameResults));
        }
      }
    } catch (error) {
      console.error('Error updating game results:', error);
    }
    
    return (
      <PublicLayout>
        <Box sx={{ maxWidth: 800, mx: 'auto', py: 4 }}>
          <Typography variant="h4" component="div" sx={{ mb: 4, textAlign: 'center', fontWeight: 'bold' }}>
            Quiz Results
          </Typography>
          
          <Paper elevation={3} sx={{ p: 4, borderRadius: 3, mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5" component="div">
                {quizData.title}
              </Typography>
              <Chip 
                label={`Score: ${score}`} 
                color="primary" 
                sx={{ fontWeight: 'bold', fontSize: '1.1rem', py: 1, px: 2 }}
              />
            </Box>
            
            <Divider sx={{ mb: 3 }} />
            
            <Typography variant="h6" component="div" sx={{ mb: 2 }}>
              Your Answers:
            </Typography>
            
            <List>
              {quizData.questions.map((question, index) => {
                const answer = answers.find(a => a.questionId === question.id);
                const isCorrect = answer?.isCorrect ?? false;
                
                return (
                  <Paper 
                    key={question.id} 
                    elevation={1} 
                    sx={{ 
                      mb: 2, 
                      p: 2, 
                      borderRadius: 2,
                      borderLeft: isCorrect ? '4px solid #4caf50' : '4px solid #f44336'
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                      <ListItemIcon sx={{ mt: 0, minWidth: 40 }}>
                        {isCorrect ? (
                          <CorrectIcon color="success" />
                        ) : (
                          <IncorrectIcon color="error" />
                        )}
                      </ListItemIcon>
                      
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle1" component="div" sx={{ fontWeight: 'medium', mb: 1 }}>
                          {`${index + 1}. ${question.question}`}
                        </Typography>
                        
                        <Box sx={{ ml: 1 }}>
                          <Typography variant="body2" component="div" color="text.secondary" sx={{ mb: 0.5 }}>
                            Your answer: {answer?.selectedOption !== undefined && answer.selectedOption !== null 
                              ? question.options[answer.selectedOption] 
                              : 'No answer'}
                          </Typography>
                          
                          <Typography variant="body2" component="div" color="success.main">
                            Correct answer: {question.options[question.correctAnswer]}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Paper>
                );
              })}
            </List>
          </Paper>
          
          {/* Time statistics */}
          <Paper elevation={2} sx={{ p: 3, borderRadius: 3, mb: 4 }}>
            <Typography variant="h6" component="div" sx={{ mb: 2 }}>
              Your Speed Stats
            </Typography>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
              <Box>
                <Typography variant="body2" component="div" color="text.secondary">
                  Average Answer Time
                </Typography>
                <Typography variant="h5" component="div" color="primary" fontWeight="medium">
                  {answerTimes.length > 0 ? 
                    `${Math.round((answerTimes.reduce((sum, time) => sum + time, 0) / answerTimes.length) * 10) / 10}s` : 
                    'N/A'}
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="body2" component="div" color="text.secondary">
                  Speed Bonus Earned
                </Typography>
                <Typography variant="h5" component="div" color="secondary" fontWeight="medium">
                  +{answers.reduce((sum, a) => sum + (a.timeBonus || 0), 0)}
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="body2" component="div" color="text.secondary">
                  Fastest Answer
                </Typography>
                <Typography variant="h5" component="div" fontWeight="medium">
                  {answerTimes.length > 0 ? `${Math.min(...answerTimes)}s` : 'N/A'}
                </Typography>
              </Box>
            </Box>
          </Paper>
          
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<HomeIcon />}
              onClick={() => window.location.href = '/'}
              sx={{ borderRadius: 2 }}
            >
              Go to Home
            </Button>
            
            <Button
              variant="contained"
              onClick={() => window.location.href = '/game-results'}
              sx={{ 
                borderRadius: 2,
                background: 'linear-gradient(45deg, #2196F3 30%, #9C27B0 90%)',
              }}
            >
              See Leaderboard
            </Button>
          </Box>
        </Box>
      </PublicLayout>
    );
  }

  if (!gameStarted) {
    return (
      <PublicLayout>
        <Box sx={{ maxWidth: 700, mx: 'auto', textAlign: 'center', py: 6 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Typography variant="h3" sx={{ mb: 2, fontWeight: 'bold' }}>
              {quizData.title}
            </Typography>
            
            <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 1 }}>
              Category: {quizData.category || "General"}
            </Typography>

            <Typography variant="subtitle2" sx={{ mb: 2 }}>
              Player: {playerName}
            </Typography>
            
            <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
              {quizData.description || "Preview your quiz before publishing"}
            </Typography>
            
            <Paper 
              elevation={3} 
              sx={{ 
                p: 4, 
                borderRadius: 4, 
                mb: 4, 
                maxWidth: 500, 
                mx: 'auto',
                background: 'linear-gradient(to right, rgba(224, 234, 252, 0.7), rgba(207, 222, 243, 0.7))'
              }}
            >
              <Typography variant="body1" sx={{ mb: 3 }}>
                This quiz has {quizData.questions.length} questions.
              </Typography>
              
              <Box sx={{ textAlign: 'left', mb: 3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                  Quiz Overview:
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemIcon sx={{ minWidth: 30 }}>•</ListItemIcon>
                    <ListItemText primary={`${quizData.questions.length} questions to answer`} />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon sx={{ minWidth: 30 }}>•</ListItemIcon>
                    <ListItemText primary="Each question has a time limit" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon sx={{ minWidth: 30 }}>•</ListItemIcon>
                    <ListItemText primary="Answer faster for bonus points" />
                  </ListItem>
                </List>
              </Box>
            </Paper>
            
            <Button
              variant="contained"
              color="primary"
              size="large"
              startIcon={<PlayIcon />}
              onClick={startGame}
              sx={{ 
                py: 1.5, 
                px: 4, 
                borderRadius: 8,
                background: 'linear-gradient(45deg, #2196F3 30%, #9C27B0 90%)',
                boxShadow: '0 4px 20px rgba(33, 150, 243, 0.4)',
                fontSize: '1.1rem'
              }}
            >
              Start Game
            </Button>
          </motion.div>
        </Box>
      </PublicLayout>
    );
  }

  const currentQuestion = quizData.questions[currentQuestionIndex];
  
  return (
    <PublicLayout>
      <Box sx={{ maxWidth: 800, mx: 'auto', py: 2 }}>
        {/* Progress bar and question number */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 2 }}>
          <Typography sx={{ fontWeight: 'bold', minWidth: 80 }}>
            Question {currentQuestionIndex + 1}/{quizData.questions.length}
          </Typography>
          
          <LinearProgress 
            variant="determinate" 
            value={(currentQuestionIndex / quizData.questions.length) * 100} 
            sx={{ flex: 1, height: 8, borderRadius: 4 }}
          />
          
          <Box sx={{ minWidth: 80, textAlign: 'right' }}>
            <Typography sx={{ fontWeight: 'bold' }}>
              Score: {score}
            </Typography>
          </Box>
        </Box>
        
        {/* Timer */}
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
          <Typography sx={{ mr: 1 }}>Time left:</Typography>
          <LinearProgress
            variant="determinate"
            value={(timeLeft / (currentQuestion.timeLimit || 20)) * 100}
            color={timeLeft < 5 ? "error" : timeLeft < 10 ? "warning" : "primary"}
            sx={{ flex: 1, height: 10, borderRadius: 5 }}
          />
          <Typography sx={{ ml: 2, fontWeight: 'bold', minWidth: 30 }}>
            {timeLeft}s
          </Typography>
        </Box>
        
        {/* Question */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestionIndex}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            <Paper 
              elevation={3} 
              sx={{ 
                p: 4, 
                borderRadius: 3, 
                mb: 4,
                bgcolor: 'background.paper',
              }}
            >
              <Typography variant="h5" sx={{ mb: 3, fontWeight: 'medium' }}>
                {currentQuestion.question}
              </Typography>
              
              <FormControl component="fieldset" sx={{ width: '100%' }}>
                <RadioGroup value={selectedOption}>
                  {currentQuestion.options.map((option, index) => (
                    <Paper
                      key={index}
                      elevation={1}
                      sx={{
                        mb: 2,
                        borderRadius: 2,
                        transition: 'all 0.2s',
                        bgcolor: isAnswered
                          ? index === currentQuestion.correctAnswer
                            ? 'success.light'
                            : selectedOption === index && selectedOption !== currentQuestion.correctAnswer
                            ? 'error.light'
                            : 'background.paper'
                          : 'background.paper',
                        '&:hover': {
                          bgcolor: isAnswered
                            ? index === currentQuestion.correctAnswer
                              ? 'success.light'
                              : selectedOption === index && selectedOption !== currentQuestion.correctAnswer
                              ? 'error.light'
                              : 'background.paper'
                            : 'action.hover',
                          transform: isAnswered ? 'scale(1)' : 'scale(1.02)',
                        },
                      }}
                    >
                      <FormControlLabel
                        value={index}
                        control={<Radio />}
                        label={option}
                        disabled={isAnswered}
                        onClick={() => handleOptionSelect(index)}
                        sx={{
                          m: 0,
                          width: '100%',
                          py: 1.5,
                          px: 2,
                          '& .MuiFormControlLabel-label': {
                            width: '100%',
                            fontWeight: isAnswered && index === currentQuestion.correctAnswer ? 'bold' : 'regular',
                          },
                        }}
                      />
                    </Paper>
                  ))}
                </RadioGroup>
              </FormControl>
            </Paper>
          </motion.div>
        </AnimatePresence>
        
        {/* Feedback dialog */}
        <Dialog
          open={showFeedback}
          sx={{ '& .MuiDialog-paper': { borderRadius: 3 } }}
        >
          <DialogTitle component="div" sx={{ textAlign: 'center', pt: 3 }}>
            {selectedOption === currentQuestion.correctAnswer ? (
              <Typography variant="h5" component="div" color="success.main" sx={{ fontWeight: 'bold' }}>
                Correct!
              </Typography>
            ) : (
              <Typography variant="h5" component="div" color="error.main" sx={{ fontWeight: 'bold' }}>
                Incorrect
              </Typography>
            )}
          </DialogTitle>
          
          <DialogContent>
            <Box sx={{ textAlign: 'center', py: 2 }}>
              {selectedOption === currentQuestion.correctAnswer ? (
                <>
                  <CorrectIcon color="success" sx={{ fontSize: 60 }} />
                  
                  {/* Show points earned for this question */}
                  {answers.length > 0 && answers[answers.length - 1].points && (
                    <Box sx={{ mt: 2, mb: 1 }}>
                      <Typography variant="h5" component="div" color="success.main" sx={{ fontWeight: 'bold' }}>
                        +{answers[answers.length - 1].points} points
                      </Typography>
                      <Typography variant="body2" component="div" color="text.secondary">
                        (includes +{answers[answers.length - 1].timeBonus} speed bonus)
                      </Typography>
                    </Box>
                  )}
                </>
              ) : (
                <IncorrectIcon color="error" sx={{ fontSize: 60 }} />
              )}
              
              <Typography variant="body1" component="div" sx={{ mt: 2, mb: 1 }}>
                {selectedOption === currentQuestion.correctAnswer
                  ? "Great job! You got it right."
                  : `The correct answer was: ${currentQuestion.options[currentQuestion.correctAnswer]}`}
              </Typography>
            </Box>
          </DialogContent>
          
          <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
            <Button
              variant="contained"
              onClick={nextQuestion}
              endIcon={<NextIcon />}
              sx={{
                borderRadius: 8,
                px: 3,
                background: 'linear-gradient(45deg, #2196F3 30%, #9C27B0 90%)',
              }}
            >
              {currentQuestionIndex < quizData.questions.length - 1 ? 'Next Question' : 'See Results'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </PublicLayout>
  );
}