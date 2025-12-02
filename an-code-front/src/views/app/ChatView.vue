<template>
  <div class="chat-view">
    <div class="chat-header">
      <div class="header-left">
        <h2 class="app-title">{{ appInfo?.appName || '应用对话' }}</h2>
      </div>
      <div class="header-right">
        <a-button
          type="primary"
          :loading="deploying"
          :disabled="!canDeploy"
          @click="handleDeploy"
        >
          部署应用
        </a-button>
      </div>
    </div>

    <div class="chat-content">
      <div class="chat-panel">
        <div class="messages-container" ref="messagesContainerRef">
          <div v-if="messages.length === 0" class="empty-messages">
            <a-empty description="开始对话吧" />
          </div>
          <div
            v-for="(message, index) in messages"
            :key="index"
            :class="['message-item', message.role === 'user' ? 'message-user' : 'message-ai']"
          >
            <div class="message-avatar">
              <a-avatar v-if="message.role === 'user'" :size="32">
                <template #icon>
                  <UserOutlined />
                </template>
              </a-avatar>
              <a-avatar v-else :size="32" style="background-color: #1890ff">
                <template #icon>
                  <RobotOutlined />
                </template>
              </a-avatar>
            </div>
            <div class="message-content">
              <div class="message-text" v-html="formatMessage(message.content)"></div>
              <div v-if="message.role === 'ai' && message.streaming" class="message-streaming">
                <a-spin size="small" />
              </div>
            </div>
          </div>
        </div>

        <div class="input-container">
          <a-input
            v-model:value="inputText"
            placeholder="输入你的消息..."
            size="large"
            :disabled="streaming"
            @press-enter="handleSendMessage"
          >
            <template #suffix>
              <a-button
                type="primary"
                :loading="streaming"
                :disabled="!inputText.trim()"
                @click="handleSendMessage"
              >
                发送
              </a-button>
            </template>
          </a-input>
        </div>
      </div>

      <div class="preview-panel" v-if="showPreview">
        <div class="preview-header">
          <h3>网站预览</h3>
          <a-button type="link" @click="handleRefreshPreview">刷新</a-button>
        </div>
        <div class="preview-content">
          <iframe
            :src="previewUrl"
            frameborder="0"
            class="preview-iframe"
            @load="handlePreviewLoad"
          ></iframe>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { UserOutlined, RobotOutlined } from '@ant-design/icons-vue'
import { getMyApp, generateCode } from '@/api/appController'
import { deployApp } from '@/api/deployController'
import { saveMessage } from '@/api/chatHistoryController'
import { createSSEConnection, closeSSEConnection, type SSEMessage } from '@/utils/sse'
import { convertIdToString } from '@/utils/idConverter'
import type { AppVO } from '@/api/typings'

const route = useRoute()
const router = useRouter()

const appId = computed(() => {
  const id = route.params.id
  if (typeof id === 'string') {
    const numId = Number(id)
    if (!isNaN(numId) && numId > 0) {
      return numId
    }
  }
  return 0
})

// 应用信息
const appInfo = ref<AppVO | null>(null)
const loadingAppInfo = ref(false)

// 消息列表
interface ChatMessage {
  role: 'user' | 'ai'
  content: string
  streaming?: boolean
}

const messages = ref<ChatMessage[]>([])
const inputText = ref('')
const streaming = ref(false)
const messagesContainerRef = ref<HTMLElement>()

// 预览
const showPreview = ref(false)
const previewUrl = ref('')
const previewLoaded = ref(false)

// 部署
const deploying = ref(false)

// SSE 连接
let sseConnection: EventSource | null = null

// 是否可以部署
const canDeploy = computed(() => {
  return appInfo.value?.codeGenType && appInfo.value?.id && previewLoaded.value
})

// 加载应用信息
const loadAppInfo = async () => {
  if (!appId.value || appId.value === 0) {
    message.error('应用ID无效')
    router.push('/')
    return
  }

  try {
    loadingAppInfo.value = true
    const response = await getMyApp({ id: convertIdToString(appId.value) as any })

    if (response.data?.code === 0 && response.data?.data) {
      appInfo.value = response.data.data
      // 如果应用有初始提示词且没有消息，自动发送
      if (appInfo.value.initPrompt && messages.value.length === 0) {
        await sendInitialMessage()
      }
    } else {
      message.error('加载应用信息失败')
      router.push('/')
    }
  } catch (error) {
    message.error('加载应用信息失败')
    router.push('/')
  } finally {
    loadingAppInfo.value = false
  }
}

// 发送初始消息
const sendInitialMessage = async () => {
  if (!appInfo.value?.initPrompt) return

  // 添加用户消息
  messages.value.push({
    role: 'user',
    content: appInfo.value.initPrompt,
  })

  // 添加 AI 消息占位
  const aiMessageIndex = messages.value.length
  messages.value.push({
    role: 'ai',
    content: '',
    streaming: true,
  })

  scrollToBottom()

  // 调用生成代码接口
  await generateCodeStream(appInfo.value.initPrompt)
}

// 发送消息
const handleSendMessage = async () => {
  if (!inputText.value.trim() || streaming.value) return

  const userMessage = inputText.value.trim()
  inputText.value = ''

  // 添加用户消息
  messages.value.push({
    role: 'user',
    content: userMessage,
  })

  // 保存用户消息
  try {
    await saveMessage({
      appId: convertIdToString(appId.value) as any,
      message: userMessage,
      messageType: 'user',
    })
  } catch (error) {
    console.error('保存消息失败:', error)
  }

  // 添加 AI 消息占位
  const aiMessageIndex = messages.value.length
  messages.value.push({
    role: 'ai',
    content: '',
    streaming: true,
  })

  scrollToBottom()

  // 调用生成代码接口
  await generateCodeStream(userMessage)
}

