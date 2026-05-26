import { RoundedBox } from '@react-three/drei'
import type { Vec3 } from '../types'

interface Props {
  position: Vec3
  color: string
  opacity?: number
  onClick?: () => void
  // Pass `() => {}` to disable raycasting (e.g. for ghost cubes that
  // should not intercept pointer events).
  raycast?: (raycaster: unknown, intersects: unknown[]) => void
}

export function UnitCube({ position, color, opacity = 1, onClick, raycast }: Props) {
  return (
    <RoundedBox
      args={[0.9, 0.9, 0.9]}
      radius={0.07}
      smoothness={2}
      position={[position.x + 0.5, position.y + 0.5, position.z + 0.5]}
      onClick={onClick ? (e) => { e.stopPropagation(); onClick() } : undefined}
      raycast={raycast}
    >
      <meshStandardMaterial
        color={color}
        transparent={opacity < 1}
        opacity={opacity}
        roughness={0.38}
        metalness={0.04}
      />
    </RoundedBox>
  )
}
