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
 * To add a new family: define container specs at all 6 cell counts, then add one
 * generateDailySets() call in main().
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

interface FamilyContainers {
  c12: ContainerSpec[]
  c16: ContainerSpec[]
  c20: ContainerSpec[]
  c24: ContainerSpec[]
  c28: ContainerSpec[]
  c32: ContainerSpec[]
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

// ── Rectangle family ──────────────────────────────────────────────────────────
//
// Pure rectangular prisms — all axis-permutations of each unique box shape.

const RECT_12: ContainerSpec[] = [  // 3-piece easy (12 cells)
  {x:3,y:2,z:2}, {x:2,y:3,z:2}, {x:2,y:2,z:3},
].map(makeRectSpec)

const RECT_16: ContainerSpec[] = [  // 4-piece easy (16 cells)
  {x:4,y:2,z:2}, {x:2,y:4,z:2}, {x:2,y:2,z:4},
].map(makeRectSpec)

const RECT_20: ContainerSpec[] = [  // 5-piece medium (20 cells)
  {x:5,y:2,z:2}, {x:2,y:5,z:2}, {x:2,y:2,z:5},
].map(makeRectSpec)

const RECT_24: ContainerSpec[] = [  // 6-piece medium (24 cells)
  {x:2,y:3,z:4}, {x:2,y:4,z:3}, {x:3,y:2,z:4},
  {x:3,y:4,z:2}, {x:4,y:2,z:3}, {x:4,y:3,z:2},
  {x:6,y:2,z:2}, {x:2,y:6,z:2}, {x:2,y:2,z:6},
].map(makeRectSpec)

const RECT_28: ContainerSpec[] = [  // 7-piece hard (28 cells)
  {x:7,y:2,z:2}, {x:2,y:7,z:2}, {x:2,y:2,z:7},
].map(makeRectSpec)

const RECT_32: ContainerSpec[] = [  // 8-piece hard (32 cells)
  {x:4,y:4,z:2}, {x:4,y:2,z:4}, {x:2,y:4,z:4},
  {x:8,y:2,z:2}, {x:2,y:8,z:2}, {x:2,y:2,z:8},
].map(makeRectSpec)

// ── L-prism family ────────────────────────────────────────────────────────────
//
// Cross-section: 4-cell L shape in a 3×2 bounding box, extruded d units.
// The L arm (3 cells wide) sits on one row; the foot (1 cell) on the adjacent row.
// Four orientations per cell count give containers with varied aspect ratios.
//
//   Orientation A/B: L in x-y plane, extruded in z → 3×2×d
//   Orientation C:   L in y-z plane, extruded in x → d×2×3  (landscape)
//   Orientation D:   L in x-z plane, extruded in y → 3×d×2  (vertical)
//
// A and B are mirrors (foot on opposite ends of the arm) — same cell count,
// different asymmetry — they look like L and J to the player.

function lPrismSpecs(d: number): ContainerSpec[] {
  const extrude = (n: number, fn: (i: number) => Vec3[]) =>
    Array.from({ length: n }, (_, i) => fn(i)).flat()

  return [
    // A: arm → +x, foot at left (+y at x=0), extrude in z
    {
      container: { x: 3, y: 2, z: d },
      validCells: extrude(d, z => [c(0,0,z), c(1,0,z), c(2,0,z), c(0,1,z)]),
      total: 4 * d, label: `lp-A-d${d}`,
    },
    // B: arm → +x, foot at right (+y at x=2), extrude in z  — mirror of A
    {
      container: { x: 3, y: 2, z: d },
      validCells: extrude(d, z => [c(0,0,z), c(1,0,z), c(2,0,z), c(2,1,z)]),
      total: 4 * d, label: `lp-B-d${d}`,
    },
    // C: arm → +z, foot at near end (+y at z=0), extrude in x
    {
      container: { x: d, y: 2, z: 3 },
      validCells: extrude(d, x => [c(x,0,0), c(x,0,1), c(x,0,2), c(x,1,0)]),
      total: 4 * d, label: `lp-C-d${d}`,
    },
    // D: arm → +x, foot at front (+z at x=0), extrude in y
    {
      container: { x: 3, y: d, z: 2 },
      validCells: extrude(d, y => [c(0,y,0), c(1,y,0), c(2,y,0), c(0,y,1)]),
      total: 4 * d, label: `lp-D-d${d}`,
    },
  ]
}

const LPRISM_12 = lPrismSpecs(3)  // 4×3=12 cells — easy 3-piece
const LPRISM_16 = lPrismSpecs(4)  // 4×4=16 cells — easy 4-piece
const LPRISM_20 = lPrismSpecs(5)  // 4×5=20 cells — medium 5-piece
const LPRISM_24 = lPrismSpecs(6)  // 4×6=24 cells — medium 6-piece
const LPRISM_28 = lPrismSpecs(7)  // 4×7=28 cells — hard 7-piece
const LPRISM_32 = lPrismSpecs(8)  // 4×8=32 cells — hard 8-piece

// ── T-slab family ────────────────────────────────────────────────────────────
//
// A wide rectangular slab (W×2×2, where W = pieceCount + 1) with 4 corner
// cells removed from one face, yielding exactly 4(W-1) = cellCount cells.
// Viewed from one axis the cut face reads as a T: wide arm on the full layer,
// narrower centered strip on the trimmed layer.
//
// Four orientations per cell count give containers with varied aspect ratios.

function tSlabSpecs(cellCount: number): ContainerSpec[] {
  const n = cellCount / 4   // piece count
  const W = n + 1           // slab arm width
  const make = (base: Vec3, excl: Vec3[]): ContainerSpec => {
    const excSet = new Set(excl.map(key))
    const cells  = allCells(base).filter(v => !excSet.has(key(v)))
    return { container: base, validCells: cells, total: cells.length, label: `ts-n${n}` }
  }
  return [
    // A: W×2×2, remove 4 corners of the y=0 face (at x=0 and x=W-1, both z)
    make({ x: W, y: 2, z: 2 }, [c(0,0,0), c(0,0,1), c(W-1,0,0), c(W-1,0,1)]),
    // B: 2×2×W, remove 4 corners of the y=0 face (at z=0 and z=W-1, both x)
    make({ x: 2, y: 2, z: W }, [c(0,0,0), c(1,0,0), c(0,0,W-1), c(1,0,W-1)]),
    // C: W×2×2, remove 4 corners of the z=0 face (at x=0 and x=W-1, both y)
    make({ x: W, y: 2, z: 2 }, [c(0,0,0), c(0,1,0), c(W-1,0,0), c(W-1,1,0)]),
    // D: 2×W×2, remove 4 corners of the x=0 face (at y=0 and y=W-1, both z)
    make({ x: 2, y: W, z: 2 }, [c(0,0,0), c(0,0,1), c(0,W-1,0), c(0,W-1,1)]),
  ]
}

const TSLAB_12 = tSlabSpecs(12)
const TSLAB_16 = tSlabSpecs(16)
const TSLAB_20 = tSlabSpecs(20)
const TSLAB_24 = tSlabSpecs(24)
const TSLAB_28 = tSlabSpecs(28)
const TSLAB_32 = tSlabSpecs(32)

// ── Step-prism family ─────────────────────────────────────────────────────────
//
// Cross-section: 4-cell S-skew (2-step staircase) in a 3×2 bounding box,
// extruded d units deep. Gives exactly 4d cells — hits all 6 cell counts
// at d=3..8. The centre column (x=1) has both y values, giving 3D pieces
// enough room to seat.
//
// Four orientations per cell count:
//   A: S-skew in x-y plane, extruded in z → 3×2×d
//   B: Z-skew (mirror of A) in x-y plane, extruded in z → 3×2×d
//   C: S-skew in x-z plane, extruded in y → 3×d×2
//   D: S-skew in y-z plane, extruded in x → d×3×2

function stepPrismSpecs(d: number): ContainerSpec[] {
  const extrude = (n: number, fn: (i: number) => Vec3[]) =>
    Array.from({ length: n }, (_, i) => fn(i)).flat()

  return [
    // A: S-skew — upper-left + lower-right, extruded in z
    {
      container: { x: 3, y: 2, z: d },
      validCells: extrude(d, z => [c(0,1,z), c(1,1,z), c(1,0,z), c(2,0,z)]),
      total: 4 * d, label: `sp-A-d${d}`,
    },
    // B: Z-skew — lower-left + upper-right, extruded in z (mirror of A)
    {
      container: { x: 3, y: 2, z: d },
      validCells: extrude(d, z => [c(0,0,z), c(1,0,z), c(1,1,z), c(2,1,z)]),
      total: 4 * d, label: `sp-B-d${d}`,
    },
    // C: S-skew in x-z plane, extruded in y
    {
      container: { x: 3, y: d, z: 2 },
      validCells: extrude(d, y => [c(0,y,1), c(1,y,1), c(1,y,0), c(2,y,0)]),
      total: 4 * d, label: `sp-C-d${d}`,
    },
    // D: S-skew in y-z plane, extruded in x
    {
      container: { x: d, y: 3, z: 2 },
      validCells: extrude(d, x => [c(x,0,1), c(x,1,1), c(x,1,0), c(x,2,0)]),
      total: 4 * d, label: `sp-D-d${d}`,
    },
  ]
}

const STEP_12 = stepPrismSpecs(3)
const STEP_16 = stepPrismSpecs(4)
const STEP_20 = stepPrismSpecs(5)
const STEP_24 = stepPrismSpecs(6)
const STEP_28 = stepPrismSpecs(7)
const STEP_32 = stepPrismSpecs(8)

// ── pool generation ───────────────────────────────────────────────────────────

const COLORS  = ['#4A90D9','#E67E22','#2ECC71','#9B59B6','#E74C3C','#1ABC9C','#F39C12','#3498DB']
const LETTERS = 'abcdefghijklmnopqrstuvwxyz'

// Piece ID prefix encodes puzzle tier — readable in pool JSON and debug logs.
function idPfx(cellCount: number): string {
  if (cellCount === 12) return 'e3'
  if (cellCount === 16) return 'e4'
  if (cellCount === 20) return 'm5'
  if (cellCount === 24) return 'm6'
  if (cellCount === 28) return 'h7'
  return 'h8'
}

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
  pfx: string,
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
    id: `${pfx}${LETTERS[i]}`, color: COLORS[i], rotation: [0,0,0], placed: false, cubes: p.canonical,
  }))
  const sol = solution.map(p => {
    const i = solverPieces.findIndex(sp => sp.name === p.name)
    return { id: `${pfx}${LETTERS[i]}`, color: COLORS[i], cubes: p.cubes }
  })
  const puzzle: any = { _fp: fp, container: spec.container, shapes, solution: sol }
  const isIrregular = spec.validCells.length < spec.container.x * spec.container.y * spec.container.z
  if (isIrregular) puzzle.validCells = spec.validCells
  return puzzle
}

