import type { Vec3, Puzzle, PlacedShape, PuzzleShape } from './types'

export type DifficultyKey = 'easy' | 'medium' | 'hard'

export const DIFFICULTY_META: Record<DifficultyKey, { label: string; color: string }> = {
  easy:   { label: 'Easy',   color: '#4A90D9' },
  medium: { label: 'Medium', color: '#E67E22' },
  hard:   { label: 'Hard',   color: '#E74C3C' },
}

const COLORS = ['#4A90D9', '#E67E22', '#2ECC71', '#9B59B6', '#E74C3C', '#1ABC9C']

function rotateX(v: Vec3): Vec3 { return { x: v.x, y: -v.z, z: v.y } }
function rotateY(v: Vec3): Vec3 { return { x: v.z, y: v.y, z: -v.x } }
function rotateZ(v: Vec3): Vec3 { return { x: -v.y, y: v.x, z: v.z } }

export function applyRotation(cubes: Vec3[], rx: number, ry: number, rz: number): Vec3[] {
  let result = cubes.map(c => ({ ...c }))
  const stepsX = ((rx / 90) % 4 + 4) % 4
  const stepsY = ((ry / 90) % 4 + 4) % 4
  const stepsZ = ((rz / 90) % 4 + 4) % 4
  for (let i = 0; i < stepsX; i++) result = result.map(rotateX)
  for (let i = 0; i < stepsY; i++) result = result.map(rotateY)
  for (let i = 0; i < stepsZ; i++) result = result.map(rotateZ)
  return result
}

export function normalizeShape(cubes: Vec3[]): Vec3[] {
  const minX = Math.min(...cubes.map(c => c.x))
  const minY = Math.min(...cubes.map(c => c.y))
  const minZ = Math.min(...cubes.map(c => c.z))
  return cubes.map(c => ({ x: c.x - minX, y: c.y - minY, z: c.z - minZ }))
}

export function addOffset(cubes: Vec3[], offset: Vec3): Vec3[] {
  return cubes.map(c => ({ x: c.x + offset.x, y: c.y + offset.y, z: c.z + offset.z }))
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
    return cubes.every(c => s.has(vec3Key(c)))
  }
  return cubes.every(c =>
    c.x >= 0 && c.x < container.x &&
    c.y >= 0 && c.y < container.y &&
    c.z >= 0 && c.z < container.z
  )
}

// Returns the grid cell closest to the centroid of a normalized shape.
// Used to anchor the ghost and placement at the cursor rather than the corner.
export function getShapeCenter(cubes: Vec3[]): Vec3 {
  const n = cubes.length
  return {
    x: Math.round(cubes.reduce((s, c) => s + c.x, 0) / n),
    y: Math.round(cubes.reduce((s, c) => s + c.y, 0) / n),
    z: Math.round(cubes.reduce((s, c) => s + c.z, 0) / n),
  }
}

export function placementOffset(shapeCubes: Vec3[], targetCell: Vec3): Vec3 {
  const center = getShapeCenter(shapeCubes)
  return {
    x: targetCell.x - center.x,
    y: targetCell.y - center.y,
    z: targetCell.z - center.z,
  }
}

/*
  Easy puzzle — 3×2×2 container (12 cells), three 4-cube pieces (total 12).

  Piece 1 (blue)   — 3-D L-shape:   (0,0,0),(0,1,0),(0,0,1),(1,0,1)
  Piece 2 (orange) — flat 2×2 square: (0,0,0),(1,0,0),(0,1,0),(1,1,0)
  Piece 3 (green)  — 3-D L-shape:   (0,0,0),(1,0,0),(2,0,0),(2,1,0)

  One valid solution (verified cell-by-cell, no gaps, no overlaps):
    P1 @ (0,0,0) → (0,0,0),(0,1,0),(0,0,1),(1,0,1)
    P2 @ (1,0,0) → (1,0,0),(2,0,0),(1,1,0),(2,1,0)
    P3 @ (0,0,1) → (0,0,1),(1,0,1)... wait, recalc below.

  Correct solution offsets:
    P1 @ offset (0,0,0): (0,0,0),(0,1,0),(0,0,1),(1,0,1)
    P2 @ offset (1,0,0): (1,0,0),(2,0,0),(1,1,0),(2,1,0)
    P3 normalized: (2,0,0),(0,1,0),(1,1,0),(2,1,0) → wait, need to re-derive.

  Let me enumerate all 12 cells and assign pieces:
    x=0: (0,0,0)P1 (0,1,0)P1 (0,0,1)P1 (0,1,1)P3
    x=1: (1,0,0)P2 (1,1,0)P2 (1,0,1)P1 (1,1,1)P3
    x=2: (2,0,0)P2 (2,1,0)P2 (2,0,1)P3 (2,1,1)P3

  P3 absolute: (0,1,1),(1,1,1),(2,0,1),(2,1,1) — normalized (shift z-1):
    → (0,1,0),(1,1,0),(2,0,0),(2,1,0)  [min z already 0 after shift... recalc]
  P3 raw: (0,1,1),(1,1,1),(2,0,1),(2,1,1)
  Normalize: min x=0, min y=0, min z=1 → subtract (0,0,1):
    → (0,1,0),(1,1,0),(2,0,0),(2,1,0)   ✓ connected, min coords (0,0,0) ✓
  P3 placed at offset (0,0,1): add (0,0,1) → (0,1,1),(1,1,1),(2,0,1),(2,1,1) ✓
*/
export function getEasyPuzzle(): Puzzle {
  const container: Vec3 = { x: 3, y: 2, z: 2 }

  const shapes: PuzzleShape[] = [
    {
      id: 's1',
      color: COLORS[0],
      rotation: [0, 0, 0],
      placed: false,
      // 3-D L-tetromino
      cubes: [
        { x: 0, y: 0, z: 0 },
        { x: 0, y: 1, z: 0 },
        { x: 0, y: 0, z: 1 },
        { x: 1, y: 0, z: 1 },
      ],
    },
    {
      id: 's2',
      color: COLORS[1],
      rotation: [0, 0, 0],
      placed: false,
      // flat 2×2 square
      cubes: [
        { x: 0, y: 0, z: 0 },
        { x: 1, y: 0, z: 0 },
        { x: 0, y: 1, z: 0 },
        { x: 1, y: 1, z: 0 },
      ],
    },
    {
      id: 's3',
      color: COLORS[2],
      rotation: [0, 0, 0],
      placed: false,
      // flat L-tetromino
      cubes: [
        { x: 0, y: 1, z: 0 },
        { x: 1, y: 1, z: 0 },
        { x: 2, y: 0, z: 0 },
        { x: 2, y: 1, z: 0 },
      ],
    },
  ]

  const solution: PlacedShape[] = [
    {
      id: 's1',
      color: COLORS[0],
      cubes: [
        { x: 0, y: 0, z: 0 },
        { x: 0, y: 1, z: 0 },
        { x: 0, y: 0, z: 1 },
        { x: 1, y: 0, z: 1 },
      ],
    },
    {
      id: 's2',
      color: COLORS[1],
      cubes: [
        { x: 1, y: 0, z: 0 },
        { x: 2, y: 0, z: 0 },
        { x: 1, y: 1, z: 0 },
        { x: 2, y: 1, z: 0 },
      ],
    },
    {
      id: 's3',
      color: COLORS[2],
      cubes: [
        { x: 0, y: 1, z: 1 },
        { x: 1, y: 1, z: 1 },
        { x: 2, y: 0, z: 1 },
        { x: 2, y: 1, z: 1 },
      ],
    },
  ]

  return { container, shapes, solution }
}

