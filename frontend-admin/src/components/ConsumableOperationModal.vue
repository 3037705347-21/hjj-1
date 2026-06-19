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
  Wrench,
  PackagePlus,
  UserCheck,
  RotateCcw,
  ScanLine,
} from 'lucide-vue-next'
import ScanSearchBox from './ScanSearchBox.vue'
import { parseLabelCode } from '@/utils/label'
import type { LabelEntityType } from '@/types/label'
import type {
  Consumable,
  ConsumableOperationType,
  ConsumableOperationFormData,
} from '@/types/consumable'
import {
  operationTypeLabels,
  operationTypeConfigs,
} from '@/types/consumable'
import { mockConsumableOperation } from '@/mock/consumables'
import { useAuditLog } from '@/composables/useAuditLog'

const auditLog = useAuditLog()

function formatConsumableContent(c: any): string {
  const parts: string[] = []
  parts.push(`分类: ${c.category}`)
  if (c.specification) parts.push(`规格: ${c.specification}`)
  parts.push(`单位: ${c.unit}`)
  parts.push(`库存: ${c.currentStock || c.stockQuantity}/${c.minStock || c.safetyStock}`)
  if (c.location) parts.push(`库位: ${c.location}`)
  if (c.manufacturer) parts.push(`厂家: ${c.manufacturer}`)
  if (c.brand) parts.push(`品牌: ${c.brand}`)
  return parts.join(', ')
}

const props = defineProps<{
  visible: boolean
  consumable: Consumable | null
  operationType: ConsumableOperationType | null
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  success: []
  'scan-consumable': [consumableId: string]
}>()

const loading = ref(false)
const form = reactive<ConsumableOperationFormData>({
  type: 'stock_in',
  quantity: 0,
  purpose: '',
  reason: '',
  remark: '',
  targetLocation: '',
  adjustType: 'increase',
})

const iconComponents: Record<string, any> = {
  stock_in: PackagePlus,
  use: UserCheck,
  return: RotateCcw,
  scrap: Trash2,
  transfer: ArrowLeftRight,
  adjust: Wrench,
}

const currentConfig = computed(() => {
  return operationTypeConfigs.find((c) => c.type === props.operationType)
})

const operationLabel = computed(() => {
  if (!props.operationType) return ''
  return operationTypeLabels[props.operationType]
})

const OperationIcon = computed(() => {
  if (!props.operationType) return null
  return iconComponents[props.operationType] || null
})

watch(
  () => [props.visible, props.operationType],
  () => {
    if (props.visible && props.operationType) {
      form.type = props.operationType
      form.quantity = currentConfig.value?.requiresQuantity ? 0 : 0
      form.purpose = ''
      form.reason = ''
      form.remark = ''
      form.targetLocation = ''
      form.adjustType = 'increase'
    }
  }
)

const close = () => {
  emit('update:visible', false)
}

const handleOperationScan = (payload: { entityType: LabelEntityType | null; entityId: string; code: string }) => {
  if (!payload.entityType || !payload.entityId) {
    alert('未识别到有效的耗材标签')
    return
  }
  if (payload.entityType !== 'consumable') {
    alert(`扫码识别为${payload.entityType === 'reagent' ? '试剂' : '批次'}，请扫描耗材标签`)
    return
  }
  emit('scan-consumable', payload.entityId)
}

