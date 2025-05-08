import axios, { AxiosError } from 'axios';

const API_BASE_URL = 'https://kahootclone-f7hkd0hwafgbfrfa.southeastasia-01.azurewebsites.net';

interface PlayerData {
  playerId: number;
  nickname: string;
  playerCode?: number;
  avatarUrl: string;
  score: number;
  sessionId?: number;  // Make this optional
  quizId?: number;     // Add quizId field
  userId?: number;
  id?: number; // Keep as optional for backward compatibility
  teamName?: string | null;
  groupName?: string | null;
  team?: string | null;
}

interface PlayerResponse {
  status: number;
  message: string;
  data: any; // This can be a Player object or null
}

// Add interfaces for the score calculation request bodies
interface SoloScoreRequest {
  playerAnswer: {
    id: number;
    playerId: number;
    questionId: number;
    answeredAt: string;
    isCorrect: boolean;
    responseTime: number;
    answer: string;
  };
  question: {
    id: number;
    quizId: number;
    text: string;
    type: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    isCorrect: string;
    score: number;
    flag: boolean;
    timeLimit: number;
    arrange: number;
  };
}

interface GroupMember {
  groupId: number;
  playerId: number;
  rank: number;
  totalScore: number;
  joinedAt: string;
  status: string;
}

interface PlayerAnswer {
  id: number;
  playerId: number;
  questionId: number;
  answeredAt: string;
  isCorrect: boolean;
  responseTime: number;
  answer: string;
}

interface Question {
  id: number;
  quizId: number;
  text: string;
  type: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  isCorrect: string;
  score: number;
  flag: boolean;
  timeLimit: number;
  arrange: number;
}

interface GroupScoreRequest {
  groupMembers: GroupMember[];
  playerAnswers: PlayerAnswer[];
  questions: Question[];
}

