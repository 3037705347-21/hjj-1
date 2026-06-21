<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import {
  FileCheck,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  User,
  ChevronLeft,
  ChevronRight,
  Send,
  Eye,
  FileText,
  Plus,
  Inbox,
  SendHorizonal,
  CheckCheck,
  ArrowRight,
  ArrowLeftRight,
  Mail,
  MessageSquare,
  X,
  Filter,
  AlertCircle,
  ShoppingCart,
  FlaskConical,
  AlertTriangle,
  Trash2,
  SlidersHorizontal,
  TrendingUp,
  TrendingDown,
  Check,
  Circle,
  CornerDownRight,
  Undo2,
} from 'lucide-vue-next'
import DataTableFilter from '@/components/DataTableFilter.vue'
import type { FilterField } from '@/components/DataTableFilter.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import type { PageResult } from '@/types/common'
import { formatDate } from '@/utils/date'
import { usePermission } from '@/composables/usePermission'
import type {
  ApprovalRecord,
  ApprovalType,
  ApprovalStatus,
  ApprovalFilterParams,
  ApprovalSubmitFormData,
  ApprovalUserOption,
  ApproveActionData,
  RejectActionData,
  TransferActionData,
  CcActionData,
  ApprovalNodeStatus,
  ApprovalNode,
} from '@/types/approval'
import {
  approvalTypeLabels,
  approvalStatusLabels,
  approvalStatusColors,
  approvalTypeGroups,
  nodeStatusLabels,
  nodeStatusColors,
  actionTypeLabels,
  actionTypeColors,
} from '@/types/approval'
import {
  mockGetApprovals,
  mockGetApproval,
  mockApproveApproval,
  mockRejectApproval,
  mockSubmitApproval,
  mockGetApprovalStats,
  mockTransferApproval,
  mockAddCcApproval,
  mockWithdrawApproval,
  mockGetApprovalUsers,
} from '@/mock/approvals'
import { useSavedFilters } from '@/composables/useSavedFilters'
import type { SavedFilter } from '@/composables/useSavedFilters'
import { roleLabels } from '@/types/user'

const permission = usePermission()

type ViewKey = 'pending' | 'initiated' | 'processed'

const activeView = ref<ViewKey>('pending')

const loading = ref(false)
const data = ref<PageResult<ApprovalRecord> | null>(null)
const stats = ref<{
  pendingCount: number
  initiatedCount: number
  processedCount: number
  approvedCount: number
  rejectedCount: number
  ccCount: number
} | null>(null)

const filters = reactive<ApprovalFilterParams & { submitTime: [string, string] }>({
  keyword: '',
  type: '',
  status: '',
  applicantName: '',
  submitTime: ['', ''],
  view: 'pending',
})

const { savedFilters, addFilter, deleteFilter, loadFilters } = useSavedFilters('approval_saved_filters_v2')

const filterFields = computed<FilterField[]>(() => {
  const typeOptions: { label: string; value: string }[] = []
  Object.entries(approvalTypeGroups).forEach(([group, types]) => {
    types.forEach(t => {
      typeOptions.push({ label: `${group} - ${approvalTypeLabels[t]}`, value: t })
    })
  })

  const fields: FilterField[] = [
    { key: 'type', label: '审批类型', type: 'select', options: typeOptions },
    { key: 'applicantName', label: '申请人', type: 'input', placeholder: '输入申请人姓名' },
    { key: 'submitTime', label: '提交时间', type: 'date-range' },
  ]

  if (activeView.value !== 'pending') {
    fields.splice(1, 0, {
      key: 'status',
      label: '审批状态',
      type: 'select',
      options: Object.entries(approvalStatusLabels).map(([value, label]) => ({ label, value })),
    })
  }

  return fields
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
})

const showDetailModal = ref(false)
const detailLoading = ref(false)
const currentApproval = ref<ApprovalRecord | null>(null)

const showApproveDialog = ref(false)
const approveLoading = ref(false)
const approveForm = reactive<ApproveActionData>({
  comment: '',
  ccUserIds: [],
})

const showRejectDialog = ref(false)
const rejectLoading = ref(false)
const rejectForm = reactive<RejectActionData>({
  reason: '',
  returnToFirst: false,
  comment: '',
})

const showTransferDialog = ref(false)
const transferLoading = ref(false)
const transferForm = reactive<TransferActionData>({
  toUserId: '',
  toUserName: '',
  comment: '',
})

const showCcDialog = ref(false)
const ccLoading = ref(false)
const ccForm = reactive<CcActionData>({
  userIds: [],
  comment: '',
})

const showWithdrawConfirm = ref(false)

const showSubmitDialog = ref(false)
const submitLoading = ref(false)
const submitForm = reactive<ApprovalSubmitFormData>({
  type: 'purchase_request',
  title: '',
  targetType: '',
  targetId: '',
  targetName: '',
  targetSummary: '',
  beforeContent: '',
  afterContent: '',
  remark: '',
  ccUserIds: [],
})

const availableUsers = ref<ApprovalUserOption[]>([])
const ccAvailableUsers = ref<ApprovalUserOption[]>([])
const transferAvailableUsers = ref<ApprovalUserOption[]>([])
const submitCcUsers = ref<ApprovalUserOption[]>([])

