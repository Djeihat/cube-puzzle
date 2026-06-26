import { useMemo, useEffect } from 'react'
import * as THREE from 'three'
import type { ThreeEvent } from '@react-three/fiber'
import type { Vec3 } from '../types'

const B = 0.05 // bevel depth — 1/20 of a unit edge

type V3 = [number, number, number]

interface EdgeDef {
  adjacentFaceIdx: number
  inward: V3 // direction toward face centre from this edge = -(adjacent face normal)
}

interface FaceDefExt {
  dir: V3
  corners: V3[]  // 4 corners, CCW when viewed from outside
  edges: EdgeDef[] // edge[i] connects corners[i] → corners[(i+1)%4]
}

// 6 axis-aligned face definitions.
// Winding is CCW when viewed from outside (verified by shoelace formula).
// For each edge the inward vector is -(adjacent face normal).
const FACE_DEFS: FaceDefExt[] = [
  // 0: +X  normal [1,0,0]
  {
    dir: [1, 0, 0],
    corners: [[1,0,1],[1,0,0],[1,1,0],[1,1,1]],
    edges: [
      { adjacentFaceIdx: 3, inward: [ 0, 1, 0] }, // → -Y
      { adjacentFaceIdx: 5, inward: [ 0, 0, 1] }, // → -Z
      { adjacentFaceIdx: 2, inward: [ 0,-1, 0] }, // → +Y
      { adjacentFaceIdx: 4, inward: [ 0, 0,-1] }, // → +Z
    ],
  },
  // 1: -X  normal [-1,0,0]
  {
    dir: [-1, 0, 0],
    corners: [[0,0,0],[0,0,1],[0,1,1],[0,1,0]],
    edges: [
      { adjacentFaceIdx: 3, inward: [ 0, 1, 0] }, // → -Y
      { adjacentFaceIdx: 4, inward: [ 0, 0,-1] }, // → +Z
      { adjacentFaceIdx: 2, inward: [ 0,-1, 0] }, // → +Y
      { adjacentFaceIdx: 5, inward: [ 0, 0, 1] }, // → -Z
    ],
  },
  // 2: +Y  normal [0,1,0]
  {
    dir: [0, 1, 0],
    corners: [[0,1,1],[1,1,1],[1,1,0],[0,1,0]],
    edges: [
      { adjacentFaceIdx: 4, inward: [ 0, 0,-1] }, // → +Z
      { adjacentFaceIdx: 0, inward: [-1, 0, 0] }, // → +X
      { adjacentFaceIdx: 5, inward: [ 0, 0, 1] }, // → -Z
      { adjacentFaceIdx: 1, inward: [ 1, 0, 0] }, // → -X
    ],
  },
  // 3: -Y  normal [0,-1,0]
  {
    dir: [0,-1, 0],
    corners: [[0,0,0],[1,0,0],[1,0,1],[0,0,1]],
    edges: [
      { adjacentFaceIdx: 5, inward: [ 0, 0, 1] }, // → -Z
      { adjacentFaceIdx: 0, inward: [-1, 0, 0] }, // → +X
      { adjacentFaceIdx: 4, inward: [ 0, 0,-1] }, // → +Z
      { adjacentFaceIdx: 1, inward: [ 1, 0, 0] }, // → -X
    ],
  },
  // 4: +Z  normal [0,0,1]
  {
    dir: [0, 0, 1],
    corners: [[0,0,1],[1,0,1],[1,1,1],[0,1,1]],
    edges: [
      { adjacentFaceIdx: 3, inward: [ 0, 1, 0] }, // → -Y
      { adjacentFaceIdx: 0, inward: [-1, 0, 0] }, // → +X
      { adjacentFaceIdx: 2, inward: [ 0,-1, 0] }, // → +Y
      { adjacentFaceIdx: 1, inward: [ 1, 0, 0] }, // → -X
    ],
  },
  // 5: -Z  normal [0,0,-1]
  {
    dir: [0, 0,-1],
    corners: [[1,0,0],[0,0,0],[0,1,0],[1,1,0]],
    edges: [
      { adjacentFaceIdx: 3, inward: [ 0, 1, 0] }, // → -Y
      { adjacentFaceIdx: 1, inward: [ 1, 0, 0] }, // → -X
      { adjacentFaceIdx: 2, inward: [ 0,-1, 0] }, // → +Y
      { adjacentFaceIdx: 0, inward: [-1, 0, 0] }, // → +X
    ],
  },
]

