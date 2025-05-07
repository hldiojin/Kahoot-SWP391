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

// Mock players for development
const mockPlayers = [
  { id: 1, name: 'Player 1', avatar: 'https://mui.com/static/images/avatar/1.jpg', team: null },
  { id: 2, name: 'Player 2', avatar: 'https://mui.com/static/images/avatar/2.jpg', team: null },
  { id: 3, name: 'Player 3', avatar: 'https://mui.com/static/images/avatar/3.jpg', team: null },
];

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

  // Load quiz data and set up player polling
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
        
        // Start polling for players - this will be replaced with SignalR
        fetchPlayers();
        const interval = setInterval(fetchPlayers, 5000); // Poll every 5 seconds
        setRefreshInterval(interval);
        
        // This would be replaced with SignalR connection in production
        // initializeSignalRConnection();
        
        return () => {
          if (interval) clearInterval(interval);
          // disconnectSignalR();
        };
        
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
      // disconnectSignalR();
    };
  }, [quizId, gameCode, router, searchParams]);
  
  // This function would initialize SignalR connection in production
  const initializeSignalRConnection = () => {
    // This is a placeholder for the SignalR connection code
    // Example SignalR initialization would be:
    // 
    // const connection = new HubConnectionBuilder()
    //   .withUrl('/gameHub')
    //   .withAutomaticReconnect()
    //   .build();
    //
    // connection.on('PlayerJoined', (player) => {
    //   setPlayers(prevPlayers => [...prevPlayers, player]);
    // });
    //
    // connection.on('PlayerLeft', (playerId) => {
    //   setPlayers(prevPlayers => prevPlayers.filter(p => p.id !== playerId));
    // });
    //
    // connection.start()
    //   .then(() => {
    //     setSignalRConnected(true);
    //     connection.invoke('JoinHostRoom', gameCode);
    //   })
    //   .catch(err => {
    //     setConnectionError('Failed to connect to game server. Please try again.');
    //     console.error('SignalR Connection Error: ', err);
    //   });
    
    // Simulate successful connection for now
    setTimeout(() => {
      setSignalRConnected(true);
    }, 1000);
  };
  
  // This function would disconnect SignalR in production
  const disconnectSignalR = () => {
    // This is a placeholder for the SignalR disconnection code
    // Example SignalR disconnection would be:
    //
    // if (connection) {
    //   connection.stop();
    // }
    
    setSignalRConnected(false);
  };
  
  // Function to fetch players
  const fetchPlayers = async () => {
    if (!gameCode && !quizData?.quizCode) return;
    
    const code = gameCode || quizData?.quizCode;
    
    try {
      // In production, this would be handled by SignalR
      // For development, use mock data or API call
      // const playerResponse = await playerService.getPlayersByGameCode(code);
      // if (playerResponse && playerResponse.data) {
      //   setPlayers(playerResponse.data);
      // }
      
      // For development, use random mock players
      const mockPlayerCount = Math.floor(Math.random() * 5) + 1; // 1-5 players
      const updatedMockPlayers = Array(mockPlayerCount).fill(0).map((_, i) => ({
        id: i + 1,
        name: `Player ${i + 1}`,
        avatar: `https://mui.com/static/images/avatar/${(i % 8) + 1}.jpg`,
        team: null
      }));
      
      setPlayers(updatedMockPlayers);
    } catch (error) {
      console.error('Error fetching players:', error);
      // Don't set error state here to avoid disrupting the UI
      // Just log the error
    }
  };
  
  // Copy game code to clipboard
  const copyCodeToClipboard = () => {
    const code = gameCode || quizData?.quizCode;
    if (code) {
      navigator.clipboard.writeText(code.toString());
      setNotification({
        open: true,
        message: 'Game code copied to clipboard!',
        type: 'success'
      });
    }
  };
  
  // Handle start game
  const handleStartGame = async () => {
    const code = gameCode || quizData?.quizCode;
    if (!code) {
      setNotification({
        open: true,
        message: 'Cannot start game without a valid game code',
        type: 'error'
      });
      return;
    }
    
    setIsStarting(true);
    
    try {
      // Import services
      const signalRService = (await import('@/services/signalRService')).default;
      const quizService = (await import('@/services/quizService')).default;
      
      // 1. Validate quiz ID
      const quizId = quizData?.id;
      if (!quizId) {
        throw new Error('Quiz ID is missing');
      }
      
      console.log(`Starting quiz with ID ${quizId} using quizService.startQuiz...`);
      
      // 2. Start the quiz using the REST API
      try {
        await quizService.startQuiz(quizId);
        console.log(`Quiz ${quizId} started successfully via REST API`);
      } catch (apiError: any) {
        console.error('Failed to start quiz via REST API:', apiError);
        throw new Error(`Failed to start quiz: ${apiError.message}`);
      }
      
      // 3. Connect to SignalR if not already connected
      try {
        if (!signalRService.isConnected()) {
          console.log('Connecting to SignalR...');
          await signalRService.startConnection();
          await new Promise(resolve => setTimeout(resolve, 1000)); // Allow connection to establish
        }
        
        if (signalRService.isConnected()) {
          console.log(`Connected to SignalR, joining host room for game code ${code}...`);
          
          // Host joins the game room first
          try {
            await signalRService.joinHostRoom(code.toString());
            console.log('Successfully joined host room');
          } catch (joinError) {
            console.warn('Warning: Failed to join host room:', joinError);
            // Continue with game start attempt even if joining host room fails
          }
          
          // Notify all players that game has started
          console.log(`Notifying players via SignalR for game code ${code}...`);
          try {
            await signalRService.startGame(code.toString());
            console.log('SignalR game start notification sent successfully');
          } catch (startError) {
            console.warn('Warning: Failed to notify players via SignalR:', startError);
            // Continue since REST API start was successful
          }
        } else {
          console.warn('Warning: SignalR connection could not be established');
        }
      } catch (signalRError) {
        console.warn('Warning: SignalR operations failed:', signalRError);
        // Continue since REST API start was successful
      }
      
      // 4. Show waiting dialog and update UI
      setWaitingDialogOpen(true);
      setIsStarting(false);
      
      // Log success
      console.log(`Game with code ${code} started successfully, waiting for players...`);
      
      // Update notification to show success
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
              background: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)',
              color: 'white'
            }}
          >
            <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="h4" fontWeight="bold" gutterBottom>
                  {quizData?.title || 'Host Game'}
                </Typography>
                <Typography variant="subtitle1">
                  {quizData?.description || 'Waiting for players to join...'}
                </Typography>
              </Box>
              
              <Box display="flex" flexDirection="column" alignItems={{ xs: 'center', md: 'flex-end' }} mt={{ xs: 3, md: 0 }}>
                <Chip 
                  icon={<PeopleIcon />} 
                  label={`${players.length} ${players.length === 1 ? 'Player' : 'Players'}`}
                  sx={{ 
                    bgcolor: 'rgba(255, 255, 255, 0.2)', 
                    color: 'white',
                    mb: 1,
                    fontWeight: 'bold',
                    '& .MuiChip-icon': { color: 'white' }
                  }}
                />
                
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
                    color: '#1976D2',
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
                    onClick={copyCodeToClipboard}
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
            
            {players.length === 0 ? (
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
            ) : (
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
                        <Avatar 
                          src={player.avatar} 
                          alt={player.name}
                          sx={{ width: 48, height: 48, mr: 2 }}
                        >
                          {player.name.charAt(0)}
                        </Avatar>
                        <Typography variant="body1" fontWeight="medium">
                          {player.name}
                        </Typography>
                      </Paper>
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
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
          <Typography variant="h5" fontWeight="bold" color="primary">
            Waiting for Players
          </Typography>
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