import * as THREE from 'three'
import type { Stage } from './types'

/** 远山升起：3 层剪影从地面向上 */
export class HillsStage implements Stage {
  group = new THREE.Group()
  private meshes: THREE.Mesh[] = []
  private t = 0
  private target = 0
  private growing = false

  constructor(scene: THREE.Scene, _world: unknown) {
    const colors = ['#cbd8c4', '#b1c9b7', '#9dbeb0']
    for (let i = 0; i < 3; i++) {
      const pts: THREE.Vector2[] = [new THREE.Vector2(-2300, -120)]
      for (let j = 0; j <= 180; j++) {
        const x = -2300 + j / 180 * 4600
        const y = 95 + i * 12 + Math.sin(x / 255 + i * 2) * 32 + Math.sin(x / 92 + i) * 14
        pts.push(new THREE.Vector2(x, y))
      }
      pts.push(new THREE.Vector2(2300, -120))
      const shape = new THREE.Shape(pts)
      const geo = new THREE.ShapeGeometry(shape)
      const mat = new THREE.MeshBasicMaterial({ color: colors[i], side: THREE.DoubleSide, fog: false, transparent: true })
      const mesh = new THREE.Mesh(geo, mat)
      mesh.position.set(0, 0, -1850 + i * 200)
      mesh.scale.y = 0.01
      this.meshes.push(mesh)
      this.group.add(mesh)
    }
    scene.add(this.group)
  }

  begin(_nx: number, _ny: number) { this.growing = true; this.target = 1 }
  drag(_nx: number, _ny: number) { this.target = 1 }
  end(): boolean { this.growing = false; return this.t >= 0.98 }

  update(dt: number, _time: number, _reduced: boolean) {
    this.t += (this.target - this.t) * (1 - Math.exp(-dt * 2))
    for (let i = 0; i < this.meshes.length; i++) {
      const m = this.meshes[i]
      m.scale.y = 0.01 + this.t * 0.99
      ;(m.material as THREE.MeshBasicMaterial).opacity = Math.min(1, this.t)
    }
  }

  reset() {
    this.t = 0; this.target = 0; this.growing = false
    for (const m of this.meshes) {
      m.scale.y = 0.01
      ;(m.material as THREE.MeshBasicMaterial).opacity = 0
    }
  }

  dispose() {
    this.meshes.forEach(m => {
      m.geometry.dispose()
      ;(m.material as THREE.Material).dispose()
    })
  }
}