# Cube Puzzle — Bug Log

Chronological record of bugs discovered during development, their root causes, and the decisions made to fix them.

---

## BUG-001 — CursorPiece SVG was confusing, not orientation-useful

**Status:** Fixed  
**Component:** `CursorPiece` (removed), `App.tsx`

### Description
An isometric SVG of the selected piece followed the cursor around the screen. The intent was to show the player what piece they were holding. In practice it was disorienting: the flat isometric projection didn't match the 3D view, and the cursor-attached image added visual noise without helping the player understand how the piece was oriented relative to the container.

### Root Cause
Wrong abstraction. A 2D SVG cannot convey 3D orientation, which is exactly what the player needs when deciding where to place a piece.

### Decision
Removed `CursorPiece` entirely. Replaced with a 3D snap ghost that appears inside the container at the hovered grid cell, using the same beveled geometry as the actual piece. The player now sees the piece exactly as it will look when placed, in its correct 3D orientation, in the correct grid position.

---

## BUG-002 — Floating 3D ghost appeared above the container with no grid context

**Status:** Fixed (approach abandoned)  
**Component:** `Scene.tsx`

### Description
First attempt at a 3D ghost: when a piece was selected, a floating preview appeared above the container, offset by `cy + 0.5`. The ghost moved as the camera orbited but did not track the cursor or snap to any grid position. Players couldn't use it to understand where the piece would land.

### Root Cause
Design mistake. A floating ghost in free space tells you what the piece looks like but not where it goes. Without a grid reference the player still has no idea where to click.

### Decision
Abandoned floating ghost. Moved to a snap ghost: ghost only appears when the cursor is over the container (or near it), positioned at the grid cell the piece would occupy if placed. This gives both orientation information and placement preview in one.

---

## BUG-003 — Ghost disappeared entirely after extending the hit box to container + 20

**Status:** Fixed  
**Component:** `Container.tsx`

### Description
To show the ghost outside the container bounds (so the player can preview piece orientation before committing to a position), the invisible hit mesh was enlarged from `container` dimensions to `container + 20` in all directions. After this change the ghost stopped appearing anywhere — even directly over the container.

### Root Cause
The camera sits at `[5, 5, 8]`, which is inside a `container + 20` box. Three.js `FrontSide` raycasting only tests faces whose normals point toward the ray origin. When the camera is inside the box, all face normals point away from the camera — every face is back-facing and gets culled. No faces are hit, so no pointer events fire, so `hoveredCell` is never set, so the ghost never renders.

### Decision
Changed the hit box material to `side={THREE.BackSide}`. Back-facing geometry raycasts the inner faces, which is exactly what's needed when the camera is inside the mesh. The inner face normals point toward the center (toward the camera), so they pass the culling test.

---

## BUG-004 — Ghost not visible when cursor is outside the container

**Status:** Fixed  
**Component:** `Container.tsx`

### Description
The intent of the large hit box was that moving the cursor to any position in the 3D viewport — even empty space far from the container — would show the ghost so the player could always inspect piece orientation. After the BackSide fix (BUG-003) the ghost correctly appeared when hovering over the container. It did not appear in the surrounding empty space.

### Root Cause
The hit box was sized as `container + 20` in each dimension (half-extent ~11 units). The camera can zoom out to a maximum distance of **22 units** from origin. At that zoom level the camera sits at roughly `[10.3, 10.3, 16.5]` — its z-component (16.5) already exceeds the hit box's z half-extent (11 for a 3×3×2 container). The camera exits the hit box.

The deeper issue: the turntable can rotate the hit box to any angle. The camera's maximum projection onto any local axis equals the camera's distance from origin (up to 22). So for the camera to always remain inside the box, the box's **inscribed sphere** (radius = half-extent) must be larger than 22. The old `container + 20` approach never satisfied this for any reasonable container at max zoom.

When the camera is outside the box and the cursor points away from the box, the ray from the camera misses the hit box entirely. No pointer event fires, `hoveredCell` stays null, ghost does not appear.

