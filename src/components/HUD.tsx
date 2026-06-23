import { useGameStore } from '../store'
import { DIFFICULTY_META } from '../puzzle'

const pill: React.CSSProperties = {
  position: 'fixed',
  left: '50%',
  transform: 'translateX(-50%)',
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  background: 'rgba(8,14,30,0.88)',
  borderRadius: 14,
  padding: '8px 16px',
  border: '1px solid rgba(100,140,255,0.18)',
  zIndex: 10,
}

const btnGhost: React.CSSProperties = {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: 8,
  color: '#aaa',
  padding: '4px 12px',
  fontSize: 12,
  cursor: 'pointer',
}

const divider: React.CSSProperties = {
  width: 1, height: 16, background: 'rgba(255,255,255,0.15)',
}

export function HUD() {
  const {
    hintCount, useHint, won, reset, puzzle,
    currentDifficulty, goToMenu,
  } = useGameStore()

  const unplacedCount = puzzle.shapes.filter(s => !s.placed).length
  const hintsUsed     = 5 - hintCount
  const meta          = currentDifficulty ? DIFFICULTY_META[currentDifficulty] : null

  if (won) {
    return (
      <div style={{ ...pill, bottom: 28, gap: 16, padding: '14px 24px' }}>
        <span style={{ fontSize: 20, lineHeight: 1 }}>✦</span>

        <div>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: 15, lineHeight: 1.2 }}>
            Today's {meta?.label ?? 'Puzzle'} solved!
          </div>
          <div style={{ color: '#555', fontSize: 12, marginTop: 2 }}>
            {hintsUsed === 0 ? 'No hints used' : `${hintsUsed} hint${hintsUsed > 1 ? 's' : ''} used`}
          </div>
        </div>

        <div style={{ width: 1, height: 36, background: 'rgba(255,255,255,0.1)' }} />

        <button onClick={goToMenu} style={btnGhost}>
          Menu
        </button>
      </div>
    )
  }

  return (
    <div style={{ ...pill, top: 20 }}>
      {/* Back to menu */}
      <button
        onClick={goToMenu}
        style={{ ...btnGhost, padding: '4px 10px' }}
        title="Back to menu"
      >
        ←
      </button>

      <div style={divider} />

      {/* Difficulty badge */}
      {meta && (
        <>
          <span style={{
            color: meta.color, fontSize: 11, fontWeight: 700,
            letterSpacing: 1, textTransform: 'uppercase',
          }}>
            {meta.label}
          </span>
          <div style={divider} />
        </>
      )}

      <span style={{ color: '#aaa', fontSize: 13 }}>
        Pieces: <strong style={{ color: '#fff' }}>{unplacedCount}</strong>
      </span>

      <div style={divider} />

      <button
        onClick={useHint}
        disabled={hintCount <= 0}
        style={{
          background: hintCount > 0 ? 'rgba(255,200,50,0.15)' : 'rgba(100,100,100,0.1)',
          border: `1px solid ${hintCount > 0 ? '#ffcc32' : '#444'}`,
          borderRadius: 8,
          color: hintCount > 0 ? '#ffcc32' : '#555',
          padding: '4px 12px',
          fontSize: 12,
          cursor: hintCount > 0 ? 'pointer' : 'not-allowed',
          fontWeight: 600,
        }}
      >
        Hint ({hintCount}/5)
      </button>

      <button onClick={reset} style={btnGhost}>
        Reset
      </button>
    </div>
  )
}
