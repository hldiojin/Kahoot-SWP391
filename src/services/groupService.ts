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
 * Interface for group member data
 */
interface GroupMemberData {
  groupId: number;
  playerId: number;
  rank?: number;
  totalScore?: number;
  joinedAt?: string;
  status?: string;
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
        throw new Error('Authentication token not found');
      }

      // Get current user ID
      const currentUser = authService.getCurrentUser();
      if (!currentUser || !currentUser.id) {
        throw new Error('User information not found');
      }

      // Ensure required fields are present
      if (!groupData.name || !groupData.description || !groupData.quizId) {
        throw new Error('Missing required fields: name, description, or quizId');
      }
      
      // Check if this group already exists to prevent duplicate creation
      const groupKey = `group_created_${groupData.quizId}_${groupData.name}`;
      const groupAlreadyCreated = sessionStorage.getItem(groupKey);
      
      if (groupAlreadyCreated) {
        console.log(`Group "${groupData.name}" was already created, returning cached response`);
        return JSON.parse(groupAlreadyCreated);
      }

      console.log(`Creating group "${groupData.name}" for quiz ${groupData.quizId}`);
      
      const response = await axios.post(
        `${API_BASE_URL}/api/groups`,
        {
          groupId: 0, 
          name: groupData.name,          
          description: groupData.description,
          rank: groupData.rank || 1,
          maxMembers: groupData.maxMembers || 5,
          totalPoint: 0,
          createdBy: currentUser.id,
          createdAt: new Date().toISOString()
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Store the created group in session storage to prevent duplicate creation
      if (response.data && response.data.data) {
        // Store the response with the actual groupId from the server
        sessionStorage.setItem(groupKey, JSON.stringify(response.data));
        
        // Also store a mapping of group name to groupId for quick lookup
        if (response.data.data.id) {
          sessionStorage.setItem(`group_id_${groupData.name}_${groupData.quizId}`, response.data.data.id.toString());
        }
      }

      return response.data;
    } catch (error: any) {
      console.error('Error creating group:', error);
      
      if (error.response) {
        console.error('API error response:', error.response.data);
        return error.response.data;
      } else if (error.request) {
        console.error('No response received:', error.request);
        return { data: null, message: 'No response from server', status: 500 };
      } else {
        console.error('Request error:', error.message);
        return { data: null, message: error.message, status: 500 };
      }
    }
  },

  /**
   * Create a new team/group directly without checking for existing ones
   * @param groupData Group data to create
   * @returns Promise with group creation response
   */
  createGroupDirectly: async (groupData: GroupData): Promise<GroupResponse> => {
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

      console.log(`Directly creating group "${groupData.name}" for quiz ${groupData.quizId}`);
      
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
      console.error('Error creating group directly:', error);
      
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
      
      // Check if teams have already been created for this quiz
      const teamsCreatedKey = `teams_created_for_quiz_${quizId}`;
      const teamsAlreadyCreated = sessionStorage.getItem(teamsCreatedKey);
      
      if (teamsAlreadyCreated) {
        console.log(`Teams have already been created for quiz ${quizId}, returning cached data`);
        try {
          const cachedTeams = JSON.parse(teamsAlreadyCreated);
          return cachedTeams;
        } catch (e) {
          console.warn('Error parsing cached teams data:', e);
          // Continue with creation as fallback
        }
      }
      
      // First check if any teams already exist for this quiz
      try {
        const existingTeams = await groupService.getGroupsByQuizId(quizId);
        if (existingTeams && existingTeams.data && Array.isArray(existingTeams.data) && existingTeams.data.length > 0) {
          console.log(`Found ${existingTeams.data.length} existing teams for quiz ${quizId}, skipping team creation`);
          
          // Store teams in session storage
          sessionStorage.setItem(teamsCreatedKey, JSON.stringify(existingTeams.data));
          
          return existingTeams.data;
        }
      } catch (checkError) {
        console.warn('Error checking for existing teams:', checkError);
        // Continue with team creation
      }

      // Get current date formatted for API
      const currentDate = new Date().toISOString();

      // Define team names based on count
      const teamNames = [
        'Red Team',
        'Blue Team',
        'Green Team',
        'Yellow Team'
      ].slice(0, teamCount);

      // Create multiple teams with delay between requests
      const teamResults: any[] = [];
      
      for (let index = 0; index < teamNames.length; index++) {
        const teamName = teamNames[index];
        
        // Check if this specific team already exists
        const groupKey = `group_created_${quizId}_${teamName}`;
        const groupAlreadyCreated = sessionStorage.getItem(groupKey);
        
        if (groupAlreadyCreated) {
          console.log(`Team "${teamName}" for quiz ${quizId} already exists, skipping creation`);
          try {
            const cachedData = JSON.parse(groupAlreadyCreated);
            teamResults.push(cachedData);
            continue;
          } catch (e) {
            console.warn('Error parsing cached team data:', e);
            // Continue with creation
          }
        }
        
        try {
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
          
          console.log(`Creating team "${teamName}" for quiz ${quizId}`);
          
          // Add delay between requests to avoid race conditions
          if (index > 0) {
            await new Promise(resolve => setTimeout(resolve, 300)); // 300ms delay
          }
          
          const response = await groupService.createGroup(teamData);
          
          if (response && response.data) {
            teamResults.push(response.data);
          }
        } catch (error) {
          console.error(`Failed to create team ${teamNames[index]}:`, error);
        }
      }
      
      console.log(`Created ${teamResults.length} teams for quiz ${quizId}`);
      
      // Save teams to session storage
      sessionStorage.setItem(teamsCreatedKey, JSON.stringify(teamResults));
      
      // Save team names to localStorage for reference in the play screen
      localStorage.setItem(`quizTeams_${quizId}`, JSON.stringify(teamNames));
      
      return teamResults;
    } catch (error) {
      console.error('Error creating teams for quiz:', error);
      throw error;
    }
  },

  /**
   * Create teams directly for a quiz without checking for existing teams first
   * @param quizId ID of the quiz
   * @param teamNames Names of the teams to create
   * @param membersPerTeam Maximum members per team
   * @returns Promise with array of team creation responses
   */
  createTeamsDirectly: async (quizId: number, teamNames: string[], membersPerTeam: number = 5): Promise<any[]> => {
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

      // Create multiple teams with delay between requests
      const teamResults: any[] = [];
      
      for (let index = 0; index < teamNames.length; index++) {
        const teamName = teamNames[index];
        
        try {
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
          
          console.log(`Directly creating team "${teamName}" for quiz ${quizId}`);
          
          // Add delay between requests to avoid race conditions
          if (index > 0) {
            await new Promise(resolve => setTimeout(resolve, 300)); // 300ms delay
          }
          
          const response = await groupService.createGroupDirectly(teamData);
          
          if (response && response.data) {
            teamResults.push(response.data);
          }
        } catch (error) {
          console.error(`Failed to create team ${teamNames[index]}:`, error);
        }
      }
      
      console.log(`Created ${teamResults.length} teams directly for quiz ${quizId}`);
      
      return teamResults;
    } catch (error) {
      console.error('Error creating teams directly for quiz:', error);
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
      // First check if we have cached groups for this quiz
      const cacheKey = `quiz_groups_${quizId}`;
      const cachedGroups = sessionStorage.getItem(cacheKey);
      
      // Use a timestamp to prevent excessive API calls
      const lastFetchTime = sessionStorage.getItem(`last_groups_fetch_${quizId}`);
      const currentTime = Date.now();
      const fetchThreshold = 10000; // 10 seconds
      
      // If we have cached groups and it's been less than 10 seconds since last fetch, use the cache
      if (cachedGroups && lastFetchTime && (currentTime - parseInt(lastFetchTime)) < fetchThreshold) {
        console.log(`Using cached groups for quiz ${quizId} (fetched ${(currentTime - parseInt(lastFetchTime))}ms ago)`);
        try {
          const parsedGroups = JSON.parse(cachedGroups);
          return {
            data: parsedGroups,
            message: "Groups from session storage (recent cache)",
            status: 200
          };
        } catch (e) {
          console.warn('Error parsing cached groups:', e);
          // Continue with API call as fallback
        }
      }
      
      console.log(`Getting groups for quiz ${quizId} using /api/groups endpoint`);
      
      // Get all groups from the API
      const response = await axios.get(
        `${API_BASE_URL}/api/groups`,
        {
          headers: {
            'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : ''
          }
        }
      );
      
      // Update the last fetch timestamp
      sessionStorage.setItem(`last_groups_fetch_${quizId}`, currentTime.toString());
      
      console.log('Groups API response:', response.data);
      
      // Check for different response formats and handle them appropriately
      let groupsData: any[] = [];
      
      // Format 1: { data: [...groups] }
      if (response.data && response.data.data && Array.isArray(response.data.data)) {
        groupsData = response.data.data;
      } 
      // Format 2: [...groups]
      else if (response.data && Array.isArray(response.data)) {
        groupsData = response.data;
      }
      // Format 3: { status: 200, message: "...", data: [...groups] }
      else if (response.data && response.data.status && response.data.data && Array.isArray(response.data.data)) {
        groupsData = response.data.data;
      }
      
      console.log(`Found ${groupsData.length} groups in API response`);
      
      // Filter groups to only include those for this quiz
      const filteredGroups = groupsData.filter(
        (group: any) => group.quizId === quizId || group.quizId === quizId.toString()
      );
      
      console.log(`Filtered ${filteredGroups.length} groups for quiz ${quizId}`);
      
      // If we found matching groups, return them
      if (filteredGroups.length > 0) {
        // Store groups in session storage for future reference
        sessionStorage.setItem(cacheKey, JSON.stringify(filteredGroups));
        
        return {
          data: filteredGroups,
          message: "Groups filtered successfully",
          status: 200
        };
      }
      
      // If no groups found in API, check session storage
      if (cachedGroups) {
        try {
          const parsedGroups = JSON.parse(cachedGroups);
          console.log(`Using ${parsedGroups.length} stored groups for quiz ${quizId}`);
          return {
            data: parsedGroups,
            message: "Groups from session storage",
            status: 200
          };
        } catch (e) {
          console.warn('Error parsing stored groups:', e);
        }
      }
      
      // If no matching groups found or response has unexpected format, use default groups
      console.log(`No matching groups found for quiz ${quizId}, using defaults`);
      const defaultGroups = [
        { id: 1, name: 'Red Team', quizId: quizId },
        { id: 2, name: 'Blue Team', quizId: quizId },
        { id: 3, name: 'Green Team', quizId: quizId },
        { id: 4, name: 'Yellow Team', quizId: quizId }
      ];
      
      // Store default groups in session storage
      sessionStorage.setItem(cacheKey, JSON.stringify(defaultGroups));
      
      return {
        data: defaultGroups,
        message: "Default groups provided",
        status: 200
      };
    } catch (error) {
      console.error(`Error fetching groups for quiz ${quizId}:`, error);
      
      // Check if we have stored groups before using defaults
      const cacheKey = `quiz_groups_${quizId}`;
      const storedGroups = sessionStorage.getItem(cacheKey);
      if (storedGroups) {
        try {
          const parsedGroups = JSON.parse(storedGroups);
          console.log(`Using ${parsedGroups.length} stored groups after API error`);
          return {
            data: parsedGroups,
            message: "Groups from session storage after API error",
            status: 200
          };
        } catch (e) {
          console.warn('Error parsing stored groups:', e);
        }
      }
      
      // Provide default teams in case of error
      const defaultGroups = [
        { id: 1, name: 'Red Team', quizId: quizId },
        { id: 2, name: 'Blue Team', quizId: quizId },
        { id: 3, name: 'Green Team', quizId: quizId },
        { id: 4, name: 'Yellow Team', quizId: quizId }
      ];
      
      // Store default groups in session storage
      sessionStorage.setItem(cacheKey, JSON.stringify(defaultGroups));
      
      return {
        data: defaultGroups,
        message: "Default groups provided due to error",
        status: 200
      };
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
  },

  /**
   * Add a player to a group/team
   * @param groupId ID of the group to join
   * @param playerId ID of the player joining the group
   * @returns Promise with group member creation response
   */
  joinGroup: async (groupId: number, playerId: number): Promise<any> => {
    try {
      console.log(`Adding player ${playerId} to group ${groupId}`);
      
      // Check if this player has already joined this group in this session
      const joinKey = `joined_group_${groupId}_${playerId}`;
      const alreadyJoined = sessionStorage.getItem(joinKey);
      
      if (alreadyJoined) {
        console.log(`Player ${playerId} has already joined group ${groupId} in this session, skipping duplicate API call`);
        return { success: true, message: "Already joined group", alreadyJoined: true };
      }
      
      // Create the group member data
      const groupMemberData: GroupMemberData = {
        groupId: groupId,
        playerId: playerId,
        rank: 0,
        totalScore: 0,
        joinedAt: new Date().toISOString(),
        status: "active"
      };
      
      // Create the group member using the new API
      const response = await groupService.createGroupMember(groupMemberData);
      
      // Store the groupId in session storage
      sessionStorage.setItem('currentGroupId', groupId.toString());
      sessionStorage.setItem(`player_${playerId}_groupId`, groupId.toString());
      
      // Mark this player as having joined this group
      sessionStorage.setItem(joinKey, 'true');
      
      console.log('Successfully joined group:', response);
      return response;
    } catch (error: any) {
      console.error('Error joining group:', error);
      
      if (error.response) {
        console.error('API error response:', error.response.data);
        throw new Error(`Server error: ${error.response.data?.message || error.message}`);
      } else if (error.request) {
        throw new Error('No response from server. Please check your connection.');
      } else {
        throw error;
      }
    }
  },

  /**
   * Find group ID by team name for a specific quiz
   * @param quizId ID of the quiz
   * @param groupName Name of the team to find
   * @returns Promise with the group ID if found
   */
  findGroupIdByName: async (quizId: number, groupName: string): Promise<number | null> => {
    try {
      console.log(`Finding group ID for group "${groupName}" in quiz ${quizId}`);
      
      // Get the groupId from session storage where we stored it during group creation
      const groupKey = `group_created_${quizId}_${groupName}`;
      const groupData = sessionStorage.getItem(groupKey);
      
      if (groupData) {
        try {
          const parsedData = JSON.parse(groupData);
          // Get groupId from the stored data
          const groupId = parsedData.data?.groupId || parsedData.data?.id;
          if (groupId) {
            console.log(`Found group ID ${groupId} for group "${groupName}" from session storage`);
            return groupId;
          }
        } catch (e) {
          console.warn('Error parsing stored group data:', e);
        }
      }
      
      // If not found in session storage, try the direct mapping
      const directGroupId = sessionStorage.getItem(`group_id_${groupName}_${quizId}`);
      if (directGroupId) {
        console.log(`Found group ID ${directGroupId} from direct mapping for group "${groupName}"`);
        return parseInt(directGroupId);
      }
      
      console.log(`No group ID found for group "${groupName}" in quiz ${quizId}`);
      return null;
    } catch (error) {
      console.error('Error finding group ID:', error);
      return null;
    }
  },

  /**
   * Create a new group member
   * @param groupMemberData Data for the new group member
   * @returns Promise with group member creation response
   */
  createGroupMember: async (groupMemberData: GroupMemberData): Promise<any> => {
    try {
      console.log('Creating new group member:', groupMemberData);

      // Validate required fields
      if (!groupMemberData.groupId || !groupMemberData.playerId) {
        throw new Error('Missing required fields: groupId and playerId are required');
      }

      // Ensure default values for optional fields
      const memberData = {
        ...groupMemberData,
        rank: groupMemberData.rank || 0,
        totalScore: groupMemberData.totalScore || 0,
        joinedAt: groupMemberData.joinedAt || new Date().toISOString(),
        status: groupMemberData.status || 'active'
      };

      // Make the API call
      const response = await axios.post(
        `${API_BASE_URL}/api/GroupMember`,
        memberData,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Group member creation response:', response.data);

      // Store the group member data in session storage for quick access
      const storageKey = `group_member_${memberData.groupId}_${memberData.playerId}`;
      sessionStorage.setItem(storageKey, JSON.stringify(memberData));

      return response.data;
    } catch (error: any) {
      console.error('Error creating group member:', error);
      
      if (error.response) {
        console.error('API error response:', error.response.data);
        throw new Error(`Server error: ${error.response.data?.message || error.message}`);
      } else if (error.request) {
        throw new Error('No response from server. Please check your connection.');
      } else {
        throw error;
      }
    }
  },

  /**
   * Get group members for a specific group
   * @param groupId ID of the group
   * @returns Promise with array of group members
   */
  getGroupMembers: async (groupId: number): Promise<any> => {
    try {
      console.log(`Fetching members for group ${groupId}`);

      const response = await axios.get(
        `${API_BASE_URL}/api/GroupMember/group/${groupId}`,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Group members response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching group members:', error);
      
      if (error.response) {
        console.error('API error response:', error.response.data);
        throw new Error(`Server error: ${error.response.data?.message || error.message}`);
      } else if (error.request) {
        throw new Error('No response from server. Please check your connection.');
      } else {
        throw error;
      }
    }
  },

  /**
   * Update a group member's data
   * @param groupId ID of the group
   * @param playerId ID of the player
   * @param updateData Data to update
   * @returns Promise with updated group member data
   */
  updateGroupMember: async (groupId: number, playerId: number, updateData: Partial<GroupMemberData>): Promise<any> => {
    try {
      console.log(`Updating member ${playerId} in group ${groupId}:`, updateData);

      const response = await axios.put(
        `${API_BASE_URL}/api/GroupMember/${groupId}/${playerId}`,
        updateData,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Group member update response:', response.data);

      // Update stored data
      const storageKey = `group_member_${groupId}_${playerId}`;
      const storedData = sessionStorage.getItem(storageKey);
      if (storedData) {
        const currentData = JSON.parse(storedData);
        const updatedData = { ...currentData, ...updateData };
        sessionStorage.setItem(storageKey, JSON.stringify(updatedData));
      }

      return response.data;
    } catch (error: any) {
      console.error('Error updating group member:', error);
      
      if (error.response) {
        console.error('API error response:', error.response.data);
        throw new Error(`Server error: ${error.response.data?.message || error.message}`);
      } else if (error.request) {
        throw new Error('No response from server. Please check your connection.');
      } else {
        throw error;
      }
    }
  }
};

export default groupService;