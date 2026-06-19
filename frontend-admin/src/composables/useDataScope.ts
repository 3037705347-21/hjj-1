import { computed } from 'vue'
import { usePermission } from './usePermission'
import type { DataScope } from '@/types/permission'

export interface DataOwnerInfo {
  ownerId?: string
  ownerDepartment?: string
  ownerLab?: string
  ownerGroup?: string
  createdBy?: string
  department?: string
  lab?: string
}

export function useDataScope() {
  const permission = usePermission()

  const dataScope = computed<DataScope>(() => permission.dataScope.value)
  const dataScopeLabel = computed(() => permission.dataScopeLabel.value)
  const currentUserId = computed(() => permission.getUserId())
  const currentUserDepartment = computed(() => permission.getUserDepartment())

  const isAllScope = computed(() => dataScope.value === 'all')
  const isLabScope = computed(() => dataScope.value === 'lab')
  const isDepartmentScope = computed(() => dataScope.value === 'department')
  const isGroupScope = computed(() => dataScope.value === 'group')
  const isSelfScope = computed(() => dataScope.value === 'self')

  function filterByScope<T extends DataOwnerInfo>(list: T[]): T[] {
    if (isAllScope.value) {
      return list
    }

    const userId = currentUserId.value
    const userDept = currentUserDepartment.value

    return list.filter(item => {
      if (isSelfScope.value) {
        const itemOwnerId = item.ownerId || item.createdBy
        return itemOwnerId === userId
      }

      if (isDepartmentScope.value || isLabScope.value) {
        const itemDept = item.ownerDepartment || item.department || item.ownerLab || item.lab
        return itemDept === userDept
      }

      if (isGroupScope.value) {
        const itemGroup = item.ownerGroup
        return itemGroup === userDept
      }

      return true
    })
  }

  function canAccessItem(item: DataOwnerInfo): boolean {
    if (isAllScope.value) return true

    const userId = currentUserId.value
    const userDept = currentUserDepartment.value

    if (isSelfScope.value) {
      const itemOwnerId = item.ownerId || item.createdBy
      return itemOwnerId === userId
    }

    if (isDepartmentScope.value || isLabScope.value) {
      const itemDept = item.ownerDepartment || item.department || item.ownerLab || item.lab
      return itemDept === userDept
    }

    return true
  }

  function getScopeParams(): {
    dataScope: DataScope
    userId: string | null
    department: string | null
  } {
    return {
      dataScope: dataScope.value,
      userId: currentUserId.value,
      department: currentUserDepartment.value,
    }
  }

  return {
    dataScope,
    dataScopeLabel,
    currentUserId,
    currentUserDepartment,
    isAllScope,
    isLabScope,
    isDepartmentScope,
    isGroupScope,
    isSelfScope,
    filterByScope,
    canAccessItem,
    getScopeParams,
  }
}
