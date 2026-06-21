import type {
  StockTake,
  StockTakeItem,
  StockTakeFormData,
  StockTakeItemUpdateData,
  StockTakeConfirmData,
  StockAdjustmentRecord,
  StockTakeFilterParams,
  StockTakeStats,
  DifferenceResult,
} from '@/types/stocktake'
import type { PageResult } from '@/types/common'
import { generateId } from '@/utils/date'
import { storage } from '@/utils/storage'
import type { User } from '@/types/user'
import { addAuditLog } from './audit'
import { getBatchesFromStorage, saveBatchesToStorage, getOperationsFromStorage as getBatchOperationsFromStorage, saveOperationsToStorage as saveBatchOperationsToStorage } from './batches'
import { mockGetAllReagents } from './reagents'
import { getConsumablesFromStorage, saveConsumablesToStorage, getOperationsFromStorage as getConsumableOperationsFromStorage, saveOperationsToStorage as saveConsumableOperationsToStorage } from './consumables'

const STOCKTAKE_STORAGE_KEY = 'mock_stocktakes'
const ADJUSTMENT_STORAGE_KEY = 'mock_stock_adjustments'

function getCurrentUser(): User | null {
  return storage.getUser<User>()
}

export function getStockTakesFromStorage(): StockTake[] {
  const data = localStorage.getItem(STOCKTAKE_STORAGE_KEY)
  if (data) {
    try {
      return JSON.parse(data)
    } catch {
      return []
    }
  }
  return initMockStockTakes()
}

export function saveStockTakesToStorage(stocktakes: StockTake[]): void {
  localStorage.setItem(STOCKTAKE_STORAGE_KEY, JSON.stringify(stocktakes))
}

export function getAdjustmentsFromStorage(): StockAdjustmentRecord[] {
  const data = localStorage.getItem(ADJUSTMENT_STORAGE_KEY)
  if (data) {
    try {
      return JSON.parse(data)
    } catch {
      return []
    }
  }
  return []
}

export function saveAdjustmentsToStorage(adjustments: StockAdjustmentRecord[]): void {
  localStorage.setItem(ADJUSTMENT_STORAGE_KEY, JSON.stringify(adjustments))
}

function generateStockTakeNo(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `PD${year}${month}${day}${random}`
}

function initMockStockTakes(): StockTake[] {
  const stocktakes: StockTake[] = []
  const now = new Date()
  const today = now.toISOString().split('T')[0]

  stocktakes.push({
    id: generateId(),
    stockTakeNo: generateStockTakeNo(),
    title: 'A区库位月度盘点',
    dimension: 'location',
    dimensionValue: 'A-01',
    dimensionValueLabel: 'A区-01货架',
    itemType: 'reagent',
    status: 'completed',
    totalItems: 5,
    checkedItems: 5,
    surplusCount: 1,
    deficitCount: 1,
    noDiffCount: 3,
    assigneeId: '3',
    assigneeName: '王实验员',
    creatorId: '2',
    creatorName: '李主任',
    startTime: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    confirmTime: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    confirmedBy: '2',
    confirmedByName: '李主任',
    confirmRemark: '差异已处理，库存已调整',
    remark: '月度常规盘点',
    items: [],
    createdAt: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  })

  stocktakes.push({
    id: generateId(),
    stockTakeNo: generateStockTakeNo(),
    title: '离心管分类盘点',
    dimension: 'category',
    dimensionValue: '离心管',
    dimensionValueLabel: '离心管',
    itemType: 'consumable',
    status: 'to_confirm',
    totalItems: 3,
    checkedItems: 3,
    surplusCount: 0,
    deficitCount: 1,
    noDiffCount: 2,
    assigneeId: '3',
    assigneeName: '王实验员',
    creatorId: '2',
    creatorName: '李主任',
    startTime: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    remark: '耗材分类盘点',
    items: [],
    createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  })

  stocktakes.push({
    id: generateId(),
    stockTakeNo: generateStockTakeNo(),
    title: 'B区库位盘点',
    dimension: 'location',
    dimensionValue: 'B-02',
    dimensionValueLabel: 'B区-02货架',
    itemType: 'all',
    status: 'in_progress',
    totalItems: 8,
    checkedItems: 3,
    surplusCount: 0,
    deficitCount: 0,
    noDiffCount: 0,
    assigneeId: '3',
    assigneeName: '王实验员',
    creatorId: '2',
    creatorName: '李主任',
    startTime: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    remark: '季度盘点',
    items: [],
    createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  })

  stocktakes.push({
    id: generateId(),
    stockTakeNo: generateStockTakeNo(),
    title: '下半月盘点计划',
    dimension: 'location',
    dimensionValue: 'C-01',
    dimensionValueLabel: 'C区-01货架',
    itemType: 'reagent',
    status: 'pending',
    totalItems: 0,
    checkedItems: 0,
    surplusCount: 0,
    deficitCount: 0,
    noDiffCount: 0,
    assigneeId: '3',
    assigneeName: '王实验员',
    creatorId: '2',
    creatorName: '李主任',
    remark: '待开始盘点',
    items: [],
    createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  })

  saveStockTakesToStorage(stocktakes)
  return stocktakes
}

