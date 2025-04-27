import axios from 'axios';

const API_BASE_URL = 'https://kahootclone-f7hkd0hwafgbfrfa.southeastasia-01.azurewebsites.net';

interface GameSessionData {
  id: number;
  quizId: number;
  hostId: number;
  pinCode: string;
  gameType: string;
  status: string;
  minPlayer: number;
  maxPlayer: number;
  startedAt: string;
  endedAt: string;
}

interface GameSessionResponse {
  data: any;
  message: string;
  status: number;
}

const gameSessionService = {
  /**
   * Create a new game session
   * @param sessionData Game session data to be created
   * @returns Promise with game session creation response
   */
  createGameSession: async (sessionData: GameSessionData): Promise<GameSessionResponse> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token is missing');
      }

      const response = await axios.post(
        `${API_BASE_URL}/api/GameSession`, 
        sessionData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error creating game session:', error);
      throw error;
    }
  },

  /**
   * Get a game session by ID
   * @param sessionId ID of the game session to fetch
   * @returns Promise with game session data
   */
  getGameSessionById: async (sessionId: number): Promise<GameSessionResponse> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token is missing');
      }

      const response = await axios.get(
        `${API_BASE_URL}/api/GameSession/${sessionId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error(`Error fetching game session with ID ${sessionId}:`, error);
      throw error;
    }
  },

  /**
   * Get a game session by quiz code
   * @param pinCode Pin code of the game session to fetch
   * @returns Promise with game session data
   */
  getGameSessionByPinCode: async (pinCode: string): Promise<GameSessionResponse> => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/GameSession/pinCode/${pinCode}`
      );
      
      return response.data;
    } catch (error) {
      console.error(`Error fetching game session with pin code ${pinCode}:`, error);
      throw error;
    }
  },

  /**
   * Update an existing game session
   * @param sessionId ID of the game session to update
   * @param sessionData Updated game session data
   * @returns Promise with updated game session data
   */
  updateGameSession: async (sessionId: number, sessionData: GameSessionData): Promise<GameSessionResponse> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token is missing');
      }

      const response = await axios.put(
        `${API_BASE_URL}/api/GameSession/${sessionId}`,
        sessionData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error(`Error updating game session with ID ${sessionId}:`, error);
      throw error;
    }
  },

  /**
   * Format the game session data
   * @param quizId ID of the quiz for this session
   * @param hostId ID of the host user
   * @param gameType Type of game (e.g., 'solo', 'team')
   * @returns Formatted game session data for API
   */
  formatGameSessionData: (
    quizId: number,
    hostId: number, 
    gameType: string = 'solo'
  ): GameSessionData => {
    // Generate a random 6-digit pin code
    const pinCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    return {
      id: 0, // The server will assign an ID
      quizId: quizId,
      hostId: hostId,
      pinCode: pinCode,
      gameType: gameType,
      status: 'pending', // Default status for new sessions
      minPlayer: 1,
      maxPlayer: 50, // Default max players
      startedAt: new Date().toISOString(),
      endedAt: new Date(Date.now() + 3600000).toISOString() // Default 1 hour duration
    };
  }
};

export default gameSessionService; 