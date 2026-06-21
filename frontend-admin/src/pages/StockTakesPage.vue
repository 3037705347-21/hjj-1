<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  Play,
  Download,
  FileText,
  Clock,
  User,
  ClipboardCheck,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronLeft,
  ChevronRight,
  X,
  Filter,
  MapPin,
} from 'lucide-vue-next'
import DataTableFilter from '@/components/DataTableFilter.vue'
import type { FilterField } from '@/components/DataTableFilter.vue'
import { useSavedFilters } from '@/composables/useSavedFilters'
import type { SavedFilter } from '@/composables/useSavedFilters'
import LocationSelector from '@/components/LocationSelector.vue'
import {
  mockGetStockTakes,
  mockCreateStockTake,
  mockUpdateStockTake,
  mockDeleteStockTake,
  mockStartStockTake,
  mockGetStockTakeStats,
  mockExportStockTake,
  downloadStockTakeReport,
} from '@/mock/stocktakes'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import type {
  StockTake,
  StockTakeFormData,
  StockTakeStatus,
  StockTakeDimension,
  StockTakeItemType,
} from '@/types/stocktake'
import {
  stockTakeStatusLabels,
  stockTakeStatusColors,
  stockTakeDimensionLabels,
  stockTakeItemTypeLabels,
} from '@/types/stocktake'
import type { PageResult } from '@/types/common'
import { formatDate } from '@/utils/date'
import { usePermission } from '@/composables/usePermission'
import type { Reagent } from '@/types/reagent'
import { mockGetAllReagents } from '@/mock/reagents'
import { getConsumablesFromStorage } from '@/mock/consumables'
import type { Consumable } from '@/types/consumable'
import { consumableCategories } from '@/types/consumable'
import { getBatchesFromStorage } from '@/mock/batches'
import { reagentCategories } from '@/types/reagent'

const router = useRouter()
const permission = usePermission()

const loading = ref(false)
const data = ref<PageResult<StockTake> | null>(null)
const stats = ref<{
  total: number
  pending: number
  inProgress: number
  toConfirm: number
  completed: number
  totalItems: number
  totalSurplus: number
  totalDeficit: number
} | null>(null)

const filters = ref<Record<string, any>>({
  keyword: '',
  status: '',
  dimension: '',
  itemType: '',
  assigneeName: '',
  creatorName: '',
  createTime: ['', ''],
})

const { savedFilters, addFilter, deleteFilter, loadFilters } = useSavedFilters('stocktake_saved_filters')

const filterFields: FilterField[] = [
  { key: 'status', label: '状态', type: 'select', options: [
    { label: '待开始', value: 'pending' },
    { label: '盘点中', value: 'in_progress' },
    { label: '待确认', value: 'to_confirm' },
    { label: '已完成', value: 'completed' },
  ]},
  { key: 'dimension', label: '盘点维度', type: 'select', options: [
    { label: '库位', value: 'location' },
    { label: '分类', value: 'category' },
    { label: '试剂', value: 'reagent' },
    { label: '耗材', value: 'consumable' },
    { label: '批次', value: 'batch' },
  ]},
  { key: 'itemType', label: '物品类型', type: 'select', options: [
    { label: '全部', value: 'all' },
    { label: '试剂', value: 'reagent' },
    { label: '耗材', value: 'consumable' },
  ]},
  { key: 'createTime', label: '创建时间', type: 'date-range' },
]

const pagination = reactive({
  page: 1,
  pageSize: 10,
})

const showFormModal = ref(false)
const formMode = ref<'create' | 'edit'>('create')
const currentId = ref('')
const formLoading = ref(false)
const formData = reactive<StockTakeFormData>({
  title: '',
  dimension: 'location',
  dimensionValue: '',
  itemType: 'all',
  assigneeId: '',
  assigneeName: '',
  remark: '',
})

const dimensionOptions = [
  { value: 'location', label: '库位' },
  { value: 'category', label: '分类' },
  { value: 'reagent', label: '试剂' },
  { value: 'consumable', label: '耗材' },
  { value: 'batch', label: '批次' },
]

const itemTypeOptions = [
  { value: 'all', label: '全部' },
  { value: 'reagent', label: '试剂' },
  { value: 'consumable', label: '耗材' },
]

