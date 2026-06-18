export type UserRole = 'admin' | 'lab_manager' | 'lab_staff'

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
}
