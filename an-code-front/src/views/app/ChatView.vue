<template>
  <div class="chat-view">
    <div class="chat-header">
      <div class="header-left">
        <h2 class="app-title">{{ appInfo?.appName || '应用对话' }}</h2>
      </div>
      <div class="header-right">
        <a-space>
          <a-button @click="showAppDetailModal = true">应用详情</a-button>
          <a-button type="primary" :loading="deploying" :disabled="!canDeploy" @click="handleDeploy">
            部署应用
          </a-button>
        </a-space>
      </div>
    </div>

    <div class="chat-content">
      <!-- 左侧：步骤指南 -->
      <div class="guide-panel">
        <div class="guide-container" ref="guideContainerRef">
          <div v-if="historyLoading" class="empty-messages">
            <a-spin size="large" />
          </div>
          <div v-else-if="messages.length === 0" class="empty-messages">
            <a-empty description="开始对话吧" />
          </div>
          <div v-else class="guide-content">
            <div
              v-for="(message, index) in messages"
              :key="index"
              class="message-section"
            >
              <!-- 用户消息 -->
              <div v-if="message.role === 'user'" class="user-message">
                <div class="user-message-content">{{ message.content }}</div>
              </div>
              <!-- AI消息：步骤指南 -->
              <div v-else class="ai-guide">
                <template v-if="message.error">
                  <div class="error-box">
                    <p class="error-text">{{ message.content || '服务器繁忙，请稍后重试' }}</p>
                    <div class="error-actions">
                      <a-button size="small" type="primary" @click="handleRetry(message.retryPrompt)">
                        重新发送
                      </a-button>
                    </div>
                  </div>
                </template>
                <template v-else>
                <div class="guide-title">
                  <h3>{{ extractTitle(message.content) || '生成指南' }}</h3>
                  <p class="guide-subtitle">{{ extractSubtitle(message.content) }}</p>
                </div>
                <div class="steps-container" v-html="renderGuideSteps(message.content)"></div>
                <div v-if="message.streaming" class="streaming-indicator">
                  <a-spin size="small" />
                  <span>AI 正在生成...</span>
                </div>
                </template>
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
                :disabled="!inputText.trim() || !canSendMessage"
                @click="handleSendMessage"
              >
                发送
              </a-button>
            </template>
          </a-input>
        </div>
      </div>

      <!-- 右侧：代码编辑器 -->
      <div class="code-panel">
        <div class="code-header">
          <div class="code-tabs">
            <div
              v-for="(file, idx) in codeFiles"
              :key="idx"
              :class="['code-tab', { active: activeFileIndex === idx }]"
              @click="activeFileIndex = idx"
            >
              <span class="tab-icon">📄</span>
              <span class="tab-name">{{ file.name }}</span>
              <span v-if="codeFiles.length > 1" class="tab-close" @click.stop="removeFile(idx)">×</span>
            </div>
          </div>
          <div class="code-actions">
            <a-button type="link" size="small" @click="handleRefreshPreview">
              <template #icon><ReloadOutlined /></template>
              刷新预览
            </a-button>
          </div>
        </div>
        <div class="code-content">
          <div v-if="codeFiles.length === 0 && !streaming" class="code-empty">
            <a-empty description="代码生成后将显示在这里" />
          </div>
          <div v-else-if="codeFiles.length === 0 && streaming" class="code-empty">
            <a-spin size="large" />
            <p style="margin-top: 16px; color: rgba(255, 255, 255, 0.6);">正在生成代码...</p>
          </div>
          <div v-else class="code-editor">
            <div class="code-editor-header">
              <span class="code-lang">{{ currentFile?.language || 'text' }}</span>
              <span v-if="streaming" class="code-generating-indicator">
                <a-spin size="small" style="margin-right: 8px;" />
                正在生成...
              </span>
            </div>
            <pre class="code-block"><code v-html="highlightCode(currentFile?.content || '', currentFile?.language || '')"></code></pre>
          </div>
        </div>
        <div class="preview-section">
          <div class="preview-header">
            <h4>网站预览</h4>
            <a-button type="link" size="small" @click="togglePreview">
              {{ previewEnabled ? '隐藏' : '显示' }}
            </a-button>
          </div>
          <div v-if="previewEnabled" class="preview-content">
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
import { ReloadOutlined } from '@ant-design/icons-vue'
// 动态导入 marked 和 highlight.js
let marked: any = null
let hljs: any = null

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

