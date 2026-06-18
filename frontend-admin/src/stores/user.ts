import { reactive, readonly } from 'vue'
import type { User, LoginRequest } from '@/types/user'
import { mockLogin, mockLogout, mockGetCurrentUser } from '@/mock/auth'
import { storage } from '@/utils/storage'

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

  async function login(request: LoginRequest): Promise<void> {
    state.loading = true
    try {
      const result = await mockLogin(request)
      state.token = result.token
      state.user = result.user
      storage.setToken(result.token)
      storage.setUser(result.user)
    } finally {
      state.loading = false
    }
  }

  async function logout(): Promise<void> {
    await mockLogout()
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
    isLoggedIn,
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
