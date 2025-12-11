<template>
  <div class="home-view">
    <div class="gradient-bg"></div>
    <div class="home-container">
      <section class="hero-section">
        <div class="hero-text">
          <p class="hero-eyebrow">AI·NoCode·极速创造</p>
          <h1>一句话 呈所想</h1>
          <p class="hero-subtitle">与 AI 对话，轻松创建应用和网站</p>
        </div>

        <div class="hero-input">
          <div class="hero-window">
            <div class="window-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <div class="hero-textarea-wrapper">
              <a-textarea
                v-model:value="promptText"
                :auto-size="{ minRows: 3, maxRows: 3 }"
                :bordered="false"
                class="hero-textarea"
                @press-enter="handleCreateApp"
              />
              <div class="hero-placeholder" v-if="!promptText">
                <span>{{ displayPrompt }}</span>
                <span class="cursor"></span>
              </div>
              <button class="floating-send" @click="handleCreateApp">
                <SendOutlined />
              </button>
            </div>
            <div class="hero-suggestions">
              <span v-for="prompt in typewriterPrompts" :key="prompt" @click="handleQuickPrompt(prompt)">
                {{ prompt.slice(0, 12) }}...
              </span>
            </div>
          </div>
          <div class="input-actions">
            <a-select
              v-model:value="codeGenType"
              class="gen-type-select"
              size="large"
              :options="genTypeOptions"
            />
            <a-upload :show-upload-list="false">
              <a-button class="ghost-btn">
                <template #icon>
                  <CloudUploadOutlined />
                </template>
                上传
              </a-button>
            </a-upload>
            <a-button class="ghost-btn" :loading="creating" @click="handleCreateApp">
              创建
            </a-button>
          </div>
        </div>

        <div class="quick-tags">
          <a-tag
            v-for="tag in quickTags"
            :key="tag"
            class="quick-tag"
            @click="handleQuickPrompt(tag)"
          >
            {{ tag }}
          </a-tag>
        </div>
      </section>

      <section class="works-section">
        <div class="section-header">
          <div>
            <p class="section-eyebrow">MY WORKS</p>
            <h2>我的作品</h2>
          </div>
          <a-button class="ghost-btn" size="small" @click="handleTabChange('my')">查看全部</a-button>
        </div>
        <div class="works-grid">
          <div
            v-for="work in showcaseWorks"
            :key="work.id"
            class="work-card"
            @click="handleViewChat(work.id!)"
          >
            <div class="work-thumb">
              <img v-if="work.cover" :src="work.cover" :alt="work.appName" @error="handleImageError" />
              <div v-else class="thumb-placeholder">
                <span>{{ work.appName?.charAt(0)?.toUpperCase() || 'A' }}</span>
              </div>
            </div>
            <div class="work-body">
              <h3>{{ work.appName || '未命名作品' }}</h3>
              <p>{{ work.initPrompt || '暂无简介，请通过与 AI 对话完善需求。' }}</p>
            </div>
          </div>
          <div v-if="showcaseWorks.length === 0" class="empty-tip">
            暂无作品，先创建一个吧
          </div>
        </div>
      </section>

      <section class="cases-section">
        <div class="section-header">
          <div>
            <p class="section-eyebrow">SHOWCASE</p>
            <h2>案例广场</h2>
          </div>
          <a-button class="ghost-btn" size="small" @click="handleTabChange('featured')">查看更多</a-button>
        </div>
        <div class="cases-grid">
          <div
            v-for="app in featuredAppsList"
            :key="app.id"
            class="case-card"
            @click="handleViewChat(app.id!)"
          >
            <div class="case-thumb">
              <img v-if="app.cover" :src="app.cover" :alt="app.appName" @error="handleImageError" />
              <div v-else class="thumb-placeholder">
                <span>{{ app.appName?.charAt(0)?.toUpperCase() || 'A' }}</span>
              </div>
            </div>
            <div class="case-body">
              <div class="case-tag">{{ app.codeGenType?.toUpperCase() || 'APP' }}</div>
              <h3>{{ app.appName || '未命名案例' }}</h3>
              <p>{{ app.initPrompt || '通过 AI 智能生成的案例，快速构建您需要的业务场景。' }}</p>
            </div>
          </div>
          <div v-if="featuredAppsList.length === 0" class="empty-tip">
            暂无案例，稍后再试
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { message } from 'ant-design-vue'
import { CloudUploadOutlined, SendOutlined } from '@ant-design/icons-vue'
import { useRouter } from 'vue-router'
import { createApp, pageMyApps, pageFeaturedApps, deleteMyApp } from '../api/appController'
import { convertIdToString } from '@/utils/idConverter'
import type { AppVO } from '@/api/typings'

