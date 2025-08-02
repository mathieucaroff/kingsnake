import { describe, it, expect, beforeEach } from 'vitest'
import { GameEngine } from './gameEngine.js'
import { Direction, GameState } from '../shared/constants.js'

describe('GameEngine', () => {
  let gameEngine: GameEngine
  let mockEventEmitter: (event: string, ...args: any[]) => void
  let emittedEvents: Array<{ event: string; args: any[] }>

  beforeEach(() => {
    emittedEvents = []
    mockEventEmitter = (event: string, ...args: any[]) => {
      emittedEvents.push({ event, args })
    }
    gameEngine = new GameEngine('test-room', mockEventEmitter)
  })

  describe('Constructor', () => {
    it('should create a game room with initial state', () => {
      const gameState = gameEngine.getGameState()

      expect(gameState.id).toBe('test-room')
      expect(gameState.state).toBe(GameState.WAITING_FOR_PLAYERS)
      expect(gameState.players.length).toBe(0)
      expect(gameState.resources).toEqual([])
      expect(gameState.hill).toBeDefined()
      expect(gameState.hill.radius).toBe(1)
    })
  })

  describe('Player Management', () => {
    it('should add a player successfully', () => {
      const player = gameEngine.addPlayer('player1', 'TestPlayer')

      expect(player).toBeDefined()
      expect(player?.id).toBe('player1')
      expect(player?.name).toBe('TestPlayer')
      expect(player?.alive).toBe(true)
      expect(player?.score).toBe(0)
      expect(gameEngine.getPlayerCount()).toBe(1)
    })

    it('should not add duplicate players', () => {
      gameEngine.addPlayer('player1', 'TestPlayer1')
      const duplicatePlayer = gameEngine.addPlayer('player1', 'TestPlayer2')

      expect(duplicatePlayer).toBeNull()
      expect(gameEngine.getPlayerCount()).toBe(1)
    })

    it('should remove a player successfully', () => {
      gameEngine.addPlayer('player1', 'TestPlayer')
      expect(gameEngine.getPlayerCount()).toBe(1)

      const removed = gameEngine.removePlayer('player1')
      expect(removed).toBe(true)
      expect(gameEngine.getPlayerCount()).toBe(0)
    })

    it('should return false when removing non-existent player', () => {
      const removed = gameEngine.removePlayer('non-existent')
      expect(removed).toBe(false)
    })
  })

  describe('Snake Properties', () => {
    it('should create snake with correct initial properties', () => {
      const player = gameEngine.addPlayer('player1', 'TestPlayer')

      expect(player?.snake).toBeDefined()
      expect(player?.snake.segments).toHaveLength(2)
      expect(player?.snake.direction).toBe(Direction.UP)
      expect(player?.snake.alive).toBe(true)
    })

    it('should create territory with correct initial size', () => {
      const player = gameEngine.addPlayer('player1', 'TestPlayer')

      expect(player?.territory).toHaveLength(9) // 3x3 = 9 tiles

      // Check that there's exactly one origin tile
      const originTiles = player?.territory.filter((tile) => tile.isOrigin)
      expect(originTiles).toHaveLength(1)
    })
  })

  describe('Direction Changes', () => {
    it('should buffer direction changes', () => {
      const player = gameEngine.addPlayer('player1', 'TestPlayer')
      expect(player?.snake.bufferedDirection).toBeUndefined()

      gameEngine.changePlayerDirection('player1', Direction.RIGHT)

      const updatedPlayer = gameEngine.getGameState().players.find((p) => p.id === 'player1')
      expect(updatedPlayer?.snake.bufferedDirection).toBe(Direction.RIGHT)
    })

    it('should ignore direction changes for non-existent players', () => {
      expect(() => {
        gameEngine.changePlayerDirection('non-existent', Direction.RIGHT)
      }).not.toThrow()
    })
  })

  describe('Game State', () => {
    it('should indicate game is not active initially', () => {
      expect(gameEngine.isGameActive()).toBe(false)
    })

    it('should start game when minimum players join', () => {
      gameEngine.addPlayer('player1', 'Player1')
      gameEngine.addPlayer('player2', 'Player2')

      // Game should start automatically (MIN_PLAYERS_TO_START = 2)
      expect(gameEngine.getGameState().state).toBe(GameState.PLAYING)
      expect(gameEngine.isGameActive()).toBe(true)

      // Should emit gameStarted event
      expect(emittedEvents).toHaveLength(1)
      expect(emittedEvents[0].event).toBe('gameStarted')
      expect(emittedEvents[0].args).toEqual([])
    })
  })
})
