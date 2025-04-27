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
  InputAdornment,
  IconButton,
  Snackbar,
  Avatar,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  Chip,
  SelectChangeEvent
} from '@mui/material';
import { 
  PlayArrow as PlayIcon,
  Person as PersonIcon,
  Edit as EditIcon,
  Groups as GroupsIcon
} from '@mui/icons-material';
import { useRouter, useSearchParams } from 'next/navigation';
import PublicLayout from '../components/PublicLayout';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import gameSessionService from '@/services/gameSessionService';
import playerService from '@/services/playerService';
import { useAuth } from '../context/AuthContext';

// Dynamically import the Animal component with no SSR
const Animal = dynamic(() => import('react-animals'), { ssr: false });

interface GameData {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  questions: any[];
  creator: string;
  category?: string;  // Make category optional for formatting purposes
  gameMode?: 'solo' | 'team'; // Add gameMode property
}

// Add interface for answer type
interface Answer {
  text: string;
  isCorrect: boolean;
}

// Add animal avatars for selection with valid animal names only
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

// Array of predefined group names
const teamNames = ["Team Awesome", "Brainiacs", "Quiz Masters", "Knowledge Seekers", "Brain Busters", "Trivia Titans"];

// Sample game data based on the game codes from my-sets page
const sampleGames: Record<string, GameData> = {
  '123456': {
    id: 1,
    title: 'World Geography',
    description: 'A comprehensive quiz on countries, capitals, and landmarks',
    imageUrl: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5ce?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
    questions: [
      {
        id: '1',
        question: 'What is the capital of France?',
        options: ['London', 'Berlin', 'Paris', 'Madrid'],
        correctAnswer: 2,
        timeLimit: 20
      },
      {
        id: '2',
        question: 'Which country has the largest land area?',
        options: ['China', 'USA', 'Canada', 'Russia'],
        correctAnswer: 3,
        timeLimit: 20
      }
    ],
    creator: 'Teacher'
  },
  '234567': {
    id: 2,
    title: 'Math Fundamentals',
    description: 'Basic mathematical concepts for middle school students',
    imageUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
    questions: [
      {
        id: '1',
        question: 'What is 7 × 8?',
        options: ['54', '56', '64', '72'],
        correctAnswer: 1,
        timeLimit: 15
      },
      {
        id: '2',
        question: 'Solve for x: 2x + 5 = 15',
        options: ['5', '7.5', '10', '5.5'],
        correctAnswer: 0,
        timeLimit: 30
      }
    ],
    creator: 'Teacher'
  },
  '345678': {
    id: 3,
    title: 'Science Facts',
    description: 'Interesting science facts and discoveries',
    imageUrl: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
    questions: [
      {
        id: '1',
        question: 'What is the chemical symbol for gold?',
        options: ['Gd', 'Go', 'Au', 'Ag'],
        correctAnswer: 2,
        timeLimit: 20
      },
      {
        id: '2',
        question: 'Which planet is known as the Red Planet?',
        options: ['Venus', 'Mars', 'Jupiter', 'Saturn'],
        correctAnswer: 1,
        timeLimit: 20
      }
    ],
    creator: 'Teacher'
  }
};

