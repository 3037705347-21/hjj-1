export type AlertType =
  | 'expiry_90'
  | 'expiry_30'
  | 'expiry_7'
  | 'low_stock'
  | 'opened_overdue'
  | 'expired_not_scrapped'
  | 'no_activity'

export type AlertLevel = 'critical' | 'warning' | 'info'

export type AlertStatus = 'unread' | 'read' | 'ignored' | 'processing' | 'resolved'

export type AlertTargetType = 'reagent' | 'consumable' | 'batch'

export interface AlertRule {
  id: string
  type: AlertType
  name: string
  description: string
  level: AlertLevel
  enabled: boolean
  threshold?: number
  unit?: string
  createdAt: string
  updatedAt: string
}

export interface AlertRecord {
  id: string
  type: AlertType
  level: AlertLevel
  status: AlertStatus
  title: string
  message: string
  targetType: AlertTargetType
  targetId: string
  targetName: string
  extra?: Record<string, any>
  assignee?: string
  assigneeName?: string
  readAt?: string
  resolvedAt?: string
  createdAt: string
  updatedAt: string
}

export interface AlertHandleRecord {
  id: string
  alertId: string
  action: 'read' | 'ignore' | 'assign' | 'resolve' | 'comment'
  operator: string
  operatorName: string
  remark?: string
  result?: string
  fromAssignee?: string
  toAssignee?: string
  createdAt: string
}

export const alertTypeLabels: Record<AlertType, string> = {
  expiry_90: '到期前90天提醒',
  expiry_30: '到期前30天提醒',
  expiry_7: '到期前7天提醒',
  low_stock: '库存低于安全值',
  opened_overdue: '开封超过使用期限',
  expired_not_scrapped: '过期未报废',
  no_activity: '长期无变动',
}

export const alertLevelLabels: Record<AlertLevel, string> = {
  critical: '高危',
  warning: '中危',
  info: '提示',
}

export const alertLevelColors: Record<AlertLevel, string> = {
  critical: 'bg-danger-50 text-danger-600',
  warning: 'bg-warning-50 text-warning-600',
  info: 'bg-info-50 text-info-600',
}

export const alertLevelBadgeColors: Record<AlertLevel, string> = {
  critical: 'bg-danger-100 text-danger-700 border-danger-200',
  warning: 'bg-warning-100 text-warning-700 border-warning-200',
  info: 'bg-info-100 text-info-700 border-info-200',
}

export const alertStatusLabels: Record<AlertStatus, string> = {
  unread: '未读',
  read: '已读',
  ignored: '已忽略',
  processing: '处理中',
  resolved: '已处理',
}

export const alertStatusColors: Record<AlertStatus, string> = {
  unread: 'bg-danger-50 text-danger-600',
  read: 'bg-gray-50 text-gray-600',
  ignored: 'bg-gray-100 text-gray-500',
  processing: 'bg-warning-50 text-warning-600',
  resolved: 'bg-success-50 text-success-600',
}

export const alertTargetTypeLabels: Record<AlertTargetType, string> = {
  reagent: '试剂',
  consumable: '耗材',
  batch: '试剂批次',
}

export const defaultAlertRules: Omit<AlertRule, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    type: 'expiry_90',
    name: '到期前90天提醒',
    description: '试剂/耗材有效期到期前90天触发预警',
    level: 'info',
    enabled: true,
    threshold: 90,
    unit: '天',
  },
  {
    type: 'expiry_30',
    name: '到期前30天提醒',
    description: '试剂/耗材有效期到期前30天触发预警',
    level: 'warning',
    enabled: true,
    threshold: 30,
    unit: '天',
  },
  {
    type: 'expiry_7',
    name: '到期前7天提醒',
    description: '试剂/耗材有效期到期前7天触发预警',
    level: 'critical',
    enabled: true,
    threshold: 7,
    unit: '天',
  },
  {
    type: 'low_stock',
    name: '库存低于安全值',
    description: '当前库存低于设定的安全库存时触发预警',
    level: 'warning',
    enabled: true,
  },
  {
    type: 'opened_overdue',
    name: '开封超过使用期限',
    description: '试剂开封后超过规定使用期限未用完触发预警',
    level: 'critical',
    enabled: true,
    threshold: 30,
    unit: '天',
  },
  {
    type: 'expired_not_scrapped',
    name: '过期未报废',
    description: '试剂/耗材已过期但尚未进行报废处理',
    level: 'critical',
    enabled: true,
  },
  {
    type: 'no_activity',
    name: '长期无变动',
    description: '试剂/耗材在指定天数内无任何出入库操作',
    level: 'info',
    enabled: false,
    threshold: 180,
    unit: '天',
  },
]

export const availableHandlers = [
  { id: '1', name: '张管理员', role: '系统管理员' },
  { id: '2', name: '李主任', role: '实验室主任' },
  { id: '3', name: '王实验员', role: '实验员' },
  { id: '4', name: '赵技术员', role: '技术员' },
]
