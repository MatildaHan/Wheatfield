import { createApp } from 'vue'
import App from './App.vue'

const app = createApp(App)

/** 全局错误边界：捕获组件内未处理的异常 */
app.config.errorHandler = (err, _instance, info) => {
  console.error('[global error]', err, info)
  window.dispatchEvent(new CustomEvent('app-error', {
    detail: { message: String(err), info, ts: Date.now() },
  }))
}

/** 未捕获的 Promise 错误 */
window.addEventListener('unhandledrejection', e => {
  console.error('[unhandled rejection]', e.reason)
  window.dispatchEvent(new CustomEvent('app-error', {
    detail: { message: String(e.reason), info: 'unhandledrejection', ts: Date.now() },
  }))
})

/** 未捕获的同步错误 */
window.addEventListener('error', e => {
  console.error('[uncaught error]', e.message, e.filename, e.lineno)
  window.dispatchEvent(new CustomEvent('app-error', {
    detail: { message: e.message, info: `${e.filename}:${e.lineno}`, ts: Date.now() },
  }))
})

app.mount('#app')
