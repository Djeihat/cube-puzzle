/**
 * Daily puzzle generator
 * Run:  npx vite-node scripts/generate-daily-puzzles.ts [YYYY-MM-DD]
 * Date defaults to tomorrow if omitted.
 * Writes public/daily-puzzles.json.
 */

import Anthropic from '@anthropic-ai/sdk'
import { writeFileSync } from 'fs'
import { resolve } from 'path'

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

function shapeKey(cubes: Vec3[]): string {
  return cubes.map(key).sort().join('|')
}

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
      const placed = orientation.map(v => ({ x: v.x + dx, y: v.y + dy, z: v.z + dz }))
      if (placed.every(v => validSet.has(key(v)))) {
        const k = shapeKey(placed)
        if (!seen.has(k)) { seen.add(k); result.push(placed) }
      }
    }
  }
  return result
}

interface SolverPiece { name: string; canonical: Vec3[]; placements: Vec3[][] }
interface PlacedPiece { name: string; canonical: Vec3[]; cubes: Vec3[] }

function solve(pieces: SolverPiece[], validCells: Vec3[], maxSolutions: number): PlacedPiece[][] {
  const cellKeys = validCells.map(key)
  const solutions: PlacedPiece[][] = []
  const used = new Set<string>()
  const placed: PlacedPiece[] = []

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
        if (!placement.some(v => key(v) === target)) continue
        if (placement.some(v => used.has(key(v)))) continue
        for (const v of placement) used.add(key(v))
        placed.push({ name: piece.name, canonical: piece.canonical, cubes: placement })
        backtrack([...remaining.slice(0, i), ...remaining.slice(i + 1)])
        placed.pop()
        for (const v of placement) used.delete(key(v))
        if (solutions.length >= maxSolutions) return
      }
    }
  }

  backtrack(pieces.map((_, i) => i))
  return solutions
}

// ── helpers ───────────────────────────────────────────────────────────────────

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
    { x:1,y:0,z:0},{x:-1,y:0,z:0},{x:0,y:1,z:0},
    { x:0,y:-1,z:0},{x:0,y:0,z:1},{x:0,y:0,z:-1},
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
  // Find the first '{' then walk forward counting braces to find the matching '}'.
  // This correctly handles trailing prose or extra {} that a model may append.
  const start = text.indexOf('{')
  if (start === -1) throw new Error('No JSON object found in response')

  let depth = 0
  let inString = false
  let escape = false

  for (let i = start; i < text.length; i++) {
    const ch = text[i]
    if (escape)              { escape = false; continue }
    if (ch === '\\' && inString) { escape = true;  continue }
    if (ch === '"')          { inString = !inString; continue }
    if (inString)            continue
    if (ch === '{') depth++
    if (ch === '}') { depth--; if (depth === 0) return JSON.parse(text.slice(start, i + 1)) }
  }
  throw new Error('No complete JSON object found in response')
}

// ── output formatting ─────────────────────────────────────────────────────────

const COLORS = ['#4A90D9','#E67E22','#2ECC71','#9B59B6','#E74C3C','#1ABC9C','#F39C12']
const LETTERS = 'abcdefghijklmnopqrstuvwxyz'

// ── configs ───────────────────────────────────────────────────────────────────
// Pre-determined (pieceCount × cubesEach) combos remove all arithmetic from
// Claude. We tell it exactly how many cubes per piece; it only needs to design
// shapes, not verify sums.

const PIECE_CONFIGS: Record<DifficultyKey, Array<{ pieces: number; cubesEach: number }>> = {
  easy:   [
    { pieces: 3, cubesEach: 4 },   // 12 cells
    { pieces: 4, cubesEach: 3 },   // 12 cells
    { pieces: 4, cubesEach: 4 },   // 16 cells
    { pieces: 3, cubesEach: 5 },   // 15 cells
  ],
  medium: [
    { pieces: 5, cubesEach: 4 },   // 20 cells
    { pieces: 6, cubesEach: 4 },   // 24 cells
    { pieces: 5, cubesEach: 5 },   // 25 cells
    { pieces: 6, cubesEach: 3 },   // 18 cells
  ],
  hard:   [
    { pieces: 7, cubesEach: 4 },   // 28 cells
    { pieces: 8, cubesEach: 4 },   // 32 cells
    { pieces: 7, cubesEach: 5 },   // 35 cells
  ],
}

