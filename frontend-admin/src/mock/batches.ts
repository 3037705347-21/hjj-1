import type {
  ReagentBatch,
  BatchOperation,
  BatchFormData,
  OutboundFormData,
  BatchOperationFormData,
  BatchOperationType,
} from '@/types/batch'
import type { PageResult } from '@/types/common'
import { generateId, getExpiryDays, isExpired, isExpiringSoon } from '@/utils/date'
import { mockGetAllReagents } from './reagents'
import { storage } from '@/utils/storage'
import type { User } from '@/types/user'
import { addAuditLog } from './audit'

const BATCH_STORAGE_KEY = 'mock_batches'
const OPERATION_STORAGE_KEY = 'mock_batch_operations'

export function getBatchesFromStorage(): ReagentBatch[] {
  const data = localStorage.getItem(BATCH_STORAGE_KEY)
  if (data) {
    try {
      return JSON.parse(data)
    } catch {
      return []
    }
  }
  return initMockBatches()
}

function saveBatchesToStorage(batches: ReagentBatch[]): void {
  localStorage.setItem(BATCH_STORAGE_KEY, JSON.stringify(batches))
}

export function getOperationsFromStorage(): BatchOperation[] {
  const data = localStorage.getItem(OPERATION_STORAGE_KEY)
  if (data) {
    try {
      return JSON.parse(data)
    } catch {
      return []
    }
  }
  return []
}

function saveOperationsToStorage(operations: BatchOperation[]): void {
  localStorage.setItem(OPERATION_STORAGE_KEY, JSON.stringify(operations))
}

function getCurrentUser(): User | null {
  return storage.getUser<User>()
}

export function updateBatchStatus(batch: ReagentBatch): ReagentBatch {
  if (batch.status === 'frozen') {
    return batch
  }
  if (batch.remainingQuantity <= 0) {
    return { ...batch, status: 'exhausted' }
  }
  if (isExpired(batch.expiryDate)) {
    return { ...batch, status: 'expired' }
  }
  if (isExpiringSoon(batch.expiryDate, 30)) {
    return { ...batch, status: 'warning' }
  }
  return { ...batch, status: 'normal' }
}

