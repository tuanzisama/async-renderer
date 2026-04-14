import type { App, AppContext, AsyncComponentLoader, Component } from 'vue'
import { createApp, createVNode, defineAsyncComponent } from 'vue'
import type { AsyncRendererProvide, AsyncRendererComponent, Data, AsyncRendererPluginConfig, AsyncRendererInternalConfig } from './types'
import { isFunction } from 'lodash-es'
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
   * Parent app instance reference
   */
  private app: App

  /**
   * Parent app context reference
   */
  private parentContext: AppContext

  /**
   * Plugin configuration settings
   */
  private pluginConfig: AsyncRendererPluginConfig

  /**
   * Unique instance identifier
   */
  private _id: string;

  /**
   * Intersection observer for auto-destroy functionality
   */
  private intersectionObserver?: IntersectionObserver;

  /**
   * Mutation observer for monitoring DOM changes
   */
  private mutationObserver?: MutationObserver

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

    this.app = options.appContext as App;
    this.parentContext = this.app._context;
    this.pluginConfig = options.pluginConfig
    this.options = Object.assign({ props: null, autoDestroy: true, }, options)
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
   * Merges parent app components into current app
   * @param app - The Vue app instance to configure
   * @private
   */
  private mergeParentComponents(app: App<Element>): void {
    const parentComponents = this.parentContext.components
    if (parentComponents) {
      Object.keys(parentComponents).forEach((name) => {
        app.component(name, parentComponents[name])
      })
    }
  }

  /**
   * Sets up app-level provides for context sharing
   * @param app - The Vue app instance to configure
   * @private
   */
  private inheritParentProvides(app: App<Element>): void {
    const parentProvides = this.parentContext.provides
    if (parentProvides) {
      // Merge parent provides into current app context
      Object.assign(app._context.provides, parentProvides)
    }
  }

  /**
   * Creates and configures the Vue app instance with parent context inheritance
   * @returns Configured Vue app instance
   * @private
   */
  private createAndConfigureApp(): App<Element> {
    const content = this.createWrapper(this.component, this.options.props)
    const app = createApp(content)

    // Inherit parent components (Vue.extend behavior)
    this.mergeParentComponents(app)

    // Inherit parent provides/provides for dependency injection
    this.inheritParentProvides(app)

    // Provide destroy method for internal component access
    app.provide<AsyncRendererProvide>('asyncRenderer', {
      destroy: this.destroy.bind(this),
    })

    return app
  }

  /**
   * Creates wrapper DOM element for component mounting
   * @returns DOM element with instance ID
   * @private
   */
  private createWrapperElement(): Element {
    const wrapperEl = this.options.el ?? document.createElement('div')
    wrapperEl.setAttribute('id', this.instanceId)
    return wrapperEl
  }

  /**
   * Renders component by creating Vue app and mounting to DOM
   */
  private render(): void {
    try {
      // Create wrapper element
      this.wrapperEl = this.createWrapperElement()

      // Create and configure Vue app with parent context inheritance
      this.instance = this.createAndConfigureApp()

      // Delay mounting to ensure DOM is ready (maintains original behavior)
      setTimeout(() => {
        this.instance!.mount(this.wrapperEl)
        // Check if element is already in DOM to prevent duplicate append
        if (!this.wrapperEl.parentNode) {
          document.body.appendChild(this.wrapperEl)
        }

        // Register observers for auto-destroy if enabled
        if (this.options.autoDestroy) {
          this.registerObserver()
        }
      }, 5)
    }
    catch (error) {
      console.error('[AsyncRenderer] Initialization failed:', error)
    }
  }

  /**
   * Registers DOM observers for automatic destruction
   * Sets up IntersectionObserver and MutationObserver
   */
  private registerObserver() {
    this.intersectionObserver = new IntersectionObserver((entries) => {
      const isHidden = !!(entries.find(entry => entry.intersectionRatio <= 0))
      if (isHidden) {
        this.destroy()
      }
    })

    this.mutationObserver = new MutationObserver((evt) => {
      const nodes = evt.reduce<Element[]>((acc, record) => {
        const addedNodes = [...Object.values(record.addedNodes)].filter(el => el.nodeType === 1) as Element[]
        return acc.concat(addedNodes)
      }, [])

      nodes.forEach((node) => {
        this.intersectionObserver?.observe(node)
      })
    })
    this.mutationObserver.observe(this.wrapperEl, { childList: true })
  }

  /**
   * Destroys renderer instance and cleans up resources
   */
  public destroy() {
    if (this.instance) {
      // Disconnect observers to prevent memory leaks
      if (this.intersectionObserver) {
        this.intersectionObserver.disconnect()
        this.intersectionObserver = undefined
      }
      if (this.mutationObserver) {
        this.mutationObserver.disconnect()
        this.mutationObserver = undefined
      }

      // Unmount Vue app instance
      this.instance.unmount()
      this.instance = null

      // Remove wrapper element from DOM
      const wrapperEl = document.getElementById(this.instanceId)
      if (wrapperEl) {
        document.body.removeChild(wrapperEl)
      }

      // Call destroy callback
      this.options?.onDestroy?.()
    }
  }
}
