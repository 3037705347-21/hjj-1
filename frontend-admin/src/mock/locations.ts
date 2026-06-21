import type {
  StorageLocation,
  LocationFormData,
  LocationTreeNode,
  LocationOccupancyItem,
  LocationTransferData,
  LocationFilterParams,
  LocationStats,
  LocationInventoryItem,
  LocationDistributionItem,
  LocationDistributionStats,
  LocationLevel,
  TemperatureZone,
} from '@/types/location'
import type { PageResult } from '@/types/common'
import { generateId } from '@/utils/date'
import { storage } from '@/utils/storage'
import type { User } from '@/types/user'
import { addAuditLog } from './audit'
import { getBatchesFromStorage, saveBatchesToStorage } from './batches'
import { getConsumablesFromStorage, saveConsumablesToStorage } from './consumables'

const STORAGE_KEY = 'mock_locations'

function getCurrentUser(): User | null {
  return storage.getUser<User>()
}

export function getLocationsFromStorage(): StorageLocation[] {
  const data = localStorage.getItem(STORAGE_KEY)
  if (data) {
    try {
      return JSON.parse(data)
    } catch {
      return []
    }
  }
  return initMockLocations()
}

export function saveLocationsToStorage(locations: StorageLocation[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(locations))
}

function initMockLocations(): StorageLocation[] {
  const now = new Date().toISOString()
  const locations: StorageLocation[] = [
    {
      id: 'loc_wh_01',
      code: 'WH-A',
      name: '主实验楼仓库',
      level: 'warehouse',
      parentId: null,
      temperatureZone: 'ambient',
      isHazardous: false,
      capacityLimit: 500,
      currentOccupancy: 0,
      status: 'enabled',
      description: '主实验楼一层仓库',
      sortOrder: 1,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'loc_wh_02',
      code: 'WH-B',
      name: '低温仓库',
      level: 'warehouse',
      parentId: null,
      temperatureZone: 'frozen',
      isHazardous: false,
      capacityLimit: 300,
      currentOccupancy: 0,
      status: 'enabled',
      description: '专用低温存储仓库',
      sortOrder: 2,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'loc_wh_03',
      code: 'WH-C',
      name: '危化品仓库',
      level: 'warehouse',
      parentId: null,
      temperatureZone: 'ambient',
      isHazardous: true,
      capacityLimit: 200,
      currentOccupancy: 0,
      status: 'enabled',
      description: '危险化学品专用仓库',
      sortOrder: 3,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'loc_rm_01',
      code: 'WH-A-R01',
      name: '常温存储室',
      level: 'room',
      parentId: 'loc_wh_01',
      temperatureZone: 'ambient',
      isHazardous: false,
      capacityLimit: 100,
      currentOccupancy: 0,
      status: 'enabled',
      sortOrder: 1,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'loc_rm_02',
      code: 'WH-A-R02',
      name: '冷藏室',
      level: 'room',
      parentId: 'loc_wh_01',
      temperatureZone: 'refrigerated',
      isHazardous: false,
      capacityLimit: 80,
      currentOccupancy: 0,
      status: 'enabled',
      sortOrder: 2,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'loc_rm_03',
      code: 'WH-B-R01',
      name: '冷冻室',
      level: 'room',
      parentId: 'loc_wh_02',
      temperatureZone: 'frozen',
      isHazardous: false,
      capacityLimit: 60,
      currentOccupancy: 0,
      status: 'enabled',
      sortOrder: 1,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'loc_rm_04',
      code: 'WH-B-R02',
      name: '超低温室',
      level: 'room',
      parentId: 'loc_wh_02',
      temperatureZone: 'ultra_low',
      isHazardous: false,
      capacityLimit: 40,
      currentOccupancy: 0,
      status: 'enabled',
      sortOrder: 2,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'loc_rm_05',
      code: 'WH-C-R01',
      name: '易燃品存储室',
      level: 'room',
      parentId: 'loc_wh_03',
      temperatureZone: 'ambient',
      isHazardous: true,
      capacityLimit: 50,
      currentOccupancy: 0,
      status: 'enabled',
      sortOrder: 1,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'loc_rm_06',
      code: 'WH-C-R02',
      name: '腐蚀品存储室',
      level: 'room',
      parentId: 'loc_wh_03',
      temperatureZone: 'ambient',
      isHazardous: true,
      capacityLimit: 50,
      currentOccupancy: 0,
      status: 'enabled',
      sortOrder: 2,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'loc_cb_01',
      code: 'WH-A-R01-C01',
      name: '试剂柜A-01',
      level: 'cabinet',
      parentId: 'loc_rm_01',
      temperatureZone: 'ambient',
      isHazardous: false,
      capacityLimit: 30,
      currentOccupancy: 0,
      status: 'enabled',
      sortOrder: 1,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'loc_cb_02',
      code: 'WH-A-R01-C02',
      name: '试剂柜A-02',
      level: 'cabinet',
      parentId: 'loc_rm_01',
      temperatureZone: 'ambient',
      isHazardous: false,
      capacityLimit: 30,
      currentOccupancy: 0,
      status: 'enabled',
      sortOrder: 2,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'loc_cb_03',
      code: 'WH-A-R01-C03',
      name: '耗材柜B-01',
      level: 'cabinet',
      parentId: 'loc_rm_01',
      temperatureZone: 'ambient',
      isHazardous: false,
      capacityLimit: 40,
      currentOccupancy: 0,
      status: 'enabled',
      sortOrder: 3,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'loc_cb_04',
      code: 'WH-A-R02-C01',
      name: '冷藏柜C-01',
      level: 'cabinet',
      parentId: 'loc_rm_02',
      temperatureZone: 'refrigerated',
      isHazardous: false,
      capacityLimit: 20,
      currentOccupancy: 0,
      status: 'enabled',
      sortOrder: 1,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'loc_cb_05',
      code: 'WH-B-R01-C01',
      name: '冷冻柜D-01',
      level: 'cabinet',
      parentId: 'loc_rm_03',
      temperatureZone: 'frozen',
      isHazardous: false,
      capacityLimit: 20,
      currentOccupancy: 0,
      status: 'enabled',
      sortOrder: 1,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'loc_cb_06',
      code: 'WH-B-R02-C01',
      name: '超低温柜E-01',
      level: 'cabinet',
      parentId: 'loc_rm_04',
      temperatureZone: 'ultra_low',
      isHazardous: false,
      capacityLimit: 15,
      currentOccupancy: 0,
      status: 'enabled',
      sortOrder: 1,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'loc_cb_07',
      code: 'WH-C-R01-C01',
      name: '防爆柜F-01',
      level: 'cabinet',
      parentId: 'loc_rm_05',
      temperatureZone: 'ambient',
      isHazardous: true,
      capacityLimit: 20,
      currentOccupancy: 0,
      status: 'enabled',
      sortOrder: 1,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'loc_sf_01',
      code: 'WH-A-R01-C01-S01',
      name: '第1层',
      level: 'shelf',
      parentId: 'loc_cb_01',
      temperatureZone: 'ambient',
      isHazardous: false,
      capacityLimit: 6,
      currentOccupancy: 0,
      status: 'enabled',
      sortOrder: 1,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'loc_sf_02',
      code: 'WH-A-R01-C01-S02',
      name: '第2层',
      level: 'shelf',
      parentId: 'loc_cb_01',
      temperatureZone: 'ambient',
      isHazardous: false,
      capacityLimit: 6,
      currentOccupancy: 0,
      status: 'enabled',
      sortOrder: 2,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'loc_sf_03',
      code: 'WH-A-R01-C01-S03',
      name: '第3层',
      level: 'shelf',
      parentId: 'loc_cb_01',
      temperatureZone: 'ambient',
      isHazardous: false,
      capacityLimit: 6,
      currentOccupancy: 0,
      status: 'enabled',
      sortOrder: 3,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'loc_sl_01',
      code: 'WH-A-R01-C01-S01-01',
      name: '1号格',
      level: 'slot',
      parentId: 'loc_sf_01',
      temperatureZone: 'ambient',
      isHazardous: false,
      capacityLimit: 1,
      currentOccupancy: 0,
      status: 'enabled',
      sortOrder: 1,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'loc_sl_02',
      code: 'WH-A-R01-C01-S01-02',
      name: '2号格',
      level: 'slot',
      parentId: 'loc_sf_01',
      temperatureZone: 'ambient',
      isHazardous: false,
      capacityLimit: 1,
      currentOccupancy: 0,
      status: 'enabled',
      sortOrder: 2,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'loc_sl_03',
      code: 'WH-A-R01-C01-S01-03',
      name: '3号格',
      level: 'slot',
      parentId: 'loc_sf_01',
      temperatureZone: 'ambient',
      isHazardous: false,
      capacityLimit: 1,
      currentOccupancy: 0,
      status: 'disabled',
      sortOrder: 3,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'loc_sf_04',
      code: 'WH-A-R01-C03-S01',
      name: '第1层',
      level: 'shelf',
      parentId: 'loc_cb_03',
      temperatureZone: 'ambient',
      isHazardous: false,
      capacityLimit: 8,
      currentOccupancy: 0,
      status: 'enabled',
      sortOrder: 1,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'loc_sf_05',
      code: 'WH-A-R01-C03-S02',
      name: '第2层',
      level: 'shelf',
      parentId: 'loc_cb_03',
      temperatureZone: 'ambient',
      isHazardous: false,
      capacityLimit: 8,
      currentOccupancy: 0,
      status: 'enabled',
      sortOrder: 2,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'loc_sf_06',
      code: 'WH-B-R01-C01-S01',
      name: '第1层',
      level: 'shelf',
      parentId: 'loc_cb_05',
      temperatureZone: 'frozen',
      isHazardous: false,
      capacityLimit: 5,
      currentOccupancy: 0,
      status: 'enabled',
      sortOrder: 1,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'loc_sf_07',
      code: 'WH-C-R01-C01-S01',
      name: '第1层',
      level: 'shelf',
      parentId: 'loc_cb_07',
      temperatureZone: 'ambient',
      isHazardous: true,
      capacityLimit: 5,
      currentOccupancy: 0,
      status: 'enabled',
      sortOrder: 1,
      createdAt: now,
      updatedAt: now,
    },
  ]

  recalculateOccupancy(locations)
  saveLocationsToStorage(locations)
  return locations
}

