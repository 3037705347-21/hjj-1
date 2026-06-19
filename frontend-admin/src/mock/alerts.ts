import type {
  AlertRule,
  AlertRecord,
  AlertHandleRecord,
  AlertType,
  AlertLevel,
  AlertStatus,
  AlertTargetType,
} from '@/types/alert'
import type { PageResult } from '@/types/common'
import { generateId, getExpiryDays } from '@/utils/date'
import { storage } from '@/utils/storage'
import type { User } from '@/types/user'
import { defaultAlertRules, alertTypeLabels, availableHandlers } from '@/types/alert'
import { getBatchesFromStorage } from './batches'
import { getConsumablesFromStorage } from './consumables'

const RULES_STORAGE_KEY = 'mock_alert_rules'
const RECORDS_STORAGE_KEY = 'mock_alert_records'
const HANDLE_RECORDS_STORAGE_KEY = 'mock_alert_handle_records'

function getCurrentUser(): User | null {
  return storage.getUser<User>()
}

function getRulesFromStorage(): AlertRule[] {
  const data = localStorage.getItem(RULES_STORAGE_KEY)
  if (data) {
    try {
      return JSON.parse(data)
    } catch {
      return []
    }
  }
  return initMockRules()
}

function saveRulesToStorage(rules: AlertRule[]): void {
  localStorage.setItem(RULES_STORAGE_KEY, JSON.stringify(rules))
}

function getRecordsFromStorage(): AlertRecord[] {
  const data = localStorage.getItem(RECORDS_STORAGE_KEY)
  if (data) {
    try {
      return JSON.parse(data)
    } catch {
      return []
    }
  }
  return initMockRecords()
}

function saveRecordsToStorage(records: AlertRecord[]): void {
  localStorage.setItem(RECORDS_STORAGE_KEY, JSON.stringify(records))
}

function getHandleRecordsFromStorage(): AlertHandleRecord[] {
  const data = localStorage.getItem(HANDLE_RECORDS_STORAGE_KEY)
  if (data) {
    try {
      return JSON.parse(data)
    } catch {
      return []
    }
  }
  return []
}

function saveHandleRecordsToStorage(records: AlertHandleRecord[]): void {
  localStorage.setItem(HANDLE_RECORDS_STORAGE_KEY, JSON.stringify(records))
}

function initMockRules(): AlertRule[] {
  const now = new Date().toISOString()
  const rules: AlertRule[] = defaultAlertRules.map((rule) => ({
    ...rule,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  }))
  saveRulesToStorage(rules)
  return rules
}

