import * as THREE from 'three'
import { illustrationMaterial } from './illustrationMaterial.ts'
import { botanicalBackdrop } from './botanicalBackdrop.ts'
import { distantGarden } from './distantGarden.ts'
import { qualityConfig } from '@/composables/useDeviceTier'

export function terrainHeight(x: number, z: number) {
  return 12 * Math.sin(x / 190) * Math.cos(z / 240)
       + 22 * Math.sin(z / 310)
       + Math.pow(Math.min(Math.abs(x), 650) / 1000, 3) * 80
}

/** Entire environment is geometry: no photograph, backdrop plane or fake shadow. */
export function createGardenWorld(scene: THREE.Scene) {
  const q = qualityConfig()
  const group = new THREE.Group()

  const botanicals = botanicalBackdrop(terrainHeight)
  group.add(botanicals.group)

  const distance = distantGarden()
  group.add(distance.group)

  scene.add(group)

  const geometries: THREE.BufferGeometry[] = []
  const materials: THREE.Material[] = []
  const geo = <T extends THREE.BufferGeometry>(g: T) => { geometries.push(g); return g }
  const mat = (color: string, paperScale = 1) => {
    const m = illustrationMaterial(color, false, paperScale)
    materials.push(m); return m
  }

  let seed = 7321
  const rand = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296 }

  const groundGeometry = geo(new THREE.PlaneGeometry(3200, 3500, 100, 110))
  groundGeometry.rotateX(-Math.PI / 2)
  const pos = groundGeometry.getAttribute('position'), colors: number[] = []
  const c = new THREE.Color()
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i)
    pos.setY(i, terrainHeight(x, z))
    const patch = Math.sin(x / 120 + Math.sin(z / 80)) * Math.cos(z / 140)
    c.set('#b4d5ac').multiplyScalar(0.96 + patch * 0.025 + rand() * 0.025)
    colors.push(c.r, c.g, c.b)
  }
  groundGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  groundGeometry.computeVertexNormals()
  const groundMaterial = mat('#ffffff'); groundMaterial.vertexColors = true
  const ground = new THREE.Mesh(groundGeometry, groundMaterial)
  ground.receiveShadow = q.shadows; group.add(ground)

  // 草地实例（按档位调整数量）
  const grassGeo = geo(new THREE.BufferGeometry())
  grassGeo.setAttribute('position', new THREE.Float32BufferAttribute([
    -5,0,0,-4,0,0,-6,7,1, -0.5,0,0,0.5,0,0,0,10,1, 4,0,0,5,0,0,6,6,1,
  ], 3))
  grassGeo.computeVertexNormals()
  const