const isViewMode = computed(() => route.query.view === '1')

const canSendMessage = computed(() => {
  if (!appInfo.value || !userStore.loginUser) return false
  return (
    appInfo.value.userId === userStore.loginUser.id ||
    userStore.loginUser.userRole === 'admin'
  )
})

const showAppDetailModal = ref(false)
const userName = ref('')
const userAvatar = ref('')

const appInfo = ref<AppVO | null>(null)
const loadingAppInfo = ref(false)

interface ChatMessage {
  role: 'user' | 'ai'
  content: string
  streaming?: boolean
  error?: boolean
  retryPrompt?: string
}

const messages = ref<ChatMessage[]>([])
const inputText = ref('')
const streaming = ref(false)
const guideContainerRef = ref<HTMLElement>()
const autoGenTriggered = ref(false)
const lastUserPrompt = ref('')

// 代码文件
interface CodeFile {
  name: string
  content: string
  language: string
}

const codeFiles = ref<CodeFile[]>([])
const activeFileIndex = ref(0)

const currentFile = computed(() => codeFiles.value[activeFileIndex.value] || null)

// 预览
const showPreview = ref(false)
const previewUrl = ref('')
const previewLoaded = ref(false)
const previewEnabled = ref(true)

const deploying = ref(false)
let sseConnection: EventSource | null = null
const historyLoading = ref(false)

const canDeploy = computed(() => {
  return appInfo.value?.codeGenType && appInfo.value?.id && previewLoaded.value
})