function recalculateStatus(batch: ReagentBatch): ReagentBatch {
  if (batch.remainingQuantity <= 0) {
    return { ...batch, status: 'exhausted' }
  }
  if (isExpired(batch.expiryDate)) {
    return { ...batch, status: 'expired' }
  }
  if (isExpiringSoon(batch.expiryDate, 30)) {
    return { ...batch, status: 'warning' }
  }
  return { ...batch, status: 'normal' }
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

function addMonths(date: Date, months: number): Date {
  const result = new Date(date)
  result.setMonth(result.getMonth() + months)
  return result
}

function addYears(date: Date, years: number): Date {
  const result = new Date(date)
  result.setFullYear(result.getFullYear() + years)
  return result
}

function initMockBatches(): ReagentBatch[] {
  const reagentsData = localStorage.getItem('mock_reagents')
  let reagentIds: string[] = []
  const reagentNames: Record<string, string> = {}
  const reagentUnits: Record<string, string> = {}

  if (reagentsData) {
    try {
      const reagents = JSON.parse(reagentsData)
      reagentIds = reagents.map((r: any) => r.id)
      reagents.forEach((r: any) => {
        reagentNames[r.id] = r.name
        reagentUnits[r.id] = r.unit
      })
    } catch {
      // 忽略解析错误，使用默认数据
    }
  }

  if (reagentIds.length === 0) {
    return []
  }

  const today = new Date()
  const batches: ReagentBatch[] = [
    {
      id: generateId(),
      reagentId: reagentIds[0],
      reagentName: reagentNames[reagentIds[0]],
      batchNumber: 'BSA20250101',
      productionDate: '2025-01-15',
      expiryDate: addMonths(today, 2).toISOString().split('T')[0],
      initialQuantity: 100,
      remainingQuantity: 65,
      unit: reagentUnits[reagentIds[0]],
      storageLocation: 'A-01-03',
      receivedDate: '2025-01-20',
      status: 'warning',
      remark: '常用试剂，注意效期',
    },
    {
      id: generateId(),
      reagentId: reagentIds[0],
      reagentName: reagentNames[reagentIds[0]],
      batchNumber: 'BSA20250601',
      productionDate: '2025-06-10',
      expiryDate: addMonths(today, 12).toISOString().split('T')[0],
      initialQuantity: 200,
      remainingQuantity: 180,
      unit: reagentUnits[reagentIds[0]],
      storageLocation: 'A-01-04',
      receivedDate: '2025-06-15',
      status: 'normal',
      remark: '',
    },
    {
      id: generateId(),
      reagentId: reagentIds[1],
      reagentName: reagentNames[reagentIds[1]],
      batchNumber: 'TAQ20241105',
      productionDate: '2024-11-01',
      expiryDate: addDays(today, -5).toISOString().split('T')[0],
      initialQuantity: 500,
      remainingQuantity: 120,
      unit: reagentUnits[reagentIds[1]],
      storageLocation: 'B-02-01',
      receivedDate: '2024-11-10',
      status: 'expired',
      remark: '已过期，待销毁',
    },
    {
      id: generateId(),
      reagentId: reagentIds[1],
      reagentName: reagentNames[reagentIds[1]],
      batchNumber: 'TAQ20250420',
      productionDate: '2025-04-15',
      expiryDate: addMonths(today, 8).toISOString().split('T')[0],
      initialQuantity: 1000,
      remainingQuantity: 850,
      unit: reagentUnits[reagentIds[1]],
      storageLocation: 'B-02-02',
      receivedDate: '2025-04-25',
      status: 'normal',
      remark: '',
    },
    {
      id: generateId(),
      reagentId: reagentIds[2],
      reagentName: reagentNames[reagentIds[2]],
      batchNumber: 'TRIS20250301',
      productionDate: '2025-03-01',
      expiryDate: addMonths(today, 1).toISOString().split('T')[0],
      initialQuantity: 10,
      remainingQuantity: 3.5,
      unit: reagentUnits[reagentIds[2]],
      storageLocation: 'C-01-02',
      receivedDate: '2025-03-10',
      status: 'warning',
      remark: '库存偏低',
    },
    {
      id: generateId(),
      reagentId: reagentIds[3],
      reagentName: reagentNames[reagentIds[3]],
      batchNumber: 'ACN20250201',
      productionDate: '2025-02-10',
      expiryDate: addMonths(today, 6).toISOString().split('T')[0],
      initialQuantity: 8,
      remainingQuantity: 6,
      unit: reagentUnits[reagentIds[3]],
      storageLocation: 'D-03-01',
      receivedDate: '2025-02-20',
      status: 'normal',
      remark: '易燃品，注意存放',
    },
    {
      id: generateId(),
      reagentId: reagentIds[5],
      reagentName: reagentNames[reagentIds[5]],
      batchNumber: 'AGAR20250512',
      productionDate: '2025-05-01',
      expiryDate: addYears(today, 1).toISOString().split('T')[0],
      initialQuantity: 5,
      remainingQuantity: 4.2,
      unit: reagentUnits[reagentIds[5]],
      storageLocation: 'E-01-05',
      receivedDate: '2025-05-10',
      status: 'normal',
      remark: '',
    },
    {
      id: generateId(),
      reagentId: reagentIds[7],
      reagentName: reagentNames[reagentIds[7]],
      batchNumber: 'LB20250115',
      productionDate: '2025-01-10',
      expiryDate: addDays(today, 15).toISOString().split('T')[0],
      initialQuantity: 20,
      remainingQuantity: 0,
      unit: reagentUnits[reagentIds[7]],
      storageLocation: 'F-02-03',
      receivedDate: '2025-01-20',
      status: 'exhausted',
      remark: '已用完，待补货',
    },
  ]

  saveBatchesToStorage(batches)
  initMockOperations(batches)
  return batches
}

function initMockOperations(batches: ReagentBatch[]): void {
  const operations: BatchOperation[] = []
  const today = new Date()

  if (batches.length >= 2) {
    operations.push({
      id: generateId(),
      batchId: batches[0].id,
      type: 'in',
      quantity: batches[0].initialQuantity,
      beforeQuantity: 0,
      afterQuantity: batches[0].initialQuantity,
      operator: '2',
      operatorName: '李主任',
      purpose: '入库',
      createdAt: new Date(today.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    })
    operations.push({
      id: generateId(),
      batchId: batches[0].id,
      type: 'out',
      quantity: 20,
      beforeQuantity: 100,
      afterQuantity: 80,
      operator: '3',
      operatorName: '王实验员',
      purpose: 'Western Blot实验',
      createdAt: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    })
    operations.push({
      id: generateId(),
      batchId: batches[0].id,
      type: 'out',
      quantity: 15,
      beforeQuantity: 80,
      afterQuantity: 65,
      operator: '3',
      operatorName: '王实验员',
      purpose: 'ELISA实验',
      createdAt: new Date(today.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    })

    operations.push({
      id: generateId(),
      batchId: batches[1].id,
      type: 'in',
      quantity: batches[1].initialQuantity,
      beforeQuantity: 0,
      afterQuantity: batches[1].initialQuantity,
      operator: '2',
      operatorName: '李主任',
      purpose: '入库',
      createdAt: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    })
  }

  saveOperationsToStorage(operations)
}

export interface BatchFilterParams {
  keyword?: string
  reagentId?: string
  status?: string
  storageLocation?: string
  productionDateStart?: string
  productionDateEnd?: string
  expiryDateStart?: string
  expiryDateEnd?: string
  receivedDateStart?: string
  receivedDateEnd?: string
  storageCondition?: string
  operator?: string
}

export async function mockGetBatches(
  page: number = 1,
  pageSize: number = 10,
  filters?: BatchFilterParams
): Promise<PageResult<ReagentBatch>> {
  return new Promise((resolve) => {
    setTimeout(async () => {
      let batches = getBatchesFromStorage()

      batches = batches.map(updateBatchStatus)
      saveBatchesToStorage(batches)

      const reagents = await mockGetAllReagents()
      const reagentMap = new Map(reagents.map((r) => [r.id, r]))

      if (filters) {
        const {
          keyword,
          reagentId,
          status,
          storageLocation,
          productionDateStart,
          productionDateEnd,
          expiryDateStart,
          expiryDateEnd,
          receivedDateStart,
          receivedDateEnd,
          storageCondition,
        } = filters

        if (keyword) {
          const kw = keyword.toLowerCase()
          batches = batches.filter((b) => {
            const reagent = reagentMap.get(b.reagentId)
            return (
              b.batchNumber.toLowerCase().includes(kw) ||
              b.storageLocation.toLowerCase().includes(kw) ||
              reagent?.name.toLowerCase().includes(kw) ||
              reagent?.casNumber?.toLowerCase().includes(kw) ||
              reagent?.manufacturer?.toLowerCase().includes(kw) ||
              reagent?.brand?.toLowerCase().includes(kw) ||
              reagent?.catalogNumber?.toLowerCase().includes(kw)
            )
          })
        }

        if (reagentId) {
          batches = batches.filter((b) => b.reagentId === reagentId)
        }

        if (status) {
          batches = batches.filter((b) => b.status === status)
        }

        if (storageLocation) {
          const sl = storageLocation.toLowerCase()
          batches = batches.filter((b) => b.storageLocation.toLowerCase().includes(sl))
        }

        if (storageCondition) {
          batches = batches.filter((b) => {
            const reagent = reagentMap.get(b.reagentId)
            return reagent?.storageCondition === storageCondition
          })
        }

        if (productionDateStart) {
          const start = new Date(productionDateStart).getTime()
          batches = batches.filter((b) => new Date(b.productionDate).getTime() >= start)
        }

        if (productionDateEnd) {
          const end = new Date(productionDateEnd).getTime() + 24 * 60 * 60 * 1000
          batches = batches.filter((b) => new Date(b.productionDate).getTime() < end)
        }

        if (expiryDateStart) {
          const start = new Date(expiryDateStart).getTime()
          batches = batches.filter((b) => new Date(b.expiryDate).getTime() >= start)
        }

        if (expiryDateEnd) {
          const end = new Date(expiryDateEnd).getTime() + 24 * 60 * 60 * 1000
          batches = batches.filter((b) => new Date(b.expiryDate).getTime() < end)
        }

        if (receivedDateStart) {
          const start = new Date(receivedDateStart).getTime()
          batches = batches.filter((b) => new Date(b.receivedDate).getTime() >= start)
        }

        if (receivedDateEnd) {
          const end = new Date(receivedDateEnd).getTime() + 24 * 60 * 60 * 1000
          batches = batches.filter((b) => new Date(b.receivedDate).getTime() < end)
        }
      }

      batches.sort((a, b) => {
        const statusOrder: Record<string, number> = {
          warning: 0,
          expired: 1,
          frozen: 2,
          normal: 3,
          exhausted: 4,
        }
        const orderDiff = (statusOrder[a.status] || 0) - (statusOrder[b.status] || 0)
        if (orderDiff !== 0) return orderDiff
        return new Date(b.receivedDate).getTime() - new Date(a.receivedDate).getTime()
      })

      batches = batches.map((batch) => {
        const reagent = reagentMap.get(batch.reagentId)
        return {
          ...batch,
          reagentName: reagent?.name || batch.reagentName,
          unit: reagent?.unit || batch.unit,
        }
      })

      const start = (page - 1) * pageSize
      const list = batches.slice(start, start + pageSize)

      resolve({
        list,
        total: batches.length,
        page,
        pageSize,
      })
    }, 300)
  })
}

export function mockGetBatch(
  id: string
): Promise<(ReagentBatch & { operations: BatchOperation[] }) | null> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const batches = getBatchesFromStorage().map(updateBatchStatus)
      const batch = batches.find((b) => b.id === id)

      if (!batch) {
        resolve(null)
        return
      }

      const allOperations = getOperationsFromStorage()
      const operations = allOperations
        .filter((op) => op.batchId === id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

      resolve({ ...batch, operations })
    }, 300)
  })
}

