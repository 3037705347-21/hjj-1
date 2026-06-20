<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  Plus,
  X,
  Eye,
  ArrowDownCircle,
  ArrowUpCircle,
  Calendar,
  MapPin,
  Package,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  FileText,
  MoreHorizontal,
  ArrowLeftRight,
  PlusCircle,
  MinusCircle,
  Trash2,
  Snowflake,
  Sun,
  PackageOpen,
  ClipboardCheck,
  CalendarClock,
  ChevronDown,
  Printer,
  ScanLine,
} from 'lucide-vue-next'
import DataTableFilter from '@/components/DataTableFilter.vue'
import type { FilterField } from '@/components/DataTableFilter.vue'
import { useSavedFilters } from '@/composables/useSavedFilters'
import { usePermission } from '@/composables/usePermission'
import type { SavedFilter } from '@/composables/useSavedFilters'
import { exportToCsv } from '@/utils/csv'
import {
  mockGetBatches,
  mockCreateBatch,
  mockBatchOutbound,
  mockGetBatch,
  mockBatchDeleteBatches,
  mockBatchUpdateBatchLocation,
  mockBatchUpdateBatchStatus,
  mockBatchImportBatches,
  downloadBatchTemplate,
  mockExportAllBatches,
} from '@/mock/batches'
import { mockGetAllReagents } from '@/mock/reagents'
import type { ImportResult } from '@/components/BatchImportDialog.vue'
import BatchOperationBar from '@/components/BatchOperationBar.vue'
import BatchImportDialog from '@/components/BatchImportDialog.vue'
import BatchEditDialog from '@/components/BatchEditDialog.vue'
import type { BatchEditField } from '@/components/BatchEditDialog.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import type {
  ReagentBatch,
  BatchStatus,
  BatchOperation,
  BatchFormData,
  OutboundFormData,
  BatchOperationType,
} from '@/types/batch'
import {
  batchStatusLabels,
  batchStatusColors,
  operationTypeLabels,
  operationTypeColors,
  operationTypeConfigs,
} from '@/types/batch'
import { storageConditions } from '@/types/reagent'
import type { PageResult } from '@/types/common'
import type { Reagent } from '@/types/reagent'
import type { LabelData, LabelEntityType } from '@/types/label'
import { parseLabelCode } from '@/utils/label'
import { formatDate, getExpiryDays } from '@/utils/date'
import BatchOperationDialog from '@/components/BatchOperationDialog.vue'
import LabelPrintDialog from '@/components/LabelPrintDialog.vue'
import ScanSearchBox from '@/components/ScanSearchBox.vue'
import ScanResultCard from '@/components/ScanResultCard.vue'

const route = useRoute()
const permission = usePermission()
const loading = ref(false)
const data = ref<PageResult<ReagentBatch> | null>(null)
const reagents = ref<Reagent[]>([])

const filters = ref<Record<string, any>>({
  keyword: '',
  status: '',
  reagentId: '',
  storageLocation: '',
  storageCondition: '',
  receivedDate: ['', ''],
  productionDate: ['', ''],
  expiryDate: ['', ''],
  operator: '',
})

const { savedFilters, addFilter, deleteFilter, loadFilters } = useSavedFilters('batch_saved_filters')

const filterFields: FilterField[] = [
  { key: 'reagentId', label: '关联试剂', type: 'select', options: [] },
  { key: 'status', label: '库存状态', type: 'select', options: [
    { label: '正常', value: 'normal' },
    { label: '已用完', value: 'depleted' },
    { label: '临期', value: 'expiring' },
    { label: '过期', value: 'expired' },
  ]},
  { key: 'storageCondition', label: '存储条件', type: 'select', options: storageConditions.map((s) => ({ label: s, value: s })) },
  { key: 'storageLocation', label: '库位', type: 'input', placeholder: '输入库位关键词' },
  { key: 'operator', label: '操作人', type: 'input', placeholder: '输入操作人' },
  { key: 'productionDate', label: '生产日期', type: 'date-range' },
  { key: 'expiryDate', label: '有效期', type: 'date-range' },
  { key: 'receivedDate', label: '入库日期', type: 'date-range' },
]

const pagination = reactive({
  page: 1,
  pageSize: 10,
})

const dynamicFilterFields = computed<FilterField[]>(() => {
  return filterFields.map((f) => {
    if (f.key === 'reagentId') {
      return {
        ...f,
        options: reagents.value.map((r) => ({ label: r.name, value: r.id })),
      }
    }
    return f
  })
})

const showCreateModal = ref(false)
const createLoading = ref(false)
const createForm = reactive<BatchFormData>({
  reagentId: '',
  batchNumber: '',
  productionDate: '',
  expiryDate: '',
  initialQuantity: 0,
  storageLocation: '',
  receivedDate: formatDate(new Date()),
  remark: '',
})

const showDetailModal = ref(false)
const detailLoading = ref(false)
const currentBatch = ref<(ReagentBatch & { operations: BatchOperation[] }) | null>(null)

const showOutboundModal = ref(false)
const outboundLoading = ref(false)
const outboundForm = reactive<OutboundFormData>({
  quantity: 0,
  purpose: '',
})
const outboundBatchId = ref('')

const showOperationDialog = ref(false)
const operationBatch = ref<ReagentBatch | null>(null)
const currentOperationType = ref<BatchOperationType | null>(null)

const openMoreMenuBatchId = ref<string | null>(null)

const selectedIds = ref<string[]>([])
const showImportDialog = ref(false)
const importLoading = ref(false)
const importResult = ref<ImportResult | null>(null)

const showBatchDeleteConfirm = ref(false)
const batchDeleteLoading = ref(false)

const showBatchEditDialog = ref(false)
const batchEditType = ref<'location'>('location')
const batchEditFields = ref<BatchEditField[]>([])
const batchEditLoading = ref(false)

const showPrintDialog = ref(false)
const printLabelData = ref<LabelData | null>(null)
const showScanResult = ref(false)
const scanEntityType = ref<LabelEntityType | null>(null)
const scanEntityId = ref<string | null>(null)
const scannedCode = ref<string | null>(null)

