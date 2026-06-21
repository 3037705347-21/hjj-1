export type StockTakeStatus = 'pending' | 'in_progress' | 'to_confirm' | 'completed'

export type StockTakeDimension = 'location' | 'category' | 'reagent' | 'consumable' | 'batch'

export type StockTakeItemType = 'reagent' | 'consumable'

export type DifferenceResult = 'surplus' | 'deficit' | 'no_diff'

export interface StockTakeItem {
  id: string
  stockTakeId: string
  itemType: StockTakeItemType
  itemId: string
  itemName: string
  category?: string
  specification?: string
  batchNumber?: string
  storageLocation: string
  locationId?: string
  unit: string
  bookQuantity: number
  actualQuantity: number | null
  difference: number
  differenceResult: DifferenceResult | null
  checkedBy?: string
  checkedByName?: string
  checkedAt?: string
  remark?: string
}

export interface StockTake {
  id: string
  stockTakeNo: string
  title: string
  dimension: StockTakeDimension
  dimensionValue?: string
  dimensionValueLabel?: string
  itemType: StockTakeItemType | 'all'
  status: StockTakeStatus
  statusLabel?: string
  totalItems: number
  checkedItems: number
  surplusCount: number
  deficitCount: number
  noDiffCount: number
  assigneeId?: string
  assigneeName?: string
  creatorId: string
  creatorName: string
  startTime?: string
  endTime?: string
  confirmTime?: string
  confirmedBy?: string
  confirmedByName?: string
  confirmRemark?: string
  remark?: string
  items: StockTakeItem[]
  createdAt: string
  updatedAt: string
}

export interface StockTakeFormData {
  title: string
  dimension: StockTakeDimension
  dimensionValue?: string
  itemType: StockTakeItemType | 'all'
  assigneeId?: string
  assigneeName?: string
  remark?: string
}

export interface StockTakeItemUpdateData {
  actualQuantity: number
  remark?: string
}

export interface StockTakeConfirmData {
  confirmRemark?: string
  handleSurplus: boolean
  handleDeficit: boolean
}

export interface StockAdjustmentRecord {
  id: string
  stockTakeId: string
  stockTakeNo: string
  itemId: string
  itemName: string
  itemType: StockTakeItemType
  batchNumber?: string
  storageLocation: string
  locationId?: string
  unit: string
  adjustType: 'surplus' | 'deficit'
  adjustQuantity: number
  beforeQuantity: number
  afterQuantity: number
  operatorId: string
  operatorName: string
  reason: string
  remark?: string
  createdAt: string
}

export interface StockTakeFilterParams {
  keyword?: string
  status?: StockTakeStatus | ''
  dimension?: StockTakeDimension | ''
  itemType?: StockTakeItemType | 'all' | ''
  assigneeId?: string
  creatorId?: string
  startTime?: string
  endTime?: string
}

export const stockTakeStatusLabels: Record<StockTakeStatus, string> = {
  pending: '待开始',
  in_progress: '盘点中',
  to_confirm: '待确认',
  completed: '已完成',
}

export const stockTakeStatusColors: Record<StockTakeStatus, string> = {
  pending: 'bg-gray-100 text-gray-600',
  in_progress: 'bg-primary-100 text-primary-600',
  to_confirm: 'bg-warning-100 text-warning-600',
  completed: 'bg-success-100 text-success-600',
}

export const stockTakeDimensionLabels: Record<StockTakeDimension, string> = {
  location: '库位',
  category: '分类',
  reagent: '试剂',
  consumable: '耗材',
  batch: '批次',
}

export const stockTakeItemTypeLabels: Record<StockTakeItemType | 'all', string> = {
  reagent: '试剂',
  consumable: '耗材',
  all: '全部',
}

export const differenceResultLabels: Record<DifferenceResult, string> = {
  surplus: '盘盈',
  deficit: '盘亏',
  no_diff: '无差异',
}

export const differenceResultColors: Record<DifferenceResult, string> = {
  surplus: 'bg-success-100 text-success-700',
  deficit: 'bg-danger-100 text-danger-700',
  no_diff: 'bg-gray-100 text-gray-600',
}

export interface StockTakeStats {
  total: number
  pending: number
  inProgress: number
  toConfirm: number
  completed: number
  totalItems: number
  totalSurplus: number
  totalDeficit: number
}
