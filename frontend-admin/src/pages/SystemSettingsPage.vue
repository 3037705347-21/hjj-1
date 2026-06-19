<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import {
  Settings,
  Save,
  AlertCircle,
  CheckCircle,
  XCircle,
  Info,
  Palette,
  Bell,
  Box,
  FileCheck,
  Tag,
} from 'lucide-vue-next'
import { formatDate } from '@/utils/date'
import { usePermission } from '@/composables/usePermission'
import { useAuditLog } from '@/composables/useAuditLog'
import type { SystemConfigItem, SystemConfigKey } from '@/types/system'
import { configGroups } from '@/types/system'
import { mockGetSystemConfigs, mockUpdateSystemConfig } from '@/mock/system'

const permission = usePermission()
const auditLog = useAuditLog()

const loading = ref(false)
const saving = ref(false)
const configs = ref<SystemConfigItem[]>([])
const originalConfigs = ref<SystemConfigItem[]>([])
const activeGroup = ref('基础信息')
const editConfigs = reactive<Record<string, string>>({})

const groupIcon: Record<string, any> = {
  '基础信息': Palette,
  '预警设置': Bell,
  '库存设置': Box,
  '审批设置': FileCheck,
  '标签设置': Tag,
}

const groupedConfigs = computed(() => {
  const groups: Record<string, SystemConfigItem[]> = {}
  configs.value.forEach((cfg) => {
    if (!groups[cfg.group]) {
      groups[cfg.group] = []
    }
    groups[cfg.group].push(cfg)
  })
  return groups
})

const fetchConfigs = async () => {
  loading.value = true
  try {
    configs.value = await mockGetSystemConfigs()
    originalConfigs.value = JSON.parse(JSON.stringify(configs.value))
    configs.value.forEach((cfg) => {
      editConfigs[cfg.key] = cfg.value
    })
  } finally {
    loading.value = false
  }
}

const hasChanges = computed(() => {
  return configs.value.some((cfg) => cfg.value !== editConfigs[cfg.key])
})

const handleChange = (key: string, value: string) => {
  editConfigs[key] = value
}

const handleSave = async () => {
  if (!hasChanges.value) return
  saving.value = true
  try {
    const changedConfigs = configs.value.filter(
      (cfg) => cfg.value !== editConfigs[cfg.key]
    )
    const changes = changedConfigs.map((cfg) => ({
      key: cfg.key as SystemConfigKey,
      name: cfg.name,
      before: cfg.value,
      after: editConfigs[cfg.key],
    }))

    for (const change of changes) {
      await mockUpdateSystemConfig(change.key, change.after)
    }

    await fetchConfigs()
    alert('保存成功')
  } catch (e: any) {
    alert(e.message || '保存失败')
  } finally {
    saving.value = false
  }
}

const handleReset = () => {
  if (!hasChanges.value) return
  if (!confirm('确定要重置所有修改吗？')) return
  originalConfigs.value.forEach((cfg) => {
    editConfigs[cfg.key] = cfg.value
  })
  configs.value = JSON.parse(JSON.stringify(originalConfigs.value))
}

onMounted(() => {
  fetchConfigs()
})
</script>

