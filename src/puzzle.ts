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

// Fixed palette — same 7 colours used across all puzzles.
const SHAPE_COLORS = ['#4A90D9', '#E67E22', '#2ECC71', '#9B59B6', '#E74C3C', '#1ABC9C', '#F39C12']

// FNV-1a hash over sorted cube coordinates → stable colour index for any shape geometry.
function hashShape(cubes: Vec3[]): number {
  const sorted = [...cubes].sort(
    (a, b) => a.x !== b.x ? a.x - b.x : a.y !== b.y ? a.y - b.y : a.z - b.z,
  )
  let h = 2166136261 | 0
  for (const { x, y, z } of sorted) {
    h = Math.imul(h ^ x, 16777619)
    h = Math.imul(h ^ y, 16777619)
    h = Math.imul(h ^ z, 16777619)
  }
  return Math.abs(h)
}

// Assigns each shape a colour derived from its geometry so the same piece always
// gets the same colour regardless of which puzzle it appears in or what day it is.
// If two shapes in one puzzle hash to the same colour, the second gets the next
// available slot (collision is rare given distinct piece geometries).
export function assignShapeColors(puzzle: Puzzle): Puzzle {
  const used     = new Set<string>()
  const colorMap = new Map<string, string>()  // shape id → assigned colour

  const shapes = puzzle.shapes.map(s => {
    const norm = normalizeShape(s.cubes)
    let idx    = hashShape(norm) % SHAPE_COLORS.length
    while (used.has(SHAPE_COLORS[idx])) idx = (idx + 1) % SHAPE_COLORS.length
    const color = SHAPE_COLORS[idx]
    used.add(color)
    colorMap.set(s.id, color)
    return { ...s, color }
  })

  // solution placedShapes also carry colours; keep them in sync so the
  // solved-puzzle view (which renders from puzzle.solution) matches.
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
