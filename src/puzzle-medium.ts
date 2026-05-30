import type { Vec3, Puzzle, PlacedShape, PuzzleShape } from './types'

const COLORS = ['#4A90D9', '#E67E22', '#2ECC71', '#9B59B6', '#E74C3C', '#1ABC9C', '#F39C12']
const c = (x: number, y: number, z: number): Vec3 => ({ x, y, z })

/*
  Medium 1 — irregular shelf container (20 cells). Bounding box: 2×3×4

  Two full 2×4 layers (y=0, y=1) plus a 2×2 shelf at y=2 (z=1..2 only).
  Valid cells:
    y=0: x=0..1, z=0..3  →  8 cells
    y=1: x=0..1, z=0..3  →  8 cells
    y=2: x=0..1, z=1..2  →  4 cells

  m1a (blue,   3): L-triomino   [c(0,0,0),c(1,0,0),c(0,0,1)]
  m1b (orange, 4): tower        [c(0,0,0),c(1,0,0),c(0,0,1),c(1,1,0)]
  m1c (green,  4): right-screw  [c(0,0,0),c(0,0,1),c(1,0,1),c(1,1,1)]
  m1d (purple, 4): 2×2 square   [c(0,0,0),c(1,0,0),c(0,1,0),c(1,1,0)]
  m1e (red,    5): P-pentomino  [c(0,0,0),c(1,0,0),c(1,0,1),c(0,1,0),c(1,1,0)]

  Solution (20 cells, no overlaps):
    m1a @ (0,2,1): (0,2,1),(1,2,1),(0,2,2)
    m1b @ (0,1,2): (0,1,2),(1,1,2),(0,1,3),(1,2,2)
    m1c @ (0,0,2): (0,0,2),(0,0,3),(1,0,3),(1,1,3)
    m1d @ (0,0,0): (0,0,0),(1,0,0),(0,1,0),(1,1,0)
    m1e @ (0,0,1): (0,0,1),(1,0,1),(1,0,2),(0,1,1),(1,1,1)
*/
export function getMediumPuzzle(): Puzzle {
  const container = c(2,3,4)
  const validCells: Vec3[] = [
    c(0,0,0),c(1,0,0),c(0,0,1),c(1,0,1),c(0,0,2),c(1,0,2),c(0,0,3),c(1,0,3),
    c(0,1,0),c(1,1,0),c(0,1,1),c(1,1,1),c(0,1,2),c(1,1,2),c(0,1,3),c(1,1,3),
    c(0,2,1),c(1,2,1),c(0,2,2),c(1,2,2),
  ]
  const shapes: PuzzleShape[] = [
    { id: 'm1a', color: COLORS[0], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0),c(1,0,0),c(0,0,1)] },
    { id: 'm1b', color: COLORS[1], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0),c(1,0,0),c(0,0,1),c(1,1,0)] },
    { id: 'm1c', color: COLORS[2], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0),c(0,0,1),c(1,0,1),c(1,1,1)] },
    { id: 'm1d', color: COLORS[3], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0),c(1,0,0),c(0,1,0),c(1,1,0)] },
    { id: 'm1e', color: COLORS[4], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0),c(1,0,0),c(1,0,1),c(0,1,0),c(1,1,0)] },
  ]
  const solution: PlacedShape[] = [
    { id: 'm1a', color: COLORS[0], cubes: [c(0,2,1),c(1,2,1),c(0,2,2)] },
    { id: 'm1b', color: COLORS[1], cubes: [c(0,1,2),c(1,1,2),c(0,1,3),c(1,2,2)] },
    { id: 'm1c', color: COLORS[2], cubes: [c(0,0,2),c(0,0,3),c(1,0,3),c(1,1,3)] },
    { id: 'm1d', color: COLORS[3], cubes: [c(0,0,0),c(1,0,0),c(0,1,0),c(1,1,0)] },
    { id: 'm1e', color: COLORS[4], cubes: [c(0,0,1),c(1,0,1),c(1,0,2),c(0,1,1),c(1,1,1)] },
  ]
  return { container, validCells, shapes, solution }
}

