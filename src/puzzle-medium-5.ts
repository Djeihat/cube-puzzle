import type { Vec3, Puzzle, PlacedShape, PuzzleShape } from './types'

const COLORS = ['#4A90D9', '#E67E22', '#2ECC71', '#9B59B6', '#E74C3C', '#1ABC9C', '#F39C12']
const c = (x: number, y: number, z: number): Vec3 => ({ x, y, z })

/*
  Medium 5 — irregular scattered slab (20 cells). Bounding box: 4×2×4

  Full 4×4 base (y=0) minus 5 cells; partial upper layer (y=1) with 9 cells.
  Valid cells:
    y=0: (0,0,0),(0,0,1),(0,0,2),(0,0,3),(1,0,0),(1,0,1),(1,0,2),(2,0,1),(2,0,2),(3,0,1),(3,0,2)  → 11 cells
    y=1: (0,1,0),(1,1,0),(2,1,0),(0,1,1),(1,1,1),(2,1,1),(3,1,1),(0,1,2),(1,1,2)                   →  9 cells

  5 distinct tetracubes (20 cells total):
  p5a (blue,   4): I-bar       [c(0,0,0),c(0,0,1),c(0,0,2),c(0,0,3)]
  p5b (orange, 4): T-tetromino [c(0,1,0),c(1,0,0),c(1,1,0),c(2,1,0)]
  p5c (green,  4): S-skew      [c(0,0,0),c(1,0,0),c(1,1,0),c(2,1,0)]
  p5d (purple, 4): L-tetromino [c(0,0,0),c(1,0,0),c(2,0,0),c(2,0,1)]
  p5e (red,    4): 2×2 square  [c(0,0,0),c(1,0,0),c(0,0,1),c(1,0,1)]

  Solution (20 cells, no overlaps):
    p5a: (0,0,0),(0,0,1),(0,0,2),(0,0,3)
    p5b: (1,0,0),(0,1,0),(1,1,0),(2,1,0)
    p5c: (1,0,1),(2,0,1),(2,1,1),(3,1,1)
    p5d: (1,0,2),(2,0,2),(3,0,2),(3,0,1)
    p5e: (0,1,1),(0,1,2),(1,1,1),(1,1,2)
*/
export function getMediumPuzzle5(): Puzzle {
  const container = c(4,2,4)
  const validCells: Vec3[] = [
    c(0,0,0),c(0,0,1),c(0,0,2),c(0,0,3),
    c(1,0,0),c(1,0,1),c(1,0,2),
    c(2,0,1),c(2,0,2),
    c(3,0,1),c(3,0,2),
    c(0,1,0),c(1,1,0),c(2,1,0),
    c(0,1,1),c(1,1,1),c(2,1,1),c(3,1,1),
    c(0,1,2),c(1,1,2),
  ]
  const shapes: PuzzleShape[] = [
    { id: 'p5a', color: COLORS[0], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0),c(0,0,1),c(0,0,2),c(0,0,3)] },
    { id: 'p5b', color: COLORS[1], rotation: [0,0,0], placed: false,
      cubes: [c(0,1,0),c(1,0,0),c(1,1,0),c(2,1,0)] },
    { id: 'p5c', color: COLORS[2], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0),c(1,0,0),c(1,1,0),c(2,1,0)] },
    { id: 'p5d', color: COLORS[3], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0),c(1,0,0),c(2,0,0),c(2,0,1)] },
    { id: 'p5e', color: COLORS[4], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0),c(1,0,0),c(0,0,1),c(1,0,1)] },
  ]
  const solution: PlacedShape[] = [
    { id: 'p5a', color: COLORS[0], cubes: [c(0,0,0),c(0,0,1),c(0,0,2),c(0,0,3)] },
    { id: 'p5b', color: COLORS[1], cubes: [c(1,0,0),c(0,1,0),c(1,1,0),c(2,1,0)] },
    { id: 'p5c', color: COLORS[2], cubes: [c(1,0,1),c(2,0,1),c(2,1,1),c(3,1,1)] },
    { id: 'p5d', color: COLORS[3], cubes: [c(1,0,2),c(2,0,2),c(3,0,2),c(3,0,1)] },
    { id: 'p5e', color: COLORS[4], cubes: [c(0,1,1),c(1,1,1),c(0,1,2),c(1,1,2)] },
  ]
  return { container, validCells, shapes, solution }
}
