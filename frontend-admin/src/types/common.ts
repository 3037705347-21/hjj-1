export interface PageResult<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

export interface PageQuery {
  page?: number
  pageSize?: number
  keyword?: string
  category?: string
}

export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

export interface DashboardStats {
  reagentCount: number
  consumableCount: number
  expiringCount: number
  lowStockCount: number
  categoryStats: CategoryStat[]
  consumableCategoryStats: CategoryStat[]
  trendData: TrendDataItem[]
  expiringBatches: ExpiringBatchRankItem[]
  lowStockConsumables: LowStockConsumableRankItem[]
  topUsedReagents: TopUsedItem[]
  topUsedConsumables: TopUsedItem[]
}

export interface CategoryStat {
  name: string
  value: number
}

export interface TrendDataItem {
  date: string
  inbound: number
  outbound: number
}

export interface ExpiringBatchRankItem {
  id: string
  reagentName: string
  batchNumber: string
  expiryDate: string
  remainingQuantity: number
  unit: string
  expiryDays: number
}

export interface LowStockConsumableRankItem {
  id: string
  name: string
  stockQuantity: number
  safetyStock: number
  unit: string
  category: string
}

export interface TopUsedItem {
  id: string
  name: string
  usageCount: number
  category?: string
  unit?: string
}
