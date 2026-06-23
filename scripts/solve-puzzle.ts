/**
 * Polycube puzzle solver — run with: npx vite-node scripts/solve-puzzle.ts
 *
 * Edit CONFIG at the bottom, then run to get shapes[] and solution[] code
 * ready to paste into a puzzle file.
 *
 * Workflow for a new puzzle:
 *   1. Pick a container shape and list your pieces in CONFIG
 *   2. Run: npx vite-node scripts/solve-puzzle.ts
 *   3. Paste the printed code into the new puzzle-medium-N.ts file
 *   4. Validate: npx vite-node scripts/validate-puzzles.ts -- medium N
 */

// ── types ─────────────────────────────────────────────────────────────────────

type Vec3 = { x: number; y: number; z: number }
const c = (x: number, y: number, z: number): Vec3 => ({ x, y, z })
const key = (v: Vec3) => `${v.x},${v.y},${v.z}`

// ── rotation helpers (same as puzzle.ts) ─────────────────────────────────────

function rotateX(v: Vec3): Vec3 { return { x: v.x,  y: -v.z, z:  v.y } }
function rotateY(v: Vec3): Vec3 { return { x: v.z,  y:  v.y, z: -v.x } }
function rotateZ(v: Vec3): Vec3 { return { x: -v.y, y:  v.x, z:  v.z } }

function normalize(cubes: Vec3[]): Vec3[] {
  const minX = Math.min(...cubes.map(p => p.x))
  const minY = Math.min(...cubes.map(p => p.y))
  const minZ = Math.min(...cubes.map(p => p.z))
  return cubes.map(p => ({ x: p.x - minX, y: p.y - minY, z: p.z - minZ }))
}

function shapeKey(cubes: Vec3[]): string {
  return cubes.map(key).sort().join('|')
}

// All unique orientations of a piece (up to 24 under rotation)
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

// All valid placements of one orientation within the container
function placementsOf(orientation: Vec3[], validSet: Set<string>): Vec3[][] {
  const seen = new Set<string>()
  const result: Vec3[][] = []
  for (const p of orientation) {
    for (const cell of validSet) {
      const [cx, cy, cz] = cell.split(',').map(Number)
      const dx = cx - p.x, dy = cy - p.y, dz = cz - p.z
      const placed = orientation.map(v => ({ x: v.x + dx, y: v.y + dy, z: v.z + dz }))
      if (placed.every(v => validSet.has(key(v)))) {
        const k = shapeKey(placed)
        if (!seen.has(k)) { seen.add(k); result.push(placed) }
      }
    }
  }
  return result
}

// ── solver ────────────────────────────────────────────────────────────────────

interface Piece {
  name: string
  canonical: Vec3[]   // tray form (canonical orientation for shapes[])
  placements: Vec3[][]  // all valid placed positions in this container
}

interface PlacedPiece {
  name: string
  canonical: Vec3[]
  cubes: Vec3[]
}

function solve(pieces: Piece[], validCells: Vec3[], maxSolutions: number): PlacedPiece[][] {
  const cellKeys = validCells.map(key)
  const solutions: PlacedPiece[][] = []
  const used = new Set<string>()
  const placed: PlacedPiece[] = []

  // Build a lookup: cell key → which placements of each piece cover it
  // (computed lazily in the inner loop)

  function firstUncovered(): string | null {
    for (const k of cellKeys) if (!used.has(k)) return k
    return null
  }

  function backtrack(remaining: number[]) {
    if (solutions.length >= maxSolutions) return
    const target = firstUncovered()
    if (!target) {
      solutions.push(placed.map(p => ({ ...p, cubes: p.cubes.map(v => ({ ...v })) })))
      return
    }
    for (let i = 0; i < remaining.length; i++) {
      const pi = remaining[i]
      const piece = pieces[pi]
      for (const placement of piece.placements) {
        // Only try placements that cover the first uncovered cell (key pruning)
        if (!placement.some(v => key(v) === target)) continue
        // Skip if any cell already used
        if (placement.some(v => used.has(key(v)))) continue
        // Place
        for (const v of placement) used.add(key(v))
        placed.push({ name: piece.name, canonical: piece.canonical, cubes: placement })
        const next = [...remaining.slice(0, i), ...remaining.slice(i + 1)]
        backtrack(next)
        // Undo
        placed.pop()
        for (const v of placement) used.delete(key(v))
        if (solutions.length >= maxSolutions) return
      }
    }
  }

  backtrack(pieces.map((_, i) => i))
  return solutions
}

// ── piece library ─────────────────────────────────────────────────────────────

// ── Easy / Medium pieces (free tetracubes — reflections allowed) ──────────────
// Under "free" rules, L=J, S=Z, and right-screw=left-screw (7 distinct total).
// Under "rotations only" (hard mode), right-screw ≠ left-screw (8 distinct total).
const PIECE_DEFS: Record<string, Vec3[]> = {
  'I-bar':        [c(0,0,0),c(1,0,0),c(2,0,0),c(3,0,0)],
  'O-square':     [c(0,0,0),c(1,0,0),c(0,1,0),c(1,1,0)],
  'T-tetromino':  [c(0,0,0),c(1,0,0),c(2,0,0),c(1,1,0)],
  'L-tetromino':  [c(0,0,0),c(1,0,0),c(2,0,0),c(2,1,0)],
  'S-skew':       [c(0,0,0),c(1,0,0),c(1,1,0),c(2,1,0)],
  'right-screw':  [c(0,0,0),c(1,0,0),c(1,1,0),c(1,1,1)],
  'left-screw':   [c(0,0,0),c(1,0,0),c(1,0,1),c(1,1,1)],  // chiral mirror of right-screw (hard only)
  'branch':       [c(0,0,0),c(1,0,0),c(0,1,0),c(0,0,1)],
}

