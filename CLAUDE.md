# Cube Puzzle — Claude Code Context

## Commands
```
npm run dev       # dev server
npm run build     # tsc + vite build
npm run validate  # validate all puzzles (add -- medium 9 to filter)
npm run solve     # run backtracking solver (edit CONFIG in scripts/solve-puzzle.ts first)
```

## Tech stack
React 19 · @react-three/fiber v9 · three.js ^0.169 · Zustand v5 · Vite · TypeScript (`verbatimModuleSyntax`)

## File map

### Core logic
| File | What it does |
|------|-------------|
| `src/store.ts` | Single Zustand store — all navigation + game state and actions |
| `src/types.ts` | `Vec3`, `Puzzle`, `PuzzleShape`, `PlacedShape` |
| `src/puzzle.ts` | Hub: re-exports puzzle functions, `PUZZLE_LIBRARY`, rotation/placement utilities |
| `src/daily.ts` | `getDailyIndex(difficulty, date)`, `getDailySolvedKey()`, `getTodayString()` |
| `src/hooks.ts` | `useIsMobile()` — `pointer: coarse` media query |
| `src/dragState.ts` | Tiny shared flag: `drag.occurred` prevents drag-release from placing a piece |
| `src/generation.ts` | AI puzzle generation (Claude API, lazy-imported) |

### Puzzle files (one per puzzle)
`src/puzzle-easy.ts` (10 puzzles) · `src/puzzle-medium-{1..10}.ts` · `src/puzzle-hard-{1,2}.ts`

Each file: `import type { Vec3, Puzzle, PlacedShape, PuzzleShape } from './types'`, then `const COLORS = [...]`, `const c = (x,y,z): Vec3 => ({x,y,z})`, then one exported function.

### Components
| File | What it does |
|------|-------------|
| `src/App.tsx` | Screen router (`menu/difficulty/game`) + `Instructions` overlay |
| `src/components/MenuScreen.tsx` | 3 difficulty cards with solved count |
| `src/components/DifficultyScreen.tsx` | Numbered puzzle grid + AI generate button |
| `src/components/Scene.tsx` | R3F scene: turntable drag, ghost preview, lights, shadow floor |
| `src/components/Container.tsx` | Hit meshes, wireframe, empty cells, placed pieces, hint highlight |
| `src/components/ShapeTray.tsx` | Left-side scrollable piece tray |
| `src/components/RotationControls.tsx` | Key hint overlay + Escape-to-drop handler |
| `src/components/HUD.tsx` | Top pill (← back, difficulty, piece count, hint, reset) + win bar |
| `src/components/PieceMesh.tsx` | Beveled polycube mesh with V-grooves |
| `src/components/UnitCube.tsx` | Flat unit cube (used for ghost preview) |
| `src/components/ShapePreview3D.tsx` | Miniature 3D piece preview in the tray |

### Scripts
| File | What it does |
|------|-------------|
| `scripts/validate-puzzles.ts` | Checks every puzzle for cell count, overlaps, bounds, connectivity |
| `scripts/solve-puzzle.ts` | Backtracking solver — edit CONFIG at bottom, run to get paste-ready code |

## State shape (store.ts)
```
screen: 'menu' | 'difficulty' | 'game'
currentDifficulty: DifficultyKey | null
currentPuzzleIndex: number
solvedPuzzles: Record<string, boolean>  // key: `${difficulty}-${index}` (free-play) or `daily-${difficulty}-${date}`
puzzle: Puzzle          // active puzzle instance
placedShapes: PlacedShape[]
selectedShapeId: string | null
hoveredCell: Vec3 | null
hintCount: number
won: boolean
```

Key actions: `goToMenu()` · `goToDifficulty(d)` · `startPuzzle(d, i)` · `nextPuzzle()` · `selectShape(id|null)` · `placeShape(id, offset)` · `liftShape(id)` · `rotateSelected(axis, dir)` · `useHint()` · `reset()`

## Key patterns

### Adding a puzzle (medium example)
1. `npm run solve` — edit CONFIG in `scripts/solve-puzzle.ts`, run to get code
2. Create `src/puzzle-medium-N.ts` — paste solver output, add header/comment block
3. `npm run validate -- medium N` — must pass
4. Add import + re-export + array entry in `src/puzzle.ts`
5. Update PLANNING.md table + count
6. Commit + push

### Coordinate convention
`Vec3 = {x, y, z}`. Compact constructor `c(x,y,z)` defined at top of each puzzle file. `key(v)` = `"x,y,z"` string. Container origin at (0,0,0); group is translated by `(-cx, -cy, -cz)` to center in scene.

### Pointer / touch
Scene uses raw DOM pointer events (`pointerdown/move/up`) for turntable, not R3F. Container uses R3F `onPointerMove`/`onClick` on meshes. `drag.occurred` disambiguates drag-release from click. `useIsMobile()` (pointer:coarse) is the shared touch detector.

**Touch interaction model (mobile):**
- One-finger drag on canvas → rotates scene (turntable), unless touch lands on the ghost
- One-finger drag starting on the ghost piece → ghost-drag mode: ghost follows finger, snaps to container cells via R3F `onPointerMove`, places on `pointerup` if `hoveredCell` is set
- Two-finger pinch → zooms camera
- Tap container cell directly → `onClick` places piece (no ghost preview needed for quick tap)
- Ghost detection: `onPointerDown` in turntable effect raycasts against `ghostCubesRef` (bounding boxes in world space) — avoids R3F event ordering dependency
- Container meshes have NO `onPointerDown` — ghost only moves when the user explicitly drags the ghost piece, never passively on rotation touches

### Ghost preview
`hoveredCell` (set by Container's R3F events) drives interior snapping. Scene also casts a ray onto a frontoparallel plane for exterior ghost display. Placement always uses `hoveredCell`, never the exterior ray.
