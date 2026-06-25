import { create } from 'zustand'
import type { PlacedShape, Vec3, Puzzle } from './types'
import { applyRotation, normalizeShape, addOffset, cubesInBounds, cubesOverlap } from './puzzle'
import { getEasyPuzzle, PUZZLE_LIBRARY } from './puzzle'
import type { DifficultyKey } from './puzzle'
import { getTodayString, getDailyIndex, getDailySolvedKey } from './daily'

function getPuzzle(d: DifficultyKey, i: number): Puzzle {
  return PUZZLE_LIBRARY[d][i]()
}

// Resets all in-game state for a fresh start on the given puzzle.
function freshGame(puzzle: Puzzle) {
  return {
    puzzle,
    placedShapes:    [] as PlacedShape[],
    selectedShapeId: null as string | null,
    hoveredCell:     null as Vec3 | null,
    hintCount:       3,
    hintHighlight:   null as string | null,
    won:             false,
  }
}

// Restores the solved view of a puzzle — pieces at solution positions, won=true.
function solvedGame(puzzle: Puzzle) {
  return {
    puzzle: {
      ...puzzle,
      shapes: puzzle.shapes.map(s => ({ ...s, placed: true })),
    },
    placedShapes:    puzzle.solution.map(s => ({ ...s })) as PlacedShape[],
    selectedShapeId: null as string | null,
    hoveredCell:     null as Vec3 | null,
    hintCount:       0,
    hintHighlight:   null as string | null,
    won:             true,
  }
}

interface GameState {
  // ── Navigation ────────────────────────────────────────────────────────────
  screen:             'menu' | 'game'
  currentDifficulty:  DifficultyKey | null
  currentPuzzleIndex: number
  solvedPuzzles:      Record<string, boolean>  // key: `daily-${difficulty}-${YYYY-MM-DD}`

  // ── Puzzle pool (fetched once at startup, rarely changes) ────────────────
  puzzlePool:  Record<DifficultyKey, Puzzle[]> | null

  // ── Active game ───────────────────────────────────────────────────────────
  puzzle:          Puzzle
  placedShapes:    PlacedShape[]
  selectedShapeId: string | null
  hoveredCell:     Vec3 | null
  hintCount:       number
  hintHighlight:   string | null
  won:             boolean

  // ── Navigation actions ────────────────────────────────────────────────────
  goToMenu:          () => void
  startDailyPuzzle:  (d: DifficultyKey) => void
  fetchPuzzlePool:   () => Promise<void>

  // ── Game actions ──────────────────────────────────────────────────────────
  selectShape:     (id: string | null) => void
  setHoveredCell:  (cell: Vec3 | null) => void
  rotateSelected:  (axis: 'x' | 'y' | 'z', dir: 1 | -1) => void
  placeShape:      (shapeId: string, offset: Vec3) => boolean
  liftShape:       (shapeId: string) => void
  useHint:         () => void
  reset:           () => void
}

// Persist solved state across page refreshes so today's puzzle stays locked.
function loadSolvedPuzzles(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem('solvedPuzzles')
    return raw ? JSON.parse(raw) : {}
  } catch { return {} }
}

function saveSolvedPuzzles(solved: Record<string, boolean>) {
  try { localStorage.setItem('solvedPuzzles', JSON.stringify(solved)) } catch {}
}

export const useGameStore = create<GameState>((set, get) => ({
  // ── Navigation initial state ──────────────────────────────────────────────
  screen:             'menu',
  currentDifficulty:  null,
  currentPuzzleIndex: 0,
  solvedPuzzles:      loadSolvedPuzzles(),
  puzzlePool:         null,

  // ── Game initial state (placeholder until startDailyPuzzle is called) ─────
  ...freshGame(getEasyPuzzle()),

  // ── Navigation actions ────────────────────────────────────────────────────
  goToMenu: () => set({
    screen:            'menu',
    currentDifficulty: null,
    selectedShapeId:   null,
    hoveredCell:       null,
  }),

  fetchPuzzlePool: async () => {
    if (get().puzzlePool) return  // already loaded
    try {
      const base = (import.meta as any).env?.BASE_URL ?? '/'
      const res  = await fetch(`${base}puzzle-pool.json`)
      if (!res.ok) return
      const data = await res.json()
      if (!data.easy?.length || !data.medium?.length || !data.hard?.length) return
      set({ puzzlePool: { easy: data.easy, medium: data.medium, hard: data.hard } })
    } catch {
      // Fail silently — static library fallback handles it
    }
  },

  startDailyPuzzle: (d) => {
    const today = getTodayString()
    const { puzzlePool, solvedPuzzles } = get()

    let puzzle: Puzzle
    let puzzleIndex: number

    if (puzzlePool?.[d]?.length) {
      // Pool available — use dayIndex mod pool size for daily selection
      const pool = puzzlePool[d] as Puzzle[]
      puzzleIndex = getDailyIndex(d, today) % pool.length
      puzzle = pool[puzzleIndex]
    } else {
      // Fallback: static library
      puzzleIndex = getDailyIndex(d, today)
      puzzle = getPuzzle(d, puzzleIndex)
    }

    const alreadySolved = !!solvedPuzzles[getDailySolvedKey(d, today)]
    set({
      screen:             'game',
      currentDifficulty:  d,
      currentPuzzleIndex: puzzleIndex,
      ...(alreadySolved ? solvedGame(puzzle) : freshGame(puzzle)),
    })
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
    const { puzzle, placedShapes, currentDifficulty, solvedPuzzles } = get()
    const shape = puzzle.shapes.find(s => s.id === shapeId)
    if (!shape || shape.placed) return false

    const rotated    = normalizeShape(applyRotation(shape.cubes, ...shape.rotation))
    const worldCubes = addOffset(rotated, offset)

    if (!cubesInBounds(worldCubes, puzzle.container, puzzle.validCells)) return false

    const occupiedCubes = placedShapes.flatMap(p => p.cubes)
    if (cubesOverlap(worldCubes, occupiedCubes)) return false

    const newPlaced       = { id: shapeId, cubes: worldCubes, color: shape.color }
    const newPlacedShapes = [...placedShapes, newPlaced]
    const allPlaced       = puzzle.shapes.every(s => s.id === shapeId ? true : s.placed)

    const newSolved = allPlaced && currentDifficulty
      ? { ...solvedPuzzles, [getDailySolvedKey(currentDifficulty, getTodayString())]: true }
      : solvedPuzzles

    set({
      placedShapes:    newPlacedShapes,
      selectedShapeId: null,
      hintHighlight:   null,   // dismiss any active hint when a piece is placed
      won:             allPlaced,
      solvedPuzzles:   newSolved,
      puzzle: {
        ...puzzle,
        shapes: puzzle.shapes.map(s => s.id === shapeId ? { ...s, placed: true } : s),
      },
    })
    if (allPlaced) saveSolvedPuzzles(newSolved)
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
    // Stay visible for 10 s — long enough to identify the piece, find it
    // in the tray, and orient it. Cleared earlier if the player places any piece.
    setTimeout(() => set({ hintHighlight: null }), 10_000)
  },

  reset: () => {
    const { currentDifficulty, currentPuzzleIndex, puzzlePool } = get()
    if (!currentDifficulty) return
    const pool = puzzlePool?.[currentDifficulty] as Puzzle[] | undefined
    if (pool?.length && currentPuzzleIndex >= 0 && currentPuzzleIndex < pool.length) {
      set(freshGame(pool[currentPuzzleIndex]))
    } else {
      set(freshGame(getPuzzle(currentDifficulty, currentPuzzleIndex)))
    }
  },
}))
