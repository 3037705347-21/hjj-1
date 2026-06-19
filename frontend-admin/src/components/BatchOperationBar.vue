<script setup lang="ts">
import {
  Download,
  Upload,
  Trash2,
  Edit3,
  MapPin,
  ToggleLeft,
  Tags,
  MoreHorizontal,
  X,
  FileText,
} from 'lucide-vue-next'
import { ref } from 'vue'

interface BatchAction {
  key: string
  label: string
  icon?: any
  type?: 'default' | 'danger' | 'warning'
  permission?: boolean
}

const props = defineProps<{
  selectedCount: number
  totalCount?: number
  actions: BatchAction[]
  showImport?: boolean
  showExport?: boolean
  showTemplate?: boolean
  importPermission?: boolean
  exportPermission?: boolean
}>()

const emit = defineEmits<{
  action: [key: string]
  import: []
  export: []
  downloadTemplate: []
  clearSelection: []
  selectAll: []
}>()

const showMoreMenu = ref(false)

const handleAction = (key: string) => {
  showMoreMenu.value = false
  emit('action', key)
}
</script>

<template>
  <div
    v-if="selectedCount > 0 || showImport || showExport"
    class="bg-white rounded-xl shadow-card p-4 mb-6"
  >
    <div class="flex flex-wrap items-center gap-3">
      <div v-if="selectedCount > 0" class="flex items-center gap-3 pr-4 border-r border-gray-200">
        <span class="text-sm text-gray-600">
          已选择
          <span class="font-semibold text-primary-600">{{ selectedCount }}</span>
          项
        </span>
        <button
          v-if="totalCount"
          class="text-sm text-primary-600 hover:text-primary-700"
          @click="$emit('selectAll')"
        >
          选择全部 ({{ totalCount }})
        </button>
        <button
          class="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
          title="取消选择"
          @click="$emit('clearSelection')"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <button
          v-if="showImport && importPermission !== false"
          class="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-lg transition-colors flex items-center gap-2 text-sm"
          @click="$emit('import')"
        >
          <Upload class="w-4 h-4" />
          批量导入
        </button>

        <button
          v-if="showTemplate"
          class="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-lg transition-colors flex items-center gap-2 text-sm"
          @click="$emit('downloadTemplate')"
        >
          <FileText class="w-4 h-4" />
          下载模板
        </button>

        <button
          v-if="showExport && exportPermission !== false"
          class="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-lg transition-colors flex items-center gap-2 text-sm"
          @click="$emit('export')"
        >
          <Download class="w-4 h-4" />
          批量导出
        </button>

        <template v-if="selectedCount > 0 && actions.length > 0">
          <div class="h-6 w-px bg-gray-200 mx-1"></div>
          
          <template v-for="action in actions.slice(0, 4)" :key="action.key">
            <button
              v-if="action.permission !== false"
              :class="[
                'px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm',
                action.type === 'danger'
                  ? 'border border-danger-200 text-danger-600 hover:bg-danger-50'
                  : action.type === 'warning'
                    ? 'border border-warning-200 text-warning-600 hover:bg-warning-50'
                    : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
              ]"
              @click="handleAction(action.key)"
            >
              <component :is="action.icon" class="w-4 h-4" />
              {{ action.label }}
            </button>
          </template>

          <div v-if="actions.length > 4" class="relative">
            <button
              class="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-lg transition-colors flex items-center gap-2 text-sm"
              @click="showMoreMenu = !showMoreMenu"
            >
              <MoreHorizontal class="w-4 h-4" />
              更多操作
            </button>
            <div
              v-if="showMoreMenu"
              class="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-30"
            >
              <button
                v-for="action in actions.slice(4)"
                :key="action.key"
                v-show="action.permission !== false"
                :class="[
                  'w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors',
                  action.type === 'danger'
                    ? 'text-danger-600 hover:bg-danger-50'
                    : action.type === 'warning'
                      ? 'text-warning-600 hover:bg-warning-50'
                      : 'text-gray-700 hover:bg-gray-50'
                ]"
                @click="handleAction(action.key)"
              >
                <component :is="action.icon" class="w-4 h-4" />
                {{ action.label }}
              </button>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
