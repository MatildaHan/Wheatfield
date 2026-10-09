import { reactive } from 'vue'

/** Only the fields consumed by the game scene. */
export const sceneState = reactive({
  phase: 'interactive' as 'entry' | 'interactive',
  threeFlowersReady: false,
  mouseX: window.innerWidth / 2,
})
