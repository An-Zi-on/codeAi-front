import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { UserVo } from '../type/types.ts'
import { current,loginOut} from '../api/userController.ts'

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

  async function logOut() {
    const response = await loginOut()
    try {
      if (response.data?.code === 0) {
        loading.value = true;
        loginUser.value = null
      }else{
       loading.value = false
      }
    }catch(error) {
      loading.value = false
    }
  }

  return { loginUser, loading, updateCurrentUser, logOut }
})
