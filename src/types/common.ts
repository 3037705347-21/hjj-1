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
  trendData: TrendDataItem[]
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
