<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  Plus,
  Edit2,
  Trash2,
  X,
  Eye,
  FlaskConical,
  ChevronLeft,
  ChevronRight,
  FileText,
  FileCheck2,
  Image as ImageIcon,
  Upload,
  Package,
  AlertTriangle,
  ToggleLeft,
  ToggleRight,
  Download,
  Printer,
  ScanLine,
  Tags,
  Thermometer,
  Power,
} from 'lucide-vue-next'
import DataTableFilter from '@/components/DataTableFilter.vue'
import type { FilterField } from '@/components/DataTableFilter.vue'
import { useSavedFilters } from '@/composables/useSavedFilters'
import type { SavedFilter } from '@/composables/useSavedFilters'
import { exportToCsv } from '@/utils/csv'
import {
  mockGetReagents,
  mockCreateReagent,
  mockUpdateReagent,
  mockDeleteReagent,
  mockGetReagent,
  mockBatchDeleteReagents,
  mockBatchUpdateReagentCategory,
  mockBatchUpdateReagentStorageCondition,
  mockBatchUpdateReagentStatus,
  mockBatchImportReagents,
  downloadReagentTemplate,
  mockExportAllReagents,
} from '@/mock/reagents'
import type { ImportResult } from '@/components/BatchImportDialog.vue'
import BatchOperationBar from '@/components/BatchOperationBar.vue'
import BatchImportDialog from '@/components/BatchImportDialog.vue'
import BatchEditDialog from '@/components/BatchEditDialog.vue'
import type { BatchEditField } from '@/components/BatchEditDialog.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import type { Reagent, ReagentFormData, Attachment } from '@/types/reagent'
import type { PageResult } from '@/types/common'
import {
  reagentCategories,
  storageConditions,
  hazardLevelLabels,
  hazardLevelColors,
  enabledStatusLabels,
  enabledStatusColors,
  experimentTypeOptions,
  commonBrands,
} from '@/types/reagent'
import { formatDate } from '@/utils/date'
import { usePermission } from '@/composables/usePermission'
import LabelPrintDialog from '@/components/LabelPrintDialog.vue'
import ScanSearchBox from '@/components/ScanSearchBox.vue'
import ScanResultCard from '@/components/ScanResultCard.vue'
import type { LabelData, LabelEntityType } from '@/types/label'
import { useAuditLog } from '@/composables/useAuditLog'

const auditLog = useAuditLog()

function formatReagentContent(r: any): string {
  const parts: string[] = []
  parts.push(`分类: ${r.category}`)
  parts.push(`规格: ${r.specification}`)
  parts.push(`单位: ${r.unit}`)
  if (r.brand) parts.push(`品牌: ${r.brand}`)
  if (r.manufacturer) parts.push(`厂家: ${r.manufacturer}`)
  parts.push(`存储条件: ${r.storageCondition}`)
  if (r.hazardLevel) parts.push(`危险等级: ${r.hazardLevel}`)
  parts.push(`状态: ${r.enabled ? '启用' : '停用'}`)
  if (r.casNumber) parts.push(`CAS: ${r.casNumber}`)
  return parts.join(', ')
}

const originalReagentData = ref<any>(null)

const router = useRouter()
const loading = ref(false)
const permission = usePermission()
const data = ref<PageResult<Reagent> | null>(null)

const filters = ref<Record<string, any>>({
  keyword: '',
  category: '',
  brand: '',
  hazardLevel: '',
  storageCondition: '',
  enabled: '',
  manufacturer: '',
  casNumber: '',
  createTime: ['', ''],
  updateTime: ['', ''],
})

const { savedFilters, addFilter, deleteFilter, loadFilters } = useSavedFilters('reagent_saved_filters')

const filterFields: FilterField[] = [
  { key: 'category', label: '分类', type: 'select', options: reagentCategories.map((c) => ({ label: c, value: c })) },
  { key: 'brand', label: '品牌', type: 'select', options: commonBrands.map((b) => ({ label: b, value: b })) },
  { key: 'hazardLevel', label: '危险等级', type: 'select', options: [
    { label: '低危', value: 'low' },
    { label: '中危', value: 'medium' },
    { label: '高危', value: 'high' },
  ]},
  { key: 'storageCondition', label: '存储条件', type: 'select', options: storageConditions.map((s) => ({ label: s, value: s })) },
  { key: 'enabled', label: '启用状态', type: 'select', options: [
    { label: '启用', value: 'true' },
    { label: '停用', value: 'false' },
  ]},
  { key: 'manufacturer', label: '生产厂家', type: 'input', placeholder: '输入厂家名称' },
  { key: 'casNumber', label: 'CAS号', type: 'input', placeholder: '输入CAS号' },
  { key: 'createTime', label: '创建时间', type: 'date-range' },
  { key: 'updateTime', label: '更新时间', type: 'date-range' },
]

const pagination = reactive({
  page: 1,
  pageSize: 10,
})

const showFormModal = ref(false)
const showDetailModal = ref(false)
const formMode = ref<'create' | 'edit'>('create')
const currentId = ref('')
const formLoading = ref(false)
const detailLoading = ref(false)
const detailData = ref<Reagent | null>(null)

const selectedIds = ref<string[]>([])
const showImportDialog = ref(false)
const importLoading = ref(false)
const importResult = ref<ImportResult | null>(null)

const showBatchDeleteConfirm = ref(false)
const batchDeleteLoading = ref(false)

const showBatchEditDialog = ref(false)
const batchEditType = ref<'category' | 'storage' | 'status'>('category')
const batchEditFields = ref<BatchEditField[]>([])
const batchEditLoading = ref(false)

