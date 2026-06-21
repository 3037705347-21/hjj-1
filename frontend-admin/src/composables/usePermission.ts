import { computed } from 'vue'
import { getUserStore } from '@/stores/user'
import type { PermissionCode, DataScope } from '@/types/permission'
import { dataScopeLabels } from '@/types/permission'
import { roleLabels } from '@/types/user'

export function usePermission() {
  const userStore = getUserStore()

  const hasPermission = (code: PermissionCode | PermissionCode[]): boolean => {
    return userStore.hasPermission(code)
  }

  const hasAnyPermission = (codes: PermissionCode[]): boolean => {
    return userStore.hasAnyPermission(codes)
  }

  const hasAllPermissions = (codes: PermissionCode[]): boolean => {
    return userStore.hasAllPermissions(codes)
  }

  const isAdmin = computed(() => userStore.isAdmin())
  const isLabManager = computed(() => userStore.isLabManager())
  const isLabStaff = computed(() => userStore.isLabStaff())

  const currentRole = computed(() => userStore.state.user?.role)
  const currentRoleLabel = computed(() => {
    const role = userStore.state.user?.role
    return role ? roleLabels[role] : ''
  })

  const permissions = computed(() => userStore.permissions.value)
  const dataScope = computed<DataScope>(() => userStore.dataScope.value)
  const dataScopeLabel = computed(() => dataScopeLabels[dataScope.value])

  const canAccessData = (ownerId?: string, ownerDepartment?: string, ownerLab?: string): boolean => {
    return userStore.canAccessData(ownerId, ownerDepartment, ownerLab)
  }

  const getUserId = (): string | null => userStore.getUserId()
  const getUserDepartment = (): string | null => userStore.getUserDepartment()

  const canViewReagents = computed(() => hasPermission('reagent:view'))
  const canCreateReagent = computed(() => hasPermission('reagent:create'))
  const canEditReagent = computed(() => hasPermission('reagent:edit'))
  const canDeleteReagent = computed(() => hasPermission('reagent:delete'))
  const canManageReagent = computed(() => hasAnyPermission(['reagent:create', 'reagent:edit', 'reagent:delete']))

  const canViewBatches = computed(() => hasPermission('batch:view'))
  const canCreateBatch = computed(() => hasPermission('batch:create'))
  const canOperateBatch = computed(() => hasPermission('batch:operate'))
  const canOutboundBatch = computed(() => hasPermission('batch:outbound'))
  const canDeleteBatch = computed(() => hasPermission('batch:delete'))

  const canViewConsumables = computed(() => hasPermission('consumable:view'))
  const canCreateConsumable = computed(() => hasPermission('consumable:create'))
  const canEditConsumable = computed(() => hasPermission('consumable:edit'))
  const canDeleteConsumable = computed(() => hasPermission('consumable:delete'))
  const canOperateConsumable = computed(() => hasPermission('consumable:operate'))
  const canUseConsumable = computed(() => hasPermission('consumable:use'))

  const canViewAlerts = computed(() => hasPermission('alert:view'))
  const canHandleAlert = computed(() => hasPermission('alert:handle'))
  const canAssignAlert = computed(() => hasPermission('alert:assign'))
  const canEditAlertRule = computed(() => hasPermission('alert:rule:edit'))
  const canManageAlertRule = computed(() => hasPermission('alert:rule:manage'))

  const canManageUsers = computed(() => hasPermission('user:manage'))
  const canManageRoles = computed(() => hasPermission('role:manage'))
  const canConfigSystem = computed(() => hasPermission('system:config'))
  const canManageSystem = computed(() => hasAnyPermission(['user:manage', 'role:manage', 'system:config']))

  const canViewAuditLogs = computed(() => hasPermission('audit:view'))
  const canExportAuditLogs = computed(() => hasPermission('audit:export'))

  const canViewSuppliers = computed(() => hasPermission('supplier:view'))
  const canCreateSupplier = computed(() => hasPermission('supplier:create'))
  const canEditSupplier = computed(() => hasPermission('supplier:edit'))
  const canDeleteSupplier = computed(() => hasPermission('supplier:delete'))
  const canManageSupplierQualification = computed(() => hasPermission('supplier:qualification:manage'))
  const canViewSupplierEvaluation = computed(() => hasPermission('supplier:evaluation:view'))
  const canManageSupplier = computed(() => hasAnyPermission(['supplier:create', 'supplier:edit', 'supplier:delete']))

  const canViewRequisitions = computed(() => hasPermission('requisition:view'))
  const canCreateRequisition = computed(() => hasPermission('requisition:create'))
  const canApproveRequisition = computed(() => hasPermission('requisition:approve'))
  const canOutboundRequisition = computed(() => hasPermission('requisition:outbound'))
  const canRegisterRequisition = computed(() => hasPermission('requisition:register'))
  const canViewRequisitionStats = computed(() => hasPermission('requisition:statistics'))

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isAdmin,
    isLabManager,
    isLabStaff,
    currentRole,
    currentRoleLabel,
    permissions,
    dataScope,
    dataScopeLabel,
    canAccessData,
    getUserId,
    getUserDepartment,
    canViewReagents,
    canCreateReagent,
    canEditReagent,
    canDeleteReagent,
    canManageReagent,
    canViewBatches,
    canCreateBatch,
    canOperateBatch,
    canOutboundBatch,
    canDeleteBatch,
    canViewConsumables,
    canCreateConsumable,
    canEditConsumable,
    canDeleteConsumable,
    canOperateConsumable,
    canUseConsumable,
    canViewAlerts,
    canHandleAlert,
    canAssignAlert,
    canEditAlertRule,
    canManageAlertRule,
    canManageUsers,
    canManageRoles,
    canConfigSystem,
    canManageSystem,
    canViewAuditLogs,
    canExportAuditLogs,
    canViewSuppliers,
    canCreateSupplier,
    canEditSupplier,
    canDeleteSupplier,
    canManageSupplierQualification,
    canViewSupplierEvaluation,
    canManageSupplier,
    canViewRequisitions,
    canCreateRequisition,
    canApproveRequisition,
    canOutboundRequisition,
    canRegisterRequisition,
    canViewRequisitionStats,
  }
}
