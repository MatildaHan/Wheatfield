import * as THREE from 'three'
import { illustrationMaterial } from './illustrationMaterial.ts'
import { botanicalBackdrop } from './botanicalBackdrop.ts'
import { distantGarden } from './distantGarden.ts'
import { createTerraces } from './terraces.ts'

export function terrainHeight(x: number, z: number) {
  return 12 * Math.sin(x / 190) * Math.cos(z / 240)
       + 22 * Math.sin(z / 310)
       + Math.pow(Math.min(Math.abs(x), 650) / 1000, 3) * 80
}

/** Entire environment is geometry: no photograph, backdrop plane or fake shadow. */
export function createGardenWorld(scene: THREE.Scene) {
  const group = new THREE.Group()

  const botanicals = botanicalBackdrop(terrainHeight)
  group.add(botanicals.group)

  const distance = distantGarden()
  group.add(distance.group)

  const terraces = createTerraces()
  group.add(terraces.group)

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
    // 背景地面整体下移 2，避免与梯田平台 z-fighting
    pos.setY(i, terrainHeight(x, z) - 2)
    const patch = Math.sin(x / 120 + Math.sin(z / 80)) * Math.cos(z / 140)
    c.set('#b4d5ac').multiplyScalar(0.96 + patch * 0.025 + rand() * 0.025)
    colors.push(c.r, c.g, c.b)
  }
  groundGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  groundGeometry.computeVertexNormals()
  const groundMaterial = mat('#ffffff'); groundMaterial.vertexColors = true
  const ground = new THREE.Mesh(groundGeometry, groundMaterial)
  ground.receiveShadow = true; group.add(ground)

  // 草地实例化（远离梯田区域）
  const grassGeo = geo(new THREE.BufferGeometry())
  grassGeo.setAttribute('position', new THREE.Float32BufferAttribute(
    [-5,0,0,-4,0,0,-6,7,1, -0.5,0,0,0.5,0,0,0,10,1, 4,0,0,5,0,0,6,6,1], 3,
  ))
  grassGeo.computeVertexNormals()
  const grass = new THREE.InstancedMesh(grassGeo, mat('#566d58'), 3200)
  const dummy = new THREE.Object3D()
  let placed = 0, guard = 0
  while (placed < grass.count && guard < grass.count * 4) {
    guard++
    const x = (rand() - 0.5) * 2400, z = (rand() - 0.5) * 2300
    // 跳过梯田区域（|x|<950 且 z∈[-500, 380]）
    if (Math.abs(x) < 950 && z > -500 && z < 380) continue
    dummy.position.set(x, terrainHeight(x, z) + 0.2, z)
    dummy.rotation.set(0, rand() * 6, 0)
    dummy.scale.setScalar(0.4 + rand() * 0.9)
    dummy.updateMatrix(); grass.setMatrixAt(placed, dummy.matrix)
    placed++
  }
  grass.receiveShadow = true; group.add(grass)

  // 蕨类
  const fernGeometry = geo(new THREE.BufferGeometry())
  fernGeometry.setAttribute('position', new THREE.Float32BufferAttribute(
    [0,0,0, -8,16,2, 0,40,7, 0,0,0, 0,40,7, 8,16,2], 3,
  ))
  fernGeometry.computeVertexNormals()
  const fernPlacements: [number, number, number][] = [
    [-490,470,1],[-750,640,1],[850,510,1],[970,-350,1],[1150,700,1],
    [-660,-880,0.62],[790,-960,0.58],
    [-870,-570,0.8],[1160,-790,0.68],
    [-700,-180,0.85],[760,-80,0.72],
    [-1090,180,1.05],[1210,210,0.9],
  ]
  const fernLeaves = new THREE.InstancedMesh(fernGeometry, mat('#83a588'), fernPlacements.length * 5 * 12 * 2)
  let leafletIndex = 0
  const stemMat = mat('#536e52')
  for (let plant = 0; plant < fernPlacements.length; plant++) {
    const [x, z, plantScale] = fernPlacements[plant]!
    const baseY = terrainHeight(x, z)
    for (let frond = 0; frond < 5; frond++) {
      const theta = frond / 5 * Math.PI * 2 + plant
      const height = (65 + rand() * 105) * plantScale
      const curve = new THREE.CubicBezierCurve3(
        new THREE.Vector3(x, baseY, z),
        new THREE.Vector3(x, baseY + height * 0.65, z),
        new THREE.Vector3(x + Math.cos(theta) * height * 0.65, baseY + height * 1.3, z + Math.sin(theta) * height * 0.65),
        new THREE.Vector3(x + Math.cos(theta) * height, baseY + height * 0.75, z + Math.sin(theta) * height),
      )
      const stem = new THREE.Mesh(geo(new THREE.TubeGeometry(curve, 12, 0.85, 3, false)), stemMat)
      stem.castShadow = true; group.add(stem)
      for (let node = 0; node < 12; node++) for (const leafSide of [-1, 1]) {
        const t = 0.12 + node * 0.07, p = curve.getPoint(t)
        dummy.position.copy(p)
        dummy.rotation.set(0.3, -theta, leafSide * (0.85 + t * 0.45))
        const size = (1 - t * 0.8) * height / 110
        dummy.scale.set(size, size, size); dummy.updateMatrix()
        fernLeaves.setMatrixAt(leafletIndex++, dummy.matrix)
      }
    }
  }
  fernLeaves.castShadow = fernLeaves.receiveShadow = true; group.add(fernLeaves)

  const hemi = new THREE.HemisphereLight('#fff9e9', '#b7cbb6', 2.1)
  const sun = new THREE.DirectionalLight('#fff6e4', 1.15)
  sun.position.set(-650, 1100, 500); sun.target.position.set(0, 0, -100)
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048)
  Object.assign(sun.shadow.camera, {
    left: -1150, right: 1150, top: 1150, bottom: -1150, near: 10, far: 3000,
  })
  sun.shadow.normalBias = 1.5; sun.shadow.bias = -0.00015
  scene.add(hemi, sun, sun.target)

  scene.background = null
  scene.fog = new THREE.Fog('#e9e6d5', 1600, 3800)

  return {
    ground,
    terraces: terraces.terraces,
    plantingObstacles: botanicals.obstacles,
    dispose() {
      botanicals.dispose()
      distance.dispose()
      terraces.dispose()
      geometries.forEach(g => g.dispose())
      materials.forEach(m => m.dispose())
      sun.shadow.map?.dispose()
      scene.remove(group, hemi, sun, sun.target)
    },
  }
}