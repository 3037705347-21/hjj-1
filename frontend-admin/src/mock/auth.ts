import type { User, LoginRequest, LoginResponse } from '@/types/user'
import { storage } from '@/utils/storage'
import { generateId } from '@/utils/date'
import { addAuditLog } from './audit'

const mockUsers: User[] = [
  {
    id: '1',
    username: 'admin',
    name: '系统管理员',
    role: 'admin',
    department: '信息中心',
  },
  {
    id: '2',
    username: 'manager',
    name: '李主任',
    role: 'lab_manager',
    department: '生物实验室',
  },
  {
    id: '3',
    username: 'staff',
    name: '王实验员',
    role: 'lab_staff',
    department: '生物实验室',
  },
]

export function mockLogin(request: LoginRequest): Promise<LoginResponse> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const user = mockUsers.find(u => u.username === request.username)
      if (!user) {
        reject(new Error('用户不存在'))
        addAuditLog({ module: 'auth', operationType: 'login_fail', targetType: 'user', targetId: '', targetName: request.username, remark: '用户不存在' })
        return
      }
      if (request.password !== '123456') {
        reject(new Error('密码错误'))
        addAuditLog({ module: 'auth', operationType: 'login_fail', targetType: 'user', targetId: user.id, targetName: user.name, remark: '密码错误' })
        return
      }
      const token = 'token_' + generateId()
      resolve({ token, user })
      addAuditLog({ module: 'auth', operationType: 'login', targetType: 'user', targetId: user.id, targetName: user.name, remark: '账号密码登录' })
    }, 500)
  })
}

export function mockLogout(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const user = storage.getUser<User>()
      storage.removeToken()
      storage.removeUser()
      addAuditLog({ module: 'auth', operationType: 'logout', targetType: 'user', targetId: user?.id || '', targetName: user?.name || '', remark: '主动退出' })
      resolve()
    }, 200)
  })
}

export function mockGetCurrentUser(): Promise<User | null> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const user = storage.getUser<User>()
      resolve(user || null)
    }, 200)
  })
}
