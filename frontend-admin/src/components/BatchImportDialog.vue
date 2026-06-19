<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  X,
  Upload,
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Download,
  Loader2,
} from 'lucide-vue-next'

export interface ImportResultItem {
  row: number
  success: boolean
  message: string
  data?: Record<string, any>
}

export interface ImportResult {
  total: number
  success: number
  failed: number
  items: ImportResultItem[]
}

const props = defineProps<{
  visible: boolean
  title?: string
  templateName?: string
  loading?: boolean
  result?: ImportResult | null
  accept?: string
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  import: [file: File]
  downloadTemplate: []
  close: []
}>()

const fileInputRef = ref<HTMLInputElement | null>(null)
const selectedFile = ref<File | null>(null)
const isDragging = ref(false)

const fileName = computed(() => selectedFile.value?.name || '')
const fileSize = computed(() => {
  if (!selectedFile.value) return ''
  const bytes = selectedFile.value.size
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
})

const close = () => {
  selectedFile.value = null
  emit('update:visible', false)
  emit('close')
}

const handleFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    selectedFile.value = target.files[0]
  }
}

const handleDrop = (e: DragEvent) => {
  e.preventDefault()
  isDragging.value = false
  if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
    selectedFile.value = e.dataTransfer.files[0]
  }
}

const handleDragOver = (e: DragEvent) => {
  e.preventDefault()
  isDragging.value = true
}

const handleDragLeave = () => {
  isDragging.value = false
}

const handleImport = () => {
  if (!selectedFile.value) {
    alert('请选择要导入的文件')
    return
  }
  emit('import', selectedFile.value)
}

const handleDownloadTemplate = () => {
  emit('downloadTemplate')
}

const clearFile = () => {
  selectedFile.value = null
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

const successRate = computed(() => {
  if (!props.result || props.result.total === 0) return 0
  return ((props.result.success / props.result.total) * 100).toFixed(1)
})

const hasResult = computed(() => props.result && props.result.items.length > 0)
</script>

<template>
  <div
    v-if="visible"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
    @click.self="close"
  >
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
      <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
        <div class="flex items-center gap-2">
          <Upload class="w-5 h-5 text-primary-600" />
          <h3 class="text-lg font-semibold text-gray-800">
            {{ title || '批量导入' }}
          </h3>
        </div>
        <button
          class="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          @click="close"
        >
          <X class="w-5 h-5 text-gray-400" />
        </button>
      </div>

      <div class="p-6 overflow-y-auto flex-1">
        <div v-if="!hasResult" class="space-y-4">
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-600">下载导入模板，按模板格式填写后上传</span>
            <button
              class="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
              @click="handleDownloadTemplate"
            >
              <Download class="w-4 h-4" />
              下载模板
            </button>
          </div>

          <div
            :class="[
              'border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer',
              isDragging
                ? 'border-primary-400 bg-primary-50'
                : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
            ]"
            @click="fileInputRef?.click()"
            @drop="handleDrop"
            @dragover="handleDragOver"
            @dragleave="handleDragLeave"
          >
            <input
              ref="fileInputRef"
              type="file"
              :accept="accept || '.csv,.xlsx,.xls'"
              class="hidden"
              @change="handleFileChange"
            >
            <div v-if="!selectedFile" class="space-y-3">
              <div class="w-16 h-16 mx-auto rounded-full bg-gray-100 flex items-center justify-center">
                <Upload class="w-8 h-8 text-gray-400" />
              </div>
              <div>
                <p class="text-sm text-gray-600">点击或拖拽文件到此处上传</p>
                <p class="text-xs text-gray-400 mt-1">支持 CSV、Excel 格式</p>
              </div>
            </div>
            <div v-else class="space-y-3">
              <div class="w-16 h-16 mx-auto rounded-full bg-primary-50 flex items-center justify-center">
                <FileText class="w-8 h-8 text-primary-500" />
              </div>
              <div>
                <p class="text-sm font-medium text-gray-800">{{ fileName }}</p>
                <p class="text-xs text-gray-400 mt-1">{{ fileSize }}</p>
              </div>
              <button
                class="text-xs text-red-500 hover:text-red-600"
                @click.stop="clearFile"
              >
                重新选择
              </button>
            </div>
          </div>
        </div>

        <div v-else class="space-y-4">
          <div class="grid grid-cols-3 gap-4">
            <div class="p-4 bg-gray-50 rounded-xl text-center">
              <div class="text-2xl font-bold text-gray-800">{{ result?.total }}</div>
              <div class="text-xs text-gray-500 mt-1">总记录数</div>
            </div>
            <div class="p-4 bg-success-50 rounded-xl text-center">
              <div class="text-2xl font-bold text-success-600">{{ result?.success }}</div>
              <div class="text-xs text-gray-500 mt-1">成功</div>
            </div>
            <div class="p-4 bg-danger-50 rounded-xl text-center">
              <div class="text-2xl font-bold text-danger-600">{{ result?.failed }}</div>
              <div class="text-xs text-gray-500 mt-1">失败</div>
            </div>
          </div>

          <div class="p-4 bg-gray-50 rounded-xl">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium text-gray-700">成功率</span>
              <span class="text-sm font-semibold text-primary-600">{{ successRate }}%</span>
            </div>
            <div class="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                class="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all"
                :style="{ width: `${successRate}%` }"
              />
            </div>
          </div>

          <div v-if="result && result.failed > 0">
            <div class="flex items-center gap-2 mb-3">
              <AlertCircle class="w-4 h-4 text-danger-500" />
              <span class="text-sm font-medium text-gray-700">失败明细</span>
            </div>
            <div class="border border-gray-200 rounded-xl overflow-hidden">
              <div class="max-h-60 overflow-y-auto">
                <table class="w-full">
                  <thead class="bg-gray-50 border-b border-gray-200 sticky top-0">
                    <tr>
                      <th class="px-4 py-2.5 text-left text-xs font-medium text-gray-500 w-20">行号</th>
                      <th class="px-4 py-2.5 text-left text-xs font-medium text-gray-500">失败原因</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-100">
                    <tr
                      v-for="item in result?.items.filter(i => !i.success)"
                      :key="item.row"
                      class="hover:bg-gray-50"
                    >
                      <td class="px-4 py-2.5 text-sm text-gray-600 font-mono">{{ item.row }}</td>
                      <td class="px-4 py-2.5 text-sm text-danger-600">{{ item.message }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 flex-shrink-0">
        <button
          class="px-5 py-2.5 border border-gray-200 hover:bg-gray-100 text-gray-600 rounded-lg transition-colors"
          @click="close"
        >
          {{ hasResult ? '关闭' : '取消' }}
        </button>
        <button
          v-if="!hasResult"
          :disabled="loading || !selectedFile"
          class="px-5 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded-lg transition-all disabled:opacity-70 flex items-center gap-2"
          @click="handleImport"
        >
          <Loader2 v-if="loading" class="w-4 h-4 animate-spin" />
          <Upload v-else class="w-4 h-4" />
          {{ loading ? '导入中...' : '开始导入' }}
        </button>
      </div>
    </div>
  </div>
</template>
