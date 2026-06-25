/**
 * Daily puzzle generator — partition approach
 * Run:  npx vite-node scripts/generate-daily-puzzles.ts [YYYY-MM-DD]
 * Date defaults to tomorrow if omitted.
 * Writes public/daily-puzzles.json.
 *
 * Rather than asking Claude to invent pieces that happen to fit, we give it
 * an existing validated container and ask it to PARTITION the cells into N
 * groups.  Each group is a placed piece — a solution is guaranteed by
 * construction.  No backtracking solver needed.
 *
 * Container sources:
 *   easy  — simple rectangular boxes (hardcoded)
 *   medium — moderately irregular containers from the static puzzle library
 *   hard  — the most complex irregular containers from the library (28 cells)
 *            with more groups than medium (7 vs 5–6) → harder even in the
 *            same container shapes
 */

import Anthropic from '@anthropic-ai/sdk'
import { writeFileSync } from 'fs'
import { resolve } from 'path'
import { PUZZLE_LIBRARY } from '../src/puzzle'

// ── types ─────────────────────────────────────────────────────────────────────

type Vec3 = { x: number; y: number; z: number }
type DifficultyKey = 'easy' | 'medium' | 'hard'

interface ContainerSpec {
  container: Vec3
  validCells: Vec3[]
  total: number
  irregular: boolean   // true = include validCells in output
}

// ── helpers ───────────────────────────────────────────────────────────────────

const key = (v: Vec3) => `${v.x},${v.y},${v.z}`

function normalize(cubes: Vec3[]): Vec3[] {
  const minX = Math.min(...cubes.map(p => p.x))
  const minY = Math.min(...cubes.map(p => p.y))
  const minZ = Math.min(...cubes.map(p => p.z))
  return cubes.map(p => ({ x: p.x - minX, y: p.y - minY, z: p.z - minZ }))
}

function shapeKey(cubes: Vec3[]): string { return cubes.map(key).sort().join('|') }

function rotateX(v: Vec3): Vec3 { return { x: v.x,  y: -v.z, z:  v.y } }
function rotateY(v: Vec3): Vec3 { return { x: v.z,  y:  v.y, z: -v.x } }
function rotateZ(v: Vec3): Vec3 { return { x: -v.y, y:  v.x, z:  v.z } }

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

// Canonical form: the lexicographically smallest shapeKey across all rotations.
// Two pieces with the same canonicalKey are the same polycube shape.
function canonicalKey(cubes: Vec3[]): string {
  return allOrientations(normalize(cubes)).map(o => shapeKey(normalize(o))).sort()[0]
}

function allContainerCells(container: Vec3): Vec3[] {
  const cells: Vec3[] = []
  for (let x = 0; x < container.x; x++)
    for (let y = 0; y < container.y; y++)
      for (let z = 0; z < container.z; z++)
        cells.push({ x, y, z })
  return cells
}

function isConnected(cubes: Vec3[]): boolean {
  if (cubes.length === 0) return true
  const remaining = new Set(cubes.map(key))
  const queue = [cubes[0]]
  remaining.delete(key(cubes[0]))
  const deltas = [
    {x:1,y:0,z:0},{x:-1,y:0,z:0},{x:0,y:1,z:0},
    {x:0,y:-1,z:0},{x:0,y:0,z:1},{x:0,y:0,z:-1},
  ]
  while (queue.length > 0) {
    const cur = queue.pop()!
    for (const d of deltas) {
      const nb = { x: cur.x+d.x, y: cur.y+d.y, z: cur.z+d.z }
      if (remaining.has(key(nb))) { remaining.delete(key(nb)); queue.push(nb) }
    }
  }
  return remaining.size === 0
}

function extractJSON(text: string): any {
  const start = text.indexOf('{')
  if (start === -1) throw new Error('No JSON object found')
  let depth = 0, inStr = false, esc = false
  for (let i = start; i < text.length; i++) {
    const ch = text[i]
    if (esc)              { esc = false; continue }
    if (ch === '\\' && inStr) { esc = true; continue }
    if (ch === '"')       { inStr = !inStr; continue }
    if (inStr)            continue
    if (ch === '{') depth++
    if (ch === '}') { depth--; if (depth === 0) return JSON.parse(text.slice(start, i + 1)) }
  }
  throw new Error('No complete JSON object found')
}

// ── container library ─────────────────────────────────────────────────────────

function makeSpec(container: Vec3, validCells?: Vec3[]): ContainerSpec {
  const cells = validCells ?? allContainerCells(container)
  const boxTotal = container.x * container.y * container.z
  return {
    container,
    validCells: cells,
    total: cells.length,
    irregular: cells.length < boxTotal,
  }
}

