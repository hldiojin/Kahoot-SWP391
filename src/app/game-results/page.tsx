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
  CardHeader,
  Alert,
  Snackbar,
  Grid
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
  Feedback as FeedbackIcon,
  Calculate as CalculateIcon,
  Timer as TimerIcon,
  Quiz as QuizIcon,
  QuestionAnswer as QuestionAnswerIcon,
  PriorityHigh as PriorityHighIcon,
  Bolt as BoltIcon
} from '@mui/icons-material';
import { useRouter, useSearchParams } from 'next/navigation';
import PublicLayout from '../components/PublicLayout';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import ReactConfetti from 'react-confetti';
import playerService from '@/services/playerService';
import axios from 'axios';
import quizService from '@/services/quizService';

const API_BASE_URL = 'https://kahootclone-f7hkd0hwafgbfrfa.southeastasia-01.azurewebsites.net';

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

// Fix for apiResults implicit errors
// First update the fetchQuizResults function to specify return type
// Add a QuizResults interface near the top of the file with the other interfaces

interface QuizResults {
  players: any[];
  totalQuestions: number;
  gameMode?: string;
  [key: string]: any;
}

// Add a PlayerResults interface
interface PlayerResults {
  name?: string;
  nickname?: string;
  score?: number;
  correctAnswers?: number;
  totalQuestions?: number;
  timeBonus?: number;
  averageAnswerTime?: number;
  avatar?: string;
  avatarUrl?: string;
  group?: string;
  team?: string;
  groupName?: string;
  id?: number;
  playerId?: number;
  [key: string]: any;
}

// Function to fetch player results for a quiz
const fetchPlayerResults = async (quizId: number, playerId: number): Promise<PlayerResults | null> => {
  try {
    console.log(`Fetching player results for quiz ID ${quizId} and player ID ${playerId}`);
    
    // First try using quizService's new method which has multiple fallbacks
    try {
      const response = await quizService.getPlayerQuizResult(quizId, playerId);
      console.log('getPlayerQuizResult response:', response);
      
      if (response && response.status === 200 && response.data) {
        return response.data;
      }
    } catch (serviceError) {
      console.warn('quizService.getPlayerQuizResult failed:', serviceError);
    }
    
    // If the service method fails, try direct API call (original approach)
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/Quiz/Player/ResultQuiz/${quizId}?PlayerId=${playerId}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        }
      );
      
      if (!response.ok) {
        console.warn(`Error fetching player results: ${response.status}`);
      } else {
        const data = await response.json();
        console.log("Player results from API:", data);
        
        if (data && data.status === 200 && data.data) {
          return data.data;
        }
      }
    } catch (apiError) {
      console.warn('Direct API call failed:', apiError);
    }
    
    // If both approaches fail, try playerService
    try {
      const playerResultsFromService = await playerService.getPlayerResults(quizId, playerId);
      console.log('playerService.getPlayerResults response:', playerResultsFromService);
      
      if (playerResultsFromService) {
        return playerResultsFromService;
      }
    } catch (playerServiceError) {
      console.warn('playerService.getPlayerResults failed:', playerServiceError);
    }
    
    // If everything fails, generate placeholder results from localStorage
    console.log('All API attempts failed, checking localStorage for fallback data');
    const storedAnswers = localStorage.getItem('playerAnswers');
    
    if (storedAnswers) {
      try {
        const answers = JSON.parse(storedAnswers);
        const relevantAnswers = answers.filter((a: any) => 
          a.playerId === playerId || (!a.playerId && a.questionId)
        );
        
        if (relevantAnswers.length > 0) {
          const correctAnswers = relevantAnswers.filter((a: any) => a.isCorrect).length;
          const totalScore = relevantAnswers.reduce((sum: number, a: any) => sum + (a.score || 0), 0);
          
          const fallbackResult = {
            playerId: playerId,
            nickname: 'Player',
            quizId: quizId,
            score: totalScore,
            correctAnswers: correctAnswers,
            totalQuestions: relevantAnswers.length,
          };
          
          console.log('Generated fallback result from localStorage:', fallbackResult);
          return fallbackResult;
        }
      } catch (parseError) {
        console.error('Error parsing stored answers:', parseError);
      }
    }
    
    return null;
  } catch (error) {
    console.error("Error fetching player results:", error);
    return null;
  }
};

// Function to fetch aggregate quiz results (for host view)
const fetchQuizResults = async (quizId: number): Promise<QuizResults | null> => {
  try {
    console.log(`Fetching aggregate quiz results for quiz ID ${quizId}`);
    
    // First try using quizService's new fetchQuizForHost method which has the most fallbacks
    try {
      console.log('Attempting to get quiz results via quizService.fetchQuizForHost...');
      const hostResults = await quizService.fetchQuizForHost(quizId);
      
      console.log('fetchQuizForHost response:', hostResults);
      
      if (hostResults && hostResults.status === 200 && hostResults.data) {
        console.log('Successfully got host quiz results, returning data');
        return hostResults.data;
      } else {
        console.warn('fetchQuizForHost returned invalid data:', hostResults);
      }
    } catch (hostViewError) {
      console.error('quizService.fetchQuizForHost failed:', hostViewError);
    }
    
    // Second try with the getFormattedQuizResults method
    try {
      console.log('Falling back to getFormattedQuizResults...');
      const formattedResults = await quizService.getFormattedQuizResults(quizId, true);
      
      if (formattedResults && formattedResults.status === 200 && formattedResults.data) {
        console.log('Successfully got formatted quiz results, returning data');
        return formattedResults.data;
      } else {
        console.warn('getFormattedQuizResults returned invalid data:', formattedResults);
      }
    } catch (serviceError) {
      console.error('quizService.getFormattedQuizResults failed:', serviceError);
    }
    
    // Fall back to direct API calls as a last resort
    console.log('Attempting direct API call to ResultQuiz endpoint...');
    const response = await fetch(
      `${API_BASE_URL}/api/Quiz/ResultQuiz/${quizId}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      }
    );
    
    if (!response.ok) {
      console.warn(`Error fetching quiz results: ${response.status} ${response.statusText}`);
      
      // If the first endpoint fails, try the legacy endpoint
      console.log('Trying legacy Result endpoint...');
      const legacyResponse = await fetch(
        `${API_BASE_URL}/api/Quiz/Result/${quizId}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        }
      );
      
      if (!legacyResponse.ok) {
        console.warn(`Legacy endpoint also failed: ${legacyResponse.status}`);
        return null;
      }
      
      const legacyData = await legacyResponse.json();
      console.log("Quiz results from legacy API:", legacyData);
      
      if (legacyData && legacyData.status === 200 && legacyData.data) {
        return legacyData.data;
      }
      
      return null;
    }
    
    const data = await response.json();
    console.log("Quiz aggregate results from API:", data);
    
    if (data && data.status === 200 && data.data) {
      return data.data;
    }
    
    return null;
  } catch (error) {
    console.error("Error fetching quiz results:", error);
    return null;
  }
};

