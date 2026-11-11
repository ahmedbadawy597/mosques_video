import { describe, expect, it } from 'vitest'
import { parseStoryId } from './storymapExtract'

describe('parseStoryId', () => {
  it('accepts bare item ids', () => {
    expect(parseStoryId('bb05b26addb6450e81d6f28a27b2083b')).toBe(
      'bb05b26addb6450e81d6f28a27b2083b',
    )
  })

  it('parses storymaps URL paths', () => {
    expect(
      parseStoryId(
        'https://geoportal.strategizeit.us/arcgis/apps/storymaps/stories/bb05b26addb6450e81d6f28a27b2083b?locale=ar',
      ),
    ).toBe('bb05b26addb6450e81d6f28a27b2083b')
  })

  it('rejects invalid input', () => {
    expect(parseStoryId('')).toBeNull()
    expect(parseStoryId('https://example.com/page')).toBeNull()
  })
})
