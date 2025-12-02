<template>
  <div class="admin-app-manage">
    <div class="page-header">
      <h2>应用管理</h2>
      <a-input-search
        v-model:value="searchKeyword"
        placeholder="搜索应用名称、ID等"
        style="width: 300px"
        @search="handleSearch"
      />
    </div>

    <a-table
      :columns="columns"
      :data-source="appList"
      :loading="loading"
      :pagination="pagination"
      row-key="id"
      @change="handleTableChange"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'cover'">
          <img
            v-if="record.cover"
            :src="record.cover"
            alt="封面"
            style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px"
            @error="handleImageError"
          />
          <span v-else style="color: #999">暂无封面</span>
        </template>
        <template v-else-if="column.key === 'priority'">
          <a-tag :color="record.priority === 99 ? 'red' : 'default'">
            {{ record.priority === 99 ? '精选' : '普通' }}
          </a-tag>
        </template>
        <template v-else-if="column.key === 'action'">
          <a-space>
            <a-button type="link" size="small" @click="handleEdit(record)">编辑</a-button>
            <a-button
              type="link"
              size="small"
              :danger="record.priority !== 99"
              @click="handleToggleFeatured(record)"
            >
              {{ record.priority === 99 ? '取消精选' : '设为精选' }}
            </a-button>
            <a-popconfirm
              title="确定要删除这个应用吗？"
              ok-text="确定"
              cancel-text="取消"
              @confirm="handleDelete(record)"
            >
              <a-button type="link" size="small" danger>删除</a-button>
            </a-popconfirm>
          </a-space>
        </template>
      </template>
    </a-table>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { useRouter } from 'vue-router'
import { adminPage, adminDelete, adminUpdate } from '@/api/appController'
import { convertIdToString } from '@/utils/idConverter'
import type { AppVO, AppAdminPageRequest } from '@/api/typings'
import type { TableColumnsType } from 'ant-design-vue'

const router = useRouter()

const appList = ref<AppVO[]>([])
const loading = ref(false)
const searchKeyword = ref('')

// 分页配置
const pagination = ref({
  current: 1,
  pageSize: 20,
  total: 0,
  showSizeChanger: true,
  showTotal: (total: number) => `共 ${total} 条`,
})

// 表格列定义
const columns: TableColumnsType = [
  {
    title: 'ID',
    dataIndex: 'id',
    key: 'id',
    width: 80,
  },
  {
    title: '应用名称',
    dataIndex: 'appName',
    key: 'appName',
    width: 200,
  },
  {
    title: '封面',
    key: 'cover',
    width: 100,
  },
  {
    title: '类型',
    dataIndex: 'codeGenType',
    key: 'codeGenType',
    width: 100,
  },
  {
    title: '优先级',
    key: 'priority',
    width: 100,
  },
  {
    title: '创建时间',
    dataIndex: 'createTime',
    key: 'createTime',
    width: 180,
  },
  {
    title: '操作',
    key: 'action',
    width: 200,
    fixed: 'right',
  },
]

// 加载应用列表
const loadAppList = async () => {
  try {
    loading.value = true
    const params: AppAdminPageRequest = {
      pageNum: pagination.value.current,
      pageSize: pagination.value.pageSize,
    }

    // 添加搜索条件
    if (searchKeyword.value.trim()) {
      const keyword = searchKeyword.value.trim()
      // 尝试解析为数字（ID）
      const id = Number(keyword)
      if (!isNaN(id) && id > 0) {
        // 将 ID 转换为字符串以避免精度丢失
        params.id = convertIdToString(id) as any
      } else {
        params.appName = keyword
      }
    }

    const response = await adminPage(params)

    if (response.data?.code === 0 && response.data?.data) {
      appList.value = response.data.data.records || []
      pagination.value.total = response.data.data.totalRow || 0
    } else {
      message.error(response.data?.message || '加载应用列表失败')
    }
  } catch (error) {
    message.error('加载应用列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pagination.value.current = 1
  loadAppList()
}

// 表格变化
const handleTableChange = (pag: any) => {
  pagination.value.current = pag.current
  pagination.value.pageSize = pag.pageSize
  loadAppList()
}

// 编辑
const handleEdit = (record: AppVO) => {
  if (!record.id) {
    message.error('应用ID无效')
    return
  }
  router.push(`/app/edit/${record.id}`)
}

// 切换精选
const handleToggleFeatured = async (record: AppVO) => {
  if (!record.id) {
    message.error('应用ID无效')
    return
  }
  try {
    const newPriority = record.priority === 99 ? 0 : 99
    const response = await adminUpdate({
      id: convertIdToString(record.id) as any,
      priority: newPriority,
    })

    if (response.data?.code === 0) {
      message.success(newPriority === 99 ? '已设为精选' : '已取消精选')
      loadAppList()
    } else {
      message.error(response.data?.message || '操作失败')
    }
  } catch (error) {
    message.error('操作失败，请稍后再试')
  }
}

// 删除
const handleDelete = async (record: AppVO) => {
  if (!record.id) {
    message.error('应用ID无效')
    return
  }
  try {
    const response = await adminDelete({
      id: convertIdToString(record.id) as any,
    })

    if (response.data?.code === 0) {
      message.success('删除成功')
      loadAppList()
    } else {
      message.error(response.data?.message || '删除失败')
    }
  } catch (error) {
    message.error('删除失败，请稍后再试')
  }
}

// 图片加载错误
const handleImageError = (e: Event) => {
  const img = e.target as HTMLImageElement
  img.style.display = 'none'
}

onMounted(() => {
  loadAppList()
})
</script>

<style scoped>
.admin-app-manage {
  padding: 24px;
  background: #ffffff;
  border-radius: 8px;
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
</style>