async function generateStockTakeItems(
  dimension: string,
  dimensionValue: string | undefined,
  itemType: string
): Promise<StockTakeItem[]> {
  const items: StockTakeItem[] = []
  const batches = getBatchesFromStorage()
  const consumables = getConsumablesFromStorage()
  const reagents = await mockGetAllReagents()
  const reagentMap = new Map(reagents.map(r => [r.id, r]))

  if (itemType === 'reagent' || itemType === 'all') {
    let filteredBatches = [...batches]

    if (dimension === 'location' && dimensionValue) {
      filteredBatches = filteredBatches.filter(b => b.storageLocation.startsWith(dimensionValue))
    } else if (dimension === 'category' && dimensionValue) {
      filteredBatches = filteredBatches.filter(b => {
        const reagent = reagentMap.get(b.reagentId)
        return reagent?.category === dimensionValue
      })
    } else if (dimension === 'reagent' && dimensionValue) {
      filteredBatches = filteredBatches.filter(b => b.reagentId === dimensionValue)
    } else if (dimension === 'batch' && dimensionValue) {
      filteredBatches = filteredBatches.filter(b => b.id === dimensionValue || b.batchNumber === dimensionValue)
    }

    filteredBatches.forEach(batch => {
      const reagent = reagentMap.get(batch.reagentId)
      items.push({
        id: generateId(),
        stockTakeId: '',
        itemType: 'reagent',
        itemId: batch.id,
        itemName: batch.reagentName || reagent?.name || '未知试剂',
        category: reagent?.category,
        specification: reagent?.specification,
        batchNumber: batch.batchNumber,
        storageLocation: batch.storageLocation,
        unit: batch.unit || reagent?.unit || '',
        bookQuantity: batch.remainingQuantity,
        actualQuantity: null,
        difference: 0,
        differenceResult: null,
        remark: '',
      })
    })
  }

  if (itemType === 'consumable' || itemType === 'all') {
    let filteredConsumables = [...consumables]

    if (dimension === 'location' && dimensionValue) {
      filteredConsumables = filteredConsumables.filter(c => c.location?.startsWith(dimensionValue))
    } else if (dimension === 'category' && dimensionValue) {
      filteredConsumables = filteredConsumables.filter(c => c.category === dimensionValue)
    } else if (dimension === 'consumable' && dimensionValue) {
      filteredConsumables = filteredConsumables.filter(c => c.id === dimensionValue)
    }

    filteredConsumables.forEach(consumable => {
      items.push({
        id: generateId(),
        stockTakeId: '',
        itemType: 'consumable',
        itemId: consumable.id,
        itemName: consumable.name,
        category: consumable.category,
        specification: consumable.specification,
        storageLocation: consumable.location || '',
        unit: consumable.unit,
        bookQuantity: consumable.stockQuantity,
        actualQuantity: null,
        difference: 0,
        differenceResult: null,
        remark: '',
      })
    })
  }

  return items
}

function calculateItemDifference(item: StockTakeItem): StockTakeItem {
  if (item.actualQuantity === null) {
    return { ...item, difference: 0, differenceResult: null }
  }

  const diff = item.actualQuantity - item.bookQuantity
  let result: DifferenceResult | null = null

  if (diff > 0) {
    result = 'surplus'
  } else if (diff < 0) {
    result = 'deficit'
  } else {
    result = 'no_diff'
  }

  return { ...item, difference: diff, differenceResult: result }
}

