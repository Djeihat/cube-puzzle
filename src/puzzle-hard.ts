import type { Vec3, Puzzle, PlacedShape, PuzzleShape } from './types'

const COLORS = ['#4A90D9', '#E67E22', '#2ECC71', '#9B59B6', '#E74C3C', '#1ABC9C', '#F39C12']
const c = (x: number, y: number, z: number): Vec3 => ({ x, y, z })

/*
  Hard 1 — irregular staircase container (16 cells). Bounding box: 3×3×2

  Valid cells:
    y=0: (0..2, 0, 0..1)  →  6 cells
    y=1: (0..2, 1, 0..1)  →  6 cells
    y=2: (0..1, 2, 0..1)  →  4 cells  (narrower top step)

  sA (blue)   — L in x-y:   (0,0,0),(1,0,0),(2,0,0),(2,1,0)
  sB (orange) — 3-D corner:  (0,0,0),(0,1,0),(0,1,1),(1,1,0)
  sC (purple) — 3-D T:       (0,0,0),(0,0,1),(0,1,1),(1,0,1)
  sD (green)  — J in x-y:    (0,0,0),(1,0,0),(2,0,0),(0,1,0)

  Solution:
    sA @ (0,0,0): (0,0,0),(1,0,0),(2,0,0),(2,1,0)
    sB @ (0,1,0): (0,1,0),(0,2,0),(0,2,1),(1,2,0)
    sC @ (1,1,0): (1,1,0),(1,1,1),(1,2,1),(2,1,1)
    sD @ (0,0,1): (0,0,1),(1,0,1),(2,0,1),(0,1,1)
*/
export function getHardPuzzle(): Puzzle {
  const container = c(3,3,2)
  const validCells: Vec3[] = [
    c(0,0,0), c(1,0,0), c(2,0,0), c(0,0,1), c(1,0,1), c(2,0,1),
    c(0,1,0), c(1,1,0), c(2,1,0), c(0,1,1), c(1,1,1), c(2,1,1),
    c(0,2,0), c(1,2,0),           c(0,2,1), c(1,2,1),
  ]
  const shapes: PuzzleShape[] = [
    { id: 'sA', color: COLORS[0], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0), c(1,0,0), c(2,0,0), c(2,1,0)] },
    { id: 'sB', color: COLORS[1], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0), c(0,1,0), c(0,1,1), c(1,1,0)] },
    { id: 'sC', color: COLORS[3], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0), c(0,0,1), c(0,1,1), c(1,0,1)] },
    { id: 'sD', color: COLORS[2], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0), c(1,0,0), c(2,0,0), c(0,1,0)] },
  ]
  const solution: PlacedShape[] = [
    { id: 'sA', color: COLORS[0], cubes: [c(0,0,0), c(1,0,0), c(2,0,0), c(2,1,0)] },
    { id: 'sB', color: COLORS[1], cubes: [c(0,1,0), c(0,2,0), c(0,2,1), c(1,2,0)] },
    { id: 'sC', color: COLORS[3], cubes: [c(1,1,0), c(1,1,1), c(1,2,1), c(2,1,1)] },
    { id: 'sD', color: COLORS[2], cubes: [c(0,0,1), c(1,0,1), c(2,0,1), c(0,1,1)] },
  ]
  return { container, validCells, shapes, solution }
}

/*
  Hard 2 — 4×2×2 rectangular container (16 cells), four 4-cube pieces.

  h2a (blue)   — I-bar:              (0,0,0),(1,0,0),(2,0,0),(3,0,0)
  h2b (orange) — 3-D corner at x=0:  (0,1,0),(1,1,0),(0,0,1),(0,1,1)
  h2c (green)  — 3-D corner at x=3:  (0,1,0),(1,1,0),(1,0,1),(1,1,1)
  h2d (purple) — 2×2 slab middle:    (0,0,0),(1,0,0),(0,1,0),(1,1,0)

  Solution:
    h2a @ (0,0,0): (0,0,0),(1,0,0),(2,0,0),(3,0,0)
    h2b @ (0,1,0): (0,1,0),(1,1,0),(0,0,1),(0,1,1)
    h2c @ (2,1,0): (2,1,0),(3,1,0),(3,0,1),(3,1,1)
    h2d @ (1,0,1): (1,0,1),(2,0,1),(1,1,1),(2,1,1)
*/
export function getHardPuzzle2(): Puzzle {
  const container = c(4,2,2)
  const shapes: PuzzleShape[] = [
    { id: 'h2a', color: COLORS[0], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0), c(1,0,0), c(2,0,0), c(3,0,0)] },
    { id: 'h2b', color: COLORS[1], rotation: [0,0,0], placed: false,
      cubes: [c(0,1,0), c(1,1,0), c(0,0,1), c(0,1,1)] },
    { id: 'h2c', color: COLORS[2], rotation: [0,0,0], placed: false,
      cubes: [c(0,1,0), c(1,1,0), c(1,0,1), c(1,1,1)] },
    { id: 'h2d', color: COLORS[3], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0), c(1,0,0), c(0,1,0), c(1,1,0)] },
  ]
  const solution: PlacedShape[] = [
    { id: 'h2a', color: COLORS[0], cubes: [c(0,0,0), c(1,0,0), c(2,0,0), c(3,0,0)] },
    { id: 'h2b', color: COLORS[1], cubes: [c(0,1,0), c(1,1,0), c(0,0,1), c(0,1,1)] },
    { id: 'h2c', color: COLORS[2], cubes: [c(2,1,0), c(3,1,0), c(3,0,1), c(3,1,1)] },
    { id: 'h2d', color: COLORS[3], cubes: [c(1,0,1), c(2,0,1), c(1,1,1), c(2,1,1)] },
  ]
  return { container, shapes, solution }
}