function recalculateOccupancy(locations: StorageLocation[]): void {
  const batches = getBatchesFromStorage()
  const consumables = getConsumablesFromStorage()
  const occupancyMap = new Map<string, number>()

  for (const loc of locations) {
    occupancyMap.set(loc.id, 0)
  }

  for (const batch of batches) {
    if (batch.status === 'exhausted') continue
    let matchedLoc: StorageLocation | null = null
    if (batch.locationId) {
      matchedLoc = locations.find(l => l.id === batch.locationId) || null
    }
    if (!matchedLoc && batch.storageLocation) {
      matchedLoc = findLocationByCodeOrName(locations, batch.storageLocation)
    }
    if (matchedLoc) {
      occupancyMap.set(matchedLoc.id, (occupancyMap.get(matchedLoc.id) || 0) + 1)
    }
  }

  for (const cons of consumables) {
    if (cons.stockQuantity <= 0) continue
    let matchedLoc: StorageLocation | null = null
    if (cons.locationId) {
      matchedLoc = locations.find(l => l.id === cons.locationId) || null
    }
    if (!matchedLoc && cons.location) {
      matchedLoc = findLocationByCodeOrName(locations, cons.location)
    }
    if (matchedLoc) {
      occupancyMap.set(matchedLoc.id, (occupancyMap.get(matchedLoc.id) || 0) + 1)
    }
  }

  for (const loc of locations) {
    loc.currentOccupancy = occupancyMap.get(loc.id) || 0
  }
}

