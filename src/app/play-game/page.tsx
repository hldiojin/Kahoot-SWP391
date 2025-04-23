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
  Avatar
} from '@mui/material';
import { 
  PlayArrow as PlayIcon,
  Person as PersonIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { useRouter, useSearchParams } from 'next/navigation';
import PublicLayout from '../components/PublicLayout';
import { motion } from 'framer-motion';

interface GameData {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  questions: any[];
  creator: string;
  category?: string;  // Make category optional for formatting purposes
}

// Add interface for answer type
interface Answer {
  text: string;
  isCorrect: boolean;
}

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
  
  const [loading, setLoading] = useState(true);
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameError, setNameError] = useState('');
  const [showSnackbar, setShowSnackbar] = useState(false);

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
        
        // Try multiple sources to find the game:
        
        // 1. Check for the specific game in sessionStorage
        const specificGameKey = `game_${code}`;
        const specificGame = sessionStorage.getItem(specificGameKey);
        if (specificGame) {
          try {
            console.log(`Found game ${code} in sessionStorage`);
            const gameData = JSON.parse(specificGame);
            setGameData({
              id: gameData.id || Date.now(),
              title: gameData.title,
              description: gameData.description,
              imageUrl: gameData.coverImage,
              questions: gameData.questions,
              creator: gameData.createdBy || gameData.creator,
              category: gameData.category
            });
            
            // For demo, retrieve player name from local storage if available
            const storedName = localStorage.getItem('playerName');
            if (storedName) {
              setPlayerName(storedName);
            }
            
            setLoading(false);
            return;
          } catch (e) {
            console.error(`Error parsing game ${code} from sessionStorage:`, e);
          }
        }
        
        // 2. Check sample games (for demo purposes)
        const sampleGame = sampleGames[code];
        if (sampleGame) {
          console.log(`Found sample game with code ${code}`);
          setGameData(sampleGame);
          
          // Prepare for quiz preview
          sessionStorage.setItem('quizPreviewData', JSON.stringify({
            title: sampleGame.title,
            description: sampleGame.description,
            coverImage: sampleGame.imageUrl,
            questions: sampleGame.questions
          }));
          
          // For demo, retrieve player name from local storage if available
          const storedName = localStorage.getItem('playerName');
          if (storedName) {
            setPlayerName(storedName);
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
            
            // Also save to sessionStorage for consistent access
            sessionStorage.setItem(specificGameKey, JSON.stringify(gameData));
            
            setGameData({
              id: gameData.id || Date.now(),
              title: gameData.title,
              description: gameData.description,
              imageUrl: gameData.coverImage,
              questions: gameData.questions,
              creator: gameData.createdBy || gameData.creator,
              category: gameData.category
            });
            
            // For demo, retrieve player name from local storage if available
            const storedName = localStorage.getItem('playerName');
            if (storedName) {
              setPlayerName(storedName);
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
            
            // Also save to sessionStorage for consistent access
            sessionStorage.setItem(specificGameKey, JSON.stringify(foundSet));
            
            setGameData({
              id: foundSet.id || Date.now(),
              title: foundSet.title,
              description: foundSet.description,
              imageUrl: foundSet.coverImage,
              questions: foundSet.questions,
              creator: foundSet.createdBy || foundSet.creator,
              category: foundSet.category
            });
            
            // For demo, retrieve player name from local storage if available
            const storedName = localStorage.getItem('playerName');
            if (storedName) {
              setPlayerName(storedName);
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
              setGameData({
                id: Date.now(),
                title: gameData.title || `Demo Quiz (${code})`,
                description: gameData.description || 'A quiz for demo purposes',
                imageUrl: gameData.coverImage || 'https://source.unsplash.com/random/300x200?quiz',
                questions: gameData.questions || [],
                creator: gameData.createdBy || 'Demo Creator',
                category: gameData.category || 'General'
              });
              
              const storedName = localStorage.getItem('playerName');
              if (storedName) {
                setPlayerName(storedName);
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

  const savePlayerName = () => {
    if (!playerName.trim()) {
      setNameError('Please enter your name');
      return;
    }
    
    localStorage.setItem('playerName', playerName);
    setIsEditingName(false);
    setShowSnackbar(true);
  };

  const handleStartGame = () => {
    if (!gameData || !code) return;
    
    if (!playerName.trim()) {
      setIsEditingName(true);
      setNameError('Please enter your name to continue');
      return;
    }
    
    // In a real app, this would initialize a game session
    try {
      // Ensure the game data includes questions with the correct format
      const formattedQuizData = {
        title: gameData.title,
        description: gameData.description,
        coverImage: gameData.imageUrl,
        category: gameData.category || 'General',
        isPublic: true,
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
      
      // Initialize empty results that will be populated during quiz
      const initialGameResults = [
        {
          name: playerName,
          score: 0,
          correctAnswers: 0,
          totalQuestions: formattedQuizData.questions.length,
          timeBonus: 0
        }
      ];
      
      // Add demo players for testing (would be real players in multiplayer implementation)
      if (process.env.NODE_ENV !== 'production') {
        initialGameResults.push(
          {
            name: "Player 2",
            score: Math.floor(Math.random() * 800) + 200,
            correctAnswers: Math.floor(Math.random() * formattedQuizData.questions.length),
            totalQuestions: formattedQuizData.questions.length,
            timeBonus: Math.floor(Math.random() * 100)
          },
          {
            name: "Player 3",
            score: Math.floor(Math.random() * 700) + 100,
            correctAnswers: Math.floor(Math.random() * formattedQuizData.questions.length),
            totalQuestions: formattedQuizData.questions.length,
            timeBonus: Math.floor(Math.random() * 80)
          },
          {
            name: "Player 4",
            score: Math.floor(Math.random() * 600) + 100,
            correctAnswers: Math.floor(Math.random() * formattedQuizData.questions.length),
            totalQuestions: formattedQuizData.questions.length,
            timeBonus: Math.floor(Math.random() * 60)
          }
        );
      }
      
      sessionStorage.setItem('gameResults', JSON.stringify(initialGameResults));
      
      // Store player name for future use
      localStorage.setItem('playerName', playerName);
      
      // Show feedback to the user
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
              textAlign: 'center',
              background: 'linear-gradient(to right, rgba(224, 234, 252, 0.7), rgba(207, 222, 243, 0.7))',
            }}
          >
            <Typography variant="h4" sx={{ mb: 2, fontWeight: 'bold' }}>
              {gameData.title}
            </Typography>
            
            <Typography variant="subtitle1" sx={{ mb: 3 }}>
              Created by: {gameData.creator}
            </Typography>
            
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
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'medium', display: 'flex', alignItems: 'center' }}>
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
                    <Avatar 
                      sx={{ 
                        bgcolor: 'primary.main', 
                        mr: 2,
                        width: 40,
                        height: 40,
                        background: 'linear-gradient(45deg, #2196F3 30%, #9C27B0 90%)',
                      }}
                    >
                      {playerName ? playerName.charAt(0).toUpperCase() : 'G'}
                    </Avatar>
                    <Typography sx={{ fontSize: '1.1rem', fontWeight: nameError ? 'bold' : 'medium', color: nameError ? 'error.main' : 'text.primary' }}>
                      {playerName || 'Guest Player'}
                    </Typography>
                  </Box>
                  <IconButton size="small" onClick={() => setIsEditingName(true)} sx={{ bgcolor: 'rgba(0,0,0,0.05)' }}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Box>
              )}
              
              {nameError && !isEditingName && (
                <Typography color="error" variant="caption" sx={{ pl: 7, display: 'block', mt: 1 }}>
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
        message="Name saved successfully!"
      />
    </PublicLayout>
  );
} 