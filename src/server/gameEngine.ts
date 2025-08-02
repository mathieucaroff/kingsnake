import { Direction, ResourceType, GameState, GAME_CONFIG } from '../shared/constants.js'
import {
  DIRECTION_DELTAS,
  manhattanDistance,
  isValidPosition,
  addPositions,
  positionsEqual,
} from '../shared/utils.js'

export class GameEngine {
  private gameRoom: GameRoom
  private gameLoopInterval?: ReturnType<typeof setInterval>
  private eventEmitter: (event: string, ...args: any[]) => void

  constructor(roomId: string, eventEmitter: (event: string, ...args: any[]) => void) {
    this.eventEmitter = eventEmitter
    this.gameRoom = {
      id: roomId,
      players: new Map(),
      resources: [],
      hill: this.createInitialHill(),
      state: GameState.WAITING_FOR_PLAYERS,
      lastTickTime: Date.now(),
      tickRate: GAME_CONFIG.INITIAL_TICK_RATE,
    }
  }

  private createInitialHill(): Hill {
    return {
      center: { x: 0, y: 0 },
      radius: GAME_CONFIG.INITIAL_HILL_RADIUS,
      startTime: 0,
    }
  }

  addPlayer(playerId: string, playerName: string): Player | null {
    if (this.gameRoom.players.has(playerId)) {
      return null
    }

    const spawnPosition = this.getSpawnPosition(this.gameRoom.players.size)
    const initialTerritory = this.createInitialTerritory(spawnPosition, playerId)
    const initialSnake = this.createInitialSnake(playerId, spawnPosition)

    const player: Player = {
      id: playerId,
      name: playerName,
      score: 0,
      territory: initialTerritory,
      snake: initialSnake,
      gems: 0,
      alive: true,
    }

    this.gameRoom.players.set(playerId, player)

    // Start game if we have minimum players
    console.log(
      `Player added. Total players: ${this.gameRoom.players.size}, Min required: ${GAME_CONFIG.MIN_PLAYERS_TO_START}, Current state: ${this.gameRoom.state}`,
    )
    if (
      this.gameRoom.players.size >= GAME_CONFIG.MIN_PLAYERS_TO_START &&
      this.gameRoom.state === GameState.WAITING_FOR_PLAYERS
    ) {
      console.log('Starting game now!')
      this.startGame()
    }

    return player
  }

  removePlayer(playerId: string): boolean {
    return this.gameRoom.players.delete(playerId)
  }

  private getSpawnPosition(playerIndex: number): Position {
    const angle =
      (playerIndex * 2 * Math.PI) /
      Math.max(GAME_CONFIG.MIN_PLAYERS_TO_START, this.gameRoom.players.size + 1)
    const x = Math.round(Math.cos(angle) * GAME_CONFIG.SPAWN_DISTANCE_FROM_CENTER)
    const y = Math.round(Math.sin(angle) * GAME_CONFIG.SPAWN_DISTANCE_FROM_CENTER)
    return { x, y }
  }

  private createInitialTerritory(center: Position, playerId: string): TerritoryTile[] {
    const territory: TerritoryTile[] = []
    const size = GAME_CONFIG.INITIAL_TERRITORY_SIZE
    const offset = Math.floor(size / 2)

    for (let dx = -offset; dx <= offset; dx++) {
      for (let dy = -offset; dy <= offset; dy++) {
        const position = { x: center.x + dx, y: center.y + dy }
        territory.push({
          position,
          playerId,
          isOrigin: dx === 0 && dy === 0,
        })
      }
    }

    return territory
  }

  private createInitialSnake(playerId: string, center: Position): Snake {
    const segments: SnakeSegment[] = []

    // Create initial segments (head and one body segment)
    for (let i = 0; i < GAME_CONFIG.INITIAL_SNAKE_LENGTH; i++) {
      segments.push({
        position: { x: center.x, y: center.y - i },
        resources: [],
      })
    }

    return {
      id: `snake-${playerId}`,
      playerId,
      segments,
      direction: Direction.UP,
      alive: true,
    }
  }