function findLocationByCodeOrName(locations: StorageLocation[], text: string): StorageLocation | null {
  const t = text.toLowerCase().trim()
  return locations.find(l => l.code.toLowerCase() === t || l.name.toLowerCase() === t) || null
}

export function buildLocationTree(locations: StorageLocation[]): LocationTreeNode[] {
  const map = new Map<string, LocationTreeNode>()
  const roots: LocationTreeNode[] = []

  for (const loc of locations) {
    map.set(loc.id, {
      id: loc.id,
      code: loc.code,
      name: loc.name,
      level: loc.level,
      temperatureZone: loc.temperatureZone,
      isHazardous: loc.isHazardous,
      capacityLimit: loc.capacityLimit,
      currentOccupancy: loc.currentOccupancy,
      status: loc.status,
      children: [],
    })
  }

  const sorted = [...locations].sort((a, b) => a.sortOrder - b.sortOrder)
  for (const loc of sorted) {
    const node = map.get(loc.id)!
    if (loc.parentId && map.has(loc.parentId)) {
      map.get(loc.parentId)!.children.push(node)
    } else {
      roots.push(node)
    }
  }

  return roots
}

export function getLocationPath(locations: StorageLocation[], locationId: string): string {
  const parts: string[] = []
  let current = locations.find(l => l.id === locationId)
  while (current) {
    parts.unshift(current.name)
    current = current.parentId ? locations.find(l => l.id === current!.parentId) : undefined
  }
  return parts.join(' / ')
}

