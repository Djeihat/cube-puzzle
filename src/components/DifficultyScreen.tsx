import { useState } from 'react'
import { useGameStore } from '../store'
import { DIFFICULTY_META, PUZZLE_LIBRARY } from '../puzzle'

export function DifficultyScreen() {
  const {
    currentDifficulty, goToMenu, startPuzzle, solvedPuzzles,
    dynamicPuzzles, requestGeneration, generatingPuzzle, generationError,
  } = useGameStore()
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  if (!currentDifficulty) return null

  const { label, color } = DIFFICULTY_META[currentDifficulty]
  const staticCount  = PUZZLE_LIBRARY[currentDifficulty].length
  const dynamicList  = dynamicPuzzles[currentDifficulty]
  const totalCount   = staticCount + dynamicList.length
  const allIndices   = Array.from({ length: totalCount }, (_, i) => i)

  return (
    <div style={{
      width: '100vw', height: '100vh',
      background: '#111827',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 36,
      fontFamily: 'system-ui, sans-serif',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <button
          onClick={goToMenu}
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 8,
            color: '#888',
            padding: '6px 14px',
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          ←
        </button>
        <span style={{ color, fontWeight: 700, fontSize: 22 }}>{label}</span>
      </div>

      {/* Puzzle cards + generate button */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center', maxWidth: 480 }}>
        {allIndices.map((i) => {
          const solved    = !!solvedPuzzles[`${currentDifficulty}-${i}`]
          const isHovered = hoveredIdx === i
          const isDynamic = i >= staticCount

          return (
            <div
              key={i}
              onClick={() => startPuzzle(currentDifficulty, i)}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
              style={{
                width: 72, height: 72,
                background: solved
                  ? `${color}1a`
                  : isHovered ? 'rgba(255,255,255,0.09)' : 'rgba(255,255,255,0.05)',
                border: `2px solid ${solved || isHovered ? color : 'rgba(255,255,255,0.12)'}`,
                borderRadius: 12,
                cursor: 'pointer',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: 2,
                transition: 'background 0.12s, border-color 0.12s',
              }}
            >
              <span style={{ color: solved || isHovered ? color : '#666', fontSize: 22, fontWeight: 700, lineHeight: 1 }}>
                {i + 1}
              </span>
              {solved && (
                <span style={{ color, fontSize: 11, lineHeight: 1 }}>✓</span>
              )}
              {isDynamic && !solved && (
                <span style={{ color: '#444', fontSize: 9, lineHeight: 1, letterSpacing: 0.5 }}>AI</span>
              )}
            </div>
          )
        })}

        {/* Generate button */}
        <div
          onClick={() => !generatingPuzzle && requestGeneration(currentDifficulty)}
          onMouseEnter={() => setHoveredIdx(-1)}
          onMouseLeave={() => setHoveredIdx(null)}
          style={{
            width: 72, height: 72,
            background: generatingPuzzle
              ? 'rgba(255,255,255,0.03)'
              : hoveredIdx === -1 ? `${color}22` : 'rgba(255,255,255,0.03)',
            border: `2px dashed ${generatingPuzzle ? '#333' : hoveredIdx === -1 ? color : '#333'}`,
            borderRadius: 12,
            cursor: generatingPuzzle ? 'wait' : 'pointer',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: 3,
            transition: 'background 0.12s, border-color 0.12s',
          }}
        >
          {generatingPuzzle ? (
            <Spinner color={color} />
          ) : (
            <>
              <span style={{ color: hoveredIdx === -1 ? color : '#444', fontSize: 20, lineHeight: 1 }}>+</span>
              <span style={{ color: hoveredIdx === -1 ? color : '#444', fontSize: 9, letterSpacing: 0.5 }}>AI</span>
            </>
          )}
        </div>
      </div>

      {/* Error */}
      {generationError && (
        <div style={{
          color: '#E74C3C',
          fontSize: 12,
          maxWidth: 360,
          textAlign: 'center',
          lineHeight: 1.5,
          padding: '8px 16px',
          background: 'rgba(231,76,60,0.1)',
          borderRadius: 8,
          border: '1px solid rgba(231,76,60,0.25)',
        }}>
          {generationError}
        </div>
      )}
    </div>
  )
}

function Spinner({ color }: { color: string }) {
  return (
    <div style={{
      width: 20, height: 20,
      border: `2px solid ${color}33`,
      borderTop: `2px solid ${color}`,
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite',
    }} />
  )
}
