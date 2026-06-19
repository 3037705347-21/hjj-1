import type {
  AuditLog,
  AuditLogFormData,
  AuditLogFilterParams,
  AuditModule,
  AuditOperationType,
} from '@/types/audit'
import type { PageResult } from '@/types/common'
import type { User, UserRole } from '@/types/user'
import { generateId } from '@/utils/date'
import { storage } from '@/utils/storage'

const STORAGE_KEY = 'mock_audit_logs'

export function getAuditLogsFromStorage(): AuditLog[] {
  const data = localStorage.getItem(STORAGE_KEY)
  if (data) {
    try {
      return JSON.parse(data)
    } catch {
      return []
    }
  }
  return initMockAuditLogs()
}

function saveAuditLogsToStorage(logs: AuditLog[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(logs))
}

function getCurrentUser(): User | null {
  return storage.getUser<User>()
}

function getTerminalInfo(): string {
  const ua = navigator.userAgent
  let browser = '未知浏览器'
  if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome'
  else if (ua.includes('Firefox')) browser = 'Firefox'
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari'
  else if (ua.includes('Edg')) browser = 'Edge'

  let os = '未知系统'
  if (ua.includes('Windows')) os = 'Windows'
  else if (ua.includes('Mac')) os = 'macOS'
  else if (ua.includes('Linux')) os = 'Linux'

  return `${os} / ${browser}`
}

export function addAuditLog(data: AuditLogFormData): AuditLog {
  const user = getCurrentUser()
  const logs = getAuditLogsFromStorage()
  const now = new Date().toISOString()

  const log: AuditLog = {
    id: generateId(),
    operatorId: user?.id || 'unknown',
    operatorName: user?.name || '未知用户',
    operatorRole: (user?.role || 'lab_staff') as UserRole,
    operationTime: now,
    module: data.module,
    operationType: data.operationType,
    targetType: data.targetType,
    targetId: data.targetId,
    targetName: data.targetName,
    beforeContent: data.beforeContent || '',
    afterContent: data.afterContent || '',
    terminalInfo: getTerminalInfo(),
    remark: data.remark || '',
  }

  logs.unshift(log)
  saveAuditLogsToStorage(logs)
  return log
}