export async function mockGetLocations(
  page: number = 1,
  pageSize: number = 20,
  filters?: LocationFilterParams
): Promise<PageResult<StorageLocation>> {
  return new Promise((resolve) => {
    setTimeout(() => {
      let locations = getLocationsFromStorage()
      recalculateOccupancy(locations)
      saveLocationsToStorage(locations)

      if (filters) {
        const { keyword, level, temperatureZone, isHazardous, status, parentId } = filters

        if (keyword) {
          const kw = keyword.toLowerCase()
          locations = locations.filter(l =>
            l.name.toLowerCase().includes(kw) ||
            l.code.toLowerCase().includes(kw) ||
            (l.description && l.description.toLowerCase().includes(kw))
          )
        }

        if (level) {
          locations = locations.filter(l => l.level === level)
        }

        if (temperatureZone) {
          locations = locations.filter(l => l.temperatureZone === temperatureZone)
        }

        if (isHazardous !== '' && isHazardous !== undefined) {
          locations = locations.filter(l => l.isHazardous === isHazardous)
        }

        if (status) {
          locations = locations.filter(l => l.status === status)
        }

        if (parentId) {
          locations = locations.filter(l => l.parentId === parentId)
        }
      }

      locations.sort((a, b) => {
        const levelOrder: Record<string, number> = { warehouse: 0, room: 1, cabinet: 2, shelf: 3, slot: 4 }
        const diff = (levelOrder[a.level] || 0) - (levelOrder[b.level] || 0)
        if (diff !== 0) return diff
        return a.sortOrder - b.sortOrder
      })

      const start = (page - 1) * pageSize
      const list = locations.slice(start, start + pageSize)

      resolve({ list, total: locations.length, page, pageSize })
    }, 300)
  })
}

export async function mockGetAllLocations(): Promise<StorageLocation[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const locations = getLocationsFromStorage()
      recalculateOccupancy(locations)
      saveLocationsToStorage(locations)
      resolve(locations)
    }, 200)
  })
}

export async function mockGetLocation(id: string): Promise<StorageLocation | null> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const locations = getLocationsFromStorage()
      recalculateOccupancy(locations)
      saveLocationsToStorage(locations)
      resolve(locations.find(l => l.id === id) || null)
    }, 200)
  })
}

export async function mockCreateLocation(data: LocationFormData): Promise<StorageLocation> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const locations = getLocationsFromStorage()
      const now = new Date().toISOString()

      const newLocation: StorageLocation = {
        id: generateId(),
        code: data.code,
        name: data.name,
        level: data.level,
        parentId: data.parentId,
        temperatureZone: data.temperatureZone,
        isHazardous: data.isHazardous,
        capacityLimit: data.capacityLimit,
        currentOccupancy: 0,
        status: data.status,
        description: data.description,
        sortOrder: data.sortOrder,
        createdAt: now,
        updatedAt: now,
      }

      locations.push(newLocation)
      saveLocationsToStorage(locations)

      addAuditLog({
        module: 'location',
        operationType: 'create',
        targetType: 'location',
        targetId: newLocation.id,
        targetName: newLocation.name,
        afterContent: `编码: ${newLocation.code}, 层级: ${newLocation.level}`,
        remark: '新增库位',
      })

      resolve(newLocation)
    }, 400)
  })
}

