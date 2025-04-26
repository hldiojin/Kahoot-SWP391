import axios from 'axios';

const API_BASE_URL = 'https://kahootclone-f7hkd0hwafgbfrfa.southeastasia-01.azurewebsites.net';

interface QuestionData {
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

interface QuestionResponse {
  data: any;
  message: string;
  status: number;
}

const questionService = {
  /**
   * Create a new question
   * @param questionData Question data to be created
   * @returns Promise with question creation response
   */
  createQuestion: async (questionData: QuestionData): Promise<QuestionResponse> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token is missing');
      }

      const response = await axios.post(
        `${API_BASE_URL}/api/questions`, 
        questionData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error creating question:', error);
      throw error;
    }
  },

  /**
   * Get all questions for a quiz
   * @param quizId ID of the quiz to fetch questions for
   * @returns Promise with all questions for the quiz
   */
  getQuestionsByQuizId: async (quizId: number): Promise<QuestionResponse> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token is missing');
      }

      const response = await axios.get(
        `${API_BASE_URL}/api/questions/quiz/${quizId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error(`Error fetching questions for quiz ID ${quizId}:`, error);
      throw error;
    }
  },

  /**
   * Update an existing question
   * @param questionId ID of the question to update
   * @param questionData Updated question data
   * @returns Promise with updated question data
   */
  updateQuestion: async (questionId: number, questionData: QuestionData): Promise<QuestionResponse> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token is missing');
      }

      const response = await axios.put(
        `${API_BASE_URL}/api/questions/${questionId}`,
        questionData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error(`Error updating question with ID ${questionId}:`, error);
      throw error;
    }
  },

  /**
   * Delete a question
   * @param questionId ID of the question to delete
   * @returns Promise with deletion response
   */
  deleteQuestion: async (questionId: number): Promise<QuestionResponse> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token is missing');
      }

      const response = await axios.delete(
        `${API_BASE_URL}/api/questions/${questionId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error(`Error deleting question with ID ${questionId}:`, error);
      throw error;
    }
  },

  /**
   * Format a Question from the frontend model to the API model
   * @param question Frontend question model
   * @param quizId ID of the quiz this question belongs to
   * @param arrange Order/position of the question
   * @returns Formatted question for the API
   */
  formatQuestionForApi: (
    question: any,
    quizId: number,
    arrange: number
  ): QuestionData => {
    // Find which answer is marked as correct
    let correctAnswerIndex = -1;
    if (Array.isArray(question.answers)) {
      correctAnswerIndex = question.answers.findIndex((a: any) => a.isCorrect);
    }

    // Map correct answer to the string format expected by the API
    let isCorrect = 'A'; // Default to A if nothing is selected
    if (correctAnswerIndex >= 0) {
      isCorrect = String.fromCharCode(65 + correctAnswerIndex); // A, B, C, or D
    }

    return {
      id: 0, // Use 0 for new questions, will be assigned by the server
      quizId: quizId,
      text: question.text || '',
      type: question.questionType || 'multiple-choice',
      optionA: question.answers && question.answers.length > 0 ? question.answers[0].text || '' : '',
      optionB: question.answers && question.answers.length > 1 ? question.answers[1].text || '' : '',
      optionC: question.answers && question.answers.length > 2 ? question.answers[2].text || '' : '',
      optionD: question.answers && question.answers.length > 3 ? question.answers[3].text || '' : '',
      isCorrect: isCorrect,
      score: question.points || 100,
      flag: true, // Default to true, assuming this means the question is active
      timeLimit: question.timeLimit || 30,
      arrange: arrange
    };
  }
};

export default questionService; 