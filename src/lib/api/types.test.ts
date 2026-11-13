import { describe, expect, it } from 'vitest'
import { isAssistantUser, type AuthUser } from './types'

function user(partial: Partial<AuthUser>): AuthUser {
  return {
    id: '1',
    username: 'u',
    fullName: 'User',
    role: 'minister',
    ...partial,
  }
}

describe('isAssistantUser', () => {
  it('accepts assistant role', () => {
    expect(isAssistantUser(user({ role: 'assistant' }))).toBe(true)
  })

  it('accepts assistant jobTitle', () => {
    expect(
      isAssistantUser(user({ role: 'staff_member', jobTitle: 'assistant' })),
    ).toBe(true)
  })

  it('rejects minister and empty', () => {
    expect(isAssistantUser(user({ role: 'minister' }))).toBe(false)
    expect(isAssistantUser(null)).toBe(false)
  })
})
