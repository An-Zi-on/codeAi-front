<template>
  <div class="chat-view">
    <div class="chat-header">
      <div class="header-left">
        <h2 class="app-title">{{ appInfo?.appName || '应用对话' }}</h2>
      </div>
      <div class="header-right">
        <a-space>
          <a-button @click="showAppDetailModal = true">应用详情</a-button>
          <a-button @click="togglePreview">{{ previewEnabled ? '隐藏预览' : '显示预览' }}</a-button>
          <a-button type="primary" :loading="deploying" :disabled="!canDeploy" @click="handleDeploy">
            部署应用
          </a-button>
        </a-space>
      </div>
    </div>

    <div class="chat-content" :class="{ 'with-preview': shouldShowPreview }">
      <div class="chat-panel" :class="{ 'centered': !shouldShowPreview }">
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
              <a-avatar v-else :size="40" :src="aiAvatarSrc" @error="handleAvatarError">
                <template #icon>
                  <RobotOutlined />
                </template>
              </a-avatar>
            </div>
            <div class="message-content">
              <div
                v-if="message.role === 'user'"
                class="message-text"
                v-html="formatMessage(message.content)"
              ></div>
              <div
                v-else
                class="message-text markdown-content"
                v-html="renderMarkdown(message.content)"
              ></div>
              <div v-if="message.role === 'ai' && message.streaming" class="message-streaming">
                <a-spin size="small" />
                <span>AI 正在思考...</span>
              </div>
            </div>
          </div>
        </div>

        <div class="input-container">
          <a-input
            v-model:value="inputText"
            placeholder="请描述你想生成的网站，越详细效果越好哦"
            size="large"
            :disabled="streaming || !canSendMessage"
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

    <AppDetailModal
      v-model:open="showAppDetailModal"
      :app-info="appInfo"
      :user-name="userName"
      :user-avatar="userAvatar"
      @edit="handleEditApp"
      @delete="handleDeleteApp"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { RobotOutlined, UserOutlined } from '@ant-design/icons-vue'
// 动态导入 marked 和 highlight.js，避免未安装时的错误
let marked: any = null
let hljs: any = null

// 尝试导入 marked 和 highlight.js
import('marked')
  .then((module) => {
    marked = module.marked
    return import('highlight.js')
  })
  .then((module) => {
    hljs = module.default
    import('highlight.js/styles/github-dark.css').catch(() => {
      console.warn('Highlight.js styles not found')
    })
  })
  .catch((error) => {
    console.warn('Markdown libraries not installed, using fallback renderer:', error)
  })
import { getMyApp } from '@/api/appController'
import { deployApp } from '@/api/deployController'
import { getLastLocalDateTime, pageByApp, saveMessage } from '@/api/chatHistoryController'
import { closeSSEConnection, createSSEConnection, type SSEMessage } from '@/utils/sse'
import { convertIdToString } from '@/utils/idConverter'
import { useCounterStore } from '@/stores/counter'
import AppDetailModal from '@/components/AppDetailModal.vue'
import type { AppVO } from '@/api/typings'

const route = useRoute()
const router = useRouter()
const userStore = useCounterStore()

const appId = computed(() => {
  const id = route.params.id
  if (typeof id === 'string') {
    return id
  }
  return 0
})

// 检查是否是查看模式（不自动发送消息）
const isViewMode = computed(() => route.query.view === '1')

// 检查是否可以发送消息（只有自己的应用或管理员可以）
const canSendMessage = computed(() => {
  if (!appInfo.value || !userStore.loginUser) return false
  return (
    appInfo.value.userId === userStore.loginUser.id ||
    userStore.loginUser.userRole === 'admin'
  )
})

// AI 头像
const aiAvatarSrc = ref<string | undefined>('/src/assets/aiAvatar.png')

const handleAvatarError = () => {
  aiAvatarSrc.value = undefined
}

// 应用详情弹窗
const showAppDetailModal = ref(false)
const userName = ref('')
const userAvatar = ref('')

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

const formatMessage = (content: string) => {
  if (!content) return ''
  // 转义 HTML 并处理换行
  return escapeHtml(content).replace(/\n/g, '<br>')
}

