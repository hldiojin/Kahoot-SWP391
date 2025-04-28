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
  Chip
} from '@mui/material';
import { 
  PlayArrow as PlayIcon,
  Person as PersonIcon,
  Groups as GroupsIcon
} from '@mui/icons-material';
import { useRouter, useSearchParams } from 'next/navigation';
import PublicLayout from '../components/PublicLayout';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { GameData } from '@/types/game';
import { SelectChangeEvent } from '@mui/material/Select';

// Define default team names for fallback
const DEFAULT_TEAM_NAMES = ['Team A', 'Team B', 'Team C', 'Team D'];

export default function PlayGamePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get('code');
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState('');
  const [nameError, setNameError] = useState('');
  const [gameMode, setGameMode] = useState<'solo' | 'team'>('solo');
  const [selectedTeam, setSelectedTeam] = useState<string>(DEFAULT_TEAM_NAMES[0]);
  const [teamNames, setTeamNames] = useState<string[]>(DEFAULT_TEAM_NAMES);
  const [apiLoading, setApiLoading] = useState(false);

  useEffect(() => {
    const loadGame = async () => {
      try {
        setLoading(true);
        
        if (!code) {
          setError('No game code provided');
          setLoading(false);
          return;
        }

        // Call API to check quiz code
        const response = await axios.get(
          `https://kahootclone-f7hkd0hwafgbfrfa.southeastasia-01.azurewebsites.net/api/Quiz/check-quiz-code/${code}`
        );
        
        console.log("API Response:", response.data);
        
        if (response.data) {
          if (response.data.data) {
            // If we have quiz data, use it
            const quizData = response.data.data;
            setGameData({
              id: parseInt(quizData.id),
              title: quizData.title,
              description: quizData.description,
              imageUrl: quizData.thumbnailUrl,
              questions: quizData.questions || [],
              creator: quizData.createdBy,
              category: quizData.categoryId,
              gameMode: quizData.gameMode || 'solo'
            });
            setGameMode(quizData.gameMode || 'solo');
            
            // If team mode, get teams
            if (quizData.gameMode === 'team') {
              try {
                const teamsResponse = await axios.get(
                  `https://kahootclone-f7hkd0hwafgbfrfa.southeastasia-01.azurewebsites.net/api/groups/quiz/${quizData.id}`
                );
                if (teamsResponse.data && teamsResponse.data.data) {
                  setTeamNames(teamsResponse.data.data.map((team: any) => team.name));
                }
              } catch (teamsError) {
                console.error("Error fetching teams:", teamsError);
                // Use default team names if API call fails
                setTeamNames(['Red Team', 'Blue Team', 'Green Team', 'Yellow Team']);
              }
            }
          } else if (response.data.message === "Quiz code is valid.") {
            // If we only have a valid code message, create basic game data
            setGameData({
              id: parseInt(code),
              title: `Quiz ${code}`,
              description: "Quiz đã được xác nhận",
              imageUrl: 'https://source.unsplash.com/random/300x200?quiz',
              questions: [],
              creator: "Teacher",
              category: 1,
              gameMode: 'solo'
            });
            setGameMode('solo');
          } else {
            throw new Error("Invalid quiz code");
          }
        } else {
          throw new Error("Invalid quiz code");
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

  const handleStartGame = async () => {
    if (!gameData || !code) return;
    
    if (!playerName.trim()) {
      setNameError('Please enter your name to continue');
      return;
    }
    
    if (gameMode === 'team' && !selectedTeam) {
      setError('Please select a team before starting');
      return;
    }
    
    setApiLoading(true);
    
    try {
      // Create player data
      const playerData = {
        name: playerName,
        team: gameMode === 'team' ? selectedTeam : undefined
      };

      // Call API to create player and join game
      const response = await axios.post(`/api/games/${code}/players`, playerData);
      
      if (response.data) {
        // Navigate to game page
        router.push(`/game/${code}`);
      }
    } catch (error) {
      console.error('Error joining game:', error);
      setError('Failed to join game');
    } finally {
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
            
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              Created by: {gameData?.creator || 'Unknown'}
            </Typography>

            <Chip 
              icon={gameMode === 'solo' ? <PersonIcon /> : <GroupsIcon />}
              label={gameMode === 'solo' ? "Solo Mode" : "Team Mode"}
              color="primary"
              variant="outlined"
              sx={{ mb: 3 }}
            />
            
            {gameMode === 'team' && (
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Select Team</InputLabel>
                <Select
                  value={selectedTeam}
                  onChange={handleTeamChange}
                  label="Select Team"
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
            )}

            <Box sx={{ mb: 3 }}>
              <TextField
                fullWidth
                placeholder="Enter your name"
                variant="outlined"
                value={playerName}
                onChange={handleNameChange}
                error={!!nameError}
                helperText={nameError}
                InputProps={{
                  startAdornment: (
                    <PersonIcon sx={{ color: 'primary.main', mr: 1 }} />
                  ),
                  sx: { borderRadius: 2 }
                }}
              />
            </Box>

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
                disabled={apiLoading}
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
                {apiLoading ? 'Joining...' : 'Start Game'}
              </Button>
            </motion.div>
          </Paper>
        </motion.div>
      </Container>
    </PublicLayout>
  );
} 