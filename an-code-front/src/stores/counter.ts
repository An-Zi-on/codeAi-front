import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { UserVo } from '@/type/types'
import { current } from '@/api/userController'

export const useCounterStore = defineStore('currentUser', () => {
  const loginUser = ref<UserVo | null>(null)
  const loading = ref(false)

  async function updateCurrentUser() {
    try {
      loading.value = true
      const response = await current()
      if (response.data?.code === 0 && response.data?.data) {
        loginUser.value = response.data.data
      } else {
        loginUser.value = null
      }
    } catch (error) {
      loginUser.value = null
      throw error
    } finally {
      loading.value = false
    }
  }

  function resetCurrentUser() {
    loginUser.value = null
  }

  return { loginUser, loading, updateCurrentUser, resetCurrentUser }
})