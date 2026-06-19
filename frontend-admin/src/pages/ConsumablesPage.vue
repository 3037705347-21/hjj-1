<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  PackageOpen,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Eye,
  PackagePlus,
  UserCheck,
  RotateCcw,
  Trash2 as ScrapIcon,
  ArrowLeftRight,
  Wrench,
  MoreHorizontal,
  Calendar,
  History,
  Boxes,
} from 'lucide-vue-next'
import DataTableFilter from '@/components/DataTableFilter.vue'
import type { FilterField } from '@/components/DataTableFilter.vue'
import { useSavedFilters } from '@/composables/useSavedFilters'
import type { SavedFilter } from '@/composables/useSavedFilters'
import { exportToCsv } from '@/utils/csv'
import {
  mockGetConsumables,
  mockCreateConsumable,
  mockUpdateConsumable,
  mockDeleteConsumable,
  mockGetConsumable,
  mockGetConsumableOperations,
} from '@/mock/consumables'
import type {
  Consumable,
  ConsumableFormData,
  ConsumableOperation,
  ConsumableOperationType,
} from '@/types/consumable'
import {
  consumableCategories,
  operationTypeLabels,
  operationTypeColors,
  operationTypeConfigs,
} from '@/types/consumable'
import type { PageResult } from '@/types/common'
import { formatDate } from '@/utils/date'
import ConsumableOperationModal from '@/components/ConsumableOperationModal.vue'
import { usePermission } from '@/composables/usePermission'

const router = useRouter()
const permission = usePermission()

const activeTab = ref<'list' | 'operations'>('list')

const loading = ref(false)
const data = ref<PageResult<Consumable> | null>(null)

const operationsLoading = ref(false)
const operationsData = ref<PageResult<ConsumableOperation> | null>(null)

const filters = ref<Record<string, any>>({
  keyword: '',
  category: '',
  location: '',
  manufacturer: '',
  stockStatus: '',
  createTime: ['', ''],
  updateTime: ['', ''],
})

const { savedFilters, addFilter, deleteFilter, loadFilters } = useSavedFilters('consumable_saved_filters')

const filterFields: FilterField[] = [
  { key: 'category', label: '分类', type: 'select', options: consumableCategories.map((c) => ({ label: c, value: c })) },
  { key: 'manufacturer', label: '厂家', type: 'input', placeholder: '输入厂家名称' },
  { key: 'location', label: '库位', type: 'input', placeholder: '输入库位关键词' },
  { key: 'stockStatus', label: '库存状态', type: 'select', options: [
    { label: '库存充足', value: 'normal' },
    { label: '库存不足', value: 'low' },
  ]},
  { key: 'createTime', label: '创建时间', type: 'date-range' },
  { key: 'updateTime', label: '更新时间', type: 'date-range' },
]

const operationSearchForm = reactive({
  keyword: '',
  category: '',
  operationType: '' as ConsumableOperationType | '',
  operator: '',
  startTime: '',
  endTime: '',
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
})

const operationPagination = reactive({
  page: 1,
  pageSize: 10,
})

const showFormModal = ref(false)
const formMode = ref<'create' | 'edit'>('create')
const currentId = ref('')
const formLoading = ref(false)
const formData = reactive<ConsumableFormData>({
  name: '',
  category: '',
  specification: '',
  unit: '',
  stockQuantity: 0,
  safetyStock: 0,
  manufacturer: '',
  location: '',
  description: '',
})

const operationModalVisible = ref(false)
const currentOperationType = ref<ConsumableOperationType | null>(null)
const currentOperationConsumable = ref<Consumable | null>(null)

const fetchData = async () => {
  loading.value = true
  try {
    const f = filters.value
    const params = {
      keyword: f.keyword || undefined,
      category: f.category || undefined,
      location: f.location || undefined,
      manufacturer: f.manufacturer || undefined,
      stockStatus: f.stockStatus || undefined,
      createTimeStart: f.createTime?.[0] || undefined,
      createTimeEnd: f.createTime?.[1] || undefined,
      updateTimeStart: f.updateTime?.[0] || undefined,
      updateTimeEnd: f.updateTime?.[1] || undefined,
    }
    const result = await mockGetConsumables(pagination.page, pagination.pageSize, params)
    data.value = result
  } finally {
    loading.value = false
  }
}

