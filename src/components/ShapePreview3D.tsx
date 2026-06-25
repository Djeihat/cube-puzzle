import { useRef, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import type { Vec3 } from '../types'
import { PieceMesh } from './PieceMesh'
import { useIsMobile } from '../hooks'

interface Props {
  cubes: Vec3[]
  color: string
}

// ── Mobile: 2D isometric canvas — zero WebGL contexts ────────────────────────
// Each ShapePreview3D used to create its own WebGL <Canvas>. With 8 hard-puzzle
// pieces + 1 main canvas = 9 contexts, which exceeds Android's typical limit of
// ~8, killing the main canvas. This 2D renderer uses the CPU canvas API instead.

function IsometricPreview({ cubes, color }: Props) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const SIZE = 72
    const dpr  = window.devicePixelRatio || 1
    canvas.width  = SIZE * dpr
    canvas.height = SIZE * dpr
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, SIZE, SIZE)

    // Parse hex color → RGB for face shading
    const hex = color.replace('#', '')
    const r = parseInt(hex.slice(0, 2), 16)
    const g = parseInt(hex.slice(2, 4), 16)
    const b = parseInt(hex.slice(4, 6), 16)
    const rgb  = (rr: number, gg: number, bb: number) => `rgb(${rr},${gg},${bb})`
    const top   = rgb(r, g, b)
    const right = rgb(Math.round(r * 0.7), Math.round(g * 0.7), Math.round(b * 0.7))
    const left  = rgb(Math.round(r * 0.5), Math.round(g * 0.5), Math.round(b * 0.5))

    const cs = 11  // isometric cell half-width

    // Isometric projection: (x,y,z) → screen (sx, sy)
    const project = (x: number, y: number, z: number) => ({
      sx: (x - z) * cs,
      sy: (x + z) * cs * 0.5 - y * cs,
    })

    // Compute screen-space bounds to center the piece
    const pts = cubes.map(c => project(c.x, c.y, c.z))
    const minSx = Math.min(...pts.map(p => p.sx))
    const maxSx = Math.max(...pts.map(p => p.sx))
    const minSy = Math.min(...pts.map(p => p.sy))
    const maxSy = Math.max(...pts.map(p => p.sy))
    const ox = SIZE / 2 - (minSx + maxSx) / 2
    const oy = SIZE / 2 - (minSy + maxSy) / 2 + cs * 0.5

    // Painter's algorithm: draw back cubes first
    const sorted = [...cubes].sort((a, b) => (a.x + a.z) - (b.x + b.z) || a.y - b.y)

    ctx.lineWidth = 0.5
    ctx.strokeStyle = 'rgba(0,0,0,0.25)'

    for (const cube of sorted) {
      const { sx, sy } = project(cube.x, cube.y, cube.z)
      const px = sx + ox
      const py = sy + oy

      // Top face
      ctx.fillStyle = top
      ctx.beginPath()
      ctx.moveTo(px,      py - cs)
      ctx.lineTo(px + cs, py - cs * 0.5)
      ctx.lineTo(px,      py)
      ctx.lineTo(px - cs, py - cs * 0.5)
      ctx.closePath()
      ctx.fill(); ctx.stroke()

      // Right face
      ctx.fillStyle = right
      ctx.beginPath()
      ctx.moveTo(px,      py)
      ctx.lineTo(px + cs, py - cs * 0.5)
      ctx.lineTo(px + cs, py + cs * 0.5)
      ctx.lineTo(px,      py + cs)
      ctx.closePath()
      ctx.fill(); ctx.stroke()

      // Left face
      ctx.fillStyle = left
      ctx.beginPath()
      ctx.moveTo(px,      py)
      ctx.lineTo(px - cs, py - cs * 0.5)
      ctx.lineTo(px - cs, py + cs * 0.5)
      ctx.lineTo(px,      py + cs)
      ctx.closePath()
      ctx.fill(); ctx.stroke()
    }
  }, [cubes, color])

  return (
    <canvas
      ref={ref}
      style={{ width: 72, height: 72, display: 'block' }}
    />
  )
}

// ── Desktop: full 3D rotating preview ────────────────────────────────────────

export function ShapePreview3D({ cubes, color }: Props) {
  const isMobile = useIsMobile()

  if (isMobile) return <IsometricPreview cubes={cubes} color={color} />

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
