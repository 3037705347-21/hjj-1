<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import {
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  Filter,
  FileText,
  User,
  Clock,
  Monitor,
  ArrowRightLeft,
  Eye,
  X,
  RotateCcw,
} from 'lucide-vue-next'
import type {
  AuditLog,
  AuditModule,
  AuditOperationType,
  AuditLogFilterParams,
} from '@/types/audit'
import {
  auditModuleLabels,
  auditOperationTypeLabels,
} from '@/types/audit'
import { roleLabels } from '@/types/user'
import { mockGetAuditLogs, mockExportAuditLogs } from '@/mock/audit'
import type { PageResult } from '@/types/common'
import { formatDate } from '@/utils/date'
import { exportToCsv, type CsvColumn } from '@/utils/csv'
import { usePermission } from '@/composables/usePermission'

const permission = usePermission()

const loading = ref(false)
const data = ref<PageResult<AuditLog> | null>(null)

const filters = reactive<AuditLogFilterParams & { timeRange: [string, string] }>({
  keyword: '',
  module: '',
  operationType: '',
  operatorName: '',
  timeRange: ['', ''],
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
})

const showDetailModal = ref(false)
const currentLog = ref<AuditLog | null>(null)

const moduleOptions = Object.entries(auditModuleLabels) as [AuditModule, string][]

const operationTypeOptions = computed(() => {
  const allTypes = Object.entries(auditOperationTypeLabels) as [AuditOperationType, string][]
  if (!filters.module) return allTypes
  return allTypes
})

