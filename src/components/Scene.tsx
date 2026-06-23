import { useRef, useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useGameStore } from '../store'
import { Container } from './Container'
import { UnitCube } from './UnitCube'
import { applyRotation, normalizeShape, addOffset, placementOffset, cubesInBounds, cubesOverlap, vec3Key } from '../puzzle'
import { drag } from '../dragState'
import type { Vec3 } from '../types'

export function Scene() {
  const { puzzle, placedShapes, selectedShapeId, hoveredCell, currentDifficulty, currentPuzzleIndex } = useGameStore()
  const groupRef = useRef<THREE.Group>(null)
  const { gl: { domElement }, camera } = useThree()

  // ── Mouse tracking for exterior ghost ───────────────────────────────────
  // NDC coords updated on every DOM pointermove so we can project a cursor
  // ray onto a frontoparallel plane independently of the R3F event system.
  const mouseNDC = useRef(new THREE.Vector2())
  const raycasterRef = useRef(new THREE.Raycaster())

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
  let ghostCell: Vec3 | null = hoveredCell

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

  const occupied = placedShapes.flatMap(p => p.cubes)
  const classifiedGhost = ghostCubes
    ? ghostCubes.map(cube => ({
        cube,
        conflict:
          !cubesInBounds([cube], puzzle.container, puzzle.validCells) ||
          cubesOverlap([cube], occupied),
      }))
    : null

  const floorY = -cy - 1.2


  // Clear hoveredCell when cursor leaves the canvas (e.g. moves to the tray).
  // The R3F onPointerLeave on the hit box was removed to avoid it firing when
  // cursor moves over a placed piece, so we use the DOM event instead.
  useEffect(() => {
    const clear = () => useGameStore.getState().setHoveredCell(null)
    domElement.addEventListener('pointerleave', clear)
    return () => domElement.removeEventListener('pointerleave', clear)
  }, [domElement])

  // ── Turntable controls ───────────────────────────────────────────────────
  // The scene GROUP rotates in response to drag; the camera and lights stay
  // fixed in world-space so lighting never shifts from the viewer's perspective.
  useEffect(() => {
    let active   = false
    let startX   = 0, startY = 0
    let lastX    = 0, lastY  = 0
    let rotX     = 0, rotY   = 0   // current Euler angles on the group

    function onPointerDown(e: PointerEvent) {
      if (e.button !== 0) return
      if (useGameStore.getState().selectedShapeId) return  // piece held — drag moves ghost, not scene
      active  = true
      drag.occurred = false
      startX = lastX = e.clientX
      startY = lastY = e.clientY
      domElement.setPointerCapture(e.pointerId)
    }

    function onPointerMove(e: PointerEvent) {
      if (!active || !groupRef.current) return
      const dx = e.clientX - lastX
      const dy = e.clientY - lastY
      if (Math.hypot(e.clientX - startX, e.clientY - startY) > 4) {
        drag.occurred = true
      }
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
      active = false
      domElement.releasePointerCapture(e.pointerId)
    }

    function onWheel(e: WheelEvent) {
      e.preventDefault()
      // Zoom by scaling the camera's distance from origin, keeping direction.
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
