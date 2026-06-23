import { useMemo } from 'react'
import * as THREE from 'three'
import type { ThreeEvent } from '@react-three/fiber'
import type { Vec3, PlacedShape } from '../types'
import { PieceMesh } from './PieceMesh'
import { useGameStore } from '../store'
import { vec3Key, applyRotation, normalizeShape, placementOffset } from '../puzzle'
import { drag } from '../dragState'

interface Props {
  container: Vec3
  placedShapes: PlacedShape[]
}

function getEmptyCells(container: Vec3, placedShapes: PlacedShape[], validCells?: Vec3[]): Vec3[] {
  const occupied = new Set(placedShapes.flatMap(p => p.cubes).map(v => vec3Key(v)))
  if (validCells) {
    return validCells.filter(c => !occupied.has(vec3Key(c)))
  }
  const cells: Vec3[] = []
  for (let x = 0; x < container.x; x++)
    for (let y = 0; y < container.y; y++)
      for (let z = 0; z < container.z; z++)
        if (!occupied.has(vec3Key({ x, y, z }))) cells.push({ x, y, z })
  return cells
}

// ── Container boundary wireframe ──────────────────────────────────────────────
//
// An edge of the boundary wireframe is drawn if and only if it is shared by at
// least two *different* external face normals.  "External face" means a cell
// face whose grid-space neighbour is not part of the valid cell set.
//
// Coplanar external faces sharing an edge (same normal) cancel out — that edge
// lies in the interior of a flat face and must NOT be drawn.
// Non-coplanar external faces sharing an edge form a dihedral crease and MUST
// be drawn.  This correctly reproduces the exact outline of any polycube shape.

const FACE_DEFS = [
  {
    nKey: 'x+', dir: { x: 1, y: 0, z: 0 },
    corners: [{ x: 1, y: 0, z: 0 }, { x: 1, y: 1, z: 0 }, { x: 1, y: 1, z: 1 }, { x: 1, y: 0, z: 1 }],
  },
  {
    nKey: 'x-', dir: { x: -1, y: 0, z: 0 },
    corners: [{ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 1 }, { x: 0, y: 1, z: 1 }, { x: 0, y: 1, z: 0 }],
  },
  {
    nKey: 'y+', dir: { x: 0, y: 1, z: 0 },
    corners: [{ x: 0, y: 1, z: 0 }, { x: 1, y: 1, z: 0 }, { x: 1, y: 1, z: 1 }, { x: 0, y: 1, z: 1 }],
  },
  {
    nKey: 'y-', dir: { x: 0, y: -1, z: 0 },
    corners: [{ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 1 }, { x: 1, y: 0, z: 1 }, { x: 1, y: 0, z: 0 }],
  },
  {
    nKey: 'z+', dir: { x: 0, y: 0, z: 1 },
    corners: [{ x: 0, y: 0, z: 1 }, { x: 1, y: 0, z: 1 }, { x: 1, y: 1, z: 1 }, { x: 0, y: 1, z: 1 }],
  },
  {
    nKey: 'z-', dir: { x: 0, y: 0, z: -1 },
    corners: [{ x: 0, y: 0, z: 0 }, { x: 0, y: 1, z: 0 }, { x: 1, y: 1, z: 0 }, { x: 1, y: 0, z: 0 }],
  },
]

