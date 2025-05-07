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

// Add this function at the top to check if this quiz code exists in sessionStorage with a team mode
const getStoredGameModeForQuizCode = (quizCode: string | null): string | null => {
  if (!quizCode) return null;
  
  // Check if we have a stored game mode for this specific quiz code
  const storedQuizMode = sessionStorage.getItem(`quizMode_${quizCode}`);
  if (storedQuizMode) {
    console.log(`Found stored game mode for quiz ${quizCode}: ${storedQuizMode}`);
    return storedQuizMode;
  }
  
  return null;
};

// Manually override game mode for specific quiz codes
// This is a temporary fix for specific problematic quizzes
const forceTeamModeForQuiz = (quizCode: string | null): boolean => {
  if (!quizCode) return false;
  
  // Hard-coded list of quiz codes that should be in team mode
  const teamModeQuizzes = ['295753', '914882', '202', '197']; // Add your quiz codes here
  
  // Check if this quiz code is in our hard-coded list
  if (teamModeQuizzes.includes(quizCode)) {
    console.log(`Quiz ${quizCode} is in the force team mode list`);
    return true;
  }
  
  // Check if we have a JSON array of team mode quizzes in localStorage
  try {
    const storedTeamQuizzes = JSON.parse(localStorage.getItem('teamModeQuizzes') || '[]');
    if (Array.isArray(storedTeamQuizzes) && storedTeamQuizzes.includes(quizCode)) {
      console.log(`Quiz ${quizCode} found in teamModeQuizzes localStorage array`);
      return true;
    }
  } catch (e) {
    console.error('Error parsing teamModeQuizzes from localStorage:', e);
  }
  
  // Check for the simpler key-value flag
  if (localStorage.getItem(`quizIsTeamMode_${quizCode}`) === 'true') {
    console.log(`Quiz ${quizCode} has direct localStorage team mode flag`);
    return true;
  }
  
  // Also check sessionStorage for a stored mode
  const storedMode = getStoredGameModeForQuizCode(quizCode);
  if (storedMode === 'team') {
    console.log(`Quiz ${quizCode} has team mode stored in sessionStorage`);
    return true;
  }
  
  return false;
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

  const [navigationError, setNavigationError] = useState(false);
  const [showManualNavigation, setShowManualNavigation] = useState(false);

  useEffect(() => {
    const loadGame = async () => {
      try {
        setLoading(true);
        
        if (!code) {
          setError('No game code provided');
          setLoading(false);
          return;
        }

        console.log('⭐⭐⭐ DEBUG: Starting loadGame for quiz code:', code);
        
        // Log all session storage keys to help debugging
        if (typeof window !== 'undefined' && window.sessionStorage) {
          console.log('SESSION STORAGE DUMP:');
          for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            if (key) {
              try {
                const value = sessionStorage.getItem(key);
                console.log(`  ${key}: ${value}`);
              } catch (e) {
                console.log(`  ${key}: [Error reading value]`);
              }
            }
          }
          
          // Specifically check for quiz-specific mode
          const quizSpecificMode = sessionStorage.getItem(`quizMode_${code}`);
          console.log(`Quiz-specific mode for code ${code}: ${quizSpecificMode}`);
        }

        // First check if we have a specific stored game mode for this quiz code
        const specificQuizMode = getStoredGameModeForQuizCode(code);
        if (specificQuizMode) {
          console.log(`✅ Using stored game mode ${specificQuizMode} for quiz ${code}`);
          const normalizedMode = specificQuizMode.trim().toLowerCase() === 'team' ? 'team' : 'solo';
          setGameMode(normalizedMode as 'solo' | 'team');
          console.log(`Set game mode to: ${normalizedMode}`);
        }
        
        // Then check if this quiz code is known to need team mode
        const codeNeedsTeamMode = shouldBeTeamMode(code) || forceTeamModeForQuiz(code);
        if (codeNeedsTeamMode) {
          console.log(`🟢 Quiz ${code} needs team mode - will override API response`);
          setGameMode('team');
          
          // Save this decision to sessionStorage for consistency
          sessionStorage.setItem('gameMode', 'team');
          sessionStorage.setItem(`quizMode_${code}`, 'team');
          console.log('Saved team mode to sessionStorage');
        }

        // Call the API to get quiz by code using service
        try {
          console.log(`Fetching quiz data for code ${code} from API`);
          
          // Get quiz data from API
          const quizResponse = await quizService.getQuizByCode(code);
          
          if (quizResponse && quizResponse.status === 200 && quizResponse.data) {
            console.log('API returned quiz data successfully:', quizResponse.data);
            
            const quizData = quizResponse.data;
            
            // Determine the game mode - start with checking if we already decided it should be team mode
            let gameModeSetting: 'solo' | 'team';
            
            // First check if we've already determined this quiz needs team mode
            if (codeNeedsTeamMode || gameMode === 'team') {
              gameModeSetting = 'team';
              console.log('💪 Using team mode from earlier determination');
            } 
            // Then check if the quiz-specific mode is stored in sessionStorage
            else if (specificQuizMode === 'team') {
              gameModeSetting = 'team'; 
              console.log('🔵 Using team mode from quiz-specific sessionStorage');
            }
            // Check the general gameMode in sessionStorage
            else if (sessionStorage.getItem('gameMode') === 'team') {
              gameModeSetting = 'team';
              console.log('🔷 Using team mode from general sessionStorage');
            }
            // Only process the API game mode if we haven't already determined it should be team mode
            else {
              // Process API response gameMode
              console.log("Processing API response gameMode:", quizData.gameMode, typeof quizData.gameMode);
              
              const gmType = typeof quizData.gameMode;
              if (gmType === 'string') {
                // Normalize string value with more detailed logging
                const gameModeStr = String(quizData.gameMode).trim().toLowerCase();
                console.log(`String gameMode normalized: "${gameModeStr}"`);
                
                // Match any string variation of team mode
                if (gameModeStr === 'team' || gameModeStr === '1' || gameModeStr === 'true' || gameModeStr === 'group') {
                  gameModeSetting = 'team';
                  console.log('🟩 API string indicates team mode');
                } else {
                  gameModeSetting = 'solo';
                  console.log('API string indicates solo mode');
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
                console.log("Unknown gameMode format, checking additional sources:", quizData.gameMode);
                
                // One last check for properties that might indicate team mode
                if (quizData.teamCount && quizData.teamCount > 0) {
                  console.log(`🟢 Found teamCount=${quizData.teamCount}, using team mode`);
                  gameModeSetting = 'team';
                } else {
                  gameModeSetting = 'solo';
                  console.log("Defaulting to solo mode after all checks");
                }
              }
            }
            
            // Set the final game mode with debugging info
            console.log("Final determined game mode:", gameModeSetting);
            setGameData({
              id: parseInt(quizData.id || (code || '0')),
              title: quizData.title || `Quiz ${code}`,
              description: quizData.description || "Quiz information",
              imageUrl: quizData.thumbnailUrl || 'https://wallpaperaccess.com/full/5720035.jpg',
              questions: quizData.questions || [],
              creator: quizData.createdBy || "Unknown",
              category: quizData.categoryId || 1,
              gameMode: gameModeSetting
            });
            
            // Set game mode in the state and store it in session storage for later use
            setGameMode(gameModeSetting);
            sessionStorage.setItem('gameMode', gameModeSetting);
            // Also save specifically for this quiz code
            sessionStorage.setItem(`quizMode_${code}`, gameModeSetting);
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
    if (!playerName.trim()) {
      setNameError('Please enter your name');
      return;
    }
    
    setApiLoading(true);
    setNavigationError(false); // Reset navigation error state
    
    try {
      if (!code) {
        throw new Error('Quiz code is missing');
      }

      // 1. Build player data according to the API's expected format
      const playerData: PlayerInfo = {
        name: playerName,
        avatar: selectedAnimal,
        team: gameMode === 'team' ? selectedTeam : null,
        gameCode: code,
        joinTime: new Date().toISOString()
      };

      console.log('Joining quiz with player data:', playerData);
      
      // 2. Import required services
      const quizService = (await import('@/services/quizService')).default;
      
      // 3. Call the API to register player - This is the MAIN way to join
      let playerId = 0;
      try {
        console.log(`Calling API to join quiz with code ${code}...`);
        // Format player data for API request
        const apiPlayerData = {
          Id: 0,
          NickName: playerName,
          AvatarUrl: selectedAnimal,
          GroupId: null,
          GroupName: gameMode === 'team' ? selectedTeam : null,
          GroupDescription: null
        };

        // If team mode and selectedTeam is provided
        if (gameMode === 'team' && selectedTeam) {
          console.log(`Using team name: ${selectedTeam} for registration`);
          apiPlayerData.GroupName = selectedTeam;
        }

        // Call the API to register player
        const response = await quizService.joinQuiz(code, apiPlayerData);
        console.log('Join API response:', response);
        
        if (response && response.data) {
          playerId = response.data.playerId || 0;
          console.log(`Player registered with ID: ${playerId}`);
          
          // Update player data with ID from response
          playerData.id = playerId;
          playerData.playerId = playerId;
        }
        
        // API call successful - proceed
      } catch (apiError) {
        console.error('Error registering player via API:', apiError);
        throw new Error(`Failed to join game: ${apiError instanceof Error ? apiError.message : 'API error'}`);
      }
      
      // 4. Store player data in session storage for later use
      try {
        playerData.playerId = playerId; // Ensure playerId is set
        sessionStorage.setItem('currentPlayerName', playerName);
        sessionStorage.setItem('currentPlayerAvatar', selectedAnimal);
        sessionStorage.setItem('currentPlayer', JSON.stringify(playerData));
        if (gameMode === 'team') {
          sessionStorage.setItem('currentTeam', selectedTeam);
        }
        console.log('Stored player data:', playerData);
      } catch (storageError) {
        console.error('Error storing player data:', storageError);
        // Non-critical error, continue
      }
      
      // 5. Try SignalR connection in the background without waiting
      // This prevents blocking the user flow if SignalR fails
      setTimeout(async () => {
        try {
          console.log('Attempting optional SignalR connection...');
          const signalRService = (await import('@/services/signalRService')).default;
          
          // Format player data for SignalR
          const signalRPlayerData = {
            Id: playerId,
            NickName: playerName,
            AvatarUrl: selectedAnimal,
            GroupId: null,
            GroupName: gameMode === 'team' ? selectedTeam : null,
            GroupDescription: null
          };
          
          // Try SignalR connection with timeout
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('SignalR connection timeout')), 5000);
          });
          
          // Connect to SignalR if not already connected
          const connectionPromise = (async () => {
            if (!signalRService.isConnected()) {
              console.log('Connecting to SignalR...');
              await signalRService.startConnection();
              console.log('SignalR connection established');
            }
            
            // Join the quiz room via SignalR
            console.log(`Joining quiz ${code} via SignalR...`);
            await signalRService.joinQuiz(code, signalRPlayerData);
            console.log('Successfully joined quiz via SignalR');
          })();
          
          // Race with timeout
          await Promise.race([connectionPromise, timeoutPromise]);
        } catch (signalRError) {
          console.error('SignalR connection failed, but proceeding anyway:', signalRError);
          // Non-blocking error, player will still be in the game via REST API
        }
      }, 100);
      
      // 6. Navigate to player waiting room
      // Don't wait for SignalR, API join is sufficient
      const waitingRoomUrl = `/play-game/player?code=${code}&name=${encodeURIComponent(playerName)}&avatar=${selectedAnimal}`;
      console.log('Navigating to:', waitingRoomUrl);
      
      // Navigate immediately
      try {
        router.push(waitingRoomUrl);
        console.log('Navigation initiated');
      } catch (navError) {
        console.error('Navigation error:', navError);
        // Set error state to show manual navigation option
        setNavigationError(true);
        
        // Fallback: Try direct navigation if router fails
        window.location.href = waitingRoomUrl;
      }
      
      // After a short delay, if we're still on this page, show manual navigation option
      setTimeout(() => {
        setShowManualNavigation(true);
      }, 3000);
      
    } catch (error: any) {
      console.error('Error joining game:', error);
      setError(`Failed to join the game: ${error.message || 'Unknown error'}. Please try again.`);
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
                {apiLoading ? 'Joining...' : 'Join Game'}
              </Button>
              
              {/* Manual navigation link if automatic navigation fails */}
              {(navigationError || showManualNavigation) && (
                <Box sx={{ mt: 3, p: 2, bgcolor: 'rgba(0,0,0,0.03)', borderRadius: 2 }}>
                  <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary' }}>
                    If you're not automatically redirected, please click the button below:
                  </Typography>
                  <Button
                    variant="outlined"
                    color="primary"
                    fullWidth
                    href={`/play-game/player?code=${code}&name=${encodeURIComponent(playerName)}&avatar=${selectedAnimal}`}
                    sx={{ mt: 1 }}
                  >
                    Continue to Waiting Room
                  </Button>
                </Box>
              )}
              
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