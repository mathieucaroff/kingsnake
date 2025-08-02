import { io, Socket } from 'socket.io-client'
import { Direction, GAME_CONFIG } from '../shared/constants.js'

class GameClient {
  private socket: Socket<ServerToClientEvents, ClientToServerEvents>
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private minimapCanvas: HTMLCanvasElement
  private minimapCtx: CanvasRenderingContext2D
  private gameState: Partial<SerializableGameRoom> = {}
  private currentPlayer: Player | null = null
  private camera = { x: 0, y: 0 }
  private isConnected = false

  constructor() {
    // Initialize socket connection
    const serverUrl =
      window.location.hostname === 'localhost' ? 'http://localhost:3001' : window.location.origin
    this.socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
    })

    // Get canvas elements
    this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement
    this.ctx = this.canvas.getContext('2d')!
    this.minimapCanvas = document.getElementById('minimapCanvas') as HTMLCanvasElement
    this.minimapCtx = this.minimapCanvas.getContext('2d')!

    this.setupEventListeners()
    this.setupSocketEvents()
    this.startRenderLoop()
  }

  private setupEventListeners(): void {
    // Join form
    const joinBtn = document.getElementById('joinBtn')!
    const playerNameInput = document.getElementById('playerNameInput') as HTMLInputElement

    joinBtn.addEventListener('click', () => {
      const playerName = playerNameInput.value.trim()
      if (playerName) {
        this.joinGame(playerName)
      }
    })

    playerNameInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        joinBtn.click()
      }
    })

    // Keyboard controls
    document.addEventListener('keydown', (e) => {
      if (!this.isConnected) return
      if (document.activeElement?.tagName === 'INPUT') return // input is focused

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault()
          this.changeDirection(Direction.UP)
          break
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault()
          this.changeDirection(Direction.DOWN)
          break
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault()
          this.changeDirection(Direction.LEFT)
          break
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault()
          this.changeDirection(Direction.RIGHT)
          break
      }
    })

    // Touch controls
    document.getElementById('upBtn')!.addEventListener('click', () => {
      this.changeDirection(Direction.UP)
    })
    document.getElementById('downBtn')!.addEventListener('click', () => {
      this.changeDirection(Direction.DOWN)
    })
    document.getElementById('leftBtn')!.addEventListener('click', () => {
      this.changeDirection(Direction.LEFT)
    })
    document.getElementById('rightBtn')!.addEventListener('click', () => {
      this.changeDirection(Direction.RIGHT)
    })

    // Canvas click for gem placement (future feature)
    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      // Convert screen coordinates to world coordinates
      const worldX = Math.floor((x - this.canvas.width / 2 + this.camera.x) / GAME_CONFIG.TILE_SIZE)
      const worldY = Math.floor(
        (y - this.canvas.height / 2 + this.camera.y) / GAME_CONFIG.TILE_SIZE,
      )

      console.log('Clicked world position:', { x: worldX, y: worldY })
      // TODO: Implement gem placement
    })
  }

  private setupSocketEvents(): void {
    this.socket.on('connect', () => {
      console.log('Connected to server')
      this.isConnected = true
    })

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server')
      this.isConnected = false
      this.updateStatus('Disconnected from server')
    })

    this.socket.on('gameStateUpdate', (gameState) => {
      this.gameState = gameState
      console.log('Received game state update:', Date.now() % 10 ** 6)
      this.updateCurrentPlayer()
      this.updateUI()
    })

    this.socket.on('playerJoined', (player) => {
      console.log('Player joined:', player.name)
      this.updateStatus(`${player.name} joined the game`)
    })

    this.socket.on('playerLeft', (playerId) => {
      console.log('Player left:', playerId)
      this.updateStatus('A player left the game')
    })

    this.socket.on('gameStarted', () => {
      this.updateStatus('Game started!')
    })

    this.socket.on('gameEnded', (winnerId) => {
      this.updateStatus(`Game ended! Winner: ${winnerId}`)
    })

    this.socket.on('error', (message) => {
      console.error('Server error:', message)
      this.updateStatus(`Error: ${message}`)
    })
  }

  private joinGame(playerName: string): void {
    this.socket.emit('joinGame', playerName)
    document.getElementById('joinForm')!.classList.add('hidden')
  }

  private changeDirection(direction: Direction): void {
    if (this.isConnected && this.currentPlayer?.alive) {
      this.socket.emit('changeDirection', direction)
    }
  }

  private updateCurrentPlayer(): void {
    if (this.gameState.players) {
      // Find current player by socket ID
      this.currentPlayer =
        this.gameState.players.find((player) => player.id === this.socket.id) || null
    }
  }

  private updateUI(): void {
    // Update score
    const scoreElement = document.getElementById('playerScore')!
    scoreElement.textContent = String(this.currentPlayer?.score) || '0'

    // Update player count
    const playerCountElement = document.getElementById('playerCount')!
    playerCountElement.textContent = String(this.gameState.players?.length) || '0'

    // Update hill radius
    const hillRadiusElement = document.getElementById('hillRadius')!
    hillRadiusElement.textContent = String(Math.floor(this.gameState.hill?.radius || 1))

    // Update camera to follow player
    if (this.currentPlayer?.snake?.segments && this.currentPlayer.snake.segments.length > 0) {
      const head = this.currentPlayer.snake.segments[0].position
      this.camera.x = head.x * GAME_CONFIG.TILE_SIZE
      this.camera.y = head.y * GAME_CONFIG.TILE_SIZE
    }
  }

  private updateStatus(message: string): void {
    document.getElementById('gameStatus')!.textContent = message
  }

  private startRenderLoop(): void {
    const render = () => {
      this.render()
      this.renderMinimap()
      requestAnimationFrame(render)
    }
    render()
  }

  private render(): void {
    // Clear canvas
    this.ctx.fillStyle = '#000'
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

    // Save context for camera transform
    this.ctx.save()

    // Apply camera transform
    this.ctx.translate(
      this.canvas.width / 2 - this.camera.x,
      this.canvas.height / 2 - this.camera.y,
    )

    // Render grid (optional, for debugging)
    this.renderGrid()

    // Render hill
    this.renderHill()

    // Render territories
    this.renderTerritories()

    // Render resources
    this.renderResources()

    // Render snakes
    this.renderSnakes()

    // Restore context
    this.ctx.restore()
  }

  private renderGrid(): void {
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
    this.ctx.lineWidth = 1

    const startX = Math.floor(this.camera.x / GAME_CONFIG.TILE_SIZE) - 20
    const endX = startX + Math.ceil(this.canvas.width / GAME_CONFIG.TILE_SIZE) + 40
    const startY = Math.floor(this.camera.y / GAME_CONFIG.TILE_SIZE) - 20
    const endY = startY + Math.ceil(this.canvas.height / GAME_CONFIG.TILE_SIZE) + 40

    for (let x = startX; x <= endX; x++) {
      this.ctx.beginPath()
      this.ctx.moveTo(x * GAME_CONFIG.TILE_SIZE, startY * GAME_CONFIG.TILE_SIZE)
      this.ctx.lineTo(x * GAME_CONFIG.TILE_SIZE, endY * GAME_CONFIG.TILE_SIZE)
      this.ctx.stroke()
    }

    for (let y = startY; y <= endY; y++) {
      this.ctx.beginPath()
      this.ctx.moveTo(startX * GAME_CONFIG.TILE_SIZE, y * GAME_CONFIG.TILE_SIZE)
      this.ctx.lineTo(endX * GAME_CONFIG.TILE_SIZE, y * GAME_CONFIG.TILE_SIZE)
      this.ctx.stroke()
    }
  }

  private renderHill(): void {
    if (!this.gameState.hill) return

    const hill = this.gameState.hill
    this.ctx.fillStyle = 'rgba(255, 215, 0, 0.3)' // Gold with transparency
    this.ctx.strokeStyle = 'rgba(255, 215, 0, 0.8)'
    this.ctx.lineWidth = 2

    this.ctx.beginPath()
    this.ctx.arc(
      hill.center.x * GAME_CONFIG.TILE_SIZE + GAME_CONFIG.TILE_SIZE / 2,
      hill.center.y * GAME_CONFIG.TILE_SIZE + GAME_CONFIG.TILE_SIZE / 2,
      hill.radius * GAME_CONFIG.TILE_SIZE,
      0,
      2 * Math.PI,
    )
    this.ctx.fill()
    this.ctx.stroke()
  }

  private renderTerritories(): void {
    if (!this.gameState.players) return

    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3']
    let colorIndex = 0

    for (const player of this.gameState.players) {
      const color = colors[colorIndex % colors.length]
      this.ctx.fillStyle = color + '40' // Add transparency
      this.ctx.strokeStyle = color

      for (const tile of player.territory) {
        const x = tile.position.x * GAME_CONFIG.TILE_SIZE
        const y = tile.position.y * GAME_CONFIG.TILE_SIZE

        this.ctx.fillRect(x, y, GAME_CONFIG.TILE_SIZE, GAME_CONFIG.TILE_SIZE)

        if (tile.isOrigin) {
          this.ctx.strokeStyle = color
          this.ctx.lineWidth = 3
          this.ctx.strokeRect(x, y, GAME_CONFIG.TILE_SIZE, GAME_CONFIG.TILE_SIZE)
        }
      }

      colorIndex++
    }
  }

  private renderResources(): void {
    if (!this.gameState.resources) return

    for (const resource of this.gameState.resources) {
      const x = resource.position.x * GAME_CONFIG.TILE_SIZE + GAME_CONFIG.TILE_SIZE / 2
      const y = resource.position.y * GAME_CONFIG.TILE_SIZE + GAME_CONFIG.TILE_SIZE / 2
      const radius = GAME_CONFIG.TILE_SIZE / 4

      switch (resource.type) {
        case 'FOOD':
          this.ctx.fillStyle = '#ff6b6b'
          break
        case 'STONE':
          this.ctx.fillStyle = '#95a5a6'
          break
        case 'GEM':
          this.ctx.fillStyle = '#9b59b6'
          break
      }

      this.ctx.beginPath()
      this.ctx.arc(x, y, radius, 0, 2 * Math.PI)
      this.ctx.fill()
    }
  }

  private renderSnakes(): void {
    if (!this.gameState.players) return

    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3']
    let colorIndex = 0

    for (const player of this.gameState.players) {
      if (!player.snake.alive) continue

      const color = colors[colorIndex % colors.length]
      const isCurrentPlayer = player.id === this.socket.id

      for (let i = 0; i < player.snake.segments.length; i++) {
        const segment = player.snake.segments[i]
        const x = segment.position.x * GAME_CONFIG.TILE_SIZE
        const y = segment.position.y * GAME_CONFIG.TILE_SIZE

        // Draw segment
        this.ctx.fillStyle = i === 0 ? color : color + 'cc' // Head is brighter
        this.ctx.fillRect(x, y, GAME_CONFIG.TILE_SIZE, GAME_CONFIG.TILE_SIZE)

        // Draw border for current player
        if (isCurrentPlayer) {
          this.ctx.strokeStyle = '#fff'
          this.ctx.lineWidth = 2
          this.ctx.strokeRect(x, y, GAME_CONFIG.TILE_SIZE, GAME_CONFIG.TILE_SIZE)
        }

        // Draw resources on segment
        if (segment.resources && segment.resources.length > 0) {
          const resourceSize = GAME_CONFIG.TILE_SIZE / 4
          for (let j = 0; j < segment.resources.length; j++) {
            const resource = segment.resources[j]
            const offsetX = (j % 2) * resourceSize
            const offsetY = Math.floor(j / 2) * resourceSize

            switch (resource.type) {
              case 'STONE':
                this.ctx.fillStyle = '#95a5a6'
                break
              case 'GEM':
                this.ctx.fillStyle = '#9b59b6'
                break
            }

            this.ctx.fillRect(x + offsetX + 2, y + offsetY + 2, resourceSize - 4, resourceSize - 4)
          }
        }
      }

      colorIndex++
    }
  }

  private renderMinimap(): void {
    // Clear minimap
    this.minimapCtx.fillStyle = '#000'
    this.minimapCtx.fillRect(0, 0, this.minimapCanvas.width, this.minimapCanvas.height)

    if (!this.gameState.players || !this.gameState.hill) return

    const scale = this.minimapCanvas.width / (GAME_CONFIG.MAP_RADIUS * 2)

    // Draw hill on minimap
    const hillX = (this.gameState.hill.center.x + GAME_CONFIG.MAP_RADIUS) * scale
    const hillY = (this.gameState.hill.center.y + GAME_CONFIG.MAP_RADIUS) * scale
    const hillRadius = this.gameState.hill.radius * scale

    this.minimapCtx.fillStyle = 'rgba(255, 215, 0, 0.5)'
    this.minimapCtx.beginPath()
    this.minimapCtx.arc(hillX, hillY, hillRadius, 0, 2 * Math.PI)
    this.minimapCtx.fill()

    // Draw players on minimap
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3']
    let colorIndex = 0

    for (const player of this.gameState.players) {
      if (!player.snake.alive) continue

      const color = colors[colorIndex % colors.length]
      const head = player.snake.segments[0].position
      const x = (head.x + GAME_CONFIG.MAP_RADIUS) * scale
      const y = (head.y + GAME_CONFIG.MAP_RADIUS) * scale

      this.minimapCtx.fillStyle = color
      this.minimapCtx.fillRect(x - 1, y - 1, 3, 3)

      colorIndex++
    }
  }
}

// Initialize the game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new GameClient()
})
