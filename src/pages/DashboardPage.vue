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
  MapPin,
} from 'lucide-vue-next'
import { mockGetDashboardStats } from '@/mock/dashboard'
import { mockGetExpiringBatches } from '@/mock/batches'
import type { DashboardStats, CategoryStat, TrendDataItem } from '@/types/common'
import type { ReagentBatch } from '@/types/batch'
import { formatDate, getExpiryDays } from '@/utils/date'
import { batchStatusLabels, batchStatusColors } from '@/types/batch'

const router = useRouter()
const loading = ref(false)
const stats = ref<DashboardStats | null>(null)
const expiringBatches = ref<ReagentBatch[]>([])

const fetchData = async () => {
  loading.value = true
  try {
    const [statsData, batches] = await Promise.all([
      mockGetDashboardStats(),
      mockGetExpiringBatches(),
    ])
    stats.value = statsData
    expiringBatches.value = batches
  } finally {
    loading.value = false
  }
}

const maxTrendValue = computed(() => {
  if (!stats.value) return 0
  const values = stats.value.trendData.flatMap(d => [d.inbound, d.outbound])
  return Math.max(...values) * 1.1
})

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

const getCategoryPercentage = (value: number) => {
  if (!stats.value) return 0
  const total = stats.value.categoryStats.reduce((sum, c) => sum + c.value, 0)
  return total > 0 ? (value / total) * 100 : 0
}

const goToBatches = () => {
  router.push('/batches')
}

const goToReagents = () => {
  router.push('/reagents')
}

const goToConsumables = () => {
  router.push('/consumables')
}

const getDaysLabel = (batch: ReagentBatch) => {
  const days = getExpiryDays(batch.expiryDate)
  if (days < 0) {
    return `已过期 ${Math.abs(days)} 天`
  }
  return `剩余 ${days} 天`
}

onMounted(() => {
  fetchData()
})
</script>

