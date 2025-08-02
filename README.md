# King Snake

This is an online game of snake, each trying to win by gaining points by
having territory in the hill for long enough.

## 🎮 Current Status

The game is now **fully playable** in multiplayer mode! Visit http://localhost:3000 to start playing.

## 🛣️ Development Roadmap

### ✅ Phase 1: Core Mechanics (COMPLETED)

- **Grid System**: 20px tiles with diamond-shaped map (400 tile radius)
- **Snake Movement**: 2 tiles/second with buffered input controls
- **Collision Detection**: Wall boundaries and snake-to-snake interactions
- **Territory Origins**: 3x3 permanent starting territories
- **Basic Multiplayer**: Socket.IO real-time communication

### ✅ Phase 2: Resource & Territory System (COMPLETED)

- **Resource Types**: Food (instant growth), Stones (transportable), Gems (territory expansion)
- **Resource Spawning**: 1/60 density with automatic replacement
- **Collection Mechanics**: Capacity-based carrying system
- **Territory Visualization**: Color-coded territories with origin markers
- **Inverted Collision Rules**: Territory-based combat mechanics

### ✅ Phase 3: Hill & Scoring System (COMPLETED)

- **Expanding Hill**: Polynomial growth over 8 minutes (radius = 1 + 399 × (time/480)²)
- **Dynamic Scoring**: Points decrease based on territory overlap with hill
- **Variable Tick Rate**: From 4 ticks/second to 1 tick/30 seconds
- **Victory Conditions**: First to 0 points wins (with tie-breaking rules)

### ✅ Phase 4: Multiplayer Infrastructure (COMPLETED)

- **Real-time Communication**: Fastify + Socket.IO backend
- **Game State Sync**: 30 FPS client updates with server authority
- **Room Management**: Multi-room support with automatic matchmaking
- **Connection Handling**: Graceful connect/disconnect with player persistence

### 🚧 Phase 5: Advanced Features (IN PROGRESS)

- **Gem Territory Expansion**: Click-to-expand territory mechanics
- **Resource Processing**: Stone-to-gem conversion at territory origins
- **Advanced AI**: Computer players for single-player practice
- **Spectator Mode**: Watch ongoing games after elimination
- **Player Statistics**: Score tracking, win/loss records

### 🎯 Phase 6: Polish & Game Feel (UPCOMING)

- **Visual Effects**: Particle systems for resource collection, territory expansion
- **Sound Design**: Background music, sound effects for actions
- **UI Improvements**: Leaderboards, player names, status indicators
- **Mobile Optimization**: Touch controls, responsive design
- **Performance**: Viewport culling, optimized rendering for large maps

### 🚀 Phase 7: Production Features (FUTURE)

- **User Accounts**: Registration, login, persistent stats
- **Ranked Matches**: ELO system, seasons, tournaments
- **Custom Games**: Private rooms, custom rules, map variations
- **Replay System**: Save and review past games
- **Community Features**: Chat, friends, clans

## 🛠️ Quick Start

```bash
# Install dependencies
bun install

# Run development servers (client + server)
bun run dev

# Run tests
bun test

# Build for production
bun run build

# Start production server
bun run start
```

## 🎮 How to Play

1. **Join**: Enter your name to join the battle
2. **Move**: Use arrow keys or WASD (or touch controls on mobile)
3. **Collect**: Gather food to grow, stones and gems for territory expansion
4. **Expand**: Use gems to claim adjacent territory tiles
5. **Survive**: Avoid collisions outside your territory
6. **Win**: Control territory in the expanding hill to reduce enemy points
