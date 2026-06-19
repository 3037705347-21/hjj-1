import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import MainLayout from '@/layouts/MainLayout.vue'
import LoginPage from '@/pages/LoginPage.vue'
import DashboardPage from '@/pages/DashboardPage.vue'
import ReagentsPage from '@/pages/ReagentsPage.vue'
import BatchesPage from '@/pages/BatchesPage.vue'
import ConsumablesPage from '@/pages/ConsumablesPage.vue'
import ConsumableDetailPage from '@/pages/ConsumableDetailPage.vue'
import AlertsPage from '@/pages/AlertsPage.vue'
import AuditLogsPage from '@/pages/AuditLogsPage.vue'
import ApprovalsPage from '@/pages/ApprovalsPage.vue'
import SystemSettingsPage from '@/pages/SystemSettingsPage.vue'
import { getUserStore } from '@/stores/user'
import type { PermissionCode } from '@/types/permission'

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    title?: string
    permissions?: PermissionCode[]
  }
}

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
        meta: { title: '仪表盘', permissions: ['dashboard:view'] },
      },
      {
        path: 'reagents',
        name: 'reagents',
        component: ReagentsPage,
        meta: { title: '试剂管理', permissions: ['reagent:view'] },
      },
      {
        path: 'batches',
        name: 'batches',
        component: BatchesPage,
        meta: { title: '试剂批管理', permissions: ['batch:view'] },
      },
      {
        path: 'consumables',
        name: 'consumables',
        component: ConsumablesPage,
        meta: { title: '耗材管理', permissions: ['consumable:view'] },
      },
      {
        path: 'consumables/:id',
        name: 'consumable-detail',
        component: ConsumableDetailPage,
        meta: { title: '耗材详情', permissions: ['consumable:view'] },
      },
      {
        path: 'alerts',
        name: 'alerts',
        component: AlertsPage,
        meta: { title: '预警规则中心', permissions: ['alert:view'] },
      },
      {
        path: 'audit-logs',
        name: 'audit-logs',
        component: AuditLogsPage,
        meta: { title: '审计日志', permissions: ['audit:view'] },
      },
      {
        path: 'approvals',
        name: 'approvals',
        component: ApprovalsPage,
        meta: { title: '审批管理', permissions: ['approval:view'] },
      },
      {
        path: 'system-settings',
        name: 'system-settings',
        component: SystemSettingsPage,
        meta: { title: '系统配置', permissions: ['system:config'] },
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
            <h1 class="text-6xl font-bold text-gray-300 mb-4">403</h1>
            <p class="text-gray-500 mb-6">您没有权限访问该页面</p>
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

  if (userStore.isLoggedIn()) {
    const requiredPermissions = to.meta.permissions
    if (requiredPermissions && requiredPermissions.length > 0) {
      const hasAccess = userStore.hasAnyPermission(requiredPermissions)
      if (!hasAccess) {
        next('/')
        return
      }
    }
  }

  next()
})

export default router