const fetchData = async () => {
  loading.value = true
  try {
    const params: ApprovalFilterParams = {
      keyword: filters.keyword || undefined,
      type: filters.type || undefined,
      status: filters.status || undefined,
      applicantName: filters.applicantName || undefined,
      startTime: filters.submitTime?.[0] || undefined,
      endTime: filters.submitTime?.[1] || undefined,
      view: filters.view,
    }
    data.value = await mockGetApprovals(pagination.page, pagination.pageSize, params)
  } finally {
    loading.value = false
  }
}

const fetchStats = async () => {
  try {
    stats.value = await mockGetApprovalStats()
  } catch (e) {
    console.error('Failed to fetch stats', e)
  }
}

const fetchUsers = async () => {
  try {
    availableUsers.value = await mockGetApprovalUsers()
    ccAvailableUsers.value = availableUsers.value
    transferAvailableUsers.value = availableUsers.value
    submitCcUsers.value = availableUsers.value
  } catch (e) {
    console.error('Failed to fetch users', e)
  }
}

const handleViewChange = (view: ViewKey) => {
  activeView.value = view
  filters.view = view
  filters.status = ''
  pagination.page = 1
  fetchData()
}

const handleSearch = () => {
  pagination.page = 1
  fetchData()
}

const handleReset = () => {
  filters.keyword = ''
  filters.type = ''
  filters.status = ''
  filters.applicantName = ''
  filters.submitTime = ['', '']
  pagination.page = 1
  fetchData()
}

const handleSaveFilter = (name: string) => {
  addFilter(name, { ...filters })
}

const handleApplyFilter = (filter: SavedFilter) => {
  Object.assign(filters, filter.values)
  pagination.page = 1
  fetchData()
}

const handleDeleteFilter = (id: string) => {
  deleteFilter(id)
}

const handlePageChange = (page: number) => {
  pagination.page = page
  fetchData()
}

const totalPages = computed(() => {
  if (!data.value) return 0
  return Math.ceil(data.value.total / pagination.pageSize)
})

const currentNodeTransferInfo = computed(() => {
  if (!currentApproval.value) return null
  const currentNode = currentApproval.value.nodes.find(n => n.status === 'current')
  if (currentNode?.originalApproverName) {
    return {
      from: currentNode.originalApproverName,
      to: currentNode.approverName,
      time: currentNode.transferredAt,
      comment: currentNode.comment,
    }
  }
  return null
})

const isCurrentUserApprover = (approval: ApprovalRecord) => {
  const currentUser = JSON.parse(localStorage.getItem('mock_user') || 'null')
  return approval.nodes.some(n => n.status === 'current' && n.approverId === currentUser?.id)
}

const isCurrentUserApplicant = (approval: ApprovalRecord) => {
  const currentUser = JSON.parse(localStorage.getItem('mock_user') || 'null')
  return approval.applicantId === currentUser?.id
}

const openDetail = async (approval: ApprovalRecord) => {
  detailLoading.value = true
  showDetailModal.value = true
  try {
    const detail = await mockGetApproval(approval.id)
    currentApproval.value = detail
  } finally {
    detailLoading.value = false
  }
}

const openApproveDialog = (approval: ApprovalRecord) => {
  currentApproval.value = approval
  approveForm.comment = ''
  approveForm.ccUserIds = []
  showApproveDialog.value = true
}

const handleApprove = async () => {
  if (!currentApproval.value) return
  approveLoading.value = true
  try {
    const updated = await mockApproveApproval(currentApproval.value.id, { ...approveForm })
    showApproveDialog.value = false
    fetchData()
    fetchStats()
    if (showDetailModal.value) {
      currentApproval.value = updated
    }
  } catch (e: any) {
    alert(e.message || '操作失败')
  } finally {
    approveLoading.value = false
  }
}

const openRejectDialog = (approval: ApprovalRecord) => {
  currentApproval.value = approval
  rejectForm.reason = ''
  rejectForm.returnToFirst = false
  rejectForm.comment = ''
  showRejectDialog.value = true
}

const handleRejectSubmit = async () => {
  if (!currentApproval.value) return
  if (!rejectForm.reason.trim()) {
    alert('请填写驳回原因')
    return
  }
  rejectLoading.value = true
  try {
    const updated = await mockRejectApproval(currentApproval.value.id, { ...rejectForm })
    showRejectDialog.value = false
    fetchData()
    fetchStats()
    if (showDetailModal.value) {
      currentApproval.value = updated
    }
  } catch (e: any) {
    alert(e.message || '操作失败')
  } finally {
    rejectLoading.value = false
  }
}

const openTransferDialog = (approval: ApprovalRecord) => {
  currentApproval.value = approval
  transferForm.toUserId = ''
  transferForm.toUserName = ''
  transferForm.comment = ''
  showTransferDialog.value = true
}

const handleTransferUserChange = () => {
  const user = transferAvailableUsers.value.find(u => u.id === transferForm.toUserId)
  if (user) {
    transferForm.toUserName = user.name
  }
}

const handleTransferSubmit = async () => {
  if (!currentApproval.value) return
  if (!transferForm.toUserId) {
    alert('请选择转交对象')
    return
  }
  transferLoading.value = true
  try {
    const updated = await mockTransferApproval(currentApproval.value.id, { ...transferForm })
    showTransferDialog.value = false
    fetchData()
    fetchStats()
    if (showDetailModal.value) {
      currentApproval.value = updated
    }
  } catch (e: any) {
    alert(e.message || '操作失败')
  } finally {
    transferLoading.value = false
  }
}

const openCcDialog = (approval: ApprovalRecord) => {
  currentApproval.value = approval
  ccForm.userIds = []
  ccForm.comment = ''
  showCcDialog.value = true
}

