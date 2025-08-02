import { Direction } from './constants.js'

// Movement delta for directions
export const DIRECTION_DELTAS: Record<Direction, Position> = {
  [Direction.UP]: { x: 0, y: -1 },
  [Direction.DOWN]: { x: 0, y: 1 },
  [Direction.LEFT]: { x: -1, y: 0 },
  [Direction.RIGHT]: { x: 1, y: 0 },
}

// Utility functions
export function manhattanDistance(a: Position, b: Position): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y)
}

export function isValidPosition(position: Position, mapRadius: number): boolean {
  return manhattanDistance(position, { x: 0, y: 0 }) <= mapRadius
}

export function addPositions(a: Position, b: Position): Position {
  return { x: a.x + b.x, y: a.y + b.y }
}

export function positionsEqual(a: Position, b: Position): boolean {
  return a.x === b.x && a.y === b.y
}
