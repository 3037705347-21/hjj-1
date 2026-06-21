<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import {
  Plus,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Eye,
  CheckCircle,
  XCircle,
  LogOut,
  ClipboardCheck,
  FileSearch,
  BarChart3,
  FlaskRound,
  Package,
  User,
  FolderOpen,
  Tag,
  Clock,
  Beaker,
  FlaskConical,
} from 'lucide-vue-next'
import DataTableFilter from '@/components/DataTableFilter.vue'
import type { FilterField } from '@/components/DataTableFilter.vue'
import { useSavedFilters } from '@/composables/useSavedFilters'
import type { SavedFilter } from '@/composables/useSavedFilters'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import {
  mockGetRequisitions,
  mockGetRequisition,
  mockCreateRequisition,
  mockApproveRequisition,
  mockRejectRequisition,
  mockOutboundRequisition,
  mockRegisterUsage,
  mockGetRequisitionStats,
  mockGetProjectConsumption,
  mockGetTopicCost,
  mockGetUserUsage,
} from '@/mock/requisitions'
import type {
  Requisition,
  RequisitionFormData,
  RequisitionFilterParams,
  RequisitionStatus,
  MaterialType,
  RequisitionStats,
  ProjectConsumptionStat,
  TopicCostStat,
  UserUsageStat,
} from '@/types/requisition'
import {
  requisitionStatusLabels,
  requisitionStatusColors,
  materialTypeLabels,
  materialTypeColors,
  projectOptions,
  topicOptions,
} from '@/types/requisition'
import type { PageResult } from '@/types/common'
import { formatDate } from '@/utils/date'
import { usePermission } from '@/composables/usePermission'

const permission = usePermission()

type TabKey = 'apply' | 'approve' | 'outbound' | 'register' | 'query'

const activeTab = ref<TabKey>('apply')
const tabs = computed(() => {
  const result: { key: TabKey; label: string; icon: any; permission: boolean }[] = [
    { key: 'apply', label: '领用申请', icon: Plus, permission: !!permission.canCreateRequisition.value },
    { key: 'approve', label: '领用审批', icon: ClipboardCheck, permission: !!permission.canApproveRequisition.value },
    { key: 'outbound', label: '领用出库', icon: LogOut, permission: !!permission.canOutboundRequisition.value },
    { key: 'register', label: '使用登记', icon: FileSearch, permission: !!permission.canRegisterRequisition.value },
    { key: 'query', label: '记录查询', icon: BarChart3, permission: !!permission.canViewRequisitions.value },
  ]
  return result.filter((t) => t.permission)
})

const loading = ref(false)
const data = ref<PageResult<Requisition> | null>(null)
const stats = ref<RequisitionStats | null>(null)
const projectStats = ref<ProjectConsumptionStat[]>([])
const topicStats = ref<TopicCostStat[]>([])
const userStats = ref<UserUsageStat[]>([])

const filters = ref<Record<string, any>>({
  keyword: '',
  status: '',
  projectName: '',
  topicCode: '',
  applicantName: '',
  materialType: '',
  usageTime: ['', ''],
})

const { savedFilters, addFilter, deleteFilter, loadFilters } = useSavedFilters('requisition_saved_filters')

const filterFields = computed<FilterField[]>(() => {
  const base: FilterField[] = [
    { key: 'materialType', label: '物料类型', type: 'select', options: [
      { label: '试剂', value: 'reagent' },
      { label: '耗材', value: 'consumable' },
    ]},
    { key: 'usageTime', label: '使用时间', type: 'date-range' },
  ]

  if (activeTab.value === 'query') {
    base.unshift(
      { key: 'status', label: '状态', type: 'select', options: [
        { label: '待审批', value: 'pending' },
        { label: '已通过', value: 'approved' },
        { label: '已驳回', value: 'rejected' },
        { label: '已出库', value: 'outbound' },
        { label: '已登记', value: 'used' },
        { label: '已取消', value: 'cancelled' },
      ]},
      { key: 'projectName', label: '实验项目', type: 'select', options: projectOptions.map((p) => ({ label: p.name, value: p.name })) },
      { key: 'topicCode', label: '课题编号', type: 'select', options: topicOptions.map((t) => ({ label: `${t.code} ${t.name}`, value: t.code })) },
    )
  }

  return base
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
})

const showFormModal = ref(false)
const formLoading = ref(false)
const formData = reactive<RequisitionFormData>({
  projectName: '',
  projectCode: '',
  topicCode: '',
  topicName: '',
  usagePurpose: '',
  usageTime: '',
  items: [],
  remark: '',
})

