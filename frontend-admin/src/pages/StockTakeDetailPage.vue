<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeft,
  Download,
  CheckCircle2,
  Edit3,
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
  User,
  FileText,
  CheckSquare,
  Square,
  Search,
  Filter,
  X,
  Save,
} from 'lucide-vue-next'
import {
  mockGetStockTake,
  mockUpdateStockTakeItem,
  mockBatchUpdateStockTakeItems,
  mockConfirmStockTake,
  mockExportStockTake,
  mockGetAdjustments,
  downloadStockTakeReport,
} from '@/mock/stocktakes'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import type {
  StockTake,
  StockTakeItem,
  StockTakeConfirmData,
  StockAdjustmentRecord,
  StockTakeItemType,
  DifferenceResult,
} from '@/types/stocktake'
import {
  stockTakeStatusLabels,
  stockTakeStatusColors,
  stockTakeDimensionLabels,
  stockTakeItemTypeLabels,
  differenceResultLabels,
  differenceResultColors,
} from '@/types/stocktake'
import { formatDate } from '@/utils/date'
import { usePermission } from '@/composables/usePermission'
import type { PageResult } from '@/types/common'

const route = useRoute()
const router = useRouter()
const permission = usePermission()

const stockTakeId = computed(() => route.params.id as string)

const loading = ref(false)
const data = ref<StockTake | null>(null)
const adjustments = ref<PageResult<StockAdjustmentRecord> | null>(null)

const itemFilters = ref({
  keyword: '',
  differenceResult: '' as DifferenceResult | '',
  itemType: '' as StockTakeItemType | '',
  onlyUnchecked: false,
})

const editingItem = ref<StockTakeItem | null>(null)
const showEditModal = ref(false)
const editLoading = ref(false)
const editForm = reactive({
  actualQuantity: 0,
  remark: '',
})

const showConfirmModal = ref(false)
const confirmLoading = ref(false)
const confirmForm = reactive<StockTakeConfirmData>({
  confirmRemark: '',
  handleSurplus: true,
  handleDeficit: true,
})

const selectedItems = ref<Set<string>>(new Set())
const batchEditLoading = ref(false)
const showBatchEditModal = ref(false)
const batchEditForm = reactive({
  actualQuantity: 0,
})

const canCount = computed(() => permission.hasPermission('stocktake:count'))
const canConfirm = computed(() => permission.hasPermission('stocktake:confirm'))
const canExport = computed(() => permission.hasPermission('stocktake:export'))
const canAdjust = computed(() => permission.hasPermission('stocktake:adjust'))

const filteredItems = computed(() => {
  if (!data.value) return []
  let items = [...data.value.items]

  if (itemFilters.value.keyword) {
    const kw = itemFilters.value.keyword.toLowerCase()
    items = items.filter(item =>
      item.itemName.toLowerCase().includes(kw) ||
      item.batchNumber?.toLowerCase().includes(kw) ||
      item.storageLocation.toLowerCase().includes(kw) ||
      item.category?.toLowerCase().includes(kw)
    )
  }

  if (itemFilters.value.differenceResult) {
    items = items.filter(item => item.differenceResult === itemFilters.value.differenceResult)
  }

  if (itemFilters.value.itemType) {
    items = items.filter(item => item.itemType === itemFilters.value.itemType)
  }

  if (itemFilters.value.onlyUnchecked) {
    items = items.filter(item => item.actualQuantity === null)
  }

  return items
})

const allSelected = computed(() => {
  return filteredItems.value.length > 0 && filteredItems.value.every(item => selectedItems.value.has(item.id))
})

const someSelected = computed(() => {
  return filteredItems.value.some(item => selectedItems.value.has(item.id)) && !allSelected.value
})

const fetchData = async () => {
  loading.value = true
  try {
    const [stocktake, adjustmentsData] = await Promise.all([
      mockGetStockTake(stockTakeId.value),
      mockGetAdjustments(1, 100, stockTakeId.value),
    ])
    data.value = stocktake
    adjustments.value = adjustmentsData
  } finally {
    loading.value = false
  }
}

