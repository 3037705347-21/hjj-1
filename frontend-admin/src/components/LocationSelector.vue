<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch } from 'vue'
import {
  X,
  Search,
  MapPin,
  ChevronDown,
  ChevronRight,
  Warehouse,
  Thermometer,
  Flame,
  Check,
} from 'lucide-vue-next'
import {
  mockGetAllLocations,
  buildLocationTree,
  getLocationPath,
} from '@/mock/locations'
import type {
  StorageLocation,
  LocationTreeNode,
  LocationLevel,
} from '@/types/location'
import {
  locationLevelLabels,
  locationLevelColors,
  temperatureZoneLabels,
  temperatureZoneColors,
  locationStatusLabels,
  locationStatusColors,
} from '@/types/location'

interface Props {
  visible: boolean
  modelValue?: string
  placeholder?: string
  disabledLevels?: LocationLevel[]
  onlyEnabled?: boolean
  onlySlots?: boolean
  showAllLevels?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '请选择库位',
  onlyEnabled: true,
  onlySlots: false,
  showAllLevels: false,
})

const emit = defineEmits<{
  'update:visible': [value: boolean]
  'update:modelValue': [value: string]
  confirm: [value: string, location?: StorageLocation]
  cancel: []
}>()

const loading = ref(false)
const allLocations = ref<StorageLocation[]>([])
const treeData = ref<LocationTreeNode[]>([])
const searchKeyword = ref('')
const expandedIds = ref<Set<string>>(new Set())
const selectedId = ref<string>('')
const selectedLocation = computed(() =>
  allLocations.value.find((l) => l.id === selectedId.value)
)
const selectedLabel = computed(() => {
  if (!selectedLocation.value) return ''
  return `${selectedLocation.value.code} - ${selectedLocation.value.name}`
})
const selectedFullPath = computed(() => {
  if (!selectedLocation.value) return ''
  return getLocationPath(allLocations.value, selectedLocation.value.id)
})

const filterOptions = reactive({
  level: '' as LocationLevel | '',
  temperatureZone: '' as string,
  isHazardous: '' as string,
  status: '' as string,
})

const isSelectable = (node: LocationTreeNode): boolean => {
  if (props.disabledLevels?.includes(node.level)) return false
  if (props.onlyEnabled && node.status !== 'enabled') return false
  if (props.onlySlots && node.level !== 'slot') return false
  return true
}

const isNodeVisible = (node: LocationTreeNode): boolean => {
  if (filterOptions.level && node.level !== filterOptions.level) return false
  if (filterOptions.temperatureZone && node.temperatureZone !== filterOptions.temperatureZone) return false
  if (filterOptions.isHazardous !== '' && filterOptions.isHazardous !== undefined) {
    if (node.isHazardous !== (filterOptions.isHazardous === 'true')) return false
  }
  if (filterOptions.status && node.status !== filterOptions.status) return false
  return true
}

const isSearchMatched = (node: LocationTreeNode): boolean => {
  if (!searchKeyword.value.trim()) return true
  const kw = searchKeyword.value.toLowerCase().trim()
  return (
    node.code.toLowerCase().includes(kw) ||
    node.name.toLowerCase().includes(kw)
  )
}

const hasVisibleDescendant = (node: LocationTreeNode): boolean => {
  if (isNodeVisible(node) && isSearchMatched(node)) return true
  return node.children.some((child) => hasVisibleDescendant(child))
}

const filteredTreeData = computed(() => {
  const filter = (nodes: LocationTreeNode[]): LocationTreeNode[] => {
    return nodes
      .filter((node) => {
        if (!searchKeyword.value.trim() && Object.values(filterOptions).every(v => v === '' || v === undefined)) return true
        return hasVisibleDescendant(node)
      })
      .map((node) => ({
        ...node,
        children: filter(node.children),
      }))
  }
  return filter(treeData.value)
})

const loadData = async () => {
  loading.value = true
  try {
    allLocations.value = await mockGetAllLocations()
    treeData.value = buildLocationTree(allLocations.value)
    if (props.modelValue) {
      selectedId.value = props.modelValue
    }
  } finally {
    loading.value = false
  }
}

