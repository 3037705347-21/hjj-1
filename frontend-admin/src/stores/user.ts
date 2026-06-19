import { reactive, readonly, computed } from 'vue'
import type { User, LoginRequest } from '@/types/user'
import { mockLogin, mockLogout, mockGetCurrentUser } from '@/mock/auth'
import { storage } from '@/utils/storage'
import type { PermissionCode, DataScope } from '@/types/permission'
import { rolePermissions, roleDataScopes } from '@/types/permission'
import { useAuditLog } from '@/composables/useAuditLog'

interface UserState {
  user: User | null
  token: string | null
  loading: boolean
}

const state = reactive<UserState>({
  user: null,
  token: null,
  loading: false,
})

export function useUserStore() {
  const isLoggedIn = () => !!state.token

  const permissions = computed<PermissionCode[]>(() => {
    if (!state.user?.role) return []
    return rolePermissions[state.user.role] || []
  })

  const dataScope = computed<DataScope>(() => {
    if (!state.user?.role) return 'self'
    return roleDataScopes[state.user.role] || 'self'
  })

  function hasPermission(code: PermissionCode | PermissionCode[]): boolean {
    if (!state.user?.role) return false
    const codes = Array.isArray(code) ? code : [code]
    return codes.some(c => permissions.value.includes(c))
  }

  function hasAnyPermission(codes: PermissionCode[]): boolean {
    return codes.some(c => permissions.value.includes(c))
  }

  function hasAllPermissions(codes: PermissionCode[]): boolean {
    return codes.every(c => permissions.value.includes(c))
  }

  function isAdmin(): boolean {
    return state.user?.role === 'admin'
  }

  function isLabManager(): boolean {
    return state.user?.role === 'lab_manager'
  }

  function isLabStaff(): boolean {
    return state.user?.role === 'lab_staff'
  }

  function canAccessData(ownerId?: string, ownerDepartment?: string, ownerLab?: string): boolean {
    const scope = dataScope.value
    if (scope === 'all' || isAdmin()) return true
    if (!state.user) return false
    if (scope === 'self') {
      return ownerId ? ownerId === state.user.id : false
    }
    if (scope === 'department') {
      return ownerDepartment ? ownerDepartment === state.user.department : true
    }
    if (scope === 'lab') {
      return ownerLab ? ownerLab === state.user.department : true
    }
    return false
  }

  function getUserId(): string | null {
    return state.user?.id || null
  }

  function getUserDepartment(): string | null {
    return state.user?.department || null
  }

  async function login(request: LoginRequest): Promise<void> {
    state.loading = true
    const auditLog = useAuditLog()
    try {
      const result = await mockLogin(request)
      state.token = result.token
      state.user = result.user
      storage.setToken(result.token)
      storage.setUser(result.user)
      auditLog.logLogin(result.user.id, result.user.name, true)
    } catch (e: any) {
      auditLog.logLogin('', request.username, false)
      throw e
    } finally {
      state.loading = false
    }
  }

  async function logout(): Promise<void> {
    const auditLog = useAuditLog()
    const userId = state.user?.id || ''
    const userName = state.user?.name || ''
    await mockLogout()
    if (userId && userName) {
      auditLog.logLogout(userId, userName)
    }
    state.token = null
    state.user = null
    storage.clear()
  }

  async function fetchCurrentUser(): Promise<void> {
    const user = await mockGetCurrentUser()
    if (user) {
      state.user = user
    }
  }

  function initFromStorage(): void {
    const token = storage.getToken()
    const user = storage.getUser<User>()
    if (token) {
      state.token = token
    }
    if (user) {
      state.user = user
    }
  }

  return {
    state: readonly(state),
    permissions,
    dataScope,
    isLoggedIn,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isAdmin,
    isLabManager,
    isLabStaff,
    canAccessData,
    getUserId,
    getUserDepartment,
    login,
    logout,
    fetchCurrentUser,
    initFromStorage,
  }
}

const userStoreInstance = useUserStore()

export function getUserStore() {
  return userStoreInstance
}
