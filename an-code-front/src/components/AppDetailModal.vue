<template>
  <a-modal
    v-model:open="visible"
    title="应用详情"
    :footer="null"
    width="500px"
    :mask-closable="true"
  >
    <div class="app-detail-content">
      <div class="detail-section">
        <h4 class="section-title">应用基础信息</h4>
        <div class="info-item">
          <span class="info-label">创建者：</span>
          <div class="creator-info">
            <a-avatar :size="32" :src="userAvatar">
              <template #icon>
                <UserOutlined />
              </template>
            </a-avatar>
            <span class="creator-name">{{ userName || '未知用户' }}</span>
          </div>
        </div>
        <div class="info-item">
          <span class="info-label">创建时间：</span>
          <span class="info-value">{{ formatTime(appInfo?.createTime) }}</span>
        </div>
        <div v-if="appInfo?.appName" class="info-item">
          <span class="info-label">应用名称：</span>
          <span class="info-value">{{ appInfo.appName }}</span>
        </div>
      </div>

      <div v-if="canEdit" class="detail-section">
        <h4 class="section-title">操作栏</h4>
        <div class="action-buttons">
          <a-button type="primary" @click="handleEdit">修改</a-button>
          <a-popconfirm
            title="确定要删除这个应用吗？"
            ok-text="确定"
            cancel-text="取消"
            @confirm="handleDelete"
          >
            <a-button danger>删除</a-button>
          </a-popconfirm>
        </div>
      </div>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { UserOutlined } from '@ant-design/icons-vue'
import { useRouter } from 'vue-router'
import { useCounterStore } from '@/stores/counter'
import type { AppVO } from '@/api/typings'

interface Props {
  open: boolean
  appInfo: AppVO | null
  userName?: string
  userAvatar?: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  edit: [appId: number]
  delete: [appId: number]
}>()

const router = useRouter()
const userStore = useCounterStore()

const visible = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value),
})

const canEdit = computed(() => {
  if (!props.appInfo?.userId || !userStore.loginUser) return false
  return (
    userStore.loginUser.id === props.appInfo.userId || userStore.loginUser.userRole === 'admin'
  )
})

const formatTime = (time?: string) => {
  if (!time) return '未知'
  const date = new Date(time)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const handleEdit = () => {
  if (props.appInfo?.id) {
    emit('edit', props.appInfo.id)
    router.push(`/app/edit/${props.appInfo.id}`)
    visible.value = false
  }
}

const handleDelete = () => {
  if (props.appInfo?.id) {
    emit('delete', props.appInfo.id)
    visible.value = false
  }
}
</script>

<style scoped>
.app-detail-content {
  padding: 8px 0;
}

.detail-section {
  margin-bottom: 24px;
}

.detail-section:last-child {
  margin-bottom: 0;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #262626;
  margin: 0 0 16px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.info-item {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  gap: 8px;
}

.info-item:last-child {
  margin-bottom: 0;
}

.info-label {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.65);
  min-width: 80px;
}

.info-value {
  font-size: 14px;
  color: #262626;
}

.creator-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.creator-name {
  font-size: 14px;
  color: #262626;
}

.action-buttons {
  display: flex;
  gap: 12px;
}
</style>

