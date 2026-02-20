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

function getPurchaseCost(item: PurchaseRightType): number {
  switch (item) {
    case 'bow':
    case 'rocket_launcher':
    case 'ufo':
    case 'silver_glove':
    case 'silver_belt':
      return 2;
    case 'gold_glove':
    case 'gold_belt':
      return 3;
    default:
      return 1; // 刀、马、铜装备、炸弹、箭头、药水等默认为 1 步
  }
}

function getAvailableClasses(gameState: GameState, count: number): PlayerClass[] {
  const classCounts = new Map<PlayerClass, number>();
  for (const p of gameState.players.values()) {
    if (p.class) {
      classCounts.set(p.class, (classCounts.get(p.class) || 0) + 1);
    }
  }
  // 过滤掉已经有2个人的职业
  const available = getAllPlayerClasses().filter(c => (classCounts.get(c) || 0) < 2);
  const shuffled = available.sort(() => Math.random() - 0.5);
  // 返回指定数量（如果不够则返回剩余的所有可用职业）
  return shuffled.slice(0, count);
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
      return ['knife', 'horse']; // 修改：移除了 'potion'，无需购买直接施放
    case 'archer':
      return ['knife', 'horse', 'bow', 'arrow'];
    case 'rocketeer':
      return ['knife', 'horse', 'rocket_launcher', 'rocket_ammo'];
    case 'bomber':
      return ['knife', 'horse'];
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
        settings: {
          ...data.settings,
          initialHealth: data.settings?.initialHealth ?? 10,
          classOptionsCount: data.settings?.classOptionsCount ?? 3,
        },
        players: new Map(data.players.map((p: any) => [p.id, p])),
        turnOrder: data.turnOrder || [],
        actionLogs: data.actionLogs || [],
        pendingLoots: data.pendingLoots || [],
        pendingAlienTeleports: data.pendingAlienTeleports || [],
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
          state: this.serializeGameState(),
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
          state: this.serializeGameState(),
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
      case 'leave_room': // 新增分支
        await this.handleLeaveRoom(ws, message);
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
      case 'force_end_game':
        await this.handleForceEndGame(ws, message);
        break;
      case 'return_to_room':
        await this.handleReturnToRoom(ws, message);
        break;
      case 'update_settings': await this.handleUpdateSettings(ws, message); break;
      case 'remove_player': await this.handleRemovePlayer(ws, message); break;
      default:
        this.sendError(ws, 'Unknown message type');
    }
  }

  private async handleUpdateSettings(_ws: WebSocket, message: any): Promise<void> {
    if (!this.gameState || message.playerId !== this.gameState.hostId || this.gameState.phase !== 'waiting') return;
    
    this.gameState.settings = { ...this.gameState.settings, ...message.settings };
    
    if (this.gameState.settings.initialHealth < 1) this.gameState.settings.initialHealth = 1;
    if (this.gameState.settings.classOptionsCount < 1) this.gameState.settings.classOptionsCount = 1;

    const initHealth = this.gameState.settings.initialHealth;
    for (const player of this.gameState.players.values()) {
      player.health = initHealth;
      player.maxHealth = initHealth;
    }

    await this.saveGameState();
    this.broadcast({ type: 'room_state', state: this.serializeGameState() });
  }

  private async handleRemovePlayer(ws: WebSocket, message: { playerId: string; targetPlayerId: string }): Promise<void> {
    if (!this.gameState || this.gameState.phase !== 'waiting') {
      this.sendError(ws, 'Can only remove players in waiting phase');
      return;
    }
    if (message.playerId !== this.gameState.hostId) {
      this.sendError(ws, 'Only host can remove players');
      return;
    }
    if (message.targetPlayerId === this.gameState.hostId) {
      this.sendError(ws, 'Cannot remove the host');
      return;
    }

    this.gameState.players.delete(message.targetPlayerId);

    // Remove the target player's WebSocket session so they receive the updated state
    for (const [targetWs, pid] of this.sessions.entries()) {
      if (pid === message.targetPlayerId) {
        this.sessions.delete(targetWs);
        break;
      }
    }

    await this.saveGameState();
    await this.updateRoomRegistry();

    this.broadcast({ type: 'room_state', state: this.serializeGameState() });
  }

  private async handleLeaveRoom(ws: WebSocket, message: { playerId: string }): Promise<void> {
    if (!this.gameState) return;

    const playerId = message.playerId;
    const player = this.gameState.players.get(playerId);
    
    if (!player) return;

    this.sessions.delete(ws);

    if (this.gameState.phase === 'waiting') {
      this.gameState.players.delete(playerId);
      
      if (this.gameState.hostId === playerId) {
        const remainingPlayers = Array.from(this.gameState.players.keys());
        if (remainingPlayers.length > 0) {
          this.gameState.hostId = remainingPlayers[0];
        }
      }
    } else {
      player.isConnected = false;
      if (player.isAlive) {
        player.health = 0;
        player.isAlive = false;
        player.deathTime = Date.now();
        
        if (this.gameState.currentPlayerId === playerId) {
          await this.nextTurn();
        }
      }
    }

    await this.saveGameState();
    await this.updateRoomRegistry();

    this.broadcast({
      type: 'room_state',
      state: this.serializeGameState(),
    });
  }
  
  private async handleForceEndGame(_ws: WebSocket, message: { playerId: string }): Promise<void> {
    if (!this.gameState || message.playerId !== this.gameState.hostId) return;
    
    this.gameState.phase = 'ended';
    const alivePlayers = Array.from(this.gameState.players.values()).filter(p => p.isAlive);
    
    this.broadcast({ 
      type: 'game_ended', 
      winnerId: alivePlayers.length === 1 ? alivePlayers[0].id : 'none', 
      reason: 'Host forced game to end' 
    });
    
    await this.saveGameState();
    await this.updateRoomRegistry();

    this.broadcast({ type: 'room_state', state: this.serializeGameState() });
  }

  private async handleReturnToRoom(ws: WebSocket, message: { playerId: string }): Promise<void> {
    if (!this.gameState) return;
    if (message.playerId !== this.gameState.hostId) {
      this.sendError(ws, 'Only host can return to room');
      return;
    }
    if (this.gameState.phase !== 'ended') {
      this.sendError(ws, 'Game must be ended to return to room');
      return;
    }

    this.gameState.phase = 'waiting';
    this.gameState.currentTurn = 0;
    this.gameState.turnOrder = [];
    this.gameState.currentPlayerId = null;
    this.gameState.currentClassSelectionPlayerId = null;
    this.gameState.bombs = [];
    this.gameState.delayedEffects = [];
    this.gameState.actionLogs = [];
    this.gameState.pendingLoots = [];
    this.gameState.pendingAlienTeleports = [];
    
    const initHealth = this.gameState.settings.initialHealth ?? 10;
    for (const player of this.gameState.players.values()) {
      player.health = initHealth;
      player.maxHealth = initHealth;
      player.location = { type: 'city', cityId: player.id };
      player.class = null;
      player.classOptions = null;
      player.inventory = [];
      player.purchaseRights = [];
      player.stepsRemaining = 0;
      player.isAlive = true;
      player.isReady = false;
      delete player.deathTime;
      delete player.rank;
    }

    await this.saveGameState();
    await this.updateRoomRegistry();

    this.broadcast({ type: 'room_state', state: this.serializeGameState() });
  }

  private async handleJoinRoom(ws: WebSocket, message: { playerId: string; playerName: string; avatar?: string }): Promise<void> {
    // Initialize game state if needed
    if (!this.gameState) {
      const roomId = generateId();
      this.gameState = {
        roomId,
        createdAt: Date.now(),
        phase: 'waiting',
        players: new Map(),
        turnOrder: [],
        currentTurn: 0,
        currentPlayerId: null,
        currentClassSelectionPlayerId: null,
        stepPool: 0,
        bombs: [],
        delayedEffects: [],
        actionLogs: [],
        pendingLoots: [], 
        pendingAlienTeleports: [], 
        settings: {
          minPlayers: 2,
          maxPlayers: 9,
          isPublic: this.roomIsPublic,
          initialHealth: 10,
          classOptionsCount: 3
        },
        hostId: message.playerId,
      } as any;
    }

    const state = this.gameState!;

    // Check if player already exists (reconnection)
    const existingPlayer = state.players.get(message.playerId);
    if (existingPlayer) {
      this.sessions.set(ws, message.playerId);
      ws.serializeAttachment(message.playerId);
      
      existingPlayer.isConnected = true;
      if (message.playerName) existingPlayer.name = message.playerName;
      if (message.avatar !== undefined) existingPlayer.avatar = message.avatar;
      
      await this.saveGameState();
      await this.updateRoomRegistry();
      
      this.send(ws, { type: 'room_state', state: this.serializeGameState() });
      this.broadcast({ type: 'room_state', state: this.serializeGameState() }, ws);
      return;
    }

    // Spectator logic
    if (state.phase !== 'waiting' && state.phase !== 'ended') {
      this.sessions.set(ws, `spectator_${message.playerId}`);
      ws.serializeAttachment(`spectator_${message.playerId}`);
      this.send(ws, { type: 'room_state', state: this.serializeGameState() });
      this.send(ws, { type: 'player_joined', playerId: message.playerId, playerName: message.playerName } as any);
      return;
    }
    
    if (state.phase === 'ended') {
      this.sessions.set(ws, `spectator_${message.playerId}`);
      ws.serializeAttachment(`spectator_${message.playerId}`);
      this.send(ws, { type: 'room_state', state: this.serializeGameState() });
      return;
    }

    // Check if room is full
    if (state.players.size >= state.settings.maxPlayers) {
      this.sendError(ws, 'Room is full');
      return;
    }

    // Add player
    const initHealth = state.settings.initialHealth ?? 10;
    const player: Player = {
      id: message.playerId,
      name: message.playerName,
      avatar: message.avatar,
      health: initHealth,
      maxHealth: initHealth,
      location: { type: 'city', cityId: message.playerId },
      class: null,
      classOptions: null,
      inventory: [],
      purchaseRights: [],
      stepsRemaining: 0,
      isAlive: true,
      isReady: false,
      isConnected: true,
    };

    state.players.set(message.playerId, player);
    this.sessions.set(ws, message.playerId);
    ws.serializeAttachment(message.playerId);

    await this.saveGameState();
    await this.updateRoomRegistry();

    this.broadcast({ type: 'room_state', state: this.serializeGameState() });
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
    const currentIndex = this.gameState.turnOrder.indexOf(message.playerId);
    const nextIndex = currentIndex + 1;
    
    if (nextIndex < this.gameState.turnOrder.length) {
      const nextPlayerId = this.gameState.turnOrder[nextIndex];
      const nextPlayer = this.gameState.players.get(nextPlayerId)!;
      nextPlayer.classOptions = getAvailableClasses(this.gameState, this.gameState.settings.classOptionsCount ?? 3);
      this.gameState.currentClassSelectionPlayerId = nextPlayerId;
      
      await this.saveGameState();
      
      // Broadcast updated state to all players (without logs)
      this.broadcast({
        type: 'room_state',
        state: this.serializeGameState(),
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
    
    const playerIds = Array.from(this.gameState.players.keys());
    for (let i = playerIds.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [playerIds[i], playerIds[j]] = [playerIds[j], playerIds[i]];
    }
    this.gameState.turnOrder = playerIds;
    
    // First player starts selecting
    const firstPlayerId = this.gameState.turnOrder[0];
    this.gameState.currentClassSelectionPlayerId = firstPlayerId;
    
    const firstPlayer = this.gameState.players.get(firstPlayerId)!;
    firstPlayer.classOptions = getAvailableClasses(this.gameState, this.gameState.settings.classOptionsCount ?? 3);
    firstPlayer.isReady = false;
    
    for (const [playerId, player] of this.gameState.players) {
      if (playerId !== firstPlayerId) {
        player.classOptions = null;
        player.isReady = false;
      }
    }

    await this.saveGameState();
    this.broadcast({ type: 'room_state', state: this.serializeGameState() });
  }

  private async handleAlienPassiveTeleportAction(player: Player, action: any): Promise<ActionResult> {
    if (!this.gameState!.pendingAlienTeleports?.includes(player.id)) {
      throw new Error('Not eligible for alien passive teleport');
    }

    if (action.targetLocation) {
      player.location = action.targetLocation;
    }
    
    this.gameState!.pendingAlienTeleports = this.gameState!.pendingAlienTeleports.filter(id => id !== player.id);
    
    return {
      type: 'teleport',
      location: action.targetLocation || player.location,
    };
  }

  private async handlePerformAction(ws: WebSocket, message: any): Promise<void> {
    if (!this.gameState || this.gameState.phase !== 'playing') {
      this.sendError(ws, 'Game not in progress');
      return;
    }

    const { playerId, action } = message;
    
    // 定义免费行动：拿战利品 和 外星人被动
    const isFreeAction = action.type === 'claim_loot' || action.type === 'alien_passive_teleport';
    
    // 非免费行动，必须检查是否是自己的回合
    if (!isFreeAction && this.gameState.currentPlayerId !== playerId) {
      this.sendError(ws, 'Not your turn');
      return;
    }

    const player = this.gameState.players.get(playerId);
    if (!player || (!player.isAlive && action.type !== 'claim_loot')) {
      this.sendError(ws, 'Player not found or not alive');
      return;
    }

    let stepCost = 1;
    if (action.type === 'purchase') {
      stepCost = getPurchaseCost(action.purchaseRight);
    } else if (action.type === 'use_potion') {
      stepCost = action.value || 1;
    } else if (action.type === 'hug') {
      stepCost = 1;
    } else if (isFreeAction) {
      stepCost = 0;
    }

    if (!isFreeAction && player.stepsRemaining < stepCost) {
      this.sendError(ws, `Not enough steps (Need ${stepCost})`);
      return;
    }

    try {
      // Process action based on type
      let actionResult: ActionResult;
      
      switch (action.type) {
        case 'move': actionResult = await this.handleMoveAction(player, action); break;
        case 'purchase': actionResult = await this.handlePurchaseAction(player, action); break;
        case 'attack_knife': actionResult = await this.handleAttackKnifeAction(player, action); break;
        case 'attack_horse': actionResult = await this.handleAttackHorseAction(player, action); break;
        case 'shoot_arrow': actionResult = await this.handleShootArrowAction(player, action); break;
        case 'punch': actionResult = await this.handlePunchAction(player, action); break;
        case 'kick': actionResult = await this.handleKickAction(player, action); break;
        case 'rob': actionResult = await this.handleRobAction(player, action); break;
        case 'use_potion': actionResult = await this.handleUsePotionAction(player, action); break;
        case 'launch_rocket': actionResult = await this.handleLaunchRocketAction(player, action); break;
        case 'place_bomb': actionResult = await this.handlePlaceBombAction(player, action); break;
        case 'detonate_bomb': actionResult = await this.handleDetonateBombAction(player, action); break;
        case 'teleport': actionResult = await this.handleTeleportAction(player, action); break;
        case 'hug': actionResult = await this.handleHugAction(player, action); break;
        case 'claim_loot': actionResult = await this.handleClaimLootAction(player, action); break;
        case 'alien_passive_teleport': actionResult = await this.handleAlienPassiveTeleportAction(player, action); break;
        default:
          this.sendError(ws, 'Unknown action type');
          return;
      }

      // 如果是处理外星人瞬移 或 认领战利品，兼容原有的日志解析器，将类型映射过去
      const logType = action.type === 'claim_loot' ? 'rob' : (action.type === 'alien_passive_teleport' ? 'teleport' : action.type);

      // Record action log with structured result
      const newLog: ActionLog = {
        id: crypto.randomUUID(),
        turn: this.gameState.currentTurn,
        playerId: player.id,
        playerName: player.name,
        type: logType,
        actionResult,
        timestamp: Date.now(),
      };
      
      this.gameState.actionLogs.push(newLog);

      // Keep only last 50 logs
      if (this.gameState.actionLogs.length > 50) {
        this.gameState.actionLogs = this.gameState.actionLogs.slice(-50);
      }

      // Broadcast new log incrementally (separate from state)
      this.broadcast({ type: 'new_action_logs', logs: [newLog] });

      // 扣除步数
      if (!isFreeAction) {
        player.stepsRemaining -= stepCost;
      }

      // 核心：如果该外星人瞬移完成，且队列中没有其他外星人等待了，执行被冻结的回合结算！
      if (action.type === 'alien_passive_teleport' && this.gameState.pendingAlienTeleports.length === 0) {
         await this.executeRoundEndSequence();
      } 
      // 常规检查回合是否结束
      else if (!isFreeAction && player.stepsRemaining <= 0 && this.gameState.currentPlayerId === player.id) {
         await this.nextTurn();
      }

      // Save state immediately after action
      await this.saveGameState();
      
      // Broadcast updated state (without logs to save bandwidth)
      this.broadcast({ type: 'room_state', state: this.serializeGameState() });
    } catch (error: any) {
      console.error('Action failed:', error);
      this.sendError(ws, error.message || 'Action failed');
    }
  }

  private async handleClaimLootAction(player: Player, action: any): Promise<ActionResult> {
    if (!this.gameState!.pendingLoots) this.gameState!.pendingLoots = [];

    const pendingIndex = this.gameState!.pendingLoots.findIndex(
      p => p.killerId === player.id && p.victimId === action.target
    );

    if (pendingIndex === -1) {
      throw new Error('No pending loot found for this target');
    }

    const pendingLoot = this.gameState!.pendingLoots[pendingIndex];
    let claimedItem = undefined;

    // 如果选择了物品
    if (action.item && pendingLoot.items.includes(action.item)) {
      claimedItem = action.item;
      player.inventory.push(claimedItem);

      // 从死者的真实背包中抹除该物品
      const victim = this.gameState!.players.get(pendingLoot.victimId);
      if (victim) {
        const itemIdx = victim.inventory.indexOf(claimedItem);
        if (itemIdx !== -1) {
          victim.inventory.splice(itemIdx, 1);
        }
      }
    }

    // 选择完毕或主动放弃后，将其移出队列
    this.gameState!.pendingLoots.splice(pendingIndex, 1);

    // 返回 rob 类型以完美兼容前端日志显示
    return {
      type: 'rob',
      target: pendingLoot.victimId,
      targetName: pendingLoot.victimName,
      item: claimedItem,
      success: !!claimedItem,
    };
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

    // 职业限制 (修改：拳击手和武僧不能用刀)
    if (['boxer', 'monk'].includes(player.class || '')) {
      throw new Error('Your class cannot use knives');
    }

    // Check has knife
    if (!player.inventory.includes('knife')) {
      throw new Error('You do not have a knife');
    }

    // Calculate damage
    const knifeCount = player.inventory.filter(i => i === 'knife').length;
    
    // 计算防御 (修改：脂肪衣提供防御；拳击手/武僧不能用衣服防御)
    let defense = 0;
    if (!['boxer', 'monk'].includes(target.class || '')) {
      defense += target.inventory.filter(i => i === 'shirt').length;
    }
    if (target.class === 'fatty' && target.inventory.includes('fat')) {
      defense += 1; // 脂肪衣 +1 防御
    }

    const damage = Math.max(0, knifeCount - defense + 1);

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

    // 职业限制 (修改：拳击手/武僧/外星人/胖子不能用马)
    if (['boxer', 'monk', 'alien', 'fatty'].includes(player.class || '')) {
      throw new Error('Your class cannot use horses');
    }

    // Check has horse
    if (!player.inventory.includes('horse')) {
      throw new Error('You do not have a horse');
    }

    // Calculate damage
    const horseCount = player.inventory.filter(i => i === 'horse').length;
    
    // 计算防御
    let defense = 0;
    if (!['boxer', 'monk'].includes(target.class || '')) {
      defense += target.inventory.filter(i => i === 'shirt').length;
    }
    if (target.class === 'fatty' && target.inventory.includes('fat')) {
      defense += 1;
    }

    const damage = Math.max(0, 2 + horseCount - defense + 1);

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

    // 过滤脂肪衣 (修改：fat不能被抢)
    const lootableInventory = target.inventory.filter(item => item !== 'fat');

    // Check if target has items
    if (lootableInventory.length === 0) {
      throw new Error('Target has no robbable items');
    }

    let stolenItem: ItemType | undefined;
    
    // If specific item is specified, try to steal it
    if (action.item) {
      if (action.item === 'fat') {
        throw new Error('Cannot rob Fat Suit');
      }
      // 检查物品是否在可抢列表中
      if (!lootableInventory.includes(action.item)) {
         throw new Error('Item not found or not robbable');
      }
      
      const itemIndex = target.inventory.indexOf(action.item);
      if (itemIndex !== -1) {
        stolenItem = target.inventory.splice(itemIndex, 1)[0];
      }
    } else {
      // If no specific item, steal random item from LOOTABLE list
      const randomIndex = Math.floor(Math.random() * lootableInventory.length);
      const targetItem = lootableInventory[randomIndex];
      const realIndex = target.inventory.indexOf(targetItem);
      stolenItem = target.inventory.splice(realIndex, 1)[0];
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

    // Add delayed effect (修改：记录为下一轮结束时生效)
    this.gameState!.delayedEffects.push({
      id: crypto.randomUUID(),
      playerId: player.id,
      type: 'potion',
      targetLocation: action.targetLocation,
      value: action.value,
      resolveAtRound: this.gameState!.currentTurn + 1, // 当前轮数+1，即下一轮所有人行动完毕后生效
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

    // 计算防御（修复：引入完整的防具判定）
    let defense = 0;
    if (!['boxer', 'monk'].includes(target.class || '')) {
      defense += target.inventory.filter(i => i === 'shirt').length;
    }
    if (target.class === 'fatty' && target.inventory.includes('fat')) {
      defense += 1;
    }

    const damage = Math.max(0, 1 + bowCount - 1 - defense + 1);

    target.health = Math.max(0, target.health - damage);

    const killed = target.health <= 0;
    if (killed) {
      target.isAlive = false;
      await this.handlePlayerDeath(player, target);
    }

    return {
      type: 'shoot_arrow', // 修复：使用专门的射箭日志类型
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

    // Add delayed effect (修改：记录为下一轮结束时生效)
    const damage = 2 + launcherCount - 1;
    this.gameState!.delayedEffects.push({
      id: crypto.randomUUID(),
      playerId: player.id,
      type: 'rocket',
      targetLocation: action.targetLocation,
      value: damage,
      resolveAtRound: this.gameState!.currentTurn + 1, // 当前轮数+1，即下一轮所有人行动完毕后生效
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

    // Place bomb at current location, merging with existing bomb from same player if present
    const existingBomb = this.gameState!.bombs.find(
      b => b.playerId === player.id &&
        b.location.type === player.location.type &&
        b.location.cityId === player.location.cityId
    );
    if (existingBomb) {
      existingBomb.count += 1;
    } else {
      this.gameState!.bombs.push({
        id: crypto.randomUUID(),
        playerId: player.id,
        location: { ...player.location },
        count: 1,
      });
    }

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

    // 需指定使用的拳套 (修改：必须指定拳套类型，伤害不叠加)
    const gloveType = action.item;
    if (!['bronze_glove', 'silver_glove', 'gold_glove'].includes(gloveType)) {
      throw new Error('Must specify a glove to use');
    }

    if (!player.inventory.includes(gloveType)) {
      throw new Error('You do not have this glove');
    }

    // Calculate damage (true damage, fixed value per glove type)
    let damage = 0;
    switch (gloveType) {
      case 'bronze_glove': damage = 1; break;
      case 'silver_glove': damage = 2; break;
      case 'gold_glove': damage = 3; break;
    }

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

    // 需指定使用的腰带 (修改：必须指定腰带)
    const beltType = action.item;
    if (!['bronze_belt', 'silver_belt', 'gold_belt'].includes(beltType)) {
      throw new Error('Must specify a belt to use');
    }

    if (!player.inventory.includes(beltType)) {
      throw new Error('You do not have this belt');
    }

    // 范围校验 (修改：银腰带可远程)
    const isSameLocation = player.location.type === target.location.type && 
                           player.location.cityId === target.location.cityId;
    
    // Silver belt: same location OR adjacent
    if (beltType === 'silver_belt') {
       const isAdjacent = (player.location.type === 'central' && target.location.type === 'city') ||
                          (player.location.type === 'city' && target.location.type === 'central');
       if (!isSameLocation && !isAdjacent) {
         throw new Error('Target out of range (Silver belt hits adjacent)');
       }
    } else {
       // Bronze/Gold: must be same location
       if (!isSameLocation) {
         throw new Error('Target must be at same location');
       }
    }

    // Calculate damage (true damage, fixed value)
    let damage = 0;
    switch (beltType) {
      case 'bronze_belt': damage = 1; break;
      case 'silver_belt': damage = 1; break;
      case 'gold_belt': damage = 2; break;
    }

    target.health = Math.max(0, target.health - damage);

    // Force move (修改：中央->回家，城池->中央)
    const newLocation = target.location.type === 'central'
      ? { type: 'city' as const, cityId: target.id } // Kick back to their own city
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

    if (player.location.type !== target.location.type || 
        player.location.cityId !== target.location.cityId) {
      throw new Error('Target not at same location');
    }

    const isTargetLocAdjacent = (player.location.type === 'central' && action.targetLocation.type === 'city') ||
                                (player.location.type === 'city' && action.targetLocation.type === 'central');
    
    if (!isTargetLocAdjacent) {
      throw new Error('Can only hug-move to adjacent location');
    }

    player.location = action.targetLocation;
    target.location = action.targetLocation;

    return {
      type: 'hug',
      target: target.id,
      targetName: target.name,
      location: action.targetLocation,
    };
  }

  private async handlePlayerDeath(killer: Player | null, victim: Player): Promise<void> {
    victim.isAlive = false;
    victim.health = 0;
    victim.deathTime = Date.now();
    victim.stepsRemaining = 0;

    if (this.gameState!.bombs) {
      this.gameState!.bombs = this.gameState!.bombs.filter(b => b.playerId !== victim.id);
    }

    const aliveCount = Array.from(this.gameState!.players.values()).filter(p => p.isAlive).length;

    victim.rank = aliveCount + 1;

    if (!this.gameState!.pendingLoots) {
      this.gameState!.pendingLoots = [];
    }

    if (killer && killer.id !== victim.id && killer.isAlive) {
      const lootable = victim.inventory.filter(i => i !== 'fat');
      if (lootable.length > 0) {
        this.gameState!.pendingLoots.push({
          id: crypto.randomUUID(),
          killerId: killer.id,
          victimId: victim.id,
          victimName: victim.name,
          items: lootable
        });
      }
    }

    if (aliveCount <= 1) {
      this.gameState!.phase = 'ended';
      
      if (aliveCount === 1) {
        const winner = Array.from(this.gameState!.players.values()).find(p => p.isAlive);
        if (winner) winner.rank = 1;
      } else if (aliveCount === 0) {
        if (killer) {
          killer.rank = 1;
          if (victim.id !== killer.id) {
             victim.rank = 2;
          }
        }
      }
    }
  }

  private async nextTurn(): Promise<void> {
    if (!this.gameState) return;

    const aliveIds = this.gameState.turnOrder.filter(id => this.gameState!.players.get(id)?.isAlive);
    if (aliveIds.length <= 1) return;

    const currentIndex = aliveIds.indexOf(this.gameState.currentPlayerId!);
    const nextIndex = (currentIndex + 1) % aliveIds.length;

    if (nextIndex === 0) {
      const alivePlayers = aliveIds.map(id => this.gameState!.players.get(id)!);
      const aliens = alivePlayers.filter(p => p.class === 'alien' && p.inventory.filter(i => i === 'ufo').length >= 2);
      
      if (aliens.length > 0) {
         if (!this.gameState.pendingAlienTeleports) this.gameState.pendingAlienTeleports = [];
         this.gameState.pendingAlienTeleports = aliens.map(a => a.id);
         this.gameState.currentPlayerId = null;
         
         this.broadcast({ type: 'room_state', state: this.serializeGameState() });
         return;
      }
      
      await this.executeRoundEndSequence();
    } else {
      const nextPlayerId = aliveIds[nextIndex];
      this.gameState.currentPlayerId = nextPlayerId;
      this.broadcast({ type: 'turn_start', playerId: nextPlayerId, steps: this.gameState.players.get(nextPlayerId)!.stepsRemaining });
    }
  }

  private async executeRoundEndSequence(): Promise<void> {
    if (!this.gameState) return;

    const effectLogs = await this.processDelayedEffects();
    if (effectLogs.length > 0) {
      this.broadcast({ type: 'new_action_logs', logs: effectLogs });
    }

    let aliveIds = this.gameState.turnOrder.filter(id => this.gameState!.players.get(id)?.isAlive);
    const deadIds = this.gameState.turnOrder.filter(id => !this.gameState!.players.get(id)?.isAlive);

    if (this.gameState.phase === 'ended' || aliveIds.length <= 1) {
      return;
    }

    this.gameState.currentTurn++;

    for (let i = aliveIds.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [aliveIds[i], aliveIds[j]] = [aliveIds[j], aliveIds[i]];
    }
    this.gameState.turnOrder = [...aliveIds, ...deadIds];
    
    const firstAliveId = aliveIds[0];
    this.gameState.currentPlayerId = firstAliveId;

    const alivePlayers = aliveIds.map(id => this.gameState!.players.get(id)!);
    this.distributeSteps(alivePlayers);

    this.broadcast({
      type: 'turn_start',
      playerId: firstAliveId,
      steps: this.gameState.players.get(firstAliveId)!.stepsRemaining,
    });
  }

  private async processDelayedEffects(): Promise<ActionLog[]> {
    if (!this.gameState) return [];

    const newLogs: ActionLog[] = [];
    const currentTurn = this.gameState.currentTurn;
    
    const effectsToProcess = this.gameState.delayedEffects.filter(
      effect => effect.resolveAtRound <= currentTurn
    );

    for (const effect of effectsToProcess) {
      if (effect.type === 'potion') {
        const targets = Array.from(this.gameState.players.values()).filter(p =>
          p.isAlive &&
          p.location.type === effect.targetLocation.type &&
          p.location.cityId === effect.targetLocation.cityId
        );

        for (const target of targets) {
          const healAmount = effect.value;
          const oldHealth = target.health;
          target.health = Math.min(target.maxHealth, target.health + healAmount);
          
          const log: ActionLog = {
            id: crypto.randomUUID(),
            turn: currentTurn,
            playerId: effect.playerId,
            playerName: this.gameState.players.get(effect.playerId)?.name || 'Unknown',
            type: 'use_potion',
            actionResult: {
              type: 'potion_heal',
              target: target.id,
              targetName: target.name,
              location: effect.targetLocation,
              healed: target.health - oldHealth
            },
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
          
          const log: ActionLog = {
            id: crypto.randomUUID(),
            turn: currentTurn,
            playerId: effect.playerId,
            playerName: this.gameState.players.get(effect.playerId)?.name || 'Unknown',
            type: 'launch_rocket',
            actionResult: {
              type: 'rocket_hit',
              target: target.id,
              targetName: target.name,
              location: effect.targetLocation,
              damage: effect.value,
              killed: target.health <= 0
            },
            timestamp: Date.now(),
          };
          
          this.gameState.actionLogs.push(log);
          newLogs.push(log);
        }
      }
    }

    this.gameState.delayedEffects = this.gameState.delayedEffects.filter(
      effect => effect.resolveAtRound > currentTurn
    );
    
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
    
    const alivePlayerIds = this.gameState.turnOrder.filter(id => this.gameState!.players.get(id)?.isAlive);
    this.gameState.currentPlayerId = alivePlayerIds[0];

    const alivePlayers = alivePlayerIds.map(id => this.gameState!.players.get(id)!);
    this.distributeSteps(alivePlayers);

    this.gameState.stepPool = this.gameState.players.size;
    await this.saveGameState();

    this.broadcast({ type: 'room_state', state: this.serializeGameState() });
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
