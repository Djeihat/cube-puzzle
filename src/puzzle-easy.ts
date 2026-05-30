import type { Vec3, Puzzle, PlacedShape, PuzzleShape } from './types'

const COLORS = ['#4A90D9', '#E67E22', '#2ECC71', '#9B59B6', '#E74C3C', '#1ABC9C', '#F39C12']
const c = (x: number, y: number, z: number): Vec3 => ({ x, y, z })

/*
  Easy 1 — 3×2×2 rectangular container (12 cells), three 4-cube pieces.

  s1 (blue)   — 3-D L:           (0,0,0),(0,1,0),(0,0,1),(1,0,1)
  s2 (orange) — flat 2×2 square: (0,0,0),(1,0,0),(0,1,0),(1,1,0)
  s3 (green)  — flat L:          (0,1,0),(1,1,0),(2,0,0),(2,1,0)

  Solution:
    s1 @ (0,0,0): (0,0,0),(0,1,0),(0,0,1),(1,0,1)
    s2 @ (1,0,0): (1,0,0),(2,0,0),(1,1,0),(2,1,0)
    s3 @ (0,0,1): (0,1,1),(1,1,1),(2,0,1),(2,1,1)
*/
export function getEasyPuzzle(): Puzzle {
  const container = c(3,2,2)
  const shapes: PuzzleShape[] = [
    { id: 's1', color: COLORS[0], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0), c(0,1,0), c(0,0,1), c(1,0,1)] },
    { id: 's2', color: COLORS[1], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0), c(1,0,0), c(0,1,0), c(1,1,0)] },
    { id: 's3', color: COLORS[2], rotation: [0,0,0], placed: false,
      cubes: [c(0,1,0), c(1,1,0), c(2,0,0), c(2,1,0)] },
  ]
  const solution: PlacedShape[] = [
    { id: 's1', color: COLORS[0], cubes: [c(0,0,0), c(0,1,0), c(0,0,1), c(1,0,1)] },
    { id: 's2', color: COLORS[1], cubes: [c(1,0,0), c(2,0,0), c(1,1,0), c(2,1,0)] },
    { id: 's3', color: COLORS[2], cubes: [c(0,1,1), c(1,1,1), c(2,0,1), c(2,1,1)] },
  ]
  return { container, shapes, solution }
}

/*
  Easy 2 — 2×2×3 rectangular container (12 cells), three 4-cube pieces.

  e2a (blue)   — J in x-z:  (0,0,0),(1,0,0),(0,0,1),(0,0,2)
  e2b (orange) — 3-D skew:  (0,1,0),(1,1,0),(1,0,1),(1,1,1)
  e2c (green)  — L-shape:   (1,0,1),(0,1,0),(0,1,1),(1,1,1)
*/
export function getEasyPuzzle2(): Puzzle {
  const container = c(2,2,3)
  const shapes: PuzzleShape[] = [
    { id: 'e2a', color: COLORS[0], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0), c(1,0,0), c(0,0,1), c(0,0,2)] },
    { id: 'e2b', color: COLORS[1], rotation: [0,0,0], placed: false,
      cubes: [c(0,1,0), c(1,1,0), c(1,0,1), c(1,1,1)] },
    { id: 'e2c', color: COLORS[2], rotation: [0,0,0], placed: false,
      cubes: [c(1,0,1), c(0,1,0), c(0,1,1), c(1,1,1)] },
  ]
  const solution: PlacedShape[] = [
    { id: 'e2a', color: COLORS[0], cubes: [c(0,0,0), c(1,0,0), c(0,0,1), c(0,0,2)] },
    { id: 'e2b', color: COLORS[1], cubes: [c(0,1,0), c(1,1,0), c(1,0,1), c(1,1,1)] },
    { id: 'e2c', color: COLORS[2], cubes: [c(1,0,2), c(0,1,1), c(0,1,2), c(1,1,2)] },
  ]
  return { container, shapes, solution }
}