// 提取标题
const extractTitle = (content: string): string => {
  const titleMatch = content.match(/^#\s+(.+)/m)
  if (titleMatch) return titleMatch[1]
  const stepMatch = content.match(/STEP\s+\d+[：:]\s*(.+)/i)
  if (stepMatch) return stepMatch[1]
  return ''
}

// 提取副标题
const extractSubtitle = (content: string): string => {
  const subtitleMatch = content.match(/参考(.+?)生成/i) || content.match(/生成(.+?)应用/i)
  if (subtitleMatch) return subtitleMatch[0]
  return ''
}

// 渲染步骤指南
const renderGuideSteps = (content: string): string => {
  if (!content) return ''
  
  // 提取所有步骤
  const stepRegex = /STEP\s+(\d+)[：:]\s*(.+?)(?=STEP\s+\d+[：:]|```|$)/gis
  const steps: string[] = []
  let match
  
  while ((match = stepRegex.exec(content)) !== null) {
    const stepNum = match[1]
    const stepContent = match[2].trim()
    
    // 提取步骤描述和文件引用
    const fileMatch = stepContent.match(/`([^`]+\.(jsx?|tsx?|vue|css|html))`/i)
    const fileRef = fileMatch ? fileMatch[1] : ''
    const description = stepContent.replace(/`[^`]+`/g, '').trim()
    
    steps.push(`
      <div class="step-item">
        <div class="step-header">
          <span class="step-number">STEP ${stepNum}</span>
          <span class="step-title">${description.split('\n')[0] || '步骤'}</span>
        </div>
        <div class="step-content">
          ${description.split('\n').slice(1).join('<br>') || description}
          ${fileRef ? `<div class="step-file"><span class="file-icon">📄</span> ${fileRef}</div>` : ''}
        </div>
      </div>
    `)
  }
  
  // 如果没有找到STEP格式，尝试其他格式
  if (steps.length === 0) {
    // 尝试提取代码块前的描述
    const parts = content.split(/```/).filter((p, i) => i % 2 === 0)
    parts.forEach((part, idx) => {
      if (part.trim()) {
        steps.push(`
          <div class="step-item">
            <div class="step-header">
              <span class="step-number">STEP ${idx + 1}</span>
            </div>
            <div class="step-content">${part.trim().replace(/\n/g, '<br>')}</div>
          </div>
        `)
      }
    })
  }
  
  return steps.join('')
}

// 解析代码文件
const parseCodeFiles = (content: string) => {
  const files: CodeFile[] = []
  const fileMap = new Map<string, CodeFile>()
  
  // 匹配完整的代码块：```lang filename\ncode```
  const codeBlockRegex = /```(\w+)?\s*([^\n]+)?\n([\s\S]*?)```/g
  let match
  
  while ((match = codeBlockRegex.exec(content)) !== null) {
    const language = match[1] || 'text'
    const fileName = match[2]?.trim() || `file.${getDefaultExtension(language)}`
    const code = match[3].trim()
    
    fileMap.set(fileName, {
      name: fileName,
      content: code,
      language: language,
    })
  }
  
  // 处理未完成的代码块（实时显示）
  // 查找所有 ``` 标记，包括未闭合的
  const allCodeBlocks = content.match(/```[\s\S]*?$/g)
  if (allCodeBlocks) {
    allCodeBlocks.forEach((block) => {
      // 提取语言和文件名
      const headerMatch = block.match(/^```(\w+)?\s*([^\n]+)?\n/)
      if (headerMatch) {
        const language = headerMatch[1] || 'text'
        const fileName = headerMatch[2]?.trim() || `file.${getDefaultExtension(language)}`
        
        // 提取代码内容（可能不完整）
        const codeMatch = block.match(/^```[\w\s]*\n([\s\S]*?)(?:```|$)/)
        if (codeMatch) {
          const code = codeMatch[1].trim()
          // 如果这个文件还没有完整版本，或者当前内容更长，则更新
          if (!fileMap.has(fileName) || code.length > (fileMap.get(fileName)?.content.length || 0)) {
            fileMap.set(fileName, {
              name: fileName,
              content: code,
              language: language,
            })
          }
        }
      }
    })
  }
  
  // 将 Map 转换为数组
  files.push(...Array.from(fileMap.values()))
  
  // 如果没有找到代码块，尝试从STEP中提取文件名
  if (files.length === 0) {
    const fileRefRegex = /`([^\s`]+\.(jsx?|tsx?|vue|css|html))`/gi
    const fileNames = new Set<string>()
    let fileMatch
    
    while ((fileMatch = fileRefRegex.exec(content)) !== null) {
      fileNames.add(fileMatch[1])
    }
    
    fileNames.forEach((name) => {
      if (!fileMap.has(name)) {
        files.push({
          name,
          content: '// 代码生成中...',
          language: getLanguageFromFileName(name),
        })
      }
    })
  }
  
  return files
}

const getDefaultExtension = (lang: string): string => {
  const map: Record<string, string> = {
    javascript: 'js',
    typescript: 'ts',
    jsx: 'jsx',
    tsx: 'tsx',
    vue: 'vue',
    css: 'css',
    html: 'html',
  }
  return map[lang.toLowerCase()] || 'txt'
}

const getLanguageFromFileName = (fileName: string): string => {
  const ext = fileName.split('.').pop()?.toLowerCase()
  const map: Record<string, string> = {
    js: 'javascript',
    jsx: 'jsx',
    ts: 'typescript',
    tsx: 'tsx',
    vue: 'vue',
    css: 'css',
    html: 'html',
  }
  return map[ext || ''] || 'text'
}

// 代码高亮
const highlightCode = (code: string, language: string): string => {
  if (!code) return ''
  if (hljs && language) {
    try {
      return hljs.highlight(code, { language }).value
    } catch (err) {
      console.error('Highlight error:', err)
    }
  }
  if (hljs) {
    try {
      return hljs.highlightAuto(code).value
    } catch (err) {
      console.error('Highlight error:', err)
    }
  }
  return escapeHtml(code)
}

const escapeHtml = (unsafe: string) => {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

const removeFile = (index: number) => {
  if (codeFiles.value.length > 1) {
    codeFiles.value.splice(index, 1)
    if (activeFileIndex.value >= codeFiles.value.length) {
      activeFileIndex.value = codeFiles.value.length - 1
    }
  }
}

const togglePreview = () => {
  previewEnabled.value = !previewEnabled.value
}

const loadChatHistory = async () => {
  const numericAppId = appId.value
  if (!numericAppId || Number.isNaN(numericAppId)) {
    return
  }
  try {
    historyLoading.value = true
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
      
      // 解析最后一个AI消息的代码文件
      const lastAiMessage = messages.value.filter(m => m.role === 'ai').pop()
      if (lastAiMessage) {
        codeFiles.value = parseCodeFiles(lastAiMessage.content)
      }
    }
  } catch (error) {
    message.error('加载历史对话失败')
  } finally {
    historyLoading.value = false
  }
}

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
      
      // 如果不是查看模式，且有初始提示词，且没有历史消息，自动调用生成代码接口
      if (!isViewMode.value && messages.value.length === 0 && appInfo.value.initPrompt) {
        nextTick(async () => {
          setTimeout(async () => {
            // 直接调用生成代码接口，不通过输入框
            const initPrompt = appInfo.value!.initPrompt || ''
            if (initPrompt) {
              // 添加用户消息到消息列表
              messages.value.push({
                role: 'user',
                content: initPrompt,
              })
              
              // 保存用户消息
              try {
                await saveMessage({
                  appId: convertIdToString(appId.value) as any,
                  message: initPrompt,
                  messageType: 'user',
                })
              } catch (error) {
                console.error('保存消息失败:', error)
              }
              
              // 添加AI消息占位符
              const aiMessageIndex = messages.value.length
              messages.value.push({
                role: 'ai',
                content: '',
                streaming: true,
              })
              
              scrollToBottom()
          // 调用生成代码接口
          await generateCodeStream(initPrompt)
            }
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

const handleEditApp = (id: number) => {
  router.push(`/app/edit/${id}`)
}

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

const handleSendMessage = async () => {
  if (!inputText.value.trim() || streaming.value) return

  const userMessage = inputText.value.trim()
  lastUserPrompt.value = userMessage
  inputText.value = ''

  messages.value.push({
    role: 'user',
    content: userMessage,
  })

  try {
    await saveMessage({
      appId: convertIdToString(appId.value) as any,
      message: userMessage,
      messageType: 'user',
    })
  } catch (error) {
    console.error('保存消息失败:', error)
  }

  const aiMessageIndex = messages.value.length
  messages.value.push({
    role: 'ai',
    content: '',
    streaming: true,
  })

  scrollToBottom()
  await generateCodeStream(userMessage)
}

const handleStreamComplete = (content: string) => {
  const aiMessageIndex = messages.value.length - 1
  if (aiMessageIndex >= 0) {
    messages.value[aiMessageIndex].streaming = false
  }
  streaming.value = false

  if (content) {
    saveMessage({
      appId: convertIdToString(appId.value) as any,
      message: content,
      messageType: 'ai',
    }).catch((error) => {
      console.error('保存消息失败:', error)
    })

    // 解析代码文件
    codeFiles.value = parseCodeFiles(content)
    if (codeFiles.value.length > 0) {
      activeFileIndex.value = 0
    }

    nextTick(() => {
      if (appInfo.value?.codeGenType && appInfo.value?.id) {
        showPreview.value = true
        updatePreviewUrl()
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

const generateCodeStream = async (userMessage: string) => {
  try {
    // 防止重复调用：已有流或连接未关闭时直接返回
    if (streaming.value || sseConnection) {
      return
    }
    lastUserPrompt.value = userMessage
    streaming.value = true

    const aiMessageIndex = messages.value.length - 1
    let accumulatedContent = ''

    const url = `http://localhost:8102/api/app/chat/gen/code`
    sseConnection = createSSEConnection(
      url,
      {
        "appId": convertIdToString(appId.value) as any,
        "message": userMessage,
      },
      {
        onMessage: (msg: SSEMessage) => {
          try {
            const jsonData = JSON.parse(msg.data)
            const chunk = jsonData.d || ''
            if (chunk) {
              accumulatedContent += chunk
              const aiMessage = messages.value[aiMessageIndex]
              if (aiMessage) {
                aiMessage.content = accumulatedContent
                aiMessage.streaming = true
                aiMessage.error = false
              }
              
              // 实时解析代码文件
              const newFiles = parseCodeFiles(accumulatedContent)
              codeFiles.value = newFiles
              
              // 如果有新文件且当前没有选中文件，自动切换到第一个文件
              if (newFiles.length > 0 && activeFileIndex.value >= newFiles.length) {
                activeFileIndex.value = 0
              }
              
              scrollToBottom()
            }
          } catch (error) {
            if (msg.data) {
              accumulatedContent += msg.data
              const aiMessage = messages.value[aiMessageIndex]
              if (aiMessage) {
                aiMessage.content = accumulatedContent
                aiMessage.streaming = true
                aiMessage.error = false
              }
              const newFiles = parseCodeFiles(accumulatedContent)
              codeFiles.value = newFiles
              
              // 如果有新文件且当前没有选中文件，自动切换到第一个文件
              if (newFiles.length > 0 && activeFileIndex.value >= newFiles.length) {
                activeFileIndex.value = 0
              }
              
              scrollToBottom()
            }
          }
        },
        onError: (error) => {
          console.error('SSE error:', error)
          const aiMessage = messages.value[aiMessageIndex]
          if (aiMessage) {
            aiMessage.streaming = false
            aiMessage.error = true
            aiMessage.content = '服务器繁忙，请稍后重试'
            aiMessage.retryPrompt = lastUserPrompt.value
          }
          streaming.value = false
          closeSSEConnection(sseConnection)
          sseConnection = null
          if (accumulatedContent) {
            handleStreamComplete(accumulatedContent)
          } else {
            message.error('生成代码失败，请重试')
          }
        },
        onComplete: () => {
          handleStreamComplete(accumulatedContent)
          closeSSEConnection(sseConnection)
          sseConnection = null
        },
      },
    )
  } catch (error) {
    streaming.value = false
    const aiMessageIndex = messages.value.length - 1
    const aiMessage = messages.value[aiMessageIndex]
    if (aiMessage) {
      aiMessage.streaming = false
      aiMessage.error = true
      aiMessage.content = '服务器繁忙，请稍后重试'
      aiMessage.retryPrompt = lastUserPrompt.value
    }
    message.error('生成代码失败，请稍后再试')
  }
}

