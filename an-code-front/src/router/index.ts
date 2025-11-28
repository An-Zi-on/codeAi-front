import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: {
        title: '首页',
        showInMenu: true,
      },
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('../views/AboutView.vue'),
      meta: {
        title: '关于',
        showInMenu: true,
      },
    },
    {
      path: '/user/login',
      name: 'user-login',
      component: () => import('../views/user/LoginView.vue'),
      meta: {
        title: '登录',
        showInMenu: false,
      },
    },
    {
      path: '/user/register',
      name: 'user-register',
      component: () => import('../views/user/RegisterView.vue'),
      meta: {
        title: '注册',
        showInMenu: false,
      },
    },
  ],
})

export default router
