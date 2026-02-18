/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { DurableObject } from 'cloudflare:workers';
import type {
  GameState,
  Player,
  PlayerClass,
  ItemType,
  PurchaseRightType,
  ClientMessage,
  ServerMessage,
  ActionResult,
  ActionLog,
} from '../src/types/game';

interface Env {
  GAME_ROOM: DurableObjectNamespace<GameRoom>;
  ROOM_REGISTRY: DurableObjectNamespace;
}

// Helper to generate unique IDs
function generateId(): string {
  return crypto.randomUUID();
}

// Helper to get all available player classes
function getAllPlayerClasses(): PlayerClass[] {
  return [
    'mage',
    'archer',
    'rocketeer',
    'bomber',
    'boxer',
    'monk',
    'alien',
    'fatty',
    'vampire',
  ];
}

// Helper to get two random different classes
function getTwoRandomClasses(): [PlayerClass, PlayerClass] {
  const allClasses = getAllPlayerClasses();
  const shuffled = [...allClasses].sort(() => Math.random() - 0.5);
  return [shuffled[0], shuffled[1]];
}

// Helper to get initial inventory based on class
function getInitialInventory(playerClass: PlayerClass): ItemType[] {
  switch (playerClass) {
    case 'fatty':
      return ['shirt', 'fat'];
    case 'boxer':
    case 'monk':
      // No shirt for boxer and monk
      return [];
    default:
      return ['shirt'];
  }
}

// Helper to get initial purchase rights based on class
function getInitialPurchaseRights(playerClass: PlayerClass): PurchaseRightType[] {
  switch (playerClass) {
    case 'mage':
      return ['knife', 'horse', 'potion'];
    case 'archer':
      return ['knife', 'horse', 'bow', 'arrow'];
    case 'rocketeer':
      return ['knife', 'horse', 'rocket_launcher', 'rocket_ammo'];
    case 'bomber':
      return ['knife', 'horse', 'bomb'];
    case 'boxer':
      return ['bronze_glove', 'silver_glove', 'gold_glove'];
    case 'monk':
      return ['bronze_belt', 'silver_belt', 'gold_belt'];
    case 'alien':
      return ['knife', 'ufo'];
    case 'fatty':
      return ['knife'];
    case 'vampire':
      return ['knife', 'horse'];
    default:
      return ['knife', 'horse'];
  }
}

export class GameRoom extends DurableObject<Env> {
  private sessions: Map<WebSocket, string>; // WebSocket -> playerId
  private gameState: GameState | null = null;
  private stateLoaded: boolean = false;
  private roomId: string | null = null;
  private roomIsPublic: boolean = true; // Default to public, will be overridden during initialization

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.sessions = new Map();
    
