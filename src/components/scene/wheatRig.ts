import * as THREE from 'three'
import { illustrationMaterial } from './illustrationMaterial.ts'
import { shootPoint, foldedPetal } from '@/composables/flowerGrowth'

export interface WheatRig {
  group: THREE.Group
  head: THREE.Group
  grains: { pivot: THREE.Group; surfaces: (THREE.Mesh | THREE.LineSegments)[]; row: number; offset: number }[]
  stems: THREE.Group[]
  leaves: THREE.Group[]
  shadow: THREE.Mesh
  core: THREE.Group
  tuft: THREE.Group
  bud: THREE.Group
  root: THREE.Vector3
  stemHeight: number
  bloomAge: number
  age: number
  grow: number
  target: number
  bend: number
  targetBend?: number
  seed: number
  tilt: number
  headSize: number
  source?: { x: number; y: number; opacity: number }
  fadingMaterials: { material: THREE.Material; opacity: number }[]
}

const ink = '#293e3d'

// 麦色三档：青麦 / 黄麦 / 金麦
const WHEAT_PALETTES = [
  ['#8fa86a', '#a3b878', '#b8c98a'],
  ['#c9b46a', '#d8c37c', '#e5d18e'],
  ['#c99a4e', '#d8ac60', '#e6be74'],
]

