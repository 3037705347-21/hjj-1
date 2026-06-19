import type {
  DashboardStats,
  CategoryStat,
  TrendDataItem,
  ExpiringBatchRankItem,
  LowStockConsumableRankItem,
  TopUsedItem,
} from '@/types/common'
import type { ReagentBatch, BatchOperation } from '@/types/batch'
import type { ConsumableOperation } from '@/types/consumable'
import { mockGetAllReagents } from './reagents'
import {
  mockGetBatchStats,
  getBatchesFromStorage,
  updateBatchStatus,
  getOperationsFromStorage as getBatchOperations,
} from './batches'
import {
  mockGetLowStockCount,
  getConsumablesFromStorage,
  getOperationsFromStorage as getConsumableOperations,
} from './consumables'
import { getExpiryDays } from '@/utils/date'

export function mockGetDashboardStats(): Promise<DashboardStats> {
  return new Promise((resolve) => {
    setTimeout(async () => {
      const reagents = await mockGetAllReagents()
      const batchStats = await mockGetBatchStats()
      const lowStockCount = await mockGetLowStockCount()
      const batches = getBatchesFromStorage().map(updateBatchStatus)
      const consumables = getConsumablesFromStorage()
      const consumableOps = getConsumableOperations() as ConsumableOperation[]
      const batchOps = getBatchOperations() as BatchOperation[]

      const reagentCategoryMap = new Map<string, number>()
      reagents.forEach((r) => {
        const count = reagentCategoryMap.get(r.category) || 0
        reagentCategoryMap.set(r.category, count + 1)
      })

      const categoryStats: CategoryStat[] = Array.from(reagentCategoryMap.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)

      const consumableCategoryMap = new Map<string, number>()
      consumables.forEach((c) => {
        const count = consumableCategoryMap.get(c.category) || 0
        consumableCategoryMap.set(c.category, count + 1)
      })

      const consumableCategoryStats: CategoryStat[] = Array.from(consumableCategoryMap.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)

      const today = new Date()
      const trendData: TrendDataItem[] = []
      for (let i = 29; i >= 0; i--) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        const dateStr = date.toISOString().split('T')[0]
        trendData.push({
          date: dateStr.slice(5),
          inbound: Math.floor(Math.random() * 50) + 10,
          outbound: Math.floor(Math.random() * 40) + 5,
        })
      }

      const expiringBatches: ExpiringBatchRankItem[] = batches
        .filter((b: ReagentBatch) => {
          const days = getExpiryDays(b.expiryDate)
          return days <= 30 || b.status === 'expired'
        })
        .map((b: ReagentBatch) => ({
          id: b.id,
          reagentName: b.reagentName || '',
          batchNumber: b.batchNumber,
          expiryDate: b.expiryDate,
          remainingQuantity: b.remainingQuantity,
          unit: b.unit || '',
          expiryDays: getExpiryDays(b.expiryDate),
        }))
        .sort((a, b) => a.expiryDays - b.expiryDays)
        .slice(0, 8)

      const lowStockConsumables: LowStockConsumableRankItem[] = consumables
        .filter((c) => c.stockQuantity <= c.safetyStock)
        .map((c) => ({
          id: c.id,
          name: c.name,
          stockQuantity: c.stockQuantity,
          safetyStock: c.safetyStock,
          unit: c.unit,
          category: c.category,
        }))
        .sort((a, b) => a.stockQuantity - b.stockQuantity)
        .slice(0, 8)

      const reagentUsageMap = new Map<string, { name: string; count: number; unit: string }>()
      batchOps
        .filter((op: BatchOperation) => op.type === 'out')
        .forEach((op: BatchOperation) => {
          const batch = batches.find((b: ReagentBatch) => b.id === op.batchId)
          if (batch) {
            const existing = reagentUsageMap.get(batch.reagentId)
            if (existing) {
              existing.count += op.quantity
            } else {
              reagentUsageMap.set(batch.reagentId, {
                name: batch.reagentName || '',
                count: op.quantity,
                unit: batch.unit || '',
              })
            }
          }
        })

      let topUsedReagents: TopUsedItem[] = Array.from(reagentUsageMap.entries())
        .map(([id, data]) => ({
          id,
          name: data.name,
          usageCount: data.count,
          unit: data.unit,
        }))
        .sort((a, b) => b.usageCount - a.usageCount)
        .slice(0, 8)

      if (topUsedReagents.length === 0) {
        const sampleReagents = reagents.slice(0, 5)
        sampleReagents.forEach((r, idx) => {
          topUsedReagents.push({
            id: r.id,
            name: r.name,
            usageCount: Math.floor(Math.random() * 80) + 20 - idx * 10,
            unit: r.unit,
          })
        })
      }

      const consumableUsageMap = new Map<
        string,
        { name: string; count: number; unit: string; category: string }
      >()
      consumableOps
        .filter((op: ConsumableOperation) => op.type === 'use' || op.type === 'stock_out')
        .forEach((op: ConsumableOperation) => {
          const consumable = consumables.find((c) => c.id === op.consumableId)
          if (consumable) {
            const existing = consumableUsageMap.get(op.consumableId)
            if (existing) {
              existing.count += op.quantity
            } else {
              consumableUsageMap.set(op.consumableId, {
                name: consumable.name,
                count: op.quantity,
                unit: consumable.unit,
                category: consumable.category,
              })
            }
          }
        })

      const topUsedConsumables: TopUsedItem[] = Array.from(consumableUsageMap.entries())
        .map(([id, data]) => ({
          id,
          name: data.name,
          usageCount: data.count,
          category: data.category,
          unit: data.unit,
        }))
        .sort((a, b) => b.usageCount - a.usageCount)
        .slice(0, 8)

      resolve({
        reagentCount: reagents.length,
        consumableCount: consumables.length,
        expiringCount: batchStats.warning + batchStats.expired,
        lowStockCount,
        categoryStats,
        consumableCategoryStats,
        trendData,
        expiringBatches,
        lowStockConsumables,
        topUsedReagents,
        topUsedConsumables,
      })
    }, 400)
  })
}
