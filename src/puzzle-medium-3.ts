import type { Vec3, Puzzle, PlacedShape, PuzzleShape } from './types'

const COLORS = ['#4A90D9', '#E67E22', '#2ECC71', '#9B59B6', '#E74C3C', '#1ABC9C', '#F39C12']
const c = (x: number, y: number, z: number): Vec3 => ({ x, y, z })

/*
  Medium 3 — irregular tall container (28 cells). Bounding box: 2×4×4

  Full 2×4 for y=0 and y=1; 2×3 shelf for y=2 and y=3 (z=0..2 only).
*/
export function getMediumPuzzle3(): Puzzle {
  const container = c(2,4,4)
  const validCells: Vec3[] = [
    c(0,0,0),c(1,0,0),c(0,0,1),c(1,0,1),c(0,0,2),c(1,0,2),c(0,0,3),c(1,0,3),
    c(0,1,0),c(1,1,0),c(0,1,1),c(1,1,1),c(0,1,2),c(1,1,2),c(0,1,3),c(1,1,3),
    c(0,2,0),c(1,2,0),c(0,2,1),c(1,2,1),c(0,2,2),c(1,2,2),
    c(0,3,0),c(1,3,0),c(0,3,1),c(1,3,1),c(0,3,2),c(1,3,2),
  ]
  const shapes: PuzzleShape[] = [
    { id: 'm3a', color: COLORS[0], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0),c(0,0,1),c(0,1,1)] },
    { id: 'm3b', color: COLORS[1], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0),c(1,0,0),c(0,0,1),c(1,0,1)] },
    { id: 'm3c', color: COLORS[2], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0),c(0,1,0),c(0,2,0),c(0,3,0)] },
    { id: 'm3d', color: COLORS[3], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0),c(0,1,0),c(0,2,0),c(0,2,1)] },
    { id: 'm3e', color: COLORS[4], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,1),c(1,0,0),c(1,0,1),c(1,0,2)] },
    { id: 'm3f', color: COLORS[5], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,0),c(1,0,0),c(1,0,1),c(1,1,1)] },
    { id: 'm3g', color: COLORS[6], rotation: [0,0,0], placed: false,
      cubes: [c(0,0,1),c(0,1,0),c(0,1,1),c(1,0,1),c(1,1,1)] },
  ]
  const solution: PlacedShape[] = [
    { id: 'm3a', color: COLORS[0], cubes: [c(0,2,1),c(0,2,2),c(0,3,2)] },
    { id: 'm3b', color: COLORS[1], cubes: [c(0,0,1),c(1,0,1),c(0,0,2),c(1,0,2)] },
    { id: 'm3c', color: COLORS[2], cubes: [c(0,0,0),c(0,1,0),c(0,2,0),c(0,3,0)] },
    { id: 'm3d', color: COLORS[3], cubes: [c(1,0,0),c(1,1,0),c(1,2,0),c(1,2,1)] },
    { id: 'm3e', color: COLORS[4], cubes: [c(1,3,0),c(0,3,1),c(1,3,1),c(1,3,2)] },
    { id: 'm3f', color: COLORS[5], cubes: [c(0,1,1),c(1,1,1),c(1,1,2),c(1,2,2)] },
    { id: 'm3g', color: COLORS[6], cubes: [c(0,0,3),c(1,0,3),c(0,1,2),c(0,1,3),c(1,1,3)] },
  ]
  return { container, validCells, shapes, solution }
}
