import type { UserRole } from './user'

export type PermissionCode =
  | 'dashboard:view'
  | 'user:manage'
  | 'role:manage'
  | 'system:config'
  | 'reagent:view'
  | 'reagent:create'
  | 'reagent:edit'
  | 'reagent:delete'
  | 'batch:view'
  | 'batch:create'
  | 'batch:edit'
  | 'batch:delete'
  | 'batch:outbound'
  | 'batch:operate'
  | 'consumable:view'
  | 'consumable:create'
  | 'consumable:edit'
  | 'consumable:delete'
  | 'consumable:operate'
  | 'consumable:use'
  | 'alert:view'
  | 'alert:handle'
  | 'alert:assign'
  | 'alert:rule:edit'
  | 'alert:rule:manage'
  | 'audit:view'
  | 'audit:export'
  | 'approval:view'
  | 'approval:submit'
  | 'approval:handle'
  | 'approval:approve'
  | 'purchase:request:view'
  | 'purchase:request:create'
  | 'purchase:request:edit'
  | 'purchase:request:delete'
  | 'purchase:request:submit'
  | 'purchase:request:approve'
  | 'purchase:order:view'
  | 'purchase:order:create'
  | 'purchase:order:edit'
  | 'purchase:order:receive'
  | 'purchase:order:return'
  | 'purchase:order:complete'
  | 'supplier:view'
  | 'supplier:create'
  | 'supplier:edit'
  | 'supplier:delete'
  | 'supplier:qualification:manage'
  | 'supplier:evaluation:view'
  | 'requisition:view'
  | 'requisition:create'
  | 'requisition:approve'
  | 'requisition:outbound'
  | 'requisition:register'
  | 'requisition:statistics'
  | 'stocktake:view'
  | 'stocktake:create'
  | 'stocktake:edit'
  | 'stocktake:delete'
  | 'stocktake:count'
  | 'stocktake:confirm'
  | 'stocktake:export'
  | 'stocktake:adjust'
  | 'location:view'
  | 'location:create'
  | 'location:edit'
  | 'location:delete'
  | 'location:transfer'
  | 'location:status'

export type DataScope = 'all' | 'lab' | 'department' | 'group' | 'self'

export interface PermissionConfig {
  code: PermissionCode
  label: string
  description?: string
}

export const permissionLabels: Record<PermissionCode, string> = {
  'dashboard:view': '查看仪表盘',
  'user:manage': '用户管理',
  'role:manage': '角色管理',
  'system:config': '系统配置',
  'reagent:view': '查看试剂',
  'reagent:create': '新增试剂',
  'reagent:edit': '编辑试剂',
  'reagent:delete': '删除试剂',
  'batch:view': '查看批次',
  'batch:create': '录入批次',
  'batch:edit': '编辑批次',
  'batch:delete': '删除批次',
  'batch:outbound': '批次出库',
  'batch:operate': '批次操作(冻结/报废/调拨等)',
  'consumable:view': '查看耗材',
  'consumable:create': '新增耗材',
  'consumable:edit': '编辑耗材',
  'consumable:delete': '删除耗材',
  'consumable:operate': '耗材操作(入库/调拨/报废)',
  'consumable:use': '耗材领用',
  'alert:view': '查看预警',
  'alert:handle': '处理预警',
  'alert:assign': '转派预警',
  'alert:rule:edit': '编辑预警规则',
  'alert:rule:manage': '管理预警规则',
  'audit:view': '查看审计日志',
  'audit:export': '导出审计日志',
  'approval:view': '查看审批',
  'approval:submit': '提交审批',
  'approval:handle': '处理审批',
  'approval:approve': '审批通过/驳回',
  'purchase:request:view': '查看采购申请',
  'purchase:request:create': '创建采购申请',
  'purchase:request:edit': '编辑采购申请',
  'purchase:request:delete': '删除采购申请',
  'purchase:request:submit': '提交采购申请',
  'purchase:request:approve': '审批采购申请',
  'purchase:order:view': '查看采购单',
  'purchase:order:create': '创建采购单',
  'purchase:order:edit': '编辑采购单',
  'purchase:order:receive': '采购到货登记',
  'purchase:order:return': '采购退货',
  'purchase:order:complete': '完成采购单',
  'supplier:view': '查看供应商',
  'supplier:create': '新增供应商',
  'supplier:edit': '编辑供应商',
  'supplier:delete': '删除供应商',
  'supplier:qualification:manage': '管理资质附件',
  'supplier:evaluation:view': '查看供应商评价',
  'requisition:view': '查看领用记录',
  'requisition:create': '创建领用申请',
  'requisition:approve': '审批领用申请',
  'requisition:outbound': '领用出库',
  'requisition:register': '使用登记',
  'requisition:statistics': '消耗统计',
  'stocktake:view': '查看盘点任务',
  'stocktake:create': '创建盘点任务',
  'stocktake:edit': '编辑盘点任务',
  'stocktake:delete': '删除盘点任务',
  'stocktake:count': '录入实盘数量',
  'stocktake:confirm': '确认盘点结果',
  'stocktake:export': '导出盘点报表',
  'stocktake:adjust': '库存调整',
  'location:view': '查看库位',
  'location:create': '新增库位',
  'location:edit': '编辑库位',
  'location:delete': '删除库位',
  'location:transfer': '库位调拨',
  'location:status': '启用/停用库位',
}

