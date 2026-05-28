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

**Remaining before V1 is called done**
- More hand-authored puzzles — currently 1 per difficulty; target 10 per difficulty
- Update puzzle metadata/names as library grows

**Deferred polish**
- Groove end-cap triangles — sub-pixel gaps where V-grooves terminate at piece ends; invisible at normal viewing distances

---

## Engineering Decisions

### puzzle.ts coordinate refactor (2026-05-27)

**Problem:** `puzzle.ts` grew to 1,042 lines because every cube position was written as a full object literal (`{ x: 0, y: 0, z: 0 }`). Reading the file consumed a large share of LLM context per session, making it expensive to add or edit puzzles and causing two sessions to exhaust their resource budget before useful work could be done.

**Decision:** Introduce a compact coordinate constructor at the top of the file:

```ts
const c = (x: number, y: number, z: number): Vec3 => ({ x, y, z })
```

All cube arrays, `validCells` arrays, and container declarations throughout the file were converted to use `c()`. Internal arrow-function parameters that would have shadowed `c` were renamed to `p`. No types changed; no logic changed. TypeScript passed clean after the rewrite.

**Result:** 1,042 → 631 lines (39% reduction). Future puzzle additions cost roughly one-third the context they did before.

**Process note:** The refactor was done as a dedicated step before writing new medium puzzles, so that all new puzzle functions would be authored in the compact format from the start rather than requiring a second-pass conversion.

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

| # | Container | Pieces | Shape |
|---|---|---|---|
| 1 | 3 × 2 × 2 rectangular (12 cells) | 3 × 4-cube | 3-D L, flat 2×2, flat L |

### Medium

| # | Container | Pieces | Shapes |
|---|---|---|---|
| 1 | Shelf — 2×4 base (2 layers) + 2×2 top shelf, irregular (20 cells) | 3+4+4+4+5 | L-triomino, tower, right-screw, 2×2 square, P-pentomino |
| 2 | Steps — 3×4 base + 3×3 middle + 3-cell cap, irregular (24 cells) | 3+3+4+4+5+5 | I-triomino, L-triomino, 2×2 square, J-tetromino, 3-D pentomino, P-pentomino |
| 3 | Tall shelf — 2×4 full (2 layers) + 2×3 upper (2 layers), irregular (28 cells) | 3+4+4+4+4+4+5 | L-triomino, 2×2 square, I-bar, L-tetromino, T-tetromino, right-screw, 3-D pentomino |

### Hard

| # | Container | Pieces | Shape |
|---|---|---|---|
| 1 | Staircase — 3×2 base narrows to 2×2 top, irregular (16 cells) | 4 × 4-cube | L in x-y, 3-D corner, 3-D T, J in x-y |

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
