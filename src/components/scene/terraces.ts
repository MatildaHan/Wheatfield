import * as THREE from 'three'
import { illustrationMaterial } from './illustrationMaterial.ts'

export interface TerraceSpec {
  z0: number          // 近边 z
  z1: number          // 远边 z
  y: number           // 平台高度
  halfWidth: number   // 半宽（x 方向）
  cols: number        // 格子列数
  rows: number        // 格子行数
}

export interface Terrace {
  spec: TerraceSpec
  mesh: THREE.Mesh
  index: number
}

/** 三层梯田，从近到远 */
export const TERRACES: TerraceSpec[] = [
  { z0:  340, z1:   80, y:   0, halfWidth: 900, cols: 14, rows: 4 },
  { z0:   80, z1: -180, y:  48, halfWidth: 760, cols: 12, rows: 3 },
  { z0: -180, z1: -460, y:  96, halfWidth: 620, cols: 10, rows: 3 },
]

/** 平台内缘留白（不种植） */
const MARGIN_X = 24
const MARGIN_Z = 12

export function createTerraces() {
  const group = new THREE.Group()
  const terraces: Terrace[] = []
  const geometries: THREE.BufferGeometry[] = []
  const materials: THREE.Material[] = []

  const soilMat = illustrationMaterial('#a8865c', false, 1.5)
  materials.push(soilMat)
  const wallMat = illustrationMaterial('#8a7a68', false, 2.2)
  materials.push(wallMat)
  const edgeMat = new THREE.LineBasicMaterial({ color: '#5c4a35', transparent: true, opacity: 0.85 })
  materials.push(edgeMat)
  const wallEdgeMat = new THREE.LineBasicMaterial({ color: '#4a3d2e', transparent: true, opacity: 0.7 })
  materials.push(wallEdgeMat)

  for (let i = 0; i < TERRACES.length; i++) {
    const t = TERRACES[i]!
    const width = t.halfWidth * 2
    const depth = t.z0 - t.z1

    // ---- 平台 ----
    const planeGeo = new THREE.PlaneGeometry(width, depth, 24, 8)
    planeGeo.rotateX(-Math.PI / 2)
    const pos = planeGeo.getAttribute('position')
    const colors: number[] = []
    const c = new THREE.Color()
    const fogTint = i / (TERRACES.length - 1)
    const baseColor = new THREE.Color('#a8865c').lerp(new THREE.Color('#8f7a63'), fogTint * 0.45)
    for (let j = 0; j < pos.count; j++) {
      const x = pos.getX(j), z = pos.getZ(j)
      const ripple = Math.sin(x / 60 + i) * 0.6 + Math.cos(z / 40 + i * 2) * 0.4
      pos.setY(j, ripple)
      c.copy(baseColor).multiplyScalar(0.94 + Math.random() * 0.08)
      colors.push(c.r, c.g, c.b)
    }
    planeGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
    planeGeo.computeVertexNormals()
    geometries.push(planeGeo)

    const soil = new THREE.Mesh(planeGeo, soilMat)
    soil.position.set(0, t.y, (t.z0 + t.z1) / 2)
    soil.receiveShadow = true
    soil.castShadow = true
    group.add(soil)

    // ---- 平台边缘描边 ----
    const edgePoints = [
      new THREE.Vector3(-t.halfWidth, 0.6, t.z0),
      new THREE.Vector3( t.halfWidth, 0.6, t.z0),
      new THREE.Vector3( t.halfWidth, 0.6, t.z1),
      new THREE.Vector3(-t.halfWidth, 0.6, t.z1),
      new THREE.Vector3(-t.halfWidth, 0.6, t.z0),
    ]
    const edgeGeo = new THREE.BufferGeometry().setFromPoints(edgePoints)
    geometries.push(edgeGeo)
    const edge = new THREE.Line(edgeGeo, edgeMat)
    edge.position.y = t.y
    group.add(edge)

    // ---- 挡土墙 ----
    if (i > 0) {
      const prev = TERRACES[i - 1]!
      const wallHeight = t.y - prev.y
      const wallGeo = new THREE.PlaneGeometry(width, wallHeight, 40, 6)
      const wp = wallGeo.getAttribute('position')
      const wc: number[] = []
      for (let j = 0; j < wp.count; j++) {
        const shade = 0.82 + Math.sin(wp.getX(j) * 0.32) * 0.05
                    + Math.sin(wp.getY(j) * 1.1) * 0.04
                    + Math.random() * 0.07
        c.set('#8a7a68').multiplyScalar(shade)
        wc.push(c.r, c.g, c.b)
      }
      wallGeo.setAttribute('color', new THREE.Float32BufferAttribute(wc, 3))
      wallGeo.computeVertexNormals()
      geometries.push(wallGeo)

      const wall = new THREE.Mesh(wallGeo, wallMat)
      wall.position.set(0, prev.y + wallHeight / 2, t.z0)
      wall.castShadow = true
      wall.receiveShadow = true
      group.add(wall)

      const wallEdgeGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-t.halfWidth, t.y + 0.4, t.z0),
        new THREE.Vector3( t.halfWidth, t.y + 0.4, t.z0),
      ])
      geometries.push(wallEdgeGeo)
      group.add(new THREE.Line(wallEdgeGeo, wallEdgeMat))
    }

    terraces.push({ spec: t, mesh: soil, index: i })
  }

  return {
    group,
    terraces,
    dispose() {
      geometries.forEach(g => g.dispose())
      materials.forEach(m => m.dispose())
    },
  }
}

/** 世界坐标吸附到最近梯田格子中心；不在任何梯田上返回 null */
export function snapToTerrace(x: number, z: number, terraces: Terrace[]) {
  for (const t of terraces) {
    const { z0, z1, y, halfWidth, cols, rows } = t.spec
    if (z > z0 - MARGIN_Z || z < z1 + MARGIN_Z) continue
    if (Math.abs(x) > halfWidth - MARGIN_X) continue

    const depth = z0 - z1
    const cellW = (halfWidth * 2) / cols
    const cellD = depth / rows

    const u = (x + halfWidth) / (halfWidth * 2)
    const v = (z0 - z) / depth

    const col = Math.min(cols - 1, Math.max(0, Math.floor(u * cols)))
    const row = Math.min(rows - 1, Math.max(0, Math.floor(v * rows)))

    const cx = -halfWidth + (col + 0.5) * cellW
    const cz = z0 - (row + 0.5) * cellD

    return {
      x: cx,
      z: cz,
      y,
      terraceIndex: t.index,
      key: `${t.index}:${col}:${row}`,
    }
  }
  return null
}