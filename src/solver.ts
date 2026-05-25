/**
 * Backtracking exact-cover solver for polycube puzzles.
 *
 * Given a set of container cells and a list of piece definitions, finds all
 * placements (up to `maxSolutions`) where every container cell is covered
 * exactly once.
 */

import type { Vec3 } from './types'
import { vec3Key, normalizeShape } from './puzzle'

// ── Orientation generation ────────────────────────────────────────────────────

function rotateX(v: Vec3): Vec3 { return { x: v.x, y: -v.z, z: v.y } }
function rotateY(v: Vec3): Vec3 { return { x: v.z, y: v.y, z: -v.x } }
function rotateZ(v: Vec3): Vec3 { return { x: -v.y, y: v.x, z: v.z } }

function applyN(cubes: Vec3[], fn: (v: Vec3) => Vec3, n: number): Vec3[] {
  let r = cubes
  for (let i = 0; i < n; i++) r = r.map(fn)
  return r
}

function shapeKey(cubes: Vec3[]): string {
  return normalizeShape(cubes)
    .map(vec3Key)
    .sort()
    .join('|')
}

/**
 * Returns all distinct orientations of a polycube shape.
 * allowReflections = true → up to 48 orientations (rotations + mirrors)
 * allowReflections = false → up to 24 orientations (rotations only)
 */
export function getOrientations(cubes: Vec3[], allowReflections: boolean): Vec3[][] {
  const seen = new Set<string>()
  const results: Vec3[][] = []

  // Generate all 24 rotation-group elements by composing 90° rotations
  const candidates: Vec3[][] = []
  for (let x = 0; x < 4; x++) {
    for (let y = 0; y < 4; y++) {
      for (let z = 0; z < 4; z++) {
        let r = applyN(cubes, rotateX, x)
        r = applyN(r, rotateY, y)
        r = applyN(r, rotateZ, z)
        candidates.push(r)
      }
    }
  }

  // Add mirror (reflect X) if allowed
  if (allowReflections) {
    const mirrored = cubes.map(v => ({ x: -v.x, y: v.y, z: v.z }))
    for (let x = 0; x < 4; x++) {
      for (let y = 0; y < 4; y++) {
        for (let z = 0; z < 4; z++) {
          let r = applyN(mirrored, rotateX, x)
          r = applyN(r, rotateY, y)
          r = applyN(r, rotateZ, z)
          candidates.push(r)
        }
      }
    }
  }

  for (const c of candidates) {
    const norm = normalizeShape(c)
    const key = shapeKey(norm)
    if (!seen.has(key)) {
      seen.add(key)
      results.push(norm)
    }
  }

  return results
}

// ── Solver ────────────────────────────────────────────────────────────────────

export interface Placement {
  pieceIndex: number   // which piece (0-based)
  cubes: Vec3[]        // absolute positions in the container
}

export interface SolveOptions {
  allowReflections?: boolean  // default true
  maxSolutions?: number       // default 1
}

/**
 * Returns up to `maxSolutions` complete tilings of `containerCells` using
 * `pieces` (each piece used exactly once). Returns [] if unsolvable.
 */
export function solve(
  containerCells: Vec3[],
  pieces: Vec3[][],
  options: SolveOptions = {},
): Placement[][] {
  const { allowReflections = true, maxSolutions = 1 } = options

  // Pre-compute all valid placements for each piece
  const cellSet = new Set(containerCells.map(vec3Key))

  // orientations[i] = list of distinct normalized orientations for piece i
  const orientations = pieces.map(p => getOrientations(p, allowReflections))

  // For each piece, enumerate every (orientation, offset) that fits entirely
  // inside the container. Each entry = list of absolute cell keys covered.
  type PiecePlacement = { cubes: Vec3[]; keys: string[] }
  const pieceOptions: PiecePlacement[][] = pieces.map((_, pi) => {
    const opts: PiecePlacement[] = []
    for (const orient of orientations[pi]) {
      // Try placing the normalized orientation at every container cell as offset
      for (const anchor of containerCells) {
        const placed = orient.map(c => ({
          x: c.x + anchor.x,
          y: c.y + anchor.y,
          z: c.z + anchor.z,
        }))
        const keys = placed.map(vec3Key)
        if (keys.every(k => cellSet.has(k))) {
          opts.push({ cubes: placed, keys })
        }
      }
    }
    // Deduplicate (same footprint from different anchor/orient combos)
    const seen = new Set<string>()
    return opts.filter(o => {
      const k = o.keys.slice().sort().join('|')
      if (seen.has(k)) return false
      seen.add(k)
      return true
    })
  })

  // Backtracking search
  const solutions: Placement[][] = []
  const current: Placement[] = []
  const covered = new Set<string>()

  function backtrack(pieceIdx: number) {
    if (solutions.length >= maxSolutions) return
    if (pieceIdx === pieces.length) {
      // All pieces placed — check all cells covered
      if (covered.size === containerCells.length) {
        solutions.push(current.map(p => ({ ...p, cubes: [...p.cubes] })))
      }
      return
    }

    for (const opt of pieceOptions[pieceIdx]) {
      // Check no overlap with already-covered cells
      if (opt.keys.some(k => covered.has(k))) continue

      // Place
      for (const k of opt.keys) covered.add(k)
      current.push({ pieceIndex: pieceIdx, cubes: opt.cubes })

      backtrack(pieceIdx + 1)

      // Undo
      current.pop()
      for (const k of opt.keys) covered.delete(k)

      if (solutions.length >= maxSolutions) return
    }
  }

  backtrack(0)
  return solutions
}

// ── Connectivity check ────────────────────────────────────────────────────────

/** Returns true if all cells form a single connected component (face-adjacency). */
export function isConnected(cells: Vec3[]): boolean {
  if (cells.length === 0) return true
  const set = new Set(cells.map(vec3Key))
  const visited = new Set<string>()
  const queue: Vec3[] = [cells[0]]
  visited.add(vec3Key(cells[0]))
  const dirs: Vec3[] = [
    { x: 1, y: 0, z: 0 }, { x: -1, y: 0, z: 0 },
    { x: 0, y: 1, z: 0 }, { x: 0, y: -1, z: 0 },
    { x: 0, y: 0, z: 1 }, { x: 0, y: 0, z: -1 },
  ]
  while (queue.length) {
    const c = queue.pop()!
    for (const d of dirs) {
      const n = { x: c.x + d.x, y: c.y + d.y, z: c.z + d.z }
      const k = vec3Key(n)
      if (set.has(k) && !visited.has(k)) {
        visited.add(k)
        queue.push(n)
      }
    }
  }
  return visited.size === cells.length
}