/*
  Medium puzzle — irregular "slab + wall" container (12 cells).

  Top view (z→, y↑):
    y=0 layer: full 3×3 grid  (x=0..2, z=0..2)   →  9 cells
    y=1 layer: front strip    (x=0..2, z=0)        →  3 cells
  Total: 12 cells = 3 four-cube pieces.

  Pieces (canonical orientations — verified no overlap, all cells covered):

    s1 (blue)   — 2×2 square in x-y at z=0:  (0,0,0),(1,0,0),(0,1,0),(1,1,0)
    s2 (orange) — L in y-z column at x=2:    (0,0,0),(0,1,0),(0,0,1),(0,0,2)
    s3 (green)  — 2×2 square in x-z at y=0:  (0,0,0),(1,0,0),(0,0,1),(1,0,1)

  Solution:
    s1 @ (0,0,0) → (0,0,0),(1,0,0),(0,1,0),(1,1,0)
    s2 @ (2,0,0) → (2,0,0),(2,1,0),(2,0,1),(2,0,2)
    s3 @ (0,0,1) → (0,0,1),(1,0,1),(0,0,2),(1,0,2)

  Cell assignment verified:
    y=0: (0,0,0)s1 (1,0,0)s1 (2,0,0)s2 | (0,0,1)s3 (1,0,1)s3 (2,0,1)s2 | (0,0,2)s3 (1,0,2)s3 (2,0,2)s2
    y=1: (0,1,0)s1 (1,1,0)s1 (2,1,0)s2
*/
export function getMediumPuzzle(): Puzzle {
  // Bounding box: x=3, y=2, z=3
  const container: Vec3 = { x: 3, y: 2, z: 3 }

  const validCells: Vec3[] = [
    // y=0 — full 3×3
    { x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }, { x: 2, y: 0, z: 0 },
    { x: 0, y: 0, z: 1 }, { x: 1, y: 0, z: 1 }, { x: 2, y: 0, z: 1 },
    { x: 0, y: 0, z: 2 }, { x: 1, y: 0, z: 2 }, { x: 2, y: 0, z: 2 },
    // y=1 — front strip
    { x: 0, y: 1, z: 0 }, { x: 1, y: 1, z: 0 }, { x: 2, y: 1, z: 0 },
  ]

  const shapes: PuzzleShape[] = [
    {
      id: 's1',
      color: COLORS[0],
      rotation: [0, 0, 0],
      placed: false,
      // 2×2 square in x-y plane
      cubes: [
        { x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 },
        { x: 0, y: 1, z: 0 }, { x: 1, y: 1, z: 0 },
      ],
    },
    {
      id: 's2',
      color: COLORS[1],
      rotation: [0, 0, 0],
      placed: false,
      // L in y-z: 3-tall column + 1-deep step at y=1
      cubes: [
        { x: 0, y: 0, z: 0 },
        { x: 0, y: 1, z: 0 },
        { x: 0, y: 0, z: 1 },
        { x: 0, y: 0, z: 2 },
      ],
    },
    {
      id: 's3',
      color: COLORS[2],
      rotation: [0, 0, 0],
      placed: false,
      // 2×2 square in x-z plane
      cubes: [
        { x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 },
        { x: 0, y: 0, z: 1 }, { x: 1, y: 0, z: 1 },
      ],
    },
  ]

  const solution: PlacedShape[] = [
    {
      id: 's1', color: COLORS[0],
      cubes: [
        { x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 },
        { x: 0, y: 1, z: 0 }, { x: 1, y: 1, z: 0 },
      ],
    },
    {
      id: 's2', color: COLORS[1],
      cubes: [
        { x: 2, y: 0, z: 0 }, { x: 2, y: 1, z: 0 },
        { x: 2, y: 0, z: 1 }, { x: 2, y: 0, z: 2 },
      ],
    },
    {
      id: 's3', color: COLORS[2],
      cubes: [
        { x: 0, y: 0, z: 1 }, { x: 1, y: 0, z: 1 },
        { x: 0, y: 0, z: 2 }, { x: 1, y: 0, z: 2 },
      ],
    },
  ]

  return { container, validCells, shapes, solution }
}

