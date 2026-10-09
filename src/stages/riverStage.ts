import * as THREE from 'three'
import type { Stage } from './types'

/** 河流：在远处拖动画一条河 */
export class RiverStage implements Stage {
  group = new THREE.Group()
  private material: THREE.Material
  private points: THREE.Vector3[] = []
  private mesh?: THREE.Mesh
  private drawing = false
  private t = 0
  private target = 0

  constructor(scene: THREE.Scene, _world: unknown) {
    this.material = new THREE.MeshBasicMaterial({
      color: '#7fb4c9', transparent: true, opacity: 0.75, side: THREE.DoubleSide, fog: false,
    })
    scene.add(this.group)
  }

  begin(nx: number, _ny: number) {
    this.drawing = true
    this.points = []
    this.points.push(new THREE.Vector3((nx - 0.5) * 1800, 2, -400))
    this.rebuild()
  }
  drag(nx: number, ny: number) {
    if (!this.drawing) return
    const x = (nx - 0.5) * 2000
    const z = -400 - ny * 400
    const last = this.points[this.points.length - 1]
    if (last && last.distanceTo(new THREE.Vector3(x, 2, z)) > 40) {
      this.points.push(new THREE.Vector3(x, 2, z))
      this.rebuild()
    }
  }
  end(): boolean {
    this.drawing = false
    this.target = 1
    return this.points.length >= 3
  }

  private rebuild() {
    if (this.mesh) { this.mesh.geometry.dispose(); this.group.remove(this.mesh) }
    if (this.points.length < 2) return
    const curve = new THREE.CatmullRomCurve3(this.points)
    const geo = new THREE.TubeGeometry(curve, Math.max(24, this.points.length * 8), 40, 6, false)
    this.mesh = new THREE.Mesh(geo, this.material)
    this.group.add(this.mesh)
  }

  update(dt: number, _time: number, _reduced: boolean) {
    if (!this.mesh) return
    this.t += (this.target - this.t) * (1 - Math.exp(-dt * 2))
    ;(this.mesh.material as THREE.MeshBasicMaterial).opacity = 0.2 + this.t * 0.55
  }

  reset() {
    this.points = []; this.drawing = false; this.t = 0; this.target = 0
    if (this.mesh) { this.mesh.geometry.dispose(); this.group.remove(this.mesh); this.mesh = undefined }
  }
  dispose() { this.material.dispose() }
}