export function mockCreateBatch(data: BatchFormData): Promise<ReagentBatch> {
  return new Promise((resolve) => {
    setTimeout(async () => {
      const batches = getBatchesFromStorage()
      const reagents = await mockGetAllReagents()
      const reagent = reagents.find((r) => r.id === data.reagentId)
      const user = getCurrentUser()

      const newBatch: ReagentBatch = updateBatchStatus({
        id: generateId(),
        reagentId: data.reagentId,
        reagentName: reagent?.name,
        batchNumber: data.batchNumber,
        productionDate: data.productionDate,
        expiryDate: data.expiryDate,
        initialQuantity: data.initialQuantity,
        remainingQuantity: data.initialQuantity,
        unit: reagent?.unit,
        storageLocation: data.storageLocation,
        receivedDate: data.receivedDate,
        status: 'normal',
        remark: data.remark,
      })

      batches.unshift(newBatch)
      saveBatchesToStorage(batches)

      const operations = getOperationsFromStorage()
      operations.unshift({
        id: generateId(),
        batchId: newBatch.id,
        type: 'in',
        quantity: data.initialQuantity,
        beforeQuantity: 0,
        afterQuantity: data.initialQuantity,
        operator: user?.id || '2',
        operatorName: user?.name || '李主任',
        purpose: '入库',
        createdAt: new Date().toISOString(),
      })
      saveOperationsToStorage(operations)

      addAuditLog({ module: 'batch', operationType: 'inbound', targetType: 'batch', targetId: newBatch.id, targetName: newBatch.batchNumber, beforeContent: `库存: 0 ${newBatch.unit || ''}`, afterContent: `库存: ${newBatch.initialQuantity} ${newBatch.unit || ''}`, remark: '新批次入库' })

      resolve(newBatch)
    }, 400)
  })
}

