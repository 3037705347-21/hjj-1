<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
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
} from 'lucide-vue-next'
import {
  mockGetConsumables,
  mockCreateConsumable,
  mockUpdateConsumable,
  mockDeleteConsumable,
  mockGetConsumable,
} from '@/mock/consumables'
import type { Consumable, ConsumableFormData } from '@/types/consumable'
import type { PageResult } from '@/types/common'
import { consumableCategories } from '@/types/consumable'
import { formatDate } from '@/utils/date'

const loading = ref(false)
const data = ref<PageResult<Consumable> | null>(null)

const searchForm = reactive({
  keyword: '',
  category: '',
})

const pagination = reactive({
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

const fetchData = async () => {
  loading.value = true
  try {
    const result = await mockGetConsumables(
      pagination.page,
      pagination.pageSize,
      searchForm.keyword,
      searchForm.category
    )
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
  searchForm.keyword = ''
  searchForm.category = ''
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
  if (!confirm('确定要删除该耗材吗？')) {
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

onMounted(() => {
  fetchData()
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
              placeholder="搜索耗材名称、生产厂家..."
              class="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
              @keyup.enter="handleSearch"
            >
          </div>
        </div>
        
        <select
          v-model="searchForm.category"
          class="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-white"
        >
          <option value="">
            全部分类
          </option>
          <option
            v-for="cat in consumableCategories"
            :key="cat"
            :value="cat"
          >
            {{ cat }}
          </option>
        </select>
        
        <button
          class="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
          @click="handleSearch"
        >
          搜索
        </button>
        
        <button
          class="px-5 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-lg transition-colors"
          @click="handleReset"
        >
          重置
        </button>
        
        <button
          class="px-5 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded-lg transition-all flex items-center gap-2 shadow-md shadow-primary-500/20"
          @click="openCreateModal"
        >
          <Plus class="w-4 h-4" />
          新增耗材
        </button>
      </div>
    </div>

    <div class="bg-white rounded-xl shadow-card overflow-hidden">
      <div
        v-if="loading"
        class="p-16 flex items-center justify-center"
      >
        <div class="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
      </div>
      
      <div v-else>
        <div class="overflow-x-auto">
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
                class="hover:bg-gray-50 transition-colors"
                :class="{ 'bg-danger-50/30': isLowStock(item) }"
              >
                <td class="px-6 py-4">
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
                        {{ item.name }}
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
                <td class="px-6 py-4">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-50 text-primary-700">
                    {{ item.category }}
                  </span>
                </td>
                <td class="px-6 py-4 text-sm text-gray-600">
                  {{ item.specification }}
                </td>
                <td class="px-6 py-4">
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
                <td class="px-6 py-4">
                  <div
                    v-if="item.location"
                    class="flex items-center gap-1 text-sm text-gray-600"
                  >
                    <MapPin class="w-3.5 h-3.5 text-gray-400" />
                    {{ item.location }}
                  </div>
                  <span
                    v-else
                    class="text-gray-400 text-sm"
                  >-</span>
                </td>
                <td class="px-6 py-4 text-sm text-gray-600">
                  {{ item.manufacturer || '-' }}
                </td>
                <td class="px-6 py-4">
                  <div class="flex items-center justify-center gap-2">
                    <button
                      class="p-1.5 text-gray-500 hover:bg-gray-100 rounded transition-colors"
                      title="编辑"
                      @click="openEditModal(item.id)"
                    >
                      <Edit2 class="w-4 h-4" />
                    </button>
                    <button
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
          class="px-6 py-4 border-t border-gray-100 flex items-center justify-between"
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
                  <option value="">
                    请选择分类
                  </option>
                  <option
                    v-for="cat in consumableCategories"
                    :key="cat"
                    :value="cat"
                  >
                    {{ cat }}
                  </option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">
                  规格
                </label>
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
                <label class="block text-sm font-medium text-gray-700 mb-1.5">
                  单位
                </label>
                <input
                  v-model="formData.unit"
                  type="text"
                  class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                  placeholder="如：包、盒"
                >
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">
                  当前库存
                </label>
                <input
                  v-model.number="formData.stockQuantity"
                  type="number"
                  min="0"
                  class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                >
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">
                  安全库存
                </label>
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
                <label class="block text-sm font-medium text-gray-700 mb-1.5">
                  生产厂家
                </label>
                <input
                  v-model="formData.manufacturer"
                  type="text"
                  class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                  placeholder="请输入生产厂家"
                >
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">
                  存放位置
                </label>
                <input
                  v-model="formData.location"
                  type="text"
                  class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                  placeholder="如：耗材柜A-01"
                >
              </div>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">
                描述
              </label>
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
  </div>
</template>