const QuestionDetails = () => {
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [playerAnswers, setPlayerAnswers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      // Get questions and answers from storage
      const storedQuestions = sessionStorage.getItem('formattedQuestions') || localStorage.getItem('formattedQuestions');
      const storedAnswers = sessionStorage.getItem('playerAnswers') || localStorage.getItem('playerAnswers');
      
      if (storedQuestions && storedAnswers) {
        const parsedQuestions = JSON.parse(storedQuestions);
        const parsedAnswers = JSON.parse(storedAnswers);
        
        console.log("Loaded questions:", parsedQuestions);
        console.log("Loaded answers:", parsedAnswers);
        
        setQuestions(parsedQuestions);
        setPlayerAnswers(parsedAnswers);
      }
    } catch (error) {
      console.error("Error loading question details:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleToggleQuestion = (questionId: number) => {
    if (expandedQuestion === questionId) {
      setExpandedQuestion(null);
    } else {
      setExpandedQuestion(questionId);
    }
  };

  // Helper function to get letter from index (A, B, C, D)
  const getLetterFromIndex = (index: number) => {
    return String.fromCharCode(65 + index);
  };

  // Helper function to convert answer letter to index (A->0, B->1, etc.)
  const letterToIndex = (letter: string) => {
    if (letter === 'T') return -1; // Timeout
    return letter.charCodeAt(0) - 65; // A->0, B->1, etc.
  };

  if (loading) {
    return (
      <Box sx={{ 
        textAlign: 'center', 
        my: 3,
        p: 4,
        borderRadius: 3,
        bgcolor: 'rgba(255,255,255,0.7)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.08)'
      }}>
        <CircularProgress size={40} sx={{ color: 'primary.main' }} />
        <Typography variant="body1" sx={{ mt: 2, fontWeight: 'medium', color: 'text.secondary' }}>
          Loading your quiz results...
        </Typography>
      </Box>
    );
  }

  if (!questions.length || !playerAnswers.length) {
    return (
      <Box sx={{ 
        textAlign: 'center', 
        my: 3,
        p: 4,
        borderRadius: 3,
        bgcolor: 'rgba(255,255,255,0.7)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.08)'
      }}>
        <FeedbackIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No Question Details
        </Typography>
        <Typography variant="body2" color="text.secondary">
          We couldn't find any question data for this quiz.
        </Typography>
      </Box>
    );
  }

  // Calculate overall stats
  const totalQuestions = questions.length;
  const correctAnswers = playerAnswers.filter(a => a.isCorrect).length;
  const totalScore = playerAnswers.reduce((sum, a) => sum + (a.score || 0), 0);
  const accuracy = Math.round((correctAnswers / totalQuestions) * 100);

  return (
    <Card 
      sx={{ 
        mt: 4, 
        borderRadius: 3, 
        maxWidth: 500, 
        mx: 'auto', 
        overflow: 'hidden',
        boxShadow: '0 12px 24px rgba(0,0,0,0.12)',
        border: '1px solid rgba(0,0,0,0.05)'
      }}
    >
      <Box sx={{ 
        bgcolor: 'primary.main', 
        backgroundImage: 'linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)',
        color: 'white', 
        position: 'relative', 
        overflow: 'hidden'
      }}>
        <CardHeader 
          title={
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <QuizIcon sx={{ mr: 1 }} />
              <Typography variant="h6" component="span">
                Question Details
              </Typography>
            </Box>
          }
          sx={{ 
            textAlign: 'center', 
            pb: 1,
            position: 'relative',
            zIndex: 1
          }}
        />
        
        {/* Summary Stats */}
        <Box sx={{ 
          p: 2, 
          display: 'flex', 
          justifyContent: 'space-around',
          position: 'relative',
          zIndex: 1,
          '&:before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '1px',
            bgcolor: 'rgba(255,255,255,0.2)'
          }
        }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" color="rgba(255,255,255,0.8)" gutterBottom>
              Correct
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircleIcon sx={{ fontSize: 16, mr: 0.5, color: 'success.light' }} />
              <Typography variant="h6" fontWeight="bold">
                {correctAnswers}/{totalQuestions}
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" color="rgba(255,255,255,0.8)" gutterBottom>
              Accuracy
            </Typography>
            <Typography variant="h6" fontWeight="bold">
              {accuracy}%
            </Typography>
          </Box>
          
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" color="rgba(255,255,255,0.8)" gutterBottom>
              Score
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrophyIcon sx={{ fontSize: 16, mr: 0.5, color: '#FFD700' }} />
              <Typography variant="h6" fontWeight="bold">
                {totalScore}
              </Typography>
            </Box>
          </Box>
        </Box>
        
        {/* Background elements */}
        <Box sx={{
          position: 'absolute',
          width: '150px',
          height: '150px',
          bgcolor: 'rgba(255,255,255,0.05)',
          borderRadius: '50%',
          top: '-75px',
          right: '-75px'
        }} />
        <Box sx={{
          position: 'absolute',
          width: '100px',
          height: '100px',
          bgcolor: 'rgba(255,255,255,0.05)',
          borderRadius: '50%',
          bottom: '-50px',
          left: '-50px'
        }} />
      </Box>
      
      {/* Questions List */}
      <CardContent sx={{ p: 0, bgcolor: '#f9f9fc' }}>
        <List disablePadding>
          {questions.map((question, index) => {
            const answer = playerAnswers.find(a => a.questionId === question.id);
            const isCorrect = answer?.isCorrect || false;
            const answerLetter = answer?.answer || 'T';
            const answerIndex = letterToIndex(answerLetter);
            const correctAnswerIndex = question.isCorrect ? 
              question.isCorrect.charCodeAt(0) - 'A'.charCodeAt(0) : 0;
            const isExpanded = expandedQuestion === question.id;
            
            return (
              <React.Fragment key={question.id}>
                <ListItem 
                  component="div"
                  onClick={() => handleToggleQuestion(question.id)}
                  sx={{ 
                    py: 1.5, 
                    pl: 2, 
                    pr: 1.5,
                    cursor: 'pointer',
                    borderBottom: '1px solid rgba(0,0,0,0.06)',
                    position: 'relative',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: 'rgba(0,0,0,0.02)'
                    },
                    '&:before': {
                      content: '""',
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: 4,
                      bgcolor: isCorrect ? 'success.main' : 'error.main',
                      transition: 'all 0.2s ease',
                      transform: isExpanded ? 'scaleY(1)' : 'scaleY(0.5)',
                      opacity: isExpanded ? 1 : 0.7
                    }
                  }}
                >
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    width: '100%',
                    gap: 1.5
                  }}>
                    {/* Question number with correct/incorrect indicator */}
                    <Avatar 
                      sx={{ 
                        width: 36, 
                        height: 36, 
                        bgcolor: isCorrect ? 'success.main' : 'error.main',
                        color: 'white',
                        fontWeight: 'bold',
                        boxShadow: isCorrect ? 
                          '0 4px 10px rgba(76, 175, 80, 0.4)' : 
                          '0 4px 10px rgba(244, 67, 54, 0.4)',
                        transition: 'all 0.2s ease',
                        transform: isExpanded ? 'scale(1.05)' : 'scale(1)'
                      }}
                    >
                      {index + 1}
                    </Avatar>
                    
                    {/* Question preview and score */}
                    <Box sx={{ flex: 1, overflow: 'hidden' }}>
                      <Typography 
                        variant="body1" 
                        fontWeight="medium" 
                        sx={{ 
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: '100%',
                          color: isExpanded ? 'primary.main' : 'text.primary'
                        }}
                      >
                        {question.text}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, mt: 0.5, alignItems: 'center' }}>
                        <Chip 
                          size="small" 
                          label={`${answer?.score || 0} pts`} 
                          sx={{
                            height: 20, 
                            '& .MuiChip-label': { px: 1, py: 0 },
                            bgcolor: isCorrect ? 'success.light' : 'rgba(0,0,0,0.05)',
                            color: isCorrect ? 'white' : 'text.secondary',
                            fontWeight: 'medium'
                          }}
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                          <TimerIcon fontSize="small" sx={{ fontSize: 14, mr: 0.5 }} />
                          {answer?.responseTime || 0}s
                        </Typography>
                      </Box>
                    </Box>
                    
                    {/* Correct/incorrect icon */}
                    <Box>
                      {isCorrect ? (
                        <CheckCircleIcon sx={{ color: 'success.main' }} />
                      ) : (
                        <CancelIcon sx={{ color: 'error.main' }} />
                      )}
                    </Box>
                    
                    {/* Expand/collapse icon */}
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'center', 
                      alignItems: 'center',
                      width: 24, 
                      height: 24, 
                      borderRadius: '50%',
                      bgcolor: 'rgba(0,0,0,0.05)',
                      transition: 'all 0.2s',
                      transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
                    }}>
                      <ExpandMore sx={{ fontSize: 20 }} />
                    </Box>
                  </Box>
                </ListItem>
                
                <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                  <Box sx={{ 
                    bgcolor: 'rgba(0,0,0,0.02)',
                    borderBottom: '1px solid rgba(0,0,0,0.06)',
                    p: 2.5
                  }}>
                    {/* Question header info */}
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      mb: 2.5,
                      pb: 1.5,
                      borderBottom: '1px dashed rgba(0,0,0,0.1)'
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {question.type === 'true-false' ? (
                          <PriorityHighIcon sx={{ color: 'primary.main', mr: 0.5, fontSize: 18 }} />
                        ) : (
                          <QuestionAnswerIcon sx={{ color: 'primary.main', mr: 0.5, fontSize: 18 }} />
                        )}
                        <Typography variant="body2" fontWeight="medium" color="primary.main">
                          {question.type === 'true-false' ? 'True/False' : 'Multiple Choice'}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <TimerIcon sx={{ color: 'text.secondary', mr: 0.5, fontSize: 18 }} />
                        <Typography variant="body2" fontWeight="medium" color="text.secondary">
                          {question.timeLimit}s
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <TrophyIcon sx={{ color: '#FFD700', mr: 0.5, fontSize: 18 }} />
                        <Typography variant="body2" fontWeight="medium" color="text.secondary">
                          {question.score} points
                        </Typography>
                      </Box>
                    </Box>
                    
                    {/* Answer options */}
                    <Typography 
                      variant="subtitle2" 
                      fontWeight="medium" 
                      gutterBottom
                      sx={{ 
                        mb: 1.5, 
                        display: 'flex', 
                        alignItems: 'center',
                        color: 'primary.main'
                      }}
                    >
                      <QuizIcon sx={{ mr: 0.75, fontSize: 18 }} />
                      Answer Options
                    </Typography>
                    
                    <Box sx={{ mb: 2 }}>
                      {['A', 'B', 'C', 'D'].map((option, idx) => {
                        if (question.type === 'true-false' && idx > 1) return null;
                        
                        const optionField = `option${option}`;
                        if (!question[optionField]) return null;
                        
                        const isCorrectOption = correctAnswerIndex === idx;
                        const isSelectedOption = answerIndex === idx;
                        const isIncorrectSelection = isSelectedOption && !isCorrect;
                        
                        return (
                          <Box 
                            key={option} 
                            sx={{ 
                              display: 'flex',
                              alignItems: 'center',
                              py: 1.25, 
                              px: 2,
                              mb: 1,
                              borderRadius: 2,
                              position: 'relative',
                              transition: 'all 0.2s',
                              bgcolor: isCorrectOption ? 'rgba(76, 175, 80, 0.08)' : 
                                      isIncorrectSelection ? 'rgba(244, 67, 54, 0.08)' : 
                                      'white',
                              border: isCorrectOption ? '1px solid rgba(76, 175, 80, 0.5)' : 
                                      isIncorrectSelection ? '1px solid rgba(244, 67, 54, 0.5)' : 
                                      '1px solid rgba(0,0,0,0.1)',
                              boxShadow: isCorrectOption || isSelectedOption ? 
                                '0 2px 12px rgba(0,0,0,0.08)' : 'none',
                              '&:hover': {
                                boxShadow: '0 2px 12px rgba(0,0,0,0.08)'
                              }
                            }}
                          >
                            {/* Option letter badge */}
                            <Box
                              sx={{
                                width: 28,
                                height: 28,
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 'bold',
                                fontSize: '0.875rem',
                                mr: 1.5,
                                color: 'white',
                                position: 'relative',
                                overflow: 'hidden',
                                bgcolor: isCorrectOption ? 'success.main' : 
                                        isIncorrectSelection ? 'error.main' :
                                        'primary.main',
                                boxShadow: isCorrectOption ? '0 2px 8px rgba(76, 175, 80, 0.4)' :
                                          isIncorrectSelection ? '0 2px 8px rgba(244, 67, 54, 0.4)' :
                                          '0 2px 8px rgba(25, 118, 210, 0.3)'
                              }}
                            >
                              {option}
                            </Box>
                            
                            {/* Option text */}
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                flex: 1, 
                                fontWeight: isCorrectOption || isSelectedOption ? 'medium' : 'normal',
                                color: isCorrectOption ? 'success.dark' : 
                                      isIncorrectSelection ? 'error.dark' : 
                                      'text.primary'
                              }}
                              component="span"
                            >
                              {question[optionField]}
                            </Typography>
                            
                            {/* Correct/incorrect indicators */}
                            {isCorrectOption && (
                              <Box sx={{ ml: 1 }}>
                                <CheckCircleIcon 
                                  color="success" 
                                  fontSize="small" 
                                  sx={{ 
                                    animation: isCorrectOption ? 'pulse 1.5s infinite' : 'none',
                                    '@keyframes pulse': {
                                      '0%': { opacity: 0.7 },
                                      '50%': { opacity: 1 },
                                      '100%': { opacity: 0.7 }
                                    }
                                  }} 
                                />
                              </Box>
                            )}
                            {isIncorrectSelection && (
                              <Box sx={{ ml: 1 }}>
                                <CancelIcon color="error" fontSize="small" />
                              </Box>
                            )}
                            
                            {/* Selection indicator */}
                            {isSelectedOption && (
                              <Box 
                                sx={{ 
                                  position: 'absolute', 
                                  right: 0, 
                                  top: 0, 
                                  borderWidth: '0 30px 30px 0',
                                  borderStyle: 'solid',
                                  borderColor: `transparent ${isCorrect ? 'success.light' : 'error.light'} transparent transparent`
                                }}
                              />
                            )}
                          </Box>
                        );
                      })}
                      
                      {/* Show timeout option if applicable */}
                      {answerLetter === 'T' && (
                        <Box 
                          sx={{ 
                            display: 'flex',
                            alignItems: 'center',
                            py: 1.25, 
                            px: 2,
                            mb: 1,
                            borderRadius: 2,
                            position: 'relative',
                            bgcolor: 'rgba(244, 67, 54, 0.08)',
                            border: '1px solid rgba(244, 67, 54, 0.5)',
                            boxShadow: '0 2px 12px rgba(0,0,0,0.08)'
                          }}
                        >
                          <Box
                            sx={{
                              width: 28,
                              height: 28,
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 'bold',
                              fontSize: '0.875rem',
                              mr: 1.5,
                              color: 'white',
                              bgcolor: 'error.main',
                              boxShadow: '0 2px 8px rgba(244, 67, 54, 0.4)'
                            }}
                          >
                            T
                          </Box>
                          <Typography variant="body2" sx={{ flex: 1, fontWeight: 'medium', color: 'error.dark' }}>
                            No answer (Time expired)
                          </Typography>
                          <Box sx={{ ml: 1 }}>
                            <CancelIcon color="error" fontSize="small" />
                          </Box>
                          
                          {/* Selection indicator */}
                          <Box 
                            sx={{ 
                              position: 'absolute', 
                              right: 0, 
                              top: 0, 
                              borderWidth: '0 30px 30px 0',
                              borderStyle: 'solid',
                              borderColor: 'transparent error.light transparent transparent'
                            }}
                          />
                        </Box>
                      )}
                    </Box>
                    
                    {/* Performance summary */}
                    <Paper
                      elevation={0}
                      sx={{ 
                        mt: 2, 
                        p: 0,
                        borderRadius: 2,
                        overflow: 'hidden',
                        border: '1px solid rgba(0,0,0,0.08)'
                      }}
                    >
                      <Box sx={{ 
                        p: 1.5, 
                        bgcolor: 'rgba(25, 118, 210, 0.05)', 
                        borderBottom: '1px solid rgba(0,0,0,0.08)'
                      }}>
                        <Typography variant="subtitle2" fontWeight="medium" color="primary.main">
                          Your Performance
                        </Typography>
                      </Box>
                      
                      <Box sx={{ p: 2, bgcolor: 'white' }}>
                        <Stack spacing={2} direction="row" sx={{ flexWrap: 'wrap', gap: 2 }}>
                          <Box sx={{ flex: '1 1 45%', minWidth: '45%' }}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              Your Answer
                            </Typography>
                            <Box sx={{ 
                              display: 'flex', 
                              alignItems: 'center',
                              borderRadius: 1,
                              p: 1,
                              bgcolor: isCorrect ? 'rgba(76, 175, 80, 0.08)' : 'rgba(244, 67, 54, 0.08)'
                            }}>
                              {answerLetter === 'T' ? (
                                <Typography variant="body2" fontWeight="medium" color="error.main" component="span">
                                  Time Expired
                                </Typography>
                              ) : (
                                <Typography variant="body2" fontWeight="medium" color={isCorrect ? 'success.main' : 'error.main'} component="span">
                                  Option {answerLetter}
                                </Typography>
                              )}
                              {isCorrect ? (
                                <CheckCircleIcon color="success" sx={{ ml: 'auto', fontSize: 20 }} />
                              ) : (
                                <CancelIcon color="error" sx={{ ml: 'auto', fontSize: 20 }} />
                              )}
                            </Box>
                          </Box>
                          
                          <Box sx={{ flex: '1 1 45%', minWidth: '45%' }}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              Correct Answer
                            </Typography>
                            <Box sx={{ 
                              display: 'flex', 
                              alignItems: 'center',
                              borderRadius: 1,
                              p: 1,
                              bgcolor: 'rgba(76, 175, 80, 0.08)'
                            }}>
                              <Typography variant="body2" fontWeight="medium" color="success.main" component="span">
                                Option {getLetterFromIndex(correctAnswerIndex)}
                              </Typography>
                              <CheckCircleIcon color="success" sx={{ ml: 'auto', fontSize: 20 }} />
                            </Box>
                          </Box>
                          
                          <Box sx={{ flex: '1 1 45%', minWidth: '45%' }}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              Response Time
                            </Typography>
                            <Box sx={{ 
                              display: 'flex', 
                              alignItems: 'center',
                              borderRadius: 1,
                              p: 1,
                              bgcolor: 'rgba(0,0,0,0.03)'
                            }}>
                              <TimerIcon sx={{ color: 'text.secondary', mr: 1, fontSize: 18 }} />
                              <Typography variant="body2" fontWeight="medium" component="span">
                                {answer?.responseTime || 0} seconds
                              </Typography>
                            </Box>
                          </Box>
                          
                          <Box sx={{ flex: '1 1 45%', minWidth: '45%' }}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              Points Earned
                            </Typography>
                            <Box sx={{ 
                              display: 'flex', 
                              alignItems: 'center',
                              borderRadius: 1,
                              p: 1,
                              bgcolor: 'rgba(0,0,0,0.03)'
                            }}>
                              <TrophyIcon sx={{ color: '#FFD700', mr: 1, fontSize: 18 }} />
                              <Typography variant="body2" fontWeight="medium" color={isCorrect ? 'success.main' : 'text.primary'} component="span">
                                {answer?.score || 0} points
                              </Typography>
                            </Box>
                          </Box>
                        </Stack>
                      </Box>
                    </Paper>
                  </Box>
                </Collapse>
              </React.Fragment>
            );
          })}
        </List>
      </CardContent>
    </Card>
  );
};