// 配置 marked
if (marked) {
  marked.setOptions({
    highlight: function (code: string, lang: string) {
      if (hljs && lang && hljs.getLanguage(lang)) {
        try {
          return hljs.highlight(code, { language: lang }).value
        } catch (err) {
          console.error('Highlight error:', err)
        }
      }
      if (hljs) {
        return hljs.highlightAuto(code).value
      }
      return escapeHtml(code)
    },
    breaks: true,
    gfm: true,
  })
}

const renderMarkdown = (content: string) => {
  if (!content) return ''
  if (marked) {
    try {
      return marked.parse(content) as string
    } catch (error) {
      console.error('Markdown render error:', error)
    }
  }
  // 降级处理：简单的 Markdown 渲染
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
      // TODO: 加载用户信息（需要后端支持或单独接口）
      await loadChatHistory()
      
      // 如果不是查看模式，且没有历史消息，自动发送初始提示词
      if (!isViewMode.value && messages.value.length === 0 && appInfo.value.initPrompt) {
        // 延迟一下，确保界面已渲染
        nextTick(() => {
          setTimeout(() => {
            inputText.value = appInfo.value!.initPrompt || ''
            handleSendMessage()
          }, 500)
        })
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

// 编辑应用
const handleEditApp = (id: number) => {
  router.push(`/app/edit/${id}`)
}

// 删除应用
const handleDeleteApp = async (id: number) => {
  try {
    const { deleteMyApp } = await import('@/api/appController')
    const response = await deleteMyApp({ id: convertIdToString(id) as any })
    if (response.data?.code === 0) {
      message.success('删除成功')
      router.push('/')
    } else {
      message.error(response.data?.message || '删除失败')
    }
  } catch (error) {
    message.error('删除失败，请稍后再试')
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

    // 显示预览 - 确保在流式完成后触发
    nextTick(() => {
      if (appInfo.value?.codeGenType && appInfo.value?.id) {
        showPreview.value = true
        updatePreviewUrl()
        // 强制刷新预览
        setTimeout(() => {
          const iframe = document.querySelector('.preview-iframe') as HTMLIFrameElement
          if (iframe) {
            iframe.src = iframe.src
          }
        }, 1000)
      }
    })
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
  height: 100%;
  min-height: 0;
  background: #ffffff;
  overflow: hidden;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  background: linear-gradient(180deg, #ffffff 0%, #fafbfc 100%);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  flex-shrink: 0;
}

.header-left {
  flex: 1;
}

.app-title {
  font-size: 22px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0;
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.chat-content {
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  justify-content: center;
  align-items: stretch;
}

.chat-content.with-preview {
  justify-content: flex-start;
}

.chat-panel {
  display: flex;
  flex-direction: column;
  position: relative;
  height: 100%;
  overflow: hidden;
  background: #ffffff;
}

.chat-panel.centered {
  width: 100%;
  max-width: 800px;
  min-width: 360px;
  margin: 0 auto;
}

.chat-content.with-preview .chat-panel {
  flex: 0 0 40%;
  max-width: 920px;
  min-width: 360px;
  border-right: 1px solid rgba(0, 0, 0, 0.06);
  margin: 0;
}

.preview-panel {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  background: #f8f9fa;
  height: 100%;
  overflow: hidden;
  flex-shrink: 0;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 16px 20px;
  padding-bottom: 100px;
  min-height: 0;
  scroll-behavior: smooth;
}

.messages-container::-webkit-scrollbar {
  width: 6px;
}

.messages-container::-webkit-scrollbar-track {
  background: transparent;
}

.messages-container::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}

.messages-container::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}

.empty-messages {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 300px;
}

.message-item {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message-user {
  flex-direction: row-reverse;
}

.message-avatar {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.message-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.message-user .message-content {
  align-items: flex-end;
}

.message-ai .message-content {
  align-items: flex-start;
}

.message-text {
  display: inline-block;
  padding: 14px 18px;
  border-radius: 12px;
  max-width: 75%;
  word-wrap: break-word;
  word-break: break-word;
  line-height: 1.6;
  font-size: 14px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.2s ease;
}

.message-user .message-text {
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  color: #ffffff;
  border-bottom-right-radius: 4px;
}

.message-user .message-text:hover {
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3);
  transform: translateY(-1px);
}

.message-ai .message-text {
  background: #f5f7fa;
  color: #1a1a1a;
  border-bottom-left-radius: 4px;
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.message-ai .message-text:hover {
  background: #eef2f6;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.markdown-content {
  line-height: 1.8;
}

.markdown-content .code-block {
  margin: 12px 0;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.markdown-content :deep(pre) {
  background: #1e293b;
  color: #e2e8f0;
  padding: 16px;
  border-radius: 8px;
  margin: 12px 0;
  overflow-x: auto;
  font-size: 13px;
  line-height: 1.6;
  font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
}

.markdown-content :deep(pre code) {
  background: transparent;
  padding: 0;
  border: none;
  color: inherit;
}

.markdown-content :deep(.hljs) {
  background: #1e293b;
  color: #e2e8f0;
}

.markdown-content .code-lang {
  font-size: 11px;
  color: rgba(148, 163, 184, 0.8);
  text-transform: uppercase;
  margin-bottom: 6px;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.markdown-content code {
  background: rgba(15, 23, 42, 0.1);
  padding: 3px 6px;
  border-radius: 4px;
  font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
  font-size: 13px;
  color: #1890ff;
  border: 1px solid rgba(24, 144, 255, 0.2);
}

.message-streaming {
  margin-top: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #8c8c8c;
  font-size: 12px;
}

.input-container {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 12px 20px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  background: linear-gradient(180deg, #ffffff 0%, #fafbfc 100%);
  z-index: 10;
  height: 88px;
  display: flex;
  align-items: center;
  box-sizing: border-box;
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.04);
}

.input-container :deep(.ant-input-wrapper) {
  position: relative;
}

.input-container :deep(.ant-input-wrapper-disabled) {
  cursor: not-allowed;
}

.input-container :deep(.ant-input-wrapper-disabled .ant-input) {
  cursor: not-allowed;
}

.input-container :deep(.ant-input-wrapper-disabled::after) {
  content: '无法在别人的作品下对话哦~';
  position: absolute;
  top: -30px;
  left: 0;
  background: rgba(0, 0, 0, 0.75);
  color: #fff;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s;
}

.input-container :deep(.ant-input-wrapper-disabled:hover::after) {
  opacity: 1;
}

.input-container :deep(.ant-input) {
  flex: 1;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  padding: 12px 16px;
  font-size: 14px;
  transition: all 0.2s ease;
}

.input-container :deep(.ant-input):focus {
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.1);
}

.input-container :deep(.ant-input-suffix) {
  margin-left: 12px;
}

.input-container :deep(.ant-btn) {
  border-radius: 8px;
  height: 40px;
  padding: 0 20px;
  font-weight: 500;
  box-shadow: 0 2px 4px rgba(24, 144, 255, 0.2);
  transition: all 0.2s ease;
}

.input-container :deep(.ant-btn):hover {
  box-shadow: 0 4px 8px rgba(24, 144, 255, 0.3);
  transform: translateY(-1px);
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  background: #ffffff;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.preview-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
}

.preview-content {
  flex: 1;
  overflow: hidden;
  background: #ffffff;
  min-height: 0;
}

.preview-iframe {
  width: 100%;
  height: 100%;
  border: none;
  display: block;
}

@media (max-width: 768px) {
  .chat-content {
    flex-direction: column;
  }

  .chat-content.with-preview {
    flex-direction: column;
  }

  .chat-panel {
    width: 100% !important;
    max-width: 100% !important;
    height: 60%;
    border-right: none;
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
    margin: 0 !important;
  }

  .chat-panel.centered {
    width: 100% !important;
    max-width: 100% !important;
    margin: 0 !important;
  }

  .preview-panel {
    width: 100%;
    height: 40%;
  }

  .input-container {
    height: 80px;
    padding: 12px 16px;
  }

  .message-text {
    max-width: 85%;
    font-size: 13px;
    padding: 12px 16px;
  }
}
</style>
