'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Container,
  Paper,
  Button,
  Alert,
  TextField,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  Chip,
  Avatar,
  Grid
} from '@mui/material';
import { 
  PlayArrow as PlayIcon,
  Person as PersonIcon,
  Groups as GroupsIcon,
  Pets as PetsIcon
} from '@mui/icons-material';
import { useRouter, useSearchParams } from 'next/navigation';
import PublicLayout from '../components/PublicLayout';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { GameData } from '@/types/game';
import { SelectChangeEvent } from '@mui/material/Select';
import quizService from '@/services/quizService';
import groupService from '@/services/groupService';
import playerService from '@/services/playerService';
import questionService from '@/services/questionService';
import dynamic from 'next/dynamic';

// Manually override game mode for specific quiz codes
// This is a temporary fix for specific problematic quizzes
const forceTeamModeForQuiz = (quizCode: string | null): boolean => {
  if (!quizCode) return false;
  
  // List of quiz codes that should be forced to team mode
  const teamModeQuizzes = ['517232'];
  
  return teamModeQuizzes.includes(quizCode);
};

// DEBUG function to force team mode for certain quizzes based on recent quiz codes
// Add the quiz code you got from the error (221555 in this case)
const shouldBeTeamMode = (quizCode: string | null): boolean => {
  if (!quizCode) return false;
  
  // Add problematic quiz codes here
  const knownTeamModeQuizzes = ['221555', '671412'];
  const isKnownTeamQuiz = knownTeamModeQuizzes.includes(quizCode);
  
  if (isKnownTeamQuiz) {
    console.log(`🔴 Quiz ${quizCode} SHOULD be in team mode - forcing team mode`);
  }
  
  return isKnownTeamQuiz;
};

// Import Animal component with dynamic import to avoid SSR issues
const Animal = dynamic(() => import('react-animals'), { ssr: false });

// Constants for the application
const DEFAULT_TEAM_NAMES = ["Red Team", "Blue Team", "Green Team", "Yellow Team"];
const ANIMALS = ["alligator", "beaver", "dolphin", "elephant", "fox", "penguin", "tiger", "turtle"]; // Use animals supported by the library

// Map animals to colors for visual consistency
const animalColorMap = {
  alligator: "green",
  beaver: "red",
  dolphin: "blue",
  elephant: "purple", // Changed from gray to purple
  fox: "orange",
  penguin: "purple",
  tiger: "yellow",
  turtle: "green"
};

// Valid colors for the react-animals library
const VALID_COLORS = ["red", "blue", "green", "yellow", "orange", "purple", "pink", "brown"];

// Replace your AnimalAvatar component with this one
function AnimalAvatar({ name, color }: { name: string; color?: string }) {
  // Determine if the provided name is a valid animal name
  const isValidAnimal = ANIMALS.includes(name);
  const animalName = isValidAnimal ? name : 'alligator'; // Fallback to alligator if invalid
  
  // Use color from props or from the map, ensuring it's valid
  const mappedColor = animalColorMap[animalName as keyof typeof animalColorMap];
  let animalColor = color || mappedColor || 'orange';
  
  // Make sure color is valid
  if (!VALID_COLORS.includes(animalColor)) {
    console.warn(`Color '${animalColor}' may not be valid for react-animals. Using 'orange' instead.`);
    animalColor = 'orange'; // Fallback to a known valid color
  }

  return (
    <Box sx={{ 
      width: '100%', 
      height: '100%', 
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center' 
    }}>
      <Animal
        name={animalName}
        color={animalColor}
        size="100%"
      />
    </Box>
  );
}

// At the top of the file, add this interface
interface PlayerInfo {
  name: string;
  avatar: string;
  team: string | null;
  gameCode: string;
  joinTime: string;
  id?: number;
  playerId?: number;
  playerCode?: number;
  quizId?: number;
}

