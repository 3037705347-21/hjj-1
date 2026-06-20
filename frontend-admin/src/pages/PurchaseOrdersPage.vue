<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  Package,
  Search,
  Plus,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit,
  Play,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  User,
  X,
  TrendingUp,
  Truck,
  Check,
  Undo2,
  ShoppingCart,
} from 'lucide-vue-next'
import DataTableFilter from '@/components/DataTableFilter.vue'
import type { FilterField } from '@/components/DataTableFilter.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import type { PageResult } from '@/types/common'
import { usePermission } from '@/composables/usePermission'
import type {
  PurchaseOrder,
  PurchaseFilterParams,
  PurchaseOrderFormData,
} from '@/types/purchase'
import {
  purchaseOrderStatusLabels,
  purchaseOrderStatusColors,
  purchaseItemTypeLabels,
} from '@/types/purchase'
import {
  mockGetPurchaseOrders,
  mockGetPurchaseOrder,
  mockUpdatePurchaseOrder,
  mockStartPurchase,
  mockCompletePurchaseOrder,
  mockGetPurchaseStats,
} from '@/mock/purchases'
import { mockGetAllSuppliers } from '@/mock/suppliers'
import type { Supplier } from '@/types/supplier'
import { useSavedFilters } from '@/composables/useSavedFilters'
import type { SavedFilter } from '@/composables/useSavedFilters'

const router = useRouter()
const permission = usePermission()

const loading = ref(false)
const data = ref<PageResult<PurchaseOrder> | null>(null)
const stats = ref<{
  total: number
  pending: number
  purchasing: number
  partialReceived: number
  fullyReceived: number
  completed: number
  returned: number
} | null>(null)

const filters = reactive<PurchaseFilterParams & { createdAt: [string, string] }>({
  keyword: '',
  status: '',
  itemType: '',
  createdAt: ['', ''],
})

const { savedFilters, addFilter, deleteFilter, loadFilters } = useSavedFilters('purchase_order_saved_filters')

const filterFields: FilterField[] = [
  { key: 'status', label: '状态', type: 'select', options: Object.entries(purchaseOrderStatusLabels).map(([value, label]) => ({ label, value })) },
  { key: 'itemType', label: '物品类型', type: 'select', options: Object.entries(purchaseItemTypeLabels).map(([value, label]) => ({ label, value })) },
  { key: 'createdAt', label: '创建时间', type: 'date-range' },
]

const pagination = reactive({
  page: 1,
  pageSize: 10,
})

const showEditModal = ref(false)
const showDetailModal = ref(false)
const showStartConfirm = ref(false)
const showCompleteConfirm = ref(false)

const currentOrder = ref<PurchaseOrder | null>(null)
const formLoading = ref(false)
const supplierList = ref<Supplier[]>([])

const formData = reactive<PurchaseOrderFormData>({
  title: '',
  supplierId: undefined,
  supplierName: undefined,
  purchaserName: '',
  orderDate: '',
  expectedDeliveryDate: '',
  remark: '',
})

const fetchSuppliers = async () => {
  try {
    supplierList.value = await mockGetAllSuppliers()
  } catch (e) {
    console.error('Failed to fetch suppliers', e)
  }
}

const handleSupplierChange = (supplierId: string) => {
  const supplier = supplierList.value.find(s => s.id === supplierId)
  if (supplier) {
    formData.supplierId = supplier.id
    formData.supplierName = supplier.name
  } else {
    formData.supplierId = undefined
    formData.supplierName = undefined
  }
}

const fetchData = async () => {
  loading.value = true
  try {
    const params: PurchaseFilterParams = {
      keyword: filters.keyword || undefined,
      status: filters.status || undefined,
      itemType: filters.itemType || undefined,
      startTime: filters.createdAt?.[0] || undefined,
      endTime: filters.createdAt?.[1] || undefined,
    }
    data.value = await mockGetPurchaseOrders(pagination.page, pagination.pageSize, params)
  } finally {
    loading.value = false
  }
}

