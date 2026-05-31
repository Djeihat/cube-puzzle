import type { Vec3, Puzzle, PlacedShape, PuzzleShape } from './types'

const COLORS = ['#4A90D9', '#E67E22', '#2ECC71', '#9B59B6', '#E74C3C', '#1ABC9C', '#F39C12']
const c = (x: number, y: number, z: number): Vec3 => ({ x, y, z })

/*
  Medium 9 — stepped slab (28 cells). Bounding box: 4×2×4

  Full 4×4 base at y=0; upper layer y=1 covers only x=0..2 (x=3 column removed).

  Top view:
    y=0 (full):          y=1 (x=0..2 only):
    z\x 0 1 2 3         z\x 0 1 2
    0   X X X X         0   X X X
    1   X X X X         1   X X X
    2   X X X X         2   X X X
    3   X X X X         3   X X X

  Valid cells:
    y=0: x=0..3, z=0..3  → 16 cells
    y=1: x=0..2, z=0..3  → 12 cells

  All 7 distinct free tetracubes (28 cells):
  p9a (blue,   4): I-bar        [c(0,0,0),c(1,0,0),c(2,0,0),c(3,0,0)]
  p9b (orange, 4): 2×2 square   [c(0,0,0),c(1,0,0),c(0,0,1),c(1,0,1)]
  p9c (green,  4): T-tetromino  [c(0,0,0),c(0,0,1),c(0,0,2),c(1,0,1)]
  p9d (purple, 4): right-screw  [c(0,0,0),c(1,0,0),c(1,1,0),c(1,1,1)]
  p9e (red,    4): branch       [c(0,0,0),c(1,0,0),c(0,1,0),c(0,0,1)]
  p9f (teal,   4): L-tetromino  [c(0,0,0),c(1,0,0),c(1,0,1),c(1,0,2)]
  p9g (yellow, 4): S-skew       [c(0,0,0),c(0,0,1),c(1,0,1),c(1,0,2)]

  Solution (28 cells, no overlaps):
    p9a: (3,0,0),(3,0,1),(3,0,2),(3,0,3)          — x=3 column, y=0
    p9b: (1,0,0),(2,0,0),(2,0,1),(1,0,1)          — 2×2 in y=0 x=1..2 z=0..1
    p9c: (0,0,1),(0,0,2),(0,0,3),(1,0,2)          — T in y=0 x=0..1 z=1..3
    p9d: (0,0,0),(0,1,0),(0,1,1),(1,1,1)          — right-screw spanning y
    p9e: (2,0,2),(2,0,3),(1,0,3),(2,1,3)          — branch spanning y
    p9f: (1,1,0),(2,1,0),(2,1,1),(2,1,2)          — L in y=1
    p9g: (0,1,2),(1,1,2),(1,1,3),(0,1,3)          — S in y=1
*/
export function getMediumPuzzle9(): Puzzle {
  const container = c(4,2,4)
  const validCells: Vec3[] = [
    c(0,0,0),c(1,0,0),c(2,0,0),c(3,0,0),
    c(0,0,1),c(1,0,1),c(2,0,1),c(3,0,1),
    c(0,0,2),c(1,0,2),c(2,0,2),c(3,0,2),
    c(0,0,3),c(1,0,3),c(2,0,3),c(3,0,3),
    c(0,1,0),c(1,1,0),c(2,1,0),
    c(0,1,1),c(1,1,1),c(2,1,1),
    c(0,1,2),c(1,1,2),c(2,1,2),
    c(0,1,3),c(1,1,3),c(2,1,3),
  ]
  const shapes: PuzzleShape[] = [
    { id: 'p9a', color: COLORS[0], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0),c(1,0,0),c(2,0,0),c(3,0,0)] },
    { id: 'p9b', color: COLORS[1], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0),c(1,0,0),c(0,0,1),c(1,0,1)] },
    { id: 'p9c', color: COLORS[2], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0),c(0,0,1),c(0,0,2),c(1,0,1)] },
    { id: 'p9d', color: COLORS[3], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0),c(1,0,0),c(1,1,0),c(1,1,1)] },
    { id: 'p9e', color: COLORS[4], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0),c(1,0,0),c(0,1,0),c(0,0,1)] },
    { id: 'p9f', color: COLORS[5], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0),c(1,0,0),c(1,0,1),c(1,0,2)] },
    { id: 'p9g', color: COLORS[6], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0),c(0,0,1),c(1,0,1),c(1,0,2)] },
  ]
  const solution: PlacedShape[] = [
    { id: 'p9a', color: COLORS[0], cubes: [c(3,0,0),c(3,0,1),c(3,0,2),c(3,0,3)] },
    { id: 'p9b', color: COLORS[1], cubes: [c(1,0,0),c(2,0,0),c(2,0,1),c(1,0,1)] },
    { id: 'p9c', color: COLORS[2], cubes: [c(0,0,1),c(0,0,2),c(0,0,3),c(1,0,2)] },
    { id: 'p9d', color: COLORS[3], cubes: [c(0,0,0),c(0,1,0),c(0,1,1),c(1,1,1)] },
    { id: 'p9e', color: COLORS[4], cubes: [c(2,0,2),c(2,0,3),c(1,0,3),c(2,1,3)] },
    { id: 'p9f', color: COLORS[5], cubes: [c(1,1,0),c(2,1,0),c(2,1,1),c(2,1,2)] },
    { id: 'p9g', color: COLORS[6], cubes: [c(0,1,2),c(1,1,2),c(1,1,3),c(0,1,3)] },
  ]
  return { container, validCells, shapes, solution }
}
