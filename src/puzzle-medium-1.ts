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
