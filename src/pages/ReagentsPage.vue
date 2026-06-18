<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Eye,
  FlaskConical,
  ChevronLeft,
  ChevronRight,
} from 'lucide-vue-next'
import {
  mockGetReagents,
  mockCreateReagent,
  mockUpdateReagent,
  mockDeleteReagent,
  mockGetReagent,
} from '@/mock/reagents'
import type { Reagent, ReagentFormData } from '@/types/reagent'
import type { PageResult } from '@/types/common'
import { reagentCategories, storageConditions, hazardLevelLabels, hazardLevelColors } from '@/types/reagent'
import { formatDate } from '@/utils/date'

const router = useRouter()
const loading = ref(false)
const data = ref<PageResult<Reagent> | null>(null)

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
const formData = reactive<ReagentFormData>({
  name: '',
  casNumber: '',
  category: '',
  specification: '',
  unit: '',
  manufacturer: '',
  storageCondition: '',
  description: '',
  hazardLevel: 'low',
})

const fetchData = async () => {
  loading.value = true
  try {
    const result = await mockGetReagents(
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

const openCreateModal = () => {
  formMode.value = 'create'
  currentId.value = ''
  Object.assign(formData, {
    name: '',
    casNumber: '',
    category: '',
    specification: '',
    unit: '',
    manufacturer: '',
    storageCondition: '',
    description: '',
    hazardLevel: 'low',
  })
  showFormModal.value = true
}

const openEditModal = async (id: string) => {
  formMode.value = 'edit'
  currentId.value = id
  formLoading.value = true
  try {
    const reagent = await mockGetReagent(id)
    if (reagent) {
      Object.assign(formData, {
        name: reagent.name,
        casNumber: reagent.casNumber || '',
        category: reagent.category,
        specification: reagent.specification,
        unit: reagent.unit,
        manufacturer: reagent.manufacturer || '',
        storageCondition: reagent.storageCondition,
        description: reagent.description || '',
        hazardLevel: reagent.hazardLevel || 'low',
      })
      showFormModal.value = true
    }
  } finally {
    formLoading.value = false
  }
}

const handleSubmit = async () => {
  if (!formData.name.trim()) {
    alert('请输入试剂名称')
    return
  }
  if (!formData.category) {
    alert('请选择分类')
    return
  }
  
  formLoading.value = true
  try {
    if (formMode.value === 'create') {
      await mockCreateReagent(formData)
    } else {
      await mockUpdateReagent(currentId.value, formData)
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
  if (!confirm('确定要删除该试剂吗？')) {
    return
  }
  try {
    await mockDeleteReagent(id)
    if (data.value?.list.length === 1 && pagination.page > 1) {
      pagination.page--
    }
    fetchData()
  } catch (e: any) {
    alert(e.message || '删除失败')
  }
}

const goToBatches = (id: string) => {
  router.push(`/batches?reagentId=${id}`)
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
              placeholder="搜索试剂名称、CAS号、生产厂家..."
              class="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
              @keyup.enter="handleSearch"
            />
          </div>
        </div>
        
        <select
          v-model="searchForm.category"
          class="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-white"
        >
          <option value="">全部分类</option>
          <option v-for="cat in reagentCategories" :key="cat" :value="cat">
            {{ cat }}
          </option>
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
          新增试剂
        </button>
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
                  CAS号
                </th>
                <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  分类
                </th>
                <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  规格
                </th>
                <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  储存条件
                </th>
                <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  危害等级
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
                v-for="reagent in data?.list"
                :key="reagent.id"
                class="hover:bg-gray-50 transition-colors"
              >
                <td class="px-6 py-4">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
                      <FlaskConical class="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <div class="font-medium text-gray-900">{{ reagent.name }}</div>
                      <div class="text-xs text-gray-400">
                        更新于 {{ formatDate(reagent.updatedAt, 'MM-DD') }}
                      </div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 text-sm font-mono text-gray-600">
                  {{ reagent.casNumber || '-' }}
                </td>
                <td class="px-6 py-4">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-50 text-primary-700">
                    {{ reagent.category }}
                  </span>
                </td>
                <td class="px-6 py-4 text-sm text-gray-600">
                  {{ reagent.specification }}
                </td>
                <td class="px-6 py-4 text-sm text-gray-600">
                  {{ reagent.storageCondition }}
                </td>
                <td class="px-6 py-4">
                  <span
                    v-if="reagent.hazardLevel"
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                    :class="hazardLevelColors[reagent.hazardLevel]"
                  >
                    {{ hazardLevelLabels[reagent.hazardLevel] }}
                  </span>
                  <span v-else class="text-gray-400 text-sm">-</span>
                </td>
                <td class="px-6 py-4 text-sm text-gray-600">
                  {{ reagent.manufacturer || '-' }}
                </td>
                <td class="px-6 py-4">
                  <div class="flex items-center justify-center gap-2">
                    <button
                      @click="goToBatches(reagent.id)"
                      class="p-1.5 text-primary-600 hover:bg-primary-50 rounded transition-colors"
                      title="查看批次"
                    >
                      <Eye class="w-4 h-4" />
                    </button>
                    <button
                      @click="openEditModal(reagent.id)"
                      class="p-1.5 text-gray-500 hover:bg-gray-100 rounded transition-colors"
                      title="编辑"
                    >
                      <Edit2 class="w-4 h-4" />
                    </button>
                    <button
                      @click="handleDelete(reagent.id)"
                      class="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                      title="删除"
                    >
                      <Trash2 class="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div v-if="data?.list.length === 0" class="p-16 text-center">
          <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <FlaskConical class="w-8 h-8 text-gray-300" />
          </div>
          <p class="text-gray-400">暂无试剂数据</p>
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
      v-if="showFormModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      @click.self="showFormModal = false"
    >
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden">
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 class="text-lg font-semibold text-gray-800">
            {{ formMode === 'create' ? '新增试剂' : '编辑试剂' }}
          </h3>
          <button
            @click="showFormModal = false"
            class="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X class="w-5 h-5 text-gray-400" />
          </button>
        </div>
        
        <div class="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">
                试剂名称 <span class="text-red-500">*</span>
              </label>
              <input
                v-model="formData.name"
                type="text"
                class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                placeholder="请输入试剂名称"
              />
            </div>
            
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">
                  CAS号
                </label>
                <input
                  v-model="formData.casNumber"
                  type="text"
                  class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                  placeholder="如：9048-46-8"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">
                  分类 <span class="text-red-500">*</span>
                </label>
                <select
                  v-model="formData.category"
                  class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-white"
                >
                  <option value="">请选择分类</option>
                  <option v-for="cat in reagentCategories" :key="cat" :value="cat">
                    {{ cat }}
                  </option>
                </select>
              </div>
            </div>
            
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">
                  规格
                </label>
                <input
                  v-model="formData.specification"
                  type="text"
                  class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                  placeholder="如：100mg/mL"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">
                  单位
                </label>
                <input
                  v-model="formData.unit"
                  type="text"
                  class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                  placeholder="如：mL、g、瓶"
                />
              </div>
            </div>
            
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">
                  储存条件
                </label>
                <select
                  v-model="formData.storageCondition"
                  class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-white"
                >
                  <option value="">请选择储存条件</option>
                  <option v-for="sc in storageConditions" :key="sc" :value="sc">
                    {{ sc }}
                  </option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">
                  危害等级
                </label>
                <select
                  v-model="formData.hazardLevel"
                  class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-white"
                >
                  <option value="low">低危</option>
                  <option value="medium">中危</option>
                  <option value="high">高危</option>
                </select>
              </div>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">
                生产厂家
              </label>
              <input
                v-model="formData.manufacturer"
                type="text"
                class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                placeholder="请输入生产厂家"
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">
                描述
              </label>
              <textarea
                v-model="formData.description"
                rows="3"
                class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all resize-none"
                placeholder="请输入试剂描述"
              ></textarea>
            </div>
          </div>
        </div>
        
        <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
          <button
            @click="showFormModal = false"
            class="px-5 py-2.5 border border-gray-200 hover:bg-gray-100 text-gray-600 rounded-lg transition-colors"
          >
            取消
          </button>
          <button
            @click="handleSubmit"
            :disabled="formLoading"
            class="px-5 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded-lg transition-all disabled:opacity-70 flex items-center gap-2"
          >
            <span v-if="formLoading" class="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
            {{ formMode === 'create' ? '创建' : '保存' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