function updateStockTakeStats(stocktake: StockTake): StockTake {
  const items = stocktake.items
  const checkedItems = items.filter(item => item.actualQuantity !== null).length
  const surplusCount = items.filter(item => item.differenceResult === 'surplus').length
  const deficitCount = items.filter(item => item.differenceResult === 'deficit').length
  const noDiffCount = items.filter(item => item.differenceResult === 'no_diff').length

  let status = stocktake.status
  if (status === 'in_progress' && checkedItems === items.length && items.length > 0) {
    status = 'to_confirm'
  }

  return {
    ...stocktake,
    totalItems: items.length,
    checkedItems,
    surplusCount,
    deficitCount,
    noDiffCount,
    status,
    updatedAt: new Date().toISOString(),
  }
}

export async function mockGetStockTakes(
  page: number = 1,
  pageSize: number = 10,
  filters?: StockTakeFilterParams
): Promise<PageResult<StockTake>> {
  return new Promise((resolve) => {
    setTimeout(() => {
      let stocktakes = getStockTakesFromStorage()

      if (filters) {
        const { keyword, status, dimension, itemType, assigneeId, creatorId, startTime, endTime } = filters

        if (keyword) {
          const kw = keyword.toLowerCase()
          stocktakes = stocktakes.filter(s =>
            s.stockTakeNo.toLowerCase().includes(kw) ||
            s.title.toLowerCase().includes(kw) ||
            s.creatorName.toLowerCase().includes(kw) ||
            (s.assigneeName && s.assigneeName.toLowerCase().includes(kw))
          )
        }

        if (status) {
          stocktakes = stocktakes.filter(s => s.status === status)
        }

        if (dimension) {
          stocktakes = stocktakes.filter(s => s.dimension === dimension)
        }

        if (itemType && itemType !== 'all') {
          stocktakes = stocktakes.filter(s => s.itemType === itemType)
        }

        if (assigneeId) {
          stocktakes = stocktakes.filter(s => s.assigneeId === assigneeId)
        }

        if (creatorId) {
          stocktakes = stocktakes.filter(s => s.creatorId === creatorId)
        }

        if (startTime) {
          const start = new Date(startTime).getTime()
          stocktakes = stocktakes.filter(s => new Date(s.createdAt).getTime() >= start)
        }

        if (endTime) {
          const end = new Date(endTime).getTime() + 24 * 60 * 60 * 1000
          stocktakes = stocktakes.filter(s => new Date(s.createdAt).getTime() < end)
        }
      }

      stocktakes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

      const start = (page - 1) * pageSize
      const list = stocktakes.slice(start, start + pageSize).map(s => ({
        ...s,
        items: [],
      }))

      resolve({
        list,
        total: stocktakes.length,
        page,
        pageSize,
      })
    }, 300)
  })
}

export async function mockGetStockTake(id: string): Promise<StockTake | null> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const stocktakes = getStockTakesFromStorage()
      const stocktake = stocktakes.find(s => s.id === id)

      if (!stocktake) {
        resolve(null)
        return
      }

      resolve({ ...stocktake })
    }, 300)
  })
}

