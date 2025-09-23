# Async Renderer

Vue plugin for rendering components asynchronously outside main app context with automatic lifecycle management and DOM cleanup.

## Features

- Render Vue components asynchronously
- Automatic lifecycle management
- DOM cleanup and memory leak prevention
- Context inheritance from parent app
- Custom wrapper support

## Installation

```bash
pnpm install async-renderer
```

## Usage

### Setup Plugin

```js
import { createApp } from "vue";
import asyncRendererPlugin from "async-renderer";

const app = createApp(App);
app.use(asyncRendererPlugin);
```

### Use in Components

```vue
<script setup>
import { useAsyncRenderer } from "async-renderer";

const asyncRenderer = useAsyncRenderer();

function openDialog() {
  asyncRenderer.create(() => import("./Dialog.vue"));
}
</script>
```

## API

### `useAsyncRenderer()`

Returns an object with:

- `create(component, props?, options?)` - Create new renderer instance
- `getAllRenderer()` - Get all active renderers
- `getRenderer(id)` - Get specific renderer by ID

## Development

```bash
# Install dependencies
npm install

# Run playground
npm run playground

# Build library
npm run build
```

## License

MIT
