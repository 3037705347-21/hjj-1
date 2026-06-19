import type { UserRole } from './user'

export type AuditModule =
  | 'auth'
  | 'reagent'
  | 'batch'
  | 'consumable'
  | 'alert'
  | 'approval'
  | 'system'

export type AuditOperationType =
  | 'login'
  | 'logout'
  | 'login_fail'
  | 'create'
  | 'update'
  | 'delete'
  | 'batch_delete'
  | 'batch_update'
  | 'import'
  | 'export'
  | 'inbound'
  | 'outbound'
  | 'stock_in'
  | 'stock_out'
  | 'use'
  | 'return'
  | 'scrap'
  | 'transfer'
  | 'freeze'
  | 'unfreeze'
  | 'open'
  | 'retest'
  | 'extend_retest'
  | 'adjust'
  | 'handle'
  | 'resolve'
  | 'ignore'
  | 'assign'
  | 'read'
  | 'toggle_rule'
  | 'update_rule'
  | 'config_change'
  | 'approval_submit'
  | 'approval_approve'
  | 'approval_reject'
  | 'in'
  | 'out'
  | 'receive'

export interface AuditLog {
  id: string
  operatorId: string
  operatorName: string
  operatorRole: UserRole
  operationTime: string
  module: AuditModule
  operationType: AuditOperationType
  targetType: string
  targetId: string
  targetName: string
  beforeContent: string
  afterContent: string
  terminalInfo: string
  remark: string
}

export interface AuditLogFormData {
  module: AuditModule
  operationType: AuditOperationType
  targetType: string
  targetId: string
  targetName: string
  beforeContent?: string
  afterContent?: string
  remark?: string
}

export const auditModuleLabels: Record<AuditModule, string> = {
  auth: '认证授权',
  reagent: '试剂管理',
  batch: '批次管理',
  consumable: '耗材管理',
  alert: '预警中心',
  approval: '审批管理',
  system: '系统配置',
}

export const auditOperationTypeLabels: Record<AuditOperationType, string> = {
  login: '登录',
  logout: '退出',
  login_fail: '登录失败',
  create: '新增',
  update: '编辑',
  delete: '删除',
  batch_delete: '批量删除',
  batch_update: '批量更新',
  import: '导入',
  export: '导出',
  inbound: '入库',
  outbound: '出库',
  in: '入库',
  out: '出库',
  stock_in: '入库',
  stock_out: '盘亏',
  use: '领用',
  return: '退库',
  scrap: '报废/报损',
  transfer: '调拨',
  freeze: '冻结',
  unfreeze: '解冻',
  open: '开封',
  retest: '复测',
  extend_retest: '延期复验',
  adjust: '库存调整',
  handle: '处理',
  resolve: '解决',
  ignore: '忽略',
  assign: '转派',
  read: '标记已读',
  toggle_rule: '切换规则状态',
  update_rule: '更新规则',
  config_change: '配置变更',
  approval_submit: '提交审批',
  approval_approve: '审批通过',
  approval_reject: '审批驳回',
  receive: '采购入库',
}

export interface AuditLogFilterParams {
  keyword?: string
  module?: AuditModule | ''
  operationType?: AuditOperationType | ''
  operatorId?: string
  operatorName?: string
  startTime?: string
  endTime?: string
}
