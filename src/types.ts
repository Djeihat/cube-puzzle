export type Vec3 = { x: number; y: number; z: number }

// A polycube shape: array of unit cube offsets from origin
export type Polycube = Vec3[]

export interface PlacedShape {
  id: string
  cubes: Vec3[] // absolute grid positions
  color: string
}

export interface PuzzleShape {
  id: string
  cubes: Vec3[] // relative to shape origin
  color: string
  rotation: [number, number, number] // euler angles in 90° steps
  placed: boolean
}

export interface Puzzle {
  container: Vec3        // bounding-box dimensions (used for camera & rectangular containers)
  validCells?: Vec3[]    // explicit cell set for irregular containers; overrides rectangular bounds
  shapes: PuzzleShape[]
  solution: PlacedShape[] // one valid solution (for hints)
}