const showPrintDialog = ref(false)
const printLabelData = ref<LabelData | null>(null)
const showScanResult = ref(false)
const scanEntityType = ref<LabelEntityType | null>(null)
const scanEntityId = ref<string | null>(null)
const scannedCode = ref<string | null>(null)

const batchActions = computed(() => [
  { key: 'category', label: '批量修改分类', icon: Tags, type: 'default' as const, permission: permission.canEditReagent.value },
  { key: 'storage', label: '批量修改储存条件', icon: Thermometer, type: 'default' as const, permission: permission.canEditReagent.value },
  { key: 'enable', label: '批量启用', icon: Power, type: 'default' as const, permission: permission.canEditReagent.value },
  { key: 'disable', label: '批量停用', icon: Power, type: 'warning' as const, permission: permission.canEditReagent.value },
  { key: 'delete', label: '批量删除', icon: Trash2, type: 'danger' as const, permission: permission.canDeleteReagent.value },
])

const defaultFormData = (): ReagentFormData => ({
  name: '',
  casNumber: '',
  category: '',
  specification: '',
  unit: '',
  manufacturer: '',
  brand: '',
  catalogNumber: '',
  purity: '',
  concentration: '',
  packagingSpec: '',
  experimentTypes: [],
  aliases: '',
  openedValidity: '',
  incompatibilities: '',
  sdsAttachment: undefined,
  qcReportAttachment: undefined,
  reagentImage: '',
  enabled: true,
  storageCondition: '',
  description: '',
  hazardLevel: 'low',
})

const formData = reactive<ReagentFormData>(defaultFormData())

const fetchData = async () => {
  loading.value = true
  try {
    const f = filters.value
    const params = {
      keyword: f.keyword || undefined,
      category: f.category || undefined,
      brand: f.brand || undefined,
      hazardLevel: f.hazardLevel || undefined,
      storageCondition: f.storageCondition || undefined,
      enabled: f.enabled || undefined,
      manufacturer: f.manufacturer || undefined,
      casNumber: f.casNumber || undefined,
      createTimeStart: f.createTime?.[0] || undefined,
      createTimeEnd: f.createTime?.[1] || undefined,
      updateTimeStart: f.updateTime?.[0] || undefined,
      updateTimeEnd: f.updateTime?.[1] || undefined,
    }
    const result = await mockGetReagents(pagination.page, pagination.pageSize, params)
    data.value = result
  } finally {
    loading.value = false
  }
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
  openCreateModal()
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
  formMode.value = 'create'
  currentId.value = ''
  Object.assign(formData, defaultFormData())
  showFormModal.value = true
}

const openEditModal = async (id: string) => {
  formMode.value = 'edit'
  currentId.value = id
  formLoading.value = true
  try {
    const reagent = await mockGetReagent(id)
    if (reagent) {
      originalReagentData.value = { ...reagent }
      Object.assign(formData, {
        ...defaultFormData(),
        name: reagent.name,
        casNumber: reagent.casNumber || '',
        category: reagent.category,
        specification: reagent.specification,
        unit: reagent.unit,
        manufacturer: reagent.manufacturer || '',
        brand: reagent.brand || '',
        catalogNumber: reagent.catalogNumber || '',
        purity: reagent.purity || '',
        concentration: reagent.concentration || '',
        packagingSpec: reagent.packagingSpec || '',
        experimentTypes: reagent.experimentTypes || [],
        aliases: reagent.aliases || '',
        openedValidity: reagent.openedValidity || '',
        incompatibilities: reagent.incompatibilities || '',
        sdsAttachment: reagent.sdsAttachment,
        qcReportAttachment: reagent.qcReportAttachment,
        reagentImage: reagent.reagentImage || '',
        enabled: reagent.enabled,
        storageCondition: reagent.storageCondition,
        description: reagent.description || '',
        hazardLevel: reagent.hazardLevel || 'low',
      })
      showFormModal.value = true
    }
  } finally {
    formLoading.value = false
  }
}

const openDetailModal = async (id: string) => {
  showDetailModal.value = true
  detailLoading.value = true
  detailData.value = null
  try {
    const reagent = await mockGetReagent(id)
    detailData.value = reagent
  } finally {
    detailLoading.value = false
  }
}

const handleSubmit = async () => {
  if (!formData.name.trim()) {
    alert('请输入试剂名称')
    return
  }
  if (!formData.category) {
    alert('请选择分类')
    return
  }
  if (!formData.specification.trim()) {
    alert('请输入规格')
    return
  }
  if (!formData.unit.trim()) {
    alert('请输入单位')
    return
  }
  if (!formData.storageCondition) {
    alert('请选择储存条件')
    return
  }

  formLoading.value = true
  try {
    if (formMode.value === 'create') {
      await mockCreateReagent({ ...formData })
      auditLog.logReagentCreate('', formData.name, formatReagentContent(formData))
    } else {
      const before = originalReagentData.value ? formatReagentContent(originalReagentData.value) : ''
      await mockUpdateReagent(currentId.value, { ...formData })
      auditLog.logReagentUpdate(currentId.value, formData.name, before, formatReagentContent(formData))
      originalReagentData.value = null
    }
    showFormModal.value = false
    fetchData()
  } catch (e: any) {
    alert(e.message || '操作失败')
  } finally {
    formLoading.value = false
  }
}

