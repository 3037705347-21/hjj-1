import type {
  Consumable,
  ConsumableFormData,
  ConsumableOperation,
  ConsumableOperationFormData,
  ConsumableOperationType,
  ConsumptionTrendPoint,
} from '@/types/consumable'
import type { PageResult } from '@/types/common'
import { generateId } from '@/utils/date'
import { storage } from '@/utils/storage'
import type { User } from '@/types/user'

const STORAGE_KEY = 'mock_consumables'
const OPERATION_STORAGE_KEY = 'mock_consumable_operations'

function getConsumablesFromStorage(): Consumable[] {
  const data = localStorage.getItem(STORAGE_KEY)
  if (data) {
    try {
      return JSON.parse(data)
    } catch {
      return []
    }
  }
  return initMockConsumables()
}

function saveConsumablesToStorage(consumables: Consumable[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(consumables))
}

function getOperationsFromStorage(): ConsumableOperation[] {
  const data = localStorage.getItem(OPERATION_STORAGE_KEY)
  if (data) {
    try {
      return JSON.parse(data)
    } catch {
      return []
    }
  }
  return initMockOperations()
}

function saveOperationsToStorage(operations: ConsumableOperation[]): void {
  localStorage.setItem(OPERATION_STORAGE_KEY, JSON.stringify(operations))
}

function getCurrentUser(): User | null {
  return storage.getUser<User>()
}

function initMockConsumables(): Consumable[] {
  const now = new Date().toISOString()
  const consumables: Consumable[] = [
    {
      id: 'cons_001',
      name: '1.5mL 离心管',
      category: '离心管',
      specification: '500个/包',
      unit: '包',
      stockQuantity: 25,
      safetyStock: 10,
      manufacturer: 'Axygen',
      location: '耗材柜A-01',
      description: '无酶无热源离心管',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'cons_002',
      name: '200μL 吸头',
      category: '吸头',
      specification: '1000个/盒',
      unit: '盒',
      stockQuantity: 8,
      safetyStock: 5,
      manufacturer: 'Gilson',
      location: '耗材柜A-02',
      description: '带滤芯吸头',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'cons_003',
      name: '100mm 细胞培养皿',
      category: '培养皿',
      specification: '20个/包',
      unit: '包',
      stockQuantity: 12,
      safetyStock: 5,
      manufacturer: 'Corning',
      location: '耗材柜B-01',
      description: 'TC处理培养皿',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'cons_004',
      name: '96孔PCR板',
      category: 'PCR板',
      specification: '25块/包',
      unit: '包',
      stockQuantity: 3,
      safetyStock: 5,
      manufacturer: 'Bio-Rad',
      location: '耗材柜B-02',
      description: '半裙边96孔板',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'cons_005',
      name: '一次性手套 M号',
      category: '手套',
      specification: '100只/盒',
      unit: '盒',
      stockQuantity: 15,
      safetyStock: 10,
      manufacturer: '英科',
      location: '耗材柜C-01',
      description: '丁腈手套，无粉',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'cons_006',
      name: '医用外科口罩',
      category: '口罩',
      specification: '50只/盒',
      unit: '盒',
      stockQuantity: 30,
      safetyStock: 20,
      manufacturer: '3M',
      location: '耗材柜C-02',
      description: '三层防护口罩',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'cons_007',
      name: '定性滤纸 中速',
      category: '滤纸',
      specification: '100张/盒 直径11cm',
      unit: '盒',
      stockQuantity: 2,
      safetyStock: 3,
      manufacturer: 'Whatman',
      location: '耗材柜D-01',
      description: 'Grade 1 滤纸',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'cons_008',
      name: 'Parafilm 封口膜',
      category: '封口膜',
      specification: '10cm×38m',
      unit: '卷',
      stockQuantity: 4,
      safetyStock: 2,
      manufacturer: 'Bemis',
      location: '耗材柜D-02',
      description: '实验室通用封口膜',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'cons_009',
      name: '0.2mL PCR管',
      category: '离心管',
      specification: '1000个/包',
      unit: '包',
      stockQuantity: 6,
      safetyStock: 5,
      manufacturer: 'Axygen',
      location: '耗材柜A-03',
      description: '平盖PCR管',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'cons_010',
      name: '1000μL 吸头',
      category: '吸头',
      specification: '100个/盒',
      unit: '盒',
      stockQuantity: 18,
      safetyStock: 10,
      manufacturer: 'Eppendorf',
      location: '耗材柜A-04',
      description: '普通吸头',
      createdAt: now,
      updatedAt: now,
    },
  ]
  saveConsumablesToStorage(consumables)
  initMockOperations()
  return consumables
}

