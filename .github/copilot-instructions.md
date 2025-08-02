# King Snake - AI Coding Instructions

## Architecture Overview

King Snake is a multiplayer territorial snake game built with TypeScript. The architecture follows a client-server model with real-time communication:

- **Server**: Fastify + Socket.IO backend with authoritative game state (`src/server/`)
- **Client**: Vanilla TypeScript with HTML5 Canvas rendering (`src/client/`)
- **Shared**: Common types, constants, and utilities (`src/shared/`)

The game uses a diamond-shaped grid (Manhattan distance) with 20px tiles and complex territorial mechanics.

## Technology Stack

**Core Development**: Bun runtime + TypeScript + Prettier + ESLint
**Frontend**: Vite build tool + HTML5 Canvas + Socket.IO client
**Backend**: Fastify + Socket.IO + CORS + static file serving
**Testing**: Vitest framework with Node environment
**Production**: PM2 process manager + Helmet security + rate limiting

## Key Design Patterns

### Game Engine Architecture

The `GameEngine` class in `src/server/gameEngine.ts` is the core game logic controller:

- Uses dependency injection for event emission to decouple from Socket.IO
- Manages game rooms, player state, resources, and the expanding hill system
- Implements tick-based game loop with variable rates (4 ticks/sec → 1 tick/30sec)

### Type System & Shared Code

Global types are defined in `src/typing.d.ts` with no imports required:

```typescript
interface Position {
  x: number
  y: number
}
interface Player {
  id: string
  name: string
  snake: Snake
  territory: TerritoryTile[]
}
```

Constants are centralized in `src/shared/constants.ts` with the `GAME_CONFIG` object containing all game parameters.

## Development Workflows

### Running the Game

```bash
bun run dev          # Runs both server (3001) and client (3000) concurrently
bun run dev:server   # Server only with --watch
bun run dev:client   # Client only with Vite HMR
```

### Testing

```bash
bun run test         # Run all tests once
bun run test:watch   # Watch mode
bun run test:coverage # With coverage report
```

Tests use Vitest with Node environment. Game logic tests mock the event emitter pattern.

### Building & Deployment

```bash
bun run build       # Vite builds client to dist/
bun run start       # PM2 production server
```

Production uses PM2 with the config in `ecosystem.config.js`.

## Project-Specific Conventions

### Resource Management System

Resources follow a complex hierarchy and capacity system:

- **Food**: Instant consumption, grows snake
- **Stones**: Transported to territory origin, converts to 3 gems
- **Gems**: Used for territory expansion via click-to-place mechanics

Resources are placed on snake segments with value-based sorting (gems > stones).

### Territory & Collision Logic

The game implements "inverted collision rules":

- Outside territory: Standard snake collision (death)
- Inside own territory: Colliding with intruders cuts their tail and converts to food
- Territory expansion uses gems with directional priority: Right → Left → Front

### Hill Scoring System

Victory is based on an expanding hill with polynomial growth:

```typescript
radius = 1 + 399 × (time/480)²  // 8-minute expansion
```

Tick rates slow down as the hill expands, creating different game phases.

## Critical Integration Points

### Server-Client State Sync

Game state broadcasts at 30 FPS via `gameStateUpdate` events. The server is authoritative, but client rendering includes:

- Camera system following player snake
- Viewport culling for performance
- Minimap with full game state

### Canvas Rendering Pipeline

Client uses dual canvas system:

- **Main canvas**: Viewport-based game rendering with camera following player snake head
- **Minimap canvas**: Full map overview scaled to fit small display

Rendering pipeline layers (in order):

1. Grid (viewport culling for performance)
2. Hill (golden circle with transparency)
3. Territories (color-coded with origin borders)
4. Resources (circles: red=food, gray=stones, purple=gems)
5. Snakes (segmented with resource icons on segments)

Camera transform: `translate(canvas.width/2 - camera.x, canvas.height/2 - camera.y)`

### Socket.IO Event Patterns

Events follow consistent naming patterns:

- **Client→Server**: `joinGame(name)`, `changeDirection(direction)`, `useGem(position)`, `leaveGame()`
- **Server→Client**: `gameStateUpdate(state)`, `playerJoined/Left(player)`, `gameStarted/Ended()`, `error(message)`

Key patterns:

- Server authoritative with 30 FPS state broadcasts
- GameEngine uses dependency injection for event emission
- Direction changes are buffered on server for smooth movement
- Type-safe event interfaces in `typing.d.ts`

### File Organization

```
src/
├── client/     # Browser-side code (Canvas, Socket.IO client)
├── server/     # Node.js backend (Fastify, GameEngine)
└── shared/     # Isomorphic utilities and constants
```

## Common Gotchas

- All positions use integer coordinates on a 20px grid
- Manhattan distance calculations for diamond-shaped map boundaries
- Snake segments carry resources in a specific value-ordered array
- Territory tiles have `isOrigin` flag for permanent 3x3 starting areas
- Game state serialization excludes functions and private properties
- Bun is used as the runtime and package manager, not Node.js directly

## Key Files for Reference

- `src/shared/constants.ts` - All game configuration parameters
- `src/server/gameEngine.ts` - Core game logic and state management
- `src/typing.d.ts` - Global type definitions (no imports needed)
- `DESIGN.md` - Complete game mechanics specification
- `ecosystem.config.js` - Production deployment configuration
