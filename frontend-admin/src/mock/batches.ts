import type { ReagentBatch, BatchOperation, BatchFormData, OutboundFormData } from '@/types/batch'
import type { PageResult } from '@/types/common'
import { generateId, getExpiryDays, isExpired, isExpiringSoon } from '@/utils/date'
import { mockGetAllReagents } from './reagents'

const BATCH_STORAGE_KEY = 'mock_batches'
const OPERATION_STORAGE_KEY = 'mock_batch_operations'

function getBatchesFromStorage(): ReagentBatch[] {
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

function getOperationsFromStorage(): BatchOperation[] {
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

function updateBatchStatus(batch: ReagentBatch): ReagentBatch {
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
      operator: '2',
      operatorName: '李主任',
      purpose: '入库',
      createdAt: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    })
  }
  
  saveOperationsToStorage(operations)
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

export async function mockGetBatches(
  page: number = 1,
  pageSize: number = 10,
  reagentId?: string,
  status?: string
): Promise<PageResult<ReagentBatch>> {
  return new Promise((resolve) => {
    setTimeout(async () => {
      let batches = getBatchesFromStorage()
      
      batches = batches.map(updateBatchStatus)
      saveBatchesToStorage(batches)
      
      if (reagentId) {
        batches = batches.filter(b => b.reagentId === reagentId)
      }
      
      if (status) {
        batches = batches.filter(b => b.status === status)
      }
      
      batches.sort((a, b) => {
        const statusOrder = { warning: 0, expired: 1, normal: 2, exhausted: 3 }
        const orderDiff = statusOrder[a.status] - statusOrder[b.status]
        if (orderDiff !== 0) return orderDiff
        return new Date(b.receivedDate).getTime() - new Date(a.receivedDate).getTime()
      })
      
      const reagents = await mockGetAllReagents()
      const reagentMap = new Map(reagents.map(r => [r.id, r]))
      
      batches = batches.map(batch => {
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

export function mockGetBatch(id: string): Promise<(ReagentBatch & { operations: BatchOperation[] }) | null> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const batches = getBatchesFromStorage().map(updateBatchStatus)
      const batch = batches.find(b => b.id === id)
      
      if (!batch) {
        resolve(null)
        return
      }
      
      const allOperations = getOperationsFromStorage()
      const operations = allOperations
        .filter(op => op.batchId === id)
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
      const reagent = reagents.find(r => r.id === data.reagentId)
      
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
        operator: '2',
        operatorName: '李主任',
        purpose: '入库',
        createdAt: new Date().toISOString(),
      })
      saveOperationsToStorage(operations)
      
      resolve(newBatch)
    }, 400)
  })
}

export function mockBatchOutbound(id: string, data: OutboundFormData): Promise<BatchOperation> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const batches = getBatchesFromStorage()
      const index = batches.findIndex(b => b.id === id)
      
      if (index === -1) {
        reject(new Error('批次不存在'))
        return
      }
      
      const batch = batches[index]
      if (batch.remainingQuantity < data.quantity) {
        reject(new Error('库存不足'))
        return
      }
      
      batch.remainingQuantity = Number((batch.remainingQuantity - data.quantity).toFixed(2))
      batches[index] = updateBatchStatus(batch)
      saveBatchesToStorage(batches)
      
      const operation: BatchOperation = {
        id: generateId(),
        batchId: id,
        type: 'out',
        quantity: data.quantity,
        operator: '3',
        operatorName: '王实验员',
        purpose: data.purpose,
        createdAt: new Date().toISOString(),
      }
      
      const operations = getOperationsFromStorage()
      operations.unshift(operation)
      saveOperationsToStorage(operations)
      
      resolve(operation)
    }, 300)
  })
}

export function mockGetExpiringBatches(days: number = 30): Promise<ReagentBatch[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const batches = getBatchesFromStorage().map(updateBatchStatus)
      const expiring = batches
        .filter(b => {
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

export function mockGetBatchStats(): Promise<{ total: number; normal: number; warning: number; expired: number; exhausted: number }> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const batches = getBatchesFromStorage().map(updateBatchStatus)
      const stats = {
        total: batches.length,
        normal: 0,
        warning: 0,
        expired: 0,
        exhausted: 0,
      }
      batches.forEach(b => {
        stats[b.status]++
      })
      resolve(stats)
    }, 200)
  })
}
