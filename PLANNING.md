# Cube Puzzle — Planning Document

## Concept

A 3-D polycube puzzle game where the player fits a set of shaped pieces perfectly into a container — no gaps, no overhangs. Think Tetris in three dimensions, but without falling blocks. The player picks up pieces, rotates them freely, and places them by hovering over the container until the ghost preview looks right.

AI drives the experience in V2: generating puzzles, providing smart hints, and adapting difficulty over time.

---

## V1 Scope

**Completed**
- Core placement loop: pick up → rotate → ghost preview → place → lift
- Three difficulty tiers: Easy, Medium, Hard — each with its own puzzle set
- Irregular container shapes (Medium and Hard)
- Menu → difficulty page → puzzle selection → game navigation flow
- Solved-puzzle tracking (persists within session, shown on puzzle cards)
- Hint system — 5 free hints per puzzle, flashes the solution position of one unplaced piece for 3 s
- Win detection and non-blocking win screen (player can keep rotating the solved puzzle)
- Piece lock — placed pieces cannot be lifted after the puzzle is solved
- Reset — restarts the current puzzle
- Beveled piece geometry — B = 0.05 chamfer on all external edges; V-grooves at joins between adjacent cubes of the same piece
- Turntable scene rotation — the scene group rotates on drag; camera and lights are fixed in world-space so lighting never shifts
- Exact container wireframe — boundary edges computed from the valid-cell set, not the bounding box
- Complete Easy puzzle library — 10 hand-authored puzzles across a range of piece counts (3–5 pieces) and container sizes
- Medium puzzle library redesigned — 3 puzzles with 5, 6, and 7 pieces respectively; irregular containers sized 20–28 cells; all pieces within each puzzle are distinct free polycubes
- Scrollable piece tray — tray anchored between HUD and screen edge; overflows-y scrolls natively; fade gradient affordance when list is long; WebGL canvas pointer-events disabled so scroll passes through to the container

**Remaining before V1 is called done**
- More hand-authored puzzles — Easy complete (10/10); Medium at 7/10; Hard at 2/10
- Update puzzle metadata/names as library grows

**Deferred polish**
- Groove end-cap triangles — sub-pixel gaps where V-grooves terminate at piece ends; invisible at normal viewing distances

---

## Engineering Decisions

### Puzzle validator script (2026-05-29)

**Problem:** Manual cell-by-cell verification of puzzle solutions was slow and error-prone — counting 24 cells in three dimensions in a text editor, with no automated check. Two prior design sessions produced designs with isolated cells that only surfaced during manual review.

**Decision:** Add `scripts/validate-puzzles.ts`, run with `npx vite-node`. For every puzzle in `PUZZLE_LIBRARY` it checks: (1) solution cells total matches container size, (2) no cell appears twice, (3) every cell is within `validCells` or container bounds, (4) each piece's cubes are connected. Exposed via `npm run validate`. Added to the end of the per-puzzle workflow: design → code → `npm run validate` → wire into `PUZZLE_LIBRARY` → update PLANNING.md → commit & push.

**Result:** Validation of all 19 puzzles completes in ~1 second. Design errors that previously required 10+ minutes of manual checking are now caught immediately.

### puzzle.ts coordinate refactor (2026-05-27)

**Problem:** `puzzle.ts` grew to 1,042 lines because every cube position was written as a full object literal (`{ x: 0, y: 0, z: 0 }`). Reading the file consumed a large share of LLM context per session, making it expensive to add or edit puzzles and causing two sessions to exhaust their resource budget before useful work could be done.

**Decision:** Introduce a compact coordinate constructor at the top of the file:

```ts
const c = (x: number, y: number, z: number): Vec3 => ({ x, y, z })
```

All cube arrays, `validCells` arrays, and container declarations throughout the file were converted to use `c()`. Internal arrow-function parameters that would have shadowed `c` were renamed to `p`. No types changed; no logic changed. TypeScript passed clean after the rewrite.

**Result:** 1,042 → 631 lines (39% reduction). Future puzzle additions cost roughly one-third the context they did before.

**Process note:** The refactor was done as a dedicated step before writing new medium puzzles, so that all new puzzle functions would be authored in the compact format from the start rather than requiring a second-pass conversion.

### Medium puzzle redesign (2026-05-28)

**Problem:** The original three medium puzzles each had only 3 pieces in 12-cell containers — barely harder than easy. Two also had duplicate pieces within the same puzzle (e.g. two 2×2 squares), which was an error. The small piece count meant the tray scrolling bug went unnoticed until puzzle 3 was built with 7 pieces.

**Decision:** Redesign all three from scratch with a ramp in piece count (5 / 6 / 7) and larger irregular containers (20 / 24 / 28 cells). Rules: all pieces within a puzzle must be distinct free polycubes; container must be ≥ 2 cells wide in every axis; solutions verified cell-by-cell before coding. Mixed piece sizes (3-, 4-, and 5-cube) within each puzzle.

