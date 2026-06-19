<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  AlertTriangle,
  Settings,
  Search,
  Check,
  X,
  User,
  UserPlus,
  MessageSquare,
  Clock,
  ChevronLeft,
  ChevronRight,
  Filter,
  Bell,
  BellOff,
  CheckCircle,
  XCircle,
  History,
  Send,
  MoreHorizontal,
  Eye,
  Calendar,
  UserCheck,
} from 'lucide-vue-next'
import type {
  AlertRule,
  AlertRecord,
  AlertHandleRecord,
  AlertType,
  AlertLevel,
  AlertStatus,
  AlertTargetType,
} from '@/types/alert'
import {
  alertTypeLabels,
  alertLevelLabels,
  alertLevelColors,
  alertLevelBadgeColors,
  alertStatusLabels,
  alertStatusColors,
  alertTargetTypeLabels,
  availableHandlers,
} from '@/types/alert'
import {
  mockGetAlertRules,
  mockToggleAlertRule,
  mockUpdateAlertRule,
  mockGetAlerts,
  mockMarkAlertRead,
  mockIgnoreAlert,
  mockAssignAlert,
  mockResolveAlert,
  mockGetAlertHandleRecords,
  mockGetAlertStats,
  type AlertFilterParams,
} from '@/mock/alerts'
import type { PageResult } from '@/types/common'
import { formatDate } from '@/utils/date'
import { usePermission } from '@/composables/usePermission'
import { useAuditLog } from '@/composables/useAuditLog'

const auditLog = useAuditLog()

const originalRuleData = ref<AlertRule | null>(null)

function formatAlertContent(a: AlertRecord): string {
  const parts: string[] = []
  parts.push(`类型: ${alertTypeLabels[a.type] || a.type}`)
  parts.push(`级别: ${alertLevelLabels[a.level] || a.level}`)
  parts.push(`对象: ${a.targetName}`)
  parts.push(`状态: ${alertStatusLabels[a.status] || a.status}`)
  if (a.assigneeName) parts.push(`处理人: ${a.assigneeName}`)
  return parts.join(', ')
}

function formatRuleContent(r: AlertRule | any): string {
  const parts: string[] = []
  parts.push(`级别: ${alertLevelLabels[r.level] || r.level}`)
  parts.push(`阈值: ${r.threshold ?? '默认'}`)
  parts.push(`状态: ${r.enabled ? '启用' : '禁用'}`)
  if (r.description) parts.push(`描述: ${r.description}`)
  return parts.join(', ')
}

const router = useRouter()
const permission = usePermission()
const activeTab = ref<'list' | 'rules'>('list')

const loading = ref(false)
const data = ref<PageResult<AlertRecord> | null>(null)
const stats = ref<{ total: number; unread: number; critical: number; warning: number; processing: number; resolved: number } | null>(null)

const rulesLoading = ref(false)
const rulesData = ref<AlertRule[]>([])

const filters = reactive<AlertFilterParams & { createTime: [string, string] }>({
  keyword: '',
  type: '',
  level: '',
  status: '',
  assignee: '',
  targetType: '',
  createTime: ['', ''],
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
})

const showDetailModal = ref(false)
const currentAlert = ref<AlertRecord | null>(null)
const alertHandleRecords = ref<AlertHandleRecord[]>([])
const detailLoading = ref(false)

const showActionModal = ref(false)
const actionMode = ref<'ignore' | 'assign' | 'resolve'>('ignore')
const actionLoading = ref(false)
const actionForm = reactive({
  remark: '',
  result: '',
  assignee: '',
  assigneeName: '',
})

const showRuleEditModal = ref(false)
const ruleEditLoading = ref(false)
const currentRule = ref<AlertRule | null>(null)
const ruleForm = reactive({
  name: '',
  description: '',
  level: 'info' as AlertLevel,
  enabled: true,
  threshold: undefined as number | undefined,
})

const fetchStats = async () => {
  try {
    stats.value = await mockGetAlertStats()
  } catch (e) {
    console.error('Failed to fetch stats', e)
  }
}

const fetchAlerts = async () => {
  loading.value = true
  try {
    const params: AlertFilterParams = {
      keyword: filters.keyword || undefined,
      type: filters.type || undefined,
      level: filters.level || undefined,
      status: filters.status || undefined,
      assignee: filters.assignee || undefined,
      targetType: filters.targetType || undefined,
      startTime: filters.createTime?.[0] || undefined,
      endTime: filters.createTime?.[1] || undefined,
    }
    data.value = await mockGetAlerts(pagination.page, pagination.pageSize, params)
  } finally {
    loading.value = false
  }
}

