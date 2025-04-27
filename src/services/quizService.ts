import axios from 'axios';

const API_BASE_URL = 'https://kahootclone-f7hkd0hwafgbfrfa.southeastasia-01.azurewebsites.net';

interface QuizData {
  id: number;
  title: string;
  quizCode: number;
  description: string;
  createdBy: number;
  categoryId: number;
  isPublic: boolean;
  thumbnailUrl: string | null; // Allow null for thumbnailUrl
  createdAt: string;
}

// Add a simpler interface for creating a quiz
interface CreateQuizRequest {
  title: string;
  description: string;
  createdBy: number;
  categoryId: number;
  isPublic: boolean;
  thumbnailUrl?: string | null; // Optional
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

      // Tạo request object với đầy đủ các trường cần thiết
      const createRequest = {
        title: quizData.title,
        description: quizData.description,
        createdBy: quizData.createdBy,
        categoryId: quizData.categoryId,
        isPublic: quizData.isPublic,
        thumbnailUrl: quizData.thumbnailUrl || null,
        createdAt: quizData.createdAt || new Date().toISOString(),
        quizCode: quizCode // Thêm trường quizCode
      };

      // Log dữ liệu gửi đi
      console.log('Creating quiz with data:', createRequest);

      const response = await axios.post(
        `${API_BASE_URL}/api/Quiz`, 
        createRequest,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data;
    } catch (error: any) {
      console.error('Error creating quiz:', error);
      
      // Log chi tiết response error
      if (error.response) {
        console.error('Server error status:', error.response.status);
        console.error('Full server error data:', error.response.data);
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
   * Get a quiz by its quiz code
   * @param quizCode Code of the quiz to fetch
   * @returns Promise with quiz data
   */
  getQuizByCode: async (quizCode: string): Promise<QuizResponse> => {
    try {
      console.log(`Đang tìm quiz với mã: ${quizCode}`);
      
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
    } catch (error) {
      console.error(`Error fetching quiz with code ${quizCode}:`, error);
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
   * @returns Formatted quiz data
   */
  formatQuizData: (
    title: string,
    description: string,
    categoryId: number = 1,
    isPublic: boolean = true,
    thumbnailUrl: string = 'https://placehold.co/600x400?text=Quiz'
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
      createdAt: new Date().toISOString() // Đảm bảo sử dụng định dạng ISO cho createdAt
    };
  }
};

export default quizService;