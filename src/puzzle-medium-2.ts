import type { Vec3, Puzzle, PlacedShape, PuzzleShape } from './types'

const COLORS = ['#4A90D9', '#E67E22', '#2ECC71', '#9B59B6', '#E74C3C', '#1ABC9C', '#F39C12']
const c = (x: number, y: number, z: number): Vec3 => ({ x, y, z })

/*
  Medium 2 — 3×3×3 cube (27 cells), 6 pieces
  Pieces: 3D-pento-A, P-pento, right-screw, branch, T-tetromino, 3D-pento-B
*/
export function getMediumPuzzle2(): Puzzle {
  const container = c(3,3,3)
  const shapes: PuzzleShape[] = [
    { id: 'm2a', color: COLORS[0], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0), c(1,0,0), c(0,1,0), c(0,0,1), c(1,0,1)] },
    { id: 'm2b', color: COLORS[1], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0), c(1,0,0), c(0,1,0), c(1,1,0), c(0,2,0)] },
    { id: 'm2c', color: COLORS[2], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0), c(1,0,0), c(1,1,0), c(1,1,1)] },
    { id: 'm2d', color: COLORS[3], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0), c(1,0,0), c(0,1,0), c(0,0,1)] },
    { id: 'm2e', color: COLORS[4], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0), c(1,0,0), c(2,0,0), c(1,1,0)] },
    { id: 'm2f', color: COLORS[5], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0), c(1,0,0), c(1,1,0), c(1,0,1), c(2,0,1)] },
  ]
  const solution: PlacedShape[] = [
    { id: 'm2a', color: COLORS[0], cubes: [c(0,0,0), c(1,0,0), c(0,1,0), c(0,0,1), c(1,0,1)] },
    { id: 'm2b', color: COLORS[1], cubes: [c(0,2,2), c(1,2,2), c(0,1,2), c(1,1,2), c(0,0,2)] },
    { id: 'm2c', color: COLORS[2], cubes: [c(1,1,1), c(0,1,1), c(0,2,1), c(0,2,0)] },
    { id: 'm2d', color: COLORS[3], cubes: [c(2,0,2), c(2,0,1), c(1,0,2), c(2,1,2)] },
    { id: 'm2e', color: COLORS[4], cubes: [c(2,0,0), c(2,1,0), c(2,2,0), c(1,1,0)] },
    { id: 'm2f', color: COLORS[5], cubes: [c(2,2,2), c(2,2,1), c(2,1,1), c(1,2,1), c(1,2,0)] },
  ]
  return { container, shapes, solution }
}