  private startGame(): void {
    this.gameRoom.state = GameState.STARTING
    this.gameRoom.startTime = Date.now()
    this.gameRoom.hill.startTime = Date.now()

    // Initialize resources
    this.spawnInitialResources()

    // Start game loop
    this.startGameLoop()

    this.gameRoom.state = GameState.PLAYING

    // Emit gameStarted event to all clients
    this.eventEmitter('gameStarted')
    console.log('Emitted gameStarted event')
  }

  private spawnInitialResources(): void {
    const totalTiles = Math.PI * GAME_CONFIG.MAP_RADIUS * GAME_CONFIG.MAP_RADIUS
    const resourceCount = Math.floor(totalTiles * GAME_CONFIG.RESOURCE_SPAWN_RATE)

    for (let i = 0; i < resourceCount; i++) {
      this.spawnRandomResource()
    }
  }

  private spawnRandomResource(): void {
    const position = this.getRandomValidPosition()
    if (!position) return

    const isFood = Math.random() < 0.5
    const resource: Resource = {
      id: `resource-${Date.now()}-${Math.random()}`,
      type: isFood ? ResourceType.FOOD : ResourceType.STONE,
      position,
    }

    this.gameRoom.resources.push(resource)
  }

  private getRandomValidPosition(): Position | null {
    for (let attempts = 0; attempts < 100; attempts++) {
      const angle = Math.random() * 2 * Math.PI
      const distance = Math.random() * GAME_CONFIG.MAP_RADIUS
      const x = Math.round(Math.cos(angle) * distance)
      const y = Math.round(Math.sin(angle) * distance)
      const position = { x, y }

      if (isValidPosition(position, GAME_CONFIG.MAP_RADIUS) && !this.isPositionOccupied(position)) {
        return position
      }
    }
    return null
  }

  private isPositionOccupied(position: Position): boolean {
    // Check if any snake segment is at this position
    for (const player of this.gameRoom.players.values()) {
      if (player.snake.segments.some((segment) => positionsEqual(segment.position, position))) {
        return true
      }
    }

    // Check if any resource is at this position
    return this.gameRoom.resources.some((resource) => positionsEqual(resource.position, position))
  }

  changePlayerDirection(playerId: string, direction: Direction): void {
    const player = this.gameRoom.players.get(playerId)
    if (!player || !player.alive) return

    // Buffer the direction change
    player.snake.bufferedDirection = direction
  }

  private startGameLoop(): void {
    this.gameLoopInterval = setInterval(() => {
      this.updateGame()
    }, 1000 / GAME_CONFIG.MOVEMENT_SPEED) // 2 moves per second
  }

  private updateGame(): void {
    if (this.gameRoom.state !== GameState.PLAYING) return

    // Update hill
    this.updateHill()

    // Move snakes
    this.moveAllSnakes()

    // Check collisions
    this.checkCollisions()

    // Update territory scoring
    this.updateScoring()

    // Check win condition
    this.checkWinCondition()
  }

  private updateHill(): void {
    if (!this.gameRoom.startTime) return

    const elapsed = Date.now() - this.gameRoom.hill.startTime
    const progress = Math.min(elapsed / GAME_CONFIG.HILL_EXPANSION_DURATION, 1)

    // Polynomial growth: radius = 1 + 399 × (time/480)²
    this.gameRoom.hill.radius =
      GAME_CONFIG.INITIAL_HILL_RADIUS +
      (GAME_CONFIG.FINAL_HILL_RADIUS - GAME_CONFIG.INITIAL_HILL_RADIUS) * (progress * progress)

    // Update tick rate (slower as game progresses)
    this.gameRoom.tickRate =
      GAME_CONFIG.INITIAL_TICK_RATE * (1 - progress) + GAME_CONFIG.FINAL_TICK_RATE * progress
  }

