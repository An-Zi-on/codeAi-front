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
              :class="['code-tab', { 
                active: activeFileIndex === idx,
                generating: file.isGenerating,
                complete: file.isComplete && !file.isGenerating
              }]"
              @click="activeFileIndex = idx"
            >
              <span class="tab-icon">📄</span>
              <span class="tab-name">{{ file.name }}</span>
              <span v-if="file.isGenerating" class="tab-generating-indicator">
                <a-spin size="small" style="margin-right: 4px;" />
              </span>
              <span v-if="file.isComplete && !file.isGenerating" class="tab-complete-indicator">✓</span>
              <span v-if="codeFiles.length > 1" class="tab-close" @click.stop="removeFile(idx)">×</span>
            </div>
          </div>
          <div class="code-actions">
            <a-button type="link" size="small" @click="showCodeView = !showCodeView">
              {{ showCodeView ? '查看预览' : '查看代码' }}
            </a-button>
            <a-button v-if="!showCodeView" type="link" size="small" @click="handleRefreshPreview">
              <template #icon><ReloadOutlined /></template>
              刷新预览
            </a-button>
          </div>
        </div>
        <!-- 代码和预览重叠显示 -->
        <div class="code-preview-container">
          <!-- 代码视图 -->
          <div v-show="showCodeView" class="code-content">
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
                <span v-else-if="currentFile?.isGenerating" class="code-generating-indicator">
                  <a-spin size="small" style="margin-right: 8px;" />
                  生成中...
                </span>
              </div>
              <pre class="code-block"><code v-html="highlightCode(currentFile?.content || '', currentFile?.language || 'text')"></code></pre>
            </div>
          </div>
          <!-- 预览视图 -->
          <div v-show="!showCodeView" class="preview-section">
            <div class="preview-header">
              <h4>网站预览</h4>
              <div v-if="!previewLoaded && previewUrl" class="preview-loading">
                <a-spin size="small" />
                <span style="margin-left: 8px; font-size: 12px; color: rgba(0, 0, 0, 0.45);">加载中...</span>
              </div>
            </div>
            <div class="preview-content">
              <iframe
                v-if="previewEnabled && previewUrl"
                :key="previewUrl"
                :src="previewUrl"
                frameborder="0"
                class="preview-iframe"
                @load="handlePreviewLoad"
                @error="handlePreviewError"
              ></iframe>
              <div v-else-if="!previewEnabled" class="preview-empty">
                <a-empty description="预览已关闭" />
              </div>
              <div v-else-if="!previewUrl" class="preview-empty">
                <a-empty description="代码生成后将显示预览" />
              </div>
            </div>
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
  isComplete?: boolean // 标记文件是否生成完成
  isGenerating?: boolean // 标记文件是否正在生成
}

const codeFiles = ref<CodeFile[]>([])
const activeFileIndex = ref(0)

const currentFile = computed(() => codeFiles.value[activeFileIndex.value] || null)