const handleRetry = async (prompt?: string) => {
  const retryPrompt = prompt || lastUserPrompt.value
  if (!retryPrompt || streaming.value) return
  inputText.value = retryPrompt
  await handleSendMessage()
}

const updatePreviewUrl = () => {
  if (appInfo.value?.codeGenType && appInfo.value?.id) {
    previewUrl.value = `http://localhost:8102/api/static/${appInfo.value.codeGenType}_${appInfo.value.id}/`
  }
}

const handlePreviewLoad = () => {
  previewLoaded.value = true
}

const handleRefreshPreview = () => {
  previewLoaded.value = false
  updatePreviewUrl()
}

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

const scrollToBottom = () => {
  nextTick(() => {
    if (guideContainerRef.value) {
      guideContainerRef.value.scrollTop = guideContainerRef.value.scrollHeight
    }
  })
}

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
  background: #f5f7fa;
  overflow: hidden;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  background: #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  flex-shrink: 0;
  z-index: 10;
}

.app-title {
  font-size: 20px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0;
}

.chat-content {
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

/* 左侧：步骤指南 */
.guide-panel {
  flex: 0 0 45%;
  min-width: 0;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border-right: 1px solid rgba(0, 0, 0, 0.06);
  overflow: hidden;
  position: relative;
  z-index: 1;
}

.guide-container {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 24px;
  min-height: 0;
}

.guide-content {
  max-width: 800px;
  margin: 0 auto;
}

.message-section {
  margin-bottom: 32px;
}

.user-message {
  margin-bottom: 24px;
}

.user-message-content {
  display: inline-block;
  padding: 12px 18px;
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  color: #ffffff;
  border-radius: 12px;
  border-bottom-right-radius: 4px;
  max-width: 80%;
  margin-left: auto;
  font-size: 14px;
  line-height: 1.6;
}

.ai-guide {
  background: #fafbfc;
  border-radius: 16px;
  padding: 24px;
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.guide-title h3 {
  font-size: 20px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0 0 8px;
}

.guide-subtitle {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.65);
  margin: 0 0 24px;
}

.steps-container {
  margin-top: 16px;
}

.step-item {
  margin-bottom: 20px;
  padding: 16px;
  background: #ffffff;
  border-radius: 12px;
  border-left: 3px solid #1890ff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.step-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.step-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  color: #ffffff;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
}

.step-title {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
}

.step-content {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.75);
  line-height: 1.8;
  margin-left: 44px;
}

