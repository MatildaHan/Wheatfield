<template>
  <canvas ref="canvas" class="game-scene" aria-hidden="true" />
  <p v-if="webglError" class="garden-error" role="alert">
    无法启动 WebGL。请启用浏览器硬件加速，或换用支持 WebGL 的浏览器。
  </p>
  <p v-if="contextLost" class="garden-error" role="alert">
    图形上下文丢失，正在恢复…
  </p>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, onActivated, onDeactivated, watch } from 'vue'
import * as THREE from 'three'
import { sceneState } from '@/composables/useSceneState'
import { gameState, advanceStage } from '@/composables/useGameStage'
import { track } from '@/composables/useAnalytics'
import { qualityConfig } from '@/composables/useDeviceTier'
import { createGardenWorld } from './gardenWorld'
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
const contextLost = ref(false)

const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(46, 1, 5, 5000)
camera.position.set(0, 680, 1250)
camera.lookAt(0, 120, -180)

const world = createGardenWorld(scene)

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

// FPS 监控 / 动态降级
let fpsSamples: number[] = []
let degraded = false

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

  grass.update(dt, now / 1000, reducedMotion.matches)
  sky.update(dt, now / 1000, reducedMotion.matches)
  hills.update(dt, now / 1000, reducedMotion.matches)
  path.update(dt, now / 1000, reducedMotion.matches)
  trees.update(dt, now / 1000, reducedMotion.matches)
  houses.update(dt, now / 1000, reducedMotion.matches)
  river.update(dt, now / 1000, reducedMotion.matches)
  wheat.update(dt, now / 1000, reducedMotion.matches)

  const mouse = reducedMotion.matches ? 0 : sceneState.mouseX / Math.max(width, 1) - 0.5
  camera.position.x += (mouse * 42 - camera.position.x) * (1 - Math.exp(-dt * 3))
  camera.lookAt(0, 120, -180)

  // FPS 监控：每 60 帧检查一次
  if (!reducedMotion.matches) {
    fpsSamples.push(dt)
    if (fpsSamples.length >= 60) {
      const avg = fpsSamples.reduce((a, b) => a + b, 0) / fpsSamples.length
      const fps = 1 / avg
      fpsSamples = []
      if (!degraded && fps < 25) {
        degraded = true
        console.warn('[perf] low fps, degrading to safe mode:', fps.toFixed(1))
        renderer.setPixelRatio(1)
        if (renderer.shadowMap.enabled) renderer.shadowMap.enabled = false
        track('perf_degrade', { fps: Number(fps.toFixed(1)) })
      }
    }
  }

  renderer.render(scene, camera)
  raf = requestAnimationFrame(frame)
}

function isControl(target: EventTarget | null) {
  return target instanceof Element
    && !!target.closest('button, a, input, textarea, select, [role="button"]')
}

function down(e: PointerEvent) {
  if (!active || isControl(e.target)) return
  if (e.pointerType === 'mouse' && e.button !== 0) return
  if (e.pointerType !== 'mouse' && e.isPrimary === false) return

  const nx = e.clientX / width
  const ny = e.clientY / height

  switch (gameState.stage) {
    case 'blank':  grass.begin(nx, ny, e.clientX, e.clientY); break
    case 'grass':  grass.drag(nx, ny); break
    case 'sky':    sky.begin(nx, ny); break
    case 'hills':  hills.begin(nx, ny); break
    case 'path':   path.begin(nx, ny); break
    case 'trees':  if (trees.place(nx, ny)) { track('plant', { type: 'tree' }); advanceStage() } break
    case 'houses': if (houses.place(nx, ny)) { track('plant', { type: 'house' }); advanceStage() } break
    case 'river':  river.begin(nx, ny); break
    case 'wheat':
    case 'free':   if (wheat.place(nx, ny)) { track('plant', { type: 'wheat' }) } break
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

function up(_e: PointerEvent) {
  if (!active) return
  if (gameState.stage === 'grass') { if (grass.end()) advanceStage() }
  else if (gameState.stage === 'sky') { if (sky.end()) advanceStage() }
  else if (gameState.stage === 'hills') { if (hills.end()) advanceStage() }
  else if (gameState.stage === 'path') { if (path.end()) advanceStage() }
  else if (gameState.stage === 'river') { if (river.end()) advanceStage() }
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

// 重置
watch(() => gameState.resetToken, () => {
  Object.values(stages).forEach(s => s.reset())
})

let contextLostHandler: ((e: Event) => void) | undefined
let contextRestoredHandler: (() => void) | undefined

onMounted(() => {
  const el = canvas.value
  if (!el) return
  try {
    const q = qualityConfig()
    renderer = new THREE.WebGLRenderer({
      canvas: el,
      alpha: true,
      antialias: q.antialias,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: false,
    })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, q.pixelRatio))
    renderer.setClearColor(0x000000, 0)
    renderer.shadowMap.enabled = q.shadows
    renderer.shadowMap.type = THREE.PCFShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.05
    resize()

    // WebGL context lost / restored
    contextLostHandler = (e: Event) => {
      e.preventDefault()
      contextLost.value = true
      active = false
      cancelAnimationFrame(raf)
      console.warn('[webgl] context lost')
      track('webgl_context_lost')
    }
    contextRestoredHandler = () => {
      console.info('[webgl] context restored')
      contextLost.value = false
      track('webgl_context_restored')
      // 重新启动
      previous = 0
      start()
    }
    el.addEventListener('webglcontextlost', contextLostHandler)
    el.addEventListener('webglcontextrestored', contextRestoredHandler)

    sceneState.threeFlowersReady = true
    window.addEventListener('resize', resize)
    start()
  } catch (error) {
    webglError.value = true
    console.warn('WebGL game scene unavailable.', error)
    track('webgl_init_failed', { message: String(error) })
  }
})

onActivated(start)
onDeactivated(stop)

onUnmounted(() => {
  stop()
  window.removeEventListener('resize', resize)
  const el = canvas.value
  if (el) {
    if (contextLostHandler) el.removeEventListener('webglcontextlost', contextLostHandler)
    if (contextRestoredHandler) el.removeEventListener('webglcontextrestored', contextRestoredHandler)
  }
  sceneState.threeFlowersReady = false
  Object.values(stages).forEach(s => s.dispose())
  world.dispose()
  renderer?.dispose()
})
</script>

<style scoped>
.game-scene { position: fixed; inset: 0; z-index: 4; pointer-events: none; }
.garden-error {
  position: fixed; top: 40%; left: 10%; width: 80%;
  z-index: 12; text-align: center;
  color: #52695d; font-size: 14px;
}
</style>