function initMockAuditLogs(): AuditLog[] {
  const now = new Date()
  const logs: AuditLog[] = []
  const terminalInfo = getTerminalInfo()

  const mockLogEntries: Array<{
    offsetDays: number
    hours: number
    operatorId: string
    operatorName: string
    operatorRole: UserRole
    module: AuditModule
    operationType: AuditOperationType
    targetType: string
    targetId: string
    targetName: string
    beforeContent: string
    afterContent: string
    remark: string
  }> = [
    {
      offsetDays: 0,
      hours: 9,
      operatorId: '1',
      operatorName: '系统管理员',
      operatorRole: 'admin',
      module: 'auth',
      operationType: 'login',
      targetType: 'user',
      targetId: '1',
      targetName: '系统管理员',
      beforeContent: '',
      afterContent: '',
      remark: '账号密码登录',
    },
    {
      offsetDays: 0,
      hours: 9,
      operatorId: '2',
      operatorName: '李主任',
      operatorRole: 'lab_manager',
      module: 'auth',
      operationType: 'login',
      targetType: 'user',
      targetId: '2',
      targetName: '李主任',
      beforeContent: '',
      afterContent: '',
      remark: '账号密码登录',
    },
    {
      offsetDays: 0,
      hours: 10,
      operatorId: '2',
      operatorName: '李主任',
      operatorRole: 'lab_manager',
      module: 'batch',
      operationType: 'inbound',
      targetType: 'batch',
      targetId: 'batch_001',
      targetName: 'BSA20250101',
      beforeContent: '库存: 0 mL',
      afterContent: '库存: 100 mL',
      remark: '新批次入库',
    },
    {
      offsetDays: 0,
      hours: 10,
      operatorId: '2',
      operatorName: '李主任',
      operatorRole: 'lab_manager',
      module: 'consumable',
      operationType: 'stock_in',
      targetType: 'consumable',
      targetId: 'cons_001',
      targetName: '1.5mL 离心管',
      beforeContent: '库存: 20 包',
      afterContent: '库存: 25 包',
      remark: '采购入库',
    },
    {
      offsetDays: 0,
      hours: 11,
      operatorId: '3',
      operatorName: '王实验员',
      operatorRole: 'lab_staff',
      module: 'batch',
      operationType: 'outbound',
      targetType: 'batch',
      targetId: 'batch_001',
      targetName: 'BSA20250101',
      beforeContent: '库存: 100 mL',
      afterContent: '库存: 80 mL',
      remark: 'Western Blot实验',
    },
    {
      offsetDays: 0,
      hours: 11,
      operatorId: '3',
      operatorName: '王实验员',
      operatorRole: 'lab_staff',
      module: 'consumable',
      operationType: 'use',
      targetType: 'consumable',
      targetId: 'cons_002',
      targetName: '200μL 吸头',
      beforeContent: '库存: 10 盒',
      afterContent: '库存: 8 盒',
      remark: 'PCR实验',
    },
    {
      offsetDays: 1,
      hours: 9,
      operatorId: '1',
      operatorName: '系统管理员',
      operatorRole: 'admin',
      module: 'reagent',
      operationType: 'create',
      targetType: 'reagent',
      targetId: 'reagent_new_001',
      targetName: 'Tris-盐酸缓冲液 1M pH8.0',
      beforeContent: '',
      afterContent: '分类: 缓冲液, 规格: 500mL, 储存条件: 常温',
      remark: '新增试剂',
    },
    {
      offsetDays: 1,
      hours: 10,
      operatorId: '2',
      operatorName: '李主任',
      operatorRole: 'lab_manager',
      module: 'reagent',
      operationType: 'update',
      targetType: 'reagent',
      targetId: 'reagent_004',
      targetName: '乙腈 (ACN)',
      beforeContent: '危险等级: medium',
      afterContent: '危险等级: high',
      remark: '更新危险等级',
    },
    {
      offsetDays: 1,
      hours: 14,
      operatorId: '1',
      operatorName: '系统管理员',
      operatorRole: 'admin',
      module: 'alert',
      operationType: 'resolve',
      targetType: 'alert',
      targetId: 'alert_001',
      targetName: '牛血清白蛋白 BSA 即将到期',
      beforeContent: '状态: 未读',
      afterContent: '状态: 已解决',
      remark: '已完成优先使用安排',
    },
    {
      offsetDays: 1,
      hours: 15,
      operatorId: '1',
      operatorName: '系统管理员',
      operatorRole: 'admin',
      module: 'alert',
      operationType: 'assign',
      targetType: 'alert',
      targetId: 'alert_002',
      targetName: 'Taq DNA 聚合酶 已过期未报废',
      beforeContent: '处理人: 无',
      afterContent: '处理人: 王实验员',
      remark: '转派处理',
    },
    {
      offsetDays: 1,
      hours: 16,
      operatorId: '2',
      operatorName: '李主任',
      operatorRole: 'lab_manager',
      module: 'batch',
      operationType: 'freeze',
      targetType: 'batch',
      targetId: 'batch_003',
      targetName: 'TAQ20241105',
      beforeContent: '状态: expired',
      afterContent: '状态: frozen',
      remark: '过期批次冻结',
    },
    {
      offsetDays: 2,
      hours: 9,
      operatorId: '2',
      operatorName: '李主任',
      operatorRole: 'lab_manager',
      module: 'consumable',
      operationType: 'adjust',
      targetType: 'consumable',
      targetId: 'cons_007',
      targetName: '定性滤纸 中速',
      beforeContent: '库存: 5 盒',
      afterContent: '库存: 2 盒',
      remark: '库存盘点调整',
    },
    {
      offsetDays: 2,
      hours: 10,
      operatorId: '1',
      operatorName: '系统管理员',
      operatorRole: 'admin',
      module: 'system',
      operationType: 'config_change',
      targetType: 'system_config',
      targetId: 'config_expiry_warning',
      targetName: '效期预警配置',
      beforeContent: '7天预警: 启用, 30天预警: 启用',
      afterContent: '7天预警: 启用, 30天预警: 启用, 90天预警: 启用',
      remark: '新增90天效期预警规则',
    },
    {
      offsetDays: 2,
      hours: 14,
      operatorId: '3',
      operatorName: '王实验员',
      operatorRole: 'lab_staff',
      module: 'batch',
      operationType: 'outbound',
      targetType: 'batch',
      targetId: 'batch_001',
      targetName: 'BSA20250101',
      beforeContent: '库存: 80 mL',
      afterContent: '库存: 65 mL',
      remark: 'ELISA实验',
    },
    {
      offsetDays: 2,
      hours: 17,
      operatorId: '2',
      operatorName: '李主任',
      operatorRole: 'lab_manager',
      module: 'auth',
      operationType: 'logout',
      targetType: 'user',
      targetId: '2',
      targetName: '李主任',
      beforeContent: '',
      afterContent: '',
      remark: '主动退出',
    },
    {
      offsetDays: 3,
      hours: 9,
      operatorId: '3',
      operatorName: '王实验员',
      operatorRole: 'lab_staff',
      module: 'auth',
      operationType: 'login',
      targetType: 'user',
      targetId: '3',
      targetName: '王实验员',
      beforeContent: '',
      afterContent: '',
      remark: '账号密码登录',
    },
    {
      offsetDays: 3,
      hours: 10,
      operatorId: '2',
      operatorName: '李主任',
      operatorRole: 'lab_manager',
      module: 'reagent',
      operationType: 'delete',
      targetType: 'reagent',
      targetId: 'reagent_old_001',
      targetName: '过期试剂A',
      beforeContent: '分类: 有机溶剂, 状态: 停用',
      afterContent: '',
      remark: '清理过期停用试剂',
    },
    {
      offsetDays: 3,
      hours: 11,
      operatorId: '1',
      operatorName: '系统管理员',
      operatorRole: 'admin',
      module: 'consumable',
      operationType: 'create',
      targetType: 'consumable',
      targetId: 'cons_new_001',
      targetName: '50mL 离心管',
      beforeContent: '',
      afterContent: '分类: 离心管, 规格: 500个/包, 安全库存: 5',
      remark: '新增耗材',
    },
    {
      offsetDays: 3,
      hours: 14,
      operatorId: '1',
      operatorName: '系统管理员',
      operatorRole: 'admin',
      module: 'alert',
      operationType: 'update_rule',
      targetType: 'alert_rule',
      targetId: 'rule_low_stock',
      targetName: '库存不足预警',
      beforeContent: '阈值: 安全库存以下',
      afterContent: '阈值: 安全库存1.2倍以下',
      remark: '调整库存预警灵敏度',
    },
  ]

  mockLogEntries.forEach((entry) => {
    const date = new Date(now)
    date.setDate(date.getDate() - entry.offsetDays)
    date.setHours(entry.hours, Math.floor(Math.random() * 60), 0, 0)

    logs.push({
      id: generateId(),
      operatorId: entry.operatorId,
      operatorName: entry.operatorName,
      operatorRole: entry.operatorRole,
      operationTime: date.toISOString(),
      module: entry.module,
      operationType: entry.operationType,
      targetType: entry.targetType,
      targetId: entry.targetId,
      targetName: entry.targetName,
      beforeContent: entry.beforeContent,
      afterContent: entry.afterContent,
      terminalInfo,
      remark: entry.remark,
    })
  })

  saveAuditLogsToStorage(logs)
  return logs
}

