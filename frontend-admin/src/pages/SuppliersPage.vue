<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Building2,
  Phone,
  Mail,
  MapPin,
  Star,
  Clock,
  ChevronLeft,
  ChevronRight,
  Eye,
  TrendingUp,
  Package,
  CheckCircle,
  AlertTriangle,
} from 'lucide-vue-next'
import DataTableFilter from '@/components/DataTableFilter.vue'
import type { FilterField } from '@/components/DataTableFilter.vue'
import { useSavedFilters } from '@/composables/useSavedFilters'
import type { SavedFilter } from '@/composables/useSavedFilters'
import {
  mockGetSuppliers,
  mockCreateSupplier,
  mockUpdateSupplier,
  mockDeleteSupplier,
  mockGetSupplier,
  mockBatchDeleteSuppliers,
} from '@/mock/suppliers'
import BatchOperationBar from '@/components/BatchOperationBar.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import type {
  Supplier,
  SupplierFormData,
  SupplierStatus,
  SupplierRating,
} from '@/types/supplier'
import {
  supplierStatusLabels,
  supplierStatusColors,
  supplierRatingLabels,
  supplierRatingColors,
  mainCategories,
  paymentTermsOptions,
} from '@/types/supplier'
import type { PageResult } from '@/types/common'
import { formatDate } from '@/utils/date'
import { usePermission } from '@/composables/usePermission'

const router = useRouter()
const permission = usePermission()

const loading = ref(false)
const data = ref<PageResult<Supplier> | null>(null)

const filters = ref<Record<string, any>>({
  keyword: '',
  status: '',
  rating: '',
  mainCategory: '',
  paymentTerms: '',
  createTime: ['', ''],
  updateTime: ['', ''],
})

const { savedFilters, addFilter, deleteFilter, loadFilters } = useSavedFilters('supplier_saved_filters')

const filterFields: FilterField[] = [
  { key: 'status', label: '合作状态', type: 'select', options: [
    { label: '合作中', value: 'active' },
    { label: '已停用', value: 'inactive' },
    { label: '待审核', value: 'pending' },
    { label: '黑名单', value: 'blacklisted' },
  ]},
  { key: 'rating', label: '评价等级', type: 'select', options: [
    { label: 'A级-优秀', value: 'A' },
    { label: 'B级-良好', value: 'B' },
    { label: 'C级-一般', value: 'C' },
    { label: 'D级-较差', value: 'D' },
  ]},
  { key: 'mainCategory', label: '主营品类', type: 'select', options: mainCategories.map(c => ({ label: c, value: c })) },
  { key: 'paymentTerms', label: '账期', type: 'select', options: paymentTermsOptions.map(t => ({ label: t, value: t })) },
  { key: 'createTime', label: '创建时间', type: 'date-range' },
  { key: 'updateTime', label: '更新时间', type: 'date-range' },
]

const pagination = reactive({
  page: 1,
  pageSize: 10,
})

const showFormModal = ref(false)
const formMode = ref<'create' | 'edit'>('create')
const currentId = ref('')
const formLoading = ref(false)
const formData = reactive<SupplierFormData>({
  name: '',
  shortName: '',
  contactPerson: '',
  contactPhone: '',
  contactEmail: '',
  address: '',
  mainCategories: [],
  paymentTerms: '',
  status: 'pending',
  rating: 'C',
  bankAccount: '',
  bankName: '',
  taxNumber: '',
  businessLicense: '',
  establishedDate: '',
  registeredCapital: '',
  website: '',
  remark: '',
})

const selectedIds = ref<string[]>([])
const showBatchDeleteConfirm = ref(false)
const batchDeleteLoading = ref(false)

const batchActions = computed(() => [
  { key: 'delete', label: '批量删除', icon: Trash2, type: 'danger' as const, permission: permission.canDeleteSupplier.value },
])