/*
  Easy 3 — 3×2×2 rectangular container (12 cells), four 3-cube triominoes.

  e3a (blue)   — L in x-y: (0,0,0),(1,0,0),(1,1,0)
  e3b (orange) — corner:   (0,0,0),(0,1,0),(0,1,1)
  e3c (green)  — x-bar:    (0,0,0),(1,0,0),(2,0,0)
  e3d (purple) — corner:   (0,0,0),(0,0,1),(1,0,1)
*/
export function getEasyPuzzle3(): Puzzle {
  const container = c(3,2,2)
  const shapes: PuzzleShape[] = [
    { id: 'e3a', color: COLORS[0], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0), c(1,0,0), c(1,1,0)] },
    { id: 'e3b', color: COLORS[1], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0), c(0,1,0), c(0,1,1)] },
    { id: 'e3c', color: COLORS[2], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0), c(1,0,0), c(2,0,0)] },
    { id: 'e3d', color: COLORS[3], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0), c(0,0,1), c(1,0,1)] },
  ]
  const solution: PlacedShape[] = [
    { id: 'e3a', color: COLORS[0], cubes: [c(0,0,0), c(1,0,0), c(1,1,0)] },
    { id: 'e3b', color: COLORS[1], cubes: [c(2,0,0), c(2,1,0), c(2,1,1)] },
    { id: 'e3c', color: COLORS[2], cubes: [c(0,0,1), c(1,0,1), c(2,0,1)] },
    { id: 'e3d', color: COLORS[3], cubes: [c(0,1,0), c(0,1,1), c(1,1,1)] },
  ]
  return { container, shapes, solution }
}

/*
  Easy 4 — 3×2×3 rectangular container (18 cells), five pieces (3+4+4+4+3).
*/
export function getEasyPuzzle4(): Puzzle {
  const container = c(3,2,3)
  const shapes: PuzzleShape[] = [
    { id: 'e4a', color: COLORS[0], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0), c(1,0,0), c(2,0,0)] },
    { id: 'e4b', color: COLORS[1], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0), c(1,0,0), c(0,0,1), c(1,0,1)] },
    { id: 'e4c', color: COLORS[2], rotation: [0,0,0], placed: false,
      cubes: [c(1,0,0), c(1,0,1), c(1,1,1), c(0,1,1)] },
    { id: 'e4d', color: COLORS[3], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0), c(1,0,0), c(2,0,0), c(2,0,1)] },
    { id: 'e4e', color: COLORS[4], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0), c(1,0,0), c(0,0,1)] },
  ]
  const solution: PlacedShape[] = [
    { id: 'e4a', color: COLORS[0], cubes: [c(0,0,0), c(1,0,0), c(2,0,0)] },
    { id: 'e4b', color: COLORS[1], cubes: [c(0,0,1), c(1,0,1), c(0,0,2), c(1,0,2)] },
    { id: 'e4c', color: COLORS[2], cubes: [c(2,0,1), c(2,0,2), c(2,1,2), c(1,1,2)] },
    { id: 'e4d', color: COLORS[3], cubes: [c(0,1,0), c(1,1,0), c(2,1,0), c(2,1,1)] },
    { id: 'e4e', color: COLORS[4], cubes: [c(0,1,1), c(1,1,1), c(0,1,2)] },
  ]
  return { container, shapes, solution }
}

/*
  Easy 5 — 4×2×2 rectangular container (16 cells), four 4-cube pieces.
*/
export function getEasyPuzzle5(): Puzzle {
  const container = c(4,2,2)
  const shapes: PuzzleShape[] = [
    { id: 'e5a', color: COLORS[0], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0), c(0,1,0), c(0,0,1), c(0,1,1)] },
    { id: 'e5b', color: COLORS[1], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0), c(1,0,0), c(2,0,0), c(0,0,1)] },
    { id: 'e5c', color: COLORS[2], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0), c(1,0,0), c(2,0,0), c(2,0,1)] },
    { id: 'e5d', color: COLORS[3], rotation: [0,0,0], placed: false,
      cubes: [c(1,0,0), c(2,0,0), c(0,1,0), c(1,1,0)] },
  ]
  const solution: PlacedShape[] = [
    { id: 'e5a', color: COLORS[0], cubes: [c(0,0,0), c(0,1,0), c(0,0,1), c(0,1,1)] },
    { id: 'e5b', color: COLORS[1], cubes: [c(1,0,0), c(2,0,0), c(3,0,0), c(1,0,1)] },
    { id: 'e5c', color: COLORS[2], cubes: [c(1,1,0), c(2,1,0), c(3,1,0), c(3,1,1)] },
    { id: 'e5d', color: COLORS[3], cubes: [c(2,0,1), c(3,0,1), c(1,1,1), c(2,1,1)] },
  ]
  return { container, shapes, solution }
}