export default function PlayGamePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get('code');
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameError, setNameError] = useState('');
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState<string>('alligator');
  const [selectedAvatarColor, setSelectedAvatarColor] = useState<string>('orange');
  const [gameMode, setGameMode] = useState<'solo' | 'team'>('solo');
  const [selectedTeam, setSelectedTeam] = useState<string>(teamNames[0]);
  const [snackbarMessage, setSnackbarMessage] = useState('Name and avatar saved successfully!');
  
  // New state variables for API integration
  const [gameSession, setGameSession] = useState<any>(null);
  const [apiLoading, setApiLoading] = useState(false);
  const [player, setPlayer] = useState<any>(null);

  useEffect(() => {
    // Simulate loading game data with the provided code
    const loadGame = async () => {
      try {
        setLoading(true);
        
        if (!code) {
          setError('No game code provided');
          setLoading(false);
          return;
        }
        
        console.log(`Loading game with code: ${code}`);
        
        // Try to fetch the game session from the API
        try {
          setApiLoading(true);
          const sessionResponse = await gameSessionService.getGameSessionByPinCode(code);
          
          if (sessionResponse.status === 200 && sessionResponse.data) {
            console.log('Game session found:', sessionResponse.data);
            setGameSession(sessionResponse.data);
            
            // Now fetch the quiz data using the quizId from the session
            // (In a real implementation, you would fetch quiz details from the API)
            
            // For now, set game mode based on session data
            if (sessionResponse.data.gameType) {
              setGameMode(sessionResponse.data.gameType.toLowerCase() === 'team' ? 'team' : 'solo');
            }
          }
        } catch (apiError) {
          console.error('API Error:', apiError);
          // Continue with local data if API fails
        } finally {
          setApiLoading(false);
        }
        
        // The rest of the function remains the same (your existing code)
        // Try multiple sources to find the game:
        
        // 1. Check for the specific game in sessionStorage
        const specificGameKey = `game_${code}`;
        const specificGame = sessionStorage.getItem(specificGameKey);
        if (specificGame) {
          try {
            console.log(`Found game ${code} in sessionStorage`);
            const gameData = JSON.parse(specificGame);
            
            // Check for game mode
            if (gameData.gameMode) {
              setGameMode(gameData.gameMode);
            }
            
            setGameData({
              id: gameData.id || Date.now(),
              title: gameData.title,
              description: gameData.description,
              imageUrl: gameData.coverImage,
              questions: gameData.questions,
              creator: gameData.createdBy || gameData.creator,
              category: gameData.category,
              gameMode: gameData.gameMode || 'solo'
            });
            
            // For demo, retrieve player name from local storage if available
            const storedName = localStorage.getItem('playerName');
            if (storedName) {
              setPlayerName(storedName);
            }
            
            // Retrieve team name if available
            const storedTeam = localStorage.getItem('playerTeam');
            if (storedTeam) {
              setSelectedTeam(storedTeam);
            }
            
            // Retrieve avatar if available
            const storedAvatar = localStorage.getItem('playerAvatar');
            if (storedAvatar) {
              setSelectedAvatar(storedAvatar);
            }
            
            setLoading(false);
            return;
          } catch (e) {
            console.error(`Error parsing game ${code} from sessionStorage:`, e);
          }
        }
        
        // Continue with your existing fallback mechanisms
        // 2. Check sample games (for demo purposes)
        const sampleGame = sampleGames[code];
        if (sampleGame) {
          console.log(`Found sample game with code ${code}`);
          
          // Add gameMode to sample game (assuming solo by default)
          sampleGame.gameMode = sampleGame.gameMode || 'solo';
          setGameMode(sampleGame.gameMode);
          
          setGameData(sampleGame);
          
          // Prepare for quiz preview
          sessionStorage.setItem('quizPreviewData', JSON.stringify({
            title: sampleGame.title,
            description: sampleGame.description,
            coverImage: sampleGame.imageUrl,
            gameMode: sampleGame.gameMode,
            questions: sampleGame.questions
          }));
          
          // For demo, retrieve player name from local storage if available
          const storedName = localStorage.getItem('playerName');
          if (storedName) {
            setPlayerName(storedName);
          }
          
          // Retrieve team name if available
          const storedTeam = localStorage.getItem('playerTeam');
          if (storedTeam) {
            setSelectedTeam(storedTeam);
          }
          
          setLoading(false);
          return;
        }
        
        // 3. Check in gamesByCode from localStorage
        try {
          const gamesByCode = JSON.parse(localStorage.getItem('gamesByCode') || '{}');
          if (gamesByCode[code]) {
            console.log(`Found game with code ${code} in localStorage gamesByCode`);
            const gameData = gamesByCode[code];
            
            // Check for game mode
            if (gameData.gameMode) {
              setGameMode(gameData.gameMode);
            }
            
            // Also save to sessionStorage for consistent access
            sessionStorage.setItem(specificGameKey, JSON.stringify(gameData));
            
            setGameData({
              id: gameData.id || Date.now(),
              title: gameData.title,
              description: gameData.description,
              imageUrl: gameData.coverImage,
              questions: gameData.questions,
              creator: gameData.createdBy || gameData.creator,
              category: gameData.category,
              gameMode: gameData.gameMode || 'solo'
            });
            
            // For demo, retrieve player name from local storage if available
            const storedName = localStorage.getItem('playerName');
            if (storedName) {
              setPlayerName(storedName);
            }
            
            // Retrieve team name if available
            const storedTeam = localStorage.getItem('playerTeam');
            if (storedTeam) {
              setSelectedTeam(storedTeam);
            }
            
            setLoading(false);
            return;
          }
        } catch (e) {
          console.error("Error checking gamesByCode in localStorage:", e);
        }
        
        // 4. Check in mySets from localStorage
        try {
          const mySets = JSON.parse(localStorage.getItem('mySets') || '[]');
          const foundSet = mySets.find((set: any) => set.gameCode === code);
          if (foundSet) {
            console.log(`Found game with code ${code} in mySets`);
            
            // Check for game mode
            if (foundSet.gameMode) {
              setGameMode(foundSet.gameMode);
            }
            
            // Also save to sessionStorage for consistent access
            sessionStorage.setItem(specificGameKey, JSON.stringify(foundSet));
            
            setGameData({
              id: foundSet.id || Date.now(),
              title: foundSet.title,
              description: foundSet.description,
              imageUrl: foundSet.coverImage,
              questions: foundSet.questions,
              creator: foundSet.createdBy || foundSet.creator,
              category: foundSet.category,
              gameMode: foundSet.gameMode || 'solo'
            });
            
            // For demo, retrieve player name from local storage if available
            const storedName = localStorage.getItem('playerName');
            if (storedName) {
              setPlayerName(storedName);
            }
            
            // Retrieve team name if available
            const storedTeam = localStorage.getItem('playerTeam');
            if (storedTeam) {
              setSelectedTeam(storedTeam);
            }
            
            setLoading(false);
            return;
          }
        } catch (e) {
          console.error("Error checking mySets in localStorage:", e);
        }
        
        // 5. If we have a game in quizPreviewData, use it (for demo codes)
        if (['857527', '925101'].includes(code)) {
          try {
            const quizPreviewData = sessionStorage.getItem('quizPreviewData');
            if (quizPreviewData) {
              console.log(`Using quizPreviewData for demo code ${code}`);
              const gameData = JSON.parse(quizPreviewData);
              
              // Check for game mode
              if (gameData.gameMode) {
                setGameMode(gameData.gameMode);
              }
              
              setGameData({
                id: Date.now(),
                title: gameData.title || `Demo Quiz (${code})`,
                description: gameData.description || 'A quiz for demo purposes',
                imageUrl: gameData.coverImage || 'https://source.unsplash.com/random/300x200?quiz',
                questions: gameData.questions || [],
                creator: gameData.createdBy || 'Demo Creator',
                category: gameData.category || 'General',
                gameMode: gameData.gameMode || 'solo'
              });
              
              const storedName = localStorage.getItem('playerName');
              if (storedName) {
                setPlayerName(storedName);
              }
              
              // Retrieve team name if available
              const storedTeam = localStorage.getItem('playerTeam');
              if (storedTeam) {
                setSelectedTeam(storedTeam);
              }
              
              setLoading(false);
              return;
            }
          } catch (e) {
            console.error("Error using quizPreviewData:", e);
          }
          
          // Fallback to a demo game if nothing else works
          console.log(`Using fallback demo game for code ${code}`);
          setGameData({
            id: 9999,
            title: `Demo Quiz (${code})`,
            description: 'This is a demo quiz for testing purposes',
            imageUrl: 'https://source.unsplash.com/random/300x200?quiz,game',
            gameMode: 'solo',
            questions: [
              {
                id: '1',
                question: 'What is the capital of France?',
                options: ['London', 'Berlin', 'Paris', 'Madrid'],
                correctAnswer: 2,
                timeLimit: 20
              },
              {
                id: '2',
                question: 'Which planet is known as the Red Planet?',
                options: ['Venus', 'Mars', 'Jupiter', 'Saturn'],
                correctAnswer: 1,
                timeLimit: 20
              }
            ],
            creator: 'Demo System'
          });
          
          setLoading(false);
          return;
        }
        
        // If we reach here, the code is invalid
        setError(`Invalid game code: ${code}`);
        setLoading(false);
      } catch (err) {
        setError('Failed to load game');
        console.error(err);
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

  const savePlayerName = async () => {
    if (!playerName.trim()) {
      setNameError('Please enter your name');
      return;
    }
    
    localStorage.setItem('playerName', playerName);
    setIsEditingName(false);
    setSnackbarMessage('Name saved successfully!');
    setShowSnackbar(true);
    
    // If we already have a player created (after joining the session),
    // we could update their name here via API if needed
  };

  const handleSelectAvatar = (avatarId: string) => {
    // Find the avatar in the animalAvatars array to get its color
    const avatar = animalAvatars.find(a => a.id === avatarId);
    if (avatar) {
      setSelectedAvatar(avatarId);
      setSelectedAvatarColor(avatar.color);
      localStorage.setItem('playerAvatar', avatarId);
      localStorage.setItem('playerAvatarColor', avatar.color);
      setSnackbarMessage('Avatar selected!');
      setShowSnackbar(true);
    }
  };
  
  const handleTeamChange = (event: SelectChangeEvent<string>) => {
    const team = event.target.value as string;
    setSelectedTeam(team);
    localStorage.setItem('playerTeam', team);
    setSnackbarMessage('Team selection saved!');
    setShowSnackbar(true);
  };

  const handleStartGame = async () => {
    if (!gameData || !code) return;
    
    if (!playerName.trim()) {
      setIsEditingName(true);
      setNameError('Please enter your name to continue');
      return;
    }
    
    // In team mode, verify team selection
    if (gameMode === 'team' && !selectedTeam) {
      setSnackbarMessage('Please select a team before starting');
      setShowSnackbar(true);
      return;
    }
    
    // Set loading state
    setApiLoading(true);
    setSnackbarMessage('Joining the game...');
    setShowSnackbar(true);
    
    try {
      // Create a player via API if we have a game session
      if (gameSession && gameSession.id) {
        // Get the currently logged-in user's ID if available
        const userId = user?.id ? parseInt(user.id) : 0;
        
        // Format player data for API
        const playerData = playerService.formatPlayerData(
          playerName,
          gameSession.id,
          selectedAvatar,
          selectedAvatarColor,
          userId
        );
        
        // Call API to create player
        const playerResponse = await playerService.createPlayer(playerData);
        
        if (playerResponse.status === 201 || playerResponse.status === 200) {
          console.log('Player created successfully:', playerResponse.data);
          setPlayer(playerResponse.data);
          
          // Store the player ID in session storage for reference during the game
          sessionStorage.setItem('currentPlayerId', playerResponse.data.id.toString());
        }
      }
    } catch (apiError) {
      console.error('Error creating player:', apiError);
      // Continue with local data if API fails
    } finally {
      setApiLoading(false);
    }
    
    // Continue with your existing implementation
    try {
      // Ensure the game data includes questions with the correct format
      const formattedQuizData = {
        title: gameData.title,
        description: gameData.description,
        coverImage: gameData.imageUrl,
        category: gameData.category || 'General',
        isPublic: true,
        gameMode: gameMode,
        questions: gameData.questions.map(q => ({
          id: q.id || `q-${Math.random().toString(36).substr(2, 9)}`,
          question: q.question || q.text || '',
          options: q.options || (q.answers ? q.answers.map((a: Answer | any) => a.text) : []),
          correctAnswer: q.correctAnswer !== undefined ? q.correctAnswer : 
                        (q.answers ? q.answers.findIndex((a: Answer | any) => a.isCorrect) : 0),
          timeLimit: q.timeLimit || 20
        })),
        createdBy: gameData.creator,
        gameCode: code
      };
      
      // Store the formatted quiz data in sessionStorage
      sessionStorage.setItem('quizPreviewData', JSON.stringify(formattedQuizData));
      sessionStorage.setItem('currentPlayer', playerName);
      sessionStorage.setItem('playerAvatar', selectedAvatar);
      
      // Initialize empty results that will be populated during quiz
      const initialGameResults = [
        {
          name: playerName,
          score: 0,
          correctAnswers: 0,
          totalQuestions: formattedQuizData.questions.length,
          timeBonus: 0,
          averageAnswerTime: 0, // This will be calculated during gameplay
          avatar: selectedAvatar,
          group: gameMode === 'team' ? selectedTeam : undefined // Add team info if in team mode
        }
      ];
      
      // Add demo players for testing (would be real players in multiplayer implementation)
      if (process.env.NODE_ENV !== 'production') {
        // In team mode, add some players to each team for demo
        if (gameMode === 'team') {
          // Create a mapping of players to teams
          const demoTeams = [...teamNames]; // Copy team names
          
          initialGameResults.push(
            {
              name: "Player 2",
              score: Math.floor(Math.random() * 800) + 200,
              correctAnswers: Math.floor(Math.random() * formattedQuizData.questions.length),
              totalQuestions: formattedQuizData.questions.length,
              timeBonus: Math.floor(Math.random() * 150) + 50,
              averageAnswerTime: Math.round((Math.random() * 8 + 3) * 10) / 10, // 3-11 seconds
              avatar: animalAvatars[Math.floor(Math.random() * animalAvatars.length)].id,
              group: selectedTeam // Add to current player's team
            },
            {
              name: "Player 3",
              score: Math.floor(Math.random() * 700) + 100,
              correctAnswers: Math.floor(Math.random() * formattedQuizData.questions.length),
              totalQuestions: formattedQuizData.questions.length,
              timeBonus: Math.floor(Math.random() * 120) + 30,
              averageAnswerTime: Math.round((Math.random() * 10 + 4) * 10) / 10, // 4-14 seconds
              avatar: animalAvatars[Math.floor(Math.random() * animalAvatars.length)].id,
              group: demoTeams.find(t => t !== selectedTeam) || demoTeams[0]
            },
            {
              name: "Player 4",
              score: Math.floor(Math.random() * 600) + 100,
              correctAnswers: Math.floor(Math.random() * formattedQuizData.questions.length),
              totalQuestions: formattedQuizData.questions.length,
              timeBonus: Math.floor(Math.random() * 100) + 20,
              averageAnswerTime: Math.round((Math.random() * 12 + 5) * 10) / 10, // 5-17 seconds
              avatar: animalAvatars[Math.floor(Math.random() * animalAvatars.length)].id,
              group: demoTeams.find(t => t !== selectedTeam) || demoTeams[1]
            },
            {
              name: "Player 5",
              score: Math.floor(Math.random() * 750) + 150,
              correctAnswers: Math.floor(Math.random() * formattedQuizData.questions.length),
              totalQuestions: formattedQuizData.questions.length,
              timeBonus: Math.floor(Math.random() * 130) + 40,
              averageAnswerTime: Math.round((Math.random() * 9 + 3) * 10) / 10,
              avatar: animalAvatars[Math.floor(Math.random() * animalAvatars.length)].id,
              group: demoTeams.find(t => t !== selectedTeam) || demoTeams[2]
            }
          );
        } else {
          // For solo mode, just add random players
          initialGameResults.push(
            {
              name: "Player 2",
              score: Math.floor(Math.random() * 800) + 200,
              correctAnswers: Math.floor(Math.random() * formattedQuizData.questions.length),
              totalQuestions: formattedQuizData.questions.length,
              timeBonus: Math.floor(Math.random() * 150) + 50,
              averageAnswerTime: Math.round((Math.random() * 8 + 3) * 10) / 10, // 3-11 seconds
              avatar: animalAvatars[Math.floor(Math.random() * animalAvatars.length)].id,
              group: undefined
            },
            {
              name: "Player 3",
              score: Math.floor(Math.random() * 700) + 100,
              correctAnswers: Math.floor(Math.random() * formattedQuizData.questions.length),
              totalQuestions: formattedQuizData.questions.length,
              timeBonus: Math.floor(Math.random() * 120) + 30,
              averageAnswerTime: Math.round((Math.random() * 10 + 4) * 10) / 10, // 4-14 seconds
              avatar: animalAvatars[Math.floor(Math.random() * animalAvatars.length)].id,
              group: undefined
            },
            {
              name: "Player 4",
              score: Math.floor(Math.random() * 600) + 100,
              correctAnswers: Math.floor(Math.random() * formattedQuizData.questions.length),
              totalQuestions: formattedQuizData.questions.length,
              timeBonus: Math.floor(Math.random() * 100) + 20,
              averageAnswerTime: Math.round((Math.random() * 12 + 5) * 10) / 10, // 5-17 seconds
              avatar: animalAvatars[Math.floor(Math.random() * animalAvatars.length)].id,
              group: undefined
            }
          );
        }
      }
      
      sessionStorage.setItem('gameResults', JSON.stringify(initialGameResults));
      
      // Store player info for future use
      localStorage.setItem('playerName', playerName);
      localStorage.setItem('playerAvatar', selectedAvatar);
      if (gameMode === 'team') {
        localStorage.setItem('playerTeam', selectedTeam);
      }
      
      // Show feedback to the user
      setSnackbarMessage('Starting game...');
      setShowSnackbar(true);
      
      // Navigate to the quiz page after a short delay
      setTimeout(() => {
        router.push('/play-quiz-preview');
      }, 500);
    } catch (error) {
      console.error('Error preparing game data:', error);
      alert('There was an error preparing the game. Please try again.');
    }
  };

  if (loading) {
    return (
      <PublicLayout>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
          }}
        >
          <CircularProgress size={60} sx={{ mb: 3 }} />
          <Typography variant="h6">Joining game...</Typography>
        </Box>
      </PublicLayout>
    );
  }

  if (error) {
    return (
      <PublicLayout>
        <Container maxWidth="md" sx={{ py: 6 }}>
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
          <Typography variant="body1" paragraph>
            Please check the game code and try again.
          </Typography>
          <Button
            variant="contained"
            onClick={() => router.push('/')}
            sx={{ mt: 2, borderRadius: 2 }}
          >
            Back to Home
          </Button>
        </Container>
      </PublicLayout>
    );
  }

  if (!gameData) {
    return (
      <PublicLayout>
        <Container maxWidth="md" sx={{ py: 6 }}>
          <Alert severity="warning">No game data found</Alert>
        </Container>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
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
              {gameData.title}
            </Typography>
            
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              Created by: {gameData.creator}
            </Typography>

            {/* Game mode indicator */}
            <Chip 
              icon={gameMode === 'solo' ? <PersonIcon /> : <GroupsIcon />}
              label={gameMode === 'solo' ? "Solo Mode" : "Team Mode"}
              color="primary"
              variant="outlined"
              sx={{ mb: 3 }}
            />
            
            <Box
              component="img"
              src={gameData.imageUrl}
              alt={gameData.title}
              sx={{
                width: '100%',
                maxHeight: 200,
                objectFit: 'cover',
                borderRadius: 2,
                mb: 3,
              }}
            />
            
            <Typography variant="body1" paragraph>
              {gameData.description}
            </Typography>
            
            <Typography variant="body2" sx={{ mb: 3, fontWeight: 'medium' }}>
              This quiz has {gameData.questions.length} questions
            </Typography>
            
            {/* Quiz details section to explain scoring */}
            <Paper 
              elevation={2}
              sx={{ 
                p: 3, 
                mb: 4, 
                borderRadius: 3,
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                boxShadow: '0 8px 20px rgba(0,0,0,0.08)',
              }}
            >
              <Typography variant="h6" component="div" sx={{ mb: 2, fontWeight: 'medium', display: 'flex', alignItems: 'center' }}>
                How Scoring Works
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" component="div" sx={{ mb: 1 }}>
                  <strong>• Base points:</strong> 100 points for each correct answer
                </Typography>
                <Typography variant="body2" component="div" sx={{ mb: 1 }}>
                  <strong>• Speed bonus:</strong> Up to 150 extra points based on how quickly you answer
                </Typography>
                {gameMode === 'team' && (
                  <Typography variant="body2" component="div" sx={{ mb: 1 }}>
                    <strong>• Team score:</strong> All team members' scores are combined for team ranking
                  </Typography>
                )}
                <Typography variant="body2" component="div" color="primary.main" fontWeight="medium">
                  Answer faster to earn more points!
                </Typography>
              </Box>
            </Paper>
            
            {/* Team Selection for Team Mode */}
            {gameMode === 'team' && (
              <Paper 
                elevation={2}
                sx={{ 
                  p: 3, 
                  mb: 4, 
                  borderRadius: 3,
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  boxShadow: '0 8px 20px rgba(0,0,0,0.08)',
                }}
              >
                <Typography variant="h6" component="div" sx={{ mb: 3, fontWeight: 'medium', display: 'flex', alignItems: 'center' }}>
                  <GroupsIcon sx={{ color: 'primary.main', mr: 1 }} />
                  Select Your Team
                </Typography>
                
                <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
                  <InputLabel id="team-select-label">Team</InputLabel>
                  <Select<string>
                    labelId="team-select-label"
                    value={selectedTeam}
                    onChange={(event: SelectChangeEvent<string>) => handleTeamChange(event)}
                    label="Team"
                  >
                    {teamNames.map((team) => (
                      <MenuItem key={team} value={team}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <GroupsIcon sx={{ color: 'primary.main', mr: 1, fontSize: 20 }} />
                          {team}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                <Typography variant="body2" color="text.secondary">
                  You'll be competing together with other members of your team!
                </Typography>
              </Paper>
            )}
            
            {/* Avatar selection section */}
            <Paper 
              elevation={2}
              sx={{ 
                p: 3, 
                mb: 4, 
                borderRadius: 3,
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                boxShadow: '0 8px 20px rgba(0,0,0,0.08)',
              }}
            >
              <Typography variant="h6" component="div" sx={{ mb: 3, fontWeight: 'medium' }}>
                Choose Your Avatar
              </Typography>
              
              <Box sx={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                justifyContent: 'center', 
                gap: 2, 
                mb: 3 
              }}>
                {animalAvatars.map((avatar) => (
                  <Box 
                    key={avatar.id}
                    sx={{
                      width: { xs: '25%', sm: '16.66%', md: '12.5%' },
                      maxWidth: '80px',
                      minWidth: '50px',
                    }}
                  >
                    <Box 
                      onClick={() => handleSelectAvatar(avatar.id)}
                      sx={{ 
                        cursor: 'pointer',
                        transition: 'transform 0.2s',
                        transform: selectedAvatar === avatar.id ? 'scale(1.1)' : 'scale(1)',
                        position: 'relative',
                        '&:hover': {
                          transform: 'scale(1.1)',
                        },
                      }}
                    >
                      <Box 
                        sx={{ 
                          border: selectedAvatar === avatar.id ? '3px solid #2196f3' : '3px solid transparent',
                          borderRadius: '50%',
                          overflow: 'hidden',
                          width: 64,
                          height: 64,
                        }}
                      >
                        <Animal 
                          name={avatar.name} 
                          color={avatar.color}
                          size="64px"
                        />
                      </Box>
                      {selectedAvatar === avatar.id && (
                        <Box
                          sx={{
                            position: 'absolute',
                            bottom: -10,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            bgcolor: 'primary.main',
                            color: 'white',
                            borderRadius: 10,
                            px: 1,
                            py: 0.2,
                            fontSize: '0.7rem',
                          }}
                        >
                          Selected
                        </Box>
                      )}
                    </Box>
                  </Box>
                ))}
              </Box>
            </Paper>
            
            {/* Player name section */}
            <Paper 
              elevation={2}
              sx={{ 
                p: 3, 
                mb: 4, 
                borderRadius: 3,
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                boxShadow: '0 8px 20px rgba(0,0,0,0.08)',
                border: `1px solid ${nameError ? 'rgba(211, 47, 47, 0.5)' : 'rgba(0, 0, 0, 0.08)'}`
              }}
            >
              <Typography variant="h6" component="div" sx={{ mb: 2, fontWeight: 'medium', display: 'flex', alignItems: 'center' }}>
                <PersonIcon sx={{ color: 'primary.main', mr: 1 }} />
                Enter Your Name
              </Typography>
              
              {isEditingName ? (
                <Box sx={{ mb: nameError ? 2 : 0 }}>
                  <TextField
                    fullWidth
                    placeholder="Your name here"
                    variant="outlined"
                    value={playerName}
                    onChange={handleNameChange}
                    error={!!nameError}
                    helperText={nameError}
                    autoFocus
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <Button 
                            variant="contained" 
                            size="small" 
                            onClick={savePlayerName}
                            sx={{ borderRadius: 1 }}
                          >
                            Save
                          </Button>
                        </InputAdornment>
                      ),
                      sx: { borderRadius: 2 }
                    }}
                  />
                </Box>
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ width: 48, height: 48, mr: 2, border: '2px solid #2196f3', borderRadius: '50%', overflow: 'hidden' }}>
                      <Animal 
                        name={(animalAvatars.find(a => a.id === selectedAvatar) || animalAvatars[0]).name}
                        color={(animalAvatars.find(a => a.id === selectedAvatar) || animalAvatars[0]).color}
                        size="48px"
                      />
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: '1.1rem', fontWeight: nameError ? 'bold' : 'medium', color: nameError ? 'error.main' : 'text.primary' }}>
                        {playerName || 'Guest Player'}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          {(animalAvatars.find(a => a.id === selectedAvatar)?.name || 'alligator').charAt(0).toUpperCase() + 
                            (animalAvatars.find(a => a.id === selectedAvatar)?.name || 'alligator').slice(1)} Avatar
                        </Typography>
                        
                        {gameMode === 'team' && (
                          <Chip
                            label={selectedTeam}
                            size="small"
                            color="primary"
                            variant="outlined"
                            icon={<GroupsIcon fontSize="small" />}
                            sx={{ height: 20, '& .MuiChip-label': { fontSize: '0.7rem', px: 1 } }}
                          />
                        )}
                      </Box>
                    </Box>
                  </Box>
                  <IconButton size="small" onClick={() => setIsEditingName(true)} sx={{ bgcolor: 'rgba(0,0,0,0.05)' }}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Box>
              )}
              
              {nameError && !isEditingName && (
                <Typography variant="caption" component="div" sx={{ pl: 7, display: 'block', mt: 1, color: 'error.main' }}>
                  {nameError}
                </Typography>
              )}
            </Paper>
            
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                variant="contained"
                color="primary"
                size="large"
                startIcon={<PlayIcon />}
                onClick={handleStartGame}
                sx={{
                  py: 1.8,
                  px: 5,
                  borderRadius: 8,
                  background: 'linear-gradient(45deg, #2196F3 30%, #9C27B0 90%)',
                  boxShadow: '0 4px 20px rgba(33, 150, 243, 0.4)',
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                }}
              >
                Start Game
              </Button>
            </motion.div>
          </Paper>
        </motion.div>
      </Container>
      
      <Snackbar
        open={showSnackbar}
        autoHideDuration={3000}
        onClose={() => setShowSnackbar(false)}
        message={snackbarMessage}
      />
    </PublicLayout>
  );
} 