import { addAuditLog } from '@/mock/audit'
import type { AuditLogFormData, AuditModule, AuditOperationType } from '@/types/audit'

export function useAuditLog() {
  function log(
    module: AuditModule,
    operationType: AuditOperationType,
    targetType: string,
    targetId: string,
    targetName: string,
    options?: {
      beforeContent?: string
      afterContent?: string
      remark?: string
    }
  ): void {
    const data: AuditLogFormData = {
      module,
      operationType,
      targetType,
      targetId,
      targetName,
      beforeContent: options?.beforeContent,
      afterContent: options?.afterContent,
      remark: options?.remark,
    }
    addAuditLog(data)
  }

  function logLogin(userId: string, userName: string, success: boolean = true): void {
    log('auth', success ? 'login' : 'login_fail', 'user', userId, userName, {
      remark: success ? '账号密码登录' : '登录失败',
    })
  }

  function logLogout(userId: string, userName: string): void {
    log('auth', 'logout', 'user', userId, userName, {
      remark: '主动退出',
    })
  }

  function logReagentCreate(reagentId: string, reagentName: string, afterContent: string): void {
    log('reagent', 'create', 'reagent', reagentId, reagentName, {
      afterContent,
      remark: '新增试剂',
    })
  }

  function logReagentUpdate(reagentId: string, reagentName: string, beforeContent: string, afterContent: string): void {
    log('reagent', 'update', 'reagent', reagentId, reagentName, {
      beforeContent,
      afterContent,
      remark: '编辑试剂',
    })
  }

  function logReagentDelete(reagentId: string, reagentName: string, beforeContent: string): void {
    log('reagent', 'delete', 'reagent', reagentId, reagentName, {
      beforeContent,
      remark: '删除试剂',
    })
  }

  function logReagentBatchDelete(ids: string[], names: string[], remark?: string): void {
    log('reagent', 'batch_delete', 'reagent', ids.join(','), names.join(', '), {
      remark: remark || `批量删除 ${ids.length} 条试剂`,
    })
  }

  function logReagentBatchUpdate(ids: string[], names: string[], field: string, beforeValue: string, afterValue: string): void {
    log('reagent', 'batch_update', 'reagent', ids.join(','), names.join(', '), {
      beforeContent: beforeValue ? `${field}: ${beforeValue}` : '',
      afterContent: `${field}: ${afterValue}`,
      remark: `批量更新 ${ids.length} 条试剂的${field}`,
    })
  }

  function logReagentImport(total: number, remark?: string): void {
    log('reagent', 'import', 'reagent', '', '批量导入试剂', {
      afterContent: `总计: ${total}`,
      remark: remark || 'CSV导入试剂',
    })
  }

  function logBatchCreate(batchId: string, batchNumber: string, reagentName: string, remark?: string): void {
    log('batch', 'inbound', 'batch', batchId, batchNumber, {
      afterContent: `试剂: ${reagentName}`,
      remark: remark || '新批次入库',
    })
  }

  function logBatchOutbound(batchId: string, batchNumber: string, reagentName: string, quantity: number, purpose: string, beforeContent?: string): void {
    log('batch', 'outbound', 'batch', batchId, batchNumber, {
      beforeContent,
      afterContent: `出库数量: ${quantity}, 试剂: ${reagentName}, 用途: ${purpose}`,
      remark: purpose,
    })
  }

  function logBatchOperation(
    batchId: string,
    batchNumber: string,
    reagentName: string,
    operationType: AuditOperationType,
    beforeContent: string,
    remark: string
  ): void {
    log('batch', operationType, 'batch', batchId, batchNumber, {
      beforeContent,
      afterContent: `试剂: ${reagentName}`,
      remark,
    })
  }

  function logBatchDelete(ids: string[], names: string[], remark?: string): void {
    log('batch', 'batch_delete', 'batch', ids.join(','), names.join(', '), {
      remark: remark || `批量删除 ${ids.length} 个批次`,
    })
  }

  function logConsumableCreate(consumableId: string, consumableName: string, afterContent: string): void {
    log('consumable', 'create', 'consumable', consumableId, consumableName, {
      afterContent,
      remark: '新增耗材',
    })
  }

  function logConsumableUpdate(consumableId: string, consumableName: string, beforeContent: string, afterContent: string): void {
    log('consumable', 'update', 'consumable', consumableId, consumableName, {
      beforeContent,
      afterContent,
      remark: '编辑耗材',
    })
  }

  function logConsumableDelete(consumableId: string, consumableName: string, beforeContent: string): void {
    log('consumable', 'delete', 'consumable', consumableId, consumableName, {
      beforeContent,
      remark: '删除耗材',
    })
  }

  function logConsumableOperation(
    consumableId: string,
    consumableName: string,
    operationType: AuditOperationType,
    beforeContent: string,
    remark: string
  ): void {
    log('consumable', operationType, 'consumable', consumableId, consumableName, {
      beforeContent,
      remark,
    })
  }

  function logConsumableBatchDelete(ids: string[], names: string[], remark?: string): void {
    log('consumable', 'batch_delete', 'consumable', ids.join(','), names.join(', '), {
      remark: remark || `批量删除 ${ids.length} 条耗材`,
    })
  }

  function logConsumableBatchUpdate(ids: string[], names: string[], field: string, beforeValue: string, afterValue: string): void {
    log('consumable', 'batch_update', 'consumable', ids.join(','), names.join(', '), {
      beforeContent: beforeValue ? `${field}: ${beforeValue}` : '',
      afterContent: `${field}: ${afterValue}`,
      remark: `批量更新 ${ids.length} 条耗材的${field}`,
    })
  }

  function logAlertHandle(alertId: string, alertTitle: string, action: string, beforeContent: string, remark?: string): void {
    const operationTypeMap: Record<string, AuditOperationType> = {
      mark_read: 'read',
      read: 'read',
      ignore: 'ignore',
      assign: 'assign',
      resolve: 'resolve',
    }
    log('alert', operationTypeMap[action] || 'handle', 'alert', alertId, alertTitle, {
      beforeContent,
      remark,
    })
  }

  function logAlertRuleUpdate(ruleId: string, ruleName: string, field: string, beforeContent: string, afterContent: string, remark?: string): void {
    log('alert', 'update_rule', 'alert_rule', ruleId, ruleName, {
      beforeContent,
      afterContent,
      remark: remark || '更新预警规则',
    })
  }

  function logAlertRuleToggle(ruleId: string, ruleName: string, enabled: boolean): void {
    log('alert', 'toggle_rule', 'alert_rule', ruleId, ruleName, {
      beforeContent: `状态: ${enabled ? '停用' : '启用'}`,
      afterContent: `状态: ${enabled ? '启用' : '停用'}`,
      remark: enabled ? '启用预警规则' : '停用预警规则',
    })
  }

  function logSystemConfig(configId: string, configName: string, beforeContent: string, afterContent: string, remark?: string): void {
    log('system', 'config_change', 'system_config', configId, configName, {
      beforeContent,
      afterContent,
      remark,
    })
  }

  function logApproval(approvalId: string, approvalName: string, action: 'submit' | 'approve' | 'reject', remark?: string): void {
    const typeMap: Record<string, AuditOperationType> = {
      submit: 'approval_submit',
      approve: 'approval_approve',
      reject: 'approval_reject',
    }
    log('approval', typeMap[action], 'approval', approvalId, approvalName, {
      remark,
    })
  }

  return {
    log,
    logLogin,
    logLogout,
    logReagentCreate,
    logReagentUpdate,
    logReagentDelete,
    logReagentBatchDelete,
    logReagentBatchUpdate,
    logReagentImport,
    logBatchCreate,
    logBatchOutbound,
    logBatchOperation,
    logBatchDelete,
    logConsumableCreate,
    logConsumableUpdate,
    logConsumableDelete,
    logConsumableOperation,
    logConsumableBatchDelete,
    logConsumableBatchUpdate,
    logAlertHandle,
    logAlertRuleUpdate,
    logAlertRuleToggle,
    logSystemConfig,
    logApproval,
  }
}