/** 共享几何与材质（模块级，只分配一次） */
const shared = (() => {
  const geometries: THREE.BufferGeometry[] = []
  const materials: THREE.Material[] = []
  const keep = <T extends THREE.BufferGeometry>(g: T) => { geometries.push(g); return g }

  const stemMaterial = illustrationMaterial('#9aa876')
  const stemInk = illustrationMaterial(ink)
  const leafMaterial = illustrationMaterial('#8a9c6a')
  const tipMaterial = illustrationMaterial('#e8d78e')
  materials.push(stemMaterial, stemInk, leafMaterial, tipMaterial)

  function blade(
    length: number, breadth: number, curve: number,
    variant = 0, leaf = false, grain = false,
  ) {
    const vertices: number[] = [], indices: number[] = [], colors: number[] = [], edge: THREE.Vector3[] = []
    const steps = 20
    for (let i = 0; i <= steps; i++) {
      const t = i / steps
      const profile = leaf
        ? Math.pow(Math.sin(Math.PI * t), 0.8)
        : grain
          ? Math.pow(Math.sin(Math.PI * t), 0.55) * (0.7 + 0.3 * Math.sin(t * 8))
          : Math.pow(Math.sin(Math.PI * t), 0.36) * (0.22 + 0.78 * Math.pow(t, 0.38))
      const w = profile * breadth * (1 + 0.12 * Math.sin(t * 13 + variant)) + 0.1
      const drift = Math.sin(t * Math.PI * 0.9) * Math.sin(variant * 2.3) * 4 + t * t * Math.cos(variant) * 4
      const y = t * length
      const z = curve * Math.sin(Math.PI * t)
      const twist = Math.sin(t * Math.PI) * Math.sin(variant * 1.7) * 4
      vertices.push(drift - w, y, z - twist, drift, y, z + Math.sin(Math.PI * t) * 1.5, drift + w, y, z + twist)
      for (let j = 0; j < 3; j++) {
        const wash = 0.8 + t * 0.16 + Math.sin(t * 11 + variant) * 0.015 + (j === 1 ? 0.02 : 0)
        colors.push(wash, wash, wash)
      }
      edge.push(new THREE.Vector3(drift - w, y, z - twist))
      if (i < steps) for (let j = 0; j < 2; j++) {
        const a = i * 3 + j
        indices.push(a, a + 3, a + 1, a + 1, a + 3, a + 4)
      }
    }
    for (let i = steps; i >= 0; i--) {
      const k = i * 9
      edge.push(new THREE.Vector3(vertices[k + 6], vertices[k + 7], vertices[k + 8]))
    }
    const mesh = keep(new THREE.BufferGeometry())
    mesh.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
    mesh.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
    mesh.setIndex(indices); mesh.computeVertexNormals()
    const outline = keep(new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3(edge, true), 48,
      grain ? 0.5 : leaf ? 0.55 : 0.6, 3, true,
    ))
    const veins: THREE.Vector3[] = []
    for (let i = 3; i < steps - 3; i++) {
      const k = i * 9, next = (i + 1) * 9
      veins.push(
        new THREE.Vector3(vertices[k + 3], vertices[k + 4], vertices[k + 5] + 0.3),
        new THREE.Vector3(vertices[next + 3], vertices[next + 4], vertices[next + 5] + 0.3),
      )
    }
    const veinGeometry = keep(new THREE.BufferGeometry().setFromPoints(veins))
    if (!grain) {
      for (const geometry of [mesh, outline, veinGeometry]) {
        const positions = geometry.getAttribute('position')
        const folded: number[] = []
        for (let i = 0; i < positions.count; i++) {
          folded.push(...foldedPetal(
            positions.getX(i), positions.getY(i), positions.getZ(i), length,
          ))
        }
        geometry.morphAttributes.position = [new THREE.Float32BufferAttribute(folded, 3)]
        const foldedGeometry = new THREE.BufferGeometry()
        foldedGeometry.setAttribute('position', new THREE.Float32BufferAttribute(folded, 3))
        if (geometry.index) foldedGeometry.setIndex(geometry.index.clone())
        foldedGeometry.computeVertexNormals()
        geometry.morphAttributes.normal = [foldedGeometry.getAttribute('normal').clone()]
        foldedGeometry.dispose()
      }
    }
    return { mesh, outline, veins: veinGeometry }
  }

  const grainShape = blade(13, 4.2, 1.0, 3, false, true)
  const awnShape = blade(38, 0.9, 1.6, 5)
  const leafShape = blade(46, 6, 3, 2, true)
  const budShape = blade(20, 5, 1.5, 4, true)

  const veinMaterial = new THREE.LineBasicMaterial({ color: '#5a6b46', transparent: true, opacity: 0.35 })
  materials.push(veinMaterial)

  const stemGeometry = keep(new THREE.CylinderGeometry(1, 1, 1, 7))
  const sphereGeometry = keep(new THREE.SphereGeometry(1, 10, 7))

  const flowerMaterials = WHEAT_PALETTES.map(colors => colors.map(c => {
    const m = illustrationMaterial(c)
    materials.push(m); return m
  }))

  const shadowMaterial = new THREE.MeshBasicMaterial({
    color: '#4b6350', transparent: true, opacity: 0.18, depthWrite: false,
  })
  materials.push(shadowMaterial)
  const shadowShape = new THREE.Shape()
  for (let i = 0; i <= 120; i++) {
    const a = i / 120 * Math.PI * 2
    const r = 0.7 + Math.sin(a * 14) * 0.12 + Math.sin(a * 6) * 0.05
    if (i === 0) shadowShape.moveTo(Math.cos(a) * r, Math.sin(a) * r)
    else shadowShape.lineTo(Math.cos(a) * r, Math.sin(a) * r)
  }
  const shadowGeometry = keep(new THREE.ShapeGeometry(shadowShape))

  const grassShapes = Array.from({ length: 6 }, (_, i) => {
    const path = new THREE.CubicBezierCurve3(
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3((i - 3) * 2, 11, 2),
      new THREE.Vector3((i - 3) * 4, 18 + i % 3 * 5, 3),
      new THREE.Vector3((i - 3) * 6, 4 + i % 2 * 8, 4),
    )
    return keep(new THREE.TubeGeometry(path, 10, 0.7, 3, false))
  })

  function outlined(shape: ReturnType<typeof blade>, mat: THREE.Material) {
    const g = new THREE.Group()
    g.add(
      new THREE.Mesh(shape.mesh, mat),
      new THREE.Mesh(shape.outline, stemInk),
      new THREE.LineSegments(shape.veins, veinMaterial),
    )
    g.traverse(o => { if (o instanceof THREE.Mesh) { o.castShadow = true; o.receiveShadow = true } })
    return g
  }

  return {
    geometries, materials,
    stemMaterial, stemInk, leafMaterial, tipMaterial, veinMaterial,
    grainShape, awnShape, leafShape, budShape,
    stemGeometry, sphereGeometry,
    flowerMaterials, shadowMaterial, shadowGeometry,
    grassShapes,
    outlined,
    dispose() {
      geometries.forEach(g => g.dispose())
      materials.forEach(m => m.dispose())
    },
  }
})()

export function disposeWheatShared() { shared.dispose() }

