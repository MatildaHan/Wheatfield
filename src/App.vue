<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import GameScene from './components/scene/GameScene.vue'
import LayerSky from './components/scene/LayerSky.vue'
import { sceneState } from './composables/useSceneState'
import {
  gameState, currentMeta,
  STAGE_ORDER, STAGE_META, resetGame,
} from './composables/useGameStage'
import { useAnalytics, track } from './composables/useAnalytics'
import { useDeviceTier } from './composables/useDeviceTier'

useAnalytics()
useDeviceTier()

const isTouch = window.matchMedia('(hover: none)').matches

function pointerMove(e: PointerEvent) { sceneState.mouseX = e.clientX }

let lastTouch = 0
function onTouchEnd(e: TouchEvent) {
  const now = Date.now()
  if (now - lastTouch <= 300) e.preventDefault()
  lastTouch = now
}
function onGestureStart(e: Event) { e.preventDefault() }

onMounted(() => {
  window.addEventListener('pointermove', pointerMove)
  document.addEventListener('touchend', onTouchEnd, { passive: false })
  document.addEventListener('gesturestart', onGestureStart)
})
onUnmounted(() => {
  window.removeEventListener('pointermove', pointerMove)
  document.removeEventListener('touchend', onTouchEnd)
  document.removeEventListener('gesturestart', onGestureStart)
})

const hint = computed(() => {
  const meta = currentMeta()
  if (gameState.stage === 'blank') {
    return isTouch ? '轻触屏幕，长出草地' : '按下鼠标，长出草地'
  }
  return meta.hint
})

const dots = computed(() =>
  STAGE_ORDER.map(key => ({
    key,
    ...STAGE_META[key],
    done: gameState.completed.includes(key),
    active: gameState.stage === key,
  }))
)

function onReset() {
  track('reset')
  resetGame()
}
</script>

<template>
  <main class="garden">
    <LayerSky sky-only transform="" opacity="1" />
    <GameScene />

    <h1 class="title">自由生长</h1>

    <aside class="progress" role="progressbar" :aria-valuenow="gameState.completed.length" aria-valuemin="0" aria-valuemax="8" aria-label="生长进度">
      <div
        v-for="dot in dots"
        :key="dot.key"
        class="progress-dot"
        :class="{ done: dot.done, active: dot.active }"
        :title="dot.label"
      >
        <span aria-hidden="true">{{ dot.icon }}</span>
      </div>
    </aside>

    <p class="hint" role="status" aria-live="polite">{{ hint }}</p>

    <button class="reset" type="button" @click="onReset">重新开始</button>
  </main>
</template>

<style>
* { box-sizing: border-box; }
html, body, #app {
  margin: 0;
  width: 100%;
  height: 100%;
  height: 100dvh;
  overflow: hidden;
}
body {
  font-family: Georgia, 'Times New Roman', serif;
  color: #344e46;
  background: #f7f4ee;
  -webkit-tap-highlight-color: transparent;
  overscroll-behavior: none;
}
.garden {
  position: fixed;
  inset: 0;
  touch-action: none;
  background: #f7f4ee;
  transition: background 1.6s ease;
}

.title {
  position: fixed;
  top: max(5%, env(safe-area-inset-top));
  left: 50%;
  transform: translateX(-50%);
  margin: 0;
  z-index: 6;
  font-size: clamp(28px, 5vw, 52px);
  font-weight: normal;
  letter-spacing: 0.4em;
  color: #3a3228;
  opacity: 0.85;
  pointer-events: none;
  text-indent: 0.4em;
}

.progress {
  position: fixed;
  right: max(22px, env(safe-area-inset-right));
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 6;
  pointer-events: none;
}
.progress-dot {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid #52695d55;
  display: grid;
  place-items: center;
  font-size: 16px;
  background: #f5f0e6aa;
  opacity: 0.28;
  transition: opacity 0.6s ease, box-shadow 0.6s ease, transform 0.6s ease;
}
.progress-dot.done {
  opacity: 1;
  background: #f5f0e6;
  box-shadow: 0 0 12px #52695d44;
}
.progress-dot.active {
  opacity: 1;
  transform: scale(1.15);
  border-color: #52695d;
  box-shadow: 0 0 16px #52695d66;
}
.progress-dot span { line-height: 1; }

.hint {
  position: fixed;
  bottom: max(7%, env(safe-area-inset-bottom));
  left: 50%;
  transform: translateX(-50%);
  margin: 0;
  z-index: 6;
  font-size: 13px;
  letter-spacing: 0.15em;
  color: #52695d;
  opacity: 0.7;
  pointer-events: none;
  transition: opacity 0.6s ease;
  white-space: nowrap;
}

.reset {
  position: fixed;
  right: max(18px, env(safe-area-inset-right));
  bottom: max(18px, env(safe-area-inset-bottom));
  z-index: 11;
  padding: 7px 14px;
  border: 1px solid #52695d55;
  border-radius: 16px;
  color: #344e46;
  background: #f5f0e6cc;
  cursor: pointer;
  font: inherit;
  font-size: 12px;
  letter-spacing: 0.08em;
  transition: background 0.3s ease, border-color 0.3s ease;
}
.reset:hover { background: #f5f0e6; border-color: #52695d; }
.reset:focus-visible { outline: 2px solid #344e46; outline-offset: 3px; }

@media (max-width: 640px) {
  .hint { font-size: 11px; letter-spacing: 0.05em; bottom: max(5%, env(safe-area-inset-bottom)); }
  .progress-dot { width: 30px; height: 30px; font-size: 13px; }
  .reset { font-size: 11px; padding: 6px 10px; }
}
</style>
