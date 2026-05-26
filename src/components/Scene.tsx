import { useRef, useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useGameStore } from '../store'
import { Container } from './Container'
import { UnitCube } from './UnitCube'
import { applyRotation, normalizeShape, addOffset, placementOffset, cubesInBounds, cubesOverlap, vec3Key } from '../puzzle'
import { drag } from '../dragState'

export function Scene() {
  const { puzzle, placedShapes, selectedShapeId, hoveredCell, currentDifficulty, currentPuzzleIndex } = useGameStore()
  const groupRef = useRef<THREE.Group>(null)
  const { gl: { domElement }, camera } = useThree()

  // ── Ghost preview ────────────────────────────────────────────────────────
  const selectedShape = puzzle.shapes.find(s => s.id === selectedShapeId && !s.placed)
  const shapeCubes = selectedShape
    ? normalizeShape(applyRotation(selectedShape.cubes, ...selectedShape.rotation))
    : null

  const offset = hoveredCell && shapeCubes ? placementOffset(shapeCubes, hoveredCell) : null
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

  const cx = puzzle.container.x / 2
  const cy = puzzle.container.y / 2
  const cz = puzzle.container.z / 2

  const floorY = -cy - 1.2


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
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, floorY, 0]} receiveShadow>
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

        {/* Snap ghost: shown when hovering over the container */}
        {classifiedGhost && (
          <group position={[-cx, -cy, -cz]}>
            {classifiedGhost.map(({ cube, conflict }) => (
              <UnitCube
                key={`ghost-${vec3Key(cube)}`}
                position={cube}
                color={conflict ? '#ff4444' : '#ffffff'}
                opacity={conflict ? 0.40 : 0.55}
              />
            ))}
          </group>
        )}


      </group>
    </>
  )
}