  private moveAllSnakes(): void {
    for (const player of this.gameRoom.players.values()) {
      if (player.alive) {
        this.moveSnake(player)
      }
    }
  }

  private moveSnake(player: Player): void {
    const snake = player.snake

    // Apply buffered direction if valid
    if (snake.bufferedDirection) {
      const currentDirection = snake.direction
      const newDirection = snake.bufferedDirection

      // Prevent 180-degree turns
      const oppositeDirections = {
        [Direction.UP]: Direction.DOWN,
        [Direction.DOWN]: Direction.UP,
        [Direction.LEFT]: Direction.RIGHT,
        [Direction.RIGHT]: Direction.LEFT,
      }

      if (oppositeDirections[currentDirection] !== newDirection) {
        snake.direction = newDirection
      }
      snake.bufferedDirection = undefined
    }

    // Calculate new head position
    const currentHead = snake.segments[0].position
    const delta = DIRECTION_DELTAS[snake.direction]
    const newHeadPosition = addPositions(currentHead, delta)

    // Check bounds
    if (!isValidPosition(newHeadPosition, GAME_CONFIG.MAP_RADIUS)) {
      this.killSnake(player)
      return
    }

    // Check for resource collection
    const resourceIndex = this.gameRoom.resources.findIndex((resource) =>
      positionsEqual(resource.position, newHeadPosition),
    )

    let shouldGrow = false
    if (resourceIndex !== -1) {
      const resource = this.gameRoom.resources[resourceIndex]
      shouldGrow = this.collectResource(player, resource)
      this.gameRoom.resources.splice(resourceIndex, 1)
      this.spawnRandomResource() // Replace collected resource
    }

    // Move snake
    const newHead: SnakeSegment = {
      position: newHeadPosition,
      resources: [],
    }

    snake.segments.unshift(newHead)

    if (!shouldGrow) {
      snake.segments.pop()
    }
  }

  private collectResource(player: Player, resource: Resource): boolean {
    switch (resource.type) {
      case ResourceType.FOOD:
        return true // Grow snake

      case ResourceType.STONE:
        // Add to snake if there's capacity
        const totalResources = player.snake.segments.reduce(
          (total, segment) => total + segment.resources.length,
          0,
        )

        if (totalResources < player.snake.segments.length * GAME_CONFIG.MAX_STONES_PER_TILE) {
          // Find first available slot (closest to head)
          for (const segment of player.snake.segments) {
            if (segment.resources.length < GAME_CONFIG.MAX_STONES_PER_TILE) {
              segment.resources.push(resource)
              break
            }
          }
        }
        return false

      case ResourceType.GEM:
        // Similar logic for gems
        const totalGems = player.snake.segments.reduce(
          (total, segment) =>
            total + segment.resources.filter((r) => r.type === ResourceType.GEM).length,
          0,
        )

        if (totalGems < player.snake.segments.length * GAME_CONFIG.MAX_GEMS_PER_TILE) {
          for (const segment of player.snake.segments) {
            const gemCount = segment.resources.filter((r) => r.type === ResourceType.GEM).length
            if (gemCount < GAME_CONFIG.MAX_GEMS_PER_TILE) {
              segment.resources.push(resource)
              break
            }
          }
        }
        return false

      default:
        return false
    }
  }

  private checkCollisions(): void {
    for (const player of this.gameRoom.players.values()) {
      if (!player.alive) continue

      const headPosition = player.snake.segments[0].position

      // Check collision with other snakes' tails
      for (const otherPlayer of this.gameRoom.players.values()) {
        if (otherPlayer.id === player.id) continue

        // Check if head collides with other snake's tail
        const collision = otherPlayer.snake.segments
          .slice(1)
          .find((segment) => positionsEqual(segment.position, headPosition))

        if (collision) {
          // Check if collision is in player's own territory
          const inOwnTerritory = player.territory.some((tile) =>
            positionsEqual(tile.position, headPosition),
          )

          if (inOwnTerritory) {
            // Inverted collision rules - cut the intruder's tail
            this.cutSnakeTail(otherPlayer, headPosition)
          } else {
            // Normal collision rules - player dies
            this.killSnake(player)
          }
        }
      }
    }
  }