/** 创建一株麦穗，根锚定在世界坐标 root */
export function createWheatRig(
  root: THREE.Vector3,
  colorIndex: number,
  source?: { x: number; y: number; opacity: number },
): WheatRig {
  const group = new THREE.Group()
  const head = new THREE.Group()
  const core = new THREE.Group()
  group.add(head)

  // ---- 麦粒：沿穗轴双列交错 ----
  const grains: WheatRig['grains'] = []
  const ROWS = 14
  for (let row = 0; row < ROWS; row++) {
    const t = row / (ROWS - 1)
    for (let side = -1; side <= 1; side += 2) {
      const pivot = new THREE.Group()
      const grain = shared.outlined(
        shared.grainShape,
        shared.flowerMaterials[colorIndex]![Math.min(2, Math.floor(t * 3))]!,
      )
      const scale = (0.55 + t * 0.2) * (0.85 + Math.random() * 0.3)
      grain.scale.set(scale * 0.9, scale, scale)
      pivot.position.set(side * 3.2, 4 + row * 2.8, 0)
      pivot.rotation.z = side * (0.42 + t * 0.18)
      pivot.rotation.x = -0.15 + Math.random() * 0.08
      pivot.add(grain)
      head.add(pivot)
      grains.push({
        pivot,
        surfaces: grain.children as (THREE.Mesh | THREE.LineSegments)[],
        row,
        offset: Math.random() * 0.12,
      })
    }
  }

  // ---- 穗轴 ----
  const rachis = new THREE.Mesh(shared.stemGeometry, shared.stemMaterial)
  rachis.scale.set(1.1, 42, 1.1)
  rachis.position.y = 21
  core.add(rachis)

  // ---- 麦芒 ----
  for (let i = 0; i < 7; i++) {
    const awn = shared.outlined(shared.awnShape, shared.tipMaterial)
    awn.position.set(0, 42 + i * 0.8, 0)
    awn.rotation.z = (i - 3) * 0.16
    awn.rotation.x = -0.2 + Math.random() * 0.15
    core.add(awn)
  }

  // ---- 顶端颖壳 ----
  const tip = new THREE.Mesh(shared.sphereGeometry, shared.tipMaterial)
  tip.scale.set(3, 5, 3)
  tip.position.y = 44
  core.add(tip)

  core.position.z = 0
  head.add(core)

  // ---- 花苞/颖壳 ----
  const bud = new THREE.Group()
  for (let i = 0; i < 4; i++) {
    const husk = shared.outlined(shared.budShape, shared.leafMaterial)
    husk.rotation.set(0.9, 0, i / 4 * Math.PI * 2)
    husk.scale.set(0.35, 0.4, 0.35)
    bud.add(husk)
  }
  head.add(bud)

  // ---- 茎 ----
  const stems = Array.from({ length: 20 }, () => {
    const segment = new THREE.Group()
    const outline = new THREE.Mesh(shared.stemGeometry, shared.stemInk)
    const fill = new THREE.Mesh(shared.stemGeometry, shared.stemMaterial)
    fill.scale.set(0.55, 1.01, 0.55)
    fill.position.z = 0.5
    segment.add(outline, fill)
    group.add(segment)
    return segment
  })

  // ---- 叶 ----
  const leaves = Array.from({ length: 5 }, () => {
    const leaf = shared.outlined(shared.leafShape, shared.leafMaterial)
    group.add(leaf)
    return leaf
  })

  // ---- 阴影 ----
  const shadow = new THREE.Mesh(shared.shadowGeometry, shared.shadowMaterial)
  shadow.position.z = -30
  shadow.visible = false
  shadow.castShadow = false
  group.add(shadow)

  // ---- 根部草丛 ----
  const tuft = new THREE.Group()
  shared.grassShapes.forEach(shape => tuft.add(new THREE.Mesh(shape, shared.stemInk)))
  tuft.position.z = 10
  group.add(tuft)

  group.position.copy(root)
  group.traverse(o => { if (o instanceof THREE.Mesh) { o.castShadow = true; o.receiveShadow = true } })

  const rig: WheatRig = {
    group, head, grains, stems, leaves, shadow, core, tuft, bud,
    root: root.clone(),
    stemHeight: 0, bloomAge: 0, age: 0, grow: 0,
    target: 190 + Math.random() * 70,
    bend: (Math.random() - 0.5) * 40,
    seed: Math.random() * 6.28,
    tilt: 0.35 + Math.random() * 0.4,
    headSize: 0.9 + Math.random() * 0.2,
    source,
    fadingMaterials: [],
  }
  return rig
}

const axis = new THREE.Vector3(0, 1, 0)
const point = new THREE.Vector3(), last = new THREE.Vector3(), delta = new THREE.Vector3()

function smooth(v: number) {
  const x = THREE.MathUtils.clamp(v, 0, 1)
  return x * x * (3 - 2 * x)
}

export function stemPoint(
  r: WheatRig, t: number, time: number,
  target: THREE.Vector3, reduced: boolean,
) {
  const sway = reduced ? 0 : Math.sin(time * 0.9 + r.seed) * 5 * r.grow
  const p = shootPoint(t, r.stemHeight, (r.bend + sway) * r.grow, smooth(r.stemHeight / 160))
  return target.set(p.x, p.y, 0)
}

