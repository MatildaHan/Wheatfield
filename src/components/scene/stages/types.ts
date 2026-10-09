import type * as THREE from 'three'

export interface Stage {
  group: THREE.Group
  /** 每帧调用 */
  update(dt: number, time: number, reduced: boolean): void
  /** 重置（回到未生长状态） */
  reset(): void
  /** 释放资源 */
  dispose(): void
}