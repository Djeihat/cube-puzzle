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
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('No JSON object found in response')
  return JSON.parse(match[0])
}

// ── output formatting ─────────────────────────────────────────────────────────

const COLORS = ['#4A90D9','#E67E22','#2ECC71','#9B59B6','#E74C3C','#1ABC9C','#F39C12']
const LETTERS = 'abcdefghijklmnopqrstuvwxyz'

// ── prompts ───────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You design 3D polycube puzzles where pieces pack perfectly into a container.

COORDINATE SYSTEM: Integer {x, y, z} coordinates.
Two cells are face-adjacent when they differ by exactly 1 in exactly one axis (no diagonals).

RULES:
1. Each piece is a connected set of face-adjacent cubes.
2. Normalize each piece: shift so min(x) = min(y) = min(z) = 0.
3. Total cubes across ALL pieces must equal the number of valid container cells exactly.
4. The container must be at least 2 cells wide in every axis (x ≥ 2, y ≥ 2, z ≥ 2).
5. All pieces must be distinct (no two pieces have the same shape after rotation/reflection).

OUTPUT: Valid JSON only — no prose, no markdown fences.`

const DIFFICULTY_CONFIG: Record<DifficultyKey, {
  pieces: string, container: string, format: string, extra: string
}> = {
  easy: {
    pieces: '3 or 4 pieces, each with 3 to 5 cubes',
    container: 'a rectangular box (just set "container" to the bounding box — no "validCells" needed)',
    format: `{
  "container": {"x": N, "y": N, "z": N},
  "pieces": [{"name": "name", "cubes": [{"x":0,"y":0,"z":0}, ...]}, ...]
}`,
    extra: 'Make it approachable. Simple, recognisable piece shapes (L, T, I, square).',
  },
  medium: {
    pieces: '5 or 6 pieces, each with 3 to 5 cubes',
    container: 'an irregular shape (include "validCells" listing every valid cell position)',
    format: `{
  "container": {"x": N, "y": N, "z": N},
  "validCells": [{"x":0,"y":0,"z":0}, ...],
  "pieces": [{"name": "name", "cubes": [{"x":0,"y":0,"z":0}, ...]}, ...]
}`,
    extra: 'The irregular container should have cells removed from a corner, edge, or side to create an interesting shape. Include a mix of 3D and flat pieces.',
  },
  hard: {
    pieces: '7 or 8 pieces, each with 3 to 5 cubes',
    container: 'a complex irregular shape (include "validCells" listing every valid cell position)',
    format: `{
  "container": {"x": N, "y": N, "z": N},
  "validCells": [{"x":0,"y":0,"z":0}, ...],
  "pieces": [{"name": "name", "cubes": [{"x":0,"y":0,"z":0}, ...]}, ...]
}`,
    extra: 'The container should have a distinctive 3D shape (steps, notches, an L or T footprint). Include several 3D pieces (pieces that span all three axes).',
  },
}

function buildUserPrompt(difficulty: DifficultyKey, date: string, attempt: number): string {
  const cfg = DIFFICULTY_CONFIG[difficulty]
  return `Design a ${difficulty.toUpperCase()} polycube puzzle for ${date}${attempt > 0 ? ` (retry ${attempt} — use a completely different design)` : ''}.

SPECS:
- Pieces: ${cfg.pieces}
- Container: ${cfg.container}
- ${cfg.extra}

FORMAT:
${cfg.format}

BEFORE RESPONDING, VERIFY:
✓ Sum of piece cube counts = number of valid container cells
✓ Every piece is face-connected (no diagonal neighbours)
✓ Every piece is normalised (min x = min y = min z = 0)
✓ Container axes are all ≥ 2
✓ All pieces have distinct shapes`
}

// ── generation ────────────────────────────────────────────────────────────────

async function generatePuzzle(
  client: Anthropic,
  difficulty: DifficultyKey,
  date: string,
): Promise<object> {
  const MAX_ATTEMPTS = 6

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    process.stdout.write(`  attempt ${attempt + 1}/${MAX_ATTEMPTS} ... `)

    // Call Claude
    let raw: any
    try {
      const msg = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: buildUserPrompt(difficulty, date, attempt) }],
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

    // Pre-validate: cell count
    const totalPieceCells = (raw.pieces as any[]).reduce((n: number, p: any) => n + p.cubes.length, 0)
    if (totalPieceCells !== validCells.length) {
      console.log(`cell count mismatch (pieces ${totalPieceCells} ≠ container ${validCells.length})`)
      continue
    }

    // Pre-validate: piece connectivity
    let ok = true
    for (const p of raw.pieces as any[]) {
      const cubes: Vec3[] = p.cubes.map((c: any) => ({ x: c.x, y: c.y, z: c.z }))
      if (!isConnected(cubes)) { console.log(`piece "${p.name}" not connected`); ok = false; break }
    }
    if (!ok) continue

    // Pre-validate: container dimensions
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