/*
  Hard puzzle — irregular "staircase" container (16 cells).

  The container is a 3×2 footprint that narrows at the top:
    y=0: x=0..2, z=0..1  →  6 cells
    y=1: x=0..2, z=0..1  →  6 cells
    y=2: x=0..1, z=0..1  →  4 cells   (top step — narrower)
  Total: 16 cells = 4 four-cube pieces.

  Pieces (normalized):
    sA (blue)   — L in x-y:           (0,0,0),(1,0,0),(2,0,0),(2,1,0)
    sB (orange) — 3-D corner piece:   (0,0,0),(0,1,0),(0,1,1),(1,1,0)
    sC (purple) — 3-D T-piece:        (0,0,0),(0,0,1),(0,1,1),(1,0,1)
    sD (green)  — J in x-y:           (0,0,0),(1,0,0),(2,0,0),(0,1,0)

  Solution placement offsets:
    sA @ (0,0,0) → (0,0,0),(1,0,0),(2,0,0),(2,1,0)
    sB @ (0,1,0) → (0,1,0),(0,2,0),(0,2,1),(1,2,0)
    sC @ (1,1,0) → (1,1,0),(1,1,1),(1,2,1),(2,1,1)
    sD @ (0,0,1) → (0,0,1),(1,0,1),(2,0,1),(0,1,1)

  Cell assignment verified:
    y=0: (0,0,0)sA (1,0,0)sA (2,0,0)sA | (0,0,1)sD (1,0,1)sD (2,0,1)sD
    y=1: (0,1,0)sB (1,1,0)sC (2,1,0)sA | (0,1,1)sD (1,1,1)sC (2,1,1)sC
    y=2: (0,2,0)sB (1,2,0)sB (0,2,1)sB | (1,2,1)sC
*/
export function getHardPuzzle(): Puzzle {
  // Bounding box: x=3, y=3, z=2
  const container: Vec3 = { x: 3, y: 3, z: 2 }

  const validCells: Vec3[] = [
    // y=0
    { x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }, { x: 2, y: 0, z: 0 },
    { x: 0, y: 0, z: 1 }, { x: 1, y: 0, z: 1 }, { x: 2, y: 0, z: 1 },
    // y=1
    { x: 0, y: 1, z: 0 }, { x: 1, y: 1, z: 0 }, { x: 2, y: 1, z: 0 },
    { x: 0, y: 1, z: 1 }, { x: 1, y: 1, z: 1 }, { x: 2, y: 1, z: 1 },
    // y=2 (top step — narrower)
    { x: 0, y: 2, z: 0 }, { x: 1, y: 2, z: 0 },
    { x: 0, y: 2, z: 1 }, { x: 1, y: 2, z: 1 },
  ]

  const shapes: PuzzleShape[] = [
    {
      id: 'sA',
      color: COLORS[0],
      rotation: [0, 0, 0],
      placed: false,
      // L in x-y: 3 along x, then 1 up at x=2
      cubes: [
        { x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }, { x: 2, y: 0, z: 0 },
        { x: 2, y: 1, z: 0 },
      ],
    },
    {
      id: 'sB',
      color: COLORS[1],
      rotation: [0, 0, 0],
      placed: false,
      // 3-D corner: 2 up in y, then z-step and x-step at top
      cubes: [
        { x: 0, y: 0, z: 0 },
        { x: 0, y: 1, z: 0 },
        { x: 0, y: 1, z: 1 },
        { x: 1, y: 1, z: 0 },
      ],
    },
    {
      id: 'sC',
      color: COLORS[3],
      rotation: [0, 0, 0],
      placed: false,
      // 3-D T: centre at (0,0,1) with arms in z, y, and x
      cubes: [
        { x: 0, y: 0, z: 0 },
        { x: 0, y: 0, z: 1 },
        { x: 0, y: 1, z: 1 },
        { x: 1, y: 0, z: 1 },
      ],
    },
    {
      id: 'sD',
      color: COLORS[2],
      rotation: [0, 0, 0],
      placed: false,
      // J in x-y: 3 along x, then 1 up at x=0
      cubes: [
        { x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }, { x: 2, y: 0, z: 0 },
        { x: 0, y: 1, z: 0 },
      ],
    },
  ]

  const solution: PlacedShape[] = [
    {
      id: 'sA', color: COLORS[0],
      cubes: [
        { x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }, { x: 2, y: 0, z: 0 },
        { x: 2, y: 1, z: 0 },
      ],
    },
    {
      id: 'sB', color: COLORS[1],
      cubes: [
        { x: 0, y: 1, z: 0 }, { x: 0, y: 2, z: 0 },
        { x: 0, y: 2, z: 1 }, { x: 1, y: 2, z: 0 },
      ],
    },
    {
      id: 'sC', color: COLORS[3],
      cubes: [
        { x: 1, y: 1, z: 0 }, { x: 1, y: 1, z: 1 },
        { x: 1, y: 2, z: 1 }, { x: 2, y: 1, z: 1 },
      ],
    },
    {
      id: 'sD', color: COLORS[2],
      cubes: [
        { x: 0, y: 0, z: 1 }, { x: 1, y: 0, z: 1 }, { x: 2, y: 0, z: 1 },
        { x: 0, y: 1, z: 1 },
      ],
    },
  ]

  return { container, validCells, shapes, solution }
}

// ── Additional puzzles ────────────────────────────────────────────────────────

/*
  Easy 2 — 2×2×3 box (12 cells), three 4-cube pieces.

  Piece layout (x∈{0,1}, y∈{0,1}, z∈{0,1,2}):
    P1: (0,0,0),(1,0,0),(0,0,1),(0,0,2)  — J in xz
    P2: (0,1,0),(1,1,0),(1,0,1),(1,1,1)  — skew 3-D piece
    P3 solved at (0,0,1): (1,0,2),(0,1,1),(0,1,2),(1,1,2)
*/
export function getEasyPuzzle2(): Puzzle {
  const container: Vec3 = { x: 2, y: 2, z: 3 }

  const shapes: PuzzleShape[] = [
    {
      id: 'e2a', color: COLORS[0], rotation: [0,0,0], placed: false,
      cubes: [
        { x:0,y:0,z:0 }, { x:1,y:0,z:0 },
        { x:0,y:0,z:1 }, { x:0,y:0,z:2 },
      ],
    },
    {
      id: 'e2b', color: COLORS[1], rotation: [0,0,0], placed: false,
      cubes: [
        { x:0,y:1,z:0 }, { x:1,y:1,z:0 },
        { x:1,y:0,z:1 }, { x:1,y:1,z:1 },
      ],
    },
    {
      id: 'e2c', color: COLORS[2], rotation: [0,0,0], placed: false,
      // normalized from (1,0,2),(0,1,1),(0,1,2),(1,1,2) — subtract (0,0,1)
      cubes: [
        { x:1,y:0,z:1 }, { x:0,y:1,z:0 },
        { x:0,y:1,z:1 }, { x:1,y:1,z:1 },
      ],
    },
  ]

  const solution: PlacedShape[] = [
    {
      id: 'e2a', color: COLORS[0],
      cubes: [
        { x:0,y:0,z:0 }, { x:1,y:0,z:0 },
        { x:0,y:0,z:1 }, { x:0,y:0,z:2 },
      ],
    },
    {
      id: 'e2b', color: COLORS[1],
      cubes: [
        { x:0,y:1,z:0 }, { x:1,y:1,z:0 },
        { x:1,y:0,z:1 }, { x:1,y:1,z:1 },
      ],
    },
    {
      id: 'e2c', color: COLORS[2],
      cubes: [
        { x:1,y:0,z:2 }, { x:0,y:1,z:1 },
        { x:0,y:1,z:2 }, { x:1,y:1,z:2 },
      ],
    },
  ]

  return { container, shapes, solution }
}