/*
  Easy 6 — 4×2×2 rectangular container (16 cells), five pieces (3+3+4+3+3).
*/
export function getEasyPuzzle6(): Puzzle {
  const container = c(4,2,2)
  const shapes: PuzzleShape[] = [
    { id: 'e6a', color: COLORS[0], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0), c(0,1,0), c(0,0,1)] },
    { id: 'e6b', color: COLORS[1], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,1), c(1,0,1), c(1,0,0)] },
    { id: 'e6c', color: COLORS[2], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0), c(1,0,0), c(2,0,0), c(0,0,1)] },
    { id: 'e6d', color: COLORS[3], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0), c(1,0,0), c(1,1,0)] },
    { id: 'e6e', color: COLORS[4], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0), c(1,0,0), c(0,0,1)] },
  ]
  const solution: PlacedShape[] = [
    { id: 'e6a', color: COLORS[0], cubes: [c(0,0,0), c(0,1,0), c(0,0,1)] },
    { id: 'e6b', color: COLORS[1], cubes: [c(0,1,1), c(1,1,1), c(1,1,0)] },
    { id: 'e6c', color: COLORS[2], cubes: [c(1,0,0), c(2,0,0), c(3,0,0), c(1,0,1)] },
    { id: 'e6d', color: COLORS[3], cubes: [c(2,0,1), c(3,0,1), c(3,1,1)] },
    { id: 'e6e', color: COLORS[4], cubes: [c(2,1,0), c(3,1,0), c(2,1,1)] },
  ]
  return { container, shapes, solution }
}

/*
  Easy 7 — 3×3×2 rectangular container (18 cells), four pieces (5+4+5+4).
*/
export function getEasyPuzzle7(): Puzzle {
  const container = c(3,3,2)
  const shapes: PuzzleShape[] = [
    { id: 'e7a', color: COLORS[0], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0), c(1,0,0), c(2,0,0), c(2,1,0), c(2,2,0)] },
    { id: 'e7b', color: COLORS[1], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0), c(1,0,0), c(0,1,0), c(1,1,0)] },
    { id: 'e7c', color: COLORS[2], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0), c(1,0,0), c(2,0,0), c(2,1,0), c(2,2,0)] },
    { id: 'e7d', color: COLORS[3], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0), c(1,0,0), c(0,1,0), c(1,1,0)] },
  ]
  const solution: PlacedShape[] = [
    { id: 'e7a', color: COLORS[0], cubes: [c(0,0,0), c(1,0,0), c(2,0,0), c(2,1,0), c(2,2,0)] },
    { id: 'e7b', color: COLORS[1], cubes: [c(0,1,0), c(1,1,0), c(0,2,0), c(1,2,0)] },
    { id: 'e7c', color: COLORS[2], cubes: [c(0,0,1), c(1,0,1), c(2,0,1), c(2,1,1), c(2,2,1)] },
    { id: 'e7d', color: COLORS[3], cubes: [c(0,1,1), c(1,1,1), c(0,2,1), c(1,2,1)] },
  ]
  return { container, shapes, solution }
}

/*
  Easy 8 — 4×2×3 rectangular container (24 cells), five pieces (5+5+5+4+5).
*/
export function getEasyPuzzle8(): Puzzle {
  const container = c(4,2,3)
  const shapes: PuzzleShape[] = [
    { id: 'e8a', color: COLORS[0], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0), c(1,0,0), c(2,0,0), c(3,0,0), c(3,1,0)] },
    { id: 'e8b', color: COLORS[1], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0), c(1,0,0), c(2,0,0), c(2,0,1), c(2,0,2)] },
    { id: 'e8c', color: COLORS[2], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0), c(1,0,0), c(2,0,0), c(3,0,0), c(3,1,0)] },
    { id: 'e8d', color: COLORS[3], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0), c(1,0,0), c(0,0,1), c(1,0,1)] },
    { id: 'e8e', color: COLORS[4], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0), c(1,0,0), c(2,0,0), c(3,0,0), c(3,1,0)] },
  ]
  const solution: PlacedShape[] = [
    { id: 'e8a', color: COLORS[0], cubes: [c(0,0,0), c(1,0,0), c(2,0,0), c(3,0,0), c(3,1,0)] },
    { id: 'e8b', color: COLORS[1], cubes: [c(0,1,0), c(1,1,0), c(2,1,0), c(2,1,1), c(2,1,2)] },
    { id: 'e8c', color: COLORS[2], cubes: [c(0,0,1), c(1,0,1), c(2,0,1), c(3,0,1), c(3,1,1)] },
    { id: 'e8d', color: COLORS[3], cubes: [c(0,1,1), c(1,1,1), c(0,1,2), c(1,1,2)] },
    { id: 'e8e', color: COLORS[4], cubes: [c(0,0,2), c(1,0,2), c(2,0,2), c(3,0,2), c(3,1,2)] },
  ]
  return { container, shapes, solution }
}