const handleSubmit = async () => {
  if (!props.consumable || !props.operationType) return

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

  if (currentConfig.value?.requiresPurpose) {
    if (!form.purpose?.trim()) {
      alert('请填写用途说明')
      return
    }
  }

  if (currentConfig.value?.requiresReason) {
    if (!form.reason?.trim()) {
      alert('请填写原因说明')
      return
    }
  }

  if (currentConfig.value?.requiresAdjustType && !form.adjustType) {
    alert('请选择调整类型')
    return
  }

  loading.value = true
  try {
    const beforeContent = props.consumable ? formatConsumableContent(props.consumable) : ''
    await mockConsumableOperation(props.consumable.id, {
      type: props.operationType,
      quantity: form.quantity,
      purpose: form.purpose || undefined,
      reason: form.reason || undefined,
      remark: form.remark || undefined,
      targetLocation: form.targetLocation || undefined,
      adjustType: form.adjustType,
    })
    if (props.consumable && props.operationType) {
      const operationRemark = [
        form.quantity ? `数量:${form.quantity}` : '',
        form.purpose ? `用途:${form.purpose}` : '',
        form.reason ? `原因:${form.reason}` : '',
        form.targetLocation ? `目标库位:${form.targetLocation}` : '',
        form.adjustType ? `调整方式:${form.adjustType === 'increase' ? '增加' : '减少'}` : '',
        form.remark ? `备注:${form.remark}` : '',
      ].filter(Boolean).join(', ')
      auditLog.logConsumableOperation(
        props.consumable.id,
        props.consumable.name,
        props.operationType,
        beforeContent,
        operationRemark
      )
    }
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
    v-if="visible && consumable && operationType"
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
        <div class="p-3 bg-amber-50 rounded-xl border border-amber-100">
          <div class="text-xs text-amber-700 font-medium mb-2 flex items-center gap-1">
            <ScanLine class="w-3.5 h-3.5" />
            扫码切换操作耗材（预留接入扫码枪）
          </div>
          <ScanSearchBox
            placeholder="扫描耗材标签或输入编号..."
            @scan="handleOperationScan"
          />
          <p class="text-[11px] text-amber-600 mt-1.5">
            支持的操作：入库、领用出库、调拨、库存调整、报损、退库、使用消耗等所有耗材操作
          </p>
        </div>

        <div class="p-4 bg-gray-50 rounded-xl">
          <div class="text-xs text-gray-500 mb-1">耗材名称</div>
          <div class="font-medium text-gray-800">{{ consumable.name }}</div>
          <div class="text-sm text-gray-500 mt-0.5">{{ consumable.specification }}</div>
          <div class="text-sm text-gray-600 mt-2">
            当前库存：
            <span class="font-semibold text-gray-800">{{ consumable.stockQuantity }}</span>
            <span class="text-gray-400">
              {{ consumable.unit }}，安全库存 {{ consumable.safetyStock }}
            </span>
          </div>
        </div>

        <div v-if="currentConfig?.requiresQuantity">
          <label class="block text-sm font-medium text-gray-700 mb-1.5">
            数量 <span class="text-red-500">*</span>
            <span class="text-xs text-gray-400 ml-2">({{ consumable.unit }})</span>
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

        <div v-if="currentConfig?.requiresAdjustType">
          <label class="block text-sm font-medium text-gray-700 mb-1.5">
            调整类型 <span class="text-red-500">*</span>
          </label>
          <div class="flex gap-4">
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                v-model="form.adjustType"
                type="radio"
                value="increase"
                class="w-4 h-4 text-primary-600"
              >
              <span class="text-sm text-gray-700 flex items-center gap-1">
                <PlusCircle class="w-4 h-4 text-success-600" />
                盘盈（增加库存）
              </span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                v-model="form.adjustType"
                type="radio"
                value="decrease"
                class="w-4 h-4 text-primary-600"
              >
              <span class="text-sm text-gray-700 flex items-center gap-1">
                <MinusCircle class="w-4 h-4 text-warning-600" />
                盘亏（减少库存）
              </span>
            </label>
          </div>
        </div>

        <div v-if="currentConfig?.requiresPurpose">
          <label class="block text-sm font-medium text-gray-700 mb-1.5">
            用途 <span class="text-red-500">*</span>
          </label>
          <input
            v-model="form.purpose"
            type="text"
            class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
            placeholder="请输入领用用途，如：Western Blot实验"
          >
        </div>

        <div v-if="currentConfig?.requiresTargetLocation">
          <label class="block text-sm font-medium text-gray-700 mb-1.5">
            目标存放位置 <span class="text-red-500">*</span>
          </label>
          <input
            v-model="form.targetLocation"
            type="text"
            class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
            placeholder="如：耗材柜B-02"
          >
        </div>

        <div v-if="currentConfig?.requiresReason">
          <label class="block text-sm font-medium text-gray-700 mb-1.5">
            原因说明 <span class="text-red-500">*</span>
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
  </div>
</template>
