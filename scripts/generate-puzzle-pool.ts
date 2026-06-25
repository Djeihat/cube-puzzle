/**
 * Puzzle pool generator
 * Run:  npx vite-node scripts/generate-puzzle-pool.ts
 * Writes public/puzzle-pool.json
 *
 * For every (container, piece-set) combination, runs the backtracking solver.
 * Valid solutions are collected into a pool.  Each puzzle is fingerprinted by
 * its container cells + sorted piece names so no two pool entries are identical.
 *
 * Difficulty tiers:
 *   easy   — 3 or 4 distinct tetracubes, rectangular containers
 *   medium — 5 distinct tetracubes, 20-cell irregular containers
 *   hard   — 6 distinct tetracubes, 24-cell irregular containers
 */

import { writeFileSync, readFileSync, existsSync } from 'fs'
import { resolve } from 'path'
import { PUZZLE_LIBRARY } from '../src/puzzle'

// ── types ─────────────────────────────────────────────────────────────────────

type Vec3 = { x: number; y: number; z: number }
type DifficultyKey = 'easy' | 'medium' | 'hard'

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
  // Hard-only: left-screw is the chiral mirror of right-screw.
  // Under rotations-only, these are genuinely distinct pieces.
  // Flat pieces (I,O,T,L,S) are the same under rotations-only since
  // a flat piece can be "flipped" by a valid 3D rotation.
  'left-screw':   [c(0,0,0),c(1,0,0),c(1,0,1),c(1,1,1)],
}

// Easy / Medium: free polycubes — reflections allowed (7 distinct)
const FREE_TETRACUBE_NAMES     = Object.keys(TETRACUBES).filter(n => n !== 'left-screw')
// Hard: one-sided — rotations only, right-screw ≠ left-screw (8 distinct)
const ONESIDED_TETRACUBE_NAMES = Object.keys(TETRACUBES)

// ── combinatorics ─────────────────────────────────────────────────────────────

function combinations<T>(arr: T[], k: number): T[][] {
  if (k === 0) return [[]]
  if (arr.length < k) return []
  const [head, ...tail] = arr
  return [
    ...combinations(tail, k - 1).map(c => [head, ...c]),
    ...combinations(tail, k),
  ]
}

// ── container library ─────────────────────────────────────────────────────────

interface ContainerSpec { container: Vec3; validCells: Vec3[]; total: number; label: string }

function allCells(container: Vec3): Vec3[] {
  const cells: Vec3[] = []
  for (let x = 0; x < container.x; x++)
    for (let y = 0; y < container.y; y++)
      for (let z = 0; z < container.z; z++)
        cells.push({ x, y, z })
  return cells
}

// Easy: rectangular containers — include all axis-permutations of each unique
// shape so players see visually different containers (portrait vs landscape).
// 12-cell (3×2×2) and 16-cell (4×2×2) with all three axis orientations each.
const EASY_CONTAINERS: ContainerSpec[] = (() => {
  const library = PUZZLE_LIBRARY.easy.map(f => f())
  const seen = new Set<string>()
  const specs: ContainerSpec[] = []
  const dims12 = [{x:3,y:2,z:2},{x:2,y:3,z:2},{x:2,y:2,z:3}]
  const dims16 = [{x:4,y:2,z:2},{x:2,y:4,z:2},{x:2,y:2,z:4}]
  for (const d of [...dims12, ...dims16]) {
    const k = `${d.x},${d.y},${d.z}`
    if (seen.has(k)) continue
    seen.add(k)
    const cells = allCells(d)
    specs.push({ container: d, validCells: cells, total: cells.length, label: k })
  }
  // Also include any unique-sized easy containers from the library
  for (let i = 0; i < library.length; i++) {
    const p = library[i]
    const cells = allCells(p.container)
    const k = `${p.container.x},${p.container.y},${p.container.z}`
    if (!seen.has(k) && (cells.length === 12 || cells.length === 16)) {
      seen.add(k); specs.push({ container: p.container, validCells: cells, total: cells.length, label: `easy-${i+1}` })
    }
  }
  return specs
})()

// Medium: 20-cell irregular containers (puzzles 1, 4, 5)
// Hard: 24-cell irregular containers (puzzles 2, 6, 7, 8)
const MEDIUM_CONTAINERS: ContainerSpec[] = []
const HARD_CONTAINERS:   ContainerSpec[] = []

PUZZLE_LIBRARY.medium.forEach((factory, i) => {
  const p = factory()
  const cells = p.validCells ?? allCells(p.container)
  const total = cells.length
  const spec = { container: p.container, validCells: cells, total, label: `medium-${i+1}` }
  if (total === 20) MEDIUM_CONTAINERS.push(spec)
  if (total === 24) HARD_CONTAINERS.push(spec)
})

// ── pool generation ───────────────────────────────────────────────────────────

const COLORS  = ['#4A90D9','#E67E22','#2ECC71','#9B59B6','#E74C3C','#1ABC9C','#F39C12']
const LETTERS = 'abcdefghijklmnopqrstuvwxyz'

function fingerprint(containerCells: Vec3[], pieceNames: string[]): string {
  return containerCells.map(key).sort().join('|') + '::' + [...pieceNames].sort().join('+')
}