.step-file {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  padding: 6px 12px;
  background: rgba(24, 144, 255, 0.1);
  border-radius: 6px;
  font-size: 13px;
  color: #1890ff;
}

.file-icon {
  font-size: 14px;
}

.streaming-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
  color: rgba(0, 0, 0, 0.45);
  font-size: 13px;
}

.error-box {
  border: 1px solid rgba(255, 0, 0, 0.2);
  background: rgba(255, 0, 0, 0.04);
  border-radius: 12px;
  padding: 12px 16px;
}

.error-text {
  margin: 0 0 8px;
  color: #c53030;
}

.error-actions {
  display: flex;
  gap: 8px;
}

.input-container {
  flex-shrink: 0;
  padding: 16px 24px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  background: #ffffff;
  position: relative;
  z-index: 10;
}

/* 右侧：代码编辑器 */
.code-panel {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  background: #1e293b;
  overflow: hidden;
  position: relative;
}

.code-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 16px;
  background: #0f172a;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  flex-shrink: 0;
}

.code-tabs {
  display: flex;
  gap: 4px;
  overflow-x: auto;
  flex: 1;
}

.code-tab {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.7);
  border-radius: 8px 8px 0 0;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  border-bottom: 2px solid transparent;
}

.code-tab:hover {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.9);
}

