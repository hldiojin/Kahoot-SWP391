import axios, { AxiosError } from 'axios';

const API_BASE_URL = 'https://kahootclone-f7hkd0hwafgbfrfa.southeastasia-01.azurewebsites.net';

interface PlayerData {
  id: number;
  userId: number;
  nickname: string;
  playerCode: number;
  avatarUrl: string;
  score: number;
  sessionId: number;
}

interface PlayerResponse {
  data: any;
  message: string;
  status: number;
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
      const response = await axios.post(
        `${API_BASE_URL}/api/Player`, 
        playerData,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error creating player:', error);
      throw error;
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
    
    // Create the base player data
    const playerData: PlayerData & { teamName?: string, groupName?: string, team?: string } = {
      id: 0, // The server will assign an ID
      userId: userId,
      nickname: nickname,
      playerCode: playerCode,
      avatarUrl: playerService.formatAnimalAvatar(animalName, animalColor),
      score: 0, // Initial score is 0
      sessionId: sessionId
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
          if (playerInfo && playerInfo.id) {
            playerId = parseInt(String(playerInfo.id));
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
          
          if (existingPlayer && existingPlayer.id) {
            // Found a matching player, use their ID
            playerId = parseInt(String(existingPlayer.id));
            console.log(`Found matching player ID from session: ${playerId}`);
            
            // Update stored player info
            if (playerInfoStr) {
              const updatedInfo = JSON.parse(playerInfoStr);
              updatedInfo.id = playerId;
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
      
      if (response && response.data && response.data.id) {
        playerId = parseInt(String(response.data.id));
        console.log(`Created new player with ID: ${playerId}`);
        
        // Update stored player info
        if (playerInfoStr) {
          const updatedInfo = JSON.parse(playerInfoStr);
          updatedInfo.id = playerId;
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
      
      // CRITICAL: Never modify the player ID that was passed in
      // The game page is passing the exact ID from storage that matches the player record
      
      console.log(`Submitting answer with exact playerId: ${playerId} and questionId: ${questionId}`);
      
      // Handle timeout answer with special 'T' value
      const finalAnswer = answer === '' || answer === null ? 'T' : answer;
      
      // Create answer object with EXACT IDs from parameters
      const answerData = {
        id: 0,
        playerId: playerId, // Use exact value, no conversion
        questionId: questionId, // Use exact value, no conversion
        answeredAt: new Date().toISOString(),
        isCorrect: isCorrect,
        responseTime: responseTime,
        answer: finalAnswer
      };

      console.log("Final player answer object:", answerData);
      
      // Fix: Wrap in playerAnswerDto as required by API
      const response = await axios.post(
        `${API_BASE_URL}/api/PlayerAnswer`,
        { playerAnswerDto: answerData }, // Wrap answer in playerAnswerDto field
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      ).catch((error) => {
        console.error('Error submitting player answer to API:', error);
        
        if (error.response) {
          console.error('API error response:', error.response.data);
        }
        
        // Re-throw the error
        throw error;
      });
      
      return response.data;
    } catch (error) {
      console.error('Error submitting player answer:', error);
      throw error;
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
      const sessionPlayers = await playerService.getPlayersBySessionId(playerData.sessionId)
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
   * Calculate score for solo mode by calling the SoloScore endpoint
   * @param playerAnswer Player answer data
   * @param question Question data
   * @returns Promise with calculated score response
   */
  calculateSoloScore: async (
    playerAnswer: PlayerAnswer,
    question: Question
  ): Promise<PlayerResponse> => {
    try {
      console.log("Calculating solo score for player:", playerAnswer.playerId);
      
      // Validate required fields
      if (!playerAnswer.playerId || !playerAnswer.questionId || !question.id) {
        console.error("Missing required fields for solo score calculation");
        console.error("Player answer:", playerAnswer);
        console.error("Question:", question);
        throw new Error("Missing required fields for solo score calculation");
      }
      
      // Notice the capital letters in PlayerAnswer and Question - API expects this casing
      const requestData = {
        PlayerAnswer: playerAnswer, // Changed to capital P
        Question: question // Changed to capital Q
      };
      
      console.log("SoloScore request with correct casing:", requestData);
      
      // Fix: Use correct field names with proper casing
      const response = await axios.post(
        `${API_BASE_URL}/api/PlayerAnswer/SoloScore`,
        requestData, // No longer need the "request" wrapper, just proper cased fields
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log("Solo score calculation response:", response.data);
      return response.data;
    } catch (error: unknown) {
      console.error('Error calculating solo score:', error);
      
      // If error has response data, log it
      if (error instanceof AxiosError && error.response) {
        console.error('API Error Response:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        });
      }
      
      // Return a fallback response
      return {
        status: 500,
        message: "Error calculating score: " + (error instanceof Error ? error.message : "Unknown error"),
        data: null
      };
    }
  },
  
  /**
   * Calculate scores for team mode by calling the GroupScore endpoint
   * @param groupMembers Array of group members
   * @param playerAnswers Array of player answers
   * @param questions Array of questions
   * @returns Promise with calculated group score response
   */
  calculateGroupScore: async (
    groupMembers: GroupMember[],
    playerAnswers: PlayerAnswer[],
    questions: Question[]
  ): Promise<PlayerResponse> => {
    try {
      console.log("Calculating group scores for group members:", groupMembers.length);
      console.log("Request details:", {
        groupMembers: groupMembers.length,
        playerAnswers: playerAnswers.length,
        questions: questions.length
      });
      
      // Validate required data
      if (!groupMembers.length || !playerAnswers.length || !questions.length) {
        console.error("Missing required data for group score calculation");
        console.error("Group members:", groupMembers.length);
        console.error("Player answers:", playerAnswers.length);
        console.error("Questions:", questions.length);
        throw new Error("Missing required data for group score calculation");
      }
      
      // Use proper casing as expected by the API
      const requestData = {
        GroupMembers: groupMembers, // Changed to capital G and M 
        PlayerAnswers: playerAnswers, // Changed to capital P and A
        Questions: questions // Changed to capital Q
      };
      
      console.log("GroupScore request with correct casing:", requestData);
      
      // Use proper casing
      const response = await axios.post(
        `${API_BASE_URL}/api/PlayerAnswer/GroupScore`,
        requestData, // No longer need the "request" wrapper, just proper cased fields
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          timeout: 10000 // 10 second timeout to allow for longer processing
        }
      );
      
      console.log("Group score calculation response:", response.data);
      return response.data;
    } catch (error: unknown) {
      console.error('Error calculating group scores:', error);
      
      // If error has response data, log it
      if (error instanceof AxiosError && error.response) {
        console.error('API Error Response:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        });
      }
      
      // Return a fallback response
      return {
        status: 500,
        message: "Error calculating team scores: " + (error instanceof Error ? error.message : "Unknown error"),
        data: null
      };
    }
  }
};

export default playerService;