export function mockBatchOutbound(
  id: string,
  data: OutboundFormData
): Promise<BatchOperation> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const batches = getBatchesFromStorage()
      const index = batches.findIndex((b) => b.id === id)

      if (index === -1) {
        reject(new Error('批次不存在'))
        return
      }

      const batch = batches[index]
      if (batch.status === 'frozen') {
        reject(new Error('批次已冻结，无法出库'))
        return
      }
      if (batch.status === 'expired') {
        reject(new Error('批次已过期，无法出库'))
        return
      }
      if (batch.status === 'exhausted') {
        reject(new Error('批次已耗尽，无法出库'))
        return
      }
      if (batch.remainingQuantity < data.quantity) {
        reject(new Error('库存不足'))
        return
      }

      const user = getCurrentUser()
      const beforeQuantity = batch.remainingQuantity
      batch.remainingQuantity = Number(
        (batch.remainingQuantity - data.quantity).toFixed(2)
      )
      batches[index] = updateBatchStatus(batch)
      saveBatchesToStorage(batches)

      const operation: BatchOperation = {
        id: generateId(),
        batchId: id,
        type: 'out',
        quantity: data.quantity,
        beforeQuantity,
        afterQuantity: batch.remainingQuantity,
        operator: user?.id || '3',
        operatorName: user?.name || '王实验员',
        purpose: data.purpose,
        createdAt: new Date().toISOString(),
      }

      const operations = getOperationsFromStorage()
      operations.unshift(operation)
      saveOperationsToStorage(operations)

      addAuditLog({ module: 'batch', operationType: 'outbound', targetType: 'batch', targetId: id, targetName: batches[index].batchNumber, beforeContent: `库存: ${beforeQuantity} ${batch.unit || ''}`, afterContent: `库存: ${batch.remainingQuantity} ${batch.unit || ''}`, remark: data.purpose })

      resolve(operation)
    }, 300)
  })
}