const handleBack = () => {
  router.push('/stocktakes')
}

const openEditModal = (item: StockTakeItem) => {
  if (data.value?.status !== 'in_progress') {
    alert('只能在盘点中状态录入实盘数量')
    return
  }
  editingItem.value = item
  editForm.actualQuantity = item.actualQuantity ?? item.bookQuantity
  editForm.remark = item.remark || ''
  showEditModal.value = true
}

const handleEditSubmit = async () => {
  editLoading.value = true
  try {
    await mockUpdateStockTakeItem(
      stockTakeId.value,
      editingItem.value!.id,
      {
        actualQuantity: editForm.actualQuantity,
        remark: editForm.remark,
      }
    )
    showEditModal.value = false
    fetchData()
  } catch (e: any) {
    alert(e.message || '保存失败')
  } finally {
    editLoading.value = false
  }
}

const toggleSelectAll = () => {
  if (allSelected.value) {
    filteredItems.value.forEach(item => selectedItems.value.delete(item.id))
  } else {
    filteredItems.value.forEach(item => selectedItems.value.add(item.id))
  }
}

const toggleSelectItem = (itemId: string) => {
  if (selectedItems.value.has(itemId)) {
    selectedItems.value.delete(itemId)
  } else {
    selectedItems.value.add(itemId)
  }
}

const openBatchEditModal = () => {
  if (selectedItems.value.size === 0) {
    alert('请先选择要批量录入的项')
    return
  }
  batchEditForm.actualQuantity = 0
  showBatchEditModal.value = true
}

const handleBatchEditSubmit = async () => {
  if (batchEditForm.actualQuantity < 0) {
    alert('请输入有效数量')
    return
  }
  batchEditLoading.value = true
  try {
    const updates = Array.from(selectedItems.value).map(itemId => ({
      itemId,
      actualQuantity: batchEditForm.actualQuantity,
    }))
    await mockBatchUpdateStockTakeItems(stockTakeId.value, updates)
    selectedItems.value.clear()
    showBatchEditModal.value = false
    fetchData()
  } catch (e: any) {
    alert(e.message || '批量录入失败')
  } finally {
    batchEditLoading.value = false
  }
}

const openConfirmModal = () => {
  if (data.value?.status !== 'to_confirm') {
    alert('只能确认待确认状态的盘点任务')
    return
  }
  confirmForm.confirmRemark = ''
  confirmForm.handleSurplus = true
  confirmForm.handleDeficit = true
  showConfirmModal.value = true
}

const handleConfirmSubmit = async () => {
  if (!confirm('确认盘点结果将生成库存调整记录吗？')) {
    return
  }
  confirmLoading.value = true
  try {
    await mockConfirmStockTake(stockTakeId.value, confirmForm)
    showConfirmModal.value = false
    fetchData()
  } catch (e: any) {
    alert(e.message || '确认失败')
  } finally {
    confirmLoading.value = false
  }
}

const handleExport = async () => {
  try {
    const exportData = await mockExportStockTake(stockTakeId.value)
    if (exportData) {
      downloadStockTakeReport(exportData)
    }
  } catch (e: any) {
    alert(e.message || '导出失败')
  }
}

const getItemTypeLabel = (type: StockTakeItemType) => {
  return type === 'reagent' ? '试剂' : '耗材'
}

onMounted(() => {
  fetchData()
})
</script>