export async function mockCreateStockTake(data: StockTakeFormData): Promise<StockTake> {
  return new Promise(async (resolve, reject) => {
    try {
      const stocktakes = getStockTakesFromStorage()
      const user = getCurrentUser()

      if (!data.title.trim()) {
        reject(new Error('请输入盘点标题'))
        return
      }

      if (!data.dimension) {
        reject(new Error('请选择盘点维度'))
        return
      }

      if (data.dimension !== 'location' || data.dimensionValue) {
        if (!data.dimensionValue?.trim()) {
          reject(new Error('请输入盘点维度值'))
          return
        }
      }

      const items = await generateStockTakeItems(data.dimension, data.dimensionValue, data.itemType)

      if (items.length === 0) {
        reject(new Error('未找到符合条件的盘点项'))
        return
      }

      let dimensionValueLabel = data.dimensionValue
      if (data.dimension === 'reagent' && data.dimensionValue) {
        const reagents = await mockGetAllReagents()
        const reagent = reagents.find(r => r.id === data.dimensionValue)
        dimensionValueLabel = reagent?.name || data.dimensionValue
      } else if (data.dimension === 'consumable' && data.dimensionValue) {
        const consumables = getConsumablesFromStorage()
        const consumable = consumables.find(c => c.id === data.dimensionValue)
        dimensionValueLabel = consumable?.name || data.dimensionValue
      } else if (data.dimension === 'batch' && data.dimensionValue) {
        const batches = getBatchesFromStorage()
        const batch = batches.find(b => b.id === data.dimensionValue || b.batchNumber === data.dimensionValue)
        dimensionValueLabel = batch?.batchNumber || data.dimensionValue
      }

      const newStockTake: StockTake = {
        id: generateId(),
        stockTakeNo: generateStockTakeNo(),
        title: data.title,
        dimension: data.dimension,
        dimensionValue: data.dimensionValue,
        dimensionValueLabel,
        itemType: data.itemType,
        status: 'pending',
        totalItems: items.length,
        checkedItems: 0,
        surplusCount: 0,
        deficitCount: 0,
        noDiffCount: 0,
        assigneeId: data.assigneeId,
        assigneeName: data.assigneeName,
        creatorId: user?.id || '2',
        creatorName: user?.name || '李主任',
        remark: data.remark,
        items: items.map(item => ({ ...item, stockTakeId: '' })),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      newStockTake.items = items.map(item => ({ ...item, stockTakeId: newStockTake.id }))

      stocktakes.unshift(newStockTake)
      saveStockTakesToStorage(stocktakes)

      addAuditLog({
        module: 'stocktake',
        operationType: 'stocktake_create',
        targetType: 'stocktake',
        targetId: newStockTake.id,
        targetName: newStockTake.title,
        afterContent: `盘点单号: ${newStockTake.stockTakeNo}, 盘点项: ${newStockTake.totalItems}项`,
        remark: '创建盘点任务',
      })

      resolve(newStockTake)
    } catch (e: any) {
      reject(e)
    }
  })
}

export async function mockUpdateStockTake(id: string, data: StockTakeFormData): Promise<StockTake> {
  return new Promise(async (resolve, reject) => {
    try {
      const stocktakes = getStockTakesFromStorage()
      const index = stocktakes.findIndex(s => s.id === id)

      if (index === -1) {
        reject(new Error('盘点任务不存在'))
        return
      }

      const stocktake = stocktakes[index]

      if (stocktake.status !== 'pending') {
        reject(new Error('只能编辑待开始状态的盘点任务'))
        return
      }

      if (!data.title.trim()) {
        reject(new Error('请输入盘点标题'))
        return
      }

      const items = await generateStockTakeItems(data.dimension, data.dimensionValue, data.itemType)

      if (items.length === 0) {
        reject(new Error('未找到符合条件的盘点项'))
        return
      }

      let dimensionValueLabel = data.dimensionValue
      if (data.dimension === 'reagent' && data.dimensionValue) {
        const reagents = await mockGetAllReagents()
        const reagent = reagents.find(r => r.id === data.dimensionValue)
        dimensionValueLabel = reagent?.name || data.dimensionValue
      } else if (data.dimension === 'consumable' && data.dimensionValue) {
        const consumables = getConsumablesFromStorage()
        const consumable = consumables.find(c => c.id === data.dimensionValue)
        dimensionValueLabel = consumable?.name || data.dimensionValue
      } else if (data.dimension === 'batch' && data.dimensionValue) {
        const batches = getBatchesFromStorage()
        const batch = batches.find(b => b.id === data.dimensionValue || b.batchNumber === data.dimensionValue)
        dimensionValueLabel = batch?.batchNumber || data.dimensionValue
      }

      stocktakes[index] = {
        ...stocktake,
        title: data.title,
        dimension: data.dimension,
        dimensionValue: data.dimensionValue,
        dimensionValueLabel,
        itemType: data.itemType,
        assigneeId: data.assigneeId,
        assigneeName: data.assigneeName,
        remark: data.remark,
        items: items.map(item => ({ ...item, stockTakeId: id })),
        totalItems: items.length,
        updatedAt: new Date().toISOString(),
      }

      saveStockTakesToStorage(stocktakes)

      addAuditLog({
        module: 'stocktake',
        operationType: 'stocktake_edit',
        targetType: 'stocktake',
        targetId: id,
        targetName: stocktakes[index].title,
        afterContent: `盘点项: ${items.length}项`,
        remark: '编辑盘点任务',
      })

      resolve(stocktakes[index])
    } catch (e: any) {
      reject(e)
    }
  })
}

export async function mockStartStockTake(id: string): Promise<StockTake> {
  return new Promise((resolve, reject) => {
    try {
      const stocktakes = getStockTakesFromStorage()
      const index = stocktakes.findIndex(s => s.id === id)

      if (index === -1) {
        reject(new Error('盘点任务不存在'))
        return
      }

      const stocktake = stocktakes[index]

      if (stocktake.status !== 'pending') {
        reject(new Error('只能开始待开始状态的盘点任务'))
        return
      }

      stocktakes[index] = {
        ...stocktake,
        status: 'in_progress',
        startTime: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      saveStockTakesToStorage(stocktakes)

      addAuditLog({
        module: 'stocktake',
        operationType: 'stocktake_start',
        targetType: 'stocktake',
        targetId: id,
        targetName: stocktakes[index].title,
        afterContent: '状态: 盘点中',
        remark: '开始盘点',
      })

      resolve(stocktakes[index])
    } catch (e: any) {
      reject(e)
    }
  })
}

export async function mockUpdateStockTakeItem(
  stockTakeId: string,
  itemId: string,
  data: StockTakeItemUpdateData
): Promise<StockTakeItem> {
  return new Promise((resolve, reject) => {
    try {
      const stocktakes = getStockTakesFromStorage()
      const stocktakeIndex = stocktakes.findIndex(s => s.id === stockTakeId)

      if (stocktakeIndex === -1) {
        reject(new Error('盘点任务不存在'))
        return
      }

      const stocktake = stocktakes[stocktakeIndex]

      if (stocktake.status !== 'in_progress') {
        reject(new Error('只能在盘点中状态录入实盘数量'))
        return
      }

      const itemIndex = stocktake.items.findIndex(item => item.id === itemId)

      if (itemIndex === -1) {
        reject(new Error('盘点项不存在'))
        return
      }

      const user = getCurrentUser()
      let item = stocktake.items[itemIndex]

      item = {
        ...item,
        actualQuantity: data.actualQuantity,
        checkedBy: user?.id,
        checkedByName: user?.name,
        checkedAt: new Date().toISOString(),
        remark: data.remark || item.remark,
      }

      item = calculateItemDifference(item)

      stocktakes[stocktakeIndex].items[itemIndex] = item
      stocktakes[stocktakeIndex] = updateStockTakeStats(stocktakes[stocktakeIndex])

      saveStockTakesToStorage(stocktakes)

      resolve(item)
    } catch (e: any) {
      reject(e)
    }
  })
}

export async function mockBatchUpdateStockTakeItems(
  stockTakeId: string,
  updates: Array<{ itemId: string; actualQuantity: number; remark?: string }>
): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const stocktakes = getStockTakesFromStorage()
      const stocktakeIndex = stocktakes.findIndex(s => s.id === stockTakeId)

      if (stocktakeIndex === -1) {
        reject(new Error('盘点任务不存在'))
        return
      }

      const stocktake = stocktakes[stocktakeIndex]

      if (stocktake.status !== 'in_progress') {
        reject(new Error('只能在盘点中状态录入实盘数量'))
        return
      }

      const user = getCurrentUser()

      updates.forEach(update => {
        const itemIndex = stocktake.items.findIndex(item => item.id === update.itemId)
        if (itemIndex !== -1) {
          let item = stocktake.items[itemIndex]
          item = {
            ...item,
            actualQuantity: update.actualQuantity,
            checkedBy: user?.id,
            checkedByName: user?.name,
            checkedAt: new Date().toISOString(),
            remark: update.remark || item.remark,
          }
          item = calculateItemDifference(item)
          stocktakes[stocktakeIndex].items[itemIndex] = item
        }
      })

      stocktakes[stocktakeIndex] = updateStockTakeStats(stocktakes[stocktakeIndex])
      saveStockTakesToStorage(stocktakes)

      resolve()
    } catch (e: any) {
      reject(e)
    }
  })
}