function initMockRecords(): AlertRecord[] {
  const now = new Date()
  const records: AlertRecord[] = []

  const batches = getBatchesFromStorage()
  const consumables = getConsumablesFromStorage()

  batches.forEach((batch) => {
    const days = getExpiryDays(batch.expiryDate)

    if (days < 0) {
      records.push({
        id: generateId(),
        type: 'expired_not_scrapped',
        level: 'critical',
        status: 'unread',
        title: `${batch.reagentName} 已过期未报废`,
        message: `批次 ${batch.batchNumber} 已于 ${batch.expiryDate} 过期，剩余 ${batch.remainingQuantity}${batch.unit || ''}，请及时处理`,
        targetType: 'batch',
        targetId: batch.id,
        targetName: batch.reagentName || '',
        extra: { batchNumber: batch.batchNumber, expiryDate: batch.expiryDate, remainingQuantity: batch.remainingQuantity },
        createdAt: new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      })
    } else if (days <= 7) {
      records.push({
        id: generateId(),
        type: 'expiry_7',
        level: 'critical',
        status: 'unread',
        title: `${batch.reagentName} 即将到期（7天内）`,
        message: `批次 ${batch.batchNumber} 将于 ${batch.expiryDate} 到期，剩余 ${days} 天，请尽快使用或处理`,
        targetType: 'batch',
        targetId: batch.id,
        targetName: batch.reagentName || '',
        extra: { batchNumber: batch.batchNumber, expiryDate: batch.expiryDate, remainingDays: days },
        assignee: '3',
        assigneeName: '王实验员',
        createdAt: new Date(now.getTime() - Math.random() * 3 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(now.getTime() - Math.random() * 3 * 24 * 60 * 60 * 1000).toISOString(),
      })
    } else if (days <= 30) {
      records.push({
        id: generateId(),
        type: 'expiry_30',
        level: 'warning',
        status: 'read',
        title: `${batch.reagentName} 近效期提醒（30天内）`,
        message: `批次 ${batch.batchNumber} 将于 ${batch.expiryDate} 到期，剩余 ${days} 天`,
        targetType: 'batch',
        targetId: batch.id,
        targetName: batch.reagentName || '',
        extra: { batchNumber: batch.batchNumber, expiryDate: batch.expiryDate, remainingDays: days },
        readAt: new Date(now.getTime() - Math.random() * 2 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(now.getTime() - Math.random() * 10 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(now.getTime() - Math.random() * 2 * 24 * 60 * 60 * 1000).toISOString(),
      })
    } else if (days <= 90) {
      records.push({
        id: generateId(),
        type: 'expiry_90',
        level: 'info',
        status: 'unread',
        title: `${batch.reagentName} 效期提醒（90天内）`,
        message: `批次 ${batch.batchNumber} 将于 ${batch.expiryDate} 到期，剩余 ${days} 天`,
        targetType: 'batch',
        targetId: batch.id,
        targetName: batch.reagentName || '',
        extra: { batchNumber: batch.batchNumber, expiryDate: batch.expiryDate, remainingDays: days },
        createdAt: new Date(now.getTime() - Math.random() * 20 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(now.getTime() - Math.random() * 20 * 24 * 60 * 60 * 1000).toISOString(),
      })
    }

    if (batch.openedAt) {
      const openedDays = getExpiryDays(batch.openedAt) * -1
      if (openedDays > 30) {
        records.push({
          id: generateId(),
          type: 'opened_overdue',
          level: 'critical',
          status: 'processing',
          title: `${batch.reagentName} 开封超期`,
          message: `批次 ${batch.batchNumber} 已于 ${batch.openedAt} 开封，已超过 ${openedDays} 天，建议检查是否可继续使用`,
          targetType: 'batch',
          targetId: batch.id,
          targetName: batch.reagentName || '',
          extra: { batchNumber: batch.batchNumber, openedAt: batch.openedAt, openedDays },
          assignee: '2',
          assigneeName: '李主任',
          createdAt: new Date(now.getTime() - Math.random() * 5 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(now.getTime() - Math.random() * 1 * 24 * 60 * 60 * 1000).toISOString(),
        })
      }
    }
  })

  consumables.forEach((consumable) => {
    if (consumable.stockQuantity <= consumable.safetyStock) {
      records.push({
        id: generateId(),
        type: 'low_stock',
        level: 'warning',
        status: consumable.stockQuantity === 0 ? 'processing' : 'unread',
        title: `${consumable.name} 库存不足`,
        message: `当前库存 ${consumable.stockQuantity}${consumable.unit}，低于安全库存 ${consumable.safetyStock}${consumable.unit}，请及时补货`,
        targetType: 'consumable',
        targetId: consumable.id,
        targetName: consumable.name,
        extra: { stockQuantity: consumable.stockQuantity, safetyStock: consumable.safetyStock, unit: consumable.unit },
        assignee: consumable.stockQuantity === 0 ? '1' : undefined,
        assigneeName: consumable.stockQuantity === 0 ? '张管理员' : undefined,
        createdAt: new Date(now.getTime() - Math.random() * 5 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(now.getTime() - Math.random() * 5 * 24 * 60 * 60 * 1000).toISOString(),
      })
    }
  })

  if (consumables.length > 0) {
    const c = consumables[consumables.length - 1]
    records.push({
      id: generateId(),
      type: 'no_activity',
      level: 'info',
      status: 'ignored',
      title: `${c.name} 长期无变动`,
      message: `该耗材已超过 180 天无任何出入库操作，请确认是否仍需保留`,
      targetType: 'consumable',
      targetId: c.id,
      targetName: c.name,
      extra: { days: 195 },
      createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    })
  }

  if (batches.length > 1) {
    const b = batches[1]
    records.push({
      id: generateId(),
      type: 'expiry_30',
      level: 'warning',
      status: 'resolved',
      title: `${b.reagentName} 近效期已处理`,
      message: `已完成优先使用安排，剩余库存将在效期前用完`,
      targetType: 'batch',
      targetId: b.id,
      targetName: b.reagentName || '',
      extra: { batchNumber: b.batchNumber },
      assignee: '3',
      assigneeName: '王实验员',
      resolvedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    })
  }

  saveRecordsToStorage(records)
  return records
}

export interface AlertFilterParams {
  keyword?: string
  type?: AlertType | ''
  level?: AlertLevel | ''
  status?: AlertStatus | ''
  assignee?: string
  targetType?: AlertTargetType | ''
  startTime?: string
  endTime?: string
}

export function mockGetAlertRules(): Promise<AlertRule[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(getRulesFromStorage())
    }, 200)
  })
}

export function mockUpdateAlertRule(id: string, data: Partial<AlertRule>): Promise<AlertRule> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const rules = getRulesFromStorage()
      const index = rules.findIndex((r) => r.id === id)
      if (index === -1) {
        reject(new Error('规则不存在'))
        return
      }
      rules[index] = {
        ...rules[index],
        ...data,
        updatedAt: new Date().toISOString(),
      }
      saveRulesToStorage(rules)
      resolve(rules[index])
    }, 200)
  })
}