const newItem = reactive({
  materialType: 'reagent' as MaterialType,
  materialId: '',
  materialName: '',
  specification: '',
  unit: '',
  expectedQuantity: 1,
})

const showDetailModal = ref(false)
const detailData = ref<Requisition | null>(null)
const detailLoading = ref(false)

const showApproveConfirm = ref(false)
const showRejectModal = ref(false)
const rejectReason = ref('')
const currentActionId = ref('')

const showOutboundConfirm = ref(false)

const showRegisterModal = ref(false)
const registerQuantities = ref<Record<string, number>>({})

const queryTab = ref<'list' | 'project' | 'topic' | 'user'>('list')

const statusFilterForTab = computed(() => {
  switch (activeTab.value) {
    case 'approve': return 'pending'
    case 'outbound': return 'approved'
    case 'register': return 'outbound'
    default: return ''
  }
})

const fetchData = async () => {
  loading.value = true
  try {
    const f = filters.value
    const params: RequisitionFilterParams = {
      keyword: f.keyword || undefined,
      projectName: f.projectName || undefined,
      topicCode: f.topicCode || undefined,
      applicantName: f.applicantName || undefined,
      materialType: f.materialType || undefined,
      startTime: f.usageTime?.[0] || undefined,
      endTime: f.usageTime?.[1] || undefined,
    }

    if (activeTab.value === 'query') {
      params.status = f.status || undefined
    } else if (statusFilterForTab.value) {
      params.status = statusFilterForTab.value
    }

    const result = await mockGetRequisitions(pagination.page, pagination.pageSize, params)
    data.value = result
  } finally {
    loading.value = false
  }
}

const fetchStats = async () => {
  stats.value = await mockGetRequisitionStats()
  projectStats.value = await mockGetProjectConsumption()
  topicStats.value = await mockGetTopicCost()
  userStats.value = await mockGetUserUsage()
}

const handleSearch = () => {
  pagination.page = 1
  fetchData()
}

