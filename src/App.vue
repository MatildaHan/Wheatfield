<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import GameScene from './components/scene/GameScene.vue'
import LayerSky from './components/scene/LayerSky.vue'
import { sceneState } from './composables/useSceneState'
import {
  gameState, progress, currentMeta,
  STAGE_ORDER, STAGE_META, resetGame,
} from './composables/useGameStage'

function pointerMove(e: PointerEvent) { sceneState.mouseX = e.clientX }
onMounted(() => window.addEventListener('pointermove', pointerMove))
onUnmounted(() => window.removeEventListener('pointermove', pointerMove))

const hint = computed(() => currentMeta().hint)
const dots = computed(() =>
  STAGE_ORDER.map(key => ({
    key,
    ...STAGE_META[key],
    done: gameState.completed.includes(key),
    active: gameState.stage === key,
  }))
)
</script>

<template>
  <main class="garden">
    <!-- 天空 / 远山背景层，初始隐藏，由 GameScene 控制显示 -->
    <LayerSky sky-only transform="" opacity="1" />

    <GameScene />

    <h1 class="title">自由生长</h1>

    <aside class="progress" aria-label="进度">
      <div
        v-for="dot in dots"
        :key="dot.key"
        class="progress-dot"
        :class="{ done: dot.done, active: dot.active }"
        :title="dot.label"
      >
        <span>{{ dot.icon }}</span>
      </div>
    </aside>

    <p class="hint">{{ hint }}</p>

    <button class="reset" @click="resetGame">重新开始</button>
  </main>
</template>

<style>
* { box-sizing: border-box; }
html, body, #app { margin: 0; width: 100%; height: 100%; overflow: hidden; }
body {
  font-family: Georgia, 'Times New Roman', serif;
  color: #344e46;
  background: #f7f4ee;
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
  top: 5%;
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
  right: 22px;
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
  bottom: 7%;
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
  right: 18px;
  bottom: 18px;
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
  .hint { font-size: 11px; letter-spacing: 0.05em; bottom: 5%; }
  .progress-dot { width: 30px; height: 30px; font-size: 13px; }
  .reset { font-size: 11px; padding: 6px 10px; }
}
</style>
