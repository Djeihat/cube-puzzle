import { useState } from 'react'
import { useGameStore } from '../store'
import { DIFFICULTY_META } from '../puzzle'
import type { DifficultyKey } from '../puzzle'
import { todayRecord } from '../stats'
import { shareResult, getDayNumber, type ShareData } from '../share'

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
    currentDifficulty, goToMenu, stats, pause,
  } = useGameStore()

  const [shareStatus, setShareStatus] = useState<'idle' | 'shared' | 'copied'>('idle')

  const unplacedCount = puzzle.shapes.filter(s => !s.placed).length
  const hintsUsed     = 3 - hintCount
  const meta          = currentDifficulty ? DIFFICULTY_META[currentDifficulty] : null
  const diffStreak    = currentDifficulty
    ? stats.streaks[currentDifficulty as DifficultyKey].current
    : 0

  async function handleShare() {
    const rec = todayRecord(stats)
    const data: ShareData = {
      dayNumber:   getDayNumber(),
      results:     { easy: rec?.easy, medium: rec?.medium, hard: rec?.hard },
      streakLabel: diffStreak >= 1 ? `${diffStreak}-day ${meta?.label} streak` : null,
    }
    const result = await shareResult(data)
    if (result !== 'failed') {
      setShareStatus(result)
      setTimeout(() => setShareStatus('idle'), 2500)
    }
  }

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
          {diffStreak >= 2 && (
            <div style={{ color: meta?.color, fontSize: 12, marginTop: 3, fontWeight: 600 }}>
              🔥 {diffStreak}-day {meta?.label} streak
            </div>
          )}
        </div>

        <div style={{ width: 1, height: 36, background: 'rgba(255,255,255,0.1)' }} />

        <button
          onClick={handleShare}
          style={{
            ...btnGhost,
            minWidth: 72,
            color: shareStatus !== 'idle' ? '#4A90D9' : '#aaa',
            borderColor: shareStatus !== 'idle' ? 'rgba(74,144,217,0.4)' : 'rgba(255,255,255,0.15)',
          }}
        >
          {shareStatus === 'idle' ? 'Share' : shareStatus === 'shared' ? 'Shared ✓' : 'Copied ✓'}
        </button>

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
          background: 'transparent',
          border: 'none',
          borderRadius: 8,
          color: hintCount > 0 ? '#666' : '#3a3a3a',
          padding: '4px 8px',
          fontSize: 11,
          cursor: hintCount > 0 ? 'pointer' : 'default',
          fontWeight: 500,
          opacity: hintCount > 0 ? 1 : 0.4,
        }}
      >
        Hint {hintCount > 0 ? `(${hintCount})` : '✕'}
      </button>

      <button onClick={reset} style={btnGhost}>
        Reset
      </button>

      <button
        onClick={pause}
        style={{ ...btnGhost, padding: '4px 10px' }}
        title="Pause"
      >
        ⏸
      </button>
    </div>
  )
}
