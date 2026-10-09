import { sceneState } from './useSceneState'

export function plantFlower(x: number, y: number) {
  // Keep rendering and GPU allocations bounded during long sessions.
  if (sceneState.plantedFlowers.length >= 35) sceneState.plantedFlowers.shift()
  sceneState.plantedFlowers.push({ x, y, opacity: 1 })
  sceneState.totalPlanted++
}
