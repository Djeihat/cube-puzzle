import { useState } from 'react'
import { useGameStore } from '../store'
import { useIsMobile } from '../hooks'

interface Card {
  title: string
  icon: string
  steps: string[] | { mobile: string[]; desktop: string[] }
}

const CARDS: Card[] = [
  {
    title: 'Explore the puzzle',
    icon: '🔄',
    steps: {
      mobile: [
        'Drag with one finger to rotate your view of the container.',
        'Pinch with two fingers to zoom in and out.',
      ],
      desktop: [
        'Click and drag to rotate your view of the container.',
        'Scroll to zoom in and out.',
      ],
    },
  },
  {
    title: 'Solve the puzzle',
    icon: '🧩',
    steps: {
      mobile: [
        'Tap a piece in the tray to select it.',
        'A translucent ghost shows exactly where it will land.',
        'Use the rotation buttons to orient the piece.',
        'Drag the ghost into the container, then lift your finger to place it.',
      ],
      desktop: [
        'Click a piece in the tray to select it.',
        'A translucent ghost shows exactly where it will land.',
        'Use the rotation buttons (or Q / E, W / S, A / D) to orient it.',
        'Hover over the container to preview, then click to place.',
      ],
    },
  },
  {
    title: "When you're stuck",
    icon: '💡',
    steps: {
      mobile: [
        'Tap the Drop button to send a selected piece back to the tray.',
        'Use up to 3 hints per puzzle — each reveals where one piece belongs for 10 seconds.',
        'The timer pauses automatically if you leave the app. Tap ⏸ any time to pause manually.',
      ],
      desktop: [
        'Press Escape to send a selected piece back to the tray.',
        'Use up to 3 hints per puzzle — each reveals where one piece belongs for 10 seconds.',
        'The timer pauses automatically if you leave the app. Click ⏸ any time to pause manually.',
      ],
    },
  },
]

export function Tutorial() {
  const closeTutorial = useGameStore(s => s.closeTutorial)
  const isMobile      = useIsMobile()
  const [cardIndex, setCardIndex] = useState(0)

  const card  = CARDS[cardIndex]
  const steps = Array.isArray(card.steps)
    ? card.steps
    : (isMobile ? card.steps.mobile : card.steps.desktop)
  const isLast = cardIndex === CARDS.length - 1

  return (
    <div
      data-ui-overlay
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 30,
        background: 'rgba(8, 14, 28, 0.92)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        padding: 20,
      }}
    >
      <div style={{
        background: '#111827',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 20,
        padding: '32px 28px 24px',
        width: '100%',
        maxWidth: 360,
        position: 'relative',
      }}>

        {/* Skip */}
        <button
          onClick={closeTutorial}
          style={{
            position: 'absolute', top: 16, right: 16,
            background: 'transparent', border: 'none',
            color: '#444', fontSize: 13, cursor: 'pointer',
            padding: '4px 8px',
          }}
        >
          Skip
        </button>

        {/* Icon */}
        <div style={{ fontSize: 38, textAlign: 'center', marginBottom: 14 }}>
          {card.icon}
        </div>

        {/* Title */}
        <div style={{
          color: '#fff', fontWeight: 700, fontSize: 18,
          textAlign: 'center', marginBottom: 22,
        }}>
          {card.title}
        </div>

        {/* Steps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 28 }}>
          {steps.map((step, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <span style={{
                color: '#4A90D9', fontWeight: 700, fontSize: 13,
                minWidth: 18, lineHeight: '21px',
              }}>
                {i + 1}.
              </span>
              <span style={{ color: '#999', fontSize: 14, lineHeight: 1.55 }}>
                {step}
              </span>
            </div>
          ))}
        </div>

        {/* Progress dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 20 }}>
          {CARDS.map((_, i) => (
            <div
              key={i}
              style={{
                height: 6, borderRadius: 3,
                width: i === cardIndex ? 20 : 6,
                background: i === cardIndex ? '#4A90D9' : '#1e2535',
                transition: 'width 0.2s ease, background 0.2s ease',
              }}
            />
          ))}
        </div>

        {/* Next / Play button */}
        <button
          onClick={() => isLast ? closeTutorial() : setCardIndex(c => c + 1)}
          style={{
            width: '100%',
            background: '#4A90D9',
            border: 'none', borderRadius: 12,
            color: '#fff', fontSize: 15, fontWeight: 600,
            padding: '13px', cursor: 'pointer',
          }}
        >
          {isLast ? "Let's play!" : 'Next'}
        </button>
      </div>
    </div>
  )
}
