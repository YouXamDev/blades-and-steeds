// Game Types based on game.py rules

// Player class types
export const PlayerClass = {
  MAGE: 'mage',
  ARCHER: 'archer',
  ROCKETEER: 'rocketeer',
  BOMBER: 'bomber',
  BOXER: 'boxer',
  MONK: 'monk',
  ALIEN: 'alien',
  FATTY: 'fatty',
  VAMPIRE: 'vampire',
} as const;
export type PlayerClass = typeof PlayerClass[keyof typeof PlayerClass];

// Item types
export const ItemType = {
  SHIRT: 'shirt',
  KNIFE: 'knife',
  HORSE: 'horse',
  POTION: 'potion',
  BOW: 'bow',
  ARROW: 'arrow',
  ROCKET_LAUNCHER: 'rocket_launcher',
  ROCKET_AMMO: 'rocket_ammo',
  BOMB: 'bomb',
  BRONZE_GLOVE: 'bronze_glove',
  SILVER_GLOVE: 'silver_glove',
  GOLD_GLOVE: 'gold_glove',
  BRONZE_BELT: 'bronze_belt',
  SILVER_BELT: 'silver_belt',
  GOLD_BELT: 'gold_belt',
  UFO: 'ufo',
  FAT: 'fat',
} as const;
export type ItemType = typeof ItemType[keyof typeof ItemType];

// Purchase rights
export const PurchaseRightType = {
  KNIFE: 'knife',
  HORSE: 'horse',
  BOW: 'bow',
  ROCKET_LAUNCHER: 'rocket_launcher',
  BRONZE_GLOVE: 'bronze_glove',
  SILVER_GLOVE: 'silver_glove',
  GOLD_GLOVE: 'gold_glove',
  BRONZE_BELT: 'bronze_belt',
  SILVER_BELT: 'silver_belt',
  GOLD_BELT: 'gold_belt',
  UFO: 'ufo',
  // Consumables (can be purchased multiple times)
  POTION: 'potion',
  ARROW: 'arrow',
  ROCKET_AMMO: 'rocket_ammo',
  BOMB: 'bomb',
} as const;
export type PurchaseRightType = typeof PurchaseRightType[keyof typeof PurchaseRightType];

// Location types
export const LocationType = {
  CENTRAL: 'central',
  CITY: 'city',
} as const;
export type LocationType = typeof LocationType[keyof typeof LocationType];

// Action types
export const ActionType = {
  MOVE: 'move',
  PURCHASE: 'purchase',
  ROB: 'rob',
  ATTACK_KNIFE: 'attack_knife',
  ATTACK_HORSE: 'attack_horse',
  SHOOT_ARROW: 'shoot_arrow',
  LAUNCH_ROCKET: 'launch_rocket',
  PLACE_BOMB: 'place_bomb',
  DETONATE_BOMB: 'detonate_bomb',
  PUNCH: 'punch',
  KICK: 'kick',
  TELEPORT: 'teleport',
  HUG: 'hug',
  USE_POTION: 'use_potion',
  CLAIM_LOOT: 'claim_loot',
  ALIEN_PASSIVE_TELEPORT: 'alien_passive_teleport',
} as const;
export type ActionType = typeof ActionType[keyof typeof ActionType];

// Game phase
export const GamePhase = {
  WAITING: 'waiting',          // Waiting for players
  CLASS_SELECTION: 'class_selection', // Players selecting class
  PLAYING: 'playing',           // Game in progress
  ENDED: 'ended',              // Game ended
} as const;
export type GamePhase = typeof GamePhase[keyof typeof GamePhase];

// Pending Loot (For killing reward)
export interface PendingLoot {
  id: string;
  killerId: string;
  victimId: string;
  victimName: string;
  items: ItemType[];
}

