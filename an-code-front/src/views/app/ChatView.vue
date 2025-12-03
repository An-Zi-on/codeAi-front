<template>
  <div class="chat-view">
    <div class="chat-header">
      <div class="header-left">
        <h2 class="app-title">{{ appInfo?.appName || '应用对话' }}</h2>
      </div>
      <div class="header-right">
        <a-space>
          <a-button @click="togglePreview">{{ previewEnabled ? '隐藏预览' : '显示预览' }}</a-button>
          <a-button type="primary" :loading="deploying" :disabled="!canDeploy" @click="handleDeploy">
            部署应用
          </a-button>
        </a-space>
      </div>
    </div>

    <div class="chat-content">
      <div class="chat-panel">
        <div class="messages-container" ref="messagesContainerRef">
          <div v-if="historyLoading" class="empty-messages">
            <a-spin size="large" />
          </div>
          <div v-else-if="messages.length === 0" class="empty-messages">
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
              <div
                class="message-text markdown-content"
                v-html="renderMarkdown(message.content)"
              ></div>
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

      <div class="preview-panel" v-if="shouldShowPreview">
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
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { RobotOutlined, UserOutlined } from '@ant-design/icons-vue'
import { getMyApp } from '@/api/appController'
import { deployApp } from '@/api/deployController'
import { getLastLocalDateTime, pageByApp, saveMessage } from '@/api/chatHistoryController'
import { closeSSEConnection, createSSEConnection, type SSEMessage } from '@/utils/sse'
import { convertIdToString } from '@/utils/idConverter'
import type { AppVO } from '@/api/typings'

const route = useRoute()
const router = useRouter()