const handleCcSubmit = async () => {
  if (!currentApproval.value) return
  if (ccForm.userIds.length === 0) {
    alert('请至少选择一位抄送人')
    return
  }
  ccLoading.value = true
  try {
    const updated = await mockAddCcApproval(currentApproval.value.id, { ...ccForm })
    showCcDialog.value = false
    if (showDetailModal.value) {
      currentApproval.value = updated
    }
  } catch (e: any) {
    alert(e.message || '操作失败')
  } finally {
    ccLoading.value = false
  }
}

const openWithdrawConfirm = (approval: ApprovalRecord) => {
  currentApproval.value = approval
  showWithdrawConfirm.value = true
}

const handleWithdraw = async () => {
  if (!currentApproval.value) return
  try {
    await mockWithdrawApproval(currentApproval.value.id)
    showWithdrawConfirm.value = false
    fetchData()
    fetchStats()
    if (showDetailModal.value) {
      const updated = await mockGetApproval(currentApproval.value.id)
      currentApproval.value = updated
    }
  } catch (e: any) {
    alert(e.message || '操作失败')
  }
}

const openSubmitDialog = () => {
  submitForm.type = 'purchase_request'
  submitForm.title = ''
  submitForm.targetType = ''
  submitForm.targetId = ''
  submitForm.targetName = ''
  submitForm.targetSummary = ''
  submitForm.beforeContent = ''
  submitForm.afterContent = ''
  submitForm.remark = ''
  submitForm.ccUserIds = []
  showSubmitDialog.value = true
}

const handleSubmitApproval = async () => {
  if (!submitForm.title.trim()) {
    alert('请填写审批标题')
    return
  }
  if (!submitForm.targetName.trim()) {
    alert('请填写目标名称')
    return
  }
  submitLoading.value = true
  try {
    await mockSubmitApproval({ ...submitForm })
    showSubmitDialog.value = false
    fetchData()
    fetchStats()
  } catch (e: any) {
    alert(e.message || '提交失败')
  } finally {
    submitLoading.value = false
  }
}

const getApprovalIcon = (type: ApprovalType) => {
  switch (type) {
    case 'purchase_request': return ShoppingCart
    case 'requisition_hazardous': return AlertTriangle
    case 'requisition_overlimit': return TrendingUp
    case 'requisition_apply': return FlaskConical
    case 'scrap_apply': return Trash2
    case 'inventory_adjust': return SlidersHorizontal
    case 'consumable_adjust': return SlidersHorizontal
    default: return FileCheck
  }
}

const getNodeIconClass = (node: ApprovalNode) => {
  if (node.originalApproverName && node.status === 'current') {
    return 'bg-orange-500 text-white animate-pulse'
  }
  switch (node.status) {
    case 'approved': return 'bg-success-500 text-white'
    case 'current': return 'bg-primary-500 text-white animate-pulse'
    case 'rejected': return 'bg-danger-500 text-white'
    case 'transferred': return 'bg-orange-500 text-white'
    case 'skipped': return 'bg-gray-300 text-white'
    default: return 'bg-gray-200 text-gray-400'
  }
}

onMounted(() => {
  loadFilters()
  fetchData()
  fetchStats()
  fetchUsers()
})
</script>