/*
  Easy 3 — 3×2×2 box (12 cells), four 3-cube triominoes.

  Cell assignment:
    P1 (blue):   (0,0,0),(1,0,0),(1,1,0)   — L in xy
    P2 (orange): (2,0,0),(2,1,0),(2,1,1)   — corner
    P3 (green):  (0,0,1),(1,0,1),(2,0,1)   — line in x
    P4 (purple): (0,1,0),(0,1,1),(1,1,1)   — corner
*/
export function getEasyPuzzle3(): Puzzle {
  const container: Vec3 = { x: 3, y: 2, z: 2 }

  const shapes: PuzzleShape[] = [
    {
      id: 'e3a', color: COLORS[0], rotation: [0,0,0], placed: false,
      cubes: [{ x:0,y:0,z:0 }, { x:1,y:0,z:0 }, { x:1,y:1,z:0 }],
    },
    {
      id: 'e3b', color: COLORS[1], rotation: [0,0,0], placed: false,
      // normalized from (2,0,0),(2,1,0),(2,1,1) — subtract (2,0,0) → (0,0,0),(0,1,0),(0,1,1)
      cubes: [{ x:0,y:0,z:0 }, { x:0,y:1,z:0 }, { x:0,y:1,z:1 }],
    },
    {
      id: 'e3c', color: COLORS[2], rotation: [0,0,0], placed: false,
      cubes: [{ x:0,y:0,z:0 }, { x:1,y:0,z:0 }, { x:2,y:0,z:0 }],
    },
    {
      id: 'e3d', color: COLORS[3], rotation: [0,0,0], placed: false,
      // normalized from (0,1,0),(0,1,1),(1,1,1) — subtract (0,1,0) → (0,0,0),(0,0,1),(1,0,1)
      cubes: [{ x:0,y:0,z:0 }, { x:0,y:0,z:1 }, { x:1,y:0,z:1 }],
    },
  ]

  const solution: PlacedShape[] = [
    {
      id: 'e3a', color: COLORS[0],
      cubes: [{ x:0,y:0,z:0 }, { x:1,y:0,z:0 }, { x:1,y:1,z:0 }],
    },
    {
      id: 'e3b', color: COLORS[1],
      cubes: [{ x:2,y:0,z:0 }, { x:2,y:1,z:0 }, { x:2,y:1,z:1 }],
    },
    {
      id: 'e3c', color: COLORS[2],
      cubes: [{ x:0,y:0,z:1 }, { x:1,y:0,z:1 }, { x:2,y:0,z:1 }],
    },
    {
      id: 'e3d', color: COLORS[3],
      cubes: [{ x:0,y:1,z:0 }, { x:0,y:1,z:1 }, { x:1,y:1,z:1 }],
    },
  ]

  return { container, shapes, solution }
}

/*
  Medium 2 — L-shaped container (12 cells), three 4-cube pieces.

  Container: x-row of 4 (z=0) + z-column of 3 at x=0 (z=0,1,2), repeated for y=0 and y=1.
    y=0: (0,0,0),(1,0,0),(2,0,0),(3,0,0),(0,0,1),(0,0,2)
    y=1: (0,1,0),(1,1,0),(2,1,0),(3,1,0),(0,1,1),(0,1,2)

  Piece assignment:
    P1: (0,0,0),(0,0,1),(0,0,2),(0,1,2)   — J-column at x=0
    P2: (0,1,0),(0,1,1),(1,0,0),(1,1,0)   — 3D corner
    P3: (2,0,0),(3,0,0),(2,1,0),(3,1,0)   — 2×2 slab at z=0
*/
export function getMediumPuzzle2(): Puzzle {
  const container: Vec3 = { x: 4, y: 2, z: 3 }

  const validCells: Vec3[] = [
    { x:0,y:0,z:0 }, { x:1,y:0,z:0 }, { x:2,y:0,z:0 }, { x:3,y:0,z:0 },
    { x:0,y:0,z:1 }, { x:0,y:0,z:2 },
    { x:0,y:1,z:0 }, { x:1,y:1,z:0 }, { x:2,y:1,z:0 }, { x:3,y:1,z:0 },
    { x:0,y:1,z:1 }, { x:0,y:1,z:2 },
  ]

  const shapes: PuzzleShape[] = [
    {
      id: 'm2a', color: COLORS[0], rotation: [0,0,0], placed: false,
      cubes: [
        { x:0,y:0,z:0 }, { x:0,y:0,z:1 },
        { x:0,y:0,z:2 }, { x:0,y:1,z:2 },
      ],
    },
    {
      id: 'm2b', color: COLORS[1], rotation: [0,0,0], placed: false,
      cubes: [
        { x:0,y:1,z:0 }, { x:0,y:1,z:1 },
        { x:1,y:0,z:0 }, { x:1,y:1,z:0 },
      ],
    },
    {
      id: 'm2c', color: COLORS[2], rotation: [0,0,0], placed: false,
      // normalized from (2,0,0),(3,0,0),(2,1,0),(3,1,0)
      cubes: [
        { x:0,y:0,z:0 }, { x:1,y:0,z:0 },
        { x:0,y:1,z:0 }, { x:1,y:1,z:0 },
      ],
    },
  ]

  const solution: PlacedShape[] = [
    {
      id: 'm2a', color: COLORS[0],
      cubes: [
        { x:0,y:0,z:0 }, { x:0,y:0,z:1 },
        { x:0,y:0,z:2 }, { x:0,y:1,z:2 },
      ],
    },
    {
      id: 'm2b', color: COLORS[1],
      cubes: [
        { x:0,y:1,z:0 }, { x:0,y:1,z:1 },
        { x:1,y:0,z:0 }, { x:1,y:1,z:0 },
      ],
    },
    {
      id: 'm2c', color: COLORS[2],
      cubes: [
        { x:2,y:0,z:0 }, { x:3,y:0,z:0 },
        { x:2,y:1,z:0 }, { x:3,y:1,z:0 },
      ],
    },
  ]

  return { container, validCells, shapes, solution }
}