.code-tab.active {
  background: #1e293b;
  color: #ffffff;
  border-bottom-color: #1890ff;
}

.tab-icon {
  font-size: 14px;
}

.tab-name {
  font-size: 13px;
}

.tab-close {
  margin-left: 4px;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  font-size: 16px;
  line-height: 1;
  transition: background 0.2s;
}

.tab-close:hover {
  background: rgba(255, 255, 255, 0.2);
}

.code-actions {
  padding: 8px 0;
}

.code-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: #1e293b;
}

.code-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: rgba(255, 255, 255, 0.5);
}

.code-editor {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.code-editor-header {
  padding: 8px 16px;
  background: #0f172a;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.code-lang {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.code-generating-indicator {
  display: inline-flex;
  align-items: center;
  margin-left: 12px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

.code-block {
  flex: 1;
  overflow: auto;
  margin: 0;
  padding: 20px;
  background: #1e293b;
  color: #e2e8f0;
  font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
  font-size: 13px;
  line-height: 1.6;
}

.code-block code {
  background: transparent;
  padding: 0;
  border: none;
  color: inherit;
}

/* 预览区域 */
.preview-section {
  flex: 0 0 40%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f8f9fa;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.preview-header h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
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
  display: block;
}

.empty-messages {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 300px;
}

@media (max-width: 1024px) {
  .chat-content {
    flex-direction: column;
  }

  .guide-panel {
    flex: 0 0 50%;
    border-right: none;
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  }

  .code-panel {
    flex: 0 0 50%;
  }

  .preview-section {
    flex: 0 0 30%;
  }
}

@media (max-width: 768px) {
  .guide-panel {
    flex: 0 0 60%;
  }

  .code-panel {
    flex: 0 0 40%;
  }

  .preview-section {
    display: none;
  }
}
</style>