// 生成代码流
const generateCodeStream = async (userMessage: string) => {
  try {
    streaming.value = true

    // 获取当前 AI 消息索引
    const aiMessageIndex = messages.value.length - 1
    let accumulatedContent = ''

    // 构建 SSE URL（SSE 需要完整 URL）
    const baseURL = 'http://localhost:8102/api'
    const url = `${baseURL}/app/chat/gen/code`

    // 创建 SSE 连接
    sseConnection = createSSEConnection(
      url,
      {
        appId: convertIdToString(appId.value) as any,
        message: userMessage,
      },
      {
        onMessage: (msg: SSEMessage) => {
          accumulatedContent += msg.data
          messages.value[aiMessageIndex].content = accumulatedContent
          messages.value[aiMessageIndex].streaming = true
          scrollToBottom()
        },
        onError: (error) => {
          console.error('SSE error:', error)
          messages.value[aiMessageIndex].streaming = false
          if (!accumulatedContent) {
            message.error('生成代码失败，请重试')
            messages.value.splice(aiMessageIndex, 1)
          }
        },
        onComplete: () => {
          messages.value[aiMessageIndex].streaming = false
          streaming.value = false

          // 保存 AI 消息
          saveMessage({
            appId: convertIdToString(appId.value) as any,
            message: accumulatedContent,
            messageType: 'ai',
          }).catch((error) => {
            console.error('保存消息失败:', error)
          })

          // 显示预览
          if (accumulatedContent && appInfo.value?.codeGenType) {
            showPreview.value = true
            updatePreviewUrl()
          }
        },
      }
    )
  } catch (error) {
    streaming.value = false
    message.error('生成代码失败，请稍后再试')
  }
}

// 更新预览 URL
const updatePreviewUrl = () => {
  if (appInfo.value?.codeGenType && appInfo.value?.id) {
    previewUrl.value = `http://localhost:8102/api/static/${appInfo.value.codeGenType}_${appInfo.value.id}/`
  }
}

// 预览加载完成
const handlePreviewLoad = () => {
  previewLoaded.value = true
}

// 刷新预览
const handleRefreshPreview = () => {
  previewLoaded.value = false
  updatePreviewUrl()
}

// 部署应用
const handleDeploy = async () => {
  if (!appInfo.value?.id || appInfo.value.id === 0) {
    message.error('应用ID无效')
    return
  }

  try {
    deploying.value = true
    const response = await deployApp({
      appId: convertIdToString(appInfo.value.id) as any,
    })

    if (response.data?.code === 0 && response.data?.data) {
      message.success('部署成功！')
      // 在新窗口打开部署的 URL
      window.open(response.data.data, '_blank')
    } else {
      message.error(response.data?.message || '部署失败')
    }
  } catch (error) {
    message.error('部署失败，请稍后再试')
  } finally {
    deploying.value = false
  }
}

// 格式化消息内容
const formatMessage = (content: string) => {
  if (!content) return ''
  // 简单的换行处理
  return content.replace(/\n/g, '<br>')
}

// 滚动到底部
const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainerRef.value) {
      messagesContainerRef.value.scrollTop = messagesContainerRef.value.scrollHeight
    }
  })
}

// 监听消息变化，自动滚动
watch(
  () => messages.value.length,
  () => {
    scrollToBottom()
  }
)

onMounted(() => {
  loadAppInfo()
})

onUnmounted(() => {
  closeSSEConnection(sseConnection)
})
</script>

<style scoped>
.chat-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #ffffff;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid #f0f0f0;
  background: #ffffff;
}

.header-left {
  flex: 1;
}

.app-title {
  font-size: 20px;
  font-weight: 600;
  color: #262626;
  margin: 0;
}

.chat-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.chat-panel {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  border-right: 1px solid #f0f0f0;
}

.preview-panel {
  width: 50%;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.empty-messages {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.message-item {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}

.message-user {
  flex-direction: row-reverse;
}

.message-avatar {
  flex-shrink: 0;
}

.message-content {
  flex: 1;
  min-width: 0;
}

.message-user .message-content {
  display: flex;
  justify-content: flex-end;
}

.message-text {
  display: inline-block;
  padding: 12px 16px;
  border-radius: 8px;
  max-width: 70%;
  word-wrap: break-word;
  line-height: 1.6;
}

.message-user .message-text {
  background: #1890ff;
  color: #ffffff;
}

.message-ai .message-text {
  background: #f5f5f5;
  color: #262626;
}

.message-streaming {
  margin-top: 8px;
}

.input-container {
  padding: 16px 24px;
  border-top: 1px solid #f0f0f0;
  background: #ffffff;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid #f0f0f0;
  background: #ffffff;
}

.preview-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.preview-content {
  flex: 1;
  overflow: hidden;
  background: #ffffff;
}

.preview-iframe {
  width: 100%;
  height: 100%;
  border: none;
}

@media (max-width: 768px) {
  .chat-content {
    flex-direction: column;
  }

  .preview-panel {
    width: 100%;
    height: 50%;
  }

  .chat-panel {
    border-right: none;
    border-bottom: 1px solid #f0f0f0;
  }
}
</style>

