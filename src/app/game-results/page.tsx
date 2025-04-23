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
import Animal from 'react-animals';

interface PlayerScore {
  name: string;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  timeBonus?: number;
  averageAnswerTime?: number;
  avatar?: string;
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

export default function GameResultsPage() {
  const router = useRouter();
  const [playerResults, setPlayerResults] = useState<PlayerScore[]>([]);
  const [gameTitle, setGameTitle] = useState('');
  const [currentPlayer, setCurrentPlayer] = useState('');
  const [loading, setLoading] = useState(true);
  const [playerAvatar, setPlayerAvatar] = useState('alligator');

  useEffect(() => {
    // Get data from sessionStorage
    try {
      const storedResults = sessionStorage.getItem('gameResults');
      const quizData = sessionStorage.getItem('quizPreviewData');
      const playerName = sessionStorage.getItem('currentPlayer');
      const storedAvatar = sessionStorage.getItem('playerAvatar');
      
      if (storedAvatar) {
        setPlayerAvatar(storedAvatar);
      }
      
      if (storedResults && quizData) {
        const results = JSON.parse(storedResults);
        const quiz = JSON.parse(quizData);
        
        // Sort results by score (highest first)
        const sortedResults = [...results].sort((a, b) => b.score - a.score);
        
        // Calculate speed metrics for displaying
        sortedResults.forEach(player => {
          // Set a default average answer time if not provided
          if (!player.averageAnswerTime) {
            // Average answer time is random between 3-15 seconds for demo purposes
            // In a real app, this would be calculated from actual answer times
            player.averageAnswerTime = Math.round((Math.random() * 12 + 3) * 10) / 10;
          }
          
          // Ensure each player has a valid avatar
          if (!player.avatar || !animalAvatars.find(a => a.id === player.avatar)) {
            player.avatar = animalAvatars[Math.floor(Math.random() * animalAvatars.length)].id;
          }
        });
        
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

  // Helper function to get animal avatar info
  const getAnimalAvatar = (avatarId: string) => {
    return animalAvatars.find(a => a.id === avatarId) || animalAvatars[0];
  };

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
                              </Typography>
                            </Box>
                          </Box>
                          <Box sx={{ textAlign: { xs: 'left', sm: 'right' }, pl: { xs: 7, sm: 0 } }}>
                            <Typography variant="h5" component="div" color="primary" sx={{ fontWeight: 'bold' }}>
                              {player.score}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: { xs: 'flex-start', sm: 'flex-end' }, gap: 1 }}>
                              <Typography variant="body2" component="span">points</Typography>
                              {player.timeBonus && (
                                <Chip 
                                  size="small" 
                                  label={`+${player.timeBonus} speed bonus`}
                                  color="secondary"
                                  sx={{ height: 20, fontSize: '0.7rem' }}
                                />
                              )}
                            </Box>
                          </Box>
                        </Box>
                      );
                    }
                    return null;
                  })}
                </Paper>
              </Box>
            )}

            {/* Explanation of scoring */}
            <Paper
              elevation={2}
              sx={{
                p: 2,
                mb: 3,
                borderRadius: 2,
                backgroundColor: 'rgba(255, 255, 255, 0.7)',
                borderLeft: '4px solid',
                borderColor: 'info.main',
              }}
            >
              <Typography variant="subtitle2" component="div" color="info.main" fontWeight="medium">
                Scoring System
              </Typography>
              <Typography variant="body2" component="div" sx={{ mt: 1 }}>
                • Base points: 100 points per correct answer
              </Typography>
              <Typography variant="body2" component="div">
                • Speed bonus: Up to 150 additional points based on how quickly you answer
              </Typography>
              <Typography variant="body2" component="div">
                • Fastest answers receive the highest bonuses!
              </Typography>
            </Paper>

            {/* Leaderboard */}
            <Typography variant="h5" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
              <TrophyIcon sx={{ mr: 1, color: 'primary.main' }} />
              Leaderboard
            </Typography>
            
            <List sx={{ bgcolor: 'background.paper', borderRadius: 2, mb: 3 }}>
              {playerResults.map((player, index) => {
                const animalInfo = getAnimalAvatar(player.avatar || (player.name === currentPlayer ? playerAvatar : 'alligator'));
                return (
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
                        <Box sx={{ position: 'relative' }}>
                          <Box
                            sx={{
                              width: 48,
                              height: 48,
                              border: index < 3 ? '2px solid' : 'none',
                              borderColor: getMedalColor(index),
                              borderRadius: '50%',
                              overflow: 'hidden',
                              bgcolor: 'white'
                            }}
                          >
                            <Animal
                              name={animalInfo.name}
                              color={animalInfo.color}
                              size="48px"
                            />
                          </Box>
                          
                          {index < 3 && (
                            <Box
                              sx={{
                                position: 'absolute',
                                bottom: -3,
                                right: -3,
                                width: 22,
                                height: 22,
                                bgcolor: index === 0 ? 'gold' : index === 1 ? 'silver' : '#CD7F32',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '1px solid white'
                              }}
                            >
                              <Typography variant="caption" component="span" sx={{ color: 'white', fontWeight: 'bold', fontSize: '0.7rem' }}>
                                {index + 1}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="subtitle1" component="span" sx={{ fontWeight: player.name === currentPlayer ? 'bold' : 'regular' }}>
                              {player.name}
                              {player.name === currentPlayer && (
                                <Chip size="small" label="You" sx={{ ml: 1, fontSize: '0.7rem', height: 20 }} color="primary" />
                              )}
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                              <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', color: index < 3 ? 'primary.main' : 'text.primary' }}>
                                {player.score} pts
                              </Typography>
                              {player.timeBonus && player.timeBonus > 0 && (
                                <Typography variant="caption" component="span" sx={{ color: 'secondary.main', fontWeight: 'medium' }}>
                                  includes {player.timeBonus} speed bonus
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        }
                        secondary={
                          <Typography variant="body2" component="span" sx={{ color: 'text.secondary' }}>
                            Correct answers: {player.correctAnswers}/{player.totalQuestions}
                            {player.averageAnswerTime && 
                              ` • Avg. time: ${player.averageAnswerTime}s`
                            }
                          </Typography>
                        }
                      />
                    </ListItem>
                  </React.Fragment>
                );
              })}
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