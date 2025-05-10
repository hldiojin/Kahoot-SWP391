import * as signalR from '@microsoft/signalr';

// URL trực tiếp đến SignalR hub
const SIGNALR_URL = 'https://kahootclone-f7hkd0hwafgbfrfa.southeastasia-01.azurewebsites.net/KahootSignalRServer';

// Define interface for player data to include all possible properties
interface PlayerSignalRData {
  Id: number;
  NickName: string;
  AvatarUrl: string;
  GroupId: number | null;
  GroupName: string | null;
  GroupDescription: string | null;
  // Include the lower case version for API compatibility
  groupName?: string | null;
  // Include team property for API compatibility
  team?: string | null;
  // Include nickName property for API compatibility
  nickName?: string;
}

class SignalRService {
  broadcastPlayerJoin(code: string, playerData: any) {
    throw new Error('Method not implemented.');
  }
  private connection: signalR.HubConnection | null = null;
  private static instance: SignalRService;
  private connectionPromise: Promise<void> | null = null;

  private constructor() {}

  public static getInstance(): SignalRService {
    if (!SignalRService.instance) {
      SignalRService.instance = new SignalRService();
    }
    return SignalRService.instance;
  }

  public async startConnection(): Promise<void> {
    // If a connection attempt is already in progress, return that promise
    if (this.connectionPromise) {
      return this.connectionPromise;
    }
    
    // If already connected, return immediately
    if (this.isConnected()) {
      return Promise.resolve();
    }
    
    // Create a new connection promise
    this.connectionPromise = new Promise(async (resolve, reject) => {
      try {
        console.log('Initializing SignalR connection...');
        
        // Try WebSockets first with skipNegotiation
        try {
          this.connection = new signalR.HubConnectionBuilder()
            .withUrl(SIGNALR_URL, {
              skipNegotiation: true,
              transport: signalR.HttpTransportType.WebSockets
            })
            .withAutomaticReconnect([0, 2000, 5000, 10000, 15000]) // More robust reconnection policy
            .configureLogging(signalR.LogLevel.Debug) // Add debug logging
            .build();
            
          // Add connection state change handler
          this.connection.onclose((error) => {
            console.log('SignalR connection closed:', error);
            this.connection = null;
            this.connectionPromise = null;
          });
          
          await this.connection.start();
          console.log('SignalR Connected Successfully with WebSockets!');
          resolve();
          return;
        } catch (wsError) {
          console.log('WebSockets connection failed, trying fallback methods:', wsError);
        }
        
        // Fallback: Try with all transports
        this.connection = new signalR.HubConnectionBuilder()
          .withUrl(SIGNALR_URL)
          .withAutomaticReconnect([0, 2000, 5000, 10000, 15000])
          .configureLogging(signalR.LogLevel.Debug)
          .build();
          
        // Add connection state change handler
        this.connection.onclose((error) => {
          console.log('SignalR connection closed:', error);
          this.connection = null;
          this.connectionPromise = null;
        });
        
        await this.connection.start();
        console.log('SignalR Connected Successfully with fallback transport!');
        resolve();
      } catch (err) {
        console.error('All SignalR connection attempts failed:', err);
        this.connectionPromise = null;
        reject(err);
      }
    });
    
    try {
      await this.connectionPromise;
      return this.connectionPromise;
    } catch (err) {
      this.connectionPromise = null;
      throw err;
    }
  }

  public async stopConnection(): Promise<void> {
    try {
      if (this.connection) {
        await this.connection.stop();
        this.connection = null;
        this.connectionPromise = null;
      }
    } catch (err) {
      throw err;
    }
  }

  public isConnected(): boolean {
    return this.connection?.state === signalR.HubConnectionState.Connected;
  }
  
  // Add method to get the connection object
  public getConnection(): signalR.HubConnection | null {
    return this.connection;
  }

