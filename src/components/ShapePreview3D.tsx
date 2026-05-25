import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import type { Vec3 } from '../types'
import { PieceMesh } from './PieceMesh'

interface Props {
  cubes: Vec3[]
  color: string
}

export function ShapePreview3D({ cubes, color }: Props) {
  const minX = Math.min(...cubes.map(c => c.x))
  const minY = Math.min(...cubes.map(c => c.y))
  const minZ = Math.min(...cubes.map(c => c.z))
  const maxX = Math.max(...cubes.map(c => c.x))
  const maxY = Math.max(...cubes.map(c => c.y))
  const maxZ = Math.max(...cubes.map(c => c.z))

  // Centre of the shape in grid space (+0.5 to account for cube size)
  const cx = (minX + maxX) / 2 + 0.5
  const cy = (minY + maxY) / 2 + 0.5
  const cz = (minZ + maxZ) / 2 + 0.5

  const span = Math.max(maxX - minX, maxY - minY, maxZ - minZ) + 1
  const dist = span * 1.4 + 1.0

  return (
    <Canvas
      camera={{ position: [cx + dist, cy + dist * 0.7, cz + dist], fov: 40 }}
      style={{ width: 120, height: 120, background: 'transparent' }}
      gl={{ alpha: true, antialias: true }}
      onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
    >
      {/* Match the blue-room lighting of the main scene */}
      <ambientLight intensity={0.5} color="#99bbff" />
      <directionalLight position={[5, 10, 5]}  intensity={1.6} color="#fff8f0" />
      <directionalLight position={[-8, 2, -4]} intensity={0.6} color="#3355dd" />
      <directionalLight position={[0, -6, 0]}  intensity={0.15} color="#554433" />

      {/* Render the piece as a single connected mesh */}
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