function groupByTotal(specs: ContainerSpec[]): Map<number, ContainerSpec[]> {
  const m = new Map<number, ContainerSpec[]>()
  for (const s of specs) {
    if (!m.has(s.total)) m.set(s.total, [])
    m.get(s.total)!.push(s)
  }
  return m
}

// Easy: simple rectangular boxes
const EASY_CONTAINERS: ContainerSpec[] = [
  makeSpec({x:3,y:2,z:2}),   // 12 cells
  makeSpec({x:2,y:2,z:3}),   // 12 cells
  makeSpec({x:4,y:2,z:2}),   // 16 cells
  makeSpec({x:2,y:2,z:4}),   // 16 cells
]

// Medium and Hard: pull container geometry from the static library
const MEDIUM_SPECS: ContainerSpec[] = PUZZLE_LIBRARY.medium.map(factory => {
  const p = factory()
  return makeSpec(p.container, p.validCells)
})

const EASY_BY_TOTAL   = groupByTotal(EASY_CONTAINERS)
const MEDIUM_BY_TOTAL = groupByTotal(MEDIUM_SPECS.filter(s => s.total === 20))  // 20-cell containers only
const HARD_BY_TOTAL   = groupByTotal(MEDIUM_SPECS.filter(s => s.total === 24))  // 24-cell containers (most complex)

function pickContainer(difficulty: DifficultyKey, total: number): ContainerSpec | null {
  const map = difficulty === 'easy' ? EASY_BY_TOTAL
            : difficulty === 'medium' ? MEDIUM_BY_TOTAL
            : HARD_BY_TOTAL
  const options = map.get(total)
  if (!options?.length) return null
  return options[Math.floor(Math.random() * options.length)]
}

// ── piece configs ─────────────────────────────────────────────────────────────

const PIECE_CONFIGS: Record<DifficultyKey, Array<{pieces: number; cubesEach: number}>> = {
  easy: [
    { pieces: 3, cubesEach: 4 },   // 12 cells, rectangular
    { pieces: 4, cubesEach: 3 },   // 12 cells, rectangular
    { pieces: 4, cubesEach: 4 },   // 16 cells, rectangular
    { pieces: 3, cubesEach: 4 },   // 12 cells (repeat for variety)
  ],
  medium: [
    { pieces: 5, cubesEach: 4 },   // 20 cells, irregular (medium 1, 4, 5)
    { pieces: 5, cubesEach: 4 },
    { pieces: 5, cubesEach: 4 },
    { pieces: 5, cubesEach: 4 },
  ],
  // Hard uses the same 24-cell containers as medium but Sonnet partitions them
  // into 6 distinct pieces vs medium's 5-6 — the container complexity (not
  // piece count) is the primary difficulty driver for now.
  hard: [
    { pieces: 6, cubesEach: 4 },   // 24 cells, complex irregular containers
    { pieces: 6, cubesEach: 4 },
    { pieces: 6, cubesEach: 4 },
    { pieces: 6, cubesEach: 4 },
  ],
}

// ── prompts ───────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You partition 3D grids into connected piece groups for polycube puzzles.

FACE-ADJACENCY: Two cells are face-adjacent ONLY when they differ by exactly 1 in exactly one axis:
  VALID:   (0,0,0)↔(1,0,0)  (0,0,0)↔(0,1,0)  (0,0,0)↔(0,0,1)
  INVALID: (0,0,0)↔(1,1,0)  (0,0,0)↔(1,0,1)  ← diagonal, not allowed

OUTPUT: Valid JSON only — no prose, nothing after the closing brace.`

function buildPrompt(
  N: number, M: number, cells: Vec3[], attempt: number,
): string {
  return `Partition ALL ${cells.length} cells below into exactly ${N} groups of ${M} cells each.

CELLS:
${JSON.stringify(cells)}

RULES:
1. Every cell must appear in exactly one group
2. Each group must have exactly ${M} cells
3. Each group must be face-connected — adjacent cells differ by 1 in exactly one axis only (no diagonals)
4. ALL ${N} groups must be DISTINCT polycube shapes — no two groups may be identical, even after rotation
5. Create VARIED shapes: mix L-shapes, T-shapes, S-shapes, 3D pieces spanning all three axes, and asymmetric forms. Avoid repeating 2×2 squares or straight bars.
${attempt > 0 ? '6. Previous attempt was rejected for duplicate or invalid groups. Use a completely different partition with maximum shape variety.' : ''}

