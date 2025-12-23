<template>
  <div class="my-works-view">
    <div class="gradient-bg"></div>
    <div class="page-container">
      <div class="page-header">
        <div>
          <p class="eyebrow">MY WORKS</p>
          <h2>我的全部作品</h2>
          <p class="subtitle">查看和管理你通过 AI 生成的所有作品</p>
        </div>
        <a-button type="primary" @click="router.push('/')">返回首页</a-button>
      </div>

      <div class="filter-bar">
        <a-input
          v-model:value="keyword"
          allow-clear
          placeholder="输入作品名称搜索"
          @press-enter="handleSearch"
          style="width: 260px"
        />
        <a-button type="primary" ghost @click="handleSearch">搜索</a-button>
      </div>

      <a-spin :spinning="loading">
        <div class="works-grid">
          <AppCard
            v-for="app in appList"
            :key="app.id"
            :app="app"
            :user-name="app.userName"
            :user-avatar="app.userAvatar"
            show-actions
            @viewChat="handleViewChat"
            @viewDeploy="handleViewDeploy"
            @edit="handleEdit"
            @delete="handleDelete"
          />
        </div>
        <div v-if="!loading && appList.length === 0" class="empty-state">
          <a-empty description="还没有作品，去创建一个吧" />
        </div>
        <div class="pagination-bar" v-if="total > pageSize">
          <a-pagination
            :current="pageNum"
            :page-size="pageSize"
            :total="total"
            show-size-changer
            @change="handlePageChange"
            @showSizeChange="handlePageSizeChange"
          />
        </div>
      </a-spin>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import AppCard from '@/components/AppCard.vue'
import { pageMyApps, deleteMyApp } from '@/api/appController'
import { convertIdToString } from '@/utils/idConverter'
import type { AppVO } from '@/api/typings'

const router = useRouter()

const appList = ref<AppVO[]>([])
const loading = ref(false)
const pageNum = ref(1)
const pageSize = ref(12)
const total = ref(0)
const keyword = ref('')

const loadData = async () => {
  try {
    loading.value = true
    const resp = await pageMyApps({
      pageNum: pageNum.value,
      pageSize: pageSize.value,
      nameKeyword: keyword.value || undefined,
    })
    if (resp.data?.code === 0 && resp.data?.data) {
      appList.value = resp.data.data.records || []
      total.value = resp.data.data.totalRow || 0
    }
  } catch (err) {
    message.error('加载作品失败，请稍后再试')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pageNum.value = 1
  loadData()
}

const handlePageChange = (page: number) => {
  pageNum.value = page
  loadData()
}

const handlePageSizeChange = (_: number, size: number) => {
  pageSize.value = size
  pageNum.value = 1
  loadData()
}

const handleViewChat = (appId: number) => {
  router.push(`/app/chat/${appId}`)
}

const handleViewDeploy = (deployKey: string) => {
  if (deployKey) {
    window.open(`http://localhost/${deployKey}`, '_blank')
  } else {
    message.warning('暂无作品访问地址')
  }
}

const handleEdit = (appId: number) => {
  router.push(`/app/edit/${appId}`)
}

const handleDelete = async (appId: number) => {
  try {
    const resp = await deleteMyApp({ id: convertIdToString(appId) as any })
    if (resp.data?.code === 0) {
      message.success('删除成功')
      loadData()
    } else {
      message.error(resp.data?.message || '删除失败')
    }
  } catch (err) {
    message.error('删除失败，请稍后再试')
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.my-works-view {
  position: relative;
  min-height: 100vh;
  background: #f5f7fb;
}

.gradient-bg {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 20% 20%, #6ba6ff22, transparent 35%),
    radial-gradient(circle at 80% 10%, #8c8bff22, transparent 30%),
    radial-gradient(circle at 50% 80%, #53d3ff1a, transparent 32%),
    linear-gradient(180deg, #f8fbff 0%, #eef3ff 100%);
  z-index: 0;
}

.page-container {
  position: relative;
  z-index: 1;
  max-width: 1200px;
  margin: 0 auto;
  padding: 48px 24px 64px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.eyebrow {
  margin: 0;
  font-size: 12px;
  letter-spacing: 0.12em;
  color: #4b5563;
}

.page-header h2 {
  margin: 6px 0 4px;
  font-size: 28px;
  color: #111827;
}

.subtitle {
  margin: 0;
  color: #6b7280;
  font-size: 14px;
}

.filter-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.works-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 16px;
}

.empty-state {
  margin: 32px 0;
  text-align: center;
}

.pagination-bar {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>