const router = useRouter()

// 提示词输入
const promptText = ref('')
const creating = ref(false)

// 生成类型选择
const codeGenType = ref('multi_file')
const genTypeOptions = [
  { label: '多文件', value: 'multi_file' },
  { label: '单文件', value: 'html' },
]

// 快捷提示词
const quickPrompts = ref([
  {
    icon: '📝',
    title: '个人博客网站',
    desc: '创建一个现代化的个人博客网站，包含文章列表、分类标签、搜索功能、响应式设计，支持 Markdown 格式的文章编辑和展示。',
    text: '帮我创建一个现代化的个人博客网站，需要包含以下功能：1. 文章列表展示页面，支持分页和分类筛选；2. 文章详情页面，支持 Markdown 格式渲染；3. 文章搜索功能；4. 响应式设计，适配手机和电脑；5. 简洁美观的 UI 设计，使用现代化的配色方案。',
  },
  {
    icon: '🛒',
    title: '电商产品展示',
    desc: '创建一个电商产品展示网站，包含产品列表、详情页、购物车、用户中心等功能，界面美观易用。',
    text: '帮我创建一个电商产品展示网站，需要包含以下功能：1. 产品列表页面，支持分类筛选和搜索；2. 产品详情页面，展示产品图片、价格、描述等信息；3. 购物车功能，可以添加和删除商品；4. 用户中心页面；5. 响应式设计，适配各种设备；6. 使用现代化的 UI 设计风格。',
  },
  {
    icon: '📊',
    title: '数据可视化仪表盘',
    desc: '创建一个数据可视化仪表盘，包含多种图表类型、数据筛选、实时更新等功能，适合展示业务数据。',
    text: '帮我创建一个数据可视化仪表盘，需要包含以下功能：1. 多种图表类型（折线图、柱状图、饼图等）；2. 数据筛选和日期范围选择；3. 实时数据更新；4. 响应式布局；5. 现代化的设计风格，使用渐变色和阴影效果；6. 数据导出功能。',
  },
  {
    icon: '📅',
    title: '任务管理工具',
    desc: '创建一个任务管理工具，支持任务创建、编辑、删除、状态切换、优先级设置等功能，帮助提高工作效率。',
    text: '帮我创建一个任务管理工具，需要包含以下功能：1. 任务列表展示，支持按状态、优先级筛选；2. 任务创建和编辑功能；3. 任务状态切换（待办、进行中、已完成）；4. 任务优先级设置；5. 任务搜索功能；6. 响应式设计，支持移动端使用；7. 简洁直观的 UI 界面。',
  },
])

const quickTags = ref(['博客/作品集', '企业网站', 'Landing Page', 'SaaS 控制台', '活动专题', '小程序'])

const typewriterPrompts = [
  '使用 NoCode 创建一个数据分析看板，用来分析运营指标和转化趋势……',
  '帮我生成一个极简风格的作品集网站，包含首页、关于我、案例模块……',
  '想要一个 SaaS 控制台，支持团队成员管理、权限设置和实时图表……',
  '设计一个活动落地页，带有报名表单、倒计时和社交分享功能……',
]
const displayPrompt = ref('')
let typewriterTimer: number | null = null
let promptIndex = 0
let typingIndex = 0
let deleting = false
let pauseFrames = 0

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

const showcaseWorks = computed<AppVO[]>(() => myAppsList.value.slice(0, 4))

const startTypewriter = () => {
  stopTypewriter()
  typewriterTimer = window.setInterval(() => {
    const current = typewriterPrompts[promptIndex] || ''
    if (!deleting) {
      if (typingIndex < current.length) {
        displayPrompt.value += current.charAt(typingIndex)
        typingIndex++
      } else {
        pauseFrames++
        if (pauseFrames > 18) {
          deleting = true
          pauseFrames = 0
        }
      }
    } else {
      if (typingIndex > 0) {
        displayPrompt.value = displayPrompt.value.slice(0, -1)
        typingIndex--
      } else {
        deleting = false
        promptIndex = (promptIndex + 1) % typewriterPrompts.length
      }
    }
  }, 120)
}

const stopTypewriter = () => {
  if (typewriterTimer) {
    clearInterval(typewriterTimer)
    typewriterTimer = null
  }
}

// 快捷提示词
const handleQuickPrompt = (text: string) => {
  promptText.value = text
}

