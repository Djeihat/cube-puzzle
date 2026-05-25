import { RoundedBox } from '@react-three/drei'
import type { Vec3 } from '../types'

interface Props {
  position: Vec3
  color: string
  opacity?: number
  onClick?: () => void
}

export function UnitCube({ position, color, opacity = 1, onClick }: Props) {
  return (
    <RoundedBox
      args={[0.9, 0.9, 0.9]}
      radius={0.07}
      smoothness={2}
      position={[position.x + 0.5, position.y + 0.5, position.z + 0.5]}
      onClick={onClick ? (e) => { e.stopPropagation(); onClick() } : undefined}
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
