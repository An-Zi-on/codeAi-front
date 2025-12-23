<template>
  <div class="home-view">
    <div class="gradient-bg"></div>
    <div class="home-container">
      <section class="hero-section">
        <div class="hero-text">
          <h1>AI 应用生成平台</h1>
          <p class="hero-subtitle">一句话轻松创建网站应用</p>
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
                placeholder="帮我创建个人博客网站"
                @press-enter="handleCreateApp"
              />
              <button class="floating-send" @click="handleCreateApp">
                <SendOutlined />
              </button>
            </div>
          </div>
          <div class="input-actions">
            <a-select
              v-model:value="codeGenType"
              class="gen-type-select"
              size="large"
              :options="genTypeOptions"
            />
            <a-button class="ghost-btn" :loading="creating" @click="handleCreateApp">
              创建
            </a-button>
          </div>
        </div>

        <div class="quick-prompts">
          <div
            v-for="prompt in quickPrompts"
            :key="prompt.title"
            class="quick-prompt-card"
            @click="handleQuickPrompt(prompt.text)"
          >
            <div class="prompt-icon">{{ prompt.icon }}</div>
            <div class="prompt-content">
              <h3 class="prompt-title">{{ prompt.title }}</h3>
              <p class="prompt-desc">{{ prompt.desc }}</p>
            </div>
          </div>
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
              <p class="line-clamp-2">{{ work.initPrompt || '暂无简介，请通过与 AI 对话完善需求。' }}</p>
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
              <p class="line-clamp-3">{{ app.initPrompt || '通过 AI 智能生成的案例，快速构建您需要的业务场景。' }}</p>
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
    text: '帮我创建一个现代化的个人博客网站，需要包含以下功能：1. 文章列表展示页面，支持分页和分类筛选，每篇文章显示标题、摘要、发布时间和阅读量；2. 文章详情页面，支持 Markdown 格式渲染，包含代码高亮、图片展示、目录导航；3. 文章搜索功能，支持关键词搜索和标签筛选；4. 响应式设计，完美适配手机、平板和电脑；5. 简洁美观的 UI 设计，使用现代化的配色方案，支持深色模式切换。',
  },
  {
    icon: '🛒',
    title: '电商产品展示',
    desc: '创建一个电商产品展示网站，包含产品列表、详情页、购物车、用户中心等功能，界面美观易用。',
    text: '帮我创建一个电商产品展示网站，需要包含以下功能：1. 产品列表页面，支持分类筛选、价格排序和关键词搜索，展示产品缩略图、名称、价格和评分；2. 产品详情页面，展示多张产品图片、详细描述、规格选择、库存状态和用户评价；3. 购物车功能，可以添加、删除、修改商品数量和批量结算；4. 用户中心页面，包含订单管理、收货地址和个人信息；5. 响应式设计，适配各种设备；6. 使用现代化的 UI 设计风格，包含动画效果和交互反馈。',
  },
  {
    icon: '📊',
    title: '企业官网展示',
    desc: '创建一个专业的企业官网，包含首页、关于我们、产品服务、新闻动态、联系我们等模块，展现企业形象。',
    text: '帮我创建一个专业的企业官网，需要包含以下功能：1. 首页轮播图展示，包含企业介绍、核心产品和服务亮点；2. 关于我们页面，介绍公司历史、团队文化和企业愿景；3. 产品服务页面，分类展示产品详情和服务内容，支持在线咨询；4. 新闻动态页面，展示企业新闻、行业资讯和活动公告；5. 联系我们页面，包含公司地址、联系方式、在线留言表单和地图定位；6. 响应式设计，适配各种设备；7. 使用专业大气的设计风格，突出企业品牌形象。',
  },
  {
    icon: '🎨',
    title: '作品集展示网站',
    desc: '创建一个精美的作品集展示网站，适合设计师、摄影师、开发者等展示个人作品和技能。',
    text: '帮我创建一个精美的作品集展示网站，需要包含以下功能：1. 首页展示个人简介、技能标签和精选作品预览；2. 作品展示页面，支持分类筛选（如UI设计、摄影、开发项目等），每个作品包含多张图片、项目描述和技术栈；3. 关于我页面，展示个人经历、教育背景、专业技能和联系方式；4. 博客/文章页面，分享设计思考、技术心得或行业见解；5. 联系表单，方便访客留言和合作咨询；6. 响应式设计，完美适配各种设备；7. 使用现代化、简洁的设计风格，突出作品展示效果，支持图片懒加载和动画过渡。',
  },
])

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
    router.push('/works')
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
  width: 100%;
  background: 
    radial-gradient(circle at 20% 30%, rgba(59, 130, 246, 0.4), transparent 50%),
    radial-gradient(circle at 80% 70%, rgba(37, 99, 235, 0.4), transparent 50%),
    radial-gradient(circle at 50% 50%, rgba(29, 78, 216, 0.3), transparent 60%),
    linear-gradient(135deg, #3b82f6 0%, #2563eb 25%, #1d4ed8 50%, #1e40af 75%, #1e3a8a 100%);
  background-size: 200% 200%;
  animation: gradientShift 15s ease infinite;
}

@keyframes gradientShift {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
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
  padding: 60px 0 80px;
  color: white;
}

.hero-text {
  background: transparent;
  padding: 0;
  margin-bottom: 48px;
}

.hero-text h1 {
  font-size: clamp(42px, 6vw, 72px);
  font-weight: 800;
  margin: 0 0 16px;
  background: linear-gradient(135deg, #ffffff 0%, #e0e7ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 4px 20px rgba(255, 255, 255, 0.3);
}

.hero-subtitle {
  font-size: clamp(18px, 2.5vw, 24px);
  opacity: 0.95;
  margin: 0;
  font-weight: 400;
  letter-spacing: 0.5px;
}

.hero-input {
  max-width: 760px;
  margin: 32px auto 16px;
}

.hero-window {
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.5);
  padding: 20px;
  border: none;
  backdrop-filter: blur(10px);
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
  border-radius: 16px;
  border: none;
  background: transparent;
  box-shadow: none;
}

.hero-textarea {
  font-size: 16px;
  line-height: 1.7;
  padding: 20px 60px 20px 20px;
  min-height: 120px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 16px;
  border: 1px solid rgba(15, 23, 42, 0.1);
  transition: all 0.3s ease;
}

.hero-textarea:hover {
  background: rgba(255, 255, 255, 0.95);
  border-color: rgba(99, 102, 241, 0.3);
}

.hero-textarea:focus-within {
  background: rgba(255, 255, 255, 1);
  border-color: rgba(99, 102, 241, 0.5);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.hero-textarea :deep(.ant-input) {
  border: none;
  background: transparent;
  box-shadow: none;
}

.hero-textarea :deep(.ant-input::placeholder) {
  color: rgba(15, 23, 42, 0.4);
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

.quick-prompts {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  margin-top: 40px;
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
}

.quick-prompt-card {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 24px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.2);
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.quick-prompt-card:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
  border-color: rgba(255, 255, 255, 0.4);
}

.prompt-icon {
  font-size: 32px;
  flex-shrink: 0;
  line-height: 1;
}

.prompt-content {
  flex: 1;
}

.prompt-title {
  font-size: 18px;
  font-weight: 600;
  color: white;
  margin: 0 0 8px;
}

.prompt-desc {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.85);
  margin: 0;
  line-height: 1.6;
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

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
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
    padding: 16px;
  }

  .hero-textarea {
    padding: 16px 50px 16px 16px;
    font-size: 14px;
  }

  .quick-prompts {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}
</style>
