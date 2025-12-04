<template>
  <a-layout class="basic-layout">
    <GlobalHeader />
    <a-layout-content class="layout-content">
      <RouterView />
    </a-layout-content>
    <GlobalFooter />
  </a-layout>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router'
import GlobalHeader from '@/components/GlobalHeader.vue'
import GlobalFooter from '@/components/GlobalFooter.vue'
</script>

<style scoped>
:global(:root) {
  --layout-header-height: 64px;
  --layout-footer-height: 72px;
  --layout-surface: #f6f8fb;
}

.basic-layout {
  min-height: 100vh;
  background: radial-gradient(circle at 20% 0%, rgba(120, 147, 255, 0.15), transparent 55%),
    radial-gradient(circle at 80% 10%, rgba(120, 147, 255, 0.08), transparent 45%),
    var(--layout-surface);
}

.layout-content {
  flex: 1;
  height: calc(100vh - var(--layout-header-height) - var(--layout-footer-height));
  padding: clamp(10px, 1.8vw, 20px);
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border-radius: 20px;
  margin: clamp(8px, 1.5vw, 16px);
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.06);
  overflow: hidden;
}

.layout-content :deep(> *) {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
</style>

