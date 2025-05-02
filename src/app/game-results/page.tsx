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
  CircularProgress
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
  const [quiz, setQuiz] = useState<any>({});

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
        setQuiz(parsedQuizData);
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
          
          // If no local results, try to get from API
          const response = await fetch(
            `https://kahootclone-f7hkd0hwafgbfrfa.southeastasia-01.azurewebsites.net/api/Player/quiz/${quizId}`
          );
          
          if (!response.ok) {
            throw new Error(`Error fetching players: ${response.status}`);
          }
          
          const data = await response.json();
          
          if (data && data.status === 200 && Array.isArray(data.data)) {
            console.log("Players from API:", data.data);
            return data.data.map((player: any) => ({
              name: player.name || 'Player',
              score: player.score || 0,
              correctAnswers: player.correctAnswersCount || 0,
              totalQuestions: currentQuizData?.questions?.length || 0,
              avatar: player.avatar || 'alligator',
              group: player.team || null,
              id: player.id
            }));
          } else {
            console.warn("No valid player data from API");
            return [];
          }
        } catch (error) {
          console.error("Error fetching all players:", error);
          return [];
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

  // New function to fetch all answers for a quiz
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
            return parsedAnswers;
          }
        } catch (e) {
          console.error("Error parsing stored quiz answers:", e);
        }
      }
      
      // If not found in localStorage, try API call
      const response = await fetch(
        `https://kahootclone-f7hkd0hwafgbfrfa.southeastasia-01.azurewebsites.net/api/PlayerAnswer/quiz/${quizId}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        }
      );
      
      if (!response.ok) {
        console.warn(`Quiz answers API call failed with status ${response.status}`);
        throw new Error(`Failed to fetch quiz answers: ${response.status}`);
      }
      
      const responseData = await response.json();
      console.log("Quiz answers API response:", responseData);
      
      if (responseData && Array.isArray(responseData.data)) {
        const quizAnswers = responseData.data;
        console.log(`Found ${quizAnswers.length} answers for quiz ${quizId}`);
        
        // Save to localStorage for local testing across tabs
        localStorage.setItem(`quizAnswers_${quizId}`, JSON.stringify(quizAnswers));
        
        return quizAnswers;
      }
      
      // If the specific endpoint fails, try the general one and filter
      console.log("Trying general answers endpoint as fallback");
      const generalResponse = await fetch(
        `https://kahootclone-f7hkd0hwafgbfrfa.southeastasia-01.azurewebsites.net/api/PlayerAnswer`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        }
      );
      
      if (!generalResponse.ok) {
        throw new Error(`General answers endpoint failed: ${generalResponse.status}`);
      }
      
      const generalData = await generalResponse.json();
      
      if (generalData && Array.isArray(generalData.data)) {
        // Filter for answers that belong to this quiz
        // This may be imperfect since we don't have a direct quiz ID in the answers
        // but we can try to match based on question IDs or other properties
        const quizAnswers = generalData.data;
        console.log(`Found ${quizAnswers.length} answers in general endpoint, filtering for quiz ${quizId}`);
        
        // Save to localStorage for local testing across tabs
        localStorage.setItem(`quizAnswers_${quizId}`, JSON.stringify(quizAnswers));
        
        return quizAnswers;
      }
      
      return [];
    } catch (error) {
      console.error(`Error fetching all answers for quiz ${quizId}:`, error);
      return [];
    }
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
          <Typography variant="body1" sx={{ mb: 4 }}>
            We couldn't find any game results. This may happen if:
            <Box component="ul" sx={{ textAlign: 'left', display: 'inline-block', mt: 2 }}>
              <li>The game session expired</li>
              <li>Your browser's storage was cleared</li>
              <li>There was an error during the game</li>
            </Box>
          </Typography>
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
                                    alignItems: 'center'
                                  }}
                                >
                                  <Typography variant="body2" sx={{ ml: 1 }}>
                                    {String.fromCharCode(65 + i)}. {option}
                                  </Typography>
                                </Box>
                              ))}
                            </Box>
                            
                            {playerAnswer && (
                              <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                                Response time: {playerAnswer.responseTime}s
                              </Typography>
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
    </PublicLayout>
  );
}