function buildPiece(name: string, validSet: Set<string>) {
  const canonical = TETRACUBES[name]
  const seen = new Set<string>()
  const placements = allOrientations(canonical).flatMap(o => placementsOf(o, validSet)).filter(p => {
    const k = shapeKey(p); if (seen.has(k)) return false; seen.add(k); return true
  })
  return { name, canonical, placements } as SolverPiece
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
  const sol = solution.map((p, i) => ({
    id: `${idPfx}${LETTERS[i]}`, color: COLORS[i], cubes: p.cubes,
  }))
  // _fp stored in pool so append runs can skip already-generated puzzles
  const puzzle: any = { _fp: fp, container: spec.container, shapes, solution: sol }
  const isIrregular = spec.validCells.length < spec.container.x * spec.container.y * spec.container.z
  if (isIrregular) puzzle.validCells = spec.validCells
  return puzzle
}

function generatePool(
  difficulty: DifficultyKey,
  containers: ContainerSpec[],
  pieceCount: number,
  pieceNames: string[],
  existing: object[],
  maxPerDiff = 60,
): object[] {
  // Pre-load fingerprints from existing puzzles so we never duplicate
  const seen = new Set<string>(existing.map((p: any) => p._fp).filter(Boolean))
  const pool: object[] = [...existing]
  const idPfx = `d${difficulty[0]}`
  const pieceCombos = combinations(pieceNames, pieceCount)

  for (const spec of containers) {
    for (const names of pieceCombos) {
      if (pool.length >= maxPerDiff) break
      if (names.length * 4 !== spec.total) continue
      const puzzle = tryGenerate(spec, names, idPfx, seen)
      if (puzzle) { pool.push(puzzle); process.stdout.write('.') }
    }
    if (pool.length >= maxPerDiff) break
  }
  return pool
}

// ── main ──────────────────────────────────────────────────────────────────────

const MIN_POOL_SIZE = 30  // warn if any difficulty drops below this

async function main() {
  const outPath = resolve(process.cwd(), 'public/puzzle-pool.json')

  // Load existing pool (append mode — never duplicate)
  let existing: Record<string, object[]> = { easy: [], medium: [], hard: [] }
  if (existsSync(outPath)) {
    try { existing = JSON.parse(readFileSync(outPath, 'utf8')) } catch {}
  }
  const prevCounts = { easy: existing.easy?.length ?? 0, medium: existing.medium?.length ?? 0, hard: existing.hard?.length ?? 0 }

  console.log(`Expanding puzzle pool (existing: ${prevCounts.easy}e / ${prevCounts.medium}m / ${prevCounts.hard}h)...\n`)
  const t0 = Date.now()

  // Easy: free polycubes, 3-piece (12-cell) and 4-piece (16-cell) containers
  process.stdout.write('[EASY] ')
  const easySeen = new Set<string>((existing.easy ?? []).map((p: any) => p._fp).filter(Boolean))
  const easyPool: object[] = [...(existing.easy ?? [])]
  const easyIdPfx = 'de'
  for (const spec of EASY_CONTAINERS) {
    const pieceCount = spec.total === 12 ? 3 : spec.total === 16 ? 4 : null
    if (!pieceCount) continue
    for (const names of combinations(FREE_TETRACUBE_NAMES, pieceCount)) {
      if (easyPool.length >= 60) break
      if (names.length * 4 !== spec.total) continue
      const p = tryGenerate(spec, names, easyIdPfx, easySeen)
      if (p) { easyPool.push(p); process.stdout.write('.') }
    }
    if (easyPool.length >= 60) break
  }
  console.log(` ${easyPool.length} puzzles (+${easyPool.length - prevCounts.easy} new)`)

  // Medium: free polycubes, 5 pieces × 4 cubes = 20 cells
  process.stdout.write('[MEDIUM] ')
  const mediumPool = generatePool('medium', MEDIUM_CONTAINERS, 5, FREE_TETRACUBE_NAMES, existing.medium ?? [], 60)
  console.log(` ${mediumPool.length} puzzles (+${mediumPool.length - prevCounts.medium} new)`)

  // Hard: one-sided polycubes (right-screw ≠ left-screw), 6 pieces × 4 cubes = 24 cells
  process.stdout.write('[HARD] ')
  const hardPool = generatePool('hard', HARD_CONTAINERS, 6, ONESIDED_TETRACUBE_NAMES, existing.hard ?? [], 60)
  console.log(` ${hardPool.length} puzzles (+${hardPool.length - prevCounts.hard} new)`)

  const ms = Date.now() - t0
  console.log(`\nDone in ${(ms/1000).toFixed(1)}s`)

  writeFileSync(outPath, JSON.stringify({ easy: easyPool, medium: mediumPool, hard: hardPool }, null, 2))
  console.log(`Written → ${outPath}`)

  // Warn if any difficulty is running low
  const pools = { easy: easyPool, medium: mediumPool, hard: hardPool }
  for (const [d, pool] of Object.entries(pools)) {
    if (pool.length < MIN_POOL_SIZE) {
      console.warn(`\n⚠  ${d} pool has only ${pool.length} puzzles (target: ${MIN_POOL_SIZE}). Add more containers to src/puzzle-${d}-*.ts to expand it.`)
    }
  }
}

main().catch(err => { console.error(err); process.exit(1) })
