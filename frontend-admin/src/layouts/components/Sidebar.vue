<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  LayoutDashboard,
  FlaskConical,
  PackageOpen,
  TestTube,
  LogOut,
  Menu,
  X,
  AlertTriangle,
  Users,
  Shield,
  Settings,
} from 'lucide-vue-next'
import { getUserStore } from '@/stores/user'
import { roleLabels } from '@/types/user'
import { usePermission } from '@/composables/usePermission'
import type { PermissionCode } from '@/types/permission'

const props = defineProps<{
  collapsed: boolean
}>()

const emit = defineEmits<{
  toggle: []
}>()

const route = useRoute()
const router = useRouter()
const userStore = getUserStore()
const permission = usePermission()

interface MenuItem {
  path: string
  name: string
  icon: any
  permission?: PermissionCode | PermissionCode[]
}

const allMenuItems: MenuItem[] = [
  { path: '/', name: '仪表盘', icon: LayoutDashboard, permission: 'dashboard:view' },
  { path: '/reagents', name: '试剂管理', icon: FlaskConical, permission: 'reagent:view' },
  { path: '/batches', name: '试剂批管理', icon: TestTube, permission: 'batch:view' },
  { path: '/consumables', name: '耗材管理', icon: PackageOpen, permission: 'consumable:view' },
  { path: '/alerts', name: '预警中心', icon: AlertTriangle, permission: 'alert:view' },
  { path: '/users', name: '用户管理', icon: Users, permission: 'user:manage' },
  { path: '/roles', name: '角色管理', icon: Shield, permission: 'role:manage' },
  { path: '/settings', name: '系统配置', icon: Settings, permission: 'system:config' },
]

const menuItems = computed(() => {
  return allMenuItems.filter(item => {
    if (!item.permission) return true
    return permission.hasPermission(item.permission)
  })
})

const isActive = (path: string) => {
  if (path === '/') {
    return route.path === '/'
  }
  return route.path.startsWith(path)
}

const handleLogout = async () => {
  await userStore.logout()
  router.push('/login')
}
</script>

<template>
  <aside
    class="fixed left-0 top-0 h-full bg-gradient-to-b from-primary-800 to-primary-900 text-white transition-all duration-300 z-40 flex flex-col"
    :class="collapsed ? 'w-16' : 'w-60'"
  >
    <div class="flex items-center h-16 px-4 border-b border-primary-700/50">
      <div class="flex items-center gap-3 overflow-hidden">
        <div class="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
          <FlaskConical class="w-5 h-5" />
        </div>
        <span
          v-if="!collapsed"
          class="font-bold text-lg whitespace-nowrap transition-opacity duration-200"
        >
          试剂管理系统
        </span>
      </div>
      <button
        v-if="!collapsed"
        class="ml-auto p-1.5 rounded-lg hover:bg-white/10 transition-colors"
        @click="emit('toggle')"
      >
        <X class="w-4 h-4" />
      </button>
    </div>

    <nav class="flex-1 py-4 px-2 space-y-1">
      <router-link
        v-for="item in menuItems"
        :key="item.path"
        :to="item.path"
        class="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group"
        :class="[
          isActive(item.path)
            ? 'bg-white/15 text-white shadow-md'
            : 'text-primary-100/80 hover:bg-white/10 hover:text-white',
        ]"
      >
        <div class="relative flex-shrink-0">
          <component
            :is="item.icon"
            class="w-5 h-5"
          />
          <div
            v-if="isActive(item.path)"
            class="absolute -left-3 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full"
          />
        </div>
        <span
          v-if="!collapsed"
          class="text-sm font-medium whitespace-nowrap"
        >
          {{ item.name }}
        </span>
      </router-link>
    </nav>

    <div class="p-2 border-t border-primary-700/50">
      <div
        v-if="!collapsed"
        class="mb-2 px-3 py-2 rounded-lg bg-white/5"
      >
        <div class="text-xs text-primary-200/70">
          当前用户
        </div>
        <div class="text-sm font-medium truncate">
          {{ userStore.state.user?.name || '未登录' }}
        </div>
        <div class="text-xs text-primary-200/60 flex items-center gap-1 flex-wrap mt-0.5">
          <span>{{ userStore.state.user?.role ? roleLabels[userStore.state.user.role] : '' }}</span>
          <span v-if="permission.dataScopeLabel" class="inline-block px-1.5 py-0.5 rounded bg-white/10 text-primary-100/80">
            {{ permission.dataScopeLabel }}
          </span>
        </div>
      </div>
      <button
        class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-primary-100/80 hover:bg-white/10 hover:text-white transition-all duration-200"
        @click="handleLogout"
      >
        <LogOut class="w-5 h-5 flex-shrink-0" />
        <span
          v-if="!collapsed"
          class="text-sm font-medium whitespace-nowrap"
        >
          退出登录
        </span>
      </button>
    </div>
  </aside>

  <button
    v-if="collapsed"
    class="fixed left-16 top-4 z-40 p-2 rounded-lg bg-white shadow-lg hover:bg-gray-50 transition-all duration-200 hover:shadow-xl"
    @click="emit('toggle')"
  >
    <Menu class="w-5 h-5 text-gray-600" />
  </button>
</template>
