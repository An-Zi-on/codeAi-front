<template>
  <div class="home-view">
    <div class="home-header">
      <h1 class="site-title">An-Code 智能代码生成平台</h1>
      <p class="site-subtitle">通过 AI 对话快速生成网站应用</p>
    </div>

    <div class="prompt-section">
      <a-input-search
        v-model:value="promptText"
        placeholder="输入你的想法，例如：创建一个待办事项管理应用"
        size="large"
        enter-button="创建应用"
        :loading="creating"
        @search="handleCreateApp"
      />
    </div>

    <div class="apps-section">
      <a-tabs v-model:activeKey="activeTab" @change="handleTabChange">
        <a-tab-pane key="my" tab="我的应用">
          <div class="search-section">
            <a-input-search
              v-model:value="myAppsKeyword"
              placeholder="搜索应用名称"
              style="max-width: 300px"
              @search="loadMyApps"
            />
          </div>
          <div class="apps-container">
            <a-spin :spinning="myAppsLoading">
              <div v-if="myAppsList.length === 0 && !myAppsLoading" class="empty-state">
                <a-empty description="暂无应用，快去创建一个吧！" />
              </div>
              <div v-else class="apps-grid">
                <div
                  v-for="app in myAppsList"
                  :key="app.id"
                  class="app-card"
                >
                  <div class="app-cover" @click="handleViewApp(app.id!)">
                    <img
                      v-if="app.cover"
                      :src="app.cover"
                      :alt="app.appName"
                      @error="handleImageError"
                    />
                    <div v-else class="app-cover-placeholder">
                      <span>暂无封面</span>
                    </div>
                  </div>
                  <div class="app-info">
                    <h3 class="app-name" @click="handleViewApp(app.id!)">{{ app.appName || '未命名应用' }}</h3>
                    <p class="app-time">{{ formatTime(app.createTime) }}</p>
                    <div class="app-actions" @click.stop>
                      <a-button type="link" size="small" @click="handleEditApp(app.id!)">编辑</a-button>
                      <a-popconfirm
                        title="确定要删除这个应用吗？"
                        ok-text="确定"
                        cancel-text="取消"
                        @confirm="handleDeleteApp(app.id!)"
                      >
                        <a-button type="link" size="small" danger>删除</a-button>
                      </a-popconfirm>
                    </div>
                  </div>
                </div>
              </div>
            </a-spin>
            <div v-if="myAppsList.length > 0" class="pagination-wrapper">
              <a-pagination
                v-model:current="myAppsPageNum"
                v-model:page-size="myAppsPageSize"
                :total="myAppsTotal"
                :page-size-options="['10', '20']"
                show-size-changer
                show-total
                @change="loadMyApps"
                @show-size-change="loadMyApps"
              />
            </div>
          </div>
        </a-tab-pane>
        <a-tab-pane key="featured" tab="精选应用">
          <div class="search-section">
            <a-input-search
              v-model:value="featuredAppsKeyword"
              placeholder="搜索应用名称"
              style="max-width: 300px"
              @search="loadFeaturedApps"
            />
          </div>
          <div class="apps-container">
            <a-spin :spinning="featuredAppsLoading">
              <div v-if="featuredAppsList.length === 0 && !featuredAppsLoading" class="empty-state">
                <a-empty description="暂无精选应用" />
              </div>
              <div v-else class="apps-grid">
                <div
                  v-for="app in featuredAppsList"
                  :key="app.id"
                  class="app-card"
                  @click="handleViewApp(app.id!)"
                >
                  <div class="app-cover">
                    <img
                      v-if="app.cover"
                      :src="app.cover"
                      :alt="app.appName"
                      @error="handleImageError"
                    />
                    <div v-else class="app-cover-placeholder">
                      <span>暂无封面</span>
                    </div>
                  </div>
                  <div class="app-info">
                    <h3 class="app-name">{{ app.appName || '未命名应用' }}</h3>
                    <p class="app-time">{{ formatTime(app.createTime) }}</p>
                  </div>
                </div>
              </div>
            </a-spin>
            <div v-if="featuredAppsList.length > 0" class="pagination-wrapper">
              <a-pagination
                v-model:current="featuredAppsPageNum"
                v-model:page-size="featuredAppsPageSize"
                :total="featuredAppsTotal"
                :page-size-options="['10', '20']"
                show-size-changer
                show-total
                @change="loadFeaturedApps"
                @show-size-change="loadFeaturedApps"
              />
            </div>
          </div>
        </a-tab-pane>
      </a-tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { useRouter } from 'vue-router'
import { createApp, pageMyApps, pageFeaturedApps, deleteMyApp } from '../api/appController'
import { convertIdToString } from '@/utils/idConverter'
import type { AppVO } from '@/api/typings'

const router = useRouter()

// 提示词输入
const promptText = ref('')
const creating = ref(false)

