<script setup lang="ts">
import BasicLayout from '@/layouts/BasicLayout.vue'
</script>

<template>
  <BasicLayout />
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body {
  width: 100%;
}

/* ChatView 页面时禁止滚动 */
body.chat-view-page {
  height: 100%;
  overflow: hidden;
}

/* 非 ChatView 页面允许滚动 */
body:not(.chat-view-page) {
  min-height: 100vh;
  overflow-x: hidden;
  overflow-y: auto;
}

#app {
  width: 100%;
}

/* ChatView 页面时固定高度 */
body.chat-view-page #app {
  height: 100%;
  overflow: hidden;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial,
    'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol',
    'Noto Color Emoji';
}
</style>
