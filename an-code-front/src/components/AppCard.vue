<template>
  <div class="app-card">
    <div class="app-cover" @click="handleViewApp">
      <img v-if="app.cover" :src="app.cover" :alt="app.appName" @error="handleImageError" />
      <div v-else class="app-cover-placeholder">
        <span>暂无封面</span>
      </div>
    </div>
    <div class="app-info">
      <div class="app-info-left">
        <a-avatar :size="40" :src="userAvatar">
          <template #icon>
            <UserOutlined />
          </template>
        </a-avatar>
      </div>
      <div class="app-info-right">
        <h3 class="app-name" @click="handleViewApp">{{ app.appName || '未命名应用' }}</h3>
        <p class="app-user-name">{{ userName || '未知用户' }}</p>
      </div>
    </div>
    <div v-if="showActions" class="app-actions" @click.stop>
      <a-button type="link" size="small" @click="handleViewChat">查看对话</a-button>
      <a-button v-if="app.deployKey" type="link" size="small" @click="handleViewDeploy">查看作品</a-button>
      <a-button type="link" size="small" @click="handleEdit">编辑</a-button>
      <a-popconfirm
        title="确定要删除这个应用吗？"
        ok-text="确定"
        cancel-text="取消"
        @confirm="handleDelete"
      >
        <a-button type="link" size="small" danger>删除</a-button>
      </a-popconfirm>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { UserOutlined } from '@ant-design/icons-vue'
import { useRouter } from 'vue-router'
import type { AppVO } from '@/api/typings'

interface Props {
  app: AppVO
  userName?: string
  userAvatar?: string
  showActions?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showActions: false,
})

const emit = defineEmits<{
  view: [appId: number]
  viewChat: [appId: number]
  viewDeploy: [deployKey: string]
  edit: [appId: number]
  delete: [appId: number]
}>()

const router = useRouter()

const handleViewApp = () => {
  if (props.app.id) {
    emit('view', props.app.id)
  }
}

const handleViewChat = () => {
  if (props.app.id) {
    emit('viewChat', props.app.id)
    router.push(`/app/chat/${props.app.id}`)
  }
}

const handleViewDeploy = () => {
  if (props.app.deployKey) {
    emit('viewDeploy', props.app.deployKey)
    window.open(`http://localhost/${props.app.deployKey}`, '_blank')
  }
}

const handleEdit = () => {
  if (props.app.id) {
    emit('edit', props.app.id)
    router.push(`/app/edit/${props.app.id}`)
  }
}

const handleDelete = () => {
  if (props.app.id) {
    emit('delete', props.app.id)
  }
}

const handleImageError = (e: Event) => {
  const img = e.target as HTMLImageElement
  img.style.display = 'none'
}
</script>

<style scoped>
.app-card {
  background: #ffffff;
  border: 1px solid #f0f0f0;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  width: 100%;
  height: 280px;
  max-height: 280px;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
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
  flex-shrink: 0;
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
  padding: 12px 16px;
  display: flex;
  gap: 12px;
  align-items: flex-start;
  flex-shrink: 0;
  min-height: 72px;
}

.app-info-left {
  flex-shrink: 0;
}

.app-info-right {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.app-name {
  font-size: 16px;
  font-weight: 600;
  color: #262626;
  margin: 0 0 4px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
  line-height: 1.4;
}

.app-name:hover {
  color: #1890ff;
}

.app-user-name {
  font-size: 13px;
  color: rgba(0, 0, 0, 0.65);
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.4;
}

.app-actions {
  display: flex;
  gap: 8px;
  padding: 0 16px 12px 16px;
  flex-wrap: wrap;
  flex-shrink: 0;
  margin-top: auto;
}
</style>