/*
  Medium 3 — T-shaped container (12 cells), three 4-cube pieces.

  Container: x-bar of 4 at z=0, stem of 2×2 at z=1, repeated for y=0 and y=1.
    y=0: (0,0,0),(1,0,0),(2,0,0),(3,0,0),(1,0,1),(2,0,1)
    y=1: (0,1,0),(1,1,0),(2,1,0),(3,1,0),(1,1,1),(2,1,1)

  Piece assignment:
    P1: (0,0,0),(1,0,0),(2,0,0),(3,0,0)   — line at y=0,z=0
    P2: (0,1,0),(1,1,0),(2,1,0),(3,1,0)   — line at y=1,z=0
    P3: (1,0,1),(2,0,1),(1,1,1),(2,1,1)   — 2×2 slab in the stem
*/
export function getMediumPuzzle3(): Puzzle {
  const container: Vec3 = { x: 4, y: 2, z: 2 }

  const validCells: Vec3[] = [
    { x:0,y:0,z:0 }, { x:1,y:0,z:0 }, { x:2,y:0,z:0 }, { x:3,y:0,z:0 },
    { x:1,y:0,z:1 }, { x:2,y:0,z:1 },
    { x:0,y:1,z:0 }, { x:1,y:1,z:0 }, { x:2,y:1,z:0 }, { x:3,y:1,z:0 },
    { x:1,y:1,z:1 }, { x:2,y:1,z:1 },
  ]

  const shapes: PuzzleShape[] = [
    {
      id: 'm3a', color: COLORS[0], rotation: [0,0,0], placed: false,
      cubes: [
        { x:0,y:0,z:0 }, { x:1,y:0,z:0 },
        { x:2,y:0,z:0 }, { x:3,y:0,z:0 },
      ],
    },
    {
      id: 'm3b', color: COLORS[1], rotation: [0,0,0], placed: false,
      // normalized from (0,1,0),(1,1,0),(2,1,0),(3,1,0) — subtract (0,1,0)
      cubes: [
        { x:0,y:0,z:0 }, { x:1,y:0,z:0 },
        { x:2,y:0,z:0 }, { x:3,y:0,z:0 },
      ],
    },
    {
      id: 'm3c', color: COLORS[2], rotation: [0,0,0], placed: false,
      // normalized from (1,0,1),(2,0,1),(1,1,1),(2,1,1) — subtract (1,0,1)
      cubes: [
        { x:0,y:0,z:0 }, { x:1,y:0,z:0 },
        { x:0,y:1,z:0 }, { x:1,y:1,z:0 },
      ],
    },
  ]

  const solution: PlacedShape[] = [
    {
      id: 'm3a', color: COLORS[0],
      cubes: [
        { x:0,y:0,z:0 }, { x:1,y:0,z:0 },
        { x:2,y:0,z:0 }, { x:3,y:0,z:0 },
      ],
    },
    {
      id: 'm3b', color: COLORS[1],
      cubes: [
        { x:0,y:1,z:0 }, { x:1,y:1,z:0 },
        { x:2,y:1,z:0 }, { x:3,y:1,z:0 },
      ],
    },
    {
      id: 'm3c', color: COLORS[2],
      cubes: [
        { x:1,y:0,z:1 }, { x:2,y:0,z:1 },
        { x:1,y:1,z:1 }, { x:2,y:1,z:1 },
      ],
    },
  ]

  return { container, validCells, shapes, solution }
}

/*
  Hard 2 — 4×2×2 rectangular box (16 cells), four 4-cube pieces.

  Cell assignment:
    P1: (0,0,0),(1,0,0),(2,0,0),(3,0,0)   — I-bar along x, y=0,z=0
    P2: (0,1,0),(1,1,0),(0,0,1),(0,1,1)   — 3D corner at x=0,1
    P3: (2,1,0),(3,1,0),(3,0,1),(3,1,1)   — 3D corner at x=2,3
    P4: (1,0,1),(2,0,1),(1,1,1),(2,1,1)   — 2×2 slab in the middle
*/
export function getHardPuzzle2(): Puzzle {
  const container: Vec3 = { x: 4, y: 2, z: 2 }

  const shapes: PuzzleShape[] = [
    {
      id: 'h2a', color: COLORS[0], rotation: [0,0,0], placed: false,
      cubes: [
        { x:0,y:0,z:0 }, { x:1,y:0,z:0 },
        { x:2,y:0,z:0 }, { x:3,y:0,z:0 },
      ],
    },
    {
      id: 'h2b', color: COLORS[1], rotation: [0,0,0], placed: false,
      cubes: [
        { x:0,y:1,z:0 }, { x:1,y:1,z:0 },
        { x:0,y:0,z:1 }, { x:0,y:1,z:1 },
      ],
    },
    {
      id: 'h2c', color: COLORS[2], rotation: [0,0,0], placed: false,
      // normalized from (2,1,0),(3,1,0),(3,0,1),(3,1,1) — subtract (2,0,0) → (0,1,0),(1,1,0),(1,0,1),(1,1,1)
      cubes: [
        { x:0,y:1,z:0 }, { x:1,y:1,z:0 },
        { x:1,y:0,z:1 }, { x:1,y:1,z:1 },
      ],
    },
    {
      id: 'h2d', color: COLORS[3], rotation: [0,0,0], placed: false,
      // normalized from (1,0,1),(2,0,1),(1,1,1),(2,1,1) — subtract (1,0,1)
      cubes: [
        { x:0,y:0,z:0 }, { x:1,y:0,z:0 },
        { x:0,y:1,z:0 }, { x:1,y:1,z:0 },
      ],
    },
  ]

  const solution: PlacedShape[] = [
    {
      id: 'h2a', color: COLORS[0],
      cubes: [
        { x:0,y:0,z:0 }, { x:1,y:0,z:0 },
        { x:2,y:0,z:0 }, { x:3,y:0,z:0 },
      ],
    },
    {
      id: 'h2b', color: COLORS[1],
      cubes: [
        { x:0,y:1,z:0 }, { x:1,y:1,z:0 },
        { x:0,y:0,z:1 }, { x:0,y:1,z:1 },
      ],
    },
    {
      id: 'h2c', color: COLORS[2],
      cubes: [
        { x:2,y:1,z:0 }, { x:3,y:1,z:0 },
        { x:3,y:0,z:1 }, { x:3,y:1,z:1 },
      ],
    },
    {
      id: 'h2d', color: COLORS[3],
      cubes: [
        { x:1,y:0,z:1 }, { x:2,y:0,z:1 },
        { x:1,y:1,z:1 }, { x:2,y:1,z:1 },
      ],
    },
  ]

  return { container, shapes, solution }
}

