import type { Vec3, Puzzle, PlacedShape, PuzzleShape } from './types'

const COLORS = ['#4A90D9', '#E67E22', '#2ECC71', '#9B59B6', '#E74C3C', '#1ABC9C', '#F39C12']
const c = (x: number, y: number, z: number): Vec3 => ({ x, y, z })

/*
  Medium 3 — 4×3×2 rectangular container (24 cells), 6 pieces
  Pieces: I-bar, O-square, branch, T-tetromino, S-skew, L-tetromino
*/
export function getMediumPuzzle3(): Puzzle {
  const container = c(4,3,2)
  const shapes: PuzzleShape[] = [
    { id: 'm3a', color: COLORS[0], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0), c(1,0,0), c(2,0,0), c(3,0,0)] },
    { id: 'm3b', color: COLORS[1], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0), c(1,0,0), c(0,1,0), c(1,1,0)] },
    { id: 'm3c', color: COLORS[2], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0), c(1,0,0), c(0,1,0), c(0,0,1)] },
    { id: 'm3d', color: COLORS[3], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0), c(1,0,0), c(2,0,0), c(1,1,0)] },
    { id: 'm3e', color: COLORS[4], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0), c(1,0,0), c(1,1,0), c(2,1,0)] },
    { id: 'm3f', color: COLORS[5], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0), c(1,0,0), c(2,0,0), c(2,1,0)] },
  ]
  const solution: PlacedShape[] = [
    { id: 'm3a', color: COLORS[0], cubes: [c(0,0,0), c(1,0,0), c(2,0,0), c(3,0,0)] },
    { id: 'm3b', color: COLORS[1], cubes: [c(0,0,1), c(1,0,1), c(0,1,1), c(1,1,1)] },
    { id: 'm3c', color: COLORS[2], cubes: [c(0,2,0), c(0,1,0), c(1,2,0), c(0,2,1)] },
    { id: 'm3d', color: COLORS[3], cubes: [c(1,1,0), c(2,1,0), c(3,1,0), c(2,1,1)] },
    { id: 'm3e', color: COLORS[4], cubes: [c(3,2,0), c(2,2,0), c(2,2,1), c(1,2,1)] },
    { id: 'm3f', color: COLORS[5], cubes: [c(3,2,1), c(3,1,1), c(3,0,1), c(2,0,1)] },
  ]
  return { container, shapes, solution }
}
