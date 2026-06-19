<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeft,
  AlertTriangle,
  PackagePlus,
  UserCheck,
  RotateCcw,
  Trash2,
  ArrowLeftRight,
  Wrench,
  PackageOpen,
  Factory,
  MapPin,
  BarChart3,
  History,
  TrendingDown,
  TrendingUp,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Edit2,
} from 'lucide-vue-next'
import type {
  Consumable,
  ConsumableOperation,
  ConsumableOperationType,
  ConsumptionTrendPoint,
} from '@/types/consumable'
import {
  operationTypeLabels,
  operationTypeColors,
  operationTypeConfigs,
} from '@/types/consumable'
import { mockGetConsumableDetail } from '@/mock/consumables'
import { formatDate } from '@/utils/date'
import ConsumableOperationModal from '@/components/ConsumableOperationModal.vue'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const consumable = ref<Consumable | null>(null)
const operations = ref<ConsumableOperation[]>([])
const trend = ref<ConsumptionTrendPoint[]>([])

const operationPagination = reactive({
  page: 1,
  pageSize: 10,
})

const operationModalVisible = ref(false)
const currentOperationType = ref<ConsumableOperationType | null>(null)
const modalLoading = ref(false)

const fetchData = async () => {
  loading.value = true
  try {
    const id = route.params.id as string
    const result = await mockGetConsumableDetail(id)
    if (result) {
      consumable.value = result.consumable
      operations.value = result.operations
      trend.value = result.trend
    } else {
      router.replace('/consumables')
    }
  } finally {
    loading.value = false
  }
}

const isLowStock = computed(() => {
  if (!consumable.value) return false
  return consumable.value.stockQuantity <= consumable.value.safetyStock
})

const stockPercentage = computed(() => {
  if (!consumable.value) return 0
  const safety = consumable.value.safetyStock
  if (safety <= 0) return 100
  const total = safety * 2
  return Math.min(100, (consumable.value.stockQuantity / total) * 100)
})

const paginatedOperations = computed(() => {
  const start = (operationPagination.page - 1) * operationPagination.pageSize
  return operations.value.slice(start, start + operationPagination.pageSize)
})

const totalOperationPages = computed(() => {
  return Math.ceil(operations.value.length / operationPagination.pageSize)
})

const recentOperations = computed(() => {
  return operations.value.slice(0, 5)
})

const trendStats = computed(() => {
  const usedTotal = trend.value.reduce((sum, p) => sum + p.used, 0)
  const receivedTotal = trend.value.reduce((sum, p) => sum + p.received, 0)
  return { usedTotal, receivedTotal }
})

const maxTrendValue = computed(() => {
  const values = trend.value.flatMap((p) => [p.used, p.received])
  const max = Math.max(...values, 1)
  return Math.ceil(max * 1.2)
})

const goBack = () => {
  router.push('/consumables')
}

const openOperationModal = (type: ConsumableOperationType) => {
  if (!consumable.value) return
  currentOperationType.value = type
  operationModalVisible.value = true
}

const handleOperationSuccess = () => {
  operationPagination.page = 1
  fetchData()
}

const handleOperationPageChange = (page: number) => {
  operationPagination.page = page
}

const getOperationConfig = (type: ConsumableOperationType) => {
  return operationTypeConfigs.find((c) => c.type === type)
}

