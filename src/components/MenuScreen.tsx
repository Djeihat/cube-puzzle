import { useState } from 'react'
import { useGameStore } from '../store'
import { DIFFICULTY_META } from '../puzzle'
import { getTodayString, getDailySolvedKey } from '../daily'
import type { DifficultyKey } from '../puzzle'

const DIFFICULTIES: DifficultyKey[] = ['easy', 'medium', 'hard']

export function MenuScreen() {
  const startDailyPuzzle = useGameStore(s => s.startDailyPuzzle)
  const solvedPuzzles    = useGameStore(s => s.solvedPuzzles)
  const [hovered, setHovered] = useState<DifficultyKey | null>(null)

  const today = getTodayString()
  const dateLabel = new Date(today + 'T00:00:00').toLocaleDateString(undefined, {
    month: 'long', day: 'numeric',
  })

  return (
    <div style={{
      width: '100vw', height: '100vh',
      background: '#111827',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 12,
      fontFamily: 'system-ui, sans-serif',
    }}>
      {/* Title */}
      <div style={{ marginBottom: 20, textAlign: 'center' }}>
        <div style={{ fontSize: 34, fontWeight: 800, color: '#fff', letterSpacing: -0.5 }}>
          Cube Puzzle
        </div>
        <div style={{ color: '#444', fontSize: 12, marginTop: 8, letterSpacing: 2, textTransform: 'uppercase' }}>
          {dateLabel}
        </div>
      </div>

      {DIFFICULTIES.map(d => {
        const { label, color } = DIFFICULTY_META[d]
        const solved    = !!solvedPuzzles[getDailySolvedKey(d, today)]
        const isHovered = hovered === d

        return (
          <div
            key={d}
            onClick={() => startDailyPuzzle(d)}
            onMouseEnter={() => setHovered(d)}
            onMouseLeave={() => setHovered(null)}
            style={{
              width: 280,
              background: solved
                ? 'rgba(255,255,255,0.02)'
                : isHovered ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)',
              border: `2px solid ${solved ? color + '30' : isHovered ? color : color + '40'}`,
              borderRadius: 14,
              padding: '18px 24px',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              transition: 'background 0.12s, border-color 0.12s',
              opacity: solved ? 0.45 : 1,
            }}
          >
            <span style={{
              color: solved ? '#555' : isHovered ? '#fff' : color,
              fontWeight: 700, fontSize: 17,
              transition: 'color 0.12s',
            }}>
              {label}
            </span>
            {solved && (
              <span style={{ color: color + '80', fontSize: 13 }}>✓ Done</span>
            )}
          </div>
        )
      })}
    </div>
  )
}
