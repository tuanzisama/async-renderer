import { createApp, createVNode } from 'vue'
import App from './App.vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import './style.css'
import asyncRendererPlugin from '../../src'

import type { VNode } from 'vue'
import { ElConfigProvider } from 'element-plus'

function createAsyncRendererWrapper(defaultSlot: VNode) {
  return createVNode(
    ElConfigProvider,
    {
      // locale: this.elementPlusConfig.locale.value,
      // namespace: this.elementPlusConfig.namespace,
    },
    { default: () => defaultSlot },
  )
}

const app = createApp(App)

app.use(ElementPlus)
app.use(asyncRendererPlugin, {
  wrapper: createAsyncRendererWrapper
})
app.mount('#app')
