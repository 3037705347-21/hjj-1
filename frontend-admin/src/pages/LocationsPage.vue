<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  X,
  MapPin,
  Warehouse,
  Flame,
  Thermometer,
  ArrowLeftRight,
  ToggleLeft,
  ToggleRight,
  ChevronDown,
  ChevronRight as ChevronRightIcon,
  Package,
  TestTube,
  Boxes,
  FolderTree,
  BarChart3,
} from 'lucide-vue-next'
import DataTableFilter from '@/components/DataTableFilter.vue'
import type { FilterField } from '@/components/DataTableFilter.vue'
import { useSavedFilters } from '@/composables/useSavedFilters'
import {
  mockGetLocations,
  mockGetAllLocations,
  mockCreateLocation,
  mockUpdateLocation,
  mockDeleteLocation,
  mockGetLocationOccupancy,
  mockLocationTransfer,
  mockGetLocationStats,
  mockBatchDeleteLocations,
  mockBatchUpdateLocationStatus,
  buildLocationTree,
  getLocationPath,
  mockGetLocationDistribution,
  mockGetLocationDistributionStats,
} from '@/mock/locations'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import BatchOperationBar from '@/components/BatchOperationBar.vue'
import LocationSelector from '@/components/LocationSelector.vue'
import LocationTreeNodeComp from '@/components/LocationTreeNodeComp.vue'
import type {
  StorageLocation,
  LocationFormData,
  LocationLevel,
  TemperatureZone,
  LocationStatus,
  LocationTreeNode,
  LocationOccupancyItem,
  LocationFilterParams,
  LocationStats,
  LocationDistributionItem,
  LocationDistributionStats,
} from '@/types/location'
import {
  locationLevelLabels,
  locationLevelColors,
  temperatureZoneLabels,
  temperatureZoneColors,
  locationStatusLabels,
  locationStatusColors,
  locationLevelOptions,
  temperatureZoneOptions,
} from '@/types/location'
import type { PageResult } from '@/types/common'
import { usePermission } from '@/composables/usePermission'

const router = useRouter()
const permission = usePermission()

const activeTab = ref<'tree' | 'list' | 'distribution'>('tree')
const loading = ref(false)
const data = ref<PageResult<StorageLocation> | null>(null)
const stats = ref<LocationStats | null>(null)
const allLocations = ref<StorageLocation[]>([])
const treeData = ref<LocationTreeNode[]>([])

const distributionData = ref<LocationDistributionItem[]>([])
const distributionStats = ref<LocationDistributionStats | null>(null)
const distributionLoading = ref(false)

const distributionFilters = ref<Record<string, any>>({
  level: '',
  temperatureZone: '',
  isHazardous: '',
  status: '',
})

const filteredDistributionData = computed(() => {
  let items = distributionData.value
  if (distributionFilters.value.level) {
    items = items.filter(i => i.level === distributionFilters.value.level)
  }
  if (distributionFilters.value.temperatureZone) {
    items = items.filter(i => i.temperatureZone === distributionFilters.value.temperatureZone)
  }
  if (distributionFilters.value.isHazardous !== '' && distributionFilters.value.isHazardous !== undefined) {
    items = items.filter(i => i.isHazardous === (distributionFilters.value.isHazardous === 'true'))
  }
  if (distributionFilters.value.status) {
    items = items.filter(i => i.status === distributionFilters.value.status)
  }
  return items
})

const filters = ref<Record<string, any>>({
  keyword: '',
  level: '',
  temperatureZone: '',
  isHazardous: '',
  status: '',
})

const { savedFilters, addFilter, deleteFilter, loadFilters } = useSavedFilters('location_saved_filters')

const handleSaveFilter = (name: string) => {
  addFilter(name, filters.value)
}

const filterFields: FilterField[] = [
  { key: 'level', label: '层级', type: 'select', options: locationLevelOptions.map(o => ({ label: o.label, value: o.value })) },
  { key: 'temperatureZone', label: '温区', type: 'select', options: temperatureZoneOptions.map(o => ({ label: o.label, value: o.value })) },
  { key: 'isHazardous', label: '危险品', type: 'select', options: [
    { label: '是', value: 'true' },
    { label: '否', value: 'false' },
  ]},
  { key: 'status', label: '状态', type: 'select', options: [
    { label: '启用', value: 'enabled' },
    { label: '停用', value: 'disabled' },
  ]},
]

const pagination = reactive({
  page: 1,
  pageSize: 20,
})

const showFormModal = ref(false)
const formMode = ref<'create' | 'edit'>('create')
const currentId = ref('')
const formLoading = ref(false)
const formData = reactive<LocationFormData>({
  code: '',
  name: '',
  level: 'warehouse',
  parentId: null,
  temperatureZone: 'ambient',
  isHazardous: false,
  capacityLimit: 10,
  status: 'enabled',
  description: '',
  sortOrder: 0,
})