const batchActions = computed(() => [
  { key: 'location', label: '批量修改库位', icon: MapPin, type: 'default' as const, permission: permission.canOperateBatch.value },
  { key: 'freeze', label: '批量冻结', icon: Snowflake, type: 'default' as const, permission: permission.canOperateBatch.value },
  { key: 'unfreeze', label: '批量解冻', icon: Sun, type: 'default' as const, permission: permission.canOperateBatch.value },
  { key: 'delete', label: '批量删除', icon: Trash2, type: 'danger' as const, permission: permission.canDeleteBatch.value },
])

const fetchData = async () => {
  loading.value = true
  try {
    const f = filters.value
    const params = {
      keyword: f.keyword || undefined,
      reagentId: f.reagentId || undefined,
      status: f.status || undefined,
      storageLocation: f.storageLocation || undefined,
      storageCondition: f.storageCondition || undefined,
      operator: f.operator || undefined,
      productionDateStart: f.productionDate?.[0] || undefined,
      productionDateEnd: f.productionDate?.[1] || undefined,
      expiryDateStart: f.expiryDate?.[0] || undefined,
      expiryDateEnd: f.expiryDate?.[1] || undefined,
      receivedDateStart: f.receivedDate?.[0] || undefined,
      receivedDateEnd: f.receivedDate?.[1] || undefined,
    }
    const result = await mockGetBatches(pagination.page, pagination.pageSize, params)
    data.value = result
  } finally {
    loading.value = false
  }
}

const fetchReagents = async () => {
  reagents.value = await mockGetAllReagents()
}

const handleSearch = () => {
  pagination.page = 1
  fetchData()
}

const handleReset = () => {
  pagination.page = 1
  fetchData()
}

const handleSaveFilter = (name: string) => {
  addFilter(name, filters.value)
  alert('筛选条件已保存')
}

const handleApplyFilter = (filter: SavedFilter) => {
  filters.value = { ...filter.values }
  pagination.page = 1
  fetchData()
}

const handleDeleteFilter = (id: string) => {
  if (confirm('确定要删除该筛选条件吗？')) {
    deleteFilter(id)
  }
}

const handleAction = () => {
  showCreateModal.value = true
}

const toggleSelect = (id: string) => {
  const idx = selectedIds.value.indexOf(id)
  if (idx > -1) {
    selectedIds.value.splice(idx, 1)
  } else {
    selectedIds.value.push(id)
  }
}

const toggleSelectAll = () => {
  if (selectedIds.value.length === data.value?.list.length) {
    selectedIds.value = []
  } else {
    selectedIds.value = data.value?.list.map(b => b.id) || []
  }
}

const clearSelection = () => {
  selectedIds.value = []
}

const handleBatchAction = (action: string) => {
  if (selectedIds.value.length === 0) {
    alert('请先选择要操作的记录')
    return
  }
  switch (action) {
    case 'delete':
      showBatchDeleteConfirm.value = true
      break
    case 'location':
      batchEditType.value = 'location'
      batchEditFields.value = [
        {
          key: 'storageLocation',
          label: '库位',
          type: 'input',
          required: true,
          placeholder: '请输入库位',
        },
      ]
      showBatchEditDialog.value = true
      break
    case 'freeze':
      handleBatchStatusUpdate('freeze')
      break
    case 'unfreeze':
      handleBatchStatusUpdate('unfreeze')
      break
  }
}

const handleBatchDelete = async () => {
  batchDeleteLoading.value = true
  try {
    await mockBatchDeleteBatches(selectedIds.value)
    showBatchDeleteConfirm.value = false
    clearSelection()
    if (data.value?.list && selectedIds.value.length >= data.value.list.length && pagination.page > 1) {
      pagination.page--
    }
    fetchData()
    alert('删除成功')
  } catch (e: any) {
    alert(e.message || '删除失败')
  } finally {
    batchDeleteLoading.value = false
  }
}

const handleBatchEditConfirm = async (values: Record<string, any>) => {
  batchEditLoading.value = true
  try {
    if (batchEditType.value === 'location') {
      await mockBatchUpdateBatchLocation(selectedIds.value, values.storageLocation)
    }
    showBatchEditDialog.value = false
    clearSelection()
    fetchData()
    alert('修改成功')
  } catch (e: any) {
    alert(e.message || '修改失败')
  } finally {
    batchEditLoading.value = false
  }
}

const handleBatchStatusUpdate = async (status: 'freeze' | 'unfreeze') => {
  if (!confirm(`确定要批量${status === 'freeze' ? '冻结' : '解冻'}选中的 ${selectedIds.value.length} 条记录吗？`)) {
    return
  }
  try {
    await mockBatchUpdateBatchStatus(selectedIds.value, status)
    clearSelection()
    fetchData()
    alert('操作成功')
  } catch (e: any) {
    alert(e.message || '操作失败')
  }
}

const handleBatchImport = async (file: File) => {
  importLoading.value = true
  importResult.value = null
  try {
    const result = await mockBatchImportBatches(file)
    importResult.value = result
    fetchData()
  } catch (e: any) {
    alert(e.message || '导入失败')
  } finally {
    importLoading.value = false
  }
}

const handleDownloadTemplate = () => {
  downloadBatchTemplate()
}

