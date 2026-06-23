import { useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { Scene } from './components/Scene'
import { ShapeTray } from './components/ShapeTray'
import { RotationControls } from './components/RotationControls'
import { HUD } from './components/HUD'
import { MenuScreen } from './components/MenuScreen'
import { useGameStore } from './store'
import { useIsMobile } from './hooks'

export default function App() {
  const screen             = useGameStore(s => s.screen)
  const fetchDailyPuzzles  = useGameStore(s => s.fetchDailyPuzzles)

  // Fetch today's AI-generated puzzles as early as possible.
  // Falls back to static library silently if fetch fails.
  useEffect(() => { fetchDailyPuzzles() }, [fetchDailyPuzzles])
  const selectedShapeId = useGameStore(s => s.selectedShapeId)
  const won             = useGameStore(s => s.won)
  const holding         = selectedShapeId !== null

  if (screen === 'menu') return <MenuScreen />

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