// ── output ────────────────────────────────────────────────────────────────────

const COLORS_EXPR = ['COLORS[0]','COLORS[1]','COLORS[2]','COLORS[3]',
                     'COLORS[4]','COLORS[5]','COLORS[6]']
const LETTERS = 'abcdefghijklmnopqrstuvwxyz'

function fmtCubes(cubes: Vec3[]): string {
  return cubes.map(v => `c(${v.x},${v.y},${v.z})`).join(',')
}

function printSolution(solution: PlacedPiece[], idPrefix: string) {
  console.log('\n  // ── shapes ─────────────────────────────────────────────────')
  console.log('  const shapes: PuzzleShape[] = [')
  solution.forEach((p, i) => {
    const id = `${idPrefix}${LETTERS[i]}`
    console.log(`    { id: '${id}', color: ${COLORS_EXPR[i]}, rotation: [0,0,0], placed: false,`)
    console.log(`      cubes: [${fmtCubes(p.canonical)}] },`)
  })
  console.log('  ]')

  console.log('\n  // ── solution ────────────────────────────────────────────────')
  console.log('  const solution: PlacedShape[] = [')
  solution.forEach((p, i) => {
    const id = `${idPrefix}${LETTERS[i]}`
    console.log(`    { id: '${id}', color: ${COLORS_EXPR[i]}, cubes: [${fmtCubes(p.cubes)}] },`)
  })
  console.log('  ]')
}

// ── CONFIG — edit this for each new puzzle ────────────────────────────────────

const CONFIG = {
  // Prefix for piece IDs  e.g. 'p10' → p10a, p10b, …
  idPrefix: 'p10',

  // Pieces to use — must be keys of PIECE_DEFS; total cells must equal validCells.length
  pieceNames: [
    'I-bar',
    'O-square',
    'T-tetromino',
    'L-tetromino',
    'S-skew',
    'right-screw',
    'branch',
  ] as (keyof typeof PIECE_DEFS)[],

  // Container valid cells — define the shape here
  validCells: [
    // Staircase prism — 4×3×4 bounding box
    // Side profile (any z slice): full row at y=0, half at y=1, single at y=2
    // y=0: full 4×4 = 16 cells
    c(0,0,0),c(1,0,0),c(2,0,0),c(3,0,0),
    c(0,0,1),c(1,0,1),c(2,0,1),c(3,0,1),
    c(0,0,2),c(1,0,2),c(2,0,2),c(3,0,2),
    c(0,0,3),c(1,0,3),c(2,0,3),c(3,0,3),
    // y=1: x=0..1 only = 8 cells
    c(0,1,0),c(1,1,0),
    c(0,1,1),c(1,1,1),
    c(0,1,2),c(1,1,2),
    c(0,1,3),c(1,1,3),
    // y=2: x=0 only = 4 cells
    c(0,2,0),c(0,2,1),c(0,2,2),c(0,2,3),
  ],

  // 1 = find first solution only; set higher to count/list multiple solutions
  maxSolutions: 1,
}

// ── run ───────────────────────────────────────────────────────────────────────

const validSet = new Set(CONFIG.validCells.map(key))

const totalPieceCells = CONFIG.pieceNames.reduce((n, name) => n + PIECE_DEFS[name].length, 0)
if (totalPieceCells !== CONFIG.validCells.length) {
  console.error(`ERROR: pieces total ${totalPieceCells} cells but container has ${CONFIG.validCells.length}`)
  process.exit(1)
}

console.log(`Pieces : ${CONFIG.pieceNames.join(', ')}`)
console.log(`Container: ${CONFIG.validCells.length} cells`)

// Precompute all valid placements per piece
const pieces: Piece[] = CONFIG.pieceNames.map(name => {
  const canonical = PIECE_DEFS[name]
  const seen = new Set<string>()
  const allP = allOrientations(canonical).flatMap(o => placementsOf(o, validSet))
  const unique = allP.filter(p => {
    const k = shapeKey(p); if (seen.has(k)) return false; seen.add(k); return true
  })
  return { name, canonical, placements: unique }
})

const counts = pieces.map(p => `${p.name}:${p.placements.length}`).join('  ')
console.log(`Placements: ${counts}`)
console.log(`Searching for up to ${CONFIG.maxSolutions} solution(s)...\n`)

const t0 = Date.now()
const solutions = solve(pieces, CONFIG.validCells, CONFIG.maxSolutions)
const ms = Date.now() - t0

if (solutions.length === 0) {
  console.log(`No solution found (${ms}ms). Check container shape and piece list.`)
  process.exit(1)
}

const plural = solutions.length === 1 ? 'solution' : 'solutions'
const note = solutions.length >= CONFIG.maxSolutions ? ` (≥${CONFIG.maxSolutions} exist)` : ''
console.log(`Found ${solutions.length} ${plural}${note} in ${ms}ms`)
console.log('\nPiece assignments:')
solutions[0].forEach((p, i) => console.log(`  ${CONFIG.idPrefix}${LETTERS[i]}  ${p.name}`))
printSolution(solutions[0], CONFIG.idPrefix)