export function mockToggleAlertRule(id: string): Promise<AlertRule> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const rules = getRulesFromStorage()
      const index = rules.findIndex((r) => r.id === id)
      if (index === -1) {
        reject(new Error('规则不存在'))
        return
      }
      rules[index] = {
        ...rules[index],
        enabled: !rules[index].enabled,
        updatedAt: new Date().toISOString(),
      }
      saveRulesToStorage(rules)
      resolve(rules[index])
    }, 200)
  })
}

export function mockGetAlerts(
  page: number = 1,
  pageSize: number = 10,
  filters?: AlertFilterParams
): Promise<PageResult<AlertRecord>> {
  return new Promise((resolve) => {
    setTimeout(() => {
      let records = getRecordsFromStorage()

      if (filters) {
        const { keyword, type, level, status, assignee, targetType, startTime, endTime } = filters

        if (keyword) {
          const kw = keyword.toLowerCase()
          records = records.filter(
            (r) =>
              r.title.toLowerCase().includes(kw) ||
              r.message.toLowerCase().includes(kw) ||
              r.targetName.toLowerCase().includes(kw)
          )
        }

        if (type) {
          records = records.filter((r) => r.type === type)
        }

        if (level) {
          records = records.filter((r) => r.level === level)
        }

        if (status) {
          records = records.filter((r) => r.status === status)
        }

        if (assignee) {
          records = records.filter((r) => r.assignee === assignee)
        }

        if (targetType) {
          records = records.filter((r) => r.targetType === targetType)
        }

        if (startTime) {
          const start = new Date(startTime).getTime()
          records = records.filter((r) => new Date(r.createdAt).getTime() >= start)
        }

        if (endTime) {
          const end = new Date(endTime).getTime() + 24 * 60 * 60 * 1000
          records = records.filter((r) => new Date(r.createdAt).getTime() < end)
        }
      }

      records.sort((a, b) => {
        const levelOrder = { critical: 0, warning: 1, info: 2 }
        if (levelOrder[a.level] !== levelOrder[b.level]) {
          return levelOrder[a.level] - levelOrder[b.level]
        }
        const statusOrder = { unread: 0, processing: 1, read: 2, resolved: 3, ignored: 4 }
        if (statusOrder[a.status] !== statusOrder[b.status]) {
          return statusOrder[a.status] - statusOrder[b.status]
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })

      const start = (page - 1) * pageSize
      const list = records.slice(start, start + pageSize)

      resolve({
        list,
        total: records.length,
        page,
        pageSize,
      })
    }, 300)
  })
}

export function mockGetAlert(id: string): Promise<AlertRecord | null> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const records = getRecordsFromStorage()
      resolve(records.find((r) => r.id === id) || null)
    }, 200)
  })
}

