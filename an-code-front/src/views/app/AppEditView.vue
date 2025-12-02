<template>
  <div class="app-edit-view">
    <div class="page-header">
      <h2>{{ isAdmin ? '编辑应用' : '编辑我的应用' }}</h2>
      <a-button @click="handleCancel">返回</a-button>
    </div>

    <a-card :loading="loading">
      <a-form
        :model="formData"
        :rules="rules"
        :label-col="{ span: 4 }"
        :wrapper-col="{ span: 20 }"
        @finish="handleSubmit"
      >
        <a-form-item label="应用名称" name="appName">
          <a-input v-model:value="formData.appName" placeholder="请输入应用名称" />
        </a-form-item>

        <a-form-item label="应用封面" name="cover">
          <div class="cover-upload">
            <a-upload
              v-model:file-list="fileList"
              name="file"
              list-type="picture-card"
              :show-upload-list="true"
              :before-upload="beforeUpload"
              @preview="handlePreview"
              @remove="handleRemove"
            >
              <div v-if="fileList.length < 1">
                <plus-outlined />
                <div style="margin-top: 8px">上传封面</div>
              </div>
            </a-upload>
            <div v-if="formData.cover" class="cover-preview">
              <img :src="formData.cover" alt="封面预览" />
            </div>
          </div>
        </a-form-item>

        <a-form-item v-if="isAdmin" label="优先级" name="priority">
          <a-input-number
            v-model:value="formData.priority"
            :min="0"
            :max="99"
            placeholder="0-99，99为精选"
          />
          <span style="margin-left: 8px; color: #999">设置为 99 表示精选应用</span>
        </a-form-item>

        <a-form-item :wrapper-col="{ offset: 4, span: 20 }">
          <a-space>
            <a-button type="primary" html-type="submit" :loading="submitting">保存</a-button>
            <a-button @click="handleCancel">取消</a-button>
          </a-space>
        </a-form-item>
      </a-form>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { PlusOutlined } from '@ant-design/icons-vue'
import type { UploadProps } from 'ant-design-vue'
import { getMyApp, updateMyApp, adminGetDetail, adminUpdate } from '@/api/appController'
import { useCounterStore } from '@/stores/counter'
import { convertIdToString } from '@/utils/idConverter'
import type { AppVO } from '@/api/typings'

const route = useRoute()
const router = useRouter()
const userStore = useCounterStore()

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
const isAdmin = computed(() => userStore.loginUser?.userRole === 'admin')

const loading = ref(false)
const submitting = ref(false)

const formData = ref({
  appName: '',
  cover: '',
  priority: 0,
})

const fileList = ref<any[]>([])

const rules = {
  appName: [{ required: true, message: '请输入应用名称', trigger: 'blur' }],
}

// 加载应用信息
const loadAppInfo = async () => {
  if (!appId.value || appId.value === 0) {
    message.error('应用ID无效')
    router.push('/')
    return
  }

  try {
    loading.value = true
    let response

    if (isAdmin.value) {
      response = await adminGetDetail({ id: convertIdToString(appId.value) as any })
    } else {
      response = await getMyApp({ id: convertIdToString(appId.value) as any })
    }

    if (response.data?.code === 0 && response.data?.data) {
      const app = response.data.data
      formData.value = {
        appName: app.appName || '',
        cover: app.cover || '',
        priority: app.priority || 0,
      }

      // 如果有封面，添加到文件列表
      if (app.cover) {
        fileList.value = [
          {
            uid: '-1',
            name: 'cover',
            status: 'done',
            url: app.cover,
          },
        ]
      }
    } else {
      message.error('加载应用信息失败')
      router.back()
    }
  } catch (error) {
    message.error('加载应用信息失败')
    router.back()
  } finally {
    loading.value = false
  }
}

// 上传前处理
const beforeUpload: UploadProps['beforeUpload'] = (file) => {
  const isImage = file.type.startsWith('image/')
  if (!isImage) {
    message.error('只能上传图片文件')
    return false
  }

  const isLt2M = file.size / 1024 / 1024 < 2
  if (!isLt2M) {
    message.error('图片大小不能超过 2MB')
    return false
  }

  // 读取文件并转换为 base64
  const reader = new FileReader()
  reader.readAsDataURL(file)
  reader.onload = () => {
    formData.value.cover = reader.result as string
  }

  return false // 阻止自动上传
}

// 预览
const handlePreview = (file: any) => {
  if (file.url) {
    window.open(file.url, '_blank')
  }
}

// 移除
const handleRemove = () => {
  formData.value.cover = ''
  fileList.value = []
}

// 提交
const handleSubmit = async () => {
  if (!appId.value || appId.value === 0) {
    message.error('应用ID无效')
    return
  }

  try {
    submitting.value = true
    let response

    if (isAdmin.value) {
      response = await adminUpdate({
        id: convertIdToString(appId.value) as any,
        appName: formData.value.appName,
        cover: formData.value.cover,
        priority: formData.value.priority,
      })
    } else {
      response = await updateMyApp({
        id: convertIdToString(appId.value) as any,
        appName: formData.value.appName,
        cover: formData.value.cover,
      })
    }

    if (response.data?.code === 0) {
      message.success('保存成功')
      router.back()
    } else {
      message.error(response.data?.message || '保存失败')
    }
  } catch (error) {
    message.error('保存失败，请稍后再试')
  } finally {
    submitting.value = false
  }
}

// 取消
const handleCancel = () => {
  router.back()
}

onMounted(() => {
  loadAppInfo()
})
</script>

<style scoped>
.app-edit-view {
  padding: 24px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.cover-upload {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.cover-preview {
  width: 200px;
  height: 200px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  overflow: hidden;
}

.cover-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>

