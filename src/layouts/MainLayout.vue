<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Sidebar from './components/Sidebar.vue'
import Header from './components/Header.vue'
import { getUserStore } from '@/stores/user'

const sidebarCollapsed = ref(false)

const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

onMounted(() => {
  const userStore = getUserStore()
  userStore.initFromStorage()
})
</script>

<template>
  <div class="min-h-screen bg-neutral-50">
    <Sidebar :collapsed="sidebarCollapsed" @toggle="toggleSidebar" />
    
    <div
      class="transition-all duration-300 min-h-screen"
      :class="sidebarCollapsed ? 'ml-16' : 'ml-60'"
    >
      <Header />
      <main class="p-6">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