/*
  Easy 4 — 3×2×3 box (18 cells), five pieces (3+4+4+4+3).

  Cell assignment:
    P1 (blue,  3): (0,0,0)(1,0,0)(2,0,0)             — bar along x at y=0,z=0
    P2 (orange,4): (0,0,1)(1,0,1)(0,0,2)(1,0,2)       — 2×2 square in xz at y=0
    P3 (green, 4): (2,0,1)(2,0,2)(2,1,2)(1,1,2)       — L-shape
    P4 (purple,4): (0,1,0)(1,1,0)(2,1,0)(2,1,1)       — L-bar at y=1
    P5 (red,   3): (0,1,1)(1,1,1)(0,1,2)              — corner at y=1
*/
export function getEasyPuzzle4(): Puzzle {
  const container: Vec3 = { x: 3, y: 2, z: 3 }
  const shapes: PuzzleShape[] = [
    { id: 'e4a', color: COLORS[0], rotation: [0,0,0], placed: false,
      cubes: [{x:0,y:0,z:0},{x:1,y:0,z:0},{x:2,y:0,z:0}] },
    { id: 'e4b', color: COLORS[1], rotation: [0,0,0], placed: false,
      cubes: [{x:0,y:0,z:0},{x:1,y:0,z:0},{x:0,y:0,z:1},{x:1,y:0,z:1}] },
    { id: 'e4c', color: COLORS[2], rotation: [0,0,0], placed: false,
      cubes: [{x:1,y:0,z:0},{x:1,y:0,z:1},{x:1,y:1,z:1},{x:0,y:1,z:1}] },
    { id: 'e4d', color: COLORS[3], rotation: [0,0,0], placed: false,
      cubes: [{x:0,y:0,z:0},{x:1,y:0,z:0},{x:2,y:0,z:0},{x:2,y:0,z:1}] },
    { id: 'e4e', color: COLORS[4], rotation: [0,0,0], placed: false,
      cubes: [{x:0,y:0,z:0},{x:1,y:0,z:0},{x:0,y:0,z:1}] },
  ]
  const solution: PlacedShape[] = [
    { id: 'e4a', color: COLORS[0],
      cubes: [{x:0,y:0,z:0},{x:1,y:0,z:0},{x:2,y:0,z:0}] },
    { id: 'e4b', color: COLORS[1],
      cubes: [{x:0,y:0,z:1},{x:1,y:0,z:1},{x:0,y:0,z:2},{x:1,y:0,z:2}] },
    { id: 'e4c', color: COLORS[2],
      cubes: [{x:2,y:0,z:1},{x:2,y:0,z:2},{x:2,y:1,z:2},{x:1,y:1,z:2}] },
    { id: 'e4d', color: COLORS[3],
      cubes: [{x:0,y:1,z:0},{x:1,y:1,z:0},{x:2,y:1,z:0},{x:2,y:1,z:1}] },
    { id: 'e4e', color: COLORS[4],
      cubes: [{x:0,y:1,z:1},{x:1,y:1,z:1},{x:0,y:1,z:2}] },
  ]
  return { container, shapes, solution }
}

/*
  Easy 5 — 4×2×2 box (16 cells), four pieces of 4 cubes each.

  Cell assignment:
    P1 (blue,  4): (0,0,0)(0,1,0)(0,0,1)(0,1,1) — 2×2 square in yz at x=0
    P2 (orange,4): (1,0,0)(2,0,0)(3,0,0)(1,0,1) — L-bar along x at y=0
    P3 (green, 4): (1,1,0)(2,1,0)(3,1,0)(3,1,1) — L-bar along x at y=1
    P4 (purple,4): (2,0,1)(3,0,1)(1,1,1)(2,1,1) — skew
*/
export function getEasyPuzzle5(): Puzzle {
  const container: Vec3 = { x: 4, y: 2, z: 2 }
  const shapes: PuzzleShape[] = [
    { id: 'e5a', color: COLORS[0], rotation: [0,0,0], placed: false,
      cubes: [{x:0,y:0,z:0},{x:0,y:1,z:0},{x:0,y:0,z:1},{x:0,y:1,z:1}] },
    { id: 'e5b', color: COLORS[1], rotation: [0,0,0], placed: false,
      cubes: [{x:0,y:0,z:0},{x:1,y:0,z:0},{x:2,y:0,z:0},{x:0,y:0,z:1}] },
    { id: 'e5c', color: COLORS[2], rotation: [0,0,0], placed: false,
      cubes: [{x:0,y:0,z:0},{x:1,y:0,z:0},{x:2,y:0,z:0},{x:2,y:0,z:1}] },
    { id: 'e5d', color: COLORS[3], rotation: [0,0,0], placed: false,
      cubes: [{x:1,y:0,z:0},{x:2,y:0,z:0},{x:0,y:1,z:0},{x:1,y:1,z:0}] },
  ]
  const solution: PlacedShape[] = [
    { id: 'e5a', color: COLORS[0],
      cubes: [{x:0,y:0,z:0},{x:0,y:1,z:0},{x:0,y:0,z:1},{x:0,y:1,z:1}] },
    { id: 'e5b', color: COLORS[1],
      cubes: [{x:1,y:0,z:0},{x:2,y:0,z:0},{x:3,y:0,z:0},{x:1,y:0,z:1}] },
    { id: 'e5c', color: COLORS[2],
      cubes: [{x:1,y:1,z:0},{x:2,y:1,z:0},{x:3,y:1,z:0},{x:3,y:1,z:1}] },
    { id: 'e5d', color: COLORS[3],
      cubes: [{x:2,y:0,z:1},{x:3,y:0,z:1},{x:1,y:1,z:1},{x:2,y:1,z:1}] },
  ]
  return { container, shapes, solution }
}

/*
  Easy 6 — 4×2×2 box (16 cells), five pieces (3+3+4+3+3).

  Cell assignment:
    P1 (blue,  3): (0,0,0)(0,1,0)(0,0,1)          — yz-corner at x=0
    P2 (orange,3): (0,1,1)(1,1,1)(1,1,0)           — xz-corner at y=1
    P3 (green, 4): (1,0,0)(2,0,0)(3,0,0)(1,0,1)   — L-bar at y=0
    P4 (purple,3): (2,0,1)(3,0,1)(3,1,1)           — corner at z=1
    P5 (red,   3): (2,1,0)(3,1,0)(2,1,1)           — xz-corner at y=1
*/
export function getEasyPuzzle6(): Puzzle {
  const container: Vec3 = { x: 4, y: 2, z: 2 }
  const shapes: PuzzleShape[] = [
    { id: 'e6a', color: COLORS[0], rotation: [0,0,0], placed: false,
      cubes: [{x:0,y:0,z:0},{x:0,y:1,z:0},{x:0,y:0,z:1}] },
    { id: 'e6b', color: COLORS[1], rotation: [0,0,0], placed: false,
      cubes: [{x:0,y:0,z:1},{x:1,y:0,z:1},{x:1,y:0,z:0}] },
    { id: 'e6c', color: COLORS[2], rotation: [0,0,0], placed: false,
      cubes: [{x:0,y:0,z:0},{x:1,y:0,z:0},{x:2,y:0,z:0},{x:0,y:0,z:1}] },
    { id: 'e6d', color: COLORS[3], rotation: [0,0,0], placed: false,
      cubes: [{x:0,y:0,z:0},{x:1,y:0,z:0},{x:1,y:1,z:0}] },
    { id: 'e6e', color: COLORS[4], rotation: [0,0,0], placed: false,
      cubes: [{x:0,y:0,z:0},{x:1,y:0,z:0},{x:0,y:0,z:1}] },
  ]
  const solution: PlacedShape[] = [
    { id: 'e6a', color: COLORS[0],
      cubes: [{x:0,y:0,z:0},{x:0,y:1,z:0},{x:0,y:0,z:1}] },
    { id: 'e6b', color: COLORS[1],
      cubes: [{x:0,y:1,z:1},{x:1,y:1,z:1},{x:1,y:1,z:0}] },
    { id: 'e6c', color: COLORS[2],
      cubes: [{x:1,y:0,z:0},{x:2,y:0,z:0},{x:3,y:0,z:0},{x:1,y:0,z:1}] },
    { id: 'e6d', color: COLORS[3],
      cubes: [{x:2,y:0,z:1},{x:3,y:0,z:1},{x:3,y:1,z:1}] },
    { id: 'e6e', color: COLORS[4],
      cubes: [{x:2,y:1,z:0},{x:3,y:1,z:0},{x:2,y:1,z:1}] },
  ]
  return { container, shapes, solution }
}