<template>
  <div class="p-6 space-y-6">
    <div class="flex items-center gap-4">
      <button
        class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        @click="handleBack"
      >
        <ArrowLeft class="w-5 h-5" />
      </button>
      <div class="flex-1">
        <h1 class="text-2xl font-bold text-gray-900">盘点详情</h1>
        <p class="text-gray-500 mt-1">
          {{ data?.stockTakeNo }}
        </p>
      </div>
      <div class="flex items-center gap-2">
        <button
          v-if="canCount && data?.status === 'in_progress' && selectedItems.size > 0"
          class="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          @click="openBatchEditModal"
        >
          <Edit3 class="w-4 h-4" />
          批量录入
        </button>
        <button
          v-if="canConfirm && data?.status === 'in_progress' && data?.checkedItems === data?.totalItems && data?.totalItems > 0"
          class="flex items-center gap-2 px-4 py-2 bg-warning-600 hover:bg-warning-700 text-white rounded-lg transition-colors font-medium"
          @click="openConfirmModal"
        >
          <CheckCircle2 class="w-5 h-5" />
          确认结果
        </button>
        <button
          v-if="canExport && data?.status === 'completed'"
          class="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          @click="handleExport"
        >
          <Download class="w-5 h-5" />
          导出报表
        </button>
      </div>
    </div>

    <div v-if="loading" class="flex items-center justify-center py-20">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
    </div>

    <template v-else-if="!data">
      <div class="flex flex-col items-center justify-center py-20 text-gray-500">
        <FileText class="w-16 h-16 text-gray-300 mb-4" />
        <p class="text-lg">盘点任务不存在</p>
      </div>
    </template>

    <template v-else>
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
        <div class="flex items-start justify-between">
          <div>
            <h2 class="text-xl font-semibold text-gray-900">{{ data.title }}</h2>
            <p v-if="data.remark" class="text-gray-500 mt-1">{{ data.remark }}</p>
          </div>
          <span
            class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
            :class="stockTakeStatusColors[data.status]"
          >
            {{ stockTakeStatusLabels[data.status] }}
          </span>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
          <div class="space-y-1">
            <p class="text-sm text-gray-500">盘点维度</p>
            <p class="font-medium text-gray-900">
              {{ stockTakeDimensionLabels[data.dimension] }}: {{ data.dimensionValueLabel || data.dimensionValue }}
            </p>
          </div>
          <div class="space-y-1">
            <p class="text-sm text-gray-500">物品类型</p>
            <p class="font-medium text-gray-900">{{ stockTakeItemTypeLabels[data.itemType] }}</p>
          </div>
          <div class="space-y-1">
            <p class="text-sm text-gray-500">创建人</p>
            <p class="font-medium text-gray-900">{{ data.creatorName }}</p>
          </div>
          <div class="space-y-1">
            <p class="text-sm text-gray-500">盘点人</p>
            <p class="font-medium text-gray-900">{{ data.assigneeName || '-' }}</p>
          </div>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
          <div class="space-y-1">
            <p class="text-sm text-gray-500">创建时间</p>
            <p class="font-medium text-gray-900">{{ formatDate(data.createdAt) }}</p>
          </div>
          <div class="space-y-1">
            <p class="text-sm text-gray-500">开始时间</p>
            <p class="font-medium text-gray-900">{{ data.startTime ? formatDate(data.startTime) : '-' }}</p>
          </div>
          <div class="space-y-1">
            <p class="text-sm text-gray-500">完成时间</p>
            <p class="font-medium text-gray-900">{{ data.endTime ? formatDate(data.endTime) : '-' }}</p>
          </div>
          <div class="space-y-1">
            <p class="text-sm text-gray-500">确认时间</p>
            <p class="font-medium text-gray-900">{{ data.confirmTime ? formatDate(data.confirmTime) : '-' }}</p>
          </div>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
          <div class="bg-primary-50 rounded-lg p-4">
            <p class="text-sm text-gray-500">总项数</p>
            <p class="text-2xl font-bold text-gray-900 mt-1">{{ data.totalItems }}</p>
          </div>
          <div class="bg-gray-50 rounded-lg p-4">
            <p class="text-sm text-gray-500">已盘点</p>
            <p class="text-2xl font-bold text-gray-900 mt-1">{{ data.checkedItems }}/{{ data.totalItems }}</p>
          </div>
          <div class="bg-success-50 rounded-lg p-4">
            <p class="text-sm text-gray-500">盘盈</p>
            <p class="text-2xl font-bold text-success-600 mt-1">+{{ data.surplusCount }}</p>
          </div>
          <div class="bg-danger-50 rounded-lg p-4">
            <p class="text-sm text-gray-500">盘亏</p>
            <p class="text-2xl font-bold text-danger-600 mt-1">-{{ data.deficitCount }}</p>
          </div>
        </div>

        <div v-if="data.confirmedByName" class="pt-4 border-t border-gray-100">
          <p class="text-sm text-gray-500">确认人</p>
          <p class="font-medium text-gray-900">{{ data.confirmedByName }}</p>
          <p v-if="data.confirmRemark" class="text-sm text-gray-500 mt-2">确认备注</p>
          <p v-if="data.confirmRemark" class="font-medium text-gray-900">{{ data.confirmRemark }}</p>
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-gray-200">
        <div class="p-4 border-b border-gray-200">
          <div class="flex flex-wrap items-center gap-4">
            <div class="flex-1 min-w-[200px]">
              <div class="relative">
                <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  v-model="itemFilters.keyword"
                  type="text"
                  placeholder="搜索物品名称、批次号、库位、分类..."
                  class="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                />
              </div>
            </div>
            <select
              v-model="itemFilters.itemType"
              class="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
            >
              <option value="">全部类型</option>
              <option value="reagent">试剂</option>
              <option value="consumable">耗材</option>
            </select>
            <select
              v-model="itemFilters.differenceResult"
              class="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
            >
              <option value="">全部差异</option>
              <option value="surplus">盘盈</option>
              <option value="deficit">盘亏</option>
              <option value="no_diff">无差异</option>
            </select>
            <label class="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                v-model="itemFilters.onlyUnchecked"
                type="checkbox"
                class="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <span class="text-sm text-gray-700">仅显示未盘点</span>
            </label>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50 border-b border-gray-200">
              <tr>
                <th v-if="data.status === 'in_progress'" class="w-12 px-4 py-3 text-left">
                  <button
                    class="p-1 text-gray-400 hover:text-gray-600"
                    @click="toggleSelectAll"
                  >
                    <CheckSquare v-if="allSelected" class="w-5 h-5 text-primary-600" />
                    <Minus v-else-if="someSelected" class="w-5 h-5 text-primary-600" />
                    <Square v-else class="w-5 h-5" />
                  </button>
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">物品类型</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">物品名称</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">分类</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">规格</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">批次号</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">库位</th>
                <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">账面数量</th>
                <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">实盘数量</th>
                <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">差异</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">差异结果</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">盘点人</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">盘点时间</th>
                <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              <tr
                v-for="item in filteredItems"
                :key="item.id"
                class="hover:bg-gray-50 transition-colors"
                :class="{ 'bg-warning-50': item.actualQuantity === null && data.status === 'in_progress' }"
              >
                <td v-if="data.status === 'in_progress'" class="px-4 py-4">
                  <button
                    class="p-1 text-gray-400 hover:text-primary-600"
                    @click="toggleSelectItem(item.id)"
                  >
                    <CheckSquare v-if="selectedItems.has(item.id)" class="w-5 h-5 text-primary-600" />
                    <Square v-else class="w-5 h-5" />
                  </button>
                </td>
                <td class="px-4 py-4 whitespace-nowrap">
                  <span class="text-sm text-gray-900">{{ getItemTypeLabel(item.itemType) }}</span>
                </td>
                <td class="px-4 py-4">
                  <div class="font-medium text-gray-900">{{ item.itemName }}</div>
                  <div v-if="item.remark" class="text-xs text-gray-500 mt-0.5">{{ item.remark }}</div>
                </td>
                <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{{ item.category || '-' }}</td>
                <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{{ item.specification || '-' }}</td>
                <td class="px-4 py-4 whitespace-nowrap text-sm font-mono text-gray-900">{{ item.batchNumber || '-' }}</td>
                <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{{ item.storageLocation }}</td>
                <td class="px-4 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                  {{ item.bookQuantity }} {{ item.unit }}
                </td>
                <td class="px-4 py-4 whitespace-nowrap text-right">
                  <span
                    class="font-medium"
                    :class="{
                      'text-gray-400': item.actualQuantity === null,
                      'text-gray-900': item.actualQuantity !== null,
                    }"
                  >
                    {{ item.actualQuantity !== null ? `${item.actualQuantity} ${item.unit}` : '未盘点' }}
                  </span>
                </td>
                <td class="px-4 py-4 whitespace-nowrap text-right">
                  <span
                    v-if="item.differenceResult"
                    :class="{
                      'text-success-600': item.difference > 0,
                      'text-danger-600': item.difference < 0,
                      'text-gray-400': item.difference === 0,
                    }"
                  >
                    {{ item.difference > 0 ? '+' : '' }}{{ item.difference }}
                  </span>
                  <span v-else class="text-gray-400">-</span>
                </td>
                <td class="px-4 py-4 whitespace-nowrap">
                  <span
                    v-if="item.differenceResult"
                    class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                    :class="differenceResultColors[item.differenceResult]"
                  >
                    {{ differenceResultLabels[item.differenceResult] }}
                  </span>
                  <span v-else class="text-gray-400">-</span>
                </td>
                <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{{ item.checkedByName || '-' }}</td>
                <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ item.checkedAt ? formatDate(item.checkedAt) : '-' }}
                </td>
                <td class="px-4 py-4 whitespace-nowrap text-center">
                  <button
                    v-if="canCount && data.status === 'in_progress'"
                    class="px-2 py-1 text-xs font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded transition-colors"
                    @click="openEditModal(item)"
                  >
                    录入
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="filteredItems.length === 0" class="flex flex-col items-center justify-center py-12 text-gray-500">
          <FileText class="w-12 h-12 text-gray-300 mb-2" />
          <p>没有符合条件的盘点项</p>
        </div>
      </div>

      <div v-if="adjustments?.list.length" class="bg-white rounded-xl shadow-sm border border-gray-200">
        <div class="p-4 border-b border-gray-200">
          <h3 class="text-lg font-semibold text-gray-900">库存调整记录</h3>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50 border-b border-gray-200">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">物品名称</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">调整类型</th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">调整数量</th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">调整前</th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">调整后</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作人</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">原因</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">时间</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              <tr
                v-for="adjustment in adjustments.list"
                :key="adjustment.id"
                class="hover:bg-gray-50 transition-colors"
              >
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="font-medium text-gray-900">{{ adjustment.itemName }}</div>
                  <div class="text-xs text-gray-500">{{ adjustment.batchNumber || '' }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                    :class="adjustment.adjustType === 'surplus' ? 'bg-success-100 text-success-700' : 'bg-danger-100 text-danger-700'"
                  >
                    {{ adjustment.adjustType === 'surplus' ? '盘盈' : '盘亏' }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium" :class="adjustment.adjustType === 'surplus' ? 'text-success-600' : 'text-danger-600'">
                  {{ adjustment.adjustType === 'surplus' ? '+' : '-' }}{{ adjustment.adjustQuantity }} {{ adjustment.unit }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">{{ adjustment.beforeQuantity }} {{ adjustment.unit }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">{{ adjustment.afterQuantity }} {{ adjustment.unit }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ adjustment.operatorName }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ adjustment.reason }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ formatDate(adjustment.createdAt) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <div v-if="showEditModal" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/50" @click="showEditModal = false"></div>
      <div class="relative bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 class="text-lg font-semibold text-gray-900">录入实盘数量</h2>
          <button
            class="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            @click="showEditModal = false"
          >
            <X class="w-5 h-5" />
          </button>
        </div>
        <div class="p-6 space-y-4">
          <div class="bg-gray-50 rounded-lg p-4">
            <p class="text-sm text-gray-500">物品名称</p>
            <p class="font-medium text-gray-900">{{ editingItem?.itemName }}</p>
            <p class="text-sm text-gray-500 mt-2">账面数量: {{ editingItem?.bookQuantity }} {{ editingItem?.unit }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              实盘数量 <span class="text-danger-500">*</span>
            </label>
            <input
              v-model.number="editForm.actualQuantity"
              type="number"
              min="0"
              step="0.01"
              class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">备注</label>
            <textarea
              v-model="editForm.remark"
              rows="2"
              placeholder="请输入备注信息"
              class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all resize-none"
            ></textarea>
          </div>
        </div>
        <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <button
            class="px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            @click="showEditModal = false"
          >
            取消
          </button>
          <button
            :disabled="editLoading"
            class="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            @click="handleEditSubmit"
          >
            <div v-if="editLoading" class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            保存
          </button>
        </div>
      </div>
    </div>

    <div v-if="showBatchEditModal" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/50" @click="showBatchEditModal = false"></div>
      <div class="relative bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 class="text-lg font-semibold text-gray-900">批量录入实盘数量</h2>
          <button
            class="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            @click="showBatchEditModal = false"
          >
            <X class="w-5 h-5" />
          </button>
        </div>
        <div class="p-6 space-y-4">
          <div class="bg-gray-50 rounded-lg p-4">
            <p class="text-sm text-gray-500">已选择 <span class="font-medium text-primary-600">{{ selectedItems.size }}</span> 项</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              实盘数量 <span class="text-danger-500">*</span>
            </label>
            <input
              v-model.number="batchEditForm.actualQuantity"
              type="number"
              min="0"
              step="0.01"
              class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
            />
          </div>
        </div>
        <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <button
            class="px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            @click="showBatchEditModal = false"
          >
            取消
          </button>
          <button
            :disabled="batchEditLoading"
            class="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            @click="handleBatchEditSubmit"
          >
            <div v-if="batchEditLoading" class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            保存
          </button>
        </div>
      </div>
    </div>

    <div v-if="showConfirmModal" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/50" @click="showConfirmModal = false"></div>
      <div class="relative bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 class="text-lg font-semibold text-gray-900">确认盘点结果</h2>
          <button
            class="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            @click="showConfirmModal = false"
          >
            <X class="w-5 h-5" />
          </button>
        </div>
        <div class="p-6 space-y-4">
          <div class="bg-warning-50 rounded-lg p-4 space-y-2">
            <p class="text-sm text-gray-700">
              本次盘点共 <span class="font-bold text-gray-900">{{ data?.totalItems }}</span> 项，
              其中盘盈 <span class="font-bold text-success-600">{{ data?.surplusCount }}</span> 项，
              盘亏 <span class="font-bold text-danger-600">{{ data?.deficitCount }}</span> 项，
              无差异 <span class="font-bold text-gray-900">{{ data?.noDiffCount }}</span> 项。
            </p>
          </div>
          <div class="space-y-3">
            <label class="flex items-center gap-3">
              <input
                v-model="confirmForm.handleSurplus"
                type="checkbox"
                class="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <span class="text-sm text-gray-700">自动调整盘盈库存</span>
            </label>
            <label class="flex items-center gap-3">
              <input
                v-model="confirmForm.handleDeficit"
                type="checkbox"
                class="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <span class="text-sm text-gray-700">自动调整盘亏库存</span>
            </label>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">确认备注</label>
            <textarea
              v-model="confirmForm.confirmRemark"
              rows="3"
              placeholder="请输入确认备注信息"
              class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all resize-none"
            ></textarea>
          </div>
        </div>
        <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <button
            class="px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            @click="showConfirmModal = false"
          >
            取消
          </button>
          <button
            :disabled="confirmLoading"
            class="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            @click="handleConfirmSubmit"
          >
            <div v-if="confirmLoading" class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            确认
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
