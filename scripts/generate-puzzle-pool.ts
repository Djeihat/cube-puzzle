/**
 * Puzzle pool generator — v2 (daily sets with shape families)
 * Run:  npx vite-node scripts/generate-puzzle-pool.ts
 * Writes public/puzzle-pool.json
 *
 * Output format: { daily: DailySet[] }
 * where DailySet = { family: string, easy: Puzzle, medium: Puzzle, hard: Puzzle }
 *
 * Difficulty tiers (all tetracubes, 4 cells each):
 *   easy   — 3 pieces (12 cells) or 4 pieces (16 cells), free tetracubes only
 *   medium — 5 pieces (20 cells) or 6 pieces (24 cells), free tetracubes only
 *   hard   — 7 pieces (28 cells) or 8 pieces (32 cells), one-sided tetracubes
 *
 * Shape families group containers with a consistent visual motif across difficulty
 * levels — players see the same container style each day regardless of difficulty.
 * Chunk 1: rectangle family only. Irregular families added in Chunks 2–5.
 */

import { writeFileSync } from 'fs'
import { resolve } from 'path'

// ── types ─────────────────────────────────────────────────────────────────────

type Vec3 = { x: number; y: number; z: number }

interface ContainerSpec {
  container: Vec3
  validCells: Vec3[]
  total: number
  label: string
}

// ── solver (same core logic as solve-puzzle.ts) ───────────────────────────────

const key = (v: Vec3) => `${v.x},${v.y},${v.z}`

function rotateX(v: Vec3): Vec3 { return { x: v.x,  y: -v.z, z:  v.y } }
function rotateY(v: Vec3): Vec3 { return { x: v.z,  y:  v.y, z: -v.x } }
function rotateZ(v: Vec3): Vec3 { return { x: -v.y, y:  v.x, z:  v.z } }

function normalize(cubes: Vec3[]): Vec3[] {
  const minX = Math.min(...cubes.map(p => p.x))
  const minY = Math.min(...cubes.map(p => p.y))
  const minZ = Math.min(...cubes.map(p => p.z))
  return cubes.map(p => ({ x: p.x - minX, y: p.y - minY, z: p.z - minZ }))
}

function shapeKey(cubes: Vec3[]): string { return cubes.map(key).sort().join('|') }

function allOrientations(cubes: Vec3[]): Vec3[][] {
  const seen = new Set<string>()
  const results: Vec3[][] = []
  let c1 = cubes
  for (let xi = 0; xi < 4; xi++) {
    let c2 = c1
    for (let yi = 0; yi < 4; yi++) {
      let c3 = c2
      for (let zi = 0; zi < 4; zi++) {
        const norm = normalize(c3)
        const k = shapeKey(norm)
        if (!seen.has(k)) { seen.add(k); results.push(norm) }
        c3 = c3.map(rotateZ)
      }
      c2 = c2.map(rotateY)
    }
    c1 = c1.map(rotateX)
  }
  return results
}

function placementsOf(orientation: Vec3[], validSet: Set<string>): Vec3[][] {
  const seen = new Set<string>()
  const result: Vec3[][] = []
  for (const p of orientation) {
    for (const cell of validSet) {
      const [cx, cy, cz] = cell.split(',').map(Number)
      const dx = cx - p.x, dy = cy - p.y, dz = cz - p.z
      const placed = orientation.map(v => ({ x: v.x+dx, y: v.y+dy, z: v.z+dz }))
      if (placed.every(v => validSet.has(key(v)))) {
        const k = shapeKey(placed)
        if (!seen.has(k)) { seen.add(k); result.push(placed) }
      }
    }
  }
  return result
}

interface SolverPiece { name: string; canonical: Vec3[]; placements: Vec3[][] }
interface PlacedPiece  { name: string; canonical: Vec3[]; cubes: Vec3[] }

function solve(pieces: SolverPiece[], validCells: Vec3[]): PlacedPiece[] | null {
  const cellKeys = validCells.map(key)
  let solution: PlacedPiece[] | null = null
  const used   = new Set<string>()
  const placed: PlacedPiece[] = []

  function firstUncovered(): string | null {
    for (const k of cellKeys) if (!used.has(k)) return k
    return null
  }

  function backtrack(remaining: number[]) {
    if (solution) return
    const target = firstUncovered()
    if (!target) { solution = placed.map(p => ({ ...p, cubes: [...p.cubes] })); return }
    for (let i = 0; i < remaining.length; i++) {
      const piece = pieces[remaining[i]]
      for (const placement of piece.placements) {
        if (!placement.some(v => key(v) === target)) continue
        if (placement.some(v => used.has(key(v)))) continue
        for (const v of placement) used.add(key(v))
        placed.push({ name: piece.name, canonical: piece.canonical, cubes: placement })
        backtrack([...remaining.slice(0, i), ...remaining.slice(i + 1)])
        placed.pop()
        for (const v of placement) used.delete(key(v))
        if (solution) return
      }
    }
  }

  backtrack(pieces.map((_, i) => i))
  return solution
}

