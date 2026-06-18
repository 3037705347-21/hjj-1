export type BatchStatus = 'normal' | 'warning' | 'expired' | 'exhausted'

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
  receivedDate: string
  status: BatchStatus
  remark?: string
}

export interface BatchOperation {
  id: string
  batchId: string
  type: 'in' | 'out'
  quantity: number
  operator: string
  operatorName: string
  purpose?: string
  createdAt: string
}

export interface BatchFormData {
  reagentId: string
  batchNumber: string
  productionDate: string
  expiryDate: string
  initialQuantity: number
  storageLocation: string
  receivedDate: string
  remark?: string
}

export interface OutboundFormData {
  quantity: number
  purpose: string
}

export const batchStatusLabels: Record<BatchStatus, string> = {
  normal: '正常',
  warning: '即将过期',
  expired: '已过期',
  exhausted: '已耗尽',
}

export const batchStatusColors: Record<BatchStatus, string> = {
  normal: 'bg-success-50 text-success-600',
  warning: 'bg-warning-50 text-warning-600',
  expired: 'bg-danger-50 text-danger-600',
  exhausted: 'bg-neutral-100 text-neutral-500',
}