const fetchOperations = async () => {
  operationsLoading.value = true
  try {
    const result = await mockGetConsumableOperations(
      operationPagination.page,
      operationPagination.pageSize,
      {
        keyword: operationSearchForm.keyword,
        category: operationSearchForm.category,
        operationType: operationSearchForm.operationType,
        operator: operationSearchForm.operator,
        startTime: operationSearchForm.startTime,
        endTime: operationSearchForm.endTime,
      }
    )
    operationsData.value = result
  } finally {
    operationsLoading.value = false
  }
}

const handleTabChange = (tab: 'list' | 'operations') => {
  activeTab.value = tab
  if (tab === 'operations' && !operationsData.value) {
    fetchOperations()
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

const handleExport = () => {
  if (!data.value?.list.length) {
    alert('暂无数据可导出')
    return
  }
  const columns = [
    { key: 'name', label: '耗材名称' },
    { key: 'category', label: '分类' },
    { key: 'specification', label: '规格' },
    { key: 'unit', label: '单位' },
    { key: 'stockQuantity', label: '当前库存' },
    { key: 'safetyStock', label: '安全库存' },
    { key: 'manufacturer', label: '生产厂家' },
    { key: 'location', label: '库位' },
    { key: 'description', label: '描述' },
    { key: 'createdAt', label: '创建时间', formatter: (v: string) => formatDate(v, 'YYYY-MM-DD HH:mm') },
    { key: 'updatedAt', label: '更新时间', formatter: (v: string) => formatDate(v, 'YYYY-MM-DD HH:mm') },
  ]
  exportToCsv(data.value.list, columns, `耗材列表_${formatDate(new Date(), 'YYYYMMDD')}.csv`)
}

const handleAction = () => {
  openCreateModal()
}

const handleOperationSearch = () => {
  operationPagination.page = 1
  fetchOperations()
}

const handleOperationReset = () => {
  operationSearchForm.keyword = ''
  operationSearchForm.category = ''
  operationSearchForm.operationType = ''
  operationSearchForm.operator = ''
  operationSearchForm.startTime = ''
  operationSearchForm.endTime = ''
  operationPagination.page = 1
  fetchOperations()
}

const handlePageChange = (page: number) => {
  pagination.page = page
  fetchData()
}

const handleOperationPageChange = (page: number) => {
  operationPagination.page = page
  fetchOperations()
}

const totalPages = computed(() => {
  if (!data.value) return 0
  return Math.ceil(data.value.total / pagination.pageSize)
})

const totalOperationPages = computed(() => {
  if (!operationsData.value) return 0
  return Math.ceil(operationsData.value.total / operationPagination.pageSize)
})

const isLowStock = (item: Consumable) => {
  return item.stockQuantity <= item.safetyStock
}

const stockPercentage = (item: Consumable) => {
  if (item.safetyStock <= 0) return 100
  const total = item.safetyStock * 2
  return Math.min(100, (item.stockQuantity / total) * 100)
}

const openCreateModal = () => {
  formMode.value = 'create'
  currentId.value = ''
  Object.assign(formData, {
    name: '',
    category: '',
    specification: '',
    unit: '',
    stockQuantity: 0,
    safetyStock: 0,
    manufacturer: '',
    location: '',
    description: '',
  })
  showFormModal.value = true
}

const openEditModal = async (id: string) => {
  formMode.value = 'edit'
  currentId.value = id
  formLoading.value = true
  try {
    const consumable = await mockGetConsumable(id)
    if (consumable) {
      Object.assign(formData, {
        name: consumable.name,
        category: consumable.category,
        specification: consumable.specification,
        unit: consumable.unit,
        stockQuantity: consumable.stockQuantity,
        safetyStock: consumable.safetyStock,
        manufacturer: consumable.manufacturer || '',
        location: consumable.location || '',
        description: consumable.description || '',
      })
      showFormModal.value = true
    }
  } finally {
    formLoading.value = false
  }
}

const handleSubmit = async () => {
  if (!formData.name.trim()) {
    alert('请输入耗材名称')
    return
  }
  if (!formData.category) {
    alert('请选择分类')
    return
  }

  formLoading.value = true
  try {
    if (formMode.value === 'create') {
      await mockCreateConsumable(formData)
    } else {
      await mockUpdateConsumable(currentId.value, formData)
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
  if (!confirm('确定要删除该耗材吗？删除后相关流水记录也会被清除。')) {
    return
  }
  try {
    await mockDeleteConsumable(id)
    if (data.value?.list.length === 1 && pagination.page > 1) {
      pagination.page--
    }
    fetchData()
  } catch (e: any) {
    alert(e.message || '删除失败')
  }
}

const goToDetail = (id: string) => {
  router.push(`/consumables/${id}`)
}

const openOperationModal = (consumable: Consumable, type: ConsumableOperationType) => {
  currentOperationConsumable.value = consumable
  currentOperationType.value = type
  operationModalVisible.value = true
}

const handleOperationSuccess = () => {
  fetchData()
  if (activeTab.value === 'operations') {
    fetchOperations()
  }
}

onMounted(() => {
  fetchData()
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">耗材管理</h1>
        <p class="text-sm text-gray-500 mt-0.5">管理实验室耗材库存与出入库流水</p>
      </div>
    </div>

    <div class="bg-white rounded-xl shadow-card overflow-hidden">
      <div class="flex items-center gap-1 px-2 border-b border-gray-100">
        <button
          class="px-6 py-4 text-sm font-medium border-b-2 transition-colors"
          :class="[
            activeTab === 'list'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200',
          ]"
          @click="handleTabChange('list')"
        >
          <span class="flex items-center gap-2">
            <Boxes class="w-4 h-4" />
            耗材列表
          </span>
        </button>
        <button
          class="px-6 py-4 text-sm font-medium border-b-2 transition-colors"
          :class="[
            activeTab === 'operations'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200',
          ]"
          @click="handleTabChange('operations')"
        >
          <span class="flex items-center gap-2">
            <History class="w-4 h-4" />
            出入库流水
          </span>
        </button>
      </div>

      <div v-if="activeTab === 'list'" class="p-6">
        <DataTableFilter
          v-model="filters"
          :filter-fields="filterFields"
          :saved-filters="savedFilters"
          :show-export="permission.canCreateConsumable"
          :plain="true"
          :action-button-text="permission.canCreateConsumable ? '新增耗材' : undefined"
          keyword-placeholder="搜索耗材名称、厂家、货号、库位..."
          class="mb-6"
          @search="handleSearch"
          @reset="handleReset"
          @export="handleExport"
          @action="handleAction"
          @save-filter="handleSaveFilter"
          @apply-filter="handleApplyFilter"
          @delete-filter="handleDeleteFilter"
        />

        <div v-if="loading" class="p-16 flex items-center justify-center">
          <div class="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
        </div>

        <div v-else>
          <div class="overflow-x-auto -mx-6">
            <table class="w-full">
              <thead class="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    耗材名称
                  </th>
                  <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    分类
                  </th>
                  <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    规格
                  </th>
                  <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    库存
                  </th>
                  <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    存放位置
                  </th>
                  <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    生产厂家
                  </th>
                  <th class="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr
                  v-for="item in data?.list"
                  :key="item.id"
                  class="hover:bg-gray-50 transition-colors cursor-pointer"
                  :class="{ 'bg-danger-50/30': isLowStock(item) }"
                  @click="goToDetail(item.id)"
                >
                  <td class="px-6 py-4" @click.stop>
                    <div class="flex items-center gap-3">
                      <div
                        class="w-10 h-10 rounded-lg flex items-center justify-center"
                        :class="isLowStock(item) ? 'bg-danger-50' : 'bg-success-50'"
                      >
                        <PackageOpen
                          class="w-5 h-5"
                          :class="isLowStock(item) ? 'text-danger-600' : 'text-success-600'"
                        />
                      </div>
                      <div>
                        <div class="font-medium text-gray-900 flex items-center gap-2">
                          <span class="hover:text-primary-600 transition-colors cursor-pointer" @click="goToDetail(item.id)">
                            {{ item.name }}
                          </span>
                          <span
                            v-if="isLowStock(item)"
                            class="inline-flex items-center gap-0.5 text-xs text-danger-600"
                          >
                            <AlertTriangle class="w-3 h-3" />
                            低库存
                          </span>
                        </div>
                        <div class="text-xs text-gray-400">
                          更新于 {{ formatDate(item.updatedAt, 'MM-DD') }}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4" @click.stop>
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-50 text-primary-700">
                      {{ item.category }}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-sm text-gray-600" @click.stop>
                    {{ item.specification }}
                  </td>
                  <td class="px-6 py-4" @click.stop>
                    <div class="flex items-center gap-3">
                      <div class="w-24">
                        <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            class="h-full rounded-full transition-all"
                            :class="{
                              'bg-success-500': !isLowStock(item),
                              'bg-danger-500': isLowStock(item),
                            }"
                            :style="{ width: `${stockPercentage(item)}%` }"
                          />
                        </div>
                      </div>
                      <div class="text-sm">
                        <span
                          class="font-medium"
                          :class="isLowStock(item) ? 'text-danger-600' : 'text-gray-900'"
                        >
                          {{ item.stockQuantity }}
                        </span>
                        <span class="text-gray-400"> / {{ item.safetyStock }} 安全库存 {{ item.unit }}</span>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4" @click.stop>
                    <div
                      v-if="item.location"
                      class="flex items-center gap-1 text-sm text-gray-600"
                    >
                      <MapPin class="w-3.5 h-3.5 text-gray-400" />
                      {{ item.location }}
                    </div>
                    <span v-else class="text-gray-400 text-sm">-</span>
                  </td>
                  <td class="px-6 py-4 text-sm text-gray-600" @click.stop>
                    {{ item.manufacturer || '-' }}
                  </td>
                  <td class="px-6 py-4" @click.stop>
                    <div class="flex items-center justify-center gap-1">
                      <button
                        class="p-1.5 text-gray-500 hover:bg-gray-100 rounded transition-colors"
                        title="查看详情"
                        @click="goToDetail(item.id)"
                      >
                        <Eye class="w-4 h-4" />
                      </button>

                      <div v-if="permission.canOperateConsumable || permission.canUseConsumable" class="relative group">
                        <button
                          class="p-1.5 text-primary-500 hover:bg-primary-50 rounded transition-colors"
                          title="库存操作"
                        >
                          <MoreHorizontal class="w-4 h-4" />
                        </button>
                        <div class="absolute right-0 top-full mt-1 w-36 bg-white rounded-lg shadow-xl border border-gray-100 py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                          <template v-for="config in operationTypeConfigs" :key="config.type">
                            <button
                              v-if="(config.type === 'use' && permission.canUseConsumable) || (config.type !== 'use' && permission.canOperateConsumable)"
                              class="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                              @click="openOperationModal(item, config.type)"
                            >
                              <component
                                :is="{
                                  stock_in: PackagePlus,
                                  use: UserCheck,
                                  return: RotateCcw,
                                  scrap: ScrapIcon,
                                  transfer: ArrowLeftRight,
                                  adjust: Wrench,
                                }[config.type]"
                                class="w-3.5 h-3.5"
                              />
                              {{ config.label }}
                            </button>
                          </template>
                        </div>
                      </div>

                      <button
                        v-if="permission.canEditConsumable"
                        class="p-1.5 text-gray-500 hover:bg-gray-100 rounded transition-colors"
                        title="编辑"
                        @click="openEditModal(item.id)"
                      >
                        <Edit2 class="w-4 h-4" />
                      </button>
                      <button
                        v-if="permission.canDeleteConsumable"
                        class="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                        title="删除"
                        @click="handleDelete(item.id)"
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
              <PackageOpen class="w-8 h-8 text-gray-300" />
            </div>
            <p class="text-gray-400">
              暂无耗材数据
            </p>
          </div>

          <div
            v-if="data && data.total > 0"
            class="px-6 mt-6 pt-4 border-t border-gray-100 flex items-center justify-between -mx-6"
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

      <div v-else-if="activeTab === 'operations'" class="p-6">
        <div class="flex flex-wrap items-end gap-4 mb-6">
          <div class="flex-1 min-w-[180px]">
            <label class="block text-xs font-medium text-gray-500 mb-1.5">耗材名称/厂家</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search class="w-4 h-4 text-gray-400" />
              </div>
              <input
                v-model="operationSearchForm.keyword"
                type="text"
                placeholder="搜索耗材名称..."
                class="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                @keyup.enter="handleOperationSearch"
              >
            </div>
          </div>

          <div class="min-w-[140px]">
            <label class="block text-xs font-medium text-gray-500 mb-1.5">分类</label>
            <select
              v-model="operationSearchForm.category"
              class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-white"
            >
              <option value="">全部分类</option>
              <option v-for="cat in consumableCategories" :key="cat" :value="cat">
                {{ cat }}
              </option>
            </select>
          </div>

          <div class="min-w-[140px]">
            <label class="block text-xs font-medium text-gray-500 mb-1.5">操作类型</label>
            <select
              v-model="operationSearchForm.operationType"
              class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-white"
            >
              <option value="">全部类型</option>
              <option v-for="config in operationTypeConfigs" :key="config.type" :value="config.type">
                {{ config.label }}
              </option>
            </select>
          </div>

          <div class="min-w-[140px]">
            <label class="block text-xs font-medium text-gray-500 mb-1.5">操作人</label>
            <input
              v-model="operationSearchForm.operator"
              type="text"
              placeholder="输入操作人姓名"
              class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
            >
          </div>

          <div class="min-w-[150px]">
            <label class="block text-xs font-medium text-gray-500 mb-1.5">开始日期</label>
            <input
              v-model="operationSearchForm.startTime"
              type="date"
              class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
            >
          </div>

          <div class="min-w-[150px]">
            <label class="block text-xs font-medium text-gray-500 mb-1.5">结束日期</label>
            <input
              v-model="operationSearchForm.endTime"
              type="date"
              class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
            >
          </div>

          <button
            class="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
            @click="handleOperationSearch"
          >
            搜索
          </button>

          <button
            class="px-5 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-lg transition-colors"
            @click="handleOperationReset"
          >
            重置
          </button>
        </div>

        <div v-if="operationsLoading" class="p-16 flex items-center justify-center">
          <div class="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
        </div>

        <div v-else>
          <div class="overflow-x-auto -mx-6">
            <table class="w-full">
              <thead class="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">耗材名称</th>
                  <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作类型</th>
                  <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">数量</th>
                  <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">库存变动</th>
                  <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">用途/原因</th>
                  <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作人</th>
                  <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作时间</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr
                  v-for="op in operationsData?.list"
                  :key="op.id"
                  class="hover:bg-gray-50 transition-colors cursor-pointer"
                  @click="goToDetail(op.consumableId)"
                >
                  <td class="px-6 py-4">
                    <div class="font-medium text-gray-900">{{ op.consumableName }}</div>
                  </td>
                  <td class="px-6 py-4">
                    <span
                      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                      :class="operationTypeColors[op.type]"
                    >
                      {{ operationTypeLabels[op.type] }}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-sm font-medium text-gray-800">
                    {{ op.quantity }}
                  </td>
                  <td class="px-6 py-4 text-sm">
                    <span class="text-gray-500">{{ op.beforeQuantity }}</span>
                    <span class="mx-1 text-gray-300">→</span>
                    <span class="font-medium text-gray-800">{{ op.afterQuantity }}</span>
                  </td>
                  <td class="px-6 py-4 text-sm text-gray-600 max-w-[200px] truncate">
                    {{ op.purpose || op.reason || '-' }}
                  </td>
                  <td class="px-6 py-4 text-sm text-gray-600">{{ op.operatorName }}</td>
                  <td class="px-6 py-4">
                    <div class="flex items-center gap-1 text-sm text-gray-500">
                      <Calendar class="w-3.5 h-3.5" />
                      {{ formatDate(op.createdAt, 'YYYY-MM-DD HH:mm') }}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div
            v-if="operationsData?.list.length === 0"
            class="p-16 text-center"
          >
            <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <History class="w-8 h-8 text-gray-300" />
            </div>
            <p class="text-gray-400">暂无出入库流水记录</p>
          </div>

          <div
            v-if="operationsData && operationsData.total > 0"
            class="px-6 mt-6 pt-4 border-t border-gray-100 flex items-center justify-between -mx-6"
          >
            <div class="text-sm text-gray-500">
              共 {{ operationsData.total }} 条记录，第 {{ operationPagination.page }} / {{ totalOperationPages }} 页
            </div>
            <div class="flex items-center gap-2">
              <button
                :disabled="operationPagination.page <= 1"
                class="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                @click="handleOperationPageChange(operationPagination.page - 1)"
              >
                <ChevronLeft class="w-4 h-4" />
              </button>
              <button
                v-for="p in Math.min(5, totalOperationPages)"
                :key="p"
                class="min-w-9 h-9 px-3 rounded-lg text-sm transition-colors"
                :class="[
                  operationPagination.page === p + Math.max(0, operationPagination.page - 3)
                    ? 'bg-primary-600 text-white'
                    : 'border border-gray-200 hover:bg-gray-50 text-gray-600',
                ]"
                @click="handleOperationPageChange(p + Math.max(0, operationPagination.page - 3))"
              >
                {{ p + Math.max(0, operationPagination.page - 3) }}
              </button>
              <button
                :disabled="operationPagination.page >= totalOperationPages"
                class="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                @click="handleOperationPageChange(operationPagination.page + 1)"
              >
                <ChevronRight class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="showFormModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      @click.self="showFormModal = false"
    >
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden">
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 class="text-lg font-semibold text-gray-800">
            {{ formMode === 'create' ? '新增耗材' : '编辑耗材' }}
          </h3>
          <button
            class="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            @click="showFormModal = false"
          >
            <X class="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div class="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">
                耗材名称 <span class="text-red-500">*</span>
              </label>
              <input
                v-model="formData.name"
                type="text"
                class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                placeholder="请输入耗材名称"
              >
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">
                  分类 <span class="text-red-500">*</span>
                </label>
                <select
                  v-model="formData.category"
                  class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-white"
                >
                  <option value="">请选择分类</option>
                  <option v-for="cat in consumableCategories" :key="cat" :value="cat">
                    {{ cat }}
                  </option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">规格</label>
                <input
                  v-model="formData.specification"
                  type="text"
                  class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                  placeholder="如：500个/包"
                >
              </div>
            </div>

            <div class="grid grid-cols-3 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">单位</label>
                <input
                  v-model="formData.unit"
                  type="text"
                  class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                  placeholder="如：包、盒"
                >
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">当前库存</label>
                <input
                  v-model.number="formData.stockQuantity"
                  type="number"
                  min="0"
                  class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                >
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">安全库存</label>
                <input
                  v-model.number="formData.safetyStock"
                  type="number"
                  min="0"
                  class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                >
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">生产厂家</label>
                <input
                  v-model="formData.manufacturer"
                  type="text"
                  class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                  placeholder="请输入生产厂家"
                >
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">存放位置</label>
                <input
                  v-model="formData.location"
                  type="text"
                  class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                  placeholder="如：耗材柜A-01"
                >
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">描述</label>
              <textarea
                v-model="formData.description"
                rows="3"
                class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all resize-none"
                placeholder="请输入耗材描述"
              />
            </div>
          </div>
        </div>

        <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
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
            <span
              v-if="formLoading"
              class="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"
            />
            {{ formMode === 'create' ? '创建' : '保存' }}
          </button>
        </div>
      </div>
    </div>

    <ConsumableOperationModal
      v-model:visible="operationModalVisible"
      :consumable="currentOperationConsumable"
      :operation-type="currentOperationType"
      @success="handleOperationSuccess"
    />
  </div>
</template>
