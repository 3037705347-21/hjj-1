<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  FileCheck,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  User,
  ChevronLeft,
  ChevronRight,
  Filter,
  Send,
  AlertCircle,
  Eye,
  FileText,
  Plus,
} from 'lucide-vue-next'
import DataTableFilter from '@/components/DataTableFilter.vue'
import type { FilterField } from '@/components/DataTableFilter.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import type { PageResult } from '@/types/common'
import { formatDate } from '@/utils/date'
import { usePermission } from '@/composables/usePermission'
import { useAuditLog } from '@/composables/useAuditLog'
import type {
  ApprovalRecord,
  ApprovalType,
  ApprovalStatus,
  ApprovalFilterParams,
  ApprovalSubmitFormData,
} from '@/types/approval'
import {
  approvalTypeLabels,
  approvalStatusLabels,
  approvalStatusColors,
} from '@/types/approval'
import {
  mockGetApprovals,
  mockGetApproval,
  mockApproveApproval,
  mockRejectApproval,
  mockSubmitApproval,
  mockGetApprovalStats,
} from '@/mock/approvals'
import { useSavedFilters } from '@/composables/useSavedFilters'
import type { SavedFilter } from '@/composables/useSavedFilters'

const router = useRouter()
const permission = usePermission()
const auditLog = useAuditLog()

const activeTab = ref<'all' | 'pending' | 'my'>('all')

const loading = ref(false)
const data = ref<PageResult<ApprovalRecord> | null>(null)
const stats = ref<{
  total: number
  pending: number
  approved: number
  rejected: number
  myPending: number
} | null>(null)

const filters = reactive<ApprovalFilterParams & { submitTime: [string, string] }>({
  keyword: '',
  type: '',
  status: '',
  applicantName: '',
  submitTime: ['', ''],
})

const { savedFilters, addFilter, deleteFilter, loadFilters } = useSavedFilters('approval_saved_filters')

const filterFields: FilterField[] = [
  { key: 'type', label: '审批类型', type: 'select', options: Object.entries(approvalTypeLabels).map(([value, label]) => ({ label, value })) },
  { key: 'status', label: '审批状态', type: 'select', options: Object.entries(approvalStatusLabels).map(([value, label]) => ({ label, value })) },
  { key: 'applicantName', label: '申请人', type: 'input', placeholder: '输入申请人姓名' },
  { key: 'submitTime', label: '提交时间', type: 'date-range' },
]

const pagination = reactive({
  page: 1,
  pageSize: 10,
})

const showDetailModal = ref(false)
const detailLoading = ref(false)
const currentApproval = ref<ApprovalRecord | null>(null)

const showApproveConfirm = ref(false)
const showRejectDialog = ref(false)
const rejectLoading = ref(false)
const rejectForm = reactive({
  reason: '',
})

const showSubmitDialog = ref(false)
const submitLoading = ref(false)
const submitForm = reactive<ApprovalSubmitFormData>({
  type: 'reagent_create',
  title: '',
  targetType: 'reagent',
  targetId: '',
  targetName: '',
  beforeContent: '',
  afterContent: '',
  remark: '',
})

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

