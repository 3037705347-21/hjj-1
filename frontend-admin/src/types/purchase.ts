import type { UserRole } from './user'

export type PurchaseItemType = 'reagent' | 'consumable'

export type PurchaseRequestStatus =
  | 'draft'
  | 'pending'
  | 'approving'
  | 'approved'
  | 'rejected'
  | 'purchasing'
  | 'partial_received'
  | 'fully_received'
  | 'completed'
  | 'returned'
  | 'cancelled'

export type PurchaseOrderStatus =
  | 'pending'
  | 'purchasing'
  | 'partial_received'
  | 'fully_received'
  | 'completed'
  | 'returned'
  | 'cancelled'

export type PurchaseReceiveStatus = 'pending' | 'partial' | 'full'

export interface PurchaseItem {
  id: string
  itemType: PurchaseItemType
  itemId: string
  itemName: string
  specification: string
  casNo?: string
  category?: string
  unit: string
  quantity: number
  unitPrice?: number
  totalPrice?: number
  manufacturer?: string
  brand?: string
  receivedQuantity: number
  returnedQuantity: number
  remark?: string
}

export interface ApprovalComment {
  approverId: string
  approverName: string
  action: 'approve' | 'reject'
  comment?: string
  createdAt: string
}

export interface PurchaseRequest {
  id: string
  requestNo: string
  title: string
  applicantId: string
  applicantName: string
  applicantRole: UserRole
  department?: string
  status: PurchaseRequestStatus
  statusLabel?: string
  itemType: PurchaseItemType
  items: PurchaseItem[]
  totalQuantity: number
  totalAmount?: number
  expectedDeliveryDate?: string
  purpose: string
  reason: string
  approverId?: string
  approverName?: string
  approveTime?: string
  approveRemark?: string
  rejectReason?: string
  purchaseOrderId?: string
  purchaseOrderNo?: string
  submitTime?: string
  approvalComments?: ApprovalComment[]
  createdAt: string
  updatedAt: string
}

export interface PurchaseOrder {
  id: string
  orderNo: string
  title: string
  requestId: string
  requestNo: string
  purchaserId?: string
  purchaserName?: string
  supplier?: string
  status: PurchaseOrderStatus
  statusLabel?: string
  itemType: PurchaseItemType
  items: PurchaseItem[]
  totalQuantity: number
  totalAmount?: number
  expectedDeliveryDate?: string
  actualDeliveryDate?: string
  orderDate?: string
  remark?: string
  receivedQuantity: number
  returnedQuantity: number
  createdAt: string
  updatedAt: string
}

export interface PurchaseReceiveRecord {
  id: string
  orderId: string
  itemId: string
  itemName: string
  receivedQuantity: number
  unit: string
  receivedDate: string
  receiverId: string
  receiverName: string
  batchNumber?: string
  productionDate?: string
  expiryDate?: string
  storageLocation?: string
  remark?: string
  stockInStatus: 'pending' | 'completed' | 'failed'
  stockInId?: string
  stockInTime?: string
  createdAt: string
}

export interface PurchaseReturnRecord {
  id: string
  orderId: string
  itemId: string
  itemName: string
  returnedQuantity: number
  unit: string
  returnedDate: string
  returnerId: string
  returnerName: string
  reason: string
  remark?: string
  createdAt: string
}

export interface PurchaseRequestFormData {
  title: string
  itemType: PurchaseItemType
  items: Omit<PurchaseItem, 'id' | 'receivedQuantity' | 'returnedQuantity'>[]
  expectedDeliveryDate?: string
  purpose: string
  reason: string
}

export interface PurchaseOrderFormData {
  title: string
  supplier?: string
  purchaserId?: string
  purchaserName?: string
  orderDate?: string
  expectedDeliveryDate?: string
  remark?: string
}

export interface PurchaseReceiveFormData {
  itemId: string
  itemName: string
  receivedQuantity: number
  unit: string
  receivedDate: string
  batchNumber?: string
  productionDate?: string
  expiryDate?: string
  storageLocation?: string
  remark?: string
}

export interface PurchaseReturnFormData {
  itemId: string
  itemName: string
  returnedQuantity: number
  unit: string
  returnedDate: string
  reason: string
  remark?: string
}

export interface PurchaseFilterParams {
  keyword?: string
  status?: PurchaseRequestStatus | PurchaseOrderStatus | ''
  itemType?: PurchaseItemType | ''
  applicantId?: string
  applicantName?: string
  startTime?: string
  endTime?: string
}

export const purchaseItemTypeLabels: Record<PurchaseItemType, string> = {
  reagent: '试剂',
  consumable: '耗材',
}

export const purchaseRequestStatusLabels: Record<PurchaseRequestStatus, string> = {
  draft: '草稿',
  pending: '申请中',
  approving: '审批中',
  approved: '审批通过',
  rejected: '已驳回',
  purchasing: '采购中',
  partial_received: '部分到货',
  fully_received: '全部到货',
  completed: '已完成',
  returned: '已退货',
  cancelled: '已取消',
}

export const purchaseRequestStatusColors: Record<PurchaseRequestStatus, string> = {
  draft: 'bg-gray-100 text-gray-600',
  pending: 'bg-info-100 text-info-600',
  approving: 'bg-warning-100 text-warning-600',
  approved: 'bg-primary-100 text-primary-600',
  rejected: 'bg-danger-100 text-danger-600',
  purchasing: 'bg-primary-100 text-primary-600',
  partial_received: 'bg-warning-100 text-warning-600',
  fully_received: 'bg-success-100 text-success-600',
  completed: 'bg-success-100 text-success-600',
  returned: 'bg-danger-100 text-danger-600',
  cancelled: 'bg-gray-100 text-gray-600',
}

export const purchaseOrderStatusLabels: Record<PurchaseOrderStatus, string> = {
  pending: '待采购',
  purchasing: '采购中',
  partial_received: '部分到货',
  fully_received: '全部到货',
  completed: '已完成',
  returned: '已退货',
  cancelled: '已取消',
}

export const purchaseOrderStatusColors: Record<PurchaseOrderStatus, string> = {
  pending: 'bg-gray-100 text-gray-600',
  purchasing: 'bg-primary-100 text-primary-600',
  partial_received: 'bg-warning-100 text-warning-600',
  fully_received: 'bg-success-100 text-success-600',
  completed: 'bg-success-100 text-success-600',
  returned: 'bg-danger-100 text-danger-600',
  cancelled: 'bg-gray-100 text-gray-600',
}

export interface PurchaseStats {
  totalRequests: number
  pendingApproval: number
  purchasing: number
  partialReceived: number
  fullyReceived: number
  completed: number
  returned: number
  rejected: number
  totalOrders: number
  pendingOrders: number
  purchasingOrders: number
  partialReceivedOrders: number
  fullyReceivedOrders: number
  completedOrders: number
  returnedOrders: number
}