export function mockGetAuditLogs(
  page: number = 1,
  pageSize: number = 20,
  filters?: AuditLogFilterParams
): Promise<PageResult<AuditLog>> {
  return new Promise((resolve) => {
    setTimeout(() => {
      let logs = getAuditLogsFromStorage()

      if (filters) {
        const {
          keyword,
          module,
          operationType,
          operatorId,
          operatorName,
          startTime,
          endTime,
        } = filters

        if (keyword) {
          const kw = keyword.toLowerCase()
          logs = logs.filter(
            (log) =>
              log.operatorName.toLowerCase().includes(kw) ||
              log.targetName.toLowerCase().includes(kw) ||
              log.remark.toLowerCase().includes(kw) ||
              log.beforeContent.toLowerCase().includes(kw) ||
              log.afterContent.toLowerCase().includes(kw)
          )
        }

        if (module) {
          logs = logs.filter((log) => log.module === module)
        }

        if (operationType) {
          logs = logs.filter((log) => log.operationType === operationType)
        }

        if (operatorId) {
          logs = logs.filter((log) => log.operatorId === operatorId)
        }

        if (operatorName) {
          const name = operatorName.toLowerCase()
          logs = logs.filter((log) => log.operatorName.toLowerCase().includes(name))
        }

        if (startTime) {
          const start = new Date(startTime).getTime()
          logs = logs.filter((log) => new Date(log.operationTime).getTime() >= start)
        }

        if (endTime) {
          const end = new Date(endTime).getTime() + 24 * 60 * 60 * 1000
          logs = logs.filter((log) => new Date(log.operationTime).getTime() < end)
        }
      }

      logs.sort(
        (a, b) => new Date(b.operationTime).getTime() - new Date(a.operationTime).getTime()
      )

      const start = (page - 1) * pageSize
      const list = logs.slice(start, start + pageSize)

      resolve({
        list,
        total: logs.length,
        page,
        pageSize,
      })
    }, 300)
  })
}

export function mockExportAuditLogs(filters?: AuditLogFilterParams): Promise<AuditLog[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      let logs = getAuditLogsFromStorage()

      if (filters) {
        const {
          keyword,
          module,
          operationType,
          operatorId,
          operatorName,
          startTime,
          endTime,
        } = filters

        if (keyword) {
          const kw = keyword.toLowerCase()
          logs = logs.filter(
            (log) =>
              log.operatorName.toLowerCase().includes(kw) ||
              log.targetName.toLowerCase().includes(kw) ||
              log.remark.toLowerCase().includes(kw)
          )
        }

        if (module) {
          logs = logs.filter((log) => log.module === module)
        }

        if (operationType) {
          logs = logs.filter((log) => log.operationType === operationType)
        }

        if (operatorId) {
          logs = logs.filter((log) => log.operatorId === operatorId)
        }

        if (operatorName) {
          const name = operatorName.toLowerCase()
          logs = logs.filter((log) => log.operatorName.toLowerCase().includes(name))
        }

        if (startTime) {
          const start = new Date(startTime).getTime()
          logs = logs.filter((log) => new Date(log.operationTime).getTime() >= start)
        }

        if (endTime) {
          const end = new Date(endTime).getTime() + 24 * 60 * 60 * 1000
          logs = logs.filter((log) => new Date(log.operationTime).getTime() < end)
        }
      }

      logs.sort(
        (a, b) => new Date(b.operationTime).getTime() - new Date(a.operationTime).getTime()
      )
      resolve(logs)
    }, 300)
  })
}
