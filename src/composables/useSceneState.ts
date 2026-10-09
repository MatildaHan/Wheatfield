import { reactive } from 'vue'

/** Only the fields consumed by the standalone Three.js scene. */
export interface FlowerData { x: number; y: number; opacity: number }
export const sceneState = reactive({
  phase: 'interactive',
  threeFlowersReady: false,
  mouseX: window.innerWidth / 2,
  totalPlanted: 0,
  plantedFlowers: [] as FlowerData[],
})

export function isInGroundZone(y: number, height: number) {
  return y > height * 0.55 && y < height - 60
}
