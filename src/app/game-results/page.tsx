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
  CircularProgress
} from '@mui/material';
import { 
  EmojiEvents as TrophyIcon,
  ArrowBack as ArrowBackIcon,
  Home as HomeIcon,
  Groups as GroupsIcon,
  Person as PersonIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import PublicLayout from '../components/PublicLayout';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import ReactConfetti from 'react-confetti';

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
  const [quiz, setQuiz] = useState<any>({});

  useEffect(() => {
    // Set window dimensions for confetti
    setWindowDimensions({
      width: window.innerWidth,
      height: window.innerHeight
    });

    // Get data from sessionStorage
    try {
      console.log("Loading game results data from sessionStorage...");
      
      const storedResults = sessionStorage.getItem('gameResults');
      const quizData = sessionStorage.getItem('quizPreviewData') || sessionStorage.getItem('currentQuiz');
      const playerInfo = sessionStorage.getItem('currentPlayer');
      const storedAvatar = sessionStorage.getItem('playerAvatar');
      
      console.log("storedResults:", storedResults ? "Found" : "Not found");
      console.log("quizData:", quizData ? "Found" : "Not found");
      console.log("playerInfo:", playerInfo ? "Found" : "Not found");
      
      // Set player info
      if (playerInfo) {
        const parsedPlayerInfo = JSON.parse(playerInfo);
        setPlayerInfo(parsedPlayerInfo);
        console.log("Player info:", parsedPlayerInfo);
      } else {
        console.warn("No player information found in sessionStorage");
      }
      
      // Set quiz data
      if (quizData) {
        const parsedQuizData = JSON.parse(quizData);
        setQuiz(parsedQuizData);
        console.log("Quiz data:", parsedQuizData);
      } else {
        console.warn("No quiz data found in sessionStorage");
      }
      
      if (storedAvatar) {
        setPlayerAvatar(storedAvatar);
      }
      
      // Try to get complete game data first as a backup
      const completeGameData = sessionStorage.getItem('completeGameData');
      if (completeGameData && (!storedResults || storedResults === "undefined" || storedResults === "null")) {
        console.log("Using complete game data as fallback");
        try {
          const parsedGameData = JSON.parse(completeGameData);
          // Create player results from complete game data
          if (parsedGameData && parsedGameData.player) {
            const playerResult = {
              name: parsedGameData.player.name,
              score: parsedGameData.score,
              correctAnswers: parsedGameData.correctAnswers,
              totalQuestions: parsedGameData.totalQuestions,
              avatar: parsedGameData.player.avatar,
              group: playerInfo ? JSON.parse(playerInfo)?.team : null
            };
            
            setPlayerResults([playerResult]);
            console.log("Using player results from complete game data:", [playerResult]);
            
            const groups = calculateGroupScores([playerResult]);
            setGroupResults(groups);
            
            if (quizData) {
              const parsedQuizData = JSON.parse(quizData);
              setGameTitle(parsedQuizData.title);
            }
            
            setCurrentPlayer(parsedGameData.player.name);
            
            if (parsedGameData.player?.id && parsedGameData.quizId) {
              fetchPlayerAnswers(parsedGameData.player.id, parsedGameData.quizId);
            }
            
            // Save the game data for teacher to see
            saveCompletedGame(quiz, [playerResult], groups);
            
            // No need to process storedResults
            setLoading(false);
            return;
          }
        } catch (error) {
          console.error("Error parsing complete game data:", error);
        }
      }
      
      if (storedResults && quizData && playerInfo) {
        console.log("Processing stored game results");
        try {
          const results = JSON.parse(storedResults);
          if (!Array.isArray(results)) {
            console.error("Game results is not an array:", results);
            throw new Error("Invalid game results format");
          }
          
          const quiz = JSON.parse(quizData);
          const player = JSON.parse(playerInfo);
          
          console.log("Game results:", results);
          
          const mode = quiz.gameMode || 'solo';
          setGameMode(mode);
          
          setViewMode(mode === 'team' ? 'group' : 'player');
          
          setPlayerResults(results);
          
          const groups = calculateGroupScores(results);
          setGroupResults(groups);
          
          setGameTitle(quiz.title || "Quiz Game");
          setCurrentPlayer(player?.name || '');
          
          // Fetch player answers from API
          if (player && player.id && quiz.id) {
            fetchPlayerAnswers(player.id, quiz.id);
          }
          
          // Hide confetti after 5 seconds
          setTimeout(() => {
            setShowConfetti(false);
          }, 5000);
          
          // Save the game data for teacher to see
          saveCompletedGame(quiz, results, groups);
        } catch (error) {
          console.error('Error processing game results:', error);
          
          // Try to recover from error by creating a dummy result
          if (playerInfo) {
            try {
              const playerData = JSON.parse(playerInfo);
              const dummyResult = {
                name: playerData.name || "Player",
                score: 0,
                correctAnswers: 0,
                totalQuestions: 1,
                avatar: playerData.avatar || 'alligator'
              };
              
              console.log("Created dummy result as fallback:", dummyResult);
              setPlayerResults([dummyResult]);
              setCurrentPlayer(playerData.name || "Player");
              
              if (quizData) {
                const quizInfo = JSON.parse(quizData);
                setGameTitle(quizInfo.title || "Quiz Game");
              }
            } catch (e) {
              console.error("Failed to create dummy result:", e);
            }
          }
        }
      } else {
        console.warn("Missing required data for game results:", {
          hasStoredResults: !!storedResults,
          hasQuizData: !!quizData,
          hasPlayerInfo: !!playerInfo
        });
      }
    } catch (error) {
      console.error('Error loading game results:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Add this near the top of your component
  useEffect(() => {
    // ...existing code
    
    // Make sure to get and store player ID early
    const playerInfoStr = sessionStorage.getItem('currentPlayer');
    if (playerInfoStr) {
      try {
        const playerData = JSON.parse(playerInfoStr);
        const playerId = playerData.id || playerData.playerId;
        
        // Store playerId in sessionStorage for easy access
        if (playerId) {
          sessionStorage.setItem('currentPlayerId', String(playerId));
          console.log("Set currentPlayerId in session:", playerId);
        }
      } catch (e) {
        console.error("Error parsing player info:", e);
      }
    }
    
    // ...rest of existing code
  }, []);

  // Add this effect to fetch answers when component mounts
  useEffect(() => {
    const getAnswers = async () => {
      try {
        const playerInfoStr = sessionStorage.getItem('currentPlayer');
        const quizDataStr = sessionStorage.getItem('quizPreviewData') || sessionStorage.getItem('currentQuiz');
        
        if (playerInfoStr && quizDataStr) {
          const playerData = JSON.parse(playerInfoStr);
          const quizData = JSON.parse(quizDataStr);
          
          const playerId = playerData.id || playerData.playerId;
          const quizId = quizData.id;
          
          if (playerId && quizId) {
            await fetchPlayerAnswers(playerId, quizId);
          }
        }
      } catch (error) {
        console.error("Error in getAnswers effect:", error);
      }
    };
    
    getAnswers();
  }, []);

  // Improved function to fetch player answers using GET method
  const fetchPlayerAnswers = async (playerId: number, quizId: number) => {
    try {
      setAnswersLoading(true);
      console.log(`Fetching answers for player ${playerId} in quiz ${quizId}`);
      
      // First check if we have answers stored in sessionStorage already
      const storedAnswers = sessionStorage.getItem('playerAnswers');
      if (storedAnswers) {
        try {
          const parsedAnswers = JSON.parse(storedAnswers);
          if (Array.isArray(parsedAnswers) && parsedAnswers.length > 0) {
            console.log("Using stored player answers from sessionStorage:", parsedAnswers);
            setPlayerAnswers(parsedAnswers);
            setAnswersLoading(false);
            return;
          }
        } catch (parseError) {
          console.error("Failed to parse stored answers:", parseError);
        }
      }
      
      // Check if we have answers in the completeGameData
      const completeData = sessionStorage.getItem('completeGameData');
      if (completeData) {
        try {
          const parsedData = JSON.parse(completeData);
          if (parsedData.answers && Array.isArray(parsedData.answers) && parsedData.answers.length > 0) {
            console.log("Using answers from completeGameData:", parsedData.answers);
            
            // Convert to the format expected by the UI
            const formattedAnswers = parsedData.answers.map((answer: any, index: number) => ({
              id: index + 1,
              playerId: playerId,
              questionId: answer.questionIndex + 1,
              answeredAt: new Date().toISOString(),
              isCorrect: answer.isCorrect,
              responseTime: answer.timeTaken,
              answer: answer.selectedAnswer !== null ? 
                String.fromCharCode(65 + answer.selectedAnswer) : 'T' // A, B, C, D or T for timeout
            }));
            
            setPlayerAnswers(formattedAnswers);
            
            // Save these formatted answers in sessionStorage for future use
            sessionStorage.setItem('playerAnswers', JSON.stringify(formattedAnswers));
            
            setAnswersLoading(false);
            return;
          }
        } catch (parseError) {
          console.error("Failed to parse complete game data for answers:", parseError);
        }
      }
      
      // If no stored answers, try API calls
      try {
        // First approach: Get all answers and filter client-side
        const response = await fetch(
          `https://kahootclone-f7hkd0hwafgbfrfa.southeastasia-01.azurewebsites.net/api/PlayerAnswer`,
          {
            method: 'GET',
            headers: {
              'Accept': 'application/json'
            }
          }
        );
        
        if (!response.ok) {
          console.warn(`Main API call failed with status ${response.status}`);
          throw new Error(`Failed to fetch player answers: ${response.status}`);
        }
        
        const responseData = await response.json();
        console.log("All player answers response:", responseData);
        
        if (responseData && Array.isArray(responseData.data)) {
          // Filter answers for this specific player
          const playerAnswers = responseData.data.filter((answer: { playerId: number; }) => 
            answer.playerId === playerId
          );
          
          console.log(`Found ${playerAnswers.length} answers for player ${playerId}`);
          
          if (playerAnswers.length > 0) {
            setPlayerAnswers(playerAnswers);
            
            // Save these answers in sessionStorage for future use
            sessionStorage.setItem('playerAnswers', JSON.stringify(playerAnswers));
            
            // Also update localStorage for persistance
            setTimeout(() => {
              // Get the updated quiz data with our answers
              const updatedQuiz = JSON.parse(sessionStorage.getItem('quizPreviewData') || sessionStorage.getItem('currentQuiz') || '{}');
              saveCompletedGame(updatedQuiz, playerResults, groupResults);
            }, 500);
            
            setAnswersLoading(false);
            return;
          }
        }
      } catch (apiError) {
        console.error("Error fetching from main PlayerAnswer endpoint:", apiError);
      }
      
      // If first approach fails, try player-specific endpoint
      try {
        console.log("Trying player-specific endpoint as fallback");
        const playerSpecificResponse = await fetch(
          `https://kahootclone-f7hkd0hwafgbfrfa.southeastasia-01.azurewebsites.net/api/PlayerAnswer/player/${playerId}`,
          {
            method: 'GET',
            headers: {
              'Accept': 'application/json'
            }
          }
        );
        
        if (!playerSpecificResponse.ok) {
          throw new Error(`Player-specific endpoint failed: ${playerSpecificResponse.status}`);
        }
        
        const playerData = await playerSpecificResponse.json();
        console.log("Player-specific answers:", playerData);
        
        if (playerData && playerData.data && Array.isArray(playerData.data)) {
          setPlayerAnswers(playerData.data);
          
          // Save these answers in sessionStorage for future use
          sessionStorage.setItem('playerAnswers', JSON.stringify(playerData.data));
          
          // Update stored game data
          setTimeout(() => {
            const updatedQuiz = JSON.parse(sessionStorage.getItem('quizPreviewData') || sessionStorage.getItem('currentQuiz') || '{}');
            saveCompletedGame(updatedQuiz, playerResults, groupResults);
          }, 500);
          
          setAnswersLoading(false);
          return;
        } else {
          console.warn("No valid data from player-specific endpoint");
        }
      } catch (playerSpecificError) {
        console.error("Error fetching from player-specific endpoint:", playerSpecificError);
      }
      
      // Final fallback - use local data if available
      try {
        // If you have local answers from the game session, use those as a last resort
        const gameResultsStr = sessionStorage.getItem('gameResults');
        if (gameResultsStr) {
          const gameResults = JSON.parse(gameResultsStr);
          const currentPlayerResult = gameResults.find((p: any) => p.name === currentPlayer);
          
          if (currentPlayerResult && currentPlayerResult.answers) {
            // Convert local answers to API format
            const formattedAnswers = currentPlayerResult.answers.map((a: any, index: number) => ({
              id: index + 1,
              playerId: playerId,
              questionId: quiz.questions ? quiz.questions[a.questionIndex]?.id || index + 1 : index + 1,
              answeredAt: new Date().toISOString(),
              isCorrect: a.isCorrect,
              responseTime: a.timeTaken,
              answer: a.selectedAnswer !== null ? 
                String.fromCharCode(65 + a.selectedAnswer) : 'T' // A, B, C, D or T for timeout
            }));
            
            console.log("Using local answer data:", formattedAnswers);
            setPlayerAnswers(formattedAnswers);
            
            // Save these formatted answers in sessionStorage for future use
            sessionStorage.setItem('playerAnswers', JSON.stringify(formattedAnswers));
            
            // Update stored game data
            setTimeout(() => {
              saveCompletedGame(quiz, playerResults, groupResults);
            }, 500);
            
            setAnswersLoading(false);
            return;
          }
        }
      } catch (localError) {
        console.error("Error using local answer data:", localError);
      }
      
      // No answer data available
      console.warn("No answer data available from any source");
      setAnswersLoading(false);
      
    } catch (error) {
      console.error("Error in fetchPlayerAnswers function:", error);
      setAnswersLoading(false);
    }
  };

  // Add helper function to save the game data
  const saveCompletedGame = (quiz: any, players: PlayerScore[], groups: GroupScore[]) => {
    try {
      if (!quiz) {
        console.error('No quiz data available to save completed game');
        return;
      }
      
      const gameId = quiz.id || Date.now();
      const gameResultsForTeacher = {
        id: gameId,
        title: quiz.title || 'Unnamed Quiz',
        description: quiz.description || '',
        gameMode: quiz.gameMode || 'solo',
        coverImage: quiz.coverImage || quiz.imageUrl || quiz.thumbnailUrl || '',
        completed: true,
        dateCompleted: new Date().toISOString(),
        playerResults: players,
        groupResults: groups,
        playerAnswers: playerAnswers, // Include the player answers fetched from API
        questions: quiz.questions || [],
        sessionId: quiz.sessionId || quiz.id || null
      };
      
      // Save to localStorage (in a real app, this would be saved to a database)
      const completedGames = JSON.parse(localStorage.getItem('completedGames') || '[]');
      
      // Check if this game already exists in completed games
      const existingGameIndex = completedGames.findIndex((g: any) => g.id === gameId);
      
      if (existingGameIndex >= 0) {
        // Update existing game
        completedGames[existingGameIndex] = gameResultsForTeacher;
      } else {
        // Add new completed game
        completedGames.push(gameResultsForTeacher);
      }
      
      localStorage.setItem('completedGames', JSON.stringify(completedGames));
      console.log('Game results saved successfully:', gameResultsForTeacher);
    } catch (error) {
      console.error('Error saving completed game:', error);
    }
  };

  const handlePlayAgain = () => {
    router.push('/play-quiz-preview');
  };

  const handleNewGame = () => {
    router.push('/');
  };

  const getMedalColor = (position: number) => {
    switch (position) {
      case 0: return 'gold';
      case 1: return 'silver';
      case 2: return '#CD7F32'; // bronze
      default: return 'transparent';
    }
  };

  const getPlayerRank = (playerName: string) => {
    const index = playerResults.findIndex(player => player.name === playerName);
    return index + 1;
  };

  const handleViewModeChange = (event: React.SyntheticEvent, newValue: 'player' | 'group') => {
    setViewMode(newValue);
  };

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

  if (playerResults.length === 0) {
    return (
      <PublicLayout>
        <Container maxWidth="md" sx={{ py: 6, textAlign: 'center' }}>
          <Typography variant="h5" sx={{ mb: 2 }}>No results found</Typography>
          <Typography variant="body1" sx={{ mb: 4 }}>
            We couldn't find any game results. This may happen if:
            <Box component="ul" sx={{ textAlign: 'left', display: 'inline-block', mt: 2 }}>
              <li>The game session expired</li>
              <li>Your browser's storage was cleared</li>
              <li>There was an error during the game</li>
            </Box>
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button 
              variant="contained" 
              startIcon={<HomeIcon />}
              onClick={() => router.push('/')}
            >
              Return to Home
            </Button>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() => router.push('/play-quiz-preview')}
            >
              Play Another Game
            </Button>
          </Box>
        </Container>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      {showConfetti && (
        <ReactConfetti
          width={windowDimensions.width}
          height={windowDimensions.height}
          recycle={false}
          numberOfPieces={300}
        />
      )}
      <Container maxWidth="md" sx={{ py: 6 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Paper
            elevation={3}
            sx={{
              p: 4,
              borderRadius: 3,
              mb: 4,
              background: 'linear-gradient(to right, rgba(224, 234, 252, 0.7), rgba(207, 222, 243, 0.7))',
            }}
          >
            <Typography variant="h4" sx={{ mb: 1, fontWeight: 'bold', textAlign: 'center' }}>
              Game Results
            </Typography>
            <Typography variant="h6" sx={{ mb: 3, textAlign: 'center' }}>
              {gameTitle}
            </Typography>
            
            {/* Game Mode Indicator */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
              <Chip
                icon={gameMode === 'solo' ? <PersonIcon /> : <GroupsIcon />}
                label={gameMode === 'solo' ? "Solo Mode" : "Team Mode"}
                color="primary"
                variant="outlined"
              />
            </Box>

            {/* View Mode Tabs - Only show in team mode or if user specifically switches */}
            {(gameMode === 'team' || viewMode === 'group') && (
              <Box sx={{ width: '100%', mb: 3 }}>
                <Tabs
                  value={viewMode}
                  onChange={handleViewModeChange}
                  centered
                  sx={{ mb: 2 }}
                >
                  <Tab 
                    icon={<PersonIcon />} 
                    label="Player Scores" 
                    value="player"
                  />
                  <Tab 
                    icon={<GroupsIcon />} 
                    label="Team Scores" 
                    value="group"
                  />
                </Tabs>
              </Box>
            )}

            {/* Current player's result highlight */}
            {currentPlayer && viewMode === 'player' && (
              <Box sx={{ mb: 4 }}>
                <Typography variant="subtitle1" component="div" sx={{ mb: 2, textAlign: 'center' }}>
                  Your Result
                </Typography>
                <Paper
                  elevation={2}
                  sx={{
                    p: 3,
                    borderRadius: 2,
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    border: '1px solid rgba(0, 0, 0, 0.12)',
                  }}
                >
                  {playerResults.map((player, index) => {
                    if (player.name === currentPlayer) {
                      const animalInfo = getAnimalAvatar(player.avatar || playerAvatar);
                      return (
                        <Box key={index} sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between', gap: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Box
                              sx={{
                                width: 56,
                                height: 56,
                                mr: 2,
                                border: '2px solid',
                                borderColor: getMedalColor(index),
                                borderRadius: '50%',
                                overflow: 'hidden',
                                bgcolor: 'white'
                              }}
                            >
                              <Animal
                                name={animalInfo.name}
                                color={animalInfo.color}
                                size="56px"
                              />
                            </Box>
                            <Box>
                              <Typography variant="h6" component="div">{player.name}</Typography>
                              <Typography variant="body2" component="div">
                                Rank: <strong>#{getPlayerRank(player.name)}</strong> • 
                                Correct: <strong>{player.correctAnswers}/{player.totalQuestions}</strong>
                                {player.averageAnswerTime && (
                                  <> • Avg. time: <strong>{player.averageAnswerTime}s</strong></>
                                )}
                                {player.group && gameMode === 'team' && (
                                  <> • Team: <strong>{player.group}</strong></>
                                )}
                              </Typography>
                            </Box>
                          </Box>
                          <Box sx={{ textAlign: { xs: 'left', sm: 'right' }, pl: { xs: 7, sm: 0 } }}>
                            <Typography variant="h5" component="div" color="primary" sx={{ fontWeight: 'bold' }}>
                              {player.score}
                            </Typography>
                            <Typography variant="body2" component="div" color="text.secondary">
                              points
                            </Typography>
                          </Box>
                        </Box>
                      );
                    }
                    return null;
                  })}
                </Paper>
              </Box>
            )}

            {/* Current team's result highlight for team mode */}
            {currentPlayer && gameMode === 'team' && viewMode === 'group' && (
              <Box sx={{ mb: 4 }}>
                <Typography variant="subtitle1" component="div" sx={{ mb: 2, textAlign: 'center' }}>
                  Your Team
                </Typography>
                <Paper
                  elevation={2}
                  sx={{
                    p: 3,
                    borderRadius: 2,
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    border: '1px solid rgba(0, 0, 0, 0.12)',
                  }}
                >
                  {groupResults.map((group, index) => {
                    // Find if current player is in this group
                    const currentPlayerInGroup = group.members.find(member => member.name === currentPlayer);
                    if (currentPlayerInGroup) {
                      return (
                        <Box key={index} sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between', gap: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar
                              sx={{
                                bgcolor: getMedalColor(index) !== 'transparent' ? getMedalColor(index) : 'primary.main',
                                width: 56,
                                height: 56,
                                mr: 2
                              }}
                            >
                              <GroupsIcon />
                            </Avatar>
                            <Box>
                              <Typography variant="h6" component="div">{group.name}</Typography>
                              <Typography variant="body2" component="div">
                                Rank: <strong>#{index + 1}</strong> • 
                                Members: <strong>{group.memberCount}</strong>
                              </Typography>
                            </Box>
                          </Box>
                          <Box sx={{ textAlign: { xs: 'left', sm: 'right' }, pl: { xs: 7, sm: 0 } }}>
                            <Typography variant="h5" component="div" color="primary" sx={{ fontWeight: 'bold' }}>
                              {group.score}
                            </Typography>
                            <Typography variant="body2" component="div" color="text.secondary">
                              team points
                            </Typography>
                          </Box>
                        </Box>
                      );
                    }
                    return null;
                  })}
                </Paper>
              </Box>
            )}

            {/* Leaderboard section */}
            <Typography variant="h5" sx={{ mt: 4, mb: 2, display: 'flex', alignItems: 'center' }}>
              <TrophyIcon sx={{ mr: 1 }} />
              {viewMode === 'player' ? 'Player Leaderboard' : 'Team Leaderboard'}
            </Typography>

            {viewMode === 'player' ? (
              <List sx={{ bgcolor: 'background.paper', borderRadius: 2 }}>
                {playerResults.map((player, index) => {
                  const animalInfo = getAnimalAvatar(player.avatar || getRandomAvatar());
                  return (
                    <React.Fragment key={index}>
                      {index > 0 && <Divider variant="inset" component="li" />}
                      <ListItem
                        alignItems="center"
                        sx={{
                          py: 1.5,
                          backgroundColor: player.name === currentPlayer ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
                          borderLeft: player.name === currentPlayer ? '4px solid #1976d2' : 'none',
                        }}
                      >
                        <Box 
                          sx={{ 
                            minWidth: 32, 
                            mr: 2, 
                            display: 'flex', 
                            justifyContent: 'center',
                            alignItems: 'center'
                          }}
                        >
                          <Typography 
                            variant="h6" 
                            sx={{ 
                              fontWeight: index < 3 ? 'bold' : 'normal',
                              color: index < 3 ? 'primary.main' : 'text.primary'
                            }}
                          >
                            {index + 1}
                          </Typography>
                        </Box>
                        <ListItemAvatar>
                          <Box
                            sx={{
                              width: 40,
                              height: 40,
                              border: '2px solid',
                              borderColor: getMedalColor(index),
                              borderRadius: '50%',
                              overflow: 'hidden',
                              bgcolor: 'white'
                            }}
                          >
                            <Animal
                              name={animalInfo.name}
                              color={animalInfo.color}
                              size="40px"
                            />
                          </Box>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Typography component="span" variant="body1" sx={{ fontWeight: index < 3 ? 'bold' : 'normal' }}>
                                {player.name}
                              </Typography>
                              {player.group && gameMode === 'team' && (
                                <Chip
                                  size="small"
                                  label={player.group}
                                  sx={{ ml: 1, fontSize: '0.7rem' }}
                                />
                              )}
                            </Box>
                          }
                          secondary={
                            <React.Fragment>
                              <Typography component="span" variant="body2" color="text.primary">
                                {player.correctAnswers}/{player.totalQuestions} correct
                              </Typography>
                              {player.averageAnswerTime && (
                                <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                                  • {player.averageAnswerTime}s avg
                                </Typography>
                              )}
                            </React.Fragment>
                          }
                        />
                        <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold', ml: 2 }}>
                          {player.score}
                        </Typography>
                      </ListItem>
                    </React.Fragment>
                  );
                })}
              </List>
            ) : (
              <List sx={{ bgcolor: 'background.paper', borderRadius: 2 }}>
                {groupResults.map((group, index) => (
                  <React.Fragment key={index}>
                    {index > 0 && <Divider component="li" />}
                    <ListItem
                      alignItems="center"
                      sx={{
                        py: 1.5,
                        backgroundColor: group.members.some(m => m.name === currentPlayer) ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
                        borderLeft: group.members.some(m => m.name === currentPlayer) ? '4px solid #1976d2' : 'none',
                      }}
                    >
                      <Box 
                        sx={{ 
                          minWidth: 32, 
                          mr: 2, 
                          display: 'flex', 
                          justifyContent: 'center',
                          alignItems: 'center'
                        }}
                      >
                        <Typography 
                          variant="h6" 
                          sx={{ 
                            fontWeight: index < 3 ? 'bold' : 'normal',
                            color: index < 3 ? 'primary.main' : 'text.primary'
                          }}
                        >
                          {index + 1}
                        </Typography>
                      </Box>
                      <ListItemAvatar>
                        <Avatar
                          sx={{
                            bgcolor: getMedalColor(index) !== 'transparent' ? getMedalColor(index) : 'primary.main',
                            width: 40,
                            height: 40,
                          }}
                        >
                          <GroupsIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography component="span" variant="body1" sx={{ fontWeight: index < 3 ? 'bold' : 'normal' }}>
                            {group.name}
                          </Typography>
                        }
                        secondary={
                          <Typography component="span" variant="body2" color="text.primary">
                            {group.memberCount} members
                          </Typography>
                        }
                      />
                      <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold', ml: 2 }}>
                        {group.score}
                      </Typography>
                    </ListItem>
                    
                    {/* Group members (collapsible in future version) */}
                    <Box sx={{ pl: 9, pr: 3, pb: 2, bgcolor: 'rgba(0,0,0,0.02)' }}>
                      {group.members.slice(0, 3).map((member, midx) => (
                        <Box 
                          key={midx}
                          sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'space-between',
                            py: 0.5,
                            borderBottom: midx < group.members.slice(0, 3).length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none'
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Box
                              sx={{
                                width: 24,
                                height: 24,
                                mr: 1,
                                borderRadius: '50%',
                                overflow: 'hidden',
                                bgcolor: 'white'
                              }}
                            >
                              <Animal
                                name={getAnimalAvatar(member.avatar || getRandomAvatar()).name}
                                color={getAnimalAvatar(member.avatar || getRandomAvatar()).color}
                                size="24px"
                              />
                            </Box>
                            <Typography variant="body2">
                              {member.name}
                            </Typography>
                          </Box>
                          <Typography variant="body2" color="primary.main" sx={{ fontWeight: 'medium' }}>
                            {member.score} pts
                          </Typography>
                        </Box>
                      ))}
                      {group.members.length > 3 && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
                          +{group.members.length - 3} more members
                        </Typography>
                      )}
                    </Box>
                  </React.Fragment>
                ))}
              </List>
            )}

            {/* Question and Answer Summary */}
            <Typography variant="h5" sx={{ mt: 4, mb: 2, display: 'flex', alignItems: 'center' }}>
              Question Summary
            </Typography>

            <Paper elevation={1} sx={{ p: 0, borderRadius: 2, overflow: 'hidden', mb: 4 }}>
              {answersLoading ? (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <Typography>Loading answer data...</Typography>
                </Box>
              ) : playerAnswers.length > 0 ? (
                <List disablePadding>
                  {/* Get the quiz questions from sessionStorage */}
                  {(() => {
                    const quizData = JSON.parse(sessionStorage.getItem('quizPreviewData') || sessionStorage.getItem('currentQuiz') || '{}');
                    const questions = quizData.questions || [];
                    
                    // Create a map of questionId -> question for quick lookup
                    const questionMap = new Map();
                    questions.forEach((q: any) => {
                      questionMap.set(parseInt(q.id), q);
                    });
                    
                    // Group answers by questionId for better display
                    const answersByQuestion = new Map();
                    playerAnswers.forEach(answer => {
                      if (!answersByQuestion.has(answer.questionId)) {
                        answersByQuestion.set(answer.questionId, []);
                      }
                      answersByQuestion.get(answer.questionId).push(answer);
                    });
                    
                    // Sort questions by their ID or index
                    const sortedQuestionIds = Array.from(answersByQuestion.keys()).sort((a, b) => a - b);
                    
                    return sortedQuestionIds.map((questionId, qIndex) => {
                      const question = questionMap.get(questionId);
                      const answers = answersByQuestion.get(questionId) || [];
                      
                      if (!question) {
                        return (
                          <ListItem key={`question-${questionId}`} sx={{ p: 2, backgroundColor: qIndex % 2 === 0 ? 'rgba(0,0,0,0.02)' : 'transparent' }}>
                            <ListItemText 
                              primary={`Question #${qIndex + 1}`}
                              secondary="Question details not available"
                            />
                          </ListItem>
                        );
                      }
                      
                      const playerAnswer = answers.find((a: { playerId: any; }) => 
                        a.playerId === (playerInfo?.id || playerInfo?.playerId)
                      );
                      
                      const answerIndex = playerAnswer ? 
                        playerAnswer.answer.charCodeAt(0) - 'A'.charCodeAt(0) : -1;
                      
                      const correctAnswerIndex = typeof question.correctAnswer === 'number' ? 
                        question.correctAnswer : 
                        (question.isCorrect?.charCodeAt(0) - 'A'.charCodeAt(0) || 0);
                        
                      const options = question.options || [
                        question.optionA || 'Option A',
                        question.optionB || 'Option B',
                        question.optionC || 'Option C',
                        question.optionD || 'Option D'
                      ];
                      
                      return (
                        <React.Fragment key={`question-${questionId}`}>
                          {qIndex > 0 && <Divider />}
                          <ListItem sx={{ 
                            flexDirection: 'column', 
                            alignItems: 'flex-start',
                            p: 2,
                            backgroundColor: qIndex % 2 === 0 ? 'rgba(0,0,0,0.02)' : 'transparent'
                          }}>
                            <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                                Question {qIndex + 1}
                              </Typography>
                              {playerAnswer && (
                                <Chip 
                                  size="small"
                                  label={playerAnswer.isCorrect ? "Correct" : "Incorrect"}
                                  color={playerAnswer.isCorrect ? "success" : "error"}
                                />
                              )}
                            </Box>
                            
                            <Typography variant="body1" sx={{ mb: 1 }}>
                              {question.question || question.text || `Question #${qIndex + 1}`}
                            </Typography>
                            
                            <Box sx={{ display: 'grid', gridTemplateColumns: {xs: '1fr', sm: '1fr 1fr'}, width: '100%', gap: 1 }}>
                              {options.map((option: string, i: number) => (
                                <Box 
                                  key={`option-${i}`}
                                  sx={{ 
                                    p: 1.5, 
                                    borderRadius: 1,
                                    border: '1px solid',
                                    borderColor: 
                                      i === correctAnswerIndex ? 'success.main' : 
                                      (i === answerIndex && i !== correctAnswerIndex) ? 'error.main' : 
                                      'divider',
                                    backgroundColor: 
                                      i === correctAnswerIndex ? 'success.light' : 
                                      (i === answerIndex && i !== correctAnswerIndex) ? 'error.light' : 
                                      'transparent',
                                    opacity: 
                                      i === correctAnswerIndex || i === answerIndex ? 1 : 0.7,
                                    display: 'flex',
                                    alignItems: 'center'
                                  }}
                                >
                                  <Typography variant="body2" sx={{ ml: 1 }}>
                                    {String.fromCharCode(65 + i)}. {option}
                                  </Typography>
                                </Box>
                              ))}
                            </Box>
                            
                            {playerAnswer && (
                              <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                                Response time: {playerAnswer.responseTime}s
                              </Typography>
                            )}
                          </ListItem>
                        </React.Fragment>
                      );
                    });
                  })()}
                </List>
              ) : (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <Typography>No answer data available</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Answer data could not be retrieved from the server.
                  </Typography>
                </Box>
              )}
            </Paper>

            {/* Action buttons */}
            <Box sx={{ mt: 4, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'center', gap: 2 }}>
              <Button
                variant="contained"
                startIcon={<RefreshIcon />}
                onClick={handlePlayAgain}
                sx={{ borderRadius: 2 }}
              >
                Play Again
              </Button>
              <Button
                variant="outlined"
                startIcon={<HomeIcon />}
                onClick={handleNewGame}
                sx={{ borderRadius: 2 }}
              >
                New Game
              </Button>
            </Box>
          </Paper>
        </motion.div>
      </Container>
    </PublicLayout>
  );
}