export function mockBatchOperation(
  id: string,
  data: BatchOperationFormData
): Promise<BatchOperation> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const batches = getBatchesFromStorage()
      const index = batches.findIndex((b) => b.id === id)

      if (index === -1) {
        reject(new Error('批次不存在'))
        return
      }

      const batch = { ...batches[index] }
      const user = getCurrentUser()
      const beforeQuantity = batch.remainingQuantity
      let afterQuantity = beforeQuantity

      const validateQuantity = () => {
        if (data.quantity === undefined || data.quantity <= 0) {
          throw new Error('请输入有效数量')
        }
      }

      try {
        switch (data.type) {
          case 'return':
            if (batch.status === 'frozen') throw new Error('批次已冻结，无法退库')
            if (batch.status === 'expired') throw new Error('批次已过期，无法退库')
            if (batch.status === 'exhausted') throw new Error('批次已耗尽，无法退库')
            validateQuantity()
            afterQuantity = Number((beforeQuantity + data.quantity!).toFixed(2))
            batch.remainingQuantity = afterQuantity
            break

          case 'scrap':
            if (batch.status === 'exhausted') throw new Error('批次已耗尽，无需报废')
            validateQuantity()
            if (data.quantity! > beforeQuantity) throw new Error('报废数量不能超过库存')
            afterQuantity = Number((beforeQuantity - data.quantity!).toFixed(2))
            batch.remainingQuantity = afterQuantity
            break

          case 'transfer':
            if (batch.status === 'frozen') throw new Error('批次已冻结，无法调拨')
            if (batch.status === 'expired') throw new Error('批次已过期，无法调拨')
            if (batch.status === 'exhausted') throw new Error('批次已耗尽，无法调拨')
            validateQuantity()
            if (data.quantity! > beforeQuantity) throw new Error('调拨数量不能超过库存')
            if (!data.targetLocation?.trim()) throw new Error('请输入目标存放位置')
            afterQuantity = Number((beforeQuantity - data.quantity!).toFixed(2))
            batch.remainingQuantity = afterQuantity
            break

          case 'stock_in':
            if (batch.status === 'frozen') throw new Error('批次已冻结，无法盘盈')
            if (batch.status === 'expired') throw new Error('批次已过期，无法盘盈')
            if (batch.status === 'exhausted') throw new Error('批次已耗尽，无法盘盈')
            validateQuantity()
            afterQuantity = Number((beforeQuantity + data.quantity!).toFixed(2))
            batch.remainingQuantity = afterQuantity
            break

          case 'stock_out':
            if (batch.status === 'exhausted') throw new Error('批次已耗尽，无需盘亏')
            validateQuantity()
            if (data.quantity! > beforeQuantity) throw new Error('盘亏数量不能超过库存')
            afterQuantity = Number((beforeQuantity - data.quantity!).toFixed(2))
            batch.remainingQuantity = afterQuantity
            break

          case 'freeze':
            if (batch.status === 'frozen') throw new Error('批次已处于冻结状态')
            if (batch.status === 'expired') throw new Error('批次已过期，无法冻结')
            if (batch.status === 'exhausted') throw new Error('批次已耗尽，无法冻结')
            batch.status = 'frozen'
            break

          case 'unfreeze':
            if (batch.status !== 'frozen') throw new Error('批次未处于冻结状态')
            batch.status = recalculateStatus(batch).status
            break

          case 'open':
            if (batch.status === 'frozen') throw new Error('批次已冻结，无法开封')
            if (batch.status === 'expired') throw new Error('批次已过期，无法开封')
            if (batch.status === 'exhausted') throw new Error('批次已耗尽，无法开封')
            batch.openedAt = new Date().toISOString()
            break

          case 'retest':
            if (batch.status === 'frozen') throw new Error('批次已冻结，无法复测')
            if (batch.status === 'expired') throw new Error('批次已过期，无法复测')
            if (batch.status === 'exhausted') throw new Error('批次已耗尽，无法复测')
            batch.lastRetestAt = new Date().toISOString()
            break

          case 'extend_retest':
            if (batch.status === 'frozen') throw new Error('批次已冻结，无法延期复验')
            if (batch.status === 'exhausted') throw new Error('批次已耗尽，无法延期复验')
            if (!data.newExpiryDate) throw new Error('请选择新的有效期')
            batch.expiryDate = data.newExpiryDate
            batch.lastRetestAt = new Date().toISOString()
            batch.status = recalculateStatus(batch).status
            break

          default:
            throw new Error('未知操作类型')
        }
      } catch (e: any) {
        reject(e)
        return
      }

      batches[index] = batch.status !== 'frozen' ? updateBatchStatus(batch) : batch
      saveBatchesToStorage(batches)

      const operation: BatchOperation = {
        id: generateId(),
        batchId: id,
        type: data.type,
        quantity: data.quantity || 0,
        beforeQuantity,
        afterQuantity,
        operator: user?.id || '3',
        operatorName: user?.name || '王实验员',
        reason: data.reason,
        remark: data.remark,
        targetLocation: data.targetLocation,
        newExpiryDate: data.newExpiryDate,
        createdAt: new Date().toISOString(),
      }

      const operations = getOperationsFromStorage()
      operations.unshift(operation)
      saveOperationsToStorage(operations)

      addAuditLog({ module: 'batch', operationType: data.type, targetType: 'batch', targetId: id, targetName: batches[index].batchNumber, beforeContent: `库存: ${beforeQuantity} ${batches[index].unit || ''}`, afterContent: `库存: ${afterQuantity} ${batches[index].unit || ''}`, remark: data.reason || '' })

      resolve(operation)
    }, 300)
  })
}

