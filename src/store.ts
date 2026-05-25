import { create } from 'zustand'
import type { PlacedShape, Vec3, Puzzle } from './types'
import { applyRotation, normalizeShape, addOffset, cubesInBounds, cubesOverlap } from './puzzle'
import { getEasyPuzzle, PUZZLE_LIBRARY } from './puzzle'
import type { DifficultyKey } from './puzzle'

// Looks up a puzzle by index: static library first, then dynamically generated ones.
function getPuzzle(
  d: DifficultyKey,
  i: number,
  dynamicPuzzles: Record<DifficultyKey, Puzzle[]>,
): Puzzle {
  const staticLib = PUZZLE_LIBRARY[d]
  if (i < staticLib.length) return staticLib[i]()
  return dynamicPuzzles[d][i - staticLib.length]
}

function totalPuzzleCount(d: DifficultyKey, dynamicPuzzles: Record<DifficultyKey, Puzzle[]>): number {
  return PUZZLE_LIBRARY[d].length + dynamicPuzzles[d].length
}

// Resets all in-game state for a fresh start on the given puzzle.
function freshGame(puzzle: Puzzle) {
  return {
    puzzle,
    placedShapes:    [] as PlacedShape[],
    selectedShapeId: null as string | null,
    hoveredCell:     null as Vec3 | null,
    hintCount:       5,
    hintHighlight:   null as string | null,
    won:             false,
  }
}

interface GameState {
  // ── Navigation ────────────────────────────────────────────────────────────
  screen:             'menu' | 'difficulty' | 'game'
  currentDifficulty:  DifficultyKey | null
  currentPuzzleIndex: number
  solvedPuzzles:      Record<string, boolean>  // key: `${difficulty}-${index}`
  dynamicPuzzles:     Record<DifficultyKey, Puzzle[]>
  generatingPuzzle:   boolean
  generationError:    string | null

  // ── Active game ───────────────────────────────────────────────────────────
  puzzle:          Puzzle
  placedShapes:    PlacedShape[]
  selectedShapeId: string | null
  hoveredCell:     Vec3 | null
  hintCount:       number
  hintHighlight:   string | null
  won:             boolean

  // ── Navigation actions ────────────────────────────────────────────────────
  goToMenu:            () => void
  goToDifficulty:      (d: DifficultyKey) => void
  startPuzzle:         (d: DifficultyKey, i: number) => void
  nextPuzzle:          () => void
  requestGeneration:   (d: DifficultyKey) => Promise<void>

  // ── Game actions ──────────────────────────────────────────────────────────
  selectShape:     (id: string | null) => void
  setHoveredCell:  (cell: Vec3 | null) => void
  rotateSelected:  (axis: 'x' | 'y' | 'z', dir: 1 | -1) => void
  placeShape:      (shapeId: string, offset: Vec3) => boolean
  liftShape:       (shapeId: string) => void
  useHint:         () => void
  reset:           () => void
}

