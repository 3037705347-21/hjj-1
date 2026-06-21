<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import {
  X,
  ArrowUpCircle,
  ArrowDownCircle,
  ArrowLeftRight,
  PlusCircle,
  MinusCircle,
  Trash2,
  Snowflake,
  Sun,
  PackageOpen,
  ClipboardCheck,
  CalendarClock,
  ScanLine,
  MapPin,
} from 'lucide-vue-next'
import type { ReagentBatch, BatchOperationType, BatchOperationFormData } from '@/types/batch'
import { operationTypeLabels, operationTypeConfigs } from '@/types/batch'
import { mockBatchOperation } from '@/mock/batches'
import { formatDate } from '@/utils/date'
import ScanSearchBox from './ScanSearchBox.vue'
import { parseLabelCode } from '@/utils/label'
import type { LabelEntityType } from '@/types/label'
import LocationSelector from './LocationSelector.vue'
import { mockGetAllLocations, getLocationPath } from '@/mock/locations'
import type { StorageLocation } from '@/types/location'

const props = defineProps<{
  visible: boolean
  batch: ReagentBatch | null
  operationType: BatchOperationType | null
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  success: []
  'scan-batch': [batchId: string]
}>()

const loading = ref(false)
const form = reactive<BatchOperationFormData>({
  type: 'return',
  quantity: undefined,
  reason: '',
  remark: '',
  targetLocation: '',
  newExpiryDate: '',
})

const showLocationSelector = ref(false)
const targetLocationId = ref('')
const allLocationsCache = ref<StorageLocation[]>([])

const loadAllLocations = async () => {
  allLocationsCache.value = await mockGetAllLocations()
}
const findLocationIdByCodeOrName = (text: string): string => {
  if (!text) return ''
  const t = text.toLowerCase().trim()
  const found = allLocationsCache.value.find(l =>
    l.code.toLowerCase() === t || l.name.toLowerCase() === t
  )
  return found?.id || ''
}
const openLocationSelector = () => {
  targetLocationId.value = findLocationIdByCodeOrName(form.targetLocation || '')
  showLocationSelector.value = true
}
const handleLocationConfirm = (locId: string, location?: StorageLocation) => {
  targetLocationId.value = locId
  if (location) {
    form.targetLocation = location.code
  }
  showLocationSelector.value = false
}
const getLocationById = (locId: string): StorageLocation | undefined => {
  return allLocationsCache.value.find(l => l.id === locId)
}

watch(
  () => props.visible,
  (val) => {
    if (val) {
      loadAllLocations()
    }
  }
)

const iconComponents: Record<string, any> = {
  ArrowUpCircle,
  ArrowDownCircle,
  ArrowLeftRight,
  PlusCircle,
  MinusCircle,
  Trash2,
  Snowflake,
  Sun,
  PackageOpen,
  ClipboardCheck,
  CalendarClock,
}

const currentConfig = computed(() => {
  return operationTypeConfigs.find((c) => c.type === props.operationType)
})

const operationLabel = computed(() => {
  if (!props.operationType) return ''
  return operationTypeLabels[props.operationType]
})

const OperationIcon = computed(() => {
  if (!currentConfig.value) return null
  return iconComponents[currentConfig.value.icon] || null
})

watch(
  () => [props.visible, props.operationType],
  () => {
    if (props.visible && props.operationType) {
      form.type = props.operationType
      form.quantity = currentConfig.value?.requiresQuantity ? 0 : undefined
      form.reason = ''
      form.remark = ''
      form.targetLocation = ''
      form.newExpiryDate = ''
    }
  }
)

const close = () => {
  emit('update:visible', false)
}

const handleOperationScan = (payload: { entityType: LabelEntityType | null; entityId: string; code: string }) => {
  if (!payload.entityType || !payload.entityId) {
    alert('未识别到有效的批次标签')
    return
  }
  if (payload.entityType !== 'batch') {
    alert(`扫码识别为${payload.entityType === 'reagent' ? '试剂' : '耗材'}，请扫描批次标签`)
    return
  }
  emit('scan-batch', payload.entityId)
}