const toggleExpand = (nodeId: string) => {
  if (expandedIds.value.has(nodeId)) {
    expandedIds.value.delete(nodeId)
  } else {
    expandedIds.value.add(nodeId)
  }
}

const expandAll = () => {
  const collect = (nodes: LocationTreeNode[]) => {
    nodes.forEach((n) => {
      if (n.children.length > 0) {
        expandedIds.value.add(n.id)
        collect(n.children)
      }
    })
  }
  collect(treeData.value)
}

const collapseAll = () => {
  expandedIds.value = new Set()
}

const handleSelect = (node: LocationTreeNode) => {
  if (!isSelectable(node)) return
  selectedId.value = node.id
}

const handleConfirm = () => {
  if (!selectedId.value) {
    alert('请选择库位')
    return
  }
  emit('update:modelValue', selectedId.value)
  emit('confirm', selectedId.value, selectedLocation.value)
  emit('update:visible', false)
}

const handleCancel = () => {
  emit('cancel')
  emit('update:visible', false)
}

const resetFilters = () => {
  searchKeyword.value = ''
  filterOptions.level = ''
  filterOptions.temperatureZone = ''
  filterOptions.isHazardous = ''
  filterOptions.status = ''
}

watch(
  () => props.visible,
  (val) => {
    if (val) {
      loadData()
      expandAll()
      if (props.modelValue) {
        selectedId.value = props.modelValue
      }
    }
  }
)

watch(
  () => props.modelValue,
  (val) => {
    selectedId.value = val || ''
  }
)

onMounted(() => {
  if (props.visible) {
    loadData()
  }
})

defineExpose({
  selectedId,
  selectedLocation,
  selectedLabel,
  selectedFullPath,
})
</script>

<template>
  <div
    v-if="visible"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
    @click.self="handleCancel"
  >
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
      <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
        <div class="flex items-center gap-2">
          <Warehouse class="w-5 h-5 text-primary-600" />
          <h3 class="text-lg font-semibold text-gray-800">选择库位</h3>
        </div>
        <button
          class="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          @click="handleCancel"
        >
          <X class="w-5 h-5 text-gray-400" />
        </button>
      </div>

      <div class="px-6 py-4 border-b border-gray-100 space-y-3 flex-shrink-0">
        <div class="relative">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            v-model="searchKeyword"
            type="text"
            placeholder="搜索库位编码、名称..."
            class="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
          />
        </div>

        <div class="grid grid-cols-4 gap-2">
          <select
            v-model="filterOptions.level"
            class="px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary-500 bg-white"
          >
            <option value="">全部层级</option>
            <option value="warehouse">仓库</option>
            <option value="room">房间</option>
            <option value="cabinet">柜体</option>
            <option value="shelf">层架</option>
            <option value="slot">格位</option>
          </select>
          <select
            v-model="filterOptions.temperatureZone"
            class="px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary-500 bg-white"
          >
            <option value="">全部温区</option>
            <option value="ambient">常温</option>
            <option value="refrigerated">冷藏</option>
            <option value="frozen">冷冻</option>
            <option value="ultra_low">超低温</option>
            <option value="constant_temp">恒温</option>
            <option value="dry">干燥</option>
          </select>
          <select
            v-model="filterOptions.isHazardous"
            class="px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary-500 bg-white"
          >
            <option value="">危险品</option>
            <option value="true">是</option>
            <option value="false">否</option>
          </select>
          <select
            v-model="filterOptions.status"
            class="px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary-500 bg-white"
          >
            <option value="">全部状态</option>
            <option value="enabled">启用</option>
            <option value="disabled">停用</option>
          </select>
        </div>

        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <button
              class="px-3 py-1 text-xs text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              @click="expandAll"
            >
              全部展开
            </button>
            <button
              class="px-3 py-1 text-xs text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              @click="collapseAll"
            >
              全部折叠
            </button>
            <button
              class="px-3 py-1 text-xs text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              @click="resetFilters"
            >