export async function mockUpdateLocation(id: string, data: LocationFormData): Promise<StorageLocation> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const locations = getLocationsFromStorage()
      const index = locations.findIndex(l => l.id === id)

      if (index === -1) {
        reject(new Error('库位不存在'))
        return
      }

      const before = { ...locations[index] }
      const now = new Date().toISOString()

      locations[index] = {
        ...locations[index],
        code: data.code,
        name: data.name,
        level: data.level,
        parentId: data.parentId,
        temperatureZone: data.temperatureZone,
        isHazardous: data.isHazardous,
        capacityLimit: data.capacityLimit,
        status: data.status,
        description: data.description,
        sortOrder: data.sortOrder,
        updatedAt: now,
      }

      saveLocationsToStorage(locations)

      addAuditLog({
        module: 'location',
        operationType: 'update',
        targetType: 'location',
        targetId: id,
        targetName: locations[index].name,
        beforeContent: `编码: ${before.code}, 状态: ${before.status}`,
        afterContent: `编码: ${data.code}, 状态: ${data.status}`,
        remark: '编辑库位',
      })

      resolve(locations[index])
    }, 400)
  })
}

export async function mockDeleteLocation(id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const locations = getLocationsFromStorage()
      const loc = locations.find(l => l.id === id)

      if (!loc) {
        reject(new Error('库位不存在'))
        return
      }

      const hasChildren = locations.some(l => l.parentId === id)
      if (hasChildren) {
        reject(new Error('该库位下存在子库位，无法删除'))
        return
      }

      if (loc.currentOccupancy > 0) {
        reject(new Error('该库位下存在库存，无法删除'))
        return
      }

      const filtered = locations.filter(l => l.id !== id)
      saveLocationsToStorage(filtered)

      addAuditLog({
        module: 'location',
        operationType: 'delete',
        targetType: 'location',
        targetId: id,
        targetName: loc.name,
        remark: '删除库位',
      })

      resolve()
    }, 300)
  })
}

export async function mockGetLocationOccupancy(locationId: string): Promise<LocationOccupancyItem[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const locations = getLocationsFromStorage()
      const targetLoc = locations.find(l => l.id === locationId)
      if (!targetLoc) {
        resolve([])
        return
      }

      const descendantIds = new Set<string>()
      const collectDescendants = (parentId: string) => {
        descendantIds.add(parentId)
        for (const loc of locations) {
          if (loc.parentId === parentId) {
            collectDescendants(loc.id)
          }
        }
      }
      collectDescendants(locationId)

      const results: LocationOccupancyItem[] = []
      const batches = getBatchesFromStorage()
      const consumables = getConsumablesFromStorage()

      for (const batch of batches) {
        if (batch.status === 'exhausted') continue
        let matched = false
        if (batch.locationId) {
          matched = descendantIds.has(batch.locationId)
        }
        if (!matched && batch.storageLocation) {
          const loc = findLocationByCodeOrName(locations, batch.storageLocation)
          matched = loc ? descendantIds.has(loc.id) : false
        }
        if (matched) {
          results.push({
            id: batch.id,
            itemType: 'batch',
            itemId: batch.id,
            itemName: batch.reagentName || '',
            batchNumber: batch.batchNumber,
            quantity: batch.remainingQuantity,
            unit: batch.unit || '',
            storedAt: batch.receivedDate,
          })
        }
      }

      for (const cons of consumables) {
        if (cons.stockQuantity <= 0) continue
        let matched = false
        if (cons.locationId) {
          matched = descendantIds.has(cons.locationId)
        }
        if (!matched && cons.location) {
          const loc = findLocationByCodeOrName(locations, cons.location)
          matched = loc ? descendantIds.has(loc.id) : false
        }
        if (matched) {
          results.push({
            id: cons.id,
            itemType: 'consumable',
            itemId: cons.id,
            itemName: cons.name,
            quantity: cons.stockQuantity,
            unit: cons.unit,
            storedAt: cons.createdAt,
          })
        }
      }

      resolve(results)
    }, 300)
  })
}

