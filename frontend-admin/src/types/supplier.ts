import type { PurchaseOrder } from './purchase'

export type SupplierStatus = 'active' | 'inactive' | 'pending' | 'blacklisted'

export type SupplierRating = 'A' | 'B' | 'C' | 'D'

export interface SupplierQualification {
  id: string
  supplierId: string
  name: string
  type: string
  fileUrl: string
  fileName: string
  fileSize?: number
  expireDate?: string
  issuedDate?: string
  remark?: string
  createdAt: string
}

export interface SupplierPriceHistory {
  id: string
  supplierId: string
  itemType: 'reagent' | 'consumable'
  itemId: string
  itemName: string
  specification: string
  unit: string
  unitPrice: number
  quoteDate: string
  validFrom?: string
  validTo?: string
  remark?: string
}

export interface SupplierDeliveryRecord {
  id: string
  supplierId: string
  orderId: string
  orderNo: string
  expectedDate: string
  actualDate: string
  isOnTime: boolean
  delayDays?: number
  items: Array<{
    itemId: string
    itemName: string
    quantity: number
    receivedQuantity: number
  }>
  remark?: string
}

export interface SupplierExceptionRecord {
  id: string
  supplierId: string
  type: 'quality' | 'delivery' | 'price' | 'service' | 'other'
  title: string
  description: string
  orderId?: string
  orderNo?: string
  status: 'pending' | 'processing' | 'resolved' | 'closed'
  level: 'low' | 'medium' | 'high'
  handler?: string
  handlerName?: string
  createdAt: string
  resolvedAt?: string
  resolution?: string
}

export interface Supplier {
  id: string
  name: string
  shortName?: string
  contactPerson: string
  contactPhone: string
  contactEmail?: string
  address: string
  mainCategories: string[]
  paymentTerms: string
  status: SupplierStatus
  rating: SupplierRating
  bankAccount?: string
  bankName?: string
  taxNumber?: string
  businessLicense?: string
  establishedDate?: string
  registeredCapital?: string
  website?: string
  remark?: string
  totalOrders: number
  totalAmount: number
  onTimeDeliveryRate: number
  qualityPassRate: number
  createdAt: string
  updatedAt: string
}

export interface SupplierFormData {
  name: string
  shortName?: string
  contactPerson: string
  contactPhone: string
  contactEmail?: string
  address: string
  mainCategories: string[]
  paymentTerms: string
  status: SupplierStatus
  rating: SupplierRating
  bankAccount?: string
  bankName?: string
  taxNumber?: string
  businessLicense?: string
  establishedDate?: string
  registeredCapital?: string
  website?: string
  remark?: string
}

export interface SupplierDetail extends Supplier {
  qualifications: SupplierQualification[]
  priceHistory: SupplierPriceHistory[]
  deliveryRecords: SupplierDeliveryRecord[]
  exceptionRecords: SupplierExceptionRecord[]
  purchaseOrders: PurchaseOrder[]
}

export interface SupplierFilterParams {
  keyword?: string
  status?: SupplierStatus | ''
  rating?: SupplierRating | ''
  mainCategory?: string
  paymentTerms?: string
  createTimeStart?: string
  createTimeEnd?: string
  updateTimeStart?: string
  updateTimeEnd?: string
}

export const supplierStatusLabels: Record<SupplierStatus, string> = {
  active: '合作中',
  inactive: '已停用',
  pending: '待审核',
  blacklisted: '黑名单',
}

export const supplierStatusColors: Record<SupplierStatus, string> = {
  active: 'bg-success-100 text-success-700',
  inactive: 'bg-gray-100 text-gray-600',
  pending: 'bg-warning-100 text-warning-700',
  blacklisted: 'bg-danger-100 text-danger-700',
}

export const supplierRatingLabels: Record<SupplierRating, string> = {
  A: '优秀',
  B: '良好',
  C: '一般',
  D: '较差',
}

export const supplierRatingColors: Record<SupplierRating, string> = {
  A: 'bg-emerald-100 text-emerald-700',
  B: 'bg-blue-100 text-blue-700',
  C: 'bg-yellow-100 text-yellow-700',
  D: 'bg-red-100 text-red-700',
}

export const qualificationTypes = [
  '营业执照',
  '税务登记证',
  '组织机构代码证',
  '医疗器械经营许可证',
  'GMP认证',
  'ISO认证',
  '其他资质',
]

export const mainCategories = [
  '试剂类',
  '耗材类',
  '仪器设备',
  '玻璃器皿',
  '防护用品',
  '其他',
]

export const paymentTermsOptions = [
  '月结30天',
  '月结60天',
  '月结90天',
  '货到付款',
  '款到发货',
  '其他',
]

export const exceptionTypeLabels: Record<SupplierExceptionRecord['type'], string> = {
  quality: '质量问题',
  delivery: '交货问题',
  price: '价格问题',
  service: '服务问题',
  other: '其他问题',
}

export const exceptionStatusLabels: Record<SupplierExceptionRecord['status'], string> = {
  pending: '待处理',
  processing: '处理中',
  resolved: '已解决',
  closed: '已关闭',
}

export const exceptionLevelLabels: Record<SupplierExceptionRecord['level'], string> = {
  low: '低',
  medium: '中',
  high: '高',
}
