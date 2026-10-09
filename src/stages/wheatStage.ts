import * as THREE from 'three'
import type { Stage } from './types'
import { createWheatRig, updateWheatRig, disposeWheatShared, type WheatRig } from '../wheatRig'

interface Plot {
  group: THREE.Group
  t: number
  target: number
  rigs: WheatRig[]
}

/** 麦田：点击空地，生成四方格田地，每格一株麦子 */
export class WheatStage implements Stage {
  group = new THREE.Group()
  private plots: Plot[] = []
  private gridSize = 3      // 3x3 四方格
  private cellSize = 90

  constructor(scene: THREE.Scene, _world: unknown) {
    scene.add(this.group)
  }

  place(nx: number, ny: number): boolean {
    const x = (nx - 0.5) * 1400
    const z = 100 - ny * 900
    const plot = new THREE.Group()
    plot.position.set(x, 0, z)

    // 田埂（四方格边框）
    const half = (this.gridSize * this.cellSize) / 2
    const borderGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-half, 1, -half),
      new THREE.Vector3( half, 1, -half),
      new THREE.Vector3( half, 1,  half),
      new THREE.Vector3(-half, 1,  half),
      new THREE.Vector3(-half, 1, -half),
    ])
    const borderMat = new THREE.LineBasicMaterial({ color: '#7a5a3a' })
    const border = new THREE.Line(borderGeo, borderMat)
    plot.add(border)

    // 网格线
    const gridLines: THREE.Vector3[] = []
    for (let i = 1; i < this.gridSize; i++) {
      const p = -half + i * this.cellSize
      gridLines.push(new THREE.Vector3(p, 1, -half), new THREE.Vector3(p, 1, half))
      gridLines.push(new THREE.Vector3(-half, 1, p), new THREE.Vector3(half, 1, p))
    }
    const gridGeo = new THREE.BufferGeometry().setFromPoints(gridLines)
    const gridMat = new THREE.LineBasicMaterial({ color: '#a8865c' })
    plot.add(new THREE.LineSegments(gridGeo, gridMat))

    // 每格种一株麦
    const rigs: WheatRig[] = []
    for (let r = 0; r < this.gridSize; r++) {
      for (let c = 0; c < this.gridSize; c++) {
        const cx = -half + (c + 0.5) * this.cellSize
        const cz = -half + (r + 0.5) * this.cellSize
        const rig = createWheatRig(new THREE.Vector3(cx, 1, cz), 0)
        rig.age = 3; rig.grow = 1; rig.stemHeight = rig.target; rig.bloomAge = 4
        rigs.push(rig)
        plot.add(rig.group)
      }
    }

    plot.scale.setScalar(0.01)
    this.group.add(plot)
    this.plots.push({ group: plot, t: 0, target: 1, rigs })
    return true
  }

  update(dt: number, time: number, reduced: boolean) {
    for (const p of this.plots) {
      p.t += (p.target - p.t) * (1 - Math.exp(-dt * 3))
      p.group.scale.setScalar(0.01 + p.t * 0.99)
      for (const rig of p.rigs) updateWheatRig(rig, dt, time, false, reduced)
    }
  }

  reset() {
    for (const p of this.plots) {
      p.rigs.forEach(r => r.fadingMaterials.forEach(e => e.material.dispose()))
      this.group.remove(p.group)
    }
    this.plots = []
    disposeWheatShared()
  }

  dispose() {}
}