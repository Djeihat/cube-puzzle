import type { Vec3, Puzzle, PlacedShape, PuzzleShape } from './types'

const COLORS = ['#4A90D9', '#E67E22', '#2ECC71', '#9B59B6', '#E74C3C', '#1ABC9C', '#F39C12']
const c = (x: number, y: number, z: number): Vec3 => ({ x, y, z })

/*
  Medium 10 — staircase prism (28 cells). Bounding box: 4×3×4

  Side profile (same at every z slice):
    y\x  0  1  2  3
    0    X  X  X  X   ← full row
    1    X  X  .  .   ← half row
    2    X  .  .  .   ← single cell

  Valid cells:
    y=0: x=0..3, z=0..3  → 16 cells
    y=1: x=0..1, z=0..3  →  8 cells
    y=2: x=0,   z=0..3   →  4 cells

  All 7 distinct free tetracubes (28 cells):
  p10a (blue,   4): I-bar        [c(0,0,0),c(1,0,0),c(2,0,0),c(3,0,0)]
  p10b (orange, 4): T-tetromino  [c(0,0,0),c(1,0,0),c(2,0,0),c(1,1,0)]
  p10c (green,  4): L-tetromino  [c(0,0,0),c(1,0,0),c(2,0,0),c(2,1,0)]
  p10d (purple, 4): 2×2 square   [c(0,0,0),c(1,0,0),c(0,1,0),c(1,1,0)]
  p10e (red,    4): S-skew       [c(0,0,0),c(1,0,0),c(1,1,0),c(2,1,0)]
  p10f (teal,   4): branch       [c(0,0,0),c(1,0,0),c(0,1,0),c(0,0,1)]
  p10g (yellow, 4): right-screw  [c(0,0,0),c(1,0,0),c(1,1,0),c(1,1,1)]

  Solution (28 cells, no overlaps):
    p10a: (0,0,0),(1,0,0),(2,0,0),(3,0,0)
    p10b: (0,0,3),(0,0,2),(0,0,1),(1,0,2)
    p10c: (3,0,1),(2,0,1),(1,0,1),(1,1,1)
    p10d: (3,0,3),(3,0,2),(2,0,3),(2,0,2)
    p10e: (1,0,3),(1,1,3),(0,1,3),(0,2,3)
    p10f: (0,1,0),(1,1,0),(0,2,0),(0,1,1)
    p10g: (1,1,2),(0,1,2),(0,2,2),(0,2,1)
*/
export function getMediumPuzzle10(): Puzzle {
  const container = c(4,3,4)
  const validCells: Vec3[] = [
    c(0,0,0),c(1,0,0),c(2,0,0),c(3,0,0),
    c(0,0,1),c(1,0,1),c(2,0,1),c(3,0,1),
    c(0,0,2),c(1,0,2),c(2,0,2),c(3,0,2),
    c(0,0,3),c(1,0,3),c(2,0,3),c(3,0,3),
    c(0,1,0),c(1,1,0),
    c(0,1,1),c(1,1,1),
    c(0,1,2),c(1,1,2),
    c(0,1,3),c(1,1,3),
    c(0,2,0),c(0,2,1),c(0,2,2),c(0,2,3),
  ]
  const shapes: PuzzleShape[] = [
    { id: 'p10a', color: COLORS[0], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0),c(1,0,0),c(2,0,0),c(3,0,0)] },
    { id: 'p10b', color: COLORS[1], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0),c(1,0,0),c(2,0,0),c(1,1,0)] },
    { id: 'p10c', color: COLORS[2], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0),c(1,0,0),c(2,0,0),c(2,1,0)] },
    { id: 'p10d', color: COLORS[3], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0),c(1,0,0),c(0,1,0),c(1,1,0)] },
    { id: 'p10e', color: COLORS[4], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0),c(1,0,0),c(1,1,0),c(2,1,0)] },
    { id: 'p10f', color: COLORS[5], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0),c(1,0,0),c(0,1,0),c(0,0,1)] },
    { id: 'p10g', color: COLORS[6], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0),c(1,0,0),c(1,1,0),c(1,1,1)] },
  ]
  const solution: PlacedShape[] = [
    { id: 'p10a', color: COLORS[0], cubes: [c(0,0,0),c(1,0,0),c(2,0,0),c(3,0,0)] },
    { id: 'p10b', color: COLORS[1], cubes: [c(0,0,3),c(0,0,2),c(0,0,1),c(1,0,2)] },
    { id: 'p10c', color: COLORS[2], cubes: [c(3,0,1),c(2,0,1),c(1,0,1),c(1,1,1)] },
    { id: 'p10d', color: COLORS[3], cubes: [c(3,0,3),c(3,0,2),c(2,0,3),c(2,0,2)] },
    { id: 'p10e', color: COLORS[4], cubes: [c(1,0,3),c(1,1,3),c(0,1,3),c(0,2,3)] },
    { id: 'p10f', color: COLORS[5], cubes: [c(0,1,0),c(1,1,0),c(0,2,0),c(0,1,1)] },
    { id: 'p10g', color: COLORS[6], cubes: [c(1,1,2),c(0,1,2),c(0,2,2),c(0,2,1)] },
  ]
  return { container, validCells, shapes, solution }
}
