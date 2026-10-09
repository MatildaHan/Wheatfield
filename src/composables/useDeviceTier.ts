import { ref, onMounted } from 'vue'

export type Tier = 'low' | 'mid' | 'high'

export interface DeviceInfo {
  gpu: string
  memory: number
  cores: number
  isMobile: boolean
}

export interface QualityConfig {
  grass: number
  fernScale: number
  shadowMap: number
  pixelRatio: number
  shadows: boolean
  antialias: boolean
}

export const deviceTier = ref<Tier>('mid')
export const deviceInfo = ref<DeviceInfo>({
  gpu: '', memory: 4, cores: 4, isMobile: false,
})

export function useDeviceTier() {
  onMounted(() => {
    const cores = navigator.hardwareConcurrency ?? 4
    const memory = (navigator as any).deviceMemory ?? 4
    let gpu = ''
    try {
      const canvas = document.createElement('canvas')
      const gl = (canvas.getContext('webgl2') ?? canvas.getContext('webgl')) as WebGLRenderingContext | null
      if (gl) {
        const ext = gl.getExtension('WEBGL_debug_renderer_info')
        gpu = ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : ''
      }
    } catch { /* ignore */ }

    const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
      || window.matchMedia('(hover: none)').matches

    deviceInfo.value = { gpu, memory, cores, isMobile }

    const isLowGpu = /Mali-4|Mali-T[0-6]|Adreno [2-4]|PowerVR SGX|Intel HD 3/i.test(gpu)
    const isHighGpu = /Apple M|RTX|Radeon RX|GeForce (1[6-9]|2[0-9]|3[0-9]|4[0-9])/i.test(gpu)

    if (isLowGpu || (isMobile && memory <= 2) || cores <= 2) {
      deviceTier.value = 'low'
    } else if (isMobile || memory <= 4 || cores <= 4) {
      deviceTier.value = 'mid'
    } else if (isHighGpu && cores >= 8 && memory >= 8) {
      deviceTier.value = 'high'
    } else {
      deviceTier.value = 'mid'
    }

    if (import.meta.env.DEV) {
      console.info('[device]', deviceInfo.value, '→ tier:', deviceTier.value)
    }
  })
}

/** 按档位返回渲染配置 */
export function qualityConfig(): QualityConfig {
  switch (deviceTier.value) {
    case 'low':
      return { grass: 600, fernScale: 0.3, shadowMap: 512, pixelRatio: 1, shadows: false, antialias: false }
    case 'mid':
      return { grass: 1600, fernScale: 0.6, shadowMap: 1024, pixelRatio: 1.5, shadows: true, antialias: true }
    case 'high':
    default:
      return { grass: 3200, fernScale: 1, shadowMap: 2048, pixelRatio: 2, shadows: true, antialias: true }
  }
}
