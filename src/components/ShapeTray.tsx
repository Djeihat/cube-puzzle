import { useGameStore } from '../store'
import { applyRotation, normalizeShape } from '../puzzle'
import { ShapePreview3D } from './ShapePreview3D'

export function ShapeTray() {
  const { puzzle, selectedShapeId, selectShape, won } = useGameStore()
  const unplaced = puzzle.shapes.filter(s => !s.placed)

  // Hide while the player admires their solved puzzle
  if (won) return null

  return (
    <div style={{
      position: 'fixed',
      left: 20,
      top: '50%',
      transform: 'translateY(-50%)',
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      zIndex: 10,
    }}>
      <div style={{ color: '#666', fontSize: 11, textAlign: 'center', marginBottom: 4, letterSpacing: 1, textTransform: 'uppercase' }}>
        Pieces
      </div>
      {unplaced.map(shape => {
        const selected = shape.id === selectedShapeId
        const rotatedCubes = normalizeShape(applyRotation(shape.cubes, ...shape.rotation))
        return (
          <div
            key={shape.id}
            onClick={() => selectShape(selected ? null : shape.id)}
            style={{
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
  )
}