/*
  Easy 7 — 3×3×2 box (18 cells), four pieces (5+4+5+4).

  Cell assignment (z=0 layer then z=1 layer):
    P1 (blue,  5): (0,0,0)(1,0,0)(2,0,0)(2,1,0)(2,2,0) — L along x then up in y
    P2 (orange,4): (0,1,0)(1,1,0)(0,2,0)(1,2,0)         — 2×2 square
    P3 (green, 5): (0,0,1)(1,0,1)(2,0,1)(2,1,1)(2,2,1) — L at z=1
    P4 (purple,4): (0,1,1)(1,1,1)(0,2,1)(1,2,1)         — 2×2 at z=1
*/
export function getEasyPuzzle7(): Puzzle {
  const container: Vec3 = { x: 3, y: 3, z: 2 }
  const shapes: PuzzleShape[] = [
    { id: 'e7a', color: COLORS[0], rotation: [0,0,0], placed: false,
      cubes: [{x:0,y:0,z:0},{x:1,y:0,z:0},{x:2,y:0,z:0},{x:2,y:1,z:0},{x:2,y:2,z:0}] },
    { id: 'e7b', color: COLORS[1], rotation: [0,0,0], placed: false,
      cubes: [{x:0,y:0,z:0},{x:1,y:0,z:0},{x:0,y:1,z:0},{x:1,y:1,z:0}] },
    { id: 'e7c', color: COLORS[2], rotation: [0,0,0], placed: false,
      cubes: [{x:0,y:0,z:0},{x:1,y:0,z:0},{x:2,y:0,z:0},{x:2,y:1,z:0},{x:2,y:2,z:0}] },
    { id: 'e7d', color: COLORS[3], rotation: [0,0,0], placed: false,
      cubes: [{x:0,y:0,z:0},{x:1,y:0,z:0},{x:0,y:1,z:0},{x:1,y:1,z:0}] },
  ]
  const solution: PlacedShape[] = [
    { id: 'e7a', color: COLORS[0],
      cubes: [{x:0,y:0,z:0},{x:1,y:0,z:0},{x:2,y:0,z:0},{x:2,y:1,z:0},{x:2,y:2,z:0}] },
    { id: 'e7b', color: COLORS[1],
      cubes: [{x:0,y:1,z:0},{x:1,y:1,z:0},{x:0,y:2,z:0},{x:1,y:2,z:0}] },
    { id: 'e7c', color: COLORS[2],
      cubes: [{x:0,y:0,z:1},{x:1,y:0,z:1},{x:2,y:0,z:1},{x:2,y:1,z:1},{x:2,y:2,z:1}] },
    { id: 'e7d', color: COLORS[3],
      cubes: [{x:0,y:1,z:1},{x:1,y:1,z:1},{x:0,y:2,z:1},{x:1,y:2,z:1}] },
  ]
  return { container, shapes, solution }
}

/*
  Easy 8 — 4×2×3 box (24 cells), five pieces (5+5+5+4+5).

  Cell assignment:
    P1 (blue,  5): (0,0,0)(1,0,0)(2,0,0)(3,0,0)(3,1,0) — L-bar at z=0,y=0
    P2 (orange,5): (0,1,0)(1,1,0)(2,1,0)(2,1,1)(2,1,2) — L into z at y=1
    P3 (green, 5): (0,0,1)(1,0,1)(2,0,1)(3,0,1)(3,1,1) — L-bar at z=1,y=0
    P4 (purple,4): (0,1,1)(1,1,1)(0,1,2)(1,1,2)         — 2×2 at y=1
    P5 (red,   5): (0,0,2)(1,0,2)(2,0,2)(3,0,2)(3,1,2) — L-bar at z=2,y=0
*/
export function getEasyPuzzle8(): Puzzle {
  const container: Vec3 = { x: 4, y: 2, z: 3 }
  const shapes: PuzzleShape[] = [
    { id: 'e8a', color: COLORS[0], rotation: [0,0,0], placed: false,
      cubes: [{x:0,y:0,z:0},{x:1,y:0,z:0},{x:2,y:0,z:0},{x:3,y:0,z:0},{x:3,y:1,z:0}] },
    { id: 'e8b', color: COLORS[1], rotation: [0,0,0], placed: false,
      cubes: [{x:0,y:0,z:0},{x:1,y:0,z:0},{x:2,y:0,z:0},{x:2,y:0,z:1},{x:2,y:0,z:2}] },
    { id: 'e8c', color: COLORS[2], rotation: [0,0,0], placed: false,
      cubes: [{x:0,y:0,z:0},{x:1,y:0,z:0},{x:2,y:0,z:0},{x:3,y:0,z:0},{x:3,y:1,z:0}] },
    { id: 'e8d', color: COLORS[3], rotation: [0,0,0], placed: false,
      cubes: [{x:0,y:0,z:0},{x:1,y:0,z:0},{x:0,y:0,z:1},{x:1,y:0,z:1}] },
    { id: 'e8e', color: COLORS[4], rotation: [0,0,0], placed: false,
      cubes: [{x:0,y:0,z:0},{x:1,y:0,z:0},{x:2,y:0,z:0},{x:3,y:0,z:0},{x:3,y:1,z:0}] },
  ]
  const solution: PlacedShape[] = [
    { id: 'e8a', color: COLORS[0],
      cubes: [{x:0,y:0,z:0},{x:1,y:0,z:0},{x:2,y:0,z:0},{x:3,y:0,z:0},{x:3,y:1,z:0}] },
    { id: 'e8b', color: COLORS[1],
      cubes: [{x:0,y:1,z:0},{x:1,y:1,z:0},{x:2,y:1,z:0},{x:2,y:1,z:1},{x:2,y:1,z:2}] },
    { id: 'e8c', color: COLORS[2],
      cubes: [{x:0,y:0,z:1},{x:1,y:0,z:1},{x:2,y:0,z:1},{x:3,y:0,z:1},{x:3,y:1,z:1}] },
    { id: 'e8d', color: COLORS[3],
      cubes: [{x:0,y:1,z:1},{x:1,y:1,z:1},{x:0,y:1,z:2},{x:1,y:1,z:2}] },
    { id: 'e8e', color: COLORS[4],
      cubes: [{x:0,y:0,z:2},{x:1,y:0,z:2},{x:2,y:0,z:2},{x:3,y:0,z:2},{x:3,y:1,z:2}] },
  ]
  return { container, shapes, solution }
}

