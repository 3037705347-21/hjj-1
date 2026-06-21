export interface Consumable {
  id: string
  name: string
  category: string
  specification: string
  unit: string
  stockQuantity: number
  safetyStock: number
  manufacturer?: string
  location?: string
  description?: string
  supplierIds?: string[]
  defaultSupplierId?: string
  unitPrice?: number
  createdAt: string
  updatedAt: string
}

export interface ConsumableFormData {
  name: string
  category: string
  specification: string
  unit: string
  stockQuantity: number
  safetyStock: number
  manufacturer?: string
  location?: string
  description?: string
  supplierIds?: string[]
  defaultSupplierId?: string
}

export type ConsumableOperationType =
  | 'stock_in'
  | 'stock_out'
  | 'receive'
  | 'use'
  | 'return'
  | 'scrap'
  | 'transfer'
  | 'adjust'

export interface ConsumableOperation {
  id: string
  consumableId: string
  consumableName: string
  type: ConsumableOperationType
  quantity: number
  beforeQuantity: number
  afterQuantity: number
  operator: string
  operatorName: string
  purpose?: string
  reason?: string
  remark?: string
  targetLocation?: string
  adjustType?: 'increase' | 'decrease'
  createdAt: string
}

export interface ConsumableOperationFormData {
  type: ConsumableOperationType
  quantity: number
  purpose?: string
  reason?: string
  remark?: string
  targetLocation?: string
  adjustType?: 'increase' | 'decrease'
}

export interface ConsumableQueryParams {
  keyword?: string
  category?: string
  operationType?: ConsumableOperationType | ''
  operator?: string
  startTime?: string
  endTime?: string
}

export interface ConsumptionTrendPoint {
  date: string
  used: number
  received: number
}

export const consumableCategories = [
  '离心管',
  '吸头',
  '培养皿',
  'PCR板',
  '手套',
  '口罩',
  '滤纸',
  '封口膜',
  '其他',
]

export const operationTypeLabels: Record<ConsumableOperationType, string> = {
  stock_in: '入库',
  stock_out: '领用出库',
  receive: '采购入库',
  use: '使用消耗',
  return: '退库',
  scrap: '报损',
  transfer: '调拨',
  adjust: '库存调整',
}

export const operationTypeColors: Record<ConsumableOperationType, string> = {
  stock_in: 'bg-success-100 text-success-700',
  stock_out: 'bg-primary-100 text-primary-700',
  receive: 'bg-success-100 text-success-700',
  use: 'bg-primary-100 text-primary-700',
  return: 'bg-success-100 text-success-700',
  scrap: 'bg-danger-100 text-danger-700',
  transfer: 'bg-info-100 text-info-700',
  adjust: 'bg-warning-100 text-warning-700',
}

export interface OperationTypeConfig {
  type: ConsumableOperationType
  label: string
  requiresQuantity: boolean
  requiresTargetLocation: boolean
  requiresPurpose: boolean
  requiresReason: boolean
  requiresAdjustType: boolean
}

export const operationTypeConfigs: OperationTypeConfig[] = [
  {
    type: 'stock_in',
    label: '入库',
    requiresQuantity: true,
    requiresTargetLocation: false,
    requiresPurpose: false,
    requiresReason: false,
    requiresAdjustType: false,
  },
  {
    type: 'use',
    label: '领用',
    requiresQuantity: true,
    requiresTargetLocation: false,
    requiresPurpose: true,
    requiresReason: false,
    requiresAdjustType: false,
  },
  {
    type: 'return',
    label: '退库',
    requiresQuantity: true,
    requiresTargetLocation: false,
    requiresPurpose: false,
    requiresReason: true,
    requiresAdjustType: false,
  },
  {
    type: 'scrap',
    label: '报损',
    requiresQuantity: true,
    requiresTargetLocation: false,
    requiresPurpose: false,
    requiresReason: true,
    requiresAdjustType: false,
  },
  {
    type: 'transfer',
    label: '调拨',
    requiresQuantity: true,
    requiresTargetLocation: true,
    requiresPurpose: false,
    requiresReason: false,
    requiresAdjustType: false,
  },
  {
    type: 'adjust',
    label: '库存调整',
    requiresQuantity: true,
    requiresTargetLocation: false,
    requiresPurpose: false,
    requiresReason: true,
    requiresAdjustType: true,
  },
]