onMounted(() => {
  fetchData()
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <button
          class="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          @click="goBack"
        >
          <ArrowLeft class="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 class="text-2xl font-bold text-gray-900">耗材详情</h1>
          <p class="text-sm text-gray-500 mt-0.5">查看耗材库存信息与出入库记录</p>
        </div>
      </div>
    </div>

    <div v-if="loading" class="p-16 flex items-center justify-center bg-white rounded-xl shadow-card">
      <div class="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
    </div>

    <template v-else-if="consumable">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 space-y-6">
          <div class="bg-white rounded-xl shadow-card p-6">
            <div class="flex items-start justify-between mb-6">
              <div class="flex items-center gap-4">
                <div
                  class="w-16 h-16 rounded-xl flex items-center justify-center"
                  :class="isLowStock ? 'bg-danger-50' : 'bg-success-50'"
                >
                  <PackageOpen
                    class="w-8 h-8"
                    :class="isLowStock ? 'text-danger-600' : 'text-success-600'"
                  />
                </div>
                <div>
                  <div class="flex items-center gap-2">
                    <h2 class="text-xl font-bold text-gray-900">{{ consumable.name }}</h2>
                    <span
                      v-if="isLowStock"
                      class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-danger-100 text-danger-700"
                    >
                      <AlertTriangle class="w-3 h-3" />
                      低库存预警
                    </span>
                  </div>
                  <div class="mt-1 flex items-center gap-4 text-sm text-gray-500">
                    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 text-xs">
                      {{ consumable.category }}
                    </span>
                    <span>{{ consumable.specification }}</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div class="p-4 rounded-xl bg-gray-50">
                <div class="text-xs text-gray-500 mb-1">当前库存</div>
                <div class="flex items-baseline gap-1">
                  <span
                    class="text-2xl font-bold"
                    :class="isLowStock ? 'text-danger-600' : 'text-gray-900'"
                  >
                    {{ consumable.stockQuantity }}
                  </span>
                  <span class="text-sm text-gray-400">{{ consumable.unit }}</span>
                </div>
                <div class="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    class="h-full rounded-full transition-all"
                    :class="{
                      'bg-success-500': !isLowStock,
                      'bg-danger-500': isLowStock,
                    }"
                    :style="{ width: `${stockPercentage}%` }"
                  />
                </div>
              </div>

              <div class="p-4 rounded-xl bg-gray-50">
                <div class="text-xs text-gray-500 mb-1">安全库存</div>
                <div class="flex items-baseline gap-1">
                  <span class="text-2xl font-bold text-gray-900">{{ consumable.safetyStock }}</span>
                  <span class="text-sm text-gray-400">{{ consumable.unit }}</span>
                </div>
              </div>

              <div class="p-4 rounded-xl bg-gray-50">
                <div class="text-xs text-gray-500 mb-1 flex items-center gap-1">
                  <Factory class="w-3 h-3" />
                  生产厂家
                </div>
                <div class="text-sm font-medium text-gray-900 mt-2">
                  {{ consumable.manufacturer || '-' }}
                </div>
              </div>

              <div class="p-4 rounded-xl bg-gray-50">
                <div class="text-xs text-gray-500 mb-1 flex items-center gap-1">
                  <MapPin class="w-3 h-3" />
                  存放位置
                </div>
                <div class="text-sm font-medium text-gray-900 mt-2">
                  {{ consumable.location || '-' }}
                </div>
              </div>
            </div>

            <div
              v-if="consumable.description"
              class="mt-6 p-4 rounded-xl bg-blue-50/50 border border-blue-100/50"
            >
              <div class="text-xs text-blue-600 mb-1">描述说明</div>
              <div class="text-sm text-gray-700">{{ consumable.description }}</div>
            </div>

            <div class="mt-6 pt-6 border-t border-gray-100">
              <div class="text-sm font-medium text-gray-700 mb-3">库存操作</div>
              <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                <button
                  v-for="config in operationTypeConfigs"
                  :key="config.type"
                  class="p-3 rounded-xl border border-gray-200 hover:border-primary-200 hover:bg-primary-50/50 transition-all group flex flex-col items-center gap-2"
                  @click="openOperationModal(config.type)"
                >
                  <div
                    class="w-10 h-10 rounded-lg flex items-center justify-center bg-gray-100 group-hover:bg-primary-100 transition-colors"
                  >
                    <component
                      :is="{
                        stock_in: PackagePlus,
                        use: UserCheck,
                        return: RotateCcw,
                        scrap: Trash2,
                        transfer: ArrowLeftRight,
                        adjust: Wrench,
                      }[config.type]"
                      class="w-5 h-5 text-gray-600 group-hover:text-primary-600 transition-colors"
                    />
                  </div>
                  <span class="text-xs font-medium text-gray-700 group-hover:text-primary-700">
                    {{ config.label }}
                  </span>
                </button>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-xl shadow-card p-6">
            <div class="flex items-center justify-between mb-6">
              <div class="flex items-center gap-2">
                <BarChart3 class="w-5 h-5 text-primary-600" />
                <h3 class="text-lg font-semibold text-gray-800">近30天消耗趋势</h3>
              </div>
              <div class="flex items-center gap-4 text-sm">
                <div class="flex items-center gap-2">
                  <div class="w-3 h-3 rounded-sm bg-danger-400" />
                  <span class="text-gray-500">消耗</span>
                  <span class="font-medium text-danger-600">{{ trendStats.usedTotal }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <div class="w-3 h-3 rounded-sm bg-success-400" />
                  <span class="text-gray-500">入库</span>
                  <span class="font-medium text-success-600">{{ trendStats.receivedTotal }}</span>
                </div>
              </div>
            </div>

            <div class="relative h-48">
              <div class="absolute inset-0 flex items-end gap-1 px-2">
                <div
                  v-for="(point, idx) in trend"
                  :key="idx"
                  class="flex-1 flex flex-col items-center justify-end gap-0.5"
                >
                  <div class="w-full flex items-end justify-center gap-0.5 h-40">
                    <div
                      class="w-2.5 rounded-t transition-all hover:opacity-80"
                      :class="point.used > 0 ? 'bg-danger-400' : 'bg-transparent'"
                      :style="{ height: `${(point.used / maxTrendValue) * 100}%` }"
                      :title="`${point.date}: 消耗 ${point.used}`"
                    />
                    <div
                      class="w-2.5 rounded-t transition-all hover:opacity-80"
                      :class="point.received > 0 ? 'bg-success-400' : 'bg-transparent'"
                      :style="{ height: `${(point.received / maxTrendValue) * 100}%` }"
                      :title="`${point.date}: 入库 ${point.received}`"
                    />
                  </div>
                </div>
              </div>
              <div class="absolute bottom-0 left-0 right-0 flex items-center justify-between px-2 text-xs text-gray-400 pt-2 border-t border-gray-100">
                <span>{{ trend[0]?.date.slice(5) }}</span>
                <span>{{ trend[14]?.date.slice(5) }}</span>
                <span>{{ trend[29]?.date.slice(5) }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="space-y-6">
          <div class="bg-white rounded-xl shadow-card p-6">
            <div class="flex items-center gap-2 mb-4">
              <AlertTriangle class="w-5 h-5 text-warning-500" />
              <h3 class="text-lg font-semibold text-gray-800">库存状态</h3>
            </div>
            <div
              class="p-4 rounded-xl"
              :class="isLowStock ? 'bg-danger-50 border border-danger-100' : 'bg-success-50 border border-success-100'"
            >
              <div class="flex items-center gap-3">
                <div
                  class="w-12 h-12 rounded-xl flex items-center justify-center"
                  :class="isLowStock ? 'bg-danger-100' : 'bg-success-100'"
                >
                  <AlertTriangle
                    v-if="isLowStock"
                    class="w-6 h-6 text-danger-600"
                  />
                  <PackageOpen v-else class="w-6 h-6 text-success-600" />
                </div>
                <div>
                  <div
                    class="font-semibold"
                    :class="isLowStock ? 'text-danger-700' : 'text-success-700'"
                  >
                    {{ isLowStock ? '库存不足' : '库存充足' }}
                  </div>
                  <div class="text-sm" :class="isLowStock ? 'text-danger-600' : 'text-success-600'">
                    {{
                      isLowStock
                        ? `低于安全库存 ${consumable.safetyStock - consumable.stockQuantity} ${consumable.unit}，请及时补货`
                        : `高于安全库存 ${consumable.stockQuantity - consumable.safetyStock} ${consumable.unit}`
                    }}
                  </div>
                </div>
              </div>
            </div>

            <div class="mt-4 grid grid-cols-2 gap-3">
              <div class="p-3 rounded-lg bg-danger-50/50">
                <div class="flex items-center gap-1 text-xs text-danger-600 mb-1">
                  <TrendingDown class="w-3 h-3" />
                  30天消耗
                </div>
                <div class="text-lg font-bold text-danger-700">
                  {{ trendStats.usedTotal }}
                  <span class="text-xs font-normal text-danger-500">{{ consumable.unit }}</span>
                </div>
              </div>
              <div class="p-3 rounded-lg bg-success-50/50">
                <div class="flex items-center gap-1 text-xs text-success-600 mb-1">
                  <TrendingUp class="w-3 h-3" />
                  30天入库
                </div>
                <div class="text-lg font-bold text-success-700">
                  {{ trendStats.receivedTotal }}
                  <span class="text-xs font-normal text-success-500">{{ consumable.unit }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-xl shadow-card p-6">
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-2">
                <History class="w-5 h-5 text-primary-600" />
                <h3 class="text-lg font-semibold text-gray-800">最近出入库</h3>
              </div>
            </div>

            <div class="space-y-3">
              <div
                v-for="op in recentOperations"
                :key="op.id"
                class="p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div class="flex items-start justify-between gap-2">
                  <div class="flex items-center gap-2">
                    <span
                      class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                      :class="operationTypeColors[op.type]"
                    >
                      {{ operationTypeLabels[op.type] }}
                    </span>
                    <span class="font-semibold text-gray-800">{{ op.quantity }}</span>
                    <span class="text-xs text-gray-400">{{ consumable.unit }}</span>
                  </div>
                  <div class="text-xs text-gray-400 flex items-center gap-1">
                    <Calendar class="w-3 h-3" />
                    {{ formatDate(op.createdAt, 'MM-DD HH:mm') }}
                  </div>
                </div>
                <div class="mt-2 text-xs text-gray-500 flex items-center justify-between">
                  <span>
                    {{ op.purpose || op.reason || '-' }}
                  </span>
                  <span class="text-gray-400">{{ op.operatorName }}</span>
                </div>
                <div class="mt-1.5 text-xs">
                  <span class="text-gray-400">库存变动：</span>
                  <span class="text-gray-500">{{ op.beforeQuantity }}</span>
                  <span class="mx-1 text-gray-300">→</span>
                  <span class="font-medium text-gray-700">{{ op.afterQuantity }}</span>
                </div>
              </div>

              <div
                v-if="recentOperations.length === 0"
                class="py-8 text-center text-gray-400 text-sm"
              >
                暂无出入库记录
              </div>
            </div>
          </div>

          <div class="bg-white rounded-xl shadow-card p-6">
            <div class="flex items-center gap-2 mb-4">
              <History class="w-5 h-5 text-primary-600" />
              <h3 class="text-lg font-semibold text-gray-800">
                全部流水
                <span class="text-sm font-normal text-gray-400 ml-1">({{ operations.length }})</span>
              </h3>
            </div>

            <div class="space-y-2">
              <div
                v-for="op in paginatedOperations"
                :key="op.id"
                class="flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div class="flex items-center gap-2 min-w-0">
                  <span
                    class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium shrink-0"
                    :class="operationTypeColors[op.type]"
                  >
                    {{ operationTypeLabels[op.type] }}
                  </span>
                  <div class="min-w-0">
                    <div class="text-sm font-medium text-gray-800 truncate">
                      {{ op.quantity }} {{ consumable.unit }}
                    </div>
                    <div class="text-xs text-gray-400 truncate">
                      {{ formatDate(op.createdAt, 'MM-DD HH:mm') }} · {{ op.operatorName }}
                    </div>
                  </div>
                </div>
              </div>

              <div
                v-if="operations.length === 0"
                class="py-6 text-center text-gray-400 text-sm"
              >
                暂无流水记录
              </div>
            </div>

            <div
              v-if="operations.length > operationPagination.pageSize"
              class="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between"
            >
              <div class="text-xs text-gray-500">
                第 {{ operationPagination.page }} / {{ totalOperationPages }} 页
              </div>
              <div class="flex items-center gap-1">
                <button
                  :disabled="operationPagination.page <= 1"
                  class="p-1.5 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  @click="handleOperationPageChange(operationPagination.page - 1)"
                >
                  <ChevronLeft class="w-4 h-4" />
                </button>
                <button
                  v-for="p in Math.min(5, totalOperationPages)"
                  :key="p"
                  class="min-w-7 h-7 px-2 rounded text-xs transition-colors"
                  :class="[
                    operationPagination.page === p + Math.max(0, operationPagination.page - 3)
                      ? 'bg-primary-600 text-white'
                      : 'border border-gray-200 hover:bg-gray-50 text-gray-600',
                  ]"
                  @click="handleOperationPageChange(p + Math.max(0, operationPagination.page - 3))"
                >
                  {{ p + Math.max(0, operationPagination.page - 3) }}
                </button>
                <button
                  :disabled="operationPagination.page >= totalOperationPages"
                  class="p-1.5 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  @click="handleOperationPageChange(operationPagination.page + 1)"
                >
                  <ChevronRight class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <ConsumableOperationModal
      v-model:visible="operationModalVisible"
      :consumable="consumable"
      :operation-type="currentOperationType"
      @success="handleOperationSuccess"
    />
  </div>
</template>
