<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { X, ScanLine, ExternalLink, Printer, MapPin, Calendar, Factory, Package } from 'lucide-vue-next'
import type { LabelData, LabelEntityType } from '@/types/label'
import { buildLabelCode } from '@/utils/label'
import { formatDate, generateId, getExpiryDays } from '@/utils/date'
import { mockGetReagent } from '@/mock/reagents'
import { mockGetBatch } from '@/mock/batches'
import { mockGetConsumable } from '@/mock/consumables'
import type { Reagent } from '@/types/reagent'
import type { ReagentBatch } from '@/types/batch'
import type { Consumable } from '@/types/consumable'
import { batchStatusLabels, batchStatusColors } from '@/types/batch'
import { hazardLevelLabels, hazardLevelColors } from '@/types/reagent'
import { useRouter } from 'vue-router'
import LabelPrintDialog from './LabelPrintDialog.vue'

const props = defineProps<{
  visible: boolean
  scannedCode: string | null
  defaultEntityType?: LabelEntityType | null
  defaultEntityId?: string | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const router = useRouter()
const loading = ref(false)
const error = ref('')
const entityData = ref<(Reagent | ReagentBatch | Consumable) | null>(null)
const entityType = ref<LabelEntityType | null>(null)
const showPrintDialog = ref(false)
const labelData = ref<LabelData | null>(null)

const entityTypeLabel = computed((): string => {
  if (!entityType.value) return ''
  const map: Record<LabelEntityType, string> = {
    reagent: '试剂',
    batch: '批次',
    consumable: '耗材',
  }
  return map[entityType.value]
})

const batchInfo = computed<ReagentBatch | null>(() => {
  if (entityType.value === 'batch') return entityData.value as ReagentBatch
  return null
})

const reagentInfo = computed<Reagent | null>(() => {
  if (entityType.value === 'reagent') return entityData.value as Reagent
  return null
})

const consumableInfo = computed<Consumable | null>(() => {
  if (entityType.value === 'consumable') return entityData.value as Consumable
  return null
})

const statusInfo = computed(() => {
  if (batchInfo.value) {
    const status = batchInfo.value.status as keyof typeof batchStatusLabels
    return {
      label: batchStatusLabels[status] || status,
      cls: batchStatusColors[status] || '',
    }
  }
  if (consumableInfo.value) {
    const low = consumableInfo.value.stockQuantity <= consumableInfo.value.safetyStock
    return {
      label: low ? '库存不足' : '库存正常',
      cls: low ? 'bg-warning-100 text-warning-700' : 'bg-success-100 text-success-700',
    }
  }
  if (reagentInfo.value) {
    const enabled = reagentInfo.value.enabled
    return {
      label: enabled ? '启用' : '停用',
      cls: enabled ? 'bg-success-100 text-success-700' : 'bg-gray-100 text-gray-600',
    }
  }
  return null
})

const expiryWarning = computed(() => {
  if (!batchInfo.value?.expiryDate) return null
  const days = getExpiryDays(batchInfo.value.expiryDate)
  if (days < 0) return { text: `已过期 ${Math.abs(days)} 天`, cls: 'text-danger-600' }
  if (days <= 30) return { text: `剩余 ${days} 天过期`, cls: 'text-warning-600' }
  return { text: `有效期剩余 ${days} 天`, cls: 'text-success-600' }
})

const lowStockWarning = computed(() => {
  if (!consumableInfo.value) return null
  const low = consumableInfo.value.stockQuantity <= consumableInfo.value.safetyStock
  if (low) return { text: `当前库存 ${consumableInfo.value.stockQuantity} 低于安全库存 ${consumableInfo.value.safetyStock}`, cls: 'text-warning-600' }
  return null
})

const handleClose = () => {
  emit('close')
}

const fetchEntityData = async () => {
  if (!props.defaultEntityType || !props.defaultEntityId) {
    const scanCode = props.scannedCode
    if (!scanCode) {
      error.value = '未提供扫码内容'
      return
    }
    if (scanCode.startsWith('RGT-')) {
      entityType.value = 'reagent'
    } else if (scanCode.startsWith('BCH-')) {
      entityType.value = 'batch'
    } else if (scanCode.startsWith('CON-')) {
      entityType.value = 'consumable'
    }
    const idPart = scanCode.replace(/^(RGT|BCH|CON)-/, '')
    if (!entityType.value) {
      error.value = '无法识别的标签编码'
      return
    }
    await loadEntityById(entityType.value, idPart)
    return
  }

  entityType.value = props.defaultEntityType
  await loadEntityById(entityType.value, props.defaultEntityId)
}

const loadEntityById = async (type: LabelEntityType, id: string) => {
  loading.value = true
  error.value = ''
  entityData.value = null
  try {
    if (type === 'reagent') {
      const data = await mockGetReagent(id)
      if (!data) {
        error.value = '未找到对应的试剂信息'
      } else {
        entityData.value = data
      }
    } else if (type === 'batch') {
      const data = await mockGetBatch(id)
      if (!data) {
        error.value = '未找到对应的批次信息'
      } else {
        entityData.value = data
      }
    } else {
      const data = await mockGetConsumable(id)
      if (!data) {
        error.value = '未找到对应的耗材信息'
      } else {
        entityData.value = data
      }
    }
  } catch (e: any) {
    error.value = e.message || '查询失败'
  } finally {
    loading.value = false
  }
}

const goToDetail = () => {
  if (!entityType.value || !entityData.value) return
  if (entityType.value === 'reagent') {
    router.push({ name: 'reagents' })
  } else if (entityType.value === 'batch') {
    router.push({ name: 'batches' })
  } else {
    router.push({ name: 'consumable-detail', params: { id: (entityData.value as Consumable).id } })
  }
  handleClose()
}

const openPrintDialog = () => {
  if (!entityType.value || !entityData.value) return
  let code = ''
  let name = ''
  let specification = ''
  let batchNumber = ''
  let expiryDate = ''
  let location = ''
  let manufacturer = ''
  let unit = ''
  let quantity: number | undefined
  let storageCondition = ''
  let entityId = ''

  if (reagentInfo.value) {
    const r = reagentInfo.value
    entityId = r.id
    code = r.catalogNumber || r.id
    name = r.name
    specification = r.specification
    manufacturer = r.manufacturer
    unit = r.unit
    storageCondition = r.storageCondition
  } else if (batchInfo.value) {
    const b = batchInfo.value
    entityId = b.id
    code = b.batchNumber
    name = b.reagentName || ''
    batchNumber = b.batchNumber
    specification = ''
    expiryDate = b.expiryDate
    location = b.storageLocation
    unit = b.unit
    quantity = b.remainingQuantity
  } else if (consumableInfo.value) {
    const c = consumableInfo.value
    entityId = c.id
    code = c.id
    name = c.name
    specification = c.specification
    location = c.location
    manufacturer = c.manufacturer
    unit = c.unit
    quantity = c.stockQuantity
  }

  labelData.value = {
    entityType: entityType.value,
    entityId,
    code,
    name,
    batchNumber: batchNumber || undefined,
    specification,
    expiryDate: expiryDate || undefined,
    location: location || undefined,
    manufacturer: manufacturer || undefined,
    unit: unit || undefined,
    quantity,
    storageCondition: storageCondition || undefined,
  }
  showPrintDialog.value = true
}

onMounted(() => {
  if (props.visible) {
    fetchEntityData()
  }
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="fixed inset-0 z-[9999] flex items-center justify-center"
    >
      <div
        class="absolute inset-0 bg-black/50"
        @click="handleClose"
      />
      <div
        class="relative bg-white rounded-2xl shadow-2xl w-[92vw] max-w-[520px] max-h-[90vh] overflow-hidden flex flex-col"
      >
        <div class="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-primary-50 to-transparent">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-primary-500 flex items-center justify-center">
              <ScanLine class="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 class="text-lg font-bold text-gray-900">扫码查询结果</h3>
              <p class="text-xs text-gray-500 mt-0.5">{{ entityTypeLabel }}基础信息卡片</p>
            </div>
          </div>
          <button
            class="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            @click="handleClose"
          >
            <X class="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div class="flex-1 overflow-y-auto p-5">
          <div v-if="loading" class="py-16 flex items-center justify-center">
            <div class="animate-spin w-7 h-7 border-2 border-primary-500 border-t-transparent rounded-full" />
          </div>

          <div v-else-if="error" class="py-12 text-center">
            <div class="w-16 h-16 rounded-full bg-danger-50 flex items-center justify-center mx-auto mb-4">
              <span class="text-3xl">⚠️</span>
            </div>
            <div class="text-base font-medium text-gray-800 mb-1">查询失败</div>
            <div class="text-sm text-gray-500">{{ error }}</div>
          </div>

          <template v-else-if="entityData && entityType">
            <div
              v-if="reagentInfo"
              class="space-y-4"
            >
              <div class="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-br from-indigo-50 to-primary-50 border border-indigo-100">
                <div class="w-14 h-14 rounded-xl bg-white shadow-sm flex items-center justify-center flex-shrink-0">
                  <span class="text-2xl">🧪</span>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-start justify-between gap-2">
                    <h4 class="text-lg font-bold text-gray-900 truncate">{{ reagentInfo.name }}</h4>
                    <span
                      v-if="statusInfo"
                      class="flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-medium"
                      :class="statusInfo.cls"
                    >
                      {{ statusInfo.label }}
                    </span>
                  </div>
                  <div class="mt-1 flex flex-wrap gap-1.5">
                    <span class="px-2 py-0.5 rounded-full bg-white/80 text-xs text-indigo-700 font-medium">{{ reagentInfo.category }}</span>
                    <span
                      v-if="reagentInfo.hazardLevel"
                      class="px-2 py-0.5 rounded-full text-xs font-medium"
                      :class="hazardLevelColors[reagentInfo.hazardLevel]"
                    >
                      {{ hazardLevelLabels[reagentInfo.hazardLevel] }}
                    </span>
                  </div>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div class="p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <div class="text-[11px] text-gray-500 mb-1 flex items-center gap-1">
                    <Package class="w-3 h-3" /> 货号
                  </div>
                  <div class="text-sm font-semibold text-gray-800 truncate">{{ reagentInfo.catalogNumber || '-' }}</div>
                </div>
                <div class="p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <div class="text-[11px] text-gray-500 mb-1 flex items-center gap-1">
                    📐 规格
                  </div>
                  <div class="text-sm font-semibold text-gray-800 truncate">{{ reagentInfo.specification }}</div>
                </div>
                <div class="p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <div class="text-[11px] text-gray-500 mb-1 flex items-center gap-1">
                    <Factory class="w-3 h-3" /> 厂家
                  </div>
                  <div class="text-sm font-semibold text-gray-800 truncate">{{ reagentInfo.manufacturer || '-' }}</div>
                </div>
                <div class="p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <div class="text-[11px] text-gray-500 mb-1 flex items-center gap-1">
                    ❄️ 存储
                  </div>
                  <div class="text-sm font-semibold text-gray-800 truncate">{{ reagentInfo.storageCondition }}</div>
                </div>
                <div class="p-3 rounded-xl bg-gray-50 border border-gray-100 col-span-2">
                  <div class="text-[11px] text-gray-500 mb-1">CAS 号</div>
                  <div class="text-sm font-semibold text-gray-800 truncate">{{ reagentInfo.casNumber || '-' }}</div>
                </div>
              </div>
            </template>

            <template v-else-if="batchInfo">
              <div class="space-y-4">
                <div class="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-success-50 border border-emerald-100">
                  <div class="w-14 h-14 rounded-xl bg-white shadow-sm flex items-center justify-center flex-shrink-0">
                    <span class="text-2xl">📦</span>
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-start justify-between gap-2">
                      <h4 class="text-lg font-bold text-gray-900 truncate">{{ batchInfo.reagentName }}</h4>
                      <span
                        v-if="statusInfo"
                        class="flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-medium"
                        :class="statusInfo.cls"
                      >
                        {{ statusInfo.label }}
                      </span>
                    </div>
                    <div class="mt-1">
                      <span class="px-2 py-0.5 rounded-full bg-white/80 text-xs text-emerald-700 font-mono font-semibold">
                        批次号：{{ batchInfo.batchNumber }}
                      </span>
                    </div>
                    <div
                      v-if="expiryWarning"
                      class="mt-2 text-xs font-medium flex items-center gap-1"
                      :class="expiryWarning.cls"
                    >
                      <Calendar class="w-3 h-3" />
                      {{ expiryWarning.text }}
                    </div>
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-3">
                  <div class="p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <div class="text-[11px] text-gray-500 mb-1 flex items-center gap-1">
                      📊 剩余库存
                    </div>
                    <div class="text-sm font-semibold text-gray-800">
                      {{ batchInfo.remainingQuantity }} <span class="text-xs font-normal text-gray-500">{{ batchInfo.unit }}</span>
                    </div>
                  </div>
                  <div class="p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <div class="text-[11px] text-gray-500 mb-1 flex items-center gap-1">
                      <MapPin class="w-3 h-3" /> 库位
                    </div>
                    <div class="text-sm font-semibold text-gray-800 truncate">{{ batchInfo.storageLocation }}</div>
                  </div>
                  <div class="p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <div class="text-[11px] text-gray-500 mb-1 flex items-center gap-1">
                      <Calendar class="w-3 h-3" /> 生产日期
                    </div>
                    <div class="text-sm font-semibold text-gray-800 truncate">{{ formatDate(batchInfo.productionDate) }}</div>
                  </div>
                  <div class="p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <div class="text-[11px] text-gray-500 mb-1 flex items-center gap-1">
                      ⏳ 有效期
                    </div>
                    <div class="text-sm font-semibold text-gray-800 truncate">{{ formatDate(batchInfo.expiryDate) }}</div>
                  </div>
                </div>
              </div>
            </template>

            <template v-else-if="consumableInfo">
              <div class="space-y-4">
                <div class="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-br from-amber-50 to-warning-50 border border-amber-100">
                  <div class="w-14 h-14 rounded-xl bg-white shadow-sm flex items-center justify-center flex-shrink-0">
                    <span class="text-2xl">📦</span>
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-start justify-between gap-2">
                      <h4 class="text-lg font-bold text-gray-900 truncate">{{ consumableInfo.name }}</h4>
                      <span
                        v-if="statusInfo"
                        class="flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-medium"
                        :class="statusInfo.cls"
                      >
                        {{ statusInfo.label }}
                      </span>
                    </div>
                    <div class="mt-1 flex flex-wrap gap-1.5">
                      <span class="px-2 py-0.5 rounded-full bg-white/80 text-xs text-amber-700 font-medium">{{ consumableInfo.category }}</span>
                    </div>
                    <div
                      v-if="lowStockWarning"
                      class="mt-2 text-xs font-medium flex items-center gap-1"
                      :class="lowStockWarning.cls"
                    >
                      <span>⚠️</span>
                      {{ lowStockWarning.text }}
                    </div>
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-3">
                  <div class="p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <div class="text-[11px] text-gray-500 mb-1 flex items-center gap-1">
                      📊 当前库存
                    </div>
                    <div class="text-sm font-semibold text-gray-800">
                      {{ consumableInfo.stockQuantity }} <span class="text-xs font-normal text-gray-500">{{ consumableInfo.unit }}</span>
                    </div>
                  </div>
                  <div class="p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <div class="text-[11px] text-gray-500 mb-1 flex items-center gap-1">
                      🛡️ 安全库存
                    </div>
                    <div class="text-sm font-semibold text-gray-800">
                      {{ consumableInfo.safetyStock }} <span class="text-xs font-normal text-gray-500">{{ consumableInfo.unit }}</span>
                    </div>
                  </div>
                  <div class="p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <div class="text-[11px] text-gray-500 mb-1 flex items-center gap-1">
                      📐 规格
                    </div>
                    <div class="text-sm font-semibold text-gray-800 truncate">{{ consumableInfo.specification }}</div>
                  </div>
                  <div class="p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <div class="text-[11px] text-gray-500 mb-1 flex items-center gap-1">
                      <MapPin class="w-3 h-3" /> 库位
                    </div>
                    <div class="text-sm font-semibold text-gray-800 truncate">{{ consumableInfo.location || '-' }}</div>
                  </div>
                  <div class="p-3 rounded-xl bg-gray-50 border border-gray-100 col-span-2">
                    <div class="text-[11px] text-gray-500 mb-1 flex items-center gap-1">
                      <Factory class="w-3 h-3" /> 生产厂家
                    </div>
                    <div class="text-sm font-semibold text-gray-800 truncate">{{ consumableInfo.manufacturer || '-' }}</div>
                  </div>
                </div>
              </div>
            </template>
          </template>
        </div>

        <div
          v-if="!loading && !error && entityData"
          class="px-5 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center gap-3"
        >
          <button
            class="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold text-sm transition-colors"
            @click="openPrintDialog"
          >
            <Printer class="w-4 h-4" />
            打印标签
          </button>
          <button
            class="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-semibold text-sm shadow-sm transition-colors"
            @click="goToDetail"
          >
            <ExternalLink class="w-4 h-4" />
            查看详情
          </button>
        </div>
      </div>

      <LabelPrintDialog
        :visible="showPrintDialog"
        :label-data="labelData"
        @close="showPrintDialog = false"
      />
    </div>
  </Teleport>
</template>
