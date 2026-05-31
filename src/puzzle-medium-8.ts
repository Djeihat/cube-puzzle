import type { Vec3, Puzzle, PlacedShape, PuzzleShape } from './types'

const COLORS = ['#4A90D9', '#E67E22', '#2ECC71', '#9B59B6', '#E74C3C', '#1ABC9C', '#F39C12']
const c = (x: number, y: number, z: number): Vec3 => ({ x, y, z })

/*
  Medium 8 — L-corner slab (24 cells). Bounding box: 4×2×4

  Full 4×2 at z=0 and z=1; narrows to 2×2 at z=2 and z=3 (x=0..1 only).
  The far corner block (x=2..3, z=2..3) is removed from both y layers.

  Top view (either y layer):
    z\x  0  1  2  3
    0    X  X  X  X
    1    X  X  X  X
    2    X  X  .  .
    3    X  X  .  .

  Valid cells:
    y=0: x=0..3 z=0..1 (8), x=0..1 z=2..3 (4)  → 12 cells
    y=1: x=0..3 z=0..1 (8), x=0..1 z=2..3 (4)  → 12 cells

  6 distinct free tetracubes (24 cells):
  p8a (blue,   4): I-bar        [c(0,0,0),c(1,0,0),c(2,0,0),c(3,0,0)]
  p8b (orange, 4): T-tetromino  [c(0,0,0),c(1,0,0),c(2,0,0),c(1,0,1)]
  p8c (green,  4): branch       [c(0,0,0),c(1,0,0),c(0,1,0),c(0,0,1)]
  p8d (purple, 4): 2×2 square   [c(0,0,0),c(1,0,0),c(0,1,0),c(1,1,0)]
  p8e (red,    4): L-tetromino  [c(0,0,0),c(0,0,1),c(0,0,2),c(1,0,0)]
  p8f (teal,   4): right-screw  [c(0,0,0),c(1,0,0),c(1,1,0),c(1,1,1)]

  Solution (24 cells, no overlaps):
    p8a: (0,0,0),(1,0,0),(2,0,0),(3,0,0)
    p8b: (0,1,0),(1,1,0),(2,1,0),(1,1,1)
    p8c: (2,1,1),(3,1,0),(3,0,1),(3,1,1)
    p8d: (0,0,1),(0,1,1),(0,0,2),(0,1,2)
    p8e: (1,0,1),(2,0,1),(1,0,2),(1,0,3)
    p8f: (0,0,3),(0,1,3),(1,1,3),(1,1,2)
*/
export function getMediumPuzzle8(): Puzzle {
  const container = c(4,2,4)
  const validCells: Vec3[] = [
    c(0,0,0),c(1,0,0),c(2,0,0),c(3,0,0),
    c(0,0,1),c(1,0,1),c(2,0,1),c(3,0,1),
    c(0,0,2),c(1,0,2),
    c(0,0,3),c(1,0,3),
    c(0,1,0),c(1,1,0),c(2,1,0),c(3,1,0),
    c(0,1,1),c(1,1,1),c(2,1,1),c(3,1,1),
    c(0,1,2),c(1,1,2),
    c(0,1,3),c(1,1,3),
  ]
  const shapes: PuzzleShape[] = [
    { id: 'p8a', color: COLORS[0], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0),c(1,0,0),c(2,0,0),c(3,0,0)] },
    { id: 'p8b', color: COLORS[1], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0),c(1,0,0),c(2,0,0),c(1,0,1)] },
    { id: 'p8c', color: COLORS[2], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0),c(1,0,0),c(0,1,0),c(0,0,1)] },
    { id: 'p8d', color: COLORS[3], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0),c(1,0,0),c(0,1,0),c(1,1,0)] },
    { id: 'p8e', color: COLORS[4], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0),c(0,0,1),c(0,0,2),c(1,0,0)] },
    { id: 'p8f', color: COLORS[5], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0),c(1,0,0),c(1,1,0),c(1,1,1)] },
  ]
  const solution: PlacedShape[] = [
    { id: 'p8a', color: COLORS[0], cubes: [c(0,0,0),c(1,0,0),c(2,0,0),c(3,0,0)] },
    { id: 'p8b', color: COLORS[1], cubes: [c(0,1,0),c(1,1,0),c(2,1,0),c(1,1,1)] },
    { id: 'p8c', color: COLORS[2], cubes: [c(2,1,1),c(3,1,0),c(3,0,1),c(3,1,1)] },
    { id: 'p8d', color: COLORS[3], cubes: [c(0,0,1),c(0,1,1),c(0,0,2),c(0,1,2)] },
    { id: 'p8e', color: COLORS[4], cubes: [c(1,0,1),c(2,0,1),c(1,0,2),c(1,0,3)] },
    { id: 'p8f', color: COLORS[5], cubes: [c(0,0,3),c(0,1,3),c(1,1,3),c(1,1,2)] },
  ]
  return { container, validCells, shapes, solution }
}
