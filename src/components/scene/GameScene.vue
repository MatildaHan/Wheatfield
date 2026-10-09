<template>
  <canvas ref="canvas" class="game-scene" aria-hidden="true" />
  <p v-if="webglError" class="garden-error" role="alert">
    无法启动 WebGL。请启用浏览器硬件加速，或换用支持 WebGL 的浏览器。
  </p>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, onActivated, onDeactivated, watch } from 'vue'
import * as THREE from 'three'
import { sceneState, isInGroundZone } from '@/composables/useSceneState'
import { gameState, advanceStage } from '@/composables/useGameStage'
import { createGardenWorld, terrainHeight } from './gardenWorld'
import { GrassStage } from './stages/grassStage'
import { SkyStage } from './stages/skyStage'
import { HillsStage } from './stages/hillsStage'
import { PathStage } from './stages/pathStage'
import { TreeStage } from './stages/treeStage'
import { HouseStage } from './stages/houseStage'
import { RiverStage } from './stages/riverStage'
import { WheatStage } from './stages/wheatStage'

const canvas = ref<HTMLCanvasElement | null>(null)
const webglError = ref(false)

const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(46, 1, 5, 5000)
camera.position.set(0, 680, 1250)
camera.lookAt(0, 120, -180)

const world = createGardenWorld(scene)

// 各阶段
const grass = new GrassStage(scene, world)
const sky = new SkyStage(scene, world)
const hills = new HillsStage(scene, world)
const path = new PathStage(scene, world)
const trees = new TreeStage(scene, world)
const houses = new HouseStage(scene, world)
const river = new RiverStage(scene, world)
const wheat = new WheatStage(scene, world)

const stages = { grass, sky, hills, path, trees, houses, river, wheat }

let renderer: THREE.WebGLRenderer | undefined
let raf = 0
let previous = 0
let active = false
let width = 1
let height = 1
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')

// 阶段 → 是否允许该阶段接收指针
function stageAcceptsPointer(): boolean {
  return ['grass', 'sky', 'hills', 'path', 'trees', 'houses', 'river', 'wheat', 'free'].includes(gameState.stage)
}

function resize() {
  width = window.innerWidth
  height = window.innerHeight
  camera.aspect = width / height
  camera.updateProjectionMatrix()
  renderer?.setSize(width, height)
}

function frame(now: number) {
  if (!active || !renderer) return
  const dt = Math.min((now - previous) / 1000 || 0.016, 0.05)
  previous = now
  if (document.hidden) { raf = requestAnimationFrame(frame); return }

  // 更新各阶段
  grass.update(dt, now / 1000, reducedMotion.matches)
  sky.update(dt, now / 1000, reducedMotion.matches)
  hills.update(dt, now / 1000, reducedMotion.matches)
  path.update(dt, now / 1000, reducedMotion.matches)
  trees.update(dt, now / 1000, reducedMotion.matches)
  houses.update(dt, now / 1000, reducedMotion.matches)
  river.update(dt, now / 1000, reducedMotion.matches)
  wheat.update(dt, now / 1000, reducedMotion.matches)

  // 相机视差
  const mouse = reducedMotion.matches ? 0 : sceneState.mouseX / Math.max(width, 1) - 0.5
  camera.position.x += (mouse * 42 - camera.position.x) * (1 - Math.exp(-dt * 3))
  camera.lookAt(0, 120, -180)

  renderer.render(scene, camera)
  raf = requestAnimationFrame(frame)
}

function isControl(target: EventTarget | null) {
  return target instanceof Element
    && !!target.closest('button, a, input, textarea, select, [role="button"]')
}

function down(e: PointerEvent) {
  if (!active || e.button !== 0 || isControl(e.target)) return
  if (!stageAcceptsPointer()) return
  const nx = e.clientX / width
  const ny = e.clientY / height

  switch (gameState.stage) {
    case 'blank':  grass.begin(nx, ny, e.clientX, e.clientY); break
    case 'grass':  grass.drag(nx, ny); break
    case 'sky':    sky.begin(nx, ny); break
    case 'hills':  hills.begin(nx, ny); break
    case 'path':   path.begin(nx, ny); break
    case 'trees':  if (trees.place(nx, ny)) advanceStage(); break
    case 'houses': if (houses.place(nx, ny)) advanceStage(); break
    case 'river':  river.begin(nx, ny); break
    case 'wheat':
    case 'free':   if (wheat.place(nx, ny)) { /* 可多次 */ } break
  }
  e.preventDefault()
}

function move(e: PointerEvent) {
  if (!active) return
  const nx = e.clientX / width
  const ny = e.clientY / height
  if (gameState.stage === 'grass') grass.drag(nx, ny)
  else if (gameState.stage === 'sky') sky.drag(nx, ny)
  else if (gameState.stage === 'hills') hills.drag(nx, ny)
  else if (gameState.stage === 'path') path.drag(nx, ny)
  else if (gameState.stage === 'river') river.drag(nx, ny)
}

function up(e: PointerEvent) {
  if (!active) return
  if (gameState.stage === 'grass') { if (grass.end()) advanceStage() }
  else if (gameState.stage === 'sky') { if (sky.end()) advanceStage() }
  else if (gameState.stage === 'hills') { if (hills.end()) advanceStage() }
  else if (gameState.stage === 'path') { if (path.end()) advanceStage() }
  else if (gameState.stage === 'river') { if (river.end()) advanceStage() }
  void e
}

function start() {
  if (!renderer || active) return
  active = true
  previous = 0
  resize()
  raf = requestAnimationFrame(frame)
  window.addEventListener('pointerdown', down)
  window.addEventListener('pointermove', move, { passive: false })
  window.addEventListener('pointerup', up)
  window.addEventListener('pointercancel', up)
}
function stop() {
  active = false
  cancelAnimationFrame(raf)
  window.removeEventListener('pointerdown', down)
  window.removeEventListener('pointermove', move)
  window.removeEventListener('pointerup', up)
  window.removeEventListener('pointercancel', up)
}

// 重置：清空所有阶段
watch(() => gameState.resetToken, () => {
  Object.values(stages).forEach(s => s.reset())
})

onMounted(() => {
  try {
    renderer = new THREE.WebGLRenderer({ canvas: canvas.value!, alpha: true, antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.05
    resize()
    sceneState.threeFlowersReady = true
    window.addEventListener('resize', resize)
    start()
  } catch (error) {
    webglError.value = true
    console.warn('WebGL game scene unavailable.', error)
  }
})

onActivated(start)
onDeactivated(stop)
onUnmounted(() => {
  stop()
  window.removeEventListener('resize', resize)
  sceneState.threeFlowersReady = false
  Object.values(stages).forEach(s => s.dispose())
  world.dispose()
  renderer?.dispose()
})
</script>

<style scoped>
.game-scene { position: fixed; inset: 0; z-index: 4; pointer-events: none; }
.garden-error { position: fixed; top: 40%; left: 10%; width: 80%; z-index: 12; text-align: center; }
</style>