const fetchRules = async () => {
  rulesLoading.value = true
  try {
    rulesData.value = await mockGetAlertRules()
  } finally {
    rulesLoading.value = false
  }
}

const handleTabChange = (tab: 'list' | 'rules') => {
  activeTab.value = tab
  if (tab === 'rules' && rulesData.value.length === 0) {
    fetchRules()
  }
}

const handleSearch = () => {
  pagination.page = 1
  fetchAlerts()
}

const handleReset = () => {
  filters.keyword = ''
  filters.type = ''
  filters.level = ''
  filters.status = ''
  filters.assignee = ''
  filters.targetType = ''
  filters.createTime = ['', '']
  pagination.page = 1
  fetchAlerts()
}

const handlePageChange = (page: number) => {
  pagination.page = page
  fetchAlerts()
}

const totalPages = computed(() => {
  if (!data.value) return 0
  return Math.ceil(data.value.total / pagination.pageSize)
})

const openAlertDetail = async (alertItem: AlertRecord) => {
  currentAlert.value = alertItem
  showDetailModal.value = true
  if (alertItem.status === 'unread') {
    await mockMarkAlertRead(alertItem.id)
    auditLog.logAlertHandle(alertItem.id, alertItem.title, 'mark_read', formatAlertContent(alertItem), '标记已读')
    alertItem.status = 'read'
    fetchStats()
  }
  detailLoading.value = true
  try {
    alertHandleRecords.value = await mockGetAlertHandleRecords(alertItem.id)
  } finally {
    detailLoading.value = false
  }
}

const openActionModal = (mode: 'ignore' | 'assign' | 'resolve', alert: AlertRecord) => {
  actionMode.value = mode
  currentAlert.value = alert
  actionForm.remark = ''
  actionForm.result = ''
  actionForm.assignee = ''
  actionForm.assigneeName = ''
  showActionModal.value = true
}

const handleActionSubmit = async () => {
  if (!currentAlert.value) return
  actionLoading.value = true
  try {
    const beforeContent = formatAlertContent(currentAlert.value)
    if (actionMode.value === 'ignore') {
      await mockIgnoreAlert(currentAlert.value.id, actionForm.remark)
      auditLog.logAlertHandle(currentAlert.value.id, currentAlert.value.title, 'ignore', beforeContent, actionForm.remark || '忽略预警')
    } else if (actionMode.value === 'assign') {
      if (!actionForm.assignee) {
        alert('请选择处理人')
        return
      }
      await mockAssignAlert(currentAlert.value.id, actionForm.assignee, actionForm.assigneeName)
      auditLog.logAlertHandle(currentAlert.value.id, currentAlert.value.title, 'assign', beforeContent, `转交给: ${actionForm.assigneeName}`)
    } else if (actionMode.value === 'resolve') {
      if (!actionForm.result.trim()) {
        alert('请填写处理结果')
        return
      }
      await mockResolveAlert(currentAlert.value.id, actionForm.result)
      auditLog.logAlertHandle(currentAlert.value.id, currentAlert.value.title, 'resolve', beforeContent, `处理结果: ${actionForm.result}`)
    }
    showActionModal.value = false
    fetchAlerts()
    fetchStats()
    if (showDetailModal.value) {
      alertHandleRecords.value = await mockGetAlertHandleRecords(currentAlert.value.id)
      const updated = await mockGetAlerts(1, 100)
      const found = updated.list.find((a) => a.id === currentAlert.value?.id)
      if (found) {
        currentAlert.value = found
      }
    }
  } catch (e: any) {
    alert(e.message || '操作失败')
  } finally {
    actionLoading.value = false
  }
}

const handleMarkRead = async (alertItem: AlertRecord) => {
  try {
    const beforeContent = formatAlertContent(alertItem)
    await mockMarkAlertRead(alertItem.id)
    auditLog.logAlertHandle(alertItem.id, alertItem.title, 'mark_read', beforeContent, '标记已读')
    fetchAlerts()
    fetchStats()
  } catch (e: any) {
    alert(e.message || '操作失败')
  }
}

const handleSelectAssignee = (handler: typeof availableHandlers[0]) => {
  actionForm.assignee = handler.id
  actionForm.assigneeName = handler.name
}

const openRuleEdit = (rule: AlertRule) => {
  currentRule.value = rule
  originalRuleData.value = { ...rule }
  ruleForm.name = rule.name
  ruleForm.description = rule.description
  ruleForm.level = rule.level
  ruleForm.enabled = rule.enabled
  ruleForm.threshold = rule.threshold
  showRuleEditModal.value = true
}

