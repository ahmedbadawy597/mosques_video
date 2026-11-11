import { describe, expect, it } from 'vitest'
import { computeVideoStats } from './stats'
import type { VideoRecord } from '../types'

const sample = (partial: Partial<VideoRecord>): VideoRecord => ({
  id: '1',
  storyId: 's',
  name: 'مسجد',
  governorate: 'محافظة القاهرة',
  date: 'غير محدد',
  mapUrl: 'غير محدد',
  videoUrl: 'https://example.com/a.mp4',
  videoType: 'mp4',
  storyUrl: 'https://example.com/story',
  ...partial,
})

describe('computeVideoStats', () => {
  it('counts videos, unique governorates, and unique mosques', () => {
    const stats = computeVideoStats([
      sample({ id: '1', name: 'أ', governorate: 'محافظة القاهرة' }),
      sample({ id: '2', name: 'ب', governorate: 'محافظة القاهرة' }),
      sample({ id: '3', name: 'أ', governorate: 'محافظة الجيزة' }),
      sample({ id: '4', name: 'ج', governorate: 'غير محدد' }),
    ])

    expect(stats.totalVideos).toBe(4)
    expect(stats.uniqueGovernorates).toBe(2)
    expect(stats.uniqueMosques).toBe(3)
  })
})
