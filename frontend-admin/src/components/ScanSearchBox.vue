<script setup lang="ts">
import { ref } from 'vue'
import { ScanLine, Search } from 'lucide-vue-next'
import { scanCodeFromCamera, parseLabelCode } from '@/utils/label'
import type { LabelEntityType } from '@/types/label'

const emit = defineEmits<{
  (e: 'scan', payload: { entityType: LabelEntityType | null; entityId: string; code: string }): void
  (e: 'input', value: string): void
}>()

const props = withDefaults(defineProps<{
  placeholder?: string
  size?: 'sm' | 'md' | 'lg'
  showScanButton?: boolean
}>(), {
  placeholder: '扫码或输入编号查询...',
  size: 'md',
  showScanButton: true,
})

const inputValue = ref('')
const isScanning = ref(false)

const sizeClasses = {
  sm: 'h-8 text-xs',
  md: 'h-10 text-sm',
  lg: 'h-12 text-base',
}

const handleInput = (e: Event) => {
  const target = e.target as HTMLInputElement
  inputValue.value = target.value
  emit('input', target.value)
}

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Enter' && inputValue.value.trim()) {
    doSearch(inputValue.value.trim())
  }
}

const handleClickSearch = () => {
  if (inputValue.value.trim()) {
    doSearch(inputValue.value.trim())
  }
}

const doSearch = (code: string) => {
  const parsed = parseLabelCode(code)
  emit('scan', parsed)
}

const handleScan = async () => {
  isScanning.value = true
  try {
    const code = await scanCodeFromCamera()
    if (code) {
      inputValue.value = code
      doSearch(code)
    }
  } finally {
    isScanning.value = false
  }
}

defineExpose({
  clear: () => {
    inputValue.value = ''
  },
  focus: () => {},
})
</script>

<template>
  <div class="relative w-full">
    <div class="relative flex items-stretch overflow-hidden rounded-xl border border-gray-200 focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-100 bg-white transition-all">
      <div class="flex items-center px-3 text-gray-400 pointer-events-none">
        <Search class="w-4 h-4" />
      </div>
      <input
        :value="inputValue"
        type="text"
        :placeholder="placeholder"
        :class="sizeClasses[size]"
        class="flex-1 bg-transparent outline-none text-gray-800 placeholder:text-gray-400 w-full pr-1"
        @input="handleInput"
        @keydown="handleKeydown"
      />
      <button
        v-if="showScanButton"
        type="button"
        class="flex items-center gap-1.5 px-3 mx-2 my-1.5 rounded-lg bg-primary-500 hover:bg-primary-600 active:bg-primary-700 text-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        :disabled="isScanning"
        @click="handleScan"
      >
        <ScanLine class="w-4 h-4" :class="{ 'animate-pulse': isScanning }" />
        <span class="text-xs font-medium whitespace-nowrap">{{ isScanning ? '扫码中...' : '扫码' }}</span>
      </button>
    </div>
  </div>
</template>