// ── piece library ─────────────────────────────────────────────────────────────

const c = (x: number, y: number, z: number): Vec3 => ({ x, y, z })

const TETRACUBES: Record<string, Vec3[]> = {
  'I-bar':        [c(0,0,0),c(1,0,0),c(2,0,0),c(3,0,0)],
  'O-square':     [c(0,0,0),c(1,0,0),c(0,1,0),c(1,1,0)],
  'T-tetromino':  [c(0,0,0),c(1,0,0),c(2,0,0),c(1,1,0)],
  'L-tetromino':  [c(0,0,0),c(1,0,0),c(2,0,0),c(2,1,0)],
  'S-skew':       [c(0,0,0),c(1,0,0),c(1,1,0),c(2,1,0)],
  'right-screw':  [c(0,0,0),c(1,0,0),c(1,1,0),c(1,1,1)],
  'branch':       [c(0,0,0),c(1,0,0),c(0,1,0),c(0,0,1)],
  'left-screw':   [c(0,0,0),c(1,0,0),c(1,0,1),c(1,1,1)],
}

// Free polycubes — reflections count as same piece (7 distinct)
const FREE_TETRACUBE_NAMES     = Object.keys(TETRACUBES).filter(n => n !== 'left-screw')
// One-sided — rotations only, right-screw ≠ left-screw (8 distinct)
const ONESIDED_TETRACUBE_NAMES = Object.keys(TETRACUBES)

// ── combinatorics ─────────────────────────────────────────────────────────────

function combinations<T>(arr: T[], k: number): T[][] {
  if (k === 0) return [[]]
  if (arr.length < k) return []
  const [head, ...tail] = arr
  return [
    ...combinations(tail, k - 1).map(combo => [head, ...combo]),
    ...combinations(tail, k),
  ]
}

// ── container helpers ─────────────────────────────────────────────────────────

function allCells(d: Vec3): Vec3[] {
  const cells: Vec3[] = []
  for (let x = 0; x < d.x; x++)
    for (let y = 0; y < d.y; y++)
      for (let z = 0; z < d.z; z++)
        cells.push({ x, y, z })
  return cells
}

function makeRectSpec(d: Vec3): ContainerSpec {
  const cells = allCells(d)
  return { container: d, validCells: cells, total: cells.length, label: `${d.x}x${d.y}x${d.z}` }
}

// ── rectangle family containers ───────────────────────────────────────────────
//
// All axis-permutations of each unique box shape so players see visually varied
// containers (portrait vs landscape vs deep) across different puzzle days.

const RECT_12: ContainerSpec[] = [  // 3-piece easy
  {x:3,y:2,z:2}, {x:2,y:3,z:2}, {x:2,y:2,z:3},
].map(makeRectSpec)

const RECT_16: ContainerSpec[] = [  // 4-piece easy
  {x:4,y:2,z:2}, {x:2,y:4,z:2}, {x:2,y:2,z:4},
].map(makeRectSpec)

const RECT_20: ContainerSpec[] = [  // 5-piece medium
  {x:5,y:2,z:2}, {x:2,y:5,z:2}, {x:2,y:2,z:5},
].map(makeRectSpec)

const RECT_24: ContainerSpec[] = [  // 6-piece medium
  {x:2,y:3,z:4}, {x:2,y:4,z:3}, {x:3,y:2,z:4},
  {x:3,y:4,z:2}, {x:4,y:2,z:3}, {x:4,y:3,z:2},
  {x:6,y:2,z:2}, {x:2,y:6,z:2}, {x:2,y:2,z:6},
].map(makeRectSpec)

const RECT_28: ContainerSpec[] = [  // 7-piece hard
  {x:7,y:2,z:2}, {x:2,y:7,z:2}, {x:2,y:2,z:7},
].map(makeRectSpec)

const RECT_32: ContainerSpec[] = [  // 8-piece hard
  {x:4,y:4,z:2}, {x:4,y:2,z:4}, {x:2,y:4,z:4},
  {x:8,y:2,z:2}, {x:2,y:8,z:2}, {x:2,y:2,z:8},
].map(makeRectSpec)

// ── pool generation ───────────────────────────────────────────────────────────

const COLORS  = ['#4A90D9','#E67E22','#2ECC71','#9B59B6','#E74C3C','#1ABC9C','#F39C12','#3498DB']
const LETTERS = 'abcdefghijklmnopqrstuvwxyz'

function fingerprint(containerCells: Vec3[], pieceNames: string[]): string {
  return containerCells.map(key).sort().join('|') + '::' + [...pieceNames].sort().join('+')
}

function buildPiece(name: string, validSet: Set<string>): SolverPiece {
  const canonical = TETRACUBES[name]
  const seen = new Set<string>()
  const placements = allOrientations(canonical).flatMap(o => placementsOf(o, validSet)).filter(p => {
    const k = shapeKey(p); if (seen.has(k)) return false; seen.add(k); return true
  })
  return { name, canonical, placements }
}

