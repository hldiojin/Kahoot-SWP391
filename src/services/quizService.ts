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
  thumbnailUrl: string;
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
  createQuiz: async (quizData: QuizData): Promise<QuizResponse> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token is missing');
      }

      const response = await axios.post(
        `${API_BASE_URL}/api/Quiz`, 
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
      console.error('Error creating quiz:', error);
      throw error;
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
  }
};

export default quizService; 