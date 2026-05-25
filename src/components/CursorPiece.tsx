import { useState, useEffect } from 'react'
import { useGameStore } from '../store'
import { applyRotation, normalizeShape } from '../puzzle'

// Scale: pixels per unit in the isometric projection
const S = 16

// Fixed SVG canvas — large enough to hold any rotated piece without jumping
const CANVAS = 160

// Isometric projection: world (x,y,z) → screen (bx, by)
// Viewpoint is from upper-right-front (+x,+y,+z direction)
// +X goes right-down, +Y goes straight up, +Z goes left-down
function iso(x: number, y: number, z: number) {
  return {
    bx: (x - z) * S,
    by: ((x + z) / 2 - y) * S,
  }
}

// Lighten or darken a hex color by a multiplier
function tint(hex: string, factor: number): string {
  const r = Math.min(255, Math.round(parseInt(hex.slice(1, 3), 16) * factor))
  const g = Math.min(255, Math.round(parseInt(hex.slice(3, 5), 16) * factor))
  const b = Math.min(255, Math.round(parseInt(hex.slice(5, 7), 16) * factor))
  return `rgb(${r},${g},${b})`
}

function pts(...coords: [number, number][]): string {
  return coords.map(([x, y]) => `${x},${y}`).join(' ')
}

// Draws one isometric cube at grid position (x,y,z) with three visible faces
function IsoCube({ x, y, z, color }: { x: number; y: number; z: number; color: string }) {
  const { bx, by } = iso(x, y, z)

  // Top face (y+1 surface) — lightest, faces the light
  const top = pts(
    [bx,      by - S    ],  // back
    [bx + S,  by - S / 2],  // right
    [bx,      by        ],  // front
    [bx - S,  by - S / 2],  // left
  )

  // Right face (x+1 surface) — medium shade
  const right = pts(
    [bx,      by        ],
    [bx + S,  by - S / 2],
    [bx + S,  by + S / 2],
    [bx,      by + S    ],
  )

  // Left face (z+1 surface) — darkest shade
  const left = pts(
    [bx,      by        ],
    [bx,      by + S    ],
    [bx - S,  by + S / 2],
    [bx - S,  by - S / 2],
  )

  const stroke = 'rgba(0,0,0,0.25)'
  const sw = 0.5

  return (
    <g>
      <polygon points={top}   fill={tint(color, 1.25)} stroke={stroke} strokeWidth={sw} />
      <polygon points={right} fill={tint(color, 0.80)} stroke={stroke} strokeWidth={sw} />
      <polygon points={left}  fill={tint(color, 0.55)} stroke={stroke} strokeWidth={sw} />
    </g>
  )
}

export function CursorPiece() {
  const { puzzle, selectedShapeId } = useGameStore()
  const [pos, setPos] = useState({ x: -999, y: -999 })

  useEffect(() => {
    const onMove = (e: MouseEvent) => setPos({ x: e.clientX, y: e.clientY })
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  const shape = puzzle.shapes.find(s => s.id === selectedShapeId && !s.placed)
  if (!shape) return null

  const cubes = normalizeShape(applyRotation(shape.cubes, ...shape.rotation))

  // Painter's algorithm: draw farther cubes first so near cubes render on top.
  // Viewer is at (+∞,+∞,+∞), so depth = x+y+z — draw smaller depth first.
  const sorted = [...cubes].sort((a, b) =>
    (a.x + a.y + a.z) - (b.x + b.y + b.z)
  )

  // Compute centroid of projected piece so we can center it in the fixed canvas
  const projected = cubes.map(c => iso(c.x, c.y, c.z))
  const cx = projected.reduce((s, p) => s + p.bx, 0) / projected.length
  const cy = projected.reduce((s, p) => s + p.by, 0) / projected.length

  const half = CANVAS / 2

  return (
    <div
      style={{
        position: 'fixed',
        left: pos.x + 20,
        top: pos.y - half,
        pointerEvents: 'none',
        zIndex: 1000,
      }}
    >
      <svg
        width={CANVAS}
        height={CANVAS}
        viewBox={`${cx - half} ${cy - half} ${CANVAS} ${CANVAS}`}
        style={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.6))', overflow: 'visible' }}
      >
        {sorted.map((c, i) => (
          <IsoCube key={i} x={c.x} y={c.y} z={c.z} color={shape.color} />
        ))}
      </svg>
    </div>
  )
}
