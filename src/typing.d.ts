import { Direction, ResourceType, GameState } from './shared/constants.js'

declare global {
  // Basic position type
  interface Position {
    x: number
    y: number
  }

  // Snake segment
  interface SnakeSegment {
    position: Position
    resources: Resource[]
  }

  // Resource
  interface Resource {
    type: ResourceType
    position: Position
    id: string
  }

  // Snake
  interface Snake {
    id: string
    playerId: string
    segments: SnakeSegment[]
    direction: Direction
    bufferedDirection?: Direction
    alive: boolean
  }

  // Territory tile
  interface TerritoryTile {
    position: Position
    playerId: string
    isOrigin: boolean
  }

  // Player
  interface Player {
    id: string
    name: string
    score: number
    territory: TerritoryTile[]
    snake: Snake
    gems: number
    alive: boolean
  }

  // Hill
  interface Hill {
    center: Position
    radius: number
    startTime: number
  }

  // Game state
  interface GameRoom {
    id: string
    players: Map<string, Player>
    resources: Resource[]
    hill: Hill
    state: GameState
    startTime?: number
    lastTickTime: number
    tickRate: number
  }

  // Serializable version of GameRoom for network transmission
  interface SerializableGameRoom {
    id: string
    players: Player[]
    resources: Resource[]
    hill: Hill
    state: GameState
    startTime?: number
    lastTickTime: number
    tickRate: number
  }

  // Socket events
  interface ServerToClientEvents {
    gameStateUpdate: (gameState: Partial<SerializableGameRoom>) => void
    playerJoined: (player: Player) => void
    playerLeft: (playerId: string) => void
    gameStarted: () => void
    gameEnded: (winnerId: string) => void
    error: (message: string) => void
  }

  interface ClientToServerEvents {
    joinGame: (playerName: string) => void
    leaveGame: () => void
    changeDirection: (direction: Direction) => void
    useGem: (position: Position) => void
  }

  // Movement delta for directions
  const DIRECTION_DELTAS: Record<Direction, Position>

  // Utility functions
  function manhattanDistance(a: Position, b: Position): number
  function isValidPosition(position: Position, mapRadius: number): boolean
  function addPositions(a: Position, b: Position): Position
  function positionsEqual(a: Position, b: Position): boolean
}