**Result:** Puzzles 1–3 now offer a clear difficulty ramp within the Medium tier. The 7-piece puzzle also exposed and drove the fix for the tray overflow bug.

### puzzle.ts file split (2026-05-29)

**Problem:** `puzzle.ts` shrank to 698 lines after the coordinate refactor, but still contained all puzzle functions for all three difficulty tiers. Reading the full file cost significant LLM context per session when adding new puzzles, and the file would grow again as Medium and Hard libraries expand toward 10 puzzles each.

**Decision:** Move puzzle functions into three per-difficulty files (`puzzle-easy.ts`, `puzzle-medium.ts`, `puzzle-hard.ts`). Each file is self-contained with its own `COLORS` and `c` helper. `puzzle.ts` becomes a ~115-line hub that owns all utility functions, `DifficultyKey`, `DIFFICULTY_META`, re-exports puzzle functions, and maintains `PUZZLE_LIBRARY`. Future sessions adding Medium puzzles only need to read `puzzle-medium.ts` (~300 lines and growing); they never need to touch the easy or hard files.

**Result:** `puzzle.ts` reduced from 698 → 115 lines. Adding new medium puzzles now costs ~½ the context of the previous approach.

### Piece tray scroll fix (2026-05-28)

**Problem:** `ShapeTray` used `top: 50% / translateY(-50%)` with no height constraint. On Medium puzzle 3 (7 pieces × 120 px cards ≈ 1,100 px), pieces overflowed below the screen with no way to reach them.

**Decision:** Two changes together:
1. Re-anchor the tray to `top: 80px / bottom: 20px` (fixed vertical bounds) and add `overflow-y: auto` — browser enforces the height and handles scrolling natively.
2. Add `pointerEvents: none` to the `<Canvas>` in `ShapePreview3D` — the WebGL canvas was absorbing wheel events, preventing scroll from reaching the tray container. `autoRotate` is animation-driven and needs no pointer input, so disabling pointer events has no visible effect.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | React 19 |
| 3-D renderer | @react-three/fiber v9 + three.js ^0.169 |
| 3-D helpers | @react-three/drei v10 |
| State | Zustand v5 |
| Build | Vite + TypeScript (`verbatimModuleSyntax`) |

---

## UX Decisions

### Navigation
- **Menu screen** — three difficulty cards (Easy / Medium / Hard) with solved count
- **Difficulty screen** — numbered puzzle cards; solved cards show a ✓ and colored border
- **Game screen** — top HUD bar with ← back to difficulty, difficulty badge, piece count, hint, reset
- **Win screen** — bottom bar with "Puzzles" (back to difficulty list) and "Next →" if more puzzles remain in the tier

### Piece interaction
- **Pick up** — click a piece card in the tray
- **Deselect** — click the same piece card again
- **Place** — hover over the container (ghost preview appears), click to place
- **Lift** — click a placed piece inside the container to return it to the tray (disabled after puzzle is solved)

### Rotation
- **Keys**: Q/E → Y axis, W/S → X axis, A/D → Z axis
- **Increment**: 90° snaps only
- **UI**: key hints shown at bottom-right of screen when a piece is held

### Camera
- Turntable drag (scene rotates, camera fixed) + scroll to zoom
- No pan

### Ghost preview
- Appears when cursor enters any empty cell while holding a piece
- Anchor: piece centroid maps to hovered cell
- Valid placement: white, semi-transparent flat cubes
- Conflict (out of bounds or overlap): red, semi-transparent flat cubes

### Piece tray
- Fixed column on the left edge, anchored top: 80 px (below HUD) → bottom: 20 px
- Scrolls vertically when pieces overflow the available height (native overflow-y: auto)
- Thin blue-tinted scrollbar; fade gradient at the bottom when 5+ pieces are present
- Canvas pointer-events disabled so mouse wheel scrolls the tray rather than being absorbed by WebGL

---

## Difficulty Tiers

### Container shapes
| Tier | Container |
|---|---|
| Easy | Rectangular |
| Medium | Irregular |
| Hard | Irregular |

### Solution counts (target)
| Tier | Valid solutions |
|---|---|
| Easy | 3–5 |
| Medium | 2–3 |
| Hard | 1 |

### Piece orientations allowed
| Tier | Rule |
|---|---|
| Easy / Medium | Rotations + reflections (48 total) |
| Hard | Rotations only (24 orientations) |

---

## Hint System

| Parameter | Value |
|---|---|
| Free hints per puzzle | 5 |
| Hint behaviour | Highlights the solution position of one unplaced piece for 3 s |
| Earn extras | Clean solves, streaks (V2) |
| Purchase extras | Per-hint microtransaction (V2) |

---

## Puzzle Library

### Easy

