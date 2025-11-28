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
        <a-button type="primary" @click="handleLogin" v-if="!isLoggedIn">
          登录
        </a-button>
        <a-avatar v-else size="large" :src="userAvatarSrc">
          <template #icon>
            <UserOutlined />
          </template>
        </a-avatar>
      </div>
    </div>
  </a-layout-header>
</template>

<script setup lang="ts">
import { UserOutlined } from '@ant-design/icons-vue'
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import type { MenuProps } from 'ant-design-vue'
import { storeToRefs } from 'pinia'
import { onMounted } from 'vue'
import { useCounterStore } from '../stores/counter.ts'

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

const userStore = useCounterStore()
const { loginUser } = storeToRefs(userStore)

const fallbackAvatar = new URL('../assets/logo.jpg', import.meta.url).href

const isLoggedIn = computed(() => loginUser.value !== null)

const userAvatarSrc = computed(() => {
  return loginUser.value?.userAvatar || fallbackAvatar
})

onMounted(() => {
  if (!loginUser.value) {
    userStore.updateCurrentUser().catch(() => {
      // ignore error, fallback to null state
    })
  }
})

// 登录按钮点击事件
const handleLogin = () => {
  router.push('/user/login')
}
</script>

<style scoped>
.global-header {
  background: linear-gradient(180deg, rgba(249, 251, 255, 0.95), rgba(255, 255, 255, 0.9));
  backdrop-filter: blur(14px);
  border-bottom: 1px solid rgba(114, 131, 191, 0.12);
  box-shadow: 0 6px 20px rgba(15, 23, 42, 0.05);
  padding: 0;
  position: relative;
  z-index: 10;
  transition: background 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
  min-height: var(--layout-header-height, 64px);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 0 clamp(16px, 3vw, 32px);
  height: var(--layout-header-height, 64px);
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
  border-radius: 8px;
  flex-shrink: 0;
  background: linear-gradient(130deg, rgba(25, 91, 255, 0.18), rgba(132, 94, 247, 0.15));
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
  color: #1d4ed8;
  white-space: nowrap;
  margin-right: 8px;
  flex-shrink: 0;
}

.header-menu {
  border-bottom: none;
  line-height: var(--layout-header-height, 64px);
  flex-shrink: 0;
  background: transparent;
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

