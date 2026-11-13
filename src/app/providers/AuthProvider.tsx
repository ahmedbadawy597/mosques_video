import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { fetchMe, login as loginRequest, logout as logoutRequest } from '@/lib/api/authApi'
import { ApiError, isAssistantUser, type AuthUser } from '@/lib/api/types'
import { clearTokens, getAccessToken, getRefreshToken } from '@/lib/auth/tokenStorage'

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  isAuthenticated: boolean
  isAssistant: boolean
  login: (username: string, password: string) => Promise<AuthUser>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  const bootstrap = useCallback(async () => {
    if (!getAccessToken() && !getRefreshToken()) {
      setUser(null)
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const me = await fetchMe()
      setUser(me)
    } catch {
      clearTokens()
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void bootstrap()
  }, [bootstrap])

  const login = useCallback(async (username: string, password: string) => {
    const data = await loginRequest(username.trim(), password)
    try {
      const me = await fetchMe()
      const merged = { ...data.user, ...me }
      setUser(merged)
      return merged
    } catch {
      setUser(data.user)
      return data.user
    }
  }, [])

  const logout = useCallback(async () => {
    await logoutRequest()
    setUser(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      isAssistant: isAssistantUser(user),
      login,
      logout,
    }),
    [user, loading, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export function getAuthErrorMessage(err: unknown) {
  if (err instanceof ApiError) return err.message
  if (err instanceof Error) return err.message
  return 'حدث خطأ غير متوقع'
}
