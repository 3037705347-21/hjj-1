<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeft,
  MapPin,
  Thermometer,
  AlertTriangle,
  Package,
  BarChart3,
  Edit2,
  ArrowRightLeft,
  Plus,
  ChevronRight,
  Clock,
  Calendar,
  Layers,
  Box,
  FlaskConical,
  TreePine,
  Loader2,
} from 'lucide-vue-next'
import type {
  StorageLocation,
  LocationLevel,
  LocationFormData,
  LocationTreeNode,
  LocationOccupancyItem,
  LocationInventoryItem,
} from '@/types/location'
import {
  locationLevelLabels,
  locationLevelColors,
  temperatureZoneLabels,
  temperatureZoneColors,
  locationStatusLabels,
  locationStatusColors,
} from '@/types/location'
import {
  mockGetLocation,
  mockGetAllLocations,
  mockGetLocationInventory,
  mockGetLocationOccupancy,
  getLocationPath,
  getLocationAncestors,
  getLocationDescendants,
  buildLocationTree,
  mockUpdateLocation,
  mockLocationTransfer,
  mockBatchUpdateLocationStatus,
} from '@/mock/locations'
import { formatDate } from '@/utils/date'
import { usePermission } from '@/composables/usePermission'

const route = useRoute()
const router = useRouter()
const permission = usePermission()

const loading = ref(false)
const location = ref<StorageLocation | null>(null)
const allLocations = ref<StorageLocation[]>([])
const activeTab = ref<'inventory' | 'occupancy' | 'children'>('inventory')

const inventoryItems = ref<LocationInventoryItem[]>([])
const occupancyItems = ref<LocationOccupancyItem[]>([])
const inventoryLoading = ref(false)
const occupancyLoading = ref(false)

const canEditLocation = computed(() => permission.hasPermission('location:edit'))
const canTransferLocation = computed(() => permission.hasPermission('location:transfer'))
const canCreateLocation = computed(() => permission.hasPermission('location:create'))

const breadcrumbPath = computed(() => {
  if (!location.value || !allLocations.value.length) return ''
  return getLocationPath(allLocations.value, location.value.id)
})

const ancestorPath = computed(() => {
  if (!location.value || !allLocations.value.length) return []
  return getLocationAncestors(allLocations.value, location.value.id)
})

const occupancyRate = computed(() => {
  if (!location.value || location.value.capacityLimit <= 0) return 0
  return Math.round((location.value.currentOccupancy / location.value.capacityLimit) * 100)
})

const occupancyBarColor = computed(() => {
  const rate = occupancyRate.value
  if (rate >= 90) return 'bg-danger-500'
  if (rate >= 60) return 'bg-warning-500'
  return 'bg-success-500'
})

const inventoryStats = computed(() => {
  const items = inventoryItems.value
  const batches = items.filter(i => i.itemType === 'batch')
  const consumables = items.filter(i => i.itemType === 'consumable')
  return {
    batchCount: batches.length,
    consumableCount: consumables.length,
    totalItems: items.length,
    occupancyRate: occupancyRate.value,
  }
})

const childTree = computed(() => {
  if (!location.value || !allLocations.value.length) return []
  const descendants = getLocationDescendants(allLocations.value, location.value.id)
  const directChildren = descendants.filter(d => d.parentId === location.value!.id)
  const allRelevant = [location.value, ...descendants]
  const fullTree = buildLocationTree(allRelevant)
  return fullTree.find(n => n.id === location.value!.id)?.children || []
})

const fetchData = async () => {
  loading.value = true
  try {
    const id = route.params.id as string
    const [locResult, allResult] = await Promise.all([
      mockGetLocation(id),
      mockGetAllLocations(),
    ])
    if (locResult) {
      location.value = locResult
      allLocations.value = allResult
      loadTabData()
    } else {
      router.replace('/locations')
    }
  } finally {
    loading.value = false
  }
}

