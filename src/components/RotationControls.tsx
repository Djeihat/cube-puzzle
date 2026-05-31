import { useEffect } from 'react'
import { useGameStore } from '../store'

// Maps key → axis + direction
const KEY_MAP: Record<string, { axis: 'x' | 'y' | 'z'; dir: 1 | -1 }> = {
  q: { axis: 'y', dir: -1 },
  e: { axis: 'y', dir:  1 },
  w: { axis: 'x', dir: -1 },
  s: { axis: 'x', dir:  1 },
  a: { axis: 'z', dir: -1 },
  d: { axis: 'z', dir:  1 },
}

// Legend rows: [left key, right key], axis label, color
const BINDINGS = [
  { keys: ['Q', 'E'] as const, label: 'Y', color: '#2ECC71' },
  { keys: ['W', 'S'] as const, label: 'X', color: '#E74C3C' },
  { keys: ['A', 'D'] as const, label: 'Z', color: '#4A90D9' },
]

export function RotationControls() {
  const { selectedShapeId, rotateSelected, selectShape, puzzle } = useGameStore()
  const selected = puzzle.shapes.find(s => s.id === selectedShapeId && !s.placed)

  useEffect(() => {
    if (!selected) return

    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.key === 'Escape') { e.preventDefault(); selectShape(null); return }
      const binding = KEY_MAP[e.key.toLowerCase()]
      if (!binding) return
      e.preventDefault()
      rotateSelected(binding.axis, binding.dir)
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selected, rotateSelected, selectShape])

  if (!selected) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: 28,
      left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex',
      gap: 16,
      alignItems: 'center',
      background: 'rgba(8,14,30,0.88)',
      borderRadius: 14,
      padding: '9px 20px',
      border: '1px solid rgba(100,140,255,0.15)',
      backdropFilter: 'blur(6px)',
      zIndex: 10,
      userSelect: 'none',
    }}>
      <span style={{
        color: '#555',
        fontSize: 10,
        textTransform: 'uppercase',
        letterSpacing: 1.2,
        marginRight: 2,
      }}>
        Rotate
      </span>

      {BINDINGS.map(({ keys, label, color }) => (
        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <KeyCap label={keys[0]} color={color} />
          <KeyCap label={keys[1]} color={color} />
          <span style={{
            color,
            fontSize: 10,
            fontWeight: 700,
            marginLeft: 3,
            letterSpacing: 0.5,
          }}>
            {label}
          </span>
        </div>
      ))}

      <div style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.08)', margin: '0 4px' }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <KeyCap label="Esc" color="#888" wide />
        <span style={{ color: '#888', fontSize: 10, fontWeight: 600, letterSpacing: 0.5 }}>
          Drop
        </span>
      </div>
    </div>
  )
}

function KeyCap({ label, color, wide }: { label: string; color: string; wide?: boolean }) {
  return (
    <div style={{
      width: wide ? 40 : 26,
      height: 26,
      borderRadius: 6,
      border: `1px solid ${color}44`,
      background: `${color}16`,
      color,
      fontSize: wide ? 10 : 12,
      fontWeight: 700,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'ui-monospace, SFMono-Regular, monospace',
      boxShadow: `0 2px 0 ${color}22`,
    }}>
      {label}
    </div>
  )
}
