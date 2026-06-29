import { useState } from 'react'
import { useGameStore } from '../store'
import { DIFFICULTY_META } from '../puzzle'
import { todayRecord, totalSolved, type DifficultyRecord } from '../stats'
import { getTodayString } from '../daily'
import { shareResult, getDayNumber, type ShareData } from '../share'

const DIFFICULTIES = ['easy', 'medium', 'hard'] as const

function formatTime(ms: number): string {
  if (!ms) return '—'
  const s = Math.floor(ms / 1000)
  if (s < 60) return `${s}s`
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

function DiffCard({ diff, record }: { diff: typeof DIFFICULTIES[number]; record: DifficultyRecord }) {
  const { label, color } = DIFFICULTY_META[diff]
  return (
    <div style={{
      flex: 1,
      background: `${color}14`,
      border: `1px solid ${color}44`,
      borderRadius: 12,
      padding: '12px 10px',
      textAlign: 'center',
      fontFamily: 'system-ui, sans-serif',
    }}>
      <div style={{ color, fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ color: '#fff', fontSize: 20, fontWeight: 800, lineHeight: 1 }}>
        {formatTime(record.timeMs)}
      </div>
      <div style={{ color: '#555', fontSize: 11, marginTop: 4 }}>
        {record.hintsUsed === 0 ? 'no hints' : `${record.hintsUsed} hint${record.hintsUsed > 1 ? 's' : ''}`}
      </div>
    </div>
  )
}

// Simple CSS-based celebration particles
function Particles() {
  const dots = [
    { x: 15, y: 20, color: '#4A90D9', size: 8, delay: 0 },
    { x: 80, y: 15, color: '#E67E22', size: 6, delay: 0.15 },
    { x: 25, y: 75, color: '#2ECC71', size: 10, delay: 0.3 },
    { x: 70, y: 80, color: '#9B59B6', size: 7, delay: 0.1 },
    { x: 50, y: 10, color: '#E74C3C', size: 5, delay: 0.25 },
    { x: 90, y: 50, color: '#F39C12', size: 8, delay: 0.05 },
    { x: 10, y: 50, color: '#1ABC9C', size: 6, delay: 0.2 },
    { x: 60, y: 25, color: '#4A90D9', size: 5, delay: 0.35 },
    { x: 35, y: 88, color: '#E67E22', size: 7, delay: 0.12 },
  ]
  return (
    <>
      <style>{`
        @keyframes floatUp {
          0%   { opacity: 0; transform: translateY(0) scale(0); }
          30%  { opacity: 1; transform: translateY(-12px) scale(1); }
          100% { opacity: 0; transform: translateY(-40px) scale(0.6); }
        }
      `}</style>
      {dots.map((d, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: `${d.x}%`, top: `${d.y}%`,
          width: d.size, height: d.size,
          borderRadius: '50%',
          background: d.color,
          animation: `floatUp 2.4s ease-out ${d.delay}s both`,
          pointerEvents: 'none',
        }} />
      ))}
    </>
  )
}

export function AllCompleteScreen() {
  const { goToMenu, goToStats, stats } = useGameStore()

  const [shareStatus, setShareStatus] = useState<'idle' | 'shared' | 'copied'>('idle')

  const today      = getTodayString()
  const rec        = todayRecord(stats)
  const dailyStreak = stats.streaks.daily.current
  const longestStr  = stats.streaks.daily.longest
  const allSolved   = totalSolved(stats)

  async function handleShare() {
    const data: ShareData = {
      dayNumber:   getDayNumber(),
      results:     { easy: rec?.easy, medium: rec?.medium, hard: rec?.hard },
      streakLabel: dailyStreak >= 1 ? `${dailyStreak}-day streak` : null,
    }
    const result = await shareResult(data)
    if (result !== 'failed') {
      setShareStatus(result)
      setTimeout(() => setShareStatus('idle'), 2500)
    }
  }

  const dateLabel = new Date(today + 'T00:00:00').toLocaleDateString(undefined, {
    month: 'long', day: 'numeric',
  })

  return (
    <div style={{
      position: 'relative',
      width: '100vw', height: '100vh',
      background: '#111827',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 0,
      fontFamily: 'system-ui, sans-serif',
      overflow: 'hidden',
    }}>
      <Particles />

      {/* Hero */}
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ fontSize: 36, marginBottom: 8 }}>✦</div>
        <div style={{ color: '#fff', fontSize: 28, fontWeight: 800, letterSpacing: -0.5 }}>
          All done!
        </div>
        <div style={{ color: '#444', fontSize: 13, marginTop: 6, letterSpacing: 1.5, textTransform: 'uppercase' }}>
          {dateLabel}
        </div>
      </div>

      {/* Daily streak */}
      <div style={{
        textAlign: 'center', marginBottom: 28,
        background: 'rgba(255,200,50,0.08)',
        border: '1px solid rgba(255,200,50,0.2)',
        borderRadius: 16, padding: '16px 40px',
      }}>
        <div style={{ fontSize: 48, fontWeight: 900, color: '#ffcc32', lineHeight: 1 }}>
          {dailyStreak}
        </div>
        <div style={{ color: '#ffcc3299', fontSize: 12, marginTop: 4, letterSpacing: 1, textTransform: 'uppercase' }}>
          {dailyStreak === 1 ? 'day streak' : 'day streak'} 🔥
        </div>
      </div>

      {/* Today's three puzzles */}
      {rec && (
        <div style={{ display: 'flex', gap: 10, width: '100%', maxWidth: 320, marginBottom: 24, padding: '0 20px', boxSizing: 'border-box' }}>
          {DIFFICULTIES.map(d => rec[d] && (
            <DiffCard key={d} diff={d} record={rec[d]!} />
          ))}
        </div>
      )}

      {/* Headline stats */}
      <div style={{
        display: 'flex', gap: 20, marginBottom: 32,
        color: '#555', fontSize: 12,
      }}>
        <span>{allSolved} total solved</span>
        <span>·</span>
        <span>{longestStr} best streak</span>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={goToStats}
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 10, color: '#aaa',
            padding: '10px 20px', fontSize: 13, cursor: 'pointer',
          }}
        >
          Stats
        </button>
        <button
          onClick={handleShare}
          style={{
            background: shareStatus !== 'idle' ? 'rgba(74,144,217,0.12)' : 'rgba(255,255,255,0.06)',
            border: `1px solid ${shareStatus !== 'idle' ? 'rgba(74,144,217,0.4)' : 'rgba(255,255,255,0.15)'}`,
            borderRadius: 10,
            color: shareStatus !== 'idle' ? '#4A90D9' : '#aaa',
            padding: '10px 20px', fontSize: 13, cursor: 'pointer',
            minWidth: 88, transition: 'color 0.15s, border-color 0.15s, background 0.15s',
          }}
        >
          {shareStatus === 'idle' ? 'Share' : shareStatus === 'shared' ? 'Shared ✓' : 'Copied ✓'}
        </button>
        <button
          onClick={goToMenu}
          style={{
            background: 'linear-gradient(135deg, #4A90D9 0%, #5870d9 100%)',
            border: 'none', borderRadius: 10, color: '#fff',
            padding: '10px 28px', fontSize: 14, cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          Done
        </button>
      </div>
    </div>
  )
}