const loadTabData = async () => {
  if (!location.value) return
  const id = location.value.id

  if (activeTab.value === 'inventory') {
    inventoryLoading.value = true
    try {
      inventoryItems.value = await mockGetLocationInventory(id)
    } finally {
      inventoryLoading.value = false
    }
  } else if (activeTab.value === 'occupancy') {
    occupancyLoading.value = true
    try {
      occupancyItems.value = await mockGetLocationOccupancy(id)
    } finally {
      occupancyLoading.value = false
    }
  }
}

const handleTabChange = (tab: typeof activeTab.value) => {
  activeTab.value = tab
  loadTabData()
}

const goBack = () => {
  router.push('/locations')
}

const navigateToLocation = (id: string) => {
  router.push(`/locations/${id}`)
}

const navigateToItem = (item: LocationInventoryItem | LocationOccupancyItem) => {
  if (item.itemType === 'batch') {
    router.push('/batches')
  } else {
    router.push(`/consumables/${item.itemId}`)
  }
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
          <div class="flex items-center gap-3">
            <h1 class="text-2xl font-bold text-gray-900">
              {{ location?.name }}
            </h1>
            <span
              v-if="location"
              class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
              :class="locationStatusColors[location.status]"
            >
              {{ locationStatusLabels[location.status] }}
            </span>
          </div>
          <div class="flex items-center gap-2 mt-1 text-sm text-gray-500">
            <span
              v-if="location"
              class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
              :class="locationLevelColors[location.level]"
            >
              {{ locationLevelLabels[location.level] }}
            </span>
            <ChevronRight v-if="ancestorPath.length" class="w-3 h-3 text-gray-300" />
            <span v-for="(anc, idx) in ancestorPath" :key="anc.id" class="flex items-center gap-2">
              <span
                class="text-gray-400 hover:text-primary-600 cursor-pointer transition-colors"
                @click="navigateToLocation(anc.id)"
              >
                {{ anc.name }}
              </span>
              <ChevronRight v-if="idx < ancestorPath.length - 1" class="w-3 h-3 text-gray-300" />
            </span>
            <ChevronRight v-if="ancestorPath.length" class="w-3 h-3 text-gray-300" />
            <span class="text-gray-700 font-medium">{{ location?.name }}</span>
          </div>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <button
          v-if="canEditLocation"
          class="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-lg transition-colors flex items-center gap-2"
        >
          <Edit2 class="w-4 h-4" />
          编辑
        </button>
        <button
          v-if="canTransferLocation"
          class="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-lg transition-colors flex items-center gap-2"
        >
          <ArrowRightLeft class="w-4 h-4" />
          调拨
        </button>
        <button
          v-if="canCreateLocation"
          class="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors flex items-center gap-2"
        >
          <Plus class="w-4 h-4" />
          添加子库位
        </button>
      </div>
    </div>

    <div class="grid grid-cols-4 gap-4">
      <div class="bg-white rounded-xl shadow-card p-5">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">批次数量</p>
            <p class="text-2xl font-bold text-gray-900 mt-1">{{ inventoryStats.batchCount }}</p>
          </div>
          <div class="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center">
            <FlaskConical class="w-6 h-6 text-purple-600" />
          </div>
        </div>
      </div>
      <div class="bg-white rounded-xl shadow-card p-5">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">耗材种类</p>
            <p class="text-2xl font-bold text-gray-900 mt-1">{{ inventoryStats.consumableCount }}</p>
          </div>
          <div class="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
            <Box class="w-6 h-6 text-blue-600" />
          </div>
        </div>
      </div>
      <div class="bg-white rounded-xl shadow-card p-5">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">库存总数</p>
            <p class="text-2xl font-bold text-gray-900 mt-1">{{ inventoryStats.totalItems }}</p>
          </div>
          <div class="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center">
            <Package class="w-6 h-6 text-primary-600" />
          </div>
        </div>
      </div>
      <div class="bg-white rounded-xl shadow-card p-5">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">占用率</p>
            <p class="text-2xl font-bold text-gray-900 mt-1">{{ inventoryStats.occupancyRate }}%</p>
            <div class="mt-2 w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                class="h-full rounded-full transition-all"
                :class="occupancyBarColor"
                :style="{ width: `${inventoryStats.occupancyRate}%` }"
              />
            </div>
          </div>
          <div class="w-12 h-12 rounded-xl flex items-center justify-center"
            :class="{
              'bg-success-50': occupancyRate < 60,
              'bg-warning-50': occupancyRate >= 60 && occupancyRate < 90,
              'bg-danger-50': occupancyRate >= 90,
            }"
          >
            <BarChart3
              class="w-6 h-6"
              :class="{
                'text-success-600': occupancyRate < 60,
                'text-warning-600': occupancyRate >= 60 && occupancyRate < 90,
                'text-danger-600': occupancyRate >= 90,
              }"
            />
          </div>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-xl shadow-card overflow-hidden">
      <div class="flex items-center gap-1 px-2 border-b border-gray-100">
        <button
          class="px-6 py-4 text-sm font-medium border-b-2 transition-colors"
          :class="[
            activeTab === 'inventory'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200',
          ]"
          @click="handleTabChange('inventory')"
        >
          <span class="flex items-center gap-2">
            <BarChart3 class="w-4 h-4" />
            库存概览
          </span>
        </button>
        <button
          class="px-6 py-4 text-sm font-medium border-b-2 transition-colors"
          :class="[
            activeTab === 'occupancy'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200',
          ]"
          @click="handleTabChange('occupancy')"
        >
          <span class="flex items-center gap-2">
            <Layers class="w-4 h-4" />
            占用明细
            <span
              v-if="occupancyItems.length"
              class="px-1.5 py-0.5 text-xs rounded-full bg-gray-100 text-gray-500"
            >
              {{ occupancyItems.length }}
            </span>
          </span>
        </button>
        <button
          class="px-6 py-4 text-sm font-medium border-b-2 transition-colors"
          :class="[
            activeTab === 'children'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200',
          ]"
          @click="handleTabChange('children')"
        >
          <span class="flex items-center gap-2">
            <TreePine class="w-4 h-4" />
            子库位
            <span
              v-if="childTree.length"
              class="px-1.5 py-0.5 text-xs rounded-full bg-gray-100 text-gray-500"
            >
              {{ childTree.length }}
            </span>
          </span>
        </button>
      </div>

      <div class="p-6">
        <div v-if="loading" class="p-16 flex items-center justify-center">
          <div class="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
        </div>

        <div v-else-if="activeTab === 'inventory'" class="space-y-4">
          <p class="text-sm text-gray-500">
            共 {{ inventoryItems.length }} 条库存记录
          </p>

          <div
            v-if="inventoryLoading"
            class="p-12 flex items-center justify-center"
          >
            <Loader2 class="w-6 h-6 text-primary-500 animate-spin" />
          </div>

          <div
            v-else-if="!inventoryItems.length"
            class="p-12 text-center"
          >
            <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <Package class="w-8 h-8 text-gray-300" />
            </div>
            <p class="text-gray-400">该库位及子库位暂无库存</p>
          </div>

          <div v-else class="overflow-x-auto -mx-6">
            <table class="w-full">
              <thead class="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">类型</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">名称</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">批号</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">数量</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">所在库位</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">入库日期</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr
                  v-for="item in inventoryItems"
                  :key="item.id"
                  class="hover:bg-gray-50 transition-colors cursor-pointer"
                  @click="navigateToItem(item)"
                >
                  <td class="px-6 py-4">
                    <span
                      class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                      :class="item.itemType === 'batch' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'"
                    >
                      {{ item.itemType === 'batch' ? '批次' : '耗材' }}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-sm font-medium text-gray-900">{{ item.itemName }}</td>
                  <td class="px-6 py-4 text-sm text-gray-500">{{ item.batchNumber || '-' }}</td>
                  <td class="px-6 py-4 text-sm text-gray-700">{{ item.quantity }} {{ item.unit }}</td>
                  <td class="px-6 py-4 text-sm text-gray-500">{{ item.locationFullPath }}</td>
                  <td class="px-6 py-4 text-sm text-gray-500">{{ item.storedAt ? formatDate(item.storedAt, 'YYYY-MM-DD') : '-' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div v-else-if="activeTab === 'occupancy'" class="space-y-4">
          <p class="text-sm text-gray-500">
            共 {{ occupancyItems.length }} 条占用记录（含子库位）
          </p>

          <div
            v-if="occupancyLoading"
            class="p-12 flex items-center justify-center"
          >
            <Loader2 class="w-6 h-6 text-primary-500 animate-spin" />
          </div>

          <div
            v-else-if="!occupancyItems.length"
            class="p-12 text-center"
          >
            <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <Layers class="w-8 h-8 text-gray-300" />
            </div>
            <p class="text-gray-400">该库位及子库位暂无占用记录</p>
          </div>

          <div v-else class="overflow-x-auto -mx-6">
            <table class="w-full">
              <thead class="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">类型</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">名称</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">批号</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">数量</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">单位</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">入库日期</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr
                  v-for="item in occupancyItems"
                  :key="item.id"
                  class="hover:bg-gray-50 transition-colors cursor-pointer"
                  @click="navigateToItem(item)"
                >
                  <td class="px-6 py-4">
                    <span
                      class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                      :class="item.itemType === 'batch' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'"
                    >
                      {{ item.itemType === 'batch' ? '批次' : '耗材' }}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-sm font-medium text-gray-900">{{ item.itemName }}</td>
                  <td class="px-6 py-4 text-sm text-gray-500">{{ item.batchNumber || '-' }}</td>
                  <td class="px-6 py-4 text-sm text-gray-700">{{ item.quantity }}</td>
                  <td class="px-6 py-4 text-sm text-gray-500">{{ item.unit }}</td>
                  <td class="px-6 py-4 text-sm text-gray-500">{{ item.storedAt ? formatDate(item.storedAt, 'YYYY-MM-DD') : '-' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div v-else-if="activeTab === 'children'" class="space-y-4">
          <p class="text-sm text-gray-500">
            共 {{ childTree.length }} 个直接子库位
          </p>

          <div
            v-if="!childTree.length"
            class="p-12 text-center"
          >
            <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <TreePine class="w-8 h-8 text-gray-300" />
            </div>
            <p class="text-gray-400">该库位暂无子库位</p>
          </div>

          <div v-else class="space-y-2">
            <template v-for="node in childTree" :key="node.id">
              <div
                class="border border-gray-200 rounded-lg p-4 hover:border-primary-200 transition-colors cursor-pointer"
                @click="navigateToLocation(node.id)"
              >
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                      <MapPin class="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <div class="flex items-center gap-2">
                        <h4 class="font-medium text-gray-900">{{ node.name }}</h4>
                        <span class="text-xs text-gray-400">{{ node.code }}</span>
                        <span
                          class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                          :class="locationLevelColors[node.level]"
                        >
                          {{ locationLevelLabels[node.level] }}
                        </span>
                      </div>
                      <div class="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <span
                          class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                          :class="temperatureZoneColors[node.temperatureZone]"
                        >
                          {{ temperatureZoneLabels[node.temperatureZone] }}
                        </span>
                        <span v-if="node.isHazardous" class="inline-flex items-center gap-0.5 text-warning-600">
                          <AlertTriangle class="w-3 h-3" />
                          危化品
                        </span>
                        <span
                          class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                          :class="locationStatusColors[node.status]"
                        >
                          {{ locationStatusLabels[node.status] }}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div class="flex items-center gap-4">
                    <div class="text-right">
                      <span class="text-xs text-gray-400">占用</span>
                      <div class="flex items-center gap-2 mt-1">
                        <div class="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            class="h-full rounded-full transition-all"
                            :class="node.capacityLimit > 0 && (node.currentOccupancy / node.capacityLimit) >= 0.9 ? 'bg-danger-500' : node.capacityLimit > 0 && (node.currentOccupancy / node.capacityLimit) >= 0.6 ? 'bg-warning-500' : 'bg-success-500'"
                            :style="{ width: `${node.capacityLimit > 0 ? Math.min(Math.round((node.currentOccupancy / node.capacityLimit) * 100), 100) : 0}%` }"
                          />
                        </div>
                        <span class="text-xs text-gray-600 whitespace-nowrap">{{ node.currentOccupancy }}/{{ node.capacityLimit }}</span>
                      </div>
                    </div>
                    <ChevronRight class="w-4 h-4 text-gray-300" />
                  </div>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-xl shadow-card p-6">
      <h3 class="text-sm font-medium text-gray-700 flex items-center gap-2 mb-4">
        <MapPin class="w-4 h-4 text-gray-400" />
        库位信息
      </h3>
      <div class="grid grid-cols-2 gap-6">
        <div class="space-y-3">
          <div class="flex items-start gap-3">
            <span class="text-sm text-gray-500 w-24 flex-shrink-0">库位编码</span>
            <span class="text-sm text-gray-900 font-medium">{{ location?.code }}</span>
          </div>
          <div class="flex items-start gap-3">
            <span class="text-sm text-gray-500 w-24 flex-shrink-0">库位名称</span>
            <span class="text-sm text-gray-900">{{ location?.name }}</span>
          </div>
          <div class="flex items-start gap-3">
            <span class="text-sm text-gray-500 w-24 flex-shrink-0">层级</span>
            <span
              v-if="location"
              class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
              :class="locationLevelColors[location.level]"
            >
              {{ locationLevelLabels[location.level] }}
            </span>
          </div>
          <div class="flex items-start gap-3">
            <span class="text-sm text-gray-500 w-24 flex-shrink-0">完整路径</span>
            <span class="text-sm text-gray-900">{{ breadcrumbPath }}</span>
          </div>
        </div>
        <div class="space-y-3">
          <div class="flex items-start gap-3">
            <span class="text-sm text-gray-500 w-24 flex-shrink-0">温区</span>
            <span
              v-if="location"
              class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium gap-1"
              :class="temperatureZoneColors[location.temperatureZone]"
            >
              <Thermometer class="w-3 h-3" />
              {{ temperatureZoneLabels[location.temperatureZone] }}
            </span>
          </div>
          <div class="flex items-start gap-3">
            <span class="text-sm text-gray-500 w-24 flex-shrink-0">危化品</span>
            <span
              v-if="location?.isHazardous"
              class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-warning-100 text-warning-700 gap-0.5"
            >
              <AlertTriangle class="w-3 h-3" />
              是
            </span>
            <span v-else class="text-sm text-gray-500">否</span>
          </div>
          <div class="flex items-start gap-3">
            <span class="text-sm text-gray-500 w-24 flex-shrink-0">容量/占用</span>
            <div class="flex items-center gap-2">
              <span class="text-sm text-gray-900">{{ location?.currentOccupancy }} / {{ location?.capacityLimit }}</span>
              <div class="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  class="h-full rounded-full transition-all"
                  :class="occupancyBarColor"
                  :style="{ width: `${occupancyRate}%` }"
                />
              </div>
              <span class="text-xs text-gray-500">{{ occupancyRate }}%</span>
            </div>
          </div>
          <div class="flex items-start gap-3">
            <span class="text-sm text-gray-500 w-24 flex-shrink-0">描述</span>
            <span class="text-sm text-gray-600">{{ location?.description || '暂无描述' }}</span>
          </div>
        </div>
      </div>
      <div class="flex items-center gap-4 text-xs text-gray-400 mt-4 pt-4 border-t border-gray-100">
        <span class="flex items-center gap-1">
          <Calendar class="w-3.5 h-3.5" />
          创建于 {{ location ? formatDate(location.createdAt, 'YYYY-MM-DD HH:mm') : '' }}
        </span>
        <span class="flex items-center gap-1">
          <Clock class="w-3.5 h-3.5" />
          更新于 {{ location ? formatDate(location.updatedAt, 'YYYY-MM-DD HH:mm') : '' }}
        </span>
      </div>
    </div>
  </div>
</template>