function initMockOperations(): ConsumableOperation[] {
  const operations: ConsumableOperation[] = []
  const today = new Date()
  const consumables = getConsumablesFromStorage()
  const user = getCurrentUser()
  const defaultOperatorId = user?.id || '2'
  const defaultOperatorName = user?.name || '李主任'

  const addDays = (date: Date, days: number) => {
    const result = new Date(date)
    result.setDate(result.getDate() + days)
    return result
  }

  consumables.forEach((consumable) => {
    const initialStock = consumable.stockQuantity + Math.floor(Math.random() * 20) + 5
    operations.push({
      id: generateId(),
      consumableId: consumable.id,
      consumableName: consumable.name,
      type: 'stock_in',
      quantity: initialStock,
      beforeQuantity: 0,
      afterQuantity: initialStock,
      operator: defaultOperatorId,
      operatorName: defaultOperatorName,
      purpose: '初始入库',
      createdAt: addDays(today, -45).toISOString(),
    })

    let currentStock = initialStock

    for (let i = 30; i >= 1; i--) {
      const date = addDays(today, -i)
      const dayOfWeek = date.getDay()
      if (dayOfWeek === 0 || dayOfWeek === 6) continue

      const useChance = Math.random()
      if (useChance > 0.35) {
        const usedQty = Math.floor(Math.random() * 3) + 1
        if (currentStock > usedQty) {
          operations.push({
            id: generateId(),
            consumableId: consumable.id,
            consumableName: consumable.name,
            type: 'use',
            quantity: usedQty,
            beforeQuantity: currentStock,
            afterQuantity: currentStock - usedQty,
            operator: '3',
            operatorName: '王实验员',
            purpose: ['Western Blot实验', 'ELISA实验', '细胞培养', 'PCR实验', '样品处理'][Math.floor(Math.random() * 5)],
            createdAt: date.toISOString(),
          })
          currentStock -= usedQty
        }
      }

      if (i === 20 && Math.random() > 0.5) {
        const receiveQty = Math.floor(Math.random() * 10) + 5
        operations.push({
          id: generateId(),
          consumableId: consumable.id,
          consumableName: consumable.name,
          type: 'stock_in',
          quantity: receiveQty,
          beforeQuantity: currentStock,
          afterQuantity: currentStock + receiveQty,
          operator: defaultOperatorId,
          operatorName: defaultOperatorName,
          purpose: '采购入库',
          createdAt: addDays(today, -20).toISOString(),
        })
        currentStock += receiveQty
      }

      if (i === 10 && Math.random() > 0.7) {
        const scrapQty = 1
        if (currentStock > scrapQty) {
          operations.push({
            id: generateId(),
            consumableId: consumable.id,
            consumableName: consumable.name,
            type: 'scrap',
            quantity: scrapQty,
            beforeQuantity: currentStock,
            afterQuantity: currentStock - scrapQty,
            operator: '3',
            operatorName: '王实验员',
            reason: '包装破损',
            createdAt: addDays(today, -10).toISOString(),
          })
          currentStock -= scrapQty
        }
      }
    }

    while (currentStock > consumable.stockQuantity) {
      const diff = currentStock - consumable.stockQuantity
      operations.push({
        id: generateId(),
        consumableId: consumable.id,
        consumableName: consumable.name,
        type: 'use',
        quantity: Math.min(diff, 2),
        beforeQuantity: currentStock,
        afterQuantity: currentStock - Math.min(diff, 2),
        operator: '3',
        operatorName: '王实验员',
        purpose: '日常实验使用',
        createdAt: addDays(today, -1).toISOString(),
      })
      currentStock -= Math.min(diff, 2)
    }
  })

  saveOperationsToStorage(operations)
  return operations
}

export function mockGetConsumables(
  page: number = 1,
  pageSize: number = 10,
  keyword?: string,
  category?: string
): Promise<PageResult<Consumable>> {
  return new Promise((resolve) => {
    setTimeout(() => {
      let consumables = getConsumablesFromStorage()

      if (keyword) {
        const kw = keyword.toLowerCase()
        consumables = consumables.filter(
          (c) =>
            c.name.toLowerCase().includes(kw) ||
            c.manufacturer?.toLowerCase().includes(kw)
        )
      }

      if (category) {
        consumables = consumables.filter((c) => c.category === category)
      }

      consumables.sort((a, b) => {
        const aLow = a.stockQuantity <= a.safetyStock
        const bLow = b.stockQuantity <= b.safetyStock
        if (aLow && !bLow) return -1
        if (!aLow && bLow) return 1
        return a.name.localeCompare(b.name)
      })

      const start = (page - 1) * pageSize
      const list = consumables.slice(start, start + pageSize)

      resolve({
        list,
        total: consumables.length,
        page,
        pageSize,
      })
    }, 300)
  })
}

