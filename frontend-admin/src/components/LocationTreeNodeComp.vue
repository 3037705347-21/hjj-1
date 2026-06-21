<script setup lang="ts">
import { ChevronDown, ChevronRight as ChevronRightIcon, Thermometer, Flame, Eye, ArrowLeftRight, Plus, Edit2, Trash2 } from 'lucide-vue-next'
import type { LocationTreeNode, LocationLevel } from '@/types/location'
import {
  locationLevelLabels,
  locationLevelColors,
  temperatureZoneLabels,
  temperatureZoneColors,
  locationStatusLabels,
  locationStatusColors,
} from '@/types/location'

interface Props {
  node: LocationTreeNode
  depth: number
  expandedIds: Set<string>
  selectedIds?: string[]
  canEdit?: boolean
  canDelete?: boolean
  canCreate?: boolean
  canTransfer?: boolean
  childLevelMap?: Record<string, LocationLevel>
}

const props = withDefaults(defineProps<Props>(), {
  selectedIds: () => [],
  canEdit: false,
  canDelete: false,
  canCreate: false,
  canTransfer: false,
  childLevelMap: () => ({}),
})

const emit = defineEmits<{
  toggle: [node: LocationTreeNode]
  viewOccupancy: [id: string, name: string]
  transfer: [id: string, name: string]
  createChild: [level: LocationLevel, parentId: string]
  edit: [id: string]
  delete: [id: string]
  navigate: [id: string]
}>()

const occupancyRate = (current: number, capacity: number): number => {
  if (capacity <= 0) return 0
  return Math.min(100, Math.round((current / capacity) * 100))
}

const occupancyBarColor = (rate: number): string => {
  if (rate >= 90) return 'bg-danger-500'
  if (rate >= 70) return 'bg-warning-500'
  return 'bg-success-500'
}

const isExpanded = (nodeId: string): boolean => props.expandedIds.has(nodeId)
const hasChildren = (node: LocationTreeNode): boolean => node.children.length > 0
</script>

<template>
  <div>
    <div
      class="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
      :class="{ 'bg-primary-50/50': selectedIds.includes(node.id) }"
      :style="{ paddingLeft: `${depth * 24 + 12}px` }"
      @click="emit('navigate', node.id)"
    >
      <div class="flex items-center gap-2 min-w-0 flex-1">
        <button
          v-if="hasChildren(node)"
          class="p-0.5 hover:bg-gray-100 rounded transition-colors flex-shrink-0"
          @click.stop="emit('toggle', node)"
        >
          <ChevronDown v-if="isExpanded(node.id)" class="w-4 h-4 text-gray-500" />
          <ChevronRightIcon v-else class="w-4 h-4 text-gray-500" />
        </button>
        <span v-else class="w-5 flex-shrink-0" />
        <span class="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium flex-shrink-0" :class="locationLevelColors[node.level]">{{ locationLevelLabels[node.level] }}</span>
        <span class="text-sm font-medium text-gray-900 truncate">{{ node.code }}</span>
        <span class="text-sm text-gray-600 truncate">{{ node.name }}</span>
        <span class="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium flex-shrink-0" :class="temperatureZoneColors[node.temperatureZone]">
          <Thermometer class="w-3 h-3 mr-0.5" />{{ temperatureZoneLabels[node.temperatureZone] }}
        </span>
        <span v-if="node.isHazardous" class="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-danger-100 text-danger-700 flex-shrink-0">
          <Flame class="w-3 h-3 mr-0.5" />危险品
        </span>
        <span class="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium flex-shrink-0" :class="locationStatusColors[node.status]">{{ locationStatusLabels[node.status] }}</span>
        <span class="text-xs text-gray-400 flex-shrink-0">{{ node.currentOccupancy }}/{{ node.capacityLimit }}</span>
        <div class="w-16 h-1.5 bg-gray-100 rounded-full flex-shrink-0 overflow-hidden">
          <div class="h-full rounded-full transition-all" :class="occupancyBarColor(occupancyRate(node.currentOccupancy, node.capacityLimit))" :style="{ width: occupancyRate(node.currentOccupancy, node.capacityLimit) + '%' }" />
        </div>
      </div>
      <div class="flex items-center gap-1 flex-shrink-0" @click.stop>
        <button class="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors" title="查看占用" @click="emit('viewOccupancy', node.id, node.name)"><Eye class="w-3.5 h-3.5" /></button>
        <button v-if="canTransfer && node.currentOccupancy > 0" class="p-1.5 text-gray-400 hover:text-info-600 hover:bg-info-50 rounded transition-colors" title="调拨" @click="emit('transfer', node.id, node.name)"><ArrowLeftRight class="w-3.5 h-3.5" /></button>
        <button v-if="canCreate && childLevelMap[node.level]" class="p-1.5 text-gray-400 hover:text-success-600 hover:bg-success-50 rounded transition-colors" title="添加子库位" @click="emit('createChild', childLevelMap[node.level], node.id)"><Plus class="w-3.5 h-3.5" /></button>
        <button v-if="canEdit" class="p-1.5 text-gray-400 hover:text-warning-600 hover:bg-warning-50 rounded transition-colors" title="编辑" @click="emit('edit', node.id)"><Edit2 class="w-3.5 h-3.5" /></button>
        <button v-if="canDelete" class="p-1.5 text-gray-400 hover:text-danger-600 hover:bg-danger-50 rounded transition-colors" title="删除" @click="emit('delete', node.id)"><Trash2 class="w-3.5 h-3.5" /></button>
      </div>
    </div>
    <div v-if="hasChildren(node) && isExpanded(node.id)" class="space-y-0.5">
      <LocationTreeNodeComp
        v-for="child in node.children"
        :key="child.id"
        :node="child"
        :depth="depth + 1"
        :expanded-ids="expandedIds"
        :selected-ids="selectedIds"
        :can-edit="canEdit"
        :can-delete="canDelete"
        :can-create="canCreate"
        :can-transfer="canTransfer"
        :child-level-map="childLevelMap"
        @toggle="(n: LocationTreeNode) => emit('toggle', n)"
        @view-occupancy="(id: string, name: string) => emit('viewOccupancy', id, name)"
        @transfer="(id: string, name: string) => emit('transfer', id, name)"
        @create-child="(level: LocationLevel, parentId: string) => emit('createChild', level, parentId)"
        @edit="(id: string) => emit('edit', id)"
        @delete="(id: string) => emit('delete', id)"
        @navigate="(id: string) => emit('navigate', id)"
      />
    </div>
  </div>
</template>
