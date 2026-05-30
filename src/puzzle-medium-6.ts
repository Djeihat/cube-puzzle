import type { Vec3, Puzzle, PlacedShape, PuzzleShape } from './types'

const COLORS = ['#4A90D9', '#E67E22', '#2ECC71', '#9B59B6', '#E74C3C', '#1ABC9C', '#F39C12']
const c = (x: number, y: number, z: number): Vec3 => ({ x, y, z })

/*
  Medium 6 — irregular wide slab (24 cells). Bounding box: 4×3×3

  6 distinct tetracubes (24 cells total).
  Valid cells:
    y=0: (0,0,0),(1,0,0),(2,0,0),(3,0,0),(0,0,1),(1,0,1),(2,0,1),(3,0,1),(3,0,2)  →  9 cells
    y=1: (0,1,0),(1,1,0),(2,1,0),(3,1,0),(0,1,1),(1,1,1),(2,1,1),(3,1,1),(0,1,2),(1,1,2)  → 10 cells
    y=2: (0,2,0),(1,2,0),(2,2,0),(0,2,1),(1,2,1)  →  5 cells

  p6a (blue,   4): I-bar       [c(0,0,0),c(1,0,0),c(2,0,0),c(3,0,0)]
  p6b (orange, 4): L-tetromino [c(0,0,0),c(0,0,1),c(0,0,2),c(1,0,2)]
  p6c (green,  4): T-tetromino [c(0,0,0),c(1,0,0),c(2,0,0),c(1,1,0)]
  p6d (purple, 4): S-skew      [c(0,0,0),c(1,0,0),c(1,1,0),c(2,1,0)]
  p6e (red,    4): 2×2 square  [c(0,0,0),c(1,0,0),c(0,0,1),c(1,0,1)]
  p6f (teal,   4): branch      [c(0,0,0),c(1,0,0),c(1,1,0),c(1,0,1)]

  Solution (24 cells, no overlaps):
    p6a: (0,0,0),(1,0,0),(2,0,0),(3,0,0)
    p6b: (0,1,0),(0,1,1),(0,1,2),(1,1,2)
    p6c: (1,1,0),(2,1,0),(3,1,0),(2,2,0)
    p6d: (0,0,1),(1,0,1),(1,1,1),(2,1,1)
    p6e: (0,2,0),(1,2,0),(0,2,1),(1,2,1)
    p6f: (2,0,1),(3,0,1),(3,1,1),(3,0,2)
*/
export function getMediumPuzzle6(): Puzzle {
  const container = c(4,3,3)
  const validCells: Vec3[] = [
    c(0,0,0),c(1,0,0),c(2,0,0),c(3,0,0),
    c(0,0,1),c(1,0,1),c(2,0,1),c(3,0,1),
    c(3,0,2),
    c(0,1,0),c(1,1,0),c(2,1,0),c(3,1,0),
    c(0,1,1),c(1,1,1),c(2,1,1),c(3,1,1),
    c(0,1,2),c(1,1,2),
    c(0,2,0),c(1,2,0),c(2,2,0),c(0,2,1),c(1,2,1),
  ]
  const shapes: PuzzleShape[] = [
    { id: 'p6a', color: COLORS[0], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0),c(1,0,0),c(2,0,0),c(3,0,0)] },
    { id: 'p6b', color: COLORS[1], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0),c(0,0,1),c(0,0,2),c(1,0,2)] },
    { id: 'p6c', color: COLORS[2], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0),c(1,0,0),c(2,0,0),c(1,1,0)] },
    { id: 'p6d', color: COLORS[3], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0),c(1,0,0),c(1,1,0),c(2,1,0)] },
    { id: 'p6e', color: COLORS[4], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0),c(1,0,0),c(0,0,1),c(1,0,1)] },
    { id: 'p6f', color: COLORS[5], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0),c(1,0,0),c(1,1,0),c(1,0,1)] },
  ]
  const solution: PlacedShape[] = [
    { id: 'p6a', color: COLORS[0], cubes: [c(0,0,0),c(1,0,0),c(2,0,0),c(3,0,0)] },
    { id: 'p6b', color: COLORS[1], cubes: [c(0,1,0),c(0,1,1),c(0,1,2),c(1,1,2)] },
    { id: 'p6c', color: COLORS[2], cubes: [c(1,1,0),c(2,1,0),c(3,1,0),c(2,2,0)] },
    { id: 'p6d', color: COLORS[3], cubes: [c(0,0,1),c(1,0,1),c(1,1,1),c(2,1,1)] },
    { id: 'p6e', color: COLORS[4], cubes: [c(0,2,0),c(1,2,0),c(0,2,1),c(1,2,1)] },
    { id: 'p6f', color: COLORS[5], cubes: [c(2,0,1),c(3,0,1),c(3,1,1),c(3,0,2)] },
  ]
  return { container, validCells, shapes, solution }
}