export function mockGetConsumable(id: string): Promise<Consumable | null> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const consumables = getConsumablesFromStorage()
      const consumable = consumables.find((c) => c.id === id) || null
      resolve(consumable)
    }, 200)
  })
}

export function mockGetConsumableDetail(id: string): Promise<{
  consumable: Consumable
  operations: ConsumableOperation[]
  trend: ConsumptionTrendPoint[]
} | null> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const consumables = getConsumablesFromStorage()
      const consumable = consumables.find((c) => c.id === id)
      if (!consumable) {
        resolve(null)
        return
      }

      const allOperations = getOperationsFromStorage()
      const operations = allOperations
        .filter((op) => op.consumableId === id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

      const trend = calculateConsumptionTrend(id)

      resolve({
        consumable,
        operations,
        trend,
      })
    }, 300)
  })
}

export function mockGetConsumableOperations(
  page: number = 1,
  pageSize: number = 10,
  params?: {
    keyword?: string
    category?: string
    operationType?: ConsumableOperationType | ''
    operator?: string
    startTime?: string
    endTime?: string
  }
): Promise<PageResult<ConsumableOperation>> {
  return new Promise((resolve) => {
    setTimeout(() => {
      let operations = getOperationsFromStorage()
      const consumables = getConsumablesFromStorage()
      const consumableMap = new Map(consumables.map((c) => [c.id, c]))

      if (params?.keyword) {
        const kw = params.keyword.toLowerCase()
        operations = operations.filter((op) => {
          const consumable = consumableMap.get(op.consumableId)
          return (
            op.consumableName.toLowerCase().includes(kw) ||
            consumable?.manufacturer?.toLowerCase().includes(kw)
          )
        })
      }

      if (params?.category) {
        operations = operations.filter((op) => {
          const consumable = consumableMap.get(op.consumableId)
          return consumable?.category === params.category
        })
      }

      if (params?.operationType) {
        operations = operations.filter((op) => op.type === params.operationType)
      }

      if (params?.operator) {
        operations = operations.filter((op) => op.operatorName.includes(params.operator!) || op.operator === params.operator)
      }

      if (params?.startTime) {
        const start = new Date(params.startTime).getTime()
        operations = operations.filter((op) => new Date(op.createdAt).getTime() >= start)
      }

      if (params?.endTime) {
        const end = new Date(params.endTime).getTime() + 24 * 60 * 60 * 1000
        operations = operations.filter((op) => new Date(op.createdAt).getTime() < end)
      }

      operations.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )

      const start = (page - 1) * pageSize
      const list = operations.slice(start, start + pageSize)

      resolve({
        list,
        total: operations.length,
        page,
        pageSize,
      })
    }, 300)
  })
}

export function mockCreateConsumable(data: ConsumableFormData): Promise<Consumable> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const consumables = getConsumablesFromStorage()
      const now = new Date().toISOString()
      const newConsumable: Consumable = {
        ...data,
        id: generateId(),
        createdAt: now,
        updatedAt: now,
      }
      consumables.unshift(newConsumable)
      saveConsumablesToStorage(consumables)

      if (data.stockQuantity > 0) {
        const user = getCurrentUser()
        const operations = getOperationsFromStorage()
        operations.unshift({
          id: generateId(),
          consumableId: newConsumable.id,
          consumableName: newConsumable.name,
          type: 'stock_in',
          quantity: data.stockQuantity,
          beforeQuantity: 0,
          afterQuantity: data.stockQuantity,
          operator: user?.id || '2',
          operatorName: user?.name || '李主任',
          purpose: '初始入库',
          createdAt: now,
        })
        saveOperationsToStorage(operations)
      }

      resolve(newConsumable)
    }, 300)
  })
}

export function mockUpdateConsumable(
  id: string,
  data: ConsumableFormData
): Promise<Consumable> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const consumables = getConsumablesFromStorage()
      const index = consumables.findIndex((c) => c.id === id)
      if (index === -1) {
        reject(new Error('耗材不存在'))
        return
      }
      consumables[index] = {
        ...consumables[index],
        ...data,
        updatedAt: new Date().toISOString(),
      }
      saveConsumablesToStorage(consumables)
      resolve(consumables[index])
    }, 300)
  })
}

export function mockDeleteConsumable(id: string): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const consumables = getConsumablesFromStorage()
      const filtered = consumables.filter((c) => c.id !== id)
      saveConsumablesToStorage(filtered)

      const operations = getOperationsFromStorage()
      const filteredOps = operations.filter((op) => op.consumableId !== id)
      saveOperationsToStorage(filteredOps)

      resolve()
    }, 200)
  })
}