const handleDelete = async (id: string) => {
  if (!confirm('确定要删除该试剂吗？')) {
    return
  }
  try {
    const beforeDelete = data.value?.list.find(r => r.id === id)
    await mockDeleteReagent(id)
    if (beforeDelete) {
      auditLog.logReagentDelete(id, beforeDelete.name, formatReagentContent(beforeDelete))
    }
    if (data.value?.list.length === 1 && pagination.page > 1) {
      pagination.page--
    }
    fetchData()
  } catch (e: any) {
    alert(e.message || '删除失败')
  }
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
    selectedIds.value = data.value?.list.map(r => r.id) || []
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
    case 'category':
      batchEditType.value = 'category'
      batchEditFields.value = [
        {
          key: 'category',
          label: '分类',
          type: 'select',
          required: true,
          options: reagentCategories.map(c => ({ label: c, value: c })),
        },
      ]
      showBatchEditDialog.value = true
      break
    case 'storage':
      batchEditType.value = 'storage'
      batchEditFields.value = [
        {
          key: 'storageCondition',
          label: '储存条件',
          type: 'select',
          required: true,
          options: storageConditions.map(s => ({ label: s, value: s })),
        },
      ]
      showBatchEditDialog.value = true
      break
    case 'enable':
      handleBatchStatusUpdate(true)
      break
    case 'disable':
      handleBatchStatusUpdate(false)
      break
  }
}