export function mockGetExpiringBatches(days: number = 30): Promise<ReagentBatch[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const batches = getBatchesFromStorage().map(updateBatchStatus)
      const expiring = batches
        .filter((b) => {
          const expiryDays = getExpiryDays(b.expiryDate)
          return expiryDays <= days || b.status === 'expired'
        })
        .sort((a, b) => {
          const daysA = getExpiryDays(a.expiryDate)
          const daysB = getExpiryDays(b.expiryDate)
          return daysA - daysB
        })
        .slice(0, 10)

      resolve(expiring)
    }, 200)
  })
}

export function mockGetBatchStats(): Promise<{
  total: number
  normal: number
  warning: number
  expired: number
  exhausted: number
  frozen: number
}> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const batches = getBatchesFromStorage().map(updateBatchStatus)
      const stats = {
        total: batches.length,
        normal: 0,
        warning: 0,
        expired: 0,
        exhausted: 0,
        frozen: 0,
      }
      batches.forEach((b) => {
        stats[b.status]++
      })
      resolve(stats)
    }, 200)
  })
}

export function mockBatchDeleteBatches(ids: string[]): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const batches = getBatchesFromStorage()
      const filtered = batches.filter(b => !ids.includes(b.id))
      saveBatchesToStorage(filtered)

      const operations = getOperationsFromStorage()
      const filteredOps = operations.filter(o => !ids.includes(o.batchId))
      saveOperationsToStorage(filteredOps)

      addAuditLog({ module: 'batch', operationType: 'batch_delete', targetType: 'batch', targetId: ids.join(','), targetName: `批量删除${ids.length}个批次`, remark: '批量删除批次' })

      resolve()
    }, 300)
  })
}

export function mockBatchUpdateBatchLocation(ids: string[], storageLocation: string): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const batches = getBatchesFromStorage()
      const user = getCurrentUser()
      const operations = getOperationsFromStorage()

      const updatedBatches = batches.map(b => {
        if (ids.includes(b.id) && b.storageLocation !== storageLocation) {
          const operation: BatchOperation = {
            id: generateId(),
            batchId: b.id,
            type: 'transfer',
            quantity: b.remainingQuantity,
            beforeQuantity: b.remainingQuantity,
            afterQuantity: b.remainingQuantity,
            operator: user?.id || '3',
            operatorName: user?.name || '王实验员',
            reason: '批量调拨',
            remark: '',
            targetLocation: storageLocation,
            createdAt: new Date().toISOString(),
          }
          operations.unshift(operation)
          return { ...b, storageLocation }
        }
        return b
      })

      saveBatchesToStorage(updatedBatches)
      saveOperationsToStorage(operations)

      addAuditLog({ module: 'batch', operationType: 'transfer', targetType: 'batch', targetId: ids.join(','), targetName: `批量调拨库位`, afterContent: `目标库位: ${storageLocation}`, remark: `批量调拨${ids.length}个批次库位` })

      resolve()
    }, 300)
  })
}

