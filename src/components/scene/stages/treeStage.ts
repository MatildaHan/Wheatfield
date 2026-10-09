import * as THREE from 'three'
import { illustrationMaterial } from '..illustrationMaterial'
import type { Stage } from '.types'

interface Tree {
  group THREE.Group
  t number
  target number
}

 种树：点击空地，一棵树从地里生长 
export class TreeStage implements Stage {
  group = new THREE.Group()
  private geometries THREE.BufferGeometry[] = []
  private materials THREE.Material[] = []
  private trees Tree[] = []
  private trunkGeo THREE.CylinderGeometry
  private crownGeo THREE.ShapeGeometry
  private trunkMat THREE.Material
  private crownMat THREE.Material

  constructor(scene THREE.Scene, _world unknown) {
    this.trunkGeo = new THREE.CylinderGeometry(1, 1.4, 1, 6)
    this.geometries.push(this.trunkGeo)
    const shape = new THREE.Shape()
    for (let i = 0; i = 40; i++) {
      const a = i  40  Math.PI  2
      const r = 70 + Math.sin(a  7)  10 + Math.sin(a  3)  6
      if (i === 0) shape.moveTo(Math.cos(a)  r, Math.sin(a)  r)
      else shape.lineTo(Math.cos(a)  r, Math.sin(a)  r)
    }
    this.crownGeo = new THREE.ShapeGeometry(shape)
    this.geometries.push(this.crownGeo)
    this.trunkMat = illustrationMaterial('#7a5a3a')
    this.crownMat = illustrationMaterial('#7fa06a')
    this.materials.push(this.trunkMat, this.crownMat)
    scene.add(this.group)
  }

  place(nx number, ny number) boolean {
    const x = (nx - 0.5)  1500
    const z = 200 - ny  1100
    if (Math.abs(x)  100 && z  -200) return false  避开中心
    const g = new THREE.Group()
    const trunk = new THREE.Mesh(this.trunkGeo, this.trunkMat)
    trunk.scale.set(6, 100, 6)
    trunk.position.y = 50
    const crown = new THREE.Mesh(this.crownGeo, this.crownMat)
    crown.position.y = 130
    g.add(trunk, crown)
    g.position.set(x, 0, z)
    g.scale.setScalar(0.01)
    this.group.add(g)
    this.trees.push({ group g, t 0, target 1 })
    return true
  }

  update(dt number, _time number, _reduced boolean) {
    for (const tr of this.trees) {
      tr.t += (tr.target - tr.t)  (1 - Math.exp(-dt  3))
      tr.group.scale.setScalar(0.01 + tr.t  0.99)
    }
  }

  reset() {
    for (const tr of this.trees) this.group.remove(tr.group)
    this.trees = []
  }

  dispose() {
    this.geometries.forEach(g = g.dispose())
    this.materials.forEach(m = m.dispose())
  }
}
