import axios from 'axios';
import groupService from './groupService';
import authService from './authService';

const API_BASE_URL = 'https://kahootclone-f7hkd0hwafgbfrfa.southeastasia-01.azurewebsites.net';

interface QuizData {
  id: number;
  title: string;
  quizCode: number;
  description: string;
  createdBy: number;
  categoryId: number;
  isPublic: boolean;
  thumbnailUrl: string | null;
  createdAt: string;
  maxPlayer: number;
  minPlayer: number;
  favorite: boolean;
  gameMode: string;
}

// Add a simpler interface for creating a quiz
interface CreateQuizRequest {
  title: string;
  description: string;
  createdBy: number;
  categoryId: number;
  isPublic: boolean;
  thumbnailUrl?: string | null;
  createdAt: string;
  maxPlayer: number;
  minPlayer: number;
  favorite: boolean;
  gameMode: string;
}

// Interface for creating groups
interface GroupData {
  id: number;
  name: string;
  description: string;
  rank: number;
  maxMembers: number;
  totalPoint: number;
  createdBy: number;
  createdAt: string;
}

interface QuizResponse {
  data: any;
  message: string;
  status: number;
}

// Define a player interface for quiz results
interface PlayerResult {
  id: number | string;
  name: string;
  avatar?: string;
  score: number;
  correctAnswers?: number;
  totalQuestions?: number;
  teamId?: number | null;
  teamName?: string | null;
  isTopPlayer?: boolean;
  [key: string]: any; // Allow additional properties
}

// Utility function to fetch with retry for transient errors
const fetchWithRetry = async (apiCall: () => Promise<any>, maxRetries: number = 3, delay: number = 1000): Promise<any> => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error: any) {
      console.log(`API call failed (attempt ${attempt}/${maxRetries}):`, error.message);
      
      // Only retry on 500 errors that might be transient
      if (error.response && error.response.status === 500 && 
          error.response.data && 
          error.response.data.message && 
          error.response.data.message.includes('transient failure')) {
        lastError = error;
        
        if (attempt < maxRetries) {
          console.log(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          // Increase delay for next attempt - exponential backoff
          delay *= 1.5;
          continue;
        }
      }
      
      // For other errors, or if we've exhausted retries, throw the error
      throw error;
    }
  }
  
  // If we've exhausted retries, throw the last error
  throw lastError;
};