// 预览
const showPreview = ref(false)
const previewUrl = ref('')
const previewLoaded = ref(false)
const previewEnabled = ref(true)
const showCodeView = ref(true) // 控制显示代码还是预览

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
  const completedFiles = new Set<string>() // 已完成的文件
  const generatingFiles = new Set<string>() // 正在生成的文件
  
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
      isComplete: true,
      isGenerating: false,
    })
    completedFiles.add(fileName)
  }
  
  // 处理未完成的代码块（实时显示）
  // 查找所有 ``` 标记，包括未闭合的
  // 使用更精确的正则表达式匹配未完成的代码块
  const unclosedCodeBlockRegex = /```(\w+)?\s*([^\n]+)?\n([\s\S]*?)(?=```|$)/g
  let unclosedMatch
  
  while ((unclosedMatch = unclosedCodeBlockRegex.exec(content)) !== null) {
    const language = unclosedMatch[1] || 'text'
    const fileName = unclosedMatch[2]?.trim() || `file.${getDefaultExtension(language)}`
    const code = unclosedMatch[3] || ''
    
    // 检查这个代码块是否已经完成（在完整代码块匹配中）
    const isComplete = completedFiles.has(fileName)
    
    // 如果文件已经完成，跳过未完成代码块的处理，使用完整版本
    if (isComplete) {
      continue
    }
    
    // 如果这个文件还没有完整版本，或者当前内容更长，则更新
    if (!fileMap.has(fileName) || code.length > (fileMap.get(fileName)?.content.length || 0)) {
      // 检查是否是未闭合的（在内容末尾查找是否有结束的```）
      const blockEnd = unclosedMatch.index + unclosedMatch[0].length
      const remainingContent = content.substring(blockEnd)
      const hasClosingBackticks = remainingContent.trim().startsWith('```')
      const isUnclosed = !hasClosingBackticks
      
      // 只有在未闭合时才标记为正在生成
      const isGenerating = isUnclosed
      
      fileMap.set(fileName, {
        name: fileName,
        content: code.trim(),
        language: language,
        isComplete: false,
        isGenerating: isGenerating,
      })
      
      if (isGenerating) {
        generatingFiles.add(fileName)
      }
    }
  }
  
  // 将 Map 转换为数组，按生成顺序排序
  const fileArray = Array.from(fileMap.values())
  
  // 排序：正在生成的在前，已完成的在后，按出现顺序
  fileArray.sort((a, b) => {
    // 正在生成的优先
    if (a.isGenerating && !b.isGenerating) return -1
    if (!a.isGenerating && b.isGenerating) return 1
    // 未完成的优先
    if (!a.isComplete && b.isComplete) return -1
    if (a.isComplete && !b.isComplete) return 1
    return 0
  })
  
  files.push(...fileArray)
  
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
          isComplete: false,
          isGenerating: true,
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
  if (!code || code.trim() === '') return escapeHtml(code || '')
  
  // 如果语言是 'text' 或空，尝试自动检测
  const langToUse = language && language !== 'text' ? language : undefined
  
  if (hljs && langToUse) {
    try {
      return hljs.highlight(code, { language: langToUse }).value
    } catch (err) {
      // 如果指定语言失败，尝试自动检测
      console.warn(`Highlight failed for language "${langToUse}", trying auto-detect:`, err)
    }
  }
  
  if (hljs) {
    try {
      return hljs.highlightAuto(code).value
    } catch (err) {
      console.error('Auto highlight error:', err)
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
        const parsedFiles = parseCodeFiles(lastAiMessage.content)
        // 历史消息中的文件都是已完成的
        codeFiles.value = parsedFiles.map(file => ({
          ...file,
          isComplete: true,
          isGenerating: false,
        }))
        // 如果有代码文件，更新预览URL
        if (codeFiles.value.length > 0) {
          nextTick(() => {
            updatePreviewUrl()
          })
        }
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
      
      // 如果不是查看模式，且有初始提示词，且没有历史消息，且未触发过自动生成，自动调用生成代码接口
      if (!isViewMode.value && messages.value.length === 0 && appInfo.value.initPrompt && !autoGenTriggered.value) {
        autoGenTriggered.value = true
        nextTick(async () => {
          setTimeout(async () => {
            // 直接调用生成代码接口，不通过输入框
            const initPrompt = appInfo.value!.initPrompt || ''
            if (initPrompt && !streaming.value) {
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

    // 解析代码文件，流完成后所有文件都应该标记为已完成
    const parsedFiles = parseCodeFiles(content)
    // 确保所有文件都标记为已完成，不再生成
    codeFiles.value = parsedFiles.map(file => ({
      ...file,
      isComplete: true,
      isGenerating: false,
    }))
    if (codeFiles.value.length > 0) {
      activeFileIndex.value = 0
    }

    // 更新预览URL并刷新预览
    nextTick(() => {
      if (appInfo.value?.codeGenType && appInfo.value?.id) {
        updatePreviewUrl()
        // 延迟刷新预览，确保后端文件已保存
        setTimeout(() => {
          refreshPreview()
        }, 1500)
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
              const oldFilesCount = codeFiles.value.length
              codeFiles.value = newFiles
              
              // 智能切换文件：优先显示正在生成的文件
              if (newFiles.length > 0) {
                // 如果有新文件出现，切换到第一个新文件
                if (newFiles.length > oldFilesCount) {
                  activeFileIndex.value = oldFilesCount
                } else {
                  // 查找正在生成的文件
                  const generatingIndex = newFiles.findIndex(f => f.isGenerating)
                  if (generatingIndex !== -1) {
                    // 如果当前文件已完成，切换到正在生成的文件
                    const currentFile = newFiles[activeFileIndex.value]
                    if (currentFile?.isComplete && generatingIndex !== activeFileIndex.value) {
                      activeFileIndex.value = generatingIndex
                    }
                  }
                }
                
                // 确保索引有效
                if (activeFileIndex.value >= newFiles.length) {
                  activeFileIndex.value = newFiles.length - 1
                }
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
              const oldFilesCount = codeFiles.value.length
              codeFiles.value = newFiles
              
              // 智能切换文件：优先显示正在生成的文件
              if (newFiles.length > 0) {
                // 如果有新文件出现，切换到第一个新文件
                if (newFiles.length > oldFilesCount) {
                  activeFileIndex.value = oldFilesCount
                } else {
                  // 查找正在生成的文件
                  const generatingIndex = newFiles.findIndex(f => f.isGenerating)
                  if (generatingIndex !== -1) {
                    // 如果当前文件已完成，切换到正在生成的文件
                    const currentFile = newFiles[activeFileIndex.value]
                    if (currentFile?.isComplete && generatingIndex !== activeFileIndex.value) {
                      activeFileIndex.value = generatingIndex
                    }
                  }
                }
                
                // 确保索引有效
                if (activeFileIndex.value >= newFiles.length) {
                  activeFileIndex.value = newFiles.length - 1
                }
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
    const newUrl = `http://localhost:8102/api/static/${appInfo.value.codeGenType}_${appInfo.value.id}/`
    // 如果URL变化，重置加载状态
    if (previewUrl.value !== newUrl) {
      previewLoaded.value = false
      previewUrl.value = newUrl
      console.log('更新预览URL:', newUrl)
    } else if (!previewUrl.value) {
      previewUrl.value = newUrl
      console.log('设置预览URL:', newUrl)
    }
  } else {
    console.warn('无法更新预览URL：缺少必要信息', {
      codeGenType: appInfo.value?.codeGenType,
      id: appInfo.value?.id
    })
  }
}

const handlePreviewLoad = () => {
  previewLoaded.value = true
  console.log('预览页面加载完成:', previewUrl.value)
}

const handlePreviewError = () => {
  previewLoaded.value = false
  console.error('预览加载失败:', previewUrl.value)
  message.warning('预览加载失败，请检查后端服务是否正常运行')
}

const handleRefreshPreview = () => {
  refreshPreview()
}

const refreshPreview = () => {
  if (!previewUrl.value) {
    updatePreviewUrl()
  }
  if (!previewUrl.value) {
    console.warn('无法刷新预览：预览URL为空')
    return
  }
  previewLoaded.value = false
  // 强制刷新iframe
  nextTick(() => {
    const iframe = document.querySelector('.preview-iframe') as HTMLIFrameElement
    if (iframe) {
      // 添加时间戳防止缓存
      const separator = previewUrl.value.includes('?') ? '&' : '?'
      const newUrl = previewUrl.value + separator + '_t=' + Date.now()
      iframe.src = newUrl
      console.log('刷新预览:', newUrl)
    } else {
      console.warn('无法刷新预览：找不到iframe元素')
    }
  })
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

// 监听代码文件变化，自动更新预览
watch(
  () => codeFiles.value.length,
  (newLength, oldLength) => {
    // 当代码文件从无到有时，更新预览
    if (newLength > 0 && oldLength === 0 && appInfo.value?.codeGenType && appInfo.value?.id) {
      nextTick(() => {
        updatePreviewUrl()
        setTimeout(() => {
          refreshPreview()
        }, 1000)
      })
    }
  },
)

// 监听appInfo变化，更新预览URL
watch(
  () => [appInfo.value?.codeGenType, appInfo.value?.id],
  () => {
    if (appInfo.value?.codeGenType && appInfo.value?.id && codeFiles.value.length > 0) {
      updatePreviewUrl()
    }
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
/* 根容器：100% 高度，适应父容器 */
.chat-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  min-height: 0;
  min-width: 0;
  margin: 0;
  padding: 0;
  background: #f5f7fa;
  overflow: hidden;
}

/* 顶部固定头部 */
.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  background: #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  flex-shrink: 0;
  min-height: 0;
  z-index: 10;
}

.app-title {
  font-size: 20px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0;
}

/* 主内容区域：水平布局 */
.chat-content {
  display: flex;
  flex: 1;
  min-height: 0;
  min-width: 0;
  overflow: hidden;
}

/* 左侧：步骤指南区域 - 45% */
.guide-panel {
  flex: 0 0 45%;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border-right: 1px solid rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

/* 聊天消息容器：可独立滚动 */
.guide-container {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 24px;
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
}

.guide-container::-webkit-scrollbar {
  width: 8px;
}

.guide-container::-webkit-scrollbar-track {
  background: transparent;
}

.guide-container::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}

.guide-container::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
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
  word-wrap: break-word;
  word-break: break-word;
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.2);
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

/* 底部固定输入框 */
.input-container {
  flex-shrink: 0;
  min-height: 0;
  padding: 16px 24px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  background: #ffffff;
  z-index: 10;
}

/* 右侧：代码编辑器区域 - 55% */
.code-panel {
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: #1e293b;
  overflow: hidden;
}

/* 代码头部：固定 */
.code-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 16px;
  background: #0f172a;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  flex-shrink: 0;
  min-height: 0;
}

.code-tabs {
  display: flex;
  gap: 4px;
  overflow-x: auto;
  flex: 1;
  min-width: 0;
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
  transition: all 0.2s ease;
  white-space: nowrap;
  border-bottom: 2px solid transparent;
  position: relative;
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

.code-tab.generating {
  border-left: 2px solid #52c41a;
}

.code-tab.generating.active {
  border-left: 2px solid #52c41a;
  border-bottom-color: #52c41a;
}

.code-tab.complete {
  opacity: 0.8;
}

.tab-icon {
  font-size: 14px;
}

.tab-generating-indicator {
  display: inline-flex;
  align-items: center;
  margin-left: 4px;
  color: #52c41a;
}

.tab-complete-indicator {
  display: inline-flex;
  align-items: center;
  margin-left: 4px;
  color: #52c41a;
  font-size: 12px;
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
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.code-actions .ant-btn-link {
  color: rgba(255, 255, 255, 0.7);
  transition: color 0.2s ease;
  padding: 4px 8px;
}

.code-actions .ant-btn-link:hover {
  color: rgba(255, 255, 255, 0.9);
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

/* 代码和预览容器：重叠显示 */
.code-preview-container {
  flex: 1;
  min-height: 0;
  position: relative;
  overflow: hidden;
}

/* 代码内容区域：可滚动，绝对定位与预览重叠 */
.code-content {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  background: #1e293b;
  overflow: hidden;
  opacity: 1;
  transition: opacity 0.3s ease;
}

.code-content[style*="display: none"] {
  opacity: 0;
}

.code-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  min-height: 0;
  color: rgba(255, 255, 255, 0.5);
}

.code-editor {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.code-editor-header {
  flex-shrink: 0;
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

/* 代码块：独立滚动 */
.code-block {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: auto;
  margin: 0;
  padding: 20px;
  background: #1e293b;
  color: #e2e8f0;
  font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
  font-size: 13px;
  line-height: 1.6;
  scrollbar-width: thin;
  white-space: pre;
  word-wrap: normal;
  word-break: normal;
  scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
  white-space: pre;
  word-wrap: normal;
  word-break: normal;
}

.code-block::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.code-block::-webkit-scrollbar-track {
  background: transparent;
}

.code-block::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
}

.code-block::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

.code-block code {
  background: transparent;
  padding: 0;
  border: none;
  color: inherit;
  font-family: inherit;
  font-size: inherit;
  line-height: inherit;
  white-space: pre;
  word-wrap: normal;
  word-break: normal;
  display: block;
  width: 100%;
}

/* 预览区域：与代码重叠显示 */
.preview-section {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  overflow: hidden;
  opacity: 1;
  transition: opacity 0.3s ease;
  z-index: 2;
}

.preview-section[style*="display: none"],
.preview-section[style*="display:none"] {
  opacity: 0;
  pointer-events: none;
  z-index: 0;
}

.preview-header {
  flex-shrink: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f8f9fa;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  min-height: 44px;
}

.preview-loading {
  display: flex;
  align-items: center;
}

.preview-header h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
}

/* 预览内容：可滚动 */
.preview-content {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  background: #ffffff;
  position: relative;
  display: flex;
  flex-direction: column;
}

.preview-content::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.preview-content::-webkit-scrollbar-track {
  background: transparent;
}

.preview-content::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}

.preview-content::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}

.preview-iframe {
  width: 100%;
  height: 100%;
  min-height: 100%;
  border: none;
  display: block;
  background: #ffffff;
  flex: 1;
}

.preview-iframe[src=""] {
  display: none;
}

.preview-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  min-height: 0;
  background: #fafafa;
}

.empty-messages {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  min-height: 0;
}

/* 响应式布局 */
@media (max-width: 1024px) {
  .chat-content {
    flex-direction: column;
  }

  .guide-panel {
    flex: 0 0 50%;
    min-height: 0;
    border-right: none;
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  }

  .code-panel {
    flex: 0 0 50%;
    min-height: 0;
  }

  .preview-section {
    flex: 0 0 30%;
    min-height: 0;
  }
}

@media (max-width: 768px) {
  .guide-panel {
    flex: 0 0 60%;
    min-height: 0;
  }

  .code-panel {
    flex: 0 0 40%;
    min-height: 0;
  }

  .preview-section {
    display: none;
  }
}
</style>
