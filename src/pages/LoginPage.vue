<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  User,
  Lock,
  LogIn,
  FlaskConical,
  Eye,
  EyeOff,
  AlertCircle,
} from 'lucide-vue-next'
import { getUserStore } from '@/stores/user'

const router = useRouter()
const route = useRoute()
const userStore = getUserStore()

const form = reactive({
  username: '',
  password: '',
})

const loading = ref(false)
const error = ref('')
const showPassword = ref(false)
const shakeError = ref(false)

const handleLogin = async () => {
  error.value = ''
  
  if (!form.username.trim()) {
    error.value = '请输入用户名'
    shakeError.value = true
    setTimeout(() => (shakeError.value = false), 500)
    return
  }
  
  if (!form.password) {
    error.value = '请输入密码'
    shakeError.value = true
    setTimeout(() => (shakeError.value = false), 500)
    return
  }
  
  loading.value = true
  
  try {
    await userStore.login({
      username: form.username.trim(),
      password: form.password,
    })
    
    const redirect = route.query.redirect as string || '/'
    router.push(redirect)
  } catch (e: any) {
    error.value = e.message || '登录失败，请重试'
    shakeError.value = true
    setTimeout(() => (shakeError.value = false), 500)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (userStore.isLoggedIn()) {
    router.push('/')
  }
})
</script>

<template>
  <div class="min-h-screen flex">
    <div class="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 relative overflow-hidden">
      <div class="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-30"></div>
      
      <div class="relative z-10 w-full flex flex-col justify-center items-center p-12 text-white">
        <div class="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-6 shadow-lg">
          <FlaskConical class="w-10 h-10" />
        </div>
        
        <h1 class="text-3xl font-bold mb-2">生物实验室</h1>
        <h2 class="text-xl font-medium text-primary-100 mb-8">试剂与耗材管理系统</h2>
        
        <div class="max-w-md text-center space-y-4">
          <p class="text-primary-100/90 text-sm leading-relaxed">
            专业的实验室试剂管理解决方案，实现试剂全生命周期管理、批次追踪、效期预警，保障实验安全与数据准确性。
          </p>
          
          <div class="grid grid-cols-3 gap-4 pt-6">
            <div class="text-center">
              <div class="text-2xl font-bold mb-1">1000+</div>
              <div class="text-xs text-primary-200/80">试剂种类</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold mb-1">5000+</div>
              <div class="text-xs text-primary-200/80">批次记录</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold mb-1">99.9%</div>
              <div class="text-xs text-primary-200/80">准确率</div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-primary-900/50 to-transparent"></div>
      <div class="absolute top-20 right-20 w-64 h-64 bg-primary-400/10 rounded-full blur-3xl"></div>
      <div class="absolute bottom-20 left-20 w-48 h-48 bg-secondary-400/10 rounded-full blur-3xl"></div>
    </div>
    
    <div class="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-gray-50">
      <div
        class="w-full max-w-md"
        :class="{ 'animate-shake': shakeError }"
      >
        <div class="lg:hidden flex flex-col items-center mb-8">
          <div class="w-16 h-16 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center mb-4 shadow-lg">
            <FlaskConical class="w-8 h-8 text-white" />
          </div>
          <h1 class="text-xl font-bold text-gray-800">试剂与耗材管理系统</h1>
        </div>
        
        <div class="bg-white rounded-2xl shadow-card p-8 sm:p-10">
          <div class="mb-8">
            <h2 class="text-2xl font-bold text-gray-800 mb-2">欢迎登录</h2>
            <p class="text-gray-500 text-sm">请输入您的账号密码登录系统</p>
          </div>
          
          <div
            v-if="error"
            class="mb-6 p-4 bg-red-50 border border-red-100 rounded-lg flex items-start gap-3"
          >
            <AlertCircle class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <span class="text-sm text-red-600">{{ error }}</span>
          </div>
          
          <form @submit.prevent="handleLogin" class="space-y-5">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                用户名
              </label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <User class="w-5 h-5 text-gray-400" />
                </div>
                <input
                  v-model="form.username"
                  type="text"
                  placeholder="请输入用户名"
                  class="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-gray-50 focus:bg-white"
                  :class="{ 'border-red-300 focus:ring-red-500/20 focus:border-red-500': error }"
                />
              </div>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                密码
              </label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Lock class="w-5 h-5 text-gray-400" />
                </div>
                <input
                  v-model="form.password"
                  :type="showPassword ? 'text' : 'password'"
                  placeholder="请输入密码"
                  class="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-gray-50 focus:bg-white"
                  :class="{ 'border-red-300 focus:ring-red-500/20 focus:border-red-500': error }"
                  @keyup.enter="handleLogin"
                />
                <button
                  type="button"
                  @click="showPassword = !showPassword"
                  class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <Eye v-if="!showPassword" class="w-5 h-5" />
                  <EyeOff v-else class="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div class="flex items-center justify-between">
              <label class="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  class="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                />
                <span class="text-sm text-gray-600">记住我</span>
              </label>
              <a href="#" class="text-sm text-primary-600 hover:text-primary-700 hover:underline">
                忘记密码？
              </a>
            </div>
            
            <button
              type="submit"
              :disabled="loading"
              class="w-full py-3 px-4 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <LogIn v-if="!loading" class="w-5 h-5" />
              <svg
                v-else
                class="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ loading ? '登录中...' : '登 录' }}
            </button>
          </form>
          
          <div class="mt-8 pt-6 border-t border-gray-100">
            <p class="text-xs text-gray-400 text-center mb-3">测试账号</p>
            <div class="grid grid-cols-3 gap-2 text-center text-xs">
              <div class="p-2 bg-gray-50 rounded-lg">
                <div class="font-medium text-gray-700">admin</div>
                <div class="text-gray-400">管理员</div>
              </div>
              <div class="p-2 bg-gray-50 rounded-lg">
                <div class="font-medium text-gray-700">manager</div>
                <div class="text-gray-400">实验室</div>
              </div>
              <div class="p-2 bg-gray-50 rounded-lg">
                <div class="font-medium text-gray-700">staff</div>
                <div class="text-gray-400">实验员</div>
              </div>
            </div>
            <p class="text-xs text-gray-400 text-center mt-3">密码：123456</p>
          </div>
        </div>
        
        <p class="text-center text-xs text-gray-400 mt-6">
          © 2024 生物实验室管理系统 版权所有
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
  20%, 40%, 60%, 80% { transform: translateX(4px); }
}

.animate-shake {
  animation: shake 0.5s ease-in-out;
}
</style>