  // Lắng nghe sự kiện player join với tên chính xác là "JoinToQuiz" từ backend
  public onPlayerJoined(callback: (quizCode: string, player: any) => void): void {
    this.ensureConnectionSync();
    
    console.log('Registering listener for JoinToQuiz event');
    
    // Remove old handler to avoid duplicates
    this.connection!.off("JoinToQuiz");
    
    // Register new handler with proper event name
    this.connection!.on("JoinToQuiz", (quizCode: string, player: any) => {
      console.log(`JoinToQuiz event received - Quiz: ${quizCode}`, player);
      
      // Format player data consistently
      const formattedPlayer = this.formatPlayerData(player);
      
      // Store player data in session storage for redundancy
      if (typeof window !== 'undefined') {
        try {
          // Store in team-specific list if team mode
          if (formattedPlayer.GroupName) {
            const teamKey = `team_players_${formattedPlayer.GroupName}`;
            let teamPlayers = [];
            try {
              const existing = sessionStorage.getItem(teamKey);
              if (existing) {
                teamPlayers = JSON.parse(existing);
              }
            } catch (e) {
              console.warn('Error reading team players:', e);
            }
            
            // Add to team if not already there
            const existsInTeam = teamPlayers.some((p: any) => 
              p.Id === formattedPlayer.Id || 
              p.NickName === formattedPlayer.NickName
            );
            
            if (!existsInTeam) {
              teamPlayers.push(formattedPlayer);
              sessionStorage.setItem(teamKey, JSON.stringify(teamPlayers));
              console.log(`Added player to team ${formattedPlayer.GroupName} in session storage`);
            }
          }
          
          // Also store in global joined players list
          const joinedKey = `joined_players_${quizCode}`;
          let joinedPlayers = [];
          try {
            const existing = sessionStorage.getItem(joinedKey);
            if (existing) {
              joinedPlayers = JSON.parse(existing);
            }
          } catch (e) {
            console.warn('Error reading joined players:', e);
          }
          
          // Add to joined players if not already there
          const existsInJoined = joinedPlayers.some((p: any) => 
            p.Id === formattedPlayer.Id || 
            p.NickName === formattedPlayer.NickName
          );
          
          if (!existsInJoined) {
            joinedPlayers.push(formattedPlayer);
            sessionStorage.setItem(joinedKey, JSON.stringify(joinedPlayers));
            console.log(`Added player to joined players list for quiz ${quizCode}`);
          }
        } catch (storageErr) {
          console.warn('Error storing player data:', storageErr);
        }
      }
      
      // Call the callback with formatted player data
      callback(quizCode, formattedPlayer);
    });
  }

  // Lắng nghe sự kiện start quiz
  public onStartQuiz(callback: (quizCode: string, started: boolean) => void): void {
    this.ensureConnectionSync();
    this.connection!.on('StartQuiz', (quizCode: string, started: boolean) => {
      callback(quizCode, started);
    });
  }

  // Add this new method to remove event handlers
  public removeEventHandler(eventName: string): void {
    if (this.isConnected() && this.connection) {
      this.connection.off(eventName);
      console.log(`Removed event handler for ${eventName}`);
    }
  }

  // Ensure connection is established for event registration
  private ensureConnectionSync(): void {
    if (!this.isConnected()) {
      if (!this.connection) {
        console.warn('Attempting to register event on disconnected SignalR hub. Will try to connect...');
        this.connection = new signalR.HubConnectionBuilder()
          .withUrl(SIGNALR_URL, {
            skipNegotiation: true,
            transport: signalR.HttpTransportType.WebSockets
          })
          .withAutomaticReconnect()
          .build();
        
        this.startConnection().catch(err => {
          console.error('Failed to connect while registering event:', err);
        });
      }
    }
  }

