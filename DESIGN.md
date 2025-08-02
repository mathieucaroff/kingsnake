# Territory Snake Game - Complete Design Document

## Game Overview

A multiplayer online action game combining snake mechanics with territorial control. Players control snakes on a grid, collecting resources to expand their territory while engaging in tactical combat with inverted collision rules within territorial boundaries.

## Core Mechanics

### Snake Behavior
- **Movement**: 2 tiles per second, cardinal directions only
- **Controls**: Buffered direction inputs for smooth gameplay
- **Initial length**: 2 tiles
- **Growth**: Consuming food increases snake length by 1 tile
- **Death**: Collision with any tail outside of own territory = game over

### Territory System
- **Starting territory**: 3x3 square with permanent origin at center
- **Territory expansion**: Using gems (processed stones) to claim adjacent tiles
- **Expansion priority**: Right side → Left side → Front side
- **Collision logic inversion**: Within own territory, colliding with intruder cuts their tail and converts it to food
- **Territory overlap**: Enemy territories can be placed over permanent origins
- **Territory theft**: Gems can steal enemy territory tiles

### Resource System

#### Resource Types
1. **Food** (consumed immediately)
   - Increases snake length by 1 tile
   - Never transported, instant consumption

2. **Stones** (grey, transported)
   - Carried back to territory origin
   - Converted to 3 gems at origin
   - Capacity limited by snake length

3. **Gems** (purple, transported)
   - Used for territory expansion
   - Up to 3 gems per snake body section
   - More valuable than stones

#### Resource Management
- **Placement on snake**: Resources placed closest to head, sorted by value (gems > stones)
- **Death drops**: Resources drop to floor at corresponding snake section location
- **Floor stacking**: Up to 3 gems or 1 stone per tile
- **Stacking priority**: Most valuable resource type replaces lesser when conflicting
- **Spawn density**: 1/60 for both food and stones, maintained by replacement spawning

## Map Design

### Map Structure
- **Shape**: Diamond (Manhattan distance circle)
- **Radius**: 400 tiles from center
- **Borders**: Hard walls
- **Tile size**: 20px × 20px
- **Total tiles**: Approximately 500,000

### Player Spawning
- **Starting positions**: Evenly distributed on Manhattan-distance circle
- **Distance from center**: 250 tiles
- **Minimum players**: 2 to start match
- **Territory origins**: Permanent, cannot be destroyed

## Victory System: King of the Hill

### Hill Mechanics
- **Initial size**: Single tile at map center
- **Expansion trigger**: First player territory reaches hill
- **Expansion duration**: 8 minutes total
- **Growth pattern**: Polynomial radius growth (parabolic acceleration)
- **Final size**: Engulfs entire map after 8 minutes
- **Formula**: `radius = 1 + 399 × (time/480)²`

### Scoring System
- **Point gain**: 1 point per territory tile overlapping hill per tick
- **Tick rate**: Variable, tied to hill expansion
  - **Initial**: 4 ticks per second
  - **Final**: 1 tick per 30 seconds
  - **Curve**: Slows as hill expands
- **Victory condition**: When a player reaches 1000 points or more, the player
  with the highest score wins. If there's a tie, the game continues until
  there's no tie

## Technical Specifications

### Performance Considerations
- **Rendering**: Viewport culling for efficient display
- **Collision detection**: Spatial partitioning for territory overlap calculations
- **State management**: Optimized data structures for large territory areas

### Networking Architecture
- **Backend recommendation**: TypeScript for rapid development
- **State synchronization**: Server-authoritative with client prediction
- **Update frequency**: Variable based on game phase
- **Room management**: Support for multiple concurrent matches

### Game Flow
1. **Match start**: Minimum 2 players, countdown before beginning
2. **Early game**: Fast-paced territory battles around small hill
3. **Mid game**: Strategic resource management and expansion
4. **Late game**: Large-scale territorial control with slow, high-stakes ticks
5. **Endgame**: Continues until victory condition met (can extend beyond 8 minutes)

## Special Rules and Edge Cases

### Territory Interactions
- **Gem placement**: No gem used if tile already owned
- **Wall interaction**: No gem used if expanding into wall
- **Enemy territory**: Gem used to steal enemy tiles

### Death and Respawn
- **Death consequence**: Game over, switch to observer mode
- **Resource drops**: Grouped on single tiles where carried
- **Territory persistence**: Remains after player death

### Resource Spawning
- **Replacement system**: New resource spawns when one is collected
- **Spawn restrictions**: Random placement maintaining density
- **Territory interaction**: Resources can spawn on any tile type

## Design Philosophy

The game balances risk and reward through:
- **Capacity limitations**: Snake length determines stone-carrying capacity
- **Territorial advantage**: Safe zones with inverted collision rules
- **Strategic timing**: Variable tick rates create different gameplay phases
- **Resource management**: Multiple resource types with distinct purposes
- **Spatial strategy**: Territory placement and expansion choices matter

This creates a game where early aggression, resource management, and territorial strategy all contribute to victory, with the expanding hill ensuring matches have natural escalation and conclusion.
