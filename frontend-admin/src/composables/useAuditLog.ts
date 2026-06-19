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

  function logReagentBatchDelete(ids: string[], names: string[]): void {
    log('reagent', 'batch_delete', 'reagent', ids.join(','), names.join(', '), {
      remark: `批量删除 ${ids.length} 条试剂`,
    })
  }

  function logReagentBatchUpdate(ids: string[], names: string[], field: string, value: string): void {
    log('reagent', 'batch_update', 'reagent', ids.join(','), names.join(', '), {
      afterContent: `${field}: ${value}`,
      remark: `批量更新 ${ids.length} 条试剂的${field}`,
    })
  }

  function logReagentImport(total: number, success: number): void {
    log('reagent', 'import', 'reagent', '', '批量导入试剂', {
      afterContent: `总计: ${total}, 成功: ${success}`,
      remark: 'CSV导入试剂',
    })
  }

  function logBatchCreate(batchId: string, batchNumber: string, quantity: number, unit: string): void {
    log('batch', 'inbound', 'batch', batchId, batchNumber, {
      beforeContent: `库存: 0 ${unit}`,
      afterContent: `库存: ${quantity} ${unit}`,
      remark: '新批次入库',
    })
  }

  function logBatchOutbound(batchId: string, batchNumber: string, beforeQty: number, afterQty: number, unit: string, purpose: string): void {
    log('batch', 'outbound', 'batch', batchId, batchNumber, {
      beforeContent: `库存: ${beforeQty} ${unit}`,
      afterContent: `库存: ${afterQty} ${unit}`,
      remark: purpose,
    })
  }

  function logBatchOperation(
    batchId: string,
    batchNumber: string,
    operationType: AuditOperationType,
    beforeQty: number,
    afterQty: number,
    unit: string,
    remark: string
  ): void {
    log('batch', operationType, 'batch', batchId, batchNumber, {
      beforeContent: `库存: ${beforeQty} ${unit}`,
      afterContent: `库存: ${afterQty} ${unit}`,
      remark,
    })
  }

  function logBatchDelete(ids: string[], names: string[]): void {
    log('batch', 'batch_delete', 'batch', ids.join(','), names.join(', '), {
      remark: `批量删除 ${ids.length} 个批次`,
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
    beforeQty: number,
    afterQty: number,
    unit: string,
    remark: string
  ): void {
    log('consumable', operationType, 'consumable', consumableId, consumableName, {
      beforeContent: `库存: ${beforeQty} ${unit}`,
      afterContent: `库存: ${afterQty} ${unit}`,
      remark,
    })
  }

  function logConsumableBatchDelete(ids: string[], names: string[]): void {
    log('consumable', 'batch_delete', 'consumable', ids.join(','), names.join(', '), {
      remark: `批量删除 ${ids.length} 条耗材`,
    })
  }

  function logAlertHandle(alertId: string, alertTitle: string, action: string, beforeStatus: string, afterStatus: string, remark?: string): void {
    const operationTypeMap: Record<string, AuditOperationType> = {
      read: 'read',
      ignore: 'ignore',
      assign: 'assign',
      resolve: 'resolve',
    }
    log('alert', operationTypeMap[action] || 'handle', 'alert', alertId, alertTitle, {
      beforeContent: `状态: ${beforeStatus}`,
      afterContent: `状态: ${afterStatus}`,
      remark,
    })
  }

  function logAlertRuleUpdate(ruleId: string, ruleName: string, beforeContent: string, afterContent: string): void {
    log('alert', 'update_rule', 'alert_rule', ruleId, ruleName, {
      beforeContent,
      afterContent,
      remark: '更新预警规则',
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
    logAlertHandle,
    logAlertRuleUpdate,
    logAlertRuleToggle,
    logSystemConfig,
    logApproval,
  }
}
