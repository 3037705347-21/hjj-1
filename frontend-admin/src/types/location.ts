export type LocationLevel = 'warehouse' | 'room' | 'cabinet' | 'shelf' | 'slot'

export type TemperatureZone = 'ambient' | 'refrigerated' | 'frozen' | 'ultra_low' | 'constant_temp' | 'dry'

export type LocationStatus = 'enabled' | 'disabled'

export interface StorageLocation {
  id: string
  code: string
  name: string
  level: LocationLevel
  parentId: string | null
  temperatureZone: TemperatureZone
  isHazardous: boolean
  capacityLimit: number
  currentOccupancy: number
  status: LocationStatus
  description?: string
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface LocationFormData {
  code: string
  name: string
  level: LocationLevel
  parentId: string | null
  temperatureZone: TemperatureZone
  isHazardous: boolean
  capacityLimit: number
  status: LocationStatus
  description?: string
  sortOrder: number
}

export interface LocationTreeNode {
  id: string
  code: string
  name: string
  level: LocationLevel
  temperatureZone: TemperatureZone
  isHazardous: boolean
  capacityLimit: number
  currentOccupancy: number
  status: LocationStatus
  children: LocationTreeNode[]
}

export interface LocationOccupancyItem {
  id: string
  itemType: 'batch' | 'consumable'
  itemId: string
  itemName: string
  batchNumber?: string
  quantity: number
  unit: string
  storedAt: string
}

export interface LocationTransferData {
  sourceLocationId: string
  targetLocationId: string
  items: {
    itemType: 'batch' | 'consumable'
    itemId: string
    quantity: number
  }[]
  reason?: string
}

export interface LocationFilterParams {
  keyword?: string
  level?: LocationLevel | ''
  temperatureZone?: TemperatureZone | ''
  isHazardous?: boolean | ''
  status?: LocationStatus | ''
  parentId?: string
}

export interface LocationStats {
  total: number
  enabled: number
  disabled: number
  hazardous: number
  byLevel: Record<LocationLevel, number>
  occupancyRate: number
}

export interface LocationInventoryItem {
  id: string
  itemType: 'batch' | 'consumable'
  itemId: string
  itemName: string
  batchNumber?: string
  category?: string
  specification?: string
  quantity: number
  unit: string
  status?: string
  locationId: string
  locationCode: string
  locationName: string
  locationFullPath: string
  storedAt: string
}

export interface LocationDistributionItem {
  locationId: string
  locationCode: string
  locationName: string
  level: LocationLevel
  parentId: string | null
  temperatureZone: TemperatureZone
  isHazardous: boolean
  capacityLimit: number
  currentOccupancy: number
  batchCount: number
  consumableCount: number
  status: LocationStatus
}

export interface LocationDistributionStats {
  totalBatches: number
  totalConsumables: number
  totalItems: number
  byLevel: Record<LocationLevel, { count: number; batchCount: number; consumableCount: number }>
  byTemperatureZone: Record<TemperatureZone, { count: number; batchCount: number; consumableCount: number }>
  hazardousCount: number
  occupancyDistribution: { range: string; count: number }[]
}

export const locationLevelLabels: Record<LocationLevel, string> = {
  warehouse: '仓库',
  room: '房间',
  cabinet: '柜体',
  shelf: '层架',
  slot: '格位',
}

export const locationLevelColors: Record<LocationLevel, string> = {
  warehouse: 'bg-purple-100 text-purple-700',
  room: 'bg-blue-100 text-blue-700',
  cabinet: 'bg-indigo-100 text-indigo-700',
  shelf: 'bg-cyan-100 text-cyan-700',
  slot: 'bg-teal-100 text-teal-700',
}

export const temperatureZoneLabels: Record<TemperatureZone, string> = {
  ambient: '常温',
  refrigerated: '冷藏(2-8℃)',
  frozen: '冷冻(-20℃)',
  ultra_low: '超低温(-80℃)',
  constant_temp: '恒温',
  dry: '干燥',
}

export const temperatureZoneColors: Record<TemperatureZone, string> = {
  ambient: 'bg-amber-100 text-amber-700',
  refrigerated: 'bg-blue-100 text-blue-700',
  frozen: 'bg-cyan-100 text-cyan-700',
  ultra_low: 'bg-indigo-100 text-indigo-700',
  constant_temp: 'bg-green-100 text-green-700',
  dry: 'bg-orange-100 text-orange-700',
}

export const locationStatusLabels: Record<LocationStatus, string> = {
  enabled: '启用',
  disabled: '停用',
}

export const locationStatusColors: Record<LocationStatus, string> = {
  enabled: 'bg-success-100 text-success-700',
  disabled: 'bg-neutral-100 text-neutral-500',
}

export const locationLevelOptions: { value: LocationLevel; label: string }[] = [
  { value: 'warehouse', label: '仓库' },
  { value: 'room', label: '房间' },
  { value: 'cabinet', label: '柜体' },
  { value: 'shelf', label: '层架' },
  { value: 'slot', label: '格位' },
]

export const temperatureZoneOptions: { value: TemperatureZone; label: string }[] = [
  { value: 'ambient', label: '常温' },
  { value: 'refrigerated', label: '冷藏(2-8℃)' },
  { value: 'frozen', label: '冷冻(-20℃)' },
  { value: 'ultra_low', label: '超低温(-80℃)' },
  { value: 'constant_temp', label: '恒温' },
  { value: 'dry', label: '干燥' },
]