const fetchStats = async () => {
  try {
    const s = await mockGetPurchaseStats()
    stats.value = {
      total: s.totalOrders,
      pending: s.pendingOrders,
      purchasing: s.purchasingOrders,
      partialReceived: s.partialReceivedOrders,
      fullyReceived: s.fullyReceivedOrders,
      completed: s.completedOrders,
      returned: s.returnedOrders,
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

const openEditModal = (order: PurchaseOrder) => {
  currentOrder.value = order
  formData.title = order.title
  formData.supplierId = order.supplierId
  formData.supplierName = order.supplierName
  formData.purchaserName = order.purchaserName || ''
  formData.orderDate = order.orderDate || ''
  formData.expectedDeliveryDate = order.expectedDeliveryDate || ''
  formData.remark = order.remark || ''
  showEditModal.value = true
}

const openDetailModal = async (order: PurchaseOrder) => {
  currentOrder.value = order
  showDetailModal.value = true
}

const handleEditSubmit = async () => {
  if (!currentOrder.value) return
  if (!formData.title.trim()) {
    alert('请填写采购单标题')
    return
  }

  formLoading.value = true
  try {
    await mockUpdatePurchaseOrder(currentOrder.value.id, { ...formData })
    showEditModal.value = false
    fetchData()
  } catch (e: any) {
    alert(e.message || '更新失败')
  } finally {
    formLoading.value = false
  }
}

const openStartConfirm = (order: PurchaseOrder) => {
  currentOrder.value = order
  showStartConfirm.value = true
}

const handleStart = async () => {
  if (!currentOrder.value) return
  try {
    await mockStartPurchase(currentOrder.value.id)
    showStartConfirm.value = false
    fetchData()
    fetchStats()
  } catch (e: any) {
    alert(e.message || '操作失败')
  }
}

const openCompleteConfirm = (order: PurchaseOrder) => {
  currentOrder.value = order
  showCompleteConfirm.value = true
}

const handleComplete = async () => {
  if (!currentOrder.value) return
  try {
    await mockCompletePurchaseOrder(currentOrder.value.id)
    showCompleteConfirm.value = false
    fetchData()
    fetchStats()
  } catch (e: any) {
    alert(e.message || '操作失败')
  }
}

const goToDetail = (order: PurchaseOrder) => {
  router.push(`/purchases/orders/${order.id}`)
}

onMounted(() => {
  loadFilters()
  fetchData()
  fetchStats()
  fetchSuppliers()
})
</script>

<template>
  <div class="p-6 space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">采购单</h1>
        <p class="mt-1 text-sm text-gray-500">管理采购单的执行、到货和完成流程</p>
      </div>
    </div>

    <div class="grid grid-cols-7 gap-4">
      <div class="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">全部采购单</p>
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
            <p class="text-sm text-gray-500">待采购</p>
            <p class="mt-1 text-2xl font-bold text-gray-600">{{ stats?.pending || 0 }}</p>
          </div>
          <div class="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center">
            <Clock class="w-6 h-6 text-gray-500" />
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
            <p class="mt-1 text-2xl font-bold text-warning-600">{{ stats?.partialReceived || 0 }}</p>
          </div>
          <div class="w-12 h-12 rounded-xl bg-warning-50 flex items-center justify-center">
            <Package class="w-6 h-6 text-warning-600" />
          </div>
        </div>
      </div>
      <div class="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">全部到货</p>
            <p class="mt-1 text-2xl font-bold text-info-600">{{ stats?.fullyReceived || 0 }}</p>
          </div>
          <div class="w-12 h-12 rounded-xl bg-info-50 flex items-center justify-center">
            <Truck class="w-6 h-6 text-info-600" />
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
            <p class="text-sm text-gray-500">已退货</p>
            <p class="mt-1 text-2xl font-bold text-danger-600">{{ stats?.returned || 0 }}</p>
          </div>
          <div class="w-12 h-12 rounded-xl bg-danger-50 flex items-center justify-center">
            <Undo2 class="w-6 h-6 text-danger-600" />
          </div>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <DataTableFilter
        :filter-fields="filterFields"
        :saved-filters="savedFilters"
        v-model="filters"
        keyword-placeholder="搜索采购单标题、单号、供应商、关联申请、物品名称..."
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
              <th class="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">采购单信息</th>
              <th class="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">关联申请</th>
              <th class="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">供应商</th>
              <th class="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">采购员</th>
              <th class="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">到货进度</th>
              <th class="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">状态</th>
              <th class="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">创建时间</th>
              <th class="px-6 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-if="loading" class="h-48">
              <td colspan="8" class="text-center text-gray-400">加载中...</td>
            </tr>
            <tr v-else-if="!data?.list.length" class="h-48">
              <td colspan="8" class="text-center text-gray-400">暂无采购单</td>
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
                    <p class="text-sm text-gray-500">{{ item.orderNo }}</p>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4">
                <span class="text-sm text-gray-600">{{ item.requestNo }}</span>
              </td>
              <td class="px-6 py-4">
                <span class="text-sm text-gray-600">{{ item.supplierName || '-' }}</span>
              </td>
              <td class="px-6 py-4">
                <div class="flex items-center gap-2">
                  <div class="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                    <User class="w-4 h-4 text-gray-500" />
                  </div>
                  <span class="text-sm text-gray-700">{{ item.purchaserName || '-' }}</span>
                </div>
              </td>
              <td class="px-6 py-4">
                <div class="flex items-center gap-2">
                  <div class="flex-1 max-w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      class="h-full bg-success-500 rounded-full transition-all"
                      :style="{ width: `${item.totalQuantity > 0 ? (item.receivedQuantity / item.totalQuantity) * 100 : 0}%` }"
                    />
                  </div>
                  <span class="text-sm text-gray-600 whitespace-nowrap">
                    {{ item.receivedQuantity }}/{{ item.totalQuantity }}
                  </span>
                </div>
              </td>
              <td class="px-6 py-4">
                <span
                  class="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full"
                  :class="purchaseOrderStatusColors[item.status]"
                >
                  {{ purchaseOrderStatusLabels[item.status] }}
                </span>
              </td>
              <td class="px-6 py-4 text-sm text-gray-500">
                {{ item.createdAt }}
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
                  <template v-if="['pending', 'purchasing'].includes(item.status) && permission.hasPermission('purchase:order:edit')">
                    <button
                      class="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                      title="编辑"
                      @click="openEditModal(item)"
                    >
                      <Edit class="w-4 h-4" />
                    </button>
                  </template>
                  <template v-if="item.status === 'pending' && permission.hasPermission('purchase:order:create')">
                    <button
                      class="p-2 text-gray-400 hover:text-success-600 hover:bg-success-50 rounded-lg transition-colors"
                      title="开始采购"
                      @click="openStartConfirm(item)"
                    >
                      <Play class="w-4 h-4" />
                    </button>
                  </template>
                  <template v-if="item.status === 'fully_received' && permission.hasPermission('purchase:order:complete')">
                    <button
                      class="p-2 text-gray-400 hover:text-success-600 hover:bg-success-50 rounded-lg transition-colors"
                      title="完成采购"
                      @click="openCompleteConfirm(item)"
                    >
                      <Check class="w-4 h-4" />
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
      v-if="showEditModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      @click.self="showEditModal = false"
    >
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 class="text-lg font-semibold text-gray-900">编辑采购单</h3>
          <button
            class="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            @click="showEditModal = false"
          >
            <X class="w-5 h-5 text-gray-400" />
          </button>
        </div>
        <div class="p-6 space-y-4">
          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-700">采购单标题 <span class="text-danger-500">*</span></label>
            <input
              v-model="formData.title"
              type="text"
              class="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              placeholder="请输入采购单标题"
            />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <label class="block text-sm font-medium text-gray-700">供应商</label>
              <select
                :value="formData.supplierId"
                @change="handleSupplierChange(($event.target as HTMLSelectElement).value)"
                class="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              >
                <option value="">请选择供应商</option>
                <option
                  v-for="supplier in supplierList.filter(s => s.status === 'active')"
                  :key="supplier.id"
                  :value="supplier.id"
                >
                  {{ supplier.name }}
                </option>
              </select>
            </div>
            <div class="space-y-2">
              <label class="block text-sm font-medium text-gray-700">采购员</label>
              <input
                v-model="formData.purchaserName"
                type="text"
                class="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                placeholder="请输入采购员姓名"
              />
            </div>
            <div class="space-y-2">
              <label class="block text-sm font-medium text-gray-700">下单日期</label>
              <input
                v-model="formData.orderDate"
                type="date"
                class="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              />
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
          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-700">备注</label>
            <textarea
              v-model="formData.remark"
              class="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 resize-none"
              rows="3"
              placeholder="请输入备注信息"
            />
          </div>
          <div class="flex justify-end gap-3 pt-2">
            <button
              class="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors"
              @click="showEditModal = false"
            >
              取消
            </button>
            <button
              class="px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors flex items-center gap-2 disabled:opacity-50"
              :disabled="formLoading"
              @click="handleEditSubmit"
            >
              {{ formLoading ? '保存中...' : '保存' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <ConfirmDialog
      v-model:visible="showStartConfirm"
      title="确认开始采购"
      confirm-text="确认开始"
      confirm-type="primary"
      @confirm="handleStart"
    >
      <p class="text-gray-600">确定要开始此采购单的采购流程吗？</p>
    </ConfirmDialog>

    <ConfirmDialog
      v-model:visible="showCompleteConfirm"
      title="确认完成采购"
      confirm-text="确认完成"
      confirm-type="success"
      @confirm="handleComplete"
    >
      <p class="text-gray-600">确定要完成此采购单吗？完成后将无法再进行到货登记。</p>
    </ConfirmDialog>
  </div>
</template>
