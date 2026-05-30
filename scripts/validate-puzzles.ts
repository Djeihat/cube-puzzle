/**
 * Puzzle validator — run with: npx vite-node scripts/validate-puzzles.ts
 *
 * For every puzzle in PUZZLE_LIBRARY checks:
 *   1. Total solution cells == sum of piece sizes
 *   2. No cell appears twice in the solution
 *   3. Every solution cell is valid (in validCells if present, else within container)
 *   4. Every solution piece is connected (all cubes reachable from the first)
 *   5. Shape IDs in shapes[] and solution[] match
 */

import { PUZZLE_LIBRARY } from '../src/puzzle'
import type { Vec3, Puzzle } from '../src/types'

// ── helpers ───────────────────────────────────────────────────────────────────

const key = (v: Vec3) => `${v.x},${v.y},${v.z}`

function connected(cubes: Vec3[]): boolean {
  if (cubes.length === 0) return true
  const remaining = new Set(cubes.map(key))
  const queue: Vec3[] = [cubes[0]]
  remaining.delete(key(cubes[0]))
  const deltas = [
    { x: 1, y: 0, z: 0 }, { x: -1, y: 0, z: 0 },
    { x: 0, y: 1, z: 0 }, { x: 0, y: -1, z: 0 },
    { x: 0, y: 0, z: 1 }, { x: 0, y: 0, z: -1 },
  ]
  while (queue.length > 0) {
    const cur = queue.pop()!
    for (const d of deltas) {
      const nb = { x: cur.x + d.x, y: cur.y + d.y, z: cur.z + d.z }
      if (remaining.has(key(nb))) {
        remaining.delete(key(nb))
        queue.push(nb)
      }
    }
  }
  return remaining.size === 0
}

function validatePuzzle(puzzle: Puzzle, label: string): string[] {
  const errors: string[] = []
  const { container, validCells, shapes, solution } = puzzle

  // 1. IDs match
  const shapeIds  = new Set(shapes.map(s => s.id))
  const solIds    = new Set(solution.map(s => s.id))
  for (const id of shapeIds) if (!solIds.has(id))   errors.push(`Shape "${id}" missing from solution`)
  for (const id of solIds)   if (!shapeIds.has(id)) errors.push(`Solution piece "${id}" not in shapes`)

  // Build valid-cell set
  const validSet = validCells
    ? new Set(validCells.map(key))
    : null

  const inBounds = (v: Vec3) =>
    validSet
      ? validSet.has(key(v))
      : v.x >= 0 && v.x < container.x &&
        v.y >= 0 && v.y < container.y &&
        v.z >= 0 && v.z < container.z

  // 2. No duplicate cells; all in bounds
  const seen = new Map<string, string>() // key → piece id
  for (const piece of solution) {
    for (const cube of piece.cubes) {
      const k = key(cube)
      if (seen.has(k)) {
        errors.push(`Cell (${k}) claimed by both "${seen.get(k)}" and "${piece.id}"`)
      } else {
        seen.set(k, piece.id)
      }
      if (!inBounds(cube)) {
        errors.push(`Piece "${piece.id}" cell (${k}) is outside valid container`)
      }
    }
  }

  // 3. Total cell count
  const totalSolution = solution.reduce((n, p) => n + p.cubes.length, 0)
  const totalShapes   = shapes.reduce((n, s) => n + s.cubes.length, 0)
  const containerSize = validCells ? validCells.length
    : container.x * container.y * container.z

  if (totalSolution !== containerSize) {
    errors.push(`Solution covers ${totalSolution} cells but container has ${containerSize}`)
  }
  if (totalSolution !== totalShapes) {
    errors.push(`Solution has ${totalSolution} cells but shapes define ${totalShapes}`)
  }

  // 4. Each solution piece is connected
  for (const piece of solution) {
    if (!connected(piece.cubes)) {
      errors.push(`Piece "${piece.id}" solution cubes are not connected`)
    }
  }

  return errors
}

// ── run ───────────────────────────────────────────────────────────────────────
// Usage:
//   npm run validate                  — all puzzles
//   npm run validate -- medium        — all medium puzzles
//   npm run validate -- medium 9      — medium puzzle #9 only

const [filterDiff, filterNum] = process.argv.slice(2)
const targetNum = filterNum ? parseInt(filterNum, 10) : null

let allOk = true
let ran = 0

for (const [difficulty, factories] of Object.entries(PUZZLE_LIBRARY)) {
  if (filterDiff && difficulty !== filterDiff) continue
  for (let i = 0; i < factories.length; i++) {
    if (targetNum !== null && i + 1 !== targetNum) continue
    const label = `${difficulty} #${i + 1}`
    const puzzle = factories[i]()
    const errors = validatePuzzle(puzzle, label)
    ran++
    if (errors.length === 0) {
      console.log(`✓  ${label}`)
    } else {
      allOk = false
      console.error(`✗  ${label}`)
      for (const e of errors) console.error(`     ${e}`)
    }
  }
}

if (ran === 0) {
  console.error(`No puzzles matched filter: ${filterDiff ?? ''}${targetNum ? ` #${targetNum}` : ''}`)
  process.exit(1)
}

console.log(allOk ? '\nAll puzzles valid ✓' : '\nValidation FAILED ✗')
process.exit(allOk ? 0 : 1)
