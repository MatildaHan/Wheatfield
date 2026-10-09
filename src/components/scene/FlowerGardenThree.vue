<template>
  <canvas ref="canvas" class="flower-garden" aria-hidden="true" />
  <p v-if="webglError" class="garden-error" role="alert">
    无法启动 WebGL。请启用浏览器硬件加速，或换用支持 WebGL 的浏览器。
  </p>
  <div
    v-if="sceneState.threeFlowersReady && sceneState.phase === 'interactive'"
    class="garden-hint"
  >
    <span>↑</span> 按住梯田向上拖动，让麦子长高 <i>·</i> 也可以轻点格子种麦
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, onActivated, onDeactivated } from 'vue'
import * as THREE from 'three'
import { sceneState, isInGroundZone } from '@/composables/useSceneState'
import { plantFlower } from '@/composables/useFlowers'
import { createGardenWorld, terrainHeight } from './gardenWorld'
import {
  createWheatRig, updateWheatRig, disposeWheatShared, type WheatRig,
} from './wheatRig'
import { snapToTerrace } from './terraces'

const emit = defineEmits<{ planted: [] }>()
const canvas = ref<HTMLCanvasElement | null>(null)
const webglError = ref(false)

const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(46, 1, 5, 5000)
camera.position.set(0, 680, 1250)
camera.lookAt(0, 120, -180)

const world = createGardenWorld(scene)
const raycaster = new THREE.Raycaster()

/** 记录已被占用的梯田格子 key */
const occupiedCells = new Set<string>()

interface GroundHit { point: THREE.Vector3; cell: string }

function groundPoint(x: number, y: number): GroundHit | undefined {
  camera.updateMatrixWorld()
  world.ground.updateMatrixWorld()
  raycaster.setFromCamera(new THREE.Vector2(x * 2 - 1, 1 - y * 2), camera)

  const terraceMeshes = world.terraces.map(t => t.mesh)
  terraceMeshes.forEach(m => m.updateWorldMatrix(true, false))
  const terraceHit = raycaster.intersectObjects(terraceMeshes, false)[0]
  const groundHit = raycaster.intersectObject(world.ground)[0]

  let hit = terraceHit
  if (!hit || (groundHit && groundHit.distance < hit.distance)) hit = groundHit
  if (!hit) return

  // 障碍物
  world.plantingObstacles.forEach(o => o.updateWorldMatrix(true, false))
  const obstruction = raycaster.intersectObjects(world.plantingObstacles, false)[0]
  if (obstruction && obstruction.distance < hit.distance) return

  // 梯田上：吸附到格子
  if (terraceHit && (!groundHit || terraceHit.distance <= groundHit.distance)) {
    const snap = snapToTerrace(hit.point.x, hit.point.z, world.terraces)
    if (!snap) return
    if (occupiedCells.has(snap.key)) return
    return { point: new THREE.Vector3(snap.x, snap.y, snap.z), cell: snap.key }
  }
  // 梯田之外不允许种植
  return
}

let renderer: THREE.WebGLRenderer | undefined
let raf = 0
let previous = 0
let active = false
let width = 1
let height = 1
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')

// 前景叶（复用花朵项目的叶片，用于梯田边缘遮挡）
const foreground = new THREE.Group()
scene.add(foreground)
interface ForegroundLeaf {
  mesh: THREE.Group
  side: number
  index: number
  angle: number
}
const foregroundLeaves: ForegroundLeaf[] = []
let foregroundDisposables: { geometries: THREE.BufferGeometry[]; materials: THREE.Material[] } | undefined

function buildForeground() {
  const geometries: THREE.BufferGeometry[] = []
  const materials: THREE.Material[] = []
  const keep = <T extends THREE.BufferGeometry>(g: T) => { geometries.push(g); return g }
  const stemInk = new THREE.MeshBasicMaterial({ color: '#293e3d' })
  materials.push(stemInk)
  const leafMat = new THREE.MeshToonMaterial({ color: '#657f70', side: THREE.DoubleSide })
  materials.push(leafMat)
  const veinMat = new THREE.LineBasicMaterial({ color: '#53665e', transparent: true, opacity: 0.34 })
  materials.push(veinMat)

  function makeLeaf() {
    const shape = new THREE.Shape()
    shape.moveTo(0, 0)
    shape.bezierCurveTo(-22, 18, -40, 58, 0, 110)
    shape.bezierCurveTo(36, 66, 32, 28, 0, 0)
    const geo = keep(new THREE.ShapeGeometry(shape, 14))
    const pos = geo.getAttribute('position')
    for (let i = 0; i < pos.count; i++) {
      pos.setZ(i, Math.sin(pos.getY(i) / 110 * Math.PI) * 14)
    }
    geo.computeVertexNormals()
    const g = new THREE.Group()
    g.add(new THREE.Mesh(geo, leafMat))
    const outlinePts = shape.getPoints(36).map(p => new THREE.Vector3(p.x, p.y, Math.sin(p.y / 110 * Math.PI) * 14 + 0.6))
    const lineGeo = keep(new THREE.BufferGeometry().setFromPoints(outlinePts))
    g.add(new THREE.Line(lineGeo, stemInk))
    return g
  }

  for (const side of [-1, 1]) for (let i = 0; i < 5; i++) {
    const mesh = makeLeaf()
    const angle = side * (0.28 + i * 0.19)
    foreground.add(mesh)
    foregroundLeaves.push({ mesh, side, index: i, angle })
  }

  foregroundDisposables = { geometries, materials }
}

