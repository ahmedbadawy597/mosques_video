import { APP_CONFIG } from '@/config/app'

export function isSpecified(value: string | null | undefined): boolean {
  if (!value) return false
  const trimmed = value.trim()
  return trimmed.length > 0 && trimmed !== APP_CONFIG.unspecified
}
