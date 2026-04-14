import { hasInjectionContext, inject, type App } from "vue";
import type { AsyncRendererComponent, Data, AsyncRendererOptions, AsyncRendererPluginConfig } from "./types"
import { APP_CONTEXT, PLUGIN_CONFIG } from "./constants";
import { AsyncRenderer } from "./core";
import { merge } from "lodash-es";

/**
 * Vue composable for async renderer functionality
 * Must be used within a component where AsyncRendererPlugin is installed
 */
function useAsyncRenderer() {
  if (!hasInjectionContext()) {
    throw new Error('AsyncRendererPlugin is not installed.')
  }

  /**
   * Injected app context for inheritance
   */
  const appContext = inject<App>(APP_CONTEXT)

  /**
   * Injected plugin configuration
   */
  const pluginConfig = inject<AsyncRendererPluginConfig>(PLUGIN_CONFIG)

  /**
   * Map to store active renderer instances
   * Key: instance ID, Value: AsyncRenderer
   */
  const map = new Map<string, AsyncRenderer>()

  /**
   * Creates a new async renderer instance
   * @param component - Vue component to render
   * @param props - Component props
   * @param options - Renderer options
   */
  function create(component: AsyncRendererComponent, props?: Data | null, options?: AsyncRendererOptions) {
    if (!appContext) {
      throw new Error('AsyncRendererPlugin is not installed correctly: app context is missing.')
    }
    const arInstance = new AsyncRenderer(component, merge({ props: props || {}, pluginConfig: pluginConfig || {}, appContext }, options))
    map.set(arInstance.instanceId, arInstance)
    return arInstance
  }

  /**
   * Gets all active renderer instances
   * @returns Map of all renderers
   */
  function getAllRenderer() {
    return map
  }

  /**
   * Gets a specific renderer by ID
   * @param renderId - Renderer instance ID
   * @returns AsyncRenderer instance or undefined
   */
  function getRenderer(renderId: string) {
    return map.get(renderId)
  }

  /**
   * Destroys a renderer instance and removes it from the map
   * Cleans up resources and removes from tracking
   * @param renderId - ID of renderer to destroy
   */
  function destroy(renderId: string) {
    const renderer = map.get(renderId)
    if (renderer) {
      renderer.destroy()
      map.delete(renderId)
    }
  }

  return { create, getAllRenderer, getRenderer, destroy }
}

export { useAsyncRenderer }