let drag: { rig: WheatRig; id: number; startX: number; startY: number; moved: boolean; cell: string } | undefined

function resize() {
  width = window.innerWidth
  height = window.innerHeight
  camera.aspect = width / height
  camera.updateProjectionMatrix()
  renderer?.setSize(width, height)
}

function frame(now: number) {
  if (!active || !renderer) return
  const dt = Math.min((now - previous) / 1000 || 0.016, 0.05); previous = now
  if (document.hidden) { raf = requestAnimationFrame(frame); return }

  // 同步 plantedFlowers → rigs
  for (const f of sceneState.plantedFlowers) {
    if (!wheatRigs.some(r => r.source === f)) {
      // 屏幕坐标反查世界坐标
      const hit = groundPoint(f.x / width, f.y / height)
      if (!hit) continue
      const rig = createWheatRig(hit.point, sceneState.totalPlanted % 3, f)
      rigs.push(rig)
      scene.add(rig.group)
      occupiedCells.add(hit.cell)
    }
  }

  for (let i = wheatRigs.length - 1; i >= 0; i--) {
    const r = wheatRigs[i]!
    if (r.source && !sceneState.plantedFlowers.includes(r.source)) {
      scene.remove(r.group)
      r.fadingMaterials.forEach(e => e.material.dispose())
      const snap = snapToTerrace(r.root.x, r.root.z, world.terraces)
      if (snap) occupiedCells.delete(snap.key)
      wheatRigs.splice(i, 1)
      rigs.splice(i, 1)
      continue
    }
    updateWheatRig(r, dt, now / 1000, drag?.rig === r, reducedMotion.matches)
  }

  const mouse = reducedMotion.matches ? 0 : sceneState.mouseX / Math.max(width, 1) - 0.5
  camera.position.x += (mouse * 42 - camera.position.x) * (1 - Math.exp(-dt * 3))
  camera.lookAt(0, 120, -180)

  foregroundLeaves.forEach(({ mesh, side, index, angle }) => {
    const x = side * (480 + index * 48), z = 600 + index * 35
    mesh.position.set(x, terrainHeight(x, z), z)
    mesh.rotation.set(
      0.12, side * 0.3,
      angle + (reducedMotion.matches ? 0 : Math.sin(now / 2300 + index) * 0.025),
    )
    mesh.scale.set(2.4, 3.5 - index * 0.32, 1)
  })

  renderer.render(scene, camera)
  raf = requestAnimationFrame(frame)
}

// 麦穗 Rig 与花朵 Rig 并存（初始示例 + 用户种植）
const wheatRigs: WheatRig[] = []
const rigs: WheatRig[] = []  // 兼容旧变量名，实际与 wheatRigs 同步

function isControl(target: EventTarget | null) {
  return target instanceof Element
    && !!target.closest('button, a, input, textarea, select, [role="button"]')
}

function down(e: PointerEvent) {
  if (!active || !sceneState.threeFlowersReady || sceneState.phase !== 'interactive'
      || e.button !== 0 || drag || isControl(e.target)
      || !isInGroundZone(e.clientY, height)) return

  const hit = groundPoint(e.clientX / width, e.clientY / height)
  if (!hit) return

  occupiedCells.add(hit.cell)
  plantFlower(e.clientX, e.clientY)
  const source = sceneState.plantedFlowers[sceneState.plantedFlowers.length - 1]!

  const rig = createWheatRig(hit.point, sceneState.totalPlanted % 3, source)
  rig.target = 30
  wheatRigs.push(rig)
  rigs.push(rig)
  scene.add(rig.group)

  drag = {
    rig, id: e.pointerId,
    startX: e.clientX, startY: e.clientY,
    moved: false, cell: hit.cell,
  }
  e.preventDefault()
}

