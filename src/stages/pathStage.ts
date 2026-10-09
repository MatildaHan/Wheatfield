import * as THREE from 'three'
import { illustrationMaterial } from '../illustrationMaterial'
import type { Stage } from './types'

/** 小路：玩家拖动，生成一条蜿蜒土路 */
export class PathStage implements Stage {
  group = new THREE.Group()
  private material: THREE.Material
  private points: THREE.Vector3[] = []
  private mesh?: THREE.Mesh
  private drawing = false

  constructor(scene: THREE.Scene, _world: unknown) {
    this.material = illustrationMaterial('#c9b48c')
    scene.add(this.group)
  }

  begin(nx: number, _ny: number) {
    this.drawing = true
    this.points = []
    const x = (nx - 0.5) * 1400
    this.points.push(new THREE.Vector3(x, 1, 200))
    this.rebuild()
  }
  drag(nx: number, ny: number) {
    if (!this.drawing) return
    const x = (nx - 0.5) * 1600
    const z = 200 - ny * 900
    const last = this.points[this.points.length - 1]
    if (last && last.distanceTo(new THREE.Vector3(x, 1, z)) > 30) {
      this.points.push(new THREE.Vector3(x, 1, z))
      this.rebuild()
    }
  }
  end(): boolean {
    this.drawing = false
    return this.points.length >= 4
  }

  private rebuild() {
    if (this.mesh) { this.mesh.geometry.dispose(); this.group.remove(this.mesh) }
    if (this.points.length < 2) return
    const curve = new THREE.CatmullRomCurve3(this.points)
    const geo = new THREE.TubeGeometry(curve, Math.max(24, this.points.length * 6), 28, 6, false)
    this.mesh = new THREE.Mesh(geo, this.material)
    this.mesh.position.y = 0.4
    this.mesh.receiveShadow = true
    this.group.add(this.mesh)
  }

  update(_dt: number, _time: number, _reduced: boolean) {}
  reset() {
    this.points = []
    this.drawing = false
    if (this.mesh) { this.mesh.geometry.dispose(); this.group.remove(this.mesh); this.mesh = undefined }
  }
  dispose() { this.material.dispose() }
}