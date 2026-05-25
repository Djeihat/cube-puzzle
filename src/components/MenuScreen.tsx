import { useState } from 'react'
import { useGameStore } from '../store'
import { DIFFICULTY_META, PUZZLE_LIBRARY } from '../puzzle'
import type { DifficultyKey } from '../puzzle'

const DIFFICULTIES: DifficultyKey[] = ['easy', 'medium', 'hard']

export function MenuScreen() {
  const goToDifficulty = useGameStore(s => s.goToDifficulty)
  const solvedPuzzles  = useGameStore(s => s.solvedPuzzles)
  const [hovered, setHovered] = useState<DifficultyKey | null>(null)

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
      <div style={{ marginBottom: 28, textAlign: 'center' }}>
        <div style={{ fontSize: 34, fontWeight: 800, color: '#fff', letterSpacing: -0.5 }}>
          Cube Puzzle
        </div>
        <div style={{ color: '#444', fontSize: 12, marginTop: 8, letterSpacing: 2, textTransform: 'uppercase' }}>
          Select difficulty
        </div>
      </div>

      {DIFFICULTIES.map(d => {
        const { label, color } = DIFFICULTY_META[d]
        const total     = PUZZLE_LIBRARY[d].length
        const solved    = PUZZLE_LIBRARY[d].filter((_, i) => solvedPuzzles[`${d}-${i}`]).length
        const allSolved = solved === total
        const isHovered = hovered === d

        return (
          <div
            key={d}
            onClick={() => goToDifficulty(d)}
            onMouseEnter={() => setHovered(d)}
            onMouseLeave={() => setHovered(null)}
            style={{
              width: 280,
              background: isHovered ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)',
              border: `2px solid ${isHovered || allSolved ? color : color + '40'}`,
              borderRadius: 14,
              padding: '18px 24px',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              transition: 'background 0.12s, border-color 0.12s',
            }}
          >
            <span style={{ color: isHovered ? '#fff' : color, fontWeight: 700, fontSize: 17, transition: 'color 0.12s' }}>
              {label}
            </span>
            <span style={{ color: allSolved ? color : '#444', fontSize: 13 }}>
              {allSolved ? '✓ All' : `${solved} / ${total}`}
            </span>
          </div>
        )
      })}
    </div>
  )
}
