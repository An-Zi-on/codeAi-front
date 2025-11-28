<template>
  <div class="auth-page register-page">
    <div class="auth-left">
      <a-card class="auth-card" :bordered="false">
        <h2>创建你的账户</h2>
        <p class="subtitle">完善以下信息，即刻开启智能开发之旅</p>
        <a-form
          ref="formRef"
          :model="formState"
          :rules="rules"
          layout="vertical"
          @finish="handleSubmit"
        >
          <a-form-item label="账号" name="userAccount">
            <a-input
              v-model:value="formState.userAccount"
              size="large"
              placeholder="请输入账号"
              allow-clear
            />
          </a-form-item>

          <a-form-item label="昵称" name="userName">
            <a-input
              v-model:value="formState.userName"
              size="large"
              placeholder="请输入昵称"
              allow-clear
            />
          </a-form-item>

          <a-form-item label="密码" name="userPassword">
            <a-input-password
              v-model:value="formState.userPassword"
              size="large"
              placeholder="请输入密码"
              allow-clear
            />
          </a-form-item>

          <a-form-item label="确认密码" name="checkPassword">
            <a-input-password
              v-model:value="formState.checkPassword"
              size="large"
              placeholder="请再次输入密码"
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
              立即注册
            </a-button>
          </a-form-item>
        </a-form>

        <div class="auth-extra">
          <span>已经拥有账号？</span>
          <a-button type="link" size="small" @click="goLogin">返回登录</a-button>
        </div>
      </a-card>
    </div>
    <div class="auth-right image-pane">
      <img :src="illustration" alt="Register illustration" />
      <div class="image-caption">更快完成业务搭建，释放创造力</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import type { FormInstance, Rule } from 'ant-design-vue/es/form'
import { message } from 'ant-design-vue'
import { useRouter } from 'vue-router'
import { register } from '@/api/userController'

const router = useRouter()
const formRef = ref<FormInstance>()
const submitting = ref(false)
const illustration = new URL('../../assets/logo.jpg', import.meta.url).href

const formState = reactive({
  userAccount: '',
  userName: '',
  userPassword: '',
  checkPassword: '',
})

const validateConfirm = async (_: Rule, value: string) => {
  if (!value) {
    return Promise.reject('请再次输入密码')
  }
  if (value !== formState.userPassword) {
    return Promise.reject('两次输入的密码不一致')
  }
  return Promise.resolve()
}

const rules: Record<string, Rule[]> = {
  userAccount: [
    { required: true, message: '请输入账号' },
    { min: 4, message: '账号不少于 4 位字符' },
  ],
  userName: [{ required: true, message: '请输入昵称' }],
  userPassword: [
    { required: true, message: '请输入密码' },
    { min: 6, message: '密码不少于 6 位字符' },
  ],
  checkPassword: [{ validator: validateConfirm, trigger: 'change' }],
}

const handleSubmit = async () => {
  if (submitting.value) return
  try {
    submitting.value = true
    const response = await register({
      userAccount: formState.userAccount,
      userPassword: formState.userPassword,
      checkPassword: formState.checkPassword,
      userName: formState.userName,
    })
    if (response.data?.code === 0) {
      message.success('注册成功，请登录')
      router.push('/user/login')
    } else {
      message.error(response.data?.message || '注册失败，请重试')
    }
  } catch (error) {
    message.error('注册失败，请稍后再试')
  } finally {
    submitting.value = false
  }
}

const goLogin = () => {
  router.push('/user/login')
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
  display: flex;
  align-items: center;
  justify-content: center;
  padding: clamp(24px, 5vw, 56px);
  background: linear-gradient(180deg, #f8faff 0%, #eef2fb 100%);
}

.image-pane {
  background: radial-gradient(circle at top, rgba(255, 255, 255, 0.25), rgba(25, 91, 255, 0.3)),
    linear-gradient(135deg, #1c7ed6, #364fc7);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: clamp(24px, 5vw, 56px);
  color: #fff;
}

.image-pane img {
  max-width: 320px;
  width: 100%;
  border-radius: 24px;
  box-shadow: 0 20px 45px rgba(15, 23, 42, 0.2);
}

.image-caption {
  margin-top: 24px;
  font-size: 16px;
  text-align: center;
  letter-spacing: 0.08em;
}

.auth-card {
  width: 100%;
  max-width: 440px;
  box-shadow: 0 20px 45px rgba(15, 23, 42, 0.12);
  border-radius: 16px;
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

  .image-pane {
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

