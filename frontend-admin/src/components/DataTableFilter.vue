<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  Search,
  Filter,
  RotateCcw,
  Download,
  Save,
  ChevronDown,
  ChevronUp,
  Plus,
  X,
  Trash2,
} from 'lucide-vue-next'

export interface FilterFieldOption {
  label: string
  value: string | number | boolean
}

export interface FilterField {
  key: string
  label: string
  type: 'select' | 'input' | 'date-range' | 'date'
  placeholder?: string
  options?: FilterFieldOption[]
  span?: number
}

export interface SavedFilter {
  id: string
  name: string
  values: Record<string, any>
}

const props = defineProps<{
  keywordPlaceholder?: string
  filterFields: FilterField[]
  modelValue: Record<string, any>
  savedFilters?: SavedFilter[]
  showExport?: boolean
  actionButtonText?: string
  actionButtonIcon?: any
  showAdvancedFilters?: boolean
  plain?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: Record<string, any>): void
  (e: 'search'): void
  (e: 'reset'): void
  (e: 'export'): void
  (e: 'action'): void
  (e: 'save-filter', name: string): void
  (e: 'apply-filter', filter: SavedFilter): void
  (e: 'delete-filter', id: string): void
}>()

const advancedOpen = ref(props.showAdvancedFilters ?? false)
const showSaveDialog = ref(false)
const showSavedMenu = ref(false)
const newFilterName = ref('')
const localFilters = ref<Record<string, any>>({ ...props.modelValue })

watch(
  () => props.modelValue,
  (val) => {
    localFilters.value = { ...val }
  },
  { deep: true }
)

const hasActiveFilters = computed(() => {
  const keys = Object.keys(localFilters.value)
  return keys.some((key) => {
    if (key === 'keyword') return false
    const val = localFilters.value[key]
    return val !== '' && val !== undefined && val !== null
  })
})

const activeFilterCount = computed(() => {
  const keys = Object.keys(localFilters.value)
  return keys.filter((key) => {
    if (key === 'keyword') return false
    const val = localFilters.value[key]
    return val !== '' && val !== undefined && val !== null
  }).length
})

const handleKeywordInput = (e: Event) => {
  const target = e.target as HTMLInputElement
  localFilters.value.keyword = target.value
}

const handleFieldChange = (key: string, value: any) => {
  localFilters.value[key] = value
}

const emitUpdate = () => {
  emit('update:modelValue', { ...localFilters.value })
}

const handleSearch = () => {
  emitUpdate()
  emit('search')
}

const handleReset = () => {
  const reset: Record<string, any> = { keyword: '' }
  props.filterFields.forEach((field) => {
    reset[field.key] = field.type === 'date-range' ? ['', ''] : ''
  })
  localFilters.value = { ...reset }
  emitUpdate()
  emit('reset')
}

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Enter') {
    handleSearch()
  }
}

const toggleAdvanced = () => {
  advancedOpen.value = !advancedOpen.value
}

const openSaveDialog = () => {
  newFilterName.value = ''
  showSaveDialog.value = true
  showSavedMenu.value = false
}

const handleSaveFilter = () => {
  if (!newFilterName.value.trim()) {
    alert('请输入筛选条件名称')
    return
  }
  emit('save-filter', newFilterName.value.trim())
  showSaveDialog.value = false
}

const applySavedFilter = (filter: SavedFilter) => {
  localFilters.value = { ...filter.values }
  emitUpdate()
  emit('apply-filter', filter)
  showSavedMenu.value = false
}

const deleteSavedFilter = (id: string, e: Event) => {
  e.stopPropagation()
  emit('delete-filter', id)
}

const getFieldValue = (key: string): any => {
  return localFilters.value[key] ?? (props.filterFields.find((f) => f.key === key)?.type === 'date-range' ? ['', ''] : '')
}

const getFieldSpanClass = (field: FilterField) => {
  const span = field.span ?? 1
  const spanMap: Record<number, string> = {
    1: 'md:col-span-1',
    2: 'md:col-span-2',
    3: 'md:col-span-3',
    4: 'md:col-span-4',
  }
  return spanMap[span] || 'md:col-span-1'
}

const handleDateRangeChange = (key: string, index: number, value: string) => {
  const current = getFieldValue(key)
  const newArr = Array.isArray(current) ? [...current] : ['', '']
  newArr[index] = value
  localFilters.value[key] = newArr
}

defineExpose({
  reset: handleReset,
  search: handleSearch,
})
</script>

