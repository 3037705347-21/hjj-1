export type RequisitionStatus = 'pending' | 'approved' | 'rejected' | 'outbound' | 'used' | 'cancelled'

export type MaterialType = 'reagent' | 'consumable'

export interface RequisitionItem {
  id: string
  materialType: MaterialType
  materialId: string
  materialName: string
  specification: string
  unit: string
  expectedQuantity: number
  actualQuantity?: number
  stockBefore?: number
  stockAfter?: number
  unitPrice?: number
  totalCost?: number
}

export interface Requisition {
  id: string
  requestCode: string
  projectName: string
  projectCode: string
  topicCode: string
  topicName: string
  applicantId: string
  applicantName: string
  department?: string
  usagePurpose: string
  usageTime: string
  items: RequisitionItem[]
  status: RequisitionStatus
  approverId?: string
  approverName?: string
  approveTime?: string
  rejectReason?: string
  outboundOperatorId?: string
  outboundOperatorName?: string
  outboundTime?: string
  usageRegisteredBy?: string
  usageRegisteredByName?: string
  usageRegisterTime?: string
  remark?: string
  createdAt: string
  updatedAt: string
}

export interface RequisitionFormData {
  projectName: string
  projectCode: string
  topicCode: string
  topicName: string
  usagePurpose: string
  usageTime: string
  items: Omit<RequisitionItem, 'id' | 'actualQuantity' | 'stockBefore' | 'stockAfter'>[]
  remark?: string
}

export interface RequisitionFilterParams {
  keyword?: string
  status?: RequisitionStatus | ''
  projectName?: string
  topicCode?: string
  applicantName?: string
  materialType?: MaterialType | ''
  startTime?: string
  endTime?: string
}

export interface RequisitionStats {
  totalRequisitions: number
  pendingCount: number
  approvedCount: number
  outboundCount: number
  usedCount: number
  totalReagentUsage: number
  totalConsumableUsage: number
}

export interface ProjectConsumptionStat {
  projectName: string
  projectCode: string
  totalItems: number
  totalQuantity: number
  reagentQuantity: number
  consumableQuantity: number
  totalCost: number
  reagentCost: number
  consumableCost: number
}

export interface TopicCostStat {
  topicCode: string
  topicName: string
  totalRequisitions: number
  totalQuantity: number
  totalCost: number
  reagentCost: number
  consumableCost: number
}

export interface UserUsageStat {
  userId: string
  userName: string
  department?: string
  requisitionCount: number
  totalItems: number
  reagentCount: number
  consumableCount: number
  totalCost: number
  reagentCost: number
  consumableCost: number
}

export const requisitionStatusLabels: Record<RequisitionStatus, string> = {
  pending: '待审批',
  approved: '已通过',
  rejected: '已驳回',
  outbound: '已出库',
  used: '已登记',
  cancelled: '已取消',
}

export const requisitionStatusColors: Record<RequisitionStatus, string> = {
  pending: 'bg-warning-50 text-warning-600',
  approved: 'bg-success-50 text-success-600',
  rejected: 'bg-danger-50 text-danger-600',
  outbound: 'bg-primary-50 text-primary-600',
  used: 'bg-emerald-50 text-emerald-600',
  cancelled: 'bg-gray-100 text-gray-500',
}

export const materialTypeLabels: Record<MaterialType, string> = {
  reagent: '试剂',
  consumable: '耗材',
}

export const materialTypeColors: Record<MaterialType, string> = {
  reagent: 'bg-purple-50 text-purple-600',
  consumable: 'bg-blue-50 text-blue-600',
}

export const projectOptions = [
  { code: 'PRJ-2026-001', name: '肿瘤标志物检测研究' },
  { code: 'PRJ-2026-002', name: '基因编辑效率优化' },
  { code: 'PRJ-2026-003', name: '新型抗体药物筛选' },
  { code: 'PRJ-2026-004', name: '细胞信号通路分析' },
  { code: 'PRJ-2025-010', name: '微生物耐药性监测' },
]

export const topicOptions = [
  { code: 'TPC-2026-A01', name: '蛋白质组学分析', projectCode: 'PRJ-2026-001' },
  { code: 'TPC-2026-A02', name: 'Western Blot验证', projectCode: 'PRJ-2026-001' },
  { code: 'TPC-2026-B01', name: 'CRISPR-Cas9切割效率', projectCode: 'PRJ-2026-002' },
  { code: 'TPC-2026-B02', name: '基因转染条件优化', projectCode: 'PRJ-2026-002' },
  { code: 'TPC-2026-C01', name: '单克隆抗体筛选', projectCode: 'PRJ-2026-003' },
  { code: 'TPC-2026-D01', name: 'MAPK通路激活检测', projectCode: 'PRJ-2026-004' },
  { code: 'TPC-2025-E01', name: '耐药菌株鉴定', projectCode: 'PRJ-2025-010' },
]