  /**
   * Log player join information to console without attempting server methods
   * This replaces the previous broadcastPlayerJoin method since we know the methods don't exist
   * @param quizCode Quiz code to join
   * @param playerData Player information
   */
  public logPlayerJoin(quizCode: string, playerData: any): void {
    if (!this.isConnected() || !this.connection) {
      console.warn('SignalR not connected, cannot sync player join');
      return;
    }

    try {
      const formattedPlayerData = this.formatPlayerData(playerData);
      console.log(`Player joining quiz ${quizCode}:`, formattedPlayerData);
      
      // Store in session storage for local data syncing
      if (typeof window !== 'undefined') {
        try {
          // Store player data
          const key = `player_joined_${quizCode}_${formattedPlayerData.Id}`;
          sessionStorage.setItem(key, JSON.stringify({
            player: formattedPlayerData,
            timestamp: new Date().toISOString()
          }));
          
          // Add to joined players list
          let joinedPlayers = [];
          const joinedPlayersKey = `joined_players_${quizCode}`;
          try {
            const existing = sessionStorage.getItem(joinedPlayersKey);
            if (existing) {
              joinedPlayers = JSON.parse(existing);
            }
          } catch (err) {
            console.warn('Error parsing joined players:', err);
          }
          
          // Add player if not already in list
          const exists = joinedPlayers.some((p: any) => 
            p.Id === formattedPlayerData.Id || p.id === formattedPlayerData.Id
          );
          
          if (!exists) {
            joinedPlayers.push(formattedPlayerData);
            sessionStorage.setItem(joinedPlayersKey, JSON.stringify(joinedPlayers));
            console.log(`Added player to joined players list (${joinedPlayers.length} total)`);
          }
        } catch (storageErr) {
          console.warn('Error storing player join data locally:', storageErr);
        }
      }
    } catch (err) {
      console.error('Error logging player join:', err);
    }
  }

  /**
   * Player joins a quiz using the server's expected format
   * @param quizCode Quiz code to join
   * @param playerData Player information
   */
  public async joinQuiz(quizCode: string, playerData: any): Promise<void> {
    // Ensure we have a valid connection before proceeding
    if (!this.isConnected()) {
      try {
        const connected = await this.safeStartConnection();
        if (!connected) {
          console.warn('SignalR connection failed, continuing with REST API only');
          return;
        }
      } catch (error) {
        console.warn('SignalR connection error, continuing with REST API only:', error);
        return;
      }
    }
    
    try {
      // Format player data consistently for all operations
      const formattedPlayerData = this.formatPlayerData(playerData);
      
      // Check if this is a team player
      const isTeamMode = !!formattedPlayerData.GroupName;
      
      // Log complete player data to help diagnose team mode issues
      console.log(`Connected to SignalR for quiz ${quizCode} with player data:`, formattedPlayerData);
      
      // Special handling for team mode - log detailed team info
      if (isTeamMode) {
        console.log(`🟢 TEAM MODE: Player ${formattedPlayerData.NickName} is connected via SignalR in team ${formattedPlayerData.GroupName}`);
      }
      
      // IMPORTANT: Don't try to call methods that don't exist on the server
      // The server expects to send events TO clients, not receive them FROM clients
      
      // Just store the connection info locally - don't try to call server methods
      console.log(`Establishing SignalR connection for quiz ${quizCode}`);
        
      // Save connection and player info to session storage regardless of method success
      if (typeof window !== 'undefined') {
        try {
          // Store SignalR connection info
          sessionStorage.setItem(`signalr_connected_${quizCode}`, 'true');
          sessionStorage.setItem(`player_data_${quizCode}`, JSON.stringify(formattedPlayerData));
          
          // Store in team-specific storage if this is team mode
          if (isTeamMode && formattedPlayerData.GroupName) {
            const teamName = formattedPlayerData.GroupName;
            const teamPlayersKey = `team_players_${teamName}`;
            let teamPlayers = [];
            try {
              const existing = sessionStorage.getItem(teamPlayersKey);
              if (existing) {
                teamPlayers = JSON.parse(existing);
              }
            } catch (e) {
              console.warn(`Error reading team players:`, e);
            }
            
            // Add to team if not already there
            const existsInTeam = teamPlayers.some((p: any) => 
              p.id === formattedPlayerData.Id || p.Id === formattedPlayerData.Id || 
              (p.nickname === formattedPlayerData.NickName)
            );
            
            if (!existsInTeam) {
              teamPlayers.push(formattedPlayerData);
              sessionStorage.setItem(teamPlayersKey, JSON.stringify(teamPlayers));
              console.log(`Added player to team ${teamName} players list`);
            }
          }
          
          // Add to the main joined players list
          const joinedPlayersKey = `joined_players_${quizCode}`;
          let joinedPlayers = [];
          try {
            const existing = sessionStorage.getItem(joinedPlayersKey);
            if (existing) {
              joinedPlayers = JSON.parse(existing);
            }
          } catch (e) {
            console.warn(`Error reading joined players:`, e);
          }
          
          // Add to joined players if not already there
          const existsInJoined = joinedPlayers.some((p: any) => 
            p.id === formattedPlayerData.Id || p.Id === formattedPlayerData.Id || 
            (p.nickname === formattedPlayerData.NickName)
          );
          
          if (!existsInJoined) {
            joinedPlayers.push(formattedPlayerData);
            sessionStorage.setItem(joinedPlayersKey, JSON.stringify(joinedPlayers));
          }
          
          console.log('Successfully stored player data locally');
        } catch (storageErr) {
          console.warn('Error saving SignalR status to storage:', storageErr);
        }
      }
    } catch (err) {
      console.error('Error joining quiz via SignalR:', err);
      console.warn('SignalR connection failed, but player will be added via REST API');
    }
  }

