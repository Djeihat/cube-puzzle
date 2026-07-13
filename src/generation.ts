/**
 * AI puzzle generation using the Claude API.
 *
 * Asks Claude to design a polycube puzzle (container cells + pieces), then
 * validates the response and runs the backtracking solver to confirm it's
 * solvable. Retries up to MAX_ATTEMPTS times, feeding back any errors.
 */

import Anthropic from '@anthropic-ai/sdk'
import type { Vec3, Puzzle, PuzzleShape, PlacedShape } from './types'
import type { DifficultyKey } from './puzzle'
import { vec3Key, normalizeShape } from './puzzle'
import { solve, isConnected } from './solver'

const MAX_ATTEMPTS = 4

const COLORS = ['#4A90D9', '#E67E22', '#2ECC71', '#9B59B6', '#E74C3C', '#1ABC9C']

// ── Prompt templates ──────────────────────────────────────────────────────────

const DIFFICULTY_SPEC: Record<DifficultyKey, string> = {
  easy: `- Container: rectangular box, 10–20 cells total (e.g. 3×2×2 = 12, 4×2×3 = 24)
- Pieces: 3–5 pieces, each 2–5 cubes, total cells = container cells
- Container shape: rectangular (no irregular cutouts); every dimension must be ≥ 2 cubes
- Solutions: should have 3–5 valid solutions (relatively easy)
- Piece orientations: rotations AND reflections allowed`,

  medium: `- Container: rectangular box (regular prism), 20–32 cells total (e.g. 3×2×4=24, 4×2×3=24, 4×4×2=32)
- Pieces: 5–8 pieces, each 2–5 cubes, total cells = container cells
- Container shape: must be a simple rectangular box — no cutouts, no irregular cells; every cell in the bounding box is valid
- Container thickness: every axis (x, y, z) must span at least 2 cubes — no flat slabs or pencil-thin shapes
- Solutions: should have 1–3 valid solutions (moderate difficulty)
- Piece orientations: rotations AND reflections allowed`,

  hard: `- Container: irregular shape, 20–36 cells total
- Pieces: 7–12 pieces, each 2–4 cubes, total cells = container cells
- Container shape: must be irregular and fully 3-dimensional
- Container thickness: every axis (x, y, z) must span at least 2 cubes — no flat slabs or pencil-thin shapes
- Solutions: should have exactly 1 valid solution (hard)
- Piece orientations: rotations only (no reflections) — pieces are chiral`,
}

function buildPrompt(difficulty: DifficultyKey, previousError?: string): string {
  const spec = DIFFICULTY_SPEC[difficulty]
  const errorSection = previousError
    ? `\n\nYour previous attempt had this problem — please fix it:\n${previousError}\n`
    : ''

  return `You are designing a 3-D polycube puzzle. A polycube is a set of unit cubes joined face-to-face on an integer grid.

Design a ${difficulty.toUpperCase()} difficulty puzzle with these constraints:
${spec}

Rules:
1. Every piece must be a connected polycube (all cubes reachable via face adjacency).
2. The container cells must also form a single connected set.
3. The pieces must tile the container perfectly — no gaps, no overlaps, every cell covered.
4. Use zero-based integer coordinates. Keep coordinates small (avoid numbers > 8).
5. Normalize each piece so its minimum x, y, z are all 0.
${errorSection}
Respond ONLY with a JSON object in this exact format (no markdown, no explanation):
{
  "validCells": [[x,y,z], ...],
  "pieces": [
    {"cubes": [[x,y,z], ...]},
    ...
  ]
}`
}

// ── Response parsing & validation ─────────────────────────────────────────────

interface RawResponse {
  validCells: number[][]
  pieces: { cubes: number[][] }[]
}

function toVec3(arr: number[]): Vec3 {
  return { x: arr[0], y: arr[1], z: arr[2] }
}

