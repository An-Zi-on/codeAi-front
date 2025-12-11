<template>
  <a-layout :class="['basic-layout', { 'chat-view-layout': isChatView }]">
    <GlobalHeader />
    <a-layout-content :class="['layout-content', { 'chat-view-mode': isChatView }]">
      <RouterView />
    </a-layout-content>
    <GlobalFooter />
  </a-layout>
</template>

<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router'
import { computed, watch, onMounted, onUnmounted } from 'vue'
import GlobalHeader from '@/components/GlobalHeader.vue'
import GlobalFooter from '@/components/GlobalFooter.vue'

const route = useRoute()
const isChatView = computed(() => route.name === 'app-chat')

// 根据路由动态添加 body 类名
watch(
  () => isChatView.value,
  (isChat) => {
    if (isChat) {
      document.body.classList.add('chat-view-page')
    } else {
      document.body.classList.remove('chat-view-page')
    }
  },
  { immediate: true }
)

onMounted(() => {
  if (isChatView.value) {
    document.body.classList.add('chat-view-page')
  }
})

onUnmounted(() => {
  document.body.classList.remove('chat-view-page')
})
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

/* ChatView 布局：固定高度，禁止滚动 */
.basic-layout.chat-view-layout {
  height: 100vh;
  overflow: hidden;
}

.layout-content {
  flex: 1;
  padding: clamp(10px, 1.8vw, 20px);
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border-radius: 20px;
  margin: clamp(8px, 1.5vw, 16px);
  margin-top: calc(clamp(8px, 1.5vw, 16px) + var(--layout-header-height));
  margin-bottom: calc(clamp(8px, 1.5vw, 16px) + var(--layout-footer-height));
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.06);
  position: relative;
  /* 首页允许内容超出，可以滚动 */
  overflow: visible;
  min-height: calc(100vh - var(--layout-header-height) - var(--layout-footer-height) - 2 * clamp(8px, 1.5vw, 16px));
}

/* ChatView 模式：移除所有 padding 和 margin，铺满可用空间，禁止滚动 */
.layout-content.chat-view-mode {
  padding: 0;
  margin: 0;
  margin-top: var(--layout-header-height);
  margin-bottom: var(--layout-footer-height);
  height: calc(100vh - var(--layout-header-height) - var(--layout-footer-height));
  border-radius: 0;
  box-shadow: none;
  background: transparent;
  overflow: hidden;
  min-height: 0;
}

.layout-content :deep(> *) {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

/* ChatView 全屏模式：铺满 layout-content */
.layout-content :deep(.chat-view) {
  margin: 0;
  padding: 0;
  border-radius: 0;
  box-shadow: none;
}
</style>