  /**
   * Safely connect to SignalR with improved error handling and retry logic
   */
  public async safeStartConnection(maxRetries: number = 3): Promise<boolean> {
    let retryCount = 0;
    
    while (retryCount < maxRetries) {
      try {
        await this.startConnection();
        console.log('SignalR connection successfully established');
        return true;
      } catch (error) {
        retryCount++;
        console.warn(`SignalR connection failed (attempt ${retryCount}/${maxRetries}):`, error);
        
        if (retryCount < maxRetries) {
          // Exponential backoff: wait longer between each retry
          const delay = 1000 * Math.pow(2, retryCount - 1);
          console.log(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    console.error(`Failed to connect to SignalR after ${maxRetries} attempts`);
    return false;
  }
  
  /**
   * Format player data consistently to ensure all required properties are present
   * @param playerData Raw player data
   * @returns Formatted player data
   */
  private formatPlayerData(playerData: any): PlayerSignalRData {
    // Detect if this is a team mode player by checking for any team-related properties
    const isTeamMode = !!(
      playerData.team || 
      playerData.teamName || 
      playerData.GroupName || 
      playerData.groupName || 
      playerData.GroupId || 
      playerData.groupId
    );
    
    // Get team name from any possible source
    const teamName = 
      playerData.team || 
      playerData.teamName || 
      playerData.GroupName || 
      playerData.groupName || 
      null;
      
    // Get team description or create default one
    const teamDescription = 
      playerData.GroupDescription || 
      playerData.groupDescription || 
      (teamName ? `Team for ${playerData.NickName || playerData.nickName || playerData.name || 'player'}` : null);
      
    console.log(`Formatting player data. Team mode detected: ${isTeamMode}, Team name: ${teamName}, Team description: ${teamDescription}`);
    
    // Create base player data with required fields
    const formattedData: PlayerSignalRData = {
      Id: playerData.Id || playerData.id || playerData.playerId || 0,
      NickName: playerData.NickName || playerData.nickName || playerData.name || 'Guest',
      AvatarUrl: playerData.AvatarUrl || playerData.avatarUrl || playerData.avatar || 'alligator',
      // Always include these fields, but they'll be null for solo mode
      GroupId: playerData.GroupId || playerData.groupId || null,
      GroupName: teamName, // Use the extracted team name
      GroupDescription: teamDescription, // Use the extracted/created team description
      // Add lowercase variants for compatibility
      groupName: teamName,
      team: teamName,
      nickName: playerData.NickName || playerData.nickName || playerData.name || 'Guest'
    };

    // For team mode, add extra logging and ensure all team fields are set
    if (isTeamMode && teamName) {
      console.log(`🟢 Team mode player: ${formattedData.NickName} in team ${teamName} with description: ${teamDescription}`);
      
      // Make sure we log all the values for debugging
      console.log(`Team details - GroupId: ${formattedData.GroupId}, GroupName: ${formattedData.GroupName}, team: ${formattedData.team}`);
      
      // Store the joined team player in session storage for the host to find
      try {
        if (typeof window !== 'undefined' && window.sessionStorage) {
          // Add to multiple storage locations for redundancy
          
          // 1. Store in team-specific list
          const teamPlayersKey = `team_players_${teamName}`;
          let teamPlayers = [];
          try {
            const existing = sessionStorage.getItem(teamPlayersKey);
            if (existing) {
              teamPlayers = JSON.parse(existing);
            }
          } catch (e) {
            console.warn('Error reading stored team players:', e);
          }
          
          // Check if player already exists in team list
          const playerExistsInTeam = teamPlayers.some((p: any) => 
            p.Id === formattedData.Id || 
            p.NickName === formattedData.NickName
          );
          
          // Add player if not already in team list
          if (!playerExistsInTeam) {
            teamPlayers.push({
              ...formattedData,
              joinTime: new Date().toISOString()
            });
            sessionStorage.setItem(teamPlayersKey, JSON.stringify(teamPlayers));
            console.log(`Added player to team ${teamName} in session storage (total: ${teamPlayers.length})`);
          }
          
          // 2. Add to the global joined players list
          const allPlayersKey = `joined_players_all`;
          let allPlayers = [];
          try {
            const existing = sessionStorage.getItem(allPlayersKey);
            if (existing) {
              allPlayers = JSON.parse(existing);
            }
          } catch (e) {
            console.warn('Error parsing global players list:', e);
          }
          
          // Check if player exists in global list
          const playerExistsGlobal = allPlayers.some((p: any) => 
            p.Id === formattedData.Id || 
            p.NickName === formattedData.NickName
          );
          
          // Add to global list if not there
          if (!playerExistsGlobal) {
            allPlayers.push({
              ...formattedData,
              joinTime: new Date().toISOString()
            });
            sessionStorage.setItem(allPlayersKey, JSON.stringify(allPlayers));
            console.log(`Added player to global players list (total: ${allPlayers.length})`);
          }
          
          // 3. Also store in quiz-specific player list if we have a quiz code
          if (playerData.quizId || playerData.gameCode) {
            const quizId = playerData.quizId || playerData.gameCode;
            const quizPlayersKey = `joined_players_${quizId}`;
            let quizPlayers = [];
            try {
              const existing = sessionStorage.getItem(quizPlayersKey);
              if (existing) {
                quizPlayers = JSON.parse(existing);
              }
            } catch (e) {
              console.warn('Error parsing quiz players list:', e);
            }
            
            // Check if player exists in quiz list
            const playerExistsInQuiz = quizPlayers.some((p: any) => 
              p.Id === formattedData.Id || 
              p.NickName === formattedData.NickName
            );
            
            // Add to quiz list if not there
            if (!playerExistsInQuiz) {
              quizPlayers.push({
                ...formattedData,
                joinTime: new Date().toISOString()
              });
              sessionStorage.setItem(quizPlayersKey, JSON.stringify(quizPlayers));
              console.log(`Added player to quiz ${quizId} players list (total: ${quizPlayers.length})`);
            }
          }
        }
      } catch (storageError) {
        console.warn('Error storing team player:', storageError);
      }
    }

    return formattedData;
  }
}

export default SignalRService.getInstance(); 