function move(e: PointerEvent) {
  if (!drag || drag.id !== e.pointerId) return
  const dy = drag.startY - e.clientY
  if (Math.hypot(e.clientX - drag.startX, dy) > 8) drag.moved = true
  const root = drag.rig.root
  if (root) {
    raycaster.setFromCamera(
      new THREE.Vector2(e.clientX / width * 2 - 1, 1 - e.clientY / height * 2),
      camera,
    )
    const dragPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -root.z)
    const tip = raycaster.ray.intersectPlane(dragPlane, new THREE.Vector3())
    if (tip) {
      drag.rig.target = Math.max(
        drag.rig.target,
        THREE.MathUtils.clamp((tip.y - root.y) / 1, 30, 330),
      )
      drag.rig.targetBend = THREE.MathUtils.clamp((tip.x - root.x) / 1, -90, 90)
    }
  }
  e.preventDefault()
}

function release(e?: PointerEvent) {
  if (!drag || (e && e.pointerId !== drag.id)) return
  if (!drag.moved) drag.rig.target = 190 + Math.random() * 70
  else drag.rig.age = Math.max(drag.rig.age, 1.77)
  drag = undefined
  emit('planted')
}

function start() {
  if (!renderer || active) return
  active = true; previous = 0; resize()
  raf = requestAnimationFrame(frame)
  window.addEventListener('pointerdown', down)
  window.addEventListener('pointermove', move, { passive: false })
  window.addEventListener('pointerup', release)
  window.addEventListener('pointercancel', release)
  window.addEventListener('blur', blur)
}
function blur() { release() }
function stop() {
  release(); active = false; cancelAnimationFrame(raf)
  window.removeEventListener('pointerdown', down)
  window.removeEventListener('pointermove', move)
  window.removeEventListener('pointerup', release)
  window.removeEventListener('pointercancel', release)
  window.removeEventListener('blur', blur)
}

onMounted(() => {
  try {
    renderer = new THREE.WebGLRenderer({
      canvas: canvas.value!, alpha: true, antialias: true,
    })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.05
    resize()

    buildForeground()

    // ---- 初始麦田：铺满第 1 层（青麦），点缀第 2、3 层（黄麦 / 金麦）----
    const first = world.terraces[0]!.spec
    for (let row = 0; row < first.rows; row++) {
      for (let col = 0; col < first.cols; col++) {
        if (Math.random() < 0.15) continue
        const cx = -first.halfWidth + (col + 0.5) * (first.halfWidth * 2 / first.cols)
        const cz = first.z0 - (row + 0.5) * ((first.z0 - first.z1) / first.rows)
        const rig = createWheatRig(new THREE.Vector3(cx, first.y, cz), 0)
        rig.age = 3.5; rig.grow = 1; rig.stemHeight = rig.target; rig.bloomAge = 4
        wheatRigs.push(rig); rigs.push(rig); scene.add(rig.group)
        occupiedCells.add(`0:${col}:${row}`)
      }
    }
    for (const idx of [1, 2]) {
      const t = world.terraces[idx]!.spec
      const count = idx === 1 ? 10 : 6
      for (let k = 0; k < count; k++) {
        const cx = (Math.random() - 0.5) * t.halfWidth * 1.6
        const cz = t.z1 + 24 + Math.random() * (t.z0 - t.z1 - 48)
        const rig = createWheatRig(new THREE.Vector3(cx, t.y, cz), idx)
        rig.age = 5; rig.grow = 1; rig.stemHeight = rig.target; rig.bloomAge = 5
        wheatRigs.push(rig); rigs.push(rig); scene.add(rig.group)
      }
    }

    sceneState.threeFlowersReady = true
    window.addEventListener('resize', resize)
    start()
  } catch (error) {
    webglError.value = true
    console.warn('WebGL terrace unavailable.', error)
  }
})

onActivated(start)
onDeactivated(stop)

onUnmounted(() => {
  stop()
  window.removeEventListener('resize', resize)
  sceneState.threeFlowersReady = false
  wheatRigs.forEach(r => r.fadingMaterials.forEach(e => e.material.dispose()))
  world.dispose()
  disposeWheatShared()
  foregroundDisposables?.geometries.forEach(g => g.dispose())
  foregroundDisposables?.materials.forEach(m => m.dispose())
  renderer?.dispose()
})
</script>

<style scoped>
.flower-garden { position: fixed; inset: 0; z-index: 4; pointer-events: none; }
.garden-error { position: fixed; top: 40%; left: 10%; width: 80%; z-index: 12; text-align: center; }
.garden-hint {
  position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
  z-index: 10; pointer-events: none; white-space: nowrap;
  color: #e9e5d4; background: #293e3dbd; padding: 6px 14px; border-radius: 20px;
  font-size: 11px; letter-spacing: 0.08em;
}
.garden-hint span { display: inline-block; margin-right: 8px; font-size: 18px; }
.garden-hint i { margin: 0 10px; font-style: normal; opacity: 0.5; }
@media (max-width: 640px) {
  .garden-hint { font-size: 10px; letter-spacing: 0; bottom: 13px; }
}
</style>