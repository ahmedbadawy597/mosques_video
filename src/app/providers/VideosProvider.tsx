import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  loadDeletedIds,
  loadExtraVideos,
  mergeCatalogWithExtras,
  saveDeletedIds,
  saveExtraVideos,
} from '@/features/videos/services/localVideosStorage'
import { fetchVideoCatalog } from '@/features/videos/services/videosApi'
import type { AsyncStatus, VideoRecord } from '@/features/videos/types'
import { computeVideoStats } from '@/features/videos/utils/stats'

export interface AddVideosResult {
  added: number
  skipped: number
}

interface VideosContextValue {
  videos: VideoRecord[]
  status: AsyncStatus
  error: string | null
  stats: ReturnType<typeof computeVideoStats>
  reload: () => Promise<void>
  addVideo: (video: VideoRecord) => void
  addVideos: (incoming: VideoRecord[]) => AddVideosResult
  updateVideo: (video: VideoRecord) => void
  deleteVideo: (id: string) => void
}

const VideosContext = createContext<VideosContextValue | null>(null)

export function VideosProvider({ children }: { children: ReactNode }) {
  const [catalog, setCatalog] = useState<VideoRecord[]>([])
  const [extras, setExtras] = useState<VideoRecord[]>(() => loadExtraVideos())
  const [deletedIds, setDeletedIds] = useState<string[]>(() => loadDeletedIds())
  const [status, setStatus] = useState<AsyncStatus>('idle')
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setStatus('loading')
    setError(null)
    try {
      const data = await fetchVideoCatalog()
      setCatalog(data)
      setStatus('success')
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      setStatus('error')
      setError(
        err instanceof Error
          ? err.message
          : 'تعذر تحميل بيانات الفيديوهات',
      )
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  const videos = useMemo(
    () => mergeCatalogWithExtras(catalog, extras, deletedIds),
    [catalog, extras, deletedIds],
  )

  const stats = useMemo(() => computeVideoStats(videos), [videos])

  const addVideo = useCallback((video: VideoRecord) => {
    setDeletedIds((prev) => {
      if (!prev.includes(video.id)) return prev
      const next = prev.filter((id) => id !== video.id)
      saveDeletedIds(next)
      return next
    })
    setExtras((prev) => {
      const next = [video, ...prev.filter((v) => v.id !== video.id)]
      saveExtraVideos(next)
      return next
    })
  }, [])

  const addVideos = useCallback(
    (incoming: VideoRecord[]): AddVideosResult => {
      const existingIds = new Set([
        ...catalog.map((v) => v.id),
        ...extras.map((v) => v.id),
      ])
      for (const id of deletedIds) existingIds.delete(id)

      const fresh: VideoRecord[] = []
      let skipped = 0
      for (const video of incoming) {
        if (existingIds.has(video.id) && !deletedIds.includes(video.id)) {
          skipped += 1
          continue
        }
        existingIds.add(video.id)
        fresh.push({ ...video, isLocal: true })
      }
      if (fresh.length > 0) {
        const restoreIds = new Set(fresh.map((v) => v.id))
        setDeletedIds((prev) => {
          const next = prev.filter((id) => !restoreIds.has(id))
          if (next.length !== prev.length) saveDeletedIds(next)
          return next
        })
        setExtras((prev) => {
          const without = prev.filter((v) => !restoreIds.has(v.id))
          const next = [...fresh, ...without]
          saveExtraVideos(next)
          return next
        })
      }
      return { added: fresh.length, skipped }
    },
    [catalog, extras, deletedIds],
  )

  const updateVideo = useCallback((video: VideoRecord) => {
    setExtras((prev) => {
      const idx = prev.findIndex((v) => v.id === video.id)
      const next =
        idx >= 0
          ? prev.map((v) => (v.id === video.id ? { ...video, isLocal: true } : v))
          : [{ ...video, isLocal: true }, ...prev]
      saveExtraVideos(next)
      return next
    })
  }, [])

  const deleteVideo = useCallback((id: string) => {
    setCatalog((prev) => prev.filter((v) => v.id !== id))
    setExtras((prev) => {
      const next = prev.filter((v) => v.id !== id)
      saveExtraVideos(next)
      return next
    })
    setDeletedIds((prev) => {
      if (prev.includes(id)) return prev
      const next = [...prev, id]
      saveDeletedIds(next)
      return next
    })
  }, [])

  const value = useMemo(
    () => ({
      videos,
      status,
      error,
      stats,
      reload,
      addVideo,
      addVideos,
      updateVideo,
      deleteVideo,
    }),
    [
      videos,
      status,
      error,
      stats,
      reload,
      addVideo,
      addVideos,
      updateVideo,
      deleteVideo,
    ],
  )

  return (
    <VideosContext.Provider value={value}>{children}</VideosContext.Provider>
  )
}

export function useVideos(): VideosContextValue {
  const ctx = useContext(VideosContext)
  if (!ctx) throw new Error('useVideos must be used within VideosProvider')
  return ctx
}
