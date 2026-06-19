<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  X,
  Edit3,
} from 'lucide-vue-next'

export interface BatchEditField {
  key: string
  label: string
  type: 'select' | 'input' | 'textarea'
  options?: { label: string; value: string | number | boolean }[]
  placeholder?: string
  required?: boolean
}

const props = defineProps<{
  visible: boolean
  title?: string
  fields: BatchEditField[]
  selectedCount: number
  loading?: boolean
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  confirm: [values: Record<string, any>]
  cancel: []
}>()

const formData = ref<Record<string, any>>({})

const initFormData = () => {
  const data: Record<string, any> = {}
  props.fields.forEach((field) => {
    data[field.key] = field.type === 'select' ? '' : ''
  })
  formData.value = data
}

watch(
  () => props.visible,
  (val) => {
    if (val) {
      initFormData()
    }
  }
)

const close = () => {
  emit('update:visible', false)
}

const handleConfirm = () => {
  for (const field of props.fields) {
    if (field.required) {
      const value = formData.value[field.key]
      if (value === '' || value === undefined || value === null) {
        alert(`请选择${field.label}`)
        return
      }
    }
  }
  emit('confirm', { ...formData.value })
}

const handleCancel = () => {
  emit('cancel')
  close()
}
</script>

<template>
  <div
    v-if="visible"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
    @click.self="close"
  >
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
      <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div class="flex items-center gap-2">
          <Edit3 class="w-5 h-5 text-primary-600" />
          <h3 class="text-lg font-semibold text-gray-800">
            {{ title || '批量编辑' }}
          </h3>
        </div>
        <button
          class="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          @click="close"
        >
          <X class="w-5 h-5 text-gray-400" />
        </button>
      </div>

      <div class="p-6 space-y-4">
        <div class="p-3 bg-primary-50 rounded-lg">
          <p class="text-sm text-primary-700">
            本次操作将修改
            <span class="font-semibold">{{ selectedCount }}</span>
            条记录
          </p>
        </div>

        <div v-for="field in fields" :key="field.key" class="space-y-2">
          <label class="block text-sm font-medium text-gray-700">
            {{ field.label }}
            <span v-if="field.required" class="text-red-500">*</span>
          </label>
          <select
            v-if="field.type === 'select'"
            v-model="formData[field.key]"
            class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-white"
          >
            <option value="">{{ field.placeholder || '请选择' + field.label }}</option>
            <option v-for="opt in field.options" :key="String(opt.value)" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
          <input
            v-else-if="field.type === 'input'"
            v-model="formData[field.key]"
            type="text"
            :placeholder="field.placeholder || '请输入' + field.label"
            class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
          >
          <textarea
            v-else-if="field.type === 'textarea'"
            v-model="formData[field.key]"
            rows="3"
            :placeholder="field.placeholder || '请输入' + field.label"
            class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all resize-none"
          />
        </div>
      </div>

      <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
        <button
          class="px-5 py-2.5 border border-gray-200 hover:bg-gray-100 text-gray-600 rounded-lg transition-colors"
          @click="handleCancel"
        >
          取消
        </button>
        <button
          :disabled="loading"
          class="px-5 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded-lg transition-all disabled:opacity-70 flex items-center gap-2"
          @click="handleConfirm"
        >
          <span
            v-if="loading"
            class="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"
          />
          确认修改
        </button>
      </div>
    </div>
  </div>
</template>