export async function mockLocationTransfer(data: LocationTransferData): Promise<void> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const locations = getLocationsFromStorage()
      const sourceLoc = locations.find(l => l.id === data.sourceLocationId)
      const targetLoc = locations.find(l => l.id === data.targetLocationId)

      if (!sourceLoc) {
        reject(new Error('源库位不存在'))
        return
      }
      if (!targetLoc) {
        reject(new Error('目标库位不存在'))
        return
      }
      if (targetLoc.status === 'disabled') {
        reject(new Error('目标库位已停用'))
        return
      }

      const batches = getBatchesFromStorage()
      const consumables = getConsumablesFromStorage()
      const user = getCurrentUser()

      for (const item of data.items) {
        if (item.itemType === 'batch') {
          const batch = batches.find(b => b.id === item.itemId)
          if (batch) {
            batch.storageLocation = targetLoc.code
            batch.locationId = targetLoc.id
          }
        } else {
          const cons = consumables.find(c => c.id === item.itemId)
          if (cons) {
            cons.location = targetLoc.name
            cons.locationId = targetLoc.id
          }
        }
      }

      saveBatchesToStorage(batches)
      saveConsumablesToStorage(consumables)

      recalculateOccupancy(locations)
      saveLocationsToStorage(locations)

      addAuditLog({
        module: 'location',
        operationType: 'location_transfer',
        targetType: 'location',
        targetId: data.targetLocationId,
        targetName: targetLoc.name,
        beforeContent: `源库位: ${sourceLoc.name}`,
        afterContent: `目标库位: ${targetLoc.name}, 物品数: ${data.items.length}`,
        remark: data.reason || '库位调拨',
      })

      resolve()
    }, 400)
  })
}

export async function mockGetLocationStats(): Promise<LocationStats> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const locations = getLocationsFromStorage()
      recalculateOccupancy(locations)
      saveLocationsToStorage(locations)

      const stats: LocationStats = {
        total: locations.length,
        enabled: locations.filter(l => l.status === 'enabled').length,
        disabled: locations.filter(l => l.status === 'disabled').length,
        hazardous: locations.filter(l => l.isHazardous).length,
        byLevel: {
          warehouse: locations.filter(l => l.level === 'warehouse').length,
          room: locations.filter(l => l.level === 'room').length,
          cabinet: locations.filter(l => l.level === 'cabinet').length,
          shelf: locations.filter(l => l.level === 'shelf').length,
          slot: locations.filter(l => l.level === 'slot').length,
        },
        occupancyRate: locations.length > 0
          ? Math.round(
              (locations.filter(l => l.currentOccupancy > 0).length / locations.length) * 100
            )
          : 0,
      }

      resolve(stats)
    }, 200)
  })
}

export async function mockBatchDeleteLocations(ids: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const locations = getLocationsFromStorage()

      for (const id of ids) {
        const loc = locations.find(l => l.id === id)
        if (!loc) continue

        const hasChildren = locations.some(l => l.parentId === id && !ids.includes(l.id))
        if (hasChildren) {
          reject(new Error(`库位「${loc.name}」下存在子库位，无法删除`))
          return
        }

        if (loc.currentOccupancy > 0) {
          reject(new Error(`库位「${loc.name}」下存在库存，无法删除`))
          return
        }
      }

      const filtered = locations.filter(l => !ids.includes(l.id))
      saveLocationsToStorage(filtered)

      addAuditLog({
        module: 'location',
        operationType: 'batch_delete',
        targetType: 'location',
        targetId: ids.join(','),
        targetName: `批量删除${ids.length}个库位`,
        remark: '批量删除库位',
      })

      resolve()
    }, 300)
  })
}

export async function mockBatchUpdateLocationStatus(ids: string[], status: 'enabled' | 'disabled'): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const locations = getLocationsFromStorage()
      const now = new Date().toISOString()

      const updated = locations.map(l => {
        if (ids.includes(l.id)) {
          return { ...l, status, updatedAt: now }
        }
        return l
      })

      saveLocationsToStorage(updated)

      addAuditLog({
        module: 'location',
        operationType: 'batch_update',
        targetType: 'location',
        targetId: ids.join(','),
        targetName: `批量${status === 'enabled' ? '启用' : '停用'}库位`,
        afterContent: `状态: ${status === 'enabled' ? '启用' : '停用'}`,
        remark: `批量${status === 'enabled' ? '启用' : '停用'}${ids.length}个库位`,
      })

      resolve()
    }, 300)
  })
}

