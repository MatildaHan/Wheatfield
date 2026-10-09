<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import FlowerGardenThree from './components/scene/FlowerGardenThree.vue'
import LayerSky from './components/scene/LayerSky.vue'
import { sceneState } from './composables/useSceneState'

function pointerMove(e: PointerEvent) { sceneState.mouseX = e.clientX }
function clearFlowers() { sceneState.plantedFlowers.splice(0) }
onMounted(() => window.addEventListener('pointermove', pointerMove))
onUnmounted(() => window.removeEventListener('pointermove', pointerMove))
</script>

<template>
  <main class="garden">
    <LayerSky sky-only transform="" opacity="1" />
    <FlowerGardenThree />
    <header class="intro">
      <h1>手绘梯田</h1>
      <p>Three.js · 麦穗生长 · 三层梯田 · 手绘渲染</p>
    </header>
    <button class="clear" @click="clearFlowers">清除新种的麦子</button>
  </main>
</template>

<style>
* { box-sizing: border-box; }
html, body, #app { margin: 0; width: 100%; height: 100%; overflow: hidden; }
body { font-family: Georgia, 'Times New Roman', serif; color: #344e46; }
.garden { position: fixed; inset: 0; touch-action: none; background: linear-gradient(#eee8da, #f6f0e3 38%, #d6e5cb); }
.intro { position: absolute; top: 5%; left: 50%; transform: translateX(-50%); z-index: 6; text-align: center; pointer-events: none; width: 90%; }
.intro h1 { margin: 0 0 10px; font-size: clamp(24px, 4vw, 40px); font-weight: normal; letter-spacing: 0.2em; }
.intro p { font-size: 12px; letter-spacing: 0.1em; }
.clear { position: absolute; right: 16px; bottom: 55px; z-index: 11; padding: 8px 12px; border: 1px solid #52695d; color: #344e46; background: #f5f0e6db; cursor: pointer; font: inherit; font-size: 12px; }
.clear:focus-visible { outline: 2px solid #344e46; outline-offset: 3px; }
</style>