import type { AppContext, AsyncComponentLoader, Component, VNode } from 'vue'

export type Data = Record<string, unknown>
export type AsyncRendererComponent = Component | AsyncComponentLoader

export interface AsyncRendererPluginConfig {
  wrapper?: (defaultSlot: VNode) => Component | VNode
}

export interface AsyncRendererOptions {
  el?: Element
  /**
   * 自动销毁实例
   * @default true
   */
  autoDestroy?: boolean
  onDestroy?: () => void | Promise<void>
}

export interface AsyncRendererInternalConfig extends AsyncRendererOptions {
  props: Data | null,
  pluginConfig: AsyncRendererPluginConfig
  appContext: App | AppContext
}

export interface AsyncRendererProvide {
  /**
   * 销毁当前实例
   */
  destroy: () => void
}