import { useRef, useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useGameStore } from '../store'
import { Container } from './Container'
import { UnitCube } from './UnitCube'
import { applyRotation, normalizeShape, addOffset, placementOffset, vec3Key } from '../puzzle'
import { drag } from '../dragState'
import type { Vec3 } from '../types'

export function Scene() {
  const { puzzle, placedShapes, selectedShapeId, hoveredCell, currentDifficulty, currentPuzzleIndex } = useGameStore()
  const groupRef = useRef<THREE.Group>(null)
  const { gl: { domElement }, camera } = useThree()

  // ── Mouse tracking for exterior ghost ───────────────────────────────────
  // NDC coords updated on every DOM pointermove so we can project a cursor
  // ray onto a frontoparallel plane independently of the R3F event system.
  const mouseNDC    = useRef(new THREE.Vector2())
  const raycasterRef = useRef(new THREE.Raycaster())
  // Ghost drag state — tracks the ghost cube positions (set each render) so the
  // DOM-level onPointerDown can raycast against them without R3F event ordering concerns.
  const ghostCubesRef    = useRef<Vec3[] | null>(null)
  const containerHalfRef = useRef({ cx: 0, cy: 0, cz: 0 })
  const ghostDragging    = useRef(false)

  useEffect(() => {
    function onMove(e: PointerEvent) {
      const rect = domElement.getBoundingClientRect()
      mouseNDC.current.x =  ((e.clientX - rect.left) / rect.width)  * 2 - 1
      mouseNDC.current.y = -((e.clientY - rect.top)  / rect.height) * 2 + 1
    }
    domElement.addEventListener('pointermove', onMove)
    return () => domElement.removeEventListener('pointermove', onMove)
  }, [domElement])

  // ── Ghost preview ────────────────────────────────────────────────────────
  const selectedShape = puzzle.shapes.find(s => s.id === selectedShapeId && !s.placed)
  const shapeCubes = selectedShape
    ? normalizeShape(applyRotation(selectedShape.cubes, ...selectedShape.rotation))
    : null

  const cx = puzzle.container.x / 2
  const cy = puzzle.container.y / 2
  const cz = puzzle.container.z / 2

  // Compute the ghost cell from two sources:
  //   Interior — hoveredCell (set by R3F cell-mesh / PieceMesh events, precise)
  //   Exterior — frontoparallel plane projection (follows cursor in free space)
  //
  // The frontoparallel plane passes through world origin (container centre) with
  // normal = camera direction.  Projecting the cursor ray onto it gives the 3D
  // world point at the container's apparent depth.  Converting that point to
  // the turntable group's local frame and then to grid coords (no clamping)
  // lets the ghost float OUTSIDE the container when cursor is in empty space.
  //
  // Interior cursor positions are handled by the R3F cell-mesh events (hoveredCell),
  // which remain authoritative for placement clicks.  The plane projection is only
  // used for the ghost DISPLAY; placement always uses hoveredCell.
  // Default: show ghost just above the container centre when a piece is held
  // but hoveredCell hasn't been set yet (e.g. on mobile right after selecting
  // from the tray). The exterior-ghost ray projection overrides this as soon
  // as the pointer moves over the canvas.
  let ghostCell: Vec3 | null =
    hoveredCell ??
    (selectedShapeId
      ? { x: Math.floor(puzzle.container.x / 2), y: puzzle.container.y + 1, z: Math.floor(puzzle.container.z / 2) }
      : null)

  if (selectedShapeId && shapeCubes && groupRef.current) {
    raycasterRef.current.setFromCamera(mouseNDC.current, camera)
    const planeNormal = camera.position.clone().normalize()
    const plane = new THREE.Plane(planeNormal, 0)
    const pt = new THREE.Vector3()
    if (raycasterRef.current.ray.intersectPlane(plane, pt)) {
      const local = groupRef.current.worldToLocal(pt)
      const gx = Math.floor(local.x + cx)
      const gy = Math.floor(local.y + cy)
      const gz = Math.floor(local.z + cz)
      const inside =
        gx >= 0 && gx < puzzle.container.x &&
        gy >= 0 && gy < puzzle.container.y &&
        gz >= 0 && gz < puzzle.container.z
      if (!inside) {
        // Exterior: ghost floats freely at the projected cursor position.
        ghostCell = { x: gx, y: gy, z: gz }
      }
      // Interior: keep hoveredCell (precise R3F snap).
    }
  }

  const offset = ghostCell && shapeCubes ? placementOffset(shapeCubes, ghostCell) : null
  const ghostCubes = offset && shapeCubes ? addOffset(shapeCubes, offset) : null

  const classifiedGhost = ghostCubes
    ? ghostCubes.map(cube => ({ cube, conflict: false }))
    : null

  // Keep refs current so the DOM-level turntable handler can raycast against them
  ghostCubesRef.current    = ghostCubes
  containerHalfRef.current = { cx, cy, cz }

  const floorY = -cy - 1.2


  // Clear hoveredCell when cursor leaves the canvas (e.g. moves to the tray).
  // The R3F onPointerLeave on the hit box was removed to avoid it firing when
  // cursor moves over a placed piece, so we use the DOM event instead.
  useEffect(() => {
    const clear = () => useGameStore.getState().setHoveredCell(null)
    domElement.addEventListener('pointerleave', clear)
    return () => domElement.removeEventListener('pointerleave', clear)
  }, [domElement])

  // ── Turntable + pinch-zoom controls ─────────────────────────────────────
  // The scene GROUP rotates in response to single-finger/mouse drag.
  // Two-finger pinch zooms the camera. On touch, lifting the finger while
  // a piece is held places the piece at the current hoveredCell.
  useEffect(() => {
    let active    = false
    let startX    = 0, startY = 0
    let lastX     = 0, lastY  = 0
    let rotX      = 0, rotY   = 0
    const ptrs    = new Map<number, { x: number; y: number }>()
    let pinchDist = 0

    function onPointerDown(e: PointerEvent) {
      if (e.button !== 0) return
      ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY })

      if (ptrs.size === 2) {
        // Second finger — switch to pinch mode, stop turntable
        active = false
        const [a, b] = [...ptrs.values()]
        pinchDist = Math.hypot(b.x - a.x, b.y - a.y)
        return
      }

      // If the pointer lands on the ghost piece, enter ghost-drag mode instead
      // of rotating the scene. We raycast against the ghost cube positions
      // directly in the DOM handler — no R3F event ordering dependency.
      const cubes = ghostCubesRef.current
      if (cubes && groupRef.current) {
        const rect = domElement.getBoundingClientRect()
        raycasterRef.current.setFromCamera(
          new THREE.Vector2(
            ((e.clientX - rect.left) / rect.width)  *  2 - 1,
            ((e.clientY - rect.top)  / rect.height) * -2 + 1,
          ),
          camera,
        )
        const { cx, cy, cz } = containerHalfRef.current
        const mw = groupRef.current.matrixWorld
        for (const cube of cubes) {
          const center = new THREE.Vector3(
            cube.x + 0.5 - cx,
            cube.y + 0.5 - cy,
            cube.z + 0.5 - cz,
          ).applyMatrix4(mw)
          const box = new THREE.Box3().setFromCenterAndSize(center, new THREE.Vector3(0.95, 0.95, 0.95))
          if (raycasterRef.current.ray.intersectsBox(box)) {
            ghostDragging.current = true
            return  // Don't activate turntable
          }
        }
      }

      active = true
      drag.occurred = false
      startX = lastX = e.clientX
      startY = lastY = e.clientY
      domElement.setPointerCapture(e.pointerId)
    }

    function onPointerMove(e: PointerEvent) {
      ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY })

      if (ptrs.size >= 2) {
        // Pinch zoom: scale camera distance by ratio of current / previous pinch distance
        const [a, b] = [...ptrs.values()]
        const dist = Math.hypot(b.x - a.x, b.y - a.y)
        if (pinchDist > 0) {
          const newDist = Math.max(4, Math.min(22, camera.position.length() * (pinchDist / dist)))
          camera.position.setLength(newDist)
        }
        pinchDist = dist
        return
      }

      if (!active || !groupRef.current) return
      const dx = e.clientX - lastX
      const dy = e.clientY - lastY
      if (Math.hypot(e.clientX - startX, e.clientY - startY) > 4) drag.occurred = true
      if (drag.occurred) {
        rotY += dx * 0.008
        rotX  = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, rotX + dy * 0.008))
        groupRef.current.rotation.y = rotY
        groupRef.current.rotation.x = rotX
      }
      lastX = e.clientX
      lastY = e.clientY
    }

    function onPointerUp(e: PointerEvent) {
      // Ghost drag ended — place piece at current hoveredCell if one is set
      if (ghostDragging.current) {
        const state = useGameStore.getState()
        if (state.selectedShapeId && state.hoveredCell) {
          const shape = state.puzzle.shapes.find(s => s.id === state.selectedShapeId && !s.placed)
          if (shape) {
            const sc = normalizeShape(applyRotation(shape.cubes, ...shape.rotation))
            state.placeShape(state.selectedShapeId, placementOffset(sc, state.hoveredCell))
          }
        }
        ghostDragging.current = false
      }
      ptrs.delete(e.pointerId)
      if (ptrs.size < 2) pinchDist = 0
      active = false
      domElement.releasePointerCapture(e.pointerId)
    }

    function onWheel(e: WheelEvent) {
      e.preventDefault()
      const dist    = camera.position.length()
      const newDist = Math.max(4, Math.min(22, dist * (1 + e.deltaY * 0.001)))
      camera.position.setLength(newDist)
    }

    domElement.addEventListener('pointerdown', onPointerDown)
    domElement.addEventListener('pointermove', onPointerMove)
    domElement.addEventListener('pointerup',   onPointerUp)
    domElement.addEventListener('wheel',       onWheel, { passive: false })

    return () => {
      domElement.removeEventListener('pointerdown', onPointerDown)
      domElement.removeEventListener('pointermove', onPointerMove)
      domElement.removeEventListener('pointerup',   onPointerUp)
      domElement.removeEventListener('wheel',       onWheel)
    }
  }, [domElement, camera])

  return (
    <>
      {/* ── Scene settings ─────────────────────────────────────────────── */}
      <color attach="background" args={['#111827']} />
      <fog attach="fog" args={['#111827', 20, 45]} />

      {/* ── Lights (world-space — never move) ──────────────────────────── */}
      <ambientLight intensity={0.45} color="#99bbff" />

      <directionalLight
        position={[5, 12, 5]}
        intensity={1.8}
        color="#fff8f0"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={1}
        shadow-camera-far={40}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
        shadow-bias={-0.0005}
      />
      <directionalLight position={[-12, 3,  2]} intensity={0.7} color="#3355dd" />
      <directionalLight position={[ 12, 3, -2]} intensity={0.5} color="#2244cc" />
      <directionalLight position={[  0, 2,-12]} intensity={0.4} color="#1a33bb" />
      <directionalLight position={[  0,-10,  0]} intensity={0.18} color="#554433" />

      {/*
        Shadow floor — outside the turntable group so it stays horizontal
        in world-space.  Shadows from the rotating group above still project
        onto it correctly because Three.js renders shadows in world-space.
      */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, floorY, 0]} receiveShadow raycast={() => {}}>
        <planeGeometry args={[30, 30]} />
        <shadowMaterial transparent opacity={0.40} />
      </mesh>

      {/* ── Turntable group — everything the player interacts with ─────── */}
      <group ref={groupRef}>
        <Container
          key={`${currentDifficulty}-${currentPuzzleIndex}`}
          container={puzzle.container}
          placedShapes={placedShapes}
        />

        {/* Snap ghost: shown when hovering over or near the container.
            raycast={() => {}} prevents these transparent cubes from
            intercepting pointer events meant for the hit box. */}
        {classifiedGhost && (
          <group position={[-cx, -cy, -cz]}>
            {classifiedGhost.map(({ cube, conflict }) => (
              <UnitCube
                key={`ghost-${vec3Key(cube)}`}
                position={cube}
                color={conflict ? '#ff4444' : '#ffffff'}
                opacity={conflict ? 0.40 : 0.55}
                raycast={() => {}}
              />
            ))}
          </group>
        )}


      </group>
    </>
  )
}
