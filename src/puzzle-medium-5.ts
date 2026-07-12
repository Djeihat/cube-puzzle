import type { Vec3, Puzzle, PlacedShape, PuzzleShape } from './types'

const COLORS = ['#4A90D9', '#E67E22', '#2ECC71', '#9B59B6', '#E74C3C', '#1ABC9C', '#F39C12']
const c = (x: number, y: number, z: number): Vec3 => ({ x, y, z })

/*
  Medium 5 — 3×2×5 rectangular container (30 cells), 7 pieces
  Pieces: P-pento, L-pento, I-bar, O-square, T-tetromino, L-tetromino, S-skew
*/
export function getMediumPuzzle5(): Puzzle {
  const container = c(3,2,5)
  const shapes: PuzzleShape[] = [
    { id: 'm5a', color: COLORS[0], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0), c(1,0,0), c(0,1,0), c(1,1,0), c(0,2,0)] },
    { id: 'm5b', color: COLORS[1], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0), c(1,0,0), c(2,0,0), c(3,0,0), c(3,1,0)] },
    { id: 'm5c', color: COLORS[2], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0), c(1,0,0), c(2,0,0), c(3,0,0)] },
    { id: 'm5d', color: COLORS[3], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0), c(1,0,0), c(2,0,0), c(1,1,0)] },
    { id: 'm5e', color: COLORS[4], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0), c(1,0,0), c(1,1,0), c(2,1,0)] },
    { id: 'm5f', color: COLORS[5], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0), c(1,0,0), c(2,0,0), c(2,1,0)] },
    { id: 'm5g', color: COLORS[6], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0), c(1,0,0), c(0,1,0), c(1,1,0)] },
  ]
  const solution: PlacedShape[] = [
    { id: 'm5a', color: COLORS[0], cubes: [c(2,0,0), c(2,1,0), c(1,0,0), c(1,1,0), c(0,0,0)] },
    { id: 'm5b', color: COLORS[1], cubes: [c(0,0,4), c(0,0,3), c(0,0,2), c(0,0,1), c(1,0,1)] },
    { id: 'm5c', color: COLORS[2], cubes: [c(0,1,3), c(0,1,2), c(0,1,1), c(0,1,0)] },
    { id: 'm5d', color: COLORS[3], cubes: [c(2,1,4), c(1,1,4), c(0,1,4), c(1,0,4)] },
    { id: 'm5e', color: COLORS[4], cubes: [c(2,0,4), c(2,0,3), c(1,0,3), c(1,0,2)] },
    { id: 'm5f', color: COLORS[5], cubes: [c(1,1,1), c(1,1,2), c(1,1,3), c(2,1,3)] },
    { id: 'm5g', color: COLORS[6], cubes: [c(2,0,2), c(2,0,1), c(2,1,2), c(2,1,1)] },
  ]
  return { container, shapes, solution }
}
