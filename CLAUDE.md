# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

async-renderer is a Vue 3 plugin library for asynchronously rendering components outside the main application context. Core features include automatic lifecycle management, DOM cleanup, and memory leak prevention.

## Common Development Commands

```bash
# Install dependencies
pnpm install

# Development build (watch for file changes)
pnpm run dev

# Build the library
pnpm run build

# Run playground
pnpm run playground

# Type checking
pnpm run typecheck

# Release version (auto bump version and publish)
pnpm run release
```

## Core Architecture

### Directory Structure

```
src/
├── index.ts           # Entry: exports plugin and composable
├── core.ts            # AsyncRenderer class: core rendering logic
├── use-async-renderer.ts  # useAsyncRenderer composable
├── types/index.d.ts   # TypeScript type definitions
└── constants.ts       # Injection key constants
```

### Core Modules

1. **AsyncRenderer Class (src/core.ts)**
   - Manages complete lifecycle of a single component instance
   - Creates independent Vue app instance and inherits parent application context
   - Uses IntersectionObserver and MutationObserver for automatic destruction
   - Provides `destroy()` method for manual resource cleanup

2. **useAsyncRenderer composable (src/use-async-renderer.ts)**
   - Manages all active renderer instances (stored in Map)
   - Provides `create()`, `getAllRenderer()`, `getRenderer()`, `destroy()` APIs
   - Depends on plugin-injected context and configuration

3. **Plugin Installation (src/index.ts)**
   - Provides `asyncRendererPlugin`, injects APP_CONTEXT and PLUGIN_CONFIG during installation
   - Must be installed via `app.use()` in the main application

### Key Design Patterns

**Context Inheritance Mechanism**:
- Newly created renderer app copies parent application's `_context` (config, provides, components)
- Maintains parent app reference unchanged, only copies necessary properties
- Ensures child components can access parent application's global configuration and dependency injection

**Automatic Destruction Mechanism**:
- `IntersectionObserver`: Monitors if element is within viewport, destroys when not visible
- `MutationObserver`: Listens for DOM changes, dynamically adds new observation targets
- Only enabled when `autoDestroy: true` (enabled by default)

**Unique Identifier**:
- Uses `nanoid` to generate 12-character instance ID
- Used for DOM element id attribute and instance tracking

## Build Configuration

- **Build Tool**: tsdown (based on Rollup)
- **Module Format**: ESM
- **Type Generation**: Automatically generates `.d.ts` files, supports Vue components
- **Entry File**: `src/index.ts` → `dist/index.js`
- **Code Minification**: Enabled

## Type System

- **AsyncRendererComponent**: Component | AsyncComponentLoader
- **AsyncRendererPlugin**: Vue plugin, accepts optional wrapper configuration
- **wrapper**: Optional wrapper function for custom rendering wrappers (e.g., transition animations)

## Dependencies

- **vue**: ^3.0.0 (peer dependency)
- **lodash-es**: Utility functions (merge, values, isFunction)
- **nanoid**: Unique ID generation

## Notes

1. `useAsyncRenderer()` must be used within a component tree where AsyncRendererPlugin is installed, otherwise it will throw an error
2. Components are rendered with a 5ms delay after creation (setTimeout) to ensure DOM is ready
3. Renderer instances are mounted to `document.body` by default, can customize mount point via `el` option
4. `onDestroy` callback is invoked during destruction, can be used to clean up side effects

## Development Testing

Use the `playground/` directory for local testing and demonstration, served via Vite development server.
