'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Container,
  Paper,
  Button,
  CircularProgress,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Divider,
  Snackbar,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Grid
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  ContentCopy as CopyIcon,
  Visibility as VisibilityIcon,
  QrCode as QrCodeIcon,
  Person as PersonIcon,
  People as PeopleIcon,
  SignalCellularAlt as SignalIcon,
  Hub as HubIcon
} from '@mui/icons-material';
import { useRouter, useSearchParams } from 'next/navigation';
import MainLayout from '../components/MainLayout';
import { motion, AnimatePresence } from 'framer-motion';
import quizService from '@/services/quizService';
import playerService from '@/services/playerService';
import signalRService from '@/services/signalRService';
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

// Custom avatar component
function PlayerAvatar({ avatarUrl }: { avatarUrl: string }) {
  const { name, color } = parseAvatarUrl(avatarUrl);
  
  // List of valid animals supported by react-animals
  const validAnimals = ["alligator", "beaver", "dolphin", "elephant", "fox", "penguin", "tiger", "turtle"];
  
  // Make sure the animal name is valid
  const animalName = validAnimals.includes(name) ? name : 'dog';
  
  return (
    <Box 
      sx={{ 
        width: 48, 
        height: 48, 
        position: 'relative',
        borderRadius: '50%',
        overflow: 'hidden',
        bgcolor: 'white',
        border: '2px solid rgba(0,0,0,0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
      }}
    >
      <Animal 
        name={animalName} 
        color={color}
        size="100%"
      />
    </Box>
  );
}

// Mock players for development
const mockPlayers = [
  { id: 1, name: 'Player 1', avatar: 'https://mui.com/static/images/avatar/1.jpg', team: null },
  { id: 2, name: 'Player 2', avatar: 'https://mui.com/static/images/avatar/2.jpg', team: null },
  { id: 3, name: 'Player 3', avatar: 'https://mui.com/static/images/avatar/3.jpg', team: null },
];

// Add a helper function to group players by team
const groupPlayersByTeam = (players: any[]): {[key: string]: any[]} => {
  const teamGroups: {[key: string]: any[]} = {};
  
  players.forEach(player => {
    // Use any available team field name - groupName, team, teamName, etc.
    const teamName = player.groupName || player.team || player.teamName || 'No Team';
    
    if (!teamGroups[teamName]) {
      teamGroups[teamName] = [];
    }
    
    teamGroups[teamName].push(player);
  });
  
  return teamGroups;
};

// Add a function to count players by team
const countPlayersByTeam = (players: any[]): {[key: string]: number} => {
  const teamCounts: {[key: string]: number} = {};
  
  players.forEach(player => {
    const teamName = player.groupName || player.team || player.teamName || 'No Team';
    teamCounts[teamName] = (teamCounts[teamName] || 0) + 1;
  });
  
  return teamCounts;
};

