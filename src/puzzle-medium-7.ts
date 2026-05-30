import type { Vec3, Puzzle, PlacedShape, PuzzleShape } from './types'

const COLORS = ['#4A90D9', '#E67E22', '#2ECC71', '#9B59B6', '#E74C3C', '#1ABC9C', '#F39C12']
const c = (x: number, y: number, z: number): Vec3 => ({ x, y, z })

/*
  Medium 7 — top-narrowed cube (24 cells). Bounding box: 3×3×3

  Full 3×3 at y=0 and y=1; narrows to 2×3 at y=2 (x=0..1 only).
  Valid cells:
    y=0: x=0..2, z=0..2  →  9 cells
    y=1: x=0..2, z=0..2  →  9 cells
    y=2: x=0..1, z=0..2  →  6 cells

  6 distinct free tetracubes (24 cells):
  p7a (blue,   4): T-tetromino     [c(0,0,0),c(0,0,1),c(0,0,2),c(1,0,1)]
  p7b (orange, 4): S-skew          [c(0,0,0),c(0,1,0),c(1,1,0),c(1,2,0)]
  p7c (green,  4): L-tetromino     [c(0,0,0),c(1,0,0),c(1,1,0),c(1,2,0)]
  p7d (purple, 4): branch/triakis  [c(0,0,0),c(1,0,0),c(0,1,0),c(0,0,1)]
  p7e (red,    4): 2×2 square      [c(0,0,0),c(1,0,0),c(0,1,0),c(1,1,0)]
  p7f (teal,   4): right-screw     [c(0,0,0),c(1,0,0),c(1,1,0),c(1,1,1)]

  Solution (24 cells, no overlaps):
    p7a: (0,2,0),(0,2,1),(0,2,2),(1,2,1)
    p7b: (2,0,0),(1,1,0),(2,1,0),(1,2,0)
    p7c: (0,0,2),(1,0,2),(1,1,2),(1,2,2)
    p7d: (0,0,0),(1,0,0),(0,1,0),(0,0,1)
    p7e: (2,0,1),(2,0,2),(2,1,1),(2,1,2)
    p7f: (1,0,1),(1,1,1),(0,1,1),(0,1,2)
*/
export function getMediumPuzzle7(): Puzzle {
  const container = c(3,3,3)
  const validCells: Vec3[] = [
    c(0,0,0),c(1,0,0),c(2,0,0),c(0,0,1),c(1,0,1),c(2,0,1),c(0,0,2),c(1,0,2),c(2,0,2),
    c(0,1,0),c(1,1,0),c(2,1,0),c(0,1,1),c(1,1,1),c(2,1,1),c(0,1,2),c(1,1,2),c(2,1,2),
    c(0,2,0),c(1,2,0),c(0,2,1),c(1,2,1),c(0,2,2),c(1,2,2),
  ]
  const shapes: PuzzleShape[] = [
    { id: 'p7a', color: COLORS[0], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0),c(0,0,1),c(0,0,2),c(1,0,1)] },
    { id: 'p7b', color: COLORS[1], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0),c(0,1,0),c(1,1,0),c(1,2,0)] },
    { id: 'p7c', color: COLORS[2], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0),c(1,0,0),c(1,1,0),c(1,2,0)] },
    { id: 'p7d', color: COLORS[3], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0),c(1,0,0),c(0,1,0),c(0,0,1)] },
    { id: 'p7e', color: COLORS[4], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0),c(1,0,0),c(0,1,0),c(1,1,0)] },
    { id: 'p7f', color: COLORS[5], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0),c(1,0,0),c(1,1,0),c(1,1,1)] },
  ]
  const solution: PlacedShape[] = [
    { id: 'p7a', color: COLORS[0], cubes: [c(0,2,0),c(0,2,1),c(0,2,2),c(1,2,1)] },
    { id: 'p7b', color: COLORS[1], cubes: [c(2,0,0),c(1,1,0),c(2,1,0),c(1,2,0)] },
    { id: 'p7c', color: COLORS[2], cubes: [c(0,0,2),c(1,0,2),c(1,1,2),c(1,2,2)] },
    { id: 'p7d', color: COLORS[3], cubes: [c(0,0,0),c(1,0,0),c(0,1,0),c(0,0,1)] },
    { id: 'p7e', color: COLORS[4], cubes: [c(2,0,1),c(2,0,2),c(2,1,1),c(2,1,2)] },
    { id: 'p7f', color: COLORS[5], cubes: [c(1,0,1),c(1,1,1),c(0,1,1),c(0,1,2)] },
  ]
  return { container, validCells, shapes, solution }
}