<template>
  <div :class="plain ? '' : 'bg-white rounded-xl shadow-card p-6'">
    <!-- 顶部搜索栏 -->
    <div class="flex flex-wrap items-center gap-3">
      <div class="flex-1 min-w-[200px] max-w-xl">
        <div class="relative">
          <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search class="w-4 h-4 text-gray-400" />
          </div>
          <input
            :value="localFilters.keyword || ''"
            type="text"
            :placeholder="keywordPlaceholder || '搜索...'"
            class="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
            @input="handleKeywordInput"
            @keydown="handleKeydown"
          >
        </div>
      </div>

      <button
        class="px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors flex items-center gap-2"
        @click="handleSearch"
      >
        <Search class="w-4 h-4" />
        搜索
      </button>

      <button
        class="px-4 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-lg transition-colors flex items-center gap-2"
        @click="handleReset"
      >
        <RotateCcw class="w-4 h-4" />
        重置
      </button>

      <button
        class="px-4 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-lg transition-colors flex items-center gap-2"
        :class="{ 'border-primary-300 bg-primary-50 text-primary-700': hasActiveFilters }"
        @click="toggleAdvanced"
      >
        <Filter class="w-4 h-4" />
        高级筛选
        <span v-if="activeFilterCount > 0" class="bg-primary-600 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
          {{ activeFilterCount }}
        </span>
        <ChevronDown v-if="!advancedOpen" class="w-4 h-4" />
        <ChevronUp v-else class="w-4 h-4" />
      </button>

      <div class="relative">
        <button
          class="px-4 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-lg transition-colors flex items-center gap-2"
          @click="showSavedMenu = !showSavedMenu"
        >
          <Save class="w-4 h-4" />
          常用条件
          <ChevronDown class="w-4 h-4" />
        </button>
        <div
          v-if="showSavedMenu"
          class="absolute right-0 top-full mt-1 w-56 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-30"
        >
          <button
            class="w-full px-3 py-2 text-left text-sm text-primary-600 hover:bg-primary-50 flex items-center gap-2"
            @click="openSaveDialog"
          >
            <Plus class="w-4 h-4" />
            保存当前条件
          </button>
          <div v-if="savedFilters && savedFilters.length > 0" class="border-t border-gray-100 my-1"></div>
          <div v-if="savedFilters && savedFilters.length > 0" class="max-h-60 overflow-y-auto">
            <div
              v-for="sf in savedFilters"
              :key="sf.id"
              class="px-3 py-2 hover:bg-gray-50 flex items-center justify-between gap-2 group cursor-pointer"
              @click="applySavedFilter(sf)"
            >
              <span class="text-sm text-gray-700 truncate flex-1">{{ sf.name }}</span>
              <button
                class="p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                @click="deleteSavedFilter(sf.id, $event)"
              >
                <Trash2 class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <div v-else-if="!savedFilters || savedFilters.length === 0" class="px-3 py-4 text-center text-xs text-gray-400">
            暂无保存的筛选条件
          </div>
        </div>
      </div>

      <button
        v-if="showExport"
        class="px-4 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-lg transition-colors flex items-center gap-2"
        @click="$emit('export')"
      >
        <Download class="w-4 h-4" />
        导出
      </button>

      <div class="flex-1"></div>

      <button
        v-if="actionButtonText"
        class="px-5 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded-lg transition-all flex items-center gap-2 shadow-md shadow-primary-500/20"
        @click="$emit('action')"
      >
        <component :is="actionButtonIcon || Plus" class="w-4 h-4" />
        {{ actionButtonText }}
      </button>
    </div>

    <!-- 高级筛选面板 -->
    <div v-show="advancedOpen" class="mt-5 pt-5 border-t border-gray-100">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <template v-for="field in filterFields" :key="field.key">
          <div v-if="field.type !== 'date-range'" :class="getFieldSpanClass(field)">
            <label class="block text-xs font-medium text-gray-500 mb-1.5">{{ field.label }}</label>
            <select
              v-if="field.type === 'select'"
              :value="getFieldValue(field.key)"
              class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-white"
              @change="(e: Event) => handleFieldChange(field.key, (e.target as HTMLSelectElement).value)"
            >
              <option value="">{{ field.placeholder || '全部' }}</option>
              <option v-for="opt in field.options" :key="String(opt.value)" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
            <input
              v-else-if="field.type === 'input' || field.type === 'date'"
              :type="field.type === 'date' ? 'date' : 'text'"
              :value="getFieldValue(field.key)"
              :placeholder="field.placeholder || '请输入'"
              class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
              @input="(e: Event) => handleFieldChange(field.key, (e.target as HTMLInputElement).value)"
              @keydown="(e: KeyboardEvent) => e.key === 'Enter' && handleSearch()"
            >
          </div>
          <div v-else :class="getFieldSpanClass(field)">
            <label class="block text-xs font-medium text-gray-500 mb-1.5">{{ field.label }}</label>
            <div class="flex items-center gap-2">
              <input
                type="date"
                :value="getFieldValue(field.key)[0] || ''"
                :placeholder="'开始日期'"
                class="flex-1 px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm"
                @input="(e: Event) => handleDateRangeChange(field.key, 0, (e.target as HTMLInputElement).value)"
              >
              <span class="text-gray-300 text-sm">至</span>
              <input
                type="date"
                :value="getFieldValue(field.key)[1] || ''"
                :placeholder="'结束日期'"
                class="flex-1 px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm"
                @input="(e: Event) => handleDateRangeChange(field.key, 1, (e.target as HTMLInputElement).value)"
              >
            </div>
          </div>
        </template>
      </div>

      <div class="flex items-center justify-end gap-3 mt-5 pt-4 border-t border-gray-100">
        <button
          class="px-5 py-2 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-lg transition-colors text-sm"
          @click="handleReset"
        >
          重置
        </button>
        <button
          class="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors text-sm"
          @click="handleSearch"
        >
          确定
        </button>
      </div>
    </div>

    <!-- 保存筛选条件弹窗 -->
    <div
      v-if="showSaveDialog"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      @click.self="showSaveDialog = false"
    >
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 class="text-lg font-semibold text-gray-800">保存筛选条件</h3>
          <button
            class="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            @click="showSaveDialog = false"
          >
            <X class="w-5 h-5 text-gray-400" />
          </button>
        </div>
        <div class="p-6">
          <label class="block text-sm font-medium text-gray-700 mb-2">条件名称</label>
          <input
            v-model="newFilterName"
            type="text"
            placeholder="请输入筛选条件名称"
            class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
            @keydown.enter="handleSaveFilter"
          >
        </div>
        <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
          <button
            class="px-5 py-2.5 border border-gray-200 hover:bg-gray-100 text-gray-600 rounded-lg transition-colors"
            @click="showSaveDialog = false"
          >
            取消
          </button>
          <button
            class="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
            @click="handleSaveFilter"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
