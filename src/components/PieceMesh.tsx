/**
 * PieceMesh — one RoundedBox per cube.
 *
 * Each cube renders as an independent scaled-down RoundedBox.
 * The natural gap between adjacent boxes provides visual separation;
 * rounded corners give the polished look — no custom geometry needed.
 * Tune SIZE (gap) and RADIUS (roundness) to adjust the aesthetic.
 */

import { RoundedBox } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import type { Vec3 } from '../types'

const SIZE   = 0.92   // gap size: 1 - SIZE = 0.08 per side between adjacent cubes
const RADIUS = 0.07   // corner roundness

interface Props {
  cubes:          Vec3[]
  color:          string
  opacity?:       number
  castShadow?:    boolean
  onClick?:       () => void
  onPointerDown?: (e: ThreeEvent<PointerEvent>) => void
  onPointerMove?: (e: ThreeEvent<PointerEvent>) => void
}

export function PieceMesh({
  cubes, color, opacity = 1, castShadow = true,
  onClick, onPointerDown, onPointerMove,
}: Props) {
  return (
    <group
      onClick={onClick ? (e) => { e.stopPropagation(); onClick() } : undefined}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
    >
      {cubes.map((cube, i) => (
        <RoundedBox
          key={i}
          args={[SIZE, SIZE, SIZE]}
          radius={RADIUS}
          smoothness={2}
          position={[cube.x + 0.5, cube.y + 0.5, cube.z + 0.5]}
          castShadow={castShadow}
        >
          <meshStandardMaterial
            color={color}
            transparent={opacity < 1}
            opacity={opacity}
            roughness={0.38}
            metalness={0.04}
          />
        </RoundedBox>
      ))}
    </group>
  )
}