// 我的应用
const myAppsList = ref<AppVO[]>([])
const myAppsLoading = ref(false)
const myAppsPageNum = ref(1)
const myAppsPageSize = ref(20)
const myAppsTotal = ref(0)
const myAppsKeyword = ref('')

// 精选应用
const featuredAppsList = ref<AppVO[]>([])
const featuredAppsLoading = ref(false)
const featuredAppsPageNum = ref(1)
const featuredAppsPageSize = ref(20)
const featuredAppsTotal = ref(0)
const featuredAppsKeyword = ref('')

// 当前标签页
const activeTab = ref('my')

// 创建应用
const handleCreateApp = async () => {
  if (!promptText.value.trim()) {
    message.warning('请输入应用描述')
    return
  }

  try {
    creating.value = true
    const response = await createApp({
      initPrompt: promptText.value.trim(),
      codeGenType: 'react',
    })

    if (response.data?.code === 0 && response.data?.data) {
      message.success('应用创建成功')
      const appId = response.data.data
      promptText.value = ''
      // 跳转到对话页面
      router.push(`/app/chat/${appId}`)
    } else {
      message.error(response.data?.message || '创建应用失败')
    }
  } catch (error) {
    message.error('创建应用失败，请稍后再试')
  } finally {
    creating.value = false
  }
}

// 加载我的应用
const loadMyApps = async () => {
  try {
    myAppsLoading.value = true
    const response = await pageMyApps({
      pageNum: myAppsPageNum.value,
      pageSize: myAppsPageSize.value,
      nameKeyword: myAppsKeyword.value || undefined,
    })

    if (response.data?.code === 0 && response.data?.data) {
      myAppsList.value = response.data.data.records || []
      myAppsTotal.value = response.data.data.totalRow || 0
    }
  } catch (error) {
    message.error('加载应用列表失败')
  } finally {
    myAppsLoading.value = false
  }
}

// 加载精选应用
const loadFeaturedApps = async () => {
  try {
    featuredAppsLoading.value = true
    const response = await pageFeaturedApps({
      pageNum: featuredAppsPageNum.value,
      pageSize: featuredAppsPageSize.value,
      nameKeyword: featuredAppsKeyword.value || undefined,
    })

    if (response.data?.code === 0 && response.data?.data) {
      featuredAppsList.value = response.data.data.records || []
      featuredAppsTotal.value = response.data.data.totalRow || 0
    }
  } catch (error) {
    message.error('加载精选应用失败')
  } finally {
    featuredAppsLoading.value = false
  }
}

// 标签页切换
const handleTabChange = (key: string) => {
  if (key === 'my') {
    loadMyApps()
  } else if (key === 'featured') {
    loadFeaturedApps()
  }
}

// 查看应用详情
const handleViewApp = (appId: string) => {
  router.push(`/app/chat/${appId}`)
}

// 编辑应用
const handleEditApp = (appId: string) => {
  router.push(`/app/edit/${appId}`)
}

// 删除应用
const handleDeleteApp = async (appId: string) => {
  try {
    const response = await deleteMyApp({ id: convertIdToString(appId) as any })
    if (response.data?.code === 0) {
      message.success('删除成功')
      loadMyApps()
    } else {
      message.error(response.data?.message || '删除失败')
    }
  } catch (error) {
    message.error('删除失败，请稍后再试')
  }
}

// 格式化时间
const formatTime = (time?: string) => {
  if (!time) return ''
  const date = new Date(time)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

// 图片加载错误处理
const handleImageError = (e: Event) => {
  const img = e.target as HTMLImageElement
  img.style.display = 'none'
}

onMounted(() => {
  loadMyApps()
})
</script>

<style scoped>
.home-view {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}

.home-header {
  text-align: center;
  margin-bottom: 40px;
}

.site-title {
  font-size: 32px;
  font-weight: 700;
  color: #1d4ed8;
  margin-bottom: 12px;
}

.site-subtitle {
  font-size: 16px;
  color: rgba(0, 0, 0, 0.65);
}

.prompt-section {
  margin-bottom: 40px;
}

.apps-section {
  background: #ffffff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.search-section {
  margin-bottom: 16px;
}

.apps-container {
  min-height: 400px;
}

.empty-state {
  padding: 60px 0;
}

.apps-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.app-card {
  background: #ffffff;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
}

.app-card:hover {
  border-color: #1890ff;
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.15);
  transform: translateY(-2px);
}

.app-cover {
  width: 100%;
  height: 160px;
  background: #f5f5f5;
  overflow: hidden;
  position: relative;
}

.app-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.app-cover-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(0, 0, 0, 0.45);
  font-size: 14px;
}

.app-info {
  padding: 16px;
}

.app-name {
  font-size: 16px;
  font-weight: 600;
  color: #262626;
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.app-time {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
  margin: 0 0 8px 0;
}

.app-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}

@media (max-width: 768px) {
  .home-view {
    padding: 16px;
  }

  .site-title {
    font-size: 24px;
  }

  .apps-grid {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 12px;
  }
}
</style>
