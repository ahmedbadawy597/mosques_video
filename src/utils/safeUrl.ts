const ALLOWED_PROTOCOLS = new Set(['http:', 'https:', 'blob:'])

export function isSafeExternalUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return ALLOWED_PROTOCOLS.has(url.protocol)
  } catch {
    return false
  }
}

export function toSafeHref(value: string): string | null {
  if (!isSafeExternalUrl(value)) return null
  return value
}
