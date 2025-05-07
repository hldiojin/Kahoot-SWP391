import * as signalR from '@microsoft/signalr';

// URL trực tiếp đến SignalR hub
const SIGNALR_URL = 'https://kahootclone-f7hkd0hwafgbfrfa.southeastasia-01.azurewebsites.net/KahootSignalRServer';

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
            .withAutomaticReconnect()
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
          .withAutomaticReconnect()
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
        console.log('SignalR Connection Stopped');
      }
    } catch (err) {
      console.error('Error while stopping SignalR connection:', err);
      throw err;
    }
  }

  public isConnected(): boolean {
    return this.connection?.state === signalR.HubConnectionState.Connected;
  }
  
  // Game-related methods - Using method names that exist on the server
  public async joinHostRoom(gameCode: string): Promise<void> {
    await this.ensureConnection();
    try {
      // Try different method names that might exist on the server
      try {
        await this.connection!.invoke('JoinRoom', gameCode, "host");
        console.log(`Host joined room for game: ${gameCode} using JoinRoom`);
      } catch (err) {
        try {
          await this.connection!.invoke('JoinGame', gameCode, { role: "host" });
          console.log(`Host joined room for game: ${gameCode} using JoinGame`);
        } catch (err2) {
          console.error('Failed to join host room with standard methods, trying fallback');
          // Last attempt with direct room joining
          await this.connection!.invoke('JoinGroup', `game-${gameCode}`);
          console.log(`Host joined group for game: ${gameCode}`);
        }
      }
    } catch (err) {
      console.error('Error joining host room:', err);
      throw err;
    }
  }
  
  public async startGame(gameCode: string): Promise<void> {
    await this.ensureConnection();
    try {
      // Try different method names that might exist on the server
      try {
        await this.connection!.invoke('StartGame', gameCode);
        console.log(`Game started with StartGame: ${gameCode}`);
      } catch (err) {
        try {
          await this.connection!.invoke('BeginGame', gameCode);
          console.log(`Game started with BeginGame: ${gameCode}`);
        } catch (err2) {
          console.error('Failed to start game with standard methods, trying fallback');
          // Last attempt to broadcast to the game group
          await this.connection!.invoke('SendMessage', `game-${gameCode}`, 'GameStarted', {});
          console.log(`Game start message sent to group: ${gameCode}`);
        }
      }
    } catch (err) {
      console.error('Error starting game via SignalR:', err);
      throw err;
    }
  }
  
  /**
   * Player joins a quiz using the server's expected format
   * @param quizCode Quiz code to join
   * @param playerData Player information
   */
  public async joinQuiz(quizCode: string, playerData: any): Promise<void> {
    await this.ensureConnection();
    try {
      // Ensure player data is formatted according to server expectations
      const formattedPlayerData = {
        Id: playerData.Id || 0,
        NickName: playerData.NickName || playerData.name || 'Guest',
        AvatarUrl: playerData.AvatarUrl || playerData.avatar || 'alligator',
        GroupId: playerData.GroupId || null,
        GroupName: playerData.GroupName || playerData.teamName || null,
        GroupDescription: playerData.GroupDescription || null
      };
      
      // Try different method names that might exist on the server
      try {
        await this.connection!.invoke('JoinGame', quizCode, formattedPlayerData);
        console.log(`Player joined quiz with JoinGame: ${quizCode}`, formattedPlayerData);
      } catch (joinGameErr) {
        console.warn('JoinGame failed, trying JoinQuiz:', joinGameErr);
        try {
          await this.connection!.invoke('JoinQuiz', quizCode, formattedPlayerData);
          console.log(`Player joined quiz with JoinQuiz: ${quizCode}`, formattedPlayerData);
        } catch (joinQuizErr) {
          console.warn('JoinQuiz failed, trying PlayerJoin:', joinQuizErr);
          try {
            await this.connection!.invoke('PlayerJoin', quizCode, formattedPlayerData);
            console.log(`Player joined quiz with PlayerJoin: ${quizCode}`, formattedPlayerData);
          } catch (playerJoinErr) {
            console.error('All standard join methods failed, trying basic room join');
            // Last attempt with direct room joining
            await this.connection!.invoke('JoinGroup', `game-${quizCode}`);
            console.log(`Player joined group for game: ${quizCode}`);
            
            // Broadcast player info to the group
            await this.connection!.invoke('SendMessage', `game-${quizCode}`, 'PlayerJoined', formattedPlayerData);
            console.log(`Player info broadcast to game group: ${quizCode}`);
          }
        }
      }
    } catch (err) {
      console.error('Error joining quiz via SignalR:', err);
      throw err;
    }
  }
  
  // Make sure connection is established before making any calls
  private async ensureConnection(): Promise<void> {
    if (!this.isConnected()) {
      console.log('Connection not established, connecting now...');
      await this.startConnection();
      
      // Add small delay to ensure connection is fully established
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (!this.isConnected()) {
        throw new Error('Failed to establish SignalR connection');
      }
    }
  }
  
  // Event registration methods
  public onPlayerJoined(callback: (player: any) => void): void {
    this.ensureConnectionSync();
    this.connection!.on('PlayerJoined', callback);
    
    // Also listen for generic messages that might contain player joined info
    this.connection!.on('ReceiveMessage', (messageType: string, data: any) => {
      if (messageType === 'PlayerJoined') {
        callback(data);
      }
    });
  }
  
  public onGameStarted(callback: (gameData: any) => void): void {
    this.ensureConnectionSync();
    // Listen for multiple possible event names
    this.connection!.on('GameStarted', callback);
    this.connection!.on('StartGame', callback);
    this.connection!.on('BeginGame', callback);
    
    // Also listen for generic messages that might contain game started info
    this.connection!.on('ReceiveMessage', (messageType: string, data: any) => {
      if (messageType === 'GameStarted' || messageType === 'BeginGame') {
        callback(data);
      }
    });
  }
  
  public onQuestionReceived(callback: (question: any) => void): void {
    this.ensureConnectionSync();
    this.connection!.on('QuestionReceived', callback);
    this.connection!.on('NextQuestion', callback);
    
    // Also listen for generic messages that might contain question info
    this.connection!.on('ReceiveMessage', (messageType: string, data: any) => {
      if (messageType === 'QuestionReceived' || messageType === 'NextQuestion') {
        callback(data);
      }
    });
  }
  
  // Synchronous version of ensureConnection for event registration
  private ensureConnectionSync(): void {
    if (!this.isConnected()) {
      console.warn('Attempting to register event on disconnected SignalR hub');
      if (!this.connection) {
        this.connection = new signalR.HubConnectionBuilder()
          .withUrl(SIGNALR_URL)
          .withAutomaticReconnect()
          .build();
          
        // Start connection asynchronously, but don't wait
        this.startConnection().catch(err => {
          console.error('Failed to connect while registering event:', err);
        });
      }
    }
  }
}

export default SignalRService.getInstance(); 