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
  Chip,
  Tab,
  Tabs
} from '@mui/material';
import { 
  EmojiEvents as TrophyIcon,
  ArrowBack as ArrowBackIcon,
  Home as HomeIcon,
  Groups as GroupsIcon,
  Person as PersonIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import PublicLayout from '../components/PublicLayout';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import ReactConfetti from 'react-confetti';

// Dynamically import Animal component with SSR disabled
const Animal = dynamic(() => import('react-animals'), { ssr: false });

interface PlayerScore {
  name: string;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  timeBonus?: number;
  averageAnswerTime?: number;
  avatar?: string;
  group?: string; // Add group property
}

interface GroupScore {
  name: string;
  score: number;
  memberCount: number;
  members: PlayerScore[];
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

// Array of predefined group names for demo
const groupNames = ["Team Awesome", "Brainiacs", "Quiz Masters", "Knowledge Seekers"];

// Utility function to calculate group scores from player scores
const calculateGroupScores = (playerResults: PlayerScore[]): GroupScore[] => {
  // Group players by group name
  const groupMap = new Map<string, PlayerScore[]>();
  
  // Assign players to random groups if not already assigned
  const playersWithGroups = playerResults.map(player => {
    if (!player.group) {
      const randomGroup = groupNames[Math.floor(Math.random() * groupNames.length)];
      return { ...player, group: randomGroup };
    }
    return player;
  });
  
  // Group players
  playersWithGroups.forEach(player => {
    const group = player.group || "Ungrouped";
    if (!groupMap.has(group)) {
      groupMap.set(group, []);
    }
    groupMap.get(group)!.push(player);
  });
  
  // Calculate scores for each group
  const groupScores: GroupScore[] = [];
  groupMap.forEach((members, name) => {
    const totalScore = members.reduce((sum, player) => sum + player.score, 0);
    groupScores.push({
      name,
      score: totalScore,
      memberCount: members.length,
      members
    });
  });
  
  // Sort groups by score (highest first)
  return groupScores.sort((a, b) => b.score - a.score);
};

// Function to get random avatar if needed
const getRandomAvatar = () => {
  return animalAvatars[Math.floor(Math.random() * animalAvatars.length)].id;
};

// Helper function to get animal avatar info
const getAnimalAvatar = (avatarId: string) => {
  return animalAvatars.find(a => a.id === avatarId) || animalAvatars[0];
};

export default function GameResultsPage() {
  const router = useRouter();
  const [playerResults, setPlayerResults] = useState<PlayerScore[]>([]);
  const [groupResults, setGroupResults] = useState<GroupScore[]>([]);
  const [gameTitle, setGameTitle] = useState('');
  const [currentPlayer, setCurrentPlayer] = useState('');
  const [loading, setLoading] = useState(true);
  const [playerAvatar, setPlayerAvatar] = useState('alligator');
  const [showConfetti, setShowConfetti] = useState(true);
  const [viewMode, setViewMode] = useState<'player' | 'group'>('player');
  const [gameMode, setGameMode] = useState<'solo' | 'team'>('solo');
  const [windowDimensions, setWindowDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    // Set window dimensions for confetti
    setWindowDimensions({
      width: window.innerWidth,
      height: window.innerHeight
    });

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
        
        // Get game mode from quiz data or default to solo
        const mode = quiz.gameMode || 'solo';
        setGameMode(mode);
        
        // Set initial view mode based on game mode
        setViewMode(mode === 'team' ? 'group' : 'player');
        
        // For team mode, ensure players have groups assigned
        // For solo mode, we'll still calculate groups but they're optional to view
        const resultsWithGroups = results.map((player: PlayerScore) => {
          if (mode === 'team' && !player.group) {
            return {
              ...player,
              group: groupNames[Math.floor(Math.random() * groupNames.length)]
            };
          }
          return player;
        });
        
        // Sort results by score (highest first)
        const sortedResults = [...resultsWithGroups].sort((a, b) => b.score - a.score);
        
        // Calculate speed metrics for displaying
        sortedResults.forEach(player => {
          // Set a default average answer time if not provided
          if (!player.averageAnswerTime) {
            // Average answer time is random between 3-15 seconds for demo purposes
            player.averageAnswerTime = Math.round((Math.random() * 12 + 3) * 10) / 10;
          }
          
          // Ensure each player has a valid avatar
          if (!player.avatar || !animalAvatars.find(a => a.id === player.avatar)) {
            player.avatar = animalAvatars[Math.floor(Math.random() * animalAvatars.length)].id;
          }
        });
        
        setPlayerResults(sortedResults);
        
        // Calculate group scores
        const groups = calculateGroupScores(sortedResults);
        setGroupResults(groups);
        
        setGameTitle(quiz.title);
        setCurrentPlayer(playerName || '');
        
        // Hide confetti after 5 seconds
        setTimeout(() => {
          setShowConfetti(false);
        }, 5000);
        
        // Save results to localStorage for teacher to see
        const gameId = quiz.id || Date.now();
        const gameResultsForTeacher = {
          id: gameId,
          title: quiz.title,
          description: quiz.description || '',
          gameMode: mode,
          coverImage: quiz.coverImage || quiz.imageUrl || '',
          completed: true,
          dateCompleted: new Date().toISOString(),
          playerResults: sortedResults,
          groupResults: groups,
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
    router.push('/play-quiz-preview');
  };

  const handleNewGame = () => {
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

  const handleViewModeChange = (event: React.SyntheticEvent, newValue: 'player' | 'group') => {
    setViewMode(newValue);
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
      {showConfetti && (
        <ReactConfetti
          width={windowDimensions.width}
          height={windowDimensions.height}
          recycle={false}
          numberOfPieces={300}
        />
      )}
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
            
            {/* Game Mode Indicator */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
              <Chip
                icon={gameMode === 'solo' ? <PersonIcon /> : <GroupsIcon />}
                label={gameMode === 'solo' ? "Solo Mode" : "Team Mode"}
                color="primary"
                variant="outlined"
              />
            </Box>

            {/* View Mode Tabs - Only show in team mode or if user specifically switches */}
            {(gameMode === 'team' || viewMode === 'group') && (
              <Box sx={{ width: '100%', mb: 3 }}>
                <Tabs
                  value={viewMode}
                  onChange={handleViewModeChange}
                  centered
                  sx={{ mb: 2 }}
                >
                  <Tab 
                    icon={<PersonIcon />} 
                    label="Player Scores" 
                    value="player"
                  />
                  <Tab 
                    icon={<GroupsIcon />} 
                    label="Team Scores" 
                    value="group"
                  />
                </Tabs>
              </Box>
            )}

            {/* Current player's result highlight */}
            {currentPlayer && viewMode === 'player' && (
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
                                {player.group && gameMode === 'team' && (
                                  <> • Team: <strong>{player.group}</strong></>
                                )}
                              </Typography>
                            </Box>
                          </Box>
                          <Box sx={{ textAlign: { xs: 'left', sm: 'right' }, pl: { xs: 7, sm: 0 } }}>
                            <Typography variant="h5" component="div" color="primary" sx={{ fontWeight: 'bold' }}>
                              {player.score}
                            </Typography>
                            <Typography variant="body2" component="div" color="text.secondary">
                              points
                            </Typography>
                          </Box>
                        </Box>
                      );
                    }
                    return null;
                  })}
                </Paper>
              </Box>
            )}

            {/* Current team's result highlight for team mode */}
            {currentPlayer && gameMode === 'team' && viewMode === 'group' && (
              <Box sx={{ mb: 4 }}>
                <Typography variant="subtitle1" component="div" sx={{ mb: 2, textAlign: 'center' }}>
                  Your Team
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
                  {groupResults.map((group, index) => {
                    // Find if current player is in this group
                    const currentPlayerInGroup = group.members.find(member => member.name === currentPlayer);
                    if (currentPlayerInGroup) {
                      return (
                        <Box key={index} sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between', gap: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar
                              sx={{
                                bgcolor: getMedalColor(index) !== 'transparent' ? getMedalColor(index) : 'primary.main',
                                width: 56,
                                height: 56,
                                mr: 2
                              }}
                            >
                              <GroupsIcon />
                            </Avatar>
                            <Box>
                              <Typography variant="h6" component="div">{group.name}</Typography>
                              <Typography variant="body2" component="div">
                                Rank: <strong>#{index + 1}</strong> • 
                                Members: <strong>{group.memberCount}</strong>
                              </Typography>
                            </Box>
                          </Box>
                          <Box sx={{ textAlign: { xs: 'left', sm: 'right' }, pl: { xs: 7, sm: 0 } }}>
                            <Typography variant="h5" component="div" color="primary" sx={{ fontWeight: 'bold' }}>
                              {group.score}
                            </Typography>
                            <Typography variant="body2" component="div" color="text.secondary">
                              team points
                            </Typography>
                          </Box>
                        </Box>
                      );
                    }
                    return null;
                  })}
                </Paper>
              </Box>
            )}

            {/* Leaderboard section */}
            <Typography variant="h5" sx={{ mt: 4, mb: 2, display: 'flex', alignItems: 'center' }}>
              <TrophyIcon sx={{ mr: 1 }} />
              {viewMode === 'player' ? 'Player Leaderboard' : 'Team Leaderboard'}
            </Typography>

            {viewMode === 'player' ? (
              <List sx={{ bgcolor: 'background.paper', borderRadius: 2 }}>
                {playerResults.map((player, index) => {
                  const animalInfo = getAnimalAvatar(player.avatar || getRandomAvatar());
                  return (
                    <React.Fragment key={index}>
                      {index > 0 && <Divider variant="inset" component="li" />}
                      <ListItem
                        alignItems="center"
                        sx={{
                          py: 1.5,
                          backgroundColor: player.name === currentPlayer ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
                          borderLeft: player.name === currentPlayer ? '4px solid #1976d2' : 'none',
                        }}
                      >
                        <Box 
                          sx={{ 
                            minWidth: 32, 
                            mr: 2, 
                            display: 'flex', 
                            justifyContent: 'center',
                            alignItems: 'center'
                          }}
                        >
                          <Typography 
                            variant="h6" 
                            sx={{ 
                              fontWeight: index < 3 ? 'bold' : 'normal',
                              color: index < 3 ? 'primary.main' : 'text.primary'
                            }}
                          >
                            {index + 1}
                          </Typography>
                        </Box>
                        <ListItemAvatar>
                          <Box
                            sx={{
                              width: 40,
                              height: 40,
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
                              size="40px"
                            />
                          </Box>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Typography component="span" variant="body1" sx={{ fontWeight: index < 3 ? 'bold' : 'normal' }}>
                                {player.name}
                              </Typography>
                              {player.group && gameMode === 'team' && (
                                <Chip
                                  size="small"
                                  label={player.group}
                                  sx={{ ml: 1, fontSize: '0.7rem' }}
                                />
                              )}
                            </Box>
                          }
                          secondary={
                            <React.Fragment>
                              <Typography component="span" variant="body2" color="text.primary">
                                {player.correctAnswers}/{player.totalQuestions} correct
                              </Typography>
                              {player.averageAnswerTime && (
                                <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                                  • {player.averageAnswerTime}s avg
                                </Typography>
                              )}
                            </React.Fragment>
                          }
                        />
                        <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold', ml: 2 }}>
                          {player.score}
                        </Typography>
                      </ListItem>
                    </React.Fragment>
                  );
                })}
              </List>
            ) : (
              <List sx={{ bgcolor: 'background.paper', borderRadius: 2 }}>
                {groupResults.map((group, index) => (
                  <React.Fragment key={index}>
                    {index > 0 && <Divider component="li" />}
                    <ListItem
                      alignItems="center"
                      sx={{
                        py: 1.5,
                        backgroundColor: group.members.some(m => m.name === currentPlayer) ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
                        borderLeft: group.members.some(m => m.name === currentPlayer) ? '4px solid #1976d2' : 'none',
                      }}
                    >
                      <Box 
                        sx={{ 
                          minWidth: 32, 
                          mr: 2, 
                          display: 'flex', 
                          justifyContent: 'center',
                          alignItems: 'center'
                        }}
                      >
                        <Typography 
                          variant="h6" 
                          sx={{ 
                            fontWeight: index < 3 ? 'bold' : 'normal',
                            color: index < 3 ? 'primary.main' : 'text.primary'
                          }}
                        >
                          {index + 1}
                        </Typography>
                      </Box>
                      <ListItemAvatar>
                        <Avatar
                          sx={{
                            bgcolor: getMedalColor(index) !== 'transparent' ? getMedalColor(index) : 'primary.main',
                            width: 40,
                            height: 40,
                          }}
                        >
                          <GroupsIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography component="span" variant="body1" sx={{ fontWeight: index < 3 ? 'bold' : 'normal' }}>
                            {group.name}
                          </Typography>
                        }
                        secondary={
                          <Typography component="span" variant="body2" color="text.primary">
                            {group.memberCount} members
                          </Typography>
                        }
                      />
                      <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold', ml: 2 }}>
                        {group.score}
                      </Typography>
                    </ListItem>
                    
                    {/* Group members (collapsible in future version) */}
                    <Box sx={{ pl: 9, pr: 3, pb: 2, bgcolor: 'rgba(0,0,0,0.02)' }}>
                      {group.members.slice(0, 3).map((member, midx) => (
                        <Box 
                          key={midx}
                          sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'space-between',
                            py: 0.5,
                            borderBottom: midx < group.members.slice(0, 3).length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none'
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Box
                              sx={{
                                width: 24,
                                height: 24,
                                mr: 1,
                                borderRadius: '50%',
                                overflow: 'hidden',
                                bgcolor: 'white'
                              }}
                            >
                              <Animal
                                name={getAnimalAvatar(member.avatar || getRandomAvatar()).name}
                                color={getAnimalAvatar(member.avatar || getRandomAvatar()).color}
                                size="24px"
                              />
                            </Box>
                            <Typography variant="body2">
                              {member.name}
                            </Typography>
                          </Box>
                          <Typography variant="body2" color="primary.main" sx={{ fontWeight: 'medium' }}>
                            {member.score} pts
                          </Typography>
                        </Box>
                      ))}
                      {group.members.length > 3 && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
                          +{group.members.length - 3} more members
                        </Typography>
                      )}
                    </Box>
                  </React.Fragment>
                ))}
              </List>
            )}

            {/* Action buttons */}
            <Box sx={{ mt: 4, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'center', gap: 2 }}>
              <Button
                variant="contained"
                startIcon={<RefreshIcon />}
                onClick={handlePlayAgain}
                sx={{ borderRadius: 2 }}
              >
                Play Again
              </Button>
              <Button
                variant="outlined"
                startIcon={<HomeIcon />}
                onClick={handleNewGame}
                sx={{ borderRadius: 2 }}
              >
                New Game
              </Button>
            </Box>
          </Paper>
        </motion.div>
      </Container>
    </PublicLayout>
  );
} 