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
  FileText,
  FileCheck2,
  Image as ImageIcon,
  Upload,
  Package,
  AlertTriangle,
  ToggleLeft,
  ToggleRight,
  Download,
} from 'lucide-vue-next'
import {
  mockGetReagents,
  mockCreateReagent,
  mockUpdateReagent,
  mockDeleteReagent,
  mockGetReagent,
} from '@/mock/reagents'
import type { Reagent, ReagentFormData, Attachment } from '@/types/reagent'
import type { PageResult } from '@/types/common'
import {
  reagentCategories,
  storageConditions,
  hazardLevelLabels,
  hazardLevelColors,
  enabledStatusLabels,
  enabledStatusColors,
  experimentTypeOptions,
  commonBrands,
} from '@/types/reagent'
import { formatDate } from '@/utils/date'

const router = useRouter()
const loading = ref(false)
const data = ref<PageResult<Reagent> | null>(null)

const searchForm = reactive({
  keyword: '',
  category: '',
  brand: '',
  catalogNumber: '',
  hazardLevel: '',
  storageCondition: '',
  enabled: '',
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
})

const showFormModal = ref(false)
const showDetailModal = ref(false)
const formMode = ref<'create' | 'edit'>('create')
const currentId = ref('')
const formLoading = ref(false)
const detailLoading = ref(false)
const detailData = ref<Reagent | null>(null)

const defaultFormData = (): ReagentFormData => ({
  name: '',
  casNumber: '',
  category: '',
  specification: '',
  unit: '',
  manufacturer: '',
  brand: '',
  catalogNumber: '',
  purity: '',
  concentration: '',
  packagingSpec: '',
  experimentTypes: [],
  aliases: '',
  openedValidity: '',
  incompatibilities: '',
  sdsAttachment: undefined,
  qcReportAttachment: undefined,
  reagentImage: '',
  enabled: true,
  storageCondition: '',
  description: '',
  hazardLevel: 'low',
})

const formData = reactive<ReagentFormData>(defaultFormData())