function tryGenerate(
  spec: ContainerSpec,
  pieceNames: string[],
  idPfx: string,
  seen: Set<string>,
): object | null {
  const fp = fingerprint(spec.validCells, pieceNames)
  if (seen.has(fp)) return null
  const validSet = new Set(spec.validCells.map(key))
  const solverPieces = pieceNames.map(n => buildPiece(n, validSet))
  const solution = solve(solverPieces, spec.validCells)
  if (!solution) return null
  seen.add(fp)

  const shapes = solverPieces.map((p, i) => ({
    id: `${idPfx}${LETTERS[i]}`, color: COLORS[i], rotation: [0,0,0], placed: false, cubes: p.canonical,
  }))
  const sol = solution.map(p => {
    const i = solverPieces.findIndex(sp => sp.name === p.name)
    return { id: `${idPfx}${LETTERS[i]}`, color: COLORS[i], cubes: p.cubes }
  })
  const puzzle: any = { _fp: fp, container: spec.container, shapes, solution: sol }
  const isIrregular = spec.validCells.length < spec.container.x * spec.container.y * spec.container.z
  if (isIrregular) puzzle.validCells = spec.validCells
  return puzzle
}

// Collect all solvable (container, piece-combo) pairs from the given specs.
function collectPuzzles(
  containers: ContainerSpec[],
  pieceCount: number,
  pieceNames: string[],
  idPfx: string,
  seen: Set<string>,
  max = Infinity,
): object[] {
  const puzzles: object[] = []
  const combos = combinations(pieceNames, pieceCount)

  outer:
  for (const spec of containers) {
    for (const names of combos) {
      if (puzzles.length >= max) break outer
      if (names.length * 4 !== spec.total) continue
      const p = tryGenerate(spec, names, idPfx, seen)
      if (p) { puzzles.push(p); process.stdout.write('.') }
    }
  }
  return puzzles
}

// Interleave two arrays so both cell counts appear throughout the daily order.
function interleave<T>(a: T[], b: T[]): T[] {
  const result: T[] = []
  const max = Math.max(a.length, b.length)
  for (let i = 0; i < max; i++) {
    if (i < a.length) result.push(a[i])
    if (i < b.length) result.push(b[i])
  }
  return result
}

// ── main ──────────────────────────────────────────────────────────────────────

async function main() {
  const outPath = resolve(process.cwd(), 'public/puzzle-pool.json')
  const seen    = new Set<string>()
  const t0      = Date.now()

  console.log('Generating rectangle family (all 6 cell counts)...\n')

  process.stdout.write('  easy   3-piece  12-cell: ')
  const easy3  = collectPuzzles(RECT_12, 3, FREE_TETRACUBE_NAMES,     'e3', seen)
  console.log(` ${easy3.length}`)

  process.stdout.write('  easy   4-piece  16-cell: ')
  const easy4  = collectPuzzles(RECT_16, 4, FREE_TETRACUBE_NAMES,     'e4', seen)
  console.log(` ${easy4.length}`)

  process.stdout.write('  medium 5-piece  20-cell: ')
  const med5   = collectPuzzles(RECT_20, 5, FREE_TETRACUBE_NAMES,     'm5', seen)
  console.log(` ${med5.length}`)

  process.stdout.write('  medium 6-piece  24-cell: ')
  const med6   = collectPuzzles(RECT_24, 6, FREE_TETRACUBE_NAMES,     'm6', seen)
  console.log(` ${med6.length}`)

  process.stdout.write('  hard   7-piece  28-cell: ')
  const hard7  = collectPuzzles(RECT_28, 7, ONESIDED_TETRACUBE_NAMES, 'h7', seen)
  console.log(` ${hard7.length}`)

  process.stdout.write('  hard   8-piece  32-cell: ')
  const hard8  = collectPuzzles(RECT_32, 8, ONESIDED_TETRACUBE_NAMES, 'h8', seen)
  console.log(` ${hard8.length}`)

  // Interleave so the daily pool alternates between piece counts within each tier
  const easyAll = interleave(easy3, easy4)
  const medAll  = interleave(med5, med6)
  const hardAll = interleave(hard7, hard8)

  // Daily sets are limited by the smallest tier's count
  const count = Math.min(easyAll.length, medAll.length, hardAll.length)
  const daily = Array.from({ length: count }, (_, i) => ({
    family: 'rectangle',
    easy:   easyAll[i],
    medium: medAll[i],
    hard:   hardAll[i],
  }))

  const ms = Date.now() - t0
  console.log(`\n${count} daily sets in ${(ms/1000).toFixed(1)}s`)
  console.log(`  (easy: ${easyAll.length}, medium: ${medAll.length}, hard: ${hardAll.length})`)

  writeFileSync(outPath, JSON.stringify({ daily }, null, 2))
  console.log(`Written → ${outPath}`)

  if (count < 10) {
    console.warn(`\n⚠  Only ${count} daily sets — add more container families to expand the pool.`)
  }
}

main().catch(err => { console.error(err); process.exit(1) })
