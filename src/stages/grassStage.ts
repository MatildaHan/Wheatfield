import * as THREE from 'three'
import { illustrationMaterial } from '../illustrationMaterial'
import type { Stage } from './types'

/** 草地生长：按住拖动，草从指针位置向外扩散 */
export class GrassStage implements Stage {
  group = new THREE.Group()
  private geometries: THREE.BufferGeometry[] = []
  private materials: THREE.Material[] = []
  private grass?: THREE.InstancedMesh
  private total = 3200
  private grown = 0
  private growing = false
  private origin = new THREE.Vector2(0.5, 0.8)
  private target = 0

  constructor(scene: THREE.Scene, _world: { ground: THREE.Mesh }) {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute([
      -5,0,0,-4,0,0,-6,7,1, -0.5,0,0,0.5,0,0,0,10,1, 4,0,0,5,0,0,6,6,1,
    ], 3))
    geo.computeVertexNormals()
    this.geometries.push(geo)
    const mat = illustrationMaterial('#566d58')
    this.materials.push(mat)
    this.grass = new THREE.InstancedMesh(geo, mat, this.total)
    this.grass.count = 0
    this.grass.receiveShadow = true
    this.group.add(this.grass)
    scene.add(this.group)
  }

  begin(nx: number, ny: number, _cx: number, _cy: number) {
    this.origin.set(nx, ny)
    this.growing = true
    this.target = Math.min(this.total, this.target + 420)
  }
  drag(nx: number, ny: number) {
    if (!this.growing) return
    this.origin.set(nx, ny)
    this.target = Math.min(this.total, this.target + 18)
  }
  end(): boolean {
    this.growing = false
    return this.target >= 420
  }

  update(dt: number, _time: number, _reduced: boolean) {
    if (!this.grass) return
    const speed = 900
    this.grown = Math.min(this.target, this.grown + dt * speed)
    this.grass.count = Math.floor(this.grown)
    // 重新布置前 N 个实例
    const dummy = new THREE.Object3D()
    const seed = 12345
    let s = seed
    const rand = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296 }
    for (let i = 0; i < this.grass.count; i++) {
      const angle = rand() * Math.PI * 2
      const radius = Math.sqrt(rand()) * (0.15 + this.grown / this.total * 0.75)
      const x = (this.origin.x + Math.cos(angle) * radius - 0.5) * 2600
      const z = (this.origin.y + Math.sin(angle) * radius - 0.5) * 2400
      dummy.position.set(x, 0.2, z)
      dummy.rotation.set(0, rand() * 6, 0)
      dummy.scale.setScalar(0.4 + rand() * 0.9)
      dummy.updateMatrix()
      this.grass.setMatrixAt(i, dummy.matrix)
    }
    this.grass.instanceMatrix.needsUpdate = true
  }

  reset() {
    this.grown = 0
    this.target = 0
    this.growing = false
    if (this.grass) this.grass.count = 0
  }

  dispose() {
    this.geometries.forEach(g => g.dispose())
    this.materials.forEach(m => m.dispose())
  }
}