import type { DifficultyKey } from './puzzle'
import { DIFFICULTY_META } from './puzzle'
import type { DifficultyRecord } from './stats'
import { getTodayString } from './daily'

const DIFFICULTIES: DifficultyKey[] = ['easy', 'medium', 'hard']

export interface ShareData {
  dayNumber:   number
  results:     Partial<Record<DifficultyKey, DifficultyRecord>>
  streakLabel: string | null
}

export function getDayNumber(): number {
  const today  = getTodayString()
  const epoch  = Date.UTC(2026, 0, 1)
  const target = new Date(today + 'T00:00:00').getTime()
  return Math.max(1, Math.floor((target - epoch) / 86_400_000) + 1)
}

function fmtTime(ms: number): string {
  const s = Math.floor(ms / 1000)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

function rrect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y,     x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x,     y + h, r)
  ctx.arcTo(x,     y + h, x,     y,     r)
  ctx.arcTo(x,     y,     x + w, y,     r)
  ctx.closePath()
}

function renderShareCanvas(data: ShareData): HTMLCanvasElement {
  const dpr  = Math.min(window.devicePixelRatio || 1, 3)
  const PAD  = 28
  const W    = 320
  const ROW_H = 54
  const GAP   = 10
  const hasStreak = !!data.streakLabel

  const H =
    PAD
    + 24 + 6 + 14   // "Pittari!" + gap + "DAY N"
    + 22             // gap below title
    + (ROW_H * 3 + GAP * 2)
    + (hasStreak ? 18 + 22 : 14)
    + 14             // URL
    + PAD

  const canvas    = document.createElement('canvas')
  canvas.width    = Math.round(W * dpr)
  canvas.height   = Math.round(H * dpr)

  const ctx = canvas.getContext('2d')!
  ctx.scale(dpr, dpr)

  // Background
  ctx.fillStyle = '#111827'
  rrect(ctx, 0, 0, W, H, 20)
  ctx.fill()

  let y = PAD

  // Title
  ctx.textAlign    = 'center'
  ctx.textBaseline = 'top'
  ctx.fillStyle    = '#ffffff'
  ctx.font         = '800 22px system-ui, -apple-system, sans-serif'
  ctx.fillText('Pittari!', W / 2, y)
  y += 30

  ctx.fillStyle = '#6b7280'
  ctx.font      = '500 11px system-ui, -apple-system, sans-serif'
  ctx.fillText(`DAY ${data.dayNumber}`, W / 2, y)
  y += 22

  // Difficulty rows
  DIFFICULTIES.forEach((d, i) => {
    if (i > 0) y += GAP

    const meta   = DIFFICULTY_META[d]
    const res    = data.results[d]
    const solved = !!res
    const col    = meta.color
    const rx     = PAD
    const rw     = W - PAD * 2

    // Fill
    ctx.fillStyle = solved ? `${col}18` : 'rgba(255,255,255,0.02)'
    rrect(ctx, rx, y, rw, ROW_H, 12)
    ctx.fill()

    // Border + glow
    ctx.save()
    if (solved) {
      ctx.shadowColor = `${col}55`
      ctx.shadowBlur  = 14
    }
    ctx.strokeStyle = solved ? col : `${col}30`
    ctx.lineWidth   = 2
    rrect(ctx, rx, y, rw, ROW_H, 12)
    ctx.stroke()
    ctx.restore()

    // Circle dot
    const dotX = rx + 20
    const dotY = y + ROW_H / 2
    ctx.save()
    if (solved) {
      ctx.shadowColor = `${col}cc`
      ctx.shadowBlur  = 8
    }
    ctx.fillStyle = solved ? col : `${col}30`
    ctx.beginPath()
    ctx.arc(dotX, dotY, 5, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()

    // Label
    ctx.textAlign    = 'left'
    ctx.textBaseline = 'middle'
    ctx.fillStyle    = solved ? col : '#555555'
    ctx.font         = '700 15px system-ui, -apple-system, sans-serif'
    ctx.fillText(meta.label, rx + 36, dotY)

    // Time or dash
    ctx.textAlign = 'right'
    ctx.fillStyle = solved ? col : '#444444'
    ctx.font      = '600 14px system-ui, -apple-system, sans-serif'
    ctx.fillText(
      solved ? `✓  ${fmtTime(res!.timeMs)}` : '—',
      rx + rw - 18,
      dotY,
    )

    y += ROW_H
  })

  // Streak
  if (hasStreak) {
    y += 18
    ctx.textAlign    = 'center'
    ctx.textBaseline = 'top'
    ctx.fillStyle    = '#ffcc32'
    ctx.font         = '600 13px system-ui, -apple-system, sans-serif'
    ctx.fillText(`🔥 ${data.streakLabel}`, W / 2, y)
    y += 22
  } else {
    y += 14
  }

  // URL
  ctx.fillStyle    = '#374151'
  ctx.font         = '400 11px system-ui, -apple-system, sans-serif'
  ctx.textAlign    = 'center'
  ctx.textBaseline = 'top'
  ctx.fillText('playpittari.com', W / 2, y)

  return canvas
}

function buildShareText(data: ShareData): string {
  const ICONS: Record<DifficultyKey, string> = { easy: '🔵', medium: '🟠', hard: '🔴' }
  const rows = DIFFICULTIES.map(d => {
    const res  = data.results[d]
    const name = DIFFICULTY_META[d].label
    return `${ICONS[d]} ${name.padEnd(7)} ${res ? `✓  ${fmtTime(res.timeMs)}` : '—'}`
  })
  return [
    `Pittari! Day ${data.dayNumber}`,
    '',
    ...rows,
    '',
    ...(data.streakLabel ? [`🔥 ${data.streakLabel}`] : []),
    'playpittari.com',
  ].join('\n')
}

/** Tries image share (Web Share Level 2), falls back to clipboard text.
 *  Returns 'shared', 'copied', or 'failed'. */
export async function shareResult(data: ShareData): Promise<'shared' | 'copied' | 'failed'> {
  // Image share via Web Share API Level 2
  try {
    const canvas = renderShareCanvas(data)
    const blob   = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/png'))
    if (blob) {
      const file = new File([blob], 'pittari.png', { type: 'image/png' })
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: `Pittari! Day ${data.dayNumber}` })
        return 'shared'
      }
    }
  } catch (err) {
    // User cancelled the share sheet — don't fall through to clipboard
    if (err instanceof Error && err.name === 'AbortError') return 'failed'
  }

  // Clipboard text fallback
  const text = buildShareText(data)
  try {
    await navigator.clipboard.writeText(text)
    return 'copied'
  } catch {
    // textarea execCommand fallback for older / non-secure contexts
    try {
      const ta = document.createElement('textarea')
      ta.value = text
      Object.assign(ta.style, { position: 'fixed', opacity: '0', top: '0', left: '0' })
      document.body.appendChild(ta)
      ta.focus()
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      return 'copied'
    } catch {
      return 'failed'
    }
  }
}
