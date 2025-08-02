import { describe, it, expect } from 'vitest'
import {
  DIRECTION_DELTAS,
  manhattanDistance,
  isValidPosition,
  addPositions,
  positionsEqual,
} from './utils.js'
import { Direction } from './constants.js'

describe('Utils Functions', () => {
  it('should calculate manhattan distance correctly', () => {
    expect(manhattanDistance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(7)
    expect(manhattanDistance({ x: -2, y: 3 }, { x: 1, y: -1 })).toBe(7)
  })

  it('should validate positions correctly', () => {
    expect(isValidPosition({ x: 0, y: 0 }, 5)).toBe(true)
    expect(isValidPosition({ x: 3, y: 4 }, 5)).toBe(false) // distance 7 > radius 5
    expect(isValidPosition({ x: 2, y: 2 }, 5)).toBe(true) // distance 4 <= radius 5
  })

  it('should add positions correctly', () => {
    expect(addPositions({ x: 1, y: 2 }, { x: 3, y: 4 })).toEqual({ x: 4, y: 6 })
    expect(addPositions({ x: -1, y: 2 }, { x: 1, y: -2 })).toEqual({ x: 0, y: 0 })
  })

  it('should compare positions correctly', () => {
    expect(positionsEqual({ x: 1, y: 2 }, { x: 1, y: 2 })).toBe(true)
    expect(positionsEqual({ x: 1, y: 2 }, { x: 2, y: 1 })).toBe(false)
  })

  it('should have correct direction deltas', () => {
    expect(DIRECTION_DELTAS[Direction.UP]).toEqual({ x: 0, y: -1 })
    expect(DIRECTION_DELTAS[Direction.DOWN]).toEqual({ x: 0, y: 1 })
    expect(DIRECTION_DELTAS[Direction.LEFT]).toEqual({ x: -1, y: 0 })
    expect(DIRECTION_DELTAS[Direction.RIGHT]).toEqual({ x: 1, y: 0 })
  })
})
