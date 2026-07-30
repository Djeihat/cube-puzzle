import type { Vec3, Puzzle } from './types'

import {
  getEasyPuzzle, getEasyPuzzle2, getEasyPuzzle3,
  getEasyPuzzle4, getEasyPuzzle5, getEasyPuzzle6,
  getEasyPuzzle7, getEasyPuzzle8, getEasyPuzzle9, getEasyPuzzle10,
} from './puzzle-easy'

import { getMediumPuzzle }  from './puzzle-medium-1'
import { getMediumPuzzle2 } from './puzzle-medium-2'
import { getMediumPuzzle3 } from './puzzle-medium-3'
import { getMediumPuzzle4 } from './puzzle-medium-4'
import { getMediumPuzzle5 } from './puzzle-medium-5'
import { getMediumPuzzle6 } from './puzzle-medium-6'
import { getMediumPuzzle7 } from './puzzle-medium-7'
import { getMediumPuzzle8 } from './puzzle-medium-8'
import { getMediumPuzzle9 }  from './puzzle-medium-9'
import { getMediumPuzzle10 } from './puzzle-medium-10'

import { getHardPuzzle }  from './puzzle-hard-1'
import { getHardPuzzle2 } from './puzzle-hard-2'

export type DifficultyKey = 'easy' | 'medium' | 'hard'

export const DIFFICULTY_META: Record<DifficultyKey, { label: string; color: string }> = {
  easy:   { label: 'Easy',   color: '#4A90D9' },
  medium: { label: 'Medium', color: '#E67E22' },
  hard:   { label: 'Hard',   color: '#E74C3C' },
}

// One fixed colour per tetracube type — consistent across every puzzle and day.
const PIECE_COLORS: Record<string, string> = {
  'I-bar':       '#4A90D9',  // blue
  'O-square':    '#E67E22',  // orange
  'T-tetromino': '#2ECC71',  // green
  'L-tetromino': '#9B59B6',  // purple
  'S-skew':      '#E74C3C',  // red
  'right-screw': '#1ABC9C',  // teal
  'branch':      '#F39C12',  // yellow
  'left-screw':  '#E91E63',  // pink
}

const vkey = (v: Vec3) => `${v.x},${v.y},${v.z}`
const shapeKey = (cubes: Vec3[]) => cubes.map(vkey).sort().join('|')

// Returns the lexicographically smallest shapeKey across all rotations —
// a rotation-invariant fingerprint that uniquely identifies each tetracube type.
function canonicalKey(cubes: Vec3[]): string {
  const keys: string[] = []
  const seen = new Set<string>()
  let c1 = cubes
  for (let xi = 0; xi < 4; xi++) {
    let c2 = c1
    for (let yi = 0; yi < 4; yi++) {
      let c3 = c2
      for (let zi = 0; zi < 4; zi++) {
        const k = shapeKey(normalizeShape(c3))
        if (!seen.has(k)) { seen.add(k); keys.push(k) }
        c3 = c3.map(rotateZ)
      }
      c2 = c2.map(rotateY)
    }
    c1 = c1.map(rotateX)
  }
  return keys.sort()[0]
}

// 8-entry map: canonical key → colour, built once at module init.
const PIECE_COLOR: Map<string, string> = new Map(
  Object.entries({
    'I-bar':       [{x:0,y:0,z:0},{x:1,y:0,z:0},{x:2,y:0,z:0},{x:3,y:0,z:0}],
    'O-square':    [{x:0,y:0,z:0},{x:1,y:0,z:0},{x:0,y:1,z:0},{x:1,y:1,z:0}],
    'T-tetromino': [{x:0,y:0,z:0},{x:1,y:0,z:0},{x:2,y:0,z:0},{x:1,y:1,z:0}],
    'L-tetromino': [{x:0,y:0,z:0},{x:1,y:0,z:0},{x:2,y:0,z:0},{x:2,y:1,z:0}],
    'S-skew':      [{x:0,y:0,z:0},{x:1,y:0,z:0},{x:1,y:1,z:0},{x:2,y:1,z:0}],
    'right-screw': [{x:0,y:0,z:0},{x:1,y:0,z:0},{x:1,y:1,z:0},{x:1,y:1,z:1}],
    'branch':      [{x:0,y:0,z:0},{x:1,y:0,z:0},{x:0,y:1,z:0},{x:0,y:0,z:1}],
    'left-screw':  [{x:0,y:0,z:0},{x:1,y:0,z:0},{x:1,y:0,z:1},{x:1,y:1,z:1}],
  } as Record<string, Vec3[]>).map(([name, cubes]) => [canonicalKey(cubes), PIECE_COLORS[name]])
)

// Assigns each shape its canonical colour based on piece geometry, so the same
// tetracube type always gets the same colour regardless of puzzle or day.
export function assignShapeColors(puzzle: Puzzle): Puzzle {
  const colorMap = new Map<string, string>()

  const shapes = puzzle.shapes.map(s => {
    const color = PIECE_COLOR.get(canonicalKey(s.cubes)) ?? '#ffffff'
    colorMap.set(s.id, color)
    return { ...s, color }
  })

  const solution = puzzle.solution.map(s => ({ ...s, color: colorMap.get(s.id) ?? s.color }))

  return { ...puzzle, shapes, solution }
}

// ── Rotation helpers ──────────────────────────────────────────────────────────

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

// ── Re-export puzzle functions ────────────────────────────────────────────────

export {
  getEasyPuzzle, getEasyPuzzle2, getEasyPuzzle3,
  getEasyPuzzle4, getEasyPuzzle5, getEasyPuzzle6,
  getEasyPuzzle7, getEasyPuzzle8, getEasyPuzzle9, getEasyPuzzle10,
  getMediumPuzzle, getMediumPuzzle2, getMediumPuzzle3,
  getMediumPuzzle4, getMediumPuzzle5, getMediumPuzzle6,
  getMediumPuzzle7, getMediumPuzzle8, getMediumPuzzle9, getMediumPuzzle10,
  getHardPuzzle, getHardPuzzle2,
}

// ── Puzzle library ────────────────────────────────────────────────────────────
// Each entry is a factory function so every call returns a fresh, mutable puzzle.

export const PUZZLE_LIBRARY: Record<DifficultyKey, Array<() => Puzzle>> = {
  easy: [
    getEasyPuzzle, getEasyPuzzle2, getEasyPuzzle3,
    getEasyPuzzle4, getEasyPuzzle5, getEasyPuzzle6,
    getEasyPuzzle7, getEasyPuzzle8, getEasyPuzzle9, getEasyPuzzle10,
  ],
  medium: [
    getMediumPuzzle, getMediumPuzzle2, getMediumPuzzle3,
    getMediumPuzzle4, getMediumPuzzle5, getMediumPuzzle6,
    getMediumPuzzle7, getMediumPuzzle8, getMediumPuzzle9, getMediumPuzzle10,
  ],
  hard: [getHardPuzzle, getHardPuzzle2],
}