/*
  Easy 9 — 2×3×3 box (18 cells), four pieces (5+4+5+4).

  Cell assignment:
    P1 (blue,  5): (0,0,0)(1,0,0)(0,0,1)(0,1,1)(0,0,2) — branching staircase
    P2 (orange,4): (1,0,1)(1,0,2)(1,1,2)(0,1,2)         — L-shape
    P3 (green, 5): (1,1,0)(0,1,0)(0,2,0)(1,2,0)(1,1,1) — T-ish
    P4 (purple,4): (0,2,1)(1,2,1)(0,2,2)(1,2,2)         — 2×2 at y=2
*/
export function getEasyPuzzle9(): Puzzle {
  const container: Vec3 = { x: 2, y: 3, z: 3 }
  const shapes: PuzzleShape[] = [
    { id: 'e9a', color: COLORS[0], rotation: [0,0,0], placed: false,
      cubes: [{x:0,y:0,z:0},{x:1,y:0,z:0},{x:0,y:0,z:1},{x:0,y:1,z:1},{x:0,y:0,z:2}] },
    { id: 'e9b', color: COLORS[1], rotation: [0,0,0], placed: false,
      cubes: [{x:1,y:0,z:0},{x:1,y:0,z:1},{x:1,y:1,z:1},{x:0,y:1,z:1}] },
    { id: 'e9c', color: COLORS[2], rotation: [0,0,0], placed: false,
      cubes: [{x:0,y:0,z:0},{x:1,y:0,z:0},{x:0,y:1,z:0},{x:1,y:1,z:0},{x:1,y:0,z:1}] },
    { id: 'e9d', color: COLORS[3], rotation: [0,0,0], placed: false,
      cubes: [{x:0,y:0,z:0},{x:1,y:0,z:0},{x:0,y:0,z:1},{x:1,y:0,z:1}] },
  ]
  const solution: PlacedShape[] = [
    { id: 'e9a', color: COLORS[0],
      cubes: [{x:0,y:0,z:0},{x:1,y:0,z:0},{x:0,y:0,z:1},{x:0,y:1,z:1},{x:0,y:0,z:2}] },
    { id: 'e9b', color: COLORS[1],
      cubes: [{x:1,y:0,z:1},{x:1,y:0,z:2},{x:1,y:1,z:2},{x:0,y:1,z:2}] },
    { id: 'e9c', color: COLORS[2],
      cubes: [{x:1,y:1,z:0},{x:0,y:1,z:0},{x:0,y:2,z:0},{x:1,y:2,z:0},{x:1,y:1,z:1}] },
    { id: 'e9d', color: COLORS[3],
      cubes: [{x:0,y:2,z:1},{x:1,y:2,z:1},{x:0,y:2,z:2},{x:1,y:2,z:2}] },
  ]
  return { container, shapes, solution }
}

/*
  Easy 10 — 4×3×2 box (24 cells), five pieces (5+5+4+5+5).

  Cell assignment:
    P1 (blue,  5): (0,0,0)(1,0,0)(2,0,0)(3,0,0)(3,1,0) — L-bar at z=0
    P2 (orange,5): (0,1,0)(1,1,0)(2,1,0)(2,2,0)(3,2,0) — S-bar at z=0
    P3 (purple,4): (0,2,0)(1,2,0)(0,2,1)(1,2,1)         — 2×2 at y=2
    P4 (green, 5): (0,0,1)(1,0,1)(2,0,1)(3,0,1)(3,1,1) — L-bar at z=1
    P5 (red,   5): (0,1,1)(1,1,1)(2,1,1)(2,2,1)(3,2,1) — S-bar at z=1
*/
export function getEasyPuzzle10(): Puzzle {
  const container: Vec3 = { x: 4, y: 3, z: 2 }
  const shapes: PuzzleShape[] = [
    { id: 'e10a', color: COLORS[0], rotation: [0,0,0], placed: false,
      cubes: [{x:0,y:0,z:0},{x:1,y:0,z:0},{x:2,y:0,z:0},{x:3,y:0,z:0},{x:3,y:1,z:0}] },
    { id: 'e10b', color: COLORS[1], rotation: [0,0,0], placed: false,
      cubes: [{x:0,y:0,z:0},{x:1,y:0,z:0},{x:2,y:0,z:0},{x:2,y:1,z:0},{x:3,y:1,z:0}] },
    { id: 'e10c', color: COLORS[3], rotation: [0,0,0], placed: false,
      cubes: [{x:0,y:0,z:0},{x:1,y:0,z:0},{x:0,y:0,z:1},{x:1,y:0,z:1}] },
    { id: 'e10d', color: COLORS[2], rotation: [0,0,0], placed: false,
      cubes: [{x:0,y:0,z:0},{x:1,y:0,z:0},{x:2,y:0,z:0},{x:3,y:0,z:0},{x:3,y:1,z:0}] },
    { id: 'e10e', color: COLORS[4], rotation: [0,0,0], placed: false,
      cubes: [{x:0,y:0,z:0},{x:1,y:0,z:0},{x:2,y:0,z:0},{x:2,y:1,z:0},{x:3,y:1,z:0}] },
  ]
  const solution: PlacedShape[] = [
    { id: 'e10a', color: COLORS[0],
      cubes: [{x:0,y:0,z:0},{x:1,y:0,z:0},{x:2,y:0,z:0},{x:3,y:0,z:0},{x:3,y:1,z:0}] },
    { id: 'e10b', color: COLORS[1],
      cubes: [{x:0,y:1,z:0},{x:1,y:1,z:0},{x:2,y:1,z:0},{x:2,y:2,z:0},{x:3,y:2,z:0}] },
    { id: 'e10c', color: COLORS[3],
      cubes: [{x:0,y:2,z:0},{x:1,y:2,z:0},{x:0,y:2,z:1},{x:1,y:2,z:1}] },
    { id: 'e10d', color: COLORS[2],
      cubes: [{x:0,y:0,z:1},{x:1,y:0,z:1},{x:2,y:0,z:1},{x:3,y:0,z:1},{x:3,y:1,z:1}] },
    { id: 'e10e', color: COLORS[4],
      cubes: [{x:0,y:1,z:1},{x:1,y:1,z:1},{x:2,y:1,z:1},{x:2,y:2,z:1},{x:3,y:2,z:1}] },
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
