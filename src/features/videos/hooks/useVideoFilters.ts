import { useMemo } from 'react'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import type { VideoFilters, VideoRecord } from '../types'

export function useVideoFilters(
  videos: VideoRecord[],
  filters: VideoFilters,
): VideoRecord[] {
  const debouncedSearch = useDebouncedValue(filters.search.trim().toLowerCase(), 200)

  return useMemo(() => {
    return videos.filter((item) => {
      const matchesSearch =
        debouncedSearch.length === 0 ||
        item.name.toLowerCase().includes(debouncedSearch) ||
        item.governorate.toLowerCase().includes(debouncedSearch)

      const matchesGov =
        filters.governorate === '' || item.governorate === filters.governorate

      const matchesDate = filters.date === '' || item.date === filters.date

      return matchesSearch && matchesGov && matchesDate
    })
  }, [videos, debouncedSearch, filters.governorate, filters.date])
}
