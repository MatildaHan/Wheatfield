import { reactive, computed } from 'vue'

export type Stage =
  | 'blank'
  | 'grass'
  | 'sky'
  | 'hills'
  | 'path'
  | 'trees'
  | 'houses'
  | 'river'
  | 'wheat'
  | 'free'

export interface StageMeta {
  key: Stage
  icon: string
  label: string
  hint: string
}

export const STAGE_ORDER: Stage[] = [
  'grass', 'sky', 'hills', 'path', 'trees', 'houses', 'river', 'wheat',
]

export const STAGE_META: Record<Stage, StageMeta> = {
  blank:  { key: 'blank',  icon: '·',  label: '空白',  hint: '按下鼠标，长出草地' },
  grass:  { key: 'grass',  icon: '🌱', label: '草地',  hint: '向上拖动，让草地蔓延' },
  sky:    { key: 'sky',    icon: '☁️', label: '天空',  hint: '松开鼠标，让天空展开' },
  hills:  { key: 'hills',  icon: '⛰️', label: '远山',  hint: '向上拖动，让远山升起' },
  path:   { key: 'path',   icon: '〰️', label: '小路',  hint: '左右拖动，踩出一条小路' },
  trees:  { key: 'trees',  icon: '🌳', label: '种树',  hint: '点击空地，种下一棵树' },
  houses: { key: 'houses', icon: '🏠', label: '房子',  hint: '点击路边，盖一座房子' },
  river:  { key: 'river',  icon: '🌊', label: '河流',  hint: '在远处画一条河' },
  wheat:  { key: 'wheat',  icon: '🌾', label: '麦田',  hint: '点击空地，开一片麦田' },
  free:   { key: 'free',   icon: '✨', label: '自由',  hint: '世界长成了 · 点击继续种' },
}

export const gameState = reactive({
  stage: 'blank' as Stage,
  completed: [] as Stage[],
  resetToken: 0,
})

export const progress = computed(() =>
  STAGE_ORDER.filter(s => gameState.completed.includes(s)).length
)

export function currentMeta() {
  return STAGE_META[gameState.stage]
}

/** 完成当前阶段，进入下一个 */
export function advanceStage() {
  if (gameState.stage === 'blank') {
    gameState.stage = 'grass'
    return
  }
  if (!gameState.completed.includes(gameState.stage)) {
    gameState.completed.push(gameState.stage)
  }
  const idx = STAGE_ORDER.indexOf(gameState.stage)
  if (idx === -1 || idx === STAGE_ORDER.length - 1) {
    gameState.stage = 'free'
    return
  }
  gameState.stage = STAGE_ORDER[idx + 1]
}

/** 进入指定阶段（用于跳过 / 调试） */
export function gotoStage(stage: Stage) {
  gameState.stage = stage
}

/** 重置整个游戏 */
export function resetGame() {
  gameState.stage = 'blank'
  gameState.completed = []
  gameState.resetToken++
}