export const dataScopeLabels: Record<DataScope, string> = {
  all: '全部数据',
  lab: '本实验室',
  department: '本部门',
  group: '本课题组',
  self: '仅本人',
}

export const rolePermissions: Record<UserRole, PermissionCode[]> = {
  admin: [
    'dashboard:view',
    'user:manage',
    'role:manage',
    'system:config',
    'reagent:view',
    'reagent:create',
    'reagent:edit',
    'reagent:delete',
    'batch:view',
    'batch:create',
    'batch:edit',
    'batch:delete',
    'batch:outbound',
    'batch:operate',
    'consumable:view',
    'consumable:create',
    'consumable:edit',
    'consumable:delete',
    'consumable:operate',
    'consumable:use',
    'alert:view',
    'alert:handle',
    'alert:assign',
    'alert:rule:edit',
    'alert:rule:manage',
    'audit:view',
    'audit:export',
    'approval:view',
    'approval:submit',
    'approval:handle',
    'approval:approve',
    'purchase:request:view',
    'purchase:request:create',
    'purchase:request:edit',
    'purchase:request:delete',
    'purchase:request:submit',
    'purchase:request:approve',
    'purchase:order:view',
    'purchase:order:create',
    'purchase:order:edit',
    'purchase:order:receive',
    'purchase:order:return',
    'purchase:order:complete',
    'supplier:view',
    'supplier:create',
    'supplier:edit',
    'supplier:delete',
    'supplier:qualification:manage',
    'supplier:evaluation:view',
    'requisition:view',
    'requisition:create',
    'requisition:approve',
    'requisition:outbound',
    'requisition:register',
    'requisition:statistics',
    'stocktake:view',
    'stocktake:create',
    'stocktake:edit',
    'stocktake:delete',
    'stocktake:count',
    'stocktake:confirm',
    'stocktake:export',
    'stocktake:adjust',
    'location:view',
    'location:create',
    'location:edit',
    'location:delete',
    'location:transfer',
    'location:status',
  ],
  lab_manager: [
    'dashboard:view',
    'reagent:view',
    'reagent:create',
    'reagent:edit',
    'reagent:delete',
    'batch:view',
    'batch:create',
    'batch:edit',
    'batch:delete',
    'batch:outbound',
    'batch:operate',
    'consumable:view',
    'consumable:create',
    'consumable:edit',
    'consumable:delete',
    'consumable:operate',
    'consumable:use',
    'alert:view',
    'alert:handle',
    'alert:assign',
    'alert:rule:edit',
    'audit:view',
    'approval:view',
    'approval:submit',
    'approval:handle',
    'purchase:request:view',
    'purchase:request:create',
    'purchase:request:edit',
    'purchase:request:delete',
    'purchase:request:submit',
    'purchase:request:approve',
    'purchase:order:view',
    'purchase:order:create',
    'purchase:order:edit',
    'purchase:order:receive',
    'purchase:order:return',
    'purchase:order:complete',
    'supplier:view',
    'supplier:create',
    'supplier:edit',
    'supplier:delete',
    'supplier:qualification:manage',
    'supplier:evaluation:view',
    'requisition:view',
    'requisition:create',
    'requisition:approve',
    'requisition:outbound',
    'requisition:register',
    'requisition:statistics',
    'stocktake:view',
    'stocktake:create',
    'stocktake:edit',
    'stocktake:count',
    'stocktake:export',
    'location:view',
    'location:create',
    'location:edit',
    'location:transfer',
  ],
  lab_staff: [
    'dashboard:view',
    'reagent:view',
    'batch:view',
    'batch:outbound',
    'consumable:view',
    'consumable:use',
    'alert:view',
    'approval:view',
    'approval:submit',
    'purchase:request:view',
    'purchase:request:create',
    'purchase:request:edit',
    'purchase:request:submit',
    'supplier:view',
    'requisition:view',
    'requisition:create',
    'requisition:register',
    'stocktake:view',
    'stocktake:count',
    'location:view',
  ],
  safety_officer: [
    'dashboard:view',
    'reagent:view',
    'batch:view',
    'consumable:view',
    'alert:view',
    'alert:handle',
    'alert:assign',
    'alert:rule:edit',
    'audit:view',
    'approval:view',
    'approval:handle',
    'approval:approve',
    'requisition:view',
    'requisition:approve',
    'stocktake:view',
    'location:view',
  ],
  purchase_officer: [
    'dashboard:view',
    'reagent:view',
    'batch:view',
    'consumable:view',
    'approval:view',
    'approval:handle',
    'approval:approve',
    'purchase:request:view',
    'purchase:request:approve',
    'purchase:order:view',
    'purchase:order:create',
    'purchase:order:edit',
    'purchase:order:receive',
    'purchase:order:return',
    'purchase:order:complete',
    'supplier:view',
    'supplier:create',
    'supplier:edit',
    'supplier:qualification:manage',
    'supplier:evaluation:view',
    'stocktake:view',
    'location:view',
  ],
  finance_officer: [
    'dashboard:view',
    'approval:view',
    'approval:handle',
    'approval:approve',
    'purchase:request:view',
    'purchase:request:approve',
    'purchase:order:view',
    'requisition:view',
    'requisition:statistics',
    'stocktake:view',
    'stocktake:export',
    'location:view',
  ],
}

export const roleDataScopes: Record<UserRole, DataScope> = {
  admin: 'all',
  lab_manager: 'lab',
  lab_staff: 'self',
  safety_officer: 'lab',
  purchase_officer: 'department',
  finance_officer: 'all',
}
