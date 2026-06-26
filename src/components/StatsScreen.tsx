import { useGameStore } from '../store'
import { DIFFICULTY_META } from '../puzzle'
import { totalSolved, solveRate } from '../stats'
import { getTodayString } from '../daily'
import type { DifficultyKey } from '../puzzle'

const DIFFICULTIES: DifficultyKey[] = ['easy', 'medium', 'hard']

// ── helpers ───────────────────────────────────────────────────────────────────

function formatTime(ms: number): string {
  if (!ms) return '—'
  const s = Math.floor(ms / 1000)
  if (s < 60) return `${s}s`
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

// ── sub-components ────────────────────────────────────────────────────────────

function StreakBadge({
  label, color, current, longest,
}: { label: string; color: string; current: number; longest: number }) {
  return (
    <div style={{
      flex: 1,
      background: `${color}10`,
      border: `1px solid ${color}30`,
      borderRadius: 12,
      padding: '12px 8px',
      textAlign: 'center',
    }}>
      <div style={{ color, fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ color: '#fff', fontSize: 26, fontWeight: 900, lineHeight: 1 }}>
        {current}
      </div>
      <div style={{ color: '#444', fontSize: 10, marginTop: 3 }}>
        best {longest}
      </div>
    </div>
  )
}

// 14-day history dot grid — each day is 3 dots (E · M · H)
function HistoryGrid({ history }: { history: Array<{ date: string; easy?: unknown; medium?: unknown; hard?: unknown }> }) {
  const today = getTodayString()

  // Build last 14 days descending
  const days: string[] = []
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today + 'T00:00:00')
    d.setDate(d.getDate() - i)
    days.push(d.toISOString().slice(0, 10))
  }

  return (
    <div>
      <div style={{ color: '#333', fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>
        Last 14 days
      </div>
      <div style={{ display: 'flex', gap: 4 }}>
        {days.map(date => {
          const rec = history.find(r => r.date === date)
          const isToday = date === today
          return (
            <div key={date} style={{
              display: 'flex', flexDirection: 'column', gap: 3,
              opacity: isToday ? 1 : 0.85,
            }}>
              {DIFFICULTIES.map(d => {
                const { color } = DIFFICULTY_META[d]
                const done = !!(rec?.[d])
                return (
                  <div key={d} style={{
                    width: 8, height: 8,
                    borderRadius: '50%',
                    background: done ? color : '#1e2a3a',
                    border: isToday ? `1px solid ${done ? color : '#2a3a4a'}` : 'none',
                  }} />
                )
              })}
            </div>
          )
        })}
      </div>
      <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
        {DIFFICULTIES.map(d => {
          const { color, label } = DIFFICULTY_META[d]
          return (
            <div key={d} style={{ display: 'flex', alignItems: 'center', gap: 3, flex: 1 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: color }} />
              <span style={{ color: '#333', fontSize: 9 }}>{label[0]}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── main screen ───────────────────────────────────────────────────────────────

export function StatsScreen() {
  const { goToMenu, stats } = useGameStore()
  const today = getTodayString()
  const todayRec = stats.history.find(r => r.date === today)
  const allSolved = totalSolved(stats)

  return (
    <div style={{
      width: '100vw', minHeight: '100vh',
      background: '#111827',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center',
      padding: '24px 20px 40px',
      boxSizing: 'border-box',
      fontFamily: 'system-ui, sans-serif',
      overflowY: 'auto',
    }}>

      {/* Header */}
      <div style={{ width: '100%', maxWidth: 320, display: 'flex', alignItems: 'center', marginBottom: 28 }}>
        <button
          onClick={goToMenu}
          style={{
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 8, color: '#888', padding: '6px 14px', fontSize: 13, cursor: 'pointer',
          }}
        >
          ←
        </button>
        <span style={{ color: '#fff', fontWeight: 700, fontSize: 20, marginLeft: 16 }}>Stats</span>
      </div>

      <div style={{ width: '100%', maxWidth: 320, display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Daily streak hero */}
        <div style={{
          textAlign: 'center',
          background: 'rgba(255,200,50,0.07)',
          border: '1px solid rgba(255,200,50,0.18)',
          borderRadius: 16, padding: '20px 24px',
        }}>
          <div style={{ color: '#ffcc3277', fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 }}>
            Daily streak
          </div>
          <div style={{ fontSize: 56, fontWeight: 900, color: '#ffcc32', lineHeight: 1 }}>
            {stats.streaks.daily.current}
          </div>
          <div style={{ color: '#555', fontSize: 12, marginTop: 6 }}>
            🏆 Best: {stats.streaks.daily.longest} days
          </div>
        </div>

        {/* Per-difficulty streaks */}
        <div>
          <div style={{ color: '#333', fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>
            By difficulty
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {DIFFICULTIES.map(d => {
              const { label, color } = DIFFICULTY_META[d]
              const s = stats.streaks[d]
              return <StreakBadge key={d} label={label} color={color} current={s.current} longest={s.longest} />
            })}
          </div>
        </div>

        {/* Today's performance */}
        {todayRec && (
          <div>
            <div style={{ color: '#333', fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>
              Today
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {DIFFICULTIES.map(d => {
                const { label, color } = DIFFICULTY_META[d]
                const rec = todayRec[d]
                return (
                  <div key={d} style={{
                    flex: 1, borderRadius: 10, padding: '10px 6px', textAlign: 'center',
                    background: rec ? `${color}14` : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${rec ? color + '40' : '#1e2a3a'}`,
                    opacity: rec ? 1 : 0.4,
                  }}>
                    <div style={{ color: rec ? color : '#333', fontSize: 10, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase' }}>
                      {label}
                    </div>
                    {rec ? (
                      <>
                        <div style={{ color: '#fff', fontSize: 14, fontWeight: 700, marginTop: 4 }}>
                          {formatTime(rec.timeMs)}
                        </div>
                        <div style={{ color: '#555', fontSize: 10, marginTop: 2 }}>
                          {rec.hintsUsed === 0 ? 'no hints' : `${rec.hintsUsed}h`}
                        </div>
                      </>
                    ) : (
                      <div style={{ color: '#2a3a4a', fontSize: 18, marginTop: 4 }}>—</div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Solve rates */}
        <div>
          <div style={{ color: '#333', fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>
            Solve rate ({stats.history.length} days played)
          </div>
          {DIFFICULTIES.map(d => {
            const { label, color } = DIFFICULTY_META[d]
            const rate = solveRate(stats, d)
            const pct  = Math.round(rate * 100)
            return (
              <div key={d} style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ color: '#666', fontSize: 11 }}>{label}</span>
                  <span style={{ color: color, fontSize: 11, fontWeight: 600 }}>{pct}%</span>
                </div>
                <div style={{ height: 4, background: '#1e2a3a', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: `${pct}%`,
                    background: color, borderRadius: 2,
                    transition: 'width 0.6s ease',
                  }} />
                </div>
              </div>
            )
          })}
        </div>

        {/* Total + history */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
          paddingTop: 8, borderTop: '1px solid #1e2a3a',
        }}>
          <div>
            <div style={{ color: '#fff', fontSize: 28, fontWeight: 800, lineHeight: 1 }}>{allSolved}</div>
            <div style={{ color: '#444', fontSize: 11, marginTop: 2 }}>total solved</div>
          </div>
          <HistoryGrid history={stats.history} />
        </div>

      </div>
    </div>
  )
}
