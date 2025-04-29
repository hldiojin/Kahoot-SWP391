import axios from 'axios';
import groupService from './groupService';

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
        gameMode: ["solo", "team"].includes(quizData.gameMode) ? quizData.gameMode : 'solo'
      };

      // Log dữ liệu gửi đi
      console.log('Creating quiz with data:', createRequest);

      // Sử dụng URL hardcoded để đảm bảo
      const response = await axios.post(
        'https://kahootclone-f7hkd0hwafgbfrfa.southeastasia-01.azurewebsites.net/api/Quiz', 
        createRequest,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Log response để debug
      console.log("Quiz creation successful response:", response);
      
      // If quiz is in team mode and creation was successful, create the teams
      if (createRequest.gameMode === 'team' && response.data && response.data.status === 201) {
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
        
        // Thử lại với bộ dữ liệu tối thiểu nếu lỗi 500
        if (error.response.status === 500) {
          try {
            console.log("Retrying with minimal data set");
            
            const minimalRequest = {
              title: quizData.title || "Untitled Quiz",
              description: quizData.description || "",
              createdBy: 1,
              categoryId: 1,
              isPublic: true,
              quizCode: quizService.generateQuizCode(),
              createdAt: new Date().toISOString(),
              maxPlayer: 50,
              minPlayer: 1,
              favorite: false,
              gameMode: "solo"
            };
            
            console.log("Minimal request:", minimalRequest);
            
            const token = localStorage.getItem('token');
            const retryResponse = await axios.post(
              'https://kahootclone-f7hkd0hwafgbfrfa.southeastasia-01.azurewebsites.net/api/Quiz', 
              minimalRequest,
              {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              }
            );
            
            console.log("Retry successful:", retryResponse);
            return retryResponse.data;
          } catch (retryError) {
            console.error("Retry also failed:", retryError);
          }
        }
        
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

      const response = await axios.get(
        `${API_BASE_URL}/api/Quiz`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
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

      const response = await axios.get(
        `${API_BASE_URL}/api/Quiz/${quizId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error(`Error fetching quiz with ID ${quizId}:`, error);
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
        const response = await axios.get(
          `${API_BASE_URL}/api/Quiz/QuizCode/${quizCode}`
        );
        return response.data;
      } catch (publicError) {
        // If public endpoint fails, try with authentication
        const token = localStorage.getItem('token');
        if (token) {
          const response = await axios.get(
            `${API_BASE_URL}/api/Quiz/QuizCode/${quizCode}`,
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
    } catch (error) {
      console.error(`Error fetching quiz with code ${quizCode} from QuizCode endpoint:`, error);
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

      const response = await axios.put(
        `${API_BASE_URL}/api/Quiz/${quizId}`,
        quizData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error(`Error updating quiz with ID ${quizId}:`, error);
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

      const response = await axios.delete(
        `${API_BASE_URL}/api/Quiz/${quizId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error(`Error deleting quiz with ID ${quizId}:`, error);
      throw error;
    }
  },

  /**
   * Generate a random quiz code (6 digits)
   * @returns A 6-digit number
   */
  generateQuizCode: (): number => {
    return Math.floor(100000 + Math.random() * 900000);
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
  }
};

export default quizService;