import axios from 'axios';

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
   * @returns Formatted player data for API
   */
  formatPlayerData: (
    nickname: string,
    sessionId: number,
    animalName: string = 'alligator',
    animalColor: string = 'orange',
    userId: number = 0
  ): PlayerData => {
    // Generate a random 6-digit player code
    const playerCode = Math.floor(100000 + Math.random() * 900000);
    
    return {
      id: 0, // The server will assign an ID
      userId: userId,
      nickname: nickname,
      playerCode: playerCode,
      avatarUrl: playerService.formatAnimalAvatar(animalName, animalColor),
      score: 0, // Initial score is 0
      sessionId: sessionId
    };
  },

  /**
   * Submit a player's answer to a question
   * @param playerId ID of the player
   * @param questionId ID of the question
   * @param isCorrect Whether the answer is correct
   * @param responseTime Time taken to answer in seconds
   * @param answer The answer value (e.g., 'A', 'B', 'C', or 'D')
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
      const answerData = {
        id: 0, // Server will assign this
        playerId: playerId,
        questionId: questionId,
        answeredAt: new Date().toISOString(),
        isCorrect: isCorrect,
        responseTime: responseTime,
        answer: answer
      };

      console.log("Submitting player answer:", answerData);
      
      const response = await axios.post(
        `${API_BASE_URL}/api/PlayerAnswer`,
        answerData,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error submitting player answer:', error);
      throw error;
    }
  }
};

export default playerService; 