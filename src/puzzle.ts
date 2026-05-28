import type { Vec3, Puzzle, PlacedShape, PuzzleShape } from './types'

export type DifficultyKey = 'easy' | 'medium' | 'hard'

export const DIFFICULTY_META: Record<DifficultyKey, { label: string; color: string }> = {
  easy:   { label: 'Easy',   color: '#4A90D9' },
  medium: { label: 'Medium', color: '#E67E22' },
  hard:   { label: 'Hard',   color: '#E74C3C' },
}

const COLORS = ['#4A90D9', '#E67E22', '#2ECC71', '#9B59B6', '#E74C3C', '#1ABC9C', '#F39C12']

// Compact coordinate constructor — keeps cube arrays terse throughout.
const c = (x: number, y: number, z: number): Vec3 => ({ x, y, z })

function rotateX(v: Vec3): Vec3 { return { x: v.x, y: -v.z, z: v.y } }
function rotateY(v: Vec3): Vec3 { return { x: v.z, y: v.y, z: -v.x } }
function rotateZ(v: Vec3): Vec3 { return { x: -v.y, y: v.x, z: v.z } }

export function applyRotation(cubes: Vec3[], rx: number, ry: number, rz: number): Vec3[] {
  let result = cubes.map(p => ({ ...p }))
  const stepsX = ((rx / 90) % 4 + 4) % 4
  const stepsY = ((ry / 90) % 4 + 4) % 4
  const stepsZ = ((rz / 90) % 4 + 4) % 4
  for (let i = 0; i < stepsX; i++) result = result.map(rotateX)
  for (let i = 0; i < stepsY; i++) result = result.map(rotateY)
  for (let i = 0; i < stepsZ; i++) result = result.map(rotateZ)
  return result
}

export function normalizeShape(cubes: Vec3[]): Vec3[] {
  const minX = Math.min(...cubes.map(p => p.x))
  const minY = Math.min(...cubes.map(p => p.y))
  const minZ = Math.min(...cubes.map(p => p.z))
  return cubes.map(p => ({ x: p.x - minX, y: p.y - minY, z: p.z - minZ }))
}

export function addOffset(cubes: Vec3[], offset: Vec3): Vec3[] {
  return cubes.map(p => ({ x: p.x + offset.x, y: p.y + offset.y, z: p.z + offset.z }))
}

export function vec3Key(v: Vec3): string {
  return `${v.x},${v.y},${v.z}`
}

export function cubesOverlap(a: Vec3[], b: Vec3[]): boolean {
  const setA = new Set(a.map(vec3Key))
  return b.some(v => setA.has(vec3Key(v)))
}

export function cubesInBounds(cubes: Vec3[], container: Vec3, validCells?: Vec3[]): boolean {
  if (validCells) {
    const s = new Set(validCells.map(vec3Key))
    return cubes.every(p => s.has(vec3Key(p)))
  }
  return cubes.every(p =>
    p.x >= 0 && p.x < container.x &&
    p.y >= 0 && p.y < container.y &&
    p.z >= 0 && p.z < container.z
  )
}

// Returns the cube in the shape closest to the centroid.
// The cursor is always anchored to an actual cube, never to empty space
// (the centroid of asymmetric shapes like L-pieces falls outside any cube).
export function getShapeCenter(cubes: Vec3[]): Vec3 {
  const n = cubes.length
  const cx = cubes.reduce((s, p) => s + p.x, 0) / n
  const cy = cubes.reduce((s, p) => s + p.y, 0) / n
  const cz = cubes.reduce((s, p) => s + p.z, 0) / n
  let best = cubes[0]
  let bestDist = Infinity
  for (const cube of cubes) {
    const d = (cube.x - cx) ** 2 + (cube.y - cy) ** 2 + (cube.z - cz) ** 2
    if (d < bestDist) { bestDist = d; best = cube }
  }
  return best
}

export function placementOffset(shapeCubes: Vec3[], targetCell: Vec3): Vec3 {
  const center = getShapeCenter(shapeCubes)
  return {
    x: targetCell.x - center.x,
    y: targetCell.y - center.y,
    z: targetCell.z - center.z,
  }
}

// ── Easy puzzles ──────────────────────────────────────────────────────────────

