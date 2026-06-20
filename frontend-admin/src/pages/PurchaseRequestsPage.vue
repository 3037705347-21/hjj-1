<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  ShoppingCart,
  Search,
  Plus,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit,
  Trash2,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  User,
  Package,
  X,
  TrendingUp,
  AlertTriangle,
  Check,
  Ban,
  RotateCcw,
} from 'lucide-vue-next'
import DataTableFilter from '@/components/DataTableFilter.vue'
import type { FilterField } from '@/components/DataTableFilter.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import type { PageResult } from '@/types/common'
import { formatDate } from '@/utils/date'
import { usePermission } from '@/composables/usePermission'
import type {
  PurchaseRequest,
  PurchaseFilterParams,
  PurchaseRequestFormData,
  PurchaseItemType,
} from '@/types/purchase'
import {
  purchaseRequestStatusLabels,
  purchaseRequestStatusColors,
  purchaseItemTypeLabels,
} from '@/types/purchase'
import {
  mockGetPurchaseRequests,
  mockCreatePurchaseRequest,
  mockUpdatePurchaseRequest,
  mockSubmitPurchaseRequest,
  mockApprovePurchaseRequest,
  mockRejectPurchaseRequest,
  mockDeletePurchaseRequest,
  mockGetPurchaseStats,
} from '@/mock/purchases'
import { useSavedFilters } from '@/composables/useSavedFilters'
import type { SavedFilter } from '@/composables/useSavedFilters'
import { reagentCategories, commonBrands } from '@/types/reagent'
import { consumableCategories } from '@/types/consumable'

const router = useRouter()
const permission = usePermission()

const loading = ref(false)
const data = ref<PageResult<PurchaseRequest> | null>(null)
const stats = ref<{
  total: number
  pending: number
  purchasing: number
  partialReceived: number
  completed: number
  rejected: number
} | null>(null)

const filters = reactive<PurchaseFilterParams & { createdAt: [string, string] }>({
  keyword: '',
  status: '',
  itemType: '',
  applicantName: '',
  createdAt: ['', ''],
})

const { savedFilters, addFilter, deleteFilter, loadFilters } = useSavedFilters('purchase_request_saved_filters')

const filterFields: FilterField[] = [
  { key: 'status', label: '状态', type: 'select', options: Object.entries(purchaseRequestStatusLabels).map(([value, label]) => ({ label, value })) },
  { key: 'itemType', label: '物品类型', type: 'select', options: Object.entries(purchaseItemTypeLabels).map(([value, label]) => ({ label, value })) },
  { key: 'applicantName', label: '申请人', type: 'input', placeholder: '输入申请人姓名' },
  { key: 'createdAt', label: '申请时间', type: 'date-range' },
]

const pagination = reactive({
  page: 1,
  pageSize: 10,
})

const showCreateModal = ref(false)
const showEditModal = ref(false)
const showDetailModal = ref(false)
const showApproveConfirm = ref(false)
const showRejectDialog = ref(false)
const showDeleteConfirm = ref(false)

const currentRequest = ref<PurchaseRequest | null>(null)
const detailLoading = ref(false)

const rejectLoading = ref(false)
const rejectForm = reactive({
  reason: '',
})

const submitLoading = ref(false)
const formLoading = ref(false)

interface FormItem {
  itemType: PurchaseItemType
  itemId: string
  itemName: string
  specification: string
  casNo?: string
  category?: string
  unit: string
  quantity: number
  manufacturer?: string
  brand?: string
  remark?: string
}

const formData = reactive<{
  title: string
  itemType: PurchaseItemType
  items: FormItem[]
  expectedDeliveryDate: string
  purpose: string
  reason: string
}>({
  title: '',
  itemType: 'reagent',
  items: [],
  expectedDeliveryDate: '',
  purpose: '',
  reason: '',
})

const addFormItem = () => {
  formData.items.push({
    itemType: formData.itemType,
    itemId: '',
    itemName: '',
    specification: '',
    unit: '',
    quantity: 1,
    manufacturer: '',
    brand: '',
    remark: '',
  })
}

