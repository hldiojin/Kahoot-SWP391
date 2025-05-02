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
import dynamic from 'next/dynamic';

// Import Animal component with dynamic import to avoid SSR issues
const Animal = dynamic(() => import('react-animals'), { ssr: false });

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

// Constants for animals and colors
const ANIMALS = ["alligator", "beaver", "dolphin", "elephant", "fox", "penguin", "tiger", "turtle"]; // Use animals supported by the library

// Map animals to colors for visual consistency
const animalColorMap = {
  alligator: "green",
  beaver: "red",
  dolphin: "blue",
  elephant: "purple",
  fox: "orange",
  penguin: "purple",
  tiger: "yellow",
  turtle: "green"
};

// Valid colors for the react-animals library
const VALID_COLORS = ["red", "blue", "green", "yellow", "orange", "purple", "pink", "brown"];

// CustomAnimal component for avatars
const CustomAnimal = ({ animal, size, showBorder = false }: { animal: string, size: string, showBorder?: boolean }) => {
  // Determine if the provided name is a valid animal name
  const isValidAnimal = ANIMALS.includes(animal);
  const animalName = isValidAnimal ? animal : 'alligator'; // Fallback to alligator if invalid
  
  // Use color from the map, ensuring it's valid
  const mappedColor = animalColorMap[animalName as keyof typeof animalColorMap];
  let animalColor = mappedColor || 'orange';
  
  // Make sure color is valid
  if (!VALID_COLORS.includes(animalColor)) {
    animalColor = 'orange'; // Fallback to a known valid color
  }

  try {
    return (
      <Box sx={{ 
        width: size, 
        height: size, 
        borderRadius: '50%', 
        overflow: 'hidden',
        border: showBorder ? '3px solid white' : 'none',
        boxShadow: showBorder ? '0 0 10px rgba(0,0,0,0.2)' : 'none',
        backgroundColor: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Animal
          name={animalName}
          color={animalColor}
          size="100%"
        />
      </Box>
    );
  } catch (e) {
    // Fallback UI if Animal component fails
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
  const [gameMode, setGameMode] = useState<'solo' | 'team'>('solo'); // Add explicit game mode state
  const [feedbackColor, setFeedbackColor] = useState<'correct' | 'incorrect' | null>(null); // Add state for feedback color
  
  // Hardcoded data for demonstration (will be used if real data fails to load)
  const hardcodedQuestion = {
    id: "1",
    question: "Câu hỏi 1",
    options: ["Đáp án A", "Đáp án B", "Đáp án C", "Đáp án D"],
    correctAnswer: 0,
    timeLimit: 30,
    points: 100
  };

  useEffect(() => {
    const loadGame = async () => {
      try {
        if (!quizCode) {
          throw new Error('No quiz code provided');
        }

        const playerInfoStr = sessionStorage.getItem('currentPlayer');
        if (!playerInfoStr) {
          throw new Error('No player information found. Please join the game first.');
        }

        const playerData = JSON.parse(playerInfoStr);
        setPlayerInfo(playerData);
        
        // Try to get game mode from sessionStorage (most reliable source)
        // This should be consistently set in create-game, play-game, and quizService
        const storedGameMode = sessionStorage.getItem('gameMode');
        console.log("Game mode from sessionStorage:", storedGameMode);
        
        if (storedGameMode) {
          // Normalize to ensure valid values only
          const normalizedGameMode = storedGameMode.trim().toLowerCase() === 'team' ? 'team' : 'solo';
          console.log(`Using normalized game mode from sessionStorage: ${normalizedGameMode}`);
          setGameMode(normalizedGameMode as 'solo' | 'team');
        }

        try {
          console.log(`Fetching quiz data for code: ${quizCode}`);
          const quizResponse = await fetch(
            `https://kahootclone-f7hkd0hwafgbfrfa.southeastasia-01.azurewebsites.net/api/Quiz/QuizCode/${quizCode}`
          );
          const quizResponseData = await quizResponse.json();
          
          console.log("Full quiz response:", quizResponseData);
          
          if (quizResponseData && quizResponseData.status === 200 && quizResponseData.data) {
            const quizInfo = quizResponseData.data;
            console.log("Quiz info:", quizInfo);
            
            // Only process game mode from API if not already set from sessionStorage
            if (!storedGameMode) {
              // Process and normalize the game mode
              let processedGameMode: 'solo' | 'team' = 'solo';
              
              const apiGameMode = quizInfo.gameMode;
              console.log("API game mode:", apiGameMode, "type:", typeof apiGameMode);
              
              if (apiGameMode !== undefined && apiGameMode !== null) {
                if (typeof apiGameMode === 'string') {
                  // Normalize string value
                  processedGameMode = apiGameMode.trim().toLowerCase() === 'team' ? 'team' : 'solo';
                } else if (apiGameMode === true || apiGameMode === 1) {
                  processedGameMode = 'team';
                } else if (apiGameMode === false || apiGameMode === 0) {
                  processedGameMode = 'solo';
                } else if (typeof apiGameMode === 'number') {
                  processedGameMode = apiGameMode === 0 ? 'solo' : 'team';
                }
                
                console.log("Processed game mode from API:", processedGameMode);
                // Always store in sessionStorage for consistency across components
                sessionStorage.setItem('gameMode', processedGameMode);
                setGameMode(processedGameMode);
              }
            }
            
            const quizId = quizInfo.id;
            
            const questionsResponse = await fetch(
              `https://kahootclone-f7hkd0hwafgbfrfa.southeastasia-01.azurewebsites.net/api/questions/quiz/${quizId}`
            );
            const questionsResponseData = await questionsResponse.json();
            
            if (questionsResponseData && questionsResponseData.status === 200 && Array.isArray(questionsResponseData.data)) {
              const rawQuestions = questionsResponseData.data;
              
              const sortedQuestions = [...rawQuestions].sort((a, b) => a.arrange - b.arrange);
              
              const formattedQuestions = sortedQuestions.map(q => {
                const questionId = typeof q.id === 'string' ? parseInt(q.id, 10) : q.id;
                
                const correctAnswerIndex = q.isCorrect ? 
                  q.isCorrect.charCodeAt(0) - 'A'.charCodeAt(0) : 0;
                
                const options = [
                  q.optionA && q.optionA.trim() !== "" ? q.optionA.trim() : `Option A`,
                  q.optionB && q.optionB.trim() !== "" ? q.optionB.trim() : `Option B`,
                  q.optionC && q.optionC.trim() !== "" ? q.optionC.trim() : `Option C`,
                  q.optionD && q.optionD.trim() !== "" ? q.optionD.trim() : `Option D`
                ];
                
                return {
                  id: questionId,
                  question: q.text || 'Question',
                  options: options,
                  correctAnswer: correctAnswerIndex,
                  timeLimit: q.timeLimit || DEFAULT_TIMER_DURATION,
                  points: q.score || 100
                };
              });
              
              // Get the current game mode from state (may have been set from sessionStorage or API)
              const currentGameMode = gameMode;
              
              const completeQuizData = {
                ...quizInfo,
                questions: formattedQuestions,
                // Ensure game mode is set correctly in quiz data
                gameMode: currentGameMode
              };
              
              console.log("Final quiz data with processed gameMode:", completeQuizData);
              setQuizData(completeQuizData);
            } else {
              throw new Error('No questions found for this quiz.');
            }
          } else {
            throw new Error('Quiz not found. Please check the quiz code.');
          }
        } catch (apiError) {
          console.error("API error:", apiError);
          throw new Error('Failed to load quiz data. Please check the quiz code.');
        }

        setLoading(false);
      } catch (error) {
        console.error("Load game error:", error);
        setError(error instanceof Error ? error.message : 'An unknown error occurred');
        setLoading(false);
      }
    };

    loadGame();
  }, [quizCode]);

  useEffect(() => {
    if (quizData && quizData.questions && quizData.questions.length > 0) {
      if (currentQuestionIndex < quizData.questions.length) {
        setCurrentQuestion(quizData.questions[currentQuestionIndex]);
      } else {
        setShowResults(true);
      }
    } else {
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

  // Add a specific effect to log game mode when it changes
  useEffect(() => {
    console.log("Current game mode:", gameMode);
    console.log("Player info:", playerInfo);
    console.log("Quiz data game mode:", quizData?.gameMode);
  }, [gameMode, playerInfo, quizData]);

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

  useEffect(() => {
    if (showResults) {
      const stats = calculateStats();
      
      const playerInfoStr = sessionStorage.getItem('currentPlayer');
      const playerInfo = playerInfoStr ? JSON.parse(playerInfoStr) : null;
      
      // Create a more detailed game results object
      const gameResults = {
        score: stats.totalScore,
        correctAnswers: stats.correctAnswers,
        totalQuestions: stats.totalQuestions,
        accuracy: stats.accuracy,
        player: {
          name: playerInfo?.name || 'Player',
          avatar: playerInfo?.avatar || 'dog',
          id: playerInfo?.id || playerInfo?.playerId || 0
        },
        answers: answersRecord,
        quizId: quizData?.id || 0
      };
      
      // Store player results in the format expected by the game-results page
      try {
        const playerResultData = [{
          name: playerInfo?.name || 'Player',
          score: stats.totalScore,
          correctAnswers: stats.correctAnswers,
          totalQuestions: stats.totalQuestions,
          timeBonus: Math.floor(stats.totalScore / 10),
          averageAnswerTime: answersRecord.length > 0 ? 
            answersRecord.reduce((sum, a) => sum + a.timeTaken, 0) / answersRecord.length : 0,
          avatar: playerInfo?.avatar || 'dog',
          group: playerInfo?.team || null
        }];
        
        console.log("Saving game results:", playerResultData);
        
        // Clear previous results first to avoid any possible corruption
        sessionStorage.removeItem('gameResults');
        
        // Store the new results
        sessionStorage.setItem('gameResults', JSON.stringify(playerResultData));
        
        // Also store the complete game data for reference
        sessionStorage.setItem('completeGameData', JSON.stringify(gameResults));
        
        // Store current quiz data for reference on results page
        if (quizData) {
          sessionStorage.setItem('currentQuiz', JSON.stringify(quizData));
        }
        
        // Redirect to results page after a small delay to ensure data is stored
        setTimeout(() => {
          router.push('/game-results');
        }, 100);
      } catch (error) {
        console.error("Error saving game results:", error);
        // If there's an error, still try to redirect
        router.push('/game-results');
      }
    }
  }, [showResults, answersRecord, quizData, router]);

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

  const handleSelectAnswer = (index: number) => {
    if (submittedAnswer !== null || isFeedbackShown) return;
    
    // Set all the initial state at once to avoid flicker
    const isAnswerCorrect = index === currentQuestion.correctAnswer;
    setSelectedAnswer(index);
    setSubmittedAnswer(index);
    setIsCorrect(isAnswerCorrect);
    setFeedbackColor(isAnswerCorrect ? 'correct' : 'incorrect');
    setIsFeedbackShown(true);
    
    // Calculate elapsed time
    const elapsedTime = Math.min(
      (Date.now() - questionStartTime) / 1000,
      currentQuestion.timeLimit || DEFAULT_TIMER_DURATION
    );
    setAnswerTime(parseFloat(elapsedTime.toFixed(1)));
    
    // Calculate points based on speed and correctness
    const pointsForQuestion = currentQuestion.points || 100;
    const timeRatio = elapsedTime / (currentQuestion.timeLimit || DEFAULT_TIMER_DURATION);
    const timeMultiplier = 1 - timeRatio * 0.5; // Max multiplier is 1, min is 0.5
    
    let pointsEarned = 0;
    if (isAnswerCorrect) {
      pointsEarned = Math.round(pointsForQuestion * timeMultiplier);
      setScore(prevScore => prevScore + pointsEarned);
    }
    
    // Convert index to letter (A, B, C, D)
    const answerLetter = String.fromCharCode(65 + index);
    
    // Save answer to API
    try {
      // Extract playerId more carefully
      const playerInfoStr = sessionStorage.getItem('currentPlayer');
      if (playerInfoStr) {
        const playerInfoObj = JSON.parse(playerInfoStr);
        // Use the first available ID property
        const playerId = playerInfoObj.id || playerInfoObj.playerId || playerInfo.id || playerInfo.playerId;
        
        if (playerId && currentQuestion?.id) {
          console.log(`Submitting answer using player ID: ${playerId} and question ID: ${currentQuestion.id}`);
          
          // Use the service to submit the answer
          playerService.submitAnswer(
            parseInt(String(playerId)),
            parseInt(String(currentQuestion.id)),
            isAnswerCorrect,
            elapsedTime,
            answerLetter
          )
          .then(response => {
            console.log("Answer submitted successfully:", response);
          })
          .catch(error => {
            console.error("Error submitting answer:", error);
          });
        }
      }
    } catch (error) {
      console.error("Error preparing answer submission:", error);
    }
    
    // Record the answer for final stats
    setAnswersRecord(prev => [...prev, {
      questionIndex: currentQuestionIndex,
      selectedAnswer: index,
      isCorrect: isAnswerCorrect,
      timeTaken: elapsedTime,
      correctAnswer: currentQuestion.correctAnswer
    }]);
    
    // Show correct answer after a delay
    setTimeout(() => {
      setShowCorrectAnswer(true);
      
      // Wait before moving to next question
      setTimeout(() => {
        // Use a single state change to avoid rendering jumps
        setWaitingState(true);
        
        // Use a longer timeout for the waiting state
        setTimeout(() => {
          moveToNextQuestion();
        }, 2000);
      }, 2000);
    }, 1000);
  };

  const handleTimeUp = () => {
    // Handle when time runs out (player didn't select an answer)
    setIsFeedbackShown(true);
    setIsCorrect(false);
    setFeedbackColor('incorrect'); // Always incorrect when time is up
    
    try {
      // Extract playerId more carefully
      const playerInfoStr = sessionStorage.getItem('currentPlayer');
      if (playerInfoStr) {
        const playerInfoObj = JSON.parse(playerInfoStr);
        // Use the first available ID property
        const playerId = playerInfoObj.id || playerInfoObj.playerId || playerInfo.id || playerInfo.playerId;
        
        if (playerId && currentQuestion?.id) {
          console.log(`Submitting timeout answer using player ID: ${playerId} and question ID: ${currentQuestion.id}`);
          
          // Use the service to submit a timeout answer ('T' for timeout)
          playerService.submitTimeoutAnswer(
            parseInt(String(playerId)),
            parseInt(String(currentQuestion.id)),
            currentQuestion.timeLimit || DEFAULT_TIMER_DURATION
          )
          .then(response => {
            console.log("Timeout answer submitted successfully:", response);
          })
          .catch(error => {
            console.error("Error submitting timeout answer:", error);
          });
        }
      }
    } catch (error) {
      console.error("Error preparing timeout answer submission:", error);
    }
    
    // Record the timeout for final stats
    setAnswersRecord(prev => [...prev, {
      questionIndex: currentQuestionIndex,
      selectedAnswer: null,
      isCorrect: false,
      timeTaken: currentQuestion.timeLimit || DEFAULT_TIMER_DURATION,
      correctAnswer: currentQuestion.correctAnswer
    }]);
    
    // Show correct answer after a delay
    setTimeout(() => {
      setShowCorrectAnswer(true);
      
      // Wait before moving to next question
      setTimeout(() => {
        // Use a single state change to avoid rendering jumps
        setWaitingState(true);
        
        // Use a longer timeout for the waiting state
        setTimeout(() => {
          moveToNextQuestion();
        }, 2000);
      }, 2000);
    }, 1000);
  };

  const moveToNextQuestion = () => {
    // Store the current answer status before resetting states
    const wasCorrect = isCorrect;
    const questionResultShown = isFeedbackShown;
    
    // Complete cleanup function to ensure smooth transitions
    const cleanupAndMoveOn = () => {
      // Reset states for next question
      setSelectedAnswer(null);
      setSubmittedAnswer(null);
      setIsCorrect(null);
      setIsFeedbackShown(false);
      setShowCorrectAnswer(false);
      setWaitingState(false);
      setFeedbackColor(null); // Reset feedback color
    };
    
    // Only reset all states if moving to another question
    if (currentQuestionIndex + 1 < (quizData?.questions?.length || 0)) {
      // First turn off the waiting state, but keep the rest of the dialog the same
      // This prevents the dialog from flashing between states
      setWaitingState(false);
      
      // Use a small timeout to ensure smooth transition between questions
      setTimeout(() => {
        // Reset all states at once to avoid flicker
        cleanupAndMoveOn();
        
        // Then set the next question index
        setCurrentQuestionIndex(prev => prev + 1);
      }, 100);
    } else {
      // For the last question, close everything cleanly
      setWaitingState(false);
      
      // Use same cleanup approach for consistency
      setTimeout(() => {
        cleanupAndMoveOn();
        
        // Brief delay before showing results
        setTimeout(() => {
          setShowResults(true);
        }, 300);
      }, 100);
    }
  };

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
                icon={gameMode === 'team' ? <GroupsIcon /> : <PersonIcon />}
                label={gameMode === 'team' ? "Team Mode" : "Solo Mode"}
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
                {/* Only show team information if in team mode */}
                {gameMode === 'team' && playerInfo?.team && (
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
              onClick={() => setGameStarted(true)}
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

  if (showResults) {
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
          <Typography variant="h6">Loading results...</Typography>
        </Box>
      </PublicLayout>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      bgcolor: '#f5f5f5',
      position: 'relative',
      overflow: 'hidden',
      backgroundImage: 'linear-gradient(to bottom right, #46178f, #9a42fe)',
      color: 'white'
    }}>
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
                  bgcolor: showCorrectAnswer && index === currentQuestion.correctAnswer 
                    ? '#4caf50' // Always show correct answer in green when revealed
                    : showCorrectAnswer && submittedAnswer === index && index !== currentQuestion.correctAnswer
                      ? '#f44336' // Show incorrect selected answer in red
                      : OPTION_COLORS[index].bg, // Default color
                  color: 'white',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: showCorrectAnswer && index === currentQuestion.correctAnswer
                    ? '0 0 0 4px white, 0 0 0 8px #4caf50' // Highlight correct answer
                    : submittedAnswer === index && !showCorrectAnswer
                      ? `0 0 0 4px white, 0 0 0 8px ${OPTION_COLORS[index].bg}` // Highlight selected answer
                      : `0 8px 15px ${OPTION_COLORS[index].shadow}`, // Default shadow
                  '&:hover': {
                    bgcolor: showCorrectAnswer ? 
                      (index === currentQuestion.correctAnswer ? '#4caf50' : 
                       (submittedAnswer === index ? '#f44336' : OPTION_COLORS[index].hover)) : 
                      OPTION_COLORS[index].hover,
                    transform: submittedAnswer === null ? 'translateY(-3px)' : 'none',
                    boxShadow: submittedAnswer === null ? 
                      `0 12px 20px ${OPTION_COLORS[index].shadow}` : 
                      (showCorrectAnswer && index === currentQuestion.correctAnswer) ? 
                        '0 0 0 4px white, 0 0 0 8px #4caf50' : 
                        (submittedAnswer === index ? 
                          `0 0 0 4px white, 0 0 0 8px ${OPTION_COLORS[index].bg}` : 
                          `0 8px 15px ${OPTION_COLORS[index].shadow}`)
                  },
                  transition: 'all 0.2s',
                  // Apply reduced opacity to non-selected answers when showing correct answer
                  opacity: showCorrectAnswer && 
                           index !== currentQuestion.correctAnswer && 
                           index !== submittedAnswer ? 0.7 : 1
                }}
              >
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
                  {`${String.fromCharCode(65 + index)}: ${option || `Option ${String.fromCharCode(65 + index)}`}`}
                </Box>
                
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
      
      <Dialog
        open={isFeedbackShown}
        TransitionComponent={Slide}
        transitionDuration={300}
        PaperProps={{
          sx: {
            borderRadius: 4,
            boxShadow: 24,
            maxWidth: 450,
            backgroundImage: feedbackColor === 'correct'
              ? 'linear-gradient(to bottom right, #4CAF50, #8BC34A)'
              : 'linear-gradient(to bottom right, #F44336, #FF9800)',
            color: 'white',
            overflow: 'hidden'
          }
        }}
        keepMounted
        disableEscapeKeyDown
        onClose={() => {}}
      >
        <DialogContent sx={{ p: 5, textAlign: 'center' }}>
          <motion.div
            initial={feedbackAnimation.initial}
            animate={feedbackAnimation.animate}
            transition={feedbackAnimation.transition}
          >
            <Box sx={{ mb: 3 }}>
              {isCorrect === true ? (
                <CorrectIcon sx={{ fontSize: 100, color: 'white' }} />
              ) : (
                <WrongIcon sx={{ fontSize: 100, color: 'white' }} />
              )}
            </Box>
            
            <Typography variant="h4" sx={{ mb: 2, fontWeight: 'bold' }}>
              {isCorrect === true ? 'Correct!' : 'Incorrect!'}
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
              <LinearProgress 
                sx={{ 
                  mt: 2, 
                  height: 8, 
                  borderRadius: 4,
                  bgcolor: 'rgba(255,255,255,0.2)',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: 'rgba(255,255,255,0.6)'
                  }
                }} 
              />
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}

