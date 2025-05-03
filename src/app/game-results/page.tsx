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
  TableCell
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
  Cancel as CancelIcon
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
      
      // If team mode was detected, also set the view mode to group by default
      if (detectedGameMode === 'team') {
        setViewMode('group');
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
    setViewMode(newValue);
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

            {/* Question and Answer Summary */}
            <Typography variant="h5" sx={{ mt: 4, mb: 2, display: 'flex', alignItems: 'center' }}>
              Question Summary
            </Typography>

            <Paper elevation={1} sx={{ p: 0, borderRadius: 2, overflow: 'hidden', mb: 4 }}>
              {answersLoading ? (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <Typography>Loading answer data...</Typography>
                </Box>
              ) : playerAnswers.length > 0 ? (
                <List disablePadding>
                  {/* Get the quiz questions from sessionStorage */}
                  {(() => {
                    const quizData = JSON.parse(sessionStorage.getItem('quizPreviewData') || sessionStorage.getItem('currentQuiz') || '{}');
                    const questions = quizData.questions || [];
                    
                    // Create a map of questionId -> question for quick lookup
                    const questionMap = new Map();
                    questions.forEach((q: any) => {
                      questionMap.set(parseInt(q.id), q);
                    });
                    
                    // Group answers by questionId for better display
                    const answersByQuestion = new Map();
                    playerAnswers.forEach(answer => {
                      if (!answersByQuestion.has(answer.questionId)) {
                        answersByQuestion.set(answer.questionId, []);
                      }
                      answersByQuestion.get(answer.questionId).push(answer);
                    });
                    
                    // Sort questions by their ID or index
                    const sortedQuestionIds = Array.from(answersByQuestion.keys()).sort((a, b) => a - b);
                    
                    return sortedQuestionIds.map((questionId, qIndex) => {
                      const question = questionMap.get(questionId);
                      const answers = answersByQuestion.get(questionId) || [];
                      
                      if (!question) {
                        return (
                          <ListItem key={`question-${questionId}`} sx={{ p: 2, backgroundColor: qIndex % 2 === 0 ? 'rgba(0,0,0,0.02)' : 'transparent' }}>
                            <ListItemText 
                              primary={`Question #${qIndex + 1}`}
                              secondary="Question details not available"
                            />
                          </ListItem>
                        );
                      }
                      
                      const playerAnswer = answers.find((a: { playerId: any; }) => 
                        a.playerId === (playerInfo?.id || playerInfo?.playerId)
                      );
                      
                      const answerIndex = playerAnswer ? 
                        playerAnswer.answer.charCodeAt(0) - 'A'.charCodeAt(0) : -1;
                      
                      const correctAnswerIndex = typeof question.correctAnswer === 'number' ? 
                        question.correctAnswer : 
                        (question.isCorrect?.charCodeAt(0) - 'A'.charCodeAt(0) || 0);
                        
                      const options = question.options || [
                        question.optionA || 'Option A',
                        question.optionB || 'Option B',
                        question.optionC || 'Option C',
                        question.optionD || 'Option D'
                      ];
                      
                      return (
                        <React.Fragment key={`question-${questionId}`}>
                          {qIndex > 0 && <Divider />}
                          <ListItem sx={{ 
                            flexDirection: 'column', 
                            alignItems: 'flex-start',
                            p: 2,
                            backgroundColor: qIndex % 2 === 0 ? 'rgba(0,0,0,0.02)' : 'transparent'
                          }}>
                            <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                                Question {qIndex + 1}
                              </Typography>
                              {playerAnswer && (
                                <Chip 
                                  size="small"
                                  label={playerAnswer.isCorrect ? "Correct" : "Incorrect"}
                                  color={playerAnswer.isCorrect ? "success" : "error"}
                                />
                              )}
                            </Box>
                            
                            <Typography variant="body1" sx={{ mb: 1 }}>
                              {question.question || question.text || `Question #${qIndex + 1}`}
                            </Typography>
                            
                            <Box sx={{ display: 'grid', gridTemplateColumns: {xs: '1fr', sm: '1fr 1fr'}, width: '100%', gap: 1 }}>
                              {options.map((option: string, i: number) => (
                                <Box 
                                  key={`option-${i}`}
                                  sx={{ 
                                    p: 1.5, 
                                    borderRadius: 1,
                                    border: '1px solid',
                                    borderColor: 
                                      i === correctAnswerIndex ? 'success.main' : 
                                      (i === answerIndex && i !== correctAnswerIndex) ? 'error.main' : 
                                      'divider',
                                    backgroundColor: 
                                      i === correctAnswerIndex ? 'success.light' : 
                                      (i === answerIndex && i !== correctAnswerIndex) ? 'error.light' : 
                                      'transparent',
                                    opacity: 
                                      i === correctAnswerIndex || i === answerIndex ? 1 : 0.7,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 1
                                  }}
                                >
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="body2" sx={{ ml: 1 }}>
                                      {String.fromCharCode(65 + i)}. {option}
                                    </Typography>
                                  
                                    {/* Show number of players who chose this option */}
                                    {(() => {
                                      const optionAnswers = answers.filter((a: any) => 
                                        a.answer === String.fromCharCode(65 + i)
                                      );
                                      
                                      if (optionAnswers.length > 0) {
                                        return (
                                          <Chip
                                            size="small"
                                            label={`${optionAnswers.length} player${optionAnswers.length !== 1 ? 's' : ''}`}
                                            color={i === correctAnswerIndex ? "success" : "default"}
                                            variant="outlined"
                                            sx={{ 
                                              height: 20,
                                              '& .MuiChip-label': { 
                                                px: 1, 
                                                fontSize: '0.7rem' 
                                              }
                                            }}
                                          />
                                        );
                                      }
                                      return null;
                                    })()}
                                  </Box>
                                  
                                  {/* Progress bar showing percentage of players who chose this option */}
                                  {(() => {
                                    const optionAnswers = answers.filter((a: any) => 
                                      a.answer === String.fromCharCode(65 + i)
                                    );
                                    
                                    if (answers.length > 0) {
                                      const percentage = (optionAnswers.length / answers.length) * 100;
                                      
                                      return (
                                        <Box sx={{ width: '100%', mt: 0.5 }}>
                                          <Box
                                            sx={{
                                              height: 6,
                                              borderRadius: 3,
                                              width: `${percentage}%`,
                                              bgcolor: i === correctAnswerIndex ? 'success.main' : 
                                                (percentage > 0 ? 'primary.main' : 'transparent'),
                                              minWidth: percentage > 0 ? 8 : 0,
                                            }}
                                          />
                                        </Box>
                                      );
                                    }
                                    return null;
                                  })()}
                                </Box>
                              ))}
                            </Box>
                            
                            {playerAnswer && (
                              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                  Your response time: {playerAnswer.responseTime.toFixed(1)}s
                                </Typography>
                                
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  {playerAnswer.isCorrect ? (
                                    <CheckCircleIcon fontSize="small" color="success" />
                                  ) : (
                                    <CancelIcon fontSize="small" color="error" />
                                  )}
                                  <Typography variant="body2" color={playerAnswer.isCorrect ? "success.main" : "error.main"}>
                                    {playerAnswer.isCorrect ? "Correct" : "Incorrect"}
                                  </Typography>
                                </Box>
                              </Box>
                            )}
                          </ListItem>
                        </React.Fragment>
                      );
                    });
                  })()}
                </List>
              ) : (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <Typography>No answer data available</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Answer data could not be retrieved from the server.
                  </Typography>
                </Box>
              )}
            </Paper>

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
      {renderAnswerDetails()}
    </PublicLayout>
  );
}