export default function PlayGamePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get('code');
  const { user } = useAuth();
  
  // Debug info for quiz code
  console.log("Rendering PlayGamePage with quiz code:", code);
  
  // Default starting values
  const defaultAnimal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
  
  const [loading, setLoading] = useState(true);
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState('');
  const [nameError, setNameError] = useState('');
  const [gameMode, setGameMode] = useState<'solo' | 'team'>('solo');
  const [selectedTeam, setSelectedTeam] = useState<string>(DEFAULT_TEAM_NAMES[0]);
  const [teamNames, setTeamNames] = useState<string[]>(DEFAULT_TEAM_NAMES);
  const [apiLoading, setApiLoading] = useState(false);
  
  // Animal avatar selection with valid defaults
  const [selectedAnimal, setSelectedAnimal] = useState(defaultAnimal);
  const [selectedColor, setSelectedColor] = useState('#FF3355');

  useEffect(() => {
    const loadGame = async () => {
      try {
        setLoading(true);
        
        if (!code) {
          setError('No game code provided');
          setLoading(false);
          return;
        }

        // Check if this quiz code is known to need team mode
        const codeNeedsTeamMode = shouldBeTeamMode(code);
        if (codeNeedsTeamMode) {
          console.log(`🟢 Quiz ${code} is known to need team mode - will override API response`);
        }

        // Call the API to get quiz by code using service
        try {
          console.log(`Fetching quiz with code: ${code}`);
          
          const quizResponse = await quizService.getQuizByQuizCode(code);
          
          console.log("Quiz API Response:", quizResponse);
          console.log("Raw gameMode value from API:", quizResponse?.data?.gameMode);
          console.log("Type of gameMode:", typeof quizResponse?.data?.gameMode);
          
          if (quizResponse && quizResponse.data) {
            const quizData = quizResponse.data;
            console.log("Quiz data:", quizData);
            
            // Improved game mode detection with more debug information
            let gameModeSetting: 'solo' | 'team' = 'solo';
            
            // Store the raw value for debugging
            const rawGameMode = quizData.gameMode;
            console.log("Raw game mode value:", rawGameMode);
            console.log("Raw game mode type:", typeof rawGameMode);
            
            // First check if this is a known quiz needing team mode
            if (codeNeedsTeamMode) {
              console.log(`🟢 Forcing team mode for quiz ${code} based on known quiz list`);
              gameModeSetting = 'team';
            }
            // Then check if this quiz should be forced to team mode
            else if (forceTeamModeForQuiz(code)) {
              console.log("📢 Forcing team mode for quiz code:", code);
              gameModeSetting = 'team';
            } else if (quizData.gameMode !== undefined && quizData.gameMode !== null) {
              // Enhanced detection logic with more explicit type checking
              const gmType = typeof quizData.gameMode;
              console.log(`GameMode detection: type=${gmType}, value=${rawGameMode}`);
              
              if (gmType === 'string') {
                // Direct string comparison with improved case handling, log original value
                console.log("GameMode is string:", quizData.gameMode);
                const normalizedGameMode = quizData.gameMode.trim().toLowerCase();
                console.log("Normalized game mode:", normalizedGameMode);
                
                // More specific string matching
                if (normalizedGameMode === 'team' || normalizedGameMode === '1' || normalizedGameMode === 'true') {
                  gameModeSetting = 'team';
                  console.log("String-based game mode set to team");
                } else {
                  gameModeSetting = 'solo';
                  console.log("String-based game mode set to solo (default)");
                }
              } else if (gmType === 'boolean') {
                // Boolean values: true = team, false = solo
                console.log("GameMode is boolean:", quizData.gameMode);
                gameModeSetting = quizData.gameMode === true ? 'team' : 'solo';
                console.log(`Boolean-based game mode set to ${gameModeSetting}`);
              } else if (gmType === 'number') {
                // If gameMode is a number, 0 is solo, anything else is team
                console.log("GameMode is number:", quizData.gameMode);
                gameModeSetting = quizData.gameMode === 0 ? 'solo' : 'team';
                console.log(`Number-based game mode set to ${gameModeSetting}`);
              } else {
                console.log("Unknown gameMode format, defaulting to solo:", quizData.gameMode);
                gameModeSetting = 'solo';
              }
            } else {
              console.log("GameMode is undefined or null, defaulting to solo");
              gameModeSetting = 'solo';
            }
            
            // Set the final game mode with debugging info
            console.log("Final determined game mode:", gameModeSetting);
            setGameData({
              id: parseInt(quizData.id || (code || '0')),
              title: quizData.title || `Quiz ${code}`,
              description: quizData.description || "Quiz information",
              imageUrl: quizData.thumbnailUrl || 'https://source.unsplash.com/random/300x200?quiz',
              questions: quizData.questions || [],
              creator: quizData.createdBy || "Unknown",
              category: quizData.categoryId || 1,
              gameMode: gameModeSetting
            });
            
            // Set game mode in the state and store it in session storage for later use
            setGameMode(gameModeSetting);
            sessionStorage.setItem('gameMode', gameModeSetting);
            console.log("Game mode set and saved to session storage:", gameModeSetting);
            
            // If team mode, get teams using the updated service with /api/groups endpoint
            if (gameModeSetting === 'team') {
              try {
                console.log(`Fetching teams for quiz ID: ${quizData.id} using /api/groups endpoint`);
                
                // Get teams using updated service method
                const teamsResponse = await groupService.getGroupsByQuizId(parseInt(quizData.id));
                
                console.log("Teams response:", teamsResponse);
                
                if (teamsResponse && teamsResponse.data && Array.isArray(teamsResponse.data)) {
                  // Extract team names from the response
                  const teamNamesFromApi = teamsResponse.data.map((team: any) => team.name || `Team ${team.id}`);
                  
                  console.log("Setting team names:", teamNamesFromApi);
                  setTeamNames(teamNamesFromApi);
                  
                  // Also store in sessionStorage for future reference
                  sessionStorage.setItem(`quizTeams_${quizData.id}`, JSON.stringify(teamNamesFromApi));
                } else {
                  console.log("No valid teams returned, using defaults");
                  setTeamNames(DEFAULT_TEAM_NAMES);
                }
              } catch (teamsError) {
                console.error("Error fetching teams:", teamsError);
                setTeamNames(DEFAULT_TEAM_NAMES);
              }
            }
          } else {
            throw new Error("Invalid quiz data returned from API");
          }
        } catch (apiError) {
          console.error("Error fetching quiz:", apiError);
          setError('Failed to load game. Please check the game code and try again.');
        }
      } catch (err) {
        console.error("Error loading game:", err);
        setError('Failed to load game. Please check the game code and try again.');
      } finally {
        setLoading(false);
      }
    };

    loadGame();
  }, [code]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPlayerName(e.target.value);
    setNameError('');
  };

  const handleTeamChange = (event: SelectChangeEvent<string>) => {
    setSelectedTeam(event.target.value);
  };
  
  // Update the handleAnimalChange function
  const handleAnimalChange = (animal: string) => {
    // Ensure the animal is supported by react-animals
    const validAnimal = ANIMALS.includes(animal) ? animal : 'alligator';
    
    setSelectedAnimal(validAnimal);
    
    // Set the color from our animal color map
    setSelectedColor(animalColorMap[validAnimal as keyof typeof animalColorMap] || 'orange');
  };

  const handleStartGame = async () => {
    if (!gameData || !code) return;
    
    if (!playerName.trim()) {
      setNameError('Please enter your name to continue');
      return;
    }
    
    if (gameMode === 'team' && !selectedTeam) {
      setError('Please select a team before starting');
      return;
    }
    
    // Final check for known team mode quizzes before starting
    const knownTeamModeQuiz = shouldBeTeamMode(code);
    if (knownTeamModeQuiz && gameMode !== 'team') {
      console.log(`🔴 Correcting gameMode from ${gameMode} to 'team' for known team quiz ${code}`);
      setGameMode('team');
      // If we need to force team mode but no team is selected, select the first team
      if (!selectedTeam && teamNames.length > 0) {
        setSelectedTeam(teamNames[0]);
        console.log(`Auto-selecting team: ${teamNames[0]}`);
      }
    }
    
    setApiLoading(true);
    
    try {
      // Use a simple avatar format instead of the playerService format
      const avatarUrl = `simple://${selectedAnimal}/${selectedColor}`;
      
      // Save player information for session with proper avatar format
      const newPlayerInfo: PlayerInfo = {
        name: playerName,
        avatar: selectedAnimal,
        team: gameMode === 'team' ? selectedTeam : null,
        gameCode: code,
        joinTime: new Date().toISOString(),
        quizId: gameData.id
      };
      
      // Check if we've stored an updated player info with ID from previous API calls
      const existingPlayerInfoStr = sessionStorage.getItem('currentPlayer');
      if (existingPlayerInfoStr) {
        try {
          const existingPlayerInfo = JSON.parse(existingPlayerInfoStr) as PlayerInfo;
          if (existingPlayerInfo && existingPlayerInfo.id) {
            // Merge existing player ID with new info
            newPlayerInfo.id = existingPlayerInfo.id;
            newPlayerInfo.playerId = existingPlayerInfo.id;
            newPlayerInfo.playerCode = existingPlayerInfo.playerCode;
          }
        } catch (e) {
          console.error('Error parsing existing player info:', e);
        }
      }
      
      // Now save the full player info
      sessionStorage.setItem('currentPlayer', JSON.stringify(newPlayerInfo));
      // Store in localStorage too for backward compatibility
      localStorage.setItem('currentPlayer', JSON.stringify(newPlayerInfo));
      
      // IMPORTANT: Explicitly store the game mode with the correct value
      console.log("Saving gameMode to sessionStorage:", gameMode);
      sessionStorage.setItem('gameMode', gameMode);
      
      // In team mode, make sure to save the selected team
      if (gameMode === 'team' && selectedTeam) {
        console.log("Saving selectedTeam to sessionStorage:", selectedTeam);
        sessionStorage.setItem('selectedTeam', selectedTeam);
      }
      
      // Try to register player using playerService
      try {
        console.log("Creating player using playerService with gameMode:", gameMode);
        
        // Add team information to the player data for team mode games
        const playerData = playerService.formatPlayerData(
          playerName,
          gameData.id,
          selectedAnimal,
          selectedColor,
          user?.id ? parseInt(user.id) : 0,
          gameMode === 'team' ? selectedTeam : null // Pass team name directly
        );
        
        // Log full player data for debugging
        console.log("Formatted player data with team info:", playerData);
        
        // Create player in the backend
        const playerResponse = await playerService.createPlayer(playerData);
        
        if (playerResponse && playerResponse.data && playerResponse.data.id) {
          console.log("Player created successfully:", playerResponse);
          
          // Update player information with ID
          const playerInfoWithId = {
            ...newPlayerInfo,
            id: playerResponse.data.id,
            playerId: playerResponse.data.id,
            playerCode: playerResponse.data.playerCode || Math.floor(100000 + Math.random() * 900000)
          };
          
          // Save to sessionStorage
          sessionStorage.setItem('currentPlayer', JSON.stringify(playerInfoWithId));
          localStorage.setItem('currentPlayer', JSON.stringify(playerInfoWithId));
          
          // Double-check game mode is correctly saved
          sessionStorage.setItem('gameMode', gameMode);
          
          // When in team mode, store selected team in a dedicated key
          if (gameMode === 'team' && selectedTeam) {
            sessionStorage.setItem('selectedTeam', selectedTeam);
          }
          
          // Navigate directly to the game without trying the second approach
          router.push(`/game?code=${code}`);
          return; // Important: Exit the function here to prevent the second API call
        }
      } catch (playerError) {
        console.error("Error with player service:", playerError);
        // Continue to fallback approach
      }
      
      // Only proceed with direct API call if the service call failed
      try {
        // Direct API call implementation...
      } catch (directError) {
        console.error("Error with direct API approach:", directError);
      }
      
      // Navigate to game screen using the proper Quiz/QuizCode API endpoint
      try {
        // First, get the latest quiz data using the QuizCode endpoint
        const quizResponse = await axios.get(
          `https://kahootclone-f7hkd0hwafgbfrfa.southeastasia-01.azurewebsites.net/api/Quiz/QuizCode/${code}`
        ).catch(error => {
          console.error("Error retrieving quiz data for gameplay:", error);
          if (error.response) {
            console.error("Server response:", error.response.status, error.response.data);
          }
          throw new Error("Could not retrieve quiz data for gameplay");
        });

        if (!quizResponse || !quizResponse.data) {
          throw new Error("Could not retrieve quiz data for gameplay");
        }

        console.log("Retrieved latest quiz data for gameplay:", quizResponse.data);
        
        // Make sure the most updated player info is used (with ID from player creation if available)
        // Read the current player info again
        const finalPlayerInfo = JSON.parse(sessionStorage.getItem('currentPlayer') || '{}') as PlayerInfo;
        
        // Store the latest quiz data from the API response
        const quizData = quizResponse.data.data;
        if (quizData) {
          // Try to fetch questions separately using questionService
          let questions: Array<{
            id: string;
            question: string;
            options: string[];
            correctAnswer: number;
            timeLimit: number;
            points: number;
          }> = [];
          try {
            if (quizData.id) {
              console.log(`Fetching questions for quiz ID: ${quizData.id} using questionService`);
              const questionsResponse = await questionService.getQuestionsByQuizId(quizData.id);
              console.log("Questions API response:", questionsResponse);
              
              if (questionsResponse && questionsResponse.data && Array.isArray(questionsResponse.data)) {
                // Format the questions to match the expected format for gameplay
                questions = questionsResponse.data.map((q: any) => {
                  // Determine the correct answer index based on isCorrect value (which is 'A', 'B', 'C', or 'D')
                  const correctAnswerIndex = q.isCorrect ? 
                    q.isCorrect.charCodeAt(0) - 'A'.charCodeAt(0) : 0;
                  
                  return {
                    id: q.id.toString(),
                    question: q.text,
                    options: [q.optionA, q.optionB, q.optionC, q.optionD].filter(Boolean),
                    correctAnswer: correctAnswerIndex,
                    timeLimit: q.timeLimit || 30,
                    points: q.score || 100
                  };
                });
                console.log(`Fetched ${questions.length} questions for the quiz`);
              }
            }
          } catch (questionsError) {
            console.error("Error fetching questions:", questionsError);
          }
          
          // Very important: Ensure we use our own explicitly set gameMode, NOT the one from quizData.gameMode
          // This is to ensure team mode is correctly passed to the game page
          const gameplayData = {
            id: quizData.id,
            title: quizData.title,
            description: quizData.description,
            coverImage: quizData.thumbnailUrl || quizData.imageUrl,
            questions: questions.length > 0 ? questions : (quizData.questions || []),
            category: quizData.categoryId,
            isPublic: quizData.isPublic,
            gameMode: gameMode, // Use our state value which we've already processed
            quizCode: code
          };
          
          console.log("Final gameplay data with questions:", gameplayData);
          console.log("Final gameMode being saved in gameplay data:", gameMode);
          
          // Store in sessionStorage for the game page to use
          sessionStorage.setItem('quizPreviewData', JSON.stringify(gameplayData));
          sessionStorage.setItem('currentQuiz', JSON.stringify(gameplayData));
          sessionStorage.setItem('currentGameCode', code);
          
          // Explicitly store the game mode again to be absolutely sure
          console.log("Final gameMode being saved to sessionStorage:", gameMode);
          sessionStorage.setItem('gameMode', gameMode);
          
          // When in team mode, store selected team in a dedicated key
          if (gameMode === 'team' && selectedTeam) {
            console.log("Final selectedTeam being saved to sessionStorage:", selectedTeam);
            sessionStorage.setItem('selectedTeam', selectedTeam);
          }
          
          // Make sure the current player info is correctly saved for the game
          console.log("Final player info being saved:", finalPlayerInfo);
          sessionStorage.setItem('currentPlayer', JSON.stringify(finalPlayerInfo));
          
          console.log("Game data stored in sessionStorage, ready for gameplay");
          
          // Create a specific game key for this session
          const specificGameKey = `game_${code}`;
          sessionStorage.setItem(specificGameKey, JSON.stringify(gameplayData));
        }
        
        // Redirect to the new game page instead of play-quiz-preview
        router.push(`/game?code=${code}`);
      } catch (error) {
        console.error('Error preparing game data:', error);
        setError('Failed to prepare game data. Please try again.');
      }
    } catch (error) {
      console.error('Error joining game:', error);
      setError('Failed to join game. Please try again.');
    } finally {
      setApiLoading(false);
    }
  };

  if (loading) {
    return (
      <PublicLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress />
        </Box>
      </PublicLayout>
    );
  }

  if (error) {
    return (
      <PublicLayout>
        <Container maxWidth="sm" sx={{ py: 4 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
          <Button
            variant="contained"
            onClick={() => router.push('/')}
            startIcon={<PlayIcon />}
          >
            Back to Home
          </Button>
        </Container>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      {/* Debug banner - Only visible during development */}
      <Box sx={{ 
        p: 1.5,
        bgcolor: gameMode === 'team' ? 'success.main' : 'info.main', 
        color: 'white',
        textAlign: 'center',
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1.5
      }}>
        <Typography variant="body1">
          Current Game Mode: <span style={{ textDecoration: 'underline' }}>{gameMode}</span>
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.8 }}>
          Quiz ID: {gameData?.id || 'unknown'} | Code: {code}
        </Typography>
        {gameMode === 'team' && (
          <Chip 
            label={`${teamNames.length} Teams Available`} 
            color="warning" 
            size="small" 
            variant="outlined"
            sx={{ color: 'white', borderColor: 'white' }}
          />
        )}
      </Box>
      
      <Container maxWidth="md" sx={{ py: 4 }}>
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
              textAlign: 'center',
              background: 'linear-gradient(to right, rgba(224, 234, 252, 0.7), rgba(207, 222, 243, 0.7))',
            }}
          >
            <Typography variant="h4" sx={{ mb: 2, fontWeight: 'bold' }}>
              {gameData?.title || 'Loading...'}
            </Typography>
            
            {/* Game Mode Badge - Make it very visible */}
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              mb: 3 
            }}>
              <Paper
                elevation={3}
                sx={{ 
                  px: 3, 
                  py: 1.5, 
                  borderRadius: '20px',
                  background: gameMode === 'team' 
                    ? 'linear-gradient(45deg, #3f51b5 30%, #2196f3 90%)' 
                    : 'linear-gradient(45deg, #ff9800 30%, #f44336 90%)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                {gameMode === 'team' ? (
                  <GroupsIcon sx={{ color: 'white' }} />
                ) : (
                  <PersonIcon sx={{ color: 'white' }} />
                )}
                <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                  {gameMode === 'team' ? 'TEAM MODE' : 'SOLO MODE'}
                </Typography>
              </Paper>
            </Box>
            
            {gameData?.imageUrl && (
              <Box sx={{ maxWidth: 300, mx: 'auto', mb: 3, borderRadius: 2, overflow: 'hidden' }}>
                <img 
                  src={gameData.imageUrl} 
                  alt={gameData.title} 
                  style={{ width: '100%', height: 'auto' }} 
                />
              </Box>
            )}
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="body1" sx={{ mb: 2, fontStyle: 'italic', mx: 'auto', maxWidth: 600 }}>
                {gameData?.description || 'No description available'}
              </Typography>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 1, mb: 2 }}>
                <Chip 
                  icon={gameMode === 'solo' ? <PersonIcon /> : <GroupsIcon />}
                  label={gameMode === 'solo' ? "Solo Mode" : "Team Mode"}
                  color="primary"
                  variant="outlined"
                />
                
                <Chip 
                  label={`Game Code: ${code}`}
                  color="secondary"
                  variant="outlined"
                />
              </Box>
            </Box>
            
            <Typography variant="subtitle1" sx={{ mb: 3 }}>
              Created by: {gameData?.creator || 'Unknown'}
            </Typography>
            
            {/* Player Information Section */}
            <Box sx={{ mb: 4, maxWidth: 500, mx: 'auto' }}>
              <Typography variant="h6" gutterBottom>
                Join Game
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <PetsIcon sx={{ mr: 1, fontSize: '1rem' }} />
                  Choose Your Avatar
                </Typography>
                
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                  <Box sx={{ 
                    width: '120px', 
                    height: '120px', 
                    position: 'relative',
                    border: '3px solid white',
                    borderRadius: '50%',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    overflow: 'hidden',
                    backgroundColor: 'white'
                  }}>
                    <AnimalAvatar 
                      name={selectedAnimal}
                      color={selectedColor}
                    />
                  </Box>
                </Box>

                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <PetsIcon sx={{ mr: 1, fontSize: '0.8rem' }} color="primary" />
                    Animal Type
                  </Typography>
                  <Box sx={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))', 
                    gap: 1.5, 
                    justifyContent: 'center',
                    maxHeight: '220px',
                    overflow: 'auto',
                    p: 1.5,
                    backgroundColor: 'rgba(0,0,0,0.02)', 
                    borderRadius: 2
                  }}>
                    {ANIMALS.map(animal => {
                      // Get the color mapping for this animal
                      const animalColor = animalColorMap[animal as keyof typeof animalColorMap] || 'orange';
                      
                      return (
                        <Box
                          key={animal}
                          onClick={() => handleAnimalChange(animal)}
                          sx={{ 
                            p: 1, 
                            cursor: 'pointer',
                            border: selectedAnimal === animal ? '2px solid' : '2px solid transparent',
                            borderColor: selectedAnimal === animal ? 'primary.main' : 'transparent',
                            borderRadius: 2,
                            backgroundColor: selectedAnimal === animal 
                              ? 'rgba(33,150,243,0.15)'
                              : 'white',
                            '&:hover': {
                              backgroundColor: 'rgba(0,0,0,0.05)',
                              transform: 'translateY(-2px)',
                              transition: 'transform 0.2s ease-in-out',
                              boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                            },
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 0.5,
                            transition: 'all 0.2s ease-in-out',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                          }}
                        >
                          <Box sx={{ 
                            width: '50px', 
                            height: '50px', 
                            position: 'relative',
                            borderRadius: '50%',
                            overflow: 'hidden',
                            backgroundColor: 'white'
                          }}>
                            <Animal 
                              name={animal}
                              color={animalColor}
                              size="100%"
                            />
                          </Box>
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              textTransform: 'capitalize', 
                              fontWeight: selectedAnimal === animal ? 'bold' : 'normal',
                              fontSize: '0.7rem'
                            }}
                          >
                            {animal}
                          </Typography>
                        </Box>
                      );
                    })}
                  </Box>
                </Box>
              </Box>
              
              {/* Player Name Input */}
              <Box sx={{ mb: 3 }}>
                <TextField
                  fullWidth
                  label="Enter your name"
                  value={playerName}
                  onChange={handleNameChange}
                  error={!!nameError}
                  helperText={nameError}
                  variant="outlined"
                  InputProps={{
                    startAdornment: <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: 'background.paper',
                    }
                  }}
                />
              </Box>

              {/* Team Selection (Only shown for team mode) */}
              {gameMode === 'team' && (
                <Box sx={{ mb: 4 }}>
                  <Typography 
                    variant="h5" 
                    gutterBottom 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      color: 'primary.main',
                      fontWeight: 'bold',
                      justifyContent: 'center', 
                      mb: 2
                    }}
                  >
                    <GroupsIcon sx={{ mr: 1.5, fontSize: '1.8rem' }} />
                    Team Selection
                  </Typography>
                  
                  <Paper 
                    elevation={3} 
                    sx={{ 
                      p: 3, 
                      bgcolor: 'rgba(66, 165, 245, 0.08)', 
                      borderRadius: 3,
                      border: '1px solid rgba(66, 165, 245, 0.5)',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                    }}
                  >
                    <Typography 
                      variant="subtitle1" 
                      sx={{ 
                        mb: 2, 
                        textAlign: 'center', 
                        color: 'text.secondary',
                        fontStyle: 'italic'
                      }}
                    >
                      Choose your team to join this quiz in team mode
                    </Typography>
                    
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3, justifyContent: 'center' }}>
                      {teamNames.map((team, index) => (
                        <Paper
                          key={index}
                          sx={{
                            p: 2,
                            borderRadius: 2,
                            border: team === selectedTeam ? '2px solid' : '1px solid',
                            borderColor: team === selectedTeam ? 'primary.main' : 'rgba(0,0,0,0.1)', 
                            cursor: 'pointer',
                            width: 'calc(50% - 16px)',
                            bgcolor: team === selectedTeam ? 'rgba(33,150,243,0.1)' : 'white',
                            textAlign: 'center',
                            transition: 'all 0.2s ease',
                            transform: team === selectedTeam ? 'scale(1.03)' : 'scale(1)',
                            boxShadow: team === selectedTeam ? '0 5px 15px rgba(0,0,0,0.1)' : 'none',
                            '&:hover': {
                              bgcolor: 'rgba(33,150,243,0.05)',
                              borderColor: 'primary.main',
                              transform: 'translateY(-3px)',
                              boxShadow: '0 5px 15px rgba(0,0,0,0.1)'
                            }
                          }}
                          onClick={() => setSelectedTeam(team)}
                        >
                          <Avatar 
                            sx={{ 
                              width: 56, 
                              height: 56, 
                              margin: '0 auto 12px',
                              bgcolor: ['#f44336', '#2196f3', '#4caf50', '#ff9800'][index % 4],
                              boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                            }}
                          >
                            {team.charAt(0)}
                          </Avatar>
                          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                            {team}
                          </Typography>
                          {team === selectedTeam && (
                            <Chip 
                              size="small" 
                              label="Selected" 
                              color="primary" 
                              sx={{ mt: 1 }}
                            />
                          )}
                        </Paper>
                      ))}
                    </Box>
                    
                    <Typography variant="caption" sx={{ display: 'block', mt: 2, textAlign: 'center', color: 'text.secondary' }}>
                      In team mode, your score will contribute to your team's total. Teams compete against each other for the highest combined score.
                    </Typography>
                  </Paper>
                </Box>
              )}

              {/* Start Game Button */}
              <Button
                variant="contained"
                color="primary"
                fullWidth
                size="large"
                onClick={handleStartGame}
                disabled={apiLoading}
                startIcon={<PlayIcon />}
                sx={{
                  py: 1.5,
                  fontWeight: 'bold',
                  fontSize: '1.1rem',
                  boxShadow: 3,
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 5,
                  },
                  transition: 'all 0.2s',
                }}
              >
                {apiLoading ? 'Joining...' : 'Start Game'}
              </Button>
              
              {apiLoading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                  <CircularProgress size={24} />
                </Box>
              )}
              
              {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {error}
                </Alert>
              )}
            </Box>
          </Paper>
        </motion.div>
      </Container>
    </PublicLayout>
  );
}