// Player state
export interface Player {
  id: string;
  name: string;
  avatar?: string;
  health: number;
  maxHealth: number;
  location: {
    type: LocationType;
    cityId?: string; // For city location, which city they're in
  };
  class: PlayerClass | null;
  classOptions: PlayerClass[] | null;
  inventory: ItemType[];
  purchaseRights: PurchaseRightType[];
  stepsRemaining: number;
  isAlive: boolean;
  isReady: boolean; // For class selection phase
  isConnected: boolean; // Whether player is currently connected via WebSocket
  deathTime?: number; // Timestamp of death
  rank?: number; // Final rank (1 = winner, higher = died earlier)
}

// Bomb state (for Bomber)
export interface Bomb {
  id: string;
  playerId: string;
  location: {
    type: LocationType;
    cityId?: string;
  };
  count: number;
}

// Delayed effect (for potion, rocket)
export interface DelayedEffect {
  id: string;
  playerId: string;
  type: 'potion' | 'rocket';
  targetLocation: {
    type: LocationType;
    cityId?: string;
  };
  value: number; // Heal amount or damage
  resolveAtRound: number; // 明确指出在第几轮结束时生效，前端可借此判断：若等于 currentTurn 则本轮生效，大于则下轮生效
}

// Structured action result types
export type ActionResult =
  | { type: 'move'; location: { type: LocationType; cityId?: string } }
  | { type: 'purchase'; item: PurchaseRightType }
  | { type: 'rob'; target: string; targetName: string; item?: ItemType; success: boolean }
  | { type: 'attack'; target: string; targetName: string; damage: number; killed: boolean }
  | { type: 'shoot_arrow'; target: string; targetName: string; damage: number; killed: boolean } // <--- 新增这一行
  | { type: 'launch_rocket'; location: { type: LocationType; cityId?: string }; damage: number }
  | { type: 'rocket_hit'; target: string; targetName: string; location: { type: LocationType; cityId?: string }; damage: number; killed: boolean }
  | { type: 'use_potion'; location: { type: LocationType; cityId?: string }; steps: number }
  | { type: 'potion_heal'; target: string; targetName: string; location: { type: LocationType; cityId?: string }; healed: number }
  | { type: 'place_bomb'; location: { type: LocationType; cityId?: string } }
  | { type: 'detonate_bomb'; victims: Array<{ name: string; damage: number; killed: boolean }> }
  | { type: 'teleport'; location: { type: LocationType; cityId?: string } }
  | { type: 'hug'; target: string; targetName: string; location: { type: LocationType; cityId?: string } };

// Action in queue
export interface GameAction {
  id: string;
  playerId: string;
  type: ActionType;
  target?: string; // Target player ID
  targetLocation?: {
    type: LocationType;
    cityId?: string;
  };
  item?: ItemType;
  purchaseRight?: PurchaseRightType;
  value?: number; // For actions that need a value (e.g., potion steps)
}

// Action log entry
export interface ActionLog {
  id: string;
  turn: number;
  playerId: string;
  playerName: string;
  type: ActionType | 'rob'; // Compatible with claim_loot returning 'rob'
  // New structured result
  actionResult?: ActionResult;
  // Legacy fields (deprecated, kept for backward compatibility)
  target?: string; // Target player ID
  targetName?: string; // Target player name
  targetLocation?: {
    type: LocationType;
    cityId?: string;
    cityName?: string; // City owner's name
  };
  item?: ItemType;
  purchaseRight?: PurchaseRightType;
  result?: string; // Result description (e.g., "Dealt 3 damage", "Stole knife")
  damage?: number; // For attacks
  healed?: number; // For healing
  timestamp: number;
}

// Game settings
export interface GameSettings {
  minPlayers: number;
  maxPlayers: number;
  isPublic: boolean;
  initialHealth: number; // <--- 新增
  classOptionsCount: number; // <--- 新增
}