export function getLocationDescendants(locations: StorageLocation[], locationId: string): StorageLocation[] {
  const result: StorageLocation[] = []
  const collect = (parentId: string) => {
    for (const loc of locations) {
      if (loc.parentId === parentId) {
        result.push(loc)
        collect(loc.id)
      }
    }
  }
  collect(locationId)
  return result
}

export function getLocationAncestors(locations: StorageLocation[], locationId: string): StorageLocation[] {
  const result: StorageLocation[] = []
  let current = locations.find(l => l.id === locationId)
  while (current?.parentId) {
    const parent = locations.find(l => l.id === current!.parentId)
    if (parent) {
      result.unshift(parent)
      current = parent
    } else {
      break
    }
  }
  return result
}

export async function mockGetLocationInventory(
  locationId?: string,
  itemType?: 'batch' | 'consumable' | ''
): Promise<LocationInventoryItem[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const locations = getLocationsFromStorage()
      recalculateOccupancy(locations)
      saveLocationsToStorage(locations)
      const batches = getBatchesFromStorage()
      const consumables = getConsumablesFromStorage()

      let targetLocationIds: Set<string> | null = null
      if (locationId) {
        targetLocationIds = new Set<string>()
        targetLocationIds.add(locationId)
        const descendants = getLocationDescendants(locations, locationId)
        for (const d of descendants) {
          targetLocationIds.add(d.id)
        }
      }

      const results: LocationInventoryItem[] = []

      if (!itemType || itemType === 'batch') {
        for (const batch of batches) {
          if (batch.status === 'exhausted') continue
          let locId = batch.locationId
          let loc = locId ? locations.find(l => l.id === locId) : null
          if (!loc && batch.storageLocation) {
            loc = findLocationByCodeOrName(locations, batch.storageLocation)
            if (loc) locId = loc.id
          }
          if (!loc) continue
          if (targetLocationIds && !targetLocationIds.has(loc.id)) continue

          results.push({
            id: `inv_batch_${batch.id}`,
            itemType: 'batch',
            itemId: batch.id,
            itemName: batch.reagentName || '',
            batchNumber: batch.batchNumber,
            quantity: batch.remainingQuantity,
            unit: batch.unit || '',
            status: batch.status,
            locationId: loc.id,
            locationCode: loc.code,
            locationName: loc.name,
            locationFullPath: getLocationPath(locations, loc.id),
            storedAt: batch.receivedDate,
          })
        }
      }

      if (!itemType || itemType === 'consumable') {
        for (const cons of consumables) {
          if (cons.stockQuantity <= 0) continue
          let locId = cons.locationId
          let loc = locId ? locations.find(l => l.id === locId) : null
          if (!loc && cons.location) {
            loc = findLocationByCodeOrName(locations, cons.location)
            if (loc) locId = loc.id
          }
          if (!loc) continue
          if (targetLocationIds && !targetLocationIds.has(loc.id)) continue

          results.push({
            id: `inv_cons_${cons.id}`,
            itemType: 'consumable',
            itemId: cons.id,
            itemName: cons.name,
            category: cons.category,
            specification: cons.specification,
            quantity: cons.stockQuantity,
            unit: cons.unit,
            locationId: loc.id,
            locationCode: loc.code,
            locationName: loc.name,
            locationFullPath: getLocationPath(locations, loc.id),
            storedAt: cons.createdAt,
          })
        }
      }

      resolve(results)
    }, 300)
  })
}

export async function mockGetLocationDistribution(): Promise<LocationDistributionItem[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const locations = getLocationsFromStorage()
      recalculateOccupancy(locations)
      saveLocationsToStorage(locations)
      const batches = getBatchesFromStorage()
      const consumables = getConsumablesFromStorage()

      const batchCountMap = new Map<string, number>()
      const consumableCountMap = new Map<string, number>()

      for (const batch of batches) {
        if (batch.status === 'exhausted') continue
        let locId = batch.locationId
        if (!locId && batch.storageLocation) {
          const loc = findLocationByCodeOrName(locations, batch.storageLocation)
          if (loc) locId = loc.id
        }
        if (locId) {
          batchCountMap.set(locId, (batchCountMap.get(locId) || 0) + 1)
        }
      }

      for (const cons of consumables) {
        if (cons.stockQuantity <= 0) continue
        let locId = cons.locationId
        if (!locId && cons.location) {
          const loc = findLocationByCodeOrName(locations, cons.location)
          if (loc) locId = loc.id
        }
        if (locId) {
          consumableCountMap.set(locId, (consumableCountMap.get(locId) || 0) + 1)
        }
      }

      const distribution: LocationDistributionItem[] = locations.map(loc => ({
        locationId: loc.id,
        locationCode: loc.code,
        locationName: loc.name,
        level: loc.level,
        parentId: loc.parentId,
        temperatureZone: loc.temperatureZone,
        isHazardous: loc.isHazardous,
        capacityLimit: loc.capacityLimit,
        currentOccupancy: loc.currentOccupancy,
        batchCount: batchCountMap.get(loc.id) || 0,
        consumableCount: consumableCountMap.get(loc.id) || 0,
        status: loc.status,
      }))

      resolve(distribution)
    }, 300)
  })
}

