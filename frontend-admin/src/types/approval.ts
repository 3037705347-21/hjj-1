import type { UserRole } from './user'

export type ApprovalType =
  | 'reagent_create'
  | 'reagent_delete'
  | 'batch_inbound'
  | 'batch_outbound'
  | 'batch_delete'
  | 'consumable_create'
  | 'consumable_delete'
  | 'consumable_adjust'
  | 'system_config'
  | 'alert_rule'
  | 'requisition_apply'

export type ApprovalStatus = 'pending' | 'approved' | 'rejected'

export interface ApprovalRecord {
  id: string
  type: ApprovalType
  title: string
  applicantId: string
  applicantName: string
  applicantRole: UserRole
  approverId?: string
  approverName?: string
  status: ApprovalStatus
  statusLabel?: string
  rejectReason?: string
  targetType: string
  targetId: string
  targetName: string
  beforeContent?: string
  afterContent?: string
  remark?: string
  submitTime: string
  approveTime?: string
  createdAt: string
  updatedAt: string
}

export interface ApprovalSubmitFormData {
  type: ApprovalType
  title: string
  targetType: string
  targetId: string
  targetName: string
  beforeContent?: string
  afterContent?: string
  remark?: string
}

export interface ApprovalFilterParams {
  keyword?: string
  type?: ApprovalType | ''
  status?: ApprovalStatus | ''
  applicantId?: string
  applicantName?: string
  startTime?: string
  endTime?: string
}

export const approvalTypeLabels: Record<ApprovalType, string> = {
  reagent_create: '试剂新增',
  reagent_delete: '试剂删除',
  batch_inbound: '批次入库',
  batch_outbound: '批次出库',
  batch_delete: '批次删除',
  consumable_create: '耗材新增',
  consumable_delete: '耗材删除',
  consumable_adjust: '耗材库存调整',
  system_config: '系统配置修改',
  alert_rule: '预警规则修改',
  requisition_apply: '实验领用申请',
}

export const approvalStatusLabels: Record<ApprovalStatus, string> = {
  pending: '待审批',
  approved: '已通过',
  rejected: '已驳回',
}

export const approvalStatusColors: Record<ApprovalStatus, string> = {
  pending: 'bg-warning-50 text-warning-600',
  approved: 'bg-success-50 text-success-600',
  rejected: 'bg-danger-50 text-danger-600',
}