// Game state
export interface GameState {
  roomId: string;
  hostId: string;
  phase: 'waiting' | 'class_selection' | 'playing' | 'ended';
  players: Map<string, Player>;
  settings: GameSettings;
  currentTurn: number;
  currentPlayerId: string | null;
  currentClassSelectionPlayerId: string | null;
  bombs: Bomb[];
  delayedEffects: DelayedEffect[];
  actionLogs: ActionLog[];
  stepPool: number;
  pendingLoots: PendingLoot[];
  pendingAlienTeleports: string[];
  createdAt: number;
  updatedAt?: number;
}

// WebSocket message types
export const MessageType = {
  // Client -> Server
  JOIN_ROOM: 'join_room',
  LEAVE_ROOM: 'leave_room',
  SELECT_CLASS: 'select_class',
  PERFORM_ACTION: 'perform_action',
  READY: 'ready',
  START_GAME: 'start_game',
  FORCE_END_GAME: 'force_end_game',
  RETURN_TO_ROOM: 'return_to_room',
  UPDATE_SETTINGS: 'update_settings',
  // Server -> Client
  ROOM_STATE: 'room_state',
  PLAYER_JOINED: 'player_joined',
  PLAYER_LEFT: 'player_left',
  CLASS_SELECTED: 'class_selected',
  TURN_START: 'turn_start',
  ACTION_PERFORMED: 'action_performed',
  GAME_STARTED: 'game_started',
  GAME_ENDED: 'game_ended',
  ERROR: 'error',
  NEW_ACTION_LOGS: 'new_action_logs',
} as const;
export type MessageType = typeof MessageType[keyof typeof MessageType];

// WebSocket messages (Client)
export interface JoinRoomMessage {
  type: 'join_room';
  playerId: string;
  playerName: string;
  avatar?: string;
}

export interface SelectClassMessage {
  type: 'select_class';
  playerId: string;
  selectedClass: PlayerClass;
}

export interface PerformActionMessage {
  type: 'perform_action';
  playerId: string;
  action: GameAction;
}

export interface ReadyMessage {
  type: 'ready';
  playerId: string;
}

export interface StartGameMessage {
  type: 'start_game';
  playerId: string;
}

export interface LeaveRoomMessage {
  type: 'leave_room';
  playerId: string;
}

export interface ForceEndGameMessage {
  type: 'force_end_game';
  playerId: string;
}

export interface ReturnToRoomMessage {
  type: 'return_to_room';
  playerId: string;
}

export interface UpdateSettingsMessage {
  type: 'update_settings';
  playerId: string;
  settings: Partial<GameSettings>;
}

// Server messages
export interface RoomStateMessage {
  type: 'room_state';
  state: GameState;
}

export interface PlayerJoinedMessage {
  type: 'player_joined';
  player: Player;
}

export interface PlayerLeftMessage {
  type: 'player_left';
  playerId: string;
}

export interface TurnStartMessage {
  type: 'turn_start';
  playerId: string;
  steps: number;
}

export interface GameEndedMessage {
  type: 'game_ended';
  winnerId: string;
  reason: string;
}

export interface ErrorMessage {
  type: 'error';
  message: string;
}

export interface NewActionLogsMessage {
  type: 'new_action_logs';
  logs: ActionLog[];
}

export type ClientMessage =
  | JoinRoomMessage
  | SelectClassMessage
  | PerformActionMessage
  | ReadyMessage
  | StartGameMessage
  | LeaveRoomMessage
  | ForceEndGameMessage
  | ReturnToRoomMessage
  | UpdateSettingsMessage;

export type ServerMessage =
  | RoomStateMessage
  | PlayerJoinedMessage
  | PlayerLeftMessage
  | TurnStartMessage
  | GameEndedMessage
  | ErrorMessage
  | NewActionLogsMessage;

// User profile
export interface UserProfile {
  id: string;
  name: string;
  avatar?: string;
  qqNumber?: string;
}

// Room list item
export interface RoomListItem {
  id: string;
  name: string;
  hostId: string;
  hostName: string;
  playerCount: number;
  maxPlayers: number;
  phase: GamePhase;
  isPublic: boolean;
}