export function updateWheatRig(
  r: WheatRig, dt: number, time: number,
  held: boolean, reduced: boolean,
) {
  r.age += dt
  if (r.targetBend !== undefined) {
    r.bend += (r.targetBend - r.bend) * (1 - Math.exp(-dt * 6))
  }
  const desired = held ? r.target : r.target * smooth((r.age - 0.12) / 1.65)
  const step = (desired - r.stemHeight) * (1 - Math.exp(-dt * 5))
  r.stemHeight += THREE.MathUtils.clamp(step, 0, dt * 200)
  if (reduced) r.stemHeight = r.target
  r.grow = THREE.MathUtils.clamp(r.stemHeight / Math.max(r.target, 1), 0, 1)

  if (r.grow > 0.8 && (!held || r.stemHeight > 100)) r.bloomAge += dt
  const open = reduced ? 1 : smooth((r.bloomAge - 0.4) / 1.8)

  // 淡出
  const opacity = r.source?.opacity ?? 1
  if (opacity < 0.999 && !r.fadingMaterials.length) {
    const clones = new Map<THREE.Material, THREE.Material>()
    r.group.traverse(o => {
      if (!(o instanceof THREE.Mesh || o instanceof THREE.LineSegments)) return
      const orig = o.material as THREE.Material
      let clone = clones.get(orig)
      if (!clone) {
        clone = orig.clone(); clone.onBeforeCompile = orig.onBeforeCompile
        clone.transparent = true; clones.set(orig, clone)
        r.fadingMaterials.push({ material: clone, opacity: orig.opacity })
      }
      o.material = clone
    })
  }
  r.fadingMaterials.forEach(e => { e.material.opacity = e.opacity * opacity })

  // 茎
  stemPoint(r, 0, time, last, reduced)
  r.stems.forEach((stem, i) => {
    stemPoint(r, (i + 1) / r.stems.length, time, point, reduced)
    delta.subVectors(point, last)
    stem.position.copy(last).addScaledVector(delta, 0.5)
    const radius = 1.8 - i * 0.06
    stem.scale.set(radius, Math.max(0.001, delta.length()), radius)
    stem.quaternion.setFromUnitVectors(axis, delta.normalize())
    last.copy(point)
  })

  // 叶
  r.leaves.forEach((leaf, i) => {
    const t = 0.16 + i * 0.14 + Math.sin(i * 3 + r.seed) * 0.02
    const nodeHeight = 220 * t
    const reached = smooth((r.stemHeight - nodeHeight) / 36)
    stemPoint(r, Math.min(1, nodeHeight / Math.max(r.stemHeight, 1)), time, leaf.position, reduced)
    const side = i % 2 ? 1 : -1
    leaf.rotation.set(
      0.15 + Math.sin(i + r.seed) * 0.35,
      side * 0.3,
      side * (0.95 + Math.sin(i * 2 + r.seed) * 0.2 + 0.3 * (1 - open)),
    )
    leaf.scale.setScalar(reached * (0.75 + Math.sin(i + r.seed) * 0.15))
  })

  // 穗头
  stemPoint(r, 1, time, r.head.position, reduced)
  const settleTime = Math.max(0, r.bloomAge - 1.8)
  const settle = reduced ? 0 : Math.sin(settleTime * 4) * Math.exp(-settleTime * 2.5) * 0.05
  stemPoint(r, 0.97, time, point, reduced)
  delta.subVectors(r.head.position, point)
  const tipAngle = -Math.atan2(delta.x, delta.y)

  // 麦穗低头：未熟朝上，成熟后前倾
  const headPitch = (1 - open) * -Math.PI / 2 + open * r.tilt
  r.head.rotation.set(
    headPitch + settle,
    Math.sin(r.seed) * 0.08 * open,
    tipAngle * (1 - open) + r.bend / 320 * open + settle * 0.5,
  )
  r.head.scale.setScalar(smooth(r.stemHeight / 22) * r.headSize)

  // 颖壳淡出
  r.bud.scale.setScalar(Math.max(0.001, 1 - open))
  r.bud.position.z = -3

  // 麦粒：从贴合到饱满微张
  r.grains.forEach(g => {
    const t = g.row / 13
    const grainOpen = reduced ? 1 : smooth((r.bloomAge - 0.5 - t * 0.9) / 1.5)
    const sign = g.pivot.rotation.z >= 0 ? 1 : -1
    g.pivot.rotation.z = sign * (0.42 + t * 0.18 + grainOpen * 0.22)
    g.pivot.position.z = grainOpen * 1.4
  })

  // 芒：随 open 张开
  r.core.children.forEach((child, i) => {
    if (i === 0) return
    if (child instanceof THREE.Group) {
      const base = (i - 4) * 0.16
      child.rotation.z = base * (0.3 + open * 0.7)
    }
  })

  // 阴影
  const shadowGrowth = smooth(r.stemHeight / 130) * (0.2 + open * 0.8)
  r.shadow.visible = r.grow > 0.15
  r.shadow.scale.set(52 * shadowGrowth * r.headSize, 16 * shadowGrowth, 1)
  r.shadow.position.set(-24 + r.bend * 0.25, -3, -30)
  r.shadow.rotation.z = -0.1

  // 根部
  r.tuft.scale.setScalar(0.35 + r.grow * 0.4)
}