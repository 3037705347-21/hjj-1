import type { Directive, DirectiveBinding } from 'vue'
import { getUserStore } from '@/stores/user'
import type { PermissionCode } from '@/types/permission'

type PermissionValue = PermissionCode | PermissionCode[] | {
  permission: PermissionCode | PermissionCode[]
  mode?: 'any' | 'all'
}

export const vPermission: Directive = {
  mounted(el: HTMLElement, binding: DirectiveBinding<PermissionValue>) {
    checkPermission(el, binding)
  },
  updated(el: HTMLElement, binding: DirectiveBinding<PermissionValue>) {
    if (binding.oldValue !== binding.value) {
      checkPermission(el, binding)
    }
  },
}

function checkPermission(el: HTMLElement, binding: DirectiveBinding<PermissionValue>) {
  const userStore = getUserStore()
  const value = binding.value

  if (!value) {
    return
  }

  let permissions: PermissionCode[]
  let mode: 'any' | 'all' = 'any'

  if (typeof value === 'string') {
    permissions = [value]
  } else if (Array.isArray(value)) {
    permissions = value
  } else {
    permissions = Array.isArray(value.permission) ? value.permission : [value.permission]
    mode = value.mode || 'any'
  }

  let hasAccess: boolean
  if (mode === 'all') {
    hasAccess = userStore.hasAllPermissions(permissions)
  } else {
    hasAccess = userStore.hasAnyPermission(permissions)
  }

  if (!hasAccess) {
    el.parentNode?.removeChild(el)
  }
}

export const vRole: Directive = {
  mounted(el: HTMLElement, binding: DirectiveBinding<'admin' | 'lab_manager' | 'lab_staff' | Array<'admin' | 'lab_manager' | 'lab_staff'>>) {
    checkRole(el, binding)
  },
  updated(el: HTMLElement, binding: DirectiveBinding<'admin' | 'lab_manager' | 'lab_staff' | Array<'admin' | 'lab_manager' | 'lab_staff'>>) {
    if (binding.oldValue !== binding.value) {
      checkRole(el, binding)
    }
  },
}

function checkRole(el: HTMLElement, binding: DirectiveBinding<'admin' | 'lab_manager' | 'lab_staff' | Array<'admin' | 'lab_manager' | 'lab_staff'>>) {
  const userStore = getUserStore()
  const value = binding.value

  if (!value) return

  const roles = Array.isArray(value) ? value : [value]
  const userRole = userStore.state.user?.role

  if (!userRole || !roles.includes(userRole)) {
    el.parentNode?.removeChild(el)
  }
}

export const setupPermissionDirectives = (app: any) => {
  app.directive('permission', vPermission)
  app.directive('role', vRole)
}
