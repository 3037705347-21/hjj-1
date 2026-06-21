export type BatchStatus = 'normal' | 'warning' | 'expired' | 'exhausted' | 'frozen'

export type BatchOperationType =
  | 'in'
  | 'out'
  | 'return'
  | 'scrap'
  | 'transfer'
  | 'stock_in'
  | 'stock_out'
  | 'freeze'
  | 'unfreeze'
  | 'open'
  | 'retest'
  | 'extend_retest'

export interface ReagentBatch {
  id: string
  reagentId: string
  reagentName?: string
  batchNumber: string
  productionDate: string
  expiryDate: string
  initialQuantity: number
  remainingQuantity: number
  unit?: string
  storageLocation: string
  locationId?: string
  receivedDate: string
  status: BatchStatus
  remark?: string
  openedAt?: string
  lastRetestAt?: string
  nextRetestAt?: string
}

export interface BatchOperation {
  id: string
  batchId: string
  type: BatchOperationType
  quantity: number
  beforeQuantity: number
  afterQuantity: number
  operator: string
  operatorName: string
  purpose?: string
  reason?: string
  remark?: string
  targetLocation?: string
  newExpiryDate?: string
  createdAt: string
}

export interface BatchFormData {
  reagentId: string
  batchNumber: string
  productionDate: string
  expiryDate: string
  initialQuantity: number
  storageLocation: string
  locationId?: string
  receivedDate: string
  remark?: string
}

export interface OutboundFormData {
  quantity: number
  purpose: string
}

export interface BatchOperationFormData {
  type: BatchOperationType
  quantity?: number
  reason?: string
  remark?: string
  targetLocation?: string
  newExpiryDate?: string
}

export const batchStatusLabels: Record<BatchStatus, string> = {
  normal: '正常',
  warning: '近效期',
  expired: '已过期',
  exhausted: '已耗尽',
  frozen: '已冻结',
}

export const batchStatusColors: Record<BatchStatus, string> = {
  normal: 'bg-success-50 text-success-600',
  warning: 'bg-warning-50 text-warning-600',
  expired: 'bg-danger-50 text-danger-600',
  exhausted: 'bg-neutral-100 text-neutral-500',
  frozen: 'bg-info-50 text-info-600',
}

export const operationTypeLabels: Record<BatchOperationType, string> = {
  in: '入库',
  out: '出库',
  return: '退库',
  scrap: '报废',
  transfer: '调拨',
  stock_in: '盘盈',
  stock_out: '盘亏',
  freeze: '冻结',
  unfreeze: '解冻',
  open: '开封登记',
  retest: '复测登记',
  extend_retest: '延期复验',
}

export const operationTypeColors: Record<BatchOperationType, string> = {
  in: 'bg-success-100 text-success-700',
  out: 'bg-primary-100 text-primary-700',
  return: 'bg-success-100 text-success-700',
  scrap: 'bg-danger-100 text-danger-700',
  transfer: 'bg-info-100 text-info-700',
  stock_in: 'bg-success-100 text-success-700',
  stock_out: 'bg-warning-100 text-warning-700',
  freeze: 'bg-info-100 text-info-700',
  unfreeze: 'bg-info-100 text-info-700',
  open: 'bg-neutral-100 text-neutral-700',
  retest: 'bg-neutral-100 text-neutral-700',
  extend_retest: 'bg-neutral-100 text-neutral-700',
}

export interface OperationTypeConfig {
  type: BatchOperationType
  label: string
  icon: string
  requiresQuantity: boolean
  requiresTargetLocation: boolean
  requiresNewExpiryDate: boolean
  disabledStatuses: BatchStatus[]
}

export const operationTypeConfigs: OperationTypeConfig[] = [
  {
    type: 'return',
    label: '退库',
    icon: 'ArrowUpCircle',
    requiresQuantity: true,
    requiresTargetLocation: false,
    requiresNewExpiryDate: false,
    disabledStatuses: ['expired', 'exhausted'],
  },
  {
    type: 'scrap',
    label: '报废',
    icon: 'Trash2',
    requiresQuantity: true,
    requiresTargetLocation: false,
    requiresNewExpiryDate: false,
    disabledStatuses: ['exhausted'],
  },
  {
    type: 'transfer',
    label: '调拨',
    icon: 'ArrowLeftRight',
    requiresQuantity: true,
    requiresTargetLocation: true,
    requiresNewExpiryDate: false,
    disabledStatuses: ['expired', 'exhausted', 'frozen'],
  },
  {
    type: 'stock_in',
    label: '盘盈',
    icon: 'PlusCircle',
    requiresQuantity: true,
    requiresTargetLocation: false,
    requiresNewExpiryDate: false,
    disabledStatuses: ['expired', 'exhausted'],
  },
  {
    type: 'stock_out',
    label: '盘亏',
    icon: 'MinusCircle',
    requiresQuantity: true,
    requiresTargetLocation: false,
    requiresNewExpiryDate: false,
    disabledStatuses: ['exhausted'],
  },
  {
    type: 'freeze',
    label: '冻结',
    icon: 'Snowflake',
    requiresQuantity: false,
    requiresTargetLocation: false,
    requiresNewExpiryDate: false,
    disabledStatuses: ['expired', 'exhausted', 'frozen'],
  },
  {
    type: 'unfreeze',
    label: '解冻',
    icon: 'Sun',
    requiresQuantity: false,
    requiresTargetLocation: false,
    requiresNewExpiryDate: false,
    disabledStatuses: ['expired', 'exhausted'],
  },
  {
    type: 'open',
    label: '开封登记',
    icon: 'PackageOpen',
    requiresQuantity: false,
    requiresTargetLocation: false,
    requiresNewExpiryDate: false,
    disabledStatuses: ['expired', 'exhausted', 'frozen'],
  },
  {
    type: 'retest',
    label: '复测登记',
    icon: 'ClipboardCheck',
    requiresQuantity: false,
    requiresTargetLocation: false,
    requiresNewExpiryDate: false,
    disabledStatuses: ['expired', 'exhausted', 'frozen'],
  },
  {
    type: 'extend_retest',
    label: '延期复验',
    icon: 'CalendarClock',
    requiresQuantity: false,
    requiresTargetLocation: false,
    requiresNewExpiryDate: true,
    disabledStatuses: ['exhausted', 'frozen'],
  },
]