interface CornerFace { faceIdx: number; cornerIdx: number }
interface CornerDef {
  faces: [CornerFace, CornerFace, CornerFace]
  // flip = true when (x+y+z) % 2 === 0 — reverses winding so normal points outward
  flip: boolean
}

// 8 corners of the unit cube, each touched by exactly 3 axis-aligned faces.
// Verified: triangle winding for each entry yields outward normal = normalize(n0+n1+n2).
const CORNER_DEFS: CornerDef[] = [
  { faces: [{faceIdx:1,cornerIdx:0},{faceIdx:3,cornerIdx:0},{faceIdx:5,cornerIdx:1}], flip:true  }, // (0,0,0)
  { faces: [{faceIdx:0,cornerIdx:1},{faceIdx:3,cornerIdx:1},{faceIdx:5,cornerIdx:0}], flip:false }, // (1,0,0)
  { faces: [{faceIdx:1,cornerIdx:3},{faceIdx:2,cornerIdx:3},{faceIdx:5,cornerIdx:2}], flip:false }, // (0,1,0)
  { faces: [{faceIdx:0,cornerIdx:2},{faceIdx:2,cornerIdx:2},{faceIdx:5,cornerIdx:3}], flip:true  }, // (1,1,0)
  { faces: [{faceIdx:1,cornerIdx:1},{faceIdx:3,cornerIdx:3},{faceIdx:4,cornerIdx:0}], flip:false }, // (0,0,1)
  { faces: [{faceIdx:0,cornerIdx:0},{faceIdx:3,cornerIdx:2},{faceIdx:4,cornerIdx:1}], flip:true  }, // (1,0,1)
  { faces: [{faceIdx:1,cornerIdx:2},{faceIdx:2,cornerIdx:0},{faceIdx:4,cornerIdx:3}], flip:true  }, // (0,1,1)
  { faces: [{faceIdx:0,cornerIdx:3},{faceIdx:2,cornerIdx:1},{faceIdx:4,cornerIdx:2}], flip:false }, // (1,1,1)
]

/**
 * Builds a beveled BufferGeometry for a polycube shape.
 *
 * Three kinds of geometry are emitted per cube:
 *   1. Main face quads   — shrunk inward by B at each bevelled edge
 *   2. Bevel quads       — 45° chamfer strip between two external faces (deduplicated)
 *   3. Corner cap tris   — small triangle filling the convex corner where 3 external faces meet
 *
 * Internal faces (shared between adjacent cubes of the same piece) are culled entirely.
 */
