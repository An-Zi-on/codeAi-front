<template>
  <a-layout-header class="global-header">
    <div class="header-content">
      <div class="header-left">
        <div class="logo-wrapper">
          <img src="../assets/logo.jpg" alt="Logo" class="logo" />
        </div>
        <span class="site-title">An-Code</span>
        <a-menu
          v-model:selectedKeys="selectedKeys"
          mode="horizontal"
          :items="menuItems"
          class="header-menu"
          @click="handleMenuClick"
        />
      </div>
      <div class="header-right">
        <a-button type="primary" @click="handleLogin">
          登录
        </a-button>
      </div>
    </div>
  </a-layout-header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import type { MenuProps } from 'ant-design-vue'

const router = useRouter()
const route = useRoute()

// 从路由配置中动态获取菜单项
const menuItems = computed<MenuProps['items']>(() => {
  return router.getRoutes()
    .filter((route) => route.meta?.showInMenu)
    .map((route) => ({
      key: route.path,
      label: (route.meta?.title as string) || route.name || route.path,
    }))
})

// 当前选中的菜单项
const selectedKeys = computed(() => {
  return [route.path]
})

// 菜单点击事件
const handleMenuClick: MenuProps['onClick'] = (e) => {
  router.push(e.key as string)
}

// 登录按钮点击事件
const handleLogin = () => {
  // TODO: 实现登录逻辑
  console.log('点击登录')
}
</script>

<style scoped>
.global-header {
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 0;
  position: sticky;
  top: 0;
  z-index: 1000;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 0 24px;
  height: 64px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
}

.logo-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 40px;
  width: 40px;
  overflow: hidden;
  border-radius: 4px;
  flex-shrink: 0;
}

.logo {
  height: 100%;
  width: 100%;
  object-fit: contain;
  display: block;

}

.site-title {
  font-size: 20px;
  font-weight: 600;
  color: #1890ff;
  white-space: nowrap;
  margin-right: 8px;
  flex-shrink: 0;
}

.header-menu {
  border-bottom: none;
  line-height: 64px;
  flex-shrink: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
  margin-left: auto;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .header-content {
    padding: 0 16px;
  }

  .header-left {
    gap: 12px;
  }

  .logo-wrapper {
    height: 32px;
    width: 32px;
  }

  .site-title {
    font-size: 16px;
    margin-right: 4px;
  }

  .header-menu {
    display: none;
  }
}
</style>