function buildContainerEdgeGeo(validCells: Vec3[]): THREE.BufferGeometry {
  const validSet = new Set(validCells.map(vec3Key))

  // Map from canonical edge key → set of face normal keys that include that edge
  const edgeNormals = new Map<string, Set<string>>()
  // Also store the actual point coordinates for each edge key
  const edgePoints  = new Map<string, [number[], number[]]>()

  for (const cell of validCells) {
    for (const face of FACE_DEFS) {
      const nx = cell.x + face.dir.x
      const ny = cell.y + face.dir.y
      const nz = cell.z + face.dir.z
      if (validSet.has(`${nx},${ny},${nz}`)) continue  // internal — skip

      // External face: record each of its 4 edges
      const pts = face.corners.map(c => [cell.x + c.x, cell.y + c.y, cell.z + c.z])

      for (let i = 0; i < 4; i++) {
        const a = pts[i]
        const b = pts[(i + 1) % 4]
        const ka = `${a[0]},${a[1]},${a[2]}`
        const kb = `${b[0]},${b[1]},${b[2]}`
        const ek = ka < kb ? `${ka}|${kb}` : `${kb}|${ka}`

        if (!edgeNormals.has(ek)) {
          edgeNormals.set(ek, new Set())
          edgePoints.set(ek, [a, b])
        }
        edgeNormals.get(ek)!.add(face.nKey)
      }
    }
  }

  const positions: number[] = []

  for (const [ek, normals] of edgeNormals) {
    // Draw only if at least two *different* normals share this edge.
    // A single normal (possibly repeated from two coplanar faces) means the
    // edge is interior to a flat surface — don't draw it.
    if (normals.size < 2) continue

    const [a, b] = edgePoints.get(ek)!
    positions.push(a[0], a[1], a[2], b[0], b[1], b[2])
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  return geo
}

const noRaycast = () => {}

// Snap an arbitrary grid cell to the nearest member of validCells (Manhattan distance).
function findNearestValidCell(target: Vec3, validCells: Vec3[]): Vec3 {
  let nearest = validCells[0]
  let minDist = Infinity
  for (const cell of validCells) {
    const d = Math.abs(cell.x - target.x) + Math.abs(cell.y - target.y) + Math.abs(cell.z - target.z)
    if (d < minDist) { minDist = d; nearest = cell }
    if (d === 0) break
  }
  return nearest
}

export function Container({ container, placedShapes }: Props) {
  const { puzzle, hintHighlight, selectedShapeId, setHoveredCell, placeShape, liftShape } = useGameStore()

  const cx = container.x / 2
  const cy = container.y / 2
  const cz = container.z / 2

  const hintShape = hintHighlight
    ? puzzle.solution.find(s => s.id === hintHighlight)
    : null

  const hintColor = puzzle.shapes.find(s => s.id === hintHighlight)?.color ?? '#ffffff'

  const { validCells } = puzzle
  const emptyCells = getEmptyCells(container, placedShapes, validCells)

  // Compute the exact boundary wireframe once per puzzle
  const containerEdgeGeo = useMemo(
    () => validCells ? buildContainerEdgeGeo(validCells) : null,
    [validCells],
  )

  // ── Hit-box helpers ───────────────────────────────────────────────────────
  // Convert a pointer event on the bounding-box mesh into a container grid cell.
  // The hit point is in world space; worldToLocal brings it into the box's local
  // frame (origin at box centre), then we inset 0.5 along the inward face normal
  // and floor to the nearest integer cell.
  function cellFromHit(e: ThreeEvent<PointerEvent | MouseEvent>): Vec3 {
    const boxLocal = e.object.worldToLocal(e.point.clone())
    const normal = (e as any).face?.normal ?? new THREE.Vector3(0, 1, 0)
    const inset = boxLocal.clone().addScaledVector(normal, -0.5)
    const cellX = Math.max(0, Math.min(container.x - 1, Math.floor(inset.x + cx)))
    const cellY = Math.max(0, Math.min(container.y - 1, Math.floor(inset.y + cy)))
    const cellZ = Math.max(0, Math.min(container.z - 1, Math.floor(inset.z + cz)))
    const raw = { x: cellX, y: cellY, z: cellZ }
    return validCells ? findNearestValidCell(raw, validCells) : raw
  }

  // Shared placement helper — used by empty cell meshes and the hit box.
  function placePiece(cell: Vec3) {
    const state = useGameStore.getState()
    const shapeId = state.selectedShapeId
    if (!shapeId) return
    const shape = state.puzzle.shapes.find(s => s.id === shapeId && !s.placed)
    if (!shape) return
    const shapeCubes = normalizeShape(applyRotation(shape.cubes, ...shape.rotation))
    placeShape(shapeId, placementOffset(shapeCubes, cell))
  }

  function handlePointerMove(e: ThreeEvent<PointerEvent>) {
    e.stopPropagation()
    if (!selectedShapeId) return
    setHoveredCell(cellFromHit(e))
  }

  function handleClick(e: ThreeEvent<MouseEvent>) {
    e.stopPropagation()
    if (drag.occurred) { drag.occurred = false; return }
    if (!useGameStore.getState().selectedShapeId) return  // lifting handled by PieceMesh onClick
    placePiece(cellFromHit(e))
  }

  return (
    <group position={[-cx, -cy, -cz]}>

      {validCells ? (
        /* ── Irregular container ─────────────────────────────────────────── */
        <>
          {/* Ghost fill: one transparent back-face cube per valid cell */}
          {validCells.map(cell => (
            <mesh
              key={`shell-${vec3Key(cell)}`}
              position={[cell.x + 0.5, cell.y + 0.5, cell.z + 0.5]}
              raycast={noRaycast}
            >
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial
                color="#6688bb"
                transparent
                opacity={0.07}
                side={THREE.BackSide}
                depthWrite={false}
              />
            </mesh>
          ))}

          {/* Exact boundary wireframe — traces the actual shape, not the bounding box */}
          {containerEdgeGeo && (
            <lineSegments geometry={containerEdgeGeo} raycast={noRaycast}>
              <lineBasicMaterial color="#5577bb" />
            </lineSegments>
          )}
        </>
      ) : (
        /* ── Rectangular container ───────────────────────────────────────── */
        <>
          <mesh position={[cx, cy, cz]} raycast={noRaycast}>
            <boxGeometry args={[container.x, container.y, container.z]} />
            <meshStandardMaterial
              color="#6688bb"
              transparent
              opacity={0.05}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
          <lineSegments position={[cx, cy, cz]} raycast={noRaycast}>
            <edgesGeometry args={[new THREE.BoxGeometry(container.x, container.y, container.z)]} />
            <lineBasicMaterial color="#5577bb" />
          </lineSegments>
        </>
      )}

      {/* Bottom face — warm amber tint to anchor orientation */}
      <mesh
        position={[cx, 0.01, cz]}
        rotation={[-Math.PI / 2, 0, 0]}
        raycast={noRaycast}
      >
        <planeGeometry args={[container.x, container.z]} />
        <meshStandardMaterial
          color="#cc9944"
          transparent
          opacity={0.14}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/*
        Large invisible hit surface — handles EXTERIOR cursor positions (empty
        space outside the container).  Empty cell meshes and PieceMeshes
        intercept interior rays first via stopPropagation, so this only fires
        when no closer mesh is hit.

        Size is a fixed 50×50×50 (half-extent 25) so the camera is always
        INSIDE the box regardless of zoom level or turntable angle.  The zoom
        range is 4–22 units from origin; the camera's maximum projection onto
        any axis equals its distance from origin (≤ 22), which is less than
        the half-extent of 25.  With BackSide material, rays from an interior
        camera always exit through the far inner face, guaranteeing a hit.
      */}
      <mesh
        position={[cx, cy, cz]}
        onPointerMove={handlePointerMove}
        onClick={handleClick}
      >
        <boxGeometry args={[50, 50, 50]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} side={THREE.BackSide} />
      </mesh>

      {/* Empty cell visual hints — also act as interior hover/click targets.
          Being the nearest mesh for any ray into an empty cell, they intercept
          before the large hit box (whose BackSide exit face is always farther).
          stopPropagation on both handlers keeps the hit box from firing too. */}
      {emptyCells.map(cell => (
        <mesh
          key={vec3Key(cell)}
          position={[cell.x + 0.5, cell.y + 0.5, cell.z + 0.5]}
          onPointerMove={(e) => {
            e.stopPropagation()
            if (!selectedShapeId) return
            setHoveredCell(cell)
          }}
          onClick={(e) => {
            e.stopPropagation()
            if (drag.occurred) { drag.occurred = false; return }
            placePiece(cell)
          }}
        >
          <boxGeometry args={[0.99, 0.99, 0.99]} />
          <meshStandardMaterial
            color="#aabbff"
            transparent
            opacity={0.04}
            depthWrite={false}
          />
        </mesh>
      ))}

      {/* Placed shapes — onClick lifts the piece; onPointerMove updates the ghost
          cell directly from the surface hit so the hit box (10 units away) never
          gets a chance to compute a wrong cell. stopPropagation on both keeps
          them cleanly isolated. */}
      {placedShapes.map(shape => (
        <PieceMesh
          key={shape.id}
          cubes={shape.cubes}
          color={shape.color}
          onClick={() => {
            if (drag.occurred) { drag.occurred = false; return }
            if (!useGameStore.getState().selectedShapeId) liftShape(shape.id)
          }}
          onPointerMove={(e) => {
            e.stopPropagation()
            if (!selectedShapeId) return
            const localPt = e.object.parent!.worldToLocal(e.point.clone())
            const normal = (e as any).face?.normal ?? new THREE.Vector3(0, 1, 0)
            const inset = localPt.clone().addScaledVector(normal, -0.1)
            const raw = {
              x: Math.max(0, Math.min(container.x - 1, Math.floor(inset.x))),
              y: Math.max(0, Math.min(container.y - 1, Math.floor(inset.y))),
              z: Math.max(0, Math.min(container.z - 1, Math.floor(inset.z))),
            }
            setHoveredCell(validCells ? findNearestValidCell(raw, validCells) : raw)
          }}
        />
      ))}

      {/* Hint highlight — show the solution position for one unplaced piece */}
      {hintShape && (
        <PieceMesh
          key={`hint-${hintHighlight}`}
          cubes={hintShape.cubes}
          color={hintColor}
          opacity={0.38}
          castShadow={false}
        />
      )}
    </group>
  )
}
