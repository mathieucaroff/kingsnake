import Fastify from 'fastify'
import { Server } from 'socket.io'
import cors from '@fastify/cors'
import staticFiles from '@fastify/static'
import { GameEngine } from './gameEngine.js'
import { Direction } from '../shared/constants.js'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const fastify = Fastify({
  logger: true,
})

// Register CORS
await fastify.register(cors, {
  origin: true,
  credentials: true,
})

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  await fastify.register(staticFiles, {
    root: path.join(__dirname, '../../dist'),
    prefix: '/',
  })
}

// Socket.IO setup
const io = new Server<ClientToServerEvents, ServerToClientEvents>(fastify.server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
})

// Game room management
const gameRooms = new Map<string, GameEngine>()

// Get or create game room
function getOrCreateGameRoom(roomId: string = 'default'): GameEngine {
  if (!gameRooms.has(roomId)) {
    // Create event emitter function that broadcasts to the room
    const eventEmitter = (event: string, ...args: any[]) => {
      io.to(roomId).emit(event as any, ...args)
    }
    gameRooms.set(roomId, new GameEngine(roomId, eventEmitter))
  }
  return gameRooms.get(roomId)!
}

// Socket.IO event handlers
io.on('connection', (socket) => {
  console.log('Player connected:', socket.id)

  let currentGameRoom: GameEngine | null = null
  let playerId: string = socket.id

  socket.on('joinGame', (playerName: string) => {
    console.log(`Received joinGame request from ${socket.id} with name: ${playerName}`)
    try {
      // For now, use default room
      currentGameRoom = getOrCreateGameRoom('default')

      // Join the room BEFORE adding the player so they receive events
      socket.join('default')

      const player = currentGameRoom.addPlayer(playerId, playerName)

      if (player) {
        // Send current game state to new player
        const gameState = currentGameRoom.getGameState()
        console.log(`Sending initial game state to ${playerName}:`, gameState.state)
        socket.emit('gameStateUpdate', gameState)

        // Notify other players
        socket.to('default').emit('playerJoined', player)

        console.log(`Player ${playerName} (${playerId}) joined the game`)
      } else {
        console.log(`Failed to add player ${playerName}`)
        socket.emit('error', 'Failed to join game')
      }
    } catch (error) {
      console.error('Error joining game:', error)
      socket.emit('error', 'An error occurred while joining the game')
    }
  })

  socket.on('leaveGame', () => {
    if (currentGameRoom) {
      currentGameRoom.removePlayer(playerId)
      socket.leave('default')
      socket.to('default').emit('playerLeft', playerId)
      console.log(`Player ${playerId} left the game`)
      currentGameRoom = null
    }
  })

  socket.on('changeDirection', (direction: Direction) => {
    if (currentGameRoom) {
      currentGameRoom.changePlayerDirection(playerId, direction)
    }
  })

  socket.on('useGem', (position: Position) => {
    // TODO: Implement gem usage for territory expansion
    console.log(`Player ${playerId} wants to use gem at`, position)
  })

  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id)

    if (currentGameRoom) {
      currentGameRoom.removePlayer(playerId)
      socket.to('default').emit('playerLeft', playerId)
    }
  })
})

// Game state broadcast loop
setInterval(() => {
  for (const [roomId, gameRoom] of gameRooms.entries()) {
    if (gameRoom.isGameActive()) {
      const gameState = gameRoom.getGameState()
      console.log(`Broadcasting game state to room ${roomId}, at ${Date.now() % 10 ** 6}`)
      // Broadcast game state to all clients in the room
      // See: https://socket.io/docs/v4/broadcasting-events/#to-all-sockets-in-a-room
      io.to(roomId).emit('gameStateUpdate', gameState)
    }
  }
}, 1000 / 30) // 30 FPS for game state updates

// Health check endpoint
fastify.get('/health', async (_request, _reply) => {
  return { status: 'ok', timestamp: new Date().toISOString() }
})

// Game info endpoint
fastify.get('/api/game-info', async (_request, _reply) => {
  const defaultRoom = gameRooms.get('default')
  return {
    playerCount: defaultRoom ? defaultRoom.getPlayerCount() : 0,
    isActive: defaultRoom ? defaultRoom.isGameActive() : false,
  }
})

// Start server
const start = async () => {
  try {
    const port = process.env.PORT ? parseInt(process.env.PORT) : 3001
    const host = process.env.HOST || '0.0.0.0'

    await fastify.listen({ port, host })
    console.log(`Server running on http://${host}:${port}`)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()
