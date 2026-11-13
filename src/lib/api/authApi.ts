import { clearTokens, getRefreshToken, setTokens } from '@/lib/auth/tokenStorage'
import { apiGet, apiPost } from './client'
import type { AuthUser, LoginResponse } from './types'

export async function login(username: string, password: string) {
  const data = await apiPost<LoginResponse>(
    '/auth/login',
    { username, password },
    false,
  )
  setTokens(data.accessToken, data.refreshToken)
  return data
}

export async function logout() {
  const refreshToken = getRefreshToken()
  try {
    if (refreshToken) {
      await apiPost<void>('/auth/logout', { refreshToken })
    }
  } catch {
    // ignore network errors on logout
  } finally {
    clearTokens()
  }
}

export function fetchMe() {
  return apiGet<AuthUser>('/auth/me')
}