function collectPuzzles(
  containers: ContainerSpec[],
  pieceCount: number,
  pieceNames: string[],
  pfx: string,
  seen: Set<string>,
): object[] {
  const puzzles: object[] = []
  const combos = combinations(pieceNames, pieceCount)

  outer:
  for (const spec of containers) {
    for (const names of combos) {
      if (names.length * 4 !== spec.total) continue
      const p = tryGenerate(spec, names, pfx, seen)
      if (p) { puzzles.push(p); process.stdout.write('.') }
      if (puzzles.length >= 999) break outer  // safety cap — no family should need this many
    }
  }
  return puzzles
}

function interleave<T>(a: T[], b: T[]): T[] {
  const result: T[] = []
  const max = Math.max(a.length, b.length)
  for (let i = 0; i < max; i++) {
    if (i < a.length) result.push(a[i])
    if (i < b.length) result.push(b[i])
  }
  return result
}

// ── per-family generation ─────────────────────────────────────────────────────

function generateDailySets(
  familyName: string,
  fc: FamilyContainers,
  seen: Set<string>,
): object[] {
  const row = (label: string, specs: ContainerSpec[], n: number, names: string[]) => {
    process.stdout.write(`  ${label}: `)
    const puzzles = collectPuzzles(specs, n, names, idPfx(n * 4), seen)
    console.log(` ${puzzles.length}`)
    return puzzles
  }

  const easy3 = row('easy   3pc 12-cell', fc.c12, 3, FREE_TETRACUBE_NAMES)
  const easy4 = row('easy   4pc 16-cell', fc.c16, 4, FREE_TETRACUBE_NAMES)
  const med5  = row('medium 5pc 20-cell', fc.c20, 5, FREE_TETRACUBE_NAMES)
  const med6  = row('medium 6pc 24-cell', fc.c24, 6, FREE_TETRACUBE_NAMES)
  const hard7 = row('hard   7pc 28-cell', fc.c28, 7, ONESIDED_TETRACUBE_NAMES)
  const hard8 = row('hard   8pc 32-cell', fc.c32, 8, ONESIDED_TETRACUBE_NAMES)

  const easyAll = interleave(easy3, easy4)
  const medAll  = interleave(med5, med6)
  const hardAll = interleave(hard7, hard8)
  const count   = Math.min(easyAll.length, medAll.length, hardAll.length)

  console.log(`  → ${count} daily sets  (easy ${easyAll.length} / med ${medAll.length} / hard ${hardAll.length})`)
  return Array.from({ length: count }, (_, i) => ({
    family: familyName, easy: easyAll[i], medium: medAll[i], hard: hardAll[i],
  }))
}