const handleSubmit = async () => {
  if (!props.batch || !props.operationType) return

  if (currentConfig.value?.requiresQuantity) {
    if (form.quantity === undefined || form.quantity <= 0) {
      alert('请输入有效数量')
      return
    }
  }

  if (currentConfig.value?.requiresTargetLocation) {
    if (!form.targetLocation?.trim()) {
      alert('请输入目标存放位置')
      return
    }
  }

  if (currentConfig.value?.requiresNewExpiryDate) {
    if (!form.newExpiryDate) {
      alert('请选择新的有效期')
      return
    }
  }

  if (!form.reason?.trim()) {
    const needsReason = ['scrap', 'freeze', 'unfreeze', 'stock_in', 'stock_out', 'extend_retest']
    if (needsReason.includes(props.operationType)) {
      alert('请填写原因说明')
      return
    }
  }

  loading.value = true
  try {
    await mockBatchOperation(props.batch.id, {
      type: props.operationType,
      quantity: form.quantity,
      reason: form.reason || undefined,
      remark: form.remark || undefined,
      targetLocation: form.targetLocation || undefined,
      targetLocationId: targetLocationId.value || undefined,
      newExpiryDate: form.newExpiryDate || undefined,
    })
    close()
    emit('success')
  } catch (e: any) {
    alert(e.message || '操作失败')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div
    v-if="visible && batch && operationType"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
    @click.self="close"
  >
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
      <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div class="flex items-center gap-2">
          <component
            v-if="OperationIcon"
            :is="OperationIcon"
            class="w-5 h-5 text-primary-600"
          />
          <h3 class="text-lg font-semibold text-gray-800">
            {{ operationLabel }}
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
        <div class="p-3 bg-primary-50 rounded-xl border border-primary-100">
          <div class="text-xs text-primary-700 font-medium mb-2 flex items-center gap-1">
            <ScanLine class="w-3.5 h-3.5" />
            扫码切换操作批次（预留接入扫码枪）
          </div>
          <ScanSearchBox
            placeholder="扫描批次标签或输入编号..."
            @scan="handleOperationScan"
          />
          <p class="text-[11px] text-primary-600 mt-1.5">
            支持的操作：调拨、盘盈、盘亏、冻结、解冻、报废、退库、入库等所有批次操作
          </p>
        </div>

        <div class="p-4 bg-gray-50 rounded-xl">
          <div class="text-xs text-gray-500 mb-1">当前批次</div>
          <div class="font-medium text-gray-800">{{ batch.reagentName }}</div>
          <div class="text-sm text-gray-500 font-mono mt-0.5">{{ batch.batchNumber }}</div>
          <div class="text-sm text-gray-600 mt-2">
            当前库存：
            <span class="font-semibold text-gray-800">{{ batch.remainingQuantity }}</span>
            <span class="text-gray-400"> / {{ batch.initialQuantity }} {{ batch.unit }}</span>
          </div>
        </div>

        <div
          v-if="currentConfig?.requiresQuantity"
        >
          <label class="block text-sm font-medium text-gray-700 mb-1.5">
            数量 <span class="text-red-500">*</span>
          </label>
          <input
            v-model.number="form.quantity"
            type="number"
            min="0"
            step="0.01"
            class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
            placeholder="请输入数量"
          >
        </div>

        <div
          v-if="currentConfig?.requiresTargetLocation"
        >
          <label class="block text-sm font-medium text-gray-700 mb-1.5">
            目标存放位置 <span class="text-red-500">*</span>
          </label>
          <div class="relative">
            <input
              v-model="form.targetLocation"
              type="text"
              class="w-full px-4 py-2.5 pr-24 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
              placeholder="如：B-02-05"
            >
            <button
              type="button"
              class="absolute right-1 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-primary-50 hover:bg-primary-100 text-primary-600 text-xs font-medium rounded-md transition-colors flex items-center gap-1"
              @click="openLocationSelector"
            >
              <MapPin class="w-3 h-3" />
              选择库位
            </button>
          </div>
          <div
            v-if="targetLocationId && getLocationById(targetLocationId)"
            class="mt-1 text-xs text-gray-500 flex items-center gap-1"
          >
            <MapPin class="w-3 h-3" />
            {{ getLocationPath(allLocationsCache, targetLocationId) }}
          </div>
        </div>

        <div
          v-if="currentConfig?.requiresNewExpiryDate"
        >
          <label class="block text-sm font-medium text-gray-700 mb-1.5">
            新有效期至 <span class="text-red-500">*</span>
          </label>
          <input
            v-model="form.newExpiryDate"
            type="date"
            :min="formatDate(new Date())"
            class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
          >
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">
            原因说明
            <span
              v-if="['scrap', 'freeze', 'unfreeze', 'stock_in', 'stock_out', 'extend_retest'].includes(operationType)"
              class="text-red-500"
            >
              *
            </span>
          </label>
          <textarea
            v-model="form.reason"
            rows="2"
            class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all resize-none"
            placeholder="请输入原因说明"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">
            备注
          </label>
          <textarea
            v-model="form.remark"
            rows="2"
            class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all resize-none"
            placeholder="可选备注信息"
          />
        </div>
      </div>

      <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
        <button
          class="px-5 py-2.5 border border-gray-200 hover:bg-gray-100 text-gray-600 rounded-lg transition-colors"
          @click="close"
        >
          取消
        </button>
        <button
          :disabled="loading"
          class="px-5 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded-lg transition-all disabled:opacity-70 flex items-center gap-2"
          @click="handleSubmit"
        >
          <span
            v-if="loading"
            class="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"
          />
          确认{{ operationLabel }}
        </button>
      </div>
    </div>

    <LocationSelector
      v-model:visible="showLocationSelector"
      :model-value="targetLocationId"
      :only-enabled="true"
      @confirm="handleLocationConfirm"
    />
  </div>
</template>