// 创建应用
const handleCreateApp = async () => {
  if (!promptText.value.trim()) {
    message.warning('请输入应用描述')
    return
  }

  try {
    creating.value = true
    const initPrompt = promptText.value.trim()
    
    // 创建应用
    const response = await createApp({
      initPrompt,
      codeGenType: codeGenType.value,
    })

    if (response.data?.code === 0 && response.data?.data) {
      const appId = response.data.data
      message.success('应用创建成功')
      promptText.value = ''
      // 跳转到对话页面，代码生成将在ChatView页面自动触发
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
  if (key === 'featured') {
    loadFeaturedApps()
  } else {
    loadMyApps()
  }
}

// 查看对话
const handleViewChat = (appId: number) => {
  router.push(`/app/chat/${appId}`)
}

const handleImageError = (e: Event) => {
  const target = e.target as HTMLImageElement
  if (target) {
    target.style.display = 'none'
  }
}

// 编辑应用
const handleEditApp = (appId: number) => {
  router.push(`/app/edit/${appId}`)
}

// 删除应用
const handleDeleteApp = async (appId: number) => {
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

onMounted(() => {
  loadMyApps()
  loadFeaturedApps()
  startTypewriter()
})

onUnmounted(() => {
  stopTypewriter()
})
</script>

<style scoped>
.home-view {
  position: relative;
  width: 100%;
  min-height: 100%;
  overflow: hidden;
  font-family: 'Poppins', 'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
}

.gradient-bg {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 10% 10%, rgba(255, 255, 255, 0.35), transparent 45%),
    radial-gradient(circle at 80% 0%, rgba(93, 173, 255, 0.35), transparent 35%),
    linear-gradient(135deg, #c0d9ff 0%, #6ba6ff 35%, #2667ff 70%, #0f1d7a 100%);
  animation: slowShift 20s ease infinite alternate;
}

@keyframes slowShift {
  from {
    transform: scale(1);
  }
  to {
    transform: scale(1.1);
  }
}

.home-container {
  position: relative;
  max-width: 1200px;
  margin: 0 auto;
  padding: 48px 24px 80px;
  color: #0f172a;
}

.hero-section {
  text-align: center;
  padding: 40px 0 48px;
  color: white;
}

.hero-text .hero-eyebrow {
  font-size: 14px;
  letter-spacing: 0.4em;
  text-transform: uppercase;
  opacity: 0.8;
  margin-bottom: 16px;
}

.hero-text h1 {
  font-size: clamp(36px, 5vw, 64px);
  font-weight: 700;
  margin: 0;
}

.hero-subtitle {
  font-size: 18px;
  opacity: 0.9;
  margin-top: 12px;
}

.hero-input {
  max-width: 760px;
  margin: 32px auto 16px;
}

.hero-window {
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 30px 80px rgba(15, 23, 42, 0.16);
  padding: 24px 24px 16px;
  border: 1px solid rgba(255, 255, 255, 0.8);
}

.window-dots {
  display: flex;
  gap: 8px;
  margin-bottom: 18px;
}

.window-dots span {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: rgba(15, 23, 42, 0.1);
}

.hero-textarea-wrapper {
  position: relative;
  border-radius: 20px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: white;
  box-shadow: inset 0 1px 3px rgba(15, 23, 42, 0.08);
}

.hero-textarea {
  font-size: 16px;
  line-height: 1.7;
  padding: 20px 60px 20px 24px;
  min-height: 140px;
}

.hero-textarea :deep(.ant-input) {
  border-radius: 20px;
}

.hero-placeholder {
  position: absolute;
  inset: 0;
  padding: 20px 60px 20px 24px;
  pointer-events: none;
  color: rgba(15, 23, 42, 0.4);
  font-size: 16px;
  line-height: 1.7;
  white-space: pre-wrap;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.cursor {
  width: 2px;
  height: 20px;
  background: rgba(15, 23, 42, 0.6);
  margin-left: 4px;
  animation: blink 1s step-end infinite;
}

@keyframes blink {
  50% {
    opacity: 0;
  }
}

.floating-send {
  position: absolute;
  right: 16px;
  bottom: 16px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: linear-gradient(135deg, #6ba6ff, #2667ff);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 12px 24px rgba(38, 103, 255, 0.35);
  cursor: pointer;
  transition: transform 0.2s;
}

.floating-send:hover {
  transform: translateY(-2px);
}

.hero-suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 16px;
}

.hero-suggestions span {
  padding: 4px 14px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.06);
  font-size: 13px;
  color: rgba(15, 23, 42, 0.7);
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}

.hero-suggestions span:hover {
  background: rgba(15, 23, 42, 0.1);
  color: #0f172a;
}

.input-actions {
  display: flex;
  gap: 12px;
  margin-top: 16px;
  justify-content: center;
  align-items: center;
}

.gen-type-select {
  min-width: 120px;
}

.gen-type-select :deep(.ant-select-selector) {
  border-radius: 999px;
  border: 1px solid rgba(38, 103, 255, 0.5);
  background: transparent;
  color: #0f1d7a;
  height: 40px;
  display: flex;
  align-items: center;
}

.gen-type-select :deep(.ant-select-selector:hover) {
  border-color: rgba(38, 103, 255, 0.7);
}

.gen-type-select :deep(.ant-select-selection-item) {
  color: #0f1d7a;
  line-height: 38px;
}

.gen-type-select :deep(.ant-select-arrow) {
  color: #0f1d7a;
}

.gen-type-select :deep(.ant-select-focused .ant-select-selector) {
  border-color: rgba(38, 103, 255, 0.8);
  box-shadow: 0 0 0 2px rgba(38, 103, 255, 0.1);
}

.ghost-btn {
  border-radius: 999px;
  border: 1px solid rgba(38, 103, 255, 0.5);
  background: transparent;
  color: #0f1d7a;
  padding: 0 24px;
  height: 40px;
  transition: all 0.2s;
}

.ghost-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(38, 103, 255, 0.7);
  color: #2667ff;
}

.quick-tags {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
  margin-top: 20px;
}

.quick-tag {
  border-radius: 999px;
  padding: 6px 18px;
  border: 1px solid rgba(255, 255, 255, 0.8);
  background: rgba(255, 255, 255, 0.15);
  color: white;
  cursor: pointer;
  transition: background 0.2s, transform 0.2s;
}

.quick-tag:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
}

.works-section,
.cases-section {
  margin-top: 48px;
  padding: 32px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 40px 80px rgba(15, 23, 42, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.6);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.section-eyebrow {
  font-size: 12px;
  letter-spacing: 0.3em;
  color: rgba(15, 23, 42, 0.5);
  margin-bottom: 8px;
}

.section-header h2 {
  margin: 0;
  font-size: 28px;
  color: #0f172a;
}

.works-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 20px;
}

.work-card {
  background: white;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.08);
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  display: flex;
  flex-direction: column;
}

