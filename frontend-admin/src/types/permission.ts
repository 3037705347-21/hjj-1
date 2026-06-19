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
  ],
  lab_staff: [
    'dashboard:view',
    'reagent:view',
    'batch:view',
    'batch:outbound',
    'consumable:view',
    'consumable:use',
    'alert:view',
  ],
}

export const roleDataScopes: Record<UserRole, DataScope> = {
  admin: 'all',
  lab_manager: 'lab',
  lab_staff: 'self',
}