const handleExport = async () => {
  try {
    const exportFilters = {
      keyword: filters.value.keyword,
      status: filters.value.status,
      reagentId: filters.value.reagentId,
      storageLocation: filters.value.storageLocation,
      storageCondition: filters.value.storageCondition,
      operator: filters.value.operator,
      receivedDateStart: filters.value.receivedDate?.[0] || '',
      receivedDateEnd: filters.value.receivedDate?.[1] || '',
      productionDateStart: filters.value.productionDate?.[0] || '',
      productionDateEnd: filters.value.productionDate?.[1] || '',
      expiryDateStart: filters.value.expiryDate?.[0] || '',
      expiryDateEnd: filters.value.expiryDate?.[1] || '',
    }
    const allData = await mockExportAllBatches(exportFilters)
    if (!allData || allData.length === 0) {
      alert('暂无数据可导出')
      return
    }
    const columns = [
      { key: 'batchNumber', label: '批次号' },
      { key: 'reagentName', label: '试剂名称' },
      { key: 'status', label: '状态', formatter: (v: string) => batchStatusLabels[v as keyof typeof batchStatusLabels] || v },
      { key: 'currentQuantity', label: '当前数量' },
      { key: 'initialQuantity', label: '初始数量' },
      { key: 'productionDate', label: '生产日期' },
      { key: 'expiryDate', label: '有效期' },
      { key: 'receivedDate', label: '入库日期' },
      { key: 'storageLocation', label: '库位' },
      { key: 'operator', label: '操作人' },
      { key: 'remark', label: '备注' },
    ]
    exportToCsv(allData, columns, `批次列表_${formatDate(new Date(), 'YYYYMMDD')}.csv`)
  } catch (e: any) {
    alert(e.message || '导出失败')
  }
}

const handlePageChange = (page: number) => {
  pagination.page = page
  fetchData()
}

const totalPages = computed(() => {
  if (!data.value) return 0
  return Math.ceil(data.value.total / pagination.pageSize)
})

const openCreateModal = () => {
  Object.assign(createForm, {
    reagentId: filters.value.reagentId || (reagents.value[0]?.id || ''),
    batchNumber: '',
    productionDate: '',
    expiryDate: '',
    initialQuantity: 0,
    storageLocation: '',
    receivedDate: formatDate(new Date()),
    remark: '',
  })
  showCreateModal.value = true
}

const handleCreateSubmit = async () => {
  if (!createForm.reagentId) {
    alert('请选择试剂')
    return
  }
  if (!createForm.batchNumber.trim()) {
    alert('请输入批次号')
    return
  }
  if (!createForm.productionDate) {
    alert('请选择生产日期')
    return
  }
  if (!createForm.expiryDate) {
    alert('请选择有效期')
    return
  }
  if (createForm.initialQuantity <= 0) {
    alert('入库数量必须大于0')
    return
  }
  if (!createForm.storageLocation.trim()) {
    alert('请输入存放位置')
    return
  }

  createLoading.value = true
  try {
    await mockCreateBatch(createForm)
    showCreateModal.value = false
    fetchData()
  } catch (e: any) {
    alert(e.message || '创建失败')
  } finally {
    createLoading.value = false
  }
}

const openDetailModal = async (id: string) => {
  detailLoading.value = true
  showDetailModal.value = true
  try {
    const batch = await mockGetBatch(id)
    currentBatch.value = batch
  } finally {
    detailLoading.value = false
  }
}

const refreshDetailModal = async () => {
  if (currentBatch.value) {
    const batch = await mockGetBatch(currentBatch.value.id)
    currentBatch.value = batch
  }
}

const openOutboundModal = (id: string) => {
  outboundBatchId.value = id
  outboundForm.quantity = 0
  outboundForm.purpose = ''
  showOutboundModal.value = true
}

const handleOutboundScan = (payload: { entityType: LabelEntityType | null; entityId: string; code: string }) => {
  if (!payload.entityType || !payload.entityId) {
    alert('未识别到有效的批次标签')
    return
  }
  if (payload.entityType !== 'batch') {
    alert(`扫码识别为${payload.entityType === 'reagent' ? '试剂' : '耗材'}，请扫描批次标签`)
    return
  }
  outboundBatchId.value = payload.entityId
}

const handleOutboundSubmit = async () => {
  if (outboundForm.quantity <= 0) {
    alert('出库数量必须大于0')
    return
  }
  if (!outboundForm.purpose.trim()) {
    alert('请输入用途')
    return
  }

  outboundLoading.value = true
  try {
    await mockBatchOutbound(outboundBatchId.value, outboundForm)
    showOutboundModal.value = false
    fetchData()
    if (currentBatch.value && currentBatch.value.id === outboundBatchId.value) {
      refreshDetailModal()
    }
  } catch (e: any) {
    alert(e.message || '出库失败')
  } finally {
    outboundLoading.value = false
  }
}

const toggleMoreMenu = (batchId: string, event: MouseEvent) => {
  event.stopPropagation()
  openMoreMenuBatchId.value = openMoreMenuBatchId.value === batchId ? null : batchId
}

const closeMoreMenu = () => {
  openMoreMenuBatchId.value = null
}

const isOperationDisabled = (batch: ReagentBatch, opType: BatchOperationType): boolean => {
  const config = operationTypeConfigs.find((c) => c.type === opType)
  if (!config) return true
  return config.disabledStatuses.includes(batch.status)
}

const openOperation = (batch: ReagentBatch, opType: BatchOperationType) => {
  if (isOperationDisabled(batch, opType)) {
    return
  }
  operationBatch.value = batch
  currentOperationType.value = opType
  showOperationDialog.value = true
  openMoreMenuBatchId.value = null
}

const handleOperationScanBatch = async (batchId: string) => {
  try {
    const data = await mockGetBatch(batchId)
    if (!data) {
      alert('扫码未找到对应批次，请检查标签是否有效')
      return
    }
    if (isOperationDisabled(data, currentOperationType.value as BatchOperationType)) {
      alert(`当前批次状态「${batchStatusLabels[data.status as BatchStatus]}」不支持此操作`)
      return
    }
    operationBatch.value = data
  } catch (e: any) {
    alert(e.message || '切换批次失败')
  }
}

const handleOperationSuccess = () => {
  fetchData()
  if (currentBatch.value && operationBatch.value && currentBatch.value.id === operationBatch.value.id) {
    refreshDetailModal()
  }
}

const getDaysLabel = (batch: ReagentBatch) => {
  const days = getExpiryDays(batch.expiryDate)
  if (days < 0) {
    return `已过期 ${Math.abs(days)} 天`
  }
  if (days === 0) {
    return '今天到期'
  }
  return `剩余 ${days} 天`
}