  private cutSnakeTail(player: Player, cutPosition: Position): void {
    const segmentIndex = player.snake.segments.findIndex((segment) =>
      positionsEqual(segment.position, cutPosition),
    )

    if (segmentIndex > 0) {
      // Drop resources from cut segments as food
      const cutSegments = player.snake.segments.splice(segmentIndex)
      for (const segment of cutSegments) {
        for (const _resource of segment.resources) {
          const food: Resource = {
            id: `food-${Date.now()}-${Math.random()}`,
            type: ResourceType.FOOD,
            position: segment.position,
          }
          this.gameRoom.resources.push(food)
        }
      }
    }
  }

  private killSnake(player: Player): void {
    player.alive = false
    player.snake.alive = false

    // Drop all resources
    for (const segment of player.snake.segments) {
      for (const resource of segment.resources) {
        this.gameRoom.resources.push({
          ...resource,
          position: segment.position,
        })
      }
    }
  }

  private updateScoring(): void {
    const now = Date.now()

    // Only update scores at the current tick rate
    if (now - this.gameRoom.lastTickTime < 1000 / this.gameRoom.tickRate) {
      return
    }

    this.gameRoom.lastTickTime = now

    // Reduce points for territory tiles in the hill
    for (const player of this.gameRoom.players.values()) {
      let tilesInHill = 0

      for (const tile of player.territory) {
        const distanceFromHillCenter = manhattanDistance(tile.position, this.gameRoom.hill.center)
        if (distanceFromHillCenter <= this.gameRoom.hill.radius) {
          tilesInHill++
        }
      }

      player.score -= tilesInHill * GAME_CONFIG.POINTS_PER_TERRITORY_TILE
    }
  }

  private checkWinCondition(): void {
    const alivePlayers = Array.from(this.gameRoom.players.values()).filter((p) => p.alive)

    if (alivePlayers.length <= 1) {
      this.endGame()
      return
    }

    // Check if any player has reached 0 or negative points
    const playerWithHighestScore = alivePlayers.reduce((highest, current) =>
      current.score > highest.score ? current : highest,
    )

    if (playerWithHighestScore.score >= GAME_CONFIG.WINNING_POINTS) {
      this.endGame()
    }
  }

  private endGame(): void {
    this.gameRoom.state = GameState.ENDED

    if (this.gameLoopInterval) {
      clearInterval(this.gameLoopInterval)
      this.gameLoopInterval = undefined
    }

    // Find the winner (player with highest score among alive players)
    const alivePlayers = Array.from(this.gameRoom.players.values()).filter((p) => p.alive)
    if (alivePlayers.length === 0) {
      console.log('No players left, ending game without a winner')
      this.eventEmitter('gameEnded', '')
      return
    }

    const winnerSet = alivePlayers
      .slice(1)
      .reduce(
        (bestSet, current) =>
          current.score > bestSet[0].score
            ? [current]
            : current.score === bestSet[0].score
              ? [...bestSet, current]
              : bestSet,
        [alivePlayers[0]],
      )

    // Emit gameEnded event with winner ID
    if (winnerSet.length === 1 && winnerSet[0].score >= GAME_CONFIG.WINNING_POINTS) {
      this.eventEmitter('gameEnded', winnerSet[0].id)
    }
  }

  getGameState(): SerializableGameRoom {
    return {
      ...this.gameRoom,
      players: [...this.gameRoom.players.values()],
    }
  }

  getPlayerCount(): number {
    return this.gameRoom.players.size
  }

  isGameActive(): boolean {
    const isActive = this.gameRoom.state === GameState.PLAYING
    return isActive
  }
}
