export type UserRole = 'admin' | 'lab_manager' | 'lab_staff' | 'safety_officer' | 'purchase_officer' | 'finance_officer'

export interface User {
  id: string
  username: string
  name: string
  role: UserRole
  avatar?: string
  department: string
}

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  token: string
  user: User
}

export const roleLabels: Record<UserRole, string> = {
  admin: '系统管理员',
  lab_manager: '实验室管理员',
  lab_staff: '普通实验员',
  safety_officer: '安全员',
  purchase_officer: '采购专员',
  finance_officer: '财务专员',
}