// ── prompts ───────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You design 3D polycube puzzles where pieces pack perfectly into a container.

COORDINATE SYSTEM: Integer {x, y, z} coordinates.

FACE-ADJACENCY — two cells are face-adjacent ONLY if they differ by exactly 1 in exactly one axis:
  VALID:   (0,0,0)↔(1,0,0)  (0,0,0)↔(0,1,0)  (0,0,0)↔(0,0,1)
  INVALID: (0,0,0)↔(1,1,0)  (0,0,0)↔(1,0,1)  (0,0,0)↔(1,1,1)  ← diagonal, not allowed

RULES:
1. Each piece is a connected set of face-adjacent cubes (no diagonal connections).
2. Normalize each piece: shift so min(x) = min(y) = min(z) = 0.
3. The container must be at least 2 cells wide in every axis (x ≥ 2, y ≥ 2, z ≥ 2).
4. All pieces must be distinct shapes (no two pieces look the same after rotation/reflection).

OUTPUT: Valid JSON only — no prose, no markdown fences, nothing after the closing brace.`

function buildUserPrompt(
  difficulty: DifficultyKey,
  date: string,
  attempt: number,
  cfg: { pieces: number; cubesEach: number },
): string {
  const total = cfg.pieces * cfg.cubesEach
  // Medium uses irregular containers (18–25 cells — manageable to enumerate).
  // Easy and Hard use rectangular boxes — Hard's 28–35 cell count is too large
  // for the model to enumerate reliably as validCells.
  const useIrregular = difficulty === 'medium'

  return `Design a ${difficulty.toUpperCase()} polycube puzzle for ${date}${attempt > 0 ? ` (attempt ${attempt + 1} — use a completely different design)` : ''}.

EXACT REQUIREMENTS (do not change these numbers):
- Pieces: exactly ${cfg.pieces} pieces
- Cubes per piece: exactly ${cfg.cubesEach} cubes each
- Container cells: exactly ${total}  (= ${cfg.pieces} × ${cfg.cubesEach})

CONTAINER: ${useIrregular
    ? `an irregular shape — include "validCells" listing every valid cell.
Remove some cells from a corner or edge of a rectangular box to create an interesting shape.`
    : `a rectangular box whose x×y×z = ${total} exactly — omit "validCells".
Choose dimensions so every axis is at least 2 (e.g. for ${total} cells: ${suggestDims(total)}).`}

FORMAT:
{
  "container": {"x": N, "y": N, "z": N},${useIrregular ? '\n  "validCells": [{"x":0,"y":0,"z":0}, ...],' : ''}
  "pieces": [
    {"name": "descriptive-name", "cubes": [{"x":0,"y":0,"z":0}, ...]},
    ... (exactly ${cfg.pieces} pieces, each with exactly ${cfg.cubesEach} cubes)
  ]
}

