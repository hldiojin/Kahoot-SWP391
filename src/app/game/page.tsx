'use client';

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  CircularProgress,
  Container,
  Chip,
  LinearProgress,
  Fade,
  Avatar,
  Dialog,
  DialogContent,
  DialogTitle,
  Slide
} from '@mui/material';
import { 
  CheckCircle as CorrectIcon,
  Cancel as WrongIcon,
  EmojiEvents as TrophyIcon,
  Timer as TimerIcon,
  Person as PersonIcon,
  Groups as GroupsIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import { lazy, Suspense } from 'react';
import PublicLayout from '../components/PublicLayout';
import quizService from '@/services/quizService';
import playerService from '@/services/playerService';
import questionService from '@/services/questionService';

// Default timer duration per question in seconds
const DEFAULT_TIMER_DURATION = 20;

// Timer colors based on remaining time
const getTimerColor = (percentage: number) => {
  if (percentage > 70) return '#4caf50';  // Green
  if (percentage > 30) return '#ff9800';  // Orange
  return '#f44336';  // Red
};

// Animation for option buttons
const buttonAnimation = {
  initial: { scale: 0.9, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0.9, opacity: 0 },
  transition: { duration: 0.3 }
};

// Feedback animations - modified to work with spring animation 
// Fixed: Separated spring animation from multi-keyframe animations
const feedbackAnimation = {
  initial: { scale: 0, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  transition: { duration: 0.5, type: 'spring', stiffness: 200 }
};

// Wobble animation - separate from spring animations
// Fixed: Using tween animation type instead of spring for multi-keyframe animations
const wobbleAnimation = {
  animate: { rotate: [0, -10, 10, -5, 5, 0] },
  transition: { duration: 0.6, ease: "easeInOut", type: "tween" }
};

// CustomAnimal component for avatars
const CustomAnimal = ({ animal, size, showBorder = false }: { animal: string, size: string, showBorder?: boolean }) => {
  // Define valid animals (these are the ones confirmed to work)
  const validAnimals = ["alligator", "anteater", "armadillo", "auroch", "badger", 
                        "bat", "beaver", "buffalo", "camel", "capybara", "chameleon", 
                        "cheetah", "cicada", "clam", "crab", "crayfish", "crow", 
                        "dinosaur", "dolphin", "elephant", "flamingo", "goat", 
                        "grasshopper", "guppy", "honeybee", "kangaroo", "lemur", 
                        "leopard", "llama", "lobster", "manatee", "mink", "monkey", 
                        "narwhal", "orangutan", "otter", "panda", "platypus", "pumpkin", 
                        "python", "quagga", "rabbit", "raccoon", "rhino", "sheep", 
                        "shrimp", "squirrel", "sunfish", "tadpole", "turtle", "walrus", 
                        "wolf", "wolverine", "wombat"];

  // Fallback to a working animal if the given one isn't valid
  const safeAnimal = validAnimals.includes(animal) ? animal : "panda";
  
  try {
    return (
      <Box sx={{ 
        width: size, 
        height: size, 
        borderRadius: '50%', 
        overflow: 'hidden',
        border: showBorder ? '3px solid white' : 'none',
        boxShadow: showBorder ? '0 0 10px rgba(0,0,0,0.2)' : 'none',
        backgroundColor: 'blue',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {/* Render a fallback UI instead of Animal component */}
        <Box sx={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 'bold',
          fontSize: `calc(${size} * 0.3)`,
        }}>
          {animal?.charAt(0)?.toUpperCase() || 'A'}
        </Box>
      </Box>
    );
  } catch (e) {
    return (
      <Box sx={{ 
        width: size, 
        height: size, 
        borderRadius: '50%', 
        backgroundColor: 'blue',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontWeight: 'bold',
        border: showBorder ? '3px solid white' : 'none',
        boxShadow: showBorder ? '0 0 10px rgba(0,0,0,0.2)' : 'none'
      }}>
        {animal?.charAt(0)?.toUpperCase() || 'A'}
      </Box>
    );
  }
};

// Option colors for the game (Kahoot style)
const OPTION_COLORS = [
  { bg: '#e21b3c', hover: '#d2193a', shadow: 'rgba(226, 27, 60, 0.4)' },  // Red
  { bg: '#1368ce', hover: '#1159b3', shadow: 'rgba(19, 104, 206, 0.4)' },  // Blue
  { bg: '#26890c', hover: '#217a0a', shadow: 'rgba(38, 137, 12, 0.4)' },  // Green
  { bg: '#faaf00', hover: '#e09c00', shadow: 'rgba(250, 175, 0, 0.4)' }   // Yellow
];

// Shape icons for options (Kahoot style)
const OPTION_SHAPES = ['▲', '◆', '●', '■'];

export default function GamePage() {
  // ...existing code...
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const quizCode = searchParams.get('code');
  
  // Game state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quizData, setQuizData] = useState<any>(null);
  const [playerInfo, setPlayerInfo] = useState<any>(null);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(DEFAULT_TIMER_DURATION);
  const [timerPercentage, setTimerPercentage] = useState(100);
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [submittedAnswer, setSubmittedAnswer] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [showCorrectAnswer, setShowCorrectAnswer] = useState(false);
  const [isFeedbackShown, setIsFeedbackShown] = useState(false);
  const [answersRecord, setAnswersRecord] = useState<any[]>([]);
  const [questionStartTime, setQuestionStartTime] = useState(0);
  const [answerTime, setAnswerTime] = useState(0);
  const [waitingState, setWaitingState] = useState(false);
  const [otherPlayers, setOtherPlayers] = useState<any[]>([]);
  const [playerData, setPlayerData] = useState<any>(null); // To store the player data from API
  
  // Hardcoded data for demonstration (will be used if real data fails to load)
  const hardcodedQuestion = {
    id: "1",
    question: "Câu hỏi 1",
    options: ["Đáp án A", "Đáp án B", "Đáp án C", "Đáp án D"],
    correctAnswer: 0,
    timeLimit: 30,
    points: 100
  };

  // Load game data
  useEffect(() => {
    const loadGame = async () => {
      try {
        if (!quizCode) {
          throw new Error('No quiz code provided');
        }

        // Fetch player info from session storage
        const playerInfoStr = sessionStorage.getItem('currentPlayer');
        if (!playerInfoStr) {
          throw new Error('No player information found. Please join the game first.');
        }

        // Parse player info
        const playerData = JSON.parse(playerInfoStr);
        setPlayerInfo(playerData);
        console.log('Player info loaded:', playerData);

        // Fetch quiz data
        const quizDataStr = sessionStorage.getItem('quizPreviewData');
        if (quizDataStr) {
          // Use the cached quiz data if available
          const parsedQuiz = JSON.parse(quizDataStr);
          setQuizData(parsedQuiz);
          console.log('Quiz data loaded from session storage:', parsedQuiz);
        } else {
          // Fetch quiz data from API if not in session storage
          console.log('Fetching quiz data from API for code:', quizCode);
          try {
            const response = await quizService.getQuizByCode(quizCode);
            
            if (response && response.data) {
              const apiQuizData = response.data;
              console.log('Quiz data loaded from API:', apiQuizData);
              
              // Get the questions separately using the questions API
              try {
                console.log('Fetching questions for quiz ID:', apiQuizData.id);
                // Note: We need to make sure we have the quiz ID from the response
                if (apiQuizData.id) {
                  const questionsResponse = await questionService.getQuestionsByQuizId(apiQuizData.id);
                  console.log('Questions API response:', questionsResponse);
                  
                  if (questionsResponse && questionsResponse.data && Array.isArray(questionsResponse.data)) {
                    // Format the questions to match the expected format
                    const formattedQuestions = questionsResponse.data.map((q: any) => {
                      // Determine the correct answer index based on isCorrect value
                      const correctAnswerIndex = q.isCorrect ? 
                        q.isCorrect.charCodeAt(0) - 'A'.charCodeAt(0) : 0;
                      
                      console.log(`Question: ${q.text}, correctAnswer: ${q.isCorrect} (index ${correctAnswerIndex})`);
                      
                      // FIXED: Always provide default options regardless of whether the original options are empty
                      const options = [
                        q.optionA?.trim() || `Option A`,
                        q.optionB?.trim() || `Option B`,
                        q.optionC?.trim() || `Option C`,
                        q.optionD?.trim() || `Option D`
                      ];
                      
                      console.log("Formatted options:", options);
                      
                      return {
                        id: q.id.toString(),
                        question: q.text || 'Question',
                        options: options,
                        correctAnswer: correctAnswerIndex,
                        timeLimit: q.timeLimit || DEFAULT_TIMER_DURATION,
                        points: q.score || 100
                      };
                    });
                    
                    // Add the formatted questions to the quiz data
                    apiQuizData.questions = formattedQuestions;
                    console.log('Updated quiz data with questions:', apiQuizData);
                  } else {
                    console.warn('No questions found or invalid response', questionsResponse);
                    apiQuizData.questions = [];
                  }
                }
              } catch (questionsError) {
                console.error('Error fetching questions:', questionsError);
                apiQuizData.questions = []; // Set empty questions on error
              }
              
              setQuizData(apiQuizData);
            } else {
              throw new Error('Failed to load quiz data');
            }
          } catch (apiError) {
            console.error('Error fetching quiz data:', apiError);
            throw new Error('Failed to load quiz data. Please check the quiz code.');
          }
        }

        setLoading(false);
      } catch (error) {
        console.error('Error loading game:', error);
        setError(error instanceof Error ? error.message : 'An unknown error occurred');
        setLoading(false);
      }
    };

    loadGame();
  }, [quizCode]);

  // Set current question when quiz data is loaded or question index changes
  useEffect(() => {
    if (quizData && quizData.questions && quizData.questions.length > 0) {
      if (currentQuestionIndex < quizData.questions.length) {
        setCurrentQuestion(quizData.questions[currentQuestionIndex]);
      } else {
        // All questions answered, show final results
        setShowResults(true);
      }
    } else {
      // If no questions loaded from API, use hardcoded data
      console.log("Using hardcoded question data since API data is missing");
      
      // Create a minimal quiz structure with our hardcoded question
      const demoQuiz = {
        title: "Demo Quiz",
        description: "This is a demo quiz with hardcoded questions",
        questions: [hardcodedQuestion],
        gameMode: "solo"
      };
      
      setQuizData(demoQuiz);
      setCurrentQuestion(hardcodedQuestion);
    }
  }, [quizData, currentQuestionIndex, hardcodedQuestion]);

  // Timer effect for current question
  useEffect(() => {
    if (!gameStarted || showResults || !currentQuestion || isFeedbackShown) return;

    const questionTimer = currentQuestion.timeLimit || DEFAULT_TIMER_DURATION;
    setTimeLeft(questionTimer);
    setQuestionStartTime(Date.now());
    
    const timerInterval = setInterval(() => {
      setTimeLeft(prev => {
        const newTime = prev - 1;
        setTimerPercentage((newTime / questionTimer) * 100);
        if (newTime <= 0) {
          clearInterval(timerInterval);
          handleTimeUp();
          return 0;
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [currentQuestion, gameStarted, showResults, isFeedbackShown]);

  // Function to start the game
  const startGame = () => {
    setGameStarted(true);
    setCurrentQuestionIndex(0);
    setScore(0);
    setAnswersRecord([]);
  };

  // Handle when time runs out for a question
  const handleTimeUp = () => {
    if (selectedAnswer === null) {
      // Time's up without an answer
      setIsCorrect(false);
      setSubmittedAnswer(null);
      
      // No answer selected, send -1 as answer index
      showFeedback(-1, false, currentQuestion?.timeLimit || DEFAULT_TIMER_DURATION);
    }
  };

  // Handle selecting an answer
  const handleSelectAnswer = (answerIndex: number) => {
    if (submittedAnswer !== null || isFeedbackShown) return;
    
    setSelectedAnswer(answerIndex);
    setSubmittedAnswer(answerIndex);
    
    // Calculate answer time
    const timeTaken = Math.floor((Date.now() - questionStartTime) / 1000);
    setAnswerTime(timeTaken);
    
    // Check if answer is correct
    const isAnswerCorrect = answerIndex === currentQuestion.correctAnswer;
    setIsCorrect(isAnswerCorrect);
    
    // Show feedback
    showFeedback(answerIndex, isAnswerCorrect, timeTaken);
    
    // Calculate score (more points for faster answers)
    if (isAnswerCorrect) {
      const timeBonus = Math.max(0, timeLeft) * 10;
      const questionScore = 1000 + timeBonus;
      setScore(prev => prev + questionScore);
    }
  };

  // Update the showFeedback function to better handle player IDs
  const showFeedback = (answerIndex: number, isCorrect: boolean, timeTaken: number) => {
    setIsFeedbackShown(true);
    
    // Save the answer to the API
    if (playerInfo) {
      try {
        // Convert answer index to letter (A, B, C, D)
        // Use 'T' for timeout (no answer)
        const answerLetter = answerIndex >= 0 ? 
          String.fromCharCode(65 + answerIndex) : // A=65, B=66, etc.
          'T'; // T for Timeout/no answer
        
        // Get player ID from stored info and ensure it's a valid number
        const playerId = playerInfo.id || playerInfo.playerId;
        
        // Only proceed if we have a valid player ID and question ID
        if (playerId && currentQuestion?.id) {
          console.log(`Submitting answer: Player=${playerId}, Question=${currentQuestion.id}, Answer=${answerLetter}, Correct=${isCorrect}`);
          
          // Create answer data
          const answerData = {
            id: 0,
            playerId: parseInt(playerId),
            questionId: parseInt(currentQuestion.id),
            answeredAt: new Date().toISOString(),
            isCorrect: isCorrect,
            responseTime: timeTaken,
            answer: answerLetter
          };
          
          // Try direct API call for reliability
          axios.post(
            'https://kahootclone-f7hkd0hwafgbfrfa.southeastasia-01.azurewebsites.net/api/PlayerAnswer',
            answerData,
            {
              headers: {
                'Content-Type': 'application/json'
              }
            }
          ).then(response => {
            console.log("Answer submitted successfully:", response.data);
          }).catch(error => {
            console.error("Error submitting answer to API:", error);
          });
        } else {
          console.warn("Cannot submit answer: Missing player ID or question ID", { 
            playerId, 
            questionId: currentQuestion?.id 
          });
        }
      } catch (error) {
        console.error("Error preparing answer submission:", error);
      }
    }
    
    setTimeout(() => {
      setShowCorrectAnswer(true);
      
      // Record the answer
      setAnswersRecord(prev => [...prev, {
        questionIndex: currentQuestionIndex,
        selectedAnswer: answerIndex,
        isCorrect: answerIndex === currentQuestion.correctAnswer,
        timeTaken: answerTime,
        correctAnswer: currentQuestion.correctAnswer
      }]);
      
      // Wait before moving to next question
      setTimeout(() => {
        setWaitingState(true);
        // Simulate others answering
        setTimeout(() => {
          moveToNextQuestion();
        }, 2000);
      }, 2000);
    }, 1000);
  };

  // Move to the next question
  const moveToNextQuestion = () => {
    setSelectedAnswer(null);
    setSubmittedAnswer(null);
    setIsCorrect(null);
    setShowCorrectAnswer(false);
    setIsFeedbackShown(false);
    setWaitingState(false);
    
    if (currentQuestionIndex < quizData.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // Show final results
      setShowResults(true);
    }
  };

  // Exit the game
  const exitGame = () => {
    router.push('/');
  };

  // Play again
  const playAgain = () => {
    // Reset the game state
    setGameStarted(false);
    setShowResults(false);
    setCurrentQuestionIndex(0);
    setScore(0);
    setAnswersRecord([]);
    setSelectedAnswer(null);
    setSubmittedAnswer(null);
    setIsCorrect(null);
  };

  // Calculate stats for results screen
  const calculateStats = () => {
    const correctAnswers = answersRecord.filter(a => a.isCorrect).length;
    const totalQuestions = quizData?.questions?.length || 0;
    const accuracy = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
    
    return {
      totalScore: score,
      correctAnswers,
      totalQuestions,
      accuracy: Math.round(accuracy)
    };
  };

  // LOADING SCREEN
  if (loading) {
    return (
      <PublicLayout>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '70vh' 
        }}>
          <CircularProgress size={60} sx={{ mb: 3 }} />
          <Typography variant="h6">Loading game...</Typography>
        </Box>
      </PublicLayout>
    );
  }

  // ERROR SCREEN
  if (error) {
    return (
      <PublicLayout>
        <Container maxWidth="sm" sx={{ py: 4 }}>
          <Paper 
            elevation={3} 
            sx={{ 
              p: 3, 
              textAlign: 'center',
              borderRadius: 2
            }}
          >
            <Typography variant="h5" gutterBottom color="error">
              Oops! Something went wrong
            </Typography>
            <Typography variant="body1" sx={{ mb: 3 }}>
              {error}
            </Typography>
            <Button 
              variant="contained" 
              color="primary"
              onClick={() => router.push('/')}
            >
              Return to Home
            </Button>
          </Paper>
        </Container>
      </PublicLayout>
    );
  }

  // GAME LOBBY SCREEN
  if (!gameStarted) {
    return (
      <PublicLayout>
        <Container maxWidth="md" sx={{ py: 4 }}>
          <Paper
            elevation={3}
            sx={{
              p: 4,
              borderRadius: 3,
              textAlign: 'center',
              background: 'linear-gradient(to right, #6A11CB, #2575FC)',
              color: 'white'
            }}
          >
            <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
              Ready to play?
            </Typography>
            
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" gutterBottom>
                {quizData?.title || 'Quiz Game'}
              </Typography>
              
              <Typography variant="subtitle1" sx={{ mb: 2, opacity: 0.8 }}>
                {quizData?.description || 'Test your knowledge!'}
              </Typography>
              
              <Chip 
                icon={quizData?.gameMode === 'team' ? <GroupsIcon /> : <PersonIcon />}
                label={quizData?.gameMode === 'team' ? "Team Mode" : "Solo Mode"}
                sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', my: 1 }}
              />
            </Box>
            
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'center' }}>
              <Box sx={{ textAlign: 'center', p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                  <CustomAnimal 
                    animal={playerInfo?.avatar || 'fox'} 
                    size="100px"
                    showBorder
                  />
                </Box>
                <Typography variant="h6">
                  {playerInfo?.name || 'Player'}
                </Typography>
                {playerInfo?.team && (
                  <Chip 
                    label={playerInfo.team} 
                    size="small" 
                    sx={{ mt: 1, bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }} 
                  />
                )}
              </Box>
            </Box>
            
            <Typography variant="body1" sx={{ mb: 4 }}>
              This quiz has {quizData?.questions?.length || 0} questions. Get ready to answer them as quickly as possible!
            </Typography>
            
            <Button
              variant="contained"
              size="large"
              onClick={startGame}
              sx={{
                px: 6,
                py: 1.5,
                fontSize: '1.2rem',
                fontWeight: 'bold',
                bgcolor: 'white',
                color: '#6A11CB',
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.9)',
                }
              }}
            >
              Start Game
            </Button>
          </Paper>
        </Container>
      </PublicLayout>
    );
  }

  // RESULTS SCREEN
  if (showResults) {
    const stats = calculateStats();
    
    return (
      <PublicLayout>
        <Container maxWidth="md" sx={{ py: 4 }}>
          <Paper
            elevation={3}
            sx={{
              p: 4,
              borderRadius: 3,
              textAlign: 'center',
              background: 'linear-gradient(to right, #11998e, #38ef7d)',
              color: 'white'
            }}
          >
            <Box sx={{ mb: 4 }}>
              <TrophyIcon sx={{ fontSize: 60, color: '#FFD700', mb: 2 }} />
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                Game Complete!
              </Typography>
            </Box>
            
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" gutterBottom>
                Your Score: {stats.totalScore}
              </Typography>
              
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                gap: 2, 
                flexWrap: 'wrap',
                mb: 3
              }}>
                <Chip 
                  label={`${stats.correctAnswers}/${stats.totalQuestions} Correct`} 
                  icon={<CorrectIcon />}
                  sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                />
                <Chip 
                  label={`${stats.accuracy}% Accuracy`} 
                  sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                />
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                <CustomAnimal 
                  animal={playerInfo?.avatar || 'fox'} 
                  size="120px"
                  showBorder
                />
              </Box>
              
              <Typography variant="h6">
                {playerInfo?.name || 'Player'}
              </Typography>
              {playerInfo?.team && (
                <Typography variant="body1" sx={{ opacity: 0.8, mt: 1 }}>
                  Team: {playerInfo.team}
                </Typography>
              )}
            </Box>
            
            {/* Button Group - replacing Grid */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 2 }}>
              <Box sx={{ width: { xs: '100%', sm: '45%', md: '30%' }, minWidth: '180px' }}>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={playAgain}
                  sx={{
                    py: 1.5,
                    bgcolor: 'white',
                    color: '#11998e',
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,0.9)',
                    }
                  }}
                >
                  Play Again
                </Button>
              </Box>
              <Box sx={{ width: { xs: '100%', sm: '45%', md: '30%' }, minWidth: '180px' }}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={exitGame}
                  sx={{
                    py: 1.5,
                    borderColor: 'white',
                    color: 'white',
                    '&:hover': {
                      borderColor: 'white',
                      bgcolor: 'rgba(255,255,255,0.1)',
                    }
                  }}
                >
                  Exit
                </Button>
              </Box>
            </Box>
          </Paper>
          
          {/* Answer Summary */}
          <Paper
            elevation={2}
            sx={{
              p: 3,
              borderRadius: 3,
              mt: 3
            }}
          >
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              Questions Summary
            </Typography>
            
            <Box sx={{ maxHeight: '400px', overflow: 'auto', pr: 1 }}>
              {answersRecord.map((record, index) => {
                const question = quizData?.questions[record.questionIndex];
                return (
                  <Paper 
                    key={index}
                    variant="outlined"
                    sx={{ 
                      p: 2, 
                      mb: 2,
                      borderColor: record.isCorrect ? '#4caf50' : '#f44336',
                      borderLeft: '4px solid',
                      borderLeftColor: record.isCorrect ? '#4caf50' : '#f44336' 
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                      {record.isCorrect ? (
                        <CorrectIcon color="success" sx={{ mr: 1, mt: 0.5 }} />
                      ) : (
                        <WrongIcon color="error" sx={{ mr: 1, mt: 0.5 }} />
                      )}
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                          Q{index + 1}: {question?.question || 'Question'}
                        </Typography>
                        
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          Your answer: {record.selectedAnswer !== -1 
                            ? question?.options[record.selectedAnswer] || 'No answer' 
                            : 'No answer (time up)'}
                        </Typography>
                        
                        {!record.isCorrect && (
                          <Typography variant="body2" color="success.main" sx={{ mt: 0.5 }}>
                            Correct answer: {question?.options[record.correctAnswer] || 'Unknown'}
                          </Typography>
                        )}
                        
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                          Time taken: {record.timeTaken}s
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>
                );
              })}
            </Box>
          </Paper>
        </Container>
      </PublicLayout>
    );
  }

  // MAIN GAME SCREEN
  return (
    <Box sx={{ 
      minHeight: '100vh', 
      bgcolor: '#f5f5f5',
      position: 'relative',
      overflow: 'hidden',
      backgroundImage: 'linear-gradient(to bottom right, #46178f, #9a42fe)',
      color: 'white'
    }}>
      {/* Timer Bar */}
      <LinearProgress 
        variant="determinate" 
        value={timerPercentage} 
        sx={{ 
          height: 12, 
          '& .MuiLinearProgress-bar': {
            bgcolor: getTimerColor(timerPercentage)
          }
        }} 
      />
      
      {/* Game Header */}
      <Box sx={{ 
        p: 2, 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Box>
          <Typography variant="h6">
            Q{currentQuestionIndex + 1}/{quizData?.questions?.length || 0}
          </Typography>
        </Box>
        
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center',
          gap: 1,
          p: 1,
          px: 2,
          borderRadius: 4,
          bgcolor: 'rgba(255,255,255,0.2)'
        }}>
          <TimerIcon />
          <Typography variant="h6" fontWeight="bold">
            {timeLeft}s
          </Typography>
        </Box>
        
        <Box>
          <Chip 
            avatar={
              <CustomAnimal animal={playerInfo?.avatar || 'fox'} size="24px" />
            }
            label={playerInfo?.name || 'Player'} 
            sx={{ 
              fontWeight: 'medium', 
              bgcolor: 'rgba(255,255,255,0.2)', 
              color: 'white',
              border: 'none'
            }}
          />
        </Box>
      </Box>
      
      {/* Question Area */}
      <Container maxWidth="md" sx={{ py: 3 }}>
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Paper 
            elevation={3} 
            sx={{ 
              p: 4, 
              borderRadius: 3, 
              bgcolor: 'white',
              boxShadow: '0 8px 30px rgba(0,0,0,0.1)',
              mb: 4,
              minHeight: '120px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <Typography 
              variant="h5" 
              align="center"
              sx={{ fontWeight: 'bold', color: '#333' }}
            >
              {currentQuestion?.question || 'Loading question...'}
            </Typography>
            
            {/* Points info */}
            <Box sx={{ 
              position: 'absolute',
              top: 10,
              right: 10,
              display: 'flex',
              alignItems: 'center',
              bgcolor: '#f0f0f0',
              px: 1.5,
              py: 0.5,
              borderRadius: 4,
              fontSize: '0.8rem',
              color: '#555'
            }}>
              <Box sx={{ mr: 1, fontWeight: 'bold' }}>
                {currentQuestion?.points || 100}
              </Box>
              points
            </Box>
          </Paper>
        </motion.div>
        
        {/* Answer Options - Kahoot style */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
          {currentQuestion?.options?.map((option: string, index: number) => (
            <motion.div
              key={index}
              initial={buttonAnimation.initial}
              animate={buttonAnimation.animate}
              exit={buttonAnimation.exit}
              transition={{ ...buttonAnimation.transition, delay: index * 0.15 }}
            >
              <Button
                fullWidth
                variant="contained"
                onClick={() => handleSelectAnswer(index)}
                disabled={submittedAnswer !== null || isFeedbackShown}
                sx={{
                  py: 3,
                  height: '100%',
                  borderRadius: 3,
                  textTransform: 'none',
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                  justifyContent: 'flex-start',
                  bgcolor: OPTION_COLORS[index].bg,
                  color: 'white',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: `0 8px 15px ${OPTION_COLORS[index].shadow}`,
                  '&:hover': {
                    bgcolor: OPTION_COLORS[index].hover,
                    transform: 'translateY(-3px)',
                    boxShadow: `0 12px 20px ${OPTION_COLORS[index].shadow}`,
                  },
                  transition: 'all 0.2s',
                  // Highlight selected answer
                  ...(submittedAnswer === index && {
                    boxShadow: `0 0 0 4px white, 0 0 0 8px ${OPTION_COLORS[index].bg}`,
                  }),
                  // Show correct/incorrect state
                  ...(showCorrectAnswer && {
                    bgcolor: index === currentQuestion.correctAnswer 
                      ? '#4caf50' // Green for correct
                      : submittedAnswer === index ? '#f44336' : OPTION_COLORS[index].bg, // Red for selected wrong answer
                    opacity: index !== currentQuestion.correctAnswer && index !== submittedAnswer ? 0.7 : 1
                  })
                }}
              >
                {/* Shape icon */}
                <Box
                  sx={{
                    mr: 2,
                    minWidth: 45,
                    height: 45,
                    borderRadius: '8px',
                    bgcolor: 'rgba(0,0,0,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem',
                    fontWeight: 'bold'
                  }}
                >
                  {OPTION_SHAPES[index]}
                </Box>
                
                <Box sx={{ flex: 1, textAlign: 'left', pr: 3 }}>
                  {`${String.fromCharCode(65 + index)}: ${option || `Option ${String.fromCharCode(65 + index)}`}`} {/* Always show A, B, C, D prefixes */}
                </Box>
                
                {/* Correct answer indicator with improved visibility */}
                {showCorrectAnswer && index === currentQuestion.correctAnswer && (
                  <Box
                    sx={{
                      position: 'absolute',
                      right: 16,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.6, type: 'spring', stiffness: 200 }}
                    >
                      <CorrectIcon sx={{ fontSize: '2.5rem', filter: 'drop-shadow(0 0 3px rgba(0,0,0,0.3))' }} />
                    </motion.div>
                  </Box>
                )}
                
                {/* Selected answer indicator */}
                {submittedAnswer === index && !showCorrectAnswer && (
                  <Box
                    sx={{
                      position: 'absolute',
                      right: 16,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <motion.div 
                      animate={{ 
                        scale: [1, 1.2, 1],
                      }}
                      transition={{ 
                        duration: 1.5,
                        repeat: Infinity,
                      }}
                    >
                      <CircularProgress size={30} color="inherit" thickness={5} />
                    </motion.div>
                  </Box>
                )}
              </Button>
            </motion.div>
          ))}
        </Box>
      </Container>
      
      {/* Feedback Dialog */}
      <Dialog
        open={isFeedbackShown}
        TransitionComponent={Slide}
        transitionDuration={300}
        PaperProps={{
          sx: {
            borderRadius: 4,
            boxShadow: 24,
            maxWidth: 450,
            backgroundImage: isCorrect 
              ? 'linear-gradient(to bottom right, #4CAF50, #8BC34A)'
              : 'linear-gradient(to bottom right, #F44336, #FF9800)',
            color: 'white',
            overflow: 'hidden'
          }
        }}
      >
        <DialogContent sx={{ p: 5, textAlign: 'center' }}>
          <motion.div
            initial={feedbackAnimation.initial}
            animate={feedbackAnimation.animate}
            transition={feedbackAnimation.transition}
          >
            <Box sx={{ mb: 3 }}>
              {isCorrect ? (
                <CorrectIcon sx={{ fontSize: 100, color: 'white' }} />
              ) : (
                <WrongIcon sx={{ fontSize: 100, color: 'white' }} />
              )}
            </Box>
            
            <Typography variant="h4" sx={{ mb: 2, fontWeight: 'bold' }}>
              {isCorrect ? 'Correct!' : 'Incorrect!'}
            </Typography>
          </motion.div>
          
          {!isCorrect && showCorrectAnswer && currentQuestion && (
            <Typography variant="h6" sx={{ mb: 3 }}>
              The correct answer is: <Box component="span" sx={{ fontWeight: 'bold' }}>{currentQuestion.options[currentQuestion.correctAnswer]}</Box>
            </Typography>
          )}
          
          {isCorrect && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, duration: 0.5, type: 'spring' }}
            >
              <Box sx={{ 
                bgcolor: 'rgba(255,255,255,0.2)', 
                display: 'inline-block', 
                px: 3, 
                py: 1, 
                borderRadius: 3,
                fontWeight: 'bold',
                fontSize: '1.5rem'
              }}>
                +{score} points
              </Box>
            </motion.div>
          )}
          
          {waitingState && (
            <Box sx={{ mt: 4 }}>
              <Typography variant="body1">
                Waiting for other players...
              </Typography>
              <LinearProgress sx={{ mt: 2, height: 8, borderRadius: 4 }} />
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}