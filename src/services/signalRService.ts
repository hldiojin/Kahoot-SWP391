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
        
        // Thử phương pháp 1: Bỏ qua negotiation, chỉ dùng WebSockets
        try {
          this.connection = new signalR.HubConnectionBuilder()
            .withUrl(SIGNALR_URL, {
              skipNegotiation: true,
              transport: signalR.HttpTransportType.WebSockets
            })
            .withAutomaticReconnect([0, 2000, 5000, 10000, 15000]) // More robust reconnection policy
            .build();
            
          await this.connection.start();
          console.log('SignalR Connected Successfully with skipNegotiation!');
          resolve();
          return;
        } catch (wsError) {
          console.log('WebSockets with skipNegotiation failed, trying alternative methods:', wsError);
        }
        
        // Phương pháp 2: Dùng tất cả các phương thức với negotiation
        this.connection = new signalR.HubConnectionBuilder()
          .withUrl(SIGNALR_URL)
          .withAutomaticReconnect([0, 2000, 5000, 10000, 15000]) // More robust reconnection policy
          .build();
          
        await this.connection.start();
        console.log('SignalR Connected Successfully with negotiation!');
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
    
    // Xóa handler cũ nếu có để tránh duplicate
    this.connection!.off("JoinToQuiz");
    
    // Đăng ký handler mới
    this.connection!.on("JoinToQuiz", (quizCode: string, player: any) => {
      console.log(`JoinToQuiz event received - Quiz: ${quizCode}`, player);
      callback(quizCode, player);
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
   * Directly broadcast a JoinToQuiz event to notify the host
   * This is a fallback when other methods fail
   * @param quizCode Quiz code to join
   * @param playerData Player information
   */
  public async broadcastPlayerJoin(quizCode: string, playerData: any): Promise<void> {
    if (!this.isConnected() || !this.connection) {
      console.error('Cannot broadcast player join, connection not established');
      return;
    }

    try {
      const formattedPlayerData = this.formatPlayerData(playerData);
      console.log(`Attempting direct JoinToQuiz broadcast for quiz ${quizCode}:`, formattedPlayerData);
      
      // Try multiple methods in sequence to ensure one works
      
      // 1. Directly invoke the JoinToQuiz method on the server
      try {
        await this.connection.invoke('JoinToQuiz', quizCode.toString(), formattedPlayerData);
        console.log(`Direct JoinToQuiz broadcast sent for quiz ${quizCode}`);
      } catch (err1) {
        console.warn('Direct JoinToQuiz invoke failed:', err1);
        
        // 2. Try using send instead of invoke
        try {
          await this.connection.send('JoinToQuiz', quizCode.toString(), formattedPlayerData);
          console.log(`JoinToQuiz sent via send() for quiz ${quizCode}`);
        } catch (err2) {
          console.warn('JoinToQuiz send() failed:', err2);
        }
      }
      
      // 3. Also try PlayerJoined event which might be used in some implementations
      try {
        await this.connection.invoke('PlayerJoined', quizCode.toString(), formattedPlayerData);
        console.log(`PlayerJoined broadcast sent for quiz ${quizCode}`);
      } catch (err3) {
        console.warn('PlayerJoined invoke failed:', err3);
      }
      
      // 4. Try a generic JoinQuizWithTeam event
      if (formattedPlayerData.GroupName) {
        try {
          await this.connection.invoke('JoinQuizWithTeam', 
            quizCode.toString(), 
            formattedPlayerData,
            formattedPlayerData.GroupName
          );
          console.log(`JoinQuizWithTeam broadcast sent for quiz ${quizCode} with team ${formattedPlayerData.GroupName}`);
        } catch (err4) {
          console.warn('JoinQuizWithTeam invoke failed:', err4);
        }
      }
    } catch (err) {
      console.error('Error broadcasting player join:', err);
    }
  }

  /**
   * Format player data consistently to ensure all required properties are present
   * @param playerData Raw player data
   * @returns Formatted player data
   */
  private formatPlayerData(playerData: any): PlayerSignalRData {
    // Create base player data with required fields
    const formattedData: PlayerSignalRData = {
      Id: playerData.Id || playerData.id || playerData.playerId || 0,
      NickName: playerData.NickName || playerData.nickName || playerData.name || 'Guest',
      AvatarUrl: playerData.AvatarUrl || playerData.avatarUrl || playerData.avatar || 'alligator',
      GroupId: playerData.GroupId || playerData.groupId || null,
      GroupName: playerData.GroupName || playerData.groupName || playerData.team || playerData.teamName || null,
      GroupDescription: playerData.GroupDescription || playerData.groupDescription || null,
      // Add lowercase variants for compatibility
      groupName: playerData.GroupName || playerData.groupName || playerData.team || playerData.teamName || null,
      team: playerData.GroupName || playerData.groupName || playerData.team || playerData.teamName || null,
      nickName: playerData.NickName || playerData.nickName || playerData.name || 'Guest'
    };

    return formattedData;
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
      console.log(`Attempting to join quiz ${quizCode} via SignalR with player data:`, formattedPlayerData);
      
      // Special handling for team mode - log detailed team info
      if (isTeamMode) {
        console.log(`🟢 TEAM MODE: Player ${formattedPlayerData.NickName} joining team ${formattedPlayerData.GroupName}`);
      }
      
      // First try the direct broadcast approach - only if player has an ID to avoid duplicates
      if (formattedPlayerData.Id > 0) {
        try {
          await this.broadcastPlayerJoin(quizCode, formattedPlayerData);
          console.log(`Direct JoinToQuiz broadcast successful for quiz ${quizCode}`);
          // Continue with regular operations as well for redundancy
        } catch (broadcastErr) {
          console.warn('Direct JoinToQuiz broadcast failed:', broadcastErr);
        }
      } else {
        console.log('Skipping direct broadcast because player has no ID yet');
      }
      
      // Try AddToGroup method first - this is the standard SignalR method for joining a group
      try {
        await this.connection!.invoke('AddToGroup', quizCode.toString());
        console.log(`Player added to SignalR group for quiz ${quizCode}`);
        
        // Then register the player with the quiz - only if the player has an ID
        if (formattedPlayerData.Id > 0) {
          await this.connection!.invoke('RegisterPlayer', quizCode.toString(), formattedPlayerData);
          console.log(`Player registered for quiz ${quizCode}${formattedPlayerData.GroupName ? ` in team ${formattedPlayerData.GroupName}` : ''}`);
          
          // If team mode, also try calling RegisterTeamPlayer if the method exists
          if (isTeamMode) {
            try {
              await this.connection!.invoke('RegisterTeamPlayer', quizCode.toString(), formattedPlayerData);
              console.log(`Team mode: Player registered with team ${formattedPlayerData.GroupName}`);
            } catch (teamRegisterErr) {
              console.warn('RegisterTeamPlayer not available, using standard registration:', teamRegisterErr);
              
              // Try a generic PlayerJoin method with team info
              try {
                await this.connection!.invoke('PlayerJoin', quizCode.toString(), formattedPlayerData);
                console.log(`PlayerJoin invoked for team player in quiz ${quizCode}`);
              } catch (playerJoinErr) {
                console.warn('PlayerJoin fallback failed:', playerJoinErr);
              }
            }
          }
        } else {
          console.log('Skipping RegisterPlayer because player has no ID yet');
        }
        
        return;
      } catch (addToGroupErr) {
        console.warn('AddToGroup method failed:', addToGroupErr);
        
        // Try JoinGroup as an alternative
        try {
          await this.connection!.invoke('JoinGroup', quizCode.toString());
          console.log(`Player joined group for quiz ${quizCode} using JoinGroup`);
          
          // Also try registering the player with the quiz if JoinGroup succeeds - only if player has an ID
          if (formattedPlayerData.Id > 0) {
            try {
              await this.connection!.invoke('RegisterPlayer', quizCode.toString(), formattedPlayerData);
              console.log(`Player registered for quiz ${quizCode} after JoinGroup successful`);
            } catch (registerErr) {
              console.warn('RegisterPlayer failed after JoinGroup:', registerErr);
            }
          } else {
            console.log('Skipping RegisterPlayer after JoinGroup because player has no ID yet');
          }
          
          return;
        } catch (joinGroupErr) {
          console.warn('JoinGroup method failed:', joinGroupErr);
        }
        
        // Final fallback - try PlayerJoin method which might be used in some implementations
        if (formattedPlayerData.Id > 0) {
          try {
            await this.connection!.invoke('PlayerJoin', quizCode.toString(), formattedPlayerData);
            console.log(`Player joined quiz ${quizCode} using PlayerJoin method`);
            return;
          } catch (playerJoinErr) {
            console.warn('PlayerJoin method failed:', playerJoinErr);
          }
        } else {
          console.log('Skipping PlayerJoin because player has no ID yet');
        }
        
        // If we can't join a group properly, we should still be able to receive broadcasts
        // Log a warning but don't throw an error since the REST API is the primary mechanism
        console.warn('Could not join SignalR group. Player will be added via REST API but real-time updates may be delayed.');
        return;
      }
    } catch (err) {
      console.error('Error joining quiz via SignalR:', err);
      // Don't throw an error, as the REST API is the primary mechanism
      console.warn('SignalR connection failed, but player will be added via REST API');
    }
  }
}

export default SignalRService.getInstance(); 