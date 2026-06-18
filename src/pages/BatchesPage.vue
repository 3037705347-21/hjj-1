<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  Plus,
  Search,
  X,
  Eye,
  ArrowDownCircle,
  ArrowUpCircle,
  Calendar,
  MapPin,
  Package,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  FileText,
} from 'lucide-vue-next'
import {
  mockGetBatches,
  mockCreateBatch,
  mockBatchOutbound,
  mockGetBatch,
} from '@/mock/batches'
import { mockGetAllReagents } from '@/mock/reagents'
import type {
  ReagentBatch,
  BatchOperation,
  BatchFormData,
  OutboundFormData,
} from '@/types/batch'
import type { PageResult } from '@/types/common'
import type { Reagent } from '@/types/reagent'
import { batchStatusLabels, batchStatusColors } from '@/types/batch'
import { formatDate, getExpiryDays } from '@/utils/date'

const route = useRoute()
const loading = ref(false)
const data = ref<PageResult<ReagentBatch> | null>(null)
const reagents = ref<Reagent[]>([])

const searchForm = reactive({
  keyword: '',
  status: '',
  reagentId: '',
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
})

const showCreateModal = ref(false)
const createLoading = ref(false)
const createForm = reactive<BatchFormData>({
  reagentId: '',
  batchNumber: '',
  productionDate: '',
  expiryDate: '',
  initialQuantity: 0,
  storageLocation: '',
  receivedDate: formatDate(new Date()),
  remark: '',
})

const showDetailModal = ref(false)
const detailLoading = ref(false)
const currentBatch = ref<(ReagentBatch & { operations: BatchOperation[] }) | null>(null)

const showOutboundModal = ref(false)
const outboundLoading = ref(false)
const outboundForm = reactive<OutboundFormData>({
  quantity: 0,
  purpose: '',
})
const outboundBatchId = ref('')

const fetchData = async () => {
  loading.value = true
  try {
    const result = await mockGetBatches(
      pagination.page,
      pagination.pageSize,
      searchForm.reagentId || undefined,
      searchForm.status || undefined
    )
    data.value = result
  } finally {
    loading.value = false
  }
}

const fetchReagents = async () => {
  reagents.value = await mockGetAllReagents()
}

const handleSearch = () => {
  pagination.page = 1
  fetchData()
}

const handleReset = () => {
  searchForm.keyword = ''
  searchForm.status = ''
  searchForm.reagentId = ''
  pagination.page = 1
  fetchData()
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
  Object.assign(createForm, {
    reagentId: searchForm.reagentId || (reagents.value[0]?.id || ''),
    batchNumber: '',
    productionDate: '',
    expiryDate: '',
    initialQuantity: 0,
    storageLocation: '',
    receivedDate: formatDate(new Date()),
    remark: '',
  })
  showCreateModal.value = true
}

const handleCreateSubmit = async () => {
  if (!createForm.reagentId) {
    alert('请选择试剂')
    return
  }
  if (!createForm.batchNumber.trim()) {
    alert('请输入批次号')
    return
  }
  if (!createForm.productionDate) {
    alert('请选择生产日期')
    return
  }
  if (!createForm.expiryDate) {
    alert('请选择有效期')
    return
  }
  if (createForm.initialQuantity <= 0) {
    alert('入库数量必须大于0')
    return
  }
  if (!createForm.storageLocation.trim()) {
    alert('请输入存放位置')
    return
  }
  
  createLoading.value = true
  try {
    await mockCreateBatch(createForm)
    showCreateModal.value = false
    fetchData()
  } catch (e: any) {
    alert(e.message || '创建失败')
  } finally {
    createLoading.value = false
  }
}

const openDetailModal = async (id: string) => {
  detailLoading.value = true
  showDetailModal.value = true
  try {
    const batch = await mockGetBatch(id)
    currentBatch.value = batch
  } finally {
    detailLoading.value = false
  }
}

