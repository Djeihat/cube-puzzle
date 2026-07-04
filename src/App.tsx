import { useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { Scene } from './components/Scene'
import { ShapeTray } from './components/ShapeTray'
import { RotationControls } from './components/RotationControls'
import { HUD } from './components/HUD'
import { PauseOverlay } from './components/PauseOverlay'
import { Tutorial } from './components/Tutorial'
import { MenuScreen } from './components/MenuScreen'
import { AllCompleteScreen } from './components/AllCompleteScreen'
import { StatsScreen } from './components/StatsScreen'
import { useGameStore } from './store'
import { useIsMobile } from './hooks'

export default function App() {
  const screen          = useGameStore(s => s.screen)
  const fetchPuzzlePool = useGameStore(s => s.fetchPuzzlePool)
  const paused          = useGameStore(s => s.paused)
  const tutorialOpen    = useGameStore(s => s.tutorialOpen)
  const pause           = useGameStore(s => s.pause)
  const selectedShapeId = useGameStore(s => s.selectedShapeId)
  const won             = useGameStore(s => s.won)
  const holding         = selectedShapeId !== null

  // Fetch the puzzle pool once on startup.
  // Falls back to the static library silently if the fetch fails.
  useEffect(() => { fetchPuzzlePool() }, [fetchPuzzlePool])

  // Auto-pause when the device sleeps or the app is backgrounded.
  useEffect(() => {
    function onVisibility() {
      if (document.hidden && screen === 'game') pause()
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [screen, pause])

  if (screen === 'menu')         return <MenuScreen />
  if (screen === 'all-complete') return <AllCompleteScreen />
  if (screen === 'stats')        return <StatsScreen />

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        background: '#111827',
        position: 'relative',
        cursor: 'default',
      }}
    >
      <Canvas
        camera={{ position: [5, 5, 8], fov: 45 }}
        style={{ width: '100%', height: '100%', touchAction: 'none' }}
        shadows="soft"
      >
        <Scene />
      </Canvas>
      <ShapeTray />
      <RotationControls />
      <HUD />
      <Instructions holding={holding} won={won} />
      {paused && <PauseOverlay />}
      {tutorialOpen && <Tutorial />}
    </div>
  )
}

function Instructions({ holding, won }: { holding: boolean; won: boolean }) {
  const isMobile = useIsMobile()
  if (won || isMobile) return null
  return (
    <div style={{
      position: 'fixed',
      bottom: 20,
      right: 20,
      color: '#555',
      fontSize: 11,
      lineHeight: 1.7,
      textAlign: 'right',
      pointerEvents: 'none',
    }}>
      {holding ? (
        <>
          <div>Hover container to preview · Click to place</div>
          <div>Q/E · W/S · A/D to rotate the piece</div>
          <div>Click piece in tray again to deselect</div>
        </>
      ) : (
        <>
          <div>Click a piece in the tray to pick it up</div>
          <div>Drag to rotate · Scroll to zoom</div>
        </>
      )}
    </div>
  )
}