export async function mockGetLocationDistributionStats(): Promise<LocationDistributionStats> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const locations = getLocationsFromStorage()
      recalculateOccupancy(locations)
      saveLocationsToStorage(locations)
      const batches = getBatchesFromStorage()
      const consumables = getConsumablesFromStorage()

      let totalBatches = 0
      let totalConsumables = 0
      const batchLocSet = new Set<string>()
      const consLocSet = new Set<string>()

      for (const batch of batches) {
        if (batch.status === 'exhausted') continue
        totalBatches++
        let locId = batch.locationId
        if (!locId && batch.storageLocation) {
          const loc = findLocationByCodeOrName(locations, batch.storageLocation)
          if (loc) locId = loc.id
        }
        if (locId) batchLocSet.add(locId)
      }

      for (const cons of consumables) {
        if (cons.stockQuantity <= 0) continue
        totalConsumables++
        let locId = cons.locationId
        if (!locId && cons.location) {
          const loc = findLocationByCodeOrName(locations, cons.location)
          if (loc) locId = loc.id
        }
        if (locId) consLocSet.add(locId)
      }

      const levels: LocationLevel[] = ['warehouse', 'room', 'cabinet', 'shelf', 'slot']
      const byLevel = {} as Record<LocationLevel, { count: number; batchCount: number; consumableCount: number }>
      for (const level of levels) {
        const levelLocs = locations.filter(l => l.level === level)
        const levelLocIds = new Set(levelLocs.map(l => l.id))
        byLevel[level] = {
          count: levelLocs.length,
          batchCount: [...batchLocSet].filter(id => levelLocIds.has(id)).length,
          consumableCount: [...consLocSet].filter(id => levelLocIds.has(id)).length,
        }
      }

      const zones: TemperatureZone[] = ['ambient', 'refrigerated', 'frozen', 'ultra_low', 'constant_temp', 'dry']
      const byTemperatureZone = {} as Record<TemperatureZone, { count: number; batchCount: number; consumableCount: number }>
      for (const zone of zones) {
        const zoneLocs = locations.filter(l => l.temperatureZone === zone)
        const zoneLocIds = new Set(zoneLocs.map(l => l.id))
        byTemperatureZone[zone] = {
          count: zoneLocs.length,
          batchCount: [...batchLocSet].filter(id => zoneLocIds.has(id)).length,
          consumableCount: [...consLocSet].filter(id => zoneLocIds.has(id)).length,
        }
      }

      const occupancyRanges = [
        { range: '0%', min: 0, max: 0 },
        { range: '1-30%', min: 1, max: 30 },
        { range: '31-60%', min: 31, max: 60 },
        { range: '61-90%', min: 61, max: 90 },
        { range: '91-100%', min: 91, max: 100 },
      ]
      const occupancyDistribution = occupancyRanges.map(({ range, min, max }) => {
        const count = locations.filter(l => {
          if (l.capacityLimit <= 0) return min === 0 && l.currentOccupancy === 0
          const rate = Math.round((l.currentOccupancy / l.capacityLimit) * 100)
          return rate >= min && rate <= max
        }).length
        return { range, count }
      })

      resolve({
        totalBatches,
        totalConsumables,
        totalItems: totalBatches + totalConsumables,
        byLevel,
        byTemperatureZone,
        hazardousCount: locations.filter(l => l.isHazardous).length,
        occupancyDistribution,
      })
    }, 300)
  })
}
