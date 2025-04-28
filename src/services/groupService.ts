import axios from 'axios';
import authService from './authService';

const API_BASE_URL = 'https://kahootclone-f7hkd0hwafgbfrfa.southeastasia-01.azurewebsites.net';

/**
 * Interface for group/team data
 */
interface GroupData {
  id: number;
  name: string;
  description: string;
  rank: number;
  maxMembers: number;
  totalPoint: number;
  createdBy: number;
  createdAt: string;
  quizId?: number;
}

/**
 * Interface for group response from API
 */
interface GroupResponse {
  data: any;
  message: string;
  status: number;
}

/**
 * Service for managing teams/groups in the quiz application
 */
const groupService = {
  /**
   * Create a new team/group
   * @param groupData Group data to create
   * @returns Promise with group creation response
   */
  createGroup: async (groupData: GroupData): Promise<GroupResponse> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token is missing');
      }

      // Get current user ID
      const currentUser = authService.getCurrentUser();
      if (!currentUser || !currentUser.id) {
        throw new Error('User not authenticated');
      }

      // Ensure required fields are present
      if (!groupData.name || !groupData.description || !groupData.quizId) {
        throw new Error('Missing required fields for group creation');
      }

      const response = await axios.post(
        `${API_BASE_URL}/api/groups`,
        {
          ...groupData,
          id: 0, // Let server generate ID
          createdAt: new Date().toISOString(),
          totalPoint: 0,
          rank: groupData.rank || 1,
          createdBy: currentUser.id // Use current user's ID
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Error creating group:', error);
      
      if (error.response) {
        throw new Error(`Server error: ${error.response.data?.message || error.message}`);
      } else if (error.request) {
        throw new Error('No response from server. Please check your connection.');
      } else {
        throw error;
      }
    }
  },

  /**
   * Create multiple teams for a quiz
   * @param quizId ID of the quiz
   * @param teamCount Number of teams to create
   * @param membersPerTeam Maximum members per team
   * @returns Promise with array of team creation responses
   */
  createTeamsForQuiz: async (quizId: number, teamCount: number = 4, membersPerTeam: number = 5, createdBy: number): Promise<any[]> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token is missing');
      }

      // Get current user ID
      const currentUser = authService.getCurrentUser();
      if (!currentUser || !currentUser.id) {
        throw new Error('User not authenticated');
      }

      // Get current date formatted for API
      const currentDate = new Date().toISOString();

      // Define team names based on count
      const teamNames = [
        'Red Team',
        'Blue Team',
        'Green Team',
        'Yellow Team'
      ];

      // Create multiple teams
      const teamPromises = teamNames.map((teamName, index) => {
        const teamData: GroupData = {
          id: 0, // Server will assign real ID
          name: teamName,
          description: `${teamName} for quiz ${quizId}`,
          rank: index + 1,
          maxMembers: membersPerTeam,
          totalPoint: 0,
          createdBy: currentUser.id, // Use current user's ID
          createdAt: currentDate,
          quizId: quizId // Associate with the quiz
        };

        return groupService.createGroup(teamData);
      });

      // Wait for all team creation requests to complete
      const results = await Promise.allSettled(teamPromises);
      
      console.log(`Created ${teamCount} teams for quiz ${quizId}`);
      
      // Return successful responses
      const successfulTeams = results
        .filter(result => result.status === 'fulfilled')
        .map((result: any) => result.value.data);
      
      // Also log any failures
      results
        .filter(result => result.status === 'rejected')
        .forEach((result: any, index) => {
          console.error(`Failed to create team ${teamNames[index]}:`, result.reason);
        });
      
      // Save team names to localStorage for reference in the play screen
      localStorage.setItem(`quizTeams_${quizId}`, JSON.stringify(teamNames));
      
      return successfulTeams;
    } catch (error) {
      console.error('Error creating teams for quiz:', error);
      throw error;
    }
  },
  
  /**
   * Get all groups/teams
   * @returns Promise with all groups
   */
  getAllGroups: async (): Promise<GroupResponse> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token is missing');
      }

      const response = await axios.get(
        `${API_BASE_URL}/api/groups`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error fetching groups:', error);
      throw error;
    }
  },

  /**
   * Get groups/teams for a specific quiz
   * @param quizId ID of the quiz
   * @returns Promise with groups for the quiz
   */
  getGroupsByQuizId: async (quizId: number): Promise<GroupResponse> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token is missing');
      }

      const response = await axios.get(
        `${API_BASE_URL}/api/groups/quiz/${quizId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error(`Error fetching groups for quiz ${quizId}:`, error);
      throw error;
    }
  },

  /**
   * Get a specific group by ID
   * @param groupId ID of the group to fetch
   * @returns Promise with group data
   */
  getGroupById: async (groupId: number): Promise<GroupResponse> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token is missing');
      }

      const response = await axios.get(
        `${API_BASE_URL}/api/groups/${groupId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error(`Error fetching group with ID ${groupId}:`, error);
      throw error;
    }
  },

  /**
   * Update a group
   * @param groupId ID of the group to update
   * @param groupData Updated group data
   * @returns Promise with updated group data
   */
  updateGroup: async (groupId: number, groupData: Partial<GroupData>): Promise<GroupResponse> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token is missing');
      }

      const response = await axios.put(
        `${API_BASE_URL}/api/groups/${groupId}`,
        groupData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error(`Error updating group with ID ${groupId}:`, error);
      throw error;
    }
  },

  /**
   * Delete a group
   * @param groupId ID of the group to delete
   * @returns Promise with deletion response
   */
  deleteGroup: async (groupId: number): Promise<GroupResponse> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token is missing');
      }

      const response = await axios.delete(
        `${API_BASE_URL}/api/groups/${groupId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error(`Error deleting group with ID ${groupId}:`, error);
      throw error;
    }
  }
};

export default groupService; 