<template>
  <div class="p-6 space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">统一审批流中心</h1>
        <p class="mt-1 text-sm text-gray-500">处理采购申请、危险试剂领用、超量领用、报废申请、库存调整等各类审批</p>
      </div>
      <button
        class="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors shadow-md"
        @click="openSubmitDialog"
      >
        <Plus class="w-4 h-4" />
        <span>发起审批</span>
      </button>
    </div>

    <div class="grid grid-cols-5 gap-4">
      <div
        class="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 cursor-pointer transition-all hover:shadow-md"
        :class="activeView === 'pending' ? 'ring-2 ring-primary-500 ring-offset-2' : ''"
        @click="handleViewChange('pending')"
      >
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">待我审批</p>
            <p class="mt-1 text-2xl font-bold text-warning-600">{{ stats?.pendingCount || 0 }}</p>
          </div>
          <div class="w-12 h-12 rounded-xl bg-warning-50 flex items-center justify-center">
            <Inbox class="w-6 h-6 text-warning-600" />
          </div>
        </div>
      </div>
      <div
        class="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 cursor-pointer transition-all hover:shadow-md"
        :class="activeView === 'initiated' ? 'ring-2 ring-primary-500 ring-offset-2' : ''"
        @click="handleViewChange('initiated')"
      >
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">我发起的</p>
            <p class="mt-1 text-2xl font-bold text-primary-600">{{ stats?.initiatedCount || 0 }}</p>
          </div>
          <div class="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center">
            <SendHorizonal class="w-6 h-6 text-primary-600" />
          </div>
        </div>
      </div>
      <div
        class="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 cursor-pointer transition-all hover:shadow-md"
        :class="activeView === 'processed' ? 'ring-2 ring-primary-500 ring-offset-2' : ''"
        @click="handleViewChange('processed')"
      >
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">我已处理</p>
            <p class="mt-1 text-2xl font-bold text-success-600">{{ stats?.processedCount || 0 }}</p>
          </div>
          <div class="w-12 h-12 rounded-xl bg-success-50 flex items-center justify-center">
            <CheckCheck class="w-6 h-6 text-success-600" />
          </div>
        </div>
      </div>
      <div class="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">已通过</p>
            <p class="mt-1 text-2xl font-bold text-success-600">{{ stats?.approvedCount || 0 }}</p>
          </div>
          <div class="w-12 h-12 rounded-xl bg-success-50 flex items-center justify-center">
            <CheckCircle class="w-6 h-6 text-success-600" />
          </div>
        </div>
      </div>
      <div class="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">已驳回</p>
            <p class="mt-1 text-2xl font-bold text-danger-600">{{ stats?.rejectedCount || 0 }}</p>
          </div>
          <div class="w-12 h-12 rounded-xl bg-danger-50 flex items-center justify-center">
            <XCircle class="w-6 h-6 text-danger-600" />
          </div>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <DataTableFilter
        :filter-fields="filterFields"
        :saved-filters="savedFilters"
        v-model="filters"
        keyword-placeholder="搜索审批标题、目标名称、申请人..."
        @search="handleSearch"
        @reset="handleReset"
        @save-filter="handleSaveFilter"
        @apply-filter="handleApplyFilter"
        @delete-filter="handleDeleteFilter"
      />

      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="bg-gray-50/50">
              <th class="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">审批信息</th>
              <th class="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">类型</th>
              <th class="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">申请人</th>
              <th class="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">当前节点</th>
              <th class="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">状态</th>
              <th class="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">提交时间</th>
              <th class="px-6 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-if="loading" class="h-48">
              <td colspan="7" class="text-center text-gray-400">加载中...</td>
            </tr>
            <tr v-else-if="!data?.list.length" class="h-48">
              <td colspan="7" class="text-center text-gray-400">
                <div class="flex flex-col items-center gap-2">
                  <FileCheck class="w-12 h-12 text-gray-300" />
                  <p>暂无审批记录</p>
                </div>
              </td>
            </tr>
            <tr
              v-for="item in data?.list"
              :key="item.id"
              class="hover:bg-gray-50/50 transition-colors"
            >
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
                    <component :is="getApprovalIcon(item.type)" class="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <p class="font-medium text-gray-900 cursor-pointer hover:text-primary-600" @click="openDetail(item)">{{ item.title }}</p>
                    <p class="text-sm text-gray-500">{{ item.targetName }}</p>
                    <p v-if="item.targetSummary" class="text-xs text-gray-400 mt-0.5">{{ item.targetSummary }}</p>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4">
                <span class="text-sm text-gray-600">{{ approvalTypeLabels[item.type] }}</span>
              </td>
              <td class="px-6 py-4">
                <div class="flex items-center gap-2">
                  <div class="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                    <User class="w-4 h-4 text-gray-500" />
                  </div>
                  <div>
                    <span class="text-sm text-gray-700">{{ item.applicantName }}</span>
                    <p v-if="item.applicantDepartment" class="text-xs text-gray-400">{{ item.applicantDepartment }}</p>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4">
                <div v-if="item.currentNodeName" class="flex items-center gap-2">
                  <div
                    class="w-2 h-2 rounded-full animate-pulse"
                    :class="item.nodes?.some(n => n.status === 'current' && n.originalApproverName) ? 'bg-orange-500' : 'bg-primary-500'"
                  ></div>
                  <div>
                    <p class="text-sm text-gray-700">{{ item.currentNodeName }}</p>
                    <p class="text-xs text-gray-400">{{ item.currentApproverName }}</p>
                    <p
                      v-if="item.nodes?.some(n => n.status === 'current' && n.originalApproverName)"
                      class="text-xs text-orange-600"
                    >
                      转交待处理
                    </p>
                  </div>
                </div>
                <span v-else class="text-sm text-gray-400">-</span>
              </td>
              <td class="px-6 py-4">
                <span
                  class="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full"
                  :class="approvalStatusColors[item.status]"
                >
                  {{ approvalStatusLabels[item.status] }}
                </span>
              </td>
              <td class="px-6 py-4 text-sm text-gray-500">
                {{ item.submitTime }}
              </td>
              <td class="px-6 py-4 text-right">
                <div class="flex items-center justify-end gap-1.5">
                  <button
                    class="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                    title="查看详情"
                    @click="openDetail(item)"
                  >
                    <Eye class="w-4 h-4" />
                  </button>
                  <template v-if="(item.status === 'pending' || item.status === 'approving') && isCurrentUserApprover(item)">
                    <button
                      class="p-2 text-gray-400 hover:text-success-600 hover:bg-success-50 rounded-lg transition-colors"
                      title="通过"
                      @click="openApproveDialog(item)"
                    >
                      <CheckCircle class="w-4 h-4" />
                    </button>
                    <button
                      class="p-2 text-gray-400 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
                      title="驳回"
                      @click="openRejectDialog(item)"
                    >
                      <XCircle class="w-4 h-4" />
                    </button>
                    <button
                      class="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="转交"
                      @click="openTransferDialog(item)"
                    >
                      <ArrowLeftRight class="w-4 h-4" />
                    </button>
                  </template>
                  <button
                    class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    title="抄送"
                    @click="openCcDialog(item)"
                  >
                    <Mail class="w-4 h-4" />
                  </button>
                  <template v-if="(item.status === 'pending' || item.status === 'approving') && isCurrentUserApplicant(item)">
                    <button
                      class="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                      title="撤回"
                      @click="openWithdrawConfirm(item)"
                    >
                      <Undo2 class="w-4 h-4" />
                    </button>
                  </template>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="data && data.total > 0" class="flex items-center justify-between px-6 py-4 border-t border-gray-100">
        <p class="text-sm text-gray-500">
          共 <span class="font-medium text-gray-900">{{ data.total }}</span> 条记录
        </p>
        <div class="flex items-center gap-2">
          <button
            class="p-2 rounded-lg border border-gray-200 text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="pagination.page <= 1"
            @click="handlePageChange(pagination.page - 1)"
          >
            <ChevronLeft class="w-4 h-4" />
          </button>
          <span class="px-3 py-1.5 text-sm text-gray-600">
            {{ pagination.page }} / {{ totalPages }}
          </span>
          <button
            class="p-2 rounded-lg border border-gray-200 text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="pagination.page >= totalPages"
            @click="handlePageChange(pagination.page + 1)"
          >
            <ChevronRight class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- 审批详情模态框 -->
    <div
      v-if="showDetailModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      @click.self="showDetailModal = false"
    >
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <h3 class="text-lg font-semibold text-gray-900">审批详情</h3>
          <button
            class="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            @click="showDetailModal = false"
          >
            <XCircle class="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div v-if="detailLoading" class="flex-1 flex items-center justify-center p-16">
          <div class="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
        </div>

        <div v-else-if="currentApproval" class="flex-1 overflow-y-auto">
          <div class="p-6 space-y-6">
            <!-- 基本信息 -->
            <div class="flex items-start justify-between">
              <div class="flex items-start gap-4">
                <div class="w-14 h-14 rounded-2xl bg-primary-50 flex items-center justify-center flex-shrink-0">
                  <component :is="getApprovalIcon(currentApproval.type)" class="w-7 h-7 text-primary-600" />
                </div>
                <div>
                  <h4 class="text-xl font-semibold text-gray-900">{{ currentApproval.title }}</h4>
                  <div class="flex items-center gap-3 mt-1.5">
                    <span class="text-sm text-gray-500">{{ approvalTypeLabels[currentApproval.type] }}</span>
                    <span class="text-gray-300">|</span>
                    <span class="text-sm text-gray-500">编号: {{ currentApproval.id }}</span>
                  </div>
                </div>
              </div>
              <span
                class="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-full"
                :class="approvalStatusColors[currentApproval.status]"
              >
                {{ approvalStatusLabels[currentApproval.status] }}
              </span>
            </div>

            <!-- 审批流程 -->
            <div class="bg-gray-50 rounded-2xl p-6">
              <h5 class="text-sm font-semibold text-gray-700 mb-5 flex items-center gap-2">
                <ArrowRight class="w-4 h-4" />
                审批流程
              </h5>
              <div class="relative">
                <div class="flex items-start">
                  <!-- 发起节点 -->
                  <div class="flex flex-col items-center" style="min-width: 100px;">
                    <div class="w-10 h-10 rounded-full bg-primary-500 text-white flex items-center justify-center z-10">
                      <Send class="w-5 h-5" />
                    </div>
                    <p class="mt-2 text-sm font-medium text-gray-900 text-center">发起申请</p>
                    <p class="text-xs text-gray-500 text-center mt-0.5">{{ currentApproval.applicantName }}</p>
                    <p class="text-xs text-gray-400 text-center">{{ currentApproval.submitTime?.slice(5, 16) }}</p>
                  </div>

                  <template v-for="node in currentApproval.nodes" :key="node.id">
                    <div class="flex items-center pt-5 px-2">
                      <div
                        class="w-10 h-0.5"
                        :class="node.status === 'pending' ? 'bg-gray-200' : node.status === 'rejected' ? 'bg-danger-300' : 'bg-success-400'"
                      ></div>
                    </div>
                    <div class="flex flex-col items-center" style="min-width: 100px;">
                      <div
                        class="w-10 h-10 rounded-full flex items-center justify-center z-10 transition-all"
                        :class="getNodeIconClass(node)"
                      >
                        <Check v-if="node.status === 'approved'" class="w-5 h-5" />
                        <XCircle v-else-if="node.status === 'rejected'" class="w-5 h-5" />
                        <ArrowLeftRight v-else-if="node.originalApproverName && node.status === 'current'" class="w-5 h-5" />
                        <ArrowLeftRight v-else-if="node.status === 'transferred'" class="w-5 h-5" />
                        <Clock v-else-if="node.status === 'current'" class="w-5 h-5" />
                        <Circle v-else class="w-3 h-3" />
                      </div>
                      <p class="mt-2 text-sm font-medium text-gray-900 text-center">{{ node.name }}</p>
                      <p class="text-xs text-gray-500 text-center mt-0.5">{{ node.approverName }}</p>
                      <p v-if="node.originalApproverName" class="text-xs text-orange-600 text-center mt-0.5">
                        由 {{ node.originalApproverName }} 转交
                      </p>
                      <p v-if="node.actionTime" class="text-xs text-gray-400 text-center">{{ node.actionTime?.slice(5, 16) }}</p>
                    </div>
                  </template>
                </div>
              </div>
            </div>

            <!-- 申请详情 -->
            <div class="grid grid-cols-2 gap-4">
              <div class="p-4 bg-gray-50 rounded-xl">
                <p class="text-xs text-gray-500 mb-1">申请人</p>
                <p class="font-medium text-gray-900">{{ currentApproval.applicantName }}</p>
                <p v-if="currentApproval.applicantDepartment" class="text-xs text-gray-400">{{ currentApproval.applicantDepartment }}</p>
              </div>
              <div class="p-4 bg-gray-50 rounded-xl">
                <p class="text-xs text-gray-500 mb-1">提交时间</p>
                <p class="font-medium text-gray-900">{{ currentApproval.submitTime }}</p>
              </div>
              <div class="p-4 bg-gray-50 rounded-xl">
                <p class="text-xs text-gray-500 mb-1">目标对象</p>
                <p class="font-medium text-gray-900">{{ currentApproval.targetName }}</p>
                <p v-if="currentApproval.targetSummary" class="text-xs text-gray-400">{{ currentApproval.targetSummary }}</p>
              </div>
              <div class="p-4 bg-gray-50 rounded-xl">
                <p class="text-xs text-gray-500 mb-1">当前审批人</p>
                <p class="font-medium text-gray-900">{{ currentApproval.currentApproverName || '审批已完成' }}</p>
                <p v-if="currentNodeTransferInfo" class="text-xs text-orange-600 mt-1">
                  由 {{ currentNodeTransferInfo.from }} 转交
                </p>
              </div>
            </div>

            <!-- 变更内容 -->
            <div v-if="currentApproval.beforeContent || currentApproval.afterContent" class="space-y-3">
              <p class="text-sm font-medium text-gray-700">变更内容</p>
              <div class="grid grid-cols-2 gap-4">
                <div class="p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <p class="text-xs text-gray-500 mb-2 font-medium">变更前</p>
                  <p class="text-sm text-gray-700 whitespace-pre-wrap">{{ currentApproval.beforeContent || '-' }}</p>
                </div>
                <div class="p-4 bg-primary-50 rounded-xl border border-primary-200">
                  <p class="text-xs text-primary-600 mb-2 font-medium">变更后</p>
                  <p class="text-sm text-gray-700 whitespace-pre-wrap">{{ currentApproval.afterContent || '-' }}</p>
                </div>
              </div>
            </div>

            <!-- 申请说明 -->
            <div v-if="currentApproval.remark" class="space-y-2">
              <p class="text-sm font-medium text-gray-700">申请说明</p>
              <p class="text-sm text-gray-600 bg-gray-50 p-4 rounded-xl">{{ currentApproval.remark }}</p>
            </div>

            <!-- 驳回原因 -->
            <div v-if="currentApproval.rejectReason" class="space-y-2">
              <p class="text-sm font-medium text-danger-600 flex items-center gap-2">
                <AlertCircle class="w-4 h-4" />
                驳回原因
              </p>
              <p class="text-sm text-gray-600 bg-danger-50 p-4 rounded-xl border border-danger-100">{{ currentApproval.rejectReason }}</p>
            </div>

            <!-- 抄送列表 -->
            <div v-if="currentApproval.ccList && currentApproval.ccList.length > 0" class="space-y-3">
              <p class="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Mail class="w-4 h-4" />
                抄送人 ({{ currentApproval.ccList.length }})
              </p>
              <div class="flex flex-wrap gap-2">
                <div
                  v-for="cc in currentApproval.ccList"
                  :key="cc.id"
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-full text-sm"
                >
                  <User class="w-3.5 h-3.5 text-gray-500" />
                  <span class="text-gray-700">{{ cc.userName }}</span>
                  <span
                    class="w-1.5 h-1.5 rounded-full"
                    :class="cc.isRead ? 'bg-success-500' : 'bg-warning-500'"
                  ></span>
                </div>
              </div>
            </div>

            <!-- 审批历史 -->
            <div class="space-y-4">
              <p class="text-sm font-medium text-gray-700 flex items-center gap-2">
                <MessageSquare class="w-4 h-4" />
                审批历史
              </p>
              <div class="relative pl-6 space-y-5">
                <div class="absolute left-[7px] top-1 bottom-1 w-0.5 bg-gray-200"></div>
                <div
                  v-for="(record, idx) in currentApproval.history"
                  :key="record.id"
                  class="relative"
                >
                  <div
                    class="absolute -left-[19px] top-1 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center"
                    :class="[
                      idx === 0 ? 'bg-primary-500' : record.actionType === 'approve' ? 'bg-success-500' :
                      record.actionType === 'reject' ? 'bg-danger-500' :
                      record.actionType === 'transfer' ? 'bg-blue-500' :
                      record.actionType === 'withdraw' ? 'bg-gray-400' : 'bg-gray-300'
                    ]"
                  ></div>
                  <div class="bg-gray-50 rounded-xl p-4">
                    <div class="flex items-center justify-between mb-2">
                      <div class="flex items-center gap-2">
                        <span
                          class="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded"
                          :class="actionTypeColors[record.actionType]"
                        >
                          {{ actionTypeLabels[record.actionType] }}
                        </span>
                        <span class="text-sm font-medium text-gray-900">{{ record.operatorName }}</span>
                        <span class="text-xs text-gray-400">{{ record.nodeName }}</span>
                      </div>
                      <span class="text-xs text-gray-400">{{ record.actionTime }}</span>
                    </div>
                    <p v-if="record.comment" class="text-sm text-gray-600">{{ record.comment }}</p>
                    <p v-if="record.toUserName" class="text-sm text-blue-600 mt-1 flex items-center gap-1">
                      <CornerDownRight class="w-3.5 h-3.5" />
                      转交给 {{ record.toUserName }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 底部操作栏 -->
        <div v-if="currentApproval && (currentApproval.status === 'pending' || currentApproval.status === 'approving')" class="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50 flex-shrink-0">
          <div class="flex items-center gap-2">
            <button
              class="px-3 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-1.5"
              @click="openCcDialog(currentApproval)"
            >
              <Mail class="w-4 h-4" />
              抄送
            </button>
            <button
              v-if="isCurrentUserApplicant(currentApproval)"
              class="px-3 py-2 text-sm text-orange-600 hover:bg-orange-50 rounded-lg transition-colors flex items-center gap-1.5"
              @click="openWithdrawConfirm(currentApproval)"
            >
              <Undo2 class="w-4 h-4" />
              撤回申请
            </button>
          </div>
          <div v-if="isCurrentUserApprover(currentApproval)" class="flex items-center gap-2">
            <button
              class="px-4 py-2 border border-danger-200 text-danger-600 rounded-xl hover:bg-danger-50 transition-colors flex items-center gap-1.5"
              @click="openRejectDialog(currentApproval)"
            >
              <XCircle class="w-4 h-4" />
              驳回
            </button>
            <button
              class="px-4 py-2 border border-blue-200 text-blue-600 rounded-xl hover:bg-blue-50 transition-colors flex items-center gap-1.5"
              @click="openTransferDialog(currentApproval)"
            >
              <ArrowLeftRight class="w-4 h-4" />
              转交
            </button>
            <button
              class="px-4 py-2 bg-success-600 text-white rounded-xl hover:bg-success-700 transition-colors flex items-center gap-1.5"
              @click="openApproveDialog(currentApproval)"
            >
              <CheckCircle class="w-4 h-4" />
              通过
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 通过审批对话框 -->
    <div
      v-if="showApproveDialog"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      @click.self="showApproveDialog = false"
    >
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 class="text-lg font-semibold text-gray-900">审批通过</h3>
          <button
            class="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            @click="showApproveDialog = false"
          >
            <XCircle class="w-5 h-5 text-gray-400" />
          </button>
        </div>
        <div class="p-6 space-y-4">
          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-700">审批意见</label>
            <textarea
              v-model="approveForm.comment"
              class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 resize-none"
              rows="3"
              placeholder="请输入审批意见（选填）"
            />
          </div>
          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-700">同时抄送</label>
            <div class="flex flex-wrap gap-2 max-h-32 overflow-y-auto border border-gray-200 rounded-xl p-3">
              <label
                v-for="user in ccAvailableUsers"
                :key="user.id"
                class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg cursor-pointer transition-colors"
                :class="approveForm.ccUserIds?.includes(user.id) ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
              >
                <input
                  type="checkbox"
                  :value="user.id"
                  v-model="approveForm.ccUserIds"
                  class="sr-only"
                />
                <User class="w-3.5 h-3.5" />
                <span class="text-sm">{{ user.name }}</span>
              </label>
            </div>
          </div>
          <div class="flex justify-end gap-3 pt-2">
            <button
              class="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors"
              @click="showApproveDialog = false"
            >
              取消
            </button>
            <button
              class="px-4 py-2 bg-success-600 text-white rounded-xl hover:bg-success-700 transition-colors flex items-center gap-2 disabled:opacity-50"
              :disabled="approveLoading"
              @click="handleApprove"
            >
              {{ approveLoading ? '提交中...' : '确认通过' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 驳回审批对话框 -->
    <div
      v-if="showRejectDialog"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      @click.self="showRejectDialog = false"
    >
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 class="text-lg font-semibold text-gray-900">驳回审批</h3>
          <button
            class="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            @click="showRejectDialog = false"
          >
            <XCircle class="w-5 h-5 text-gray-400" />
          </button>
        </div>
        <div class="p-6 space-y-4">
          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-700">驳回原因 <span class="text-danger-500">*</span></label>
            <textarea
              v-model="rejectForm.reason"
              class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 resize-none"
              rows="4"
              placeholder="请填写驳回原因..."
            />
          </div>
          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-700">补充说明</label>
            <textarea
              v-model="rejectForm.comment"
              class="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 resize-none text-sm"
              rows="2"
              placeholder="可选"
            />
          </div>
          <div class="flex justify-end gap-3">
            <button
              class="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors"
              @click="showRejectDialog = false"
            >
              取消
            </button>
            <button
              class="px-4 py-2 bg-danger-600 text-white rounded-xl hover:bg-danger-700 transition-colors disabled:opacity-50"
              :disabled="rejectLoading"
              @click="handleRejectSubmit"
            >
              {{ rejectLoading ? '提交中...' : '确认驳回' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 转交审批对话框 -->
    <div
      v-if="showTransferDialog"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      @click.self="showTransferDialog = false"
    >
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 class="text-lg font-semibold text-gray-900">转交审批</h3>
          <button
            class="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            @click="showTransferDialog = false"
          >
            <XCircle class="w-5 h-5 text-gray-400" />
          </button>
        </div>
        <div class="p-6 space-y-4">
          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-700">转交给 <span class="text-danger-500">*</span></label>
            <select
              v-model="transferForm.toUserId"
              class="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white"
              @change="handleTransferUserChange"
            >
              <option value="">请选择转交对象</option>
              <option v-for="user in transferAvailableUsers" :key="user.id" :value="user.id">
                {{ user.name }} - {{ roleLabels[user.role] }}{{ user.department ? ` (${user.department})` : '' }}
              </option>
            </select>
          </div>
          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-700">转交说明</label>
            <textarea
              v-model="transferForm.comment"
              class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 resize-none"
              rows="3"
              placeholder="请输入转交说明（选填）"
            />
          </div>
          <div class="flex justify-end gap-3">
            <button
              class="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors"
              @click="showTransferDialog = false"
            >
              取消
            </button>
            <button
              class="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
              :disabled="transferLoading"
              @click="handleTransferSubmit"
            >
              <ArrowLeftRight class="w-4 h-4" />
              {{ transferLoading ? '提交中...' : '确认转交' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 抄送对话框 -->
    <div
      v-if="showCcDialog"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      @click.self="showCcDialog = false"
    >
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 class="text-lg font-semibold text-gray-900">添加抄送</h3>
          <button
            class="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            @click="showCcDialog = false"
          >
            <XCircle class="w-5 h-5 text-gray-400" />
          </button>
        </div>
        <div class="p-6 space-y-4">
          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-700">选择抄送人 <span class="text-danger-500">*</span></label>
            <div class="flex flex-wrap gap-2 max-h-48 overflow-y-auto border border-gray-200 rounded-xl p-3">
              <label
                v-for="user in ccAvailableUsers"
                :key="user.id"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
                :class="ccForm.userIds.includes(user.id) ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
              >
                <input
                  type="checkbox"
                  :value="user.id"
                  v-model="ccForm.userIds"
                  class="sr-only"
                />
                <User class="w-3.5 h-3.5" />
                <span class="text-sm">{{ user.name }}</span>
              </label>
            </div>
            <p v-if="ccForm.userIds.length > 0" class="text-xs text-gray-500">
              已选择 {{ ccForm.userIds.length }} 人
            </p>
          </div>
          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-700">抄送留言</label>
            <textarea
              v-model="ccForm.comment"
              class="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 resize-none text-sm"
              rows="2"
              placeholder="可选"
            />
          </div>
          <div class="flex justify-end gap-3">
            <button
              class="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors"
              @click="showCcDialog = false"
            >
              取消
            </button>
            <button
              class="px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors flex items-center gap-2 disabled:opacity-50"
              :disabled="ccLoading"
              @click="handleCcSubmit"
            >
              <Mail class="w-4 h-4" />
              {{ ccLoading ? '提交中...' : '确认抄送' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 撤回确认对话框 -->
    <ConfirmDialog
      v-model:visible="showWithdrawConfirm"
      title="确认撤回"
      confirm-text="确认撤回"
      confirm-type="warning"
      @confirm="handleWithdraw"
    >
      <p class="text-gray-600">确定要撤回此审批申请吗？撤回后需要重新提交。</p>
    </ConfirmDialog>

    <!-- 发起审批对话框 -->
    <div
      v-if="showSubmitDialog"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      @click.self="showSubmitDialog = false"
    >
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 class="text-lg font-semibold text-gray-900">发起审批申请</h3>
          <button
            class="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            @click="showSubmitDialog = false"
          >
            <XCircle class="w-5 h-5 text-gray-400" />
          </button>
        </div>
        <div class="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <label class="block text-sm font-medium text-gray-700">审批类型 <span class="text-danger-500">*</span></label>
              <select
                v-model="submitForm.type"
                class="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white"
              >
                <optgroup v-for="[group, types] in Object.entries(approvalTypeGroups)" :key="group" :label="group">
                  <option v-for="t in types" :key="t" :value="t">{{ approvalTypeLabels[t] }}</option>
                </optgroup>
              </select>
            </div>
            <div class="space-y-2">
              <label class="block text-sm font-medium text-gray-700">审批标题 <span class="text-danger-500">*</span></label>
              <input
                v-model="submitForm.title"
                type="text"
                class="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                placeholder="请输入审批标题"
              />
            </div>
          </div>
          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-700">目标名称 <span class="text-danger-500">*</span></label>
            <input
              v-model="submitForm.targetName"
              type="text"
              class="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              placeholder="请输入目标对象名称"
            />
          </div>
          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-700">摘要说明</label>
            <input
              v-model="submitForm.targetSummary"
              type="text"
              class="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              placeholder="简要描述（选填）"
            />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <label class="block text-sm font-medium text-gray-700">变更前内容</label>
              <textarea
                v-model="submitForm.beforeContent"
                class="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 resize-none text-sm"
                rows="3"
                placeholder="可选"
              />
            </div>
            <div class="space-y-2">
              <label class="block text-sm font-medium text-gray-700">变更后内容</label>
              <textarea
                v-model="submitForm.afterContent"
                class="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 resize-none text-sm"
                rows="3"
                placeholder="可选"
              />
            </div>
          </div>
          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-700">申请说明</label>
            <textarea
              v-model="submitForm.remark"
              class="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 resize-none text-sm"
              rows="2"
              placeholder="请填写申请说明..."
            />
          </div>
          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-700">抄送人</label>
            <div class="flex flex-wrap gap-2 max-h-32 overflow-y-auto border border-gray-200 rounded-xl p-3">
              <label
                v-for="user in submitCcUsers"
                :key="user.id"
                class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg cursor-pointer transition-colors"
                :class="submitForm.ccUserIds?.includes(user.id) ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
              >
                <input
                  type="checkbox"
                  :value="user.id"
                  v-model="submitForm.ccUserIds"
                  class="sr-only"
                />
                <User class="w-3.5 h-3.5" />
                <span class="text-sm">{{ user.name }}</span>
              </label>
            </div>
          </div>
        </div>
        <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
          <button
            class="px-5 py-2.5 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-100 transition-colors"
            @click="showSubmitDialog = false"
          >
            取消
          </button>
          <button
            class="px-5 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors flex items-center gap-2 disabled:opacity-50"
            :disabled="submitLoading"
            @click="handleSubmitApproval"
          >
            <Send class="w-4 h-4" />
            {{ submitLoading ? '提交中...' : '提交申请' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
