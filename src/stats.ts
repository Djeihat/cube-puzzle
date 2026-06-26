import type { DifficultyKey } from './puzzle'
import { getTodayString } from './daily'

// ── types ─────────────────────────────────────────────────────────────────────

export interface DifficultyRecord {
  hintsUsed: number
  timeMs: number
}

export interface DayRecord {
  date: string
  easy?:   DifficultyRecord
  medium?: DifficultyRecord
  hard?:   DifficultyRecord
}

export interface StreakData {
  current: number
  longest: number
  lastDate: string  // last date this streak was extended
}

export interface GameStats {
  streaks: {
    daily:  StreakData
    easy:   StreakData
    medium: StreakData
    hard:   StreakData
  }
  history: DayRecord[]  // most recent first, capped at 30 days
}

// ── defaults ──────────────────────────────────────────────────────────────────

const EMPTY_STREAK: StreakData = { current: 0, longest: 0, lastDate: '' }

function emptyStats(): GameStats {
  return {
    streaks: {
      daily:  { ...EMPTY_STREAK },
      easy:   { ...EMPTY_STREAK },
      medium: { ...EMPTY_STREAK },
      hard:   { ...EMPTY_STREAK },
    },
    history: [],
  }
}

// ── localStorage ──────────────────────────────────────────────────────────────

const STORAGE_KEY = 'gameStats'

export function loadStats(): GameStats {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : emptyStats()
  } catch {
    return emptyStats()
  }
}

export function saveStats(stats: GameStats): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(stats)) } catch {}
}

// ── streak update ─────────────────────────────────────────────────────────────

function yesterday(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toISOString().slice(0, 10)
}

function updateStreak(streak: StreakData, today: string): StreakData {
  if (streak.lastDate === today)      return streak                          // already counted
  if (streak.lastDate === yesterday()) {
    const current = streak.current + 1
    return { current, longest: Math.max(current, streak.longest), lastDate: today }
  }
  // Gap in days — reset
  return { current: 1, longest: Math.max(1, streak.longest), lastDate: today }
}

// ── public API ────────────────────────────────────────────────────────────────

/** Call when a difficulty is solved. Returns updated stats. */
export function recordSolve(
  stats: GameStats,
  difficulty: DifficultyKey,
  hintsUsed: number,
  timeMs: number,
): GameStats {
  const today = getTodayString()

  // Update history — upsert today's record
  const history = [...stats.history]
  const todayIdx = history.findIndex(r => r.date === today)
  const todayRecord: DayRecord = todayIdx >= 0
    ? { ...history[todayIdx], [difficulty]: { hintsUsed, timeMs } }
    : { date: today, [difficulty]: { hintsUsed, timeMs } }

  if (todayIdx >= 0) history[todayIdx] = todayRecord
  else history.unshift(todayRecord)

  // Keep last 30 days
  const trimmed = history.slice(0, 30)

  // Update per-difficulty streak
  const streaks = {
    ...stats.streaks,
    [difficulty]: updateStreak(stats.streaks[difficulty], today),
  }

  // Update daily streak if all three are now done today
  const allDone = !!(todayRecord.easy && todayRecord.medium && todayRecord.hard)
  if (allDone) {
    streaks.daily = updateStreak(stats.streaks.daily, today)
  }

  return { streaks, history: trimmed }
}

/** True if all three difficulties have been solved today. */
export function allDoneToday(stats: GameStats): boolean {
  const today = getTodayString()
  const rec = stats.history.find(r => r.date === today)
  return !!(rec?.easy && rec?.medium && rec?.hard)
}

/** Today's record, or null if nothing solved yet today. */
export function todayRecord(stats: GameStats): DayRecord | null {
  const today = getTodayString()
  return stats.history.find(r => r.date === today) ?? null
}

/** Total puzzles solved (all time, all difficulties). */
export function totalSolved(stats: GameStats): number {
  return stats.history.reduce((n, r) => {
    return n + (r.easy ? 1 : 0) + (r.medium ? 1 : 0) + (r.hard ? 1 : 0)
  }, 0)
}

/** Solve rate for a difficulty (0–1) over the recorded history. */
export function solveRate(stats: GameStats, difficulty: DifficultyKey): number {
  const days = stats.history.length
  if (days === 0) return 0
  const solved = stats.history.filter(r => r[difficulty]).length
  return solved / days
}