export function mockMarkAlertRead(id: string): Promise<AlertRecord> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const records = getRecordsFromStorage()
      const index = records.findIndex((r) => r.id === id)
      if (index === -1) {
        reject(new Error('预警不存在'))
        return
      }
      const user = getCurrentUser()
      const now = new Date().toISOString()
      records[index] = {
        ...records[index],
        status: records[index].status === 'unread' ? 'read' : records[index].status,
        readAt: records[index].readAt || now,
        updatedAt: now,
      }
      saveRecordsToStorage(records)

      const handleRecords = getHandleRecordsFromStorage()
      handleRecords.unshift({
        id: generateId(),
        alertId: id,
        action: 'read',
        operator: user?.id || '1',
        operatorName: user?.name || '张管理员',
        createdAt: now,
      })
      saveHandleRecordsToStorage(handleRecords)

      resolve(records[index])
    }, 200)
  })
}

export function mockIgnoreAlert(id: string, remark?: string): Promise<AlertRecord> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const records = getRecordsFromStorage()
      const index = records.findIndex((r) => r.id === id)
      if (index === -1) {
        reject(new Error('预警不存在'))
        return
      }
      const user = getCurrentUser()
      const now = new Date().toISOString()
      records[index] = {
        ...records[index],
        status: 'ignored',
        updatedAt: now,
      }
      saveRecordsToStorage(records)

      const handleRecords = getHandleRecordsFromStorage()
      handleRecords.unshift({
        id: generateId(),
        alertId: id,
        action: 'ignore',
        operator: user?.id || '1',
        operatorName: user?.name || '张管理员',
        remark,
        createdAt: now,
      })
      saveHandleRecordsToStorage(handleRecords)

      resolve(records[index])
    }, 200)
  })
}

export function mockAssignAlert(id: string, assignee: string, assigneeName: string): Promise<AlertRecord> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const records = getRecordsFromStorage()
      const index = records.findIndex((r) => r.id === id)
      if (index === -1) {
        reject(new Error('预警不存在'))
        return
      }
      const user = getCurrentUser()
      const now = new Date().toISOString()
      const fromAssignee = records[index].assignee
      const fromAssigneeName = records[index].assigneeName
      records[index] = {
        ...records[index],
        status: 'processing',
        assignee,
        assigneeName,
        updatedAt: now,
      }
      saveRecordsToStorage(records)

      const handleRecords = getHandleRecordsFromStorage()
      handleRecords.unshift({
        id: generateId(),
        alertId: id,
        action: 'assign',
        operator: user?.id || '1',
        operatorName: user?.name || '张管理员',
        fromAssignee: fromAssigneeName,
        toAssignee: assigneeName,
        createdAt: now,
      })
      saveHandleRecordsToStorage(handleRecords)

      resolve(records[index])
    }, 200)
  })
}

export function mockResolveAlert(id: string, result: string): Promise<AlertRecord> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const records = getRecordsFromStorage()
      const index = records.findIndex((r) => r.id === id)
      if (index === -1) {
        reject(new Error('预警不存在'))
        return
      }
      const user = getCurrentUser()
      const now = new Date().toISOString()
      records[index] = {
        ...records[index],
        status: 'resolved',
        resolvedAt: now,
        updatedAt: now,
      }
      saveRecordsToStorage(records)

      const handleRecords = getHandleRecordsFromStorage()
      handleRecords.unshift({
        id: generateId(),
        alertId: id,
        action: 'resolve',
        operator: user?.id || '1',
        operatorName: user?.name || '张管理员',
        result,
        createdAt: now,
      })
      saveHandleRecordsToStorage(handleRecords)

      resolve(records[index])
    }, 200)
  })
}

export function mockGetAlertHandleRecords(alertId: string): Promise<AlertHandleRecord[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const allRecords = getHandleRecordsFromStorage()
      const records = allRecords
        .filter((r) => r.alertId === alertId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      resolve(records)
    }, 200)
  })
}

export function mockGetAlertStats(): Promise<{
  total: number
  unread: number
  critical: number
  warning: number
  processing: number
  resolved: number
}> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const records = getRecordsFromStorage()
      resolve({
        total: records.length,
        unread: records.filter((r) => r.status === 'unread').length,
        critical: records.filter((r) => r.level === 'critical' && r.status !== 'resolved' && r.status !== 'ignored').length,
        warning: records.filter((r) => r.level === 'warning' && r.status !== 'resolved' && r.status !== 'ignored').length,
        processing: records.filter((r) => r.status === 'processing').length,
        resolved: records.filter((r) => r.status === 'resolved').length,
      })
    }, 200)
  })
}

export { availableHandlers }