<template>
  <div class="space-y-6">
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
      <div
        @click="goToReagents"
        class="bg-white rounded-xl p-6 shadow-card hover:shadow-card-hover transition-all duration-300 cursor-pointer hover:-translate-y-1"
      >
        <div class="flex items-start justify-between">
          <div>
            <p class="text-sm text-gray-500 mb-1">试剂总数</p>
            <p class="text-3xl font-bold text-gray-800">
              {{ loading ? '--' : stats?.reagentCount || 0 }}
            </p>
            <div class="flex items-center gap-1 mt-2 text-xs text-success-600">
              <TrendingUp class="w-3 h-3" />
              <span>较上月 +12%</span>
            </div>
          </div>
          <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/30">
            <FlaskConical class="w-6 h-6 text-white" />
          </div>
        </div>
      </div>

      <div
        @click="goToConsumables"
        class="bg-white rounded-xl p-6 shadow-card hover:shadow-card-hover transition-all duration-300 cursor-pointer hover:-translate-y-1"
      >
        <div class="flex items-start justify-between">
          <div>
            <p class="text-sm text-gray-500 mb-1">耗材总数</p>
            <p class="text-3xl font-bold text-gray-800">
              {{ loading ? '--' : stats?.consumableCount || 0 }}
            </p>
            <div class="flex items-center gap-1 mt-2 text-xs text-success-600">
              <TrendingUp class="w-3 h-3" />
              <span>较上月 +8%</span>
            </div>
          </div>
          <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-success-500 to-success-600 flex items-center justify-center shadow-lg shadow-success-500/30">
            <PackageOpen class="w-6 h-6 text-white" />
          </div>
        </div>
      </div>

      <div
        @click="goToBatches"
        class="bg-white rounded-xl p-6 shadow-card hover:shadow-card-hover transition-all duration-300 cursor-pointer hover:-translate-y-1"
      >
        <div class="flex items-start justify-between">
          <div>
            <p class="text-sm text-gray-500 mb-1">近效期试剂</p>
            <p class="text-3xl font-bold text-warning-600">
              {{ loading ? '--' : stats?.expiringCount || 0 }}
            </p>
            <div class="flex items-center gap-1 mt-2 text-xs text-warning-600">
              <AlertTriangle class="w-3 h-3" />
              <span>需尽快处理</span>
            </div>
          </div>
          <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-warning-500 to-warning-600 flex items-center justify-center shadow-lg shadow-warning-500/30">
            <Calendar class="w-6 h-6 text-white" />
          </div>
        </div>
      </div>

      <div
        @click="goToConsumables"
        class="bg-white rounded-xl p-6 shadow-card hover:shadow-card-hover transition-all duration-300 cursor-pointer hover:-translate-y-1"
      >
        <div class="flex items-start justify-between">
          <div>
            <p class="text-sm text-gray-500 mb-1">低库存预警</p>
            <p class="text-3xl font-bold text-danger-600">
              {{ loading ? '--' : stats?.lowStockCount || 0 }}
            </p>
            <div class="flex items-center gap-1 mt-2 text-xs text-danger-600">
              <TrendingDown class="w-3 h-3" />
              <span>需要补货</span>
            </div>
          </div>
          <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-danger-500 to-danger-600 flex items-center justify-center shadow-lg shadow-danger-500/30">
            <AlertTriangle class="w-6 h-6 text-white" />
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 bg-white rounded-xl p-6 shadow-card">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-lg font-semibold text-gray-800">出入库趋势</h3>
          <span class="text-xs text-gray-400">近30天</span>
        </div>

        <div v-if="loading" class="h-64 flex items-center justify-center">
          <div class="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full"></div>
        </div>

        <div v-else class="h-64 flex items-end gap-2 px-2">
          <div
            v-for="item in stats?.trendData"
            :key="item.date"
            class="flex-1 flex flex-col items-center gap-2 group"
          >
            <div class="w-full flex flex-col items-center justify-end gap-1 h-48">
              <div
                class="w-full bg-success-500/80 rounded-t transition-all duration-300 group-hover:bg-success-600"
                :style="{ height: `${(item.inbound / maxTrendValue) * 100}%` }"
                :title="`入库: ${item.inbound}`"
              ></div>
              <div
                class="w-full bg-primary-500/80 rounded-t transition-all duration-300 group-hover:bg-primary-600"
                :style="{ height: `${(item.outbound / maxTrendValue) * 100}%` }"
                :title="`出库: ${item.outbound}`"
              ></div>
            </div>
            <span class="text-xs text-gray-400 truncate w-full text-center">
              {{ item.date }}
            </span>
          </div>
        </div>

        <div class="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-gray-100">
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 rounded bg-success-500"></div>
            <span class="text-sm text-gray-600">入库</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 rounded bg-primary-500"></div>
            <span class="text-sm text-gray-600">出库</span>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl p-6 shadow-card">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-lg font-semibold text-gray-800">分类统计</h3>
          <span class="text-xs text-gray-400">试剂分布</span>
        </div>

        <div v-if="loading" class="h-64 flex items-center justify-center">
          <div class="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full"></div>
        </div>

        <div v-else class="flex flex-col items-center">
          <div class="relative w-40 h-40">
            <svg viewBox="0 0 100 100" class="transform -rotate-90">
              <circle
                v-for="(cat, index) in stats?.categoryStats"
                :key="cat.name"
                cx="50"
                cy="50"
                r="40"
                fill="none"
                :stroke="categoryColors[index % categoryColors.length]"
                stroke-width="20"
                :stroke-dasharray="`${getCategoryPercentage(cat.value) * 2.51} 251`"
                :stroke-dashoffset="-stats?.categoryStats.slice(0, index).reduce((sum, c) => sum + getCategoryPercentage(c.value) * 2.51, 0)"
              />
            </svg>
            <div class="absolute inset-0 flex items-center justify-center flex-col">
              <span class="text-2xl font-bold text-gray-800">{{ stats?.reagentCount }}</span>
              <span class="text-xs text-gray-400">种试剂</span>
            </div>
          </div>

          <div class="w-full mt-6 space-y-2 max-h-40 overflow-y-auto">
            <div
              v-for="(cat, index) in stats?.categoryStats"
              :key="cat.name"
              class="flex items-center justify-between text-sm"
            >
              <div class="flex items-center gap-2">
                <div
                  class="w-2.5 h-2.5 rounded-full"
                  :style="{ backgroundColor: categoryColors[index % categoryColors.length] }"
                ></div>
                <span class="text-gray-600">{{ cat.name }}</span>
              </div>
              <span class="font-medium text-gray-800">{{ cat.value }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-xl shadow-card overflow-hidden">
      <div class="flex items-center justify-between p-6 border-b border-gray-100">
        <div>
          <h3 class="text-lg font-semibold text-gray-800">效期预警</h3>
          <p class="text-sm text-gray-500 mt-1">即将过期和已过期的试剂批次</p>
        </div>
        <button
          @click="goToBatches"
          class="flex items-center gap-1 px-4 py-2 text-sm text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
        >
          查看全部
          <ChevronRight class="w-4 h-4" />
        </button>
      </div>

      <div v-if="loading" class="p-12 flex items-center justify-center">
        <div class="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full"></div>
      </div>

      <div v-else-if="expiringBatches.length === 0" class="p-12 text-center text-gray-400">
        暂无效期预警数据
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                试剂名称
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                批次号
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                有效期至
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                剩余库存
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                存放位置
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                状态
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr
              v-for="batch in expiringBatches"
              :key="batch.id"
              class="hover:bg-gray-50 transition-colors cursor-pointer"
              :class="{
                'bg-warning-50/50': batch.status === 'warning',
                'bg-danger-50/30': batch.status === 'expired',
              }"
            >
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="font-medium text-gray-900">{{ batch.reagentName }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap font-mono text-sm text-gray-600">
                {{ batch.batchNumber }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-gray-900">{{ formatDate(batch.expiryDate) }}</div>
                <div
                  class="text-xs mt-0.5"
                  :class="batch.status === 'expired' ? 'text-danger-600' : 'text-warning-600'"
                >
                  {{ getDaysLabel(batch) }}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="text-gray-900 font-medium">{{ batch.remainingQuantity }}</span>
                <span class="text-gray-400 text-sm ml-1">{{ batch.unit }}</span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center gap-1 text-gray-600 text-sm">
                  <MapPin class="w-3.5 h-3.5 text-gray-400" />
                  {{ batch.storageLocation }}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                  :class="batchStatusColors[batch.status]"
                >
                  {{ batchStatusLabels[batch.status] }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
