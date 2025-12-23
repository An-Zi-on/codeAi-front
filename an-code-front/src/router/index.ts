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
      path: '/works',
      name: 'my-works',
      component: () => import('../views/app/MyWorksView.vue'),
      meta: {
        title: '我的作品',
        showInMenu: false,
      },
    },
    {
      path: '/app/chat/:id',
      name: 'app-chat',
      component: () => import('../views/app/ChatView.vue'),
      meta: {
        title: '应用对话',
        showInMenu: false,
      },
    },
    {
      path: '/app/edit/:id',
      name: 'app-edit',
      component: () => import('../views/app/AppEditView.vue'),
      meta: {
        title: '编辑应用',
        showInMenu: false,
      },
    },
    {
      path: '/admin/apps',
      name: 'admin-apps',
      component: () => import('../views/app/AdminAppManageView.vue'),
      meta: {
        title: '应用管理',
        showInMenu: true,
        requireAdmin: true,
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

// 路由守卫 - 检查管理员权限
router.beforeEach((to, from, next) => {
  if (to.meta.requireAdmin) {
    // 动态导入 store 以避免循环依赖
    import('../stores/counter').then(({ useCounterStore }) => {
      const userStore = useCounterStore()
      if (userStore.loginUser?.userRole === 'admin') {
        next()
      } else {
        next({ path: '/', replace: true })
        import('ant-design-vue').then(({ message }) => {
          message.warning('需要管理员权限')
        })
      }
    })
  } else {
    next()
  }
})

export default router