export async function mockConfirmStockTake(
  id: string,
  data: StockTakeConfirmData
): Promise<StockTake> {
  return new Promise((resolve, reject) => {
    try {
      const stocktakes = getStockTakesFromStorage()
      const stocktakeIndex = stocktakes.findIndex(s => s.id === id)

      if (stocktakeIndex === -1) {
        reject(new Error('盘点任务不存在'))
        return
      }

      let stocktake = stocktakes[stocktakeIndex]

      if (stocktake.status !== 'to_confirm') {
        reject(new Error('只能确认待确认状态的盘点任务'))
        return
      }

      const uncheckedItems = stocktake.items.filter(item => item.actualQuantity === null)
      if (uncheckedItems.length > 0) {
        reject(new Error(`还有${uncheckedItems.length}项未录入实盘数量`))
        return
      }

      const user = getCurrentUser()
      const adjustments: StockAdjustmentRecord[] = getAdjustmentsFromStorage()
      const batches = getBatchesFromStorage()
      const consumables = getConsumablesFromStorage()
      const batchOperations = getBatchOperationsFromStorage()
      const consumableOperations = getConsumableOperationsFromStorage()

      if (data.handleSurplus || data.handleDeficit) {
        stocktake.items.forEach(item => {
          if (item.differenceResult === 'surplus' && data.handleSurplus) {
            if (item.itemType === 'reagent') {
              const batchIndex = batches.findIndex(b => b.id === item.itemId)
              if (batchIndex !== -1) {
                const batch = batches[batchIndex]
                const beforeQty = batch.remainingQuantity
                const afterQty = Number((beforeQty + item.difference).toFixed(2))
                batches[batchIndex] = { ...batch, remainingQuantity: afterQty }

                batchOperations.unshift({
                  id: generateId(),
                  batchId: batch.id,
                  type: 'stock_in',
                  quantity: item.difference,
                  beforeQuantity: beforeQty,
                  afterQuantity: afterQty,
                  operator: user?.id || '2',
                  operatorName: user?.name || '李主任',
                  reason: `盘点盘盈: ${stocktake.stockTakeNo}`,
                  remark: data.confirmRemark,
                  createdAt: new Date().toISOString(),
                })
              }
            } else {
              const consumableIndex = consumables.findIndex(c => c.id === item.itemId)
              if (consumableIndex !== -1) {
                const consumable = consumables[consumableIndex]
                const beforeQty = consumable.stockQuantity
                const afterQty = Number((beforeQty + item.difference).toFixed(2))
                consumables[consumableIndex] = { ...consumable, stockQuantity: afterQty }

                consumableOperations.unshift({
                  id: generateId(),
                  consumableId: consumable.id,
                  consumableName: consumable.name,
                  type: 'adjust',
                  quantity: item.difference,
                  beforeQuantity: beforeQty,
                  afterQuantity: afterQty,
                  operator: user?.id || '2',
                  operatorName: user?.name || '李主任',
                  reason: `盘点盘盈: ${stocktake.stockTakeNo}`,
                  remark: data.confirmRemark,
                  adjustType: 'increase',
                  createdAt: new Date().toISOString(),
                })
              }
            }

            adjustments.unshift({
              id: generateId(),
              stockTakeId: stocktake.id,
              stockTakeNo: stocktake.stockTakeNo,
              itemId: item.itemId,
              itemName: item.itemName,
              itemType: item.itemType,
              batchNumber: item.batchNumber,
              storageLocation: item.storageLocation,
              unit: item.unit,
              adjustType: 'surplus',
              adjustQuantity: Math.abs(item.difference),
              beforeQuantity: item.bookQuantity,
              afterQuantity: item.actualQuantity || item.bookQuantity,
              operatorId: user?.id || '2',
              operatorName: user?.name || '李主任',
              reason: `盘点盘盈`,
              remark: data.confirmRemark,
              createdAt: new Date().toISOString(),
            })
          } else if (item.differenceResult === 'deficit' && data.handleDeficit) {
            if (item.itemType === 'reagent') {
              const batchIndex = batches.findIndex(b => b.id === item.itemId)
              if (batchIndex !== -1) {
                const batch = batches[batchIndex]
                const beforeQty = batch.remainingQuantity
                const afterQty = Number((beforeQty + item.difference).toFixed(2))
                batches[batchIndex] = { ...batch, remainingQuantity: afterQty }

                batchOperations.unshift({
                  id: generateId(),
                  batchId: batch.id,
                  type: 'stock_out',
                  quantity: Math.abs(item.difference),
                  beforeQuantity: beforeQty,
                  afterQuantity: afterQty,
                  operator: user?.id || '2',
                  operatorName: user?.name || '李主任',
                  reason: `盘点盘亏: ${stocktake.stockTakeNo}`,
                  remark: data.confirmRemark,
                  createdAt: new Date().toISOString(),
                })
              }
            } else {
              const consumableIndex = consumables.findIndex(c => c.id === item.itemId)
              if (consumableIndex !== -1) {
                const consumable = consumables[consumableIndex]
                const beforeQty = consumable.stockQuantity
                const afterQty = Number((beforeQty + item.difference).toFixed(2))
                consumables[consumableIndex] = { ...consumable, stockQuantity: afterQty }

                consumableOperations.unshift({
                  id: generateId(),
                  consumableId: consumable.id,
                  consumableName: consumable.name,
                  type: 'adjust',
                  quantity: Math.abs(item.difference),
                  beforeQuantity: beforeQty,
                  afterQuantity: afterQty,
                  operator: user?.id || '2',
                  operatorName: user?.name || '李主任',
                  reason: `盘点盘亏: ${stocktake.stockTakeNo}`,
                  remark: data.confirmRemark,
                  adjustType: 'decrease',
                  createdAt: new Date().toISOString(),
                })
              }
            }

            adjustments.unshift({
              id: generateId(),
              stockTakeId: stocktake.id,
              stockTakeNo: stocktake.stockTakeNo,
              itemId: item.itemId,
              itemName: item.itemName,
              itemType: item.itemType,
              batchNumber: item.batchNumber,
              storageLocation: item.storageLocation,
              unit: item.unit,
              adjustType: 'deficit',
              adjustQuantity: Math.abs(item.difference),
              beforeQuantity: item.bookQuantity,
              afterQuantity: item.actualQuantity || item.bookQuantity,
              operatorId: user?.id || '2',
              operatorName: user?.name || '李主任',
              reason: `盘点盘亏`,
              remark: data.confirmRemark,
              createdAt: new Date().toISOString(),
            })
          }
        })

        saveBatchesToStorage(batches)
        saveBatchOperationsToStorage(batchOperations)
        saveConsumablesToStorage(consumables)
        saveConsumableOperationsToStorage(consumableOperations)
        saveAdjustmentsToStorage(adjustments)
      }

      stocktakes[stocktakeIndex] = {
        ...stocktake,
        status: 'completed',
        endTime: new Date().toISOString(),
        confirmTime: new Date().toISOString(),
        confirmedBy: user?.id,
        confirmedByName: user?.name,
        confirmRemark: data.confirmRemark,
        updatedAt: new Date().toISOString(),
      }

      saveStockTakesToStorage(stocktakes)

      addAuditLog({
        module: 'stocktake',
        operationType: 'stocktake_confirm',
        targetType: 'stocktake',
        targetId: id,
        targetName: stocktakes[stocktakeIndex].title,
        afterContent: `盘盈: ${stocktake.surplusCount}项, 盘亏: ${stocktake.deficitCount}项, 无差异: ${stocktake.noDiffCount}项`,
        remark: '确认盘点结果',
      })

      resolve(stocktakes[stocktakeIndex])
    } catch (e: any) {
      reject(e)
    }
  })
}