const quizService = {
  /**
   * Create a new quiz
   * @param quizData Quiz data to be created
   * @returns Promise with quiz creation response
   */
  createQuiz: async (quizData: any): Promise<QuizResponse> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token is missing');
      }

      // Tạo quizCode nếu chưa có
      const quizCode = quizData.quizCode || quizService.generateQuizCode();

      // Đảm bảo đúng định dạng ngày
      const currentDate = new Date();
      const formattedDate = currentDate.toISOString();

      // Đảm bảo createdBy là số
      let createdById = 0;
      try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        createdById = user.id ? parseInt(user.id) : 0;
      } catch (e) {
        console.error("Error getting user ID:", e);
      }

      // Xử lý lại categoryId nếu không hợp lệ
      let categoryId = quizData.categoryId || 1;
      if (categoryId <= 0 || isNaN(categoryId)) {
        categoryId = 1;
      }

      // Process gameMode before creating the request object
      let gameMode = 'solo'; // Default to solo
      
      if (quizData.gameMode) {
        // Normalize the gameMode value
        if (typeof quizData.gameMode === 'string') {
          const normalizedMode = quizData.gameMode.trim().toLowerCase();
          // Be more explicit in string matching
          if (normalizedMode === 'team' || normalizedMode === 'group' || normalizedMode === '1' || normalizedMode === 'true') {
            gameMode = 'team';
          } else {
            gameMode = 'solo';
          }
        } else if (typeof quizData.gameMode === 'boolean') {
          gameMode = quizData.gameMode === true ? 'team' : 'solo';
        } else if (typeof quizData.gameMode === 'number') {
          gameMode = quizData.gameMode === 0 ? 'solo' : 'team';
        }
      }
      
      console.log(`Normalized gameMode for createQuiz: ${gameMode} (original: ${JSON.stringify(quizData.gameMode)}, type: ${typeof quizData.gameMode})`);

      // Tạo request object với đầy đủ các trường cần thiết và định dạng đúng
      const createRequest = {
        title: quizData.title || "Untitled Quiz",
        description: quizData.description || "",
        createdBy: createdById || quizData.createdBy || 1,
        categoryId: categoryId,
        isPublic: quizData.isPublic !== undefined ? quizData.isPublic : true,
        thumbnailUrl: quizData.thumbnailUrl || null,
        createdAt: formattedDate, // Sử dụng thời gian hiện tại, không dùng dữ liệu từ client
        quizCode: quizCode,
        maxPlayer: quizData.maxPlayer && !isNaN(quizData.maxPlayer) && quizData.maxPlayer > 0 ? quizData.maxPlayer : 50,
        minPlayer: quizData.minPlayer && !isNaN(quizData.minPlayer) && quizData.minPlayer > 0 ? quizData.minPlayer : 1,
        favorite: quizData.favorite === true ? true : false,
        gameMode: gameMode
      };

      // Log dữ liệu gửi đi
      console.log('Creating quiz with data:', createRequest);

      // Use fetchWithRetry for transient error resilience
      const response = await fetchWithRetry(() => axios.post(
        'https://kahootclone-f7hkd0hwafgbfrfa.southeastasia-01.azurewebsites.net/api/Quiz', 
        createRequest,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      ));
      
      // Log response để debug
      console.log("Quiz creation successful response:", response);
      
      // Save gameMode to sessionStorage for consistency
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('gameMode', gameMode);
        console.log(`Game mode saved to sessionStorage: ${gameMode}`);
      }
      
      // If quiz is in team mode and creation was successful, create the teams
      if (gameMode === 'team' && response.data && (response.data.status === 201 || response.data.status === 200)) {
        const quizId = response.data.data?.id;
        if (quizId) {
          try {
            // Get team configuration from quiz data or use defaults
            const numTeams = quizData.teamCount || 4;
            const maxMembersPerTeam = quizData.membersPerTeam || 5;
            
            // Create teams based on configuration using the group service
            await groupService.createTeamsForQuiz(
              quizId, 
              numTeams, 
              maxMembersPerTeam, 
              createdById
            );
            console.log(`Teams created successfully for quiz: ${quizId} (${numTeams} teams with ${maxMembersPerTeam} members each)`);
          } catch (teamError) {
            console.error("Error creating teams for quiz:", teamError);
            // Continue with the quiz creation even if team creation fails
          }
        }
      }
      
      return response.data;
    } catch (error: any) {
      console.error('Error creating quiz:', error);
      
      // Log chi tiết response error
      if (error.response) {
        console.error('Server error status:', error.response.status);
        console.error('Full server error data:', error.response.data);
        
        // Do not retry on 500 error to avoid duplicate quizzes
        throw new Error(`Server error: ${error.response?.data?.message || error.message}`);
      } else if (error.request) {
        console.error('No response from server:', error.request);
        throw new Error('No response from server. Please check your connection.');
      } else {
        console.error('Error message:', error.message);
        throw error;
      }
    }
  },

  /**
   * Create teams for a quiz in team mode
   * @param quizId ID of the quiz
   * @param teamCount Number of teams to create
   * @param membersPerTeam Maximum members per team
   * @param createdBy ID of the user creating the teams
   * @returns Promise with array of team creation responses
   */
  createTeamsForQuiz: async (quizId: number, teamCount: number = 4, membersPerTeam: number = 5, createdBy: number = 0): Promise<any[]> => {
    // Use the groupService to create teams
    return groupService.createTeamsForQuiz(quizId, teamCount, membersPerTeam, createdBy);
  },

  /**
   * Get all quizzes
   * @returns Promise with all quizzes
   */
  getAllQuizzes: async (): Promise<QuizResponse> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token is missing');
      }

      const response = await fetchWithRetry(() => axios.get(
        `${API_BASE_URL}/api/Quiz`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      ));
      
      return response.data;
    } catch (error) {
      console.error('Error fetching quizzes:', error);
      throw error;
    }
  },

  /**
   * Get a specific quiz by ID
   * @param quizId ID of the quiz to fetch
   * @returns Promise with quiz data
   */
  getQuizById: async (quizId: number): Promise<QuizResponse> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token is missing');
      }

      const response = await fetchWithRetry(() => axios.get(
        `${API_BASE_URL}/api/Quiz/${quizId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      ));
      
      return response.data;
    } catch (error: any) {
      console.error(`Error fetching quiz with ID ${quizId}:`, error);
      
      // Provide more helpful error message for UI display
      if (error.response && error.response.status === 500) {
        throw new Error(`Server error (500): The database is temporarily unavailable. We've tried multiple times to connect. Please try again in a few moments.`);
      }
      
      throw error;
    }
  },

  /**
   * Get a quiz by its quiz code (using the QuizCode endpoint)
   * @param quizCode Code of the quiz to fetch
   * @returns Promise with quiz data
   */
  getQuizByQuizCode: async (quizCode: string): Promise<QuizResponse> => {
    try {
      console.log(`Finding quiz with code: ${quizCode} using QuizCode endpoint`);
      
      // Try endpoint without authentication first
      try {
        const response = await fetchWithRetry(() => axios.get(
          `${API_BASE_URL}/api/Quiz/QuizCode/${quizCode}`
        ));
        
        // Log the raw response to debug gameMode property
        console.log(`Raw API response for quiz code ${quizCode}:`, response.data);
        
        // Create a deep copy of the response to avoid modifying the original axios response
        const processedResponse = {
          ...response.data,
          data: response.data?.data ? { ...response.data.data } : null
        };
        
        // Process the response to ensure gameMode is properly formatted
        if (processedResponse && processedResponse.data) {
          // Ensure gameMode is properly processed
          const gameMode = processedResponse.data.gameMode;
          console.log(`Original gameMode value from API: ${gameMode}, type: ${typeof gameMode}`);
          
          // Normalize the game mode consistently
          let normalizedGameMode = 'solo'; // Default to solo
          
          if (gameMode !== undefined && gameMode !== null) {
            if (typeof gameMode === 'string') {
              // Normalize string game mode
              const lowercaseMode = gameMode.trim().toLowerCase();
              normalizedGameMode = lowercaseMode === 'team' ? 'team' : 'solo';
            } else if (typeof gameMode === 'boolean') {
              normalizedGameMode = gameMode === true ? 'team' : 'solo';
            } else if (typeof gameMode === 'number') {
              normalizedGameMode = gameMode === 0 ? 'solo' : 'team';
            }
          }
          
          console.log(`Normalized gameMode: ${normalizedGameMode}`);
          processedResponse.data.gameMode = normalizedGameMode;
          
          // Save the game mode to session storage
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('gameMode', normalizedGameMode);
            console.log(`Quiz gameMode saved to sessionStorage: ${normalizedGameMode}`);
          }
        }
        
        return processedResponse;
      } catch (publicError) {
        // If public endpoint fails, try with authentication
        const token = localStorage.getItem('token');
        if (token) {
          const response = await fetchWithRetry(() => axios.get(
            `${API_BASE_URL}/api/Quiz/QuizCode/${quizCode}`,
            {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            }
          ));
          
          // Create a deep copy for the authenticated response as well
          const processedAuthResponse = {
            ...response.data,
            data: response.data?.data ? { ...response.data.data } : null
          };
          
          // Process the authenticated response
          if (processedAuthResponse && processedAuthResponse.data) {
            // Ensure gameMode is properly processed
            const gameMode = processedAuthResponse.data.gameMode;
            console.log(`Authenticated API gameMode value: ${gameMode}, type: ${typeof gameMode}`);
            
            // Apply the same normalization logic
            let normalizedGameMode = 'solo'; // Default to solo
            
            if (gameMode !== undefined && gameMode !== null) {
              if (typeof gameMode === 'string') {
                // Normalize string game mode
                const lowercaseMode = gameMode.trim().toLowerCase();
                normalizedGameMode = lowercaseMode === 'team' ? 'team' : 'solo';
              } else if (typeof gameMode === 'boolean') {
                normalizedGameMode = gameMode === true ? 'team' : 'solo';
              } else if (typeof gameMode === 'number') {
                normalizedGameMode = gameMode === 0 ? 'solo' : 'team';
              }
            }
            
            console.log(`Normalized authenticated gameMode: ${normalizedGameMode}`);
            processedAuthResponse.data.gameMode = normalizedGameMode;
            
            // Save the game mode to session storage
            if (typeof window !== 'undefined') {
              sessionStorage.setItem('gameMode', normalizedGameMode);
              console.log(`Auth: Quiz gameMode saved to sessionStorage: ${normalizedGameMode}`);
            }
          }
          
          return processedAuthResponse;
        } else {
          throw publicError;
        }
      }
    } catch (error: any) {
      console.error(`Error fetching quiz with code ${quizCode} from QuizCode endpoint:`, error);
      
      // Provide more helpful error message for UI display
      if (error.response && error.response.status === 500) {
        throw new Error(`Server error (500): The database is temporarily unavailable. We've tried multiple times to connect. Please try again in a few moments.`);
      }
      
      throw error;
    }
  },

  /**
   * Get a quiz by its quiz code
   * @param quizCode Code of the quiz to fetch
   * @returns Promise with quiz data
   */
  getQuizByCode: async (quizCode: string): Promise<QuizResponse> => {
    // First try the new QuizCode endpoint, then fall back to the old endpoint if needed
    try {
      return await quizService.getQuizByQuizCode(quizCode);
    } catch (error) {
      console.log(`QuizCode endpoint failed, trying alternate endpoint for code: ${quizCode}`);
      
      // Thử endpoint không yêu cầu xác thực trước
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/Quiz/code/${quizCode}`
        );
        return response.data;
      } catch (publicError) {
        // Nếu không tìm thấy với endpoint công khai, thử với xác thực
        const token = localStorage.getItem('token');
        if (token) {
          const response = await axios.get(
            `${API_BASE_URL}/api/Quiz/code/${quizCode}`,
            {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            }
          );
          return response.data;
        } else {
          throw publicError;
        }
      }
    }
  },

  /**
   * Get all quizzes created by a specific user
   * @param userId ID of the user
   * @returns Promise with user's quizzes
   */
  getMyQuizzes: async (userId: number): Promise<QuizResponse> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token is missing');
      }

      // Make sure userId is valid
      if (!userId || isNaN(Number(userId))) {
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        userId = currentUser.id ? parseInt(currentUser.id) : 0;
        
        if (!userId) {
          throw new Error('User ID is required and could not be determined automatically');
        }
      }

      // Call the API with retry mechanism for transient errors
      console.log(`Fetching quizzes for user ${userId} with retry mechanism`);
      const response = await fetchWithRetry(() => axios.get(
        `${API_BASE_URL}/api/Quiz/MySets/${userId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      ));
      
      console.log("My quizzes retrieved:", response.data);
      
      // Check for null data and convert to empty array
      if (!response.data) {
        console.warn("API returned null data for getMyQuizzes");
        return { data: [], message: "No quiz data available", status: 200 };
      }
      
      // If data property is null, convert to empty array
      if (response.data && response.data.data === null) {
        console.warn("API returned response with null data property");
        response.data.data = [];
      }
      
      return response.data;
    } catch (error: any) {
      console.error(`Error fetching quizzes for user ${userId}:`, error);
      
      // Provide more helpful error message for UI display
      if (error.response && error.response.status === 500) {
        throw new Error(`Server error (500): The database is temporarily unavailable. We've tried multiple times to connect. Please try again in a few moments.`);
      }
      
      throw error;
    }
  },

  /**
   * Get all quizzes created by the current user from the API
   * @returns Promise with user's quizzes
   */
  fetchAndStoreMyQuizzes: async (): Promise<QuizResponse> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token is missing');
      }

      // Get current user information
      const currentUser = authService.getCurrentUser();
      if (!currentUser || !currentUser.id) {
        throw new Error('User ID not available');
      }

      const userId = currentUser.id;

      // Call the API with retry mechanism for transient errors
      console.log(`Fetching quizzes for user ${userId} with retry mechanism`);
      const response = await fetchWithRetry(() => axios.get(
        `${API_BASE_URL}/api/Quiz/MySets/${userId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      ));
      
      console.log("My quizzes retrieved:", response.data);
      
      // Check for null data and convert to empty array
      if (!response.data) {
        console.warn("API returned null data for fetchAndStoreMyQuizzes");
        return { data: [], message: "No quiz data available", status: 200 };
      }
      
      // If data property is null, convert to empty array
      if (response.data && response.data.data === null) {
        console.warn("API returned response with null data property");
        response.data.data = [];
      }
      
      return response.data;
    } catch (error: any) {
      console.error('Error fetching user quizzes:', error);
      
      // Provide more helpful error message for UI display
      if (error.response && error.response.status === 500) {
        throw new Error(`Server error (500): The database is temporarily unavailable. We've tried multiple times to connect. Please try again in a few moments.`);
      }
      
      throw error;
    }
  },

  /**
   * Update an existing quiz
   * @param quizId ID of the quiz to update
   * @param quizData Updated quiz data
   * @returns Promise with updated quiz data
   */
  updateQuiz: async (quizId: number, quizData: QuizData): Promise<QuizResponse> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token is missing');
      }

      const response = await fetchWithRetry(() => axios.put(
        `${API_BASE_URL}/api/Quiz/${quizId}`,
        quizData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      ));
      
      return response.data;
    } catch (error: any) {
      console.error(`Error updating quiz with ID ${quizId}:`, error);
      
      // Provide more helpful error message for UI display
      if (error.response && error.response.status === 500) {
        throw new Error(`Server error (500): The database is temporarily unavailable. We've tried multiple times to connect. Please try again in a few moments.`);
      }
      
      throw error;
    }
  },

  /**
   * Delete a quiz
   * @param quizId ID of the quiz to delete
   * @returns Promise with deletion response
   */
  deleteQuiz: async (quizId: number): Promise<QuizResponse> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token is missing');
      }

      const response = await fetchWithRetry(() => axios.delete(
        `${API_BASE_URL}/api/Quiz/${quizId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      ));
      
      return response.data;
    } catch (error: any) {
      console.error(`Error deleting quiz with ID ${quizId}:`, error);
      
      // Provide more helpful error message for UI display
      if (error.response && error.response.status === 500) {
        throw new Error(`Server error (500): The database is temporarily unavailable. We've tried multiple times to connect. Please try again in a few moments.`);
      }
      
      throw error;
    }
  },

  /**
   * Generate a random quiz code (6 digits)
   * @returns A 6-digit number
   */
  generateQuizCode: (): number => {
    // For client-side, use Math.random()
    // For server-side, use a more deterministic approach
    if (typeof window !== 'undefined') {
      // Client-side code
      return Math.floor(100000 + Math.random() * 900000);
    } else {
      // Server-side code - use a more deterministic approach
      const timestamp = Date.now();
      // Use timestamp modulo to create a number that's still unique but more consistent
      return 100000 + (timestamp % 900000);
    }
  },

  /**
   * Format quiz data correctly
   * @param title Title of the quiz
   * @param description Description of the quiz
   * @param categoryId Category ID of the quiz (default: 1)
   * @param isPublic Whether the quiz is public (default: true)
   * @param thumbnailUrl Thumbnail URL of the quiz (default: placeholder image)
   * @param gameMode Game mode (solo or team)
   * @param minPlayer Minimum player count (default: 1)
   * @param maxPlayer Maximum player count (default: 50)
   * @param favorite Whether the quiz is favorited (default: false)
   * @returns Formatted quiz data
   */
  formatQuizData: (
    title: string,
    description: string,
    categoryId: number = 1,
    isPublic: boolean = true,
    thumbnailUrl: string = 'https://placehold.co/600x400?text=Quiz',
    gameMode: string = 'solo',
    minPlayer: number = 1,
    maxPlayer: number = 50,
    favorite: boolean = false
  ): QuizData => {
    // Get the user ID from local storage or context
    let userId = 0;
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      userId = user.id || 0;
    } catch (e) {
      console.error("Error getting user ID:", e);
    }

    // Generate a unique quiz code
    const quizCode = quizService.generateQuizCode();

    return {
      id: 0, // Use 0 for new quizzes; the server will assign the real ID
      title: title || 'Untitled Quiz',
      quizCode: quizCode,
      description: description || '',
      createdBy: userId, // Use the actual user ID
      categoryId: categoryId,
      isPublic: isPublic,
      thumbnailUrl: thumbnailUrl,
      createdAt: new Date().toISOString(),
      minPlayer: minPlayer,
      maxPlayer: maxPlayer,
      favorite: favorite,
      gameMode: gameMode
    };
  },

  /**
   * Toggle favorite status of a quiz
   * @param quizId ID of the quiz to favorite/unfavorite
   * @returns Promise with toggle favorite response
   */
  toggleFavorite: async (quizId: number): Promise<QuizResponse> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token is missing');
      }

      const response = await fetchWithRetry(() => axios.put(
        `${API_BASE_URL}/api/Quiz/${quizId}/favorite`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      ));
      
      // Update cached quizzes in sessionStorage with new favorite status
      try {
        const storedQuizzes = sessionStorage.getItem('myQuizzes');
        if (storedQuizzes) {
          const parsedQuizzes = JSON.parse(storedQuizzes);
          if (Array.isArray(parsedQuizzes)) {
            const updatedQuizzes = parsedQuizzes.map(quiz => {
              if (quiz.id === quizId) {
                return { ...quiz, favorite: !quiz.favorite };
              }
              return quiz;
            });
            sessionStorage.setItem('myQuizzes', JSON.stringify(updatedQuizzes));
          }
        }
      } catch (error) {
        console.error('Error updating cached quizzes:', error);
      }
      
      return response.data;
    } catch (error: any) {
      console.error(`Error toggling favorite for quiz with ID ${quizId}:`, error);
      
      // Provide more helpful error message for UI display
      if (error.response && error.response.status === 500) {
        throw new Error(`Server error (500): The database is temporarily unavailable. We've tried multiple times to connect. Please try again in a few moments.`);
      }
      
      throw error;
    }
  },

  /**
   * Get all favorite quizzes for a specific user
   * @param userId ID of the user
   * @returns Promise with user's favorite quizzes
   */
  getFavoriteQuizzes: async (userId: number): Promise<QuizResponse> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token is missing');
      }

      // Make sure userId is valid
      if (!userId || isNaN(Number(userId))) {
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        userId = currentUser.id ? parseInt(currentUser.id) : 0;
        
        if (!userId) {
          throw new Error('User ID is required and could not be determined automatically');
        }
      }

      // Call the API with retry mechanism for transient errors
      console.log(`Fetching favorite quizzes for user ${userId}`);
      const response = await fetchWithRetry(() => axios.get(
        `${API_BASE_URL}/api/Quiz/Favorite/${userId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      ));
      
      console.log("Favorite quizzes retrieved:", response.data);
      
      // Check for null data and convert to empty array
      if (!response.data) {
        console.warn("API returned null data for getFavoriteQuizzes");
        return { data: [], message: "No favorite quiz data available", status: 200 };
      }
      
      // If data property is null, convert to empty array
      if (response.data && response.data.data === null) {
        console.warn("API returned response with null data property for favorites");
        response.data.data = [];
      }
      
      return response.data;
    } catch (error: any) {
      console.error(`Error fetching favorite quizzes for user ${userId}:`, error);
      
      // Provide more helpful error message for UI display
      if (error.response && error.response.status === 500) {
        throw new Error(`Server error (500): The database is temporarily unavailable. We've tried multiple times to connect. Please try again in a few moments.`);
      }
      
      throw error;
    }
  },

  /**
   * Join a quiz as a non-authenticated user
   * @param quizId ID of the quiz to join
   * @param playerData Player information (name, avatar, etc.)
   * @returns Promise with join quiz response
   */
  joinQuiz: async (quizId: number | string, playerData: any): Promise<QuizResponse> => {
    try {
      console.log(`Non-user joining quiz with ID ${quizId}...`, playerData);
      
      // Create request body - Format it according to the backend expectations
      const joinRequest = {
        playerDTO: {
          id: playerData.playerId || 0,
          playerId: playerData.playerId || 0,
          nickname: playerData.name || playerData.nickname || 'Guest',
          avatarUrl: playerData.avatar || playerData.avatarUrl || 'alligator',
          score: playerData.score || 0,
          quizId: quizId,
          teamName: playerData.team || playerData.teamName || playerData.groupName || null,
          groupName: playerData.team || playerData.teamName || playerData.groupName || null
        }
      };
      
      console.log('Joining quiz with data:', joinRequest);
      
      let updatedPlayerData;
      // Store player data in session storage
      try {
        // Save the player data with playerId from response if available
        updatedPlayerData = {
          ...playerData,
          playerId: playerData.playerId || playerData.id || 0,
          id: playerData.playerId || playerData.id || 0
        };
        
        // Store player data for use in other components
        sessionStorage.setItem('currentPlayer', JSON.stringify(updatedPlayerData));
        console.log('Stored updated player data with ID:', updatedPlayerData);
      } catch (storageError) {
        console.error('Error storing player data:', storageError);
      }
      
      return { data: { data: updatedPlayerData }, message: 'Success', status: 200 };
    } catch (error: any) {
      console.error(`Error joining quiz with ID ${quizId}:`, error);
      
      // Provide more helpful error message for UI display
      if (error.response && error.response.status === 500) {
        throw new Error(`Server error (500): The database is temporarily unavailable. We've tried multiple times to connect. Please try again in a few moments.`);
      }
      
      throw error;
    }
  },

  /**
   * Start a quiz game
   * @param quizId ID of the quiz to start
   * @returns Promise with start quiz response
   */
  startQuiz: async (quizId: number): Promise<QuizResponse> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token is missing');
      }

      console.log(`Starting quiz with ID ${quizId}...`);
      const response = await fetchWithRetry(() => axios.post(
        `${API_BASE_URL}/api/Quiz/StartQuiz/${quizId}`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      ));
      
      // Get quiz information if available
      try {
        const quizResponse = await quizService.getQuizById(quizId);
        if (quizResponse?.data) {
          const quizData = quizResponse.data;
          
          // Store quiz data in session storage
          sessionStorage.setItem('currentQuiz', JSON.stringify(quizData));
          
          // Store the quiz code for easy access
          if (quizData.quizCode) {
            sessionStorage.setItem('currentQuizCode', quizData.quizCode.toString());
          }
          
          // Mark this quiz as started
          sessionStorage.setItem(`quiz_${quizId}_started`, 'true');
          
          console.log(`Quiz ${quizId} started and data cached:`, quizData);
        }
      } catch (cacheError) {
        console.error('Error caching quiz data:', cacheError);
        // Continue anyway as this is just for caching purposes
      }
      
      console.log(`Quiz ${quizId} started successfully:`, response.data);
      return response.data;
    } catch (error: any) {
      console.error(`Error starting quiz with ID ${quizId}:`, error);
      
      // Provide more helpful error message for UI display
      if (error.response && error.response.status === 500) {
        throw new Error(`Server error (500): The database is temporarily unavailable. We've tried multiple times to connect. Please try again in a few moments.`);
      }
      
      throw error;
    }
  },

  /**
   * Get the list of joined players for a quiz
   * @param quizId ID of the quiz
   * @returns Promise with joined players
   */
  getJoinedPlayers: async (quizId: number | string): Promise<any> => {
    try {
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      console.log(`Fetching joined players for quiz ID ${quizId}`);
      
      const response = await fetch(
        `${API_BASE_URL}/api/Quiz/JoinedPlayers/${quizId}`,
        { headers }
      );
      
      const text = await response.text();
      if (!text) {
        console.log('Empty response from joined players API');
        return { status: 204, message: 'No content', data: { joinedPlayers: [] } };
      }
      
      try {
        const parsedResponse = JSON.parse(text);
        console.log('Joined players API response:', parsedResponse);
        
        // Nếu response không có cấu trúc đúng, trả về danh sách trống
        if (!parsedResponse.data) {
          console.warn('API response missing data property');
          return { status: parsedResponse.status || 200, message: parsedResponse.message || 'No data', data: { joinedPlayers: [] } };
        }
        
        return parsedResponse;
      } catch (jsonErr) {
        console.error('Invalid JSON from joined players API:', text);
        return { status: 500, message: 'Invalid JSON response', data: { joinedPlayers: [] } };
      }
    } catch (error) {
      console.error('Error fetching joined players:', error);
      return { status: 500, message: 'Network error', data: { joinedPlayers: [] } };
    }
  },

  /**
   * Check if a quiz code is valid
   * @param quizCode Code to check
   * @returns Promise with check result
   */
  checkQuizCode: async (quizCode: string | number): Promise<any> => {
    try {
      console.log(`Checking if quiz code ${quizCode} is valid...`);
      
      // Đảm bảo quizCode là một chuỗi số
      const code = quizCode.toString().trim();
      
      // Kiểm tra định dạng mã quiz hợp lệ
      if (!/^\d{6}$/.test(code)) {
        console.error(`Invalid quiz code format: ${code}`);
        return { status: 400, message: 'Invalid quiz code format. Must be 6 digits.' };
      }
      
      // Gọi API kiểm tra code
      console.log(`Making API request to ${API_BASE_URL}/api/Quiz/check-quiz-code/${code}`);
      const response = await fetch(
        `${API_BASE_URL}/api/Quiz/check-quiz-code/${code}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        }
      );
      
      console.log(`API response status: ${response.status}`);
      
      // Nếu không lấy được dữ liệu hoặc server lỗi
      if (!response.ok) {
        console.error(`Quiz code check failed with status: ${response.status}`);
        const errorData = await response.text();
        console.error('Error response:', errorData);
        return { 
          status: response.status, 
          message: `Quiz not found with this code`,
          error: errorData
        };
      }
      
      // Get the raw text response first for debugging
      const rawResponse = await response.text();
      console.log('Raw API response text:', rawResponse);
      
      // Parse if it's valid JSON
      let data;
      try {
        data = rawResponse ? JSON.parse(rawResponse) : null;
        console.log('Parsed quiz code check response:', data);
      } catch (jsonError) {
        console.error('Failed to parse JSON response:', jsonError);
        // Empty response with 200 status could mean the quiz exists but no content
        if (response.ok && !rawResponse) {
          console.log('Empty response with OK status - considering as valid quiz');
          return {
            status: 200,
            message: "Quiz code is valid.",
            data: { quizCode: code }
          };
        }
        return { 
          status: 400, 
          message: "Invalid response format from server",
          error: rawResponse
        };
      }
      
      // Empty objects or arrays might be returned for valid codes in some cases
      if (data && (Object.keys(data).length === 0 || (Array.isArray(data) && data.length === 0))) {
        console.log('Empty object/array response with 200 status - considering as valid quiz');
        return {
          status: 200,
          message: "Quiz code is valid.",
          data: { quizCode: code }
        };
      }
      
      // New improved validation logic
      // If data exists and any of these conditions are true, we consider it valid:
      // 1. Response status is 200
      // 2. Message indicates valid quiz code
      // 3. 'data' property exists and is not null (quiz data was returned)
      if (data) {
        // If the response has status 200, message indicating valid, or non-null data property
        if (
          data.status === 200 || 
          data.message === "Quiz code is valid." ||
          (data.data && data.data !== null)
        ) {
          return data;
        } 
        // Check if the response itself is a quiz object without the standard wrapper
        else if (data.id || data.quizCode || data.title) {
          // It appears the response is a direct quiz object, wrap it in our standard format
          return {
            status: 200,
            message: "Quiz code is valid.",
            data: data  // The entire response is the quiz data
          };
        }
        // Check if the response is truthy but without standard fields - might be a valid simple response
        else if (response.status === 200) {
          console.log('Non-standard success response, treating as valid');
          return {
            status: 200,
            message: "Quiz code is valid.",
            data: { quizCode: code, responseData: data }
          };
        }
      } else if (response.status === 200) {
        // If we got a 200 OK status but no data, consider it valid
        console.log('200 OK with no data - treating as valid quiz code');
        return {
          status: 200,
          message: "Quiz code is valid.",
          data: { quizCode: code }
        };
      }
      
      // If none of the above conditions match, the quiz code is invalid
      console.log('Quiz code check failed - all validation conditions failed');
      return { 
        status: 404, 
        message: "Quiz not found with this code",
        originalResponse: data
      };
    } catch (error: any) {
      console.error('Error checking quiz code:', error);
      return { 
        status: 500, 
        message: `Error checking quiz code: ${error.message || 'Unknown error'}` 
      };
    }
  },

  /**
   * Fallback check if a quiz code is valid by directly attempting to get the quiz
   * @param quizCode Code to check
   * @returns Promise with check result
   */
  fallbackCheckQuizCode: async (quizCode: string | number): Promise<any> => {
    try {
      console.log(`Performing fallback validation for quiz code ${quizCode}...`);
      
      // Normalize the code
      const code = quizCode.toString().trim();
      
      // Try both code endpoints directly
      try {
        console.log(`Trying QuizCode endpoint with ${code}`);
        const response = await fetch(`${API_BASE_URL}/api/Quiz/QuizCode/${code}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log('Fallback check successful via QuizCode endpoint:', data);
          return {
            status: 200,
            message: "Quiz code is valid.",
            data: data
          };
        }
      } catch (e) {
        console.log('First fallback endpoint failed:', e);
      }
      
      // Try the second endpoint
      try {
        console.log(`Trying code endpoint with ${code}`);
        const response = await fetch(`${API_BASE_URL}/api/Quiz/code/${code}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log('Fallback check successful via code endpoint:', data);
          return {
            status: 200,
            message: "Quiz code is valid.",
            data: data
          };
        }
      } catch (e) {
        console.log('Second fallback endpoint failed:', e);
      }
      
      // Both fallbacks failed, quiz likely doesn't exist
      return { 
        status: 404, 
        message: "Quiz not found with this code after fallback checks",
      };
    } catch (error: any) {
      console.error('Error in fallback quiz code check:', error);
      return { 
        status: 500, 
        message: `Error checking quiz code: ${error.message || 'Unknown error'}` 
      };
    }
  },

  /**
   * Join a quiz with team information
   * @param quizId ID of the quiz to join
   * @param playerId ID of the player
   * @param teamName Name of the team to join
   * @param playerData Additional player information
   * @returns Promise with join quiz response
   */
  joinQuizWithTeam: async (quizId: number | string, playerId: number, teamName: string, playerData: any): Promise<any> => {
    try {
      console.log(`Player ${playerId} joining quiz ${quizId} with team ${teamName}...`);
      
      const API_BASE_URL = 'https://kahootclone-f7hkd0hwafgbfrfa.southeastasia-01.azurewebsites.net';
      
      // Format the request body according to backend expectations
      const requestBody = {
        playerDTO: {
          id: playerId,
          playerId: playerId,
          nickname: playerData.name || playerData.nickname || 'Player',
          avatarUrl: playerData.avatar || playerData.avatarUrl || 'alligator',
          score: playerData.score || 0,
          teamName: teamName,
          groupName: teamName,
          quizId: quizId
        }
      };
      
      console.log('Request body for joinQuizWithTeam:', requestBody);
      
      // Try the most direct approach first - just posting to JoinQuiz with playerDTO
      try {
        console.log(`Calling primary JoinQuiz endpoint with player ID ${playerId} and team ${teamName}`);
        const response = await axios.post(
          `${API_BASE_URL}/api/Quiz/JoinQuiz/${quizId}`,
          requestBody,
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
        
        console.log(`Successfully joined quiz ${quizId} with team ${teamName}:`, response.data);
        return response.data;
      } catch (error1: any) {
        console.warn('Primary JoinQuiz endpoint failed:', error1);
        
        // Try with URL parameters in addition to the body
        try {
          console.log(`Trying JoinQuiz with URL params and playerDTO body`);
          const response = await axios.post(
            `${API_BASE_URL}/api/Quiz/JoinQuiz/${quizId}?playerId=${playerId}&teamName=${encodeURIComponent(teamName)}`,
            requestBody,
            {
              headers: {
                'Content-Type': 'application/json'
              }
            }
          );
          
          console.log(`Successfully joined quiz ${quizId} with team ${teamName} using URL params:`, response.data);
          return response.data;
        } catch (error2: any) {
          console.warn('URL params approach failed:', error2);
          
          // Try Group/JoinTeam as a last resort
          try {
            console.log('Trying Group/JoinTeam endpoint as final attempt');
            const response = await axios.post(
              `${API_BASE_URL}/api/Group/JoinTeam?playerId=${playerId}&teamName=${encodeURIComponent(teamName)}&quizId=${quizId}`,
              {
                playerDTO: {
                  id: playerId,
                  playerId: playerId,
                  nickname: playerData.name || playerData.nickname || 'Player',
                  avatarUrl: playerData.avatar || playerData.avatarUrl || 'alligator'
                }
              },
              {
                headers: {
                  'Content-Type': 'application/json'
                }
              }
            );
            
            console.log('Group/JoinTeam succeeded:', response.data);
            return response.data;
          } catch (error3: any) {
            console.warn('All team join methods failed:', error3);
            
            // Return the most relevant error response we have
            if (error1?.response?.data) return error1.response.data;
            if (error2?.response?.data) return error2.response.data;
            if (error3?.response?.data) return error3.response.data;
            
            return {
              status: 500,
              message: "Failed to join team after trying multiple approaches",
              error: error1?.message || "Unknown error"
            };
          }
        }
      }
    } catch (error: any) {
      console.error(`Error joining quiz ${quizId} with team ${teamName}:`, error);
      
      // Return a structured error response to help with debugging
      return { 
        status: error.response?.status || 500,
        message: `Error joining team: ${error.message}`,
        originalError: error.response?.data || error.message
      };
    }
  },

  /**
   * Get formatted quiz results for both solo and team modes
   * @param quizId ID of the quiz
   * @param includeTeamDetails Whether to include detailed team data
   * @returns Promise with formatted quiz results
   */
  getFormattedQuizResults: async (quizId: number, includeTeamDetails: boolean = true): Promise<any> => {
    try {
      console.log(`Getting formatted results for quiz ${quizId}...`);
      
      const API_BASE_URL = 'https://kahootclone-f7hkd0hwafgbfrfa.southeastasia-01.azurewebsites.net';
      
      // First get the quiz to determine the game mode
      let quizData = null;
      try {
        const quizResponse = await fetchWithRetry(() => axios.get(
          `${API_BASE_URL}/api/Quiz/${quizId}`,
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        ));
        
        if (quizResponse.data && quizResponse.data.data) {
          quizData = quizResponse.data.data;
        }
      } catch (quizError) {
        console.warn(`Error fetching quiz data: ${quizError}, attempting alternate approach`);
        
        // Try a second approach to get the quiz
        try {
          const quizResponse = await axios.get(
            `${API_BASE_URL}/api/Quiz/QuizCode/${quizId}`,
            {
              headers: {
                'Content-Type': 'application/json'
              }
            }
          );
          
          if (quizResponse.data && quizResponse.data.data) {
            quizData = quizResponse.data.data;
          }
        } catch (alternateQuizError) {
          console.warn(`Alternative quiz fetch also failed: ${alternateQuizError}`);
          
          // Try to get from session storage
          try {
            const storedQuiz = sessionStorage.getItem('currentQuiz') || localStorage.getItem('currentQuiz');
            if (storedQuiz) {
              quizData = JSON.parse(storedQuiz);
            }
          } catch (storageError) {
            console.warn(`Storage retrieval failed: ${storageError}`);
          }
        }
      }
      
      // If we still don't have quiz data, create a minimal object
      if (!quizData) {
        console.log('Using minimal quiz data as fallback');
        quizData = {
          id: quizId,
          title: `Quiz ${quizId}`,
          description: '',
          gameMode: sessionStorage.getItem('gameMode') || 'solo'
        };
      }
      
      // Determine if this is a team mode quiz
      let isTeamMode = false;
      
      if (quizData.gameMode) {
        const gameModeStr = String(quizData.gameMode).toLowerCase();
        isTeamMode = gameModeStr === 'team' || gameModeStr === '1' || gameModeStr === 'true';
      }
      
      console.log(`Quiz ${quizId} is in ${isTeamMode ? 'team' : 'solo'} mode`);
      
      // Use only the correct endpoint for host results
      let resultsResponse;
      try {
        resultsResponse = await axios.get(
          `${API_BASE_URL}/api/Quiz/ResultQuiz/${quizId}`,
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
      } catch (error) {
        console.warn(`ResultQuiz endpoint failed: ${error}`);
        return {
          status: 404,
          message: 'Could not fetch quiz results',
          data: null
        };
      }
      // Remove all fallback and legacy code for other endpoints
      // Remove all code that fetches joined players, player answers, or uses /api/Player/quiz/{quizId}, /api/PlayerAnswer/QuizAnswers/{quizId}, etc.
      // Only process and format the results from resultsResponse
      let formattedResults = {
        quizTitle: quizData.title,
        quizDescription: quizData.description,
        gameMode: quizData.gameMode,
        players: [] as any[],
        totalQuestions: quizData.questions?.length || 0
      };
      if (resultsResponse?.data?.data) {
        const resultData = resultsResponse.data.data;
        // Use topResultPlayers and resultPlayers if available
        if (resultData.topResultPlayers) {
          formattedResults.players = [
            ...resultData.topResultPlayers.map((player: any) => ({
              id: player.id,
              name: player.nickName,
              avatar: player.avatarURL,
              score: player.score || 0,
              ranking: player.ranking || null,
              isTopPlayer: true
            })),
            ...(resultData.resultPlayers || []).map((player: any) => ({
              id: player.id,
              name: player.nickName,
              avatar: player.avatarURL,
              score: player.score || 0,
              ranking: player.ranking || null,
              isTopPlayer: false
            }))
          ];
        }
      }
      // Sort by score descending
      formattedResults.players = formattedResults.players.sort((a: any, b: any) => (b.score || 0) - (a.score || 0));
      return {
        status: 200,
        message: 'Quiz results retrieved successfully',
        data: formattedResults
      };
    } catch (error: any) {
      console.error(`Error getting formatted quiz results:`, error);
      
      // Try to create a minimal fallback result
      try {
        const fallbackResult = {
          quizTitle: "Quiz",
          quizDescription: "No description available",
          gameMode: "solo",
          players: [] as PlayerResult[],
          totalQuestions: 0
        };
        
        // Try to get some minimal data from localStorage
        const storedPlayerData = localStorage.getItem('currentPlayer');
        if (storedPlayerData) {
          const playerData = JSON.parse(storedPlayerData);
          fallbackResult.players.push({
            id: playerData.playerId || playerData.id || 1,
            name: playerData.name || playerData.nickname || 'Player',
            avatar: playerData.avatar || playerData.avatarUrl || 'alligator',
            score: 0,
            correctAnswers: 0,
            isTopPlayer: true
          } as PlayerResult);
        }
        
        return {
          status: 200, // Return OK status with fallback data
          message: 'Fallback quiz results generated due to API error',
          data: fallbackResult
        };
      } catch (fallbackError) {
        // If even fallback fails, return the original error
        return {
          status: error.response?.status || 500,
          message: `Error getting quiz results: ${error.message}`,
          data: null
        };
      }
    }
  },

  /**
   * Get quiz results specifically for a single player
   * @param quizId ID of the quiz
   * @param playerId ID of the player to get results for
   * @returns Promise with player's quiz results
   */
  getPlayerQuizResult: async (quizId: number, playerId: number): Promise<any> => {
    try {
      console.log(`Getting results for player ${playerId} in quiz ${quizId}...`);
      
      // First try the official player results endpoint
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/Quiz/Player/ResultQuiz/${quizId}?PlayerId=${playerId}`,
          {
            headers: {
              'Accept': 'application/json'
            }
          }
        );
        
        if (response.data && response.data.status === 200) {
          console.log('Successfully retrieved player results from official endpoint');
          return {
            status: 200,
            message: 'Player results retrieved successfully',
            data: response.data.data
          };
        }
      } catch (error: any) {
        console.warn(`Official player results endpoint failed (${error.response?.status}): ${error.message}`);
      }
      
      // NEW - Try the endpoint without query parameters, using URL path instead
      try {
        console.log(`Trying player results with URL path instead of query params`);
        const response = await axios.get(
          `${API_BASE_URL}/api/Quiz/ResultQuiz/${quizId}/player/${playerId}`,
          {
            headers: {
              'Accept': 'application/json'
            }
          }
        );
        
        if (response.data && response.data.status === 200) {
          console.log('Successfully retrieved player results from path-based endpoint');
          return {
            status: 200,
            message: 'Player results retrieved successfully',
            data: response.data.data
          };
        }
      } catch (error: any) {
        console.warn(`Path-based player results endpoint failed (${error.response?.status}): ${error.message}`);
      }
      
      // If official endpoint fails, get the formatted quiz results and filter for this player
      console.log('Trying to extract player results from full quiz results');
      const quizResults = await quizService.getFormattedQuizResults(quizId, true);
      
      if (quizResults.status === 200 && quizResults.data) {
        const resultData = quizResults.data;
        
        // Find the player in the players array
        if (resultData.players && resultData.players.length > 0) {
          const playerResult = resultData.players.find((player: any) => 
            player.id === playerId || player.playerId === playerId
          );
          
          if (playerResult) {
            console.log('Found player in quiz results:', playerResult);
            
            // Format the result to match expected interface
            const formattedResult = {
              playerId: playerId,
              nickname: playerResult.name || playerResult.nickname || 'Player',
              avatarUrl: playerResult.avatar || playerResult.avatarUrl || 'alligator',
              score: playerResult.score || 0,
              correctAnswers: playerResult.correctAnswers || 0,
              totalQuestions: resultData.totalQuestions || playerResult.totalQuestions || 0,
              quizId: quizId,
              quizTitle: resultData.quizTitle || '',
              teamName: playerResult.teamName || playerResult.groupName || null,
              gameMode: resultData.gameMode || 'solo'
            };
            
            return {
              status: 200,
              message: 'Player results extracted from quiz results',
              data: formattedResult
            };
          }
        }
      }
      
      // If still no results, try to get results from player answers
      console.log('Trying to build results from player answers');
      
      // Get the player's answers for this quiz
      try {
        // Get player answers for this quiz
        const answersResponse = await axios.get(
          `${API_BASE_URL}/api/PlayerAnswer/PlayerAnswers/${playerId}/${quizId}`,
          {
            headers: {
              'Accept': 'application/json'
            }
          }
        );
        
        // Try to get quiz information for context
        let quizData = { title: `Quiz ${quizId}`, gameMode: 'solo' };
        try {
          const quizResponse = await quizService.getQuizById(quizId);
          if (quizResponse && quizResponse.data) {
            quizData = quizResponse.data;
          }
        } catch (quizError) {
          console.warn('Failed to get quiz data:', quizError);
        }
        
        // Get player info
        let playerData = { nickname: 'Player', avatarUrl: 'alligator', groupName: null, teamName: null };
        try {
          const playerResponse = await axios.get(
            `${API_BASE_URL}/api/Player/${playerId}`,
            {
              headers: {
                'Accept': 'application/json'
              }
            }
          );
          
          if (playerResponse.data && playerResponse.data.data) {
            playerData = playerResponse.data.data;
          }
        } catch (playerError) {
          console.warn('Failed to get player data:', playerError);
          
          // Try to use data from localStorage if API failed
          try {
            const storedPlayerData = localStorage.getItem('currentPlayer');
            if (storedPlayerData) {
              const parsedData = JSON.parse(storedPlayerData);
              playerData = {
                ...playerData,
                nickname: parsedData.name || parsedData.nickname || playerData.nickname,
                avatarUrl: parsedData.avatar || parsedData.avatarUrl || playerData.avatarUrl,
                groupName: parsedData.groupName || parsedData.teamName || playerData.groupName,
                teamName: parsedData.teamName || parsedData.groupName || playerData.teamName
              };
            }
          } catch (localStorageError) {
            console.warn('Failed to get player data from localStorage:', localStorageError);
          }
        }
        
        if (answersResponse.data && answersResponse.data.data) {
          const answers = answersResponse.data.data;
          console.log(`Found ${answers.length} answers for player ${playerId}`);
          
          // Calculate metrics
          const correctAnswers = answers.filter((a: any) => a.isCorrect).length;
          const totalScore = answers.reduce((sum: number, a: any) => sum + (a.score || 0), 0);
          
          // Create synthesized result
          const synthesizedResult = {
            playerId: playerId,
            nickname: playerData.nickname || 'Player',
            avatarUrl: playerData.avatarUrl || 'alligator',
            score: totalScore,
            correctAnswers: correctAnswers,
            totalQuestions: answers.length,
            quizId: quizId,
            quizTitle: quizData.title || '',
            teamName: playerData.groupName || playerData.teamName || null,
            gameMode: quizData.gameMode || 'solo',
            answers: answers
          };
          
          return {
            status: 200,
            message: 'Player results synthesized from answers',
            data: synthesizedResult
          };
        }
      } catch (answersError) {
        console.warn('Failed to get player answers:', answersError);
      }
      
      // Try to get data from local storage as a final fallback
      console.log('Trying local storage for player results as final fallback');
      try {
        const storedAnswers = localStorage.getItem('playerAnswers');
        const storedPlayerData = localStorage.getItem('currentPlayer');
        
        if (storedAnswers && storedPlayerData) {
          const answers = JSON.parse(storedAnswers);
          const playerData = JSON.parse(storedPlayerData);
          
          // Filter answers for this specific player and quiz
          const relevantAnswers = answers.filter((a: any) => 
            a.playerId === playerId && (a.quizId === quizId || !a.quizId)
          );
          
          if (relevantAnswers.length > 0) {
            const correctCount = relevantAnswers.filter((a: any) => a.isCorrect).length;
            const totalScore = relevantAnswers.reduce((sum: number, a: any) => sum + (a.score || 0), 0);
            
            return {
              status: 200,
              message: 'Player results retrieved from local storage',
              data: {
                playerId: playerId,
                nickname: playerData.name || playerData.nickname || 'Player',
                avatarUrl: playerData.avatar || playerData.avatarUrl || 'alligator',
                score: totalScore,
                correctAnswers: correctCount,
                totalQuestions: relevantAnswers.length,
                quizId: quizId,
                answers: relevantAnswers
              }
            };
          }
        }
      } catch (localStorageError) {
        console.warn('Failed to use local storage data:', localStorageError);
      }
      
      // If all else fails, return an empty result
      return {
        status: 404,
        message: `Could not find results for player ${playerId} in quiz ${quizId}`,
        data: null
      };
    } catch (error: any) {
      console.error('Error in getPlayerQuizResult:', error);
      
      return {
        status: error.response?.status || 500,
        message: `Error getting player quiz results: ${error.message}`,
        data: null
      };
    }
  },

  /**
   * Fetch quiz results specifically for host view with multiple fallback strategies
   * @param quizId ID of the quiz
   * @returns Promise with formatted quiz results for host view
   */
  fetchQuizForHost: async (quizId: number): Promise<any> => {
    try {
      console.log(`Fetching host view results for quiz ${quizId}...`);
      
      // First try the formatted results function which has internal fallbacks
      try {
        const formattedResults = await quizService.getFormattedQuizResults(quizId, true);
        if (formattedResults && formattedResults.status === 200 && formattedResults.data) {
          console.log('Using formatted quiz results for host view');
          return {
            status: 200,
            message: 'Host quiz results retrieved successfully',
            data: formattedResults.data
          };
        }
      } catch (error) {
        console.warn('getFormattedQuizResults failed for host view:', error);
      }
      
      // Try making direct API calls with multiple backups
      // First, try the new /api/Quiz/ResultQuiz/{quizId} endpoint
      try {
        console.log('Trying direct ResultQuiz endpoint for host view');
        
        const response = await axios.get(
          `${API_BASE_URL}/api/Quiz/ResultQuiz/${quizId}`,
          {
            headers: {
              'Accept': 'application/json'
            }
          }
        );
        
        if (response.data && response.data.status === 200 && response.data.data) {
          console.log('Host view obtained from ResultQuiz endpoint');
          
          // Process the response according to its format
          const resultData = response.data.data;
          
          // Get quiz metadata if needed
          let quizData: { 
            title: string; 
            description: string; 
            questions?: any[]; 
            gameMode?: string;
          } = { 
            title: `Quiz ${quizId}`, 
            description: '',
            questions: []
          };
          
          try {
            const quizResponse = await axios.get(
              `${API_BASE_URL}/api/Quiz/${quizId}`,
              {
                headers: {
                  'Accept': 'application/json'
                }
              }
            );
            
            if (quizResponse.data && quizResponse.data.data) {
              quizData = quizResponse.data.data;
            }
          } catch (quizError) {
            console.warn('Failed to get quiz details, using minimal data:', quizError);
          }
          
          // Determine if we're in team mode
          const hasTopGroups = resultData.topGroups && Array.isArray(resultData.topGroups);
          const hasPlayers = resultData.players && Array.isArray(resultData.players);
          const gameMode = hasTopGroups ? 'team' : 'solo';
          
          // Format players or teams according to game mode
          let formattedPlayers = [];
          if (gameMode === 'team' && hasTopGroups) {
            // Team mode - get team data
            const teams = [
              ...(resultData.topGroups || []).map((t: any) => ({ ...t, isTopTeam: true })),
              ...(resultData.normalGroups || []).map((t: any) => ({ ...t, isTopTeam: false }))
            ];
            
            // Extract players from teams if available
            if (hasPlayers) {
              formattedPlayers = resultData.players.map((p: any) => {
                // Get team info from player data
                const team = p.groupMembers && p.groupMembers.length > 0 
                  ? p.groupMembers[0].group
                  : null;
                  
                return {
                  id: p.id,
                  name: p.nickname,
                  avatar: p.avatarUrl,
                  score: p.score || 0,
                  teamName: team?.name || null
                };
              });
            }
            
            return {
              status: 200,
              message: 'Host team results retrieved successfully',
              data: {
                quizTitle: quizData.title,
                quizDescription: quizData.description,
                gameMode: 'team',
                teams: teams,
                players: formattedPlayers,
                totalQuestions: quizData.questions?.length || 0
              }
            };
          } else if (resultData.topPlayers && Array.isArray(resultData.topPlayers)) {
            // Solo mode with separate top/normal players
            formattedPlayers = [
              ...(resultData.topPlayers || []).map((p: any) => ({ ...p, isTopPlayer: true })),
              ...(resultData.normalPlayers || []).map((p: any) => ({ ...p, isTopPlayer: false }))
            ];
          } else if (hasPlayers) {
            // Solo mode with just a players array
            formattedPlayers = resultData.players.map((p: any) => ({
              id: p.id,
              name: p.nickname || p.name,
              avatar: p.avatarUrl || p.avatar,
              score: p.score || 0,
              isTopPlayer: false
            }));
          } else if (Array.isArray(resultData)) {
            // Results directly as array
            formattedPlayers = resultData.map((p: any) => ({
              id: p.id || p.playerId,
              name: p.nickname || p.name,
              avatar: p.avatarUrl || p.avatar,
              score: p.score || 0,
              isTopPlayer: false
            }));
          }
          
          return {
            status: 200,
            message: 'Host quiz results retrieved successfully',
            data: {
              quizTitle: quizData.title,
              quizDescription: quizData.description,
              gameMode: 'solo',
              players: formattedPlayers,
              totalQuestions: quizData.questions?.length || 0
            }
          };
        }
      } catch (resultQuizError) {
        console.warn('Direct ResultQuiz endpoint failed:', resultQuizError);
      }
      
      // Try to build a minimal result set using JoinedPlayers endpoint
      try {
        console.log('Trying to build host view from joined players');
        
        const playersResponse = await axios.get(
          `${API_BASE_URL}/api/Quiz/JoinedPlayers/${quizId}`,
          {
            headers: {
              'Accept': 'application/json'
            }
          }
        );
        
        if (playersResponse.data && playersResponse.data.data?.joinedPlayers) {
          const joinedPlayers = playersResponse.data.data.joinedPlayers;
          
          console.log(`Found ${joinedPlayers.length} joined players for quiz ${quizId}`);
          
          // Get the quiz data for title/description
          const quizResponse = await axios.get(
            `${API_BASE_URL}/api/Quiz/${quizId}`,
            {
              headers: {
                'Accept': 'application/json'
              }
            }
          );
          
          const quizData = quizResponse.data?.data || { title: 'Quiz', description: '', questions: [] };
          
          // Format players data
          const formattedPlayers = joinedPlayers.map((player: any) => ({
            id: player.id,
            name: player.nickName || player.nickname,
            avatar: player.avatarUrl,
            score: player.score || 0,
            correctAnswers: player.correctAnswers || 0,
            teamName: player.groupName || player.teamName || null
          }));
          
          // Determine game mode
          const hasTeams = formattedPlayers.some((p: any) => p.teamName);
          
          return {
            status: 200,
            message: 'Host quiz results synthesized from joined players',
            data: {
              quizTitle: quizData.title,
              quizDescription: quizData.description,
              gameMode: hasTeams ? 'team' : 'solo',
              players: formattedPlayers,
              totalQuestions: quizData.questions?.length || 0
            }
          };
        }
      } catch (playersError) {
        console.warn('Failed to build host view from joined players:', playersError);
      }
      
      // Try to build host view from local storage as last resort
      try {
        console.log('Trying to build host view from localStorage data');
        
        const storedQuiz = sessionStorage.getItem('currentQuiz') || localStorage.getItem('currentQuiz');
        const storedAnswers = localStorage.getItem('playerAnswers');
        const storedPlayerData = localStorage.getItem('currentPlayer');
        
        if (storedQuiz) {
          const quizData = JSON.parse(storedQuiz);
          let players = [];
          
          // If we have player answers, use them to build player data
          if (storedAnswers && storedPlayerData) {
            const answers = JSON.parse(storedAnswers);
            const playerData = JSON.parse(storedPlayerData);
            
            // Calculate scores from answers
            const playersByScore: Record<string, any> = {};
            answers.forEach((answer: any) => {
              const playerId = answer.playerId;
              if (!playersByScore[playerId]) {
                playersByScore[playerId] = {
                  id: playerId,
                  score: 0,
                  correctAnswers: 0,
                  totalAnswers: 0
                };
              }
              
              playersByScore[playerId].totalAnswers++;
              if (answer.isCorrect) {
                playersByScore[playerId].correctAnswers++;
              }
              playersByScore[playerId].score += (answer.score || 0);
            });
            
            // Convert to array and add player info
            players = Object.values(playersByScore).map((p: any) => ({
              ...p,
              name: playerData.name || playerData.nickname || 'Player',
              avatar: playerData.avatar || playerData.avatarUrl || 'alligator',
              teamName: playerData.teamName || playerData.groupName || null
            }));
          }
          
          return {
            status: 200,
            message: 'Host view created from localStorage data',
            data: {
              quizTitle: quizData.title || `Quiz ${quizId}`,
              quizDescription: quizData.description || '',
              gameMode: quizData.gameMode || 'solo',
              players: players,
              totalQuestions: quizData.questions?.length || 0
            }
          };
        }
      } catch (localStorageError) {
        console.warn('Failed to build host view from localStorage:', localStorageError);
      }
      
      // If all else fails, create a minimal host view
      return {
        status: 200,
        message: 'Minimal host view created due to API failures',
        data: {
          quizTitle: 'Quiz Results',
          quizDescription: 'Could not retrieve detailed quiz results',
          gameMode: 'solo',
          players: [],
          totalQuestions: 0
        }
      };
    } catch (error) {
      console.error('Error in fetchQuizForHost:', error);
      
      return {
        status: 500,
        message: `Error fetching host quiz results: ${error instanceof Error ? error.message : String(error)}`,
        data: null
      };
    }
  }
};

export default quizService;