export function mockConsumableOperation(
  id: string,
  data: ConsumableOperationFormData
): Promise<ConsumableOperation> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const consumables = getConsumablesFromStorage()
      const index = consumables.findIndex((c) => c.id === id)

      if (index === -1) {
        reject(new Error('耗材不存在'))
        return
      }

      const consumable = { ...consumables[index] }
      const user = getCurrentUser()
      const beforeQuantity = consumable.stockQuantity
      let afterQuantity = beforeQuantity
      let purpose = ''
      let reason = ''

      try {
        if (data.quantity === undefined || data.quantity <= 0) {
          throw new Error('请输入有效数量')
        }

        switch (data.type) {
          case 'stock_in':
          case 'receive':
            afterQuantity = parseFloat((beforeQuantity + data.quantity).toFixed(2))
            purpose = data.purpose || '入库'
            break

          case 'use':
          case 'stock_out':
            if (beforeQuantity < data.quantity) {
              throw new Error('库存不足')
            }
            afterQuantity = parseFloat((beforeQuantity - data.quantity).toFixed(2))
            purpose = data.purpose || '领用'
            break

          case 'return':
            afterQuantity = parseFloat((beforeQuantity + data.quantity).toFixed(2))
            reason = data.reason || '退库'
            break

          case 'scrap':
            if (beforeQuantity < data.quantity) {
              throw new Error('报损数量不能超过库存')
            }
            afterQuantity = parseFloat((beforeQuantity - data.quantity).toFixed(2))
            reason = data.reason || '报损'
            break

          case 'transfer':
            if (beforeQuantity < data.quantity) {
              throw new Error('调拨数量不能超过库存')
            }
            if (!data.targetLocation?.trim()) {
              throw new Error('请输入目标存放位置')
            }
            afterQuantity = parseFloat((beforeQuantity - data.quantity).toFixed(2))
            purpose = `调拨至 ${data.targetLocation}`
            break

          case 'adjust':
            if (data.adjustType === 'increase') {
              afterQuantity = parseFloat((beforeQuantity + data.quantity).toFixed(2))
            } else if (data.adjustType === 'decrease') {
              if (beforeQuantity < data.quantity) {
                throw new Error('调整后库存不能小于0')
              }
              afterQuantity = parseFloat((beforeQuantity - data.quantity).toFixed(2))
            } else {
              throw new Error('请选择调整类型')
            }
            reason = data.reason || '库存盘点调整'
            break

          default:
            throw new Error('未知操作类型')
        }
      } catch (e: any) {
        reject(e)
        return
      }

      consumable.stockQuantity = afterQuantity
      consumable.updatedAt = new Date().toISOString()
      consumables[index] = consumable
      saveConsumablesToStorage(consumables)

      const operation: ConsumableOperation = {
        id: generateId(),
        consumableId: id,
        consumableName: consumable.name,
        type: data.type,
        quantity: data.quantity,
        beforeQuantity,
        afterQuantity,
        operator: user?.id || '3',
        operatorName: user?.name || '王实验员',
        purpose: purpose || undefined,
        reason: reason || undefined,
        remark: data.remark,
        targetLocation: data.targetLocation,
        adjustType: data.adjustType,
        createdAt: new Date().toISOString(),
      }

      const operations = getOperationsFromStorage()
      operations.unshift(operation)
      saveOperationsToStorage(operations)

      resolve(operation)
    }, 300)
  })
}

export function mockGetLowStockCount(): Promise<number> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const consumables = getConsumablesFromStorage()
      const count = consumables.filter((c) => c.stockQuantity <= c.safetyStock).length
      resolve(count)
    }, 200)
  })
}

export function calculateConsumptionTrend(consumableId: string): ConsumptionTrendPoint[] {
  const operations = getOperationsFromStorage()
  const consumableOps = operations.filter((op) => op.consumableId === consumableId)

  const trend: ConsumptionTrendPoint[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (let i = 29; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]

    const dayOps = consumableOps.filter((op) => {
      const opDate = new Date(op.createdAt)
      opDate.setHours(0, 0, 0, 0)
      return opDate.getTime() === date.getTime()
    })

    const used = dayOps
      .filter((op) => op.type === 'use' || op.type === 'scrap' || op.type === 'stock_out')
      .reduce((sum, op) => sum + op.quantity, 0)

    const received = dayOps
      .filter((op) => op.type === 'stock_in' || op.type === 'receive' || op.type === 'return')
      .reduce((sum, op) => sum + op.quantity, 0)

    trend.push({
      date: dateStr,
      used,
      received,
    })
  }

  return trend
}

export function mockGetAllConsumableCategories(): Promise<string[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const consumables = getConsumablesFromStorage()
      const categories = Array.from(new Set(consumables.map((c) => c.category)))
      resolve(categories)
    }, 100)
  })
}

export function mockGetOperatorNames(): Promise<string[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const operations = getOperationsFromStorage()
      const operators = Array.from(new Set(operations.map((op) => op.operatorName)))
      resolve(operators)
    }, 100)
  })
}
