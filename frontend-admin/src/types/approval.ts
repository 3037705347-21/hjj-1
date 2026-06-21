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
  | 'requisition_hazardous'
  | 'requisition_overlimit'
  | 'purchase_request'
  | 'scrap_apply'
  | 'inventory_adjust'

export type ApprovalStatus =
  | 'draft'
  | 'pending'
  | 'approving'
  | 'approved'
  | 'rejected'
  | 'returned'
  | 'withdrawn'
  | 'completed'

export type ApprovalNodeStatus =
  | 'pending'
  | 'current'
  | 'approved'
  | 'rejected'
  | 'skipped'
  | 'transferred'

export type ApprovalActionType =
  | 'submit'
  | 'approve'
  | 'reject'
  | 'return'
  | 'transfer'
  | 'cc'
  | 'withdraw'
  | 'comment'

export interface ApprovalNode {
  id: string
  name: string
  order: number
  approverId: string
  approverName: string
  approverRole?: UserRole
  status: ApprovalNodeStatus
  actionTime?: string
  comment?: string
  isAutoApprove?: boolean
}

export interface ApprovalHistoryRecord {
  id: string
  nodeName: string
  actionType: ApprovalActionType
  operatorId: string
  operatorName: string
  operatorRole?: UserRole
  actionTime: string
  comment?: string
  toUserId?: string
  toUserName?: string
}

export interface CcRecord {
  id: string
  userId: string
  userName: string
  isRead: boolean
  readTime?: string
  ccTime: string
}

export interface ApprovalFlowTemplate {
  id: string
  name: string
  approvalType: ApprovalType
  nodes: ApprovalFlowTemplateNode[]
  isEnabled: boolean
}

export interface ApprovalFlowTemplateNode {
  id: string
  name: string
  order: number
  approverRole?: UserRole
  approverId?: string
  approverName?: string
  isAutoApprove?: boolean
}

export interface ApprovalRecord {
  id: string
  type: ApprovalType
  title: string
  applicantId: string
  applicantName: string
  applicantRole: UserRole
  applicantDepartment?: string
  status: ApprovalStatus
  statusLabel?: string
  rejectReason?: string
  currentNodeId?: string
  currentNodeName?: string
  currentApproverId?: string
  currentApproverName?: string
  nodes: ApprovalNode[]
  history: ApprovalHistoryRecord[]
  ccList: CcRecord[]
  targetType: string
  targetId: string
  targetName: string
  targetSummary?: string
  beforeContent?: string
  afterContent?: string
  remark?: string
  submitTime?: string
  approveTime?: string
  completeTime?: string
  createdAt: string
  updatedAt: string
}

export interface ApprovalSubmitFormData {
  type: ApprovalType
  title: string
  targetType: string
  targetId: string
  targetName: string
  targetSummary?: string
  beforeContent?: string
  afterContent?: string
  remark?: string
  ccUserIds?: string[]
}

export interface ApprovalFilterParams {
  keyword?: string
  type?: ApprovalType | ''
  status?: ApprovalStatus | ''
  applicantId?: string
  applicantName?: string
  approverId?: string
  startTime?: string
  endTime?: string
  view?: 'pending' | 'initiated' | 'processed' | 'all'
}

export interface ApproveActionData {
  comment?: string
  ccUserIds?: string[]
}

export interface RejectActionData {
  reason: string
  returnToFirst?: boolean
  comment?: string
}

export interface TransferActionData {
  toUserId: string
  toUserName: string
  comment?: string
}

export interface CcActionData {
  userIds: string[]
  comment?: string
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
  requisition_apply: '普通领用申请',
  requisition_hazardous: '危险试剂领用',
  requisition_overlimit: '超量领用申请',
  purchase_request: '采购申请',
  scrap_apply: '报废申请',
  inventory_adjust: '库存调整',
}

export const approvalTypeGroups: Record<string, ApprovalType[]> = {
  '采购管理': ['purchase_request'],
  '领用管理': ['requisition_apply', 'requisition_hazardous', 'requisition_overlimit'],
  '库存管理': ['batch_inbound', 'batch_outbound', 'batch_delete', 'consumable_adjust', 'inventory_adjust', 'scrap_apply'],
  '物料管理': ['reagent_create', 'reagent_delete', 'consumable_create', 'consumable_delete'],
  '系统管理': ['system_config', 'alert_rule'],
}

export const approvalStatusLabels: Record<ApprovalStatus, string> = {
  draft: '草稿',
  pending: '待审批',
  approving: '审批中',
  approved: '已通过',
  rejected: '已驳回',
  returned: '已退回',
  withdrawn: '已撤回',
  completed: '已完成',
}

export const approvalStatusColors: Record<ApprovalStatus, string> = {
  draft: 'bg-gray-100 text-gray-600',
  pending: 'bg-warning-50 text-warning-600',
  approving: 'bg-blue-50 text-blue-600',
  approved: 'bg-success-50 text-success-600',
  rejected: 'bg-danger-50 text-danger-600',
  returned: 'bg-orange-50 text-orange-600',
  withdrawn: 'bg-gray-100 text-gray-500',
  completed: 'bg-success-50 text-success-600',
}

export const nodeStatusLabels: Record<ApprovalNodeStatus, string> = {
  pending: '待审批',
  current: '审批中',
  approved: '已通过',
  rejected: '已驳回',
  skipped: '已跳过',
  transferred: '已转交',
}

export const nodeStatusColors: Record<ApprovalNodeStatus, string> = {
  pending: 'bg-gray-100 text-gray-400 border-gray-200',
  current: 'bg-primary-100 text-primary-600 border-primary-300',
  approved: 'bg-success-100 text-success-600 border-success-300',
  rejected: 'bg-danger-100 text-danger-600 border-danger-300',
  skipped: 'bg-gray-50 text-gray-400 border-gray-100',
  transferred: 'bg-orange-100 text-orange-600 border-orange-300',
}

export const actionTypeLabels: Record<ApprovalActionType, string> = {
  submit: '提交申请',
  approve: '审批通过',
  reject: '审批驳回',
  return: '退回修改',
  transfer: '转交审批',
  cc: '抄送',
  withdraw: '撤回申请',
  comment: '添加评论',
}

export const actionTypeColors: Record<ApprovalActionType, string> = {
  submit: 'bg-primary-100 text-primary-600',
  approve: 'bg-success-100 text-success-600',
  reject: 'bg-danger-100 text-danger-600',
  return: 'bg-orange-100 text-orange-600',
  transfer: 'bg-blue-100 text-blue-600',
  cc: 'bg-gray-100 text-gray-600',
  withdraw: 'bg-gray-100 text-gray-500',
  comment: 'bg-gray-100 text-gray-600',
}

export interface ApprovalStats {
  pendingCount: number
  initiatedCount: number
  processedCount: number
  approvedCount: number
  rejectedCount: number
  ccCount: number
}

export interface ApprovalUserOption {
  id: string
  name: string
  role: UserRole
  department?: string
}