Return JSON only:
{"groups": [[{"x":0,"y":0,"z":0}, ...], ...]}`
}

// ── generation ────────────────────────────────────────────────────────────────

const COLORS  = ['#4A90D9','#E67E22','#2ECC71','#9B59B6','#E74C3C','#1ABC9C','#F39C12']
const LETTERS = 'abcdefghijklmnopqrstuvwxyz'

async function generatePuzzle(
  client: Anthropic,
  difficulty: DifficultyKey,
  date: string,
): Promise<object> {
  const MAX_ATTEMPTS = 10
  const configs = PIECE_CONFIGS[difficulty]

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const cfg = configs[attempt % configs.length]
    const total = cfg.pieces * cfg.cubesEach

    const spec = pickContainer(difficulty, total)
    if (!spec) { console.log(`  no container for ${total} cells`); continue }

    process.stdout.write(`  attempt ${attempt+1}/${MAX_ATTEMPTS} (${cfg.pieces}p×${cfg.cubesEach}c=${total}) ... `)

    // Call Claude
    let raw: any
    try {
      const model = 'claude-sonnet-4-6'
      const msg = await client.messages.create({
        model,
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: buildPrompt(cfg.pieces, cfg.cubesEach, spec.validCells, attempt) }],
      })
      raw = extractJSON(msg.content[0].type === 'text' ? msg.content[0].text : '')
    } catch (err) { console.log(`parse error: ${err}`); continue }

    // Parse groups
    const groups: Vec3[][] | undefined = raw.groups?.map(
      (g: any[]) => g.map((c: any) => ({ x: Number(c.x), y: Number(c.y), z: Number(c.z) }))
    )

    if (!groups || groups.length !== cfg.pieces) {
      console.log(`wrong group count: ${groups?.length} (expected ${cfg.pieces})`)
      continue
    }

    const wrongSize = groups.find(g => g.length !== cfg.cubesEach)
    if (wrongSize) { console.log(`wrong group size: ${wrongSize.length}`); continue }

    // All container cells covered, no cells outside container, no duplicates
    const expected = new Set(spec.validCells.map(key))
    const allFlat  = groups.flat().map(key)
    const covered  = new Set(allFlat)
    const outsideContainer = allFlat.filter(k => !expected.has(k))
    const hasDuplicateCells = allFlat.length !== covered.size
    const missingCells = [...expected].filter(k => !covered.has(k))
    if (outsideContainer.length > 0) {
      console.log(`${outsideContainer.length} cell(s) outside container`); continue
    }
    if (hasDuplicateCells) {
      console.log('duplicate cells across groups'); continue
    }
    if (missingCells.length > 0) {
      console.log(`${missingCells.length} cell(s) not covered`); continue
    }

    // All groups connected
    const disconnected = groups.find(g => !isConnected(g))
    if (disconnected) { console.log('group not connected'); continue }

    // All groups must be distinct shapes (no two identical polycubes)
    const keys = groups.map(g => canonicalKey(g))
    const uniqueKeys = new Set(keys)
    if (uniqueKeys.size < groups.length) {
      const dupeCount = groups.length - uniqueKeys.size
      console.log(`${dupeCount} duplicate piece shape(s) — retry`)
      continue
    }

    console.log('✓')

    // Build puzzle — groups ARE the solution; normalize each to get tray shapes
    const idPfx = `d${difficulty[0]}`
    const shapes = groups.map((g, i) => ({
      id: `${idPfx}${LETTERS[i]}`,
      color: COLORS[i % COLORS.length],
      rotation: [0, 0, 0],
      placed: false,
      cubes: normalize(g),
    }))
    const solution = groups.map((g, i) => ({
      id: `${idPfx}${LETTERS[i]}`,
      color: COLORS[i % COLORS.length],
      cubes: g,
    }))

    const puzzle: any = { container: spec.container, shapes, solution }
    if (spec.irregular) puzzle.validCells = spec.validCells
    return puzzle
  }

  throw new Error(`Could not generate valid ${difficulty} puzzle in ${MAX_ATTEMPTS} attempts`)
}

// ── main ──────────────────────────────────────────────────────────────────────

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY is not set'); process.exit(1)
  }

  let date: string
  if (process.argv[2]) {
    date = process.argv[2]
  } else {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    date = d.toISOString().slice(0, 10)
  }

  console.log(`Generating puzzles for ${date}\n`)

  const client = new Anthropic()
  const result: Record<string, any> = { date }
  let anyFailed = false

  for (const difficulty of ['easy', 'medium', 'hard'] as DifficultyKey[]) {
    console.log(`[${difficulty.toUpperCase()}]`)
    try {
      result[difficulty] = await generatePuzzle(client, difficulty, date)
    } catch (err) {
      console.error(`  FAILED: ${err}`)
      result[difficulty] = null
      anyFailed = true
    }
    console.log()
  }

  const outPath = resolve(process.cwd(), 'public/daily-puzzles.json')
  writeFileSync(outPath, JSON.stringify(result, null, 2))
  console.log(`Written → ${outPath}`)

  if (anyFailed) {
    console.warn('One or more difficulties failed — static library fallback will be used.')
    process.exit(1)
  }
}

main().catch(err => { console.error(err); process.exit(1) })
