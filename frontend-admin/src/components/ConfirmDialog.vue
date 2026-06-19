<script setup lang="ts">
import {
  AlertTriangle,
  X,
} from 'lucide-vue-next'

const props = defineProps<{
  visible: boolean
  title?: string
  message?: string
  confirmText?: string
  cancelText?: string
  type?: 'default' | 'danger' | 'warning'
  showCancel?: boolean
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  confirm: []
  cancel: []
}>()

const close = () => {
  emit('update:visible', false)
}

const handleConfirm = () => {
  emit('confirm')
  close()
}

const handleCancel = () => {
  emit('cancel')
  close()
}

const getIconColor = () => {
  switch (props.type) {
    case 'danger':
      return 'text-danger-500 bg-danger-50'
    case 'warning':
      return 'text-warning-500 bg-warning-50'
    default:
      return 'text-primary-500 bg-primary-50'
  }
}

const getConfirmBtnClass = () => {
  switch (props.type) {
    case 'danger':
      return 'bg-gradient-to-r from-danger-600 to-danger-700 hover:from-danger-700 hover:to-danger-800'
    case 'warning':
      return 'bg-gradient-to-r from-warning-600 to-warning-700 hover:from-warning-700 hover:to-warning-800'
    default:
      return 'bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800'
  }
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
        <div class="flex items-center gap-3">
          <div :class="['w-10 h-10 rounded-full flex items-center justify-center', getIconColor()]">
            <AlertTriangle class="w-5 h-5" />
          </div>
          <h3 class="text-lg font-semibold text-gray-800">
            {{ title || '确认操作' }}
          </h3>
        </div>
        <button
          class="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          @click="close"
        >
          <X class="w-5 h-5 text-gray-400" />
        </button>
      </div>

      <div class="p-6">
        <p class="text-sm text-gray-600 leading-relaxed">
          {{ message || '确定要执行此操作吗？' }}
        </p>
      </div>

      <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
        <button
          v-if="showCancel !== false"
          class="px-5 py-2.5 border border-gray-200 hover:bg-gray-100 text-gray-600 rounded-lg transition-colors"
          @click="handleCancel"
        >
          {{ cancelText || '取消' }}
        </button>
        <button
          :class="['px-5 py-2.5 text-white rounded-lg transition-all disabled:opacity-70 flex items-center gap-2', getConfirmBtnClass()]"
          @click="handleConfirm"
        >
          {{ confirmText || '确认' }}
        </button>
      </div>
    </div>
  </div>
</template>