<template>
  <div class="p-6 space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">系统配置</h1>
        <p class="mt-1 text-sm text-gray-500">配置系统基础参数、预警阈值、审批规则等</p>
      </div>
      <div class="flex gap-3">
        <button
          class="px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-2"
          :disabled="!hasChanges"
          :class="{ 'opacity-50 cursor-not-allowed': !hasChanges }"
          @click="handleReset"
        >
          <XCircle class="w-4 h-4" />
          重置
        </button>
        <button
          class="px-5 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors flex items-center gap-2 shadow-md disabled:opacity-50"
          :disabled="!hasChanges || saving || !permission.hasPermission('system:config')"
          @click="handleSave"
        >
          <Save class="w-4 h-4" />
          {{ saving ? '保存中...' : '保存配置' }}
        </button>
      </div>
    </div>

    <div class="flex gap-6">
      <div class="w-56 flex-shrink-0 space-y-1">
        <button
          v-for="group in configGroups"
          :key="group"
          class="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors"
          :class="[
            activeGroup === group
              ? 'bg-primary-50 text-primary-600 font-semibold'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
          ]"
          @click="activeGroup = group"
        >
          <component :is="groupIcon[group]" class="w-5 h-5" />
          {{ group }}
        </button>
      </div>

      <div class="flex-1">
        <div v-if="loading" class="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <p class="text-gray-400">加载中...</p>
        </div>
        <div v-else class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div class="px-6 py-4 border-b border-gray-100">
            <h2 class="text-lg font-semibold text-gray-900">{{ activeGroup }}</h2>
            <p class="text-sm text-gray-500 mt-0.5">配置{{ activeGroup }}相关参数</p>
          </div>

          <div class="p-6 space-y-6">
            <div
              v-for="cfg in groupedConfigs[activeGroup]"
              :key="cfg.id"
              class="pb-6 border-b border-gray-100 last:border-0 last:pb-0"
            >
              <div class="flex items-start justify-between gap-6">
                <div class="flex-1">
                  <div class="flex items-center gap-2">
                    <label class="text-sm font-medium text-gray-900">{{ cfg.name }}</label>
                    <Info class="w-4 h-4 text-gray-400" />
                  </div>
                  <p class="mt-1 text-xs text-gray-500">{{ cfg.description }}</p>
                  <p class="mt-2 text-xs text-gray-400">
                    最后更新：{{ cfg.updatedAt }} · {{ cfg.updatedBy }}
                  </p>
                </div>

                <div class="w-80 flex-shrink-0">
                  <template v-if="cfg.type === 'text'">
                    <input
                      :value="editConfigs[cfg.key]"
                      type="text"
                      class="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-sm"
                      :disabled="!permission.hasPermission('system:config')"
                      @input="handleChange(cfg.key, ($event.target as HTMLInputElement).value)"
                    />
                  </template>

                  <template v-else-if="cfg.type === 'number'">
                    <input
                      :value="editConfigs[cfg.key]"
                      type="number"
                      class="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-sm"
                      :disabled="!permission.hasPermission('system:config')"
                      @input="handleChange(cfg.key, ($event.target as HTMLInputElement).value)"
                    />
                  </template>

                  <template v-else-if="cfg.type === 'textarea'">
                    <textarea
                      :value="editConfigs[cfg.key]"
                      class="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-sm resize-none"
                      rows="3"
                      :disabled="!permission.hasPermission('system:config')"
                      @input="handleChange(cfg.key, ($event.target as HTMLTextAreaElement).value)"
                    />
                  </template>

                  <template v-else-if="cfg.type === 'select'">
                    <select
                      :value="editConfigs[cfg.key]"
                      class="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-sm"
                      :disabled="!permission.hasPermission('system:config')"
                      @change="handleChange(cfg.key, ($event.target as HTMLSelectElement).value)"
                    >
                      <option
                        v-for="opt in cfg.options"
                        :key="opt.value"
                        :value="opt.value"
                      >
                        {{ opt.label }}
                      </option>
                    </select>
                  </template>

                  <template v-else-if="cfg.type === 'boolean'">
                    <button
                      type="button"
                      class="relative w-14 h-7 rounded-full transition-colors"
                      :class="[
                        editConfigs[cfg.key] === 'true' ? 'bg-primary-500' : 'bg-gray-200',
                      ]"
                      :disabled="!permission.hasPermission('system:config')"
                      @click="handleChange(cfg.key, editConfigs[cfg.key] === 'true' ? 'false' : 'true')"
                    >
                      <span
                        class="absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform"
                        :class="{
                          'translate-x-7': editConfigs[cfg.key] === 'true',
                        }"
                      />
                    </button>
                  </template>

                  <div
                    v-if="cfg.value !== editConfigs[cfg.key]"
                    class="mt-2 flex items-center gap-1.5 text-xs text-primary-600"
                  >
                    <AlertCircle class="w-3.5 h-3.5" />
                    <span>已修改，保存后生效</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          v-if="hasChanges"
          class="mt-4 p-4 bg-primary-50 border border-primary-100 rounded-2xl flex items-center gap-3"
        >
          <Info class="w-5 h-5 text-primary-600 flex-shrink-0" />
          <p class="text-sm text-primary-700">
            您有未保存的修改，点击右上角「保存配置」按钮确认更改。所有修改将记录在审计日志中。
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