function buildBeveledGeometry(cubes: Vec3[]): THREE.BufferGeometry {
  const cubeSet = new Set(cubes.map(c => `${c.x},${c.y},${c.z}`))
  const positions: number[] = []
  const normals: number[] = []
  const indices: number[] = []

  for (const cube of cubes) {
    // Which of the 6 faces have no cube neighbour on that side?
    const faceExternal = FACE_DEFS.map(face =>
      !cubeSet.has(`${cube.x + face.dir[0]},${cube.y + face.dir[1]},${cube.z + face.dir[2]}`)
    )

    // Precompute shrunk corners for every external face.
    // Corner i is at the end of edge (i-1+4)%4 AND the start of edge i.
    // We pull it inward by B at EVERY edge — regardless of whether the
    // adjacent direction is air (external bevel) or another cube of the same
    // piece (internal groove).  External–external edge pairs get a convex
    // chamfer quad (see bevel quad section below); internal edges simply leave
    // a 2B-wide dark gap that reads as a machined seam line.
    const scMap: (V3[] | null)[] = FACE_DEFS.map((face, fi): V3[] | null => {
      if (!faceExternal[fi]) return null
      return face.corners.map((c, i): V3 => {
        let sx = cube.x + c[0]
        let sy = cube.y + c[1]
        let sz = cube.z + c[2]
        const pe = face.edges[(i + 3) % 4]
        sx += B * pe.inward[0]; sy += B * pe.inward[1]; sz += B * pe.inward[2]
        const ce = face.edges[i]
        sx += B * ce.inward[0]; sy += B * ce.inward[1]; sz += B * ce.inward[2]
        return [sx, sy, sz]
      })
    })

    // ── 1. Main face quads ────────────────────────────────────────────────
    for (let fi = 0; fi < 6; fi++) {
      const sc = scMap[fi]
      if (!sc) continue
      const [n0, n1, n2] = FACE_DEFS[fi].dir
      const base = positions.length / 3
      for (const [sx, sy, sz] of sc) {
        positions.push(sx, sy, sz)
        normals.push(n0, n1, n2)
      }
      indices.push(base, base + 1, base + 2, base, base + 2, base + 3)
    }

    // ── 2. Bevel quads ────────────────────────────────────────────────────
    // Emit only when fi < adjFi so each shared edge is covered once.
    // Winding: [sA0, sBEnd, sBStart, sA1] — verified to give outward normal.
    for (let fi = 0; fi < 6; fi++) {
      const scA = scMap[fi]
      if (!scA) continue
      const faceA = FACE_DEFS[fi]

      for (let eA = 0; eA < 4; eA++) {
        const adjFi = faceA.edges[eA].adjacentFaceIdx
        if (!faceExternal[adjFi]) continue // edge not bevelled
        if (fi >= adjFi) continue           // deduplicate

        const scB = scMap[adjFi]!
        const faceB = FACE_DEFS[adjFi]

        // Find eB: the edge in faceB that looks back at faceA
        let eB = 0
        for (let j = 0; j < 4; j++) {
          if (faceB.edges[j].adjacentFaceIdx === fi) { eB = j; break }
        }

        const sA0   = scA[eA]
        const sA1   = scA[(eA + 1) % 4]
        const sBEnd   = scB[(eB + 1) % 4] // world-aligned with sA0
        const sBStart = scB[eB]            // world-aligned with sA1

        const bx = faceA.dir[0] + faceB.dir[0]
        const by = faceA.dir[1] + faceB.dir[1]
        const bz = faceA.dir[2] + faceB.dir[2]
        const len = Math.sqrt(bx * bx + by * by + bz * bz)

        const base = positions.length / 3
        for (const [sx, sy, sz] of [sA0, sBEnd, sBStart, sA1]) {
          positions.push(sx, sy, sz)
          normals.push(bx / len, by / len, bz / len)
        }
        indices.push(base, base + 1, base + 2, base, base + 2, base + 3)
      }
    }

    // ── 2b. Groove walls ─────────────────────────────────────────────────
    // For external-internal edges (this face is external, the adjacent cell
    // belongs to the same piece): emit a 45° wall that descends from the
    // shrunk face edge down into the join.  The neighbouring cube emits the
    // opposing wall when it processes its own face, together forming a V-groove.
    // Winding [sA0, gb0, gb1, sA1] → outward normal = normalize(nA + adjDir) ✓
    for (let fi = 0; fi < 6; fi++) {
      const scA = scMap[fi]
      if (!scA) continue
      const faceA = FACE_DEFS[fi]
      const [nA0, nA1, nA2] = faceA.dir

      for (let eA = 0; eA < 4; eA++) {
        const adjFi = faceA.edges[eA].adjacentFaceIdx
        if (faceExternal[adjFi]) continue // external→external: bevel quad handles it
        const adjDir = FACE_DEFS[adjFi].dir

        const sA0 = scA[eA]
        const sA1 = scA[(eA + 1) % 4]

        // Groove bottom: step B toward the neighbour and B into the face
        const gb0: V3 = [
          sA0[0] + B * adjDir[0] - B * nA0,
          sA0[1] + B * adjDir[1] - B * nA1,
          sA0[2] + B * adjDir[2] - B * nA2,
        ]
        const gb1: V3 = [
          sA1[0] + B * adjDir[0] - B * nA0,
          sA1[1] + B * adjDir[1] - B * nA1,
          sA1[2] + B * adjDir[2] - B * nA2,
        ]

        const gx = nA0 + adjDir[0]
        const gy = nA1 + adjDir[1]
        const gz = nA2 + adjDir[2]
        const gLen = Math.sqrt(gx * gx + gy * gy + gz * gz)

        const base = positions.length / 3
        for (const [sx, sy, sz] of [sA0, gb0, gb1, sA1]) {
          positions.push(sx, sy, sz)
          normals.push(gx / gLen, gy / gLen, gz / gLen)
        }
        indices.push(base, base + 1, base + 2, base, base + 2, base + 3)

        // Groove end-cap triangles — fill the sub-pixel gap at each groove
        // terminus where the groove wall meets an external bevel edge.
        //
        // At corner sA0 (edge eA): gap if edge (eA-1) is external.
        // In the bevel for edge (eA-1), sA1_bevel = scA[eA] = sA0 aligns
        // with scPrevB[ePrevB] (= sBStart in bevel notation).
        const nx = gx / gLen, ny = gy / gLen, nz = gz / gLen
        const prevEdge   = (eA - 1 + 4) % 4
        const prevAdjFi  = faceA.edges[prevEdge].adjacentFaceIdx
        if (faceExternal[prevAdjFi] && scMap[prevAdjFi]) {
          const scPB = scMap[prevAdjFi]!
          const fpB  = FACE_DEFS[prevAdjFi]
          let ePB = 0
          for (let j = 0; j < 4; j++) { if (fpB.edges[j].adjacentFaceIdx === fi) { ePB = j; break } }
          const bv   = scPB[ePB]
          const capB = positions.length / 3
          for (const [sx, sy, sz] of [sA0, bv, gb0]) { positions.push(sx, sy, sz); normals.push(nx, ny, nz) }
          indices.push(capB, capB + 1, capB + 2)
        }

        // At corner sA1 (edge eA+1): gap if edge (eA+1) is external.
        // sA0_bevel = scA[(eA+1)%4] = sA1 aligns with scNextB[(eNextB+1)%4].
        const nextEdge   = (eA + 1) % 4
        const nextAdjFi  = faceA.edges[nextEdge].adjacentFaceIdx
        if (faceExternal[nextAdjFi] && scMap[nextAdjFi]) {
          const scNB = scMap[nextAdjFi]!
          const fnB  = FACE_DEFS[nextAdjFi]
          let eNB = 0
          for (let j = 0; j < 4; j++) { if (fnB.edges[j].adjacentFaceIdx === fi) { eNB = j; break } }
          const bv   = scNB[(eNB + 1) % 4]
          const capB = positions.length / 3
          for (const [sx, sy, sz] of [sA1, gb1, bv]) { positions.push(sx, sy, sz); normals.push(nx, ny, nz) }
          indices.push(capB, capB + 1, capB + 2)
        }
      }
    }

    // ── 3. Corner cap triangles ───────────────────────────────────────────
    // Emit a small triangle where 3 external faces meet at a convex corner.
    for (const { faces, flip } of CORNER_DEFS) {
      if (!faces.every(f => faceExternal[f.faceIdx])) continue

      const [f0, f1, f2] = faces
      const v0 = scMap[f0.faceIdx]![f0.cornerIdx]
      const v1 = scMap[f1.faceIdx]![f1.cornerIdx]
      const v2 = scMap[f2.faceIdx]![f2.cornerIdx]

      const d0 = FACE_DEFS[f0.faceIdx].dir
      const d1 = FACE_DEFS[f1.faceIdx].dir
      const d2 = FACE_DEFS[f2.faceIdx].dir
      const cx = d0[0] + d1[0] + d2[0]
      const cy = d0[1] + d1[1] + d2[1]
      const cz = d0[2] + d1[2] + d2[2]
      const clen = Math.sqrt(cx * cx + cy * cy + cz * cz)

      const base = positions.length / 3
      for (const [sx, sy, sz] of [v0, v1, v2]) {
        positions.push(sx, sy, sz)
        normals.push(cx / clen, cy / clen, cz / clen)
      }
      indices.push(
        flip ? base     : base,
        flip ? base + 2 : base + 1,
        flip ? base + 1 : base + 2,
      )
    }
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3))
  geo.setAttribute('normal',   new THREE.BufferAttribute(new Float32Array(normals),   3))
  geo.setIndex(indices)
  return geo
}

interface Props {
  cubes: Vec3[]
  color: string
  opacity?: number
  castShadow?: boolean
  onClick?: () => void
  onPointerDown?: (e: ThreeEvent<PointerEvent>) => void
  onPointerMove?: (e: ThreeEvent<PointerEvent>) => void
}

export function PieceMesh({ cubes, color, opacity = 1, castShadow = true, onClick, onPointerDown, onPointerMove }: Props) {
  const geo = useMemo(() => buildBeveledGeometry(cubes), [cubes])

  useEffect(() => () => geo.dispose(), [geo])

  function handleClick(e: ThreeEvent<MouseEvent>) {
    e.stopPropagation()
    onClick?.()
  }

  return (
    <mesh
      geometry={geo}
      castShadow={castShadow}
      onClick={onClick ? handleClick : undefined}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
    >
      <meshStandardMaterial
        color={color}
        transparent={opacity < 1}
        opacity={opacity}
        roughness={0.38}
        metalness={0.04}
      />
    </mesh>
  )
}