export function mockBatchUpdateBatchStatus(ids: string[], status: 'freeze' | 'unfreeze'): Promise<void> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        const batches = getBatchesFromStorage()
        const user = getCurrentUser()
        const operations = getOperationsFromStorage()

        const updatedBatches = batches.map(b => {
          if (ids.includes(b.id)) {
            if (status === 'freeze') {
              if (b.status === 'expired' || b.status === 'exhausted' || b.status === 'frozen') {
                return b
              }
              const operation: BatchOperation = {
                id: generateId(),
                batchId: b.id,
                type: 'freeze',
                quantity: 0,
                beforeQuantity: b.remainingQuantity,
                afterQuantity: b.remainingQuantity,
                operator: user?.id || '3',
                operatorName: user?.name || '王实验员',
                reason: '批量冻结',
                remark: '',
                createdAt: new Date().toISOString(),
              }
              operations.unshift(operation)
              return { ...b, status: 'frozen' as const }
            } else {
              if (b.status !== 'frozen') {
                return b
              }
              const operation: BatchOperation = {
                id: generateId(),
                batchId: b.id,
                type: 'unfreeze',
                quantity: 0,
                beforeQuantity: b.remainingQuantity,
                afterQuantity: b.remainingQuantity,
                operator: user?.id || '3',
                operatorName: user?.name || '王实验员',
                reason: '批量解冻',
                remark: '',
                createdAt: new Date().toISOString(),
              }
              operations.unshift(operation)
              return recalculateStatus(b)
            }
          }
          return b
        })

        saveBatchesToStorage(updatedBatches)
        saveOperationsToStorage(operations)

        addAuditLog({ module: 'batch', operationType: status === 'freeze' ? 'freeze' : 'unfreeze', targetType: 'batch', targetId: ids.join(','), targetName: status === 'freeze' ? '批量冻结' : '批量解冻', afterContent: `操作: ${status === 'freeze' ? '冻结' : '解冻'}`, remark: `批量${status === 'freeze' ? '冻结' : '解冻'}${ids.length}个批次` })

        resolve()
      } catch (e: any) {
        reject(e)
      }
    }, 300)
  })
}

export interface BatchImportResultItem {
  row: number
  success: boolean
  message: string
  data?: Record<string, any>
}

export interface BatchImportResult {
  total: number
  success: number
  failed: number
  items: BatchImportResultItem[]
}

function validateBatchData(rowData: Record<string, any>, reagents: any[]): string[] {
  const errors: string[] = []
  if (!rowData['试剂名称'] || !String(rowData['试剂名称']).trim()) {
    errors.push('试剂名称不能为空')
  } else {
    const reagent = reagents.find(r => r.name === rowData['试剂名称'])
    if (!reagent) {
      errors.push(`试剂「${rowData['试剂名称']}」不存在`)
    }
  }
  if (!rowData['批次号'] || !String(rowData['批次号']).trim()) {
    errors.push('批次号不能为空')
  }
  if (!rowData['生产日期']) {
    errors.push('生产日期不能为空')
  }
  if (!rowData['有效期至']) {
    errors.push('有效期至不能为空')
  }
  if (!rowData['初始数量'] || isNaN(Number(rowData['初始数量'])) || Number(rowData['初始数量']) <= 0) {
    errors.push('初始数量必须大于0')
  }
  if (!rowData['库位'] || !String(rowData['库位']).trim()) {
    errors.push('库位不能为空')
  }
  return errors
}

function parseCsvContent(content: string): string[][] {
  const lines = content.split(/\r?\n/).filter(line => line.trim())
  return lines.map(line => {
    const result: string[] = []
    let current = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = !inQuotes
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current)
        current = ''
      } else {
        current += char
      }
    }
    result.push(current)
    return result
  })
}

