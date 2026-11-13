export type JobTitle =
  | 'minister'
  | 'assistant'
  | 'staff_member'
  | 'preachers_admin'
  | string

export interface AuthUser {
  id: string
  username: string
  email?: string
  fullName: string
  /** Backend sets this to jobTitle */
  role: JobTitle
  jobTitle?: JobTitle | null
  lastLoginAt?: string | null
}

export interface LoginResponse {
  accessToken: string
  refreshToken: string
  expiresIn: number
  token?: string
  user: AuthUser
}

export interface ApiSuccess<T> {
  success: true
  data: T
  meta?: Record<string, unknown>
}

export interface ApiErrorBody {
  success: false
  error: {
    code: string
    message: string
    details?: Array<{ field?: string; message: string }>
  }
}

export class ApiError extends Error {
  code: string
  status: number

  constructor(status: number, body: ApiErrorBody['error'] | string) {
    const message = typeof body === 'string' ? body : body.message
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = typeof body === 'string' ? 'UNKNOWN' : body.code
  }
}

export function isAssistantUser(user: AuthUser | null | undefined): boolean {
  if (!user) return false
  return user.role === 'assistant' || user.jobTitle === 'assistant'
}
