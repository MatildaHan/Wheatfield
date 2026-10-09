import * as THREE from 'three'
import { illustrationMaterial } from '../illustrationMaterial'
import type { Stage } from './types'

interface House { group: THREE.Group; t: number; target: number }

/** 盖房：点击路边，一座房子从地面升起 */
export class HouseStage implements Stage {
  group = new THREE.Group()
  private geometries: THREE.BufferGeometry[] = []
  private materials: THREE.Material[] = []
  private houses: House[] = []
  private wallGeo: THREE.BoxGeometry
  private roofGeo: THREE.ConeGeometry
  private wallMat: THREE.Material
  private roofMat: THREE.Material

  constructor(scene: THREE.Scene, _world: unknown) {
    this.wallGeo = new THREE.BoxGeometry(1, 1, 1)
    this.roofGeo = new THREE.ConeGeometry(0.8, 0.6, 4)
    this.geometries.push(this.wallGeo, this.roofGeo)
    this.wallMat = illustrationMaterial('#e8dcc0')
    this.roofMat = illustrationMaterial('#a86b5a')
    this.materials.push(this.wallMat, this.roofMat)
    scene.add(this.group)
  }

  place(nx: number, ny: number): boolean {
    const x = (nx - 0.5) * 1400
    const z = 100 - ny * 900
    const g = new THREE.Group()
    const wall = new THREE.Mesh(this.wallGeo, this.wallMat)
    wall.scale.set(90, 70, 90); wall.position.y = 35
    const roof = new THREE.Mesh(this.roofGeo, this.roofMat)
    roof.scale.set(80, 60, 80); roof.position.y = 100; roof.rotation.y = Math.PI / 4
    g.add(wall, roof)
    g.position.set(x, 0, z)
    g.scale.setScalar(0.01)
    this.group.add(g)
    this.houses.push({ group: g, t: 0, target: 1 })
    return true
  }

  update(dt: number, _time: number, _reduced: boolean) {
    for (const h of this.houses) {
      h.t += (h.target - h.t) * (1 - Math.exp(-dt * 3))
      h.group.scale.setScalar(0.01 + h.t * 0.99)
    }
  }

  reset() {
    for (const h of this.houses) this.group.remove(h.group)
    this.houses = []
  }

  dispose() {
    this.geometries.forEach(g => g.dispose())
    this.materials.forEach(m => m.dispose())
  }
}