    // Restore WebSocket sessions after hibernation
    this.ctx.getWebSockets().forEach((ws) => {
      const playerId = ws.deserializeAttachment();
      if (playerId) {
        this.sessions.set(ws, playerId as string);
      }
    });
  }

  private async ensureStateLoaded(): Promise<void> {
    if (this.stateLoaded) return;
    
    const saved = await this.ctx.storage.get('gameState');
    if (saved) {
      const data = saved as any;
      this.gameState = {
        ...data,
        players: new Map(data.players.map((p: any) => [p.id, p])),
        actionLogs: data.actionLogs || [], // Ensure actionLogs exists for old game states
      };
    }
    this.stateLoaded = true;
  }

  async fetch(request: Request): Promise<Response> {
    // Load state first
    await this.ensureStateLoaded();
    
    const url = new URL(request.url);
    
    // Extract roomId from URL for registry updates
    const pathParts = url.pathname.split('/');
    this.roomId = pathParts[pathParts.length - 1] || this.roomId;
    
    // Extract isPublic from query parameter (for room initialization)
    const isPublicParam = url.searchParams.get('isPublic');
    if (isPublicParam !== null) {
      this.roomIsPublic = isPublicParam === 'true';
    }
    
    // Handle WebSocket upgrade
    if (request.headers.get('Upgrade') === 'websocket') {
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);
      
      await this.handleSession(server);
      
      return new Response(null, {
        status: 101,
        webSocket: client,
      });
    }
    
    // Handle HTTP API requests
    if (url.pathname === '/state' && request.method === 'GET') {
      return Response.json({ state: this.serializeGameState() });
    }
    
    return new Response('Not found', { status: 404 });
  }

  async handleSession(webSocket: WebSocket): Promise<void> {
    this.ctx.acceptWebSocket(webSocket);
  }

  async webSocketOpen(_ws: WebSocket): Promise<void> {
    console.log('WebSocket opened');
    // Load state as soon as WebSocket opens
    await this.ensureStateLoaded();
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    try {
      // Ensure state is loaded before processing any message
      await this.ensureStateLoaded();
      
      if (typeof message !== 'string') {
        return;
      }

      const data = JSON.parse(message) as ClientMessage;
      await this.handleClientMessage(ws, data);
    } catch (error) {
      console.error('Error handling message:', error);
      this.sendError(ws, 'Invalid message format');
    }
  }

  async webSocketClose(ws: WebSocket): Promise<void> {
    const playerId = this.sessions.get(ws);
    if (playerId && this.gameState) {
      this.sessions.delete(ws);
      
      // Mark player as disconnected
      const player = this.gameState.players.get(playerId);
      if (player) {
        player.isConnected = false;
        
        // Broadcast updated connection status (without logs for efficiency)
        this.broadcast({
          type: 'room_state',
          state: this.serializeGameState(false),
        });
        
        await this.saveGameState();
      }
      
      // Update room registry when connection count changes
      await this.updateRoomRegistry();
      
      // If no more connections, set alarm for 6 hours to cleanup
      if (this.sessions.size === 0) {
        const sixHours = 6 * 60 * 60 * 1000;
        await this.ctx.storage.setAlarm(Date.now() + sixHours);
      }
      
      // Only remove player from game in waiting phase
      if (this.gameState.phase === 'waiting') {
        // In waiting phase, actually remove the player
        this.gameState.players.delete(playerId);
        
        // Broadcast updated state (without logs)
        this.broadcast({
          type: 'room_state',
          state: this.serializeGameState(false),
        });
        
        await this.saveGameState();
        await this.updateRoomRegistry();
      }
      // In other phases, keep player in state for reconnection
    }
  }

  async webSocketError(_ws: WebSocket, error: unknown): Promise<void> {
    console.error('WebSocket error:', error);
  }

  private async handleClientMessage(ws: WebSocket, message: ClientMessage): Promise<void> {
    switch (message.type) {
      case 'join_room':
        await this.handleJoinRoom(ws, message);
        break;
      case 'select_class':
        await this.handleSelectClass(ws, message);
        break;
      case 'ready':
        await this.handleReady(ws, message);
        break;
      case 'start_game':
        await this.handleStartGame(ws, message);
        break;
      case 'perform_action':
        await this.handlePerformAction(ws, message);
        break;
      default:
        this.sendError(ws, 'Unknown message type');
    }
  }

  private async handleJoinRoom(ws: WebSocket, message: { playerId: string; playerName: string; avatar?: string }): Promise<void> {
    // Initialize game state if needed
    if (!this.gameState) {
      const roomId = generateId();
      this.gameState = {
        roomId,
        phase: 'waiting',
        players: new Map(),
        currentTurn: 0,
        currentPlayerId: null,
        currentClassSelectionPlayerId: null,
        stepPool: 0,
        bombs: [],
        delayedEffects: [],
        actionQueue: [],
        actionLogs: [],
        settings: {
          minPlayers: 2,
          maxPlayers: 9,
          isPublic: this.roomIsPublic, // Use the isPublic value from URL parameter
        },
        hostId: message.playerId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
    }

    // Check if player already exists (reconnection)
    const existingPlayer = this.gameState.players.get(message.playerId);
    if (existingPlayer) {
      // Reconnection - update the websocket session
      this.sessions.set(ws, message.playerId);
      ws.serializeAttachment(message.playerId);
      
      // Mark player as connected
      existingPlayer.isConnected = true;
      
      // Update player info if provided
      if (message.playerName) {
        existingPlayer.name = message.playerName;
      }
      if (message.avatar !== undefined) {
        existingPlayer.avatar = message.avatar;
      }
      
      await this.saveGameState();
      await this.updateRoomRegistry();
      
      // Send current state to the reconnecting player (with full logs)
      this.send(ws, {
        type: 'room_state',
        state: this.serializeGameState(),
      });
      
      // Notify others that player reconnected (without logs for efficiency)
      this.broadcast({
        type: 'room_state',
        state: this.serializeGameState(false),
      }, ws);
      
      return;
    }

    // New player joining
    // If game is in progress, allow joining as spectator
    if (this.gameState.phase !== 'waiting' && this.gameState.phase !== 'ended') {
      // Join as spectator
      this.sessions.set(ws, `spectator_${message.playerId}`);
      ws.serializeAttachment(`spectator_${message.playerId}`);
      
      // Send current state to the spectator
      this.send(ws, {
        type: 'room_state',
        state: this.serializeGameState(),
      });
      
      this.send(ws, {
        type: 'player_joined',
        playerId: message.playerId,
        playerName: message.playerName,
      } as any);
      
      return;
    }
    
    // Check if game has ended
    if (this.gameState.phase === 'ended') {
      // Join as spectator for ended game
      this.sessions.set(ws, `spectator_${message.playerId}`);
      ws.serializeAttachment(`spectator_${message.playerId}`);
      
      this.send(ws, {
        type: 'room_state',
        state: this.serializeGameState(),
      });
      
      return;
    }

    // Check if room is full (only for waiting phase)
    if (this.gameState.players.size >= this.gameState.settings.maxPlayers) {
      this.sendError(ws, 'Room is full');
      return;
    }

    // Add player
    const player: Player = {
      id: message.playerId,
      name: message.playerName,
      avatar: message.avatar,
      health: 10,
      maxHealth: 10,
      location: {
        type: 'city',
        cityId: message.playerId, // Each player starts in their own city
      },
      class: null,
      classOptions: null,
      inventory: [],
      purchaseRights: [],
      stepsRemaining: 0,
      isAlive: true,
      isReady: false,
      isConnected: true,
    };

    this.gameState.players.set(message.playerId, player);
    this.sessions.set(ws, message.playerId);
    ws.serializeAttachment(message.playerId);

    await this.saveGameState();
    await this.updateRoomRegistry();

    // Broadcast updated state to ALL players (including the new one)
    this.broadcast({
      type: 'room_state',
      state: this.serializeGameState(),
    });
  }

  private async handleSelectClass(ws: WebSocket, message: { playerId: string; selectedClass: PlayerClass }): Promise<void> {
    if (!this.gameState || this.gameState.phase !== 'class_selection') {
      this.sendError(ws, 'Not in class selection phase');
      return;
    }

    const player = this.gameState.players.get(message.playerId);
    if (!player) {
      this.sendError(ws, 'Player not found');
      return;
    }
    
    // Check if it's this player's turn to select
    if (this.gameState.currentClassSelectionPlayerId !== message.playerId) {
      this.sendError(ws, 'Not your turn to select class');
      return;
    }

    if (!player.classOptions) {
      this.sendError(ws, 'No class options available');
      return;
    }

    if (!player.classOptions.includes(message.selectedClass)) {
      this.sendError(ws, 'Invalid class selection');
      return;
    }

    // Check class limit (max 2 per class)
    const classCount = Array.from(this.gameState.players.values()).filter(
      p => p.class === message.selectedClass
    ).length;

    if (classCount >= 2) {
      this.sendError(ws, 'Class limit reached');
      return;
    }

    player.class = message.selectedClass;
    player.inventory = getInitialInventory(message.selectedClass);
    player.purchaseRights = getInitialPurchaseRights(message.selectedClass);
    player.isReady = true;
    player.classOptions = null; // Clear options after selection

    // Move to next player for class selection
    const playerIds = Array.from(this.gameState.players.keys());
    const currentIndex = playerIds.indexOf(message.playerId);
    const nextIndex = currentIndex + 1;
    
    if (nextIndex < playerIds.length) {
      // Give next player their class options
      const nextPlayerId = playerIds[nextIndex];
      const nextPlayer = this.gameState.players.get(nextPlayerId)!;
      nextPlayer.classOptions = getTwoRandomClasses();
      this.gameState.currentClassSelectionPlayerId = nextPlayerId;
      
      await this.saveGameState();
      
      // Broadcast updated state to all players (without logs)
      this.broadcast({
        type: 'room_state',
        state: this.serializeGameState(false),
      });
    } else {
      // All players have selected, start gameplay
      this.gameState.currentClassSelectionPlayerId = null;
      
      // Save the last player's selection before starting gameplay
      await this.saveGameState();
      
      await this.startGameplay();
    }
  }

  private async handleReady(ws: WebSocket, message: { playerId: string }): Promise<void> {
    if (!this.gameState) {
      this.sendError(ws, 'Game not initialized');
      return;
    }

    const player = this.gameState.players.get(message.playerId);
    if (!player) {
      this.sendError(ws, 'Player not found');
      return;
    }

    player.isReady = true;
    await this.saveGameState();
  }

  private async handleStartGame(ws: WebSocket, message: { playerId: string }): Promise<void> {
    if (!this.gameState) {
      this.sendError(ws, 'Game not initialized');
      return;
    }

    if (message.playerId !== this.gameState.hostId) {
      this.sendError(ws, 'Only host can start the game');
      return;
    }

    if (this.gameState.players.size < this.gameState.settings.minPlayers) {
      this.sendError(ws, 'Not enough players');
      return;
    }

    if (this.gameState.phase !== 'waiting') {
      this.sendError(ws, 'Game already started');
      return;
    }

    // Start class selection phase with turn-based selection
    this.gameState.phase = 'class_selection';
    
    // Get all players in order (deterministic)
    const playerIds = Array.from(this.gameState.players.keys());
    
    // First player starts selecting
    const firstPlayerId = playerIds[0];
    this.gameState.currentClassSelectionPlayerId = firstPlayerId;
    
    // Only give class options to the first player
    const firstPlayer = this.gameState.players.get(firstPlayerId)!;
    firstPlayer.classOptions = getTwoRandomClasses();
    firstPlayer.isReady = false;
    
    // Clear class options for other players (they'll get them when it's their turn)
    for (const [playerId, player] of this.gameState.players) {
      if (playerId !== firstPlayerId) {
        player.classOptions = null;
        player.isReady = false;
      }
    }

    await this.saveGameState();

    // Broadcast updated state to all players (without logs)
    this.broadcast({
      type: 'room_state',
      state: this.serializeGameState(false),
    });
  }

  private async handlePerformAction(ws: WebSocket, message: any): Promise<void> {
    if (!this.gameState || this.gameState.phase !== 'playing') {
      this.sendError(ws, 'Game not in progress');
      return;
    }

    const { playerId, action } = message;
    
    // Verify it's the player's turn
    if (this.gameState.currentPlayerId !== playerId) {
      this.sendError(ws, 'Not your turn');
      return;
    }

    const player = this.gameState.players.get(playerId);
    if (!player || !player.isAlive) {
      this.sendError(ws, 'Player not found or not alive');
      return;
    }

    // Check if player has steps
    if (player.stepsRemaining <= 0) {
      this.sendError(ws, 'No steps remaining');
      return;
    }

    try {
      // Process action based on type
      let actionResult: ActionResult;
      
      switch (action.type) {
        case 'move':
          actionResult = await this.handleMoveAction(player, action);
          break;
        case 'purchase':
          actionResult = await this.handlePurchaseAction(player, action);
          break;
        case 'attack_knife':
        case 'attack_horse':
        case 'shoot_arrow':
        case 'punch':
        case 'kick':
          // These all return 'attack' type
          if (action.type === 'attack_knife') {
            actionResult = await this.handleAttackKnifeAction(player, action);
          } else if (action.type === 'attack_horse') {
            actionResult = await this.handleAttackHorseAction(player, action);
          } else if (action.type === 'shoot_arrow') {
            actionResult = await this.handleShootArrowAction(player, action);
          } else if (action.type === 'punch') {
            actionResult = await this.handlePunchAction(player, action);
          } else {
            actionResult = await this.handleKickAction(player, action);
          }
          break;
        case 'rob':
          actionResult = await this.handleRobAction(player, action);
          break;
        case 'use_potion':
          actionResult = await this.handleUsePotionAction(player, action);
          break;
        case 'launch_rocket':
          actionResult = await this.handleLaunchRocketAction(player, action);
          break;
        case 'place_bomb':
          actionResult = await this.handlePlaceBombAction(player, action);
          break;
        case 'detonate_bomb':
          actionResult = await this.handleDetonateBombAction(player, action);
          break;
        case 'teleport':
          actionResult = await this.handleTeleportAction(player, action);
          break;
        case 'hug':
          actionResult = await this.handleHugAction(player, action);
          break;
        default:
          this.sendError(ws, 'Unknown action type');
          return;
      }

      // Record action log with structured result
      const newLog: ActionLog = {
        id: crypto.randomUUID(),
        turn: this.gameState.currentTurn,
        playerId: player.id,
        playerName: player.name,
        type: action.type,
        actionResult,
        timestamp: Date.now(),
      };
      
      this.gameState.actionLogs.push(newLog);

      // Keep only last 50 logs
      if (this.gameState.actionLogs.length > 50) {
        this.gameState.actionLogs = this.gameState.actionLogs.slice(-50);
      }

      // Broadcast new log incrementally (separate from state)
      this.broadcast({
        type: 'new_action_logs',
        logs: [newLog],
      });

      // Deduct step
      player.stepsRemaining--;

      // Save state immediately after action
      await this.saveGameState();

      // Check if turn is over
      if (player.stepsRemaining <= 0) {
        await this.nextTurn();
        // Save again after turn change
        await this.saveGameState();
      }
      
      // Broadcast updated state (without logs to save bandwidth)
      this.broadcast({
        type: 'room_state',
        state: this.serializeGameState(false),
      });
    } catch (error: any) {
      console.error('Action failed:', error);
      this.sendError(ws, error.message || 'Action failed');
    }
  }

  private async handleMoveAction(player: Player, action: any): Promise<ActionResult> {
    if (!action.targetLocation) {
      throw new Error('Target location required');
    }

    // Update player location
    player.location = action.targetLocation;
    return {
      type: 'move',
      location: action.targetLocation,
    };
  }

  private async handlePurchaseAction(player: Player, action: any): Promise<ActionResult> {
    // Verify in own city
    if (player.location.type !== 'city' || player.location.cityId !== player.id) {
      throw new Error('Can only purchase in your own city');
    }

    if (!action.purchaseRight) {
      throw new Error('Purchase right required');
    }

    // Check if player has the purchase right
    const rightIndex = player.purchaseRights.indexOf(action.purchaseRight);
    if (rightIndex === -1) {
      throw new Error('You do not have this purchase right');
    }

    // Consumables can be purchased multiple times (don't remove purchase right)
    const consumables = ['potion', 'arrow', 'rocket_ammo', 'bomb'];
    const isConsumable = consumables.includes(action.purchaseRight);
    
    // Equipment purchases consume the purchase right (one-time only)
    const equipment = [
      'bow', 'rocket_launcher', 'ufo', 'knife', 'horse',
      'bronze_glove', 'silver_glove', 'gold_glove',
      'bronze_belt', 'silver_belt', 'gold_belt'
    ];
    
    if (!isConsumable && equipment.includes(action.purchaseRight)) {
      // Remove purchase right for equipment
      player.purchaseRights.splice(rightIndex, 1);
    }

    // Add item to inventory
    player.inventory.push(action.purchaseRight as any);
    return {
      type: 'purchase',
      item: action.purchaseRight,
    };
  }

  private async handleAttackKnifeAction(player: Player, action: any): Promise<ActionResult> {
    if (!action.target) {
      throw new Error('Target required');
    }

    const target = this.gameState!.players.get(action.target);
    if (!target || !target.isAlive) {
      throw new Error('Target not found or not alive');
    }

    // Check same location
    if (player.location.type !== target.location.type || 
        player.location.cityId !== target.location.cityId) {
      throw new Error('Target not at same location');
    }

    // Check has knife
    if (!player.inventory.includes('knife')) {
      throw new Error('You do not have a knife');
    }

    // Calculate damage
    const knifeCount = player.inventory.filter(i => i === 'knife').length;
    const shirtCount = target.inventory.filter(i => i === 'shirt').length;
    const damage = Math.max(0, knifeCount - shirtCount + 1);

    // Apply damage
    target.health = Math.max(0, target.health - damage);

    // Vampire passive: heal 1 HP when attacking with knife
    if (player.class === 'vampire') {
      player.health = Math.min(player.maxHealth, player.health + 1);
    }

    // Check if target died
    const killed = target.health <= 0;
    if (killed) {
      target.isAlive = false;
      await this.handlePlayerDeath(player, target);
    }
    
    return {
      type: 'attack',
      target: target.id,
      targetName: target.name,
      damage,
      killed,
    };
  }

  private async handleAttackHorseAction(player: Player, action: any): Promise<ActionResult> {
    if (!action.target) {
      throw new Error('Target required');
    }

    const target = this.gameState!.players.get(action.target);
    if (!target || !target.isAlive) {
      throw new Error('Target not found or not alive');
    }

    // Check in city
    if (player.location.type !== 'city' || target.location.type !== 'city' ||
        player.location.cityId !== target.location.cityId) {
      throw new Error('Both must be in same city');
    }

    // Check has horse
    if (!player.inventory.includes('horse')) {
      throw new Error('You do not have a horse');
    }

    // Calculate damage
    const horseCount = player.inventory.filter(i => i === 'horse').length;
    const shirtCount = target.inventory.filter(i => i === 'shirt').length;
    const damage = Math.max(0, 2 + horseCount - shirtCount + 1);

    // Apply damage
    target.health = Math.max(0, target.health - damage);

    // Force move to central
    target.location = { type: 'central' };

    // Check if target died
    const killed = target.health <= 0;
    if (killed) {
      target.isAlive = false;
      await this.handlePlayerDeath(player, target);
    }
    
    return {
      type: 'attack',
      target: target.id,
      targetName: target.name,
      damage,
      killed,
    };
  }

  private async handleRobAction(player: Player, action: any): Promise<ActionResult> {
    if (!action.target) {
      throw new Error('Target required');
    }

    const target = this.gameState!.players.get(action.target);
    if (!target || !target.isAlive) {
      throw new Error('Target not found or not alive');
    }

    // Check same location
    if (player.location.type !== target.location.type || 
        player.location.cityId !== target.location.cityId) {
      throw new Error('Target not at same location');
    }

    // Check if target has items
    if (target.inventory.length === 0) {
      throw new Error('Target has no items');
    }

    let stolenItem: ItemType | undefined;
    
    // If specific item is specified, try to steal it
    if (action.item) {
      const itemIndex = target.inventory.indexOf(action.item);
      if (itemIndex !== -1) {
        stolenItem = target.inventory.splice(itemIndex, 1)[0];
      }
    } else {
      // If no specific item, steal random item
      const randomIndex = Math.floor(Math.random() * target.inventory.length);
      stolenItem = target.inventory.splice(randomIndex, 1)[0];
    }
    
    // Success if item was stolen
    if (stolenItem) {
      player.inventory.push(stolenItem);
      return {
        type: 'rob',
        target: target.id,
        targetName: target.name,
        item: stolenItem,
        success: true,
      };
    }
    
    return {
      type: 'rob',
      target: target.id,
      targetName: target.name,
      success: false,
    };
  }

  // Mage: Use potion (delayed heal)
  private async handleUsePotionAction(player: Player, action: any): Promise<ActionResult> {
    if (player.class !== 'mage') {
      throw new Error('Only mages can use potions');
    }

    if (!action.targetLocation) {
      throw new Error('Target location required');
    }

    if (!action.value || action.value < 1) {
      throw new Error('Potion value must be at least 1');
    }

    // Add delayed effect
    this.gameState!.delayedEffects.push({
      id: crypto.randomUUID(),
      playerId: player.id,
      type: 'potion',
      targetLocation: action.targetLocation,
      value: action.value,
      turnDelay: 1, // Trigger next turn
      createdAtTurn: this.gameState!.currentTurn,
    });

    return {
      type: 'use_potion',
      location: action.targetLocation,
      steps: action.value,
    };
  }

  // Archer: Shoot arrow
  private async handleShootArrowAction(player: Player, action: any): Promise<ActionResult> {
    if (player.class !== 'archer') {
      throw new Error('Only archers can shoot arrows');
    }

    if (!action.target) {
      throw new Error('Target required');
    }

    const target = this.gameState!.players.get(action.target);
    if (!target || !target.isAlive) {
      throw new Error('Target not found or not alive');
    }

    // Check has bow
    const bowCount = player.inventory.filter(i => i === 'bow').length;
    if (bowCount === 0) {
      throw new Error('You do not have a bow');
    }

    // Check has arrow
    const arrowIndex = player.inventory.indexOf('arrow');
    if (arrowIndex === -1) {
      throw new Error('You do not have arrows');
    }

    // Consume arrow
    player.inventory.splice(arrowIndex, 1);

    // Check range: same location or adjacent (central <-> city)
    const isSameLocation = player.location.type === target.location.type && 
                           player.location.cityId === target.location.cityId;
    const isAdjacent = (player.location.type === 'central' && target.location.type === 'city') ||
                       (player.location.type === 'city' && target.location.type === 'central');

    if (!isSameLocation && !isAdjacent) {
      throw new Error('Target out of range');
    }

    // Calculate damage
    const shirtCount = target.inventory.filter(i => i === 'shirt').length;
    const damage = Math.max(0, 1 + bowCount - 1 - shirtCount + 1);

    target.health = Math.max(0, target.health - damage);

    const killed = target.health <= 0;
    if (killed) {
      target.isAlive = false;
      await this.handlePlayerDeath(player, target);
    }

    return {
      type: 'attack',
      target: target.id,
      targetName: target.name,
      damage,
      killed,
    };
  }

  // Rocketeer: Launch rocket (delayed AOE)
  private async handleLaunchRocketAction(player: Player, action: any): Promise<ActionResult> {
    if (player.class !== 'rocketeer') {
      throw new Error('Only rocketeers can launch rockets');
    }

    if (!action.targetLocation) {
      throw new Error('Target location required');
    }

    // Check has rocket launcher
    const launcherCount = player.inventory.filter(i => i === 'rocket_launcher').length;
    if (launcherCount === 0) {
      throw new Error('You do not have a rocket launcher');
    }

    // Check has rocket ammo
    const ammoIndex = player.inventory.indexOf('rocket_ammo');
    if (ammoIndex === -1) {
      throw new Error('You do not have rocket ammo');
    }

    // Consume ammo
    player.inventory.splice(ammoIndex, 1);

    // Add delayed effect
    const damage = 2 + launcherCount - 1;
    this.gameState!.delayedEffects.push({
      id: crypto.randomUUID(),
      playerId: player.id,
      type: 'rocket',
      targetLocation: action.targetLocation,
      value: damage,
      turnDelay: 1, // Trigger next turn
      createdAtTurn: this.gameState!.currentTurn,
    });

    return {
      type: 'launch_rocket',
      location: action.targetLocation,
      damage,
    };
  }

  // Bomber: Place bomb
  private async handlePlaceBombAction(player: Player, _action: any): Promise<ActionResult> {
    if (player.class !== 'bomber') {
      throw new Error('Only bombers can place bombs');
    }

    // Check has bomb item
    const bombIndex = player.inventory.indexOf('bomb');
    if (bombIndex === -1) {
      throw new Error('You do not have bombs');
    }

    // Consume bomb
    player.inventory.splice(bombIndex, 1);

    // Place bomb at current location
    this.gameState!.bombs.push({
      id: crypto.randomUUID(),
      playerId: player.id,
      location: { ...player.location },
      count: 1,
    });

    return {
      type: 'place_bomb',
      location: player.location,
    };
  }

  // Bomber: Detonate all bombs
  private async handleDetonateBombAction(player: Player, _action: any): Promise<ActionResult> {
    if (player.class !== 'bomber') {
      throw new Error('Only bombers can detonate bombs');
    }

    const playerBombs = this.gameState!.bombs.filter(b => b.playerId === player.id);
    if (playerBombs.length === 0) {
      throw new Error('You have no bombs to detonate');
    }

    const victims: Array<{ name: string; damage: number; killed: boolean }> = [];

    for (const bomb of playerBombs) {
      // Find all players at bomb location
      const playersAtLocation = Array.from(this.gameState!.players.values()).filter(p => 
        p.isAlive &&
        p.location.type === bomb.location.type &&
        p.location.cityId === bomb.location.cityId
      );

      const damage = bomb.count;
      for (const victim of playersAtLocation) {
        victim.health = Math.max(0, victim.health - damage);

        const killed = victim.health <= 0;
        if (killed) {
          victim.isAlive = false;
          await this.handlePlayerDeath(player, victim);
        }
        
        victims.push({
          name: victim.name,
          damage,
          killed,
        });
      }
    }

    // Remove all player's bombs
    this.gameState!.bombs = this.gameState!.bombs.filter(b => b.playerId !== player.id);

    return {
      type: 'detonate_bomb',
      victims,
    };
  }

  // Boxer: Punch attack
  private async handlePunchAction(player: Player, action: any): Promise<ActionResult> {
    if (player.class !== 'boxer') {
      throw new Error('Only boxers can punch');
    }

    if (!action.target) {
      throw new Error('Target required');
    }

    const target = this.gameState!.players.get(action.target);
    if (!target || !target.isAlive) {
      throw new Error('Target not found or not alive');
    }

    // Check same location
    if (player.location.type !== target.location.type || 
        player.location.cityId !== target.location.cityId) {
      throw new Error('Target not at same location');
    }

    // Check has gloves
    const bronzeCount = player.inventory.filter(i => i === 'bronze_glove').length;
    const silverCount = player.inventory.filter(i => i === 'silver_glove').length;
    const goldCount = player.inventory.filter(i => i === 'gold_glove').length;

    if (bronzeCount + silverCount + goldCount === 0) {
      throw new Error('You do not have any gloves');
    }

    // Calculate damage (true damage)
    let damage = 0;
    damage += bronzeCount > 0 ? (1 + bronzeCount - 1) : 0;
    damage += silverCount > 0 ? (2 + silverCount - 1) : 0;
    damage += goldCount > 0 ? (3 + goldCount - 1) : 0;

    target.health = Math.max(0, target.health - damage);

    const killed = target.health <= 0;
    if (killed) {
      target.isAlive = false;
      await this.handlePlayerDeath(player, target);
    }

    return {
      type: 'attack',
      target: target.id,
      targetName: target.name,
      damage,
      killed,
    };
  }

  // Monk: Kick attack (with knock back)
  private async handleKickAction(player: Player, action: any): Promise<ActionResult> {
    if (player.class !== 'monk') {
      throw new Error('Only monks can kick');
    }

    if (!action.target) {
      throw new Error('Target required');
    }

    const target = this.gameState!.players.get(action.target);
    if (!target || !target.isAlive) {
      throw new Error('Target not found or not alive');
    }

    // Check has belts
    const bronzeCount = player.inventory.filter(i => i === 'bronze_belt').length;
    const silverCount = player.inventory.filter(i => i === 'silver_belt').length;
    const goldCount = player.inventory.filter(i => i === 'gold_belt').length;

    if (bronzeCount + silverCount + goldCount === 0) {
      throw new Error('You do not have any belts');
    }

    // Silver belt can attack from anywhere, bronze and gold require same location
    const hasSilver = silverCount > 0;
    const isSameLocation = player.location.type === target.location.type && 
                           player.location.cityId === target.location.cityId;

    if (!hasSilver && !isSameLocation) {
      throw new Error('Target not at same location (need silver belt for ranged attack)');
    }

    // Calculate damage (true damage)
    let damage = 0;
    damage += bronzeCount > 0 ? (1 + bronzeCount - 1) : 0;
    damage += silverCount > 0 ? (1 + silverCount - 1) : 0;
    damage += goldCount > 0 ? (2 + goldCount - 1) : 0;

    target.health = Math.max(0, target.health - damage);

    // Force move (1 step away)
    const newLocation = target.location.type === 'central'
      ? { type: 'city' as const, cityId: Array.from(this.gameState!.players.values()).filter(p => p.isAlive)[Math.floor(Math.random() * this.gameState!.players.size)].id }
      : { type: 'central' as const };
    
    target.location = newLocation;

    const killed = target.health <= 0;
    if (killed) {
      target.isAlive = false;
      await this.handlePlayerDeath(player, target);
    }

    return {
      type: 'attack',
      target: target.id,
      targetName: target.name,
      damage,
      killed,
    };
  }

  // Alien: Teleport
  private async handleTeleportAction(player: Player, action: any): Promise<ActionResult> {
    if (player.class !== 'alien') {
      throw new Error('Only aliens can teleport');
    }

    if (!action.targetLocation) {
      throw new Error('Target location required');
    }

    // Check has UFO
    const ufoCount = player.inventory.filter(i => i === 'ufo').length;
    if (ufoCount === 0) {
      throw new Error('You do not have a UFO');
    }

    player.location = action.targetLocation;

    return {
      type: 'teleport',
      location: action.targetLocation,
    };
  }

  // Fatty: Hug (move with someone else)
  private async handleHugAction(player: Player, action: any): Promise<ActionResult> {
    if (player.class !== 'fatty') {
      throw new Error('Only Fatty can hug');
    }

    if (!action.target) {
      throw new Error('Target required');
    }

    if (!action.targetLocation) {
      throw new Error('Target location required');
    }

    const target = this.gameState!.players.get(action.target);
    if (!target || !target.isAlive) {
      throw new Error('Target not found or not alive');
    }

    // Check same location
    if (player.location.type !== target.location.type || 
        player.location.cityId !== target.location.cityId) {
      throw new Error('Target not at same location');
    }

    // Move both players (costs 2 steps total, already deducted 1, need to deduct 1 more)
    if (player.stepsRemaining < 1) {
      throw new Error('Not enough steps (hug costs 2 steps total)');
    }

    player.location = action.targetLocation;
    target.location = action.targetLocation;

    // Deduct extra step
    player.stepsRemaining--;

    return {
      type: 'hug',
      target: target.id,
      targetName: target.name,
      location: action.targetLocation,
    };
  }

  private async handlePlayerDeath(killer: Player, victim: Player): Promise<void> {
    // Record death time
    victim.deathTime = Date.now();
    
    // Killer can take 0 or 1 item (including purchase rights)
    // Combine inventory and purchase rights for loot selection
    const allLootableItems = [...victim.inventory, ...victim.purchaseRights];
    
    if (allLootableItems.length > 0 && Math.random() > 0.5) {
      const randomIndex = Math.floor(Math.random() * allLootableItems.length);
      const lootedItem = allLootableItems[randomIndex];
      
      // Check if it's from inventory or purchase rights
      const invIndex = victim.inventory.indexOf(lootedItem as ItemType);
      if (invIndex !== -1) {
        // It's an inventory item
        victim.inventory.splice(invIndex, 1);
        killer.inventory.push(lootedItem as ItemType);
      } else {
        // It's a purchase right
        const rightIndex = victim.purchaseRights.indexOf(lootedItem as PurchaseRightType);
        if (rightIndex !== -1) {
          victim.purchaseRights.splice(rightIndex, 1);
          killer.purchaseRights.push(lootedItem as PurchaseRightType);
        }
      }
    }
    
    // Destroy remaining items and purchase rights
    victim.inventory = [];
    victim.purchaseRights = [];

    // Check win condition
    const alivePlayers = Array.from(this.gameState!.players.values()).filter(p => p.isAlive);
    
    if (alivePlayers.length === 1) {
      // Game ended - calculate final rankings
      this.gameState!.phase = 'ended';
      
      // Calculate ranks based on death time (later death = better rank)
      const allPlayers = Array.from(this.gameState!.players.values());
      const deadPlayers = allPlayers.filter(p => !p.isAlive && p.deathTime).sort((a, b) => b.deathTime! - a.deathTime!);
      
      // Winner gets rank 1
      alivePlayers[0].rank = 1;
      
      // Assign ranks to dead players (most recent death = rank 2, etc.)
      deadPlayers.forEach((player, index) => {
        player.rank = index + 2;
      });
      
      this.broadcast({
        type: 'game_ended',
        winnerId: alivePlayers[0].id,
        reason: 'Last player standing',
      });
    } else {
      // Game continues - assign temporary rank based on current death order
      const allPlayers = Array.from(this.gameState!.players.values());
      const deadPlayers = allPlayers.filter(p => !p.isAlive && p.deathTime).sort((a, b) => b.deathTime! - a.deathTime!);
      
      // Dead players get ranks counting from the end
      deadPlayers.forEach((player, index) => {
        player.rank = allPlayers.length - index;
      });
    }
  }

  private async nextTurn(): Promise<void> {
    if (!this.gameState) return;

    const newLogs: ActionLog[] = [];

    // Process delayed effects for the turn that just ended
    const effectLogs = await this.processDelayedEffects();
    newLogs.push(...effectLogs);

    // Get alive players
    const alivePlayers = Array.from(this.gameState.players.values()).filter(p => p.isAlive);
    
    if (alivePlayers.length <= 1) {
      return; // Game should have ended
    }

    // Find next player
    const currentIndex = alivePlayers.findIndex(p => p.id === this.gameState!.currentPlayerId);
    const nextIndex = (currentIndex + 1) % alivePlayers.length;
    const nextPlayer = alivePlayers[nextIndex];

    // If we wrapped around to first player, start new round
    if (nextIndex === 0) {
      this.gameState.currentTurn++;
      // Distribute steps for the new round
      this.distributeSteps(alivePlayers);
      
      // Check for Alien passive (2 UFOs = free teleport at round end)
      const passiveLogs = await this.processAlienPassive();
      newLogs.push(...passiveLogs);
    }

    // Broadcast new logs if any
    if (newLogs.length > 0) {
      this.broadcast({
        type: 'new_action_logs',
        logs: newLogs,
      });
    }

    this.gameState.currentPlayerId = nextPlayer.id;

    this.broadcast({
      type: 'turn_start',
      playerId: nextPlayer.id,
      steps: nextPlayer.stepsRemaining,
    });
  }

  // Process delayed effects (potions and rockets)
  private async processDelayedEffects(): Promise<ActionLog[]> {
    if (!this.gameState) return [];

    const newLogs: ActionLog[] = [];
    const currentTurn = this.gameState.currentTurn;
    const effectsToProcess = this.gameState.delayedEffects.filter(
      effect => currentTurn - effect.createdAtTurn >= effect.turnDelay
    );

    for (const effect of effectsToProcess) {
      if (effect.type === 'potion') {
        // Heal all players at location
        const targets = Array.from(this.gameState.players.values()).filter(p =>
          p.isAlive &&
          p.location.type === effect.targetLocation.type &&
          p.location.cityId === effect.targetLocation.cityId
        );

        for (const target of targets) {
          const healAmount = effect.value;
          const oldHealth = target.health;
          target.health = Math.min(target.maxHealth, target.health + healAmount);
          
          const locationOwner = effect.targetLocation.cityId 
            ? this.gameState.players.get(effect.targetLocation.cityId) 
            : undefined;
          
          const log: ActionLog = {
            id: crypto.randomUUID(),
            turn: currentTurn,
            playerId: effect.playerId,
            playerName: this.gameState.players.get(effect.playerId)?.name || 'Unknown',
            type: 'use_potion',
            target: target.id,
            targetName: target.name,
            targetLocation: {
              ...effect.targetLocation,
              cityName: locationOwner?.name,
            },
            result: `Healed ${target.health - oldHealth} HP`,
            healed: target.health - oldHealth,
            timestamp: Date.now(),
          };
          
          this.gameState.actionLogs.push(log);
          newLogs.push(log);
        }
      } else if (effect.type === 'rocket') {
        // Damage all players at location (true damage)
        const targets = Array.from(this.gameState.players.values()).filter(p =>
          p.isAlive &&
          p.location.type === effect.targetLocation.type &&
          p.location.cityId === effect.targetLocation.cityId
        );

        for (const target of targets) {
          target.health = Math.max(0, target.health - effect.value);

          if (target.health <= 0) {
            target.isAlive = false;
            const launcher = this.gameState.players.get(effect.playerId);
            if (launcher) {
              await this.handlePlayerDeath(launcher, target);
            }
          }
          
          const locationOwner = effect.targetLocation.cityId 
            ? this.gameState.players.get(effect.targetLocation.cityId) 
            : undefined;
          
          const log: ActionLog = {
            id: crypto.randomUUID(),
            turn: currentTurn,
            playerId: effect.playerId,
            playerName: this.gameState.players.get(effect.playerId)?.name || 'Unknown',
            type: 'launch_rocket',
            target: target.id,
            targetName: target.name,
            targetLocation: {
              ...effect.targetLocation,
              cityName: locationOwner?.name,
            },
            result: `${effect.value} true damage${target.health <= 0 ? ' (killed)' : ''}`,
            damage: effect.value,
            timestamp: Date.now(),
          };
          
          this.gameState.actionLogs.push(log);
          newLogs.push(log);
        }
      }
    }

    // Remove processed effects
    this.gameState.delayedEffects = this.gameState.delayedEffects.filter(
      effect => currentTurn - effect.createdAtTurn < effect.turnDelay
    );
    
    return newLogs;
  }

  // Check for Alien passive (2 UFOs = free teleport)
  private async processAlienPassive(): Promise<ActionLog[]> {
    if (!this.gameState) return [];

    const newLogs: ActionLog[] = [];

    for (const player of this.gameState.players.values()) {
      if (player.isAlive && player.class === 'alien') {
        const ufoCount = player.inventory.filter(i => i === 'ufo').length;
        if (ufoCount >= 2) {
          // For now, teleport to central (in real game, player should choose)
          // This is a simplified implementation
          if (player.location.type !== 'central') {
            player.location = { type: 'central' };
            
            const log: ActionLog = {
              id: crypto.randomUUID(),
              turn: this.gameState.currentTurn,
              playerId: player.id,
              playerName: player.name,
              type: 'teleport',
              result: 'Free teleport to central (2 UFOs passive)',
              timestamp: Date.now(),
            };
            
            this.gameState.actionLogs.push(log);
            newLogs.push(log);
          }
        }
      }
    }
    
    return newLogs;
  }

  private distributeSteps(players: Player[]): void {
    // Reset all players to 1 step (base)
    for (const player of players) {
      player.stepsRemaining = 1;
    }

    // Distribute additional steps from pool (pool size = number of players)
    const stepPool = players.length;
    for (let i = 0; i < stepPool; i++) {
      // Randomly pick a player to give an extra step
      const randomIndex = Math.floor(Math.random() * players.length);
      players[randomIndex].stepsRemaining++;
    }
  }

  private async startGameplay(): Promise<void> {
    if (!this.gameState) return;

    this.gameState.phase = 'playing';
    this.gameState.currentTurn = 1;
    
    // Select first player randomly
    const playerIds = Array.from(this.gameState.players.keys());
    this.gameState.currentPlayerId = playerIds[Math.floor(Math.random() * playerIds.length)];

    // Distribute steps for all players
    const alivePlayers = Array.from(this.gameState.players.values()).filter(p => p.isAlive);
    this.distributeSteps(alivePlayers);

    const stepPool = this.gameState.players.size;
    this.gameState.stepPool = stepPool;

    await this.saveGameState();

    // Broadcast updated game state to all players (without logs)
    // This single broadcast contains all information including phase, current player, and steps
    this.broadcast({
      type: 'room_state',
      state: this.serializeGameState(false),
    });
  }

  private send(ws: WebSocket, message: ServerMessage): void {
    try {
      ws.send(JSON.stringify(message));
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }

  private broadcast(message: ServerMessage, exclude?: WebSocket): void {
    const messageStr = JSON.stringify(message);
    for (const ws of this.sessions.keys()) {
      if (ws !== exclude && ws.readyState === 1) { // 1 = OPEN
        try {
          ws.send(messageStr);
        } catch (error) {
          console.error('Error broadcasting message:', error);
        }
      }
    }
  }

  private sendError(ws: WebSocket, errorMessage: string): void {
    this.send(ws, {
      type: 'error',
      message: errorMessage,
    });
  }

  private serializeGameState(includeLogs: boolean = true): any {
    if (!this.gameState) return null;

    const state = {
      ...this.gameState,
      players: Array.from(this.gameState.players.entries()).map(([_id, player]) => ({
        ...player,
      })),
    };

    // Optionally exclude logs for incremental updates
    if (!includeLogs) {
      return {
        ...state,
        actionLogs: undefined,
      };
    }

    return state;
  }

  private async saveGameState(): Promise<void> {
    if (!this.gameState) return;
    
    this.gameState.updatedAt = Date.now();
    await this.ctx.storage.put('gameState', this.serializeGameState());
  }

  private async updateRoomRegistry(): Promise<void> {
    if (!this.gameState || !this.roomId) return;
    
    // Don't update registry if room is not public
    if (!this.gameState.settings.isPublic) return;
    
    try {
      const registryId = this.env.ROOM_REGISTRY.idFromName('global');
      const registry = this.env.ROOM_REGISTRY.get(registryId);
      
      // Count connected players (not spectators)
      const connectedPlayerCount = Array.from(this.gameState.players.values()).filter(
        player => player.isConnected
      ).length;
      
      if (connectedPlayerCount > 0) {
        // Update room info in registry
        const hostPlayer = this.gameState.players.get(this.gameState.hostId);
        await registry.fetch(new Request('http://internal/update', {
          method: 'POST',
          body: JSON.stringify({
            id: this.roomId,
            hostId: this.gameState.hostId,
            hostName: hostPlayer?.name || 'Unknown',
            playerCount: connectedPlayerCount,
            maxPlayers: this.gameState.settings.maxPlayers,
            phase: this.gameState.phase,
            isPublic: this.gameState.settings.isPublic,
            createdAt: this.gameState.createdAt,
          }),
        }));
      } else {
        // Remove room from registry if no connected players
        await registry.fetch(new Request('http://internal/unregister', {
          method: 'POST',
          body: JSON.stringify({ roomId: this.roomId }),
        }));
      }
    } catch (error) {
      console.error('Failed to update room registry:', error);
    }
  }

  async alarm(): Promise<void> {
    // Called when the alarm triggers (6 hours after last player left)
    // If still no active connections, clean up the room
    if (this.sessions.size === 0) {
      console.log(`Cleaning up inactive room ${this.roomId}`);
      
      // Remove from registry
      await this.updateRoomRegistry();
      
      // Optionally: Delete the Durable Object state
      // await this.ctx.storage.deleteAll();
    } else {
      // Someone reconnected, cancel the cleanup
      console.log(`Room ${this.roomId} has active connections, keeping alive`);
    }
  }
}

interface Env {
  GAME_ROOM: DurableObjectNamespace<GameRoom>;
}