export async function mockDeleteStockTake(id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const stocktakes = getStockTakesFromStorage()
      const index = stocktakes.findIndex(s => s.id === id)

      if (index === -1) {
        reject(new Error('盘点任务不存在'))
        return
      }

      const stocktake = stocktakes[index]

      if (stocktake.status === 'in_progress' || stocktake.status === 'to_confirm') {
        reject(new Error('不能删除进行中的盘点任务'))
        return
      }

      const filtered = stocktakes.filter(s => s.id !== id)
      saveStockTakesToStorage(filtered)

      addAuditLog({
        module: 'stocktake',
        operationType: 'stocktake_delete',
        targetType: 'stocktake',
        targetId: id,
        targetName: stocktake.title,
        remark: '删除盘点任务',
      })

      resolve()
    } catch (e: any) {
      reject(e)
    }
  })
}

export async function mockGetStockTakeStats(): Promise<StockTakeStats> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const stocktakes = getStockTakesFromStorage()

      const stats: StockTakeStats = {
        total: stocktakes.length,
        pending: 0,
        inProgress: 0,
        toConfirm: 0,
        completed: 0,
        totalItems: 0,
        totalSurplus: 0,
        totalDeficit: 0,
      }

      stocktakes.forEach(s => {
        stats[s.status === 'in_progress' ? 'inProgress' : s.status]++
        stats.totalItems += s.totalItems
        stats.totalSurplus += s.surplusCount
        stats.totalDeficit += s.deficitCount
      })

      resolve(stats)
    }, 200)
  })
}