/*
  Easy 1 — 3×2×2 rectangular container (12 cells), three 4-cube pieces.

  s1 (blue)   — 3-D L:          (0,0,0),(0,1,0),(0,0,1),(1,0,1)
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

  Solution:
    e3a @ (0,0,0): (0,0,0),(1,0,0),(1,1,0)
    e3b @ (2,0,0): (2,0,0),(2,1,0),(2,1,1)
    e3c @ (0,0,1): (0,0,1),(1,0,1),(2,0,1)
    e3d @ (0,1,0): (0,1,0),(0,1,1),(1,1,1)
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

  e4a (blue,  3): (0,0,0),(1,0,0),(2,0,0)              — x-bar at y=0,z=0
  e4b (orange,4): (0,0,0),(1,0,0),(0,0,1),(1,0,1)       — 2×2 in x-z at y=0
  e4c (green, 4): (1,0,0),(1,0,1),(1,1,1),(0,1,1)       — L-shape
  e4d (purple,4): (0,0,0),(1,0,0),(2,0,0),(2,0,1)        — L-bar
  e4e (red,   3): (0,0,0),(1,0,0),(0,0,1)               — corner

  Solution:
    e4a @ (0,0,0): (0,0,0),(1,0,0),(2,0,0)
    e4b @ (0,0,1): (0,0,1),(1,0,1),(0,0,2),(1,0,2)
    e4c @ (2,0,1): (2,0,1),(2,0,2),(2,1,2),(1,1,2)
    e4d @ (0,1,0): (0,1,0),(1,1,0),(2,1,0),(2,1,1)
    e4e @ (0,1,1): (0,1,1),(1,1,1),(0,1,2)
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

  e5a (blue,  4): (0,0,0),(0,1,0),(0,0,1),(0,1,1)  — 2×2 in y-z at x=0
  e5b (orange,4): (0,0,0),(1,0,0),(2,0,0),(0,0,1)  — J-bar along x
  e5c (green, 4): (0,0,0),(1,0,0),(2,0,0),(2,0,1)  — L-bar along x
  e5d (purple,4): (1,0,0),(2,0,0),(0,1,0),(1,1,0)  — skew

  Solution:
    e5a @ (0,0,0): (0,0,0),(0,1,0),(0,0,1),(0,1,1)
    e5b @ (1,0,0): (1,0,0),(2,0,0),(3,0,0),(1,0,1)
    e5c @ (1,1,0): (1,1,0),(2,1,0),(3,1,0),(3,1,1)
    e5d @ (2,0,1): (2,0,1),(3,0,1),(1,1,1),(2,1,1)  [skew: normalized (1,0,0),(2,0,0),(0,1,0),(1,1,0) → placed at offset]
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

  e6a (blue,  3): (0,0,0),(0,1,0),(0,0,1)          — y-z corner at x=0
  e6b (orange,3): (0,0,1),(1,0,1),(1,0,0)           — x-z corner
  e6c (green, 4): (0,0,0),(1,0,0),(2,0,0),(0,0,1)  — J-bar at y=0
  e6d (purple,3): (0,0,0),(1,0,0),(1,1,0)           — L-corner
  e6e (red,   3): (0,0,0),(1,0,0),(0,0,1)           — corner

  Solution:
    e6a @ (0,0,0): (0,0,0),(0,1,0),(0,0,1)
    e6b @ (0,1,1): (0,1,1),(1,1,1),(1,1,0)
    e6c @ (1,0,0): (1,0,0),(2,0,0),(3,0,0),(1,0,1)
    e6d @ (2,0,1): (2,0,1),(3,0,1),(3,1,1)
    e6e @ (2,1,0): (2,1,0),(3,1,0),(2,1,1)
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

  e7a/e7c — L along x then up in y (same shape, z=0 and z=1 layers)
  e7b/e7d — 2×2 square (same shape, z=0 and z=1 layers)

  Solution:
    e7a @ z=0: (0,0,0),(1,0,0),(2,0,0),(2,1,0),(2,2,0)
    e7b @ z=0: (0,1,0),(1,1,0),(0,2,0),(1,2,0)
    e7c @ z=1: (0,0,1),(1,0,1),(2,0,1),(2,1,1),(2,2,1)
    e7d @ z=1: (0,1,1),(1,1,1),(0,2,1),(1,2,1)
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

  Three mirrored L-bars (e8a/c/e) at y=0 for each z slice, one L into z at y=1 (e8b),
  one 2×2 slab at y=1 (e8d).

  Solution:
    e8a @ z=0,y=0: (0,0,0),(1,0,0),(2,0,0),(3,0,0),(3,1,0)
    e8b @ y=1,z=0: (0,1,0),(1,1,0),(2,1,0),(2,1,1),(2,1,2)
    e8c @ z=1,y=0: (0,0,1),(1,0,1),(2,0,1),(3,0,1),(3,1,1)
    e8d @ y=1,z=1: (0,1,1),(1,1,1),(0,1,2),(1,1,2)
    e8e @ z=2,y=0: (0,0,2),(1,0,2),(2,0,2),(3,0,2),(3,1,2)
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

  Solution:
    e9a @ (0,0,0): (0,0,0),(1,0,0),(0,0,1),(0,1,1),(0,0,2)
    e9b @ (1,0,1): (1,0,1),(1,0,2),(1,1,2),(0,1,2)
    e9c @ (0,1,0): (1,1,0),(0,1,0),(0,2,0),(1,2,0),(1,1,1)
    e9d @ (0,2,1): (0,2,1),(1,2,1),(0,2,2),(1,2,2)
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

  Solution:
    e10a @ z=0: (0,0,0),(1,0,0),(2,0,0),(3,0,0),(3,1,0)  — L-bar
    e10b @ z=0: (0,1,0),(1,1,0),(2,1,0),(2,2,0),(3,2,0)  — S-bar
    e10c @ y=2: (0,2,0),(1,2,0),(0,2,1),(1,2,1)           — 2×2
    e10d @ z=1: (0,0,1),(1,0,1),(2,0,1),(3,0,1),(3,1,1)  — L-bar
    e10e @ z=1: (0,1,1),(1,1,1),(2,1,1),(2,2,1),(3,2,1)  — S-bar
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

// ── Medium puzzles ────────────────────────────────────────────────────────────

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

  m2a (blue,   3): I-bar triomino  [c(0,0,0),c(1,0,0),c(2,0,0)]
  m2b (orange, 3): L-triomino      [c(0,0,0),c(0,0,1),c(1,0,1)]
  m2c (green,  4): 2×2 square y-z  [c(0,0,0),c(0,0,1),c(0,1,0),c(0,1,1)]
  m2d (purple, 4): J-tetromino     [c(0,0,0),c(0,1,0),c(1,1,0),c(2,1,0)]
  m2e (red,    5): 3-D pentomino   [c(0,0,1),c(0,1,1),c(1,0,0),c(1,0,1),c(2,0,0)]
  m2f (teal,   5): P-pentomino     [c(0,0,0),c(0,0,1),c(1,0,0),c(1,0,1),c(2,0,1)]

  Solution (24 cells, no overlaps):
    m2a @ (0,2,2): (0,2,2),(1,2,2),(2,2,2)
    m2b @ (0,1,1): (1,1,1),(0,1,2),(1,1,2)
    m2c @ (2,0,1): (2,0,1),(2,0,2),(2,1,1),(2,1,2)
    m2d @ (0,0,0): (0,0,0),(0,1,0),(1,1,0),(2,1,0)
    m2e @ pivot:   (1,0,0),(2,0,0),(0,0,1),(1,0,1),(0,1,1)
    m2f @ (0,0,2): (0,0,2),(1,0,2),(0,0,3),(1,0,3),(2,0,3)
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
  Valid cells:
    y=0: x=0..1, z=0..3  →  8 cells
    y=1: x=0..1, z=0..3  →  8 cells
    y=2: x=0..1, z=0..2  →  6 cells
    y=3: x=0..1, z=0..2  →  6 cells

  m3a (blue,   3): L-triomino    [c(0,0,0),c(0,0,1),c(0,1,1)]
  m3b (orange, 4): 2×2 square    [c(0,0,0),c(1,0,0),c(0,0,1),c(1,0,1)]
  m3c (green,  4): I-bar y-dir   [c(0,0,0),c(0,1,0),c(0,2,0),c(0,3,0)]
  m3d (purple, 4): L-tetromino   [c(0,0,0),c(0,1,0),c(0,2,0),c(0,2,1)]
  m3e (red,    4): T-tetromino   [c(0,0,1),c(1,0,0),c(1,0,1),c(1,0,2)]
  m3f (teal,   4): right-screw   [c(0,0,0),c(1,0,0),c(1,0,1),c(1,1,1)]
  m3g (amber,  5): 3-D pentomino [c(0,0,1),c(0,1,0),c(0,1,1),c(1,0,1),c(1,1,1)]

  Solution (28 cells, no overlaps):
    m3a @ (0,2,1): (0,2,1),(0,2,2),(0,3,2)
    m3b @ (0,0,1): (0,0,1),(1,0,1),(0,0,2),(1,0,2)
    m3c @ (0,0,0): (0,0,0),(0,1,0),(0,2,0),(0,3,0)
    m3d @ (1,0,0): (1,0,0),(1,1,0),(1,2,0),(1,2,1)
    m3e @ (0,3,0): (1,3,0),(0,3,1),(1,3,1),(1,3,2)
    m3f @ (0,1,1): (0,1,1),(1,1,1),(1,1,2),(1,2,2)
    m3g @ (0,0,3): (0,0,3),(1,0,3),(0,1,2),(0,1,3),(1,1,3)
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

// ── Hard puzzles ──────────────────────────────────────────────────────────────

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

// ── Puzzle library ────────────────────────────────────────────────────────────
// Each entry is a factory function so every call returns a fresh, mutable puzzle.

export const PUZZLE_LIBRARY: Record<DifficultyKey, Array<() => Puzzle>> = {
  easy: [
    getEasyPuzzle, getEasyPuzzle2, getEasyPuzzle3,
    getEasyPuzzle4, getEasyPuzzle5, getEasyPuzzle6,
    getEasyPuzzle7, getEasyPuzzle8, getEasyPuzzle9, getEasyPuzzle10,
  ],
  medium: [getMediumPuzzle, getMediumPuzzle2, getMediumPuzzle3],
  hard:   [getHardPuzzle, getHardPuzzle2],
}