const handleReset = () => {
  filters.value = {
    keyword: '',
    status: '',
    projectName: '',
    topicCode: '',
    applicantName: '',
    materialType: '',
    usageTime: ['', ''],
  }
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

const handleTabChange = (key: TabKey) => {
  activeTab.value = key
  pagination.page = 1
  filters.value = {
    keyword: '',
    status: '',
    projectName: '',
    topicCode: '',
    applicantName: '',
    materialType: '',
    usageTime: ['', ''],
  }
  if (key === 'query') {
    fetchStats()
  }
  fetchData()
}

const openCreateModal = () => {
  Object.assign(formData, {
    projectName: '',
    projectCode: '',
    topicCode: '',
    topicName: '',
    usagePurpose: '',
    usageTime: formatDate(new Date(), 'YYYY-MM-DD HH:mm'),
    items: [],
    remark: '',
  })
  Object.assign(newItem, {
    materialType: 'reagent',
    materialId: '',
    materialName: '',
    specification: '',
    unit: '',
    expectedQuantity: 1,
  })
  showFormModal.value = true
}

const handleProjectChange = () => {
  const project = projectOptions.find((p) => p.name === formData.projectName)
  if (project) {
    formData.projectCode = project.code
  }
  formData.topicCode = ''
  formData.topicName = ''
}

const handleTopicChange = () => {
  const topic = topicOptions.find((t) => t.code === formData.topicCode)
  if (topic) {
    formData.topicName = topic.name
  }
}

const availableTopics = computed(() => {
  if (!formData.projectCode) return topicOptions
  return topicOptions.filter((t) => t.projectCode === formData.projectCode)
})

const addItem = () => {
  if (!newItem.materialName.trim()) {
    alert('请输入物料名称')
    return
  }
  if (newItem.expectedQuantity <= 0) {
    alert('预计用量必须大于0')
    return
  }
  formData.items.push({ ...newItem })
  Object.assign(newItem, {
    materialType: 'reagent',
    materialId: '',
    materialName: '',
    specification: '',
    unit: '',
    expectedQuantity: 1,
  })
}

const removeItem = (index: number) => {
  formData.items.splice(index, 1)
}

const handleSubmit = async () => {
  if (!formData.projectName) {
    alert('请选择实验项目')
    return
  }
  if (!formData.topicCode) {
    alert('请选择课题编号')
    return
  }
  if (!formData.usagePurpose.trim()) {
    alert('请输入用途')
    return
  }
  if (!formData.usageTime) {
    alert('请输入使用时间')
    return
  }
  if (formData.items.length === 0) {
    alert('请至少添加一项物料')
    return
  }

  formLoading.value = true
  try {
    await mockCreateRequisition(formData)
    showFormModal.value = false
    fetchData()
  } catch (e: any) {
    alert(e.message || '操作失败')
  } finally {
    formLoading.value = false
  }
}

const openDetail = async (id: string) => {
  detailLoading.value = true
  showDetailModal.value = true
  try {
    const detail = await mockGetRequisition(id)
    detailData.value = detail
  } finally {
    detailLoading.value = false
  }
}

const handleApprove = (id: string) => {
  currentActionId.value = id
  showApproveConfirm.value = true
}

const confirmApprove = async () => {
  try {
    await mockApproveRequisition(currentActionId.value)
    showApproveConfirm.value = false
    fetchData()
  } catch (e: any) {
    alert(e.message || '审批失败')
  }
}

const handleReject = (id: string) => {
  currentActionId.value = id
  rejectReason.value = ''
  showRejectModal.value = true
}

const confirmReject = async () => {
  if (!rejectReason.value.trim()) {
    alert('请输入驳回原因')
    return
  }
  try {
    await mockRejectRequisition(currentActionId.value, rejectReason.value)
    showRejectModal.value = false
    fetchData()
  } catch (e: any) {
    alert(e.message || '驳回失败')
  }
}

const handleOutbound = (id: string) => {
  currentActionId.value = id
  showOutboundConfirm.value = true
}

const confirmOutbound = async () => {
  try {
    await mockOutboundRequisition(currentActionId.value)
    showOutboundConfirm.value = false
    fetchData()
  } catch (e: any) {
    alert(e.message || '出库失败')
  }
}

const handleRegister = (req: Requisition) => {
  currentActionId.value = req.id
  registerQuantities.value = {}
  req.items.forEach((item) => {
    registerQuantities.value[item.id] = item.actualQuantity ?? item.expectedQuantity
  })
  showRegisterModal.value = true
}

const confirmRegister = async () => {
  try {
    await mockRegisterUsage(currentActionId.value, registerQuantities.value)
    showRegisterModal.value = false
    fetchData()
  } catch (e: any) {
    alert(e.message || '登记失败')
  }
}

onMounted(() => {
  fetchData()
  loadFilters()
  fetchStats()
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">实验领用与课题关联</h1>
        <p class="text-sm text-gray-500 mt-0.5">管理试剂耗材领用申请、审批、出库与使用登记，关联实验项目与课题</p>
      </div>
    </div>

    <div class="bg-white rounded-xl shadow-card overflow-hidden">
      <div class="border-b border-gray-100 px-6">
        <div class="flex gap-0">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            class="px-5 py-3.5 text-sm font-medium border-b-2 transition-all whitespace-nowrap flex items-center gap-2"
            :class="[
              activeTab === tab.key
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
            ]"
            @click="handleTabChange(tab.key)"
          >
            <component :is="tab.icon" class="w-4 h-4" />
            {{ tab.label }}
            <span
              v-if="tab.key === 'approve' && stats?.pendingCount"
              class="ml-1 px-1.5 py-0.5 rounded-full text-xs bg-warning-100 text-warning-700"
            >
              {{ stats.pendingCount }}
            </span>
          </button>
        </div>
      </div>

      <div v-if="activeTab === 'query'" class="p-6 border-b border-gray-100">
        <div class="grid grid-cols-5 gap-4">
          <div class="bg-gradient-to-br from-primary-50 to-primary-100/50 rounded-xl p-4">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs text-primary-600/70">领用总数</p>
                <p class="text-2xl font-bold text-primary-700 mt-1">{{ stats?.totalRequisitions || 0 }}</p>
              </div>
              <div class="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                <FlaskRound class="w-5 h-5 text-primary-600" />
              </div>
            </div>
          </div>
          <div class="bg-gradient-to-br from-warning-50 to-warning-100/50 rounded-xl p-4">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs text-warning-600/70">待审批</p>
                <p class="text-2xl font-bold text-warning-700 mt-1">{{ stats?.pendingCount || 0 }}</p>
              </div>
              <div class="w-10 h-10 rounded-lg bg-warning-100 flex items-center justify-center">
                <Clock class="w-5 h-5 text-warning-600" />
              </div>
            </div>
          </div>
          <div class="bg-gradient-to-br from-success-50 to-success-100/50 rounded-xl p-4">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs text-success-600/70">试剂消耗</p>
                <p class="text-2xl font-bold text-success-700 mt-1">{{ stats?.totalReagentUsage || 0 }}</p>
              </div>
              <div class="w-10 h-10 rounded-lg bg-success-100 flex items-center justify-center">
                <FlaskConical class="w-5 h-5 text-success-600" />
              </div>
            </div>
          </div>
          <div class="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-4">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs text-blue-600/70">耗材消耗</p>
                <p class="text-2xl font-bold text-blue-700 mt-1">{{ stats?.totalConsumableUsage || 0 }}</p>
              </div>
              <div class="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Package class="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>
          <div class="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl p-4">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs text-emerald-600/70">已登记</p>
                <p class="text-2xl font-bold text-emerald-700 mt-1">{{ stats?.usedCount || 0 }}</p>
              </div>
              <div class="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <CheckCircle class="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="p-6">
        <div v-if="activeTab === 'query'" class="mb-4 flex gap-2">
          <button
            v-for="qt in [
              { key: 'list', label: '领用记录', icon: FileSearch },
              { key: 'project', label: '项目统计', icon: FolderOpen },
              { key: 'topic', label: '课题成本', icon: Tag },
              { key: 'user', label: '人员频次', icon: User },
            ]"
            :key="qt.key"
            class="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
            :class="[
              queryTab === qt.key
                ? 'bg-primary-100 text-primary-700'
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700',
            ]"
            @click="queryTab = qt.key as any"
          >
            <component :is="qt.icon" class="w-3.5 h-3.5" />
            {{ qt.label }}
          </button>
        </div>

        <div v-if="queryTab === 'list' || activeTab !== 'query'">
          <DataTableFilter
            v-model="filters"
            :filter-fields="filterFields"
            :saved-filters="savedFilters"
            :plain="true"
            :action-button-text="activeTab === 'apply' ? '新建领用申请' : undefined"
            keyword-placeholder="搜索领用编号、项目名称、课题、使用人、物料..."
            class="mb-6"
            @search="handleSearch"
            @reset="handleReset"
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
                    <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">领用编号</th>
                    <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">实验项目</th>
                    <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">课题</th>
                    <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">使用人</th>
                    <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">物料</th>
                    <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                    <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">使用时间</th>
                    <th class="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                  <tr
                    v-for="item in data?.list"
                    :key="item.id"
                    class="hover:bg-gray-50 transition-colors"
                  >
                    <td class="px-6 py-4">
                      <span class="text-sm font-medium text-primary-600">{{ item.requestCode }}</span>
                    </td>
                    <td class="px-6 py-4">
                      <div class="text-sm text-gray-900">{{ item.projectName }}</div>
                      <div class="text-xs text-gray-400">{{ item.projectCode }}</div>
                    </td>
                    <td class="px-6 py-4">
                      <div class="text-sm text-gray-900">{{ item.topicName }}</div>
                      <div class="text-xs text-gray-400">{{ item.topicCode }}</div>
                    </td>
                    <td class="px-6 py-4">
                      <div class="text-sm text-gray-900">{{ item.applicantName }}</div>
                      <div v-if="item.department" class="text-xs text-gray-400">{{ item.department }}</div>
                    </td>
                    <td class="px-6 py-4">
                      <div class="flex flex-wrap gap-1">
                        <span
                          v-for="mat in item.items.slice(0, 2)"
                          :key="mat.id"
                          class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                          :class="materialTypeColors[mat.materialType]"
                        >
                          {{ mat.materialName }}
                        </span>
                        <span
                          v-if="item.items.length > 2"
                          class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500"
                        >
                          +{{ item.items.length - 2 }}
                        </span>
                      </div>
                    </td>
                    <td class="px-6 py-4">
                      <span
                        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                        :class="requisitionStatusColors[item.status]"
                      >
                        {{ requisitionStatusLabels[item.status] }}
                      </span>
                    </td>
                    <td class="px-6 py-4">
                      <div class="text-sm text-gray-600">{{ item.usageTime?.slice(0, 16) }}</div>
                    </td>
                    <td class="px-6 py-4">
                      <div class="flex items-center justify-center gap-1">
                        <button
                          class="p-1.5 text-gray-500 hover:bg-gray-100 rounded transition-colors"
                          title="查看详情"
                          @click="openDetail(item.id)"
                        >
                          <Eye class="w-4 h-4" />
                        </button>
                        <button
                          v-if="activeTab === 'approve' && item.status === 'pending'"
                          class="p-1.5 text-success-600 hover:bg-success-50 rounded transition-colors"
                          title="通过"
                          @click="handleApprove(item.id)"
                        >
                          <CheckCircle class="w-4 h-4" />
                        </button>
                        <button
                          v-if="activeTab === 'approve' && item.status === 'pending'"
                          class="p-1.5 text-danger-600 hover:bg-danger-50 rounded transition-colors"
                          title="驳回"
                          @click="handleReject(item.id)"
                        >
                          <XCircle class="w-4 h-4" />
                        </button>
                        <button
                          v-if="activeTab === 'outbound' && item.status === 'approved'"
                          class="p-1.5 text-primary-600 hover:bg-primary-50 rounded transition-colors"
                          title="出库"
                          @click="handleOutbound(item.id)"
                        >
                          <LogOut class="w-4 h-4" />
                        </button>
                        <button
                          v-if="activeTab === 'register' && item.status === 'outbound'"
                          class="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                          title="使用登记"
                          @click="handleRegister(item)"
                        >
                          <ClipboardCheck class="w-4 h-4" />
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
                <FlaskRound class="w-8 h-8 text-gray-300" />
              </div>
              <p class="text-gray-400">暂无领用记录</p>
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

        <div v-if="activeTab === 'query' && queryTab === 'project'">
          <div class="overflow-x-auto -mx-6">
            <table class="w-full">
              <thead class="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">实验项目</th>
                  <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">项目编号</th>
                  <th class="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">物料项数</th>
                  <th class="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">总消耗量</th>
                  <th class="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">试剂消耗</th>
                  <th class="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">耗材消耗</th>
                  <th class="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">估算成本(元)</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr
                  v-for="item in projectStats"
                  :key="item.projectCode"
                  class="hover:bg-gray-50 transition-colors"
                >
                  <td class="px-6 py-4 text-sm font-medium text-gray-900">{{ item.projectName }}</td>
                  <td class="px-6 py-4 text-sm text-gray-600">{{ item.projectCode }}</td>
                  <td class="px-6 py-4 text-sm text-gray-600 text-right">{{ item.totalItems }}</td>
                  <td class="px-6 py-4 text-sm font-medium text-gray-900 text-right">{{ item.totalQuantity }}</td>
                  <td class="px-6 py-4 text-sm text-purple-600 text-right">{{ item.reagentQuantity }}</td>
                  <td class="px-6 py-4 text-sm text-blue-600 text-right">{{ item.consumableQuantity }}</td>
                  <td class="px-6 py-4 text-sm font-bold text-primary-600 text-right">¥{{ item.estimatedCost.toLocaleString() }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-if="projectStats.length === 0" class="p-16 text-center">
            <p class="text-gray-400">暂无项目消耗数据</p>
          </div>
        </div>

        <div v-if="activeTab === 'query' && queryTab === 'topic'">
          <div class="overflow-x-auto -mx-6">
            <table class="w-full">
              <thead class="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">课题编号</th>
                  <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">课题名称</th>
                  <th class="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">领用次数</th>
                  <th class="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">总消耗量</th>
                  <th class="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">试剂成本(元)</th>
                  <th class="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">耗材成本(元)</th>
                  <th class="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">估算总成本(元)</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr
                  v-for="item in topicStats"
                  :key="item.topicCode"
                  class="hover:bg-gray-50 transition-colors"
                >
                  <td class="px-6 py-4 text-sm text-gray-600">{{ item.topicCode }}</td>
                  <td class="px-6 py-4 text-sm font-medium text-gray-900">{{ item.topicName }}</td>
                  <td class="px-6 py-4 text-sm text-gray-600 text-right">{{ item.totalRequisitions }}</td>
                  <td class="px-6 py-4 text-sm font-medium text-gray-900 text-right">{{ item.totalQuantity }}</td>
                  <td class="px-6 py-4 text-sm text-purple-600 text-right">¥{{ item.reagentCost.toLocaleString() }}</td>
                  <td class="px-6 py-4 text-sm text-blue-600 text-right">¥{{ item.consumableCost.toLocaleString() }}</td>
                  <td class="px-6 py-4 text-sm font-bold text-primary-600 text-right">¥{{ item.estimatedCost.toLocaleString() }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-if="topicStats.length === 0" class="p-16 text-center">
            <p class="text-gray-400">暂无课题成本数据</p>
          </div>
        </div>

        <div v-if="activeTab === 'query' && queryTab === 'user'">
          <div class="overflow-x-auto -mx-6">
            <table class="w-full">
              <thead class="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">使用人</th>
                  <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">部门</th>
                  <th class="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">领用次数</th>
                  <th class="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">物料项数</th>
                  <th class="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">试剂项</th>
                  <th class="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">耗材项</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr
                  v-for="item in userStats"
                  :key="item.userId"
                  class="hover:bg-gray-50 transition-colors"
                >
                  <td class="px-6 py-4 text-sm font-medium text-gray-900">{{ item.userName }}</td>
                  <td class="px-6 py-4 text-sm text-gray-600">{{ item.department || '-' }}</td>
                  <td class="px-6 py-4 text-sm font-bold text-primary-600 text-right">{{ item.requisitionCount }}</td>
                  <td class="px-6 py-4 text-sm text-gray-900 text-right">{{ item.totalItems }}</td>
                  <td class="px-6 py-4 text-sm text-purple-600 text-right">{{ item.reagentCount }}</td>
                  <td class="px-6 py-4 text-sm text-blue-600 text-right">{{ item.consumableCount }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-if="userStats.length === 0" class="p-16 text-center">
            <p class="text-gray-400">暂无人员使用统计数据</p>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="showFormModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      @click.self="showFormModal = false"
    >
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 class="text-lg font-semibold text-gray-800">新建领用申请</h3>
          <button
            class="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            @click="showFormModal = false"
          >
            <X class="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div class="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div class="space-y-5">
            <div class="bg-gray-50 rounded-lg p-4">
              <h4 class="text-sm font-medium text-gray-700 mb-3">项目与课题</h4>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">
                    实验项目 <span class="text-red-500">*</span>
                  </label>
                  <select
                    v-model="formData.projectName"
                    class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-white"
                    @change="handleProjectChange"
                  >
                    <option value="">请选择实验项目</option>
                    <option v-for="p in projectOptions" :key="p.code" :value="p.name">
                      {{ p.name }}
                    </option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">
                    课题编号 <span class="text-red-500">*</span>
                  </label>
                  <select
                    v-model="formData.topicCode"
                    class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-white"
                    @change="handleTopicChange"
                  >
                    <option value="">请选择课题</option>
                    <option v-for="t in availableTopics" :key="t.code" :value="t.code">
                      {{ t.code }} - {{ t.name }}
                    </option>
                  </select>
                </div>
              </div>
            </div>

            <div class="bg-gray-50 rounded-lg p-4">
              <h4 class="text-sm font-medium text-gray-700 mb-3">使用信息</h4>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">
                    用途 <span class="text-red-500">*</span>
                  </label>
                  <input
                    v-model="formData.usagePurpose"
                    type="text"
                    class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                    placeholder="请输入用途说明"
                  >
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">
                    预计使用时间 <span class="text-red-500">*</span>
                  </label>
                  <input
                    v-model="formData.usageTime"
                    type="datetime-local"
                    class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                  >
                </div>
              </div>
            </div>

            <div class="bg-gray-50 rounded-lg p-4">
              <h4 class="text-sm font-medium text-gray-700 mb-3">物料明细</h4>

              <div v-if="formData.items.length > 0" class="mb-4 space-y-2">
                <div
                  v-for="(item, idx) in formData.items"
                  :key="idx"
                  class="flex items-center gap-3 bg-white rounded-lg p-3 border border-gray-200"
                >
                  <span
                    class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                    :class="materialTypeColors[item.materialType]"
                  >
                    {{ materialTypeLabels[item.materialType] }}
                  </span>
                  <span class="text-sm text-gray-900 flex-1">{{ item.materialName }}</span>
                  <span class="text-xs text-gray-500">{{ item.specification }}</span>
                  <span class="text-sm text-gray-700 font-medium">{{ item.expectedQuantity }} {{ item.unit }}</span>
                  <button
                    class="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                    @click="removeItem(idx)"
                  >
                    <X class="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div class="grid grid-cols-6 gap-3 items-end">
                <div>
                  <label class="block text-xs font-medium text-gray-600 mb-1">类型</label>
                  <select
                    v-model="newItem.materialType"
                    class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white"
                  >
                    <option value="reagent">试剂</option>
                    <option value="consumable">耗材</option>
                  </select>
                </div>
                <div class="col-span-2">
                  <label class="block text-xs font-medium text-gray-600 mb-1">物料名称</label>
                  <input
                    v-model="newItem.materialName"
                    type="text"
                    class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                    placeholder="输入物料名称"
                  >
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-600 mb-1">规格</label>
                  <input
                    v-model="newItem.specification"
                    type="text"
                    class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                    placeholder="规格"
                  >
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-600 mb-1">单位</label>
                  <input
                    v-model="newItem.unit"
                    type="text"
                    class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                    placeholder="单位"
                  >
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-600 mb-1">预计用量</label>
                  <div class="flex gap-2">
                    <input
                      v-model.number="newItem.expectedQuantity"
                      type="number"
                      min="1"
                      class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                    >
                    <button
                      class="px-3 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 transition-colors whitespace-nowrap"
                      @click="addItem"
                    >
                      添加
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">备注</label>
              <textarea
                v-model="formData.remark"
                rows="3"
                class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all resize-none"
                placeholder="请输入备注信息"
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
            提交申请
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="showDetailModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      @click.self="showDetailModal = false"
    >
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 class="text-lg font-semibold text-gray-800">领用详情</h3>
          <button
            class="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            @click="showDetailModal = false"
          >
            <X class="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div v-if="detailLoading" class="p-16 flex items-center justify-center">
          <div class="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
        </div>

        <div v-else-if="detailData" class="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          <div class="space-y-5">
            <div class="flex items-center justify-between">
              <span class="text-lg font-bold text-primary-600">{{ detailData.requestCode }}</span>
              <span
                class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
                :class="requisitionStatusColors[detailData.status]"
              >
                {{ requisitionStatusLabels[detailData.status] }}
              </span>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="bg-gray-50 rounded-lg p-3">
                <div class="text-xs text-gray-500 mb-1">实验项目</div>
                <div class="text-sm font-medium text-gray-900">{{ detailData.projectName }}</div>
                <div class="text-xs text-gray-400">{{ detailData.projectCode }}</div>
              </div>
              <div class="bg-gray-50 rounded-lg p-3">
                <div class="text-xs text-gray-500 mb-1">课题</div>
                <div class="text-sm font-medium text-gray-900">{{ detailData.topicName }}</div>
                <div class="text-xs text-gray-400">{{ detailData.topicCode }}</div>
              </div>
              <div class="bg-gray-50 rounded-lg p-3">
                <div class="text-xs text-gray-500 mb-1">使用人</div>
                <div class="text-sm font-medium text-gray-900">{{ detailData.applicantName }}</div>
                <div class="text-xs text-gray-400">{{ detailData.department || '' }}</div>
              </div>
              <div class="bg-gray-50 rounded-lg p-3">
                <div class="text-xs text-gray-500 mb-1">使用时间</div>
                <div class="text-sm font-medium text-gray-900">{{ detailData.usageTime?.slice(0, 16) }}</div>
              </div>
            </div>

            <div class="bg-gray-50 rounded-lg p-3">
              <div class="text-xs text-gray-500 mb-1">用途</div>
              <div class="text-sm text-gray-900">{{ detailData.usagePurpose }}</div>
            </div>

            <div>
              <h4 class="text-sm font-medium text-gray-700 mb-3">物料明细</h4>
              <div class="space-y-2">
                <div
                  v-for="item in detailData.items"
                  :key="item.id"
                  class="bg-white rounded-lg p-3 border border-gray-200"
                >
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <span
                        class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                        :class="materialTypeColors[item.materialType]"
                      >
                        {{ materialTypeLabels[item.materialType] }}
                      </span>
                      <span class="text-sm font-medium text-gray-900">{{ item.materialName }}</span>
                      <span class="text-xs text-gray-400">{{ item.specification }}</span>
                    </div>
                    <div class="text-right">
                      <div class="text-sm text-gray-700">
                        预计: <span class="font-medium">{{ item.expectedQuantity }}</span> {{ item.unit }}
                      </div>
                      <div v-if="item.actualQuantity !== undefined" class="text-xs text-primary-600">
                        实际: <span class="font-medium">{{ item.actualQuantity }}</span> {{ item.unit }}
                      </div>
                      <div
                        v-if="item.stockBefore !== undefined && item.stockAfter !== undefined"
                        class="mt-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded inline-block"
                      >
                        库存: {{ item.stockBefore }} → {{ item.stockAfter }} {{ item.unit }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="detailData.approverName" class="bg-gray-50 rounded-lg p-3">
              <div class="text-xs text-gray-500 mb-1">审批信息</div>
              <div class="text-sm text-gray-900">
                {{ detailData.approverName }} · {{ detailData.approveTime?.slice(0, 16) }}
              </div>
              <div v-if="detailData.rejectReason" class="text-sm text-red-600 mt-1">
                驳回原因: {{ detailData.rejectReason }}
              </div>
            </div>

            <div v-if="detailData.outboundOperatorName" class="bg-gray-50 rounded-lg p-3">
              <div class="text-xs text-gray-500 mb-1">出库信息</div>
              <div class="text-sm text-gray-900">
                {{ detailData.outboundOperatorName }} · {{ detailData.outboundTime?.slice(0, 16) }}
              </div>
            </div>

            <div v-if="detailData.usageRegisteredByName" class="bg-gray-50 rounded-lg p-3">
              <div class="text-xs text-gray-500 mb-1">使用登记</div>
              <div class="text-sm text-gray-900">
                {{ detailData.usageRegisteredByName }} · {{ detailData.usageRegisterTime?.slice(0, 16) }}
              </div>
            </div>

            <div v-if="detailData.remark" class="bg-gray-50 rounded-lg p-3">
              <div class="text-xs text-gray-500 mb-1">备注</div>
              <div class="text-sm text-gray-900">{{ detailData.remark }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <ConfirmDialog
      v-model:visible="showApproveConfirm"
      title="确认审批"
      message="确定要通过该领用申请吗？审批通过后可进行出库操作。"
      confirm-text="确认通过"
      type="default"
      @confirm="confirmApprove"
    />

    <div
      v-if="showRejectModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      @click.self="showRejectModal = false"
    >
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 class="text-lg font-semibold text-gray-800">驳回申请</h3>
          <button
            class="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            @click="showRejectModal = false"
          >
            <X class="w-5 h-5 text-gray-400" />
          </button>
        </div>
        <div class="p-6">
          <label class="block text-sm font-medium text-gray-700 mb-1.5">
            驳回原因 <span class="text-red-500">*</span>
          </label>
          <textarea
            v-model="rejectReason"
            rows="3"
            class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all resize-none"
            placeholder="请输入驳回原因"
          />
        </div>
        <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
          <button
            class="px-5 py-2.5 border border-gray-200 hover:bg-gray-100 text-gray-600 rounded-lg transition-colors"
            @click="showRejectModal = false"
          >
            取消
          </button>
          <button
            class="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            @click="confirmReject"
          >
            确认驳回
          </button>
        </div>
      </div>
    </div>

    <ConfirmDialog
      v-model:visible="showOutboundConfirm"
      title="确认出库"
      message="确定要对该领用申请执行出库操作吗？出库后将自动扣减库存。"
      confirm-text="确认出库"
      type="default"
      @confirm="confirmOutbound"
    />

    <div
      v-if="showRegisterModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      @click.self="showRegisterModal = false"
    >
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 class="text-lg font-semibold text-gray-800">使用登记</h3>
          <button
            class="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            @click="showRegisterModal = false"
          >
            <X class="w-5 h-5 text-gray-400" />
          </button>
        </div>
        <div class="p-6 space-y-3">
          <p class="text-sm text-gray-500 mb-2">请填写各项物料的实际使用量：</p>
          <div
            v-for="item in data?.list.find(r => r.id === currentActionId)?.items"
            :key="item.id"
            class="flex items-center gap-3 bg-gray-50 rounded-lg p-3"
          >
            <span
              class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
              :class="materialTypeColors[item.materialType]"
            >
              {{ materialTypeLabels[item.materialType] }}
            </span>
            <span class="text-sm text-gray-900 flex-1">{{ item.materialName }}</span>
            <span class="text-xs text-gray-400">预计 {{ item.expectedQuantity }} {{ item.unit }}</span>
            <div class="flex items-center gap-1">
              <input
                v-model.number="registerQuantities[item.id]"
                type="number"
                min="0"
                class="w-20 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              >
              <span class="text-xs text-gray-500">{{ item.unit }}</span>
            </div>
          </div>
        </div>
        <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
          <button
            class="px-5 py-2.5 border border-gray-200 hover:bg-gray-100 text-gray-600 rounded-lg transition-colors"
            @click="showRegisterModal = false"
          >
            取消
          </button>
          <button
            class="px-5 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded-lg transition-all"
            @click="confirmRegister"
          >
            确认登记
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
