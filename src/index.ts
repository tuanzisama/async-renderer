import { type App } from 'vue'
import type { AsyncRendererPluginConfig } from './types'
import { useAsyncRenderer } from './use-async-renderer';
import { PLUGIN_CONFIG, APP_CONTEXT } from './constants';

const asyncRendererPlugin = {
  install: (app: App, config?: AsyncRendererPluginConfig) => {
    app.provide(PLUGIN_CONFIG, config)
    app.provide(APP_CONTEXT, app)
  },
}

export default asyncRendererPlugin

export { useAsyncRenderer }