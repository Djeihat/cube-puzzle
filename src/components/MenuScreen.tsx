import { useState } from 'react'
import { useGameStore } from '../store'
import { DIFFICULTY_META } from '../puzzle'
import { getTodayString, getDailySolvedKey } from '../daily'
import type { DifficultyKey } from '../puzzle'

const DIFFICULTIES: DifficultyKey[] = ['easy', 'medium', 'hard']

// Floating celebration dots — same approach as AllCompleteScreen
const DOTS = [
  { x: 8,  y: 18, color: '#4A90D9', size: 7,  delay: 0    },
  { x: 88, y: 12, color: '#E67E22', size: 5,  delay: 0.2  },
  { x: 20, y: 78, color: '#2ECC71', size: 9,  delay: 0.4  },
  { x: 75, y: 82, color: '#9B59B6', size: 6,  delay: 0.1  },
  { x: 50, y: 8,  color: '#E74C3C', size: 5,  delay: 0.3  },
  { x: 93, y: 55, color: '#F39C12', size: 7,  delay: 0.05 },
  { x: 5,  y: 55, color: '#1ABC9C', size: 5,  delay: 0.25 },
  { x: 65, y: 22, color: '#4A90D9', size: 4,  delay: 0.35 },
  { x: 30, y: 90, color: '#E67E22', size: 6,  delay: 0.15 },
  { x: 42, y: 70, color: '#2ECC71', size: 4,  delay: 0.45 },
  { x: 82, y: 40, color: '#E74C3C', size: 6,  delay: 0.08 },
]

export function MenuScreen() {
  const startDailyPuzzle = useGameStore(s => s.startDailyPuzzle)
  const solvedPuzzles    = useGameStore(s => s.solvedPuzzles)
  const goToStats        = useGameStore(s => s.goToStats)
  const [hovered, setHovered] = useState<DifficultyKey | null>(null)

  const today    = getTodayString()
  const dateLabel = new Date(today + 'T00:00:00').toLocaleDateString(undefined, {
    month: 'long', day: 'numeric',
  })

  const allDone = DIFFICULTIES.every(d => !!solvedPuzzles[getDailySolvedKey(d, today)])

  return (
    <div style={{
      position: 'relative',
      width: '100vw', height: '100vh',
      background: '#111827',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 12,
      fontFamily: 'system-ui, sans-serif',
      overflow: 'hidden',
    }}>

      {/* Celebration particles — only when all done */}
      {allDone && (
        <>
          <style>{`
            @keyframes menuFloat {
              0%   { opacity: 0; transform: translateY(0) scale(0); }
              25%  { opacity: 0.8; transform: translateY(-16px) scale(1); }
              100% { opacity: 0; transform: translateY(-60px) scale(0.5); }
            }
            @keyframes cardGlow {
              0%, 100% { box-shadow: 0 0 0 0 transparent; }
              50%       { box-shadow: 0 0 18px 2px var(--glow); }
            }
          `}</style>
          {DOTS.map((d, i) => (
            <div key={i} style={{
              position: 'absolute',
              left: `${d.x}%`, top: `${d.y}%`,
              width: d.size, height: d.size,
              borderRadius: '50%',
              background: d.color,
              animation: `menuFloat 3s ease-out ${d.delay}s infinite`,
              pointerEvents: 'none',
            }} />
          ))}
        </>
      )}

      {/* Title */}
      <div style={{ marginBottom: 20, textAlign: 'center' }}>
        <div style={{ fontSize: 34, fontWeight: 800, color: '#fff', letterSpacing: -0.5 }}>
          Pittari
        </div>
        <div style={{ color: '#444', fontSize: 12, marginTop: 8, letterSpacing: 2, textTransform: 'uppercase' }}>
          {dateLabel}
        </div>
      </div>

      {/* "All done" banner */}
      {allDone && (
        <div style={{
          color: '#ffcc32', fontSize: 13, fontWeight: 600,
          letterSpacing: 0.5, marginBottom: 4,
        }}>
          ✦ All done today! ✦
        </div>
      )}

      {DIFFICULTIES.map(d => {
        const { label, color } = DIFFICULTY_META[d]
        const solved    = !!solvedPuzzles[getDailySolvedKey(d, today)]
        const isHovered = hovered === d
        const glowStyle = allDone && solved
          ? { '--glow': color + '66', animation: 'cardGlow 2.4s ease-in-out infinite' } as React.CSSProperties
          : {}

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
              border: `2px solid ${solved
                ? allDone ? color + '60' : color + '30'
                : isHovered ? color : color + '40'}`,
              borderRadius: 14,
              padding: '18px 24px',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              transition: 'background 0.12s, border-color 0.12s',
              opacity: solved && !allDone ? 0.45 : solved && allDone ? 0.7 : 1,
              ...glowStyle,
            }}
          >
            <span style={{
              color: solved ? (allDone ? color : '#555') : isHovered ? '#fff' : color,
              fontWeight: 700, fontSize: 17,
              transition: 'color 0.12s',
            }}>
              {label}
            </span>
            {solved && (
              <span style={{ color: color + (allDone ? 'cc' : '80'), fontSize: 13 }}>✓ Done</span>
            )}
          </div>
        )
      })}

      {/* Stats link */}
      <button
        onClick={goToStats}
        style={{
          marginTop: 12,
          background: 'transparent', border: 'none',
          color: '#333', fontSize: 12, cursor: 'pointer',
          letterSpacing: 0.5,
        }}
      >
        Stats
      </button>
    </div>
  )
}
