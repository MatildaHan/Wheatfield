import { onMounted, onUnmounted } from 'vue'

interface AnalyticsEvent {
  name: string
  ts: number
  props?: Record<string, unknown>
}

const buffer: AnalyticsEvent[] = []
const FLUSH_INTERVAL = 10_000
const ENDPOINT = (import.meta as any).env?.VITE_ANALYTICS_ENDPOINT as string | undefined
const IS_DEV = Boolean((import.meta as any).env?.DEV)

let flushTimer: number | undefined
let visibilityBound = false

function flush() {
  if (!buffer.length) return
  const batch = buffer.splice(0, buffer.length)
  if (ENDPOINT) {
    const body = JSON.stringify(batch)
    if (navigator.sendBeacon) {
      navigator.sendBeacon(ENDPOINT, body)
    } else {
      fetch(ENDPOINT, {
        method: 'POST',
        body,
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
      }).catch(() => { /* 静默失败，不阻塞主流程 */ })
    }
  } else if (IS_DEV) {
    console.debug('[analytics]', batch)
  }
}

export function track(name: string, props?: Record<string, unknown>) {
  buffer.push({ name, ts: Date.now(), props })
  if (buffer.length >= 20) flush()
}

export function useAnalytics() {
  onMounted(() => {
    if (!flushTimer) {
      flushTimer = window.setInterval(flush, FLUSH_INTERVAL)
    }
    if (!visibilityBound) {
      visibilityBound = true
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) flush()
      })
      window.addEventListener('pagehide', flush)
      window.addEventListener('app-error', e => {
        const detail = (e as CustomEvent).detail
        track('app_error', detail)
      })
    }
    track('session_start', {
      ua: navigator.userAgent,
      w: window.innerWidth,
      h: window.innerHeight,
      dpr: window.devicePixelRatio,
    })
  })

  onUnmounted(() => {
    if (flushTimer) {
      clearInterval(flushTimer)
      flushTimer = undefined
    }
    flush()
  })
}
