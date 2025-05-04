'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Container,
  Paper,
  Button,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  Chip,
  Tab,
  Tabs,
  CircularProgress,
  Collapse,
  Stack,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  ToggleButtonGroup,
  ToggleButton,
  Card,
  CardContent,
  CardHeader,
  Alert,
  Snackbar
} from '@mui/material';
import { 
  EmojiEvents as TrophyIcon,
  ArrowBack as ArrowBackIcon,
  Home as HomeIcon,
  Groups as GroupsIcon,
  Person as PersonIcon,
  Refresh as RefreshIcon,
  ExpandLess,
  ExpandMore,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Feedback as FeedbackIcon,
  Calculate as CalculateIcon
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import PublicLayout from '../components/PublicLayout';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import ReactConfetti from 'react-confetti';
import playerService from '@/services/playerService';
import axios from 'axios';

const API_BASE_URL = 'https://kahootclone-f7hkd0hwafgbfrfa.southeastasia-01.azurewebsites.net';

const Animal = dynamic(() => import('react-animals'), { ssr: false });

interface PlayerScore {
  name: string;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  timeBonus?: number;
  averageAnswerTime?: number;
  avatar?: string;
  group?: string; // Add group property
  id?: number; // Add id property for player identification
}

interface GroupScore {
  name: string;
  score: number;
  memberCount: number;
  members: PlayerScore[];
}

// Add this interface for player answers
interface PlayerAnswer {
  id: number;
  playerId: number;
  questionId: number;
  answeredAt: string;
  isCorrect: boolean;
  responseTime: number; 
  answer: string; // A, B, C, D, or T for timeout
}

// Array of valid animal avatars and colors
const animalAvatars = [
  { id: 'alligator', name: 'alligator', color: 'orange' },
  { id: 'elephant', name: 'elephant', color: 'teal' },
  { id: 'dolphin', name: 'dolphin', color: 'blue' },
  { id: 'turtle', name: 'turtle', color: 'green' },
  { id: 'penguin', name: 'penguin', color: 'purple' },
  { id: 'beaver', name: 'beaver', color: 'red' },
  { id: 'tiger', name: 'tiger', color: 'yellow' },
  { id: 'fox', name: 'fox', color: 'orange' }
];

// Array of predefined group names for demo
const groupNames = ["Team Awesome", "Brainiacs", "Quiz Masters", "Knowledge Seekers"];

// Utility function to calculate group scores from player scores
const calculateGroupScores = (playerResults: PlayerScore[]): GroupScore[] => {
  // Group players by group name
  const groupMap = new Map<string, PlayerScore[]>();
  
  // Assign players to random groups if not already assigned
  const playersWithGroups = playerResults.map(player => {
    if (!player.group) {
      const randomGroup = groupNames[Math.floor(Math.random() * groupNames.length)];
      return { ...player, group: randomGroup };
    }
    return player;
  });
  
  // Group players
  playersWithGroups.forEach(player => {
    const group = player.group || "Ungrouped";
    if (!groupMap.has(group)) {
      groupMap.set(group, []);
    }
    groupMap.get(group)!.push(player);
  });
  
  // Calculate scores for each group
  const groupScores: GroupScore[] = [];
  groupMap.forEach((members, name) => {
    const totalScore = members.reduce((sum, player) => sum + player.score, 0);
    groupScores.push({
      name,
      score: totalScore,
      memberCount: members.length,
      members
    });
  });
  
  // Sort groups by score (highest first)
  return groupScores.sort((a, b) => b.score - a.score);
};

// Function to get random avatar if needed
const getRandomAvatar = () => {
  return animalAvatars[Math.floor(Math.random() * animalAvatars.length)].id;
};

// Helper function to get animal avatar info
const getAnimalAvatar = (avatarId: string) => {
  return animalAvatars.find(a => a.id === avatarId) || animalAvatars[0];
};

// Helper function to normalize API response data
const normalizeApiResponse = (responseData: any): any[] => {
  // Check if the response follows the { status, data: [...] } pattern
  if (responseData?.status && Array.isArray(responseData.data)) {
    return responseData.data;
  }
  
  // Check if the response is a direct array
  if (Array.isArray(responseData)) {
    return responseData;
  }
  
  // Check if the response has a data property that is an array
  if (responseData?.data && Array.isArray(responseData.data)) {
    return responseData.data;
  }
  
  // Return empty array if we can't determine the structure
  console.warn("Could not normalize API response:", responseData);
  return [];
};

// Add this helper function near the top of the file, after the other utility functions
const fetchPlayerById = async (playerId: number): Promise<any> => {
  try {
    const response = await fetch(
      `https://kahootclone-f7hkd0hwafgbfrfa.southeastasia-01.azurewebsites.net/api/Player/${playerId}`
    );
    
    if (!response.ok) {
      console.warn(`Error fetching player ${playerId}: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    
    if (data && data.status === 200 && data.data) {
      return data.data;
    }
    
    return null;
  } catch (error) {
    console.error(`Error fetching player ${playerId}:`, error);
    return null;
  }
};

export default function GameResultsPage() {
  const router = useRouter();
  const [playerResults, setPlayerResults] = useState<PlayerScore[]>([]);
  const [groupResults, setGroupResults] = useState<GroupScore[]>([]);
  const [playerAnswers, setPlayerAnswers] = useState<PlayerAnswer[]>([]);
  const [answersLoading, setAnswersLoading] = useState(false);
  const [gameTitle, setGameTitle] = useState('');
  const [currentPlayer, setCurrentPlayer] = useState('');
  const [loading, setLoading] = useState(true);
  const [playerAvatar, setPlayerAvatar] = useState('alligator');
  const [showConfetti, setShowConfetti] = useState(true);
  const [viewMode, setViewMode] = useState<'player' | 'group'>('player');
  const [gameMode, setGameMode] = useState<'solo' | 'team'>('solo');
  const [windowDimensions, setWindowDimensions] = useState({ width: 0, height: 0 });
  const [playerInfo, setPlayerInfo] = useState<any>(null);
  const [currentQuizData, setCurrentQuizData] = useState<any>(null);
  const [showAnswerDetails, setShowAnswerDetails] = useState(false);
  const [playerAnswerMap, setPlayerAnswerMap] = useState<{[questionId: string]: {[playerId: string]: PlayerAnswer}}>({});
  const [questionMap, setQuestionMap] = useState<{[questionId: string]: any}>({});
  const [showResults, setShowResults] = useState(false);
  const [scoresFinalized, setScoresFinalized] = useState(false);
  const [calculatingScores, setCalculatingScores] = useState(false);
  const [scoreMessage, setScoreMessage] = useState<{show: boolean, message: string, severity: 'success' | 'error' | 'info'}>({
    show: false,
    message: '',
    severity: 'info'
  });

  // Load data and calculate scores
  useEffect(() => {
    // Set window dimensions for confetti
    setWindowDimensions({
      width: window.innerWidth,
      height: window.innerHeight
    });

    const loadDataAndCalculateScores = async () => {
      try {
        console.log("Loading game results data...");
        
        // Try to get data from both sessionStorage and localStorage for redundancy
        const storedResults = sessionStorage.getItem('gameResults') || localStorage.getItem('gameResults');
        const quizData = sessionStorage.getItem('currentQuiz') || localStorage.getItem('currentQuiz') || 
                         sessionStorage.getItem('quizPreviewData') || localStorage.getItem('quizPreviewData');
        const playerInfoData = sessionStorage.getItem('currentPlayer') || localStorage.getItem('currentPlayer');
        const storedAnswers = sessionStorage.getItem('playerAnswers') || localStorage.getItem('playerAnswers');
        const formattedQuestionsData = sessionStorage.getItem('formattedQuestions') || localStorage.getItem('formattedQuestions');
        
        console.log("Data found:", {
          results: storedResults ? "✓" : "✗",
          quiz: quizData ? "✓" : "✗",
          player: playerInfoData ? "✓" : "✗",
          answers: storedAnswers ? "✓" : "✗",
          formattedQuestions: formattedQuestionsData ? "✓" : "✗"
        });
        
        // First try to determine game mode
        const quizCode = sessionStorage.getItem('quizCode') || localStorage.getItem('quizCode');
        let detectedGameMode: 'solo' | 'team' = 'solo';
        
        // Parse player info
        let currentPlayerData = null;
        if (playerInfoData) {
          try {
            const parsedPlayerInfo = JSON.parse(playerInfoData);
            setPlayerInfo(parsedPlayerInfo);
            currentPlayerData = parsedPlayerInfo;
            
            // Detect team mode from player info
            if (parsedPlayerInfo.team) {
              detectedGameMode = 'team';
              console.log("Team mode detected from player team:", parsedPlayerInfo.team);
            }
            
            // Save to localStorage for persistence
            localStorage.setItem('currentPlayer', playerInfoData);
          } catch (err) {
            console.error("Error parsing player info:", err);
          }
        }
        
        // Set game mode in state
        console.log(`Final determined game mode: ${detectedGameMode}`);
        setGameMode(detectedGameMode);
        
        // Set appropriate view mode
        if (detectedGameMode === 'team') {
          setViewMode('group');
        } else {
          setViewMode('player');
        }
        
        // Parse quiz data
        let parsedQuizData = null;
        if (quizData) {
          try {
            parsedQuizData = JSON.parse(quizData);
            setCurrentQuizData(parsedQuizData);
            
            // Save to localStorage for persistence
            localStorage.setItem('currentQuiz', quizData);
          } catch (err) {
            console.error("Error parsing quiz data:", err);
          }
        }
        
        // Parse player results
        if (storedResults) {
          try {
            const results = JSON.parse(storedResults);
            if (Array.isArray(results)) {
              setPlayerResults(results);
              
              // Set game title and current player if available
              if (parsedQuizData) {
                setGameTitle(parsedQuizData.title || "Quiz Game");
              }
              if (currentPlayerData) {
                setCurrentPlayer(currentPlayerData.name || '');
              }
            }
          } catch (err) {
            console.error("Error parsing stored results:", err);
          }
        }
        
        // Parse answers
        let parsedAnswers = [];
        if (storedAnswers) {
          try {
            parsedAnswers = JSON.parse(storedAnswers);
            if (Array.isArray(parsedAnswers)) {
              setPlayerAnswers(parsedAnswers);
              console.log(`Loaded ${parsedAnswers.length} player answers`);
            }
          } catch (err) {
            console.error("Error parsing stored answers:", err);
          }
        }
        
        // Only proceed with score calculation if we have all required data
        if (parsedQuizData && currentPlayerData && parsedAnswers.length > 0) {
          // Try to use pre-formatted questions if available
          let formattedQuestions = [];
          if (formattedQuestionsData) {
            try {
              formattedQuestions = JSON.parse(formattedQuestionsData);
              console.log(`Using ${formattedQuestions.length} pre-formatted questions`);
            } catch (err) {
              console.error("Error parsing formatted questions:", err);
            }
          }
          
          if (formattedQuestions.length > 0) {
            console.log("Using pre-formatted questions for calculation");
            parsedQuizData.questions = formattedQuestions;
          }
          
          // Calculate scores
          await calculateFinalScores(parsedQuizData, currentPlayerData, parsedAnswers, detectedGameMode);
        } else {
          console.log("Missing data for score calculation:", {
            quiz: !!parsedQuizData,
            player: !!currentPlayerData,
            answers: parsedAnswers.length
          });
        }
        
      } catch (error) {
        console.error('Error in loadDataAndCalculateScores:', error);
        setScoreMessage({
          show: true,
          message: 'Error loading game results. Please try again.',
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadDataAndCalculateScores();
  }, []);
  
  // Function to calculate final scores
  const calculateFinalScores = async (
    quizData: any, 
    playerData: any, 
    answers: any[], 
    mode: 'solo' | 'team'
  ) => {
    try {
      setCalculatingScores(true);
      setScoreMessage({
        show: true,
        message: 'Calculating final scores...',
        severity: 'info'
      });
      
      console.log(`Starting score calculation for ${mode} mode...`);
      console.log('Player data:', playerData);
      console.log('Quiz data:', quizData);
      console.log('Answers:', answers.length);
      
      // Make sure we have the necessary data
      if (!answers.length) {
        console.error("No player answers available for score calculation");
        setScoreMessage({
          show: true,
          message: 'No answers found to calculate score',
          severity: 'error'
        });
        setCalculatingScores(false);
        return;
      }
      
      // Fetch questions if not already available
      let questions = quizData.questions || [];
      if (questions.length === 0) {
        try {
          console.log(`Fetching questions for quiz ${quizData.id}...`);
          const response = await axios.get(
            `${API_BASE_URL}/api/questions/quiz/${quizData.id}`,
            { headers: { 'Accept': 'application/json' } }
          );
          
          if (response.data && response.data.data) {
            questions = response.data.data;
            console.log(`Retrieved ${questions.length} questions`);
          }
        } catch (err) {
          console.error("Error fetching questions:", err);
        }
      }
      
      if (questions.length === 0) {
        console.error("No questions available for score calculation");
        setScoreMessage({
          show: true,
          message: 'Could not calculate scores: no questions found',
          severity: 'error'
        });
        setCalculatingScores(false);
        return;
      }
      
      // Calculate scores based on game mode
      if (mode === 'team' && playerData.team) {
        // Team mode calculation
        console.log(`Calculating scores for team ${playerData.team}...`);
        
        try {
          // Get team/group data
          const sessionId = quizData.sessionId || quizData.id;
          let groupResponse;
          try {
            console.log(`Fetching group data for session ${sessionId}...`);
            groupResponse = await axios.get(
              `${API_BASE_URL}/api/Group/session/${sessionId}`
            );
          } catch (err) {
            console.error("Error fetching group data:", err);
          }
          
          let groupMembers = [];
          if (groupResponse && groupResponse.data && groupResponse.data.data) {
            groupMembers = groupResponse.data.data;
            console.log(`Loaded ${groupMembers.length} group members`);
          } else {
            // Try to use locally stored group members if available
            const storedGroupMembers = sessionStorage.getItem('groupMembers') || localStorage.getItem('groupMembers');
            if (storedGroupMembers) {
              try {
                groupMembers = JSON.parse(storedGroupMembers);
                console.log(`Loaded ${groupMembers.length} group members from storage`);
              } catch (err) {
                console.error("Error parsing stored group members:", err);
              }
            }
          }
          
          if (groupMembers.length > 0) {
            console.log("Formatting group members for API...");
            
            // Format group members for the API
            const formattedGroupMembers = groupMembers.map((member: any) => ({
              groupId: member.groupId || member.id,
              playerId: member.playerId || playerData.id,
              rank: member.rank || 0,
              totalScore: member.totalScore || 0,
              joinedAt: member.joinedAt || new Date().toISOString(),
              status: member.status || "Active"
            }));
            
            // Format questions for the API
            const formattedQuestions = questions.map((q: any) => ({
              id: q.id,
              quizId: q.quizId || quizData.id,
              text: q.text || "",
              type: q.type || "multiple-choice",
              optionA: q.optionA || "",
              optionB: q.optionB || "",
              optionC: q.optionC || "",
              optionD: q.optionD || "",
              isCorrect: q.isCorrect || "A",
              score: q.score || 100,
              flag: q.flag || false,
              timeLimit: q.timeLimit || 20,
              arrange: q.arrange || 0
            }));
            
            // Format answers to ensure all required fields
            const formattedAnswers = answers.map(a => ({
              id: a.id || 0,
              playerId: a.playerId || parseInt(playerData.id),
              questionId: a.questionId,
              answeredAt: a.answeredAt || new Date().toISOString(),
              isCorrect: a.isCorrect,
              responseTime: a.responseTime,
              answer: a.answer || "T"
            }));
            
            // Call the API with properly formatted data
            console.log("Calling GroupScore API...");
            console.log("Group members:", formattedGroupMembers.length);
            console.log("Player answers:", formattedAnswers.length);
            console.log("Questions:", formattedQuestions.length);
            
            try {
              // Use playerService for better error handling
              const scoreResponse = await playerService.calculateGroupScore(
                formattedGroupMembers,
                formattedAnswers,
                formattedQuestions
              );
              
              console.log("Group score response:", scoreResponse);
              setScoreMessage({
                show: true,
                message: 'Team scores calculated successfully!',
                severity: 'success'
              });
              setScoresFinalized(true);
            } catch (apiError) {
              console.error("API error calculating team scores:", apiError);
              
              // Fallback to direct API call if service fails
              try {
                const scoreResponse = await axios.post(
                  `${API_BASE_URL}/api/PlayerAnswer/GroupScore`,
                  {
                    GroupMembers: formattedGroupMembers,
                    PlayerAnswers: formattedAnswers,
                    Questions: formattedQuestions
                  },
                  { 
                    headers: { 
                      'Content-Type': 'application/json',
                      'Accept': 'application/json'
                    }
                  }
                );
                
                console.log("Direct API group score response:", scoreResponse.data);
                setScoreMessage({
                  show: true,
                  message: 'Team scores calculated via direct API!',
                  severity: 'success'
                });
                setScoresFinalized(true);
              } catch (directApiError) {
                console.error("Direct API call also failed:", directApiError);
                setScoreMessage({
                  show: true,
                  message: 'Failed to calculate team scores after multiple attempts',
                  severity: 'error'
                });
              }
            }
          } else {
            console.error("No team members found");
            setScoreMessage({
              show: true,
              message: 'Could not calculate team scores: no team members found',
              severity: 'error'
            });
          }
        } catch (err) {
          console.error("Error in team score calculation:", err);
          setScoreMessage({
            show: true,
            message: 'Error calculating team scores',
            severity: 'error'
          });
        }
      } else {
        // Solo mode calculation
        console.log("Calculating solo scores...");
        
        let successCount = 0;
        let failCount = 0;
        
        // Calculate scores for each answer individually
        for (const answer of answers) {
          // Find the matching question
          const question = questions.find((q: any) => q.id === answer.questionId);
          
          if (question) {
            try {
              // Format question for the API
              const formattedQuestion = {
                id: question.id,
                quizId: question.quizId || quizData.id,
                text: question.text || "",
                type: question.type || "multiple-choice",
                optionA: question.optionA || "",
                optionB: question.optionB || "",
                optionC: question.optionC || "",
                optionD: question.optionD || "",
                isCorrect: question.isCorrect || "A",
                score: question.score || 100,
                flag: question.flag || false,
                timeLimit: question.timeLimit || 20,
                arrange: question.arrange || 0
              };
              
              // Format answer to ensure all required fields
              const formattedAnswer = {
                id: answer.id || 0,
                playerId: answer.playerId || parseInt(playerData.id),
                questionId: answer.questionId,
                answeredAt: answer.answeredAt || new Date().toISOString(),
                isCorrect: answer.isCorrect,
                responseTime: answer.responseTime,
                answer: answer.answer || "T"
              };
              
              console.log(`Calculating score for answer to question ${answer.questionId}...`);
              
              try {
                // Use playerService for better error handling
                const scoreResponse = await playerService.calculateSoloScore(
                  formattedAnswer,
                  formattedQuestion
                );
                
                console.log(`Answer ${answer.id} score calculated:`, scoreResponse);
                successCount++;
              } catch (apiError) {
                console.error(`Service error calculating score for answer ${answer.id}:`, apiError);
                
                // Fallback to direct API call if service fails
                try {
                  const scoreResponse = await axios.post(
                    `${API_BASE_URL}/api/PlayerAnswer/SoloScore`,
                    {
                      PlayerAnswer: formattedAnswer,
                      Question: formattedQuestion
                    },
                    { 
                      headers: { 
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                      }
                    }
                  );
                  
                  console.log(`Direct API answer ${answer.id} score calculated:`, scoreResponse.data);
                  successCount++;
                } catch (directApiError) {
                  console.error(`Direct API call failed for answer ${answer.id}:`, directApiError);
                  failCount++;
                }
              }
            } catch (err) {
              console.error(`Error calculating score for answer ${answer.id}:`, err);
              failCount++;
            }
          } else {
            console.warn(`No matching question found for answer ${answer.id} (question ID: ${answer.questionId})`);
            failCount++;
          }
        }
        
        console.log(`Solo score calculation complete. Success: ${successCount}, Failed: ${failCount}`);
        
        if (successCount > 0) {
          setScoreMessage({
            show: true,
            message: `Solo scores calculated successfully! (${successCount}/${answers.length})`,
            severity: 'success'
          });
          setScoresFinalized(true);
        } else {
          setScoreMessage({
            show: true,
            message: 'Failed to calculate any scores',
            severity: 'error'
          });
        }
      }
    } catch (error) {
      console.error("Error in calculateFinalScores:", error);
      setScoreMessage({
        show: true,
        message: 'Error calculating scores',
        severity: 'error'
      });
    } finally {
      setCalculatingScores(false);
    }
  };

  // Function to close the score message snackbar
  const handleCloseMessage = () => {
    setScoreMessage({...scoreMessage, show: false});
  };

  // Rest of component code...
  
  // Replace loading view to show score calculation status
  if (loading) {
    return (
      <PublicLayout>
        <Container maxWidth="md" sx={{ py: 6, textAlign: 'center' }}>
          <Typography variant="h5">Loading results...</Typography>
          <CircularProgress sx={{ mt: 3 }} />
        </Container>
      </PublicLayout>
    );
  }
  
  if (calculatingScores) {
    return (
      <PublicLayout>
        <Container maxWidth="md" sx={{ py: 6, textAlign: 'center' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <CalculateIcon sx={{ fontSize: 50, color: 'primary.main' }} />
            <Typography variant="h5">Calculating final scores...</Typography>
            <CircularProgress />
            <Typography variant="body1" color="text.secondary">
              This may take a few moments as we process all your answers
            </Typography>
          </Box>
        </Container>
      </PublicLayout>
    );
  }

  // Add message notification
  return (
    <>
      {/* Existing component render code */}
      <Box 
        sx={{ 
          minHeight: '100vh',
          bgcolor: '#46178f', // Kahoot purple background
          color: 'white',
          pb: 4
        }}
      >
        {/* Rest of the component rendering code */}
        {/* ... */}
      </Box>
      
      {/* Add the score message snackbar */}
      <Snackbar 
        open={scoreMessage.show} 
        autoHideDuration={6000} 
        onClose={handleCloseMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseMessage} 
          severity={scoreMessage.severity} 
          sx={{ width: '100%' }}
        >
          {scoreMessage.message}
        </Alert>
      </Snackbar>
    </>
  );
}