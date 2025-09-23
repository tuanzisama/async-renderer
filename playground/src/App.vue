<template>
  <main>
    <h1>async-renderer</h1>
    <el-button type="primary" @click="createDialog" plain>Open Dialog</el-button>
  </main>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useAsyncRenderer } from '../../src'

const asyncRenderer = useAsyncRenderer();

onMounted(() => {
  console.info("asyncRenderer:", asyncRenderer);
})

function createDialog() {
  asyncRenderer.create(() => import('./standalone-dialog.vue'))
}
</script>
