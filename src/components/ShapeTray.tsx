import { useGameStore } from '../store'
import { applyRotation, normalizeShape } from '../puzzle'
import { useIsMobile } from '../hooks'
import { ShapePreview3D } from './ShapePreview3D'

export function ShapeTray() {
  const { puzzle, selectedShapeId, selectShape, won } = useGameStore()
  const isMobile = useIsMobile()
  const unplaced  = puzzle.shapes.filter(s => !s.placed)

  if (won) return null

  if (isMobile) {
    return (
      <div data-ui-overlay style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'rgba(8,14,30,0.92)',
        borderTop: '1px solid rgba(100,140,255,0.18)',
        zIndex: 10,
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}>
        <div style={{
          display: 'flex',
          gap: 8,
          overflowX: 'auto',
          padding: '8px 12px',
          scrollbarWidth: 'none',
        }}>
          {unplaced.map(shape => {
            const selected     = shape.id === selectedShapeId
            const rotatedCubes = normalizeShape(applyRotation(shape.cubes, ...shape.rotation))
            return (
              <div
                key={shape.id}
                onClick={() => selectShape(selected ? null : shape.id)}
                style={{
                  flexShrink: 0,
                  width: 72,
                  height: 72,
                  background: selected ? 'rgba(100,140,255,0.15)' : 'rgba(255,255,255,0.05)',
                  border: `2px solid ${selected ? shape.color : 'rgba(100,140,255,0.18)'}`,
                  borderRadius: 10,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s',
                }}
              >
                <ShapePreview3D cubes={rotatedCubes} color={shape.color} />
              </div>
            )
          })}
          {unplaced.length === 0 && (
            <div style={{ color: '#666', fontSize: 12, padding: '24px 12px' }}>All placed!</div>
          )}
        </div>
      </div>
    )
  }

  // ── Desktop: left-side vertical tray ─────────────────────────────────────
  return (
    <div data-ui-overlay style={{ position: 'fixed', left: 20, top: 80, bottom: 20, zIndex: 10 }}>
      <div style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        overflowY: 'auto',
        overflowX: 'hidden',
        paddingRight: 4,
        scrollbarWidth: 'thin',
        scrollbarColor: 'rgba(100,140,255,0.25) transparent',
      }}>
        <div style={{
          color: '#666',
          fontSize: 11,
          textAlign: 'center',
          marginBottom: 4,
          letterSpacing: 1,
          textTransform: 'uppercase',
          flexShrink: 0,
        }}>
          Pieces
        </div>

        {unplaced.map(shape => {
          const selected     = shape.id === selectedShapeId
          const rotatedCubes = normalizeShape(applyRotation(shape.cubes, ...shape.rotation))
          return (
            <div
              key={shape.id}
              onClick={() => selectShape(selected ? null : shape.id)}
              style={{
                flexShrink: 0,
                background: selected ? 'rgba(100,140,255,0.15)' : 'rgba(255,255,255,0.05)',
                border: `2px solid ${selected ? shape.color : 'rgba(100,140,255,0.18)'}`,
                borderRadius: 10,
                padding: 10,
                cursor: 'pointer',
                transition: 'all 0.15s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ShapePreview3D cubes={rotatedCubes} color={shape.color} />
            </div>
          )
        })}

        {unplaced.length === 0 && (
          <div style={{ color: '#666', fontSize: 12, textAlign: 'center' }}>All placed!</div>
        )}
      </div>

      {unplaced.length > 4 && (
        <div style={{
          position: 'absolute',
          bottom: 0, left: 0, right: 4,
          height: 48,
          background: 'linear-gradient(to bottom, transparent, #111827)',
          pointerEvents: 'none',
        }} />
      )}
    </div>
  )
}