/*
  Easy 9 — 2×3×3 rectangular container (18 cells), four pieces (5+4+5+4).
*/
export function getEasyPuzzle9(): Puzzle {
  const container = c(2,3,3)
  const shapes: PuzzleShape[] = [
    { id: 'e9a', color: COLORS[0], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0), c(1,0,0), c(0,0,1), c(0,1,1), c(0,0,2)] },
    { id: 'e9b', color: COLORS[1], rotation: [0,0,0], placed: false,
      cubes: [c(1,0,0), c(1,0,1), c(1,1,1), c(0,1,1)] },
    { id: 'e9c', color: COLORS[2], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0), c(1,0,0), c(0,1,0), c(1,1,0), c(1,0,1)] },
    { id: 'e9d', color: COLORS[3], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0), c(1,0,0), c(0,0,1), c(1,0,1)] },
  ]
  const solution: PlacedShape[] = [
    { id: 'e9a', color: COLORS[0], cubes: [c(0,0,0), c(1,0,0), c(0,0,1), c(0,1,1), c(0,0,2)] },
    { id: 'e9b', color: COLORS[1], cubes: [c(1,0,1), c(1,0,2), c(1,1,2), c(0,1,2)] },
    { id: 'e9c', color: COLORS[2], cubes: [c(1,1,0), c(0,1,0), c(0,2,0), c(1,2,0), c(1,1,1)] },
    { id: 'e9d', color: COLORS[3], cubes: [c(0,2,1), c(1,2,1), c(0,2,2), c(1,2,2)] },
  ]
  return { container, shapes, solution }
}

/*
  Easy 10 — 4×3×2 rectangular container (24 cells), five pieces (5+5+4+5+5).
*/
export function getEasyPuzzle10(): Puzzle {
  const container = c(4,3,2)
  const shapes: PuzzleShape[] = [
    { id: 'e10a', color: COLORS[0], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0), c(1,0,0), c(2,0,0), c(3,0,0), c(3,1,0)] },
    { id: 'e10b', color: COLORS[1], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0), c(1,0,0), c(2,0,0), c(2,1,0), c(3,1,0)] },
    { id: 'e10c', color: COLORS[3], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0), c(1,0,0), c(0,0,1), c(1,0,1)] },
    { id: 'e10d', color: COLORS[2], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0), c(1,0,0), c(2,0,0), c(3,0,0), c(3,1,0)] },
    { id: 'e10e', color: COLORS[4], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0), c(1,0,0), c(2,0,0), c(2,1,0), c(3,1,0)] },
  ]
  const solution: PlacedShape[] = [
    { id: 'e10a', color: COLORS[0], cubes: [c(0,0,0), c(1,0,0), c(2,0,0), c(3,0,0), c(3,1,0)] },
    { id: 'e10b', color: COLORS[1], cubes: [c(0,1,0), c(1,1,0), c(2,1,0), c(2,2,0), c(3,2,0)] },
    { id: 'e10c', color: COLORS[3], cubes: [c(0,2,0), c(1,2,0), c(0,2,1), c(1,2,1)] },
    { id: 'e10d', color: COLORS[2], cubes: [c(0,0,1), c(1,0,1), c(2,0,1), c(3,0,1), c(3,1,1)] },
    { id: 'e10e', color: COLORS[4], cubes: [c(0,1,1), c(1,1,1), c(2,1,1), c(2,2,1), c(3,2,1)] },
  ]
  return { container, shapes, solution }
}
