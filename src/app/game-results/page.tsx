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
  Chip
} from '@mui/material';
import { 
  EmojiEvents as TrophyIcon,
  ArrowBack as ArrowBackIcon,
  Home as HomeIcon
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import PublicLayout from '../components/PublicLayout';
import { motion } from 'framer-motion';

interface PlayerScore {
  name: string;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  timeBonus?: number;
}

export default function GameResultsPage() {
  const router = useRouter();
  const [playerResults, setPlayerResults] = useState<PlayerScore[]>([]);
  const [gameTitle, setGameTitle] = useState('');
  const [currentPlayer, setCurrentPlayer] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get data from sessionStorage
    try {
      const storedResults = sessionStorage.getItem('gameResults');
      const quizData = sessionStorage.getItem('quizPreviewData');
      const playerName = sessionStorage.getItem('currentPlayer');
      
      if (storedResults && quizData) {
        const results = JSON.parse(storedResults);
        const quiz = JSON.parse(quizData);
        
        // Sort results by score (highest first)
        const sortedResults = [...results].sort((a, b) => b.score - a.score);
        
        setPlayerResults(sortedResults);
        setGameTitle(quiz.title);
        setCurrentPlayer(playerName || '');
        
        // Save results to localStorage for teacher to see
        const gameId = quiz.id || Date.now();
        const gameResultsForTeacher = {
          id: gameId,
          title: quiz.title,
          description: quiz.description || '',
          coverImage: quiz.coverImage || quiz.imageUrl || '',
          completed: true,
          dateCompleted: new Date().toISOString(),
          playerResults: sortedResults,
          questions: quiz.questions
        };
        
        // Save to localStorage (in a real app, this would be saved to a database)
        const completedGames = JSON.parse(localStorage.getItem('completedGames') || '[]');
        completedGames.push(gameResultsForTeacher);
        localStorage.setItem('completedGames', JSON.stringify(completedGames));
      }
    } catch (error) {
      console.error('Error loading game results:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handlePlayAgain = () => {
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

  if (loading) {
    return (
      <PublicLayout>
        <Container maxWidth="md" sx={{ py: 6, textAlign: 'center' }}>
          <Typography variant="h5">Loading results...</Typography>
        </Container>
      </PublicLayout>
    );
  }

  if (playerResults.length === 0) {
    return (
      <PublicLayout>
        <Container maxWidth="md" sx={{ py: 6, textAlign: 'center' }}>
          <Typography variant="h5" sx={{ mb: 2 }}>No results found</Typography>
          <Button 
            variant="contained" 
            startIcon={<HomeIcon />}
            onClick={() => router.push('/')}
          >
            Return to Home
          </Button>
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
              background: 'linear-gradient(to right, rgba(224, 234, 252, 0.7), rgba(207, 222, 243, 0.7))',
            }}
          >
            <Typography variant="h4" sx={{ mb: 1, fontWeight: 'bold', textAlign: 'center' }}>
              Game Results
            </Typography>
            <Typography variant="h6" sx={{ mb: 3, textAlign: 'center' }}>
              {gameTitle}
            </Typography>

            {/* Current player's result highlight */}
            {currentPlayer && (
              <Box sx={{ mb: 4 }}>
                <Typography variant="subtitle1" sx={{ mb: 2, textAlign: 'center' }}>
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
                      return (
                        <Box key={index} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar
                              sx={{
                                bgcolor: 'primary.main',
                                width: 50,
                                height: 50,
                                mr: 2,
                                border: '2px solid',
                                borderColor: getMedalColor(index),
                              }}
                            >
                              {player.name.charAt(0)}
                            </Avatar>
                            <Box>
                              <Typography variant="h6">{player.name}</Typography>
                              <Typography variant="body2">
                                Rank: <strong>#{getPlayerRank(player.name)}</strong> • 
                                Correct: <strong>{player.correctAnswers}/{player.totalQuestions}</strong>
                              </Typography>
                            </Box>
                          </Box>
                          <Box sx={{ textAlign: 'right' }}>
                            <Typography variant="h5" color="primary" sx={{ fontWeight: 'bold' }}>
                              {player.score}
                            </Typography>
                            <Typography variant="body2">points</Typography>
                          </Box>
                        </Box>
                      );
                    }
                    return null;
                  })}
                </Paper>
              </Box>
            )}

            {/* Leaderboard */}
            <Typography variant="h5" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
              <TrophyIcon sx={{ mr: 1, color: 'primary.main' }} />
              Leaderboard
            </Typography>
            
            <List sx={{ bgcolor: 'background.paper', borderRadius: 2, mb: 3 }}>
              {playerResults.map((player, index) => (
                <React.Fragment key={index}>
                  {index > 0 && <Divider variant="inset" component="li" />}
                  <ListItem
                    alignItems="flex-start"
                    sx={{
                      bgcolor: index < 3 ? `rgba(${index === 0 ? '255, 215, 0' : index === 1 ? '192, 192, 192' : '205, 127, 50'}, 0.1)` : 'transparent',
                      py: 1.5,
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar
                        sx={{
                          bgcolor: index < 3 ? 'primary.main' : 'grey.400',
                          border: index < 3 ? '2px solid' : 'none',
                          borderColor: getMedalColor(index),
                          width: 45,
                          height: 45,
                        }}
                      >
                        {index < 3 ? (
                          <TrophyIcon sx={{ color: '#fff' }} />
                        ) : (
                          <Typography>{index + 1}</Typography>
                        )}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: player.name === currentPlayer ? 'bold' : 'regular' }}>
                            {player.name}
                            {player.name === currentPlayer && (
                              <Chip size="small" label="You" sx={{ ml: 1, fontSize: '0.7rem', height: 20 }} color="primary" />
                            )}
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 'bold', color: index < 3 ? 'primary.main' : 'text.primary' }}>
                            {player.score} pts
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          Correct answers: {player.correctAnswers}/{player.totalQuestions}
                          {player.timeBonus ? ` • Time bonus: +${player.timeBonus}` : ''}
                        </Typography>
                      }
                    />
                  </ListItem>
                </React.Fragment>
              ))}
            </List>

            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 4 }}>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="outlined"
                  startIcon={<ArrowBackIcon />}
                  onClick={() => router.push('/')}
                  sx={{ borderRadius: 2 }}
                >
                  Exit
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="contained"
                  onClick={handlePlayAgain}
                  sx={{ 
                    borderRadius: 2,
                    background: 'linear-gradient(45deg, #2196F3 30%, #9C27B0 90%)',
                  }}
                >
                  Play Another Game
                </Button>
              </motion.div>
            </Box>
          </Paper>
        </motion.div>
      </Container>
    </PublicLayout>
  );
} 