const openOutboundModal = (id: string) => {
  outboundBatchId.value = id
  outboundForm.quantity = 0
  outboundForm.purpose = ''
  showOutboundModal.value = true
}

const handleOutboundSubmit = async () => {
  if (outboundForm.quantity <= 0) {
    alert('出库数量必须大于0')
    return
  }
  if (!outboundForm.purpose.trim()) {
    alert('请输入用途')
    return
  }
  
  outboundLoading.value = true
  try {
    await mockBatchOutbound(outboundBatchId.value, outboundForm)
    showOutboundModal.value = false
    fetchData()
    if (currentBatch.value && currentBatch.value.id === outboundBatchId.value) {
      const batch = await mockGetBatch(outboundBatchId.value)
      currentBatch.value = batch
    }
  } catch (e: any) {
    alert(e.message || '出库失败')
  } finally {
    outboundLoading.value = false
  }
}

const getDaysLabel = (batch: ReagentBatch) => {
  const days = getExpiryDays(batch.expiryDate)
  if (days < 0) {
    return `已过期 ${Math.abs(days)} 天`
  }
  if (days === 0) {
    return '今天到期'
  }
  return `剩余 ${days} 天`
}

const getUsagePercentage = (batch: ReagentBatch) => {
  if (batch.initialQuantity <= 0) return 0
  return ((batch.initialQuantity - batch.remainingQuantity) / batch.initialQuantity) * 100
}

const filterByReagent = (reagentId: string) => {
  searchForm.reagentId = reagentId
  pagination.page = 1
  fetchData()
}

watch(
  () => route.query.reagentId,
  (val) => {
    if (val && typeof val === 'string') {
      searchForm.reagentId = val
    }
  },
  { immediate: true }
)

onMounted(() => {
  fetchReagents().then(() => {
    fetchData()
  })
})
</script>