const selectedIds = ref<string[]>([])
const showDeleteConfirm = ref(false)
const deletingLoading = ref(false)

const showOccupancyModal = ref(false)
const occupancyLocationName = ref('')
const occupancyItems = ref<LocationOccupancyItem[]>([])
const occupancyLoading = ref(false)

const showTransferModal = ref(false)
const transferLoading = ref(false)
const transferData = reactive({
  sourceLocationId: '',
  sourceLocationName: '',
  targetLocationId: '',
  reason: '',
  selectedItems: [] as { itemType: 'batch' | 'consumable'; itemId: string; quantity: number }[],
})

const showTransferLocationSelector = ref(false)
const openTransferLocationSelector = () => {
  showTransferLocationSelector.value = true
}
const handleTransferLocationConfirm = (locId: string, location?: StorageLocation) => {
  if (locId !== transferData.sourceLocationId) {
    transferData.targetLocationId = locId
  } else {
    alert('目标库位不能与源库位相同')
  }
  showTransferLocationSelector.value = false
}
const getTargetLocationDisplay = (): string => {
  if (!transferData.targetLocationId) return ''
  return getLocationPath(allLocations.value, transferData.targetLocationId)
}

const canCreate = computed(() => permission.hasPermission('location:create'))
const canEdit = computed(() => permission.hasPermission('location:edit'))
const canDelete = computed(() => permission.hasPermission('location:delete'))
const canTransfer = computed(() => permission.hasPermission('location:transfer'))
const canStatus = computed(() => permission.hasPermission('location:status'))

const parentOptions = computed(() => {
  const levelOrder: Record<LocationLevel, number> = { warehouse: 0, room: 1, cabinet: 2, shelf: 3, slot: 4 }
  const currentLevelIdx = levelOrder[formData.level]
  const parentLevel = (Object.entries(levelOrder) as [LocationLevel, number][]).find(([, v]) => v === currentLevelIdx - 1)?.[0]
  if (!parentLevel) return []
  return allLocations.value
    .filter(l => l.level === parentLevel && l.status === 'enabled')
    .map(l => ({ label: `${l.code} - ${l.name}`, value: l.id }))
})

const childLevelMap: Record<string, LocationLevel> = {
  warehouse: 'room',
  room: 'cabinet',
  cabinet: 'shelf',
  shelf: 'slot',
}

const treeExpandedIds = ref<Set<string>>(new Set())

const navigateToDetail = (id: string) => {
  router.push(`/locations/${id}`)
}

const handleTreeNodeToggle = (node: LocationTreeNode) => {
  if (treeExpandedIds.value.has(node.id)) treeExpandedIds.value.delete(node.id)
  else treeExpandedIds.value.add(node.id)
}

const handleTreeNodeEdit = (id: string) => {
  const loc = allLocations.value.find(l => l.id === id)
  if (loc) openEditForm(loc)
}

const handleTreeNodeDelete = (id: string) => {
  handleDelete(id)
}

const handleTreeNodeCreateChild = (level: LocationLevel, parentId: string) => {
  openCreateForm(level, parentId)
}

const handleTreeNodeViewOccupancy = (id: string, name: string) => {
  handleViewOccupancy(id, name)
}

const handleTreeNodeTransfer = (id: string, name: string) => {
  handleTransfer(id, name)
}

const handleTreeNodeNavigate = (id: string) => {
  navigateToDetail(id)
}

const fetchData = async () => {
  loading.value = true
  try {
    const filterParams: LocationFilterParams = {}
    if (filters.value.keyword) filterParams.keyword = filters.value.keyword
    if (filters.value.level) filterParams.level = filters.value.level
    if (filters.value.temperatureZone) filterParams.temperatureZone = filters.value.temperatureZone
    if (filters.value.isHazardous !== '' && filters.value.isHazardous !== undefined) {
      filterParams.isHazardous = filters.value.isHazardous === 'true'
    }
    if (filters.value.status) filterParams.status = filters.value.status
    const result = await mockGetLocations(pagination.page, pagination.pageSize, filterParams)
    data.value = result
    selectedIds.value = []
  } finally {
    loading.value = false
  }
}

const fetchTree = async () => {
  const locs = await mockGetAllLocations()
  allLocations.value = locs
  treeData.value = buildLocationTree(locs)
}

const fetchStats = async () => {
  stats.value = await mockGetLocationStats()
}

