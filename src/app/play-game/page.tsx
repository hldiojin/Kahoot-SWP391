'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  Pets as PetsIcon,
  People as PeopleIcon
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
  avatarUrl?: string;
  team: string | null;
  gameCode: string;
  joinTime: string;
  id?: number;
  playerId?: number;
  playerCode?: number;
  quizId?: number;
  groupName?: string | null;
  GroupName?: string | null;
  GroupDescription?: string | null;
  groupDescription?: string | null;
  GroupId?: number | null;
  groupId?: number | null;
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

  // Debounce timer for player creation
  const playerCreationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [playerCreated, setPlayerCreated] = useState(false);

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

        // First check if the quiz code is valid
        console.log(`Validating quiz code ${code} before proceeding`);
        let quizCodeCheck = await quizService.checkQuizCode(code);
        console.log('Quiz code check result:', quizCodeCheck);
        
        // If the quiz code is invalid, try fallback check
        if (quizCodeCheck.status === 404 || quizCodeCheck.status === 400) {
          console.log('Initial quiz code check failed, trying fallback...');
          quizCodeCheck = await quizService.fallbackCheckQuizCode(code);
          console.log('Fallback check result:', quizCodeCheck);
        }
        
        // If still invalid after fallback, show error
        if (quizCodeCheck.status === 404 || quizCodeCheck.status === 400) {
          console.error('Invalid quiz code after fallback check:', quizCodeCheck);
          setError(`Quiz not found with code ${code}. Please check the code and try again.`);
          setLoading(false);
          return;
        }

        // Call the API to get quiz by code using service
        try {
          console.log(`Fetching quiz data for code ${code} from API`);
          
          // Use the quiz data from the checkQuizCode response if available
          let quizData;
          if (quizCodeCheck.data && (quizCodeCheck.data.id || quizCodeCheck.data.title)) {
            console.log('Using quiz data from code check response');
            quizData = quizCodeCheck.data;
          } else {
            // Otherwise fetch from API
            console.log('Fetching complete quiz data from API');
          const quizResponse = await quizService.getQuizByCode(code);
          
          if (quizResponse && quizResponse.status === 200 && quizResponse.data) {
            console.log('API returned quiz data successfully:', quizResponse.data);
              quizData = quizResponse.data;
            } else {
              throw new Error('Failed to get quiz data');
            }
          }
            
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
    const newName = e.target.value;
    setPlayerName(newName);
    setNameError('');
    
    // Clear any existing timer to avoid multiple API calls
    if (playerCreationTimerRef.current) {
      clearTimeout(playerCreationTimerRef.current);
      playerCreationTimerRef.current = null;
    }
    
    // Only attempt player creation if we have a name with sufficient length
    // and we haven't already created a player
    if (newName && newName.trim().length >= 2 && selectedAnimal && code && !playerCreated) {
      // Set a debounce timer of 1 second to wait for user to finish typing
      playerCreationTimerRef.current = setTimeout(() => {
        console.log(`Debounce timer complete - creating player for: ${newName}`);
        createPlayerInBackground(newName);
      }, 1000); // 1 second debounce
    }
  };
  
  // Helper function to create a player in the background - we'll just log a message for now
  const createPlayerInBackground = (name: string) => {
    console.log(`[DEBUG] Would create player with name: ${name} and avatar: ${selectedAnimal}`);
    console.log('Skipping early player creation and focusing on createPlayer during join');
    setPlayerCreated(true); // Mark as created to prevent duplicate attempts
  };

  const handleTeamChange = (event: SelectChangeEvent<string>) => {
    setSelectedTeam(event.target.value);
  };
  
  // Update the handleAnimalChange function
  const handleAnimalChange = async (animal: string) => {
    // Ensure the animal is supported by react-animals
    const validAnimal = ANIMALS.includes(animal) ? animal : 'alligator';
    
    setSelectedAnimal(validAnimal);
    
    // Set the color from our animal color map
    setSelectedColor(animalColorMap[validAnimal as keyof typeof animalColorMap] || 'orange');
    
    // Only attempt to create a player if we have a name and haven't created one already
    if (playerName && playerName.trim().length >= 2 && code && !playerCreated) {
      // Create the player right away after avatar is selected (no debounce needed)
      createPlayerInBackground(playerName);
    }
  };

  // Add this function to directly call the SignalR service for team mode players
  const directSignalRNotify = async (code: string, playerData: any) => {
    try {
      console.log('Attempting direct SignalR notification for team player...');
      const signalRService = (await import('@/services/signalRService')).default;
      
      if (!signalRService.isConnected()) {
        await signalRService.startConnection();
      }
      
      // Try to broadcast player join directly
      await signalRService.broadcastPlayerJoin(code, playerData);
      console.log('Direct SignalR notification completed');
    } catch (err) {
      console.error('Direct SignalR notification failed:', err);
    }
  };

  // Add this alternative direct join method for team mode
  const directJoinTeamModeQuiz = async (quizId: number, playerId: number, teamName: string): Promise<void> => {
    try {
      console.log(`Using direct API call to join team mode quiz: QuizId=${quizId}, PlayerId=${playerId}, Team=${teamName}`);
      
      // Check if we've already joined this team
      const joinKey = `joined_team_${playerId}_${teamName}`;
      const alreadyJoined = sessionStorage.getItem(joinKey);
      
      if (alreadyJoined) {
        console.log(`Player ${playerId} has already joined team ${teamName}, skipping duplicate direct join`);
        return;
      }
      
      // Get QuizService
      const quizService = (await import('@/services/quizService')).default;
      
      // Try joining the quiz with explicit team information
      const joinResult = await quizService.joinQuizWithTeam(
        quizId, 
        playerId, 
        teamName, 
        {
          name: playerName,
          avatar: selectedAnimal,
          team: teamName
        }
      );
      
      // Mark this player as having joined this team
      sessionStorage.setItem(joinKey, 'true');
      
      console.log('Direct team mode join result:', joinResult);
    } catch (err) {
      console.warn('Direct team mode join failed:', err);
    }
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

      // Check if we're in team mode and have a team selected
      if (gameMode === 'team' && !selectedTeam) {
        setError('Please select a team to join');
        setApiLoading(false);
        return;
      }

      // Log team mode status
      if (gameMode === 'team') {
        console.log(`🟢 TEAM MODE: Player ${playerName} is joining team ${selectedTeam}`);
        
        // Store quiz as team mode in multiple locations for redundancy
        try {
          // Session storage team mode flags
          sessionStorage.setItem('gameMode', 'team');
          sessionStorage.setItem(`quizMode_${code}`, 'team');
          
          // Local storage team mode flags
          localStorage.setItem(`quizIsTeamMode_${code}`, 'true');
          
          const teamModeQuizzes = JSON.parse(localStorage.getItem('teamModeQuizzes') || '[]');
          if (!teamModeQuizzes.includes(code)) {
            teamModeQuizzes.push(code);
            localStorage.setItem('teamModeQuizzes', JSON.stringify(teamModeQuizzes));
          }
          
          console.log('Saved team mode flags to storage');
        } catch (storageErr) {
          console.warn('Error saving team mode flags:', storageErr);
        }
      }

      // 1. Build player data according to the API's expected format
      const playerData: PlayerInfo = {
        name: playerName,
        avatar: selectedAnimal,
        avatarUrl: `simple://${selectedAnimal}/${animalColorMap[selectedAnimal as keyof typeof animalColorMap] || 'orange'}`, // Use a proper avatar URL format
        team: gameMode === 'team' ? selectedTeam : null,
        groupName: gameMode === 'team' ? selectedTeam : null, // Add groupName for compatibility
        GroupName: gameMode === 'team' ? selectedTeam : null, // Add GroupName for SignalR format
        GroupDescription: gameMode === 'team' ? `Team for ${playerName}` : null, // Add GroupDescription for SignalR format
        groupDescription: gameMode === 'team' ? `Team for ${playerName}` : null, // Add groupDescription for compatibility
        GroupId: null, // Will be set after finding the group ID
        groupId: null, // Will be set after finding the group ID
        gameCode: code,
        joinTime: new Date().toISOString()
      };

      console.log('Joining quiz with player data:', playerData);
      
      // 2. Get the quizId from gameData or sessionStorage
      let quizId: number | null = null;
      if (gameData && gameData.id) {
        quizId = gameData.id;
      } else {
        // Try to get quizId from sessionStorage
        const quizDataStr = sessionStorage.getItem('currentQuiz');
        if (quizDataStr) {
          try {
            const quizData = JSON.parse(quizDataStr);
            if (quizData && quizData.id) {
              quizId = parseInt(quizData.id);
            }
          } catch (e) {
            console.error('Error parsing quiz data from sessionStorage:', e);
          }
        }
      }
      
      console.log(`Using quiz ID: ${quizId || 'unknown'} for player creation`);
      
      // 3. Create player using direct API call
      let playerId = 0;
      let playerCreationSuccess = false;
      
      if (quizId) {
        try {
          // Format player data using the exact API format
          const playerApiData = {
            playerId: 0,
            nickname: playerName.trim(),
            avatarUrl: `simple://${selectedAnimal}/${animalColorMap[selectedAnimal as keyof typeof animalColorMap] || 'orange'}`,
            score: 0,
            quizId: quizId,
            // Add team information for API
            groupName: gameMode === 'team' ? selectedTeam : null,
            team: gameMode === 'team' ? selectedTeam : null,
            GroupName: gameMode === 'team' ? selectedTeam : null,
            GroupDescription: gameMode === 'team' ? `Team for ${playerName.trim()}` : null,
            groupDescription: gameMode === 'team' ? `Team for ${playerName.trim()}` : null,
            GroupId: null, // Will be set later if we find a group ID
            groupId: null  // Will be set later if we find a group ID
          };
          
          console.log('Creating player with data:', playerApiData);
          
          // Create player using direct API call
          const API_BASE_URL = 'https://kahootclone-f7hkd0hwafgbfrfa.southeastasia-01.azurewebsites.net';
          const response = await axios.post(
            `${API_BASE_URL}/api/Player`, 
            playerApiData,
            {
              headers: {
                'Content-Type': 'application/json'
              }
            }
          );
          
          console.log('Player creation response:', response.data);
          playerCreationSuccess = true;
          
          // Extract player ID from response
          if (typeof response.data === 'object') {
            if (response.data.playerId) {
              playerId = response.data.playerId;
            } else if (response.data.id) {
              playerId = response.data.id;
            } else if (response.data.data && (response.data.data.playerId || response.data.data.id)) {
              playerId = response.data.data.playerId || response.data.data.id;
            }
          } else if (typeof response.data === 'number') {
            playerId = response.data;
          }
          
          if (playerId) {
            console.log(`Player created with ID: ${playerId}`);
          
            // Update player data with ID
            playerData.id = playerId;
            playerData.playerId = playerId;
            playerData.avatarUrl = playerApiData.avatarUrl;
            playerData.quizId = quizId;
          }
        } catch (error: any) {
          console.error('Error creating player:', error);
          
          if (error.response) {
            console.error('API error response:', error.response.data);
          }
          
          // Continue anyway to show the waiting room
          console.warn('Player creation failed, continuing to waiting room with fallback data');
          
          // Generate a temporary player ID for UI consistency
          playerId = Date.now(); // Use timestamp as a temporary unique ID
          playerData.id = playerId;
          playerData.playerId = playerId;
        }
      } else {
        console.warn('No valid quizId found for player creation');
        // Generate a temporary player ID for UI consistency
        playerId = Date.now();
        playerData.id = playerId;
        playerData.playerId = playerId;
      }
      
      // Try to connect using SignalR for team mode (with more aggressive fallback)
      let signalRConnected = false;
      
      if (gameMode === 'team' && selectedTeam && playerId > 0) {
        // Prepare team player data with all required fields for backend
        const teamPlayerData = {
          id: playerId,
          playerId: playerId,
          nickName: playerName,
          name: playerName,
          avatarUrl: playerData.avatarUrl,
          AvatarUrl: playerData.avatarUrl,
          avatar: selectedAnimal,
          // Team-specific fields required by backend C# code
          GroupId: null as number | null,
          GroupName: selectedTeam,
          groupName: selectedTeam,
          GroupDescription: `Team for ${playerName}`,
          groupDescription: `Team for ${playerName}`,
          team: selectedTeam,
          teamName: selectedTeam,
          quizId: quizId,
          gameCode: code
        };
        
        // Try to connect with SignalR but don't wait too long (max 3 seconds)
        let signalRComplete = false;
        
        setTimeout(() => {
          if (!signalRComplete) {
            console.warn('SignalR connection attempt timed out after 3 seconds, continuing with local storage fallback');
            signalRComplete = true;
          }
        }, 3000);
        
        try {
          console.log('Setting up SignalR connection for team player...');
          const signalRService = (await import('@/services/signalRService')).default;
          
          const connectionPromise = new Promise<void>(async (resolve) => {
            try {
              if (!signalRService.isConnected()) {
                await signalRService.safeStartConnection();
                console.log('Successfully connected to SignalR');
              }
              
              // First connect to SignalR
              await signalRService.joinQuiz(code, teamPlayerData);
              console.log('Player connected to SignalR hub');
              
              // Log player join info
              signalRService.logPlayerJoin(code, teamPlayerData);
              console.log('Player join logged in SignalR service');
              
              signalRConnected = true;
              resolve();
            } catch (err) {
              console.error('SignalR connection failed:', err);
              resolve(); // Resolve anyway to continue
            }
          });
          
          // Wait for connection with timeout
          const timeoutPromise = new Promise<void>((resolve) => {
            setTimeout(() => {
              resolve();
            }, 3000); // 3 second timeout
          });
          
          // Race the promises
          await Promise.race([connectionPromise, timeoutPromise]);
          signalRComplete = true;
        } catch (err) {
          console.error('SignalR service error:', err);
          signalRComplete = true;
        }
        
        const alreadyJoinedTeam = sessionStorage.getItem(`joined_team_${playerId}_${selectedTeam}`);
        
        if (!alreadyJoinedTeam) {
          try {
            console.log(`Adding player ${playerId} to team ${selectedTeam} for quiz ${quizId}`);
            const groupService = (await import('@/services/groupService')).default;
            
            const groupId = await groupService.findGroupIdByName(quizId!, selectedTeam);
            
            if (groupId) {
              console.log(`Found group ID ${groupId} for team ${selectedTeam}`);
              
              const joinResult = await groupService.joinGroup(groupId, playerId);
              console.log('Successfully joined team:', joinResult);
              
              sessionStorage.setItem('currentGroupId', groupId.toString());
              sessionStorage.setItem(`player_${playerId}_groupId`, groupId.toString());
              
              sessionStorage.setItem(`joined_team_${playerId}_${selectedTeam}`, 'true');
              
              teamPlayerData.GroupId = groupId;
              
              playerData.groupId = groupId;
              playerData.GroupId = groupId;
            } else {
              console.error(`Could not find group ID for team ${selectedTeam}`);
            }
          } catch (groupError) {
            console.error('Error adding player to team:', groupError);
            // Continue anyway - this is not critical for UI flow
          }
        } else {
          console.log(`Player ${playerId} has already joined team ${selectedTeam}, skipping API call`);
          
          // Try to get the group ID from session storage if available
          const groupId = sessionStorage.getItem('currentGroupId') || sessionStorage.getItem(`player_${playerId}_groupId`);
          if (groupId) {
            teamPlayerData.GroupId = parseInt(groupId);
            
            // Update original playerData to include groupId
            playerData.groupId = parseInt(groupId);
            playerData.GroupId = parseInt(groupId);
          }
        }
      }
      
      // Store data in session/local storage for redundancy
      try {
        // Get the group ID from session storage if available
        const groupId = gameMode === 'team' ? 
          (sessionStorage.getItem('currentGroupId') ? 
            parseInt(sessionStorage.getItem('currentGroupId')!) : null) : 
          null;
        
        // Save player data under multiple keys for redundancy
        const storagePlayerData = {
          playerId: playerId,
          id: playerId,
          nickname: playerName,
          name: playerName,
          nickName: playerName,
          NickName: playerName,
          avatarUrl: playerData.avatarUrl,
          AvatarUrl: playerData.avatarUrl,
          avatar: selectedAnimal,
          score: 0,
          quizId: quizId,
          teamName: gameMode === 'team' ? selectedTeam : null,
          groupName: gameMode === 'team' ? selectedTeam : null,
          GroupName: gameMode === 'team' ? selectedTeam : null,
          GroupDescription: gameMode === 'team' ? `Team for ${playerName}` : null,
          groupDescription: gameMode === 'team' ? `Team for ${playerName}` : null,
          GroupId: gameMode === 'team' ? groupId : null,
          groupId: gameMode === 'team' ? groupId : null,
          team: gameMode === 'team' ? selectedTeam : null,
          gameCode: code,
          joinTime: new Date().toISOString()
        };
        
        // Store under multiple keys for redundancy
        sessionStorage.setItem('currentPlayerName', playerName);
        sessionStorage.setItem('currentPlayerAvatar', selectedAnimal);
        sessionStorage.setItem('currentPlayer', JSON.stringify(storagePlayerData));
        sessionStorage.setItem(`player_${playerId}`, JSON.stringify(storagePlayerData));
        sessionStorage.setItem(`player_${code}_${playerId}`, JSON.stringify(storagePlayerData));
        
        // Also save game mode and team information to sessionStorage
        sessionStorage.setItem('gameMode', gameMode);
        if (gameMode === 'team') {
          sessionStorage.setItem('currentTeam', selectedTeam);
          console.log(`Saved team information to sessionStorage: ${selectedTeam}`);
          
          // Add to joined players list for quiz
          const joinedPlayersKey = `joined_players_${quizId}`;
          let joinedPlayers = [];
          try {
            const existing = sessionStorage.getItem(joinedPlayersKey);
            if (existing) {
              joinedPlayers = JSON.parse(existing);
            }
          } catch (e) {
            console.warn('Error parsing joined players:', e);
          }
          
          // Add player if not already in list
          const exists = joinedPlayers.some((p: any) => 
            p.id === playerId || p.Id === playerId || 
            p.playerId === playerId ||
            (p.nickName === playerName || p.NickName === playerName)
          );
          
          if (!exists) {
            joinedPlayers.push(storagePlayerData);
            sessionStorage.setItem(joinedPlayersKey, JSON.stringify(joinedPlayers));
            console.log('Added player to joined players list for host to find');
          }
          
          // Also add to team-specific list
          let teamPlayers = [];
          const teamPlayersKey = `team_players_${selectedTeam}`;
          try {
            const existing = sessionStorage.getItem(teamPlayersKey);
            if (existing) {
              teamPlayers = JSON.parse(existing);
            }
          } catch (err) {
            console.warn('Error parsing team players:', err);
          }
          
          // Add to team list if not already there
          const existsInTeam = teamPlayers.some((p: any) => 
            p.id === playerId || p.Id === playerId || 
            p.playerId === playerId ||
            (p.nickName === playerName || p.NickName === playerName)
          );
          
          if (!existsInTeam) {
            teamPlayers.push(storagePlayerData);
            sessionStorage.setItem(teamPlayersKey, JSON.stringify(teamPlayers));
            console.log(`Added player to team ${selectedTeam} players list`);
          }
          
          // Add to global players list
          const globalPlayersKey = `joined_players_all`;
          let globalPlayers = [];
          try {
            const existing = sessionStorage.getItem(globalPlayersKey);
            if (existing) {
              globalPlayers = JSON.parse(existing);
            }
          } catch (err) {
            console.warn('Error parsing global players:', err);
          }
          
          // Add to global list if not already there
          const existsInGlobal = globalPlayers.some((p: any) => 
            p.id === playerId || p.Id === playerId || 
            p.playerId === playerId ||
            (p.nickName === playerName || p.NickName === playerName)
          );
          
          if (!existsInGlobal) {
            globalPlayers.push(storagePlayerData);
            sessionStorage.setItem(globalPlayersKey, JSON.stringify(globalPlayers));
            console.log('Added player to global players list');
          }
        }
        
        console.log('Stored player data:', storagePlayerData);
      } catch (storageError) {
        console.error('Error storing player data:', storageError);
        // Non-critical error, continue
      }
      
      // 7. Navigate to player waiting room with team info if in team mode
      let waitingRoomUrl = `/play-game/player?code=${code}&name=${encodeURIComponent(playerName)}&avatar=${selectedAnimal}`;
      
      // Add team parameter if in team mode
      if (gameMode === 'team' && selectedTeam) {
        waitingRoomUrl += `&team=${encodeURIComponent(selectedTeam)}`;
        
        // Add group ID if available
        const groupId = sessionStorage.getItem('currentGroupId');
        if (groupId) {
          waitingRoomUrl += `&groupId=${groupId}`;
        }
      }
      
      // Add player ID parameter if available
      if (playerId) {
        waitingRoomUrl += `&playerId=${playerId}`;
      }
      
      // Also add a timestamp to prevent caching issues
      waitingRoomUrl += `&t=${Date.now()}`;
      
      console.log('Navigating to:', waitingRoomUrl);
      
      // For team mode, we need to manually force a redirect due to router issues
      if (gameMode === 'team') {
        try {
          console.log('Using direct navigation for team mode');
          window.location.href = waitingRoomUrl;
          return; // End function early to avoid double navigation
        } catch (directNavError) {
          console.error('Direct navigation failed:', directNavError);
          // Continue with normal router navigation as fallback
        }
      }
      
      // Navigate using the router for non-team mode or as fallback
      try {
        router.push(waitingRoomUrl);
        console.log('Navigation initiated via router');
      } catch (navError) {
        console.error('Navigation error:', navError);
        // Set error state to show manual navigation option
        setNavigationError(true);
        
        // Fallback: Try direct navigation if router fails
        setTimeout(() => {
          window.location.href = waitingRoomUrl;
        }, 500);
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

  // Add this function after handleStartGame to specifically help with PlayerAnswer submissions
  const submitAnswerWithoutTracking = async (playerId: number, questionId: number, isCorrect: boolean, responseTime: number, answer: string) => {
    try {
      console.log(`🔹 Submitting answer without entity tracking for player ${playerId}`);
      
      // Define the API base URL
      const API_BASE_URL = 'https://kahootclone-f7hkd0hwafgbfrfa.southeastasia-01.azurewebsites.net';
      
      // APPROACH 1: Use URL parameters with empty body to avoid entity tracking
      try {
        const params = new URLSearchParams({
          playerId: playerId.toString(),
          questionId: questionId.toString(),
          isCorrect: isCorrect.toString(),
          responseTime: responseTime.toString(),
          answer: answer,
          timestamp: Date.now().toString()
        }).toString();
        
        const response = await axios.post(
          `${API_BASE_URL}/api/Player/${playerId}/answer/${questionId}`,
          {
            answer: answer,
            isCorrect: isCorrect,
            responseTime: responseTime,
            timestamp: Date.now()
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            }
          }
        );
        
        console.log('✅ Answer submitted with URL parameters approach');
        return response.data;
      } catch (error1) {
        console.warn('URL parameter approach failed, trying alternate endpoint');
        
        // APPROACH 2: Try player-specific endpoint
        try {
          const response = await axios.post(
            `${API_BASE_URL}/api/Player/${playerId}/answer/${questionId}`,
            {
              answer: answer,
              isCorrect: isCorrect,
              responseTime: responseTime,
              timestamp: Date.now()
            },
            {
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              }
            }
          );
          
          console.log('✅ Answer submitted with player-specific endpoint');
          return response.data;
        } catch (error2) {
          console.warn('Player endpoint failed, trying direct POST without ID');
          
          // APPROACH 3: Try direct POST without ID field
          try {
            const response = await axios.post(
              `${API_BASE_URL}/api/PlayerAnswer`,
              {
                // The API expects this exact format - NO id field to avoid entity tracking issues
                playerId: playerId,
                questionId: questionId,
                answeredAt: new Date().toISOString(),
                isCorrect: isCorrect,
                responseTime: responseTime,
                answer: answer
                // Do not include score in this request, it's calculated by the backend
              },
              {
                headers: {
                  'Content-Type': 'application/json',
                  'Accept': 'application/json'
                }
              }
            );
            
            console.log('✅ Answer submitted with direct POST without ID');
            return response.data;
          } catch (error3) {
            console.error('All API approaches failed, storing locally');
            
            // Store answer locally as fallback
            try {
              const storedAnswers = localStorage.getItem('playerAnswers') || '[]';
              const answers = JSON.parse(storedAnswers);
              answers.push({
                playerId: playerId,
                questionId: questionId,
                answeredAt: new Date().toISOString(),
                isCorrect: isCorrect,
                responseTime: responseTime,
                answer: answer,
                score: isCorrect ? 100 : 0 // Default score
              });
              localStorage.setItem('playerAnswers', JSON.stringify(answers));
              sessionStorage.setItem('playerAnswers', JSON.stringify(answers));
              console.log('📝 Stored answer locally for fallback');
            } catch (storageError) {
              console.error('Failed to store locally:', storageError);
            }
            
            throw new Error('All submission methods failed');
          }
        }
      }
    } catch (error) {
      console.error('❌ Answer submission failed:', error);
      throw error;
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
                  <Paper 
                    elevation={3} 
                    sx={{ 
                      p: 3, 
                    mb: 4,
                      borderRadius: 3,
                    background: 'linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)',
                    color: 'white'
                    }}
                  >
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                    <PeopleIcon sx={{ mr: 1 }} />
                    Team Selection
                    </Typography>
                    
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    This quiz uses team mode. Please select a team to join:
                  </Typography>
                  
                  <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
                    <InputLabel id="team-select-label" sx={{ color: 'white' }}>Choose Team</InputLabel>
                    <Select
                      labelId="team-select-label"
                      id="team-select"
                      value={selectedTeam}
                      onChange={(e) => setSelectedTeam(e.target.value)}
                      label="Choose Team"
                          sx={{
                        bgcolor: 'rgba(255,255,255,0.1)',
                        color: 'white',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(255,255,255,0.3)'
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(255,255,255,0.5)'
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'white'
                        },
                        '& .MuiSvgIcon-root': {
                          color: 'white'
                        }
                            }}
                          >
                      {teamNames.map((team) => (
                        <MenuItem key={team} value={team}>{team}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                    
                  <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', color: 'rgba(255,255,255,0.7)' }}>
                    Your answers will contribute to your team's total score
                    </Typography>
                  </Paper>
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
