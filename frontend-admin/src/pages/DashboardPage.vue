<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  FlaskConical,
  PackageOpen,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  ChevronRight,
  Calendar,
  ArrowDownToLine,
  ArrowUpFromLine,
  FlaskRound,
  Boxes,
  Clock,
  AlertCircle,
  Activity,
} from 'lucide-vue-next'
import { mockGetDashboardStats } from '@/mock/dashboard'
import type {
  DashboardStats,
  CategoryStat,
  ExpiringBatchRankItem,
  LowStockConsumableRankItem,
  TopUsedItem,
} from '@/types/common'
import { formatDate } from '@/utils/date'

const router = useRouter()
const loading = ref(false)
const stats = ref<DashboardStats | null>(null)

const fetchData = async () => {
  loading.value = true
  try {
    stats.value = await mockGetDashboardStats()
  } finally {
    loading.value = false
  }
}

const categoryColors = [
  '#2196F3',
  '#43A047',
  '#FB8C00',
  '#E53935',
  '#9C27B0',
  '#00BCD4',
  '#FF9800',
  '#795548',
  '#607D8B',
  '#3F51B5',
]

const getCategoryPercentage = (value: number, statsList: CategoryStat[]) => {
  const total = statsList.reduce((sum, c) => sum + c.value, 0)
  return total > 0 ? (value / total) * 100 : 0
}

const maxInboundValue = computed(() => {
  if (!stats.value) return 0
  return Math.max(...stats.value.trendData.map((d) => d.inbound)) * 1.1
})

const maxOutboundValue = computed(() => {
  if (!stats.value) return 0
  return Math.max(...stats.value.trendData.map((d) => d.outbound)) * 1.1
})

const getExpiryDaysLabel = (days: number) => {
  if (days < 0) {
    return `已过期 ${Math.abs(days)} 天`
  }
  if (days === 0) {
    return '今日到期'
  }
  return `剩余 ${days} 天`
}

const getExpiryDaysClass = (days: number) => {
  if (days < 0) return 'text-danger-600'
  if (days <= 7) return 'text-danger-600'
  if (days <= 30) return 'text-warning-600'
  return 'text-gray-500'
}

const getStockLevelPercent = (stock: number, safety: number) => {
  if (safety <= 0) return 0
  return Math.min(100, Math.round((stock / safety) * 100))
}

const getStockLevelColor = (percent: number) => {
  if (percent <= 30) return 'bg-danger-500'
  if (percent <= 60) return 'bg-warning-500'
  return 'bg-success-500'
}

const goToReagents = () => {
  router.push('/reagents')
}

const goToConsumables = () => {
  router.push('/consumables')
}

const goToBatches = (_e?: Event, filterStatus?: string) => {
  if (filterStatus) {
    router.push({ path: '/batches', query: { status: filterStatus } })
  } else {
    router.push('/batches')
  }
}

const goToConsumablesWithFilter = (_e?: Event, filterStockStatus?: string) => {
  if (filterStockStatus) {
    router.push({ path: '/consumables', query: { stockStatus: filterStockStatus } })
  } else {
    router.push('/consumables')
  }
}

const goToExpiringBatches = () => {
  goToBatches(undefined, 'warning')
}

const goToLowStockConsumables = () => {
  goToConsumablesWithFilter(undefined, 'low')
}

const goToConsumableDetail = (id: string) => {
  router.push(`/consumables/${id}`)
}

const goToAlerts = () => {
  router.push('/alerts')
}

