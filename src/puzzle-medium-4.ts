import type { Vec3, Puzzle, PlacedShape, PuzzleShape } from './types'

const COLORS = ['#4A90D9', '#E67E22', '#2ECC71', '#9B59B6', '#E74C3C', '#1ABC9C', '#F39C12']
const c = (x: number, y: number, z: number): Vec3 => ({ x, y, z })

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
