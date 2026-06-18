import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import MainLayout from '@/layouts/MainLayout.vue'
import LoginPage from '@/pages/LoginPage.vue'
import DashboardPage from '@/pages/DashboardPage.vue'
import ReagentsPage from '@/pages/ReagentsPage.vue'
import BatchesPage from '@/pages/BatchesPage.vue'
import ConsumablesPage from '@/pages/ConsumablesPage.vue'
import { getUserStore } from '@/stores/user'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: LoginPage,
    meta: { requiresAuth: false, title: '登录' },
  },
  {
    path: '/',
    component: MainLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'dashboard',
        component: DashboardPage,
        meta: { title: '仪表盘' },
      },
      {
        path: 'reagents',
        name: 'reagents',
        component: ReagentsPage,
        meta: { title: '试剂管理' },
      },
      {
        path: 'batches',
        name: 'batches',
        component: BatchesPage,
        meta: { title: '试剂批管理' },
      },
      {
        path: 'consumables',
        name: 'consumables',
        component: ConsumablesPage,
        meta: { title: '耗材管理' },
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: {
      template: `
        <div class="min-h-screen flex items-center justify-center bg-gray-50">
          <div class="text-center">
            <h1 class="text-6xl font-bold text-gray-300 mb-4">404</h1>
            <p class="text-gray-500 mb-6">页面不存在</p>
            <router-link to="/" class="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors">
              返回首页
            </router-link>
          </div>
        </div>
      `,
    },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, from, next) => {
  const userStore = getUserStore()
  userStore.initFromStorage()
  
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth !== false)
  
  if (requiresAuth && !userStore.isLoggedIn()) {
    next({
      path: '/login',
      query: { redirect: to.fullPath },
    })
    return
  }
  
  if (to.path === '/login' && userStore.isLoggedIn()) {
    next('/')
    return
  }
  
  next()
})

export default router