/*
  Medium 2 — irregular stepped container (24 cells). Bounding box: 3×3×4

  Full 3×4 base (y=0), 3×3 middle shelf (y=1, z=0..2), 3-cell cap (y=2, z=2 only).
  Valid cells:
    y=0: x=0..2, z=0..3  → 12 cells
    y=1: x=0..2, z=0..2  →  9 cells
    y=2: x=0..2, z=2     →  3 cells
*/
export function getMediumPuzzle2(): Puzzle {
  const container = c(3,3,4)
  const validCells: Vec3[] = [
    c(0,0,0),c(1,0,0),c(2,0,0),c(0,0,1),c(1,0,1),c(2,0,1),
    c(0,0,2),c(1,0,2),c(2,0,2),c(0,0,3),c(1,0,3),c(2,0,3),
    c(0,1,0),c(1,1,0),c(2,1,0),c(0,1,1),c(1,1,1),c(2,1,1),
    c(0,1,2),c(1,1,2),c(2,1,2),
    c(0,2,2),c(1,2,2),c(2,2,2),
  ]
  const shapes: PuzzleShape[] = [
    { id: 'm2a', color: COLORS[0], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0),c(1,0,0),c(2,0,0)] },
    { id: 'm2b', color: COLORS[1], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0),c(0,0,1),c(1,0,1)] },
    { id: 'm2c', color: COLORS[2], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0),c(0,0,1),c(0,1,0),c(0,1,1)] },
    { id: 'm2d', color: COLORS[3], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0),c(0,1,0),c(1,1,0),c(2,1,0)] },
    { id: 'm2e', color: COLORS[4], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,1),c(0,1,1),c(1,0,0),c(1,0,1),c(2,0,0)] },
    { id: 'm2f', color: COLORS[5], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0),c(0,0,1),c(1,0,0),c(1,0,1),c(2,0,1)] },
  ]
  const solution: PlacedShape[] = [
    { id: 'm2a', color: COLORS[0], cubes: [c(0,2,2),c(1,2,2),c(2,2,2)] },
    { id: 'm2b', color: COLORS[1], cubes: [c(1,1,1),c(0,1,2),c(1,1,2)] },
    { id: 'm2c', color: COLORS[2], cubes: [c(2,0,1),c(2,0,2),c(2,1,1),c(2,1,2)] },
    { id: 'm2d', color: COLORS[3], cubes: [c(0,0,0),c(0,1,0),c(1,1,0),c(2,1,0)] },
    { id: 'm2e', color: COLORS[4], cubes: [c(1,0,0),c(2,0,0),c(0,0,1),c(1,0,1),c(0,1,1)] },
    { id: 'm2f', color: COLORS[5], cubes: [c(0,0,2),c(1,0,2),c(0,0,3),c(1,0,3),c(2,0,3)] },
  ]
  return { container, validCells, shapes, solution }
}

/*
  Medium 3 — irregular tall container (28 cells). Bounding box: 2×4×4

  Full 2×4 for y=0 and y=1; 2×3 shelf for y=2 and y=3 (z=0..2 only).
*/
export function getMediumPuzzle3(): Puzzle {
  const container = c(2,4,4)
  const validCells: Vec3[] = [
    c(0,0,0),c(1,0,0),c(0,0,1),c(1,0,1),c(0,0,2),c(1,0,2),c(0,0,3),c(1,0,3),
    c(0,1,0),c(1,1,0),c(0,1,1),c(1,1,1),c(0,1,2),c(1,1,2),c(0,1,3),c(1,1,3),
    c(0,2,0),c(1,2,0),c(0,2,1),c(1,2,1),c(0,2,2),c(1,2,2),
    c(0,3,0),c(1,3,0),c(0,3,1),c(1,3,1),c(0,3,2),c(1,3,2),
  ]
  const shapes: PuzzleShape[] = [
    { id: 'm3a', color: COLORS[0], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0),c(0,0,1),c(0,1,1)] },
    { id: 'm3b', color: COLORS[1], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0),c(1,0,0),c(0,0,1),c(1,0,1)] },
    { id: 'm3c', color: COLORS[2], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0),c(0,1,0),c(0,2,0),c(0,3,0)] },
    { id: 'm3d', color: COLORS[3], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0),c(0,1,0),c(0,2,0),c(0,2,1)] },
    { id: 'm3e', color: COLORS[4], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,1),c(1,0,0),c(1,0,1),c(1,0,2)] },
    { id: 'm3f', color: COLORS[5], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0),c(1,0,0),c(1,0,1),c(1,1,1)] },
    { id: 'm3g', color: COLORS[6], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,1),c(0,1,0),c(0,1,1),c(1,0,1),c(1,1,1)] },
  ]
  const solution: PlacedShape[] = [
    { id: 'm3a', color: COLORS[0], cubes: [c(0,2,1),c(0,2,2),c(0,3,2)] },
    { id: 'm3b', color: COLORS[1], cubes: [c(0,0,1),c(1,0,1),c(0,0,2),c(1,0,2)] },
    { id: 'm3c', color: COLORS[2], cubes: [c(0,0,0),c(0,1,0),c(0,2,0),c(0,3,0)] },
    { id: 'm3d', color: COLORS[3], cubes: [c(1,0,0),c(1,1,0),c(1,2,0),c(1,2,1)] },
    { id: 'm3e', color: COLORS[4], cubes: [c(1,3,0),c(0,3,1),c(1,3,1),c(1,3,2)] },
    { id: 'm3f', color: COLORS[5], cubes: [c(0,1,1),c(1,1,1),c(1,1,2),c(1,2,2)] },
    { id: 'm3g', color: COLORS[6], cubes: [c(0,0,3),c(1,0,3),c(0,1,2),c(0,1,3),c(1,1,3)] },
  ]
  return { container, validCells, shapes, solution }
}

