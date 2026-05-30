import type { Vec3, Puzzle, PlacedShape, PuzzleShape } from './types'

const COLORS = ['#4A90D9', '#E67E22', '#2ECC71', '#9B59B6', '#E74C3C', '#1ABC9C', '#F39C12']
const c = (x: number, y: number, z: number): Vec3 => ({ x, y, z })

/*
  Medium 8 — front-narrowed cube (24 cells). Bounding box: 3×3×3

  Full 3×3 at z=1 and z=2; narrows to 2×3 at z=0 (x=0..1 only).
  Valid cells:
    z=0: x=0..1, y=0..2  →  6 cells
    z=1: x=0..2, y=0..2  →  9 cells
    z=2: x=0..2, y=0..2  →  9 cells

  6 distinct free tetracubes (24 cells):
  p8a (blue,   4): branch/triakis  [c(0,0,0),c(1,0,0),c(0,1,0),c(0,0,1)]
  p8b (orange, 4): T-tetromino     [c(0,0,0),c(1,0,0),c(2,0,0),c(1,1,0)]
  p8c (green,  4): 2×2 square      [c(0,0,0),c(1,0,0),c(0,1,0),c(1,1,0)]
  p8d (purple, 4): right-screw     [c(0,0,0),c(1,0,0),c(1,1,0),c(1,1,1)]
  p8e (red,    4): S-skew          [c(0,0,0),c(0,1,0),c(1,1,0),c(1,2,0)]
  p8f (teal,   4): L-tetromino     [c(0,0,0),c(0,1,0),c(0,2,0),c(1,2,0)]

  Solution (24 cells, no overlaps):
    p8a: (0,0,0),(1,0,0),(0,1,0),(0,0,1)
    p8b: (0,2,0),(1,2,0),(1,1,0),(1,2,1)
    p8c: (0,0,2),(1,0,2),(0,1,2),(1,1,2)
    p8d: (0,1,1),(0,2,1),(0,2,2),(1,2,2)
    p8e: (1,0,1),(1,1,1),(2,1,1),(2,2,1)
    p8f: (2,0,1),(2,0,2),(2,1,2),(2,2,2)
*/
export function getMediumPuzzle8(): Puzzle {
  const container = c(3,3,3)
  const validCells: Vec3[] = [
    c(0,0,0),c(1,0,0),c(0,1,0),c(1,1,0),c(0,2,0),c(1,2,0),
    c(0,0,1),c(1,0,1),c(2,0,1),c(0,1,1),c(1,1,1),c(2,1,1),c(0,2,1),c(1,2,1),c(2,2,1),
    c(0,0,2),c(1,0,2),c(2,0,2),c(0,1,2),c(1,1,2),c(2,1,2),c(0,2,2),c(1,2,2),c(2,2,2),
  ]
  const shapes: PuzzleShape[] = [
    { id: 'p8a', color: COLORS[0], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0),c(1,0,0),c(0,1,0),c(0,0,1)] },
    { id: 'p8b', color: COLORS[1], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0),c(1,0,0),c(2,0,0),c(1,1,0)] },
    { id: 'p8c', color: COLORS[2], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0),c(1,0,0),c(0,1,0),c(1,1,0)] },
    { id: 'p8d', color: COLORS[3], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0),c(1,0,0),c(1,1,0),c(1,1,1)] },
    { id: 'p8e', color: COLORS[4], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0),c(0,1,0),c(1,1,0),c(1,2,0)] },
    { id: 'p8f', color: COLORS[5], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0),c(0,1,0),c(0,2,0),c(1,2,0)] },
  ]
  const solution: PlacedShape[] = [
    { id: 'p8a', color: COLORS[0], cubes: [c(0,0,0),c(1,0,0),c(0,1,0),c(0,0,1)] },
    { id: 'p8b', color: COLORS[1], cubes: [c(0,2,0),c(1,2,0),c(1,1,0),c(1,2,1)] },
    { id: 'p8c', color: COLORS[2], cubes: [c(0,0,2),c(1,0,2),c(0,1,2),c(1,1,2)] },
    { id: 'p8d', color: COLORS[3], cubes: [c(0,1,1),c(0,2,1),c(0,2,2),c(1,2,2)] },
    { id: 'p8e', color: COLORS[4], cubes: [c(1,0,1),c(1,1,1),c(2,1,1),c(2,2,1)] },
    { id: 'p8f', color: COLORS[5], cubes: [c(2,0,1),c(2,0,2),c(2,1,2),c(2,2,2)] },
  ]
  return { container, validCells, shapes, solution }
}