onMounted(() => {
  fetchData()
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">业务看板</h1>
        <p class="text-sm text-gray-500 mt-0.5">试剂与耗材管理全局概览</p>
      </div>
      <div class="text-sm text-gray-400 flex items-center gap-1.5">
        <Clock class="w-4 h-4" />
        {{ formatDate(new Date().toISOString(), 'YYYY-MM-DD') }}
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
      <div
        class="bg-white rounded-xl p-6 shadow-card hover:shadow-card-hover transition-all duration-300 cursor-pointer hover:-translate-y-1 group"
        @click="goToReagents"
      >
        <div class="flex items-start justify-between">
          <div>
            <p class="text-sm text-gray-500 mb-1">试剂总数</p>
            <p class="text-3xl font-bold text-gray-800">
              {{ loading ? '--' : stats?.reagentCount || 0 }}
            </p>
            <div class="flex items-center gap-1 mt-2 text-xs text-success-600">
              <TrendingUp class="w-3 h-3" />
              <span>品类齐全</span>
            </div>
          </div>
          <div
            class="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/30 group-hover:scale-110 transition-transform"
          >
            <FlaskConical class="w-6 h-6 text-white" />
          </div>
        </div>
        <div class="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between text-xs">
          <span class="text-gray-400">点击查看试剂列表</span>
          <ChevronRight class="w-4 h-4 text-gray-300 group-hover:text-primary-500 group-hover:translate-x-0.5 transition-all" />
        </div>
      </div>

      <div
        class="bg-white rounded-xl p-6 shadow-card hover:shadow-card-hover transition-all duration-300 cursor-pointer hover:-translate-y-1 group"
        @click="goToConsumables"
      >
        <div class="flex items-start justify-between">
          <div>
            <p class="text-sm text-gray-500 mb-1">耗材总数</p>
            <p class="text-3xl font-bold text-gray-800">
              {{ loading ? '--' : stats?.consumableCount || 0 }}
            </p>
            <div class="flex items-center gap-1 mt-2 text-xs text-success-600">
              <TrendingUp class="w-3 h-3" />
              <span>供应充足</span>
            </div>
          </div>
          <div
            class="w-12 h-12 rounded-xl bg-gradient-to-br from-success-500 to-success-600 flex items-center justify-center shadow-lg shadow-success-500/30 group-hover:scale-110 transition-transform"
          >
            <PackageOpen class="w-6 h-6 text-white" />
          </div>
        </div>
        <div class="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between text-xs">
          <span class="text-gray-400">点击查看耗材列表</span>
          <ChevronRight class="w-4 h-4 text-gray-300 group-hover:text-success-500 group-hover:translate-x-0.5 transition-all" />
        </div>
      </div>

      <div
        class="bg-white rounded-xl p-6 shadow-card hover:shadow-card-hover transition-all duration-300 cursor-pointer hover:-translate-y-1 group"
        @click="goToExpiringBatches"
      >
        <div class="flex items-start justify-between">
          <div>
            <p class="text-sm text-gray-500 mb-1">近效期数量</p>
            <p class="text-3xl font-bold text-warning-600">
              {{ loading ? '--' : stats?.expiringCount || 0 }}
            </p>
            <div class="flex items-center gap-1 mt-2 text-xs text-warning-600">
              <AlertTriangle class="w-3 h-3" />
              <span>需尽快处理</span>
            </div>
          </div>
          <div
            class="w-12 h-12 rounded-xl bg-gradient-to-br from-warning-500 to-warning-600 flex items-center justify-center shadow-lg shadow-warning-500/30 group-hover:scale-110 transition-transform"
          >
            <Calendar class="w-6 h-6 text-white" />
          </div>
        </div>
        <div class="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between text-xs">
          <span class="text-gray-400">查看近效期批次</span>
          <ChevronRight class="w-4 h-4 text-gray-300 group-hover:text-warning-500 group-hover:translate-x-0.5 transition-all" />
        </div>
      </div>

      <div
        class="bg-white rounded-xl p-6 shadow-card hover:shadow-card-hover transition-all duration-300 cursor-pointer hover:-translate-y-1 group"
        @click="goToLowStockConsumables"
      >
        <div class="flex items-start justify-between">
          <div>
            <p class="text-sm text-gray-500 mb-1">低库存数量</p>
            <p class="text-3xl font-bold text-danger-600">
              {{ loading ? '--' : stats?.lowStockCount || 0 }}
            </p>
            <div class="flex items-center gap-1 mt-2 text-xs text-danger-600">
              <TrendingDown class="w-3 h-3" />
              <span>需要补货</span>
            </div>
          </div>
          <div
            class="w-12 h-12 rounded-xl bg-gradient-to-br from-danger-500 to-danger-600 flex items-center justify-center shadow-lg shadow-danger-500/30 group-hover:scale-110 transition-transform"
          >
            <AlertCircle class="w-6 h-6 text-white" />
          </div>
        </div>
        <div class="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between text-xs">
          <span class="text-gray-400">查看低库存耗材</span>
          <ChevronRight class="w-4 h-4 text-gray-300 group-hover:text-danger-500 group-hover:translate-x-0.5 transition-all" />
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div
        class="bg-white rounded-xl p-6 shadow-card hover:shadow-card-hover transition-all duration-300 cursor-pointer group"
        @click="goToBatches"
      >
        <div class="flex items-center justify-between mb-6">
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-lg bg-success-50 flex items-center justify-center"
            >
              <ArrowDownToLine class="w-5 h-5 text-success-600" />
            </div>
            <div>
              <h3 class="text-lg font-semibold text-gray-800">近30天入库趋势</h3>
              <p class="text-xs text-gray-400">试剂与耗材入库统计</p>
            </div>
          </div>
          <ChevronRight
            class="w-5 h-5 text-gray-300 group-hover:text-success-500 group-hover:translate-x-0.5 transition-all"
          />
        </div>

        <div v-if="loading" class="h-56 flex items-center justify-center">
          <div
            class="animate-spin w-8 h-8 border-2 border-success-500 border-t-transparent rounded-full"
          />
        </div>

        <div v-else class="h-56 flex items-end gap-1 px-1">
          <div
            v-for="item in stats?.trendData"
            :key="'in-' + item.date"
            class="flex-1 flex flex-col items-center gap-2 group/item"
          >
            <div class="w-full flex items-end h-40">
              <div
                class="w-full bg-gradient-to-t from-success-500 to-success-400 rounded-t transition-all duration-300 hover:from-success-600 hover:to-success-500 cursor-pointer relative"
                :style="{ height: `${(item.inbound / maxInboundValue) * 100}%` }"
              >
                <div
                  class="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover/item:opacity-100 transition-opacity whitespace-nowrap pointer-events-none"
                >
                  {{ item.inbound }}
                </div>
              </div>
            </div>
            <span
              v-if="
                stats?.trendData &&
                stats.trendData.indexOf(item) % 5 === 0
              "
              class="text-xs text-gray-400 truncate w-full text-center"
            >
              {{ item.date }}
            </span>
          </div>
        </div>
      </div>

      <div
        class="bg-white rounded-xl p-6 shadow-card hover:shadow-card-hover transition-all duration-300 cursor-pointer group"
        @click="goToBatches"
      >
        <div class="flex items-center justify-between mb-6">
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center"
            >
              <ArrowUpFromLine class="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h3 class="text-lg font-semibold text-gray-800">近30天出库趋势</h3>
              <p class="text-xs text-gray-400">试剂与耗材领用统计</p>
            </div>
          </div>
          <ChevronRight
            class="w-5 h-5 text-gray-300 group-hover:text-primary-500 group-hover:translate-x-0.5 transition-all"
          />
        </div>

        <div v-if="loading" class="h-56 flex items-center justify-center">
          <div
            class="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full"
          />
        </div>

        <div v-else class="h-56 flex items-end gap-1 px-1">
          <div
            v-for="item in stats?.trendData"
            :key="'out-' + item.date"
            class="flex-1 flex flex-col items-center gap-2 group/item"
          >
            <div class="w-full flex items-end h-40">
              <div
                class="w-full bg-gradient-to-t from-primary-500 to-primary-400 rounded-t transition-all duration-300 hover:from-primary-600 hover:to-primary-500 cursor-pointer relative"
                :style="{ height: `${(item.outbound / maxOutboundValue) * 100}%` }"
              >
                <div
                  class="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover/item:opacity-100 transition-opacity whitespace-nowrap pointer-events-none"
                >
                  {{ item.outbound }}
                </div>
              </div>
            </div>
            <span
              v-if="
                stats?.trendData &&
                stats.trendData.indexOf(item) % 5 === 0
              "
              class="text-xs text-gray-400 truncate w-full text-center"
            >
              {{ item.date }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div
        class="bg-white rounded-xl p-6 shadow-card hover:shadow-card-hover transition-all duration-300 cursor-pointer group"
        @click="goToReagents"
      >
        <div class="flex items-center justify-between mb-6">
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center"
            >
              <FlaskRound class="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h3 class="text-lg font-semibold text-gray-800">试剂分类分布</h3>
              <p class="text-xs text-gray-400">按试剂品类统计数量</p>
            </div>
          </div>
          <ChevronRight
            class="w-5 h-5 text-gray-300 group-hover:text-primary-500 group-hover:translate-x-0.5 transition-all"
          />
        </div>

        <div v-if="loading" class="h-64 flex items-center justify-center">
          <div
            class="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full"
          />
        </div>

        <div v-else class="flex items-center gap-8">
          <div class="relative w-44 h-44 flex-shrink-0">
            <svg viewBox="0 0 100 100" class="transform -rotate-90 w-full h-full">
              <circle
                v-for="(cat, index) in stats?.categoryStats"
                :key="'reagent-cat-' + cat.name"
                cx="50"
                cy="50"
                r="40"
                fill="none"
                :stroke="categoryColors[index % categoryColors.length]"
                stroke-width="20"
                :stroke-dasharray="`${getCategoryPercentage(cat.value, stats?.categoryStats || []) * 2.51} 251`"
                :stroke-dashoffset="
                  -stats?.categoryStats
                    .slice(0, index)
                    .reduce(
                      (sum, c) =>
                        sum + getCategoryPercentage(c.value, stats?.categoryStats || []) * 2.51,
                      0
                    )
                "
                class="transition-all duration-500"
              />
            </svg>
            <div class="absolute inset-0 flex items-center justify-center flex-col">
              <span class="text-2xl font-bold text-gray-800">
                {{ stats?.reagentCount }}
              </span>
              <span class="text-xs text-gray-400">种试剂</span>
            </div>
          </div>

          <div class="flex-1 space-y-2.5 max-h-48 overflow-y-auto pr-2">
            <div
              v-for="(cat, index) in stats?.categoryStats"
              :key="'reagent-cat-item-' + cat.name"
              class="flex items-center justify-between text-sm group-hover/item:bg-gray-50 -mx-2 px-2 py-1 rounded transition-colors"
            >
              <div class="flex items-center gap-2.5">
                <div
                  class="w-3 h-3 rounded-full flex-shrink-0"
                  :style="{
                    backgroundColor: categoryColors[index % categoryColors.length],
                  }"
                />
                <span class="text-gray-600">{{ cat.name }}</span>
              </div>
              <span class="font-semibold text-gray-800">{{ cat.value }}</span>
            </div>
          </div>
        </div>
      </div>

      <div
        class="bg-white rounded-xl p-6 shadow-card hover:shadow-card-hover transition-all duration-300 cursor-pointer group"
        @click="goToConsumables"
      >
        <div class="flex items-center justify-between mb-6">
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-lg bg-success-50 flex items-center justify-center"
            >
              <Boxes class="w-5 h-5 text-success-600" />
            </div>
            <div>
              <h3 class="text-lg font-semibold text-gray-800">耗材分类分布</h3>
              <p class="text-xs text-gray-400">按耗材品类统计数量</p>
            </div>
          </div>
          <ChevronRight
            class="w-5 h-5 text-gray-300 group-hover:text-success-500 group-hover:translate-x-0.5 transition-all"
          />
        </div>

        <div v-if="loading" class="h-64 flex items-center justify-center">
          <div
            class="animate-spin w-8 h-8 border-2 border-success-500 border-t-transparent rounded-full"
          />
        </div>

        <div v-else class="flex items-center gap-8">
          <div class="relative w-44 h-44 flex-shrink-0">
            <svg viewBox="0 0 100 100" class="transform -rotate-90 w-full h-full">
              <circle
                v-for="(cat, index) in stats?.consumableCategoryStats"
                :key="'consumable-cat-' + cat.name"
                cx="50"
                cy="50"
                r="40"
                fill="none"
                :stroke="categoryColors[index % categoryColors.length]"
                stroke-width="20"
                :stroke-dasharray="`${getCategoryPercentage(cat.value, stats?.consumableCategoryStats || []) * 2.51} 251`"
                :stroke-dashoffset="
                  -stats?.consumableCategoryStats
                    .slice(0, index)
                    .reduce(
                      (sum, c) =>
                        sum +
                        getCategoryPercentage(c.value, stats?.consumableCategoryStats || []) *
                          2.51,
                      0
                    )
                "
                class="transition-all duration-500"
              />
            </svg>
            <div class="absolute inset-0 flex items-center justify-center flex-col">
              <span class="text-2xl font-bold text-gray-800">
                {{ stats?.consumableCount }}
              </span>
              <span class="text-xs text-gray-400">种耗材</span>
            </div>
          </div>

          <div class="flex-1 space-y-2.5 max-h-48 overflow-y-auto pr-2">
            <div
              v-for="(cat, index) in stats?.consumableCategoryStats"
              :key="'consumable-cat-item-' + cat.name"
              class="flex items-center justify-between text-sm group-hover/item:bg-gray-50 -mx-2 px-2 py-1 rounded transition-colors"
            >
              <div class="flex items-center gap-2.5">
                <div
                  class="w-3 h-3 rounded-full flex-shrink-0"
                  :style="{
                    backgroundColor: categoryColors[index % categoryColors.length],
                  }"
                />
                <span class="text-gray-600">{{ cat.name }}</span>
              </div>
              <span class="font-semibold text-gray-800">{{ cat.value }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div
        class="bg-white rounded-xl shadow-card overflow-hidden hover:shadow-card-hover transition-all duration-300 cursor-pointer group"
        @click="goToExpiringBatches"
      >
        <div class="flex items-center justify-between p-6 border-b border-gray-100">
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-lg bg-warning-50 flex items-center justify-center"
            >
              <Calendar class="w-5 h-5 text-warning-600" />
            </div>
            <div>
              <h3 class="text-lg font-semibold text-gray-800">即将过期批次排行</h3>
              <p class="text-xs text-gray-400">按过期时间升序排列</p>
            </div>
          </div>
          <div class="flex items-center gap-1 px-3 py-1.5 text-sm text-warning-600 hover:bg-warning-50 rounded-lg transition-colors">
            查看全部
            <ChevronRight class="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        <div v-if="loading" class="p-12 flex items-center justify-center">
          <div
            class="animate-spin w-8 h-8 border-2 border-warning-500 border-t-transparent rounded-full"
          />
        </div>

        <div v-else-if="!stats?.expiringBatches?.length" class="p-12 text-center text-gray-400">
          <Calendar class="w-12 h-12 mx-auto mb-3 text-gray-200" />
          <p>暂无即将过期批次</p>
        </div>

        <div v-else class="divide-y divide-gray-50">
          <div
            v-for="(batch, index) in stats?.expiringBatches"
            :key="batch.id"
            class="flex items-center gap-4 px-6 py-3.5 hover:bg-gray-50 transition-colors group/item"
            @click.stop="goToBatches"
          >
            <div
              class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
              :class="
                index < 3
                  ? 'bg-warning-100 text-warning-700'
                  : 'bg-gray-100 text-gray-500'
              "
            >
              {{ index + 1 }}
            </div>
            <div class="flex-1 min-w-0">
              <div class="font-medium text-gray-800 truncate">
                {{ batch.reagentName }}
              </div>
              <div class="text-xs text-gray-400 mt-0.5 flex items-center gap-2">
                <span class="font-mono">{{ batch.batchNumber }}</span>
                <span>·</span>
                <span>{{ formatDate(batch.expiryDate) }}</span>
              </div>
            </div>
            <div class="text-right flex-shrink-0">
              <div class="text-sm font-semibold text-gray-800">
                {{ batch.remainingQuantity }}
                <span class="text-xs text-gray-400 font-normal ml-0.5">
                  {{ batch.unit }}
                </span>
              </div>
              <div
                class="text-xs mt-0.5 flex items-center justify-end gap-1"
                :class="getExpiryDaysClass(batch.expiryDays)"
              >
                <Clock class="w-3 h-3" />
                {{ getExpiryDaysLabel(batch.expiryDays) }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        class="bg-white rounded-xl shadow-card overflow-hidden hover:shadow-card-hover transition-all duration-300 cursor-pointer group"
        @click="goToLowStockConsumables"
      >
        <div class="flex items-center justify-between p-6 border-b border-gray-100">
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-lg bg-danger-50 flex items-center justify-center"
            >
              <AlertTriangle class="w-5 h-5 text-danger-600" />
            </div>
            <div>
              <h3 class="text-lg font-semibold text-gray-800">低库存耗材排行</h3>
              <p class="text-xs text-gray-400">按库存数量升序排列</p>
            </div>
          </div>
          <div class="flex items-center gap-1 px-3 py-1.5 text-sm text-danger-600 hover:bg-danger-50 rounded-lg transition-colors">
            查看全部
            <ChevronRight class="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        <div v-if="loading" class="p-12 flex items-center justify-center">
          <div
            class="animate-spin w-8 h-8 border-2 border-danger-500 border-t-transparent rounded-full"
          />
        </div>

        <div v-else-if="!stats?.lowStockConsumables?.length" class="p-12 text-center text-gray-400">
          <AlertTriangle class="w-12 h-12 mx-auto mb-3 text-gray-200" />
          <p>暂无低库存耗材</p>
        </div>

        <div v-else class="divide-y divide-gray-50">
          <div
            v-for="(item, index) in stats?.lowStockConsumables"
            :key="item.id"
            class="flex items-center gap-4 px-6 py-3.5 hover:bg-gray-50 transition-colors group/item"
            @click.stop="goToConsumableDetail(item.id)"
          >
            <div
              class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
              :class="
                index < 3
                  ? 'bg-danger-100 text-danger-700'
                  : 'bg-gray-100 text-gray-500'
              "
            >
              {{ index + 1 }}
            </div>
            <div class="flex-1 min-w-0">
              <div class="font-medium text-gray-800 truncate">{{ item.name }}</div>
              <div class="text-xs text-gray-400 mt-0.5">
                {{ item.category }}
              </div>
              <div class="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden w-full">
                <div
                  class="h-full rounded-full transition-all duration-500"
                  :class="
                    getStockLevelColor(
                      getStockLevelPercent(item.stockQuantity, item.safetyStock)
                    )
                  "
                  :style="{
                    width: `${getStockLevelPercent(item.stockQuantity, item.safetyStock)}%`,
                  }"
                />
              </div>
            </div>
            <div class="text-right flex-shrink-0">
              <div class="text-sm font-semibold text-danger-600">
                {{ item.stockQuantity }}
                <span class="text-xs text-gray-400 font-normal ml-0.5">
                  {{ item.unit }}
                </span>
              </div>
              <div class="text-xs text-gray-400 mt-0.5">
                安全库存 {{ item.safetyStock }} {{ item.unit }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div
        class="bg-white rounded-xl shadow-card overflow-hidden hover:shadow-card-hover transition-all duration-300 cursor-pointer group"
        @click="goToReagents"
      >
        <div class="flex items-center justify-between p-6 border-b border-gray-100">
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center"
            >
              <Activity class="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h3 class="text-lg font-semibold text-gray-800">近期高频领用试剂</h3>
              <p class="text-xs text-gray-400">按领用数量降序排列</p>
            </div>
          </div>
          <div class="flex items-center gap-1 px-3 py-1.5 text-sm text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
            查看全部
            <ChevronRight class="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        <div v-if="loading" class="p-12 flex items-center justify-center">
          <div
            class="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full"
          />
        </div>

        <div v-else-if="!stats?.topUsedReagents?.length" class="p-12 text-center text-gray-400">
          <Activity class="w-12 h-12 mx-auto mb-3 text-gray-200" />
          <p>暂无领用记录</p>
        </div>

        <div v-else class="divide-y divide-gray-50">
          <div
            v-for="(item, index) in stats?.topUsedReagents"
            :key="item.id"
            class="flex items-center gap-4 px-6 py-3.5 hover:bg-gray-50 transition-colors group/item"
            @click.stop="goToReagents"
          >
            <div
              class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
              :class="
                index === 0
                  ? 'bg-primary-100 text-primary-700'
                  : index === 1
                    ? 'bg-gray-100 text-gray-600'
                    : index === 2
                      ? 'bg-warning-100 text-warning-700'
                      : 'bg-gray-50 text-gray-400'
              "
            >
              {{ index + 1 }}
            </div>
            <div class="flex-1 min-w-0">
              <div class="font-medium text-gray-800 truncate">{{ item.name }}</div>
            </div>
            <div class="flex items-center gap-3 flex-shrink-0">
              <div class="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  class="h-full bg-gradient-to-r from-primary-400 to-primary-500 rounded-full"
                  :style="{
                    width: `${
                      stats?.topUsedReagents && stats.topUsedReagents[0]
                        ? (item.usageCount / stats.topUsedReagents[0].usageCount) * 100
                        : 0
                    }%`,
                  }"
                />
              </div>
              <div class="text-right min-w-[60px]">
                <span class="text-sm font-semibold text-primary-600">
                  {{ item.usageCount }}
                </span>
                <span v-if="item.unit" class="text-xs text-gray-400 ml-0.5">
                  {{ item.unit }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        class="bg-white rounded-xl shadow-card overflow-hidden hover:shadow-card-hover transition-all duration-300 cursor-pointer group"
        @click="goToConsumables"
      >
        <div class="flex items-center justify-between p-6 border-b border-gray-100">
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-lg bg-success-50 flex items-center justify-center"
            >
              <Activity class="w-5 h-5 text-success-600" />
            </div>
            <div>
              <h3 class="text-lg font-semibold text-gray-800">近期高频领用耗材</h3>
              <p class="text-xs text-gray-400">按领用数量降序排列</p>
            </div>
          </div>
          <div class="flex items-center gap-1 px-3 py-1.5 text-sm text-success-600 hover:bg-success-50 rounded-lg transition-colors">
            查看全部
            <ChevronRight class="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        <div v-if="loading" class="p-12 flex items-center justify-center">
          <div
            class="animate-spin w-8 h-8 border-2 border-success-500 border-t-transparent rounded-full"
          />
        </div>

        <div v-else-if="!stats?.topUsedConsumables?.length" class="p-12 text-center text-gray-400">
          <Activity class="w-12 h-12 mx-auto mb-3 text-gray-200" />
          <p>暂无领用记录</p>
        </div>

        <div v-else class="divide-y divide-gray-50">
          <div
            v-for="(item, index) in stats?.topUsedConsumables"
            :key="item.id"
            class="flex items-center gap-4 px-6 py-3.5 hover:bg-gray-50 transition-colors group/item"
            @click.stop="goToConsumableDetail(item.id)"
          >
            <div
              class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
              :class="
                index === 0
                  ? 'bg-success-100 text-success-700'
                  : index === 1
                    ? 'bg-gray-100 text-gray-600'
                    : index === 2
                      ? 'bg-warning-100 text-warning-700'
                      : 'bg-gray-50 text-gray-400'
              "
            >
              {{ index + 1 }}
            </div>
            <div class="flex-1 min-w-0">
              <div class="font-medium text-gray-800 truncate">{{ item.name }}</div>
              <div v-if="item.category" class="text-xs text-gray-400 mt-0.5">
                {{ item.category }}
              </div>
            </div>
            <div class="flex items-center gap-3 flex-shrink-0">
              <div class="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  class="h-full bg-gradient-to-r from-success-400 to-success-500 rounded-full"
                  :style="{
                    width: `${
                      stats?.topUsedConsumables && stats.topUsedConsumables[0]
                        ? (item.usageCount / stats.topUsedConsumables[0].usageCount) * 100
                        : 0
                    }%`,
                  }"
                />
              </div>
              <div class="text-right min-w-[60px]">
                <span class="text-sm font-semibold text-success-600">
                  {{ item.usageCount }}
                </span>
                <span v-if="item.unit" class="text-xs text-gray-400 ml-0.5">
                  {{ item.unit }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
