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
  Tabs,
  CircularProgress,
  Collapse,
  Stack,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  ToggleButtonGroup,
  ToggleButton,
  Card,
  CardContent,
  CardHeader
} from '@mui/material';
import { 
  EmojiEvents as TrophyIcon,
  ArrowBack as ArrowBackIcon,
  Home as HomeIcon,
  Groups as GroupsIcon,
  Person as PersonIcon,
  Refresh as RefreshIcon,
  ExpandLess,
  ExpandMore,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Feedback as FeedbackIcon
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import PublicLayout from '../components/PublicLayout';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import ReactConfetti from 'react-confetti';

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
  id?: number; // Add id property for player identification
}

interface GroupScore {
  name: string;
  score: number;
  memberCount: number;
  members: PlayerScore[];
}

// Add this interface for player answers
interface PlayerAnswer {
  id: number;
  playerId: number;
  questionId: number;
  answeredAt: string;
  isCorrect: boolean;
  responseTime: number; 
  answer: string; // A, B, C, D, or T for timeout
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

// Helper function to normalize API response data
const normalizeApiResponse = (responseData: any): any[] => {
  // Check if the response follows the { status, data: [...] } pattern
  if (responseData?.status && Array.isArray(responseData.data)) {
    return responseData.data;
  }
  
  // Check if the response is a direct array
  if (Array.isArray(responseData)) {
    return responseData;
  }
  
  // Check if the response has a data property that is an array
  if (responseData?.data && Array.isArray(responseData.data)) {
    return responseData.data;
  }
  
  // Return empty array if we can't determine the structure
  console.warn("Could not normalize API response:", responseData);
  return [];
};

// Add this helper function near the top of the file, after the other utility functions
const fetchPlayerById = async (playerId: number): Promise<any> => {
  try {
    const response = await fetch(
      `https://kahootclone-f7hkd0hwafgbfrfa.southeastasia-01.azurewebsites.net/api/Player/${playerId}`
    );
    
    if (!response.ok) {
      console.warn(`Error fetching player ${playerId}: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    
    if (data && data.status === 200 && data.data) {
      return data.data;
    }
    
    return null;
  } catch (error) {
    console.error(`Error fetching player ${playerId}:`, error);
    return null;
  }
};

export default function GameResultsPage() {
  const router = useRouter();
  const [playerResults, setPlayerResults] = useState<PlayerScore[]>([]);
  const [groupResults, setGroupResults] = useState<GroupScore[]>([]);
  const [playerAnswers, setPlayerAnswers] = useState<PlayerAnswer[]>([]);
  const [answersLoading, setAnswersLoading] = useState(false);
  const [gameTitle, setGameTitle] = useState('');
  const [currentPlayer, setCurrentPlayer] = useState('');
  const [loading, setLoading] = useState(true);
  const [playerAvatar, setPlayerAvatar] = useState('alligator');
  const [showConfetti, setShowConfetti] = useState(true);
  const [viewMode, setViewMode] = useState<'player' | 'group'>('player');
  const [gameMode, setGameMode] = useState<'solo' | 'team'>('solo');
  const [windowDimensions, setWindowDimensions] = useState({ width: 0, height: 0 });
  const [playerInfo, setPlayerInfo] = useState<any>(null);
  const [currentQuizData, setCurrentQuizData] = useState<any>(null);
  const [showAnswerDetails, setShowAnswerDetails] = useState(false);
  const [playerAnswerMap, setPlayerAnswerMap] = useState<{[questionId: string]: {[playerId: string]: PlayerAnswer}}>({});
  const [questionMap, setQuestionMap] = useState<{[questionId: string]: any}>({});
  const [showResults, setShowResults] = useState(false); // Add this state for showing detailed results

  useEffect(() => {
    // Set window dimensions for confetti
    setWindowDimensions({
      width: window.innerWidth,
      height: window.innerHeight
    });

    // Get data from sessionStorage
    try {
      console.log("Loading game results data from sessionStorage...");
      
      const storedResults = sessionStorage.getItem('gameResults');
      const quizData = sessionStorage.getItem('quizPreviewData') || sessionStorage.getItem('currentQuiz');
      const playerInfo = sessionStorage.getItem('currentPlayer');
      const storedAvatar = sessionStorage.getItem('playerAvatar');
      
      console.log("storedResults:", storedResults ? "Found" : "Not found");
      console.log("quizData:", quizData ? "Found" : "Not found");
      console.log("playerInfo:", playerInfo ? "Found" : "Not found");
      
      // First try to determine if this should be team mode
      const quizCode = sessionStorage.getItem('quizCode');
      console.log("Checking game mode for quiz code:", quizCode);
      
      // Check all possible sources for game mode information
      let detectedGameMode: 'solo' | 'team' = 'solo';
      
      // 1. Check quiz-specific game mode in sessionStorage
      if (quizCode) {
        const quizSpecificMode = sessionStorage.getItem(`quizMode_${quizCode}`);
        console.log(`Quiz-specific game mode from sessionStorage: ${quizSpecificMode}`);
        if (quizSpecificMode === 'team') {
          console.log('✅ Using team mode from quiz-specific sessionStorage key');
          detectedGameMode = 'team';
        }
      }
      
      // 2. Check general game mode in sessionStorage
      if (detectedGameMode !== 'team') {
        const generalMode = sessionStorage.getItem('gameMode');
        console.log(`General game mode from sessionStorage: ${generalMode}`);
        if (generalMode === 'team') {
          console.log('✅ Using team mode from general sessionStorage key');
          detectedGameMode = 'team';
        }
      }
      
      // 3. Check localStorage for team mode indicators
      if (detectedGameMode !== 'team' && quizCode) {
        // Check direct flag
        const directFlag = localStorage.getItem(`quizIsTeamMode_${quizCode}`);
        console.log(`Direct team mode flag from localStorage: ${directFlag}`);
        if (directFlag === 'true') {
          console.log('✅ Using team mode from direct localStorage flag');
          detectedGameMode = 'team';
        }
        
        // Check array of team mode quizzes
        try {
          const teamModeQuizzes = JSON.parse(localStorage.getItem('teamModeQuizzes') || '[]');
          if (quizCode && Array.isArray(teamModeQuizzes) && teamModeQuizzes.includes(quizCode)) {
            console.log('✅ Using team mode from teamModeQuizzes array in localStorage');
            detectedGameMode = 'team';
          }
        } catch (e) {
          console.error('Error checking teamModeQuizzes:', e);
        }
      }
      
      // 4. Check if player has a team assigned
      if (detectedGameMode !== 'team' && playerInfo) {
        try {
          const parsedPlayerInfo = JSON.parse(playerInfo);
          if (parsedPlayerInfo && parsedPlayerInfo.team) {
            console.log(`Player has team assigned: ${parsedPlayerInfo.team}`);
            console.log('✅ Using team mode because player has a team assigned');
            detectedGameMode = 'team';
          }
        } catch (e) {
          console.error('Error checking player team:', e);
        }
      }
      
      // 5. Check quiz data for gameMode or teamCount
      if (detectedGameMode !== 'team' && quizData) {
        try {
          const parsedQuizData = JSON.parse(quizData);
          console.log(`Game mode from quiz data: ${parsedQuizData.gameMode}`);
          
          if (parsedQuizData.gameMode === 'team') {
            console.log('✅ Using team mode from quiz data gameMode field');
            detectedGameMode = 'team';
          } else if (parsedQuizData.teamCount && parsedQuizData.teamCount > 0) {
            console.log(`Quiz has teamCount: ${parsedQuizData.teamCount}`);
            console.log('✅ Using team mode because quiz has teamCount > 0');
            detectedGameMode = 'team';
          }
        } catch (e) {
          console.error('Error checking quiz data for game mode:', e);
        }
      }
      
      console.log(`Final determined game mode: ${detectedGameMode}`);
      setGameMode(detectedGameMode);
      
      // If team mode was detected, set the view mode to group by default
      // Otherwise, force view mode to player for solo mode
      if (detectedGameMode === 'team') {
        setViewMode('group');
      } else {
        // For solo mode, always use player view mode
        setViewMode('player');
      }
      
      // Set player info
      let currentPlayerData = null;
      if (playerInfo) {
        const parsedPlayerInfo = JSON.parse(playerInfo);
        setPlayerInfo(parsedPlayerInfo);
        currentPlayerData = parsedPlayerInfo;
        console.log("Player info:", parsedPlayerInfo);
      } else {
        console.warn("No player information found in sessionStorage");
      }
      
      // Set quiz data
      let currentQuizData = null;
      if (quizData) {
        const parsedQuizData = JSON.parse(quizData);
        setCurrentQuizData(parsedQuizData);
        currentQuizData = parsedQuizData;
        console.log("Quiz data:", parsedQuizData);
        
        // Save quiz code to sessionStorage if available
        if (parsedQuizData.quizCode) {
          const quizCodeStr = parsedQuizData.quizCode.toString();
          console.log(`Saving quiz code to sessionStorage: ${quizCodeStr}`);
          sessionStorage.setItem('quizCode', quizCodeStr);
          
          // Make sure the game mode is properly stored with this quiz code
          if (detectedGameMode === 'team') {
            console.log(`Ensuring team mode is saved for quiz code: ${quizCodeStr}`);
            sessionStorage.setItem(`quizMode_${quizCodeStr}`, 'team');
            sessionStorage.setItem('gameMode', 'team');
            
            // Also save to localStorage for persistence
            try {
              const teamModeQuizzes = JSON.parse(localStorage.getItem('teamModeQuizzes') || '[]');
              if (!teamModeQuizzes.includes(quizCodeStr)) {
                teamModeQuizzes.push(quizCodeStr);
                localStorage.setItem('teamModeQuizzes', JSON.stringify(teamModeQuizzes));
                console.log(`Added quiz ${quizCodeStr} to teamModeQuizzes in localStorage`);
              }
            } catch (e) {
              console.error('Error updating teamModeQuizzes in localStorage:', e);
              // Fallback to direct flag
              localStorage.setItem(`quizIsTeamMode_${quizCodeStr}`, 'true');
            }
          }
        }
      } else {
        console.warn("No quiz data found in sessionStorage");
      }

      // Set player avatar if found in sessionStorage
      if (storedAvatar) {
        setPlayerAvatar(storedAvatar);
      }

      // Function to fetch all players for this quiz
      const fetchAllPlayersForQuiz = async (quizId: number, quizCode: string) => {
        try {
          console.log(`Fetching all players for quiz ID ${quizId} and code ${quizCode}`);
          
          // First try to get players from localStorage (for local testing between tabs)
          const allLocalResults = localStorage.getItem(`quizResults_${quizCode}`);
          if (allLocalResults) {
            try {
              const parsedLocalResults = JSON.parse(allLocalResults);
              if (Array.isArray(parsedLocalResults) && parsedLocalResults.length > 0) {
                console.log("Found local multi-player results:", parsedLocalResults);
                return parsedLocalResults;
              }
            } catch (e) {
              console.error("Error parsing local results:", e);
            }
          }
          
          // Try to get the current player's data to use as a fallback
          let currentPlayerData;
          try {
            const currentPlayerStr = sessionStorage.getItem('currentPlayer');
            if (currentPlayerStr) {
              currentPlayerData = JSON.parse(currentPlayerStr);
            }
          } catch (e) {
            console.error("Error getting current player data:", e);
          }
          
          // Try to get the complete game data to use as a fallback
          let completeGameData;
          try {
            const completeGameDataStr = sessionStorage.getItem('completeGameData');
            if (completeGameDataStr) {
              completeGameData = JSON.parse(completeGameDataStr);
            }
          } catch (e) {
            console.error("Error getting complete game data:", e);
          }
          
          // Get data from session storage as fallback for API calls
          let questionsFromStorage = [];
          try {
            if (currentQuizData && currentQuizData.questions) {
              questionsFromStorage = currentQuizData.questions;
            } else {
              const quizDataStr = sessionStorage.getItem('quizPreviewData') || sessionStorage.getItem('currentQuiz');
              if (quizDataStr) {
                const parsedQuizData = JSON.parse(quizDataStr);
                if (parsedQuizData && parsedQuizData.questions) {
                  questionsFromStorage = parsedQuizData.questions;
                }
              }
            }
          } catch (e) {
            console.error("Error getting questions from storage:", e);
          }
          
          // Try to get player data directly from API - using getPlayerById endpoint which is more reliable
          try {
            // Try to get player IDs from session storage first
            let playerIds: number[] = [];
            
            // Check for player answers in localStorage or session storage
            const storedAnswers = localStorage.getItem(`quizAnswers_${quizId}`) || sessionStorage.getItem(`detailedAnswers_${quizId}`);
            if (storedAnswers) {
              try {
                const parsedAnswers = JSON.parse(storedAnswers);
                if (Array.isArray(parsedAnswers) && parsedAnswers.length > 0) {
                  // Extract unique player IDs from the answers
                  playerIds = [...new Set(parsedAnswers.map((answer: any) => answer.playerId))];
                  console.log("Got player IDs from stored answers:", playerIds);
                }
              } catch (e) {
                console.error("Error parsing stored answers for player IDs:", e);
              }
            }
            
            // If we don't have player IDs from storage, try to get them from /api/Player endpoint
            if (playerIds.length === 0) {
              // Try to get all players (might work on some API versions)
              const allPlayersResponse = await fetch(
                `https://kahootclone-f7hkd0hwafgbfrfa.southeastasia-01.azurewebsites.net/api/Player`,
                { headers: { 'Accept': 'application/json' } }
              );
              
              if (allPlayersResponse.ok) {
                const allPlayersData = await allPlayersResponse.json();
                if (allPlayersData && Array.isArray(allPlayersData.data)) {
                  // Filter for players in this session/quiz if we have session ID information
                  if (currentQuizData && currentQuizData.sessionId) {
                    playerIds = allPlayersData.data
                      .filter((p: any) => p.sessionId === currentQuizData.sessionId)
                      .map((p: any) => p.id);
                  } else {
                    // Just take the first few players as fallback
                    playerIds = allPlayersData.data.slice(0, 5).map((p: any) => p.id);
                  }
                  console.log("Got player IDs from all players endpoint:", playerIds);
                }
              }
            }
            
            // Add current player ID if available
            if (currentPlayerData && currentPlayerData.id && !playerIds.includes(currentPlayerData.id)) {
              playerIds.push(currentPlayerData.id as number);
            }
            
            // If we've found some player IDs, get their details
            if (playerIds.length > 0) {
              const playersPromises = playerIds.map(async (playerId) => {
                // Convert playerId to number to ensure proper type
                const playerIdNumber = typeof playerId === 'string' ? parseInt(playerId, 10) : Number(playerId);
                
                // Try to get player details from Player/{id} endpoint
                const playerData = await fetchPlayerById(playerIdNumber);
                
                // Generate mock answer stats for this player
                const playerAnswers = generateMockAnswers(quizId, playerIdNumber, questionsFromStorage);
                const correctAnswers = playerAnswers.filter(answer => answer.isCorrect).length;
                const totalScore = correctAnswers * 100; // Simple scoring: 100 points per correct answer
                
                if (playerData) {
                  return {
                    name: playerData.nickname || playerData.name || `Player ${playerId}`,
                    score: playerData.score || totalScore,
                    correctAnswers: correctAnswers,
                    totalQuestions: questionsFromStorage.length || playerAnswers.length,
                    avatar: playerData.avatarUrl || playerData.avatar || 'alligator',
                    group: playerData.team || playerData.teamName || playerData.groupName || null,
                    id: playerIdNumber
                  };
                } else {
                  // If we couldn't get player details, create a placeholder
                  return {
                    name: `Player ${playerId}`,
                    score: totalScore,
                    correctAnswers: correctAnswers,
                    totalQuestions: questionsFromStorage.length || playerAnswers.length,
                    avatar: 'alligator',
                    group: gameMode === 'team' ? groupNames[Math.floor(Math.random() * groupNames.length)] : undefined,
                    id: playerIdNumber
                  };
                }
              });
              
              // Wait for all player details to be fetched
              const players = await Promise.all(playersPromises);
              console.log("Processed players from IDs:", players);
              return players;
            }
          } catch (playerError) {
            console.error("Error processing players:", playerError);
          }
          
          // If we've reached here, we need to generate mock data
          // If we have complete game data or current player data, generate mock players
          if (completeGameData || currentPlayerData) {
            console.log("Generating mock player data as fallback");
            const mockPlayers: PlayerScore[] = [];
            
            // Add current player if available
            if (currentPlayerData) {
              const correctAnswersCount = completeGameData?.correctAnswers || Math.floor(Math.random() * questionsFromStorage.length);
              mockPlayers.push({
                name: currentPlayerData.name || 'You',
                score: completeGameData?.score || correctAnswersCount * 100,
                correctAnswers: correctAnswersCount,
                totalQuestions: questionsFromStorage.length || 5,
                avatar: currentPlayerData.avatar || 'alligator',
                group: currentPlayerData.team || undefined,
                id: currentPlayerData.id || 1
              });
            }
            
            // Add some mock players with randomized scores
            const animalOptions = ['elephant', 'dolphin', 'turtle', 'penguin', 'beaver', 'tiger', 'fox'];
            const nameOptions = ['Alex', 'Sam', 'Jordan', 'Taylor', 'Casey', 'Morgan', 'Riley'];
            
            for (let i = 0; i < 3; i++) {
              const correctAnswers = Math.floor(Math.random() * questionsFromStorage.length);
              mockPlayers.push({
                name: nameOptions[Math.floor(Math.random() * nameOptions.length)],
                score: correctAnswers * 100 + Math.floor(Math.random() * 50), // Add some randomness
                correctAnswers: correctAnswers,
                totalQuestions: questionsFromStorage.length || 5,
                avatar: animalOptions[Math.floor(Math.random() * animalOptions.length)],
                group: (gameMode === 'team') ? groupNames[Math.floor(Math.random() * groupNames.length)] : undefined,
                id: i + 2 // Start from 2 to avoid conflict with current player ID
              });
            }
            
            return mockPlayers;
          }
          
          // Final fallback - minimal player data
          return [{
            name: 'You',
            score: 100,
            correctAnswers: 1,
            totalQuestions: 5,
            avatar: 'alligator',
            id: 1
          }];
        } catch (error) {
          console.error("Error fetching all players:", error);
          
          // Guaranteed fallback - always return at least one player
          return [{
            name: 'You',
            score: 100,
            correctAnswers: 1,
            totalQuestions: 5,
            avatar: 'alligator',
            id: 1
          }];
        }
      };
      
      // Process game results and try to include other players
      const processResults = async () => {
        let combinedResults: PlayerScore[] = [];
        
        // Start with current player's results from sessionStorage
        if (storedResults) {
          try {
            const results = JSON.parse(storedResults);
            if (Array.isArray(results)) {
              combinedResults = [...results];
              
              // Set the game title if we have quiz data
              if (currentQuizData) {
                setGameTitle(currentQuizData.title || "Quiz Game");
              }
              
              // Set current player name
              if (currentPlayerData) {
                setCurrentPlayer(currentPlayerData.name || '');
              }
            }
          } catch (error) {
            console.error('Error processing stored results:', error);
          }
        }
        
        // Try to get results from complete game data as a backup
        const completeGameData = sessionStorage.getItem('completeGameData');
        if (completeGameData && combinedResults.length === 0) {
          try {
            const parsedGameData = JSON.parse(completeGameData);
            if (parsedGameData && parsedGameData.player) {
              // Check if we can detect team mode from complete game data
              if (parsedGameData.gameMode === 'team' || 
                  (parsedGameData.player.team && parsedGameData.player.team !== null) ||
                  detectedGameMode === 'team') {
                console.log("✅ Setting team mode from complete game data");
                setGameMode('team');
                setViewMode('group');
              }
              
              const playerResult = {
                name: parsedGameData.player.name,
                score: parsedGameData.score,
                correctAnswers: parsedGameData.correctAnswers,
                totalQuestions: parsedGameData.totalQuestions,
                avatar: parsedGameData.player.avatar,
                group: currentPlayerData ? currentPlayerData.team : null
              };
              
              combinedResults = [playerResult];
              console.log("Using player results from complete game data:", combinedResults);
              
              if (currentQuizData) {
                setGameTitle(currentQuizData.title || "Quiz Game");
              }
              
              setCurrentPlayer(parsedGameData.player.name);
              
              if (parsedGameData.player?.id && parsedGameData.quizId) {
                fetchPlayerAnswers(parsedGameData.player.id, parsedGameData.quizId);
              }
            }
          } catch (error) {
            console.error("Error parsing complete game data:", error);
          }
        }
        
        // Now try to get other players' results
        if (quizCode && currentQuizData && currentQuizData.id) {
          try {
            // Get other players for this quiz
            const otherPlayers = await fetchAllPlayersForQuiz(currentQuizData.id, quizCode);
            
            if (otherPlayers.length > 0) {
              // If we don't have our player in the combined results yet, try to use API data
              if (combinedResults.length === 0 && currentPlayerData) {
                // Try to find the current player in the API results
                const apiCurrentPlayer = otherPlayers.find((p: PlayerScore) => 
                  p.name === currentPlayerData.name || 
                  (p.id && currentPlayerData.id && p.id === currentPlayerData.id)
                );
                
                if (apiCurrentPlayer) {
                  combinedResults = [apiCurrentPlayer];
                  setCurrentPlayer(apiCurrentPlayer.name);
                }
              }
              
              // Add other players to the results if they're not already included
              otherPlayers.forEach((player: PlayerScore) => {
                // Skip if this player is already in the results
                if (!combinedResults.some(p => p.name === player.name)) {
                  combinedResults.push(player);
                }
              });
              
              console.log(`Combined results including ${combinedResults.length} players:`, combinedResults);
            }
          } catch (err) {
            console.error("Error getting other players:", err);
          }
        }
        
        // Sort results by score (highest first)
        combinedResults.sort((a, b) => b.score - a.score);
        
        // Save to localStorage for other tabs to access (for local testing)
        if (quizCode && combinedResults.length > 0) {
          localStorage.setItem(`quizResults_${quizCode}`, JSON.stringify(combinedResults));
        }
        
        // Update state with combined results
        setPlayerResults(combinedResults);
        
        // Calculate and set group results
        const groups = calculateGroupScores(combinedResults);
        setGroupResults(groups);
        
        // Save the game data for teacher to see
        saveCompletedGame(currentQuizData, combinedResults, groups);
        
        // Hide confetti after 5 seconds
        setTimeout(() => {
          setShowConfetti(false);
        }, 5000);
      };
      
      // Start processing results
      processResults();
    } catch (error) {
      console.error('Error loading game results:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Add this near the top of your component
  useEffect(() => {
    // ...existing code
    
    // Make sure to get and store player ID early
    const playerInfoStr = sessionStorage.getItem('currentPlayer');
    if (playerInfoStr) {
      try {
        const playerData = JSON.parse(playerInfoStr);
        const playerId = playerData.id || playerData.playerId;
        
        // Store playerId in sessionStorage for easy access
        if (playerId) {
          sessionStorage.setItem('currentPlayerId', String(playerId));
          console.log("Set currentPlayerId in session:", playerId);
        }
      } catch (e) {
        console.error("Error parsing player info:", e);
      }
    }
    
    // ...rest of existing code
  }, []);

  // Add this effect to fetch answers when component mounts
  useEffect(() => {
    const getAnswers = async () => {
      try {
        const playerInfoStr = sessionStorage.getItem('currentPlayer');
        const quizDataStr = sessionStorage.getItem('quizPreviewData') || sessionStorage.getItem('currentQuiz');
        
        if (playerInfoStr && quizDataStr) {
          const playerData = JSON.parse(playerInfoStr);
          const quizData = JSON.parse(quizDataStr);
          
          const playerId = playerData.id || playerData.playerId;
          const quizId = quizData.id;
          
          if (playerId && quizId) {
            await fetchPlayerAnswers(playerId, quizId);
          }
        }
      } catch (error) {
        console.error("Error in getAnswers effect:", error);
      }
    };
    
    getAnswers();
  }, []);

  // Enhanced function to fetch player answers for both current player and all other players
  const fetchPlayerAnswers = async (playerId: number, quizId: number) => {
    try {
      setAnswersLoading(true);
      console.log(`Fetching answers for player ${playerId} in quiz ${quizId}`);
      
      // First check if we have answers stored in sessionStorage already
      const storedAnswers = sessionStorage.getItem('playerAnswers');
      if (storedAnswers) {
        try {
          const parsedAnswers = JSON.parse(storedAnswers);
          if (Array.isArray(parsedAnswers) && parsedAnswers.length > 0) {
            console.log("Using stored player answers from sessionStorage:", parsedAnswers);
            setPlayerAnswers(parsedAnswers);
            setAnswersLoading(false);
            
            // Try to get all answers for the quiz anyway
            fetchAllAnswersForQuiz(quizId).catch(e => console.error("Error fetching all answers:", e));
            
            return;
          }
        } catch (parseError) {
          console.error("Failed to parse stored answers:", parseError);
        }
      }
      
      // Check if we have answers in the completeGameData
      const completeData = sessionStorage.getItem('completeGameData');
      if (completeData) {
        try {
          const parsedData = JSON.parse(completeData);
          if (parsedData.answers && Array.isArray(parsedData.answers) && parsedData.answers.length > 0) {
            console.log("Using answers from completeGameData:", parsedData.answers);
            
            // Convert to the format expected by the UI
            const formattedAnswers = parsedData.answers.map((answer: any, index: number) => ({
              id: index + 1,
              playerId: playerId,
              questionId: answer.questionIndex + 1,
              answeredAt: new Date().toISOString(),
              isCorrect: answer.isCorrect,
              responseTime: answer.timeTaken,
              answer: answer.selectedAnswer !== null ? 
                String.fromCharCode(65 + answer.selectedAnswer) : 'T' // A, B, C, D or T for timeout
            }));
            
            setPlayerAnswers(formattedAnswers);
            
            // Save these formatted answers in sessionStorage for future use
            sessionStorage.setItem('playerAnswers', JSON.stringify(formattedAnswers));
            
            // Try to get all answers for the quiz anyway
            fetchAllAnswersForQuiz(quizId).catch(e => console.error("Error fetching all answers:", e));
            
            setAnswersLoading(false);
            return;
          }
        } catch (parseError) {
          console.error("Failed to parse complete game data for answers:", parseError);
        }
      }
      
      // Now try getting all answers for this quiz - this includes current player's answers
      const allAnswers = await fetchAllAnswersForQuiz(quizId);
      if (allAnswers && allAnswers.length > 0) {
        // Filter for current player's answers
        const playerAnswers = allAnswers.filter(a => a.playerId === playerId);
        
        if (playerAnswers.length > 0) {
          setPlayerAnswers(playerAnswers);
          
          // Save these answers in sessionStorage for future use
          sessionStorage.setItem('playerAnswers', JSON.stringify(playerAnswers));
          
          setAnswersLoading(false);
          return;
        }
      }
      
      // If we still don't have answers, try the original method with direct API calls
      try {
        // First approach: Get all answers and filter client-side
        const response = await fetch(
          `https://kahootclone-f7hkd0hwafgbfrfa.southeastasia-01.azurewebsites.net/api/PlayerAnswer`,
          {
            method: 'GET',
            headers: {
              'Accept': 'application/json'
            }
          }
        );
        
        if (!response.ok) {
          console.warn(`Main API call failed with status ${response.status}`);
          throw new Error(`Failed to fetch player answers: ${response.status}`);
        }
        
        const responseData = await response.json();
        console.log("All player answers response:", responseData);
        
        if (responseData && Array.isArray(responseData.data)) {
          // Filter answers for this specific player
          const playerAnswers = responseData.data.filter((answer: { playerId: number; }) => 
            answer.playerId === playerId
          );
          
          console.log(`Found ${playerAnswers.length} answers for player ${playerId}`);
          
          if (playerAnswers.length > 0) {
            setPlayerAnswers(playerAnswers);
            
            // Save these answers in sessionStorage for future use
            sessionStorage.setItem('playerAnswers', JSON.stringify(playerAnswers));
            
            // Update stored game data
            setTimeout(() => {
              // Get the updated quiz data with our answers
              const updatedQuiz = JSON.parse(sessionStorage.getItem('quizPreviewData') || sessionStorage.getItem('currentQuiz') || '{}');
              saveCompletedGame(updatedQuiz, playerResults, groupResults);
            }, 500);
            
            setAnswersLoading(false);
            return;
          }
        }
      } catch (apiError) {
        console.error("Error fetching from main PlayerAnswer endpoint:", apiError);
      }
      
      // Try the rest of the fallback methods as before...
      try {
        console.log("Trying player-specific endpoint as fallback");
        const playerSpecificResponse = await fetch(
          `https://kahootclone-f7hkd0hwafgbfrfa.southeastasia-01.azurewebsites.net/api/PlayerAnswer/player/${playerId}`,
          {
            method: 'GET',
            headers: {
              'Accept': 'application/json'
            }
          }
        );
        
        if (!playerSpecificResponse.ok) {
          throw new Error(`Player-specific endpoint failed: ${playerSpecificResponse.status}`);
        }
        
        const playerData = await playerSpecificResponse.json();
        console.log("Player-specific answers:", playerData);
        
        if (playerData && playerData.data && Array.isArray(playerData.data)) {
          setPlayerAnswers(playerData.data);
          
          // Save these answers in sessionStorage for future use
          sessionStorage.setItem('playerAnswers', JSON.stringify(playerData.data));
          
          // Update stored game data
          setTimeout(() => {
            const updatedQuiz = JSON.parse(sessionStorage.getItem('quizPreviewData') || sessionStorage.getItem('currentQuiz') || '{}');
            saveCompletedGame(updatedQuiz, playerResults, groupResults);
          }, 500);
          
          setAnswersLoading(false);
          return;
        } else {
          console.warn("No valid data from player-specific endpoint");
        }
      } catch (playerSpecificError) {
        console.error("Error fetching from player-specific endpoint:", playerSpecificError);
      }
      
      // Final local data fallback remains the same...
      
      setAnswersLoading(false);
    } catch (error) {
      console.error("Error in fetchPlayerAnswers function:", error);
      setAnswersLoading(false);
    }
  };

  // Add this function to map answers to questions
  const organizeAnswersByQuestion = (answers: PlayerAnswer[], questions: any[]) => {
    const answerMap: {[questionId: string]: {[playerId: string]: PlayerAnswer}} = {};
    const qMap: {[questionId: string]: any} = {};
    
    // First create a map of all questions
    if (questions && Array.isArray(questions)) {
      questions.forEach((q, index) => {
        const questionId = q.id?.toString() || (index + 1).toString();
        qMap[questionId] = {
          ...q,
          index: index,
          number: index + 1,
          text: q.question || q.text || `Question ${index + 1}`,
          options: q.options || [],
          correctAnswer: q.correctAnswer || 0
        };
      });
    }
    
    // Now organize answers by question and player
    if (answers && Array.isArray(answers)) {
      answers.forEach(answer => {
        const questionId = answer.questionId?.toString() || '';
        const playerId = answer.playerId?.toString() || '';
        
        if (!answerMap[questionId]) {
          answerMap[questionId] = {};
        }
        
        answerMap[questionId][playerId] = answer;
      });
    }
    
    setPlayerAnswerMap(answerMap);
    setQuestionMap(qMap);
  };
  
  // Update the fetchAllAnswersForQuiz function to organize answers after fetching
  const fetchAllAnswersForQuiz = async (quizId: number): Promise<PlayerAnswer[]> => {
    try {
      console.log(`Fetching all answers for quiz ID ${quizId}`);
      
      // Try to get quiz answers from localStorage first (for local testing between tabs)
      const storedQuizAnswers = localStorage.getItem(`quizAnswers_${quizId}`);
      if (storedQuizAnswers) {
        try {
          const parsedAnswers = JSON.parse(storedQuizAnswers);
          if (Array.isArray(parsedAnswers) && parsedAnswers.length > 0) {
            console.log(`Found ${parsedAnswers.length} stored answers for quiz ${quizId} in localStorage`);
            
            // Organize answers by question
            organizeAnswersByQuestion(parsedAnswers, currentQuizData?.questions || []);
            
            return parsedAnswers;
          }
        } catch (e) {
          console.error("Error parsing stored quiz answers:", e);
        }
      }
      
      // If not found in localStorage, try direct PlayerAnswer endpoint (not quiz-specific)
      try {
        const response = await fetch(
          `https://kahootclone-f7hkd0hwafgbfrfa.southeastasia-01.azurewebsites.net/api/PlayerAnswer`,
          {
            method: 'GET',
            headers: {
              'Accept': 'application/json'
            }
          }
        );
        
        if (response.ok) {
          const responseData = await response.json();
          console.log("All player answers response:", responseData);
          
          if (responseData && Array.isArray(responseData.data)) {
            // Filter for answers related to this quiz
            // Note: This might not be accurate if the API doesn't provide quiz ID in the answers
            // but this is a best-effort approach
            const quizAnswers = responseData.data.filter((answer: any) => {
              // Try to filter by associated question ID if we have quiz questions
              if (currentQuizData && currentQuizData.questions) {
                const questionIds = currentQuizData.questions.map((q: any) => q.id);
                return questionIds.includes(answer.questionId);
              }
              // Otherwise just take all answers as a fallback
              return true;
            });
            
            console.log(`Filtered ${quizAnswers.length} answers for quiz ${quizId}`);
            
            if (quizAnswers.length > 0) {
              // Save to localStorage for future use
              localStorage.setItem(`quizAnswers_${quizId}`, JSON.stringify(quizAnswers));
              
              // Organize answers by question
              organizeAnswersByQuestion(quizAnswers, currentQuizData?.questions || []);
              
              return quizAnswers;
            }
          }
        }
      } catch (error) {
        console.error("Error fetching from main PlayerAnswer endpoint:", error);
      }
      
      // If direct API call didn't work, generate mock answers
      console.log("Generating mock answers as fallback");
      try {
        // Get questions from storage
        let questions = [];
        if (currentQuizData && currentQuizData.questions) {
          questions = currentQuizData.questions;
        } else {
          const quizDataStr = sessionStorage.getItem('quizPreviewData') || sessionStorage.getItem('currentQuiz');
          if (quizDataStr) {
            const parsedQuizData = JSON.parse(quizDataStr);
            if (parsedQuizData && parsedQuizData.questions) {
              questions = parsedQuizData.questions;
            }
          }
        }
        
        // If still no questions, create dummy ones
        if (questions.length === 0) {
          questions = Array(5).fill(0).map((_, i) => ({
            id: i + 1,
            text: `Question ${i + 1}`,
            correctAnswer: Math.floor(Math.random() * 4),
            options: ["Option A", "Option B", "Option C", "Option D"],
            questionType: 'multiple-choice'
          }));
        }
        
        // Get current player ID and generate answers for them
        let currentPlayerId = 1;
        try {
          const currentPlayerStr = sessionStorage.getItem('currentPlayer');
          const currentPlayerId_str = sessionStorage.getItem('currentPlayerId');
          
          if (currentPlayerId_str) {
            currentPlayerId = parseInt(currentPlayerId_str, 10);
          } else if (currentPlayerStr) {
            const currentPlayer = JSON.parse(currentPlayerStr);
            currentPlayerId = currentPlayer.id || currentPlayer.playerId || 1;
          }
        } catch (e) {
          console.error("Error getting current player ID:", e);
        }
        
        // Generate mock answers for current player
        const mockAnswers = generateMockAnswers(quizId, currentPlayerId, questions);
        
        // Also generate some mock answers for other players
        const mockPlayerIds = [currentPlayerId + 100, currentPlayerId + 200, currentPlayerId + 300];
        mockPlayerIds.forEach(playerId => {
          const playerAnswers = generateMockAnswers(quizId, playerId, questions);
          mockAnswers.push(...playerAnswers);
        });
        
        // Save the generated answers to localStorage
        localStorage.setItem(`quizAnswers_${quizId}`, JSON.stringify(mockAnswers));
        
        // Organize answers by question
        organizeAnswersByQuestion(mockAnswers, questions);
        
        console.log(`Generated ${mockAnswers.length} mock answers as fallback`);
        return mockAnswers;
      } catch (mockError) {
        console.error("Error generating mock answers:", mockError);
      }
      
      // Final fallback - empty array
      return [];
    } catch (error) {
      console.error(`Error in fetchAllAnswersForQuiz:`, error);
      return [];
    }
  };
  
  // Add this effect to organize answers when playerAnswers or questions change
  useEffect(() => {
    if (playerAnswers.length > 0 && currentQuizData?.questions) {
      organizeAnswersByQuestion(playerAnswers, currentQuizData.questions);
    }
  }, [playerAnswers, currentQuizData?.questions]);

  // Now add the component to display player answers after the player results card
  const renderAnswerDetails = () => {
    return (
      <Box sx={{ mt: 4 }}>
        <Button
          variant="outlined"
          color="primary"
          startIcon={showAnswerDetails ? <ExpandLess /> : <ExpandMore />}
          onClick={() => setShowAnswerDetails(!showAnswerDetails)}
          sx={{ mb: 2 }}
        >
          {showAnswerDetails ? "Hide Answer Details" : "Show Answer Details"}
        </Button>
        
        <Collapse in={showAnswerDetails}>
          <Typography variant="h6" sx={{ mb: 2 }}>Question Answers</Typography>
          
          {answersLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : Object.keys(questionMap).length > 0 ? (
            <Stack spacing={2}>
              {Object.keys(questionMap).sort((a, b) => {
                const qA = questionMap[a];
                const qB = questionMap[b];
                return (qA.index || 0) - (qB.index || 0);
              }).map(questionId => {
                const question = questionMap[questionId];
                const questionAnswers = playerAnswerMap[questionId] || {};
                
                return (
                  <Paper key={questionId} sx={{ p: 3, borderRadius: 2 }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      Question {question.number}: {question.text}
                    </Typography>
                    
                    {question.options && question.options.length > 0 && (
                      <Box sx={{ mt: 1, mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Correct answer: {String.fromCharCode(65 + question.correctAnswer)} - {question.options[question.correctAnswer]}
                        </Typography>
                      </Box>
                    )}
                    
                    <Divider sx={{ my: 2 }} />
                    
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>Player Answers:</Typography>
                    
                    <TableContainer component={Paper} elevation={0} sx={{ backgroundColor: 'rgba(248, 249, 250, 0.7)' }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Player</TableCell>
                            <TableCell>Answer</TableCell>
                            <TableCell align="center">Correct?</TableCell>
                            <TableCell align="right">Response Time</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {Object.keys(questionAnswers).length > 0 ? (
                            Object.entries(questionAnswers).map(([playerId, answer]) => {
                              // Find player information
                              const player = playerResults.find(p => p.id?.toString() === playerId);
                              const playerName = player?.name || `Player ${playerId}`;
                              
                              // Format the answer letter
                              let answerText = answer.answer || '';
                              if (answerText === 'T') {
                                answerText = 'Time Out';
                              } else if (question.options && answer.answer) {
                                const answerIndex = answer.answer.charCodeAt(0) - 65; // Convert A->0, B->1, etc.
                                if (answerIndex >= 0 && answerIndex < question.options.length) {
                                  answerText = `${answer.answer} - ${question.options[answerIndex]}`;
                                }
                              }
                              
                              return (
                                <TableRow key={playerId}>
                                  <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                      {player?.avatar && (
                                        <Box sx={{ mr: 1, width: 24, height: 24 }}>
                                          <Animal
                                            name={getAnimalAvatar(player.avatar).name}
                                            color={getAnimalAvatar(player.avatar).color}
                                            size="24px"
                                          />
                                        </Box>
                                      )}
                                      {playerName === currentPlayer ? (
                                        <Typography variant="body2" fontWeight="bold">{playerName} (You)</Typography>
                                      ) : (
                                        <Typography variant="body2">{playerName}</Typography>
                                      )}
                                    </Box>
                                  </TableCell>
                                  <TableCell>{answerText}</TableCell>
                                  <TableCell align="center">
                                    {answer.isCorrect ? (
                                      <CheckCircleIcon color="success" fontSize="small" />
                                    ) : (
                                      <CancelIcon color="error" fontSize="small" />
                                    )}
                                  </TableCell>
                                  <TableCell align="right">{answer.responseTime.toFixed(1)}s</TableCell>
                                </TableRow>
                              );
                            })
                          ) : (
                            <TableRow>
                              <TableCell colSpan={4} align="center">No answers recorded for this question</TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Paper>
                );
              })}
            </Stack>
          ) : (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body1">No answer data available</Typography>
            </Paper>
          )}
        </Collapse>
      </Box>
    );
  };

  // Add helper function to save the game data
  const saveCompletedGame = (quiz: any, players: PlayerScore[], groups: GroupScore[]) => {
    try {
      if (!quiz) {
        console.error('No quiz data available to save completed game');
        return;
      }
      
      const gameId = quiz.id || Date.now();
      const gameResultsForTeacher = {
        id: gameId,
        title: quiz.title || 'Unnamed Quiz',
        description: quiz.description || '',
        gameMode: gameMode, // Use the component state which has been properly detected
        coverImage: quiz.coverImage || quiz.imageUrl || quiz.thumbnailUrl || '',
        completed: true,
        dateCompleted: new Date().toISOString(),
        playerResults: players,
        groupResults: groups,
        playerAnswers: playerAnswers, // Include the player answers fetched from API
        questions: quiz.questions || [],
        sessionId: quiz.sessionId || quiz.id || null
      };
      
      console.log(`Saving completed game with gameMode: ${gameMode}`);
      
      // Save to localStorage (in a real app, this would be saved to a database)
      const completedGames = JSON.parse(localStorage.getItem('completedGames') || '[]');
      
      // Check if this game already exists in completed games
      const existingGameIndex = completedGames.findIndex((g: any) => g.id === gameId);
      
      if (existingGameIndex >= 0) {
        // Update existing game
        completedGames[existingGameIndex] = gameResultsForTeacher;
      } else {
        // Add new completed game
        completedGames.push(gameResultsForTeacher);
      }
      
      localStorage.setItem('completedGames', JSON.stringify(completedGames));
      console.log('Game results saved successfully:', gameResultsForTeacher);
      
      // Also update session storage for consistency
      if (quiz.quizCode) {
        // Make sure the quiz code has the correct game mode in sessionStorage
        const quizCodeStr = quiz.quizCode.toString();
        if (gameMode === 'team') {
          sessionStorage.setItem(`quizMode_${quizCodeStr}`, 'team');
          console.log(`Updated sessionStorage with team mode for quiz code: ${quizCodeStr}`);
        }
      }
    } catch (error) {
      console.error('Error saving completed game:', error);
    }
  };

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
    // Only allow changing to group view if in team mode
    if (gameMode === 'team' || newValue === 'player') {
      setViewMode(newValue);
    }
  };

  // Add a new function to fetch detailed player answer data for the question summary
  const fetchDetailedPlayerAnswers = async (quizId: number) => {
    try {
      console.log(`Fetching detailed player answers for quiz ${quizId}`);
      setAnswersLoading(true);
      
      // First try getting from sessionStorage
      const storedAnswers = sessionStorage.getItem(`detailedAnswers_${quizId}`);
      if (storedAnswers) {
        try {
          const parsedAnswers = JSON.parse(storedAnswers);
          if (Array.isArray(parsedAnswers) && parsedAnswers.length > 0) {
            console.log(`Using ${parsedAnswers.length} stored detailed answers from sessionStorage`);
            setPlayerAnswers(parsedAnswers);
            
            // Organize answers by question and player for the detailed view
            const quizData = JSON.parse(sessionStorage.getItem('quizPreviewData') || sessionStorage.getItem('currentQuiz') || '{}');
            organizeAnswersByQuestion(parsedAnswers, quizData.questions || []);
            
            setAnswersLoading(false);
            return;
          }
        } catch (error) {
          console.error("Error parsing stored detailed answers:", error);
        }
      }
      
      // Try to get the quiz questions data first
      let questions: any[] = [];
      try {
        const quizData = JSON.parse(sessionStorage.getItem('quizPreviewData') || sessionStorage.getItem('currentQuiz') || '{}');
        questions = quizData.questions || [];
        
        if (questions.length === 0) {
          // Try to get questions from other sources
          try {
            const quizResponse = await fetch(
              `https://kahootclone-f7hkd0hwafgbfrfa.southeastasia-01.azurewebsites.net/api/Quiz/${quizId}`
            );
            
            if (quizResponse.ok) {
              const quizData = await quizResponse.json();
              if (quizData?.data?.questions) {
                questions = quizData.data.questions;
              }
            }
          } catch (e) {
            console.warn("Could not fetch questions from API");
          }
        }
      } catch (error) {
        console.error("Error getting quiz questions:", error);
      }
      
      // If we have no questions, create some dummy ones
      if (questions.length === 0) {
        questions = Array(5).fill(0).map((_, i) => ({
          id: i + 1,
          text: `Question ${i + 1}`,
          correctAnswer: Math.floor(Math.random() * 4),
          options: ["Option A", "Option B", "Option C", "Option D"],
          questionType: 'multiple-choice'
        }));
      }
      
      // Use the main PlayerAnswer endpoint (not the quiz-specific one)
      try {
        const answersResponse = await fetch(
          `https://kahootclone-f7hkd0hwafgbfrfa.southeastasia-01.azurewebsites.net/api/PlayerAnswer`,
          {
            method: 'GET',
            headers: {
              'Accept': 'application/json'
            }
          }
        );
        
        if (answersResponse.ok) {
          const answersData = await answersResponse.json();
          const allAnswers = answersData?.data || [];
          
          // Attempt to filter answers related to this quiz
          let answers = allAnswers;
          
          // First try - exact question ID matching
          if (questions.length > 0 && questions[0].id) {
            const questionIds = questions.map(q => q.id);
            const exactMatches = allAnswers.filter((answer: any) => 
              questionIds.includes(answer.questionId)
            );
            
            if (exactMatches.length > 0) {
              console.log(`Found ${exactMatches.length} answers with exact question ID match`);
              answers = exactMatches;
            } else {
              console.log("No exact question ID matches found, using all answers");
            }
          }
          
          // If we have a currentPlayerId, also try to find answers specifically for this player
          try {
            const currentPlayerStr = sessionStorage.getItem('currentPlayer');
            if (currentPlayerStr) {
              const playerInfo = JSON.parse(currentPlayerStr);
              const playerId = playerInfo.id || playerInfo.playerId;
              
              if (playerId) {
                console.log(`Looking for answers from player ${playerId}`);
                const playerAnswers = allAnswers.filter((answer: any) => 
                  answer.playerId === playerId || 
                  answer.playerId === Number(playerId)
                );
                
                if (playerAnswers.length > 0) {
                  console.log(`Found ${playerAnswers.length} answers from player ${playerId}`);
                  // If we found specific player answers, use those instead
                  answers = playerAnswers;
                }
              }
            }
          } catch (e) {
            console.error("Error filtering by player ID:", e);
          }
          
          console.log(`Final: Found ${answers.length} answers that might be related to this quiz`);
          
          // If we don't have any filtered answers but have some answers, just use the full set
          if (answers.length === 0 && allAnswers.length > 0) {
            console.log(`Using all ${allAnswers.length} answers as fallback`);
            answers = allAnswers;
          }
          
          // Set the player answers and organize them
          if (answers.length > 0) {
            setPlayerAnswers(answers);
            sessionStorage.setItem(`detailedAnswers_${quizId}`, JSON.stringify(answers));
            organizeAnswersByQuestion(answers, questions);
            setAnswersLoading(false);
            return;
          } else {
            // Instead of throwing error, create mock data directly
            console.log("No relevant answers found, creating mock data directly");
            
            // Create basic mock answers directly without throwing an error
            const basicMockAnswers: PlayerAnswer[] = [];
            
            // Get current player ID
            let currentPlayerId = 1;
            try {
              const currentPlayerStr = sessionStorage.getItem('currentPlayer');
              if (currentPlayerStr) {
                const playerInfo = JSON.parse(currentPlayerStr);
                currentPlayerId = playerInfo.id || playerInfo.playerId || 1;
              }
            } catch (e) {
              console.error("Error getting player ID:", e);
            }
            
            // Create a mock answer for each question
            questions.forEach((question, index) => {
              basicMockAnswers.push({
                id: index + 1,
                playerId: currentPlayerId,
                questionId: question.id || index + 1,
                answeredAt: new Date().toISOString(),
                isCorrect: index % 2 === 0, // Alternate correct/incorrect answers
                responseTime: 3 + Math.random() * 3, // Random time between 3-6 seconds
                answer: String.fromCharCode(65 + (index % 4)) // A, B, C, D in sequence
              });
            });
            
            setPlayerAnswers(basicMockAnswers);
            sessionStorage.setItem(`detailedAnswers_${quizId}`, JSON.stringify(basicMockAnswers));
            organizeAnswersByQuestion(basicMockAnswers, questions);
            setAnswersLoading(false);
            return;
          }
        } else {
          throw new Error(`API call failed: ${answersResponse.status}`);
        }
      } catch (error) {
        console.error("Error fetching from PlayerAnswer endpoint:", error);
        
        // Generate mock answers if real data isn't available
        try {
          console.log("Generating mock answers as fallback");
          
          // Get current player ID
          let currentPlayerId = 1; // Default if we can't find it
          
          try {
            // Try to get current player ID from various sources
            const currentPlayerStr = sessionStorage.getItem('currentPlayer');
            const currentPlayerId_str = sessionStorage.getItem('currentPlayerId');
            
            if (currentPlayerId_str) {
              currentPlayerId = parseInt(currentPlayerId_str, 10);
            } else if (currentPlayerStr) {
              const currentPlayer = JSON.parse(currentPlayerStr);
              currentPlayerId = currentPlayer.id || currentPlayer.playerId || 1;
            }
          } catch (e) {
            console.error("Error getting current player ID:", e);
          }
          
          // Generate mock answers for current player
          const mockAnswers = generateMockAnswers(quizId, currentPlayerId, questions);
          
          // Also generate some mock answers for other players
          const mockPlayerIds = [currentPlayerId + 100, currentPlayerId + 200, currentPlayerId + 300];
          mockPlayerIds.forEach(playerId => {
            const playerAnswers = generateMockAnswers(quizId, playerId, questions);
            mockAnswers.push(...playerAnswers);
          });
          
          // Set the mock answers
          setPlayerAnswers(mockAnswers);
          sessionStorage.setItem(`detailedAnswers_${quizId}`, JSON.stringify(mockAnswers));
          organizeAnswersByQuestion(mockAnswers, questions);
          
          // We successfully created fallback data
          console.log("Successfully generated mock answers:", mockAnswers.length);
        } catch (mockError) {
          console.error("Error generating mock answers:", mockError);
          
          // Fallback to local player answers if we have any
          const existingAnswers = playerAnswers.length > 0 ? playerAnswers : [];
          if (existingAnswers.length > 0) {
            organizeAnswersByQuestion(existingAnswers, questions);
          } else {
            // Last resort - create minimal dummy answers just to show something
            const dummyAnswers = [
              {
                id: 1,
                playerId: 1,
                questionId: 1,
                answeredAt: new Date().toISOString(),
                isCorrect: true,
                responseTime: 3.5,
                answer: 'A'
              }
            ];
            setPlayerAnswers(dummyAnswers);
            organizeAnswersByQuestion(dummyAnswers, questions);
          }
        }
      }
      
      setAnswersLoading(false);
    } catch (error) {
      console.error("Error in fetchDetailedPlayerAnswers:", error);
      setAnswersLoading(false);
    }
  };
  
  // Update the effect to also fetch detailed answers
  useEffect(() => {
    const loadAnswers = async () => {
      try {
        const quizDataStr = sessionStorage.getItem('quizPreviewData') || sessionStorage.getItem('currentQuiz');
        if (quizDataStr) {
          const quizData = JSON.parse(quizDataStr);
          if (quizData && quizData.id) {
            // Fetch detailed answers for all players
            await fetchDetailedPlayerAnswers(quizData.id);
          }
        }
      } catch (error) {
        console.error("Error loading answers:", error);
      }
    };
    
    // Call this after a short delay to ensure other data is loaded first
    if (!loading) {
      setTimeout(loadAnswers, 1000);
    }
  }, [loading]);

  // Add a function to generate mock answers for testing and fallback
  const generateMockAnswers = (quizId: number, playerId: number, questions: any[]): PlayerAnswer[] => {
    const mockAnswers: PlayerAnswer[] = [];
    
    // Generate a unique but consistent answer for each question
    questions.forEach((question, index) => {
      // Determine if this answer should be correct (make it somewhat random but consistent)
      const isCorrect = (playerId + index) % 3 !== 0; // About 2/3 of answers are correct
      
      // Calculate a mock response time between 1 and 10 seconds
      const responseTime = 1 + ((playerId * 7 + index * 13) % 9);
      
      // Determine which answer was selected (A, B, C, D)
      const answerOptions = ['A', 'B', 'C', 'D'];
      let selectedAnswer: string;
      
      if (question.questionType === 'true-false') {
        // For true/false questions, only use A or B
        selectedAnswer = isCorrect ? 
          (question.correctAnswer === 0 ? 'A' : 'B') :
          (question.correctAnswer === 0 ? 'B' : 'A');
      } else {
        // For multiple choice, select the correct answer if isCorrect, otherwise pick a different one
        const correctAnswerIndex = question.correctAnswer || 0;
        if (isCorrect) {
          selectedAnswer = answerOptions[correctAnswerIndex];
        } else {
          // Select a wrong answer
          const wrongIndex = (correctAnswerIndex + 1 + (playerId + index) % 3) % 4;
          selectedAnswer = answerOptions[wrongIndex];
        }
      }
      
      mockAnswers.push({
        id: index + 1,
        playerId: playerId,
        questionId: question.id || index + 1,
        answeredAt: new Date().toISOString(),
        isCorrect: isCorrect,
        responseTime: responseTime,
        answer: selectedAnswer
      });
    });
    
    return mockAnswers;
  };

  if (loading) {
    return (
      <PublicLayout>
        <Container maxWidth="md" sx={{ py: 6, textAlign: 'center' }}>
          <Typography variant="h5">Loading results...</Typography>
          <CircularProgress sx={{ mt: 3 }} />
        </Container>
      </PublicLayout>
    );
  }

  if (playerResults.length === 0) {
    return (
      <PublicLayout>
        <Container maxWidth="md" sx={{ py: 6, textAlign: 'center' }}>
          <Typography variant="h5" sx={{ mb: 2 }}>No results found</Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            We couldn't find any game results. This may happen if:
          </Typography>
          <Box component="ul" sx={{ textAlign: 'left', display: 'inline-block', mb: 3 }}>
            <li>The game session expired</li>
            <li>Your browser's storage was cleared</li>
            <li>There was an error during the game</li>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button 
              variant="contained" 
              startIcon={<HomeIcon />}
              onClick={() => router.push('/')}
            >
              Return to Home
            </Button>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() => router.push('/play-quiz-preview')}
            >
              Play Another Game
            </Button>
          </Box>
        </Container>
      </PublicLayout>
    );
  }

  // In the return statement, replace the entire PublicLayout with the Kahoot-style UI
  return (
    <Box 
      sx={{ 
        minHeight: '100vh',
        bgcolor: '#46178f', // Kahoot purple background
        color: 'white',
        pb: 4
      }}
    >
      {showConfetti && (
        <ReactConfetti
          width={windowDimensions.width}
          height={windowDimensions.height}
          recycle={false}
          numberOfPieces={300}
        />
      )}
      
      {/* Header section */}
      <Box sx={{ 
        pt: 4, 
        pb: 3, 
        px: 2, 
        textAlign: 'center',
        position: 'relative'
      }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Top scorers!
        </Typography>
            
        {/* Add game mode toggle ONLY if in team mode */}
        {gameMode === 'team' && (
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={handleViewModeChange}
              aria-label="view mode"
              sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                '& .MuiToggleButton-root': {
                  color: 'white',
                  px: 3,
                  py: 1,
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                  textTransform: 'none',
                  fontWeight: 'medium',
                },
                '& .MuiToggleButton-root.Mui-selected': {
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  color: '#46178f',
                  fontWeight: 'bold',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  }
                }
              }}
            >
              <ToggleButton value="player" aria-label="individual">
                <PersonIcon sx={{ mr: 1 }} />
                Individual
              </ToggleButton>
              <ToggleButton value="group" aria-label="team">
                <GroupsIcon sx={{ mr: 1 }} />
                Team
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
        )}
      </Box>
      
      {/* Main podium section */}
      <Container maxWidth="md" sx={{ mt: 2, mb: 6 }}>
        {/* Show individual players section if in individual view or not team mode */}
        {(viewMode === 'player' || gameMode !== 'team') && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            {/* Create podium visualization for top 3 players */}
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center',
              alignItems: 'flex-end',
              height: 350,
              position: 'relative',
              mx: 2
            }}>
              {/* Limit to just showing top 3 players */}
              {playerResults.slice(0, 3).map((player, index) => {
                // Define positions and heights for 1st, 2nd, 3rd place
                const positions = [
                  { order: 1, height: 220, left: '50%', transform: 'translateX(-50%)' }, // 1st (center)
                  { order: 0, height: 180, left: '15%', transform: 'translateX(-50%)' },  // 2nd (left)
                  { order: 2, height: 140, left: '85%', transform: 'translateX(-50%)' }   // 3rd (right)
                ];
                
                // Get the correct position data based on index
                const pos = positions[index];
                const animalInfo = getAnimalAvatar(player.avatar || getRandomAvatar());
                
                return (
                  <Box 
                    key={index}
                    sx={{
                      position: 'absolute',
                      left: pos.left,
                      transform: pos.transform,
                      bottom: 0,
                      width: '30%',
                      maxWidth: 175,
                      zIndex: 3 - index // First place on top
                    }}
                  >
                    {/* Player name at top */}
                    <Typography 
                      align="center" 
                      sx={{ 
                        mb: 1, 
                        fontWeight: 'bold',
                        fontSize: '1.1rem'
                      }}
                    >
                      {player.name}
                    </Typography>
                    
                    {/* Player avatar */}
                    <Box 
                      sx={{ 
                        width: '60px', 
                        height: '60px', 
                        mx: 'auto',
                        mb: 1,
                        bgcolor: '#ffffff',
                        borderRadius: '50%',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Animal
                        name={animalInfo.name}
                        color={animalInfo.color}
                        size="60px"
                      />
                    </Box>
                    
                    {/* Podium block */}
                    <Paper 
                      sx={{ 
                        bgcolor: 'rgba(255, 255, 255, 0.15)', 
                        height: pos.height,
                        borderRadius: 2,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        p: 2,
                        pt: 3
                      }}
                    >
                      {/* Score */}
                      <Typography 
                        variant="h5" 
                        sx={{ 
                          fontWeight: 'bold',
                          mb: 1,
                          color: 'white'
                        }}
                      >
                        {player.score} points
                      </Typography>
                      
                      {/* Correct answer count */}
                      <Typography 
                        variant="body2"
                        sx={{ opacity: 0.9, color: 'white' }}
                      >
                        {player.correctAnswers} out of {player.totalQuestions}
                      </Typography>
                    </Paper>
                  </Box>
                );
              })}
            </Box>
          </motion.div>
        )}
        
        {/* Show team scores section ONLY if in team mode AND group view is selected */}
        {gameMode === 'team' && viewMode === 'group' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            {/* Team podiums */}
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center',
              alignItems: 'flex-end',
              height: 400,
              position: 'relative',
              mx: 2
            }}>
              {/* Limit to just showing top 3 teams */}
              {groupResults.slice(0, 3).map((team, index) => {
                // Define positions and heights for 1st, 2nd, 3rd place
                const positions = [
                  { order: 1, height: 250, left: '50%', transform: 'translateX(-50%)' }, // 1st (center)
                  { order: 0, height: 200, left: '15%', transform: 'translateX(-50%)' },  // 2nd (left)
                  { order: 2, height: 170, left: '85%', transform: 'translateX(-50%)' }   // 3rd (right)
                ];
                
                // Get the correct position data based on index
                const pos = positions[index];
                
                // Team colors
                const teamColors = ['#f44336', '#2196f3', '#4caf50', '#ff9800'];
                const teamColor = teamColors[index % teamColors.length];
                
                return (
                  <Box 
                    key={index}
                    sx={{
                      position: 'absolute',
                      left: pos.left,
                      transform: pos.transform,
                      bottom: 0,
                      width: '30%',
                      maxWidth: 220,
                      minWidth: 180,
                      zIndex: 3 - index // First place on top
                    }}
                  >
                    {/* Team name at top */}
                    <Typography 
                      align="center" 
                      sx={{ 
                        mb: 1, 
                        fontWeight: 'bold',
                        fontSize: '1.2rem',
                        color: teamColor
                      }}
                    >
                      {team.name}
                    </Typography>
                    
                    {/* Team avatar/Trophy */}
                    <Box 
                      sx={{ 
                        width: '70px', 
                        height: '70px', 
                        mx: 'auto',
                        mb: 1,
                        bgcolor: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : '#CD7F32',
                        borderRadius: '50%',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: 3
                      }}
                    >
                      <TrophyIcon sx={{ fontSize: 40, color: 'white' }} />
                    </Box>
                    
                    {/* Podium block */}
                    <Paper 
                      sx={{ 
                        bgcolor: 'rgba(255, 255, 255, 0.15)', 
                        height: pos.height,
                        borderRadius: 2,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        p: 2,
                      }}
                    >
                      {/* Score */}
                      <Typography 
                        variant="h5" 
                        sx={{ 
                          fontWeight: 'bold',
                          mb: 1,
                          color: 'white',
                          mt: 2
                        }}
                      >
                        {team.score} points
                      </Typography>
                      
                      {/* Member count */}
                      <Typography 
                        variant="body2"
                        sx={{ color: 'white', mb: 2 }}
                      >
                        {team.memberCount} team members
                      </Typography>
                      
                      {/* Show up to 3 top members */}
                      <Box sx={{ width: '100%' }}>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', display: 'block', mb: 1, textAlign: 'center' }}>
                          Top Members
                        </Typography>
                        <Divider sx={{ mb: 1, backgroundColor: 'rgba(255,255,255,0.2)' }} />
                        <List dense disablePadding sx={{ 
                          maxHeight: 120, 
                          overflow: 'auto',
                          '::-webkit-scrollbar': {
                            width: '8px',
                          },
                          '::-webkit-scrollbar-thumb': {
                            backgroundColor: 'rgba(255,255,255,0.2)',
                            borderRadius: '4px',
                          },
                        }}>
                          {team.members
                            .sort((a, b) => b.score - a.score)
                            .slice(0, 3)
                            .map((member, i) => (
                              <ListItem 
                                key={i}
                                disableGutters
                                disablePadding
                                sx={{ mb: 0.5 }}
                              >
                                <Box sx={{ 
                                  display: 'flex',
                                  alignItems: 'center',
                                  width: '100%',
                                  color: 'white',
                                  fontSize: '0.8rem',
                                }}>
                                  <Box 
                                    sx={{ 
                                      width: 20, 
                                      height: 20, 
                                      borderRadius: '50%', 
                                      bgcolor: 'rgba(255,255,255,0.9)',
                                      mr: 1,
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontSize: '0.7rem',
                                      fontWeight: 'bold',
                                      color: '#46178f'
                                    }}
                                  >
                                    {i+1}
                                  </Box>
                                  {member.name}
                                  <Box sx={{ ml: 'auto', fontWeight: 'bold' }}>
                                    {member.score}
                                  </Box>
                                </Box>
                              </ListItem>
                            ))}
                        </List>
                      </Box>
                    </Paper>
                  </Box>
                );
              })}
            </Box>
            
            {/* Team leaderboard table */}
            <Box sx={{ mt: 4, px: 2 }}>
              <Paper sx={{ 
                borderRadius: 2, 
                overflow: 'hidden', 
                bgcolor: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)'
              }}>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    p: 2, 
                    bgcolor: 'rgba(255,255,255,0.2)', 
                    color: 'white',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  <GroupsIcon />
                  All Teams
                </Typography>
                
                <TableContainer>
                  <Table 
                    sx={{ 
                      '& .MuiTableCell-root': { 
                        borderColor: 'rgba(255,255,255,0.1)',
                        color: 'white'
                      }
                    }}
                  >
                    <TableHead>
                      <TableRow>
                        <TableCell>#</TableCell>
                        <TableCell>Team Name</TableCell>
                        <TableCell align="center">Members</TableCell>
                        <TableCell align="right">Total Score</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {groupResults.map((team, index) => (
                        <TableRow 
                          key={index}
                          sx={{ 
                            bgcolor: index < 3 ? `rgba(255,255,255,${0.15 - index * 0.03})` : undefined,
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' }
                          }}
                        >
                          <TableCell>
                            <Box 
                              sx={{ 
                                width: 24, 
                                height: 24, 
                                borderRadius: '50%', 
                                bgcolor: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : 'rgba(255,255,255,0.5)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 'bold',
                                color: index < 3 ? '#000' : '#fff',
                                fontSize: '0.8rem'
                              }}
                            >
                              {index + 1}
                            </Box>
                          </TableCell>
                          <TableCell>{team.name}</TableCell>
                          <TableCell align="center">{team.memberCount}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold' }}>{team.score}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Box>
          </motion.div>
        )}
        
        {/* Bottom button */}
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Button
            variant="contained"
            startIcon={<FeedbackIcon />}
            sx={{
              bgcolor: '#32c4e1', // Kahoot blue
              '&:hover': { bgcolor: '#25a7c1' },
              fontWeight: 'bold',
              borderRadius: 1,
              px: 3,
              py: 1,
              textTransform: 'none',
              fontSize: '1rem'
            }}
            onClick={() => setShowAnswerDetails(!showAnswerDetails)}
          >
            Feedback & results
          </Button>
        </Box>
      </Container>
      
      {/* Show detailed results in a modal or a section below */}
      <Collapse in={showAnswerDetails}>
        <Container maxWidth="md" sx={{ mt: 2, mb: 6 }}>
          <Paper sx={{ 
            p: 4, 
            borderRadius: 2, 
            bgcolor: 'rgba(255, 255, 255, 0.95)', 
            color: '#333',
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
          }}>
            <Box sx={{ mb: 4, textAlign: 'center' }}>
              <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
                Detailed Results
              </Typography>
              <Typography variant="body1" color="text.secondary">
                See how everyone performed on each question
              </Typography>
            </Box>
            
            {/* Question details */}
            {Object.keys(questionMap).length > 0 ? (
              <Stack spacing={3}>
                {Object.keys(questionMap).sort((a, b) => {
                  const qA = questionMap[a];
                  const qB = questionMap[b];
                  return (qA.index || 0) - (qB.index || 0);
                }).map((questionId, qIndex) => {
                  const question = questionMap[questionId];
                  const questionAnswers = playerAnswerMap[questionId] || {};
                  
                  // Colors for the question cards
                  const questionColors = [
                    '#ff9c37', // orange
                    '#a531a9', // purple
                    '#0074ba', // blue
                    '#46bd00', // green
                    '#ff3355', // red
                  ];
                  const questionColor = questionColors[qIndex % questionColors.length];
                  
                  return (
                    <Paper 
                      key={questionId} 
                      sx={{ 
                        p: 0, 
                        borderRadius: 2,
                        overflow: 'hidden',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                      }}
                    >
                      {/* Question header */}
                      <Box sx={{ 
                        p: 3, 
                        bgcolor: questionColor,
                        color: 'white'
                      }}>
                        <Typography variant="h6" fontWeight="bold">
                          Question {question.number}
                        </Typography>
                        <Typography variant="body1" sx={{ mt: 1 }}>
                          {question.text}
                        </Typography>
                        
                        {question.options && question.options.length > 0 && (
                          <Box sx={{ 
                            mt: 2, 
                            p: 2, 
                            bgcolor: 'rgba(255,255,255,0.15)',
                            borderRadius: 1
                          }}>
                            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                              Correct answer: {String.fromCharCode(65 + question.correctAnswer)} - {question.options[question.correctAnswer]}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                      
                      {/* Answers section */}
                      <Box sx={{ p: 3 }}>
                        <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold', color: '#555' }}>
                          Player Answers:
                        </Typography>
                        
                        <TableContainer component={Box} sx={{ borderRadius: 1, overflow: 'hidden' }}>
                          <Table size="small" sx={{ 
                            '& .MuiTableCell-root': { 
                              borderColor: 'rgba(224, 224, 224, 0.7)',
                              py: 1.5
                            },
                            '& .MuiTableCell-head': {
                              bgcolor: '#f5f5f5',
                              fontWeight: 'bold'
                            }
                          }}>
                            <TableHead>
                              <TableRow>
                                <TableCell>Player</TableCell>
                                <TableCell>Answer</TableCell>
                                <TableCell align="center">Correct?</TableCell>
                                <TableCell align="right">Response Time</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {Object.keys(questionAnswers).length > 0 ? (
                                Object.entries(questionAnswers).map(([playerId, answer]) => {
                                  // Find player information
                                  const player = playerResults.find(p => p.id?.toString() === playerId);
                                  const playerName = player?.name || `Player ${playerId}`;
                                  
                                  // Format the answer letter
                                  let answerText = answer.answer || '';
                                  if (answerText === 'T') {
                                    answerText = 'Time Out';
                                  } else if (question.options && answer.answer) {
                                    const answerIndex = answer.answer.charCodeAt(0) - 65; // Convert A->0, B->1, etc.
                                    if (answerIndex >= 0 && answerIndex < question.options.length) {
                                      answerText = `${answer.answer} - ${question.options[answerIndex]}`;
                                    }
                                  }
                                  
                                  return (
                                    <TableRow 
                                      key={playerId}
                                      sx={{ 
                                        bgcolor: answer.isCorrect ? 'rgba(76, 175, 80, 0.04)' : 'rgba(244, 67, 54, 0.04)',
                                        '&:hover': { bgcolor: answer.isCorrect ? 'rgba(76, 175, 80, 0.08)' : 'rgba(244, 67, 54, 0.08)' }
                                      }}
                                    >
                                      <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                          {player?.avatar && (
                                            <Box sx={{ mr: 1, width: 24, height: 24 }}>
                                              <Animal
                                                name={getAnimalAvatar(player.avatar).name}
                                                color={getAnimalAvatar(player.avatar).color}
                                                size="24px"
                                              />
                                            </Box>
                                          )}
                                          {playerName === currentPlayer ? (
                                            <Typography variant="body2" fontWeight="bold">{playerName} (You)</Typography>
                                          ) : (
                                            <Typography variant="body2">{playerName}</Typography>
                                          )}
                                        </Box>
                                      </TableCell>
                                      <TableCell>{answerText}</TableCell>
                                      <TableCell align="center">
                                        <Box sx={{ 
                                          width: 20, 
                                          height: 20, 
                                          borderRadius: '50%', 
                                          bgcolor: answer.isCorrect ? '#4caf50' : '#f44336',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          mx: 'auto'
                                        }}>
                                          {answer.isCorrect ? (
                                            <CheckCircleIcon sx={{ color: 'white', fontSize: 16 }} />
                                          ) : (
                                            <CancelIcon sx={{ color: 'white', fontSize: 16 }} />
                                          )}
                                        </Box>
                                      </TableCell>
                                      <TableCell align="right">
                                        <Chip 
                                          label={`${answer.responseTime.toFixed(1)}s`}
                                          size="small"
                                          sx={{ 
                                            bgcolor: answer.isCorrect ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)',
                                            color: answer.isCorrect ? '#2e7d32' : '#c62828',
                                            fontWeight: 'medium',
                                            fontSize: '0.75rem'
                                          }}
                                        />
                                      </TableCell>
                                    </TableRow>
                                  );
                                })
                              ) : (
                                <TableRow>
                                  <TableCell colSpan={4} align="center">No answers recorded for this question</TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </Box>
                    </Paper>
                  );
                })}
              </Stack>
            ) : (
              <Paper sx={{ p: 4, textAlign: 'center', bgcolor: '#f9f9f9' }}>
                <Typography variant="body1">No answer data available</Typography>
              </Paper>
            )}
            
            {/* Back to home button */}
            <Box sx={{ textAlign: 'center', mt: 4 }}>
              <Button
                variant="contained"
                startIcon={<HomeIcon />}
                onClick={handleNewGame}
                sx={{ 
                  bgcolor: '#46178f',
                  '&:hover': { bgcolor: '#3b1378' },
                  fontWeight: 'bold',
                  borderRadius: 1,
                  px: 3,
                  py: 1,
                  textTransform: 'none' 
                }}
              >
                Return Home
              </Button>
            </Box>
          </Paper>
        </Container>
      </Collapse>
    </Box>
  );
}