const playerService = {
  /**
   * Create a new player
   * @param playerData Player data to be created
   * @returns Promise with player creation response
   */
  createPlayer: async (playerData: PlayerData): Promise<PlayerResponse> => {
    try {
      // Validate required fields
      if (!playerData.nickname || !playerData.avatarUrl) {
        console.error('Missing required fields for player creation');
        return {
          status: 400,
          message: 'Missing required player data (nickname or avatarUrl)',
          data: null
        };
      }
      
      // Format the request body according to the API's expected format
      const apiPlayerData = {
        playerId: 0,
        nickname: playerData.nickname,
        avatarUrl: playerData.avatarUrl,
        score: playerData.score || 0,
        quizId: playerData.quizId || playerData.sessionId || 0  // Use quizId or sessionId, defaulting to 0
      };
      
      console.log("Creating player with API data:", apiPlayerData);
      console.log(`Calling API endpoint: ${API_BASE_URL}/api/Player`);
      
      // Call the player creation API
      const response = await axios.post(
        `${API_BASE_URL}/api/Player`, 
        apiPlayerData,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log("Raw API response:", response);
      
      // Handle response based on its structure
      if (response.data) {
        console.log("Player API response data:", response.data);
        
        // Check for different response formats
        if (response.data.data) {
          // Standard format with data property
          console.log("Response has data.data structure");
          
          // Transform id to playerId in response data if needed
          if (response.data.data.id && !response.data.data.playerId) {
            response.data.data.playerId = response.data.data.id;
            console.log(`Added playerId (${response.data.data.playerId}) based on id field`);
          }
          
          return response.data;
        } else if (response.data.id || response.data.playerId) {
          // The response.data is directly the player object
          console.log("Response.data is directly the player object:", response.data);
          
          // If the data has id but no playerId, add it
          if (response.data.id && !response.data.playerId) {
            response.data.playerId = response.data.id;
            console.log(`Added playerId (${response.data.playerId}) based on id field`);
          }
          
          // Wrap in the expected format
          return {
            status: response.status,
            message: "Player created successfully",
            data: response.data
          };
        } else if (typeof response.data === 'number') {
          // Some APIs return just the ID as a number
          console.log(`Response data is a number: ${response.data} - assuming this is the player ID`);
          return {
            status: response.status,
            message: "Player created successfully",
            data: {
              playerId: response.data,
              id: response.data,
              nickname: playerData.nickname,
              avatarUrl: playerData.avatarUrl,
              score: playerData.score || 0
            }
          };
        } else {
          // Unexpected format, but we still have response.data
          console.log("Unexpected response format:", response.data);
          
          // Try to extract playerId/id from any properties available
          let extractedId = null;
          if (typeof response.data === 'object') {
            // Recursively search for id or playerId in the response object
            const findId = (obj: any): number | null => {
              if (!obj || typeof obj !== 'object') return null;
              
              if (obj.playerId) return obj.playerId;
              if (obj.id) return obj.id;
              
              for (const key in obj) {
                if (obj[key] && typeof obj[key] === 'object') {
                  const found = findId(obj[key]);
                  if (found) return found;
                }
              }
              
              return null;
            };
            
            extractedId = findId(response.data);
            if (extractedId) {
              console.log(`Found ID (${extractedId}) in response data`);
              
              // Return with the extracted ID
          return {
            status: response.status,
                message: "Player created successfully with extracted ID",
                data: {
                  playerId: extractedId,
                  id: extractedId,
                  nickname: playerData.nickname,
                  avatarUrl: playerData.avatarUrl,
                  score: playerData.score || 0
                }
              };
            }
          }
          
          // If we can't extract an ID, return a generic success response
          return {
            status: response.status,
            message: "Player created with unknown ID",
            data: {
              playerId: 0,
              id: 0,
              nickname: playerData.nickname,
              avatarUrl: playerData.avatarUrl,
              score: playerData.score || 0
            }
          };
        }
      } else {
        // No data in response
        console.error("No data in API response");
        
        return {
          status: response.status,
          message: "No data in response",
          data: null
        };
      }
    } catch (error: any) {
      console.error('Error creating player:', error);
      
      // Log more detailed error information
      if (error.response) {
        console.error('API error response:', {
          status: error.response.status,
          data: error.response.data
        });
      }
      
      // Return a structured error response instead of throwing
      return {
        status: error.response?.status || 500,
        message: `Error creating player: ${error.message}`,
        data: null
      };
    }
  },

  /**
   * Get a player by ID
   * @param playerId ID of the player to fetch
   * @returns Promise with player data
   */
  getPlayerById: async (playerId: number): Promise<PlayerResponse> => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/Player/${playerId}`
      );
      
      return response.data;
    } catch (error) {
      console.error(`Error fetching player with ID ${playerId}:`, error);
      throw error;
    }
  },

  /**
   * Get all players in a session
   * @param sessionId ID of the game session
   * @returns Promise with all players in the session
   */
  getPlayersBySessionId: async (sessionId: number): Promise<PlayerResponse> => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/Player/session/${sessionId}`
      );
      
      return response.data;
    } catch (error) {
      console.error(`Error fetching players for session ID ${sessionId}:`, error);
      throw error;
    }
  },

  /**
   * Update player score
   * @param playerId ID of the player to update
   * @param score New score to set
   * @returns Promise with updated player data
   */
  updatePlayerScore: async (playerId: number, score: number): Promise<PlayerResponse> => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/api/Player/${playerId}/score/${score}`
      );
      
      return response.data;
    } catch (error) {
      console.error(`Error updating score for player ID ${playerId}:`, error);
      throw error;
    }
  },

  /**
   * Format an avatar URL to a string representation that doesn't rely on react-animals
   * @param animalName Name of the animal (e.g., 'cat', 'dog')
   * @param animalColor Color of the animal (e.g., '#FF3355', 'blue')
   * @returns String representation of avatar for storage
   */
  formatAnimalAvatar: (animalName: string, animalColor: string): string => {
    return `simple://${animalName}/${animalColor}`;
  },

  /**
   * Parse a string representation of avatar back to object
   * @param avatarUrl String representation of avatar
   * @returns Object with name and color properties
   */
  parseAnimalAvatar: (avatarUrl: string): {name: string, color: string} => {
    // Default values if parsing fails
    const defaultAvatar = { name: 'dog', color: 'red' };
    
    if (!avatarUrl) {
      return defaultAvatar;
    }
    
    try {
      // Handle both the old animal:// format and new simple:// format
      if (avatarUrl.startsWith('animal://')) {
        const parts = avatarUrl.replace('animal://', '').split('/');
        if (parts.length === 2) {
          return { name: parts[0], color: parts[1] };
        }
      } else if (avatarUrl.startsWith('simple://')) {
        const parts = avatarUrl.replace('simple://', '').split('/');
        if (parts.length === 2) {
          return { name: parts[0], color: parts[1] };
        }
      } else {
        // If just a plain animal name is provided, use that with a default color
        return { name: avatarUrl, color: 'blue' };
      }
    } catch (error) {
      console.error('Error parsing avatar:', error);
    }
    
    return defaultAvatar;
  },

  /**
   * Format player data for API
   * @param nickname Player's nickname
   * @param sessionId ID of the game session
   * @param animalName Name of the animal avatar
   * @param animalColor Color of the animal avatar
   * @param userId Optional user ID if player is logged in
   * @param teamName Optional team name for team mode
   * @returns Formatted player data for API
   */
  formatPlayerData: (
    nickname: string,
    sessionId: number,
    animalName: string = 'alligator',
    animalColor: string = 'orange',
    userId: number = 0,
    teamName: string | null = null
  ): PlayerData & { teamName?: string, groupName?: string, team?: string } => {
    // Use a more stable approach for playerCode
    // Instead of Math.random(), use a hash of the nickname + sessionId
    const hashCode = (str: string): number => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0; // Convert to 32bit integer
      }
      return Math.abs(hash) % 900000 + 100000; // Keep it within 100000-999999 range
    };
    
    const playerCode = hashCode(`${nickname}-${sessionId}-${Date.now()}`);
    
    // Create the base player data - match the expected API format
    const playerData: PlayerData & { teamName?: string, groupName?: string, team?: string } = {
      playerId: 0, // The server will assign an ID
      nickname: nickname,
      playerCode: playerCode,
      avatarUrl: playerService.formatAnimalAvatar(animalName, animalColor),
      score: 0, // Initial score is 0
      sessionId: sessionId,
      userId: userId // Make this optional
    };
    
    // Add team information if provided
    if (teamName) {
      // Add team information using multiple field names for compatibility
      playerData.teamName = teamName;
      playerData.groupName = teamName;
      playerData.team = teamName;
    }
    
    return playerData;
  },

  /**
   * Get or create a valid player ID for the current session
   * This ensures we're using an ID that the API recognizes
   * @param nickname Player nickname
   * @param sessionId Game session ID
   * @returns Promise with a valid player ID
   */
  getValidPlayerId: async (nickname: string, sessionId: number): Promise<number> => {
    try {
      // First check if we already have a stored player ID
      const playerInfoStr = sessionStorage.getItem('currentPlayer');
      let playerId: number | null = null;
      
      if (playerInfoStr) {
        try {
          const playerInfo = JSON.parse(playerInfoStr);
          if (playerInfo && playerInfo.playerId) {
            playerId = parseInt(String(playerInfo.playerId));
            console.log(`Found existing player ID: ${playerId}`);
          }
        } catch (e) {
          console.error('Error parsing player info:', e);
        }
      }
      
      // If we have a player ID and it's a reasonable number, use it
      if (playerId && !isNaN(playerId) && playerId > 0 && playerId < 2147483647) {
        console.log(`Using existing valid player ID: ${playerId}`);
        return playerId;
      }
      
      // Otherwise, try to get players for this session to find a match
      try {
        console.log(`Fetching players for session ${sessionId}`);
        const sessionPlayers = await playerService.getPlayersBySessionId(sessionId);
        
        if (sessionPlayers && sessionPlayers.data && Array.isArray(sessionPlayers.data)) {
          // Look for a player with matching nickname
          const existingPlayer = sessionPlayers.data.find(p => p.nickname === nickname);
          
          if (existingPlayer && existingPlayer.playerId) {
            // Found a matching player, use their ID
            playerId = parseInt(String(existingPlayer.playerId));
            console.log(`Found matching player ID from session: ${playerId}`);
            
            // Update stored player info
            if (playerInfoStr) {
              const updatedInfo = JSON.parse(playerInfoStr);
              updatedInfo.playerId = playerId;
              sessionStorage.setItem('currentPlayer', JSON.stringify(updatedInfo));
              localStorage.setItem('currentPlayer', JSON.stringify(updatedInfo));
            }
            
            return playerId;
          }
        }
      } catch (e) {
        console.error('Error fetching session players:', e);
      }
      
      // If we can't find a valid ID, create a new player
      console.log(`Creating new player for nickname: ${nickname}, session: ${sessionId}`);
      const playerData = playerService.formatPlayerData(
        nickname,
        sessionId,
        'alligator', // Default animal
        'green', // Default color
        0, // No user ID
        null // No team
      );
      
      // Create player in the API
      const response = await playerService.createPlayer(playerData);
      
      if (response && response.data && response.data.data && response.data.data.playerId) {
        playerId = parseInt(String(response.data.data.playerId));
        console.log(`Created new player with ID: ${playerId}`);
        
        // Update stored player info
        if (playerInfoStr) {
          const updatedInfo = JSON.parse(playerInfoStr);
          updatedInfo.playerId = playerId;
          sessionStorage.setItem('currentPlayer', JSON.stringify(updatedInfo));
          localStorage.setItem('currentPlayer', JSON.stringify(updatedInfo));
        }
        
        return playerId;
      }
      
      // If all else fails, return a small random ID (not ideal but better than Date.now())
      const fallbackId = Math.floor(Math.random() * 10000) + 1;
      console.warn(`Failed to get or create valid player ID, using fallback: ${fallbackId}`);
      return fallbackId;
    } catch (error) {
      console.error('Error getting valid player ID:', error);
      // Return a small random ID as fallback
      return Math.floor(Math.random() * 10000) + 1;
    }
  },

  /**
   * Submit a player's answer to a question
   * @param playerId ID of the player
   * @param questionId ID of the question
   * @param isCorrect Whether the answer is correct
   * @param responseTime Time taken to answer in seconds
   * @param answer The answer value (e.g., 'A', 'B', 'C', 'D', or 'T' for timeout)
   * @returns Promise with answer submission response
   */
  submitAnswer: async (
    playerId: number,
    questionId: number,
    isCorrect: boolean,
    responseTime: number,
    answer: string
  ): Promise<PlayerResponse> => {
    try {
      // Get player information from storage to double-check
      const playerInfoStr = sessionStorage.getItem('currentPlayer');
      
      // CRITICAL: Make sure playerId is a valid positive number
      const numericPlayerId = Number(playerId);
      
      // Special validation for playerId
      if (isNaN(numericPlayerId) || numericPlayerId <= 0) {
        console.error(`Invalid playerId: ${playerId} (${numericPlayerId}). Must be a positive number.`);
        throw new Error(`Invalid playerId: ${playerId}. Must be a positive number.`);
      }
      
      // Log player info from session storage
      if (playerInfoStr) {
        try {
          const playerInfo = JSON.parse(playerInfoStr);
          console.log(`Player from storage: 
          - ID in storage: ${playerInfo.id}
          - PlayerId in storage: ${playerInfo.playerId}
          - Using for submission: ${numericPlayerId}`);
        } catch (e) {
          console.error('Error parsing player info from storage:', e);
        }
      }
      
      // CRITICAL: Make sure responseTime is an integer
      const intResponseTime = Math.round(responseTime);
      
      console.log(`Submitting answer with numericPlayerId: ${numericPlayerId} and questionId: ${questionId}`);
      
      // Handle timeout answer with special 'T' value
      const finalAnswer = answer === '' || answer === null ? 'T' : answer;
      
      // Use the correct endpoint with proper data structure
      const response = await axios.post(
        `${API_BASE_URL}/api/PlayerAnswer`,
        {
          playerId: numericPlayerId,
          questionId: questionId,
          answeredAt: new Date().toISOString(),
          isCorrect: isCorrect,
          responseTime: intResponseTime,
          answer: finalAnswer
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );
      
      console.log('Answer submitted successfully');
      return response.data;
    } catch (error: any) {
      console.error('Error submitting player answer:', error);
      
      // Store answer locally as fallback
      try {
        const storedAnswers = localStorage.getItem('playerAnswers') || '[]';
        const answers = JSON.parse(storedAnswers);
        answers.push({
          playerId: playerId,
          questionId: questionId,
          answeredAt: new Date().toISOString(),
          isCorrect: isCorrect,
          responseTime: responseTime,
          answer: answer,
          score: isCorrect ? 100 : 0 // Default score
        });
        localStorage.setItem('playerAnswers', JSON.stringify(answers));
        sessionStorage.setItem('playerAnswers', JSON.stringify(answers));
        console.log('📝 Stored answer locally for fallback');
      } catch (storageError) {
        console.error('Failed to store locally:', storageError);
      }
      
      // Return a structured error response instead of throwing
      return {
        status: error.response?.status || 500,
        message: `Error submitting player answer: ${error.message}`,
        data: null
      };
    }
  },
  
  /**
   * Handle timeout or no answer from player
   * @param playerId ID of the player
   * @param questionId ID of the question
   * @param timeLimit The time limit of the question
   * @returns Promise with answer submission response
   */
  submitTimeoutAnswer: async (
    playerId: number,
    questionId: number,
    timeLimit: number
  ): Promise<PlayerResponse> => {
    try {
      // For timeouts, we know the answer is incorrect
      const isCorrect = false;
      
      // Use the full time limit as response time since player didn't answer
      const responseTime = timeLimit; 
      
      // 'T' represents a timeout/no answer
      // Pass the IDs exactly as is without any conversion
      return await playerService.submitAnswer(
        playerId,
        questionId,
        isCorrect,
        responseTime,
        'T'
      );
    } catch (error) {
      console.error('Error submitting timeout answer:', error);
      throw error;
    }
  },

  /**
   * @param playerData Player data to be created
   * @returns Promise with player creation/retrieval response
   */
  getOrCreatePlayer: async (playerData: PlayerData): Promise<PlayerResponse> => {
    try {
      const sessionPlayers = await playerService.getPlayersBySessionId(playerData.sessionId ?? 0)
        .catch(() => ({ data: [] }));
      
      // If we have players and data is an array
      if (sessionPlayers && Array.isArray(sessionPlayers.data)) {
        // Look for a matching player by nickname
        const existingPlayer = sessionPlayers.data.find(
          (p) => p.nickname === playerData.nickname
        );
        
        if (existingPlayer) {
          console.log("Found existing player:", existingPlayer);
          return {
            status: 200,
            message: "Retrieved existing player",
            data: existingPlayer
          };
        }
      }
      
      return await playerService.createPlayer(playerData);
    } catch (error) {
      console.error('Error in getOrCreatePlayer:', error);
      throw error;
    }
  },

  /**
   * Calculate a score for a solo player's answer
   * @param playerAnswer Player's answer to a question
   * @param question Question data
   * @returns Promise with calculated score
   */
  calculateSoloScore: async (playerAnswer: any, question: any): Promise<number> => {
    try {
      console.log('Calculating solo score for answer:', {
        answer: playerAnswer,
        question: question
      });
      
      // Default score calculation if server call fails
      let calculatedScore = 0;
      
      // Calculate score locally based on server logic
      if (playerAnswer.isCorrect) {
        calculatedScore = question.score || 100;
        
        // Calculate time bonus
        if (question.timeLimit) {
          const timeRatio = Math.min(playerAnswer.responseTime / question.timeLimit, 1);
          const timeMultiplier = 1 - (timeRatio * 0.5); // From 1.0 down to 0.5 based on time
          calculatedScore = Math.round(calculatedScore * timeMultiplier);
        }
      }
      
      // Assign score to the answer
      playerAnswer.score = calculatedScore;
      
      return calculatedScore;
    } catch (error) {
      console.error('Error in calculateSoloScore:', error);
      return 0;
    }
  },
  
  /**
   * Calculate scores for a team based on all members' answers
   * @param groupMembers Group members in the team
   * @param playerAnswers All player answers
   * @param questions Questions that were answered
   * @returns Promise with calculated team scores
   */
  calculateGroupScore: async (
    groupMembers: any[],
    playerAnswers: any[],
    questions: any[]
  ): Promise<any> => {
    try {
      console.log('Calculating group score for team:', {
        members: groupMembers,
        answers: playerAnswers,
        questions: questions
      });
      
      // Initialize the dictionary to store each player's score
      const playerScores: {[key: number]: number} = {};
      let totalGroupScore = 0;
      
      // Populate playerScores with initial scores of 0 for each member
      groupMembers.forEach(member => {
        playerScores[member.playerId] = 0;
      });
      
      // Calculate scores for each player and answer
      playerAnswers.forEach(answer => {
        // Find corresponding question
        const question = questions.find(q => q.id === answer.questionId);
        
        if (question && answer.playerId && playerScores[answer.playerId] !== undefined) {
          // Calculate score for this answer using a local calculation to avoid Promise issues
          let answerScore = 0;
          
          // Perform the same calculation logic as in calculateSoloScore
          if (answer.isCorrect) {
            answerScore = question.score || 100;
            
            // Calculate time bonus
            if (question.timeLimit) {
              const timeRatio = Math.min(answer.responseTime / question.timeLimit, 1);
              const timeMultiplier = 1 - (timeRatio * 0.5); // From 1.0 down to 0.5 based on time
              answerScore = Math.round(answerScore * timeMultiplier);
            }
          }
          
          // Assign score to the answer
          answer.score = answerScore;
          
          // Update player's score
          playerScores[answer.playerId] += answerScore;
          totalGroupScore += answerScore;
        }
      });
      
      return {
        playerScores,
        totalGroupScore
      };
    } catch (error) {
      console.error('Error in calculateGroupScore:', error);
      return {
        playerScores: {},
        totalGroupScore: 0
      };
    }
  },
  
  /**
   * Get player results for a specific quiz
   * @param quizId Quiz ID
   * @param playerId Player ID
   * @returns Promise with player results
   */
  getPlayerResults: async (quizId: number, playerId: number): Promise<any> => {
    try {
      console.log(`Attempting to fetch player ${playerId} results for quiz ${quizId}`);
      
      // Try the primary endpoint first
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/Quiz/ResultQuiz/${quizId}`,
          {
            headers: {
              'Accept': 'application/json'
            }
          }
        );
        
        console.log('Quiz results API response:', response.data);
        
        if (response.data && response.data.status === 200) {
          // Find the specific player's results in the response
          const allResults = response.data.data;
          if (allResults && allResults.players) {
            const playerResult = allResults.players.find((p: any) => 
              p.playerId === playerId || p.id === playerId
            );
            if (playerResult) {
              return playerResult;
            }
          }
        }
      } catch (error: any) {
        console.warn(`Primary endpoint failed (${error.response?.status}):`, error.message);
      }
      
      // If no API endpoint works, try to build the results from player answers
      console.log('Attempting to build player results from answers');
      
      // Get the player's answers for this quiz
      try {
        const answersResponse = await axios.get(
          `${API_BASE_URL}/api/PlayerAnswer/PlayerAnswers/${playerId}/${quizId}`,
          {
            headers: {
              'Accept': 'application/json'
            }
          }
        );
        
        if (answersResponse.data && answersResponse.data.data) {
          const answers = answersResponse.data.data;
          console.log(`Retrieved ${answers.length} answers for player`);
          
          // Get the player's information
          const playerResponse = await axios.get(
            `${API_BASE_URL}/api/Player/${playerId}`,
            {
              headers: {
                'Accept': 'application/json'
              }
            }
          );
          
          const playerInfo = playerResponse.data?.data || {};
          
          // Calculate key metrics
          const correctAnswers = answers.filter((a: any) => a.isCorrect).length;
          const totalScore = answers.reduce((sum: number, a: any) => sum + (a.score || 0), 0);
          
          // Build a synthesized result object
          return {
            playerId: playerId,
            quizId: quizId,
            nickname: playerInfo.nickname || 'Player',
            avatarUrl: playerInfo.avatarUrl || 'alligator',
            score: totalScore,
            correctAnswers: correctAnswers,
            totalQuestions: answers.length,
            answers: answers
          };
        }
      } catch (answersError) {
        console.warn('Failed to get player answers:', answersError);
      }
      
      // As a last resort, use local storage data
      console.log('Falling back to localStorage data for player results');
      const storedAnswers = localStorage.getItem('playerAnswers');
      
      if (storedAnswers) {
        try {
          const answers = JSON.parse(storedAnswers);
          const filteredAnswers = answers.filter((a: any) => 
            a.playerId === playerId && (!a.quizId || a.quizId === quizId)
          );
          
          if (filteredAnswers.length > 0) {
            const correctCount = filteredAnswers.filter((a: any) => a.isCorrect).length;
            const totalScore = filteredAnswers.reduce((sum: number, a: any) => sum + (a.score || 0), 0);
            
            return {
              playerId: playerId,
              quizId: quizId,
              score: totalScore,
              correctAnswers: correctCount,
              totalQuestions: filteredAnswers.length,
              answers: filteredAnswers
            };
          }
        } catch (parseError) {
          console.error('Error parsing stored answers:', parseError);
        }
      }
      
      // If all else fails, return null
      console.warn('All attempts to get player results failed');
      return null;
    } catch (error) {
      console.error('Error in getPlayerResults:', error);
      return null;
    }
  },
  
  /**
   * Fetch aggregate quiz results (all players)
   * @param quizId Quiz ID
   * @returns Promise with quiz results
   */
  getQuizResults: async (quizId: number): Promise<any> => {
    try {
      console.log(`Fetching aggregate quiz results for quiz ID ${quizId}`);
      
      const response = await axios.get(
        `${API_BASE_URL}/api/Quiz/ResultQuiz/${quizId}`,
        {
          headers: {
            'Accept': 'application/json'
          }
        }
      );
      
      if (response.data && response.data.status === 200) {
        return response.data.data;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching quiz results:', error);
      return null;
    }
  },

  /**
   * Get player score with team information included
   * @param playerId ID of the player
   * @param quizId ID of the quiz
   * @returns Promise with player score information
   */
  getPlayerScoreWithTeam: async (playerId: number, quizId?: number): Promise<any> => {
    try {
      console.log(`Getting score for player ${playerId} with team info...`);
      
      const API_BASE_URL = 'https://kahootclone-f7hkd0hwafgbfrfa.southeastasia-01.azurewebsites.net';
      
      const response = await axios.get(
        `${API_BASE_URL}/api/Player/${playerId}/score${quizId ? `?quizId=${quizId}` : ''}`,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log(`Player score response:`, response.data);
      
      // Process response to include team info if available
      const scoreData = response.data;
      
      // If we're in team mode, try to get team information
      try {
        const playerResponse = await axios.get(
          `${API_BASE_URL}/api/Player/${playerId}`,
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
        
        // Extract team info from player data if available
        if (playerResponse.data && 
            (playerResponse.data.groupName || 
             playerResponse.data.GroupName || 
             playerResponse.data.teamName || 
             playerResponse.data.team)) {
               
          const teamName = playerResponse.data.groupName || 
                          playerResponse.data.GroupName || 
                          playerResponse.data.teamName || 
                          playerResponse.data.team;
                          
          console.log(`Found team info for player: ${teamName}`);
          
          // Add team info to score data
          return {
            ...scoreData,
            teamName: teamName,
            isTeamMode: true
          };
        }
      } catch (error) {
        console.warn('Error fetching team info:', error);
        // Continue with regular score data
      }
      
      return scoreData;
    } catch (error: any) {
      console.error('Error getting player score with team:', error);
      
      // Return error object
      return {
        status: error.response?.status || 500,
        message: `Error getting player score: ${error.message}`,
        data: null
      };
    }
  },
  
  /**
   * Get all player scores for a quiz (for host view)
   * @param quizId ID of the quiz
   * @returns Promise with all player scores
   */
  getAllPlayerScores: async (quizId: number): Promise<any> => {
    try {
      console.log(`Getting all scores for quiz ${quizId}...`);
      
      const API_BASE_URL = 'https://kahootclone-f7hkd0hwafgbfrfa.southeastasia-01.azurewebsites.net';
      
      // Get quiz first to check if it's team mode
      const quizResponse = await axios.get(
        `${API_BASE_URL}/api/Quiz/${quizId}`,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      const isTeamMode = quizResponse.data?.gameMode?.toString().toLowerCase() === 'team';
      console.log(`Quiz ${quizId} is in ${isTeamMode ? 'team' : 'solo'} mode`);
      
      // Use different endpoint depending on mode
      const endpoint = isTeamMode 
        ? `${API_BASE_URL}/api/Quiz/Result/${quizId}` 
        : `${API_BASE_URL}/api/Quiz/JoinedPlayers/${quizId}`;
      
      const response = await axios.get(
        endpoint,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log(`Scores response:`, response.data);
      
      return {
        ...response.data,
        isTeamMode: isTeamMode
      };
    } catch (error: any) {
      console.error('Error getting all player scores:', error);
      
      // Return error object
      return {
        status: error.response?.status || 500,
        message: `Error getting all player scores: ${error.message}`,
        data: null
      };
    }
  },

  /**
   * Submit player answer for team mode - handles entity tracking issues
   * @param playerId Player ID
   * @param questionId Question ID
   * @param answer Player's answer
   * @param isCorrect Whether the answer is correct
   * @param responseTime Response time in milliseconds
   * @param teamName Team name if in team mode
   * @returns Promise with response data
   */
  submitTeamModeAnswer: async (
    playerId: number, 
    questionId: number, 
    answer: string, 
    isCorrect: boolean, 
    responseTime: number, 
    teamName?: string
  ): Promise<any> => {
    try {
      console.log(`Submitting answer for player ${playerId} to question ${questionId} in team mode`);
      
      const API_BASE_URL = 'https://kahootclone-f7hkd0hwafgbfrfa.southeastasia-01.azurewebsites.net';
      
      // Generate a truly unique ID for this answer to prevent duplicates
      const timestamp = Date.now();
      const randomSuffix = Math.floor(Math.random() * 10000);
      const uniqueId = `team_${playerId}_${questionId}_${timestamp}_${randomSuffix}`;
      
      // APPROACH 1: Try URL parameters to avoid sending unnecessary data in body
      try {
        console.log("Submitting team answer with URL parameters");
        
        // Build URL parameters
        const params = new URLSearchParams({
          playerId: playerId.toString(),
          questionId: questionId.toString(),
          answer: answer,
          isCorrect: isCorrect.toString(),
          responseTime: responseTime.toString(),
          teamName: teamName || '',
          uniqueId: uniqueId
        }).toString();
        
      const response = await axios.post(
          `${API_BASE_URL}/api/Player/answer/team?${params}`,
          // Empty body to avoid entity tracking issues
          {},
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
            }
          }
        );
        
        console.log('Team answer submitted successfully via URL parameters');
        return response.data;
      } catch (error1: any) {
        console.warn('URL parameters approach failed:', error1.message);
        
        // APPROACH 2: Try alternative team-specific endpoint with a different format 
        try {
          // Add a small delay
          await new Promise(resolve => setTimeout(resolve, 300));
          
          // Use a different endpoint with minimal data
          const response = await axios.post(
            `${API_BASE_URL}/api/Player/${playerId}/team-answer/${questionId}`,
            {
              answer: answer,
              isCorrect: isCorrect,
              responseTime: responseTime,
              teamName: teamName,
              uniqueId: `${uniqueId}_alt`
            },
            {
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              }
            }
          );
          
          console.log('Team answer submitted via player-specific endpoint');
      return response.data;
        } catch (error2: any) {
          console.warn('Player-specific endpoint failed:', error2.message);
          
          // APPROACH 3: Fall back to regular answer endpoint with team info included
          try {
            // Add a longer delay
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Try the same approach as regular submitAnswer but include team info
            const response = await axios.post(
              `${API_BASE_URL}/api/Quiz/submit-answer`,
              {
                answer: {
                  playerId: playerId,
                  questionId: questionId,
                  answer: answer,
                  isCorrect: isCorrect,
                  responseTime: responseTime,
                  answeredAt: new Date().toISOString(),
                  teamName: teamName,
                  uniqueId: `${uniqueId}_final`
                }
              },
              {
                headers: {
                  'Content-Type': 'application/json',
                  'Accept': 'application/json'
                }
              }
            );
            
            console.log('Team answer submitted via general answer endpoint');
            return response.data;
          } catch (error3: any) {
            console.error('All team answer methods failed:', error3.message);
            
            // APPROACH 4: NEW - Try the direct PlayerAnswer endpoint with team info but NO ID field
            try {
              console.log("Trying direct PlayerAnswer endpoint for team answer without ID field");
              await new Promise(resolve => setTimeout(resolve, 700));
              
              // Create a request body for PlayerAnswer without the ID field
              const teamAnswerData = {
                // id: 0, - EXPLICITLY OMIT this field to avoid entity tracking conflicts
                playerId: playerId,
                questionId: questionId,
                answeredAt: new Date().toISOString(),
                isCorrect: isCorrect,
                responseTime: responseTime,
                answer: answer,
                teamName: teamName // Add team info
              };
              
              console.log("Submitting team answer with direct API structure:", teamAnswerData);
              
              const response = await axios.post(
                `${API_BASE_URL}/api/PlayerAnswer`,
                teamAnswerData,
                {
                  headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                  }
                }
              );
              
              console.log('Team answer submitted directly to PlayerAnswer endpoint');
              return response.data;
            } catch (error4: any) {
              console.error('All team answer endpoints failed including direct PlayerAnswer:', error4.message);
              
              // Store the answer locally for fallback score calculation
              try {
                const storedAnswers = localStorage.getItem('playerAnswers');
                const answers = storedAnswers ? JSON.parse(storedAnswers) : [];
                answers.push({
                  playerId: playerId,
                  questionId: questionId,
                  answer: answer,
                  isCorrect: isCorrect,
                  responseTime: responseTime,
                  answeredAt: new Date().toISOString(),
                  teamName: teamName,
                  score: isCorrect ? 100 : 0 // Add a default score
                });
                localStorage.setItem('playerAnswers', JSON.stringify(answers));
                sessionStorage.setItem('playerAnswers', JSON.stringify(answers));
                console.log('Stored team answer locally for fallback score calculation');
              } catch (storageError) {
                console.error('Failed to store team answer locally:', storageError);
              }
              
      return {
        status: 500,
                message: 'Failed to submit team answer after multiple attempts',
                error: 'All team answer submission methods failed'
              };
            }
          }
        }
      }
    } catch (error: any) {
      console.error('Error submitting team mode answer:', error);
      
      return {
        status: error.response?.status || 500,
        message: `Error submitting team answer: ${error.message}`,
        data: null
      };
    }
  }
};

export default playerService;