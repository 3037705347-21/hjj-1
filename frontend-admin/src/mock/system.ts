import type {
  SystemConfigItem,
  SystemConfigKey,
} from '@/types/system'
import { defaultSystemConfigs } from '@/types/system'
import { generateId, formatDate } from '@/utils/date'
import { storage } from '@/utils/storage'
import type { User } from '@/types/user'
import { addAuditLog } from './audit'

const STORAGE_KEY = 'mock_system_configs'

function getCurrentUser(): User | null {
  return storage.getUser<User>()
}

function getConfigsFromStorage(): SystemConfigItem[] {
  const data = localStorage.getItem(STORAGE_KEY)
  if (data) {
    try {
      return JSON.parse(data)
    } catch {
      return []
    }
  }
  return initMockConfigs()
}

function saveConfigsToStorage(configs: SystemConfigItem[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(configs))
}

function initMockConfigs(): SystemConfigItem[] {
  const now = formatDate(new Date())
  const configs: SystemConfigItem[] = defaultSystemConfigs.map((cfg) => ({
    ...cfg,
    id: generateId(),
    updatedAt: now,
    updatedBy: '系统初始化',
  }))
  saveConfigsToStorage(configs)
  return configs
}

export async function mockGetSystemConfigs(): Promise<SystemConfigItem[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const configs = getConfigsFromStorage()
      resolve(configs)
    }, 200)
  })
}

export async function mockGetSystemConfig(key: SystemConfigKey): Promise<SystemConfigItem | null> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const configs = getConfigsFromStorage()
      const found = configs.find((c) => c.key === key)
      resolve(found || null)
    }, 100)
  })
}

export async function mockGetSystemConfigValue(
  key: SystemConfigKey
): Promise<string> {
  const cfg = await mockGetSystemConfig(key)
  return cfg?.value || ''
}

export async function mockUpdateSystemConfig(
  key: SystemConfigKey,
  value: string
): Promise<SystemConfigItem> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const currentUser = getCurrentUser()
      if (!currentUser) {
        reject(new Error('用户未登录'))
        return
      }

      const configs = getConfigsFromStorage()
      const index = configs.findIndex((c) => c.key === key)
      if (index === -1) {
        reject(new Error('配置项不存在'))
        return
      }

      const beforeConfig = { ...configs[index] }
      const now = formatDate(new Date())
      const updated = {
        ...configs[index],
        value,
        updatedAt: now,
        updatedBy: currentUser.name,
      }
      configs[index] = updated
      saveConfigsToStorage(configs)

      addAuditLog({
        module: 'system',
        operationType: 'config_change',
        targetType: 'system_config',
        targetId: updated.id,
        targetName: updated.name,
        beforeContent: `${beforeConfig.name}: ${formatValue(beforeConfig.value, beforeConfig.type)}`,
        afterContent: `${updated.name}: ${formatValue(updated.value, updated.type)}`,
        remark: `修改系统配置: ${updated.name}`,
      })

      resolve(updated)
    }, 200)
  })
}

export async function mockBatchUpdateSystemConfigs(
  updates: { key: SystemConfigKey; value: string }[]
): Promise<SystemConfigItem[]> {
  const results: SystemConfigItem[] = []
  for (const update of updates) {
    const result = await mockUpdateSystemConfig(update.key, update.value)
    results.push(result)
  }
  return results
}

function formatValue(value: string, type: string): string {
  if (type === 'boolean') {
    return value === 'true' ? '启用' : '禁用'
  }
  return value
}
