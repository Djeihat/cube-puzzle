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
    hintCount:       5,
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

  // ── Daily puzzle fetch ────────────────────────────────────────────────────
  fetchedPuzzles:  Record<DifficultyKey, Puzzle> | null
  fetchedDate:     string | null

  // ── Active game ───────────────────────────────────────────────────────────
  puzzle:          Puzzle
  placedShapes:    PlacedShape[]
  selectedShapeId: string | null
  hoveredCell:     Vec3 | null
  hintCount:       number
  hintHighlight:   string | null
  won:             boolean

  // ── Navigation actions ────────────────────────────────────────────────────
  goToMenu:           () => void
  startDailyPuzzle:   (d: DifficultyKey) => void
  fetchDailyPuzzles:  () => Promise<void>

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
  fetchedPuzzles:     null,
  fetchedDate:        null,

  // ── Game initial state (placeholder until startDailyPuzzle is called) ─────
  ...freshGame(getEasyPuzzle()),

  // ── Navigation actions ────────────────────────────────────────────────────
  goToMenu: () => set({
    screen:            'menu',
    currentDifficulty: null,
    selectedShapeId:   null,
    hoveredCell:       null,
  }),

  fetchDailyPuzzles: async () => {
    const today = getTodayString()
    if (get().fetchedDate === today) return  // already loaded today
    try {
      const base = (import.meta as any).env?.BASE_URL ?? '/'
      const res = await fetch(`${base}daily-puzzles.json`)
      if (!res.ok) return
      const data = await res.json()
      // Only use if the file is for today and all three difficulties are present
      if (data.date !== today || !data.easy || !data.medium || !data.hard) return
      set({ fetchedPuzzles: { easy: data.easy, medium: data.medium, hard: data.hard }, fetchedDate: today })
    } catch {
      // Fail silently — static library fallback handles it
    }
  },

  startDailyPuzzle: (d) => {
    const today = getTodayString()
    const { fetchedPuzzles, fetchedDate, solvedPuzzles } = get()

    const useFetched = fetchedDate === today && !!fetchedPuzzles?.[d]
    const puzzle     = useFetched ? fetchedPuzzles![d] as Puzzle : getPuzzle(d, getDailyIndex(d, today))
    const alreadySolved = !!solvedPuzzles[getDailySolvedKey(d, today)]

    set({
      screen:             'game',
      currentDifficulty:  d,
      currentPuzzleIndex: useFetched ? -1 : getDailyIndex(d, today),
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
    setTimeout(() => set({ hintHighlight: null }), 3000)
  },

  reset: () => {
    const { currentDifficulty, currentPuzzleIndex, fetchedPuzzles, fetchedDate } = get()
    if (!currentDifficulty) return
    const today = getTodayString()
    if (fetchedDate === today && fetchedPuzzles?.[currentDifficulty]) {
      set(freshGame(fetchedPuzzles[currentDifficulty] as Puzzle))
    } else {
      set(freshGame(getPuzzle(currentDifficulty, currentPuzzleIndex)))
    }
  },
}))