const fetchDistribution = async () => {
  distributionLoading.value = true
  try {
    const [items, st] = await Promise.all([
      mockGetLocationDistribution(),
      mockGetLocationDistributionStats(),
    ])
    distributionData.value = items
    distributionStats.value = st
  } finally {
    distributionLoading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  fetchData()
  fetchTree()
}

const handleResetFilters = () => {
  filters.value = { keyword: '', level: '', temperatureZone: '', isHazardous: '', status: '' }
  handleSearch()
}

const handlePageChange = (page: number) => { pagination.page = page; fetchData() }
const handlePageSizeChange = (size: number) => { pagination.pageSize = size; pagination.page = 1; fetchData() }

const openCreateForm = (level?: LocationLevel, parentId?: string) => {
  formMode.value = 'create'
  currentId.value = ''
  formData.code = ''
  formData.name = ''
  formData.level = level || 'warehouse'
  formData.parentId = parentId || null
  formData.temperatureZone = 'ambient'
  formData.isHazardous = false
  formData.capacityLimit = 10
  formData.status = 'enabled'
  formData.description = ''
  formData.sortOrder = 0
  showFormModal.value = true
}

const openEditForm = (loc: StorageLocation) => {
  formMode.value = 'edit'
  currentId.value = loc.id
  formData.code = loc.code
  formData.name = loc.name
  formData.level = loc.level
  formData.parentId = loc.parentId
  formData.temperatureZone = loc.temperatureZone
  formData.isHazardous = loc.isHazardous
  formData.capacityLimit = loc.capacityLimit
  formData.status = loc.status
  formData.description = loc.description || ''
  formData.sortOrder = loc.sortOrder
  showFormModal.value = true
}

const handleFormSubmit = async () => {
  if (!formData.code.trim() || !formData.name.trim()) return
  formLoading.value = true
  try {
    if (formMode.value === 'create') {
      await mockCreateLocation({ ...formData })
    } else {
      await mockUpdateLocation(currentId.value, { ...formData })
    }
    showFormModal.value = false
    await Promise.all([fetchData(), fetchTree(), fetchStats()])
  } catch (e: any) {
    alert(e.message || '操作失败')
  } finally {
    formLoading.value = false
  }
}

const handleDelete = async (id: string) => {
  currentId.value = id
  selectedIds.value = []
  showDeleteConfirm.value = true
}

const confirmDelete = async () => {
  deletingLoading.value = true
  try {
    await mockDeleteLocation(currentId.value)
    showDeleteConfirm.value = false
    await Promise.all([fetchData(), fetchTree(), fetchStats()])
  } catch (e: any) {
    alert(e.message || '删除失败')
  } finally {
    deletingLoading.value = false
  }
}

const handleBatchDelete = async () => {
  if (selectedIds.value.length === 0) return
  showDeleteConfirm.value = true
}

const confirmBatchDelete = async () => {
  deletingLoading.value = true
  try {
    await mockBatchDeleteLocations(selectedIds.value)
    showDeleteConfirm.value = false
    selectedIds.value = []
    await Promise.all([fetchData(), fetchTree(), fetchStats()])
  } catch (e: any) {
    alert(e.message || '批量删除失败')
  } finally {
    deletingLoading.value = false
  }
}

const handleBatchStatus = async (status: LocationStatus) => {
  if (selectedIds.value.length === 0) return
  try {
    await mockBatchUpdateLocationStatus(selectedIds.value, status)
    selectedIds.value = []
    await Promise.all([fetchData(), fetchTree(), fetchStats()])
  } catch (e: any) {
    alert(e.message || '操作失败')
  }
}

const batchActions = computed(() => [
  { key: 'enable', label: '批量启用', icon: ToggleRight, type: 'default' as const, permission: canStatus.value },
  { key: 'disable', label: '批量停用', icon: ToggleLeft, type: 'default' as const, permission: canStatus.value },
  { key: 'delete', label: '批量删除', icon: Trash2, type: 'danger' as const, permission: canDelete.value },
])

const handleBatchAction = (key: string) => {
  if (key === 'enable') handleBatchStatus('enabled')
  else if (key === 'disable') handleBatchStatus('disabled')
  else if (key === 'delete') handleBatchDelete()
}

const handleViewOccupancy = async (id: string, name: string) => {
  occupancyLocationName.value = name
  showOccupancyModal.value = true
  occupancyLoading.value = true
  try {
    occupancyItems.value = await mockGetLocationOccupancy(id)
  } finally {
    occupancyLoading.value = false
  }
}

const handleTransfer = async (id: string, name: string) => {
  transferData.sourceLocationId = id
  transferData.sourceLocationName = name
  transferData.targetLocationId = ''
  transferData.reason = ''
  transferData.selectedItems = []
  occupancyLoading.value = true
  try {
    const items = await mockGetLocationOccupancy(id)
    transferData.selectedItems = items.map(item => ({
      itemType: item.itemType,
      itemId: item.itemId,
      quantity: item.quantity,
    }))
  } finally {
    occupancyLoading.value = false
  }
  showTransferModal.value = true
}

const confirmTransfer = async () => {
  if (!transferData.targetLocationId) { alert('请选择目标库位'); return }
  if (transferData.selectedItems.length === 0) { alert('没有可调拨的物品'); return }
  transferLoading.value = true
  try {
    await mockLocationTransfer({
      sourceLocationId: transferData.sourceLocationId,
      targetLocationId: transferData.targetLocationId,
      items: transferData.selectedItems,
      reason: transferData.reason,
    })
    showTransferModal.value = false
    await Promise.all([fetchData(), fetchTree(), fetchStats()])
  } catch (e: any) {
    alert(e.message || '调拨失败')
  } finally {
    transferLoading.value = false
  }
}

const toggleSelection = (id: string) => {
  const idx = selectedIds.value.indexOf(id)
  if (idx >= 0) selectedIds.value.splice(idx, 1)
  else selectedIds.value.push(id)
}

const toggleSelectAll = () => {
  if (!data.value) return
  if (selectedIds.value.length === data.value.list.length) selectedIds.value = []
  else selectedIds.value = data.value.list.map(l => l.id)
}

const isAllSelected = computed(() => {
  if (!data.value || data.value.list.length === 0) return false
  return data.value.list.every(l => selectedIds.value.includes(l.id))
})

const expandAll = () => {
  const ids = new Set<string>()
  const collect = (nodes: LocationTreeNode[]) => {
    for (const n of nodes) {
      if (n.children.length > 0) { ids.add(n.id); collect(n.children) }
    }
  }
  collect(treeData.value)
  treeExpandedIds.value = ids
}

const collapseAll = () => { treeExpandedIds.value = new Set() }

const transferTargetOptions = computed(() => {
  return allLocations.value
    .filter(l => l.id !== transferData.sourceLocationId && l.status === 'enabled' && (l.level === 'slot' || l.level === 'shelf'))
    .map(l => ({ label: `${l.code} - ${l.name}`, value: l.id }))
})

const getLocationFullPath = (loc: StorageLocation): string => getLocationPath(allLocations.value, loc.id)

const occupancyRate = (current: number, capacity: number): number => {
  if (capacity <= 0) return 0
  return Math.min(100, Math.round((current / capacity) * 100))
}

const occupancyBarColor = (rate: number): string => {
  if (rate >= 90) return 'bg-danger-500'
  if (rate >= 70) return 'bg-warning-500'
  return 'bg-success-500'
}

onMounted(async () => {
  await Promise.all([fetchData(), fetchTree(), fetchStats(), fetchDistribution()])
  expandAll()
  loadFilters()
})
</script>

<template>
  <div class="p-6 space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">库位管理</h1>
        <p class="mt-1 text-sm text-gray-500">管理仓库、房间、柜体、层架、格位五级库位结构</p>
      </div>
      <button
        v-if="canCreate"
        class="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors shadow-sm"
        @click="openCreateForm()"
      >
        <Plus class="w-4 h-4" />
        新增库位
      </button>
    </div>

    <div v-if="stats" class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div class="flex items-center gap-2 text-gray-500 text-xs mb-1"><Boxes class="w-3.5 h-3.5" />总库位</div>
        <div class="text-2xl font-bold text-gray-900">{{ stats.total }}</div>
      </div>
      <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div class="flex items-center gap-2 text-success-600 text-xs mb-1"><ToggleRight class="w-3.5 h-3.5" />已启用</div>
        <div class="text-2xl font-bold text-success-600">{{ stats.enabled }}</div>
      </div>
      <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div class="flex items-center gap-2 text-gray-400 text-xs mb-1"><ToggleLeft class="w-3.5 h-3.5" />已停用</div>
        <div class="text-2xl font-bold text-gray-400">{{ stats.disabled }}</div>
      </div>
      <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div class="flex items-center gap-2 text-danger-500 text-xs mb-1"><Flame class="w-3.5 h-3.5" />危险品库位</div>
        <div class="text-2xl font-bold text-danger-500">{{ stats.hazardous }}</div>
      </div>
      <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div class="flex items-center gap-2 text-primary-600 text-xs mb-1"><Warehouse class="w-3.5 h-3.5" />仓库/房间</div>
        <div class="text-2xl font-bold text-primary-600">{{ stats.byLevel.warehouse + stats.byLevel.room }}</div>
      </div>
      <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div class="flex items-center gap-2 text-info-600 text-xs mb-1"><BarChart3 class="w-3.5 h-3.5" />占用率</div>
        <div class="text-2xl font-bold text-info-600">{{ stats.occupancyRate }}%</div>
      </div>
    </div>

    <div class="flex gap-2 border-b border-gray-200">
      <button
        class="px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px"
        :class="activeTab === 'tree' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'"
        @click="activeTab = 'tree'"
      >
        <span class="flex items-center gap-1.5"><FolderTree class="w-4 h-4" />树形视图</span>
      </button>
      <button
        class="px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px"
        :class="activeTab === 'list' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'"
        @click="activeTab = 'list'"
      >
        <span class="flex items-center gap-1.5"><Boxes class="w-4 h-4" />列表视图</span>
      </button>
      <button
        class="px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px"
        :class="activeTab === 'distribution' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'"
        @click="activeTab = 'distribution'"
      >
        <span class="flex items-center gap-1.5"><BarChart3 class="w-4 h-4" />库存分布</span>
      </button>
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-gray-100">
      <div class="p-4 border-b border-gray-100 space-y-4">
        <div class="flex items-center gap-3">
          <div class="relative flex-1 max-w-md">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input v-model="filters.keyword" type="text" placeholder="搜索库位编码、名称..."
              class="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              @keyup.enter="handleSearch" />
          </div>
          <button class="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm rounded-lg transition-colors" @click="handleSearch">搜索</button>
          <button class="px-4 py-2 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition-colors" @click="handleResetFilters">重置</button>
        </div>
        <DataTableFilter :filter-fields="filterFields" :model-value="filters" :saved-filters="savedFilters"
          @update:model-value="f => { filters = f; handleSearch() }" @save-filter="handleSaveFilter" @delete-filter="deleteFilter" />
      </div>

      <div v-if="activeTab === 'tree'">
        <div class="p-4 flex items-center gap-2 border-b border-gray-100">
          <button class="px-3 py-1.5 text-xs text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors" @click="expandAll">全部展开</button>
          <button class="px-3 py-1.5 text-xs text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors" @click="collapseAll">全部折叠</button>
        </div>
        <div class="p-4">
          <div v-if="treeData.length === 0" class="text-center py-12 text-gray-400">
            <MapPin class="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>暂无库位数据</p>
          </div>
          <div v-else class="space-y-0.5">
            <LocationTreeNodeComp
              v-for="node in treeData"
              :key="node.id"
              :node="node"
              :depth="0"
              :expanded-ids="treeExpandedIds"
              :selected-ids="selectedIds"
              :can-edit="canEdit"
              :can-delete="canDelete"
              :can-create="canCreate"
              :can-transfer="canTransfer"
              :child-level-map="childLevelMap"
              @toggle="handleTreeNodeToggle"
              @view-occupancy="handleTreeNodeViewOccupancy"
              @transfer="handleTreeNodeTransfer"
              @create-child="handleTreeNodeCreateChild"
              @edit="handleTreeNodeEdit"
              @delete="handleTreeNodeDelete"
              @navigate="handleTreeNodeNavigate"
            />
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'list'">
        <BatchOperationBar v-if="selectedIds.length > 0" :selected-count="selectedIds.length" :actions="batchActions" @action="handleBatchAction" />
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="bg-gray-50 border-b border-gray-100">
                <th class="px-4 py-3 text-left"><input type="checkbox" :checked="isAllSelected" class="w-4 h-4 text-primary-600 rounded border-gray-300" @change="toggleSelectAll" /></th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">编码</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">名称</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">层级</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">上级路径</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">温区</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">危险品</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">容量</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">操作</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              <tr v-for="loc in data?.list || []" :key="loc.id" class="hover:bg-gray-50/50 transition-colors cursor-pointer" :class="{ 'bg-primary-50/30': selectedIds.includes(loc.id) }" @click="navigateToDetail(loc.id)">
                <td class="px-4 py-3" @click.stop><input type="checkbox" :checked="selectedIds.includes(loc.id)" class="w-4 h-4 text-primary-600 rounded border-gray-300" @change="toggleSelection(loc.id)" /></td>
                <td class="px-4 py-3 text-sm font-mono text-gray-900">{{ loc.code }}</td>
                <td class="px-4 py-3 text-sm text-gray-900">{{ loc.name }}</td>
                <td class="px-4 py-3"><span class="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium" :class="locationLevelColors[loc.level]">{{ locationLevelLabels[loc.level] }}</span></td>
                <td class="px-4 py-3 text-xs text-gray-500 max-w-[200px] truncate">{{ loc.parentId ? getLocationFullPath(loc) : '-' }}</td>
                <td class="px-4 py-3"><span class="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium" :class="temperatureZoneColors[loc.temperatureZone]">{{ temperatureZoneLabels[loc.temperatureZone] }}</span></td>
                <td class="px-4 py-3">
                  <span v-if="loc.isHazardous" class="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-danger-100 text-danger-700"><Flame class="w-3 h-3 mr-0.5" />是</span>
                  <span v-else class="text-xs text-gray-400">否</span>
                </td>
                <td class="px-4 py-3">
                  <div class="flex items-center gap-2">
                    <span class="text-xs text-gray-600">{{ loc.currentOccupancy }}/{{ loc.capacityLimit }}</span>
                    <div class="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div class="h-full rounded-full transition-all" :class="occupancyBarColor(occupancyRate(loc.currentOccupancy, loc.capacityLimit))" :style="{ width: occupancyRate(loc.currentOccupancy, loc.capacityLimit) + '%' }" />
                    </div>
                  </div>
                </td>
                <td class="px-4 py-3"><span class="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium" :class="locationStatusColors[loc.status]">{{ locationStatusLabels[loc.status] }}</span></td>
                <td class="px-4 py-3" @click.stop>
                  <div class="flex items-center justify-end gap-1">
                    <button class="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors" title="查看占用" @click="handleViewOccupancy(loc.id, loc.name)"><Eye class="w-4 h-4" /></button>
                    <button v-if="canTransfer && loc.currentOccupancy > 0" class="p-1.5 text-gray-400 hover:text-info-600 hover:bg-info-50 rounded transition-colors" title="调拨" @click="handleTransfer(loc.id, loc.name)"><ArrowLeftRight class="w-4 h-4" /></button>
                    <button v-if="canEdit" class="p-1.5 text-gray-400 hover:text-warning-600 hover:bg-warning-50 rounded transition-colors" title="编辑" @click="openEditForm(loc)"><Edit2 class="w-4 h-4" /></button>
                    <button v-if="canDelete" class="p-1.5 text-gray-400 hover:text-danger-600 hover:bg-danger-50 rounded transition-colors" title="删除" @click="handleDelete(loc.id)"><Trash2 class="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-if="data && data.total > 0" class="flex items-center justify-between px-4 py-3 border-t border-gray-100">
          <div class="text-sm text-gray-500">共 {{ data.total }} 条记录</div>
          <div class="flex items-center gap-2">
            <select v-model="pagination.pageSize" class="px-2 py-1 border border-gray-200 rounded text-sm" @change="handlePageSizeChange(pagination.pageSize)">
              <option :value="10">10条/页</option>
              <option :value="20">20条/页</option>
              <option :value="50">50条/页</option>
            </select>
            <button :disabled="pagination.page <= 1" class="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed" @click="handlePageChange(pagination.page - 1)"><ChevronLeft class="w-4 h-4" /></button>
            <span class="text-sm text-gray-600">{{ pagination.page }} / {{ Math.ceil(data.total / pagination.pageSize) || 1 }}</span>
            <button :disabled="pagination.page >= Math.ceil(data.total / pagination.pageSize)" class="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed" @click="handlePageChange(pagination.page + 1)"><ChevronRight class="w-4 h-4" /></button>
          </div>
        </div>
        <div v-if="!data || data.list.length === 0" class="py-12 text-center text-gray-400">
          <MapPin class="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>暂无库位数据</p>
        </div>
      </div>

      <div v-if="activeTab === 'distribution'">
        <div v-if="distributionStats" class="p-4 border-b border-gray-100">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="bg-primary-50 rounded-lg p-3">
              <div class="flex items-center gap-2 text-primary-600 text-xs mb-1"><Package class="w-3.5 h-3.5" />总批次数</div>
              <div class="text-2xl font-bold text-primary-700">{{ distributionStats.totalBatches }}</div>
            </div>
            <div class="bg-success-50 rounded-lg p-3">
              <div class="flex items-center gap-2 text-success-600 text-xs mb-1"><TestTube class="w-3.5 h-3.5" />总耗材数</div>
              <div class="text-2xl font-bold text-success-700">{{ distributionStats.totalConsumables }}</div>
            </div>
            <div class="bg-info-50 rounded-lg p-3">
              <div class="flex items-center gap-2 text-info-600 text-xs mb-1"><Boxes class="w-3.5 h-3.5" />总物品数</div>
              <div class="text-2xl font-bold text-info-700">{{ distributionStats.totalItems }}</div>
            </div>
            <div class="bg-danger-50 rounded-lg p-3">
              <div class="flex items-center gap-2 text-danger-600 text-xs mb-1"><Flame class="w-3.5 h-3.5" />危险品库位</div>
              <div class="text-2xl font-bold text-danger-700">{{ distributionStats.hazardousCount }}</div>
            </div>
          </div>
        </div>
        <div class="p-4 border-b border-gray-100">
          <div class="flex items-center gap-3 flex-wrap">
            <select v-model="distributionFilters.level" class="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="">全部层级</option>
              <option v-for="opt in locationLevelOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
            <select v-model="distributionFilters.temperatureZone" class="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="">全部温区</option>
              <option v-for="opt in temperatureZoneOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
            <select v-model="distributionFilters.isHazardous" class="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="">是否危险品</option>
              <option value="true">是</option>
              <option value="false">否</option>
            </select>
            <select v-model="distributionFilters.status" class="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="">全部状态</option>
              <option value="enabled">启用</option>
              <option value="disabled">停用</option>
            </select>
          </div>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="bg-gray-50 border-b border-gray-100">
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">编码</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">名称</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">层级</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">温区</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">危险品</th>
                <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">批次数</th>
                <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">耗材数</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">占用率</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              <tr v-for="item in filteredDistributionData" :key="item.locationId" class="hover:bg-gray-50/50 transition-colors cursor-pointer" @click="navigateToDetail(item.locationId)">
                <td class="px-4 py-3 text-sm font-mono text-gray-900">{{ item.locationCode }}</td>
                <td class="px-4 py-3 text-sm text-gray-900">{{ item.locationName }}</td>
                <td class="px-4 py-3"><span class="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium" :class="locationLevelColors[item.level]">{{ locationLevelLabels[item.level] }}</span></td>
                <td class="px-4 py-3"><span class="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium" :class="temperatureZoneColors[item.temperatureZone]">{{ temperatureZoneLabels[item.temperatureZone] }}</span></td>
                <td class="px-4 py-3">
                  <span v-if="item.isHazardous" class="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-danger-100 text-danger-700"><Flame class="w-3 h-3 mr-0.5" />是</span>
                  <span v-else class="text-xs text-gray-400">否</span>
                </td>
                <td class="px-4 py-3 text-sm text-right font-medium text-primary-600">{{ item.batchCount }}</td>
                <td class="px-4 py-3 text-sm text-right font-medium text-success-600">{{ item.consumableCount }}</td>
                <td class="px-4 py-3">
                  <div class="flex items-center gap-2">
                    <div class="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div class="h-full rounded-full transition-all" :class="occupancyBarColor(occupancyRate(item.currentOccupancy, item.capacityLimit))" :style="{ width: occupancyRate(item.currentOccupancy, item.capacityLimit) + '%' }" />
                    </div>
                    <span class="text-xs text-gray-500">{{ occupancyRate(item.currentOccupancy, item.capacityLimit) }}%</span>
                  </div>
                </td>
                <td class="px-4 py-3"><span class="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium" :class="locationStatusColors[item.status]">{{ locationStatusLabels[item.status] }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-if="filteredDistributionData.length === 0 && !distributionLoading" class="py-12 text-center text-gray-400">
          <MapPin class="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>暂无分布数据</p>
        </div>
      </div>
    </div>

    <div v-if="showFormModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" @click.self="showFormModal = false">
      <div class="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between p-6 border-b border-gray-100">
          <h3 class="text-lg font-semibold text-gray-900">{{ formMode === 'create' ? '新增库位' : '编辑库位' }}</h3>
          <button class="p-1.5 hover:bg-gray-100 rounded-lg transition-colors" @click="showFormModal = false"><X class="w-5 h-5 text-gray-400" /></button>
        </div>
        <div class="p-6 space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">库位编码 <span class="text-danger-500">*</span></label>
              <input v-model="formData.code" type="text" placeholder="如 WH-A-R01-C01" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">库位名称 <span class="text-danger-500">*</span></label>
              <input v-model="formData.name" type="text" placeholder="如 试剂柜A-01" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">层级</label>
              <select v-model="formData.level" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500" :disabled="formMode === 'edit'">
                <option v-for="opt in locationLevelOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">上级库位</label>
              <select v-model="formData.parentId" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500" :disabled="formMode === 'edit'">
                <option :value="null">无（顶级）</option>
                <option v-for="opt in parentOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
              </select>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">温区</label>
              <select v-model="formData.temperatureZone" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                <option v-for="opt in temperatureZoneOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">容量上限</label>
              <input v-model.number="formData.capacityLimit" type="number" min="1" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div class="flex items-center gap-2">
              <input v-model="formData.isHazardous" type="checkbox" class="w-4 h-4 text-primary-600 rounded border-gray-300" />
              <label class="text-sm font-medium text-gray-700">危险品库位</label>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">状态</label>
              <select v-model="formData.status" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                <option value="enabled">启用</option>
                <option value="disabled">停用</option>
              </select>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">排序号</label>
            <input v-model.number="formData.sortOrder" type="number" min="0" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">描述</label>
            <textarea v-model="formData.description" rows="2" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none" placeholder="可选描述信息" />
          </div>
        </div>
        <div class="flex justify-end gap-3 p-6 border-t border-gray-100">
          <button class="px-4 py-2 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition-colors" @click="showFormModal = false">取消</button>
          <button class="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm rounded-lg transition-colors disabled:opacity-50" :disabled="formLoading || !formData.code.trim() || !formData.name.trim()" @click="handleFormSubmit">{{ formLoading ? '保存中...' : '保存' }}</button>
        </div>
      </div>
    </div>

    <div v-if="showOccupancyModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" @click.self="showOccupancyModal = false">
      <div class="bg-white rounded-xl shadow-2xl w-full max-w-3xl mx-4 max-h-[80vh] flex flex-col">
        <div class="flex items-center justify-between p-6 border-b border-gray-100">
          <h3 class="text-lg font-semibold text-gray-900">库位占用详情 - {{ occupancyLocationName }}</h3>
          <button class="p-1.5 hover:bg-gray-100 rounded-lg transition-colors" @click="showOccupancyModal = false"><X class="w-5 h-5 text-gray-400" /></button>
        </div>
        <div class="p-6 overflow-y-auto flex-1">
          <div v-if="occupancyLoading" class="text-center py-8 text-gray-400">加载中...</div>
          <div v-else-if="occupancyItems.length === 0" class="text-center py-8 text-gray-400">
            <Package class="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p>该库位下暂无库存</p>
          </div>
          <table v-else class="w-full">
            <thead>
              <tr class="bg-gray-50">
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-500">类型</th>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-500">名称</th>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-500">批次号</th>
                <th class="px-3 py-2 text-right text-xs font-medium text-gray-500">数量</th>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-500">单位</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              <tr v-for="item in occupancyItems" :key="item.id" class="hover:bg-gray-50/50">
                <td class="px-3 py-2">
                  <span class="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium" :class="item.itemType === 'batch' ? 'bg-primary-100 text-primary-700' : 'bg-success-100 text-success-700'">
                    {{ item.itemType === 'batch' ? '批次' : '耗材' }}
                  </span>
                </td>
                <td class="px-3 py-2 text-sm text-gray-900">{{ item.itemName }}</td>
                <td class="px-3 py-2 text-sm text-gray-600">{{ item.batchNumber || '-' }}</td>
                <td class="px-3 py-2 text-sm text-right font-medium text-gray-900">{{ item.quantity }}</td>
                <td class="px-3 py-2 text-sm text-gray-500">{{ item.unit }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="flex justify-end p-4 border-t border-gray-100">
          <button class="px-4 py-2 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition-colors" @click="showOccupancyModal = false">关闭</button>
        </div>
      </div>
    </div>

    <div v-if="showTransferModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" @click.self="showTransferModal = false">
      <div class="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto">
        <div class="flex items-center justify-between p-6 border-b border-gray-100">
          <h3 class="text-lg font-semibold text-gray-900">库位调拨</h3>
          <button class="p-1.5 hover:bg-gray-100 rounded-lg transition-colors" @click="showTransferModal = false"><X class="w-5 h-5 text-gray-400" /></button>
        </div>
        <div class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">源库位</label>
            <input type="text" :value="transferData.sourceLocationName" disabled class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">目标库位 <span class="text-danger-500">*</span></label>
            <div class="relative">
              <input
                :value="getTargetLocationDisplay()"
                type="text"
                disabled
                placeholder="请选择目标库位"
                class="w-full px-4 py-2 pr-24 border border-gray-200 rounded-lg text-sm bg-gray-50 cursor-not-allowed"
              >
              <button
                type="button"
                class="absolute right-1 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-primary-50 hover:bg-primary-100 text-primary-600 text-xs font-medium rounded-md transition-colors flex items-center gap-1"
                @click="openTransferLocationSelector"
              >
                <MapPin class="w-3 h-3" />
                选择库位
              </button>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">调拨物品数</label>
            <input type="text" :value="`${transferData.selectedItems.length} 项`" disabled class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">调拨原因</label>
            <textarea v-model="transferData.reason" rows="2" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none" placeholder="请填写调拨原因" />
          </div>
        </div>
        <div class="flex justify-end gap-3 p-6 border-t border-gray-100">
          <button class="px-4 py-2 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition-colors" @click="showTransferModal = false">取消</button>
          <button class="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm rounded-lg transition-colors disabled:opacity-50" :disabled="transferLoading || !transferData.targetLocationId" @click="confirmTransfer">{{ transferLoading ? '调拨中...' : '确认调拨' }}</button>
        </div>
      </div>
    </div>

    <ConfirmDialog
      v-model:visible="showDeleteConfirm"
      title="确认删除"
      :message="selectedIds.length > 0 ? `确定要删除选中的 ${selectedIds.length} 个库位吗？` : '确定要删除该库位吗？删除后不可恢复。'"
      confirm-text="删除"
      :loading="deletingLoading"
      @confirm="selectedIds.length > 0 ? confirmBatchDelete() : confirmDelete()"
    />

    <LocationSelector
      v-model:visible="showTransferLocationSelector"
      :model-value="transferData.targetLocationId"
      :only-enabled="true"
      @confirm="handleTransferLocationConfirm"
    />
  </div>
</template>
