import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import type { Vec3 } from '../types'
import { PieceMesh } from './PieceMesh'
import { useIsMobile } from '../hooks'

interface Props {
  cubes: Vec3[]
  color: string
}

export function ShapePreview3D({ cubes, color }: Props) {
  const isMobile = useIsMobile()

  // On mobile each ShapePreview3D would create its own WebGL context.
  // With 8 hard-puzzle pieces + 1 main canvas = 9 contexts, which exceeds
  // Android's typical limit of 8 — killing the main canvas (white screen).
  // Use a simple colored tile on mobile instead.
  if (isMobile) {
    return (
      <div style={{
        width: 48,
        height: 48,
        borderRadius: 8,
        background: color + '99',
        border: `2px solid ${color}`,
      }} />
    )
  }

  const minX = Math.min(...cubes.map(c => c.x))
  const minY = Math.min(...cubes.map(c => c.y))
  const minZ = Math.min(...cubes.map(c => c.z))
  const maxX = Math.max(...cubes.map(c => c.x))
  const maxY = Math.max(...cubes.map(c => c.y))
  const maxZ = Math.max(...cubes.map(c => c.z))

  const cx = (minX + maxX) / 2 + 0.5
  const cy = (minY + maxY) / 2 + 0.5
  const cz = (minZ + maxZ) / 2 + 0.5

  const span = Math.max(maxX - minX, maxY - minY, maxZ - minZ) + 1
  const dist = span * 1.4 + 1.0

  return (
    <Canvas
      camera={{ position: [cx + dist, cy + dist * 0.7, cz + dist], fov: 40 }}
      style={{ width: 120, height: 120, background: 'transparent', pointerEvents: 'none' }}
      gl={{ alpha: true, antialias: true }}
      onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
    >
      <ambientLight intensity={0.5} color="#99bbff" />
      <directionalLight position={[5, 10, 5]}  intensity={1.6} color="#fff8f0" />
      <directionalLight position={[-8, 2, -4]} intensity={0.6} color="#3355dd" />
      <directionalLight position={[0, -6, 0]}  intensity={0.15} color="#554433" />
      <group position={[-cx, -cy, -cz]}>
        <PieceMesh cubes={cubes} color={color} />
      </group>
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate
        autoRotateSpeed={2.5}
        target={[0, 0, 0]}
      />
    </Canvas>
  )
}
