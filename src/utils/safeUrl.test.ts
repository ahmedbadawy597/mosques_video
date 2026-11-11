import { describe, expect, it } from 'vitest'
import { isSafeExternalUrl, toSafeHref } from './safeUrl'

describe('safeUrl', () => {
  it('allows http/https/blob and rejects javascript:', () => {
    expect(isSafeExternalUrl('https://example.com')).toBe(true)
    expect(isSafeExternalUrl('blob:http://localhost/1')).toBe(true)
    expect(isSafeExternalUrl('javascript:alert(1)')).toBe(false)
    expect(toSafeHref('javascript:alert(1)')).toBeNull()
  })
})