const getUsagePercentage = (batch: ReagentBatch) => {
  if (batch.initialQuantity <= 0) return 0
  return ((batch.initialQuantity - batch.remainingQuantity) / batch.initialQuantity) * 100
}

const filterByReagent = (reagentId: string) => {
  filters.value.reagentId = filters.value.reagentId === reagentId ? '' : reagentId
  pagination.page = 1
  fetchData()
}

const openPrintDialog = (batch: ReagentBatch) => {
  printLabelData.value = {
    entityType: 'batch',
    entityId: batch.id,
    code: batch.batchNumber,
    name: batch.reagentName || '',
    batchNumber: batch.batchNumber,
    specification: '',
    expiryDate: batch.expiryDate,
    location: batch.storageLocation,
    unit: batch.unit,
    quantity: batch.remainingQuantity,
  }
  showPrintDialog.value = true
}

const handleScan = (payload: { entityType: LabelEntityType | null; entityId: string; code: string }) => {
  scannedCode.value = payload.code
  scanEntityType.value = payload.entityType
  scanEntityId.value = payload.entityId
  showScanResult.value = true
}

const getOperationIconComponent = (iconName: string) => {
  const map: Record<string, any> = {
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
  return map[iconName] || Package
}

const getQuantityChangeText = (op: BatchOperation) => {
  if (['freeze', 'unfreeze', 'open', 'retest', 'extend_retest'].includes(op.type)) {
    return '—'
  }
  const diff = op.afterQuantity - op.beforeQuantity
  const sign = diff > 0 ? '+' : ''
  return `${sign}${diff}`
}

const getQuantityChangeColor = (op: BatchOperation) => {
  if (['freeze', 'unfreeze', 'open', 'retest', 'extend_retest'].includes(op.type)) {
    return 'text-gray-400'
  }
  const diff = op.afterQuantity - op.beforeQuantity
  if (diff > 0) return 'text-success-600'
  if (diff < 0) return 'text-danger-600'
  return 'text-gray-500'
}

watch(
  () => route.query.reagentId,
  (val) => {
    if (val && typeof val === 'string') {
      filters.value.reagentId = val
    }
  },
  { immediate: true }
)

onMounted(() => {
  fetchReagents().then(() => {
    fetchData()
  })

  document.addEventListener('click', closeMoreMenu)
})
</script>

<template>
  <div class="space-y-6">
    <DataTableFilter
      v-model="filters"
      :filter-fields="dynamicFilterFields"
      :saved-filters="savedFilters"
      :action-button-text="permission.canCreateBatch ? '录入批次' : undefined"
      keyword-placeholder="搜索批次号、试剂名称、CAS号、厂家、货号、库位..."
      @search="handleSearch"
      @reset="handleReset"
      @action="handleAction"
      @save-filter="handleSaveFilter"
      @apply-filter="handleApplyFilter"
      @delete-filter="handleDeleteFilter"
    />

    <div class="flex items-center gap-3 mb-2">
      <div class="flex-1 max-w-md">
        <ScanSearchBox
          placeholder="扫码或输入批次号..."
          @scan="handleScan"
        />
      </div>
    </div>

    <BatchOperationBar
      :selected-count="selectedIds.length"
      :total-count="data?.total || 0"
      :actions="batchActions"
      :show-import="permission.canCreateBatch.value"
      :show-export="permission.canViewBatches.value"
      :show-template="permission.canCreateBatch.value"
      :import-permission="permission.canCreateBatch.value"
      :export-permission="permission.canViewBatches.value"
      @action="handleBatchAction"
      @import="showImportDialog = true; importResult = null"
      @export="handleExport"
      @download-template="handleDownloadTemplate"
      @clear-selection="clearSelection"
    />

    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div
        v-for="r in reagents.slice(0, 4)"
        :key="r.id"
        class="bg-white rounded-xl p-4 shadow-card cursor-pointer hover:shadow-card-hover transition-all duration-200"
        :class="{ 'ring-2 ring-primary-500': filters.reagentId === r.id }"
        @click="filterByReagent(r.id)"
      >
        <div class="text-sm text-gray-500 mb-1">
          {{ r.name }}
        </div>
        <div class="text-lg font-semibold text-gray-800">
          {{ data?.list.filter((b) => b.reagentId === r.id).length || 0 }} 批次
        </div>
      </div>
    </div>

    <div class="bg-white rounded-xl shadow-card overflow-hidden">
      <div
        v-if="loading"
        class="p-16 flex items-center justify-center"
      >
        <div class="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
      </div>

      <div v-else>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50 border-b border-gray-100">
              <tr>
                <th class="w-12 px-6 py-4 text-left">
                  <input
                    type="checkbox"
                    :checked="selectedIds.length > 0 && selectedIds.length === data?.list.length"
                    :indeterminate="selectedIds.length > 0 && selectedIds.length < (data?.list.length || 0)"
                    class="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                    @change="toggleSelectAll"
                  >
                </th>
                <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  试剂名称
                </th>
                <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  批次号
                </th>
                <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  有效期
                </th>
                <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  库存
                </th>
                <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  存放位置
                </th>
                <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th class="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr
                v-for="batch in data?.list"
                :key="batch.id"
                :class="[
                  'hover:bg-gray-50 transition-colors cursor-pointer',
                  selectedIds.includes(batch.id) ? 'bg-primary-50/50' : '',
                  {
                    'bg-warning-50/30': batch.status === 'warning',
                    'bg-danger-50/20': batch.status === 'expired',
                    'bg-info-50/20': batch.status === 'frozen',
                  }
                ]"
                @click="openDetailModal(batch.id)"
              >
                <td class="w-12 px-6 py-4" @click.stop>
                  <input
                    type="checkbox"
                    :checked="selectedIds.includes(batch.id)"
                    class="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                    @change="toggleSelect(batch.id)"
                  >
                </td>
                <td class="px-6 py-4">
                  <div class="font-medium text-gray-900">
                    {{ batch.reagentName }}
                  </div>
                </td>
                <td class="px-6 py-4 font-mono text-sm text-gray-600">
                  {{ batch.batchNumber }}
                </td>
                <td class="px-6 py-4">
                  <div class="text-gray-900">
                    {{ formatDate(batch.expiryDate) }}
                  </div>
                  <div
                    class="text-xs mt-0.5 flex items-center gap-1"
                    :class="{
                      'text-danger-600': batch.status === 'expired',
                      'text-warning-600': batch.status === 'warning',
                      'text-info-600': batch.status === 'frozen',
                      'text-gray-400': batch.status === 'normal' || batch.status === 'exhausted',
                    }"
                  >
                    <AlertTriangle
                      v-if="batch.status === 'warning' || batch.status === 'expired'"
                      class="w-3 h-3"
                    />
                    <Snowflake
                      v-else-if="batch.status === 'frozen'"
                      class="w-3 h-3"
                    />
                    {{ batch.status === 'frozen' ? '已冻结' : getDaysLabel(batch) }}
                  </div>
                </td>
                <td class="px-6 py-4">
                  <div class="flex items-center gap-3">
                    <div class="w-24">
                      <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          class="h-full rounded-full transition-all"
                          :class="{
                            'bg-success-500': getUsagePercentage(batch) < 50,
                            'bg-warning-500': getUsagePercentage(batch) >= 50 && getUsagePercentage(batch) < 80,
                            'bg-danger-500': getUsagePercentage(batch) >= 80,
                          }"
                          :style="{ width: `${100 - getUsagePercentage(batch)}%` }"
                        />
                      </div>
                    </div>
                    <div class="text-sm">
                      <span class="font-medium text-gray-900">{{ batch.remainingQuantity }}</span>
                      <span class="text-gray-400"> / {{ batch.initialQuantity }} {{ batch.unit }}</span>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4">
                  <div class="flex items-center gap-1 text-sm text-gray-600">
                    <MapPin class="w-3.5 h-3.5 text-gray-400" />
                    {{ batch.storageLocation }}
                  </div>
                </td>
                <td class="px-6 py-4">
                  <span
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                    :class="batchStatusColors[batch.status]"
                  >
                    {{ batchStatusLabels[batch.status] }}
                  </span>
                </td>
                <td
                  class="px-6 py-4"
                  @click.stop
                >
                  <div class="flex items-center justify-center gap-2">
                    <button
                      class="p-1.5 text-primary-600 hover:bg-primary-50 rounded transition-colors"
                      title="查看详情"
                      @click="openDetailModal(batch.id)"
                    >
                      <Eye class="w-4 h-4" />
                    </button>
                    <button
                      class="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                      title="打印标签"
                      @click="openPrintDialog(batch)"
                    >
                      <Printer class="w-4 h-4" />
                    </button>
                    <button
                      v-if="permission.canOutboundBatch && batch.status !== 'expired' && batch.status !== 'exhausted' && batch.status !== 'frozen'"
                      class="p-1.5 text-success-600 hover:bg-success-50 rounded transition-colors"
                      title="出库"
                      @click="openOutboundModal(batch.id)"
                    >
                      <ArrowDownCircle class="w-4 h-4" />
                    </button>
                    <div
                      v-if="permission.canOperateBatch"
                      class="relative"
                    >
                      <button
                        class="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                        title="更多操作"
                        @click="toggleMoreMenu(batch.id, $event)"
                      >
                        <MoreHorizontal class="w-4 h-4" />
                      </button>
                      <div
                        v-if="openMoreMenuBatchId === batch.id"
                        class="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-30"
                      >
                        <button
                          v-for="op in operationTypeConfigs"
                          :key="op.type"
                          class="w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors"
                          :class="
                            isOperationDisabled(batch, op.type)
                              ? 'text-gray-300 cursor-not-allowed'
                              : 'text-gray-700 hover:bg-gray-50'
                          "
                          :disabled="isOperationDisabled(batch, op.type)"
                          @click="openOperation(batch, op.type)"
                        >
                          <component
                            :is="getOperationIconComponent(op.icon)"
                            class="w-4 h-4"
                          />
                          {{ op.label }}
                        </button>
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div
          v-if="data?.list.length === 0"
          class="p-16 text-center"
        >
          <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <Package class="w-8 h-8 text-gray-300" />
          </div>
          <p class="text-gray-400">
            暂无批次数据
          </p>
        </div>

        <div
          v-if="data && data.total > 0"
          class="px-6 py-4 border-t border-gray-100 flex items-center justify-between"
        >
          <div class="text-sm text-gray-500">
            共 {{ data.total }} 条记录，第 {{ pagination.page }} / {{ totalPages }} 页
          </div>
          <div class="flex items-center gap-2">
            <button
              :disabled="pagination.page <= 1"
              class="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              @click="handlePageChange(pagination.page - 1)"
            >
              <ChevronLeft class="w-4 h-4" />
            </button>
            <button
              v-for="p in Math.min(5, totalPages)"
              :key="p"
              class="min-w-9 h-9 px-3 rounded-lg text-sm transition-colors"
              :class="[
                pagination.page === p + Math.max(0, pagination.page - 3)
                  ? 'bg-primary-600 text-white'
                  : 'border border-gray-200 hover:bg-gray-50 text-gray-600',
              ]"
              @click="handlePageChange(p + Math.max(0, pagination.page - 3))"
            >
              {{ p + Math.max(0, pagination.page - 3) }}
            </button>
            <button
              :disabled="pagination.page >= totalPages"
              class="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              @click="handlePageChange(pagination.page + 1)"
            >
              <ChevronRight class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="showCreateModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      @click.self="showCreateModal = false"
    >
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 class="text-lg font-semibold text-gray-800">
            录入新批次
          </h3>
          <button
            class="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            @click="showCreateModal = false"
          >
            <X class="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div class="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">
              试剂 <span class="text-red-500">*</span>
            </label>
            <select
              v-model="createForm.reagentId"
              class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-white"
            >
              <option value="">
                请选择试剂
              </option>
              <option
                v-for="r in reagents"
                :key="r.id"
                :value="r.id"
              >
                {{ r.name }} ({{ r.specification }})
              </option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">
              批次号 <span class="text-red-500">*</span>
            </label>
            <input
              v-model="createForm.batchNumber"
              type="text"
              class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-mono"
              placeholder="如：BSA20250101"
            >
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">
                生产日期 <span class="text-red-500">*</span>
              </label>
              <input
                v-model="createForm.productionDate"
                type="date"
                class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
              >
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">
                有效期至 <span class="text-red-500">*</span>
              </label>
              <input
                v-model="createForm.expiryDate"
                type="date"
                class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
              >
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">
                入库数量 <span class="text-red-500">*</span>
              </label>
              <input
                v-model.number="createForm.initialQuantity"
                type="number"
                min="0"
                step="0.01"
                class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                placeholder="0"
              >
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">
                入库日期
              </label>
              <input
                v-model="createForm.receivedDate"
                type="date"
                class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
              >
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">
              存放位置 <span class="text-red-500">*</span>
            </label>
            <input
              v-model="createForm.storageLocation"
              type="text"
              class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
              placeholder="如：A-01-03"
            >
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">
              备注
            </label>
            <textarea
              v-model="createForm.remark"
              rows="2"
              class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all resize-none"
              placeholder="可选备注信息"
            />
          </div>
        </div>

        <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
          <button
            class="px-5 py-2.5 border border-gray-200 hover:bg-gray-100 text-gray-600 rounded-lg transition-colors"
            @click="showCreateModal = false"
          >
            取消
          </button>
          <button
            :disabled="createLoading"
            class="px-5 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded-lg transition-all disabled:opacity-70 flex items-center gap-2"
            @click="handleCreateSubmit"
          >
            <span
              v-if="createLoading"
              class="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"
            />
            确认录入
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="showDetailModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      @click.self="showDetailModal = false"
    >
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h3 class="text-lg font-semibold text-gray-800">
              批次详情
            </h3>
            <p class="text-sm text-gray-500 mt-0.5 font-mono">
              {{ currentBatch?.batchNumber }}
            </p>
          </div>
          <button
            class="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            @click="showDetailModal = false"
          >
            <X class="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div
          v-if="detailLoading"
          class="flex-1 p-12 flex items-center justify-center"
        >
          <div class="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
        </div>

        <div
          v-else-if="currentBatch"
          class="flex-1 overflow-y-auto"
        >
          <div class="p-6 space-y-6">
            <div class="grid grid-cols-2 gap-4">
              <div class="p-4 bg-gray-50 rounded-xl">
                <div class="text-xs text-gray-500 mb-1">
                  试剂名称
                </div>
                <div class="font-semibold text-gray-800">
                  {{ currentBatch.reagentName }}
                </div>
              </div>
              <div class="p-4 bg-gray-50 rounded-xl">
                <div class="text-xs text-gray-500 mb-1">
                  批次号
                </div>
                <div class="font-semibold text-gray-800 font-mono">
                  {{ currentBatch.batchNumber }}
                </div>
              </div>
            </div>

            <div class="grid grid-cols-3 gap-4">
              <div class="p-4 bg-gray-50 rounded-xl">
                <div class="text-xs text-gray-500 mb-1 flex items-center gap-1">
                  <Calendar class="w-3 h-3" />
                  生产日期
                </div>
                <div class="font-medium text-gray-800">
                  {{ formatDate(currentBatch.productionDate) }}
                </div>
              </div>
              <div
                class="p-4 rounded-xl"
                :class="
                  currentBatch.status === 'expired'
                    ? 'bg-danger-50'
                    : currentBatch.status === 'warning'
                      ? 'bg-warning-50'
                      : currentBatch.status === 'frozen'
                        ? 'bg-info-50'
                        : 'bg-gray-50'
                "
              >
                <div class="text-xs text-gray-500 mb-1 flex items-center gap-1">
                  <Clock class="w-3 h-3" />
                  有效期至
                </div>
                <div
                  class="font-medium"
                  :class="
                    currentBatch.status === 'expired'
                      ? 'text-danger-600'
                      : currentBatch.status === 'warning'
                        ? 'text-warning-600'
                        : currentBatch.status === 'frozen'
                          ? 'text-info-600'
                          : 'text-gray-800'
                  "
                >
                  {{ formatDate(currentBatch.expiryDate) }}
                </div>
                <div
                  class="text-xs mt-0.5"
                  :class="
                    currentBatch.status === 'expired'
                      ? 'text-danger-500'
                      : currentBatch.status === 'warning'
                        ? 'text-warning-500'
                        : currentBatch.status === 'frozen'
                          ? 'text-info-500'
                          : 'text-gray-400'
                  "
                >
                  {{ currentBatch.status === 'frozen' ? '已冻结' : getDaysLabel(currentBatch) }}
                </div>
              </div>
              <div class="p-4 bg-gray-50 rounded-xl">
                <div class="text-xs text-gray-500 mb-1 flex items-center gap-1">
                  <MapPin class="w-3 h-3" />
                  存放位置
                </div>
                <div class="font-medium text-gray-800">
                  {{ currentBatch.storageLocation }}
                </div>
              </div>
            </div>

            <div
              v-if="currentBatch.openedAt || currentBatch.lastRetestAt"
              class="grid grid-cols-2 gap-4"
            >
              <div
                v-if="currentBatch.openedAt"
                class="p-4 bg-gray-50 rounded-xl"
              >
                <div class="text-xs text-gray-500 mb-1 flex items-center gap-1">
                  <PackageOpen class="w-3 h-3" />
                  开封时间
                </div>
                <div class="font-medium text-gray-800">
                  {{ formatDate(currentBatch.openedAt, 'YYYY-MM-DD HH:mm') }}
                </div>
              </div>
              <div
                v-if="currentBatch.lastRetestAt"
                class="p-4 bg-gray-50 rounded-xl"
              >
                <div class="text-xs text-gray-500 mb-1 flex items-center gap-1">
                  <ClipboardCheck class="w-3 h-3" />
                  最后复测
                </div>
                <div class="font-medium text-gray-800">
                  {{ formatDate(currentBatch.lastRetestAt, 'YYYY-MM-DD HH:mm') }}
                </div>
              </div>
            </div>

            <div
              class="p-4 rounded-xl"
              :class="
                currentBatch.status === 'frozen'
                  ? 'bg-gradient-to-r from-info-50 to-primary-50'
                  : 'bg-gradient-to-r from-primary-50 to-success-50'
              "
            >
              <div class="flex items-center justify-between mb-3">
                <span class="text-sm font-medium text-gray-700">库存情况</span>
                <span
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                  :class="batchStatusColors[currentBatch.status]"
                >
                  {{ batchStatusLabels[currentBatch.status] }}
                </span>
              </div>
              <div class="flex items-end gap-2 mb-2">
                <span class="text-3xl font-bold text-gray-800">{{ currentBatch.remainingQuantity }}</span>
                <span class="text-gray-400 mb-1">/ {{ currentBatch.initialQuantity }} {{ currentBatch.unit }}</span>
              </div>
              <div class="h-3 bg-white/80 rounded-full overflow-hidden">
                <div
                  class="h-full rounded-full transition-all"
                  :class="{
                    'bg-success-500': 100 - getUsagePercentage(currentBatch) > 50,
                    'bg-warning-500':
                      100 - getUsagePercentage(currentBatch) > 20 && 100 - getUsagePercentage(currentBatch) <= 50,
                    'bg-danger-500': 100 - getUsagePercentage(currentBatch) <= 20,
                  }"
                  :style="{ width: `${100 - getUsagePercentage(currentBatch)}%` }"
                />
              </div>
              <div class="flex justify-between mt-2 text-xs text-gray-500">
                <span>已使用 {{ getUsagePercentage(currentBatch).toFixed(1) }}%</span>
                <span>剩余 {{ (100 - getUsagePercentage(currentBatch)).toFixed(1) }}%</span>
              </div>
            </div>

            <div
              v-if="currentBatch.remark"
              class="p-4 bg-gray-50 rounded-xl"
            >
              <div class="text-xs text-gray-500 mb-1 flex items-center gap-1">
                <FileText class="w-3 h-3" />
                备注
              </div>
              <div class="text-gray-700 text-sm">
                {{ currentBatch.remark }}
              </div>
            </div>

            <div>
              <div class="flex items-center justify-between mb-4">
                <h4 class="font-semibold text-gray-800">
                  操作记录（生命周期）
                </h4>
                <div class="flex items-center gap-2">
                  <button
                    class="px-3 py-1.5 text-sm bg-white hover:bg-gray-50 text-primary-600 border border-primary-200 rounded-lg transition-colors flex items-center gap-1"
                    @click="openPrintDialog(currentBatch)"
                  >
                    <Printer class="w-4 h-4" />
                    打印标签
                  </button>
                  <button
                    v-if="
                      permission.canOutboundBatch &&
                      currentBatch.status !== 'expired' &&
                      currentBatch.status !== 'exhausted' &&
                      currentBatch.status !== 'frozen'
                    "
                    class="px-3 py-1.5 text-sm bg-success-600 hover:bg-success-700 text-white rounded-lg transition-colors flex items-center gap-1"
                    @click="openOutboundModal(currentBatch.id)"
                  >
                    <ArrowDownCircle class="w-4 h-4" />
                    出库
                  </button>
                  <div
                    v-if="permission.canOperateBatch"
                    class="relative"
                  >
                    <button
                      class="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center gap-1"
                      @click="toggleMoreMenu(currentBatch.id, $event)"
                    >
                      更多操作
                      <ChevronDown class="w-4 h-4" />
                    </button>
                    <div
                      v-if="openMoreMenuBatchId === currentBatch.id"
                      class="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-30"
                    >
                      <button
                        v-for="op in operationTypeConfigs"
                        :key="op.type"
                        class="w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors"
                        :class="
                          isOperationDisabled(currentBatch, op.type)
                            ? 'text-gray-300 cursor-not-allowed'
                            : 'text-gray-700 hover:bg-gray-50'
                        "
                        :disabled="isOperationDisabled(currentBatch, op.type)"
                        @click="openOperation(currentBatch, op.type)"
                      >
                        <component
                          :is="getOperationIconComponent(op.icon)"
                          class="w-4 h-4"
                        />
                        {{ op.label }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div class="relative">
                <div class="absolute left-4 top-2 bottom-2 w-0.5 bg-gray-200" />

                <div class="space-y-4">
                  <div
                    v-for="op in currentBatch.operations"
                    :key="op.id"
                    class="relative pl-10"
                  >
                    <div
                      class="absolute left-2 top-1 w-5 h-5 rounded-full border-2 border-white shadow flex items-center justify-center"
                      :class="{
                        'bg-success-500': ['in', 'return', 'stock_in'].includes(op.type),
                        'bg-danger-500': ['out', 'scrap', 'stock_out'].includes(op.type),
                        'bg-info-500': ['transfer', 'freeze', 'unfreeze'].includes(op.type),
                        'bg-neutral-500': ['open', 'retest', 'extend_retest'].includes(op.type),
                      }"
                    >
                      <ArrowUpCircle
                        v-if="['in', 'return', 'stock_in'].includes(op.type)"
                        class="w-3 h-3 text-white"
                      />
                      <ArrowDownCircle
                        v-else-if="['out', 'scrap', 'stock_out'].includes(op.type)"
                        class="w-3 h-3 text-white"
                      />
                      <ArrowLeftRight
                        v-else-if="op.type === 'transfer'"
                        class="w-3 h-3 text-white"
                      />
                      <Snowflake
                        v-else-if="op.type === 'freeze'"
                        class="w-3 h-3 text-white"
                      />
                      <Sun
                        v-else-if="op.type === 'unfreeze'"
                        class="w-3 h-3 text-white"
                      />
                      <PackageOpen
                        v-else-if="op.type === 'open'"
                        class="w-3 h-3 text-white"
                      />
                      <ClipboardCheck
                        v-else-if="op.type === 'retest' || op.type === 'extend_retest'"
                        class="w-3 h-3 text-white"
                      />
                    </div>

                    <div class="bg-gray-50 rounded-lg p-3">
                      <div class="flex items-center justify-between mb-2">
                        <div class="flex items-center gap-2 flex-wrap">
                          <span
                            class="text-xs font-medium px-2 py-0.5 rounded"
                            :class="operationTypeColors[op.type]"
                          >
                            {{ operationTypeLabels[op.type] }}
                          </span>
                          <span
                            v-if="op.quantity > 0 || !['freeze', 'unfreeze', 'open', 'retest', 'extend_retest'].includes(op.type)"
                            class="text-sm font-semibold"
                            :class="getQuantityChangeColor(op)"
                          >
                            {{ getQuantityChangeText(op) }}
                          </span>
                          <span
                            v-if="op.targetLocation"
                            class="text-xs text-gray-500"
                          >
                            → {{ op.targetLocation }}
                          </span>
                        </div>
                        <span class="text-xs text-gray-400">
                          {{ formatDate(op.createdAt, 'MM-DD HH:mm') }}
                        </span>
                      </div>
                      <div class="flex items-center gap-2 text-xs text-gray-500 mb-1.5 flex-wrap">
                        <User class="w-3 h-3" />
                        <span>{{ op.operatorName }}</span>
                        <span v-if="op.purpose">· {{ op.purpose }}</span>
                        <span v-if="op.reason">· 原因：{{ op.reason }}</span>
                      </div>
                      <div class="text-xs text-gray-400 flex items-center gap-3 flex-wrap">
                        <span>操作前：{{ op.beforeQuantity }}</span>
                        <span>→</span>
                        <span>操作后：{{ op.afterQuantity }}</span>
                        <span v-if="op.newExpiryDate">
                          · 新有效期：{{ formatDate(op.newExpiryDate) }}
                        </span>
                      </div>
                      <div
                        v-if="op.remark"
                        class="text-xs text-gray-500 mt-1.5 pt-1.5 border-t border-gray-200"
                      >
                        备注：{{ op.remark }}
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  v-if="currentBatch.operations.length === 0"
                  class="text-center py-8 text-gray-400 text-sm"
                >
                  暂无操作记录
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 flex-shrink-0">
          <button
            class="px-5 py-2.5 border border-gray-200 hover:bg-gray-100 text-gray-600 rounded-lg transition-colors"
            @click="showDetailModal = false"
          >
            关闭
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="showOutboundModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      @click.self="showOutboundModal = false"
    >
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 class="text-lg font-semibold text-gray-800">
            批次出库
          </h3>
          <button
            class="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            @click="showOutboundModal = false"
          >
            <X class="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div class="p-6 space-y-4">
          <div class="p-3 bg-primary-50 rounded-xl border border-primary-100">
            <div class="text-xs text-primary-700 font-medium mb-2 flex items-center gap-1">
              <ScanLine class="w-3.5 h-3.5" />
              扫码快速定位批次（预留接入扫码枪）
            </div>
            <ScanSearchBox
              placeholder="扫描批次标签或输入编号..."
              @scan="handleOutboundScan"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">
              出库数量 <span class="text-red-500">*</span>
            </label>
            <input
              v-model.number="outboundForm.quantity"
              type="number"
              min="0"
              step="0.01"
              class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
              placeholder="请输入出库数量"
            >
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">
              用途 <span class="text-red-500">*</span>
            </label>
            <textarea
              v-model="outboundForm.purpose"
              rows="3"
              class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all resize-none"
              placeholder="请输入实验用途"
            />
          </div>
        </div>

        <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
          <button
            class="px-5 py-2.5 border border-gray-200 hover:bg-gray-100 text-gray-600 rounded-lg transition-colors"
            @click="showOutboundModal = false"
          >
            取消
          </button>
          <button
            :disabled="outboundLoading"
            class="px-5 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded-lg transition-all disabled:opacity-70 flex items-center gap-2"
            @click="handleOutboundSubmit"
          >
            <span
              v-if="outboundLoading"
              class="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"
            />
            确认出库
          </button>
        </div>
      </div>
    </div>

    <BatchOperationDialog
      v-model:visible="showOperationDialog"
      :batch="operationBatch"
      :operation-type="currentOperationType"
      @success="handleOperationSuccess"
      @scan-batch="handleOperationScanBatch"
    />

    <BatchImportDialog
      v-model:visible="showImportDialog"
      title="批量导入批次"
      :loading="importLoading"
      :result="importResult"
      accept=".csv"
      @import="handleBatchImport"
      @download-template="handleDownloadTemplate"
    />

    <BatchEditDialog
      v-model:visible="showBatchEditDialog"
      title="批量修改库位"
      :fields="batchEditFields"
      :selected-count="selectedIds.length"
      :loading="batchEditLoading"
      @confirm="handleBatchEditConfirm"
    />

    <ConfirmDialog
      v-model:visible="showBatchDeleteConfirm"
      title="确认删除"
      :message="`确定要删除选中的 ${selectedIds.length} 条批次吗？删除后将无法恢复。`"
      confirm-text="确认删除"
      type="danger"
      @confirm="handleBatchDelete"
    />

    <LabelPrintDialog
      :visible="showPrintDialog"
      :label-data="printLabelData"
      @close="showPrintDialog = false"
    />
    <ScanResultCard
      :visible="showScanResult"
      :scanned-code="scannedCode"
      :default-entity-type="scanEntityType"
      :default-entity-id="scanEntityId"
      @close="showScanResult = false"
    />
  </div>
</template>