const categoryOptions = computed(() => {
  if (formData.itemType === 'reagent') {
    return reagentCategories.map(c => ({ label: c, value: c }))
  } else if (formData.itemType === 'consumable') {
    return consumableCategories.map(c => ({ label: c, value: c }))
  }
  return [...reagentCategories, ...consumableCategories].map(c => ({ label: c, value: c }))
})

const reagentOptions = ref<{ label: string; value: string }[]>([])
const consumableOptions = ref<{ label: string; value: string }[]>([])
const batchOptions = ref<{ label: string; value: string }[]>([])
const showLocationSelector = ref(false)
const selectedLocationLabel = ref('')

const loadDimensionOptions = async () => {
  const reagents = await mockGetAllReagents()
  reagentOptions.value = reagents.map(r => ({ label: r.name, value: r.id }))

  const consumables = getConsumablesFromStorage()
  consumableOptions.value = consumables.map(c => ({ label: c.name, value: c.id }))

  const batches = getBatchesFromStorage()
  batchOptions.value = batches.map(b => ({ label: `${b.batchNumber} (${b.reagentName})`, value: b.id }))
}

const handleFormLocationConfirm = (locId: string, location?: any) => {
  formData.dimensionValue = locId
  selectedLocationLabel.value = location ? `${location.code} ${location.name}` : ''
}

const openFormLocationSelector = () => {
  showLocationSelector.value = true
}

const selectedIds = ref<string[]>([])
const showDeleteConfirm = ref(false)
const showStartConfirm = ref(false)
const deletingLoading = ref(false)
const startingLoading = ref(false)
const exportLoading = ref(false)

const canCreate = computed(() => permission.hasPermission('stocktake:create'))
const canEdit = computed(() => permission.hasPermission('stocktake:edit'))
const canDelete = computed(() => permission.hasPermission('stocktake:delete'))
const canCount = computed(() => permission.hasPermission('stocktake:count'))
const canConfirm = computed(() => permission.hasPermission('stocktake:confirm'))
const canExport = computed(() => permission.hasPermission('stocktake:export'))

