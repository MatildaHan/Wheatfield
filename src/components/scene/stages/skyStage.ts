import * as THREE from 'three'
import type { Stage } from './types'

/** 天空展开：从 0 到 1 的竖直缩放 */
export class SkyStage implements Stage {
  group = new THREE.Group()
  private mesh?: THREE.Mesh
  private t = 0
  private target = 0
  private growing = false

  constructor(scene: THREE.Scene, _world: unknown) {
    const geo = new THREE.PlaneGeometry(4000, 2400)
    const mat = new THREE.MeshBasicMaterial({
      color: '#dbe7ea', transparent: true, opacity: 0, side: THREE.DoubleSide, fog: false,
    })
    this.mesh = new THREE.Mesh(geo, mat)
    this.mesh.position.set(0, 900, -2200)
    this.group.add(this.mesh)
    scene.add(this.group)
  }

  begin(_nx: number, _ny: number) { this.growing = true; this.target = 1 }
  drag(_nx: number, _ny: number) { this.target = 1 }
  end(): boolean { this.growing = false; return this.t >= 0.98 }

  update(dt: number, _time: number, _reduced: boolean) {
    if (!this.mesh) return
    this.t += (this.target - this.t) * (1 - Math.exp(-dt * 2))
    const m = this.mesh.material as THREE.MeshBasicMaterial
    m.opacity = Math.min(1, this.t) * 0.85
    this.mesh.scale.y = 0.2 + this.t * 0.8
  }

  reset() { this.t = 0; this.target = 0; this.growing = false }

  dispose() {
    this.mesh?.geometry.dispose()
    ;(this.mesh?.material as THREE.Material | undefined)?.dispose()
  }
}