const handleBatchDelete = async () => {
  batchDeleteLoading.value = true
  try {
    const deletedNames = selectedIds.value
      .map(id => data.value?.list.find(r => r.id === id))
      .filter(Boolean)
      .map(r => r!.name)
    await mockBatchDeleteReagents(selectedIds.value)
    auditLog.logReagentBatchDelete(selectedIds.value, deletedNames, `批量删除 ${selectedIds.value.length} 个试剂`)
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
    const affectedNames = selectedIds.value
      .map(id => data.value?.list.find(r => r.id === id))
      .filter(Boolean)
      .map(r => r!.name)
    if (batchEditType.value === 'category') {
      await mockBatchUpdateReagentCategory(selectedIds.value, values.category)
      auditLog.logReagentBatchUpdate(selectedIds.value, affectedNames, '分类', '', values.category)
    } else if (batchEditType.value === 'storage') {
      await mockBatchUpdateReagentStorageCondition(selectedIds.value, values.storageCondition)
      auditLog.logReagentBatchUpdate(selectedIds.value, affectedNames, '储存条件', '', values.storageCondition)
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

const handleBatchStatusUpdate = async (enabled: boolean) => {
  if (!confirm(`确定要批量${enabled ? '启用' : '停用'}选中的 ${selectedIds.value.length} 条记录吗？`)) {
    return
  }
  try {
    const affectedNames = selectedIds.value
      .map(id => data.value?.list.find(r => r.id === id))
      .filter(Boolean)
      .map(r => r!.name)
    await mockBatchUpdateReagentStatus(selectedIds.value, enabled)
    auditLog.logReagentBatchUpdate(selectedIds.value, affectedNames, '状态', String(!enabled), String(enabled))
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
    const result = await mockBatchImportReagents(file)
    auditLog.logReagentImport(result.total, `导入文件: ${file.name}, 成功${result.success}条, 失败${result.failed}条`)
    importResult.value = result
    fetchData()
  } catch (e: any) {
    alert(e.message || '导入失败')
  } finally {
    importLoading.value = false
  }
}

const handleDownloadTemplate = () => {
  downloadReagentTemplate()
}

const handleExport = async () => {
  try {
    const exportFilters = {
      keyword: filters.value.keyword,
      category: filters.value.category,
      brand: filters.value.brand,
      hazardLevel: filters.value.hazardLevel,
      storageCondition: filters.value.storageCondition,
      enabled: filters.value.enabled,
      manufacturer: filters.value.manufacturer,
      casNumber: filters.value.casNumber,
      createTimeStart: filters.value.createTime?.[0] || '',
      createTimeEnd: filters.value.createTime?.[1] || '',
      updateTimeStart: filters.value.updateTime?.[0] || '',
      updateTimeEnd: filters.value.updateTime?.[1] || '',
    }
    const allData = await mockExportAllReagents(exportFilters)
    if (!allData || allData.length === 0) {
      alert('暂无数据可导出')
      return
    }
    const columns = [
      { key: 'name', label: '试剂名称' },
      { key: 'casNumber', label: 'CAS号' },
      { key: 'category', label: '分类' },
      { key: 'brand', label: '品牌' },
      { key: 'catalogNumber', label: '货号' },
      { key: 'manufacturer', label: '生产厂家' },
      { key: 'specification', label: '规格' },
      { key: 'unit', label: '单位' },
      { key: 'storageCondition', label: '存储条件' },
      { key: 'hazardLevel', label: '危险等级', formatter: (v: string) => hazardLevelLabels[v as keyof typeof hazardLevelLabels] || v },
      { key: 'enabled', label: '状态', formatter: (v: boolean) => enabledStatusLabels[String(v) as 'true' | 'false'] },
      { key: 'createdAt', label: '创建时间', formatter: (v: string) => formatDate(v, 'YYYY-MM-DD HH:mm') },
      { key: 'updatedAt', label: '更新时间', formatter: (v: string) => formatDate(v, 'YYYY-MM-DD HH:mm') },
    ]
    exportToCsv(allData, columns, `试剂列表_${formatDate(new Date(), 'YYYYMMDD')}.csv`)
  } catch (e: any) {
    alert(e.message || '导出失败')
  }
}

const goToBatches = (id: string) => {
  router.push(`/batches?reagentId=${id}`)
}

const openPrintDialog = (reagent: Reagent) => {
  printLabelData.value = {
    entityType: 'reagent',
    entityId: reagent.id,
    code: reagent.catalogNumber || reagent.id,
    name: reagent.name,
    specification: reagent.specification,
    manufacturer: reagent.manufacturer,
    unit: reagent.unit,
    storageCondition: reagent.storageCondition,
  }
  showPrintDialog.value = true
}

const handleScan = (payload: { entityType: LabelEntityType | null; entityId: string; code: string }) => {
  scannedCode.value = payload.code
  scanEntityType.value = payload.entityType
  scanEntityId.value = payload.entityId
  showScanResult.value = true
}

const toggleExperimentType = (type: string) => {
  if (!formData.experimentTypes) {
    formData.experimentTypes = []
  }
  const idx = formData.experimentTypes.indexOf(type)
  if (idx > -1) {
    formData.experimentTypes.splice(idx, 1)
  } else {
    formData.experimentTypes.push(type)
  }
}

const formatFileSize = (bytes?: number) => {
  if (!bytes) return '-'
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

const mockFileUpload = (type: 'sds' | 'qc' | 'image') => {
  const now = new Date().toISOString()
  if (type === 'sds') {
    const att: Attachment = {
      name: `SDS_${Date.now()}.pdf`,
      url: `/files/sds_${Date.now()}.pdf`,
      size: Math.floor(Math.random() * 500000) + 50000,
      uploadedAt: now,
    }
    formData.sdsAttachment = att
  } else if (type === 'qc') {
    const att: Attachment = {
      name: `QC_${Date.now()}.pdf`,
      url: `/files/qc_${Date.now()}.pdf`,
      size: Math.floor(Math.random() * 300000) + 30000,
      uploadedAt: now,
    }
    formData.qcReportAttachment = att
  } else if (type === 'image') {
    formData.reagentImage = `/images/reagent_${Date.now()}.png`
  }
}

const removeAttachment = (type: 'sds' | 'qc' | 'image') => {
  if (type === 'sds') formData.sdsAttachment = undefined
  else if (type === 'qc') formData.qcReportAttachment = undefined
  else if (type === 'image') formData.reagentImage = ''
}

const getEnabledLabel = (enabled: boolean) => enabledStatusLabels[String(enabled) as 'true' | 'false']
const getEnabledColor = (enabled: boolean) => enabledStatusColors[String(enabled) as 'true' | 'false']

onMounted(() => {
  fetchData()
})
</script>

<template>
  <div class="space-y-6">
    <DataTableFilter
      v-model="filters"
      :filter-fields="filterFields"
      :saved-filters="savedFilters"
      :action-button-text="permission.canCreateReagent ? '新增试剂' : undefined"
      keyword-placeholder="搜索试剂名称、CAS号、批次号、厂家、货号、库位..."
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
          placeholder="扫码或输入试剂编号..."
          @scan="handleScan"
        />
      </div>
    </div>

    <BatchOperationBar
      :selected-count="selectedIds.length"
      :total-count="data?.total || 0"
      :actions="batchActions"
      :show-import="permission.canCreateReagent.value"
      :show-export="permission.canViewReagents.value"
      :show-template="permission.canCreateReagent.value"
      :import-permission="permission.canCreateReagent.value"
      :export-permission="permission.canViewReagents.value"
      @action="handleBatchAction"
      @import="showImportDialog = true; importResult = null"
      @export="handleExport"
      @download-template="handleDownloadTemplate"
      @clear-selection="clearSelection"
    />

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
                <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">试剂名称</th>
                <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CAS号</th>
                <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">分类</th>
                <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">品牌/货号</th>
                <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">储存条件</th>
                <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">危害等级</th>
                <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                <th class="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr
                v-for="reagent in data?.list"
                :key="reagent.id"
                :class="['hover:bg-gray-50 transition-colors', selectedIds.includes(reagent.id) ? 'bg-primary-50/50' : '']"
              >
                <td class="w-12 px-6 py-4">
                  <input
                    type="checkbox"
                    :checked="selectedIds.includes(reagent.id)"
                    class="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                    @change="toggleSelect(reagent.id)"
                  >
                </td>
                <td class="px-6 py-4">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                      <FlaskConical class="w-5 h-5 text-primary-600" />
                    </div>
                    <div class="min-w-0">
                      <div class="font-medium text-gray-900 truncate max-w-[200px]">{{ reagent.name }}</div>
                      <div class="text-xs text-gray-400">更新于 {{ formatDate(reagent.updatedAt, 'MM-DD') }}</div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 text-sm font-mono text-gray-600">{{ reagent.casNumber || '-' }}</td>
                <td class="px-6 py-4">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-50 text-primary-700">
                    {{ reagent.category }}
                  </span>
                </td>
                <td class="px-6 py-4">
                  <div class="text-sm text-gray-800">{{ reagent.brand || '-' }}</div>
                  <div class="text-xs text-gray-400 font-mono">{{ reagent.catalogNumber || '-' }}</div>
                </td>
                <td class="px-6 py-4 text-sm text-gray-600">{{ reagent.storageCondition }}</td>
                <td class="px-6 py-4">
                  <span
                    v-if="reagent.hazardLevel"
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                    :class="hazardLevelColors[reagent.hazardLevel]"
                  >
                    {{ hazardLevelLabels[reagent.hazardLevel] }}
                  </span>
                  <span v-else class="text-gray-400 text-sm">-</span>
                </td>
                <td class="px-6 py-4">
                  <span
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                    :class="getEnabledColor(reagent.enabled)"
                  >
                    {{ getEnabledLabel(reagent.enabled) }}
                  </span>
                </td>
                <td class="px-6 py-4">
                  <div class="flex items-center justify-center gap-1">
                    <button
                      class="p-1.5 text-primary-600 hover:bg-primary-50 rounded transition-colors"
                      title="查看详情"
                      @click="openDetailModal(reagent.id)"
                    >
                      <FileText class="w-4 h-4" />
                    </button>
                    <button
                      class="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                      title="打印标签"
                      @click="openPrintDialog(reagent)"
                    >
                      <Printer class="w-4 h-4" />
                    </button>
                    <button
                      v-if="permission.canViewBatches"
                      class="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                      title="查看批次"
                      @click="goToBatches(reagent.id)"
                    >
                      <Package class="w-4 h-4" />
                    </button>
                    <button
                      v-if="permission.canEditReagent"
                      class="p-1.5 text-gray-500 hover:bg-gray-100 rounded transition-colors"
                      title="编辑"
                      @click="openEditModal(reagent.id)"
                    >
                      <Edit2 class="w-4 h-4" />
                    </button>
                    <button
                      v-if="permission.canDeleteReagent"
                      class="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                      title="删除"
                      @click="handleDelete(reagent.id)"
                    >
                      <Trash2 class="w-4 h-4" />
                    </button>
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
            <FlaskConical class="w-8 h-8 text-gray-300" />
          </div>
          <p class="text-gray-400">暂无试剂数据</p>
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

    <!-- 表单弹窗 -->
    <div
      v-if="showFormModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      @click.self="showFormModal = false"
    >
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-hidden">
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <h3 class="text-lg font-semibold text-gray-800">
            {{ formMode === 'create' ? '新增试剂' : '编辑试剂' }}
          </h3>
          <button
            class="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            @click="showFormModal = false"
          >
            <X class="w-5 h-5 text-gray-400" />
          </button>
        </div>
        
        <div class="p-6 overflow-y-auto" style="max-height: calc(92vh - 140px);">
          <div class="space-y-6">
            <div class="bg-gray-50 rounded-lg p-4">
              <h4 class="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <FlaskConical class="w-4 h-4 text-primary-600" />基础信息
              </h4>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="md:col-span-2">
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">
                    试剂名称 <span class="text-red-500">*</span>
                  </label>
                  <input
                    v-model="formData.name"
                    type="text"
                    class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                    placeholder="请输入试剂名称"
                  >
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">CAS号</label>
                  <input
                    v-model="formData.casNumber"
                    type="text"
                    class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                    placeholder="如：9048-46-8"
                  >
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">
                    分类 <span class="text-red-500">*</span>
                  </label>
                  <select
                    v-model="formData.category"
                    class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-white"
                  >
                    <option value="">请选择分类</option>
                    <option v-for="cat in reagentCategories" :key="cat" :value="cat">{{ cat }}</option>
                  </select>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">别名</label>
                  <input
                    v-model="formData.aliases"
                    type="text"
                    class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                    placeholder="多个别名用分号分隔"
                  >
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">生产厂家</label>
                  <input
                    v-model="formData.manufacturer"
                    type="text"
                    class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                    placeholder="请输入生产厂家"
                  >
                </div>
              </div>
            </div>

            <div class="bg-gray-50 rounded-lg p-4">
              <h4 class="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Package class="w-4 h-4 text-primary-600" />规格参数
              </h4>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">品牌</label>
                  <select
                    v-model="formData.brand"
                    class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-white"
                  >
                    <option value="">请选择品牌</option>
                    <option v-for="b in commonBrands" :key="b" :value="b">{{ b }}</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">货号</label>
                  <input
                    v-model="formData.catalogNumber"
                    type="text"
                    class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                    placeholder="如：A7906-100ML"
                  >
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">纯度</label>
                  <input
                    v-model="formData.purity"
                    type="text"
                    class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                    placeholder="如：≥98%"
                  >
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">浓度</label>
                  <input
                    v-model="formData.concentration"
                    type="text"
                    class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                    placeholder="如：100mg/mL"
                  >
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">
                    规格 <span class="text-red-500">*</span>
                  </label>
                  <input
                    v-model="formData.specification"
                    type="text"
                    class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                    placeholder="如：100mg/mL"
                  >
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">
                    单位 <span class="text-red-500">*</span>
                  </label>
                  <input
                    v-model="formData.unit"
                    type="text"
                    class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                    placeholder="如：mL、g、瓶"
                  >
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">包装规格</label>
                  <input
                    v-model="formData.packagingSpec"
                    type="text"
                    class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                    placeholder="如：100mL/瓶"
                  >
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">开封后有效期</label>
                  <input
                    v-model="formData.openedValidity"
                    type="text"
                    class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                    placeholder="如：30天"
                  >
                </div>
              </div>
            </div>

            <div class="bg-gray-50 rounded-lg p-4">
              <h4 class="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <AlertTriangle class="w-4 h-4 text-warning-600" />存储与安全
              </h4>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">
                    储存条件 <span class="text-red-500">*</span>
                  </label>
                  <select
                    v-model="formData.storageCondition"
                    class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-white"
                  >
                    <option value="">请选择储存条件</option>
                    <option v-for="sc in storageConditions" :key="sc" :value="sc">{{ sc }}</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">危害等级</label>
                  <select
                    v-model="formData.hazardLevel"
                    class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-white"
                  >
                    <option value="low">低危</option>
                    <option value="medium">中危</option>
                    <option value="high">高危</option>
                  </select>
                </div>
                <div class="md:col-span-2">
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">禁配信息</label>
                  <textarea
                    v-model="formData.incompatibilities"
                    rows="2"
                    class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all resize-none"
                    placeholder="请输入不相容的化学物质或操作注意事项"
                  />
                </div>
              </div>
            </div>

            <div class="bg-gray-50 rounded-lg p-4">
              <h4 class="text-sm font-semibold text-gray-700 mb-3">适用实验类型</h4>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="t in experimentTypeOptions"
                  :key="t"
                  type="button"
                  class="px-3 py-1.5 rounded-lg text-sm transition-all border"
                  :class="formData.experimentTypes?.includes(t)
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300 hover:text-primary-600'"
                  @click="toggleExperimentType(t)"
                >
                  {{ t }}
                </button>
              </div>
            </div>

            <div class="bg-gray-50 rounded-lg p-4">
              <h4 class="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <FileText class="w-4 h-4 text-primary-600" />附件资料
              </h4>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">SDS/MSDS 附件</label>
                  <div v-if="formData.sdsAttachment" class="bg-white rounded-lg p-3 border border-gray-200">
                    <div class="flex items-center gap-2 text-sm">
                      <FileText class="w-4 h-4 text-primary-600 flex-shrink-0" />
                      <span class="flex-1 truncate text-gray-700">{{ formData.sdsAttachment.name }}</span>
                      <button
                        type="button"
                        class="p-1 text-red-500 hover:bg-red-50 rounded"
                        @click="removeAttachment('sds')"
                      >
                        <X class="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div class="text-xs text-gray-400 mt-1">{{ formatFileSize(formData.sdsAttachment.size) }}</div>
                  </div>
                  <button
                    v-else
                    type="button"
                    class="w-full h-20 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center gap-1.5 text-gray-400 hover:border-primary-300 hover:text-primary-500 transition-colors"
                    @click="mockFileUpload('sds')"
                  >
                    <Upload class="w-5 h-5" />
                    <span class="text-xs">点击上传SDS</span>
                  </button>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">质检报告</label>
                  <div v-if="formData.qcReportAttachment" class="bg-white rounded-lg p-3 border border-gray-200">
                    <div class="flex items-center gap-2 text-sm">
                      <FileCheck2 class="w-4 h-4 text-success-600 flex-shrink-0" />
                      <span class="flex-1 truncate text-gray-700">{{ formData.qcReportAttachment.name }}</span>
                      <button
                        type="button"
                        class="p-1 text-red-500 hover:bg-red-50 rounded"
                        @click="removeAttachment('qc')"
                      >
                        <X class="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div class="text-xs text-gray-400 mt-1">{{ formatFileSize(formData.qcReportAttachment.size) }}</div>
                  </div>
                  <button
                    v-else
                    type="button"
                    class="w-full h-20 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center gap-1.5 text-gray-400 hover:border-primary-300 hover:text-primary-500 transition-colors"
                    @click="mockFileUpload('qc')"
                  >
                    <Upload class="w-5 h-5" />
                    <span class="text-xs">上传质检报告</span>
                  </button>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">试剂图片</label>
                  <div v-if="formData.reagentImage" class="bg-white rounded-lg p-3 border border-gray-200">
                    <div class="flex items-center gap-2 text-sm">
                      <ImageIcon class="w-4 h-4 text-indigo-600 flex-shrink-0" />
                      <span class="flex-1 truncate text-gray-700">试剂图片</span>
                      <button
                        type="button"
                        class="p-1 text-red-500 hover:bg-red-50 rounded"
                        @click="removeAttachment('image')"
                      >
                        <X class="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <button
                    v-else
                    type="button"
                    class="w-full h-20 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center gap-1.5 text-gray-400 hover:border-primary-300 hover:text-primary-500 transition-colors"
                    @click="mockFileUpload('image')"
                  >
                    <Upload class="w-5 h-5" />
                    <span class="text-xs">上传试剂图片</span>
                  </button>
                </div>
              </div>
            </div>

            <div class="bg-gray-50 rounded-lg p-4">
              <h4 class="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <ToggleRight class="w-4 h-4 text-primary-600" />其他信息
              </h4>
              <div class="space-y-4">
                <div class="flex items-center gap-3">
                  <button
                    type="button"
                    class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                    :class="formData.enabled ? 'bg-primary-600' : 'bg-gray-300'"
                    @click="formData.enabled = !formData.enabled"
                  >
                    <span
                      class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                      :class="formData.enabled ? 'translate-x-6' : 'translate-x-1'"
                    />
                  </button>
                  <span class="text-sm text-gray-700 font-medium">
                    {{ formData.enabled ? '启用状态' : '停用状态' }}
                  </span>
                  <span class="text-xs text-gray-400">停用后该试剂将不参与日常业务流程</span>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">描述</label>
                  <textarea
                    v-model="formData.description"
                    rows="3"
                    class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all resize-none"
                    placeholder="请输入试剂描述、用途等信息"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 flex-shrink-0">
          <button
            class="px-5 py-2.5 border border-gray-200 hover:bg-gray-100 text-gray-600 rounded-lg transition-colors"
            @click="showFormModal = false"
          >
            取消
          </button>
          <button
            :disabled="formLoading"
            class="px-5 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded-lg transition-all disabled:opacity-70 flex items-center gap-2"
            @click="handleSubmit"
          >
            <span v-if="formLoading" class="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            {{ formMode === 'create' ? '创建' : '保存' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 详情弹窗 -->
    <div
      v-if="showDetailModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      @click.self="showDetailModal = false"
    >
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] overflow-hidden">
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0 bg-gradient-to-r from-primary-50 to-white">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
              <FlaskConical class="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h3 class="text-lg font-semibold text-gray-800">{{ detailData?.name || '试剂详情' }}</h3>
              <div class="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                <span v-if="detailData?.casNumber" class="font-mono">CAS: {{ detailData.casNumber }}</span>
                <span v-if="detailData?.hazardLevel" :class="['px-1.5 py-0.5 rounded text-xs', hazardLevelColors[detailData.hazardLevel]]">
                  {{ hazardLevelLabels[detailData.hazardLevel] }}
                </span>
                <span v-if="detailData" :class="['px-1.5 py-0.5 rounded text-xs', getEnabledColor(detailData.enabled)]">
                  {{ getEnabledLabel(detailData.enabled) }}
                </span>
              </div>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button
              v-if="detailData"
              class="px-4 py-2 text-emerald-600 hover:bg-emerald-50 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
              @click="openPrintDialog(detailData)"
            >
              <Printer class="w-4 h-4" />
              打印标签
            </button>
            <button
              v-if="detailData && permission.canEditReagent"
              class="px-4 py-2 text-primary-600 hover:bg-primary-50 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
              @click="openEditModal(detailData.id); showDetailModal = false"
            >
              <Edit2 class="w-4 h-4" />
              编辑
            </button>
            <button
              class="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              @click="showDetailModal = false"
            >
              <X class="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>
        
        <div class="p-6 overflow-y-auto" style="max-height: calc(92vh - 80px);">
          <div v-if="detailLoading" class="py-20 flex items-center justify-center">
            <div class="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
          </div>

          <div v-else-if="detailData" class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div class="md:col-span-3 space-y-5">
                <div class="bg-gray-50 rounded-xl p-5">
                  <h4 class="text-sm font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-200">基础信息</h4>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                    <div class="flex gap-2">
                      <span class="text-sm text-gray-500 w-24 flex-shrink-0">试剂名称</span>
                      <span class="text-sm text-gray-800 font-medium">{{ detailData.name }}</span>
                    </div>
                    <div class="flex gap-2">
                      <span class="text-sm text-gray-500 w-24 flex-shrink-0">分类</span>
                      <span class="text-sm text-gray-800">{{ detailData.category }}</span>
                    </div>
                    <div class="flex gap-2">
                      <span class="text-sm text-gray-500 w-24 flex-shrink-0">CAS号</span>
                      <span class="text-sm text-gray-800 font-mono">{{ detailData.casNumber || '-' }}</span>
                    </div>
                    <div class="flex gap-2">
                      <span class="text-sm text-gray-500 w-24 flex-shrink-0">生产厂家</span>
                      <span class="text-sm text-gray-800">{{ detailData.manufacturer || '-' }}</span>
                    </div>
                    <div class="flex gap-2 md:col-span-2">
                      <span class="text-sm text-gray-500 w-24 flex-shrink-0">别名</span>
                      <span class="text-sm text-gray-800">{{ detailData.aliases || '-' }}</span>
                    </div>
                  </div>
                </div>

                <div class="bg-gray-50 rounded-xl p-5">
                  <h4 class="text-sm font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-200">规格参数</h4>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                    <div class="flex gap-2">
                      <span class="text-sm text-gray-500 w-28 flex-shrink-0">品牌</span>
                      <span class="text-sm text-gray-800">{{ detailData.brand || '-' }}</span>
                    </div>
                    <div class="flex gap-2">
                      <span class="text-sm text-gray-500 w-28 flex-shrink-0">货号</span>
                      <span class="text-sm text-gray-800 font-mono">{{ detailData.catalogNumber || '-' }}</span>
                    </div>
                    <div class="flex gap-2">
                      <span class="text-sm text-gray-500 w-28 flex-shrink-0">纯度</span>
                      <span class="text-sm text-gray-800">{{ detailData.purity || '-' }}</span>
                    </div>
                    <div class="flex gap-2">
                      <span class="text-sm text-gray-500 w-28 flex-shrink-0">浓度</span>
                      <span class="text-sm text-gray-800">{{ detailData.concentration || '-' }}</span>
                    </div>
                    <div class="flex gap-2">
                      <span class="text-sm text-gray-500 w-28 flex-shrink-0">规格</span>
                      <span class="text-sm text-gray-800">{{ detailData.specification }}</span>
                    </div>
                    <div class="flex gap-2">
                      <span class="text-sm text-gray-500 w-28 flex-shrink-0">单位</span>
                      <span class="text-sm text-gray-800">{{ detailData.unit }}</span>
                    </div>
                    <div class="flex gap-2">
                      <span class="text-sm text-gray-500 w-28 flex-shrink-0">包装规格</span>
                      <span class="text-sm text-gray-800">{{ detailData.packagingSpec || '-' }}</span>
                    </div>
                    <div class="flex gap-2">
                      <span class="text-sm text-gray-500 w-28 flex-shrink-0">开封后有效期</span>
                      <span class="text-sm text-gray-800">{{ detailData.openedValidity || '-' }}</span>
                    </div>
                  </div>
                </div>

                <div class="bg-gray-50 rounded-xl p-5">
                  <h4 class="text-sm font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-200">存储与安全</h4>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                    <div class="flex gap-2">
                      <span class="text-sm text-gray-500 w-28 flex-shrink-0">储存条件</span>
                      <span class="text-sm text-gray-800">{{ detailData.storageCondition }}</span>
                    </div>
                    <div class="flex gap-2">
                      <span class="text-sm text-gray-500 w-28 flex-shrink-0">危害等级</span>
                      <span
                        v-if="detailData.hazardLevel"
                        :class="['inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', hazardLevelColors[detailData.hazardLevel]]"
                      >
                        {{ hazardLevelLabels[detailData.hazardLevel] }}
                      </span>
                      <span v-else class="text-sm text-gray-400">-</span>
                    </div>
                    <div class="flex gap-2 md:col-span-2">
                      <span class="text-sm text-gray-500 w-28 flex-shrink-0 pt-0.5">禁配信息</span>
                      <span class="text-sm text-gray-800">{{ detailData.incompatibilities || '暂无' }}</span>
                    </div>
                  </div>
                </div>

                <div class="bg-gray-50 rounded-xl p-5">
                  <h4 class="text-sm font-semibold text-gray-700 mb-3 pb-2 border-b border-gray-200">适用实验类型</h4>
                  <div class="flex flex-wrap gap-2">
                    <span
                      v-for="t in detailData.experimentTypes?.length ? detailData.experimentTypes : ['暂未设置']"
                      :key="t"
                      class="px-2.5 py-1 rounded-lg text-xs"
                      :class="detailData.experimentTypes?.length ? 'bg-primary-50 text-primary-700' : 'text-gray-400 bg-gray-100'"
                    >
                      {{ t }}
                    </span>
                  </div>
                </div>

                <div v-if="detailData.description" class="bg-gray-50 rounded-xl p-5">
                  <h4 class="text-sm font-semibold text-gray-700 mb-3 pb-2 border-b border-gray-200">描述信息</h4>
                  <p class="text-sm text-gray-700 leading-relaxed">{{ detailData.description }}</p>
                </div>
              </div>

              <div class="space-y-4">
                <div class="bg-gray-50 rounded-xl p-5">
                  <h4 class="text-sm font-semibold text-gray-700 mb-3 pb-2 border-b border-gray-200">试剂图片</h4>
                  <div v-if="detailData.reagentImage" class="aspect-square rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden">
                    <ImageIcon class="w-10 h-10 text-gray-400" />
                  </div>
                  <div v-else class="aspect-square rounded-lg bg-white border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 gap-2">
                    <ImageIcon class="w-8 h-8" />
                    <span class="text-xs">暂无图片</span>
                  </div>
                </div>

                <div class="bg-gray-50 rounded-xl p-5">
                  <h4 class="text-sm font-semibold text-gray-700 mb-3 pb-2 border-b border-gray-200">附件资料</h4>
                  <div class="space-y-2">
                    <div
                      v-if="detailData.sdsAttachment"
                      class="flex items-center gap-2 bg-white rounded-lg p-3 border border-gray-200 hover:border-primary-200 transition-colors cursor-pointer"
                    >
                      <FileText class="w-4 h-4 text-primary-600 flex-shrink-0" />
                      <div class="flex-1 min-w-0">
                        <div class="text-sm text-gray-700 truncate">{{ detailData.sdsAttachment.name }}</div>
                        <div class="text-xs text-gray-400">{{ formatFileSize(detailData.sdsAttachment.size) }}</div>
                      </div>
                      <Download class="w-4 h-4 text-gray-400" />
                    </div>
                    <div v-else class="text-xs text-gray-400 bg-white rounded-lg p-3 border border-gray-200">暂无 SDS/MSDS</div>

                    <div
                      v-if="detailData.qcReportAttachment"
                      class="flex items-center gap-2 bg-white rounded-lg p-3 border border-gray-200 hover:border-success-200 transition-colors cursor-pointer"
                    >
                      <FileCheck2 class="w-4 h-4 text-success-600 flex-shrink-0" />
                      <div class="flex-1 min-w-0">
                        <div class="text-sm text-gray-700 truncate">{{ detailData.qcReportAttachment.name }}</div>
                        <div class="text-xs text-gray-400">{{ formatFileSize(detailData.qcReportAttachment.size) }}</div>
                      </div>
                      <Download class="w-4 h-4 text-gray-400" />
                    </div>
                    <div v-else class="text-xs text-gray-400 bg-white rounded-lg p-3 border border-gray-200">暂无质检报告</div>
                  </div>
                </div>

                <div class="bg-gray-50 rounded-xl p-5">
                  <h4 class="text-sm font-semibold text-gray-700 mb-3 pb-2 border-b border-gray-200">系统信息</h4>
                  <div class="space-y-2 text-sm">
                    <div class="flex justify-between">
                      <span class="text-gray-500">状态</span>
                      <span :class="['px-2 py-0.5 rounded-full text-xs font-medium', getEnabledColor(detailData.enabled)]">
                        {{ getEnabledLabel(detailData.enabled) }}
                      </span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-gray-500">创建时间</span>
                      <span class="text-gray-700 text-xs">{{ formatDate(detailData.createdAt, 'YYYY-MM-DD HH:mm') }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-gray-500">更新时间</span>
                      <span class="text-gray-700 text-xs">{{ formatDate(detailData.updatedAt, 'YYYY-MM-DD HH:mm') }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="py-20 text-center">
            <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <FlaskConical class="w-8 h-8 text-gray-300" />
            </div>
            <p class="text-gray-400">未找到该试剂信息</p>
          </div>
        </div>
      </div>
    </div>

    <BatchImportDialog
      v-model:visible="showImportDialog"
      title="批量导入试剂"
      :loading="importLoading"
      :result="importResult"
      accept=".csv"
      @import="handleBatchImport"
      @download-template="handleDownloadTemplate"
    />

    <BatchEditDialog
      v-model:visible="showBatchEditDialog"
      :title="batchEditType === 'category' ? '批量修改分类' : '批量修改储存条件'"
      :fields="batchEditFields"
      :selected-count="selectedIds.length"
      :loading="batchEditLoading"
      @confirm="handleBatchEditConfirm"
    />

    <ConfirmDialog
      v-model:visible="showBatchDeleteConfirm"
      title="确认删除"
      :message="`确定要删除选中的 ${selectedIds.length} 条试剂吗？删除后将无法恢复。`"
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