const handleTabChange = (tab: 'all' | 'pending' | 'my') => {
  activeTab.value = tab
  if (tab === 'pending') {
    filters.status = 'pending'
  } else if (tab === 'my') {
    filters.status = ''
  } else {
    filters.status = ''
  }
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

const openDetail = async (approval: ApprovalRecord) => {
  currentApproval.value = approval
  showDetailModal.value = true
}

const openApproveConfirm = (approval: ApprovalRecord) => {
  currentApproval.value = approval
  showApproveConfirm.value = true
}

const handleApprove = async () => {
  if (!currentApproval.value) return
  try {
    await mockApproveApproval(currentApproval.value.id)
    showApproveConfirm.value = false
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

const openRejectDialog = (approval: ApprovalRecord) => {
  currentApproval.value = approval
  rejectForm.reason = ''
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
    await mockRejectApproval(currentApproval.value.id, rejectForm.reason)
    showRejectDialog.value = false
    fetchData()
    fetchStats()
    if (showDetailModal.value) {
      const updated = await mockGetApproval(currentApproval.value.id)
      currentApproval.value = updated
    }
  } catch (e: any) {
    alert(e.message || '操作失败')
  } finally {
    rejectLoading.value = false
  }
}

const openSubmitDialog = () => {
  submitForm.type = 'reagent_create'
  submitForm.title = ''
  submitForm.targetType = 'reagent'
  submitForm.targetId = ''
  submitForm.targetName = ''
  submitForm.beforeContent = ''
  submitForm.afterContent = ''
  submitForm.remark = ''
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
    const result = await mockSubmitApproval({ ...submitForm })
    auditLog.logApproval(result.id, result.title, 'submit', submitForm.remark || '提交审批')
    showSubmitDialog.value = false
    fetchData()
    fetchStats()
  } catch (e: any) {
    alert(e.message || '提交失败')
  } finally {
    submitLoading.value = false
  }
}

onMounted(() => {
  loadFilters()
  fetchData()
  fetchStats()
})
</script>

<template>
  <div class="p-6 space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">审批管理</h1>
        <p class="mt-1 text-sm text-gray-500">管理和处理系统中的各类审批申请</p>
      </div>
      <button
        class="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors shadow-md"
        @click="openSubmitDialog"
      >
        <Plus class="w-4 h-4" />
        <span>提交审批</span>
      </button>
    </div>

    <div class="grid grid-cols-4 gap-4">
      <div class="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">全部申请</p>
            <p class="mt-1 text-2xl font-bold text-gray-900">{{ stats?.total || 0 }}</p>
          </div>
          <div class="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center">
            <FileText class="w-6 h-6 text-primary-600" />
          </div>
        </div>
      </div>
      <div class="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">待审批</p>
            <p class="mt-1 text-2xl font-bold text-warning-600">{{ stats?.pending || 0 }}</p>
          </div>
          <div class="w-12 h-12 rounded-xl bg-warning-50 flex items-center justify-center">
            <Clock class="w-6 h-6 text-warning-600" />
          </div>
        </div>
      </div>
      <div class="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">已通过</p>
            <p class="mt-1 text-2xl font-bold text-success-600">{{ stats?.approved || 0 }}</p>
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
            <p class="mt-1 text-2xl font-bold text-danger-600">{{ stats?.rejected || 0 }}</p>
          </div>
          <div class="w-12 h-12 rounded-xl bg-danger-50 flex items-center justify-center">
            <XCircle class="w-6 h-6 text-danger-600" />
          </div>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div class="flex items-center gap-1 px-4 pt-4 border-b border-gray-100">
        <button
          v-for="tab in [
            { key: 'all', label: '全部申请' },
            { key: 'pending', label: '待我审批' },
            { key: 'my', label: '我的申请' },
          ]"
          :key="tab.key"
          class="px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors"
          :class="[
            activeTab === tab.key
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200',
          ]"
          @click="handleTabChange(tab.key as any)"
        >
          {{ tab.label }}
          <span
            v-if="tab.key === 'pending' && stats?.pending"
            class="ml-1.5 px-1.5 py-0.5 text-xs bg-warning-100 text-warning-600 rounded-full"
          >
            {{ stats.pending }}
          </span>
        </button>
      </div>

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
              <th class="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">审批标题</th>
              <th class="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">类型</th>
              <th class="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">申请人</th>
              <th class="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">状态</th>
              <th class="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">提交时间</th>
              <th class="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">审批人</th>
              <th class="px-6 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-if="loading" class="h-48">
              <td colspan="7" class="text-center text-gray-400">加载中...</td>
            </tr>
            <tr v-else-if="!data?.list.length" class="h-48">
              <td colspan="7" class="text-center text-gray-400">暂无审批记录</td>
            </tr>
            <tr
              v-for="item in data?.list"
              :key="item.id"
              class="hover:bg-gray-50/50 transition-colors"
            >
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
                    <FileCheck class="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <p class="font-medium text-gray-900">{{ item.title }}</p>
                    <p class="text-sm text-gray-500">{{ item.targetName }}</p>
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
                  <span class="text-sm text-gray-700">{{ item.applicantName }}</span>
                </div>
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
              <td class="px-6 py-4 text-sm text-gray-500">
                {{ item.approverName || '-' }}
              </td>
              <td class="px-6 py-4 text-right">
                <div class="flex items-center justify-end gap-2">
                  <button
                    class="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                    title="查看详情"
                    @click="openDetail(item)"
                  >
                    <Eye class="w-4 h-4" />
                  </button>
                  <template v-if="item.status === 'pending' && permission.hasPermission('approval:handle')">
                    <button
                      class="p-2 text-gray-400 hover:text-success-600 hover:bg-success-50 rounded-lg transition-colors"
                      title="通过"
                      @click="openApproveConfirm(item)"
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

    <div
      v-if="showDetailModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      @click.self="showDetailModal = false"
    >
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 class="text-lg font-semibold text-gray-900">审批详情</h3>
          <button
            class="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            @click="showDetailModal = false"
          >
            <XCircle class="w-5 h-5 text-gray-400" />
          </button>
        </div>
        <div v-if="currentApproval" class="p-6 space-y-5">
          <div class="flex items-start justify-between">
            <div>
              <h4 class="text-lg font-semibold text-gray-900">{{ currentApproval.title }}</h4>
              <p class="mt-1 text-sm text-gray-500">{{ approvalTypeLabels[currentApproval.type] }}</p>
            </div>
            <span
              class="inline-flex items-center px-3 py-1 text-sm font-medium rounded-full"
              :class="approvalStatusColors[currentApproval.status]"
            >
              {{ approvalStatusLabels[currentApproval.status] }}
            </span>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="p-3 bg-gray-50 rounded-xl">
              <p class="text-xs text-gray-500 mb-1">申请人</p>
              <p class="font-medium text-gray-900">{{ currentApproval.applicantName }}</p>
            </div>
            <div class="p-3 bg-gray-50 rounded-xl">
              <p class="text-xs text-gray-500 mb-1">提交时间</p>
              <p class="font-medium text-gray-900">{{ currentApproval.submitTime }}</p>
            </div>
            <div class="p-3 bg-gray-50 rounded-xl">
              <p class="text-xs text-gray-500 mb-1">目标对象</p>
              <p class="font-medium text-gray-900">{{ currentApproval.targetName }}</p>
            </div>
            <div class="p-3 bg-gray-50 rounded-xl">
              <p class="text-xs text-gray-500 mb-1">审批人</p>
              <p class="font-medium text-gray-900">{{ currentApproval.approverName || '待审批' }}</p>
            </div>
          </div>

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

          <div v-if="currentApproval.remark" class="space-y-2">
            <p class="text-sm font-medium text-gray-700">申请说明</p>
            <p class="text-sm text-gray-600 bg-gray-50 p-3 rounded-xl">{{ currentApproval.remark }}</p>
          </div>

          <div v-if="currentApproval.rejectReason" class="space-y-2">
            <p class="text-sm font-medium text-danger-600">驳回原因</p>
            <p class="text-sm text-gray-600 bg-danger-50 p-3 rounded-xl border border-danger-100">{{ currentApproval.rejectReason }}</p>
          </div>

          <div v-if="currentApproval.status === 'pending' && permission.hasPermission('approval:handle')" class="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              class="px-4 py-2 border border-danger-200 text-danger-600 rounded-xl hover:bg-danger-50 transition-colors"
              @click="openRejectDialog(currentApproval)"
            >
              驳回
            </button>
            <button
              class="px-4 py-2 bg-success-600 text-white rounded-xl hover:bg-success-700 transition-colors"
              @click="openApproveConfirm(currentApproval)"
            >
              通过
            </button>
          </div>
        </div>
      </div>
    </div>

    <ConfirmDialog
      v-model:visible="showApproveConfirm"
      title="确认通过"
      confirm-text="确认通过"
      confirm-type="success"
      @confirm="handleApprove"
    >
      <p class="text-gray-600">确定要通过此审批申请吗？</p>
    </ConfirmDialog>

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

    <div
      v-if="showSubmitDialog"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      @click.self="showSubmitDialog = false"
    >
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 class="text-lg font-semibold text-gray-900">提交审批申请</h3>
          <button
            class="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            @click="showSubmitDialog = false"
          >
            <XCircle class="w-5 h-5 text-gray-400" />
          </button>
        </div>
        <div class="p-6 space-y-4">
          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-700">审批类型</label>
            <select
              v-model="submitForm.type"
              class="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            >
              <option
                v-for="[value, label] in Object.entries(approvalTypeLabels)"
                :key="value"
                :value="value"
              >
                {{ label }}
              </option>
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
          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-700">目标名称 <span class="text-danger-500">*</span></label>
            <input
              v-model="submitForm.targetName"
              type="text"
              class="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              placeholder="请输入目标对象名称"
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
          <div class="flex justify-end gap-3 pt-2">
            <button
              class="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors"
              @click="showSubmitDialog = false"
            >
              取消
            </button>
            <button
              class="px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors flex items-center gap-2 disabled:opacity-50"
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
  </div>
</template>