.work-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 18px 36px rgba(15, 23, 42, 0.16);
}

.work-thumb {
  height: 150px;
  background: linear-gradient(135deg, #dfe9ff, #b7c9ff);
  border-bottom: 1px solid rgba(15, 23, 42, 0.06);
}

.work-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumb-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 42px;
  color: white;
  background: linear-gradient(135deg, #6ba6ff, #2667ff);
}

.work-body {
  padding: 18px;
}

.work-body h3 {
  margin: 0 0 8px;
  font-size: 18px;
  color: #0f172a;
}

.work-body p {
  margin: 0;
  font-size: 13px;
  color: rgba(15, 23, 42, 0.7);
  line-height: 1.6;
}

.cases-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 24px;
}

.case-card {
  background: white;
  border-radius: 20px;
  box-shadow: 0 15px 30px rgba(15, 23, 42, 0.08);
  border: 1px solid rgba(15, 23, 42, 0.06);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  display: flex;
  flex-direction: column;
  gap: 16px;
  cursor: pointer;
  overflow: hidden;
  height: 100%;
}

.case-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.15);
}

.case-card:active {
  transform: translateY(-2px);
}

.case-card:active {
  transform: translateY(-2px);
}

.case-thumb {
  width: 100%;
  aspect-ratio: 16 / 9;
  background: linear-gradient(135deg, #e2e8ff, #c9d4ff);
}

.case-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.case-body {
  padding: 16px 20px 24px;
}

.case-tag {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 999px;
  background: rgba(38, 103, 255, 0.1);
  color: #2667ff;
  font-size: 12px;
  letter-spacing: 0.1em;
}

.case-body h3 {
  margin: 12px 0 8px;
  font-size: 18px;
  color: #0f172a;
}

.case-body p {
  margin: 0;
  color: rgba(15, 23, 42, 0.65);
  font-size: 13px;
  line-height: 1.6;
}

.empty-tip {
  grid-column: 1 / -1;
  text-align: center;
  padding: 32px;
  color: rgba(15, 23, 42, 0.5);
}

@media (max-width: 1024px) {
  .works-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .cases-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .home-container {
    padding: 32px 16px 60px;
  }

  .input-actions {
    flex-direction: column;
    gap: 8px;
  }

  .gen-type-select {
    width: 100%;
    min-width: 100%;
  }

  .works-grid,
  .cases-grid {
    grid-template-columns: 1fr;
  }

  .hero-window {
    padding: 20px 20px 12px;
  }

  .hero-textarea {
    padding: 16px 50px 16px 20px;
    font-size: 14px;
  }

  .hero-placeholder {
    padding: 16px 50px 16px 20px;
    font-size: 14px;
  }
}
</style>
