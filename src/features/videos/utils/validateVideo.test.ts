import { describe, expect, it } from 'vitest'
import { normalizeVideoCatalog } from './validateVideo'

describe('normalizeVideoCatalog', () => {
  it('normalizes valid records and drops invalid ones', () => {
    const result = normalizeVideoCatalog([
      {
        id: 'a',
        name: 'مسجد الاختبار',
        videoUrl: 'https://example.com/v.mp4',
        videoType: 'mp4',
      },
      { name: 'بدون رابط' },
      null,
    ])

    expect(result).toHaveLength(1)
    expect(result[0]?.name).toBe('مسجد الاختبار')
    expect(result[0]?.governorate).toBe('غير محدد')
  })

  it('throws on non-array payload', () => {
    expect(() => normalizeVideoCatalog({ videos: [] })).toThrow(/مصفوفة/)
  })
})
