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
        <div class="login-wrapper" v-if="!isLoggedIn">
          <a-button type="primary" @click="handleLogin">登录</a-button>
        </div>
        <div class="logout-wrapper" v-else>
          <a-popover
            placement="bottomRight"
            trigger="hover"
            :overlay-style="{ padding: '0', minWidth: '240px' }"
            overlay-class-name="user-popover"
          >
            <template #content>
              <div class="user-info-card">
                <div class="user-info-header">
                  <a-avatar size="large" :src="userAvatarSrc" class="popover-avatar">
                    <template #icon>
                      <UserOutlined />
                    </template>
                  </a-avatar>
                  <div class="user-info-text">
                    <div class="user-name">{{ loginUser?.userName || '未设置昵称' }}</div>
                    <div class="user-account">{{ loginUser?.userAccount || '未知账号' }}</div>
                  </div>
                </div>
                <div class="user-info-actions">
                  个人中心
                </div>
                <div class="user-info-actions">
                  <a-button danger block @click="handleLogout" class="logout-btn">
                    退出登录
                  </a-button>
                </div>
                <div class="user-info-extra">
                  <!-- 扩展空间，可用于后续添加更多功能 -->
                </div>
              </div>
            </template>
            <template #default>
              <a-avatar size="large" :src="userAvatarSrc" class="user-avatar">
              <template #icon>
                <UserOutlined />
              </template>
            </a-avatar>
            </template>
          </a-popover>
        </div>
      </div>
    </div>
  </a-layout-header>
</template>

<script setup lang="ts">
import { UserOutlined } from '@ant-design/icons-vue'
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { type MenuProps, message } from 'ant-design-vue'
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
      // 静默处理错误，避免未登录时显示错误提示
      })
  }
})

// 登录按钮点击事件
const handleLogin = () => {
  router.push('/user/login')
}

// 注销登录
const handleLogout = async () => {
  try {
    await userStore.logOut()
    message.success('已退出登录')
    router.push('/user/login')
  } catch (error) {
    message.error('退出登录失败，请重试')
  }
}
</script>

<style scoped>
.global-header {
  background: linear-gradient(180deg, rgba(249, 251, 255, 0.95), rgba(255, 255, 255, 0.9));
  backdrop-filter: blur(14px);
  border-bottom: 1px solid rgba(114, 131, 191, 0.12);
  box-shadow: 0 6px 20px rgba(15, 23, 42, 0.05);
  padding: 0;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  width: 100%;
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

.logout-wrapper {
  display: flex;
  align-items: center;
  position: relative;
  cursor: pointer;
}

.user-avatar {
  cursor: pointer;
  transition: transform 0.2s ease;
}

.user-avatar:hover {
  transform: scale(1.05);
}

/* 用户信息气泡框样式 */
:deep(.user-popover) {
  .ant-popover-inner {
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(15, 23, 42, 0.12);
    overflow: hidden;
  }

  .ant-popover-inner-content {
    padding: 0;
  }
}

.user-info-card {
  background: #ffffff;
  min-width: 240px;
}

.user-info-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: linear-gradient(135deg, rgba(249, 251, 255, 0.8) 0%, rgba(255, 255, 255, 1) 100%);
}

.popover-avatar {
  flex-shrink: 0;
  border: 2px solid rgba(24, 144, 255, 0.2);
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.15);
}

.user-info-text {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-size: 16px;
  font-weight: 600;
  color: #1d4ed8;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-account {
  font-size: 13px;
  color: rgba(0, 0, 0, 0.65);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-info-divider {
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(114, 131, 191, 0.12) 20%,
    rgba(114, 131, 191, 0.12) 80%,
    transparent 100%
  );
  margin: 0;
}

.user-info-actions {
  padding: 12px 16px;
}

.logout-btn {
  height: 36px;
  border-radius: 6px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.logout-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(255, 77, 79, 0.3);
}

.user-info-extra {
  padding: 8px 16px 12px;
  min-height: 20px;
  /* 扩展空间，可用于后续添加更多功能按钮或信息 */
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