export async function mockExportStockTake(id: string): Promise<StockTake | null> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const stocktakes = getStockTakesFromStorage()
      const stocktake = stocktakes.find(s => s.id === id)

      if (!stocktake) {
        resolve(null)
        return
      }

      addAuditLog({
        module: 'stocktake',
        operationType: 'stocktake_export',
        targetType: 'stocktake',
        targetId: id,
        targetName: stocktake.title,
        remark: '导出盘点报表',
      })

      resolve({ ...stocktake })
    }, 300)
  })
}

export async function mockGetAdjustments(
  page: number = 1,
  pageSize: number = 10,
  stockTakeId?: string
): Promise<PageResult<StockAdjustmentRecord>> {
  return new Promise((resolve) => {
    setTimeout(() => {
      let adjustments = getAdjustmentsFromStorage()

      if (stockTakeId) {
        adjustments = adjustments.filter(a => a.stockTakeId === stockTakeId)
      }

      adjustments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

      const start = (page - 1) * pageSize
      const list = adjustments.slice(start, start + pageSize)

      resolve({
        list,
        total: adjustments.length,
        page,
        pageSize,
      })
    }, 300)
  })
}

export function downloadStockTakeReport(stocktake: StockTake): void {
  const headers = [
    '物品类型',
    '物品名称',
    '分类',
    '规格',
    '批次号',
    '库位',
    '单位',
    '账面数量',
    '实盘数量',
    '差异数量',
    '差异结果',
    '盘点人',
    '盘点时间',
    '备注',
  ]

  const rows = stocktake.items.map(item => [
    item.itemType === 'reagent' ? '试剂' : '耗材',
    item.itemName,
    item.category || '',
    item.specification || '',
    item.batchNumber || '',
    item.storageLocation,
    item.unit,
    item.bookQuantity,
    item.actualQuantity !== null ? item.actualQuantity : '',
    item.difference,
    item.differenceResult === 'surplus' ? '盘盈' : item.differenceResult === 'deficit' ? '盘亏' : '无差异',
    item.checkedByName || '',
    item.checkedAt ? new Date(item.checkedAt).toLocaleString() : '',
    item.remark || '',
  ])

  const csvContent = [
    `盘点单号: ${stocktake.stockTakeNo}`,
    `盘点标题: ${stocktake.title}`,
    `盘点维度: ${stocktake.dimensionValueLabel || stocktake.dimensionValue}`,
    `状态: ${stocktake.status}`,
    `创建人: ${stocktake.creatorName}`,
    `盘点人: ${stocktake.assigneeName || ''}`,
    `创建时间: ${new Date(stocktake.createdAt).toLocaleString()}`,
    `确认时间: ${stocktake.confirmTime ? new Date(stocktake.confirmTime).toLocaleString() : ''}`,
    `确认备注: ${stocktake.confirmRemark || ''}`,
    '',
    headers.join(','),
    ...rows.map(row => row.map(v => `"${v}"`).join(',')),
  ].join('\n')

  const BOM = '\uFEFF'
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `盘点报表_${stocktake.stockTakeNo}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