/*
  Medium 4 — irregular notched slab (20 cells). Bounding box: 3×2×4

  Full 3×4 base layer (y=0), partial upper layer (y=1) missing 4 cells.
  Valid cells:
    y=0: x=0..2, z=0..3  → 12 cells
    y=1: (0,1,0),(1,1,0),(0,1,1),(1,1,1),(2,1,1),(1,1,2),(2,1,2),(2,1,3)  →  8 cells

  5 distinct tetracubes (20 cells total):
  p4a (blue,   4): I-bar       [c(0,0,0),c(0,0,1),c(0,0,2),c(0,0,3)]
  p4b (orange, 4): L-tetromino [c(0,0,0),c(0,0,1),c(0,0,2),c(0,1,2)]
  p4c (green,  4): T-tetromino [c(0,0,0),c(0,0,1),c(0,0,2),c(0,1,1)]
  p4d (purple, 4): 2×2 square  [c(0,0,0),c(1,0,0),c(0,0,1),c(1,0,1)]
  p4e (red,    4): 3-D screw   [c(0,0,1),c(1,0,1),c(1,1,0),c(1,1,1)]

  Solution (20 cells, no overlaps):
    p4a: (0,0,0),(0,0,1),(0,0,2),(0,0,3)
    p4b: (1,0,0),(1,0,1),(1,0,2),(1,1,2)
    p4c: (2,0,0),(2,0,1),(2,0,2),(2,1,1)
    p4d: (0,1,0),(1,1,0),(0,1,1),(1,1,1)
    p4e: (1,0,3),(2,0,3),(2,1,2),(2,1,3)
*/
export function getMediumPuzzle4(): Puzzle {
  const container = c(3,2,4)
  const validCells: Vec3[] = [
    c(0,0,0),c(1,0,0),c(2,0,0),c(0,0,1),c(1,0,1),c(2,0,1),
    c(0,0,2),c(1,0,2),c(2,0,2),c(0,0,3),c(1,0,3),c(2,0,3),
    c(0,1,0),c(1,1,0),c(0,1,1),c(1,1,1),c(2,1,1),c(1,1,2),c(2,1,2),c(2,1,3),
  ]
  const shapes: PuzzleShape[] = [
    { id: 'p4a', color: COLORS[0], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0),c(0,0,1),c(0,0,2),c(0,0,3)] },
    { id: 'p4b', color: COLORS[1], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0),c(0,0,1),c(0,0,2),c(0,1,2)] },
    { id: 'p4c', color: COLORS[2], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0),c(0,0,1),c(0,0,2),c(0,1,1)] },
    { id: 'p4d', color: COLORS[3], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0),c(1,0,0),c(0,0,1),c(1,0,1)] },
    { id: 'p4e', color: COLORS[4], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,1),c(1,0,1),c(1,1,0),c(1,1,1)] },
  ]
  const solution: PlacedShape[] = [
    { id: 'p4a', color: COLORS[0], cubes: [c(0,0,0),c(0,0,1),c(0,0,2),c(0,0,3)] },
    { id: 'p4b', color: COLORS[1], cubes: [c(1,0,0),c(1,0,1),c(1,0,2),c(1,1,2)] },
    { id: 'p4c', color: COLORS[2], cubes: [c(2,0,0),c(2,0,1),c(2,0,2),c(2,1,1)] },
    { id: 'p4d', color: COLORS[3], cubes: [c(0,1,0),c(1,1,0),c(0,1,1),c(1,1,1)] },
    { id: 'p4e', color: COLORS[4], cubes: [c(1,0,3),c(2,0,3),c(2,1,2),c(2,1,3)] },
  ]
  return { container, validCells, shapes, solution }
}

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