const handleRuleToggle = async (rule: AlertRule) => {
  try {
    const beforeContent = formatRuleContent(rule)
    await mockToggleAlertRule(rule.id)
    auditLog.logAlertRuleUpdate(rule.id, rule.name, 'enabled', String(rule.enabled), String(!rule.enabled), `切换规则${rule.enabled ? '禁用' : '启用'}`)
    fetchRules()
  } catch (e: any) {
    alert(e.message || '操作失败')
  }
}

const handleRuleSubmit = async () => {
  if (!currentRule.value) return
  if (!ruleForm.name.trim()) {
    alert('请输入规则名称')
    return
  }
  ruleEditLoading.value = true
  try {
    const beforeContent = originalRuleData.value ? formatRuleContent(originalRuleData.value) : ''
    await mockUpdateAlertRule(currentRule.value.id, {
      name: ruleForm.name,
      description: ruleForm.description,
      level: ruleForm.level,
      enabled: ruleForm.enabled,
      threshold: ruleForm.threshold,
    })
    auditLog.logAlertRuleUpdate(currentRule.value.id, ruleForm.name, 'config', beforeContent, formatRuleContent(ruleForm), '修改预警规则')
    originalRuleData.value = null
    showRuleEditModal.value = false
    fetchRules()
  } catch (e: any) {
    alert(e.message || '保存失败')
  } finally {
    ruleEditLoading.value = false
  }
}

const actionTitle = computed(() => {
  const titles = { ignore: '忽略预警', assign: '转交处理', resolve: '处理完成' }
  return titles[actionMode.value]
})

const goToTarget = (alert: AlertRecord) => {
  if (alert.targetType === 'batch') {
    router.push('/batches')
  } else if (alert.targetType === 'consumable') {
    router.push(`/consumables/${alert.targetId}`)
  } else if (alert.targetType === 'reagent') {
    router.push('/reagents')
  }
}