export default function GameResultsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const quizIdParam = searchParams.get('quizId');
  const playerIdParam = searchParams.get('playerId');
  const isHost = searchParams.get('host') === 'true';
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
  const [showResults, setShowResults] = useState(false);
  const [scoresFinalized, setScoresFinalized] = useState(false);
  const [calculatingScores, setCalculatingScores] = useState(false);
  const [scoreMessage, setScoreMessage] = useState<{show: boolean, message: string, severity: 'success' | 'error' | 'info'}>({
    show: false,
    message: '',
    severity: 'info'
  });

  // Load data and calculate scores
  useEffect(() => {
    // Set window dimensions for confetti
    setWindowDimensions({
      width: window.innerWidth,
      height: window.innerHeight
    });

    const loadDataAndCalculateScores = async () => {
      try {
        console.log("Loading game results data...");
        
        // Get basic information from storage
        const quizData = sessionStorage.getItem('currentQuiz') || localStorage.getItem('currentQuiz') || 
                         sessionStorage.getItem('quizPreviewData') || localStorage.getItem('quizPreviewData');
        const playerInfoData = sessionStorage.getItem('currentPlayer') || localStorage.getItem('currentPlayer');
        
        // Parse the basic data we have
        let parsedQuizData = null;
        let currentPlayerData = null;
        
        try {
          if (quizData) parsedQuizData = JSON.parse(quizData);
          if (playerInfoData) currentPlayerData = JSON.parse(playerInfoData);
        } catch (parseError) {
          console.error("Error parsing stored data:", parseError);
        }
        
        // Set player info
        if (currentPlayerData) {
          setPlayerInfo(currentPlayerData);
        }
        
        // Set basic game info if available
        if (parsedQuizData) {
          setGameTitle(parsedQuizData.title || "Quiz Game");
          setCurrentQuizData(parsedQuizData);
        }
        
        // Get player ID and quiz ID either from URL or storage
        const quizId = quizIdParam || parsedQuizData?.id || 0;
        const playerId = playerIdParam || currentPlayerData?.playerId || currentPlayerData?.id || 0;
        
        console.log(`Working with quizId: ${quizId}, playerId: ${playerId}, isHost: ${isHost}`);
        
        // Set loading state while we fetch API data
        setLoading(true);
        setCalculatingScores(true);
        
        let apiResults: QuizResults | PlayerResults | null = null;
        
        // First try to get results from the API
        if (quizId && quizId !== 0) {
          // If we're the host, fetch aggregate results for all players
          if (isHost) {
            try {
              apiResults = await fetchQuizResults(Number(quizId));
              console.log("Host view - fetched aggregate results:", apiResults);
              
              if (apiResults && apiResults.players && Array.isArray(apiResults.players)) {
                // Format player results from the aggregate data
                const formattedResults = apiResults.players.map((player: any) => ({
                  name: player.name || player.nickname || 'Player',
                  score: player.score ?? 0,
                  correctAnswers: player.correctAnswers ?? 0,
                  totalQuestions: player.totalQuestions ?? apiResults?.totalQuestions ?? 0,
                  timeBonus: player.timeBonus ?? 0,
                  averageAnswerTime: player.averageAnswerTime ?? 0,
                  avatar: player.avatar ?? player.avatarUrl ?? 'alligator',
                  group: player.group ?? player.team ?? player.groupName ?? null,
                  id: player.id || player.playerId || 0
                }));
                
                // Sort by score in descending order
                formattedResults.sort((a: any, b: any) => b.score - a.score);
                
                console.log("Formatted player results:", formattedResults);
                setPlayerResults(formattedResults);
          
                // Calculate group results if in team mode
                if (apiResults.gameMode === 'team' || formattedResults.some((p: any) => p.group)) {
                  setGameMode('team');
                  const calculatedGroups = calculateGroupScores(formattedResults);
                  setGroupResults(calculatedGroups);
                }
                
                // Show confetti for the highest score
                if (formattedResults.length > 0 && formattedResults[0].score > 0) {
                  setShowConfetti(true);
                }
                
                setShowResults(true);
                setScoresFinalized(true);
              } else {
                console.log("No valid player results in the aggregate data");
                // Try fallback to stored results if API data is empty
                fallbackToStoredResults();
              }
            } catch (error) {
              console.error("Error processing aggregate results:", error);
              fallbackToStoredResults();
            }
          } 
          // Player view - fetch only this player's results
          else if (playerId && playerId !== 0) {
            try {
              apiResults = await fetchPlayerResults(Number(quizId), Number(playerId));
              console.log("Player view - fetched player results:", apiResults);
              
              if (apiResults) {
                // Format the player results
                const playerResult = {
                  name: currentPlayerData?.name || apiResults.name || apiResults.nickname || 'Player',
                  score: apiResults.score || 0,
                  correctAnswers: apiResults.correctAnswers || 0,
                  totalQuestions: apiResults.totalQuestions || parsedQuizData?.questions?.length || 0,
                  timeBonus: apiResults.timeBonus || 0,
                  averageAnswerTime: apiResults.averageAnswerTime || 0,
                  avatar: currentPlayerData?.avatar || apiResults.avatar || apiResults.avatarUrl || 'alligator',
                  group: currentPlayerData?.team || apiResults.group || apiResults.team || apiResults.groupName || null,
                  id: playerId
          };
          
                console.log("Formatted player result:", playerResult);
                setPlayerResults([playerResult]);
                setCurrentPlayer(playerResult.name);
                setPlayerAvatar(playerResult.avatar);
                
                // Show confetti for good scores
                if (playerResult.score > 0) {
                  setShowConfetti(true);
                }
                
          setShowResults(true);
          setScoresFinalized(true);
          
                // Store results for future reference
                sessionStorage.setItem('gameResults', JSON.stringify([playerResult]));
                localStorage.setItem('gameResults', JSON.stringify([playerResult]));
              } else {
                console.log("No valid player result from API");
          
                // Fall back to stored results if API fails
                fallbackToStoredResults();
              }
            } catch (error) {
              console.error("Error processing player results:", error);
              
              // Fall back to stored results if API fails
              fallbackToStoredResults();
            }
          } else {
            console.log("No valid player ID available, falling back to stored results");
            
            // Fall back to stored results
            fallbackToStoredResults();
          }
        } else {
          console.log("No valid quiz ID available, falling back to stored results");
          
          // Fall back to stored results
          fallbackToStoredResults();
        }
      } catch (error) {
        console.error('Error in loadDataAndCalculateScores:', error);
        
        // Fall back to stored results on error
        fallbackToStoredResults();
        
        setScoreMessage({
          show: true,
          message: 'Error loading game results. Using local data instead.',
          severity: 'error'
        });
      } finally {
        // Always set showResults to true after loading is complete
        setShowResults(true);
        setLoading(false);
        setCalculatingScores(false);
      }
    };
    
    // Helper function to fall back to stored results when API fails
    const fallbackToStoredResults = () => {
      console.log("Falling back to stored results...");
      
      // Try to get data from both sessionStorage and localStorage for redundancy
      const storedResults = sessionStorage.getItem('gameResults') || localStorage.getItem('gameResults');
      const quizData = sessionStorage.getItem('currentQuiz') || localStorage.getItem('currentQuiz') || 
                       sessionStorage.getItem('quizPreviewData') || localStorage.getItem('quizPreviewData');
      const playerInfoData = sessionStorage.getItem('currentPlayer') || localStorage.getItem('currentPlayer');
      const storedAnswers = sessionStorage.getItem('playerAnswers') || localStorage.getItem('playerAnswers');
      const formattedQuestionsData = sessionStorage.getItem('formattedQuestions') || localStorage.getItem('formattedQuestions');
      
      let parsedResults = null;
      let parsedQuizData = null;
      let currentPlayerData = null;
      let parsedAnswers = [];
      let quizQuestions = [];
      
      try {
        if (storedResults) parsedResults = JSON.parse(storedResults);
        if (quizData) parsedQuizData = JSON.parse(quizData);
        if (playerInfoData) currentPlayerData = JSON.parse(playerInfoData);
        if (storedAnswers) parsedAnswers = JSON.parse(storedAnswers);
        if (formattedQuestionsData) quizQuestions = JSON.parse(formattedQuestionsData);
      } catch (parseError) {
        console.error("Error parsing stored data:", parseError);
      }
      
      // Use existing stored results if available
      if (parsedResults && Array.isArray(parsedResults) && parsedResults.length > 0) {
          console.log("Using existing stored results:", parsedResults);
          setPlayerResults(parsedResults);
          setShowResults(true);
          
          // Set game title and player info from stored data
          if (parsedQuizData) setGameTitle(parsedQuizData.title || "Quiz Game");
          if (currentPlayerData) {
            setCurrentPlayer(currentPlayerData.name || '');
            setPlayerAvatar(currentPlayerData.avatar || 'alligator');
          }
          
          // Show confetti for good scores
          if (parsedResults[0]?.score > 0) setShowConfetti(true);
          
        // Calculate group results if in team mode
        if (parsedResults.some(p => p.group)) {
          setGameMode('team');
          const calculatedGroups = calculateGroupScores(parsedResults);
          setGroupResults(calculatedGroups);
        }
        
          setScoresFinalized(true);
        }
      // Calculate scores from answers if no stored results but we have answers
      else if (parsedAnswers.length > 0 && quizQuestions.length > 0) {
          console.log("Calculating scores from raw answers and questions");
          
          // Calculate scores without API calls
          let totalScore = 0;
          const correctAnswers = parsedAnswers.filter((a: any) => a.isCorrect).length;
          
          // Loop through each answer to calculate its score
          parsedAnswers.forEach((answer: any) => {
            if (answer.isCorrect) {
              const question = quizQuestions.find((q: any) => q.id === answer.questionId);
              if (question) {
                const basePoints = question.score || 100;
                const timeLimit = question.timeLimit || 20;
                const timeRatio = Math.min(answer.responseTime / timeLimit, 1);
                const timeMultiplier = 1 - (timeRatio * 0.5); // From 1.0 down to 0.5 based on time
                const answerScore = Math.round(basePoints * timeMultiplier);
                
                // Add score to the answer
                answer.score = answerScore;
                totalScore += answerScore;
              }
            }
          });
          
          // Store answers with calculated scores
          sessionStorage.setItem('playerAnswers', JSON.stringify(parsedAnswers));
          localStorage.setItem('playerAnswers', JSON.stringify(parsedAnswers));
          
          // Calculate average response time
          const totalResponseTime = parsedAnswers.reduce((sum: number, a: any) => sum + a.responseTime, 0);
          const averageResponseTime = parsedAnswers.length > 0 ? totalResponseTime / parsedAnswers.length : 0;
          
          const playerScore = {
            name: currentPlayerData?.name || 'Player',
            avatar: currentPlayerData?.avatar || 'alligator',
            score: totalScore,
            correctAnswers: correctAnswers,
            totalQuestions: quizQuestions.length,
            timeBonus: Math.floor(totalScore * 0.1),
            averageAnswerTime: parseFloat(averageResponseTime.toFixed(1)),
            group: currentPlayerData?.team || null,
            id: currentPlayerData?.playerId || currentPlayerData?.id || 0
          };
          
          console.log("Calculated player score locally:", playerScore);
          
          // Save calculated results
          setPlayerResults([playerScore]);
          setShowResults(true);
          setScoresFinalized(true);
          
          // Store in session/local storage
          sessionStorage.setItem('gameResults', JSON.stringify([playerScore]));
          localStorage.setItem('gameResults', JSON.stringify([playerScore]));
          
          // Set game title and player info
          if (parsedQuizData) setGameTitle(parsedQuizData.title || "Quiz Game");
          if (currentPlayerData) {
            setCurrentPlayer(currentPlayerData.name || '');
            setPlayerAvatar(currentPlayerData.avatar || 'alligator');
          }
          
          // Show confetti for good scores
          if (totalScore > 0) setShowConfetti(true);
        }
        // Create fallback result if no stored results found but we have player data
        else if (currentPlayerData) {
          console.log("Creating fallback result with minimal player data");
          
          // Determine total questions from quiz data
          let totalQuestions = 0;
          if (parsedQuizData && parsedQuizData.questions) {
            totalQuestions = parsedQuizData.questions.length;
          }
          
          const fallbackResult = [{
            name: currentPlayerData.name || 'Player',
            score: 0, // Zero score for no answers or all incorrect
            correctAnswers: 0,
            totalQuestions: totalQuestions,
            timeBonus: 0,
            averageAnswerTime: 0,
            avatar: currentPlayerData.avatar || 'alligator',
            group: currentPlayerData.team || null,
            id: currentPlayerData.playerId || currentPlayerData.id || 0
          }];
          
          setPlayerResults(fallbackResult);
          console.log("Set fallback player results:", fallbackResult);
          
          // Set game title and current player
          if (parsedQuizData) {
            setGameTitle(parsedQuizData.title || "Quiz Game");
          }
          setCurrentPlayer(currentPlayerData.name || '');
          setPlayerAvatar(currentPlayerData.avatar || 'alligator');
          
          // Save this fallback result to storage
          sessionStorage.setItem('gameResults', JSON.stringify(fallbackResult));
          localStorage.setItem('gameResults', JSON.stringify(fallbackResult));
          
          setShowResults(true);
          setScoresFinalized(true);
      }
    };
    
    loadDataAndCalculateScores();
  }, [quizIdParam, playerIdParam, isHost]);
  
  // IMPORTANT: Don't add hardcoded players automatically - only show real results
  // Delete or modify the useEffect that adds hardcoded players
  useEffect(() => {
    // Only add group scores for team mode
    if (playerResults.length > 0 && gameMode === 'team') {
      // Calculate group scores from the player results
      const calculatedGroups = calculateGroupScores(playerResults);
      setGroupResults(calculatedGroups);
    }
  }, [playerResults, gameMode, playerInfo]);

  // Function to close the score message snackbar
  const handleCloseMessage = () => {
    setScoreMessage({...scoreMessage, show: false});
  };

  // Rest of component code...
  
  // Replace loading view to show score calculation status
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
  
  if (calculatingScores) {
    return (
      <PublicLayout>
        <Container maxWidth="md" sx={{ py: 6, textAlign: 'center' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <CalculateIcon sx={{ fontSize: 50, color: 'primary.main' }} />
            <Typography variant="h5">Calculating final scores...</Typography>
            <CircularProgress />
            <Typography variant="body1" color="text.secondary">
              This may take a few moments as we process all your answers
            </Typography>
          </Box>
        </Container>
      </PublicLayout>
    );
  }

  return (
    <>
      {/* Existing component render code */}
      <Box 
        sx={{ 
          minHeight: '100vh',
          bgcolor: '#46178f', 
          color: 'white',
          pb: 4
        }}
      >
        {/* Add a fallback message section for when results don't display properly */}
        {showResults && playerResults.length === 0 && !calculatingScores && (
          <Container maxWidth="md" sx={{ textAlign: 'center', py: 6 }}>
            <Paper sx={{ p: 4, mb: 4, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.9)' }}>
              <Box sx={{ mb: 3 }}>
                {playerAvatar && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                    <Box sx={{ width: 80, height: 80 }}>
                      <Animal
                        name={getAnimalAvatar(playerAvatar).name}
                        color={getAnimalAvatar(playerAvatar).color}
                        size="100%"
                      />
                    </Box>
                  </Box>
                )}
                <Typography variant="h4" color="primary" gutterBottom>
                  Game Complete!
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {gameTitle ? `You've completed ${gameTitle}` : "You've completed the quiz"}
                </Typography>
              </Box>
              
              <Box sx={{ mt: 4, p: 3, bgcolor: '#f9f9f9', borderRadius: 2 }}>
                <Typography variant="h6" color="text.primary" gutterBottom>
                  Unfortunately, you didn't get any correct answers this time.
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Don't worry! You can always try again to improve your score.
                </Typography>
              </Box>
              
              <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center', gap: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<HomeIcon />}
                  onClick={() => router.push('/')}
                >
                  Home
                </Button>
                <Button
                  variant="contained"
                  startIcon={<RefreshIcon />}
                  onClick={() => window.location.reload()}
                >
                  Refresh Results
                </Button>
              </Box>
            </Paper>
          </Container>
        )}
        
        {/* Main score display section when results are available */}
        {showResults && playerResults.length > 0 && (
          <Container maxWidth="md" sx={{ textAlign: 'center', py: 6 }}>
            {showConfetti && windowDimensions.width > 0 && (
              <ReactConfetti
                width={windowDimensions.width}
                height={windowDimensions.height}
                recycle={false}
                numberOfPieces={200}
                gravity={0.1}
                onConfettiComplete={() => setShowConfetti(false)}
              />
            )}
            
            <Paper sx={{ p: 4, mb: 4, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.9)' }}>
              <Box sx={{ mb: 4 }}>
                {playerResults[0]?.avatar && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                    <Box sx={{ width: 100, height: 100 }}>
                      <Animal
                        name={getAnimalAvatar(playerResults[0].avatar).name}
                        color={getAnimalAvatar(playerResults[0].avatar).color}
                        size="100%"
                      />
                    </Box>
                  </Box>
                )}
                <Typography variant="h4" color="primary" gutterBottom>
                  Game Complete!
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {gameTitle ? `You've completed ${gameTitle}` : "You've completed the quiz"}
                </Typography>
              </Box>
              
              {/* Score card */}
              <Card 
                sx={{ 
                  mb: 4, 
                  maxWidth: 500, 
                  mx: 'auto',
                  borderRadius: 3,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
                }}
              >
                <CardHeader
                  title="Your Score"
                  sx={{ 
                    bgcolor: 'primary.main', 
                    color: 'white',
                    textAlign: 'center',
                    pb: 1
                  }}
                />
                <CardContent sx={{ p: 4 }}>
                  <Typography 
                    variant="h2" 
                    color="primary" 
                    sx={{ 
                      fontWeight: 'bold', 
                      textAlign: 'center',
                      mb: 2
                    }}
                  >
                    {playerResults[0]?.score || 0}
                  </Typography>
                  
                  <Stack spacing={2} sx={{ mt: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body1" color="text.secondary">
                        Correct Answers:
                      </Typography>
                      <Typography variant="body1" fontWeight="bold">
                        {playerResults[0]?.correctAnswers || 0} / {playerResults[0]?.totalQuestions || 0}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body1" color="text.secondary">
                        Accuracy:
                      </Typography>
                      <Typography variant="body1" fontWeight="bold">
                        {playerResults[0]?.totalQuestions ? 
                          Math.round((playerResults[0]?.correctAnswers / playerResults[0]?.totalQuestions) * 100) : 0}%
                      </Typography>
                    </Box>
                    
                    {playerResults[0]?.timeBonus !== undefined && playerResults[0]?.timeBonus > 0 && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body1" color="text.secondary">
                          Time Bonus:
                        </Typography>
                        <Typography variant="body1" fontWeight="bold" color="success.main">
                          +{playerResults[0]?.timeBonus}
                        </Typography>
                      </Box>
                    )}
                    
                    {playerResults.length > 0 && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body1" color="text.secondary">
                          Avg. Answer Time:
                        </Typography>
                        <Typography variant="body1" fontWeight="bold">
                          {playerResults[0] && typeof playerResults[0].averageAnswerTime === 'number' 
                            ? playerResults[0].averageAnswerTime.toFixed(1) 
                            : '0.0'}s
                        </Typography>
                      </Box>
                    )}
                  </Stack>
                </CardContent>
              </Card>

              {/* Add Question Details - integrate with same styling */}
              <QuestionDetails />

              {/* Add Leaderboard */}
              {playerResults.length > 1 && (
                <Card 
                  sx={{ 
                    mb: 4, 
                    maxWidth: 500, 
                    mx: 'auto',
                    borderRadius: 3,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
                  }}
                >
                  <CardHeader
                    title="Leaderboard"
                    sx={{ 
                      bgcolor: 'primary.main', 
                      color: 'white',
                      textAlign: 'center',
                      pb: 1
                    }}
                  />
                  <CardContent sx={{ p: 0 }}>
                    <List sx={{ width: '100%', p: 0 }}>
                      {playerResults.map((player, index) => (
                        <ListItem
                          key={index}
                          sx={{
                            py: 2,
                            px: 3,
                            borderBottom: index < playerResults.length - 1 ? '1px solid rgba(0,0,0,0.12)' : 'none',
                            bgcolor: player.name === playerInfo?.name ? 'rgba(25, 118, 210, 0.08)' : 'transparent'
                          }}
                        >
                          <ListItemAvatar>
                            <Avatar
                              sx={{
                                width: 40,
                                height: 40,
                                bgcolor: index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? '#cd7f32' : 'grey.300'
                              }}
                            >
                              {index + 1}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Box sx={{ width: 30, height: 30, mr: 1 }}>
                                  {player.avatar && (
                                    <Animal
                                      name={getAnimalAvatar(player.avatar).name}
                                      color={getAnimalAvatar(player.avatar).color}
                                      size="100%"
                                    />
                                  )}
                                </Box>
                                <Typography variant="body1" fontWeight={player.name === playerInfo?.name ? 'bold' : 'normal'}>
                                  {player.name}
                                  {player.name === playerInfo?.name && ' (You)'}
                                </Typography>
                              </Box>
                            }
                            secondary={
                              <Typography variant="body2" color="text.secondary">
                                {player.correctAnswers || 0}/{player.totalQuestions || 0} correct
                              </Typography>
                            }
                          />
                          <Typography
                            variant="h6"
                            color={index === 0 ? 'primary' : 'text.primary'}
                            fontWeight={index === 0 ? 'bold' : 'medium'}
                          >
                            {player.score}
                          </Typography>
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              )}
              
              {/* Add Team Leaderboard for team mode */}
              {gameMode === 'team' && groupResults.length > 0 && (
                <Card 
                  sx={{ 
                    mt: 5, 
                    mb: 4, 
                    maxWidth: 500, 
                    mx: 'auto',
                    borderRadius: 3,
                    boxShadow: '0 12px 24px rgba(0,0,0,0.12)',
                    border: '1px solid rgba(0,0,0,0.05)',
                    overflow: 'hidden'
                  }}
                >
                  <Box sx={{ 
                    bgcolor: '#2e7d32',  // Using green as a differentiation from Question Details
                    backgroundImage: 'linear-gradient(135deg, #2e7d32 0%, #388e3c 100%)',
                    color: 'white', 
                    position: 'relative', 
                    overflow: 'hidden'
                  }}>
                    <CardHeader
                      title={
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <GroupsIcon sx={{ mr: 1 }} />
                          <Typography variant="h6" component="span">
                            Team Rankings
                          </Typography>
                        </Box>
                      }
                      sx={{ 
                        textAlign: 'center', 
                        pb: 1,
                        position: 'relative',
                        zIndex: 1
                      }}
                    />
                    
                    {/* Summary Stats */}
                    <Box sx={{ 
                      p: 2, 
                      display: 'flex', 
                      justifyContent: 'space-around',
                      position: 'relative',
                      zIndex: 1,
                      '&:before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '1px',
                        bgcolor: 'rgba(255,255,255,0.2)'
                      }
                    }}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="body2" color="rgba(255,255,255,0.8)" gutterBottom>
                          Teams
                        </Typography>
                        <Typography variant="h6" fontWeight="bold">
                          {groupResults.length}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="body2" color="rgba(255,255,255,0.8)" gutterBottom>
                          Top Score
                        </Typography>
                        <Typography variant="h6" fontWeight="bold">
                          {groupResults[0]?.score || 0}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="body2" color="rgba(255,255,255,0.8)" gutterBottom>
                          Your Team
                        </Typography>
                        <Typography variant="h6" fontWeight="bold">
                          #{groupResults.findIndex(g => g.name === (playerInfo?.team || "Your Team")) + 1 || '-'}
                        </Typography>
                      </Box>
                    </Box>
                    
                    {/* Background elements */}
                    <Box sx={{
                      position: 'absolute',
                      width: '150px',
                      height: '150px',
                      bgcolor: 'rgba(255,255,255,0.05)',
                      borderRadius: '50%',
                      top: '-75px',
                      right: '-75px'
                    }} />
                    <Box sx={{
                      position: 'absolute',
                      width: '100px',
                      height: '100px',
                      bgcolor: 'rgba(255,255,255,0.05)',
                      borderRadius: '50%',
                      bottom: '-50px',
                      left: '-50px'
                    }} />
                  </Box>
                  
                  <CardContent sx={{ p: 0, bgcolor: '#f9f9fc' }}>
                    <List disablePadding>
                      {groupResults.map((group, index) => {
                        const isYourTeam = group.name === (playerInfo?.team || "Your Team");
                        return (
                          <Box
                            key={index}
                            sx={{
                              position: 'relative',
                              '&:before': {
                                content: '""',
                                position: 'absolute',
                                left: 0,
                                top: 0,
                                bottom: 0,
                                width: 4,
                                bgcolor: isYourTeam ? 'success.main' : 'transparent',
                                transition: 'all 0.2s ease'
                              }
                            }}
                          >
                            <ListItem
                              sx={{
                                py: 2,
                                px: 3,
                                borderBottom: index < groupResults.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none',
                                bgcolor: isYourTeam ? 'rgba(46, 125, 50, 0.08)' : 'transparent',
                                transition: 'background-color 0.2s ease',
                                '&:hover': {
                                  bgcolor: isYourTeam ? 'rgba(46, 125, 50, 0.12)' : 'rgba(0,0,0,0.02)'
                                }
                              }}
                            >
                              <ListItemAvatar sx={{ minWidth: 50 }}>
                                <Avatar
                                  sx={{
                                    width: 36,
                                    height: 36,
                                    fontSize: '1.2rem',
                                    fontWeight: 'bold',
                                    bgcolor: index === 0 ? '#FFD700' : 
                                            index === 1 ? '#C0C0C0' : 
                                            index === 2 ? '#CD7F32' : 
                                            'grey.300',
                                    color: index < 3 ? 'rgba(0,0,0,0.8)' : 'white',
                                    boxShadow: index < 3 ? '0 2px 8px rgba(0,0,0,0.15)' : 'none'
                                  }}
                                >
                                  {index + 1}
                                </Avatar>
                              </ListItemAvatar>
                              
                              <ListItemText
                                primary={
                                  <Typography 
                                    variant="body1" 
                                    fontWeight={isYourTeam ? 'bold' : 'medium'}
                                    component="div"
                                    sx={{ 
                                      display: 'flex',
                                      alignItems: 'center',
                                      color: isYourTeam ? 'success.dark' : 'text.primary'
                                    }}
                                  >
                                    {group.name}
                                    {isYourTeam && (
                                      <Chip 
                                        label="Your Team" 
                                        size="small" 
                                        color="success" 
                                        sx={{ ml: 1, height: 20 }}
                                      />
                                    )}
                                  </Typography>
                                }
                                secondary={
                                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                                    <GroupsIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                                    <Typography 
                                      variant="body2" 
                                      color="text.secondary"
                                      component="span"
                                    >
                                      {group.memberCount} member{group.memberCount !== 1 ? 's' : ''}
                                    </Typography>
                                  </Box>
                                }
                              />
                              
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Paper
                                  elevation={0}
                                  sx={{
                                    px: 2,
                                    py: 0.75,
                                    borderRadius: 2, 
                                    bgcolor: index === 0 ? 'rgba(255, 215, 0, 0.1)' : 
                                             index === 1 ? 'rgba(192, 192, 192, 0.1)' : 
                                             index === 2 ? 'rgba(205, 127, 50, 0.1)' : 
                                             'rgba(0, 0, 0, 0.03)',
                                    border: index === 0 ? '1px solid rgba(255, 215, 0, 0.3)' : 
                                            index === 1 ? '1px solid rgba(192, 192, 192, 0.3)' : 
                                            index === 2 ? '1px solid rgba(205, 127, 50, 0.3)' : 
                                            '1px solid rgba(0, 0, 0, 0.06)'
                                  }}
                                >
                                  <Typography
                                    variant="h6"
                                    color={index === 0 ? '#9e6c00' : 
                                           index === 1 ? '#5c5c5c' : 
                                           index === 2 ? '#8b4513' : 
                                           'text.primary'}
                                    fontWeight="bold"
                                    sx={{ 
                                      display: 'flex', 
                                      alignItems: 'center',
                                      fontSize: '1.125rem'
                                    }}
                                  >
                                    {index === 0 && <TrophyIcon sx={{ mr: 0.5, fontSize: 18, color: '#FFD700' }} />}
                                    {group.score}
                                  </Typography>
                                </Paper>
                              </Box>
                            </ListItem>
                          </Box>
                        );
                      })}
                    </List>
                  </CardContent>
                </Card>
              )}
              
              <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center', gap: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<HomeIcon />}
                  onClick={() => router.push('/')}
                >
                  Home
                </Button>
                {!isHost && playerInfo?.playerId && quizIdParam && (
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={() => {
                      // Create a URL to view more detailed results with explicit parameters
                      const detailsUrl = `/game-results?quizId=${quizIdParam}&playerId=${playerInfo.playerId}`;
                      router.push(detailsUrl);
                    }}
                  >
                    View Details
                  </Button>
                )}
                <Button
                  variant="contained"
                  startIcon={<RefreshIcon />}
                  onClick={() => window.location.reload()}
                >
                  Refresh Results
                </Button>
              </Box>
            </Paper>
          </Container>
        )}
      </Box>
      
      {/* Add the score message snackbar */}
      <Snackbar 
        open={scoreMessage.show} 
        autoHideDuration={6000} 
        onClose={handleCloseMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseMessage} 
          severity={scoreMessage.severity} 
          sx={{ width: '100%' }}
        >
          {scoreMessage.message}
        </Alert>
      </Snackbar>
    </>
  );
}