### Decision — iteration 1 (partial)
Changed the hit box to a fixed **50×50×50** size (half-extent 25 > 22, the camera's maximum orbit radius). This guaranteed the camera is always inside the box and all cursor positions trigger the hit box. However, `cellFromHit` still clamped all results to container boundary cells — so the ghost appeared at the container edge regardless of how far outside the cursor was. From the player's perspective the ghost was invisible outside the container; it was actually stuck at the boundary inside it.

### Decision — iteration 2 (final fix)
Three changes together resolved the bug:

**1. Frontoparallel plane projection (`Scene.tsx`)**  
Instead of reading the ghost position from the hit box's clamped boundary cell, the cursor ray is now projected onto a *frontoparallel plane* — a plane through the container's world-space center (origin) whose normal equals the camera direction. This gives a 3D world point at the container's apparent depth wherever the cursor is pointing. That point is converted to the turntable group's local frame and mapped to grid coordinates **without clamping**.

- If the resulting grid position is **inside** the container: the R3F cell-mesh `hoveredCell` takes over (precise grid snapping from the mesh hit — unaffected).
- If **outside**: the unclamped projection becomes `ghostCell` — the ghost floats freely in 3D space at the cursor's direction, shown in red (conflict) since those cells are out of bounds.

Placement clicks still use `hoveredCell` (set by R3F events), so the precise snap-to-grid behavior on click is preserved.

**2. Shadow floor raycasting disabled (`Scene.tsx`)**  
Added `raycast={() => {}}` to the shadow floor plane mesh. Without this, the floor could silently absorb pointer events for downward cursor directions before the hit box.

**3. Ghost cubes raycasting disabled (`UnitCube.tsx`, `Scene.tsx`)**  
Added a `raycast` prop to `UnitCube` and passed `() => {}` for all ghost cube instances. Semi-transparent ghost cubes were valid raycast targets that could intercept pointer events and prevent the hit box from firing. Disabling their raycasting makes them purely visual.

The ghost now follows the cursor anywhere in the 3D viewport — inside the container it snaps to the hovered grid cell; outside it floats at the projected cursor depth, showing the piece shape and orientation in red.

---

## BUG-005 — Clicking a placed piece lifted the wrong piece

**Status:** Fixed  
**Component:** `Container.tsx`

### Description
When the player clicked a placed piece to pick it back up, a different piece was lifted — typically a piece that happened to occupy a nearby cell, not the one under the cursor.

### Root Cause
The hit box's `handleClick` handled both placement (piece selected) and lifting (no piece selected). For lifting it called `cellFromHit(e)` — which uses face-normal inset math on the hit box surface, 10 units away from the container. The inset calculation at that distance was imprecise, often computing a cell adjacent to the one clicked rather than the cell under the cursor.

### Decision
Split responsibility by layer:
- **Lifting** moved entirely to `PieceMesh.onClick`. Each placed piece knows its own identity; clicking it directly lifts exactly that piece. `e.stopPropagation()` in `PieceMesh.handleClick` prevents the hit box from also firing.
- **Hit box** became placement-only. If `selectedShapeId` is null it returns early. The lifting else-branch was removed.

This eliminated the coordinate approximation entirely for lifting — no math needed when the click target is the mesh itself.

---

## BUG-006 — Ghost froze when cursor moved over a placed piece

**Status:** Fixed  
**Component:** `Container.tsx`, `PieceMesh.tsx`, `Scene.tsx`

### Description
After BUG-005 was fixed (restoring `onClick` on `PieceMesh`), the ghost stopped updating whenever the cursor was over a placed piece. The ghost snapped to the last known position and stayed frozen there until the cursor moved off the piece entirely.

### Root Cause
Restoring `onClick` on `PieceMesh` caused R3F to include those meshes in its raycast pool. When a `PieceMesh` became the nearest intersection, R3F fired `onPointerLeave` on the hit box (it was no longer the nearest hit). The hit box's `onPointerLeave` handler called `setHoveredCell(null)`, clearing the ghost. Moving the cursor back off the piece restored the hit box as nearest → `onPointerEnter` refired → ghost resumed. The ghost flickered or froze whenever a placed piece was in the way.

### Decision — three-part fix:

1. **Remove `onPointerLeave` from the hit box.** The hit box should never clear `hoveredCell`; that responsibility belongs to the DOM-level canvas leave event (see point 3).

2. **Add `onPointerMove` to `PieceMesh`.** When the cursor is over a placed piece and a piece is selected, the placed piece's surface hit is used to compute the hovered cell via `worldToLocal`:
   ```ts
   const localPt = e.object.parent!.worldToLocal(e.point.clone())
   const normal = (e as any).face?.normal ?? new THREE.Vector3(0, 1, 0)
   const inset = localPt.clone().addScaledVector(normal, -0.1)
   ```
   The parent group is the container group whose local space is integer grid coords, so flooring directly gives the cell. `e.stopPropagation()` prevents the hit box from also firing.

3. **DOM `pointerleave` listener on the canvas element** in `Scene.tsx` clears `hoveredCell` when the cursor physically leaves the canvas (moves to the tray, window edge, etc.). This replaces the R3F `onPointerLeave` approach, which was unreliable because R3F fires it when any closer mesh is hit — not when the cursor actually leaves the geometry.

---

## BUG-007 — Ghost didn't follow the cursor when moving through the container interior

**Status:** Fixed  
**Component:** `Container.tsx`

### Description
When the cursor moved across the interior of the container — hovering over empty cells — the ghost snapped to a wall of the container rather than the cell under the cursor. Moving slowly through the interior caused the ghost to jump erratically between boundary faces instead of tracking the cursor cell-by-cell.

### Root Cause
Empty cell meshes had `raycast={noRaycast}`, making them transparent to the R3F raycast system. Any ray aimed at an interior position passed straight through all the empty cell geometry and hit the large hit box's BackSide surface — always the exit face of the box (the far boundary in the ray direction). The face-normal inset math on that far surface consistently computed a boundary cell, not the interior cell the cursor was over.

### Decision
Make empty cell meshes real raycast targets by removing `raycast={noRaycast}` and adding `onPointerMove` and `onClick` handlers:

- **`onPointerMove`**: calls `e.stopPropagation()` to block the hit box, then `setHoveredCell(cell)` directly — no coordinate math needed because each mesh already knows its own cell.
- **`onClick`**: calls `e.stopPropagation()` then `placePiece(cell)` via the shared helper (see below).

The large hit box now handles only exterior positions — cursor in the space outside the container bounds, where no empty cell meshes exist.

A `placePiece(cell: Vec3)` helper was extracted to avoid duplicating placement logic between the empty cell handlers and the hit box `handleClick`.

### Final event-handling architecture

| Cursor position | Nearest mesh | Handler |
|---|---|---|
| Over an empty interior cell | Empty cell mesh | `setHoveredCell(cell)` directly |
| Over a placed piece (interior) | PieceMesh | `worldToLocal` surface math |
| Outside container bounds | Large hit box (BackSide) | `cellFromHit` face-normal inset math |

---

## BUG-008 — L-shaped pieces could not be placed: cursor not anchored to any cube

**Status:** Fixed  
**Component:** `puzzle.ts` — `getShapeCenter`

### Description
On puzzle #7, the two L-shaped pieces (5 cubes each) could not be placed. Hovering the cursor over a container cell showed the ghost, but the ghost appeared offset so that none of its cubes were at the cell under the cursor. The cursor floated in empty space between cubes, making it nearly impossible to intuit where the piece would land when clicked.

### Root Cause
`getShapeCenter` computed the centroid of the shape's cube positions and rounded each component. For the 5-cube L `(0,0,0),(1,0,0),(2,0,0),(2,1,0),(2,2,0)`:

- Centroid: `(7/5, 3/5, 0)` = `(1.4, 0.6, 0)`
- Rounded: `(1, 1, 0)`

`(1, 1, 0)` is not occupied by any cube in the L-shape. `placementOffset` then positioned the piece so that this empty grid point aligned with the hovered cell — so the entire ghost was shifted, with no actual cube at the cursor.

### Decision
Changed `getShapeCenter` to return the **cube in the shape closest to the centroid** rather than the rounded centroid itself. The result is always an actual cube, so the cursor is always visually anchored to a real part of the piece.

```ts
// Before — could land on empty space:
return {
  x: Math.round(cubes.reduce((s, c) => s + c.x, 0) / n),
  y: Math.round(cubes.reduce((s, c) => s + c.y, 0) / n),
  z: Math.round(cubes.reduce((s, c) => s + c.z, 0) / n),
}

// After — always a real cube:
let best = cubes[0]
let bestDist = Infinity
for (const c of cubes) {
  const d = (c.x - cx) ** 2 + (c.y - cy) ** 2 + (c.z - cz) ** 2
  if (d < bestDist) { bestDist = d; best = c }
}
return best
```

For symmetric shapes (2×2 square, straight bars) the nearest cube to the centroid is the same as the rounded centroid, so existing puzzles were unaffected. For the 5-cube L the anchor moved from the empty `(1,1)` point to `(1,0)`, one of the actual cubes in the horizontal arm.