function validateAndParse(
  raw: RawResponse,
  difficulty: DifficultyKey,
): { containerCells: Vec3[]; pieces: Vec3[][] } | { error: string } {
  // Basic structure
  if (!Array.isArray(raw.validCells) || raw.validCells.length === 0)
    return { error: 'validCells must be a non-empty array of [x,y,z] triples.' }
  if (!Array.isArray(raw.pieces) || raw.pieces.length < 2)
    return { error: 'pieces must be an array of at least 2 piece objects.' }

  const containerCells = raw.validCells.map(toVec3)
  const pieces = raw.pieces.map(p => p.cubes.map(toVec3))

  // Unique container cells
  const cellKeys = new Set(containerCells.map(vec3Key))
  if (cellKeys.size !== containerCells.length)
    return { error: 'validCells contains duplicate cells.' }

  // Container connectivity
  if (!isConnected(containerCells))
    return { error: 'The container cells are not all connected (face-adjacency).' }

  // Total cell count match
  const pieceTotal = pieces.reduce((s, p) => s + p.length, 0)
  if (pieceTotal !== containerCells.length)
    return {
      error: `Total piece cubes (${pieceTotal}) ≠ container cells (${containerCells.length}). They must match exactly.`,
    }

  // Each piece connected & normalized
  for (let i = 0; i < pieces.length; i++) {
    const p = pieces[i]
    if (p.length < 2) return { error: `Piece ${i + 1} has fewer than 2 cubes.` }
    if (!isConnected(p))
      return { error: `Piece ${i + 1} is not connected (all cubes must share faces).` }
    const norm = normalizeShape(p)
    const normKeys = norm.map(vec3Key).sort().join('|')
    const origKeys = normalizeShape(p).map(vec3Key).sort().join('|')
    if (normKeys !== origKeys)
      return { error: `Piece ${i + 1} is not normalized — minimum x, y, z should all be 0.` }
  }

  // Piece count constraints
  const pieceCount = pieces.length
  if (difficulty === 'easy' && (pieceCount < 3 || pieceCount > 5))
    return { error: `Easy puzzles should have 3–5 pieces, got ${pieceCount}.` }
  if (difficulty === 'medium' && (pieceCount < 5 || pieceCount > 8))
    return { error: `Medium puzzles should have 5–8 pieces, got ${pieceCount}.` }
  if (difficulty === 'hard' && (pieceCount < 7 || pieceCount > 12))
    return { error: `Hard puzzles should have 7–12 pieces, got ${pieceCount}.` }

  // Minimum thickness: every axis must span at least 2 cubes
  const xs = containerCells.map(c => c.x)
  const ys = containerCells.map(c => c.y)
  const zs = containerCells.map(c => c.z)
  const spanX = Math.max(...xs) - Math.min(...xs)
  const spanY = Math.max(...ys) - Math.min(...ys)
  const spanZ = Math.max(...zs) - Math.min(...zs)
  if (spanX < 1 || spanY < 1 || spanZ < 1)
    return {
      error: `Container must be at least 2 cubes thick in every dimension. ` +
             `Got extents x=${spanX + 1}, y=${spanY + 1}, z=${spanZ + 1}. ` +
             `No flat slabs or pencil-shaped containers.`,
    }

  // Medium must be a full rectangular box (no cutouts)
  if (difficulty === 'medium') {
    const boxTotal = (spanX + 1) * (spanY + 1) * (spanZ + 1)
    if (boxTotal !== containerCells.length)
      return {
        error: `Medium containers must be simple rectangular boxes with no cutouts. ` +
               `Bounding box has ${boxTotal} cells but only ${containerCells.length} were provided. ` +
               `Fill in all cells — the box should be completely solid.`,
      }
  }

  // Container cell-count constraints
  const totalCells = containerCells.length
  if (difficulty === 'easy' && (totalCells < 10 || totalCells > 20))
    return { error: `Easy puzzles should have 10–20 container cells, got ${totalCells}.` }
  if (difficulty === 'medium' && (totalCells < 20 || totalCells > 32))
    return { error: `Medium puzzles should have 20–32 container cells, got ${totalCells}.` }
  if (difficulty === 'hard' && (totalCells < 20 || totalCells > 36))
    return { error: `Hard puzzles should have 20–36 container cells, got ${totalCells}.` }

  return { containerCells, pieces }
}

// ── Main generator ────────────────────────────────────────────────────────────

function computeBoundingBox(cells: Vec3[]): Vec3 {
  return {
    x: Math.max(...cells.map(c => c.x)) + 1,
    y: Math.max(...cells.map(c => c.y)) + 1,
    z: Math.max(...cells.map(c => c.z)) + 1,
  }
}

function buildPuzzle(
  containerCells: Vec3[],
  pieces: Vec3[][],
  solution: Placement[],
): Puzzle {
  const container = computeBoundingBox(containerCells)

  const shapes: PuzzleShape[] = pieces.map((cubes, i) => ({
    id: `g${i}`,
    color: COLORS[i % COLORS.length],
    rotation: [0, 0, 0],
    placed: false,
    cubes: normalizeShape(cubes),
  }))

  const solutionPlaced: PlacedShape[] = solution.map(p => ({
    id: `g${p.pieceIndex}`,
    color: COLORS[p.pieceIndex % COLORS.length],
    cubes: p.cubes,
  }))

  // Only include validCells if container is irregular (not a full box)
  const boxTotal = container.x * container.y * container.z
  const isIrregular = boxTotal !== containerCells.length

  return {
    container,
    validCells: isIrregular ? containerCells : undefined,
    shapes,
    solution: solutionPlaced,
  }
}

import type { Placement } from './solver'

export async function generatePuzzle(difficulty: DifficultyKey): Promise<Puzzle> {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('AI puzzle generation isn\'t available right now — check back soon!')
  }

  const client = new Anthropic({
    apiKey,
    dangerouslyAllowBrowser: true,
  })

  const allowReflections = difficulty !== 'hard'
  const maxSolutions = difficulty === 'hard' ? 2 : 6  // solver bails early

  let lastError: string | undefined

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const prompt = buildPrompt(difficulty, lastError)

    const message = await client.messages.create({
      model: 'claude-opus-4-7',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })

    // Extract text content
    const text = message.content
      .filter(b => b.type === 'text')
      .map(b => (b as { type: 'text'; text: string }).text)
      .join('')

    // Parse JSON
    let raw: RawResponse
    try {
      // Strip any accidental markdown fences
      const cleaned = text.replace(/```json?\s*/g, '').replace(/```/g, '').trim()
      raw = JSON.parse(cleaned)
    } catch {
      lastError = `Your response was not valid JSON. Raw output:\n${text.slice(0, 400)}`
      continue
    }

    // Validate structure & constraints
    const validated = validateAndParse(raw, difficulty)
    if ('error' in validated) {
      lastError = validated.error
      continue
    }

    const { containerCells, pieces } = validated

    // Run solver
    const solutions = solve(containerCells, pieces, {
      allowReflections,
      maxSolutions,
    })

    if (solutions.length === 0) {
      lastError = `The puzzle has no valid solution. The pieces cannot tile the container with the given orientations. Try a different arrangement.`
      continue
    }

    if (difficulty === 'hard' && solutions.length > 1) {
      lastError = `Hard puzzles must have exactly 1 solution, but this one has at least ${solutions.length}. Make the container more constrained or use more irregular pieces.`
      continue
    }

    // Success — use first solution
    return buildPuzzle(containerCells, pieces, solutions[0])
  }

  throw new Error(
    `Could not generate a valid ${difficulty} puzzle after ${MAX_ATTEMPTS} attempts. Last error: ${lastError}`,
  )
}