export default function HostGamePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const quizId = searchParams.get('quizId');
  const gameCode = searchParams.get('code');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quizData, setQuizData] = useState<any>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [showGameCode, setShowGameCode] = useState(true);
  const [notification, setNotification] = useState({ open: false, message: '', type: 'info' as 'error' | 'info' | 'success' | 'warning' });
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  
  // State for SignalR connection
  const [signalRConnected, setSignalRConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  // Add new state for waiting dialog
  const [waitingDialogOpen, setWaitingDialogOpen] = useState(false);

  // Add new state for game mode
  const [gameMode, setGameMode] = useState<'solo' | 'team'>('solo');
  const [teamCounts, setTeamCounts] = useState<{[key: string]: number}>({});

  // Function to fetch joined players from API
  const fetchJoinedPlayers = async () => {
    if (!quizData?.id) return;
    
    try {
      const res = await quizService.getJoinedPlayers(quizData.id);
      if (res && res.data && res.data.joinedPlayers) {
        const joinedPlayers = res.data.joinedPlayers;
        
        // Process player data to ensure proper team info
        const processedPlayers = joinedPlayers.map((player: any) => {
          // Extract team information from all possible properties
          const teamName = 
            player.groupName || 
            player.GroupName || 
            player.team || 
            player.teamName || 
            null;
          
          // Extract or create team description
          const teamDescription = 
            player.GroupDescription || 
            player.groupDescription || 
            (teamName ? `Team for ${player.NickName || player.nickName || player.name || 'Guest'}` : null);
          
          // Create a consistent player object
          return {
            ...player,
            // Ensure all team properties are set consistently
            groupName: teamName,
            GroupName: teamName,
            team: teamName,
            teamName: teamName,
            // Ensure all description properties are set consistently
            GroupDescription: teamDescription,
            groupDescription: teamDescription
          };
        });
        
        setPlayers(processedPlayers);
        console.log('Updated players list with processed team data:', processedPlayers);
        
        // Update team counts if in team mode
        if (gameMode === 'team') {
          const counts = countPlayersByTeam(processedPlayers);
          setTeamCounts(counts);
          console.log('Updated team counts:', counts);
        }
      } else {
        console.log('No joined players found or invalid response format:', res);
        // If no players or invalid format, set to empty array
        setPlayers([]);
        setTeamCounts({});
      }
    } catch (error) {
      console.error('Error fetching joined players:', error);
      // On error, don't update players state to avoid UI disruption
    }
  };

  // Setup SignalR connection and event listeners
  useEffect(() => {
    if (!quizData?.id || !quizData?.quizCode) return;
    
    let isMounted = true;
    let retryCount = 0;
    const maxRetries = 3;
    console.log('Setting up SignalR for quiz:', quizData.quizCode);
    
    const connectSignalR = async () => {
      try {
        await signalRService.startConnection();
        if (isMounted) {
          setSignalRConnected(true);
          setConnectionError(null);
          console.log('SignalR connected successfully');
          
          // Remove existing handlers to avoid duplicates
          if (signalRService.isConnected()) {
            signalRService.removeEventHandler("JoinToQuiz");
            signalRService.removeEventHandler("StartQuiz");
            console.log('Removed existing SignalR event handlers');
          }
          
          // Listen for player joins with correct event name "JoinToQuiz"
          signalRService.onPlayerJoined((joinedQuizCode, player) => {
            console.log(`JoinToQuiz event received in component - Quiz: ${joinedQuizCode}, Player:`, player);
            
            if (isMounted && joinedQuizCode.toString() === quizData.quizCode.toString()) {
              console.log('Quiz code matches, updating players list');
              
              // Enhanced team detection with all possible property names
              const teamName = 
                player.GroupName || 
                player.groupName || 
                player.team || 
                player.teamName || 
                null;
              
              // Extract or create team description
              const teamDescription = 
                player.GroupDescription || 
                player.groupDescription || 
                (teamName ? `Team for ${player.NickName || player.nickName || player.name || 'Guest'}` : null);
              
              // Log team information for debugging team mode issues
              if (gameMode === 'team') {
                console.log(`Team mode: Player ${player.NickName || player.nickName} joined team: ${teamName} with description: ${teamDescription}`);
                
                // Update team counts directly without waiting for fetch
                if (teamName) {
                  setTeamCounts(prev => ({
                    ...prev,
                    [teamName]: (prev[teamName] || 0) + 1
                  }));
                  
                  // Also try to add the player to the state directly
                  setPlayers((currentPlayers) => {
                    // First check if player already exists (by ID or name)
                    const existingPlayerIndex = currentPlayers.findIndex((p: any) => 
                      (p.id === player.Id || p.id === player.id) || 
                      (p.nickName === player.NickName || p.nickName === player.nickName)
                    );
                    
                    if (existingPlayerIndex >= 0) {
                      // Update existing player with team info
                      const updatedPlayers = [...currentPlayers];
                      updatedPlayers[existingPlayerIndex] = {
                        ...updatedPlayers[existingPlayerIndex],
                        groupName: teamName,
                        team: teamName,
                        GroupName: teamName,
                        teamName: teamName,
                        GroupDescription: teamDescription,
                        groupDescription: teamDescription
                      };
                      console.log('Updated existing player with team info:', updatedPlayers[existingPlayerIndex]);
                      return updatedPlayers;
                    } else {
                      // Add new player with proper formatting
                      const newPlayer = {
                        id: player.Id || player.id || Date.now(), // Fallback ID if missing
                        nickName: player.NickName || player.nickName || player.name || 'Guest',
                        avatarUrl: player.AvatarUrl || player.avatarUrl || player.avatar || 'alligator',
                        groupName: teamName,
                        GroupName: teamName,
                        team: teamName,
                        teamName: teamName,
                        GroupDescription: teamDescription,
                        groupDescription: teamDescription
                      };
                      console.log('Adding new player with team info:', newPlayer);
                      return [...currentPlayers, newPlayer];
                    }
                  });
                }
              } else {
                // For solo mode, still try to add player directly for immediate feedback
                setPlayers((currentPlayers) => {
                  // First check if player already exists
                  const existingPlayerIndex = currentPlayers.findIndex((p: any) => 
                    (p.id === player.Id || p.id === player.id) || 
                    (p.nickName === player.NickName || p.nickName === player.nickName)
                  );
                  
                  if (existingPlayerIndex >= 0) {
                    // Player already exists, no need to add
                    return currentPlayers;
                  } else {
                    // Add new player
                    const newPlayer = {
                      id: player.Id || player.id || Date.now(),
                      nickName: player.NickName || player.nickName || player.name || 'Guest',
                      avatarUrl: player.AvatarUrl || player.avatarUrl || player.avatar || 'alligator'
                    };
                    return [...currentPlayers, newPlayer];
                  }
                });
              }
              
              // Force a fresh fetch of joined players from the API
              fetchJoinedPlayers();
              
              // Show notification with player name and team
              const playerName = player.NickName || player.nickName || player.name || 'A player';
              setNotification({
                open: true,
                message: teamName 
                  ? `${playerName} has joined the quiz in team ${teamName}!` 
                  : `${playerName} has joined the quiz!`,
                type: 'info'
              });
            } else {
              console.log('Quiz code does not match current quiz');
            }
          });
          
          // Listen for quiz start events
          signalRService.onStartQuiz((startedQuizCode, started) => {
            console.log(`Quiz ${startedQuizCode} start status:`, started);
            if (isMounted && startedQuizCode.toString() === quizData.quizCode.toString() && started) {
              // Optional: auto-navigate to game
              setNotification({
                open: true,
                message: 'Quiz has started!',
                type: 'success'
              });
              // router.push(`/play-quiz/${quizData.id}?host=true&code=${quizData.quizCode}`);
            }
          });
        }
      } catch (err) {
        console.error('Failed to connect to SignalR:', err);
        if (isMounted) {
          setSignalRConnected(false);
          setConnectionError('Failed to connect to game server. Players will not update in real-time.');
          
          // Set up alternative polling for players if SignalR fails
          if (!refreshInterval) {
            const interval = setInterval(fetchJoinedPlayers, 5000);
            setRefreshInterval(interval);
          }
          
          // Retry connection a few times
          if (retryCount < maxRetries) {
            retryCount++;
            console.log(`Retrying SignalR connection (${retryCount}/${maxRetries})...`);
            setTimeout(connectSignalR, 3000); // Retry after 3 seconds
          }
        }
      }
    };
    
    // Start connection attempt
    connectSignalR();
    
    // Initial fetch of players regardless of SignalR status
    fetchJoinedPlayers();
    
    // Set up periodic polling as a backup regardless of SignalR status
    // This ensures we get player updates even if SignalR is not working
    if (!refreshInterval) {
      const interval = setInterval(fetchJoinedPlayers, 10000); // Fetch every 10 seconds
      setRefreshInterval(interval);
    }
    
    // Cleanup function
    return () => {
      isMounted = false;
      if (refreshInterval) {
        clearInterval(refreshInterval);
        setRefreshInterval(null);
      }
    };
  }, [quizData?.id, quizData?.quizCode, gameMode]);

  // Load quiz data
  useEffect(() => {
    const loadQuizData = async () => {
      if (!quizId && !gameCode) {
        setError('No quiz ID or game code provided');
        setLoading(false);
        return;
      }

      try {
        let quizResponse;
        
        if (quizId) {
          // If we have a quizId, fetch the quiz data
          quizResponse = await quizService.getQuizById(parseInt(quizId));
          
          if (quizResponse && quizResponse.data) {
            setQuizData(quizResponse.data);
            
            // Detect game mode from quiz data
            if (quizResponse.data.gameMode === 'team') {
              setGameMode('team');
              console.log('Detected team mode from quiz data');
            } else {
              setGameMode('solo');
              console.log('Detected solo mode from quiz data');
            }
            
            // If there's no game code in the URL but we have a quizId,
            // use the quiz code from the response if available
            if (!gameCode && quizResponse.data.quizCode) {
              // Update URL to include the game code without page reload
              const newParams = new URLSearchParams(searchParams.toString());
              newParams.set('code', quizResponse.data.quizCode.toString());
              router.replace(`/host-game?${newParams.toString()}`);
            }
          }
        } else if (gameCode) {
          // If we only have a game code, use that to fetch quiz data
          quizResponse = await quizService.getQuizByCode(gameCode);
          
          if (quizResponse && quizResponse.data) {
            setQuizData(quizResponse.data);
            
            // Detect game mode from quiz data
            if (quizResponse.data.gameMode === 'team') {
              setGameMode('team');
              console.log('Detected team mode from quiz data');
            } else {
              setGameMode('solo');
              console.log('Detected solo mode from quiz data');
            }
          }
        }
        
        // For development: if no quiz data was found, create mock data
        if (!quizResponse || !quizResponse.data) {
          console.warn('No quiz data found, using mock data');
          setQuizData({
            id: quizId || '12345',
            title: 'Sample Quiz',
            description: 'This is a sample quiz for testing',
            quizCode: gameCode || '123456',
            questions: [
              { id: 1, question: 'Sample Question 1', options: ['A', 'B', 'C', 'D'], correctAnswer: 0 },
              { id: 2, question: 'Sample Question 2', options: ['True', 'False'], correctAnswer: 0 }
            ]
          });
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading quiz:', error);
        setError('Failed to load quiz data. Please try again.');
        setLoading(false);
      }
    };
    
    loadQuizData();
    
    // Cleanup function
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
      
      // Disconnect SignalR when component unmounts
      signalRService.stopConnection().catch(err => {
        console.error('Error disconnecting from SignalR:', err);
      });
    };
  }, [quizId, gameCode, router, searchParams]);
  
  // Handle start game
  const handleStartGame = async () => {
    const code = gameCode || quizData?.quizCode;
    const quizIdNum = quizData?.id;
    
    if (!code || !quizIdNum) {
      setNotification({
        open: true,
        message: 'Cannot start game without a valid game code and quiz ID',
        type: 'error'
      });
      return;
    }
    
    setIsStarting(true);
    
    try {
      console.log(`Starting quiz with ID ${quizIdNum}...`);
      
      // Call the REST API to start the quiz - this will trigger SignalR from the backend
      const startResponse = await quizService.startQuiz(quizIdNum);
      console.log('Start quiz response:', startResponse);
      
      // Also send a direct SignalR notification in case the backend notification fails
      try {
        if (signalRService.isConnected()) {
          // Try to notify clients directly as a fallback
          console.log(`Sending direct StartQuiz notification via SignalR to code: ${code}`);
          const connection = signalRService.getConnection();
          if (connection) {
            await connection.invoke('StartQuiz', code.toString(), true);
            console.log('Direct SignalR notification sent');
          }
        }
      } catch (signalRError) {
        console.warn('Error sending direct SignalR notification:', signalRError);
        // Continue anyway since the REST API should have triggered the backend notification
      }
      
      // Show waiting dialog and update UI
      setWaitingDialogOpen(true);
      setIsStarting(false);
      
      setNotification({
        open: true,
        message: 'Game started successfully! Waiting for players to join...',
        type: 'success'
      });
    } catch (error: any) {
      console.error('Error starting game:', error);
      setNotification({
        open: true,
        message: `Failed to start game: ${error.message || 'Unknown error'}`,
        type: 'error'
      });
      setIsStarting(false);
    }
  };
  
  // Close waiting dialog and proceed to game
  const handleProceedToGame = () => {
    const code = gameCode || quizData?.quizCode;
    // Clear polling interval before navigating
    if (refreshInterval) {
      clearInterval(refreshInterval);
    }
    // Navigate to the play quiz page with the game code
    router.push(`/play-quiz/${quizData.id}?host=true&code=${code}`);
  };
  
  // Handle notification close
  const handleNotificationClose = () => {
    setNotification({
      ...notification,
      open: false
    });
  };

  // Handle end game and show results
  const handleViewResults = () => {
    const quizIdNum = quizData?.id;
    
    if (!quizIdNum) {
      setNotification({
        open: true,
        message: 'Cannot view results without a valid quiz ID',
        type: 'error'
      });
      return;
    }
    
    // Clear polling interval before navigating
    if (refreshInterval) {
      clearInterval(refreshInterval);
    }
    
    // Store quiz data for results page
    try {
      if (quizData) {
        sessionStorage.setItem('currentQuiz', JSON.stringify(quizData));
        localStorage.setItem('currentQuiz', JSON.stringify(quizData));
      }
    } catch (error) {
      console.error('Error storing quiz data:', error);
    }
    
    // Navigate to results page with host parameter
    router.push(`/game-results?quizId=${quizIdNum}&host=true`);
  };

  // Render the players section differently for team mode
  const renderPlayers = () => {
    if (players.length === 0) {
      return (
        <Box 
          display="flex" 
          flexDirection="column" 
          alignItems="center" 
          justifyContent="center" 
          minHeight="200px"
        >
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            Waiting for players to join...
          </Typography>
          <CircularProgress size={30} sx={{ opacity: 0.7 }} />
        </Box>
      );
    }
    
    if (gameMode === 'team') {
      // Group players by team for team mode display
      const teamGroups = groupPlayersByTeam(players);
      const teamNames = Object.keys(teamGroups).sort();
      
      // Generate colors for teams
      const teamColors = [
        '#2196F3', // Blue
        '#FF9800', // Orange
        '#4CAF50', // Green
        '#F44336', // Red
        '#9C27B0', // Purple
        '#00BCD4', // Cyan
        '#FFEB3B', // Yellow
        '#795548', // Brown
      ];
      
      return (
        <>
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" fontWeight="medium" color="primary">
              Teams ({teamNames.length})
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
              {teamNames.map((teamName, index) => (
                <Chip 
                  key={teamName}
                  label={`${teamName} (${teamGroups[teamName].length})`}
                  sx={{ 
                    bgcolor: teamColors[index % teamColors.length],
                    color: 'white',
                    fontWeight: 'bold'
                  }}
                />
              ))}
            </Box>
          </Box>
          
          <Divider sx={{ mb: 3 }} />
          
          {teamNames.map((teamName, teamIndex) => (
            <Box key={teamName} sx={{ mb: 4 }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                mb: 2,
                p: 1,
                pl: 2,
                borderRadius: 2,
                bgcolor: `${teamColors[teamIndex % teamColors.length]}22`
              }}>
                <PeopleIcon sx={{ color: teamColors[teamIndex % teamColors.length], mr: 1 }} />
                <Typography variant="h6" fontWeight="medium" color="text.primary">
                  {teamName}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                  ({teamGroups[teamName].length} players)
                </Typography>
                
                <Box sx={{ flexGrow: 1 }} />
                
                <Chip 
                  size="small"
                  label={`${teamGroups[teamName].length} members`}
                  sx={{ 
                    bgcolor: `${teamColors[teamIndex % teamColors.length]}33`,
                    fontWeight: 'medium'
                  }}
                />
              </Box>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                {teamGroups[teamName].map((player) => (
                  <Box 
                    key={player.id}
                    sx={{ 
                      width: { xs: '100%', sm: 'calc(50% - 16px)', md: 'calc(33.33% - 16px)' },
                      mb: 2
                    }}
                  >
                    <Box 
                      component={motion.div}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Paper
                        elevation={1}
                        sx={{
                          p: 2,
                          borderRadius: 3,
                          display: 'flex',
                          alignItems: 'center',
                          bgcolor: 'rgba(33, 150, 243, 0.04)',
                          borderLeft: `4px solid ${teamColors[teamIndex % teamColors.length]}`
                        }}
                      >
                        <Box sx={{ mr: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {player.avatarUrl && player.avatarUrl.includes('://') ? (
                            <PlayerAvatar avatarUrl={player.avatarUrl} />
                          ) : (
                            <Avatar 
                              sx={{ 
                                width: 48, 
                                height: 48,
                                bgcolor: teamColors[teamIndex % teamColors.length]
                              }}
                            >
                              {player.nickName ? player.nickName.charAt(0) : '?'}
                            </Avatar>
                          )}
                        </Box>
                        <Box>
                          <Typography variant="body1" fontWeight="medium">
                            {player.nickName}
                          </Typography>
                        </Box>
                      </Paper>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          ))}
        </>
      );
    } else {
      // Solo mode - original display
      return (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          {players.map((player) => (
            <Box 
              key={player.id}
              sx={{ 
                width: { xs: '100%', sm: 'calc(50% - 16px)', md: 'calc(33.33% - 16px)' },
                mb: 2
              }}
            >
              <Box 
                component={motion.div}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <Paper
                  elevation={1}
                  sx={{
                    p: 2,
                    borderRadius: 3,
                    display: 'flex',
                    alignItems: 'center',
                    bgcolor: 'rgba(33, 150, 243, 0.04)'
                  }}
                >
                  <Box sx={{ mr: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {player.avatarUrl && player.avatarUrl.includes('://') ? (
                      <PlayerAvatar avatarUrl={player.avatarUrl} />
                    ) : (
                      <Avatar 
                        sx={{ width: 48, height: 48 }}
                      >
                        {player.nickName ? player.nickName.charAt(0) : '?'}
                      </Avatar>
                    )}
                  </Box>
                  <Box>
                    <Typography variant="body1" fontWeight="medium">
                      {player.nickName}
                    </Typography>
                    {player.groupName && (
                      <Typography variant="caption" color="text.secondary">
                        Team: {player.groupName}
                      </Typography>
                    )}
                  </Box>
                </Paper>
              </Box>
            </Box>
          ))}
        </Box>
      );
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <Container maxWidth="lg" sx={{ pt: 8, pb: 6 }}>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
            <CircularProgress size={60} />
          </Box>
        </Container>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <Container maxWidth="lg" sx={{ pt: 8, pb: 6 }}>
          <Alert severity="error" sx={{ mb: 4 }}>
            {error}
          </Alert>
          <Button 
            variant="contained" 
            onClick={() => router.push('/my-sets')}
            sx={{ borderRadius: 2 }}
          >
            Go Back to My Sets
          </Button>
        </Container>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Container maxWidth="lg" sx={{ pt: 6, pb: 8 }}>
        <Box component={motion.div} 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Host Header */}
          <Paper 
            elevation={3} 
            sx={{ 
              p: 3, 
              mb: 4, 
              borderRadius: 4,
              background: gameMode === 'team' 
                ? 'linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)' // Green gradient for team mode
                : 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)', // Blue gradient for solo mode
              color: 'white'
            }}
          >
            <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} alignItems="center" justifyContent="space-between">
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Typography variant="h4" fontWeight="bold" sx={{ mr: 2 }}>
                  {quizData?.title || 'Host Game'}
                </Typography>
                  
                  <Chip
                    label={gameMode === 'team' ? 'Team Mode' : 'Solo Mode'}
                    color={gameMode === 'team' ? 'success' : 'primary'}
                    sx={{ 
                      color: 'white', 
                      borderColor: 'rgba(255,255,255,0.5)', 
                      fontWeight: 'bold',
                      bgcolor: 'rgba(255,255,255,0.15)'
                    }}
                    variant="outlined"
                  />
                </Box>
                
                <Typography variant="subtitle1">
                  {quizData?.description || 'Waiting for players to join...'}
                </Typography>
              </Box>
              
              <Box display="flex" flexDirection="column" alignItems={{ xs: 'center', md: 'flex-end' }} mt={{ xs: 3, md: 0 }}>
                <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <Chip 
                    icon={<PersonIcon />} 
                  label={`${players.length} ${players.length === 1 ? 'Player' : 'Players'}`}
                  sx={{ 
                    bgcolor: 'rgba(255, 255, 255, 0.2)', 
                    color: 'white',
                    fontWeight: 'bold',
                    '& .MuiChip-icon': { color: 'white' }
                  }}
                />
                  
                  {gameMode === 'team' && (
                    <Chip 
                      icon={<PeopleIcon />} 
                      label={`${Object.keys(teamCounts).length} Teams`}
                      sx={{ 
                        bgcolor: 'rgba(255, 255, 255, 0.2)', 
                        color: 'white',
                        fontWeight: 'bold',
                        '& .MuiChip-icon': { color: 'white' }
                      }}
                    />
                  )}
                </Box>
                
                <Button
                  variant="contained"
                  color="secondary"
                  size="large"
                  startIcon={<PlayIcon />}
                  onClick={handleStartGame}
                  disabled={isStarting || players.length === 0}
                  sx={{
                    borderRadius: 8,
                    px: 3,
                    py: 1,
                    fontWeight: 'bold',
                    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)',
                    bgcolor: 'white',
                    color: gameMode === 'team' ? '#2E7D32' : '#1976D2',
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 0.8)',
                    }
                  }}
                >
                  {isStarting ? 'Starting...' : 'Start Quiz'}
                </Button>
              </Box>
            </Box>
          </Paper>
          
          {/* Game Code Section */}
          <Paper 
            elevation={2} 
            sx={{ 
              p: 3, 
              mb: 4, 
              borderRadius: 4,
              bgcolor: showGameCode ? 'rgba(33, 150, 243, 0.05)' : 'white',
              border: showGameCode ? '2px dashed rgba(33, 150, 243, 0.3)' : 'none',
              transition: 'all 0.3s ease'
            }}
          >
            <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="h6" fontWeight="medium" gutterBottom color="primary">
                  Game Code
                </Typography>
                
                <Box display="flex" alignItems="center">
                  <AnimatePresence mode="wait">
                    {showGameCode ? (
                      <Typography 
                        key="visible-code"
                        component={motion.h3}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        variant="h3" 
                        fontWeight="bold" 
                        fontFamily="monospace"
                        letterSpacing={4}
                        color="primary"
                        sx={{ mr: 2 }}
                      >
                        {gameCode || quizData?.quizCode || '123456'}
                      </Typography>
                    ) : (
                      <Typography 
                        key="hidden-code"
                        component={motion.h3}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        variant="h3"
                        fontWeight="bold"
                        fontFamily="monospace"
                        letterSpacing={4}
                      >
                        ******
                      </Typography>
                    )}
                  </AnimatePresence>
                  
                  <IconButton 
                    onClick={() => setShowGameCode(!showGameCode)}
                    color="primary"
                    sx={{ mr: 1 }}
                  >
                    <VisibilityIcon />
                  </IconButton>
                  
                  <IconButton 
                    onClick={() => {
                      const code = gameCode || quizData?.quizCode;
                      if (code) {
                        navigator.clipboard.writeText(code.toString());
                        setNotification({
                          open: true,
                          message: 'Game code copied to clipboard!',
                          type: 'success'
                        });
                      }
                    }}
                    color="primary"
                  >
                    <CopyIcon />
                  </IconButton>
                </Box>
                
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Players can join at kahoot-clone.com by entering this code
                </Typography>
              </Box>
              
              <Box mt={{ xs: 3, md: 0 }}>
                <Button
                  variant="outlined"
                  startIcon={<QrCodeIcon />}
                  onClick={() => setQrDialogOpen(true)}
                  sx={{ 
                    borderRadius: 8,
                    px: 3 
                  }}
                >
                  Show QR Code
                </Button>
              </Box>
            </Box>
          </Paper>
          
          {/* Players Section */}
          <Paper 
            elevation={2} 
            sx={{ 
              p: 3, 
              borderRadius: 4,
              minHeight: '300px'
            }}
          >
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
              <Typography variant="h6" fontWeight="medium" color="primary">
                Players
              </Typography>
              
              <Typography variant="body2" color="text.secondary">
                {players.length} {players.length === 1 ? 'player' : 'players'} joined
              </Typography>
            </Box>
            
            <Divider sx={{ mb: 2 }} />
            
            {renderPlayers()}
          </Paper>
        </Box>
      </Container>
      
      {/* QR Code Dialog */}
      <Dialog
        open={qrDialogOpen}
        onClose={() => setQrDialogOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: 3,
            p: 2
          }
        }}
      >
        <DialogTitle>
          Scan QR Code to Join
        </DialogTitle>
        <DialogContent>
          <Box
            sx={{
              width: '100%',
              aspectRatio: '1/1',
              bgcolor: '#f5f5f5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 2,
              p: 2
            }}
          >
            {/* This would be replaced with an actual QR code component */}
            <Typography variant="body1" color="text.secondary">
              QR Code for game {gameCode || quizData?.quizCode || '123456'}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQrDialogOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Waiting for Players Dialog */}
      <Dialog
        open={waitingDialogOpen}
        PaperProps={{
          sx: {
            borderRadius: 3,
            p: 3,
            maxWidth: 480
          }
        }}
      >
        <DialogTitle sx={{ textAlign: 'center' }}>
            Waiting for Players
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 2 }}>
            <CircularProgress size={60} sx={{ mb: 3 }} />
            <Typography variant="body1" gutterBottom>
              Quiz has been started! Players are joining the game.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 1 }}>
              {players.length} {players.length === 1 ? 'player has' : 'players have'} joined.
              When you're ready, click "Proceed to Game" to continue.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
          <Button 
            variant="contained" 
            color="primary"
            onClick={handleProceedToGame}
            startIcon={<PlayIcon />}
            sx={{ 
              borderRadius: 8,
              px: 3
            }}
          >
            Proceed to Game
          </Button>
          
          <Button
            variant="outlined"
            onClick={handleViewResults}
            sx={{ 
              borderRadius: 8,
              px: 3,
              ml: 2
            }}
          >
            View Results
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Notification */}
      <Snackbar
        open={notification.open}
        autoHideDuration={4000}
        onClose={handleNotificationClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleNotificationClose} 
          severity={notification.type}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </MainLayout>
  );
} 