<template>
  <div class="space-y-6">
    <div class="bg-white rounded-xl shadow-card p-6">
      <div class="flex flex-wrap items-center gap-4">
        <div class="flex-1 min-w-[200px]">
          <div class="relative">
            <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search class="w-4 h-4 text-gray-400" />
            </div>
            <input
              v-model="searchForm.keyword"
              type="text"
              placeholder="搜索批次号、试剂名称..."
              class="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
              @keyup.enter="handleSearch"
            />
          </div>
        </div>
        
        <select
          v-model="searchForm.reagentId"
          class="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-white min-w-[180px]"
        >
          <option value="">全部试剂</option>
          <option v-for="r in reagents" :key="r.id" :value="r.id">
            {{ r.name }}
          </option>
        </select>
        
        <select
          v-model="searchForm.status"
          class="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-white"
        >
          <option value="">全部状态</option>
          <option value="normal">正常</option>
          <option value="warning">即将过期</option>
          <option value="expired">已过期</option>
          <option value="exhausted">已耗尽</option>
        </select>
        
        <button
          @click="handleSearch"
          class="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
        >
          搜索
        </button>
        
        <button
          @click="handleReset"
          class="px-5 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-lg transition-colors"
        >
          重置
        </button>
        
        <button
          @click="openCreateModal"
          class="px-5 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded-lg transition-all flex items-center gap-2 shadow-md shadow-primary-500/20"
        >
          <Plus class="w-4 h-4" />
          录入批次
        </button>
      </div>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div
        v-for="r in reagents.slice(0, 4)"
        :key="r.id"
        @click="filterByReagent(r.id)"
        class="bg-white rounded-xl p-4 shadow-card cursor-pointer hover:shadow-card-hover transition-all duration-200"
        :class="{ 'ring-2 ring-primary-500': searchForm.reagentId === r.id }"
      >
        <div class="text-sm text-gray-500 mb-1">{{ r.name }}</div>
        <div class="text-lg font-semibold text-gray-800">
          {{ data?.list.filter(b => b.reagentId === r.id).length || 0 }} 批次
        </div>
      </div>
    </div>

    <div class="bg-white rounded-xl shadow-card overflow-hidden">
      <div v-if="loading" class="p-16 flex items-center justify-center">
        <div class="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full"></div>
      </div>
      
      <div v-else>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50 border-b border-gray-100">
              <tr>
                <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  试剂名称
                </th>
                <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  批次号
                </th>
                <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  有效期
                </th>
                <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  库存
                </th>
                <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  存放位置
                </th>
                <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th class="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr
                v-for="batch in data?.list"
                :key="batch.id"
                class="hover:bg-gray-50 transition-colors cursor-pointer"
                :class="{
                  'bg-warning-50/30': batch.status === 'warning',
                  'bg-danger-50/20': batch.status === 'expired',
                }"
                @click="openDetailModal(batch.id)"
              >
                <td class="px-6 py-4">
                  <div class="font-medium text-gray-900">{{ batch.reagentName }}</div>
                </td>
                <td class="px-6 py-4 font-mono text-sm text-gray-600">
                  {{ batch.batchNumber }}
                </td>
                <td class="px-6 py-4">
                  <div class="text-gray-900">{{ formatDate(batch.expiryDate) }}</div>
                  <div
                    class="text-xs mt-0.5 flex items-center gap-1"
                    :class="{
                      'text-danger-600': batch.status === 'expired',
                      'text-warning-600': batch.status === 'warning',
                      'text-gray-400': batch.status === 'normal' || batch.status === 'exhausted',
                    }"
                  >
                    <AlertTriangle v-if="batch.status === 'warning' || batch.status === 'expired'" class="w-3 h-3" />
                    {{ getDaysLabel(batch) }}
                  </div>
                </td>
                <td class="px-6 py-4">
                  <div class="flex items-center gap-3">
                    <div class="w-24">
                      <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          class="h-full rounded-full transition-all"
                          :class="{
                            'bg-success-500': getUsagePercentage(batch) < 50,
                            'bg-warning-500': getUsagePercentage(batch) >= 50 && getUsagePercentage(batch) < 80,
                            'bg-danger-500': getUsagePercentage(batch) >= 80,
                          }"
                          :style="{ width: `${100 - getUsagePercentage(batch)}%` }"
                        ></div>
                      </div>
                    </div>
                    <div class="text-sm">
                      <span class="font-medium text-gray-900">{{ batch.remainingQuantity }}</span>
                      <span class="text-gray-400"> / {{ batch.initialQuantity }} {{ batch.unit }}</span>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4">
                  <div class="flex items-center gap-1 text-sm text-gray-600">
                    <MapPin class="w-3.5 h-3.5 text-gray-400" />
                    {{ batch.storageLocation }}
                  </div>
                </td>
                <td class="px-6 py-4">
                  <span
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                    :class="batchStatusColors[batch.status]"
                  >
                    {{ batchStatusLabels[batch.status] }}
                  </span>
                </td>
                <td class="px-6 py-4" @click.stop>
                  <div class="flex items-center justify-center gap-2">
                    <button
                      @click="openDetailModal(batch.id)"
                      class="p-1.5 text-primary-600 hover:bg-primary-50 rounded transition-colors"
                      title="查看详情"
                    >
                      <Eye class="w-4 h-4" />
                    </button>
                    <button
                      v-if="batch.status !== 'expired' && batch.status !== 'exhausted'"
                      @click="openOutboundModal(batch.id)"
                      class="p-1.5 text-success-600 hover:bg-success-50 rounded transition-colors"
                      title="出库"
                    >
                      <ArrowDownCircle class="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div v-if="data?.list.length === 0" class="p-16 text-center">
          <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <Package class="w-8 h-8 text-gray-300" />
          </div>
          <p class="text-gray-400">暂无批次数据</p>
        </div>
        
        <div v-if="data && data.total > 0" class="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
          <div class="text-sm text-gray-500">
            共 {{ data.total }} 条记录，第 {{ pagination.page }} / {{ totalPages }} 页
          </div>
          <div class="flex items-center gap-2">
            <button
              @click="handlePageChange(pagination.page - 1)"
              :disabled="pagination.page <= 1"
              class="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft class="w-4 h-4" />
            </button>
            <button
              v-for="p in Math.min(5, totalPages)"
              :key="p"
              @click="handlePageChange(p + Math.max(0, pagination.page - 3))"
              class="min-w-9 h-9 px-3 rounded-lg text-sm transition-colors"
              :class="[
                pagination.page === p + Math.max(0, pagination.page - 3)
                  ? 'bg-primary-600 text-white'
                  : 'border border-gray-200 hover:bg-gray-50 text-gray-600',
              ]"
            >
              {{ p + Math.max(0, pagination.page - 3) }}
            </button>
            <button
              @click="handlePageChange(pagination.page + 1)"
              :disabled="pagination.page >= totalPages"
              class="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="showCreateModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      @click.self="showCreateModal = false"
    >
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 class="text-lg font-semibold text-gray-800">录入新批次</h3>
          <button
            @click="showCreateModal = false"
            class="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X class="w-5 h-5 text-gray-400" />
          </button>
        </div>
        
        <div class="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">
              试剂 <span class="text-red-500">*</span>
            </label>
            <select
              v-model="createForm.reagentId"
              class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-white"
            >
              <option value="">请选择试剂</option>
              <option v-for="r in reagents" :key="r.id" :value="r.id">
                {{ r.name }} ({{ r.specification }})
              </option>
            </select>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">
              批次号 <span class="text-red-500">*</span>
            </label>
            <input
              v-model="createForm.batchNumber"
              type="text"
              class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-mono"
              placeholder="如：BSA20250101"
            />
          </div>
          
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">
                生产日期 <span class="text-red-500">*</span>
              </label>
              <input
                v-model="createForm.productionDate"
                type="date"
                class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">
                有效期至 <span class="text-red-500">*</span>
              </label>
              <input
                v-model="createForm.expiryDate"
                type="date"
                class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
              />
            </div>
          </div>
          
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">
                入库数量 <span class="text-red-500">*</span>
              </label>
              <input
                v-model.number="createForm.initialQuantity"
                type="number"
                min="0"
                step="0.01"
                class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                placeholder="0"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">
                入库日期
              </label>
              <input
                v-model="createForm.receivedDate"
                type="date"
                class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
              />
            </div>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">
              存放位置 <span class="text-red-500">*</span>
            </label>
            <input
              v-model="createForm.storageLocation"
              type="text"
              class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
              placeholder="如：A-01-03"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">
              备注
            </label>
            <textarea
              v-model="createForm.remark"
              rows="2"
              class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all resize-none"
              placeholder="可选备注信息"
            ></textarea>
          </div>
        </div>
        
        <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
          <button
            @click="showCreateModal = false"
            class="px-5 py-2.5 border border-gray-200 hover:bg-gray-100 text-gray-600 rounded-lg transition-colors"
          >
            取消
          </button>
          <button
            @click="handleCreateSubmit"
            :disabled="createLoading"
            class="px-5 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded-lg transition-all disabled:opacity-70 flex items-center gap-2"
          >
            <span v-if="createLoading" class="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
            确认录入
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="showDetailModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      @click.self="showDetailModal = false"
    >
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h3 class="text-lg font-semibold text-gray-800">批次详情</h3>
            <p class="text-sm text-gray-500 mt-0.5 font-mono">{{ currentBatch?.batchNumber }}</p>
          </div>
          <button
            @click="showDetailModal = false"
            class="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X class="w-5 h-5 text-gray-400" />
          </button>
        </div>
        
        <div v-if="detailLoading" class="flex-1 p-12 flex items-center justify-center">
          <div class="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full"></div>
        </div>
        
        <div v-else-if="currentBatch" class="flex-1 overflow-y-auto">
          <div class="p-6 space-y-6">
            <div class="grid grid-cols-2 gap-4">
              <div class="p-4 bg-gray-50 rounded-xl">
                <div class="text-xs text-gray-500 mb-1">试剂名称</div>
                <div class="font-semibold text-gray-800">{{ currentBatch.reagentName }}</div>
              </div>
              <div class="p-4 bg-gray-50 rounded-xl">
                <div class="text-xs text-gray-500 mb-1">批次号</div>
                <div class="font-semibold text-gray-800 font-mono">{{ currentBatch.batchNumber }}</div>
              </div>
            </div>
            
            <div class="grid grid-cols-3 gap-4">
              <div class="p-4 bg-gray-50 rounded-xl">
                <div class="text-xs text-gray-500 mb-1 flex items-center gap-1">
                  <Calendar class="w-3 h-3" />
                  生产日期
                </div>
                <div class="font-medium text-gray-800">{{ formatDate(currentBatch.productionDate) }}</div>
              </div>
              <div class="p-4 rounded-xl" :class="currentBatch.status === 'expired' ? 'bg-danger-50' : currentBatch.status === 'warning' ? 'bg-warning-50' : 'bg-gray-50'">
                <div class="text-xs text-gray-500 mb-1 flex items-center gap-1">
                  <Clock class="w-3 h-3" />
                  有效期至
                </div>
                <div class="font-medium" :class="currentBatch.status === 'expired' ? 'text-danger-600' : currentBatch.status === 'warning' ? 'text-warning-600' : 'text-gray-800'">
                  {{ formatDate(currentBatch.expiryDate) }}
                </div>
                <div class="text-xs mt-0.5" :class="currentBatch.status === 'expired' ? 'text-danger-500' : currentBatch.status === 'warning' ? 'text-warning-500' : 'text-gray-400'">
                  {{ getDaysLabel(currentBatch) }}
                </div>
              </div>
              <div class="p-4 bg-gray-50 rounded-xl">
                <div class="text-xs text-gray-500 mb-1 flex items-center gap-1">
                  <MapPin class="w-3 h-3" />
                  存放位置
                </div>
                <div class="font-medium text-gray-800">{{ currentBatch.storageLocation }}</div>
              </div>
            </div>
            
            <div class="p-4 bg-gradient-to-r from-primary-50 to-success-50 rounded-xl">
              <div class="flex items-center justify-between mb-3">
                <span class="text-sm font-medium text-gray-700">库存情况</span>
                <span
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                  :class="batchStatusColors[currentBatch.status]"
                >
                  {{ batchStatusLabels[currentBatch.status] }}
                </span>
              </div>
              <div class="flex items-end gap-2 mb-2">
                <span class="text-3xl font-bold text-gray-800">{{ currentBatch.remainingQuantity }}</span>
                <span class="text-gray-400 mb-1">/ {{ currentBatch.initialQuantity }} {{ currentBatch.unit }}</span>
              </div>
              <div class="h-3 bg-white/80 rounded-full overflow-hidden">
                <div
                  class="h-full rounded-full transition-all"
                  :class="{
                    'bg-success-500': 100 - getUsagePercentage(currentBatch) > 50,
                    'bg-warning-500': 100 - getUsagePercentage(currentBatch) > 20 && 100 - getUsagePercentage(currentBatch) <= 50,
                    'bg-danger-500': 100 - getUsagePercentage(currentBatch) <= 20,
                  }"
                  :style="{ width: `${100 - getUsagePercentage(currentBatch)}%` }"
                ></div>
              </div>
              <div class="flex justify-between mt-2 text-xs text-gray-500">
                <span>已使用 {{ getUsagePercentage(currentBatch).toFixed(1) }}%</span>
                <span>剩余 {{ (100 - getUsagePercentage(currentBatch)).toFixed(1) }}%</span>
              </div>
            </div>
            
            <div v-if="currentBatch.remark" class="p-4 bg-gray-50 rounded-xl">
              <div class="text-xs text-gray-500 mb-1 flex items-center gap-1">
                <FileText class="w-3 h-3" />
                备注
              </div>
              <div class="text-gray-700 text-sm">{{ currentBatch.remark }}</div>
            </div>
            
            <div>
              <div class="flex items-center justify-between mb-4">
                <h4 class="font-semibold text-gray-800">出入库记录</h4>
                <button
                  v-if="currentBatch.status !== 'expired' && currentBatch.status !== 'exhausted'"
                  @click="openOutboundModal(currentBatch.id)"
                  class="px-3 py-1.5 text-sm bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors flex items-center gap-1"
                >
                  <ArrowDownCircle class="w-4 h-4" />
                  出库
                </button>
              </div>
              
              <div class="relative">
                <div class="absolute left-4 top-2 bottom-2 w-0.5 bg-gray-200"></div>
                
                <div class="space-y-4">
                  <div
                    v-for="op in currentBatch.operations"
                    :key="op.id"
                    class="relative pl-10"
                  >
                    <div
                      class="absolute left-2 top-1 w-5 h-5 rounded-full border-2 border-white shadow flex items-center justify-center"
                      :class="op.type === 'in' ? 'bg-success-500' : 'bg-primary-500'"
                    >
                      <ArrowUpCircle v-if="op.type === 'in'" class="w-3 h-3 text-white" />
                      <ArrowDownCircle v-else class="w-3 h-3 text-white" />
                    </div>
                    
                    <div class="bg-gray-50 rounded-lg p-3">
                      <div class="flex items-center justify-between mb-2">
                        <div class="flex items-center gap-2">
                          <span
                            class="text-xs font-medium px-2 py-0.5 rounded"
                            :class="op.type === 'in' ? 'bg-success-100 text-success-700' : 'bg-primary-100 text-primary-700'"
                          >
                            {{ op.type === 'in' ? '入库' : '出库' }}
                          </span>
                          <span class="text-sm font-semibold text-gray-800">
                            {{ op.type === 'in' ? '+' : '-' }}{{ op.quantity }}
                          </span>
                        </div>
                        <span class="text-xs text-gray-400">
                          {{ formatDate(op.createdAt, 'MM-DD HH:mm') }}
                        </span>
                      </div>
                      <div class="flex items-center gap-2 text-xs text-gray-500">
                        <User class="w-3 h-3" />
                        <span>{{ op.operatorName }}</span>
                        <span v-if="op.purpose">· {{ op.purpose }}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div v-if="currentBatch.operations.length === 0" class="text-center py-8 text-gray-400 text-sm">
                  暂无出入库记录
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 flex-shrink-0">
          <button
            @click="showDetailModal = false"
            class="px-5 py-2.5 border border-gray-200 hover:bg-gray-100 text-gray-600 rounded-lg transition-colors"
          >
            关闭
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="showOutboundModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      @click.self="showOutboundModal = false"
    >
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 class="text-lg font-semibold text-gray-800">批次出库</h3>
          <button
            @click="showOutboundModal = false"
            class="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X class="w-5 h-5 text-gray-400" />
          </button>
        </div>
        
        <div class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">
              出库数量 <span class="text-red-500">*</span>
            </label>
            <input
              v-model.number="outboundForm.quantity"
              type="number"
              min="0"
              step="0.01"
              class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
              placeholder="请输入出库数量"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">
              用途 <span class="text-red-500">*</span>
            </label>
            <textarea
              v-model="outboundForm.purpose"
              rows="3"
              class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all resize-none"
              placeholder="请输入实验用途"
            ></textarea>
          </div>
        </div>
        
        <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
          <button
            @click="showOutboundModal = false"
            class="px-5 py-2.5 border border-gray-200 hover:bg-gray-100 text-gray-600 rounded-lg transition-colors"
          >
            取消
          </button>
          <button
            @click="handleOutboundSubmit"
            :disabled="outboundLoading"
            class="px-5 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded-lg transition-all disabled:opacity-70 flex items-center gap-2"
          >
            <span v-if="outboundLoading" class="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
            确认出库
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
