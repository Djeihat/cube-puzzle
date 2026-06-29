import { useGameStore } from '../store'

export function PauseOverlay() {
  const resume = useGameStore(s => s.resume)

  return (
    <div
      data-ui-overlay
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 20,
        background: 'rgba(11, 16, 28, 0.93)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <div style={{ fontSize: 28, fontWeight: 800, color: '#fff', letterSpacing: -0.5 }}>
        Pittari!
      </div>
      <div style={{
        fontSize: 11, color: '#444', marginBottom: 24,
        letterSpacing: 2, textTransform: 'uppercase',
      }}>
        Paused
      </div>
      <button
        onClick={resume}
        style={{
          background: 'rgba(255,255,255,0.07)',
          border: '1px solid rgba(255,255,255,0.18)',
          borderRadius: 12,
          color: '#fff',
          fontSize: 15,
          fontWeight: 600,
          padding: '12px 40px',
          cursor: 'pointer',
          letterSpacing: 0.3,
        }}
      >
        Resume
      </button>
    </div>
  )
}