const fetchLogs = async () => {
  loading.value = true
  try {
    const params: AuditLogFilterParams = {
      keyword: filters.keyword || undefined,
      module: (filters.module || undefined) as AuditModule | undefined,
      operationType: (filters.operationType || undefined) as AuditOperationType | undefined,
      operatorName: filters.operatorName || undefined,
      startTime: filters.timeRange?.[0] || undefined,
      endTime: filters.timeRange?.[1] || undefined,
    }
    data.value = await mockGetAuditLogs(pagination.page, pagination.pageSize, params)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  fetchLogs()
}

const handleReset = () => {
  filters.keyword = ''
  filters.module = ''
  filters.operationType = ''
  filters.operatorName = ''
  filters.timeRange = ['', '']
  pagination.page = 1
  fetchLogs()
}

const handlePageChange = (page: number) => {
  pagination.page = page
  fetchLogs()
}

const totalPages = computed(() => {
  if (!data.value) return 0
  return Math.ceil(data.value.total / pagination.pageSize)
})

const openDetail = (log: AuditLog) => {
  currentLog.value = log
  showDetailModal.value = true
}

const handleExport = async () => {
  try {
    const params: AuditLogFilterParams = {
      keyword: filters.keyword || undefined,
      module: (filters.module || undefined) as AuditModule | undefined,
      operationType: (filters.operationType || undefined) as AuditOperationType | undefined,
      operatorName: filters.operatorName || undefined,
      startTime: filters.timeRange?.[0] || undefined,
      endTime: filters.timeRange?.[1] || undefined,
    }
    const logs = await mockExportAuditLogs(params)

    const columns: CsvColumn<AuditLog>[] = [
      { key: 'operationTime', label: '操作时间', formatter: (v) => formatDate(v, 'YYYY-MM-DD HH:mm:ss') },
      { key: 'operatorName', label: '操作人' },
      { key: 'operatorRole', label: '角色', formatter: (v) => roleLabels[v] || v },
      { key: 'module', label: '模块', formatter: (v) => auditModuleLabels[v] || v },
      { key: 'operationType', label: '操作类型', formatter: (v) => auditOperationTypeLabels[v] || v },
      { key: 'targetName', label: '操作对象' },
      { key: 'beforeContent', label: '变更前' },
      { key: 'afterContent', label: '变更后' },
      { key: 'terminalInfo', label: '终端信息' },
      { key: 'remark', label: '备注' },
    ]

    exportToCsv(logs, columns, `审计日志_${formatDate(new Date().toISOString(), 'YYYY-MM-DD')}.csv`)
  } catch (e: any) {
    alert(e.message || '导出失败')
  }
}

const getModuleColor = (module: AuditModule): string => {
  const colors: Record<AuditModule, string> = {
    auth: 'bg-blue-100 text-blue-700',
    reagent: 'bg-purple-100 text-purple-700',
    batch: 'bg-cyan-100 text-cyan-700',
    consumable: 'bg-emerald-100 text-emerald-700',
    alert: 'bg-amber-100 text-amber-700',
    approval: 'bg-indigo-100 text-indigo-700',
    system: 'bg-gray-100 text-gray-700',
    purchase: 'bg-orange-100 text-orange-700',
    supplier: 'bg-teal-100 text-teal-700',
    requisition: 'bg-pink-100 text-pink-700',
    stocktake: 'bg-rose-100 text-rose-700',
  }
  return colors[module] || 'bg-gray-100 text-gray-700'
}

const getOperationTypeColor = (type: AuditOperationType): string => {
  if (['create', 'inbound', 'stock_in', 'unfreeze', 'open', 'approval_approve'].includes(type)) {
    return 'bg-green-100 text-green-700'
  }
  if (['delete', 'batch_delete', 'scrap', 'freeze', 'login_fail', 'approval_reject'].includes(type)) {
    return 'bg-red-100 text-red-700'
  }
  if (['update', 'batch_update', 'adjust', 'update_rule', 'toggle_rule', 'config_change', 'extend_retest', 'retest'].includes(type)) {
    return 'bg-blue-100 text-blue-700'
  }
  if (['outbound', 'stock_out', 'use', 'transfer', 'return'].includes(type)) {
    return 'bg-orange-100 text-orange-700'
  }
  if (['login', 'logout'].includes(type)) {
    return 'bg-slate-100 text-slate-700'
  }
  if (['handle', 'resolve', 'assign', 'ignore', 'read'].includes(type)) {
    return 'bg-amber-100 text-amber-700'
  }
  return 'bg-gray-100 text-gray-700'
}

onMounted(() => {
  fetchLogs()
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">审计日志</h1>
        <p class="text-sm text-gray-500 mt-0.5">统一操作日志与审计追踪，覆盖所有关键业务操作</p>
      </div>
      <button
        v-if="permission.hasPermission('audit:export')"
        class="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
        @click="handleExport"
      >
        <Download class="w-4 h-4" />
        导出日志
      </button>
    </div>

    <div class="bg-white rounded-xl shadow-card p-5">
      <div class="flex items-center gap-2 mb-4">
        <Filter class="w-4 h-4 text-gray-400" />
        <span class="text-sm font-medium text-gray-700">筛选条件</span>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <div>
          <label class="block text-xs text-gray-500 mb-1">关键词</label>
          <input
            v-model="filters.keyword"
            type="text"
            placeholder="操作人/对象/备注"
            class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            @keyup.enter="handleSearch"
          />
        </div>
        <div>
          <label class="block text-xs text-gray-500 mb-1">模块</label>
          <select
            v-model="filters.module"
            class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white"
          >
            <option value="">全部模块</option>
            <option
              v-for="[value, label] in moduleOptions"
              :key="value"
              :value="value"
            >
              {{ label }}
            </option>
          </select>
        </div>
        <div>
          <label class="block text-xs text-gray-500 mb-1">操作类型</label>
          <select
            v-model="filters.operationType"
            class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white"
          >
            <option value="">全部类型</option>
            <option
              v-for="[value, label] in operationTypeOptions"
              :key="value"
              :value="value"
            >
              {{ label }}
            </option>
          </select>
        </div>
        <div>
          <label class="block text-xs text-gray-500 mb-1">操作人</label>
          <input
            v-model="filters.operatorName"
            type="text"
            placeholder="输入操作人姓名"
            class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            @keyup.enter="handleSearch"
          />
        </div>
        <div>
          <label class="block text-xs text-gray-500 mb-1">开始时间</label>
          <input
            v-model="filters.timeRange[0]"
            type="date"
            class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
          />
        </div>
        <div>
          <label class="block text-xs text-gray-500 mb-1">结束时间</label>
          <input
            v-model="filters.timeRange[1]"
            type="date"
            class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
          />
        </div>
      </div>
      <div class="flex items-center gap-2 mt-4">
        <button
          class="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
          @click="handleSearch"
        >
          <Search class="w-4 h-4" />
          查询
        </button>
        <button
          class="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          @click="handleReset"
        >
          <RotateCcw class="w-4 h-4" />
          重置
        </button>
      </div>
    </div>

    <div class="bg-white rounded-xl shadow-card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-gray-50 border-b border-gray-100">
              <th class="text-left py-3 px-4 font-medium text-gray-600 whitespace-nowrap">操作时间</th>
              <th class="text-left py-3 px-4 font-medium text-gray-600 whitespace-nowrap">操作人</th>
              <th class="text-left py-3 px-4 font-medium text-gray-600 whitespace-nowrap">角色</th>
              <th class="text-left py-3 px-4 font-medium text-gray-600 whitespace-nowrap">模块</th>
              <th class="text-left py-3 px-4 font-medium text-gray-600 whitespace-nowrap">操作类型</th>
              <th class="text-left py-3 px-4 font-medium text-gray-600 whitespace-nowrap">操作对象</th>
              <th class="text-left py-3 px-4 font-medium text-gray-600 whitespace-nowrap">变更前</th>
              <th class="text-left py-3 px-4 font-medium text-gray-600 whitespace-nowrap">变更后</th>
              <th class="text-left py-3 px-4 font-medium text-gray-600 whitespace-nowrap">终端</th>
              <th class="text-center py-3 px-4 font-medium text-gray-600 whitespace-nowrap">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-if="loading"
            >
              <td
                colspan="10"
                class="py-12 text-center text-gray-400"
              >
                <div class="flex items-center justify-center gap-2">
                  <svg
                    class="animate-spin h-5 w-5 text-primary-500"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      class="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      stroke-width="4"
                    />
                    <path
                      class="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  加载中...
                </div>
              </td>
            </tr>
            <tr
              v-else-if="!data?.list.length"
            >
              <td
                colspan="10"
                class="py-12 text-center text-gray-400"
              >
                <div class="flex flex-col items-center gap-2">
                  <FileText class="w-10 h-10 text-gray-300" />
                  <span>暂无审计日志</span>
                </div>
              </td>
            </tr>
            <tr
              v-for="log in data?.list"
              :key="log.id"
              class="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
            >
              <td class="py-3 px-4 whitespace-nowrap text-gray-600">
                <div class="flex items-center gap-1.5">
                  <Clock class="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  {{ formatDate(log.operationTime, 'YYYY-MM-DD HH:mm:ss') }}
                </div>
              </td>
              <td class="py-3 px-4 whitespace-nowrap">
                <div class="flex items-center gap-1.5">
                  <User class="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  <span class="font-medium text-gray-800">{{ log.operatorName }}</span>
                </div>
              </td>
              <td class="py-3 px-4 whitespace-nowrap">
                <span class="inline-block px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                  {{ roleLabels[log.operatorRole] || log.operatorRole }}
                </span>
              </td>
              <td class="py-3 px-4 whitespace-nowrap">
                <span
                  class="inline-block px-2 py-0.5 rounded text-xs font-medium"
                  :class="getModuleColor(log.module)"
                >
                  {{ auditModuleLabels[log.module] }}
                </span>
              </td>
              <td class="py-3 px-4 whitespace-nowrap">
                <span
                  class="inline-block px-2 py-0.5 rounded text-xs font-medium"
                  :class="getOperationTypeColor(log.operationType)"
                >
                  {{ auditOperationTypeLabels[log.operationType] }}
                </span>
              </td>
              <td class="py-3 px-4">
                <span
                  class="text-gray-800 max-w-[160px] truncate block"
                  :title="log.targetName"
                >{{ log.targetName }}</span>
              </td>
              <td class="py-3 px-4">
                <span
                  class="text-gray-500 max-w-[120px] truncate block text-xs"
                  :title="log.beforeContent"
                >{{ log.beforeContent || '-' }}</span>
              </td>
              <td class="py-3 px-4">
                <span
                  class="text-gray-800 max-w-[120px] truncate block text-xs font-medium"
                  :title="log.afterContent"
                >{{ log.afterContent || '-' }}</span>
              </td>
              <td class="py-3 px-4 whitespace-nowrap">
                <div class="flex items-center gap-1 text-xs text-gray-400">
                  <Monitor class="w-3 h-3 flex-shrink-0" />
                  {{ log.terminalInfo }}
                </div>
              </td>
              <td class="py-3 px-4 text-center">
                <button
                  class="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 text-xs font-medium transition-colors"
                  @click="openDetail(log)"
                >
                  <Eye class="w-3.5 h-3.5" />
                  详情
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div
        v-if="data && data.total > 0"
        class="flex items-center justify-between px-4 py-3 border-t border-gray-100"
      >
        <div class="text-sm text-gray-500">
          共 {{ data.total }} 条记录，第 {{ pagination.page }} / {{ totalPages }} 页
        </div>
        <div class="flex items-center gap-1">
          <button
            :disabled="pagination.page <= 1"
            class="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            @click="handlePageChange(pagination.page - 1)"
          >
            <ChevronLeft class="w-4 h-4" />
          </button>
          <template
            v-for="p in totalPages"
            :key="p"
          >
            <button
              v-if="totalPages <= 7 || Math.abs(p - pagination.page) <= 2 || p === 1 || p === totalPages"
              class="w-8 h-8 rounded-lg text-sm font-medium transition-colors"
              :class="p === pagination.page ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-100'"
              @click="handlePageChange(p)"
            >
              {{ p }}
            </button>
            <span
              v-else-if="Math.abs(p - pagination.page) === 3"
              class="px-1 text-gray-400"
            >...</span>
          </template>
          <button
            :disabled="pagination.page >= totalPages"
            class="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            @click="handlePageChange(pagination.page + 1)"
          >
            <ChevronRight class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="showDetailModal && currentLog"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        class="absolute inset-0 bg-black/50"
        @click="showDetailModal = false"
      />
      <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <div class="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h3 class="text-lg font-bold text-gray-800">日志详情</h3>
          <button
            class="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            @click="showDetailModal = false"
          >
            <X class="w-5 h-5 text-gray-400" />
          </button>
        </div>
        <div class="p-6 space-y-5">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <div class="text-xs text-gray-500 mb-1">操作时间</div>
              <div class="text-sm font-medium text-gray-800 flex items-center gap-1.5">
                <Clock class="w-4 h-4 text-gray-400" />
                {{ formatDate(currentLog.operationTime, 'YYYY-MM-DD HH:mm:ss') }}
              </div>
            </div>
            <div>
              <div class="text-xs text-gray-500 mb-1">操作人</div>
              <div class="text-sm font-medium text-gray-800 flex items-center gap-1.5">
                <User class="w-4 h-4 text-gray-400" />
                {{ currentLog.operatorName }}
                <span class="inline-block px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
                  {{ roleLabels[currentLog.operatorRole] }}
                </span>
              </div>
            </div>
            <div>
              <div class="text-xs text-gray-500 mb-1">所属模块</div>
              <span
                class="inline-block px-2.5 py-1 rounded-md text-xs font-medium"
                :class="getModuleColor(currentLog.module)"
              >
                {{ auditModuleLabels[currentLog.module] }}
              </span>
            </div>
            <div>
              <div class="text-xs text-gray-500 mb-1">操作类型</div>
              <span
                class="inline-block px-2.5 py-1 rounded-md text-xs font-medium"
                :class="getOperationTypeColor(currentLog.operationType)"
              >
                {{ auditOperationTypeLabels[currentLog.operationType] }}
              </span>
            </div>
            <div>
              <div class="text-xs text-gray-500 mb-1">操作对象类型</div>
              <div class="text-sm text-gray-800">{{ currentLog.targetType }}</div>
            </div>
            <div>
              <div class="text-xs text-gray-500 mb-1">操作对象</div>
              <div class="text-sm font-medium text-gray-800">{{ currentLog.targetName }}</div>
            </div>
            <div>
              <div class="text-xs text-gray-500 mb-1">操作对象ID</div>
              <div class="text-sm text-gray-500 font-mono">{{ currentLog.targetId }}</div>
            </div>
            <div>
              <div class="text-xs text-gray-500 mb-1">终端信息</div>
              <div class="text-sm text-gray-600 flex items-center gap-1.5">
                <Monitor class="w-4 h-4 text-gray-400" />
                {{ currentLog.terminalInfo }}
              </div>
            </div>
          </div>

          <div class="border-t border-gray-100 pt-4">
            <div class="text-xs text-gray-500 mb-2 flex items-center gap-1.5">
              <ArrowRightLeft class="w-4 h-4" />
              变更内容
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div class="bg-red-50 rounded-lg p-3">
                <div class="text-xs text-red-500 font-medium mb-1">变更前</div>
                <div class="text-sm text-red-800 whitespace-pre-wrap break-all">
                  {{ currentLog.beforeContent || '（无）' }}
                </div>
              </div>
              <div class="bg-green-50 rounded-lg p-3">
                <div class="text-xs text-green-600 font-medium mb-1">变更后</div>
                <div class="text-sm text-green-800 whitespace-pre-wrap break-all">
                  {{ currentLog.afterContent || '（无）' }}
                </div>
              </div>
            </div>
          </div>

          <div
            v-if="currentLog.remark"
            class="border-t border-gray-100 pt-4"
          >
            <div class="text-xs text-gray-500 mb-1">备注</div>
            <div class="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">
              {{ currentLog.remark }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
