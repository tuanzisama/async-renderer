import type { App, AppContext, AsyncComponentLoader, Component } from 'vue'
import { createApp, createVNode, defineAsyncComponent } from 'vue'
import type { AsyncRendererProvide, AsyncRendererComponent, Data, AsyncRendererPluginConfig, AsyncRendererInternalConfig } from './types'
import { isFunction, merge, values } from 'lodash-es'
import { customAlphabet } from 'nanoid'

const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 10)

/**
 * AsyncRenderer class for rendering Vue components asynchronously
 * with automatic lifecycle management and DOM cleanup
 */
export class AsyncRenderer {
  /**
   * Vue component to be rendered
   */
  private component: Component

  /**
   * Internal configuration options
   */
  private options: AsyncRendererInternalConfig

  /**
   * Vue app instance for this renderer
   */
  private instance: App<Element> | null = null

  /**
   * DOM wrapper element
   */
  private wrapperEl!: Element

  /**
   * Parent app context reference
   */
  private appContext: App & AppContext

  /**
   * Plugin configuration settings
   */
  private pluginConfig: AsyncRendererPluginConfig

  /**
   * Unique instance identifier
   */
  private _id: string;

  /**
   * Creates new AsyncRenderer instance
   * @param component - Vue component to render
   * @param options - Configuration options
   */
  constructor(component: AsyncRendererComponent, options: AsyncRendererInternalConfig) {
    if (typeof component === 'function') {
      this.component = defineAsyncComponent(component as AsyncComponentLoader)
    } else {
      this.component = component
    }

    this.appContext = options.appContext;
    this.pluginConfig = options.pluginConfig
    this.options = merge({ props: null, autoDestroy: true, }, options)
    this._id = nanoid(12)

    this.render();
  }

  /**
   * Gets unique instance ID
   */
  public get instanceId() {
    return this._id
  }

  /**
   * Creates wrapper around component
   * @param component - Vue component
   * @param props - Component props
   */
  private createWrapper(component: Component, props?: Data | null) {
    const content = createVNode(component, props)
    if (isFunction(this.pluginConfig.wrapper)) {
      return this.pluginConfig.wrapper(content)
    }
    return content;
  }

  /**
   * Renders component by creating Vue app and mounting to DOM
   */
  private render() {
    try {
      const content = this.createWrapper(this.component, this.options.props)

      this.wrapperEl = this.options.el ?? document.createElement('div')
      this.wrapperEl.setAttribute('id', this.instanceId)

      this.instance = createApp(content)

      const context = this.appContext._context

      this.instance._context.config = context.config
      this.instance._context.provides = context.provides
      this.instance._context.components = context.components

      const originApp = this.instance._context.app
      this.instance._context.app = context.app

      // restore the original app context properties
      this.instance._context.app._component = originApp._component
      this.instance._context.app._container = originApp._container
      this.instance._context.app._context = originApp._context
      this.instance._context.app._instance = originApp._instance
      this.instance._context.app._uid = originApp._uid
      this.instance._context.app._props = originApp._props

      this.instance.provide<AsyncRendererProvide>('asyncRenderer', {
        destroy: this.destroy.bind(this),
      })

      setTimeout(() => {
        this.instance!.mount(this.wrapperEl)
        document.body.appendChild(this.wrapperEl)

        if (this.options.autoDestroy) {
          this.registerObserver()
        }
      }, 5)
    }
    catch (error) {
      console.error(new Error('Async renderer initialization failed.'))
      console.error(error)
    }
  }

  /**
   * Registers DOM observers for automatic destruction
   * Sets up IntersectionObserver and MutationObserver
   */
  private registerObserver() {
    const intersectionObserver = new IntersectionObserver((entries) => {
      const isHidden = !!(entries.find(entry => entry.intersectionRatio <= 0))
      if (isHidden) {
        this.destroy()
      }
    })

    const mutationObserver = new MutationObserver((evt) => {
      const nodes = evt.reduce<Element[]>((acc, record) => {
        const addedNodes = [...values(record.addedNodes)].filter(el => el.nodeType === 1) as Element[]
        return acc.concat(addedNodes)
      }, [])

      nodes.forEach((node) => {
        intersectionObserver.observe(node)
      })
    })
    mutationObserver.observe(this.wrapperEl, { childList: true })
  }

  /**
   * Destroys renderer instance and cleans up resources
   */
  public destroy() {
    if (this.instance) {
      this.instance?.unmount()
      const wrapperEl = document.getElementById(this.instanceId)
      if (wrapperEl) {
        document.body.removeChild(wrapperEl)
      }
      this.options?.onDestroy?.()
    }
  }
}
