<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  Search,
  Bell,
  User,
  Settings,
  LogOut,
  ChevronDown,
} from 'lucide-vue-next'
import { getUserStore } from '@/stores/user'
import { roleLabels } from '@/types/user'

const route = useRoute()
const router = useRouter()
const userStore = getUserStore()

const showUserMenu = ref(false)
const searchQuery = ref('')

const pageTitle = computed(() => {
  const titles: Record<string, string> = {
    '/': '仪表盘',
    '/reagents': '试剂管理',
    '/batches': '试剂批管理',
    '/consumables': '耗材管理',
  }
  return titles[route.path] || '实验室管理系统'
})

const breadcrumbs = computed(() => {
  const items = [{ name: '首页', path: '/' }]
  if (route.path !== '/') {
    items.push({ name: pageTitle.value, path: route.path })
  }
  return items
})

const handleLogout = async () => {
  showUserMenu.value = false
  await userStore.logout()
  router.push('/login')
}
</script>

<template>
  <header class="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-30">
    <div class="flex items-center gap-4">
      <nav class="flex items-center gap-2 text-sm">
        <router-link
          v-for="(item, index) in breadcrumbs"
          :key="index"
          :to="item.path"
          class="text-gray-500 hover:text-primary-600 transition-colors"
        >
          {{ item.name }}
        </router-link>
      </nav>
      <h1 class="text-lg font-semibold text-gray-800 ml-4">
        {{ pageTitle }}
      </h1>
    </div>

    <div class="flex items-center gap-4">
      <div class="relative">
        <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <Search class="w-4 h-4 text-gray-400" />
        </div>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜索试剂、耗材..."
          class="w-64 pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
        />
      </div>

      <button class="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
        <Bell class="w-5 h-5 text-gray-500" />
        <span class="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
      </button>

      <div class="relative">
        <button
          @click="showUserMenu = !showUserMenu"
          class="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <div class="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
            <User class="w-4 h-4 text-white" />
          </div>
          <div class="text-left">
            <div class="text-sm font-medium text-gray-700">
              {{ userStore.state.user?.name || '用户' }}
            </div>
            <div class="text-xs text-gray-400">
              {{ userStore.state.user?.role ? roleLabels[userStore.state.user.role] : '' }}
            </div>
          </div>
          <ChevronDown class="w-4 h-4 text-gray-400" :class="{ 'rotate-180': showUserMenu }" />
        </button>

        <div
          v-if="showUserMenu"
          class="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50"
        >
          <button class="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
            <User class="w-4 h-4" />
            个人中心
          </button>
          <button class="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
            <Settings class="w-4 h-4" />
            系统设置
          </button>
          <div class="border-t border-gray-100 my-1"></div>
          <button
            @click="handleLogout"
            class="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
          >
            <LogOut class="w-4 h-4" />
            退出登录
          </button>
        </div>
      </div>
    </div>
  </header>
</template>
