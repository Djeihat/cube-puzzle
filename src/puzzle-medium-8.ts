import type { Vec3, Puzzle, PlacedShape, PuzzleShape } from './types'

const COLORS = ['#4A90D9', '#E67E22', '#2ECC71', '#9B59B6', '#E74C3C', '#1ABC9C', '#F39C12']
const c = (x: number, y: number, z: number): Vec3 => ({ x, y, z })

/*
  Medium 8 — 4×2×3 rectangular container (24 cells), 6 pieces
  Pieces: I-bar, S-skew, branch, L-tetromino, T-tetromino, right-screw
*/
export function getMediumPuzzle8(): Puzzle {
  const container = c(4,2,3)
  const shapes: PuzzleShape[] = [
    { id: 'm8a', color: COLORS[0], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0), c(1,0,0), c(2,0,0), c(3,0,0)] },
    { id: 'm8b', color: COLORS[1], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0), c(1,0,0), c(1,1,0), c(2,1,0)] },
    { id: 'm8c', color: COLORS[2], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0), c(1,0,0), c(0,1,0), c(0,0,1)] },
    { id: 'm8d', color: COLORS[3], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0), c(1,0,0), c(2,0,0), c(2,1,0)] },
    { id: 'm8e', color: COLORS[4], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0), c(1,0,0), c(2,0,0), c(1,1,0)] },
    { id: 'm8f', color: COLORS[5], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0), c(1,0,0), c(1,1,0), c(1,1,1)] },
  ]
  const solution: PlacedShape[] = [
    { id: 'm8a', color: COLORS[0], cubes: [c(0,0,0), c(1,0,0), c(2,0,0), c(3,0,0)] },
    { id: 'm8b', color: COLORS[1], cubes: [c(0,0,2), c(0,0,1), c(0,1,1), c(0,1,0)] },
    { id: 'm8c', color: COLORS[2], cubes: [c(1,1,2), c(1,1,1), c(1,0,2), c(0,1,2)] },
    { id: 'm8d', color: COLORS[3], cubes: [c(1,0,1), c(2,0,1), c(3,0,1), c(3,0,2)] },
    { id: 'm8e', color: COLORS[4], cubes: [c(1,1,0), c(2,1,0), c(3,1,0), c(2,1,1)] },
    { id: 'm8f', color: COLORS[5], cubes: [c(2,0,2), c(2,1,2), c(3,1,2), c(3,1,1)] },
  ]
  return { container, shapes, solution }
}
