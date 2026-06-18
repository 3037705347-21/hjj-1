import type { DashboardStats, CategoryStat, TrendDataItem } from '@/types/common'
import { mockGetAllReagents } from './reagents'
import { mockGetBatchStats } from './batches'
import { mockGetLowStockCount } from './consumables'

export async function mockGetDashboardStats(): Promise<DashboardStats> {
  return new Promise(async (resolve) => {
    setTimeout(async () => {
      const reagents = await mockGetAllReagents()
      const batchStats = await mockGetBatchStats()
      const lowStockCount = await mockGetLowStockCount()
      
      const categoryMap = new Map<string, number>()
      reagents.forEach(r => {
        const count = categoryMap.get(r.category) || 0
        categoryMap.set(r.category, count + 1)
      })
      
      const categoryStats: CategoryStat[] = Array.from(categoryMap.entries())
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
      
      resolve({
        reagentCount: reagents.length,
        consumableCount: 25,
        expiringCount: batchStats.warning + batchStats.expired,
        lowStockCount: lowStockCount,
        categoryStats,
        trendData,
      })
    }, 400)
  })
}
