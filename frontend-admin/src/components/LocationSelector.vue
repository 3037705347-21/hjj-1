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
              重置筛选
            </button>
          </div>
          <div v-if="selectedLocation" class="flex items-center gap-2 text-xs text-gray-500">
            <MapPin class="w-3.5 h-3.5 text-primary-500" />
            <span class="truncate max-w-[280px]">{{ selectedFullPath }}</span>
          </div>
        </div>
      </div>

      <div class="flex-1 overflow-y-auto px-4 py-3 min-h-[300px]">
        <div v-if="loading" class="flex flex-col items-center justify-center py-16 text-gray-400">
          <Warehouse class="w-10 h-10 mb-3 opacity-40 animate-pulse" />
          <p class="text-sm">加载中...</p>
        </div>
        <template v-else-if="filteredTreeData.length > 0">
          <template v-for="root in filteredTreeData" :key="root.id">
            <LocationSelectorNode
              :node="root"
              :depth="0"
              :expanded-ids="expandedIds"
              :selected-id="selectedId"
              :selectable="isSelectable(root)"
              :disabled-levels="disabledLevels"
              :only-enabled="onlyEnabled"
              :only-slots="onlySlots"
              @toggle="toggleExpand"
              @select="handleSelect"
            />
          </template>
        </template>
        <div v-else class="flex flex-col items-center justify-center py-16 text-gray-400">
          <MapPin class="w-12 h-12 mb-3 opacity-40" />
          <p class="text-sm">暂无匹配的库位数据</p>
        </div>
      </div>

      <div class="flex items-center justify-between px-6 py-4 border-t border-gray-100 flex-shrink-0">
        <div v-if="selectedLocation" class="flex items-center gap-3 min-w-0 flex-1 mr-4">
          <div class="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
            <Check class="w-4 h-4 text-primary-600" />
          </div>
          <div class="min-w-0 flex-1">
            <div class="text-sm font-medium text-gray-800 truncate">{{ selectedLabel }}</div>
            <div class="text-xs text-gray-500 truncate">{{ selectedFullPath }}</div>
          </div>
        </div>
        <div v-else class="flex-1" />
        <div class="flex items-center gap-2 flex-shrink-0">
          <button
            class="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            @click="handleCancel"
          >
            取消
          </button>
          <button
            class="px-4 py-2 text-sm text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="!selectedId"
            @click="handleConfirm"
          >
            确认选择
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, h } from 'vue'
import type { PropType } from 'vue'

const LocationSelectorNode = defineComponent({
  name: 'LocationSelectorNode',
  props: {
    node: { type: Object as PropType<LocationTreeNode>, required: true },
    depth: { type: Number, required: true },
    expandedIds: { type: Set as unknown as PropType<Set<string>>, required: true },
    selectedId: { type: String, required: true },
    selectable: { type: Boolean, default: true },
    disabledLevels: { type: Array as PropType<LocationLevel[]>, default: () => [] },
    onlyEnabled: { type: Boolean, default: true },
    onlySlots: { type: Boolean, default: false },
  },
  emits: ['toggle', 'select'],
  setup(props, { emit }) {
    const hasChildren = (): boolean => props.node.children.length > 0
    const isExpanded = (): boolean => props.expandedIds.has(props.node.id)
    const isSelected = (): boolean => props.selectedId === props.node.id
    const isNodeSelectable = (): boolean => {
      if (props.disabledLevels.includes(props.node.level)) return false
      if (props.onlyEnabled && props.node.status !== 'enabled') return false
      if (props.onlySlots && props.node.level !== 'slot') return false
      return true
    }

    return () => {
      const node = props.node
      const selectable = isNodeSelectable()
      const selected = isSelected()

      return h('div', [
        h(
          'div',
          {
            class: [
              'flex items-center gap-2 px-3 py-2 rounded-lg transition-colors',
              selected ? 'bg-primary-50 ring-1 ring-primary-200' : 'hover:bg-gray-50',
              selectable ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed',
            ],
            style: { paddingLeft: `${props.depth * 24 + 12}px` },
            onClick: () => {
              if (selectable) emit('select', node)
              else if (hasChildren()) emit('toggle', node.id)
            },
          },
          [
            hasChildren()
              ? h(
                  'button',
                  {
                    class: 'p-0.5 hover:bg-gray-100 rounded transition-colors flex-shrink-0',
                    onClick: (e: Event) => {
                      e.stopPropagation()
                      emit('toggle', node.id)
                    },
                  },
                  [
                    isExpanded()
                      ? h(ChevronDown, { class: 'w-4 h-4 text-gray-500' })
                      : h(ChevronRight, { class: 'w-4 h-4 text-gray-500' }),
                  ]
                )
              : h('span', { class: 'w-5 flex-shrink-0' }),
            h(
              'span',
              {
                class: `inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium flex-shrink-0 ${locationLevelColors[node.level]}`,
              },
              locationLevelLabels[node.level]
            ),
            h('span', { class: 'text-sm font-medium text-gray-900 truncate' }, node.code),
            h('span', { class: 'text-sm text-gray-600 truncate' }, node.name),
            h(
              'span',
              {
                class: `inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium flex-shrink-0 ${temperatureZoneColors[node.temperatureZone]}`,
              },
              [h(Thermometer, { class: 'w-3 h-3 mr-0.5' }), temperatureZoneLabels[node.temperatureZone]]
            ),
            node.isHazardous
              ? h(
                  'span',
                  {
                    class:
                      'inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-danger-100 text-danger-700 flex-shrink-0',
                  },
                  [h(Flame, { class: 'w-3 h-3 mr-0.5' }), '危险品']
                )
              : null,
            h(
              'span',
              {
                class: `inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium flex-shrink-0 ${locationStatusColors[node.status]}`,
              },
              locationStatusLabels[node.status]
            ),
            selected
              ? h(
                  'div',
                  {
                    class:
                      'w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center ml-auto flex-shrink-0',
                  },
                  [h(Check, { class: 'w-3 h-3 text-white' })]
                )
              : null,
          ]
        ),
        hasChildren() && isExpanded()
          ? h(
              'div',
              { class: 'space-y-0.5' },
              node.children.map((child) =>
                h(LocationSelectorNode, {
                  key: child.id,
                  node: child,
                  depth: props.depth + 1,
                  expandedIds: props.expandedIds,
                  selectedId: props.selectedId,
                  disabledLevels: props.disabledLevels,
                  onlyEnabled: props.onlyEnabled,
                  onlySlots: props.onlySlots,
                  onToggle: (id: string) => emit('toggle', id),
                  onSelect: (n: LocationTreeNode) => emit('select', n),
                })
              )
            )
          : null,
      ])
    }
  },
})
</script>