export async function mockBatchImportBatches(file: File): Promise<BatchImportResult> {
  return new Promise(async (resolve, reject) => {
    try {
      const reagents = await mockGetAllReagents()

      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string
          const rows = parseCsvContent(content)
          if (rows.length < 2) {
            reject(new Error('文件格式不正确或数据为空'))
            return
          }

          const headers = rows[0]
          const dataRows = rows.slice(1)

          const batches = getBatchesFromStorage()
          const now = new Date().toISOString()
          const result: BatchImportResult = {
            total: dataRows.length,
            success: 0,
            failed: 0,
            items: [],
          }

          dataRows.forEach((row, index) => {
            const rowData: Record<string, string> = {}
            headers.forEach((header, i) => {
              rowData[header.trim()] = row[i] || ''
            })

            const rowNum = index + 2
            const errors = validateBatchData(rowData, reagents)

            if (errors.length > 0) {
              result.failed++
              result.items.push({
                row: rowNum,
                success: false,
                message: errors.join('；'),
              })
            } else {
              const reagent = reagents.find(r => r.name === rowData['试剂名称'])!
              const initialQty = Number(rowData['初始数量'])
              const newBatch: ReagentBatch = {
                id: generateId(),
                reagentId: reagent.id,
                reagentName: reagent.name,
                batchNumber: String(rowData['批次号']).trim(),
                productionDate: String(rowData['生产日期']),
                expiryDate: String(rowData['有效期至']),
                initialQuantity: initialQty,
                remainingQuantity: initialQty,
                unit: reagent.unit,
                storageLocation: String(rowData['库位']).trim(),
                receivedDate: rowData['入库日期'] || now,
                status: 'normal',
                remark: rowData['备注'] || '',
              }
              const updatedBatch = updateBatchStatus(newBatch)
              batches.unshift(updatedBatch)
              result.success++
              result.items.push({
                row: rowNum,
                success: true,
                message: '导入成功',
                data: updatedBatch,
              })
            }
          })

          saveBatchesToStorage(batches)
          resolve(result)
        } catch (err: any) {
          reject(new Error('文件解析失败：' + err.message))
        }
      }
      reader.onerror = () => reject(new Error('文件读取失败'))
      reader.readAsText(file, 'UTF-8')
    } catch (err: any) {
      reject(err)
    }
  })
}

export function downloadBatchTemplate(): void {
  const headers = ['试剂名称', '批次号', '生产日期', '有效期至', '初始数量', '库位', '入库日期', '备注']
  const sampleRow = ['牛血清白蛋白 BSA', 'BSA20250101', '2025-01-01', '2026-12-31', '100', 'A-01-03', '2025-06-01', '首批入库']

  const csvContent = [
    headers.join(','),
    sampleRow.map(v => `"${v}"`).join(','),
  ].join('\n')

  const BOM = '\uFEFF'
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', '批次导入模板.csv')
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export interface BatchFilterParams {
  keyword?: string
  reagentId?: string
  status?: string
  storageLocation?: string
  storageCondition?: string
  operator?: string
  productionDateStart?: string
  productionDateEnd?: string
  expiryDateStart?: string
  expiryDateEnd?: string
  receivedDateStart?: string
  receivedDateEnd?: string
}

export async function mockExportAllBatches(filters?: BatchFilterParams): Promise<ReagentBatch[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      let batches = getBatchesFromStorage().map(updateBatchStatus)

      if (filters) {
        const {
          keyword,
          reagentId,
          status,
          storageLocation,
          productionDateStart,
          productionDateEnd,
          expiryDateStart,
          expiryDateEnd,
          receivedDateStart,
          receivedDateEnd,
        } = filters

        if (keyword) {
          const kw = keyword.toLowerCase()
          batches = batches.filter(
            (b) =>
              b.batchNumber.toLowerCase().includes(kw) ||
              b.reagentName?.toLowerCase().includes(kw) ||
              b.storageLocation.toLowerCase().includes(kw)
          )
        }

        if (reagentId) {
          batches = batches.filter((b) => b.reagentId === reagentId)
        }

        if (status) {
          batches = batches.filter((b) => b.status === status)
        }

        if (storageLocation) {
          const sl = storageLocation.toLowerCase()
          batches = batches.filter((b) => b.storageLocation.toLowerCase().includes(sl))
        }

        if (productionDateStart) {
          const start = new Date(productionDateStart).getTime()
          batches = batches.filter((b) => new Date(b.productionDate).getTime() >= start)
        }

        if (productionDateEnd) {
          const end = new Date(productionDateEnd).getTime() + 24 * 60 * 60 * 1000
          batches = batches.filter((b) => new Date(b.productionDate).getTime() < end)
        }

        if (expiryDateStart) {
          const start = new Date(expiryDateStart).getTime()
          batches = batches.filter((b) => new Date(b.expiryDate).getTime() >= start)
        }

        if (expiryDateEnd) {
          const end = new Date(expiryDateEnd).getTime() + 24 * 60 * 60 * 1000
          batches = batches.filter((b) => new Date(b.expiryDate).getTime() < end)
        }

        if (receivedDateStart) {
          const start = new Date(receivedDateStart).getTime()
          batches = batches.filter((b) => new Date(b.receivedDate).getTime() >= start)
        }

        if (receivedDateEnd) {
          const end = new Date(receivedDateEnd).getTime() + 24 * 60 * 60 * 1000
          batches = batches.filter((b) => new Date(b.receivedDate).getTime() < end)
        }
      }

      batches.sort((a, b) => new Date(b.receivedDate).getTime() - new Date(a.receivedDate).getTime())
      resolve(batches)
    }, 300)
  })
}