// ── main ──────────────────────────────────────────────────────────────────────

async function main() {
  const outPath = resolve(process.cwd(), 'public/puzzle-pool.json')
  const daily: object[] = []
  const seen  = new Set<string>()
  const t0    = Date.now()

  console.log('Rectangle family:')
  daily.push(...generateDailySets('rectangle', {
    c12: RECT_12, c16: RECT_16, c20: RECT_20,
    c24: RECT_24, c28: RECT_28, c32: RECT_32,
  }, seen))

  console.log('\nL-prism family:')
  daily.push(...generateDailySets('l-prism', {
    c12: LPRISM_12, c16: LPRISM_16, c20: LPRISM_20,
    c24: LPRISM_24, c28: LPRISM_28, c32: LPRISM_32,
  }, seen))

  console.log('\nStep-prism family:')
  daily.push(...generateDailySets('step-prism', {
    c12: STEP_12, c16: STEP_16, c20: STEP_20,
    c24: STEP_24, c28: STEP_28, c32: STEP_32,
  }, seen))

  console.log('\nT-slab family:')
  daily.push(...generateDailySets('t-slab', {
    c12: TSLAB_12, c16: TSLAB_16, c20: TSLAB_20,
    c24: TSLAB_24, c28: TSLAB_28, c32: TSLAB_32,
  }, seen))

  const ms = Date.now() - t0
  console.log(`\n${daily.length} total daily sets in ${(ms / 1000).toFixed(1)}s`)
  writeFileSync(outPath, JSON.stringify({ daily }, null, 2))
  console.log(`Written → ${outPath}`)

  if (daily.length < 30) {
    console.warn(`\n⚠  Only ${daily.length} daily sets — add more container families to expand the pool.`)
  }
}

main().catch(err => { console.error(err); process.exit(1) })