const appId = computed(() => {
  const id = route.params.id
  if (typeof id === 'string') {
    return id
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
const previewEnabled = ref(true)

// 部署
const deploying = ref(false)

// SSE 连接
let sseConnection: EventSource | null = null

// 加载历史
const historyLoading = ref(false)

const shouldShowPreview = computed(() => showPreview.value && previewEnabled.value)

const togglePreview = () => {
  previewEnabled.value = !previewEnabled.value
}

const escapeHtml = (unsafe: string) => {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

const renderMarkdown = (content: string) => {
  if (!content) return ''
  let html = content

  // 处理多行代码块 ```lang ... ```
  html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (_, lang, code) => {
    const safeCode = escapeHtml(code.trim())
    const langLabel = lang ? lang.toLowerCase() : ''
    const langBadge = langLabel ? `<div class="code-lang">${langLabel}</div>` : ''
    return `<div class="code-block">${langBadge}<pre><code>${safeCode}</code></pre></div>`
  })

  // 行内代码 `code`
  html = html.replace(/`([^`]+)`/g, (_, code) => `<code>${escapeHtml(code)}</code>`)

  // 普通换行
  html = html.replace(/\n/g, '<br>')
  return html
}

// 是否可以部署
const canDeploy = computed(() => {
  return appInfo.value?.codeGenType && appInfo.value?.id && previewLoaded.value
})

const loadChatHistory = async () => {
  const numericAppId = appId.value
  if (!numericAppId || Number.isNaN(numericAppId)) {
    return
  }
  try {
    historyLoading.value = true
    // 先获取最新一条消息时间
    const lastTimeResp = await getLastLocalDateTime({
      id: numericAppId,
    })
    const lastTime =
      lastTimeResp.data?.code === 0 && lastTimeResp.data?.data ? lastTimeResp.data.data : ''

    const response = await pageByApp(
      {
        appId: numericAppId,
        lastCreateTime: lastTime || '',
        pageSize: 100,
        httpServletRequest: undefined as any,
      } as any,
    )
    if (response.data?.code === 0 && response.data?.data?.records) {
      const sorted = [...(response.data.data.records || [])].sort((a, b) => {
        const timeA = a.createTime ? new Date(a.createTime).getTime() : 0
        const timeB = b.createTime ? new Date(b.createTime).getTime() : 0
        return timeA - timeB
      })
      messages.value = sorted.map((item) => ({
        role: item.messageType?.toLowerCase() === 'user' ? 'user' : 'ai',
        content: item.message || '',
        streaming: false,
      }))
    }
  } catch (error) {
    message.error('加载历史对话失败')
  } finally {
    historyLoading.value = false
  }
}

// 加载应用信息
const loadAppInfo = async () => {
  const numericAppId = Number(appId.value)
  if (!numericAppId || Number.isNaN(numericAppId)) {
    message.error('应用ID无效')
    router.push('/')
    return
  }

  try {
    loadingAppInfo.value = true
    const response = await getMyApp({ id: convertIdToString(appId.value) as any })

    if (response.data?.code === 0 && response.data?.data) {
      appInfo.value = response.data.data
      await loadChatHistory()
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

// 处理流式完成
const handleStreamComplete = (content: string) => {
  const aiMessageIndex = messages.value.length - 1
  if (aiMessageIndex >= 0) {
    messages.value[aiMessageIndex].streaming = false
  }
  streaming.value = false

  // 保存 AI 消息
  if (content) {
    saveMessage({
      appId: convertIdToString(appId.value) as any,
      message: content,
      messageType: 'ai',
    }).catch((error) => {
      console.error('保存消息失败:', error)
    })

    // 显示预览
    if (appInfo.value?.codeGenType) {
      showPreview.value = true
      updatePreviewUrl()
    }
  }
}

// 生成代码流
const generateCodeStream = async (userMessage: string) => {
  try {
    streaming.value = true

    // 获取当前 AI 消息索引
    const aiMessageIndex = messages.value.length - 1
    let accumulatedContent = ''

    // 构建 SSE URL（SSE 需要完整 URL）
    const url = `http://localhost:8102/api/app/chat/gen/code`
    // 创建 SSE 连接
    sseConnection = createSSEConnection(
      url,
      {
        "appId": convertIdToString(appId.value) as any,
        "message": userMessage,
      },
      {
        onMessage: (msg: SSEMessage) => {
          try {
            // 后端返回的是 JSON 格式：{"d": "chunk内容"}
            const jsonData = JSON.parse(msg.data)
            const chunk = jsonData.d || ''
            if (chunk) {
              accumulatedContent += chunk
              messages.value[aiMessageIndex].content = accumulatedContent
              messages.value[aiMessageIndex].streaming = true
              scrollToBottom()
            }
          } catch (error) {
            // 如果不是 JSON，直接使用原始数据
            if (msg.data) {
              accumulatedContent += msg.data
              messages.value[aiMessageIndex].content = accumulatedContent
              messages.value[aiMessageIndex].streaming = true
              scrollToBottom()
            }
          }
        },
        onError: (error) => {
          console.error('SSE error:', error)
          messages.value[aiMessageIndex].streaming = false
          streaming.value = false
          if (!accumulatedContent) {
            message.error('生成代码失败，请重试')
            messages.value.splice(aiMessageIndex, 1)
          } else {
            // 即使出错，如果有内容也保存
            handleStreamComplete(accumulatedContent)
          }
        },
        onComplete: () => {
          handleStreamComplete(accumulatedContent)
        },
      },
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
  if (!appInfo.value?.id || appInfo.value.id === '0') {
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
  },
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
  height: calc(100vh - var(--layout-header-height) - var(--layout-footer-height));
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
  flex: 0 0 55%;
  max-width: 920px;
  min-width: 360px;
  border-right: 1px solid #f0f0f0;
}

.preview-panel {
  flex: 1;
  min-width: 0;
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

.markdown-content .code-block {
  margin: 8px 0;
}

.markdown-content .code-block pre {
  background: #0f172a;
  color: #e2e8f0;
  padding: 12px;
  border-radius: 8px;
  margin: 0;
  overflow-x: auto;
}

.markdown-content .code-lang {
  font-size: 12px;
  color: rgba(148, 163, 184, 0.9);
  text-transform: uppercase;
  margin-bottom: 4px;
}

.markdown-content code {
  background: rgba(15, 23, 42, 0.08);
  padding: 2px 4px;
  border-radius: 4px;
  font-family: 'JetBrains Mono', monospace;
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
