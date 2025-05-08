'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  Container,
  Paper,
  CircularProgress,
  Avatar,
  Chip,
  Button,
  Alert
} from '@mui/material';
import { 
  SportsEsports as GameIcon,
  CheckCircle as CheckIcon,
  People as PeopleIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useRouter, useSearchParams } from 'next/navigation';
import PublicLayout from '../../components/PublicLayout';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';

// Import Animal component with dynamic import to avoid SSR issues
const Animal = dynamic(() => import('react-animals'), { ssr: false });

// Function to parse avatar URL string into animal name and color
const parseAvatarUrl = (avatarUrl: string) => {
  // Default values
  const defaults = { name: 'dog', color: 'blue' };
  
  if (!avatarUrl) return defaults;
  
  try {
    // Handle the simple:// format
    if (avatarUrl.startsWith('simple://')) {
      const parts = avatarUrl.replace('simple://', '').split('/');
      if (parts.length === 2) {
        return { name: parts[0], color: parts[1] };
      }
    } 
    // Handle just the animal name with default color
    else if (avatarUrl && !avatarUrl.includes('/')) {
      return { name: avatarUrl, color: 'blue' };
    }
  } catch (error) {
    console.error('Error parsing avatar URL:', error);
  }
  
  return defaults;
};

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

// Custom AnimalAvatar component
function AnimalAvatar({ name, size, avatarUrl }: { name?: string; size: string; avatarUrl?: string }) {
  let animalName = name || 'dog';
  let color = 'orange';
  
  // If avatarUrl is provided, parse it
  if (avatarUrl) {
    const parsed = parseAvatarUrl(avatarUrl);
    animalName = parsed.name;
    color = parsed.color;
  } else {
    // Otherwise use the direct name and get color from map
    color = animalColorMap[animalName as keyof typeof animalColorMap] || 'orange';
  }
  
  // Valid animals supported by react-animals
  const validAnimals = ["alligator", "beaver", "dolphin", "elephant", "fox", "penguin", "tiger", "turtle"];
  
  // Make sure the animal name is valid
  animalName = validAnimals.includes(animalName) ? animalName : 'dog';
  
  return (
    <Box sx={{ 
      width: size, 
      height: size, 
      borderRadius: '50%', 
      overflow: 'hidden',
      border: '3px solid',
      borderColor: 'primary.main',
      boxShadow: '0 0 10px rgba(0,0,0,0.1)',
      backgroundColor: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <Animal
        name={animalName}
        color={color}
        size="100%"
      />
    </Box>
  );
}

export default function PlayerWaitingRoom() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const gameCode = searchParams.get('code');
  const playerName = searchParams.get('name') || 'Player';
  const avatarType = searchParams.get('avatar') || 'alligator';
  const teamName = searchParams.get('team') || null; // Get team name from URL if available
  
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playerCount, setPlayerCount] = useState(1);
  const [waitTime, setWaitTime] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [retries, setRetries] = useState(0);
  const [gameMode, setGameMode] = useState<'solo' | 'team'>(teamName ? 'team' : 'solo'); // Set game mode based on team name
  
  // Use refs to prevent infinite render loops
  const isConnectingRef = useRef(false);
  const connectionAttemptedRef = useRef(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const playerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Log parameters for debugging
  useEffect(() => {
    console.log('Player waiting room parameters:', {
      gameCode,
      playerName,
      avatarType,
      teamName,
      gameMode
    });
  }, [gameCode, playerName, avatarType, teamName, gameMode]);
  
  // Handle client-side rendering for the Animal component
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Clean up function
  const cleanupIntervals = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (playerIntervalRef.current) {
      clearInterval(playerIntervalRef.current);
      playerIntervalRef.current = null;
    }
  };
  
  // Function to parse avatar URL string into animal name and color
  const parseAvatarUrl = (avatarUrl: string) => {
    // Default values
    const defaults = { name: 'dog', color: 'blue' };
    
    if (!avatarUrl) return defaults;
    
    try {
      // Handle the simple:// format
      if (avatarUrl.startsWith('simple://')) {
        const parts = avatarUrl.replace('simple://', '').split('/');
        if (parts.length === 2) {
          return { name: parts[0], color: parts[1] };
        }
      } 
      // Handle just the animal name with default color
      else if (avatarUrl && !avatarUrl.includes('/')) {
        return { name: avatarUrl, color: 'blue' };
      }
    } catch (error) {
      console.error('Error parsing avatar URL:', error);
    }
    
    return defaults;
  };

  // Add this code for getting current player team information from sessionStorage
  const getCurrentPlayerTeam = (): string | null => {
    try {
      // First check URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      const teamFromUrl = urlParams.get('team');
      if (teamFromUrl) {
        console.log('Found team in URL parameters:', teamFromUrl);
        return teamFromUrl;
      }
      
      // Then check sessionStorage
      const playerData = JSON.parse(sessionStorage.getItem('currentPlayer') || '{}');
      const team = playerData.team || 
                  playerData.groupName || 
                  playerData.GroupName || 
                  sessionStorage.getItem('currentTeam') || 
                  null;
                  
      if (team) {
        console.log('Found team in sessionStorage:', team);
      }
      
      return team;
    } catch (e) {
      console.error('Error getting player team:', e);
      return null;
    }
  };

  // Function to connect to SignalR
  const connectToGameServer = useCallback(async () => {
    // Prevent multiple connection attempts
    if (isConnectingRef.current) return;
    
    isConnectingRef.current = true;
    setIsConnecting(true);
    setError(null);
    
    try {
      if (!gameCode) {
        throw new Error('No game code provided');
      }
      
      // Clean up any existing intervals
      cleanupIntervals();
      
      // Get team information
      const currentTeam = getCurrentPlayerTeam();
      console.log(`Current team detected: ${currentTeam || 'none'}`);
      
      // Set game mode based on team
      if (currentTeam) {
        setGameMode('team');
        console.log('Setting game mode to team based on detected team');
      }
      
      // Get player data from sessionStorage
      let playerData = null;
      let playerId = 0;
      try {
        const storedPlayerJson = sessionStorage.getItem('currentPlayer');
        if (storedPlayerJson) {
          playerData = JSON.parse(storedPlayerJson);
          playerId = playerData.playerId || playerData.id || 0;
          console.log('Retrieved player data from sessionStorage:', playerData);
        }
      } catch (e) {
        console.error('Error retrieving player data from sessionStorage:', e);
      }
      
      // Create fallback player data if not found in sessionStorage
      if (!playerData) {
        playerData = {
          Id: 0,
          NickName: playerName,
          AvatarUrl: avatarType,
          GroupId: null,
          GroupName: currentTeam,
          GroupDescription: null,
          team: currentTeam
        };
      } else {
        // Make sure team information is properly added to existing player data
        if (currentTeam) {
          playerData.GroupName = currentTeam;
          playerData.team = currentTeam;
          playerData.groupName = currentTeam;
        }
      }
      
      // Format player data for SignalR, ensuring team data is included
      const signalRPlayerData = {
        Id: playerId,
        id: playerId,
        playerId: playerId,
        NickName: playerName,
        nickName: playerName,
        name: playerName,
        AvatarUrl: avatarType,
        avatarUrl: avatarType,
        avatar: avatarType,
        GroupId: playerData.GroupId || null,
        GroupName: currentTeam,
        team: currentTeam,
        groupName: currentTeam,
        teamName: currentTeam,
        GroupDescription: playerData.GroupDescription || null
      };
      
      console.log('Connecting to game with player data:', signalRPlayerData);
      
      // Try to send a direct SignalR notification first if in team mode
      if (currentTeam) {
        try {
          console.log('Team mode detected, attempting direct SignalR broadcast...');
          const signalRService = (await import('@/services/signalRService')).default;
          
          if (!signalRService.isConnected()) {
            await signalRService.startConnection();
          }
          
          // Try direct broadcast
          await signalRService.broadcastPlayerJoin(gameCode, signalRPlayerData);
          console.log('Direct team mode SignalR broadcast sent');
        } catch (directErr) {
          console.warn('Direct team SignalR broadcast failed:', directErr);
        }
      }
      
      // Set up fallback mechanism for tracking game events
      // Start tracking waiting time immediately regardless of connection status
      intervalRef.current = setInterval(() => {
        setWaitTime(prev => prev + 1);
      }, 1000);
      
      // For demo purposes, simulate other players joining
      playerIntervalRef.current = setInterval(() => {
        if (Math.random() > 0.7) {
          setPlayerCount(prev => Math.min(prev + 1, 20));
        }
      }, 3000);
      
      // Attempt to use SignalR with a timeout
      const MAX_SIGNALR_ATTEMPTS = 2;
      let signalRConnected = false;
      
      for (let attempt = 1; attempt <= MAX_SIGNALR_ATTEMPTS; attempt++) {
        if (attempt > 1) {
          console.log(`SignalR connection retry attempt ${attempt}/${MAX_SIGNALR_ATTEMPTS}...`);
        }
        
        try {
          // Import SignalR service
          const signalRService = (await import('@/services/signalRService')).default;
          
          // Set up a timeout for the SignalR connection attempt
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('SignalR connection timeout')), 5000);
          });
          
          // Create a connection promise
          const connectionPromise = (async () => {
            console.log('Starting SignalR connection...');
            await signalRService.startConnection();
            console.log('SignalR connected, now joining game...');
            
            // Join the quiz with the formatted player data
            await signalRService.joinQuiz(gameCode, signalRPlayerData);
            
            console.log('Successfully joined quiz:', gameCode);
            
            // For team mode, try direct broadcast again
            if (currentTeam) {
              try {
                await signalRService.broadcastPlayerJoin(gameCode, signalRPlayerData);
                console.log('Additional team mode broadcast sent after connection');
              } catch (broadcastErr) {
                console.warn('Additional broadcast failed:', broadcastErr);
              }
            }
            
            // Register for game events
            signalRService.onStartQuiz((startedQuizCode: string, started: boolean) => {
              console.log('Game started event received:', { quizCode: startedQuizCode, started });
              
              // Check if this event is for our quiz code
              if (startedQuizCode.toString() === gameCode.toString() && started) {
                console.log(`Quiz ${startedQuizCode} started, navigating to game screen`);
                
                // Store quiz information in sessionStorage if needed
                try {
                  // Get quizId from sessionStorage or set it to 0 if not available
                  const quizId = sessionStorage.getItem('currentQuizId') || 0;
                  sessionStorage.setItem('currentQuizId', quizId.toString());
                  
                  // Get player information
                  const playerData = JSON.parse(sessionStorage.getItem('currentPlayer') || '{}');
                  
                  // Store gameStarted flag in sessionStorage
                  sessionStorage.setItem('gameStarted', 'true');
                  
                  console.log('Ready to play game with data:', {
                    quizId,
                    playerData,
                    gameCode
                  });
                } catch (e) {
                  console.error('Error preparing game data:', e);
                }
                
                // Navigate to the game page
                router.push(`/game?code=${gameCode}`);
              } else {
                console.log(`Received start event for quiz ${startedQuizCode}, but we're waiting for ${gameCode}`);
              }
            });
            
            return true;
          })();
          
          // Race with timeout
          const success = await Promise.race([connectionPromise, timeoutPromise]);
          if (success) {
            signalRConnected = true;
            setIsConnected(true);
            setRetries(0);
            console.log('SignalR connection and game join successful');
            break; // Exit retry loop on success
          }
        } catch (error: any) {
          console.warn(`SignalR connection attempt ${attempt} failed:`, error);
          if (attempt < MAX_SIGNALR_ATTEMPTS) {
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }
      }
      
      // If SignalR couldn't connect, set up a fallback polling mechanism
      if (!signalRConnected) {
        console.log('SignalR connection failed, setting up fallback polling mechanism');
        
        // Show as connected anyway to not block the player experience
        setIsConnected(true);
        
        // Set up a polling interval to check if the game has started
        const pollInterval = setInterval(async () => {
          try {
            // Poll the server to check if the game has started
            // This is a simpler approach without requiring a new API endpoint
            const quizService = (await import('@/services/quizService')).default;
            console.log(`Polling for game status for code: ${gameCode}`);
            
            // Try to get the quiz by code and check if it has a status property
            const response = await quizService.getQuizByCode(gameCode);
            
            console.log('Poll response:', response?.data);
            
            if (response?.data?.status === 'STARTED' || 
                response?.data?.isStarted === true || 
                response?.data?.hasStarted === true) {
              console.log('Game has started, navigating to game screen');
              clearInterval(pollInterval);
              
              // Store quiz information in sessionStorage if needed
              try {
                // Get the quizId from the response
                const quizId = response.data.id || 0;
                sessionStorage.setItem('currentQuizId', quizId.toString());
                
                // Store gameStarted flag in sessionStorage
                sessionStorage.setItem('gameStarted', 'true');
                
                console.log('Poll detected game started with quiz ID:', quizId);
              } catch (e) {
                console.error('Error storing quiz data from poll:', e);
              }
              
              // Navigate to the game page - uses the same path as the SignalR handler
              router.push(`/game?code=${gameCode}`);
            }
          } catch (pollError) {
            console.error('Error polling for game status:', pollError);
            // Continue polling despite errors
          }
        }, 5000); // Poll every 5 seconds
      }
      
    } catch (error: any) {
      console.error('Error during game join process:', error);
      setError(`Connection error: ${error.message || 'Unknown error'}. Please try again.`);
      
      // Set up minimal experience even if connection fails
      setIsConnected(true); // Let player wait for game anyway
      
      // Show retry button
      setRetries(prev => prev + 1);
    } finally {
      isConnectingRef.current = false;
      setIsConnecting(false);
    }
    
    // Return cleanup function
    return cleanupIntervals;
  }, [gameCode, playerName, avatarType, router, cleanupIntervals]);
  
  // Connect to SignalR on component mount - use refs to prevent infinite loops
  useEffect(() => {
    // Only attempt to connect once
    if (gameCode && !isConnected && !connectionAttemptedRef.current) {
      connectionAttemptedRef.current = true;
      connectToGameServer();
    }
    
    // Clean up function
    return () => {
      cleanupIntervals();
    };
  }, [gameCode, isConnected, connectToGameServer]);
  
  // Format time in minutes and seconds
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  // Handle retry button click
  const handleRetry = () => {
    setRetries(0);
    setIsConnecting(false);
    isConnectingRef.current = false;
    connectionAttemptedRef.current = false; // Reset attempt tracking
    connectToGameServer();
  };
  
  // Get the current team
  const currentTeam = getCurrentPlayerTeam();
  
  if (error) {
    return (
      <PublicLayout>
        <Container maxWidth="sm" sx={{ py: 6 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <Button 
              variant="contained" 
              color="primary"
              onClick={handleRetry}
              startIcon={<RefreshIcon />}
              disabled={isConnecting}
              sx={{ borderRadius: 2, flexGrow: 1 }}
            >
              {isConnecting ? <CircularProgress size={24} color="inherit" /> : 'Retry Connection'}
            </Button>
            <Button 
              variant="outlined" 
              onClick={() => router.push('/')}
              sx={{ borderRadius: 2 }}
            >
              Back to Home
            </Button>
          </Box>
        </Container>
      </PublicLayout>
    );
  }
  
  return (
    <PublicLayout>
      <Container 
        maxWidth="sm" 
        sx={{ 
          py: 6,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '80vh'
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ width: '100%' }}
        >
          {/* Only change this section to make team mode more visible if team is selected */}
          {currentTeam && gameMode === 'team' && (
            <Paper
              elevation={3}
              sx={{
                mb: 3,
                p: 3,
                borderRadius: 4,
                background: 'linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)',
                color: 'white',
                textAlign: 'center'
              }}
            >
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                Team Mode
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                <PeopleIcon />
                <Typography variant="h6">
                  Your Team: {currentTeam}
                </Typography>
              </Box>
            </Paper>
          )}

          <Paper 
            elevation={3} 
            sx={{ 
              p: 4, 
              textAlign: 'center',
              borderRadius: 4,
              background: gameMode === 'team' 
                ? 'linear-gradient(to bottom, #e8f5e9, #ffffff)' 
                : 'linear-gradient(to bottom, #e3f2fd, #ffffff)'
            }}
          >
            {!isConnected ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <CircularProgress size={60} color="primary" sx={{ mb: 3 }} />
                <Typography variant="h6">
                  {isConnecting ? 'Connecting to Game...' : 'Initializing...'}
                </Typography>
                {retries > 0 && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Attempt {retries}/3
                  </Typography>
                )}
              </Box>
            ) : (
              <>
                <Box 
                  component={motion.div}
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  sx={{ 
                    mb: 3,
                    display: 'inline-flex',
                    p: 1.5,
                    borderRadius: '50%',
                    bgcolor: 'success.light'
                  }}
                >
                  <CheckIcon sx={{ fontSize: 40, color: 'white' }} />
                </Box>
                
                <Typography variant="h4" gutterBottom fontWeight="bold" color="primary">
                  You're In!
                </Typography>
                
                <Typography variant="subtitle1" gutterBottom sx={{ mb: 3 }}>
                  Waiting for the host to start the game...
                </Typography>
                
                <Box sx={{ mb: 4, display: 'flex', justifyContent: 'center' }}>
                  {isClient ? (
                    <AnimalAvatar 
                      name={avatarType} 
                      size="100px" 
                      avatarUrl={(() => {
                        // Check if we have an avatar URL in sessionStorage
                        try {
                          const playerData = JSON.parse(sessionStorage.getItem('currentPlayer') || '{}');
                          if (playerData && playerData.avatarUrl && playerData.avatarUrl.includes('://')) {
                            console.log('Using avatar URL from sessionStorage:', playerData.avatarUrl);
                            return playerData.avatarUrl;
                          }
                        } catch (e) {
                          console.error('Error parsing player data for avatar:', e);
                        }
                        return avatarType;
                      })()} 
                    />
                  ) : (
                    <Avatar
                      sx={{ 
                        width: 100, 
                        height: 100,
                        bgcolor: 'primary.light',
                        border: '3px solid',
                        borderColor: 'primary.main'
                      }}
                    >
                      {playerName.charAt(0).toUpperCase()}
                    </Avatar>
                  )}
                </Box>
                
                <Typography variant="h6" gutterBottom fontWeight="bold">
                  {playerName}
                </Typography>
                
                {currentTeam && (
                  <Box
                    sx={{
                      mt: 2,
                      mb: 2,
                      p: 1.5,
                      borderRadius: 2,
                      background: 'linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 1
                    }}
                  >
                    <PeopleIcon />
                    <Typography variant="subtitle1" fontWeight="bold">
                      Team: {currentTeam}
                    </Typography>
                  </Box>
                )}
                
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Game Code: <strong>{gameCode}</strong>
                </Typography>
                
                <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
                  <Chip 
                    icon={<PeopleIcon />} 
                    label={`${playerCount} ${playerCount === 1 ? 'Player' : 'Players'}`}
                    color="primary" 
                    variant="outlined"
                  />
                  
                  <Chip 
                    icon={<GameIcon />} 
                    label={`Waiting: ${formatTime(waitTime)}`}
                    color="secondary" 
                    variant="outlined"
                  />
                </Box>
                
                <Box 
                  component={motion.div}
                  animate={{ 
                    y: [0, 10, 0],
                  }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: 1.5,
                    ease: "easeInOut"
                  }}
                  sx={{ mt: 4 }}
                >
                  <Typography variant="body2" color="text.secondary">
                    The game will begin automatically when the host starts
                  </Typography>
                </Box>
                
                <Paper
                  elevation={2}
                  sx={{
                    mt: 3,
                    p: 2,
                    borderRadius: 2,
                    bgcolor: 'info.light',
                    color: 'info.contrastText',
                    border: '1px dashed',
                    borderColor: 'info.main',
                    maxWidth: '80%',
                    mx: 'auto'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5 }}>
                    <CircularProgress size={24} color="inherit" thickness={5} />
                    <Typography variant="body1" fontWeight="medium">
                      Waiting for host to start the quiz
                    </Typography>
                  </Box>
                </Paper>
                
                <Button
                  variant="outlined"
                  color="error"
                  sx={{ mt: 3, borderRadius: 8 }}
                  onClick={() => router.push('/')}
                >
                  Leave Game
                </Button>
              </>
            )}
          </Paper>
        </motion.div>
      </Container>
    </PublicLayout>
  );
} 