const fetchData = async () => {
  loading.value = true
  try {
    const filters = {
      keyword: searchForm.keyword || undefined,
      category: searchForm.category || undefined,
      brand: searchForm.brand || undefined,
      catalogNumber: searchForm.catalogNumber || undefined,
      hazardLevel: searchForm.hazardLevel || undefined,
      storageCondition: searchForm.storageCondition || undefined,
      enabled: searchForm.enabled || undefined,
    }
    const result = await mockGetReagents(pagination.page, pagination.pageSize, filters)
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
  searchForm.brand = ''
  searchForm.catalogNumber = ''
  searchForm.hazardLevel = ''
  searchForm.storageCondition = ''
  searchForm.enabled = ''
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
  Object.assign(formData, defaultFormData())
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
        ...defaultFormData(),
        name: reagent.name,
        casNumber: reagent.casNumber || '',
        category: reagent.category,
        specification: reagent.specification,
        unit: reagent.unit,
        manufacturer: reagent.manufacturer || '',
        brand: reagent.brand || '',
        catalogNumber: reagent.catalogNumber || '',
        purity: reagent.purity || '',
        concentration: reagent.concentration || '',
        packagingSpec: reagent.packagingSpec || '',
        experimentTypes: reagent.experimentTypes || [],
        aliases: reagent.aliases || '',
        openedValidity: reagent.openedValidity || '',
        incompatibilities: reagent.incompatibilities || '',
        sdsAttachment: reagent.sdsAttachment,
        qcReportAttachment: reagent.qcReportAttachment,
        reagentImage: reagent.reagentImage || '',
        enabled: reagent.enabled,
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

const openDetailModal = async (id: string) => {
  showDetailModal.value = true
  detailLoading.value = true
  detailData.value = null
  try {
    const reagent = await mockGetReagent(id)
    detailData.value = reagent
  } finally {
    detailLoading.value = false
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
  if (!formData.specification.trim()) {
    alert('请输入规格')
    return
  }
  if (!formData.unit.trim()) {
    alert('请输入单位')
    return
  }
  if (!formData.storageCondition) {
    alert('请选择储存条件')
    return
  }

  formLoading.value = true
  try {
    if (formMode.value === 'create') {
      await mockCreateReagent({ ...formData })
    } else {
      await mockUpdateReagent(currentId.value, { ...formData })
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

const toggleExperimentType = (type: string) => {
  if (!formData.experimentTypes) {
    formData.experimentTypes = []
  }
  const idx = formData.experimentTypes.indexOf(type)
  if (idx > -1) {
    formData.experimentTypes.splice(idx, 1)
  } else {
    formData.experimentTypes.push(type)
  }
}

const formatFileSize = (bytes?: number) => {
  if (!bytes) return '-'
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

const mockFileUpload = (type: 'sds' | 'qc' | 'image') => {
  const now = new Date().toISOString()
  if (type === 'sds') {
    const att: Attachment = {
      name: `SDS_${Date.now()}.pdf`,
      url: `/files/sds_${Date.now()}.pdf`,
      size: Math.floor(Math.random() * 500000) + 50000,
      uploadedAt: now,
    }
    formData.sdsAttachment = att
  } else if (type === 'qc') {
    const att: Attachment = {
      name: `QC_${Date.now()}.pdf`,
      url: `/files/qc_${Date.now()}.pdf`,
      size: Math.floor(Math.random() * 300000) + 30000,
      uploadedAt: now,
    }
    formData.qcReportAttachment = att
  } else if (type === 'image') {
    formData.reagentImage = `/images/reagent_${Date.now()}.png`
  }
}

const removeAttachment = (type: 'sds' | 'qc' | 'image') => {
  if (type === 'sds') formData.sdsAttachment = undefined
  else if (type === 'qc') formData.qcReportAttachment = undefined
  else if (type === 'image') formData.reagentImage = ''
}

const getEnabledLabel = (enabled: boolean) => enabledStatusLabels[String(enabled) as 'true' | 'false']
const getEnabledColor = (enabled: boolean) => enabledStatusColors[String(enabled) as 'true' | 'false']

onMounted(() => {
  fetchData()
})
</script>

<template>
  <div class="space-y-6">
    <div class="bg-white rounded-xl shadow-card p-6">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="lg:col-span-2">
          <label class="block text-xs font-medium text-gray-500 mb-1.5">关键词搜索</label>
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
            >
          </div>
        </div>

        <div>
          <label class="block text-xs font-medium text-gray-500 mb-1.5">分类</label>
          <select
            v-model="searchForm.category"
            class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-white"
          >
            <option value="">全部分类</option>
            <option v-for="cat in reagentCategories" :key="cat" :value="cat">{{ cat }}</option>
          </select>
        </div>

        <div>
          <label class="block text-xs font-medium text-gray-500 mb-1.5">品牌</label>
          <select
            v-model="searchForm.brand"
            class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-white"
          >
            <option value="">全部品牌</option>
            <option v-for="b in commonBrands" :key="b" :value="b">{{ b }}</option>
          </select>
        </div>

        <div>
          <label class="block text-xs font-medium text-gray-500 mb-1.5">货号</label>
          <input
            v-model="searchForm.catalogNumber"
            type="text"
            placeholder="输入货号关键词..."
            class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
          >
        </div>

        <div>
          <label class="block text-xs font-medium text-gray-500 mb-1.5">危险等级</label>
          <select
            v-model="searchForm.hazardLevel"
            class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-white"
          >
            <option value="">全部等级</option>
            <option value="low">低危</option>
            <option value="medium">中危</option>
            <option value="high">高危</option>
          </select>
        </div>

        <div>
          <label class="block text-xs font-medium text-gray-500 mb-1.5">存储条件</label>
          <select
            v-model="searchForm.storageCondition"
            class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-white"
          >
            <option value="">全部条件</option>
            <option v-for="sc in storageConditions" :key="sc" :value="sc">{{ sc }}</option>
          </select>
        </div>

        <div>
          <label class="block text-xs font-medium text-gray-500 mb-1.5">启用状态</label>
          <select
            v-model="searchForm.enabled"
            class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-white"
          >
            <option value="">全部状态</option>
            <option value="true">启用</option>
            <option value="false">停用</option>
          </select>
        </div>
      </div>

      <div class="flex items-center gap-3 mt-5 pt-4 border-t border-gray-100">
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
        <div class="flex-1"></div>
        <button
          class="px-5 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded-lg transition-all flex items-center gap-2 shadow-md shadow-primary-500/20"
          @click="openCreateModal"
        >
          <Plus class="w-4 h-4" />
          新增试剂
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
                <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">试剂名称</th>
                <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CAS号</th>
                <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">分类</th>
                <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">品牌/货号</th>
                <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">储存条件</th>
                <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">危害等级</th>
                <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                <th class="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
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
                    <div class="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                      <FlaskConical class="w-5 h-5 text-primary-600" />
                    </div>
                    <div class="min-w-0">
                      <div class="font-medium text-gray-900 truncate max-w-[200px]">{{ reagent.name }}</div>
                      <div class="text-xs text-gray-400">更新于 {{ formatDate(reagent.updatedAt, 'MM-DD') }}</div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 text-sm font-mono text-gray-600">{{ reagent.casNumber || '-' }}</td>
                <td class="px-6 py-4">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-50 text-primary-700">
                    {{ reagent.category }}
                  </span>
                </td>
                <td class="px-6 py-4">
                  <div class="text-sm text-gray-800">{{ reagent.brand || '-' }}</div>
                  <div class="text-xs text-gray-400 font-mono">{{ reagent.catalogNumber || '-' }}</div>
                </td>
                <td class="px-6 py-4 text-sm text-gray-600">{{ reagent.storageCondition }}</td>
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
                <td class="px-6 py-4">
                  <span
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                    :class="getEnabledColor(reagent.enabled)"
                  >
                    {{ getEnabledLabel(reagent.enabled) }}
                  </span>
                </td>
                <td class="px-6 py-4">
                  <div class="flex items-center justify-center gap-1">
                    <button
                      class="p-1.5 text-primary-600 hover:bg-primary-50 rounded transition-colors"
                      title="查看详情"
                      @click="openDetailModal(reagent.id)"
                    >
                      <FileText class="w-4 h-4" />
                    </button>
                    <button
                      class="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                      title="查看批次"
                      @click="goToBatches(reagent.id)"
                    >
                      <Package class="w-4 h-4" />
                    </button>
                    <button
                      class="p-1.5 text-gray-500 hover:bg-gray-100 rounded transition-colors"
                      title="编辑"
                      @click="openEditModal(reagent.id)"
                    >
                      <Edit2 class="w-4 h-4" />
                    </button>
                    <button
                      class="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                      title="删除"
                      @click="handleDelete(reagent.id)"
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
            <FlaskConical class="w-8 h-8 text-gray-300" />
          </div>
          <p class="text-gray-400">暂无试剂数据</p>
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

    <!-- 表单弹窗 -->
    <div
      v-if="showFormModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      @click.self="showFormModal = false"
    >
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-hidden">
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <h3 class="text-lg font-semibold text-gray-800">
            {{ formMode === 'create' ? '新增试剂' : '编辑试剂' }}
          </h3>
          <button
            class="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            @click="showFormModal = false"
          >
            <X class="w-5 h-5 text-gray-400" />
          </button>
        </div>
        
        <div class="p-6 overflow-y-auto" style="max-height: calc(92vh - 140px);">
          <div class="space-y-6">
            <div class="bg-gray-50 rounded-lg p-4">
              <h4 class="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <FlaskConical class="w-4 h-4 text-primary-600" />基础信息
              </h4>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="md:col-span-2">
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">
                    试剂名称 <span class="text-red-500">*</span>
                  </label>
                  <input
                    v-model="formData.name"
                    type="text"
                    class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                    placeholder="请输入试剂名称"
                  >
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">CAS号</label>
                  <input
                    v-model="formData.casNumber"
                    type="text"
                    class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                    placeholder="如：9048-46-8"
                  >
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
                    <option v-for="cat in reagentCategories" :key="cat" :value="cat">{{ cat }}</option>
                  </select>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">别名</label>
                  <input
                    v-model="formData.aliases"
                    type="text"
                    class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                    placeholder="多个别名用分号分隔"
                  >
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">生产厂家</label>
                  <input
                    v-model="formData.manufacturer"
                    type="text"
                    class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                    placeholder="请输入生产厂家"
                  >
                </div>
              </div>
            </div>

            <div class="bg-gray-50 rounded-lg p-4">
              <h4 class="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Package class="w-4 h-4 text-primary-600" />规格参数
              </h4>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">品牌</label>
                  <select
                    v-model="formData.brand"
                    class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-white"
                  >
                    <option value="">请选择品牌</option>
                    <option v-for="b in commonBrands" :key="b" :value="b">{{ b }}</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">货号</label>
                  <input
                    v-model="formData.catalogNumber"
                    type="text"
                    class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                    placeholder="如：A7906-100ML"
                  >
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">纯度</label>
                  <input
                    v-model="formData.purity"
                    type="text"
                    class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                    placeholder="如：≥98%"
                  >
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">浓度</label>
                  <input
                    v-model="formData.concentration"
                    type="text"
                    class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                    placeholder="如：100mg/mL"
                  >
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">
                    规格 <span class="text-red-500">*</span>
                  </label>
                  <input
                    v-model="formData.specification"
                    type="text"
                    class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                    placeholder="如：100mg/mL"
                  >
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">
                    单位 <span class="text-red-500">*</span>
                  </label>
                  <input
                    v-model="formData.unit"
                    type="text"
                    class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                    placeholder="如：mL、g、瓶"
                  >
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">包装规格</label>
                  <input
                    v-model="formData.packagingSpec"
                    type="text"
                    class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                    placeholder="如：100mL/瓶"
                  >
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">开封后有效期</label>
                  <input
                    v-model="formData.openedValidity"
                    type="text"
                    class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                    placeholder="如：30天"
                  >
                </div>
              </div>
            </div>

            <div class="bg-gray-50 rounded-lg p-4">
              <h4 class="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <AlertTriangle class="w-4 h-4 text-warning-600" />存储与安全
              </h4>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">
                    储存条件 <span class="text-red-500">*</span>
                  </label>
                  <select
                    v-model="formData.storageCondition"
                    class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-white"
                  >
                    <option value="">请选择储存条件</option>
                    <option v-for="sc in storageConditions" :key="sc" :value="sc">{{ sc }}</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">危害等级</label>
                  <select
                    v-model="formData.hazardLevel"
                    class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-white"
                  >
                    <option value="low">低危</option>
                    <option value="medium">中危</option>
                    <option value="high">高危</option>
                  </select>
                </div>
                <div class="md:col-span-2">
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">禁配信息</label>
                  <textarea
                    v-model="formData.incompatibilities"
                    rows="2"
                    class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all resize-none"
                    placeholder="请输入不相容的化学物质或操作注意事项"
                  />
                </div>
              </div>
            </div>

            <div class="bg-gray-50 rounded-lg p-4">
              <h4 class="text-sm font-semibold text-gray-700 mb-3">适用实验类型</h4>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="t in experimentTypeOptions"
                  :key="t"
                  type="button"
                  class="px-3 py-1.5 rounded-lg text-sm transition-all border"
                  :class="formData.experimentTypes?.includes(t)
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300 hover:text-primary-600'"
                  @click="toggleExperimentType(t)"
                >
                  {{ t }}
                </button>
              </div>
            </div>

            <div class="bg-gray-50 rounded-lg p-4">
              <h4 class="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <FileText class="w-4 h-4 text-primary-600" />附件资料
              </h4>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">SDS/MSDS 附件</label>
                  <div v-if="formData.sdsAttachment" class="bg-white rounded-lg p-3 border border-gray-200">
                    <div class="flex items-center gap-2 text-sm">
                      <FileText class="w-4 h-4 text-primary-600 flex-shrink-0" />
                      <span class="flex-1 truncate text-gray-700">{{ formData.sdsAttachment.name }}</span>
                      <button
                        type="button"
                        class="p-1 text-red-500 hover:bg-red-50 rounded"
                        @click="removeAttachment('sds')"
                      >
                        <X class="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div class="text-xs text-gray-400 mt-1">{{ formatFileSize(formData.sdsAttachment.size) }}</div>
                  </div>
                  <button
                    v-else
                    type="button"
                    class="w-full h-20 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center gap-1.5 text-gray-400 hover:border-primary-300 hover:text-primary-500 transition-colors"
                    @click="mockFileUpload('sds')"
                  >
                    <Upload class="w-5 h-5" />
                    <span class="text-xs">点击上传SDS</span>
                  </button>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">质检报告</label>
                  <div v-if="formData.qcReportAttachment" class="bg-white rounded-lg p-3 border border-gray-200">
                    <div class="flex items-center gap-2 text-sm">
                      <FileCheck2 class="w-4 h-4 text-success-600 flex-shrink-0" />
                      <span class="flex-1 truncate text-gray-700">{{ formData.qcReportAttachment.name }}</span>
                      <button
                        type="button"
                        class="p-1 text-red-500 hover:bg-red-50 rounded"
                        @click="removeAttachment('qc')"
                      >
                        <X class="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div class="text-xs text-gray-400 mt-1">{{ formatFileSize(formData.qcReportAttachment.size) }}</div>
                  </div>
                  <button
                    v-else
                    type="button"
                    class="w-full h-20 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center gap-1.5 text-gray-400 hover:border-primary-300 hover:text-primary-500 transition-colors"
                    @click="mockFileUpload('qc')"
                  >
                    <Upload class="w-5 h-5" />
                    <span class="text-xs">上传质检报告</span>
                  </button>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">试剂图片</label>
                  <div v-if="formData.reagentImage" class="bg-white rounded-lg p-3 border border-gray-200">
                    <div class="flex items-center gap-2 text-sm">
                      <ImageIcon class="w-4 h-4 text-indigo-600 flex-shrink-0" />
                      <span class="flex-1 truncate text-gray-700">试剂图片</span>
                      <button
                        type="button"
                        class="p-1 text-red-500 hover:bg-red-50 rounded"
                        @click="removeAttachment('image')"
                      >
                        <X class="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <button
                    v-else
                    type="button"
                    class="w-full h-20 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center gap-1.5 text-gray-400 hover:border-primary-300 hover:text-primary-500 transition-colors"
                    @click="mockFileUpload('image')"
                  >
                    <Upload class="w-5 h-5" />
                    <span class="text-xs">上传试剂图片</span>
                  </button>
                </div>
              </div>
            </div>

            <div class="bg-gray-50 rounded-lg p-4">
              <h4 class="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <ToggleRight class="w-4 h-4 text-primary-600" />其他信息
              </h4>
              <div class="space-y-4">
                <div class="flex items-center gap-3">
                  <button
                    type="button"
                    class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                    :class="formData.enabled ? 'bg-primary-600' : 'bg-gray-300'"
                    @click="formData.enabled = !formData.enabled"
                  >
                    <span
                      class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                      :class="formData.enabled ? 'translate-x-6' : 'translate-x-1'"
                    />
                  </button>
                  <span class="text-sm text-gray-700 font-medium">
                    {{ formData.enabled ? '启用状态' : '停用状态' }}
                  </span>
                  <span class="text-xs text-gray-400">停用后该试剂将不参与日常业务流程</span>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">描述</label>
                  <textarea
                    v-model="formData.description"
                    rows="3"
                    class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all resize-none"
                    placeholder="请输入试剂描述、用途等信息"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 flex-shrink-0">
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
            <span v-if="formLoading" class="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            {{ formMode === 'create' ? '创建' : '保存' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 详情弹窗 -->
    <div
      v-if="showDetailModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      @click.self="showDetailModal = false"
    >
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] overflow-hidden">
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0 bg-gradient-to-r from-primary-50 to-white">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
              <FlaskConical class="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h3 class="text-lg font-semibold text-gray-800">{{ detailData?.name || '试剂详情' }}</h3>
              <div class="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                <span v-if="detailData?.casNumber" class="font-mono">CAS: {{ detailData.casNumber }}</span>
                <span v-if="detailData?.hazardLevel" :class="['px-1.5 py-0.5 rounded text-xs', hazardLevelColors[detailData.hazardLevel]]">
                  {{ hazardLevelLabels[detailData.hazardLevel] }}
                </span>
                <span v-if="detailData" :class="['px-1.5 py-0.5 rounded text-xs', getEnabledColor(detailData.enabled)]">
                  {{ getEnabledLabel(detailData.enabled) }}
                </span>
              </div>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button
              v-if="detailData"
              class="px-4 py-2 text-primary-600 hover:bg-primary-50 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
              @click="openEditModal(detailData.id); showDetailModal = false"
            >
              <Edit2 class="w-4 h-4" />
              编辑
            </button>
            <button
              class="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              @click="showDetailModal = false"
            >
              <X class="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>
        
        <div class="p-6 overflow-y-auto" style="max-height: calc(92vh - 80px);">
          <div v-if="detailLoading" class="py-20 flex items-center justify-center">
            <div class="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
          </div>

          <div v-else-if="detailData" class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div class="md:col-span-3 space-y-5">
                <div class="bg-gray-50 rounded-xl p-5">
                  <h4 class="text-sm font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-200">基础信息</h4>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                    <div class="flex gap-2">
                      <span class="text-sm text-gray-500 w-24 flex-shrink-0">试剂名称</span>
                      <span class="text-sm text-gray-800 font-medium">{{ detailData.name }}</span>
                    </div>
                    <div class="flex gap-2">
                      <span class="text-sm text-gray-500 w-24 flex-shrink-0">分类</span>
                      <span class="text-sm text-gray-800">{{ detailData.category }}</span>
                    </div>
                    <div class="flex gap-2">
                      <span class="text-sm text-gray-500 w-24 flex-shrink-0">CAS号</span>
                      <span class="text-sm text-gray-800 font-mono">{{ detailData.casNumber || '-' }}</span>
                    </div>
                    <div class="flex gap-2">
                      <span class="text-sm text-gray-500 w-24 flex-shrink-0">生产厂家</span>
                      <span class="text-sm text-gray-800">{{ detailData.manufacturer || '-' }}</span>
                    </div>
                    <div class="flex gap-2 md:col-span-2">
                      <span class="text-sm text-gray-500 w-24 flex-shrink-0">别名</span>
                      <span class="text-sm text-gray-800">{{ detailData.aliases || '-' }}</span>
                    </div>
                  </div>
                </div>

                <div class="bg-gray-50 rounded-xl p-5">
                  <h4 class="text-sm font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-200">规格参数</h4>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                    <div class="flex gap-2">
                      <span class="text-sm text-gray-500 w-28 flex-shrink-0">品牌</span>
                      <span class="text-sm text-gray-800">{{ detailData.brand || '-' }}</span>
                    </div>
                    <div class="flex gap-2">
                      <span class="text-sm text-gray-500 w-28 flex-shrink-0">货号</span>
                      <span class="text-sm text-gray-800 font-mono">{{ detailData.catalogNumber || '-' }}</span>
                    </div>
                    <div class="flex gap-2">
                      <span class="text-sm text-gray-500 w-28 flex-shrink-0">纯度</span>
                      <span class="text-sm text-gray-800">{{ detailData.purity || '-' }}</span>
                    </div>
                    <div class="flex gap-2">
                      <span class="text-sm text-gray-500 w-28 flex-shrink-0">浓度</span>
                      <span class="text-sm text-gray-800">{{ detailData.concentration || '-' }}</span>
                    </div>
                    <div class="flex gap-2">
                      <span class="text-sm text-gray-500 w-28 flex-shrink-0">规格</span>
                      <span class="text-sm text-gray-800">{{ detailData.specification }}</span>
                    </div>
                    <div class="flex gap-2">
                      <span class="text-sm text-gray-500 w-28 flex-shrink-0">单位</span>
                      <span class="text-sm text-gray-800">{{ detailData.unit }}</span>
                    </div>
                    <div class="flex gap-2">
                      <span class="text-sm text-gray-500 w-28 flex-shrink-0">包装规格</span>
                      <span class="text-sm text-gray-800">{{ detailData.packagingSpec || '-' }}</span>
                    </div>
                    <div class="flex gap-2">
                      <span class="text-sm text-gray-500 w-28 flex-shrink-0">开封后有效期</span>
                      <span class="text-sm text-gray-800">{{ detailData.openedValidity || '-' }}</span>
                    </div>
                  </div>
                </div>

                <div class="bg-gray-50 rounded-xl p-5">
                  <h4 class="text-sm font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-200">存储与安全</h4>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                    <div class="flex gap-2">
                      <span class="text-sm text-gray-500 w-28 flex-shrink-0">储存条件</span>
                      <span class="text-sm text-gray-800">{{ detailData.storageCondition }}</span>
                    </div>
                    <div class="flex gap-2">
                      <span class="text-sm text-gray-500 w-28 flex-shrink-0">危害等级</span>
                      <span
                        v-if="detailData.hazardLevel"
                        :class="['inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', hazardLevelColors[detailData.hazardLevel]]"
                      >
                        {{ hazardLevelLabels[detailData.hazardLevel] }}
                      </span>
                      <span v-else class="text-sm text-gray-400">-</span>
                    </div>
                    <div class="flex gap-2 md:col-span-2">
                      <span class="text-sm text-gray-500 w-28 flex-shrink-0 pt-0.5">禁配信息</span>
                      <span class="text-sm text-gray-800">{{ detailData.incompatibilities || '暂无' }}</span>
                    </div>
                  </div>
                </div>

                <div class="bg-gray-50 rounded-xl p-5">
                  <h4 class="text-sm font-semibold text-gray-700 mb-3 pb-2 border-b border-gray-200">适用实验类型</h4>
                  <div class="flex flex-wrap gap-2">
                    <span
                      v-for="t in detailData.experimentTypes?.length ? detailData.experimentTypes : ['暂未设置']"
                      :key="t"
                      class="px-2.5 py-1 rounded-lg text-xs"
                      :class="detailData.experimentTypes?.length ? 'bg-primary-50 text-primary-700' : 'text-gray-400 bg-gray-100'"
                    >
                      {{ t }}
                    </span>
                  </div>
                </div>

                <div v-if="detailData.description" class="bg-gray-50 rounded-xl p-5">
                  <h4 class="text-sm font-semibold text-gray-700 mb-3 pb-2 border-b border-gray-200">描述信息</h4>
                  <p class="text-sm text-gray-700 leading-relaxed">{{ detailData.description }}</p>
                </div>
              </div>

              <div class="space-y-4">
                <div class="bg-gray-50 rounded-xl p-5">
                  <h4 class="text-sm font-semibold text-gray-700 mb-3 pb-2 border-b border-gray-200">试剂图片</h4>
                  <div v-if="detailData.reagentImage" class="aspect-square rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden">
                    <ImageIcon class="w-10 h-10 text-gray-400" />
                  </div>
                  <div v-else class="aspect-square rounded-lg bg-white border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 gap-2">
                    <ImageIcon class="w-8 h-8" />
                    <span class="text-xs">暂无图片</span>
                  </div>
                </div>

                <div class="bg-gray-50 rounded-xl p-5">
                  <h4 class="text-sm font-semibold text-gray-700 mb-3 pb-2 border-b border-gray-200">附件资料</h4>
                  <div class="space-y-2">
                    <div
                      v-if="detailData.sdsAttachment"
                      class="flex items-center gap-2 bg-white rounded-lg p-3 border border-gray-200 hover:border-primary-200 transition-colors cursor-pointer"
                    >
                      <FileText class="w-4 h-4 text-primary-600 flex-shrink-0" />
                      <div class="flex-1 min-w-0">
                        <div class="text-sm text-gray-700 truncate">{{ detailData.sdsAttachment.name }}</div>
                        <div class="text-xs text-gray-400">{{ formatFileSize(detailData.sdsAttachment.size) }}</div>
                      </div>
                      <Download class="w-4 h-4 text-gray-400" />
                    </div>
                    <div v-else class="text-xs text-gray-400 bg-white rounded-lg p-3 border border-gray-200">暂无 SDS/MSDS</div>

                    <div
                      v-if="detailData.qcReportAttachment"
                      class="flex items-center gap-2 bg-white rounded-lg p-3 border border-gray-200 hover:border-success-200 transition-colors cursor-pointer"
                    >
                      <FileCheck2 class="w-4 h-4 text-success-600 flex-shrink-0" />
                      <div class="flex-1 min-w-0">
                        <div class="text-sm text-gray-700 truncate">{{ detailData.qcReportAttachment.name }}</div>
                        <div class="text-xs text-gray-400">{{ formatFileSize(detailData.qcReportAttachment.size) }}</div>
                      </div>
                      <Download class="w-4 h-4 text-gray-400" />
                    </div>
                    <div v-else class="text-xs text-gray-400 bg-white rounded-lg p-3 border border-gray-200">暂无质检报告</div>
                  </div>
                </div>

                <div class="bg-gray-50 rounded-xl p-5">
                  <h4 class="text-sm font-semibold text-gray-700 mb-3 pb-2 border-b border-gray-200">系统信息</h4>
                  <div class="space-y-2 text-sm">
                    <div class="flex justify-between">
                      <span class="text-gray-500">状态</span>
                      <span :class="['px-2 py-0.5 rounded-full text-xs font-medium', getEnabledColor(detailData.enabled)]">
                        {{ getEnabledLabel(detailData.enabled) }}
                      </span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-gray-500">创建时间</span>
                      <span class="text-gray-700 text-xs">{{ formatDate(detailData.createdAt, 'YYYY-MM-DD HH:mm') }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-gray-500">更新时间</span>
                      <span class="text-gray-700 text-xs">{{ formatDate(detailData.updatedAt, 'YYYY-MM-DD HH:mm') }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="py-20 text-center">
            <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <FlaskConical class="w-8 h-8 text-gray-300" />
            </div>
            <p class="text-gray-400">未找到该试剂信息</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