CHECKLIST:
✓ Exactly ${cfg.pieces} pieces in the "pieces" array
✓ Each piece has exactly ${cfg.cubesEach} cubes — count every cube
✓ ${useIrregular ? `"validCells" has exactly ${total} entries — count them` : `container x×y×z = ${total}`}
✓ Every pair of adjacent cubes in a piece differs by 1 in exactly one axis (no diagonals)
✓ Each piece is normalised: min(x) = min(y) = min(z) = 0
✓ All piece shapes are distinct`
}

function suggestDims(total: number): string {
  // Return a few sensible rectangular dimensions for guidance
  const suggestions: string[] = []
  for (let x = 2; x <= total / 4; x++)
    for (let y = 2; y <= total / (x * 2); y++) {
      const z = total / (x * y)
      if (Number.isInteger(z) && z >= 2) suggestions.push(`${x}×${y}×${z}`)
      if (suggestions.length >= 3) return suggestions.join(' or ')
    }
  return suggestions.join(' or ') || `${total}×1×1 (too thin — pick better)`
}

// ── generation ────────────────────────────────────────────────────────────────

async function generatePuzzle(
  client: Anthropic,
  difficulty: DifficultyKey,
  date: string,
): Promise<object> {
  const MAX_ATTEMPTS = difficulty === 'hard' ? 8 : 6
  const configs = PIECE_CONFIGS[difficulty]

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    // Rotate through configs so each retry tries a different piece/cube combo
    const cfg = configs[attempt % configs.length]
    const expectedTotal = cfg.pieces * cfg.cubesEach

    process.stdout.write(`  attempt ${attempt + 1}/${MAX_ATTEMPTS} (${cfg.pieces}p×${cfg.cubesEach}c=${expectedTotal}) ... `)

    // Call Claude
    let raw: any
    try {
      const msg = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: buildUserPrompt(difficulty, date, attempt, cfg) }],
      })
      raw = extractJSON(msg.content[0].type === 'text' ? msg.content[0].text : '')
    } catch (err) {
      console.log(`parse error: ${err}`)
      continue
    }

    // Build validCells
    const validCells: Vec3[] = raw.validCells
      ? raw.validCells.map((v: any) => ({ x: v.x, y: v.y, z: v.z }))
      : allContainerCells({ x: raw.container.x, y: raw.container.y, z: raw.container.z })

    const validSet = new Set(validCells.map(key))

    // Validate: container cell count must match what we asked for
    if (validCells.length !== expectedTotal) {
      console.log(`container has ${validCells.length} cells, expected ${expectedTotal}`)
      continue
    }

    // Validate: piece count and per-piece cube count
    const pieces = raw.pieces as any[]
    if (pieces.length !== cfg.pieces) {
      console.log(`got ${pieces.length} pieces, expected ${cfg.pieces}`)
      continue
    }
    const wrongSize = pieces.find((p: any) => p.cubes.length !== cfg.cubesEach)
    if (wrongSize) {
      console.log(`piece "${wrongSize.name}" has ${wrongSize.cubes.length} cubes, expected ${cfg.cubesEach}`)
      continue
    }

    // Validate: piece connectivity
    let ok = true
    for (const p of pieces) {
      const cubes: Vec3[] = p.cubes.map((c: any) => ({ x: c.x, y: c.y, z: c.z }))
      if (!isConnected(cubes)) { console.log(`piece "${p.name}" not connected`); ok = false; break }
    }
    if (!ok) continue

    // Validate: container dimensions ≥ 2 on every axis
    const ctr = raw.container
    if (ctr.x < 2 || ctr.y < 2 || ctr.z < 2) {
      console.log(`container too thin: ${ctr.x}×${ctr.y}×${ctr.z}`)
      continue
    }

    // Build solver pieces
    const solverPieces: SolverPiece[] = (raw.pieces as any[]).map(p => {
      const canonical = normalize(p.cubes.map((c: any) => ({ x: c.x, y: c.y, z: c.z })))
      const seen = new Set<string>()
      const placements = allOrientations(canonical)
        .flatMap(o => placementsOf(o, validSet))
        .filter(pl => { const k = shapeKey(pl); if (seen.has(k)) return false; seen.add(k); return true })
      return { name: p.name, canonical, placements }
    })

    // Solve (1 second timeout via attempt count — solver is fast for small puzzles)
    const solutions = solve(solverPieces, validCells, 1)
    if (solutions.length === 0) { console.log('no solution found'); continue }

    console.log('✓')

    // Format output as Puzzle type
    const solution = solutions[0]
    const idPfx = `d${difficulty[0]}`

    const shapes = solverPieces.map((p, i) => ({
      id: `${idPfx}${LETTERS[i]}`,
      color: COLORS[i % COLORS.length],
      rotation: [0, 0, 0],
      placed: false,
      cubes: p.canonical,
    }))

    const solutionOut = solution.map((p, i) => ({
      id: `${idPfx}${LETTERS[i]}`,
      color: COLORS[i % COLORS.length],
      cubes: p.cubes,
    }))

    const puzzle: any = { container: raw.container, shapes, solution: solutionOut }
    if (raw.validCells) puzzle.validCells = validCells
    return puzzle
  }

  throw new Error(`Could not generate a valid ${difficulty} puzzle in ${MAX_ATTEMPTS} attempts`)
}

// ── main ──────────────────────────────────────────────────────────────────────

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY is not set')
    process.exit(1)
  }

  // Target date: argument or tomorrow
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

  for (const difficulty of ['easy', 'medium', 'hard'] as DifficultyKey[]) {
    console.log(`[${difficulty.toUpperCase()}]`)
    result[difficulty] = await generatePuzzle(client, difficulty, date)
    console.log()
  }

  const outPath = resolve(process.cwd(), 'public/daily-puzzles.json')
  writeFileSync(outPath, JSON.stringify(result, null, 2))
  console.log(`Written → ${outPath}`)
}

main().catch(err => { console.error(err); process.exit(1) })