export const useGameStore = create<GameState>((set, get) => ({
  // ── Navigation initial state ──────────────────────────────────────────────
  screen:             'menu',
  currentDifficulty:  null,
  currentPuzzleIndex: 0,
  solvedPuzzles:      {},
  dynamicPuzzles:     { easy: [], medium: [], hard: [] },
  generatingPuzzle:   false,
  generationError:    null,

  // ── Game initial state (placeholder until startPuzzle is called) ──────────
  ...freshGame(getEasyPuzzle()),

  // ── Navigation actions ────────────────────────────────────────────────────
  goToMenu: () => set({
    screen:            'menu',
    currentDifficulty: null,
    selectedShapeId:   null,
    hoveredCell:       null,
  }),

  goToDifficulty: (d) => set({
    screen:            'difficulty',
    currentDifficulty: d,
    selectedShapeId:   null,
    hoveredCell:       null,
  }),

  startPuzzle: (d, i) => {
    const { dynamicPuzzles } = get()
    set({
      screen:             'game',
      currentDifficulty:  d,
      currentPuzzleIndex: i,
      generationError:    null,
      ...freshGame(getPuzzle(d, i, dynamicPuzzles)),
    })
  },

  nextPuzzle: () => {
    const { currentDifficulty, currentPuzzleIndex, dynamicPuzzles } = get()
    if (!currentDifficulty) { set({ screen: 'menu' }); return }
    const next = currentPuzzleIndex + 1
    if (next < totalPuzzleCount(currentDifficulty, dynamicPuzzles)) {
      set({
        currentPuzzleIndex: next,
        generationError:    null,
        ...freshGame(getPuzzle(currentDifficulty, next, dynamicPuzzles)),
      })
    } else {
      set({ screen: 'difficulty', won: false })
    }
  },

  requestGeneration: async (d) => {
    set({ generatingPuzzle: true, generationError: null })
    try {
      const { generatePuzzle } = await import('./generation')
      const puzzle = await generatePuzzle(d)
      const { dynamicPuzzles } = get()
      const updated: Record<DifficultyKey, Puzzle[]> = {
        ...dynamicPuzzles,
        [d]: [...dynamicPuzzles[d], puzzle],
      }
      set({ dynamicPuzzles: updated, generatingPuzzle: false })
    } catch (err) {
      const raw = err instanceof Error ? err.message : 'Generation failed.'
      console.error('[Generation error]', raw)
      // Show a friendly message for auth/billing/network issues
      const isBillingOrAuth = /credit|billing|401|403|api.?key|balance/i.test(raw)
      set({
        generatingPuzzle: false,
        generationError: isBillingOrAuth
          ? 'AI puzzle generation isn\'t available right now — check back soon!'
          : raw,
      })
    }
  },

  // ── Game actions ──────────────────────────────────────────────────────────
  selectShape:    (id)   => set({ selectedShapeId: id, hoveredCell: null }),
  setHoveredCell: (cell) => set({ hoveredCell: cell }),

  rotateSelected: (axis, dir) => {
    const { puzzle, selectedShapeId } = get()
    if (!selectedShapeId) return
    set({
      puzzle: {
        ...puzzle,
        shapes: puzzle.shapes.map(s => {
          if (s.id !== selectedShapeId || s.placed) return s
          const [rx, ry, rz] = s.rotation
          return {
            ...s,
            rotation: [
              axis === 'x' ? rx + dir * 90 : rx,
              axis === 'y' ? ry + dir * 90 : ry,
              axis === 'z' ? rz + dir * 90 : rz,
            ] as [number, number, number],
          }
        }),
      },
    })
  },

  placeShape: (shapeId, offset) => {
    const { puzzle, placedShapes, currentDifficulty, currentPuzzleIndex, solvedPuzzles } = get()
    const shape = puzzle.shapes.find(s => s.id === shapeId)
    if (!shape || shape.placed) return false

    const rotated    = normalizeShape(applyRotation(shape.cubes, ...shape.rotation))
    const worldCubes = addOffset(rotated, offset)

    if (!cubesInBounds(worldCubes, puzzle.container, puzzle.validCells)) return false

    const occupiedCubes = placedShapes.flatMap(p => p.cubes)
    if (cubesOverlap(worldCubes, occupiedCubes)) return false

    const newPlaced      = { id: shapeId, cubes: worldCubes, color: shape.color }
    const newPlacedShapes = [...placedShapes, newPlaced]
    const allPlaced      = puzzle.shapes.every(s => s.id === shapeId ? true : s.placed)

    const newSolved = allPlaced && currentDifficulty
      ? { ...solvedPuzzles, [`${currentDifficulty}-${currentPuzzleIndex}`]: true }
      : solvedPuzzles

    set({
      placedShapes:    newPlacedShapes,
      selectedShapeId: null,
      won:             allPlaced,
      solvedPuzzles:   newSolved,
      puzzle: {
        ...puzzle,
        shapes: puzzle.shapes.map(s => s.id === shapeId ? { ...s, placed: true } : s),
      },
    })
    return true
  },

  liftShape: (shapeId) => {
    if (get().won) return
    const { puzzle, placedShapes } = get()
    set({
      placedShapes:    placedShapes.filter(p => p.id !== shapeId),
      selectedShapeId: shapeId,
      won:             false,
      puzzle: {
        ...puzzle,
        shapes: puzzle.shapes.map(s => s.id === shapeId ? { ...s, placed: false } : s),
      },
    })
  },

  useHint: () => {
    const { hintCount, puzzle } = get()
    if (hintCount <= 0) return
    const unplaced = puzzle.shapes.find(s => !s.placed)
    if (!unplaced) return
    set({ hintCount: hintCount - 1, hintHighlight: unplaced.id })
    setTimeout(() => set({ hintHighlight: null }), 3000)
  },

  reset: () => {
    const { currentDifficulty, currentPuzzleIndex, dynamicPuzzles } = get()
    if (!currentDifficulty) return
    set(freshGame(getPuzzle(currentDifficulty, currentPuzzleIndex, dynamicPuzzles)))
  },
}))