| # | Container | Pieces | Shapes |
|---|---|---|---|
| 1  | 3×2×2 rectangular (12 cells)  | 3×4-cube        | 3-D L, flat 2×2, flat L |
| 2  | 2×2×3 rectangular (12 cells)  | 3×4-cube        | J in x-z, 3-D skew, L-shape |
| 3  | 3×2×2 rectangular (12 cells)  | 4×3-cube        | L-corner, y-z corner, x-bar, x-z corner |
| 4  | 3×2×3 rectangular (18 cells)  | 3+4+4+4+3       | x-bar, 2×2 x-z, L-shape, L-bar, corner |
| 5  | 4×2×2 rectangular (16 cells)  | 4×4-cube        | 2×2 y-z, J-bar, L-bar, skew |
| 6  | 4×2×2 rectangular (16 cells)  | 3+3+4+3+3       | y-z corner, x-z corner, J-bar, L-corner, corner |
| 7  | 3×3×2 rectangular (18 cells)  | 5+4+5+4         | L-bar (×2), 2×2 square (×2) |
| 8  | 4×2×3 rectangular (24 cells)  | 5+5+5+4+5       | L-bar (×3), L into z, 2×2 slab |
| 9  | 2×3×3 rectangular (18 cells)  | 5+4+5+4         | 3-D S, L-corner, 2×2+arm, 2×2 square |
| 10 | 4×3×2 rectangular (24 cells)  | 5+5+4+5+5       | L-bar, S-bar, 2×2 square, L-bar, S-bar |

### Medium

| # | Container | Pieces | Shapes |
|---|---|---|---|
| 1 | Shelf — 2×4 base (2 layers) + 2×2 top shelf, irregular (20 cells) | 3+4+4+4+5 | L-triomino, tower, right-screw, 2×2 square, P-pentomino |
| 2 | Steps — 3×4 base + 3×3 middle + 3-cell cap, irregular (24 cells) | 3+3+4+4+5+5 | I-triomino, L-triomino, 2×2 square, J-tetromino, 3-D pentomino, P-pentomino |
| 3 | Tall shelf — 2×4 full (2 layers) + 2×3 upper (2 layers), irregular (28 cells) | 3+4+4+4+4+4+5 | L-triomino, 2×2 square, I-bar, L-tetromino, T-tetromino, right-screw, 3-D pentomino |
| 4 | Notched slab — 3×4 base + partial upper (20 cells) | 4+4+4+4+4 | I-bar, L-tetromino, T-tetromino, 2×2 square, 3-D screw |
| 5 | Scattered slab — 4×4 base (11 cells) + upper shelf (9 cells), irregular (20 cells) | 4+4+4+4+4 | I-bar, T-tetromino, S-skew, L-tetromino, 2×2 square |
| 6 | Wide slab — 4×3×3 bounding box, irregular (24 cells) | 4+4+4+4+4+4 | I-bar, L-tetromino, T-tetromino, S-skew, 2×2 square, branch |
| 7 | Top-narrowed cube — 3×3×3 bounding box, y=2 narrows to 2×3 (24 cells) | 4+4+4+4+4+4 | T-tetromino, S-skew, L-tetromino, branch, 2×2 square, right-screw |

### Hard

| # | Container | Pieces | Shapes |
|---|---|---|---|
| 1 | Staircase — 3×2 base narrows to 2×2 top, irregular (16 cells) | 4×4-cube | L in x-y, 3-D corner, 3-D T, J in x-y |
| 2 | 4×2×2 rectangular (16 cells) | 4×4-cube | I-bar, 3-D corner (×2), 2×2 square |

---

## Visual Direction

- **Palette**: dark blue room (`#111827` background), warm white ceiling light, blue wall bounce lights
- **Pieces**: merged geometry — only external faces rendered, no internal seams; B = 0.05 chamfered bevels on external edges; V-grooves at internal joins; `roughness 0.38, metalness 0.04`
- **Ghost cubes**: flat-faced semi-transparent unit cubes (white = valid, red = conflict)
- **Container (rectangular)**: subtle blue box fill + wireframe
- **Container (irregular)**: one back-face transparent cube per valid cell + exact boundary wireframe computed from valid-cell set
- **Shadow**: soft shadow map cast onto an invisible `shadowMaterial` floor plane in world-space

---

## V2 Roadmap

### AI puzzle generation
- Use Claude API to generate polycube shapes + containers at target difficulty
- Verify puzzle is solvable (backtracking solver) before serving
- Store puzzles in a backend; serve fresh ones as player progresses

### Smart hints
- Directional nudges ("try rotating the blue piece 90° on the Y axis") rather than revealing the solution position outright

### Difficulty adaptation
- Track solve time, hint usage, retry count per puzzle
- Adapt next puzzle selection based on performance signal

### Monetisation (post-V1)
- 5 free hints per puzzle; earn extras via clean solves / streaks
- Additional hints purchasable individually

### Mobile
- Touch controls for piece selection and rotation
- Pinch-to-zoom for camera
- Tap-to-place

### Backend
- User accounts, puzzle history, streak tracking
- Solved state persists across sessions
- Leaderboards (optional)
