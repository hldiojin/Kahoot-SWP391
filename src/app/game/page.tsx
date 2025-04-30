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

        try {
          const quizResponse = await fetch(
            `https://kahootclone-f7hkd0hwafgbfrfa.southeastasia-01.azurewebsites.net/api/Quiz/QuizCode/${quizCode}`
          );
          const quizResponseData = await quizResponse.json();
          
          if (quizResponseData && quizResponseData.status === 200 && quizResponseData.data) {
            const quizInfo = quizResponseData.data;
            
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
              
              const completeQuizData = {
                ...quizInfo,
                questions: formattedQuestions
              };
              
              setQuizData(completeQuizData);
            } else {
              throw new Error('No questions found for this quiz.');
            }
          } else {
            throw new Error('Quiz not found. Please check the quiz code.');
          }
        } catch (apiError) {
          throw new Error('Failed to load quiz data. Please check the quiz code.');
        }

        setLoading(false);
      } catch (error) {
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
      
      sessionStorage.setItem('gameResults', JSON.stringify([{
        name: playerInfo?.name || 'Player',
        score: stats.totalScore,
        correctAnswers: stats.correctAnswers,
        totalQuestions: stats.totalQuestions,
        timeBonus: Math.floor(stats.totalScore / 10),
        averageAnswerTime: answersRecord.reduce((sum, a) => sum + a.timeTaken, 0) / answersRecord.length,
        avatar: playerInfo?.avatar || 'dog',
        group: playerInfo?.team || null
      }]));
      
      router.push('/game-results');
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
    
    setSelectedAnswer(index);
    setSubmittedAnswer(index);
    
    // Calculate elapsed time
    const elapsedTime = Math.min(
      (Date.now() - questionStartTime) / 1000,
      currentQuestion.timeLimit || DEFAULT_TIMER_DURATION
    );
    setAnswerTime(parseFloat(elapsedTime.toFixed(1)));
    
    // Check if answer is correct
    const isAnswerCorrect = index === currentQuestion.correctAnswer;
    setIsCorrect(isAnswerCorrect);
    
    // Calculate points based on speed and correctness
    const pointsForQuestion = currentQuestion.points || 100;
    const timeRatio = elapsedTime / (currentQuestion.timeLimit || DEFAULT_TIMER_DURATION);
    const timeMultiplier = 1 - timeRatio * 0.5; // Max multiplier is 1, min is 0.5
    
    let pointsEarned = 0;
    if (isAnswerCorrect) {
      pointsEarned = Math.round(pointsForQuestion * timeMultiplier);
      setScore(prevScore => prevScore + pointsEarned);
    }
    
    // Show feedback UI
    setIsFeedbackShown(true);
    
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
        setWaitingState(true);
        // Simulate others answering
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
        setWaitingState(true);
        setTimeout(() => {
          moveToNextQuestion();
        }, 2000);
      }, 2000);
    }, 1000);
  };

  const moveToNextQuestion = () => {
    // Reset states for next question
    setSelectedAnswer(null);
    setSubmittedAnswer(null);
    setIsCorrect(null);
    setIsFeedbackShown(false);
    setShowCorrectAnswer(false);
    setWaitingState(false);
    
    // Move to next question or end quiz
    if (currentQuestionIndex + 1 < (quizData?.questions?.length || 0)) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setShowResults(true);
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
                  ...(submittedAnswer === index && {
                    boxShadow: `0 0 0 4px white, 0 0 0 8px ${OPTION_COLORS[index].bg}`,
                  }),
                  ...(showCorrectAnswer && {
                    bgcolor: index === currentQuestion.correctAnswer 
                      ? '#4caf50'
                      : submittedAnswer === index ? '#f44336' : OPTION_COLORS[index].bg,
                    opacity: index !== currentQuestion.correctAnswer && index !== submittedAnswer ? 0.7 : 1
                  })
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