const fetchData = async () => {
  loading.value = true
  try {
    const f = filters.value
    const params = {
      keyword: f.keyword || undefined,
      status: f.status || undefined,
      dimension: f.dimension || undefined,
      itemType: f.itemType || undefined,
      startTime: f.createTime?.[0] || undefined,
      endTime: f.createTime?.[1] || undefined,
    }
    const result = await mockGetStockTakes(pagination.page, pagination.pageSize, params)
    data.value = result

    const statsResult = await mockGetStockTakeStats()
    stats.value = statsResult
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

const handlePageChange = (page: number) => {
  pagination.page = page
  fetchData()
}

const totalPages = computed(() => {
  if (!data.value) return 0
  return Math.ceil(data.value.total / pagination.pageSize)
})

const openCreateModal = async () => {
  formMode.value = 'create'
  currentId.value = ''
  Object.assign(formData, {
    title: '',
    dimension: 'location',
    dimensionValue: '',
    itemType: 'all',
    assigneeId: '',
    assigneeName: '',
    remark: '',
  })
  selectedLocationLabel.value = ''
  await loadDimensionOptions()
  showFormModal.value = true
}

const openEditModal = async (item: StockTake) => {
  if (item.status !== 'pending') {
    alert('只能编辑待开始状态的盘点任务')
    return
  }
  formMode.value = 'edit'
  currentId.value = item.id
  Object.assign(formData, {
    title: item.title,
    dimension: item.dimension,
    dimensionValue: item.dimensionValue || '',
    itemType: item.itemType,
    assigneeId: item.assigneeId || '',
    assigneeName: item.assigneeName || '',
    remark: item.remark || '',
  })
  selectedLocationLabel.value = item.dimensionValueLabel || ''
  await loadDimensionOptions()
  showFormModal.value = true
}

const handleFormSubmit = async () => {
  if (!formData.title.trim()) {
    alert('请输入盘点标题')
    return
  }
  if (!formData.dimensionValue?.trim()) {
    alert('请选择盘点维度值')
    return
  }

  formLoading.value = true
  try {
    if (formMode.value === 'create') {
      await mockCreateStockTake(formData)
    } else {
      await mockUpdateStockTake(currentId.value, formData)
    }
    showFormModal.value = false
    fetchData()
  } catch (e: any) {
    alert(e.message || '操作失败')
  } finally {
    formLoading.value = false
  }
}

const handleView = (item: StockTake) => {
  router.push(`/stocktakes/${item.id}`)
}

const handleStart = (item: StockTake) => {
  if (item.status !== 'pending') {
    alert('只能开始待开始状态的盘点任务')
    return
  }
  currentId.value = item.id
  showStartConfirm.value = true
}

const confirmStart = async () => {
  startingLoading.value = true
  try {
    await mockStartStockTake(currentId.value)
    showStartConfirm.value = false
    fetchData()
  } catch (e: any) {
    alert(e.message || '操作失败')
  } finally {
    startingLoading.value = false
  }
}

const handleDelete = (item: StockTake) => {
  if (item.status === 'in_progress' || item.status === 'to_confirm') {
    alert('不能删除进行中的盘点任务')
    return
  }
  currentId.value = item.id
  showDeleteConfirm.value = true
}

const confirmDelete = async () => {
  deletingLoading.value = true
  try {
    await mockDeleteStockTake(currentId.value)
    showDeleteConfirm.value = false
    fetchData()
  } catch (e: any) {
    alert(e.message || '操作失败')
  } finally {
    deletingLoading.value = false
  }
}

const handleExport = async (item: StockTake) => {
  exportLoading.value = true
  try {
    const data = await mockExportStockTake(item.id)
    if (data) {
      downloadStockTakeReport(data)
    }
  } catch (e: any) {
    alert(e.message || '导出失败')
  } finally {
    exportLoading.value = false
  }
}

const getStatusActionText = (status: StockTakeStatus) => {
  switch (status) {
    case 'pending': return '开始盘点'
    case 'in_progress': return '录入实盘'
    case 'to_confirm': return '确认结果'
    case 'completed': return '查看详情'
    default: return '查看'
  }
}

const handleStatusAction = (item: StockTake) => {
  if (item.status === 'pending') {
    handleStart(item)
  } else {
    handleView(item)
  }
}

onMounted(() => {
  fetchData()
  loadFilters()
})
</script>

<template>
  <div class="p-6 space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">库存盘点</h1>
        <p class="text-gray-500 mt-1">管理库存盘点任务，录入实盘数量，处理差异结果</p>
      </div>
      <button
        v-if="canCreate"
        class="flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors font-medium"
        @click="openCreateModal"
      >
        <Plus class="w-5 h-5" />
        新建盘点
      </button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center">
            <ClipboardCheck class="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <p class="text-sm text-gray-500">全部任务</p>
            <p class="text-2xl font-bold text-gray-900">{{ stats?.total || 0 }}</p>
          </div>
        </div>
      </div>
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
            <Clock class="w-6 h-6 text-gray-600" />
          </div>
          <div>
            <p class="text-sm text-gray-500">待开始</p>
            <p class="text-2xl font-bold text-gray-900">{{ stats?.pending || 0 }}</p>
          </div>
        </div>
      </div>
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-xl bg-warning-100 flex items-center justify-center">
            <AlertCircle class="w-6 h-6 text-warning-600" />
          </div>
          <div>
            <p class="text-sm text-gray-500">待确认</p>
            <p class="text-2xl font-bold text-gray-900">{{ stats?.toConfirm || 0 }}</p>
          </div>
        </div>
      </div>
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-xl bg-success-100 flex items-center justify-center">
            <CheckCircle class="w-6 h-6 text-success-600" />
          </div>
          <div>
            <p class="text-sm text-gray-500">已完成</p>
            <p class="text-2xl font-bold text-gray-900">{{ stats?.completed || 0 }}</p>
          </div>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-gray-200">
      <div class="p-4 border-b border-gray-200">
        <div class="flex flex-wrap items-center gap-4">
          <div class="flex-1 min-w-[200px]">
            <div class="relative">
              <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                v-model="filters.keyword"
                type="text"
                placeholder="搜索盘点单号、标题、创建人、盘点人..."
                class="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                @keyup.enter="handleSearch"
              />
            </div>
          </div>
          <button
            class="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            @click="handleSearch"
          >
            <Filter class="w-5 h-5" />
            查询
          </button>
          <button
            class="px-4 py-2.5 text-gray-600 hover:text-gray-900 transition-colors"
            @click="handleReset"
          >
            重置
          </button>
        </div>

        <DataTableFilter
            :filterFields="filterFields"
          v-model="filters"
          :saved-filters="savedFilters"
          @search="handleSearch"
          @reset="handleReset"
          @save="handleSaveFilter"
          @apply="handleApplyFilter"
          @delete="handleDeleteFilter"
        />
      </div>

      <div v-if="loading" class="flex items-center justify-center py-20">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>

      <div v-else-if="!data?.list.length" class="flex flex-col items-center justify-center py-20 text-gray-500">
        <FileText class="w-16 h-16 text-gray-300 mb-4" />
        <p class="text-lg">暂无盘点任务</p>
        <p class="text-sm mt-1">点击右上角"新建盘点"创建第一个盘点任务</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50 border-b border-gray-200">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">盘点单号</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">标题</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">维度</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">类型</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">盘点进度</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">差异</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">创建人</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">盘点人</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">创建时间</th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr
              v-for="item in data.list"
              :key="item.id"
              class="hover:bg-gray-50 transition-colors"
            >
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="font-mono text-sm text-primary-600">{{ item.stockTakeNo }}</span>
              </td>
              <td class="px-6 py-4">
                <div class="font-medium text-gray-900">{{ item.title }}</div>
                <div v-if="item.remark" class="text-xs text-gray-500 mt-0.5">{{ item.remark }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">{{ stockTakeDimensionLabels[item.dimension] }}</div>
                <div class="text-xs text-gray-500">{{ item.dimensionValueLabel || item.dimensionValue }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ stockTakeItemTypeLabels[item.itemType] }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center gap-2">
                  <div class="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      class="h-full bg-primary-500 rounded-full transition-all"
                      :style="{ width: item.totalItems > 0 ? `${(item.checkedItems / item.totalItems) * 100}%` : '0%' }"
                    ></div>
                  </div>
                  <span class="text-sm text-gray-600">{{ item.checkedItems }}/{{ item.totalItems }}</span>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center gap-3 text-sm">
                  <span v-if="item.surplusCount > 0" class="flex items-center gap-1 text-success-600">
                    <TrendingUp class="w-4 h-4" />
                    {{ item.surplusCount }}
                  </span>
                  <span v-if="item.deficitCount > 0" class="flex items-center gap-1 text-danger-600">
                    <TrendingDown class="w-4 h-4" />
                    {{ item.deficitCount }}
                  </span>
                  <span v-if="item.noDiffCount > 0" class="flex items-center gap-1 text-gray-500">
                    <Minus class="w-4 h-4" />
                    {{ item.noDiffCount }}
                  </span>
                  <span v-if="item.surplusCount === 0 && item.deficitCount === 0 && item.noDiffCount === 0" class="text-gray-400">
                    -
                  </span>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
                  :class="stockTakeStatusColors[item.status]"
                >
                  {{ stockTakeStatusLabels[item.status] }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ item.creatorName }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ item.assigneeName || '-' }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ formatDate(item.createdAt) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right">
                <div class="flex items-center justify-end gap-1">
                  <button
                    class="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                    title="查看"
                    @click="handleView(item)"
                  >
                    <Eye class="w-4 h-4" />
                  </button>
                  <button
                    v-if="canEdit && item.status === 'pending'"
                    class="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                    title="编辑"
                    @click="openEditModal(item)"
                  >
                    <Edit2 class="w-4 h-4" />
                  </button>
                  <button
                    v-if="(canCount || canConfirm) && item.status !== 'completed'"
                    class="px-2.5 py-1 text-xs font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
                    @click="handleStatusAction(item)"
                  >
                    {{ getStatusActionText(item.status) }}
                  </button>
                  <button
                    v-if="canExport && item.status === 'completed'"
                    class="p-1.5 text-gray-400 hover:text-success-600 hover:bg-success-50 rounded-lg transition-colors"
                    title="导出报表"
                    @click="handleExport(item)"
                  >
                    <Download class="w-4 h-4" />
                  </button>
                  <button
                    v-if="canDelete && (item.status === 'pending' || item.status === 'completed')"
                    class="p-1.5 text-gray-400 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
                    title="删除"
                    @click="handleDelete(item)"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="data?.list.length" class="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
        <div class="text-sm text-gray-500">
          共 {{ data.total }} 条记录，第 {{ pagination.page }} / {{ totalPages }} 页
        </div>
        <div class="flex items-center gap-2">
          <button
            :disabled="pagination.page <= 1"
            class="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            @click="handlePageChange(pagination.page - 1)"
          >
            <ChevronLeft class="w-5 h-5" />
          </button>
          <span class="px-3 py-1 text-sm text-gray-600">
            {{ pagination.page }} / {{ totalPages }}
          </span>
          <button
            :disabled="pagination.page >= totalPages"
            class="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            @click="handlePageChange(pagination.page + 1)"
          >
            <ChevronRight class="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>

    <div v-if="showFormModal" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/50" @click="showFormModal = false"></div>
      <div class="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 class="text-lg font-semibold text-gray-900">
            {{ formMode === 'create' ? '新建盘点任务' : '编辑盘点任务' }}
          </h2>
          <button
            class="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            @click="showFormModal = false"
          >
            <X class="w-5 h-5" />
          </button>
        </div>
        <div class="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              盘点标题 <span class="text-danger-500">*</span>
            </label>
            <input
              v-model="formData.title"
              type="text"
              placeholder="请输入盘点标题"
              class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                盘点维度 <span class="text-danger-500">*</span>
              </label>
              <select
                v-model="formData.dimension"
                class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
              >
                <option v-for="opt in dimensionOptions" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                物品类型 <span class="text-danger-500">*</span>
              </label>
              <select
                v-model="formData.itemType"
                class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
              >
                <option v-for="opt in itemTypeOptions" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              维度值 <span class="text-danger-500">*</span>
            </label>
            <select
              v-if="formData.dimension === 'location'"
              style="display: none"
            ></select>
            <div
              v-if="formData.dimension === 'location'"
              class="flex items-center gap-2"
            >
              <button
                type="button"
                class="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-left hover:border-primary-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all flex items-center gap-2"
                @click="openFormLocationSelector"
              >
                <MapPin class="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span v-if="selectedLocationLabel" class="text-gray-900 truncate">{{ selectedLocationLabel }}</span>
                <span v-else class="text-gray-400">请选择库位（含所有子库位）</span>
              </button>
              <button
                v-if="formData.dimensionValue"
                type="button"
                class="p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                title="清除选择"
                @click="formData.dimensionValue = ''; selectedLocationLabel = ''"
              >
                <X class="w-4 h-4" />
              </button>
            </div>
            <select
              v-else-if="formData.dimension === 'category'"
              v-model="formData.dimensionValue"
              class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
            >
              <option value="">请选择分类</option>
              <option v-for="opt in categoryOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
            <select
              v-else-if="formData.dimension === 'reagent'"
              v-model="formData.dimensionValue"
              class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
            >
              <option value="">请选择试剂</option>
              <option v-for="opt in reagentOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
            <select
              v-else-if="formData.dimension === 'consumable'"
              v-model="formData.dimensionValue"
              class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
            >
              <option value="">请选择耗材</option>
              <option v-for="opt in consumableOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
            <select
              v-else-if="formData.dimension === 'batch'"
              v-model="formData.dimensionValue"
              class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
            >
              <option value="">请选择批次</option>
              <option v-for="opt in batchOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              盘点人
            </label>
            <input
              v-model="formData.assigneeName"
              type="text"
              placeholder="请输入盘点人姓名"
              class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              备注
            </label>
            <textarea
              v-model="formData.remark"
              rows="3"
              placeholder="请输入备注信息"
              class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all resize-none"
            ></textarea>
          </div>
        </div>
        <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <button
            class="px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            @click="showFormModal = false"
          >
            取消
          </button>
          <button
            :disabled="formLoading"
            class="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            @click="handleFormSubmit"
          >
            <div v-if="formLoading" class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            {{ formMode === 'create' ? '创建' : '保存' }}
          </button>
        </div>
      </div>
    </div>

    <ConfirmDialog
      v-model:visible="showStartConfirm"
      title="开始盘点"
      message="确定要开始此盘点任务吗？开始后将无法编辑盘点任务信息。"
      confirm-text="开始盘点"
      :loading="startingLoading"
      @confirm="confirmStart"
    />

    <ConfirmDialog
      v-model:visible="showDeleteConfirm"
      title="删除盘点"
      message="确定要删除此盘点任务吗？此操作不可恢复。"
      confirm-text="删除"
      confirm-type="danger"
      :loading="deletingLoading"
      @confirm="confirmDelete"
    />

    <LocationSelector
      v-model:visible="showLocationSelector"
      :model-value="formData.dimensionValue"
      :only-enabled="true"
      @confirm="handleFormLocationConfirm"
    />
  </div>
</template>