onMounted(() => {
  fetchStats()
  fetchAlerts()
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">预警规则中心</h1>
        <p class="text-sm text-gray-500 mt-0.5">统一管理系统预警规则与预警处理</p>
      </div>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      <div class="bg-white rounded-xl p-5 shadow-card">
        <div class="text-xs text-gray-500 mb-1">预警总数</div>
        <div class="text-2xl font-bold text-gray-800">{{ stats?.total || 0 }}</div>
      </div>
      <div class="bg-white rounded-xl p-5 shadow-card">
        <div class="text-xs text-gray-500 mb-1">未读预警</div>
        <div class="text-2xl font-bold text-danger-600">{{ stats?.unread || 0 }}</div>
      </div>
      <div class="bg-white rounded-xl p-5 shadow-card">
        <div class="text-xs text-gray-500 mb-1">高危预警</div>
        <div class="text-2xl font-bold text-danger-600">{{ stats?.critical || 0 }}</div>
      </div>
      <div class="bg-white rounded-xl p-5 shadow-card">
        <div class="text-xs text-gray-500 mb-1">中危预警</div>
        <div class="text-2xl font-bold text-warning-600">{{ stats?.warning || 0 }}</div>
      </div>
      <div class="bg-white rounded-xl p-5 shadow-card">
        <div class="text-xs text-gray-500 mb-1">处理中</div>
        <div class="text-2xl font-bold text-primary-600">{{ stats?.processing || 0 }}</div>
      </div>
      <div class="bg-white rounded-xl p-5 shadow-card">
        <div class="text-xs text-gray-500 mb-1">已处理</div>
        <div class="text-2xl font-bold text-success-600">{{ stats?.resolved || 0 }}</div>
      </div>
    </div>

    <div class="bg-white rounded-xl shadow-card overflow-hidden">
      <div class="flex items-center gap-1 px-2 border-b border-gray-100">
        <button
          class="px-6 py-4 text-sm font-medium border-b-2 transition-colors"
          :class="[
            activeTab === 'list'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200',
          ]"
          @click="handleTabChange('list')"
        >
          <span class="flex items-center gap-2">
            <AlertTriangle class="w-4 h-4" />
            预警列表
          </span>
        </button>
        <button
          class="px-6 py-4 text-sm font-medium border-b-2 transition-colors"
          :class="[
            activeTab === 'rules'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200',
          ]"
          @click="handleTabChange('rules')"
        >
          <span class="flex items-center gap-2">
            <Settings class="w-4 h-4" />
            规则配置
          </span>
        </button>
      </div>

      <div v-if="activeTab === 'list'" class="p-6">
        <div class="flex flex-wrap items-end gap-4 mb-6">
          <div class="flex-1 min-w-[200px]">
            <label class="block text-xs font-medium text-gray-500 mb-1.5">关键词搜索</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search class="w-4 h-4 text-gray-400" />
              </div>
              <input
                v-model="filters.keyword"
                type="text"
                placeholder="搜索预警标题、内容、关联对象..."
                class="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                @keyup.enter="handleSearch"
              >
            </div>
          </div>

          <div class="min-w-[140px]">
            <label class="block text-xs font-medium text-gray-500 mb-1.5">预警类型</label>
            <select
              v-model="filters.type"
              class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-white"
            >
              <option value="">全部类型</option>
              <option v-for="(label, key) in alertTypeLabels" :key="key" :value="key">
                {{ label }}
              </option>
            </select>
          </div>

          <div class="min-w-[120px]">
            <label class="block text-xs font-medium text-gray-500 mb-1.5">预警级别</label>
            <select
              v-model="filters.level"
              class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-white"
            >
              <option value="">全部级别</option>
              <option v-for="(label, key) in alertLevelLabels" :key="key" :value="key">
                {{ label }}
              </option>
            </select>
          </div>

          <div class="min-w-[120px]">
            <label class="block text-xs font-medium text-gray-500 mb-1.5">处理状态</label>
            <select
              v-model="filters.status"
              class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-white"
            >
              <option value="">全部状态</option>
              <option v-for="(label, key) in alertStatusLabels" :key="key" :value="key">
                {{ label }}
              </option>
            </select>
          </div>

          <div class="min-w-[140px]">
            <label class="block text-xs font-medium text-gray-500 mb-1.5">处理人</label>
            <select
              v-model="filters.assignee"
              class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-white"
            >
              <option value="">全部处理人</option>
              <option v-for="h in availableHandlers" :key="h.id" :value="h.id">
                {{ h.name }}
              </option>
            </select>
          </div>

          <div class="min-w-[130px]">
            <label class="block text-xs font-medium text-gray-500 mb-1.5">关联对象</label>
            <select
              v-model="filters.targetType"
              class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-white"
            >
              <option value="">全部</option>
              <option v-for="(label, key) in alertTargetTypeLabels" :key="key" :value="key">
                {{ label }}
              </option>
            </select>
          </div>

          <div class="min-w-[150px]">
            <label class="block text-xs font-medium text-gray-500 mb-1.5">开始日期</label>
            <input
              v-model="filters.createTime[0]"
              type="date"
              class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
            >
          </div>

          <div class="min-w-[150px]">
            <label class="block text-xs font-medium text-gray-500 mb-1.5">结束日期</label>
            <input
              v-model="filters.createTime[1]"
              type="date"
              class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
            >
          </div>

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
        </div>

        <div v-if="loading" class="p-16 flex items-center justify-center">
          <div class="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
        </div>

        <div v-else>
          <div class="overflow-x-auto -mx-6">
            <table class="w-full">
              <thead class="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">预警信息</th>
                  <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">类型</th>
                  <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">级别</th>
                  <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                  <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">处理人</th>
                  <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">产生时间</th>
                  <th class="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr
                  v-for="alert in data?.list"
                  :key="alert.id"
                  class="hover:bg-gray-50 transition-colors cursor-pointer"
                  :class="{
                    'bg-danger-50/30': alert.level === 'critical' && alert.status !== 'resolved' && alert.status !== 'ignored',
                    'bg-warning-50/20': alert.level === 'warning' && alert.status !== 'resolved' && alert.status !== 'ignored',
                  }"
                  @click="openAlertDetail(alert)"
                >
                  <td class="px-6 py-4" @click.stop>
                    <div class="flex items-start gap-3">
                      <div
                        class="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                        :class="{
                          'bg-danger-50': alert.level === 'critical',
                          'bg-warning-50': alert.level === 'warning',
                          'bg-info-50': alert.level === 'info',
                        }"
                      >
                        <AlertTriangle
                          class="w-4 h-4"
                          :class="{
                            'text-danger-600': alert.level === 'critical',
                            'text-warning-600': alert.level === 'warning',
                            'text-info-600': alert.level === 'info',
                          }"
                        />
                      </div>
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2">
                          <span
                            class="font-medium text-gray-900 hover:text-primary-600 transition-colors cursor-pointer"
                            @click="openAlertDetail(alert)"
                          >
                            {{ alert.title }}
                          </span>
                          <span
                            v-if="alert.status === 'unread'"
                            class="w-2 h-2 rounded-full bg-danger-500"
                          />
                        </div>
                        <div class="text-sm text-gray-500 mt-1 line-clamp-1">
                          {{ alert.message }}
                        </div>
                        <div class="flex items-center gap-2 mt-1.5 text-xs text-gray-400">
                          <span>关联：{{ alertTargetTypeLabels[alert.targetType] }} - {{ alert.targetName }}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4" @click.stop>
                    <span class="text-sm text-gray-600">{{ alertTypeLabels[alert.type] }}</span>
                  </td>
                  <td class="px-6 py-4" @click.stop>
                    <span
                      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border"
                      :class="alertLevelBadgeColors[alert.level]"
                    >
                      {{ alertLevelLabels[alert.level] }}
                    </span>
                  </td>
                  <td class="px-6 py-4" @click.stop>
                    <span
                      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                      :class="alertStatusColors[alert.status]"
                    >
                      {{ alertStatusLabels[alert.status] }}
                    </span>
                  </td>
                  <td class="px-6 py-4" @click.stop>
                    <div v-if="alert.assigneeName" class="flex items-center gap-1.5 text-sm text-gray-600">
                      <User class="w-3.5 h-3.5 text-gray-400" />
                      {{ alert.assigneeName }}
                    </div>
                    <span v-else class="text-sm text-gray-400">-</span>
                  </td>
                  <td class="px-6 py-4" @click.stop>
                    <div class="flex items-center gap-1 text-sm text-gray-500">
                      <Clock class="w-3.5 h-3.5 text-gray-400" />
                      {{ formatDate(alert.createdAt, 'MM-DD HH:mm') }}
                    </div>
                  </td>
                  <td class="px-6 py-4" @click.stop>
                    <div class="flex items-center justify-center gap-1">
                      <button
                        v-if="alert.status === 'unread'"
                        class="p-1.5 text-success-500 hover:bg-success-50 rounded transition-colors"
                        title="标记已读"
                        @click="handleMarkRead(alert)"
                      >
                        <Check class="w-4 h-4" />
                      </button>
                      <button
                        class="p-1.5 text-gray-500 hover:bg-gray-100 rounded transition-colors"
                        title="查看详情"
                        @click="openAlertDetail(alert)"
                      >
                        <Eye class="w-4 h-4" />
                      </button>
                      <div class="relative group">
                        <button
                          class="p-1.5 text-primary-500 hover:bg-primary-50 rounded transition-colors"
                          title="更多操作"
                        >
                          <MoreHorizontal class="w-4 h-4" />
                        </button>
                        <div class="absolute right-0 top-full mt-1 w-36 bg-white rounded-lg shadow-xl border border-gray-100 py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                          <button
                            v-if="alert.status !== 'ignored' && alert.status !== 'resolved' && permission.canHandleAlert"
                            class="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            @click="openActionModal('ignore', alert)"
                          >
                            <XCircle class="w-3.5 h-3.5 text-gray-400" />
                            忽略预警
                          </button>
                          <button
                            v-if="alert.status !== 'resolved' && permission.canAssignAlert"
                            class="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            @click="openActionModal('assign', alert)"
                          >
                            <UserPlus class="w-3.5 h-3.5 text-gray-400" />
                            转交处理
                          </button>
                          <button
                            v-if="alert.status !== 'resolved' && alert.status !== 'ignored' && permission.canHandleAlert"
                            class="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            @click="openActionModal('resolve', alert)"
                          >
                            <CheckCircle class="w-3.5 h-3.5 text-success-500" />
                            标记处理完成
                          </button>
                          <button
                            class="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            @click="goToTarget(alert)"
                          >
                            <Eye class="w-3.5 h-3.5 text-gray-400" />
                            查看关联对象
                          </button>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-if="data?.list.length === 0" class="p-16 text-center">
            <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <Bell class="w-8 h-8 text-gray-300" />
            </div>
            <p class="text-gray-400">暂无预警数据</p>
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

      <div v-else-if="activeTab === 'rules'" class="p-6">
        <div v-if="rulesLoading" class="p-16 flex items-center justify-center">
          <div class="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <div
            v-for="rule in rulesData"
            :key="rule.id"
            class="border border-gray-100 rounded-xl p-5 hover:shadow-card transition-all"
            :class="{ 'opacity-60': !rule.enabled }"
          >
            <div class="flex items-start justify-between mb-4">
              <div class="flex items-center gap-3">
                <div
                  class="w-10 h-10 rounded-lg flex items-center justify-center"
                  :class="{
                    'bg-danger-50': rule.level === 'critical',
                    'bg-warning-50': rule.level === 'warning',
                    'bg-info-50': rule.level === 'info',
                  }"
                >
                  <AlertTriangle
                    class="w-5 h-5"
                    :class="{
                      'text-danger-600': rule.level === 'critical',
                      'text-warning-600': rule.level === 'warning',
                      'text-info-600': rule.level === 'info',
                    }"
                  />
                </div>
                <div>
                  <h3 class="font-semibold text-gray-900">{{ rule.name }}</h3>
                  <div class="flex items-center gap-1.5 mt-0.5">
                    <span
                      class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border"
                      :class="alertLevelBadgeColors[rule.level]"
                    >
                      {{ alertLevelLabels[rule.level] }}
                    </span>
                    <span
                      v-if="rule.threshold"
                      class="text-xs text-gray-400"
                    >
                      阈值: {{ rule.threshold }}{{ rule.unit || '' }}
                    </span>
                  </div>
                </div>
              </div>
              <button
                v-if="permission.canEditAlertRule"
                class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                :class="rule.enabled ? 'bg-primary-600' : 'bg-gray-200'"
                @click="handleRuleToggle(rule)"
              >
                <span
                  class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                  :class="rule.enabled ? 'translate-x-6' : 'translate-x-1'"
                />
              </button>
            </div>
            <p class="text-sm text-gray-500 mb-4 leading-relaxed">
              {{ rule.description }}
            </p>
            <div class="flex items-center justify-between">
              <div class="text-xs text-gray-400 flex items-center gap-1">
                <Clock class="w-3 h-3" />
                更新于 {{ formatDate(rule.updatedAt, 'MM-DD HH:mm') }}
              </div>
              <button
                v-if="permission.canEditAlertRule"
                class="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                @click="openRuleEdit(rule)"
              >
                <Settings class="w-3.5 h-3.5" />
                编辑配置
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="showDetailModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      @click.self="showDetailModal = false"
    >
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-lg flex items-center justify-center"
              :class="{
                'bg-danger-50': currentAlert?.level === 'critical',
                'bg-warning-50': currentAlert?.level === 'warning',
                'bg-info-50': currentAlert?.level === 'info',
              }"
            >
              <AlertTriangle
                class="w-5 h-5"
                :class="{
                  'text-danger-600': currentAlert?.level === 'critical',
                  'text-warning-600': currentAlert?.level === 'warning',
                  'text-info-600': currentAlert?.level === 'info',
                }"
              />
            </div>
            <div>
              <h3 class="text-lg font-semibold text-gray-800">{{ currentAlert?.title }}</h3>
              <div class="flex items-center gap-2 mt-0.5">
                <span
                  class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border"
                  :class="alertLevelBadgeColors[currentAlert?.level || 'info']"
                >
                  {{ alertLevelLabels[currentAlert?.level || 'info'] }}
                </span>
                <span
                  class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                  :class="alertStatusColors[currentAlert?.status || 'unread']"
                >
                  {{ alertStatusLabels[currentAlert?.status || 'unread'] }}
                </span>
              </div>
            </div>
          </div>
          <button
            class="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            @click="showDetailModal = false"
          >
            <X class="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div class="p-6 overflow-y-auto max-h-[calc(90vh-240px)]">
          <div class="space-y-4">
            <div>
              <label class="block text-xs font-medium text-gray-500 mb-1.5">预警详情</label>
              <p class="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-lg p-4">
                {{ currentAlert?.message }}
              </p>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-medium text-gray-500 mb-1.5">预警类型</label>
                <p class="text-sm text-gray-700">{{ alertTypeLabels[currentAlert?.type || 'expiry_30'] }}</p>
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-500 mb-1.5">关联对象</label>
                <p class="text-sm text-gray-700 flex items-center gap-1.5">
                  <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">
                    {{ alertTargetTypeLabels[currentAlert?.targetType || 'batch'] }}
                  </span>
                  {{ currentAlert?.targetName }}
                </p>
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-500 mb-1.5">处理人</label>
                <p class="text-sm text-gray-700 flex items-center gap-1.5">
                  <UserCheck class="w-3.5 h-3.5 text-gray-400" />
                  {{ currentAlert?.assigneeName || '暂无处理人' }}
                </p>
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-500 mb-1.5">产生时间</label>
                <p class="text-sm text-gray-700 flex items-center gap-1.5">
                  <Calendar class="w-3.5 h-3.5 text-gray-400" />
                  {{ formatDate(currentAlert?.createdAt || '', 'YYYY-MM-DD HH:mm') }}
                </p>
              </div>
            </div>

            <div v-if="currentAlert?.extra && Object.keys(currentAlert.extra).length > 0">
              <label class="block text-xs font-medium text-gray-500 mb-1.5">附加信息</label>
              <div class="bg-gray-50 rounded-lg p-4 space-y-1">
                <div
                  v-for="(value, key) in currentAlert.extra"
                  :key="key"
                  class="flex items-center text-sm"
                >
                  <span class="text-gray-500 w-32">{{ key }}:</span>
                  <span class="text-gray-700 font-medium">{{ String(value) }}</span>
                </div>
              </div>
            </div>

            <div>
              <div class="flex items-center gap-2 mb-3">
                <History class="w-4 h-4 text-gray-400" />
                <label class="text-sm font-medium text-gray-700">处理记录</label>
              </div>
              <div v-if="detailLoading" class="py-8 flex items-center justify-center">
                <div class="animate-spin w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full" />
              </div>
              <div v-else-if="alertHandleRecords.length === 0" class="text-center py-8 text-gray-400 text-sm bg-gray-50 rounded-lg">
                暂无处理记录
              </div>
              <div v-else class="space-y-3">
                <div
                  v-for="record in alertHandleRecords"
                  :key="record.id"
                  class="flex gap-3"
                >
                  <div class="flex flex-col items-center">
                    <div class="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <User class="w-4 h-4 text-gray-500" />
                    </div>
                    <div class="w-px flex-1 bg-gray-100 mt-1" />
                  </div>
                  <div class="flex-1 pb-3">
                    <div class="flex items-center gap-2">
                      <span class="text-sm font-medium text-gray-700">{{ record.operatorName }}</span>
                      <span
                        class="inline-flex items-center px-2 py-0.5 rounded text-xs"
                        :class="{
                          'bg-info-50 text-info-600': record.action === 'read',
                          'bg-gray-100 text-gray-600': record.action === 'ignore',
                          'bg-primary-50 text-primary-600': record.action === 'assign',
                          'bg-success-50 text-success-600': record.action === 'resolve',
                          'bg-gray-50 text-gray-500': record.action === 'comment',
                        }"
                      >
                        {{ { read: '标记已读', ignore: '忽略预警', assign: '转交处理', resolve: '处理完成', comment: '添加备注' }[record.action] }}
                      </span>
                      <span class="text-xs text-gray-400">{{ formatDate(record.createdAt, 'YYYY-MM-DD HH:mm') }}</span>
                    </div>
                    <div v-if="record.remark" class="mt-1 text-sm text-gray-600">
                      备注：{{ record.remark }}
                    </div>
                    <div v-if="record.result" class="mt-1 text-sm text-gray-600 bg-success-50 rounded p-2">
                      处理结果：{{ record.result }}
                    </div>
                    <div v-if="record.action === 'assign'" class="mt-1 text-sm text-gray-600">
                      {{ record.fromAssignee ? `从 ${record.fromAssignee} ` : '' }}转交至 {{ record.toAssignee }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
          <button
            class="px-5 py-2.5 border border-gray-200 hover:bg-gray-100 text-gray-600 rounded-lg transition-colors"
            @click="showDetailModal = false"
          >
            关闭
          </button>
          <div class="flex items-center gap-2">
            <button
              v-if="currentAlert?.status !== 'ignored' && currentAlert?.status !== 'resolved' && permission.canHandleAlert"
              class="px-4 py-2.5 border border-gray-200 hover:bg-gray-100 text-gray-600 rounded-lg transition-colors text-sm"
              @click="openActionModal('ignore', currentAlert!)"
            >
              忽略
            </button>
            <button
              v-if="currentAlert?.status !== 'resolved' && permission.canAssignAlert"
              class="px-4 py-2.5 border border-gray-200 hover:bg-gray-100 text-gray-600 rounded-lg transition-colors text-sm flex items-center gap-1.5"
              @click="openActionModal('assign', currentAlert!)"
            >
              <UserPlus class="w-3.5 h-3.5" />
              转交
            </button>
            <button
              v-if="currentAlert?.status !== 'resolved' && currentAlert?.status !== 'ignored' && permission.canHandleAlert"
              class="px-4 py-2.5 bg-gradient-to-r from-success-600 to-success-700 hover:from-success-700 hover:to-success-800 text-white rounded-lg transition-all text-sm flex items-center gap-1.5"
              @click="openActionModal('resolve', currentAlert!)"
            >
              <CheckCircle class="w-3.5 h-3.5" />
              处理完成
            </button>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="showActionModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      @click.self="showActionModal = false"
    >
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 class="text-lg font-semibold text-gray-800">{{ actionTitle }}</h3>
          <button
            class="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            @click="showActionModal = false"
          >
            <X class="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div class="p-6">
          <div v-if="actionMode === 'ignore'">
            <label class="block text-sm font-medium text-gray-700 mb-1.5">忽略原因（可选）</label>
            <textarea
              v-model="actionForm.remark"
              rows="3"
              class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all resize-none"
              placeholder="请输入忽略该预警的原因..."
            />
          </div>

          <div v-else-if="actionMode === 'assign'">
            <label class="block text-sm font-medium text-gray-700 mb-3">选择处理人</label>
            <div class="space-y-2">
              <label
                v-for="handler in availableHandlers"
                :key="handler.id"
                class="flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all"
                :class="[
                  actionForm.assignee === handler.id
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:bg-gray-50',
                ]"
                @click="handleSelectAssignee(handler)"
              >
                <input
                  type="radio"
                  :value="handler.id"
                  v-model="actionForm.assignee"
                  class="text-primary-600"
                />
                <div class="flex-1">
                  <div class="font-medium text-gray-800">{{ handler.name }}</div>
                  <div class="text-xs text-gray-500">{{ handler.role }}</div>
                </div>
              </label>
            </div>
          </div>

          <div v-else-if="actionMode === 'resolve'">
            <label class="block text-sm font-medium text-gray-700 mb-1.5">
              处理结果 <span class="text-red-500">*</span>
            </label>
            <textarea
              v-model="actionForm.result"
              rows="4"
              class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all resize-none"
              placeholder="请详细描述处理结果和采取的措施..."
            />
          </div>
        </div>

        <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
          <button
            class="px-5 py-2.5 border border-gray-200 hover:bg-gray-100 text-gray-600 rounded-lg transition-colors"
            @click="showActionModal = false"
          >
            取消
          </button>
          <button
            :disabled="actionLoading"
            class="px-5 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded-lg transition-all disabled:opacity-70 flex items-center gap-2"
            @click="handleActionSubmit"
          >
            <span
              v-if="actionLoading"
              class="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"
            />
            确认
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="showRuleEditModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      @click.self="showRuleEditModal = false"
    >
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 class="text-lg font-semibold text-gray-800">编辑预警规则</h3>
          <button
            class="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            @click="showRuleEditModal = false"
          >
            <X class="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div class="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">
                规则名称 <span class="text-red-500">*</span>
              </label>
              <input
                v-model="ruleForm.name"
                type="text"
                class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                placeholder="请输入规则名称"
              >
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">规则描述</label>
              <textarea
                v-model="ruleForm.description"
                rows="3"
                class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all resize-none"
                placeholder="请描述该规则的触发条件和作用..."
              />
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">预警级别</label>
                <select
                  v-model="ruleForm.level"
                  class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-white"
                >
                  <option value="critical">高危</option>
                  <option value="warning">中危</option>
                  <option value="info">提示</option>
                </select>
              </div>
              <div v-if="currentRule?.threshold !== undefined">
                <label class="block text-sm font-medium text-gray-700 mb-1.5">
                  阈值{{ currentRule?.unit ? `（${currentRule.unit}）` : '' }}
                </label>
                <input
                  v-model.number="ruleForm.threshold"
                  type="number"
                  min="0"
                  class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                >
              </div>
            </div>

            <div class="flex items-center gap-3">
              <button
                class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                :class="ruleForm.enabled ? 'bg-primary-600' : 'bg-gray-200'"
                @click="ruleForm.enabled = !ruleForm.enabled"
              >
                <span
                  class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                  :class="ruleForm.enabled ? 'translate-x-6' : 'translate-x-1'"
                />
              </button>
              <span class="text-sm text-gray-700">启用该预警规则</span>
            </div>
          </div>
        </div>

        <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
          <button
            class="px-5 py-2.5 border border-gray-200 hover:bg-gray-100 text-gray-600 rounded-lg transition-colors"
            @click="showRuleEditModal = false"
          >
            取消
          </button>
          <button
            :disabled="ruleEditLoading"
            class="px-5 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded-lg transition-all disabled:opacity-70 flex items-center gap-2"
            @click="handleRuleSubmit"
          >
            <span
              v-if="ruleEditLoading"
              class="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"
            />
            保存
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
