<template>
  <div class="auth-page login-page">
    <div class="auth-left">
      <div class="hero-copy">
        <p class="eyebrow">AN-CODE PLATFORM</p>
        <h1>一站式智能代码生成平台</h1>
        <p class="description">
          通过可视化配置与智能化提示，帮助你在几分钟内构建高质量的业务应用，敏捷迭代、快速上线。
        </p>
      </div>
    </div>
    <div class="auth-right">
      <a-card class="auth-card" :bordered="false">
        <h2>欢迎回来</h2>
        <p class="subtitle">登录账户，继续你的创作之旅</p>
        <a-form
          ref="formRef"
          :model="formState"
          :rules="rules"
          layout="vertical"
          @finish="handleSubmit"
        >
          <a-form-item label="登录账号" name="userAccount">
            <a-input
              v-model:value="formState.userAccount"
              size="large"
              placeholder="请输入账号"
              allow-clear
            />
          </a-form-item>

          <a-form-item label="登录密码" name="userPassword">
            <a-input-password
              v-model:value="formState.userPassword"
              size="large"
              placeholder="请输入密码"
              allow-clear
            />
          </a-form-item>

          <a-form-item>
            <a-button
              size="large"
              type="primary"
              html-type="submit"
              block
              :loading="submitting"
            >
              立即登录
            </a-button>
          </a-form-item>
        </a-form>

        <div class="auth-extra">
          <span>还没有账号？</span>
          <a-button type="link" size="small" @click="goRegister">前往注册</a-button>
        </div>
      </a-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import type { FormInstance, Rule } from 'ant-design-vue/es/form'
import { message } from 'ant-design-vue'
import { useRouter } from 'vue-router'
import { login } from '@/api/userController'
import { useCounterStore } from '@/stores/counter'

const router = useRouter()
const userStore = useCounterStore()

const formRef = ref<FormInstance>()
const submitting = ref(false)
const formState = reactive({
  userAccount: '',
  userPassword: '',
})

const rules: Record<string, Rule[]> = {
  userAccount: [
    { required: true, message: '请输入账号' },
    { min: 4, message: '账号不少于 4 位字符' },
  ],
  userPassword: [
    { required: true, message: '请输入密码' },
    { min: 6, message: '密码不少于 6 位字符' },
  ],
}

const handleSubmit = async () => {
  if (submitting.value) return
  try {
    submitting.value = true
    const response = await login({
      userAccount: formState.userAccount,
      userPassword: formState.userPassword,
    })
    if (response.data?.code === 0) {
      message.success('登录成功，欢迎回来')
      await userStore.updateCurrentUser()
      router.push('/')
    } else {
      message.error(response.data?.message || '登录失败，请重试')
    }
  } catch (error) {
    message.error('登录失败，请稍后再试')
  } finally {
    submitting.value = false
  }
}

const goRegister = () => {
  router.push('/user/register')
}
</script>

<style scoped>
.auth-page {
  flex: 1;
  height: 100%;
  max-height: 100%;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 0 20px 50px rgba(15, 23, 42, 0.06);
}

.auth-left {
  background: linear-gradient(135deg, #1c7ed6 0%, #7950f2 45%, #d6336c 100%);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: clamp(24px, 5vw, 56px);
}

.hero-copy {
  max-width: 420px;
}

.hero-copy h1 {
  font-size: 34px;
  margin-bottom: 16px;
}

.hero-copy .description {
  font-size: 16px;
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.85);
}

.hero-copy .eyebrow {
  letter-spacing: 0.4em;
  font-size: 12px;
  margin-bottom: 12px;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.7);
}

.auth-right {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: clamp(24px, 4vw, 48px);
  background: linear-gradient(180deg, #f8faff 0%, #eef2fb 100%);
}

.auth-card {
  width: 100%;
  max-width: 420px;
  box-shadow: 0 20px 45px rgba(15, 23, 42, 0.12);
  border-radius: 16px;
}

.auth-card h2 {
  margin-bottom: 8px;
}

.subtitle {
  margin-bottom: 24px;
  color: rgba(0, 0, 0, 0.45);
}

.auth-extra {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 8px;
  color: rgba(0, 0, 0, 0.6);
}

@media (max-width: 992px) {
  .auth-page {
    grid-template-columns: 1fr;
    height: auto;
    max-height: none;
    border-radius: 14px;
    box-shadow: 0 10px 28px rgba(15, 23, 42, 0.08);
  }

  .auth-left {
    display: none;
  }
}

@media (max-width: 575px) {
  .auth-card {
    box-shadow: none;
    border-radius: 12px;
  }
}
</style>
