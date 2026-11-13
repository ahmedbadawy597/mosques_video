import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from '@/lib/auth/tokenStorage'
import {
  ApiError,
  type ApiErrorBody,
  type ApiSuccess,
  type LoginResponse,
} from './types'

const API_BASE =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ||
  '/v1'

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'

interface RequestOptions {
  method?: HttpMethod
  body?: unknown
  auth?: boolean
  signal?: AbortSignal
}

let refreshPromise: Promise<string | null> | null = null

export function buildApiUrl(path: string) {
  const normalized = path.startsWith('/') ? path : `/${path}`
  if (API_BASE.startsWith('http')) {
    return `${API_BASE}${normalized}`
  }
  return `${API_BASE}${normalized}`
}

async function parseBody(res: Response) {
  const text = await res.text()
  if (!text) return null
  try {
    return JSON.parse(text) as unknown
  } catch {
    return text
  }
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) return null

  const res = await fetch(buildApiUrl('/auth/refresh'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ refreshToken }),
  })
  const payload = await parseBody(res)
  if (!res.ok) {
    clearTokens()
    return null
  }

  const data = (payload as ApiSuccess<LoginResponse> | null)?.data
  if (!data?.accessToken || !data.refreshToken) {
    clearTokens()
    return null
  }

  setTokens(data.accessToken, data.refreshToken)
  return data.accessToken
}

function ensureRefresh() {
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => {
      refreshPromise = null
    })
  }
  return refreshPromise
}

async function execAuthorized(path: string, options: RequestOptions = {}) {
  const { method = 'GET', body, auth = true, signal } = options
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  let token = auth ? getAccessToken() : null
  if (auth && token) headers.Authorization = `Bearer ${token}`

  const exec = () =>
    fetch(buildApiUrl(path), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    })

  let res = await exec()
  if (auth && res.status === 401) {
    token = await ensureRefresh()
    if (token) {
      headers.Authorization = `Bearer ${token}`
      res = await exec()
    }
  }
  return res
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const res = await execAuthorized(path, options)
  const payload = await parseBody(res)

  if (!res.ok) {
    const err =
      payload && typeof payload === 'object' && 'error' in (payload as object)
        ? (payload as ApiErrorBody).error
        : `HTTP ${res.status}`
    throw new ApiError(res.status, err)
  }

  if (payload && typeof payload === 'object' && 'success' in (payload as object)) {
    const envelope = payload as ApiSuccess<T> | ApiErrorBody
    if (!envelope.success) throw new ApiError(res.status, envelope.error)
    return envelope.data
  }

  return payload as T
}

export function apiGet<T>(path: string, auth = true) {
  return apiRequest<T>(path, { method: 'GET', auth })
}

export function apiPost<T>(path: string, body?: unknown, auth = true) {
  return apiRequest<T>(path, { method: 'POST', body, auth })
}