const fetchData = async () => {
  loading.value = true
  try {
    const f = filters.value
    const params = {
      keyword: f.keyword || undefined,
      status: f.status || undefined,
      rating: f.rating || undefined,
      mainCategory: f.mainCategory || undefined,
      paymentTerms: f.paymentTerms || undefined,
      createTimeStart: f.createTime?.[0] || undefined,
      createTimeEnd: f.createTime?.[1] || undefined,
      updateTimeStart: f.updateTime?.[0] || undefined,
      updateTimeEnd: f.updateTime?.[1] || undefined,
    }
    const result = await mockGetSuppliers(pagination.page, pagination.pageSize, params)
    data.value = result
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

const openCreateModal = () => {
  formMode.value = 'create'
  currentId.value = ''
  Object.assign(formData, {
    name: '',
    shortName: '',
    contactPerson: '',
    contactPhone: '',
    contactEmail: '',
    address: '',
    mainCategories: [],
    paymentTerms: '',
    status: 'pending',
    rating: 'C',
    bankAccount: '',
    bankName: '',
    taxNumber: '',
    businessLicense: '',
    establishedDate: '',
    registeredCapital: '',
    website: '',
    remark: '',
  })
  showFormModal.value = true
}

const openEditModal = async (id: string) => {
  formMode.value = 'edit'
  currentId.value = id
  formLoading.value = true
  try {
    const supplier = await mockGetSupplier(id)
    if (supplier) {
      Object.assign(formData, {
        name: supplier.name,
        shortName: supplier.shortName || '',
        contactPerson: supplier.contactPerson,
        contactPhone: supplier.contactPhone,
        contactEmail: supplier.contactEmail || '',
        address: supplier.address,
        mainCategories: [...supplier.mainCategories],
        paymentTerms: supplier.paymentTerms,
        status: supplier.status,
        rating: supplier.rating,
        bankAccount: supplier.bankAccount || '',
        bankName: supplier.bankName || '',
        taxNumber: supplier.taxNumber || '',
        businessLicense: supplier.businessLicense || '',
        establishedDate: supplier.establishedDate || '',
        registeredCapital: supplier.registeredCapital || '',
        website: supplier.website || '',
        remark: supplier.remark || '',
      })
      showFormModal.value = true
    }
  } finally {
    formLoading.value = false
  }
}

const handleSubmit = async () => {
  if (!formData.name.trim()) {
    alert('请输入供应商名称')
    return
  }
  if (!formData.contactPerson.trim()) {
    alert('请输入联系人')
    return
  }
  if (!formData.contactPhone.trim()) {
    alert('请输入联系电话')
    return
  }
  if (!formData.address.trim()) {
    alert('请输入地址')
    return
  }
  if (formData.mainCategories.length === 0) {
    alert('请至少选择一个主营品类')
    return
  }

  formLoading.value = true
  try {
    if (formMode.value === 'create') {
      await mockCreateSupplier(formData)
    } else {
      await mockUpdateSupplier(currentId.value, formData)
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
  if (!confirm('确定要删除该供应商吗？删除后相关资质附件也会被清除。')) {
    return
  }
  try {
    await mockDeleteSupplier(id)
    if (data.value?.list.length === 1 && pagination.page > 1) {
      pagination.page--
    }
    fetchData()
  } catch (e: any) {
    alert(e.message || '删除失败')
  }
}

const toggleSelect = (id: string) => {
  const idx = selectedIds.value.indexOf(id)
  if (idx > -1) {
    selectedIds.value.splice(idx, 1)
  } else {
    selectedIds.value.push(id)
  }
}

const toggleSelectAll = () => {
  if (selectedIds.value.length === data.value?.list.length) {
    selectedIds.value = []
  } else {
    selectedIds.value = data.value?.list.map(s => s.id) || []
  }
}

const clearSelection = () => {
  selectedIds.value = []
}

const handleBatchAction = (action: string) => {
  if (selectedIds.value.length === 0) {
    alert('请先选择要操作的记录')
    return
  }
  if (action === 'delete') {
    showBatchDeleteConfirm.value = true
  }
}

const handleBatchDelete = async () => {
  batchDeleteLoading.value = true
  try {
    await mockBatchDeleteSuppliers(selectedIds.value)
    showBatchDeleteConfirm.value = false
    clearSelection()
    if (data.value?.list && selectedIds.value.length >= data.value.list.length && pagination.page > 1) {
      pagination.page--
    }
    fetchData()
    alert('删除成功')
  } catch (e: any) {
    alert(e.message || '删除失败')
  } finally {
    batchDeleteLoading.value = false
  }
}

const goToDetail = (id: string) => {
  router.push(`/suppliers/${id}`)
}

const toggleCategory = (category: string) => {
  const idx = formData.mainCategories.indexOf(category)
  if (idx > -1) {
    formData.mainCategories.splice(idx, 1)
  } else {
    formData.mainCategories.push(category)
  }
}

onMounted(() => {
  fetchData()
  loadFilters()
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">供应商管理</h1>
        <p class="text-sm text-gray-500 mt-0.5">管理供应商信息、资质档案与合作评价</p>
      </div>
    </div>

    <div class="grid grid-cols-4 gap-4">
      <div class="bg-white rounded-xl shadow-card p-5">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">供应商总数</p>
            <p class="text-2xl font-bold text-gray-900 mt-1">{{ data?.total || 0 }}</p>
          </div>
          <div class="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center">
            <Building2 class="w-6 h-6 text-primary-600" />
          </div>
        </div>
      </div>
      <div class="bg-white rounded-xl shadow-card p-5">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">合作中</p>
            <p class="text-2xl font-bold text-success-600 mt-1">
              {{ data?.list.filter(s => s.status === 'active').length || 0 }}
            </p>
          </div>
          <div class="w-12 h-12 rounded-xl bg-success-50 flex items-center justify-center">
            <CheckCircle class="w-6 h-6 text-success-600" />
          </div>
        </div>
      </div>
      <div class="bg-white rounded-xl shadow-card p-5">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">待审核</p>
            <p class="text-2xl font-bold text-warning-600 mt-1">
              {{ data?.list.filter(s => s.status === 'pending').length || 0 }}
            </p>
          </div>
          <div class="w-12 h-12 rounded-xl bg-warning-50 flex items-center justify-center">
            <Clock class="w-6 h-6 text-warning-600" />
          </div>
        </div>
      </div>
      <div class="bg-white rounded-xl shadow-card p-5">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">A级供应商</p>
            <p class="text-2xl font-bold text-emerald-600 mt-1">
              {{ data?.list.filter(s => s.rating === 'A').length || 0 }}
            </p>
          </div>
          <div class="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
            <Star class="w-6 h-6 text-emerald-600" />
          </div>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-xl shadow-card overflow-hidden">
      <div class="p-6">
        <DataTableFilter
          v-model="filters"
          :filter-fields="filterFields"
          :saved-filters="savedFilters"
          :plain="true"
          :action-button-text="permission.canCreateSupplier ? '新增供应商' : undefined"
          keyword-placeholder="搜索供应商名称、联系人、电话、地址..."
          class="mb-6"
          @search="handleSearch"
          @reset="handleReset"
          @action="handleAction"
          @save-filter="handleSaveFilter"
          @apply-filter="handleApplyFilter"
          @delete-filter="handleDeleteFilter"
        />

        <BatchOperationBar
          :selected-count="selectedIds.length"
          :total-count="data?.total || 0"
          :actions="batchActions"
          :show-import="false"
          :show-export="false"
          :show-template="false"
          class="mb-6"
          @action="handleBatchAction"
          @clear-selection="clearSelection"
        />

        <div v-if="loading" class="p-16 flex items-center justify-center">
          <div class="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
        </div>

        <div v-else>
          <div class="overflow-x-auto -mx-6">
            <table class="w-full">
              <thead class="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th class="w-12 px-6 py-4 text-left">
                    <input
                      type="checkbox"
                      :checked="selectedIds.length > 0 && selectedIds.length === data?.list.length"
                      :indeterminate="selectedIds.length > 0 && selectedIds.length < (data?.list.length || 0)"
                      class="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                      @change="toggleSelectAll"
                    >
                  </th>
                  <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    供应商信息
                  </th>
                  <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    联系人
                  </th>
                  <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    主营品类
                  </th>
                  <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    状态/评级
                  </th>
                  <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    合作数据
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
                  :class="[
                    'hover:bg-gray-50 transition-colors cursor-pointer',
                    selectedIds.includes(item.id) ? 'bg-primary-50/50' : '',
                  ]"
                  @click="goToDetail(item.id)"
                >
                  <td class="w-12 px-6 py-4" @click.stop>
                    <input
                      type="checkbox"
                      :checked="selectedIds.includes(item.id)"
                      class="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                      @change="toggleSelect(item.id)"
                    >
                  </td>
                  <td class="px-6 py-4" @click.stop>
                    <div class="flex items-center gap-3">
                      <div class="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
                        <Building2 class="w-5 h-5 text-primary-600" />
                      </div>
                      <div>
                        <div class="font-medium text-gray-900 flex items-center gap-2">
                          <span class="hover:text-primary-600 transition-colors cursor-pointer" @click="goToDetail(item.id)">
                            {{ item.name }}
                          </span>
                          <span
                            v-if="item.shortName"
                            class="text-xs text-gray-400"
                          >
                            ({{ item.shortName }})
                          </span>
                        </div>
                        <div class="text-xs text-gray-400 flex items-center gap-2 mt-0.5">
                          <span class="flex items-center gap-1">
                            <MapPin class="w-3 h-3" />
                            {{ item.address.slice(0, 20) }}{{ item.address.length > 20 ? '...' : '' }}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4" @click.stop>
                    <div class="text-sm text-gray-900">{{ item.contactPerson }}</div>
                    <div class="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <Phone class="w-3 h-3" />
                      {{ item.contactPhone }}
                    </div>
                    <div v-if="item.contactEmail" class="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                      <Mail class="w-3 h-3" />
                      {{ item.contactEmail }}
                    </div>
                  </td>
                  <td class="px-6 py-4" @click.stop>
                    <div class="flex flex-wrap gap-1">
                      <span
                        v-for="cat in item.mainCategories.slice(0, 2)"
                        :key="cat"
                        class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600"
                      >
                        {{ cat }}
                      </span>
                      <span
                        v-if="item.mainCategories.length > 2"
                        class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500"
                      >
                        +{{ item.mainCategories.length - 2 }}
                      </span>
                    </div>
                  </td>
                  <td class="px-6 py-4" @click.stop>
                    <div class="flex flex-col gap-1.5">
                      <span
                        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium w-fit"
                        :class="supplierStatusColors[item.status]"
                      >
                        {{ supplierStatusLabels[item.status] }}
                      </span>
                      <span
                        class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium w-fit gap-0.5"
                        :class="supplierRatingColors[item.rating]"
                      >
                        <Star class="w-3 h-3" />
                        {{ item.rating }}级 {{ supplierRatingLabels[item.rating] }}
                      </span>
                    </div>
                  </td>
                  <td class="px-6 py-4" @click.stop>
                    <div class="space-y-1">
                      <div class="flex items-center gap-2 text-sm text-gray-600">
                        <Package class="w-3.5 h-3.5 text-gray-400" />
                        <span>{{ item.totalOrders }} 单</span>
                        <span class="text-gray-300">|</span>
                        <span>¥{{ (item.totalAmount / 10000).toFixed(1) }}万</span>
                      </div>
                      <div class="flex items-center gap-2 text-sm text-gray-600">
                        <TrendingUp class="w-3.5 h-3.5 text-gray-400" />
                        <span>准时率 {{ item.onTimeDeliveryRate }}%</span>
                      </div>
                    </div>
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
                      <button
                        v-if="permission.canEditSupplier"
                        class="p-1.5 text-gray-500 hover:bg-gray-100 rounded transition-colors"
                        title="编辑"
                        @click="openEditModal(item.id)"
                      >
                        <Edit2 class="w-4 h-4" />
                      </button>
                      <button
                        v-if="permission.canDeleteSupplier"
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
              <Building2 class="w-8 h-8 text-gray-300" />
            </div>
            <p class="text-gray-400">
              暂无供应商数据
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
    </div>

    <div
      v-if="showFormModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      @click.self="showFormModal = false"
    >
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 class="text-lg font-semibold text-gray-800">
            {{ formMode === 'create' ? '新增供应商' : '编辑供应商' }}
          </h3>
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
              <h4 class="text-sm font-medium text-gray-700 mb-3">基本信息</h4>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">
                    供应商名称 <span class="text-red-500">*</span>
                  </label>
                  <input
                    v-model="formData.name"
                    type="text"
                    class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                    placeholder="请输入供应商名称"
                  >
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">
                    简称
                  </label>
                  <input
                    v-model="formData.shortName"
                    type="text"
                    class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                    placeholder="请输入简称"
                  >
                </div>
              </div>
            </div>

            <div class="bg-gray-50 rounded-lg p-4">
              <h4 class="text-sm font-medium text-gray-700 mb-3">联系信息</h4>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">
                    联系人 <span class="text-red-500">*</span>
                  </label>
                  <input
                    v-model="formData.contactPerson"
                    type="text"
                    class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                    placeholder="请输入联系人姓名"
                  >
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">
                    联系电话 <span class="text-red-500">*</span>
                  </label>
                  <input
                    v-model="formData.contactPhone"
                    type="text"
                    class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                    placeholder="请输入联系电话"
                  >
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">
                    邮箱
                  </label>
                  <input
                    v-model="formData.contactEmail"
                    type="email"
                    class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                    placeholder="请输入邮箱地址"
                  >
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">
                    公司网站
                  </label>
                  <input
                    v-model="formData.website"
                    type="text"
                    class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                    placeholder="请输入公司网址"
                  >
                </div>
              </div>
              <div class="mt-4">
                <label class="block text-sm font-medium text-gray-700 mb-1.5">
                  地址 <span class="text-red-500">*</span>
                </label>
                <input
                  v-model="formData.address"
                  type="text"
                  class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                  placeholder="请输入详细地址"
                >
              </div>
            </div>

            <div class="bg-gray-50 rounded-lg p-4">
              <h4 class="text-sm font-medium text-gray-700 mb-3">业务信息</h4>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">
                    合作状态 <span class="text-red-500">*</span>
                  </label>
                  <select
                    v-model="formData.status"
                    class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-white"
                  >
                    <option value="pending">待审核</option>
                    <option value="active">合作中</option>
                    <option value="inactive">已停用</option>
                    <option value="blacklisted">黑名单</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">
                    评价等级 <span class="text-red-500">*</span>
                  </label>
                  <select
                    v-model="formData.rating"
                    class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-white"
                  >
                    <option value="A">A级 - 优秀</option>
                    <option value="B">B级 - 良好</option>
                    <option value="C">C级 - 一般</option>
                    <option value="D">D级 - 较差</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">
                    账期 <span class="text-red-500">*</span>
                  </label>
                  <select
                    v-model="formData.paymentTerms"
                    class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-white"
                  >
                    <option value="">请选择账期</option>
                    <option v-for="term in paymentTermsOptions" :key="term" :value="term">
                      {{ term }}
                    </option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">
                    成立日期
                  </label>
                  <input
                    v-model="formData.establishedDate"
                    type="date"
                    class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                  >
                </div>
              </div>
              <div class="mt-4">
                <label class="block text-sm font-medium text-gray-700 mb-1.5">
                  主营品类 <span class="text-red-500">*</span>
                </label>
                <div class="flex flex-wrap gap-2">
                  <button
                    v-for="cat in mainCategories"
                    :key="cat"
                    type="button"
                    class="px-3 py-1.5 rounded-lg text-sm transition-colors"
                    :class="[
                      formData.mainCategories.includes(cat)
                        ? 'bg-primary-100 text-primary-700 border border-primary-200'
                        : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300',
                    ]"
                    @click="toggleCategory(cat)"
                  >
                    {{ cat }}
                  </button>
                </div>
              </div>
            </div>

            <div class="bg-gray-50 rounded-lg p-4">
              <h4 class="text-sm font-medium text-gray-700 mb-3">财务信息</h4>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">
                    税号
                  </label>
                  <input
                    v-model="formData.taxNumber"
                    type="text"
                    class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                    placeholder="请输入税号"
                  >
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">
                    营业执照号
                  </label>
                  <input
                    v-model="formData.businessLicense"
                    type="text"
                    class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                    placeholder="请输入营业执照号"
                  >
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">
                    开户银行
                  </label>
                  <input
                    v-model="formData.bankName"
                    type="text"
                    class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                    placeholder="请输入开户银行"
                  >
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">
                    银行账号
                  </label>
                  <input
                    v-model="formData.bankAccount"
                    type="text"
                    class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                    placeholder="请输入银行账号"
                  >
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">
                    注册资本
                  </label>
                  <input
                    v-model="formData.registeredCapital"
                    type="text"
                    class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                    placeholder="如：500万"
                  >
                </div>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">
                备注
              </label>
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
            {{ formMode === 'create' ? '创建' : '保存' }}
          </button>
        </div>
      </div>
    </div>

    <ConfirmDialog
      v-model:visible="showBatchDeleteConfirm"
      title="确认删除"
      :message="`确定要删除选中的 ${selectedIds.length} 个供应商吗？删除后相关资质附件也会被清除，且无法恢复。`"
      confirm-text="确认删除"
      type="danger"
      :loading="batchDeleteLoading"
      @confirm="handleBatchDelete"
    />
  </div>
</template>