const removeFormItem = (index: number) => {
  formData.items.splice(index, 1)
}

const fetchData = async () => {
  loading.value = true
  try {
    const params: PurchaseFilterParams = {
      keyword: filters.keyword || undefined,
      status: filters.status || undefined,
      itemType: filters.itemType || undefined,
      applicantName: filters.applicantName || undefined,
      startTime: filters.createdAt?.[0] || undefined,
      endTime: filters.createdAt?.[1] || undefined,
    }
    data.value = await mockGetPurchaseRequests(pagination.page, pagination.pageSize, params)
  } finally {
    loading.value = false
  }
}

const fetchStats = async () => {
  try {
    const s = await mockGetPurchaseStats()
    stats.value = {
      total: s.totalRequests,
      pending: s.pendingApproval,
      purchasing: s.purchasing,
      partialReceived: s.partialReceived,
      completed: s.completed,
      rejected: s.rejected,
    }
  } catch (e) {
    console.error('Failed to fetch stats', e)
  }
}

const handleSearch = () => {
  pagination.page = 1
  fetchData()
}

const handleReset = () => {
  filters.keyword = ''
  filters.status = ''
  filters.itemType = ''
  filters.applicantName = ''
  filters.createdAt = ['', '']
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

const openCreateModal = () => {
  formData.title = ''
  formData.itemType = 'reagent'
  formData.items = []
  formData.expectedDeliveryDate = ''
  formData.purpose = ''
  formData.reason = ''
  addFormItem()
  showCreateModal.value = true
}

const openEditModal = (request: PurchaseRequest) => {
  currentRequest.value = request
  formData.title = request.title
  formData.itemType = request.itemType
  formData.items = request.items.map(item => ({
    itemType: item.itemType,
    itemId: item.itemId,
    itemName: item.itemName,
    specification: item.specification,
    casNo: item.casNo,
    category: item.category,
    unit: item.unit,
    quantity: item.quantity,
    manufacturer: item.manufacturer,
    brand: item.brand,
    remark: item.remark,
  }))
  formData.expectedDeliveryDate = request.expectedDeliveryDate || ''
  formData.purpose = request.purpose
  formData.reason = request.reason
  showEditModal.value = true
}

const openDetailModal = async (request: PurchaseRequest) => {
  currentRequest.value = request
  showDetailModal.value = true
}

const handleCreateSubmit = async () => {
  if (!formData.title.trim()) {
    alert('请填写申请标题')
    return
  }
  if (formData.items.length === 0) {
    alert('请添加至少一个采购物品')
    return
  }
  for (let i = 0; i < formData.items.length; i++) {
    const item = formData.items[i]
    if (!item.itemName.trim()) {
      alert(`请填写第 ${i + 1} 个物品的名称`)
      return
    }
    if (!item.specification.trim()) {
      alert(`请填写第 ${i + 1} 个物品的规格`)
      return
    }
    if (!item.unit.trim()) {
      alert(`请填写第 ${i + 1} 个物品的单位`)
      return
    }
    if (item.quantity <= 0) {
      alert(`第 ${i + 1} 个物品的数量必须大于0`)
      return
    }
  }
  if (!formData.purpose.trim()) {
    alert('请填写用途')
    return
  }
  if (!formData.reason.trim()) {
    alert('请填写申请原因')
    return
  }

  formLoading.value = true
  try {
    const submitData: PurchaseRequestFormData = {
      title: formData.title,
      itemType: formData.itemType,
      items: formData.items.map(item => ({
        itemType: item.itemType,
        itemId: item.itemId || 'temp_' + Date.now(),
        itemName: item.itemName,
        specification: item.specification,
        casNo: item.casNo,
        category: item.category,
        unit: item.unit,
        quantity: item.quantity,
        manufacturer: item.manufacturer,
        brand: item.brand,
        remark: item.remark,
      })),
      expectedDeliveryDate: formData.expectedDeliveryDate || undefined,
      purpose: formData.purpose,
      reason: formData.reason,
    }
    await mockCreatePurchaseRequest(submitData)
    showCreateModal.value = false
    fetchData()
    fetchStats()
  } catch (e: any) {
    alert(e.message || '创建失败')
  } finally {
    formLoading.value = false
  }
}

const handleEditSubmit = async () => {
  if (!currentRequest.value) return
  if (!formData.title.trim()) {
    alert('请填写申请标题')
    return
  }
  if (formData.items.length === 0) {
    alert('请添加至少一个采购物品')
    return
  }
  for (let i = 0; i < formData.items.length; i++) {
    const item = formData.items[i]
    if (!item.itemName.trim()) {
      alert(`请填写第 ${i + 1} 个物品的名称`)
      return
    }
    if (!item.specification.trim()) {
      alert(`请填写第 ${i + 1} 个物品的规格`)
      return
    }
    if (!item.unit.trim()) {
      alert(`请填写第 ${i + 1} 个物品的单位`)
      return
    }
    if (item.quantity <= 0) {
      alert(`第 ${i + 1} 个物品的数量必须大于0`)
      return
    }
  }
  if (!formData.purpose.trim()) {
    alert('请填写用途')
    return
  }
  if (!formData.reason.trim()) {
    alert('请填写申请原因')
    return
  }

  formLoading.value = true
  try {
    const submitData: Partial<PurchaseRequestFormData> = {
      title: formData.title,
      itemType: formData.itemType,
      items: formData.items.map(item => ({
        itemType: item.itemType,
        itemId: item.itemId || 'temp_' + Date.now(),
        itemName: item.itemName,
        specification: item.specification,
        casNo: item.casNo,
        category: item.category,
        unit: item.unit,
        quantity: item.quantity,
        manufacturer: item.manufacturer,
        brand: item.brand,
        remark: item.remark,
      })),
      expectedDeliveryDate: formData.expectedDeliveryDate || undefined,
      purpose: formData.purpose,
      reason: formData.reason,
    }
    await mockUpdatePurchaseRequest(currentRequest.value.id, submitData)
    showEditModal.value = false
    fetchData()
  } catch (e: any) {
    alert(e.message || '更新失败')
  } finally {
    formLoading.value = false
  }
}

const handleSubmit = async (request: PurchaseRequest) => {
  try {
    await mockSubmitPurchaseRequest(request.id)
    fetchData()
    fetchStats()
  } catch (e: any) {
    alert(e.message || '提交失败')
  }
}

const openApproveConfirm = (request: PurchaseRequest) => {
  currentRequest.value = request
  showApproveConfirm.value = true
}

const handleApprove = async () => {
  if (!currentRequest.value) return
  try {
    const result = await mockApprovePurchaseRequest(currentRequest.value.id)
    showApproveConfirm.value = false
    fetchData()
    fetchStats()
    if (result.order && confirm(`审批通过！已自动生成采购单 ${result.order.orderNo}，是否立即查看？`)) {
      router.push(`/purchases/orders/${result.order.id}?type=order`)
    }
  } catch (e: any) {
    alert(e.message || '审批失败')
  }
}

const openRejectDialog = (request: PurchaseRequest) => {
  currentRequest.value = request
  rejectForm.reason = ''
  showRejectDialog.value = true
}

const handleRejectSubmit = async () => {
  if (!currentRequest.value) return
  if (!rejectForm.reason.trim()) {
    alert('请填写驳回原因')
    return
  }
  rejectLoading.value = true
  try {
    await mockRejectPurchaseRequest(currentRequest.value.id, rejectForm.reason)
    showRejectDialog.value = false
    fetchData()
    fetchStats()
  } catch (e: any) {
    alert(e.message || '驳回失败')
  } finally {
    rejectLoading.value = false
  }
}

const openDeleteConfirm = (request: PurchaseRequest) => {
  currentRequest.value = request
  showDeleteConfirm.value = true
}

const handleDelete = async () => {
  if (!currentRequest.value) return
  try {
    await mockDeletePurchaseRequest(currentRequest.value.id)
    showDeleteConfirm.value = false
    fetchData()
    fetchStats()
  } catch (e: any) {
    alert(e.message || '删除失败')
  }
}

const goToDetail = (request: PurchaseRequest) => {
  router.push(`/purchases/${request.id}`)
}

const availableCategories = computed(() => {
  return formData.itemType === 'reagent' ? reagentCategories : consumableCategories
})

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
        <h1 class="text-2xl font-bold text-gray-900">采购申请</h1>
        <p class="mt-1 text-sm text-gray-500">管理试剂和耗材的采购申请流程</p>
      </div>
      <button
        v-if="permission.hasPermission('purchase:request:create')"
        class="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors shadow-md"
        @click="openCreateModal"
      >
        <Plus class="w-4 h-4" />
        <span>新建申请</span>
      </button>
    </div>

    <div class="grid grid-cols-6 gap-4">
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
            <p class="text-sm text-gray-500">采购中</p>
            <p class="mt-1 text-2xl font-bold text-primary-600">{{ stats?.purchasing || 0 }}</p>
          </div>
          <div class="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center">
            <TrendingUp class="w-6 h-6 text-primary-600" />
          </div>
        </div>
      </div>
      <div class="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">部分到货</p>
            <p class="mt-1 text-2xl font-bold text-info-600">{{ stats?.partialReceived || 0 }}</p>
          </div>
          <div class="w-12 h-12 rounded-xl bg-info-50 flex items-center justify-center">
            <Package class="w-6 h-6 text-info-600" />
          </div>
        </div>
      </div>
      <div class="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">已完成</p>
            <p class="mt-1 text-2xl font-bold text-success-600">{{ stats?.completed || 0 }}</p>
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
      <DataTableFilter
        :filter-fields="filterFields"
        :saved-filters="savedFilters"
        v-model="filters"
        keyword-placeholder="搜索申请标题、申请单号、申请人、物品名称..."
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
              <th class="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">申请信息</th>
              <th class="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">类型</th>
              <th class="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">采购物品</th>
              <th class="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">数量</th>
              <th class="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">申请人</th>
              <th class="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">状态</th>
              <th class="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">申请时间</th>
              <th class="px-6 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-if="loading" class="h-48">
              <td colspan="8" class="text-center text-gray-400">加载中...</td>
            </tr>
            <tr v-else-if="!data?.list.length" class="h-48">
              <td colspan="8" class="text-center text-gray-400">暂无采购申请</td>
            </tr>
            <tr
              v-for="item in data?.list"
              :key="item.id"
              class="hover:bg-gray-50/50 transition-colors cursor-pointer"
              @click="goToDetail(item)"
            >
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
                    <ShoppingCart class="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <p class="font-medium text-gray-900">{{ item.title }}</p>
                    <p class="text-sm text-gray-500">{{ item.requestNo }}</p>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4">
                <span class="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                  {{ purchaseItemTypeLabels[item.itemType] }}
                </span>
              </td>
              <td class="px-6 py-4">
                <div class="max-w-xs">
                  <p class="text-sm font-medium text-gray-900 truncate">
                    {{ item.items.map(i => i.itemName).join('、') }}
                  </p>
                  <p v-if="item.items.length > 1" class="text-xs text-gray-500">
                    共 {{ item.items.length }} 种物品
                  </p>
                </div>
              </td>
              <td class="px-6 py-4">
                <span class="text-sm font-medium text-gray-900">{{ item.totalQuantity }}</span>
                <span class="text-sm text-gray-500"> {{ item.items[0]?.unit || '' }}</span>
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
                  :class="purchaseRequestStatusColors[item.status]"
                >
                  {{ purchaseRequestStatusLabels[item.status] }}
                </span>
              </td>
              <td class="px-6 py-4 text-sm text-gray-500">
                {{ item.submitTime || item.createdAt }}
              </td>
              <td class="px-6 py-4 text-right" @click.stop>
                <div class="flex items-center justify-end gap-1">
                  <button
                    class="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                    title="查看详情"
                    @click="goToDetail(item)"
                  >
                    <Eye class="w-4 h-4" />
                  </button>
                  <template v-if="['draft', 'rejected'].includes(item.status) && permission.hasPermission('purchase:request:edit')">
                    <button
                      class="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                      title="编辑"
                      @click="openEditModal(item)"
                    >
                      <Edit class="w-4 h-4" />
                    </button>
                  </template>
                  <template v-if="['draft', 'rejected'].includes(item.status) && permission.hasPermission('purchase:request:submit')">
                    <button
                      class="p-2 text-gray-400 hover:text-success-600 hover:bg-success-50 rounded-lg transition-colors"
                      title="提交审批"
                      @click="handleSubmit(item)"
                    >
                      <Send class="w-4 h-4" />
                    </button>
                  </template>
                  <template v-if="item.status === 'pending' && permission.hasPermission('purchase:request:approve')">
                    <button
                      class="p-2 text-gray-400 hover:text-success-600 hover:bg-success-50 rounded-lg transition-colors"
                      title="审批通过"
                      @click="openApproveConfirm(item)"
                    >
                      <Check class="w-4 h-4" />
                    </button>
                    <button
                      class="p-2 text-gray-400 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
                      title="驳回"
                      @click="openRejectDialog(item)"
                    >
                      <Ban class="w-4 h-4" />
                    </button>
                  </template>
                  <template v-if="['draft', 'rejected'].includes(item.status) && permission.hasPermission('purchase:request:delete')">
                    <button
                      class="p-2 text-gray-400 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
                      title="删除"
                      @click="openDeleteConfirm(item)"
                    >
                      <Trash2 class="w-4 h-4" />
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
      v-if="showCreateModal || showEditModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      @click.self="showCreateModal = showEditModal = false"
    >
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <h3 class="text-lg font-semibold text-gray-900">
            {{ showCreateModal ? '新建采购申请' : '编辑采购申请' }}
          </h3>
          <button
            class="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            @click="showCreateModal = showEditModal = false"
          >
            <X class="w-5 h-5 text-gray-400" />
          </button>
        </div>
        <div class="p-6 space-y-5 overflow-y-auto flex-1">
          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-700">申请标题 <span class="text-danger-500">*</span></label>
            <input
              v-model="formData.title"
              type="text"
              class="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              placeholder="请输入申请标题"
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <label class="block text-sm font-medium text-gray-700">物品类型 <span class="text-danger-500">*</span></label>
              <select
                v-model="formData.itemType"
                class="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              >
                <option
                  v-for="[value, label] in Object.entries(purchaseItemTypeLabels)"
                  :key="value"
                  :value="value"
                >
                  {{ label }}
                </option>
              </select>
            </div>
            <div class="space-y-2">
              <label class="block text-sm font-medium text-gray-700">期望到货日期</label>
              <input
                v-model="formData.expectedDeliveryDate"
                type="date"
                class="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              />
            </div>
          </div>

          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <label class="block text-sm font-medium text-gray-700">采购物品 <span class="text-danger-500">*</span></label>
              <button
                type="button"
                class="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700"
                @click="addFormItem"
              >
                <Plus class="w-4 h-4" />
                添加物品
              </button>
            </div>
            <div
              v-for="(item, index) in formData.items"
              :key="index"
              class="p-4 bg-gray-50 rounded-xl space-y-3"
            >
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium text-gray-700">物品 {{ index + 1 }}</span>
                <button
                  v-if="formData.items.length > 1"
                  type="button"
                  class="text-gray-400 hover:text-danger-600 transition-colors"
                  @click="removeFormItem(index)"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div class="space-y-1">
                  <label class="text-xs text-gray-500">名称 <span class="text-danger-500">*</span></label>
                  <input
                    v-model="item.itemName"
                    type="text"
                    class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-sm"
                    placeholder="请输入物品名称"
                  />
                </div>
                <div class="space-y-1">
                  <label class="text-xs text-gray-500">规格 <span class="text-danger-500">*</span></label>
                  <input
                    v-model="item.specification"
                    type="text"
                    class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-sm"
                    placeholder="如：100mg、500ml"
                  />
                </div>
                <div class="space-y-1">
                  <label class="text-xs text-gray-500">单位 <span class="text-danger-500">*</span></label>
                  <input
                    v-model="item.unit"
                    type="text"
                    class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-sm"
                    placeholder="如：瓶、盒、支"
                  />
                </div>
                <div class="space-y-1">
                  <label class="text-xs text-gray-500">数量 <span class="text-danger-500">*</span></label>
                  <input
                    v-model.number="item.quantity"
                    type="number"
                    min="1"
                    class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-sm"
                  />
                </div>
                <div class="space-y-1">
                  <label class="text-xs text-gray-500">品牌</label>
                  <select
                    v-model="item.brand"
                    class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-sm"
                  >
                    <option value="">请选择</option>
                    <option v-for="brand in commonBrands" :key="brand" :value="brand">{{ brand }}</option>
                  </select>
                </div>
                <div class="space-y-1">
                  <label class="text-xs text-gray-500">分类</label>
                  <select
                    v-model="item.category"
                    class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-sm"
                  >
                    <option value="">请选择</option>
                    <option v-for="cat in availableCategories" :key="cat" :value="cat">{{ cat }}</option>
                  </select>
                </div>
                <div v-if="formData.itemType === 'reagent'" class="space-y-1">
                  <label class="text-xs text-gray-500">CAS号</label>
                  <input
                    v-model="item.casNo"
                    type="text"
                    class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-sm"
                    placeholder="如：9002-07-7"
                  />
                </div>
                <div class="space-y-1">
                  <label class="text-xs text-gray-500">生产厂家</label>
                  <input
                    v-model="item.manufacturer"
                    type="text"
                    class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-sm"
                    placeholder="请输入生产厂家"
                  />
                </div>
              </div>
              <div class="space-y-1">
                <label class="text-xs text-gray-500">备注</label>
                <textarea
                  v-model="item.remark"
                  class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-sm resize-none"
                  rows="2"
                  placeholder="可选"
                />
              </div>
            </div>
          </div>

          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-700">用途 <span class="text-danger-500">*</span></label>
            <input
              v-model="formData.purpose"
              type="text"
              class="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              placeholder="请输入用途，如：细胞培养实验"
            />
          </div>

          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-700">申请原因 <span class="text-danger-500">*</span></label>
            <textarea
              v-model="formData.reason"
              class="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 resize-none"
              rows="3"
              placeholder="请详细说明申请原因"
            />
          </div>
        </div>
        <div class="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 flex-shrink-0">
          <button
            class="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors"
            @click="showCreateModal = showEditModal = false"
          >
            取消
          </button>
          <button
            class="px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors flex items-center gap-2 disabled:opacity-50"
            :disabled="formLoading"
            @click="showCreateModal ? handleCreateSubmit() : handleEditSubmit()"
          >
            {{ formLoading ? '提交中...' : '保存' }}
          </button>
        </div>
      </div>
    </div>

    <ConfirmDialog
      v-model:visible="showApproveConfirm"
      title="确认审批通过"
      confirm-text="确认通过"
      confirm-type="success"
      @confirm="handleApprove"
    >
      <p class="text-gray-600">确定要通过此采购申请吗？</p>
    </ConfirmDialog>

    <div
      v-if="showRejectDialog"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      @click.self="showRejectDialog = false"
    >
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 class="text-lg font-semibold text-gray-900">驳回申请</h3>
          <button
            class="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            @click="showRejectDialog = false"
          >
            <X class="w-5 h-5 text-gray-400" />
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

    <ConfirmDialog
      v-model:visible="showDeleteConfirm"
      title="确认删除"
      confirm-text="确认删除"
      confirm-type="danger"
      @confirm="handleDelete"
    >
      <p class="text-gray-600">确定要删除此采购申请吗？此操作不可恢复。</p>
    </ConfirmDialog>
  </div>
</template>
