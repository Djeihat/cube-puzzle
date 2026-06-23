import type { DifficultyKey } from './puzzle'
import { PUZZLE_LIBRARY } from './puzzle'

// Returns today's date as YYYY-MM-DD in local time.
export function getTodayString(): string {
  const d = new Date()
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-')
}

// Deterministic puzzle index for a given difficulty and date string.
// Accepts an explicit date (not "today") so archive lookups use the same function.
// Stable as long as puzzles are not reordered — see PLANNING.md archive note.
export function getDailyIndex(difficulty: DifficultyKey, date: string): number {
  const epoch    = Date.UTC(2026, 0, 1)              // fixed reference: 2026-01-01
  const target   = new Date(date).getTime()
  const dayIndex = Math.floor((target - epoch) / 86_400_000)
  const count    = PUZZLE_LIBRARY[difficulty].length
  return ((dayIndex % count) + count) % count         // safe modulo for negative values
}

// Solved-state key for a daily puzzle.
// Uses 'daily-' prefix to avoid collisions with the old free-play key scheme.
export function getDailySolvedKey(difficulty: DifficultyKey, date: string): string {
  return `daily-${difficulty}-${date}`
}
