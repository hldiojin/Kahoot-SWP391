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
  Slide,
  SlideProps
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
import { TransitionProps } from '@mui/material/transitions';

// API base URL for direct API calls
const API_BASE_URL = 'https://kahootclone-f7hkd0hwafgbfrfa.southeastasia-01.azurewebsites.net';

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

// Transition component for dialog
const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement;
  },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

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
  const [pointsEarned, setPointsEarned] = useState(0); // Add state to track points earned for current question
  
  // Add new states to track answers and questions for scoring
  const [allSubmittedAnswers, setAllSubmittedAnswers] = useState<any[]>([]);
  const [formattedQuestions, setFormattedQuestions] = useState<any[]>([]);
  const [groupMembers, setGroupMembers] = useState<any[]>([]);
  
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
        // Debug player info
        console.log('🔴 GAME PAGE LOADING');
        
        // Check for player info in storage
        const debugPlayerInfo = sessionStorage.getItem('currentPlayer');
        if (debugPlayerInfo) {
          try {
            const parsedPlayerInfo = JSON.parse(debugPlayerInfo);
            console.log('🔴 STORED PLAYER INFO:', parsedPlayerInfo);
            console.log('🔴 ID TYPE:', typeof parsedPlayerInfo.id);
            
            // Ensure ID is a number not a string
            if (typeof parsedPlayerInfo.id === 'string') {
              console.log('🔴 CONVERTING STRING ID TO NUMBER');
              parsedPlayerInfo.id = Number(parsedPlayerInfo.id);
              sessionStorage.setItem('currentPlayer', JSON.stringify(parsedPlayerInfo));
            }
          } catch (e) {
            console.error('Error parsing debug player info:', e);
          }
        } else {
          console.log('🔴 NO PLAYER INFO IN STORAGE');
        }

        if (!quizCode) {
          throw new Error('No quiz code provided');
        }

        const playerInfoStr = sessionStorage.getItem('currentPlayer');
        if (!playerInfoStr) {
          throw new Error('No player information found. Please join the game first.');
        }

        // Parse and validate player data
        let parsedPlayerInfo;
        try {
          parsedPlayerInfo = JSON.parse(playerInfoStr);
          
          // Log player info for debugging
          console.log("Player info from sessionStorage:", parsedPlayerInfo);
          
          // Ensure player has an ID and both id and playerId are the same
          if (!parsedPlayerInfo.id && !parsedPlayerInfo.playerId) {
            console.warn("Player info missing ID fields, this will cause errors");
            
            // Try to set a default ID to prevent errors
            const defaultId = Math.floor(Math.random() * 100000) + 1;
            parsedPlayerInfo.id = defaultId;
            parsedPlayerInfo.playerId = defaultId;
            
            // Update sessionStorage with the fixed player info
            sessionStorage.setItem('currentPlayer', JSON.stringify(parsedPlayerInfo));
            localStorage.setItem('currentPlayer', JSON.stringify(parsedPlayerInfo));
            console.log("Updated player info with default ID:", parsedPlayerInfo);
          } else if (parsedPlayerInfo.id && !parsedPlayerInfo.playerId) {
            // If we have id but not playerId, copy id to playerId
            parsedPlayerInfo.playerId = parsedPlayerInfo.id;
            sessionStorage.setItem('currentPlayer', JSON.stringify(parsedPlayerInfo));
            localStorage.setItem('currentPlayer', JSON.stringify(parsedPlayerInfo));
            console.log("Added missing playerId field:", parsedPlayerInfo);
          } else if (!parsedPlayerInfo.id && parsedPlayerInfo.playerId) {
            // If we have playerId but not id, copy playerId to id
            parsedPlayerInfo.id = parsedPlayerInfo.playerId;
            sessionStorage.setItem('currentPlayer', JSON.stringify(parsedPlayerInfo));
            localStorage.setItem('currentPlayer', JSON.stringify(parsedPlayerInfo));
            console.log("Added missing id field:", parsedPlayerInfo);
          } else if (parsedPlayerInfo.id !== parsedPlayerInfo.playerId) {
            // If both exist but differ, use id value for both
            parsedPlayerInfo.playerId = parsedPlayerInfo.id;
            sessionStorage.setItem('currentPlayer', JSON.stringify(parsedPlayerInfo));
            localStorage.setItem('currentPlayer', JSON.stringify(parsedPlayerInfo));
            console.log("Synchronized id and playerId fields:", parsedPlayerInfo);
          }
          
          setPlayerInfo(parsedPlayerInfo);
        } catch (parseError) {
          console.error("Error parsing player info:", parseError);
          
          // Create default player info with a valid ID
          const defaultPlayerInfo = {
            id: Math.floor(Math.random() * 1000000) + 1, // Use a smaller, random ID that will fit in 32-bit int
            playerId: Math.floor(Math.random() * 1000000) + 1, // Use a smaller, random ID
            name: "Player",
            avatar: "dog",
            score: 0
          };
          
          console.log("Using default player info:", defaultPlayerInfo);
          sessionStorage.setItem('currentPlayer', JSON.stringify(defaultPlayerInfo));
          localStorage.setItem('currentPlayer', JSON.stringify(defaultPlayerInfo));
          const tempPlayerInfo = defaultPlayerInfo;
          setPlayerInfo(tempPlayerInfo);
        }

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
              
              // Format questions for the UI
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
                
                // Check if this is a true/false question
                const isTrueFalse = q.type === 'true-false' || 
                  (q.optionA === 'True' && q.optionB === 'False' && (!q.optionC || q.optionC.trim() === '') && (!q.optionD || q.optionD.trim() === ''));
                
                return {
                  id: questionId,
                  question: q.text || 'Question',
                  options: options,
                  correctAnswer: correctAnswerIndex,
                  timeLimit: q.timeLimit || DEFAULT_TIMER_DURATION,
                  points: q.score || 100,
                  questionType: isTrueFalse ? 'true-false' : 'multiple-choice'
                };
              });
              
              // Also store original API question format for score calculation
              setFormattedQuestions(sortedQuestions);
              
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

              // If team mode, try to get group members
              if (currentGameMode === 'team' && playerData.team) {
                try {
                  // Try to find group members
                  const groupResponse = await fetch(
                    `https://kahootclone-f7hkd0hwafgbfrfa.southeastasia-01.azurewebsites.net/api/Group/name/${encodeURIComponent(playerData.team)}`
                  );
                  
                  if (groupResponse.ok) {
                    const groupData = await groupResponse.json();
                    console.log("Group data:", groupData);
                    
                    if (groupData && groupData.data) {
                      // Store group members for team scoring
                      const members = groupData.data.members || [];
                      setGroupMembers(members);
                    }
                  }
                } catch (groupError) {
                  console.error("Error fetching group information:", groupError);
                }
              }
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

  // Add a new useEffect to calculate scores when the game is over
  useEffect(() => {
    if (showResults && allSubmittedAnswers.length > 0) {
      const calculateFinalScore = async () => {
        try {
          const playerInfoStr = sessionStorage.getItem('currentPlayer');
          const playerInfo = playerInfoStr ? JSON.parse(playerInfoStr) : null;
          
          if (!playerInfo || !playerInfo.id) {
            console.error("Player info not available for score calculation");
            return;
          }
          
          console.log("Calculating final score for player:", playerInfo.id);
          
          // Get stats for UI
          const stats = calculateStats();
          
          if (gameMode === 'solo') {
            // For solo mode, calculate each answer's score
            for (const answer of allSubmittedAnswers) {
              // Find the corresponding question
              const question = formattedQuestions.find(q => q.id === answer.questionId);
              
              if (question) {
                try {
                  // Calculate solo score through API
                  await playerService.calculateSoloScore(
                    answer,
                    question
                  );
                } catch (error) {
                  console.error("Error calculating solo score for answer:", error);
                }
              }
            }
          } else if (gameMode === 'team' && groupMembers.length > 0) {
            // For team mode, calculate team score
            try {
              // Format group members for the API
              const formattedGroupMembers = groupMembers.map(member => ({
                groupId: member.groupId,
                playerId: member.playerId,
                rank: member.rank || 0,
                totalScore: member.totalScore || 0,
                joinedAt: member.joinedAt || new Date().toISOString(),
                status: member.status || "Active"
              }));
              
              // Calculate group score
              await playerService.calculateGroupScore(
                formattedGroupMembers,
                allSubmittedAnswers,
                formattedQuestions
              );
            } catch (error) {
              console.error("Error calculating team score:", error);
            }
          }
          
          // Create game results object
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
          
          // Store player results
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
              group: playerInfo?.team || null,
              id: playerInfo?.id || 0
            }];
            
            console.log("Saving game results:", playerResultData);
            
            // Store everything in both localStorage and sessionStorage for redundancy
            
            // Clear previous results
            sessionStorage.removeItem('gameResults');
            localStorage.removeItem('gameResults');
            
            // Store results data
            sessionStorage.setItem('gameResults', JSON.stringify(playerResultData));
            localStorage.setItem('gameResults', JSON.stringify(playerResultData));
            
            // Store complete game data
            sessionStorage.setItem('completeGameData', JSON.stringify(gameResults));
            localStorage.setItem('completeGameData', JSON.stringify(gameResults));
            
            // Store questions and answers for reference
            sessionStorage.setItem('playerAnswers', JSON.stringify(allSubmittedAnswers));
            localStorage.setItem('playerAnswers', JSON.stringify(allSubmittedAnswers));
            
            // Store current quiz data
            if (quizData) {
              sessionStorage.setItem('currentQuiz', JSON.stringify(quizData));
              localStorage.setItem('currentQuiz', JSON.stringify(quizData));
            }
            
            // Store player info
            if (playerInfo) {
              sessionStorage.setItem('currentPlayer', JSON.stringify(playerInfo));
              localStorage.setItem('currentPlayer', JSON.stringify(playerInfo));
            }
            
            // Store formatted questions for score calculation
            sessionStorage.setItem('formattedQuestions', JSON.stringify(formattedQuestions));
            localStorage.setItem('formattedQuestions', JSON.stringify(formattedQuestions));
            
            // Redirect to results page
            setTimeout(() => {
              router.push('/game-results');
            }, 500);
          } catch (error) {
            console.error("Error saving game results:", error);
            router.push('/game-results');
          }
        } catch (calcError) {
          console.error("Error calculating final score:", calcError);
          
          // Even if score calculation fails, still try to redirect to results page
          setTimeout(() => {
            router.push('/game-results');
          }, 500);
        }
      };
      
      calculateFinalScore();
    }
  }, [showResults, allSubmittedAnswers, formattedQuestions, gameMode, groupMembers, quizData, router]);

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

  // Add a direct API call function to use exact player ID (bypassing any service layers)
  const submitAnswerDirectly = (exactPlayerId: number, questionId: number, isCorrect: boolean, responseTime: number, answer: string) => {
    try {
      // Ensure ID is actually a number
      const numericPlayerId = Number(exactPlayerId);
      
      console.log(`▶️ DIRECT SUBMIT: Using player ID ${numericPlayerId} for question ${questionId}`);
      
      // Create payload with the exact player ID (no transformations)
      const payload = {
        id: 0,
        playerId: numericPlayerId,
        questionId: questionId,
        answeredAt: new Date().toISOString(),
        isCorrect: isCorrect,
        responseTime: responseTime,
        answer: answer
      };
      
      console.log("▶️ DIRECT SUBMIT PAYLOAD:", payload);
      
      // Direct API call
      return axios.post(
        `${API_BASE_URL}/api/PlayerAnswer`,
        { playerAnswerDto: payload },
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      ).then(response => {
        console.log("✅ DIRECT SUBMIT SUCCESS:", response.data);
        return response.data;
      }).catch(error => {
        console.error("❌ DIRECT SUBMIT ERROR:", error);
        if (error.response) {
          console.error("❌ API ERROR:", error.response.data);
        }
        throw error;
      });
    } catch (error) {
      console.error("❌ DIRECT SUBMIT EXCEPTION:", error);
      throw error;
    }
  };

  const handleSelectAnswer = (index: number) => {
    if (submittedAnswer !== null || isFeedbackShown) return;
    
    // Set all the initial state at once to avoid flicker
    const isAnswerCorrect = index === currentQuestion.correctAnswer;
    setSelectedAnswer(index);
    setSubmittedAnswer(index);
    setIsCorrect(isAnswerCorrect);
    setFeedbackColor(isCorrect ? 'correct' : 'incorrect');
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
    
    let currentPointsEarned = 0;
    if (isAnswerCorrect) {
      // Calculate points with time bonus
      currentPointsEarned = Math.round(pointsForQuestion * timeMultiplier);
      
      // Save points earned for this specific question (for display in dialog)
      setPointsEarned(currentPointsEarned);
      
      // Update total score
      setScore(prevScore => prevScore + currentPointsEarned);
    } else {
      // No points for incorrect answers
      setPointsEarned(0);
    }
    
    // Record the answer for final stats
    setAnswersRecord(prev => [...prev, {
      questionIndex: currentQuestionIndex,
      selectedAnswer: index,
      isCorrect: isAnswerCorrect,
      timeTaken: elapsedTime,
      correctAnswer: currentQuestion.correctAnswer,
      points: currentPointsEarned,
      timeBonus: isAnswerCorrect ? Math.round(currentPointsEarned * (timeMultiplier - 0.5) / 0.5) : 0
    }]);
    
    // Convert index to letter (A, B, C, D)
    const answerLetter = String.fromCharCode(65 + index);
    
    // DIRECT ID FIX: Use the exact player ID from storage to submit the answer
    try {
      // Log player ID debug info
      console.log("🔄 Current player info for submission:", playerInfo);
      
      // Extract the exact ID directly from playerInfo
      // This ID should match what was returned when player was created
      const exactPlayerId = playerInfo?.id;
      
      if (!exactPlayerId) {
        console.error("⛔ No player ID found in playerInfo!");
        return;
      }
      
      console.log(`🔄 Using exact player ID for submission: ${exactPlayerId}`);
      
      // Record submission locally for score calculation
      const answerData = {
        id: 0,
        playerId: exactPlayerId,
        questionId: currentQuestion?.id,
        answeredAt: new Date().toISOString(),
        isCorrect: isAnswerCorrect,
        responseTime: elapsedTime,
        answer: answerLetter
      };
      
      setAllSubmittedAnswers(prev => {
        const newAnswers = [...prev, answerData];
        sessionStorage.setItem('playerAnswers', JSON.stringify(newAnswers));
        return newAnswers;
      });
      
      // COMPLETELY BYPASS the regular service and make a direct API call
      submitAnswerDirectly(
        exactPlayerId,
        currentQuestion?.id,
        isAnswerCorrect,
        elapsedTime,
        answerLetter
      ).then(() => {
        console.log("✅ Answer submitted successfully using direct method");
      }).catch((error) => {
        console.error("❌ Error with direct submission:", error);
      });
    } catch (error) {
      console.error("❌ Error in answer submission:", error);
    }
    
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
    setPointsEarned(0); // No points when time is up
    
    // Calculate the full time limit
    const timeLimit = currentQuestion.timeLimit || DEFAULT_TIMER_DURATION;
    
    // DIRECT ID FIX: Use the exact player ID from storage to submit the timeout
    try {
      // Log player ID debug info
      console.log("🔄 Current player info for timeout:", playerInfo);
      
      // Extract the exact ID directly from playerInfo
      const exactPlayerId = playerInfo?.id;
      
      if (!exactPlayerId) {
        console.error("⛔ No player ID found in playerInfo for timeout!");
        return;
      }
      
      const questionId = currentQuestion?.id;
      if (!questionId) {
        console.error("⛔ No question ID found for timeout!");
        return;
      }
      
      console.log(`🔄 Using exact player ID for timeout: ${exactPlayerId}`);
      
      // Record timeout locally for score calculation
      const timeoutData = {
        id: 0,
        playerId: exactPlayerId,
        questionId: questionId,
        answeredAt: new Date().toISOString(),
        isCorrect: false,
        responseTime: timeLimit,
        answer: 'T' // 'T' for timeout
      };
      
      setAllSubmittedAnswers(prev => {
        const newAnswers = [...prev, timeoutData];
        sessionStorage.setItem('playerAnswers', JSON.stringify(newAnswers));
        return newAnswers;
      });
      
      // COMPLETELY BYPASS the regular service and make a direct API call
      submitAnswerDirectly(
        exactPlayerId,
        questionId,
        false, // always false for timeout
        timeLimit,
        'T' // 'T' for timeout
      ).then(() => {
        console.log("✅ Timeout submitted successfully using direct method");
      }).catch((error) => {
        console.error("❌ Error with direct timeout submission:", error);
      });
    } catch (error) {
      console.error("❌ Error in timeout submission:", error);
    }
    
    // Record the timeout for final stats
    setAnswersRecord(prev => [...prev, {
      questionIndex: currentQuestionIndex,
      selectedAnswer: null,
      isCorrect: false,
      timeTaken: timeLimit,
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
    // First, close the dialog completely to avoid state flashing
    // This ensures dialog is fully hidden before changing any other states
    setIsFeedbackShown(false);
    
    // Wait for dialog animation to complete before changing any other states
    setTimeout(() => {
      // Only proceed to next question if there are more questions
      if (currentQuestionIndex + 1 < (quizData?.questions?.length || 0)) {
        // Reset all states in one go to avoid UI flicker
        setSelectedAnswer(null);
        setSubmittedAnswer(null);
        setIsCorrect(null);
        setShowCorrectAnswer(false);
        setWaitingState(false);
        setFeedbackColor(null);
        setPointsEarned(0);
        
        // Move to next question
        setCurrentQuestionIndex(prev => prev + 1);
      } else {
        // For the last question, reset states and then show results
        setSelectedAnswer(null);
        setSubmittedAnswer(null);
        setIsCorrect(null);
        setShowCorrectAnswer(false);
        setWaitingState(false);
        setFeedbackColor(null);
        setPointsEarned(0);
        
        // Brief delay before showing results
        setTimeout(() => {
          setShowResults(true);
        }, 300);
      }
    }, 300); // Wait for dialog closing animation to complete
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
        
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: currentQuestion?.questionType === 'true-false' 
            ? { xs: '1fr' }  // Full width for true/false
            : { xs: '1fr', md: '1fr 1fr' },  // Two columns for multiple choice
          gap: 3 
        }}>
          {currentQuestion?.options?.map((option: string, index: number) => {
            // Skip options C and D for true-false questions
            if (currentQuestion.questionType === 'true-false' && index > 1) {
              return null;
            }
            
            return (
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
                    {currentQuestion.questionType === 'true-false' 
                      ? option  // Just show 'True' or 'False' for true/false questions
                      : `${String.fromCharCode(65 + index)}: ${option || `Option ${String.fromCharCode(65 + index)}`}`
                    }
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
            );
          })}
        </Box>
      </Container>
      
      <Dialog
        open={isFeedbackShown}
        TransitionComponent={Transition}
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
        // Add exit animation handling to ensure proper cleanup
        TransitionProps={{
          onExited: () => {
            // This ensures state isn't changed until dialog is fully closed
            console.log("Dialog exit animation completed");
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
                +{pointsEarned} points
              </Box>
              
              {/* Show time bonus information */}
              {pointsEarned > 0 && (
                <Typography variant="body2" sx={{ 
                  mt: 1, 
                  color: 'rgba(255,255,255,0.9)',
                  fontStyle: 'italic'
                }}>
                  Includes time bonus for quick answer!
                </Typography>
              )}
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

