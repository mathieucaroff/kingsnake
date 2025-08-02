// Game constants
export const GAME_CONFIG = {
  // Grid and movement
  TILE_SIZE: 20,
  MOVEMENT_SPEED: 2, // tiles per second
  MAP_RADIUS: 400,

  // Snake settings
  INITIAL_SNAKE_LENGTH: 2,

  // Territory settings
  INITIAL_TERRITORY_SIZE: 3, // 3x3 square

  // Resource settings
  RESOURCE_SPAWN_RATE: 1 / 60, // 1 resource per 60 tiles
  STONES_TO_GEMS_RATIO: 3, // 1 stone = 3 gems
  MAX_GEMS_PER_TILE: 3,
  MAX_STONES_PER_TILE: 1,

  // Hill system
  HILL_EXPANSION_DURATION: 8 * 60 * 1000, // 8 minutes in milliseconds
  INITIAL_HILL_RADIUS: 1,
  FINAL_HILL_RADIUS: 399,
  INITIAL_TICK_RATE: 4, // ticks per second
  FINAL_TICK_RATE: 1 / 30, // 1 tick per 30 seconds

  // Scoring
  WINNING_POINTS: 1000,
  POINTS_PER_TERRITORY_TILE: 1,

  // Player spawning
  SPAWN_DISTANCE_FROM_CENTER: 250,
  MIN_PLAYERS_TO_START: 2,
} as const

// Directions
export enum Direction {
  UP = 'UP',
  DOWN = 'DOWN',
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
}

// Resource types
export enum ResourceType {
  FOOD = 'FOOD',
  STONE = 'STONE',
  GEM = 'GEM',
}

// Game states
export enum GameState {
  WAITING_FOR_PLAYERS = 'WAITING_FOR_PLAYERS',
  STARTING = 'STARTING',
  PLAYING = 'PLAYING',
  ENDED = 'ENDED',
}
