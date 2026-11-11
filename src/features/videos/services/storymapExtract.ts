import { GOVERNORATES } from '@/constants/governorates'
import { APP_CONFIG } from '@/config/app'
import type { VideoRecord, VideoType } from '../types'

type JsonRecord = Record<string, unknown>

export interface StoryExtractResult {
  storyId: string
  storyTitle: string
  storyUrl: string
  videos: VideoRecord[]
  warnings: string[]
}

const STORY_ID_RE = /^[a-f0-9]{32}$/i

/** Accept full StoryMap URL or bare item id. */
export function parseStoryId(input: string): string | null {
  const raw = input.trim()
  if (!raw) return null
  if (STORY_ID_RE.test(raw)) return raw.toLowerCase()

  try {
    const url = new URL(raw)
    const fromPath =
      url.pathname.match(/\/(?:stories|items)\/([a-f0-9]{32})/i) ??
      url.pathname.match(/\/([a-f0-9]{32})\/?(?:$|\?)/i)
    if (fromPath?.[1]) return fromPath[1].toLowerCase()

    const fromQuery =
      url.searchParams.get('id') ||
      url.searchParams.get('storyId') ||
      url.searchParams.get('itemId')
    if (fromQuery && STORY_ID_RE.test(fromQuery)) {
      return fromQuery.toLowerCase()
    }
  } catch {
    return null
  }
  return null
}

function portalBase(): string {
  // Dev: Vite proxy. Prod: direct portal (same-origin deploy may still need reverse proxy).
  if (import.meta.env.DEV) return APP_CONFIG.portalProxyPath
  return APP_CONFIG.portalUrl
}

function withToken(url: string): string {
  const token = APP_CONFIG.storyToken
  if (!token) return url
  const sep = url.includes('?') ? '&' : '?'
  return `${url}${sep}token=${encodeURIComponent(token)}`
}

async function fetchPortalJson(url: string, signal?: AbortSignal): Promise<JsonRecord> {
  const res = await fetch(withToken(url), { signal })
  if (!res.ok) {
    throw new Error(`تعذر الاتصال ببوابة ArcGIS (HTTP ${res.status})`)
  }
  const data = (await res.json()) as JsonRecord
  const err = data.error as { code?: number; message?: string } | undefined
  if (err) {
    const code = err.code ?? 0
    const hint =
      code === 403 || code === 498
        ? ' — قد يكون العنصر خاصاً. راجع صلاحيات المشاركة.'
        : ''
    throw new Error(`${err.message || 'خطأ من البوابة'}${hint}`)
  }
  return data
}

function asNodes(data: JsonRecord): Record<string, JsonRecord> {
  const nodes = data.nodes
  if (!nodes || typeof nodes !== 'object') return {}
  return nodes as Record<string, JsonRecord>
}

function asResources(data: JsonRecord): Record<string, JsonRecord> {
  const resources = data.resources
  if (!resources || typeof resources !== 'object') return {}
  return resources as Record<string, JsonRecord>
}

function collectText(nodes: Record<string, JsonRecord>): string {
  const chunks: string[] = []
  for (const node of Object.values(nodes)) {
    const d = node.data
    if (!d || typeof d !== 'object') continue
    const data = d as JsonRecord
    for (const key of ['text', 'title', 'summary', 'caption', 'content'] as const) {
      const value = data[key]
      if (typeof value === 'string' && value.trim()) chunks.push(value)
    }
  }
  return chunks.join('\n')
}

function detectGovernorate(text: string): string {
  for (const gov of GOVERNORATES) {
    if (text.includes(gov)) return gov
  }
  for (const gov of GOVERNORATES) {
    const short = gov.replace(/^محافظة\s+/, '')
    if (short && text.includes(short)) return gov
  }
  return APP_CONFIG.unspecified
}

function findGoogleMapsUrl(text: string): string | null {
  const re =
    /https?:\/\/(?:www\.)?(?:maps\.google\.[^\s"'<>]+|google\.[^\s"'<>]*\/maps[^\s"'<>]*|goo\.gl\/maps[^\s"'<>]*|maps\.app\.goo\.gl[^\s"'<>]*)/gi
  const match = text.match(re)
  return match ? match[0] : null
}

function webMercatorToWgs84(x: number, y: number): { lat: number; lon: number } {
  const R = 6378137
  const lon = (x / R) * (180 / Math.PI)
  const lat =
    (Math.PI / 2 - 2 * Math.atan(Math.exp(-y / R))) * (180 / Math.PI)
  return { lat, lon }
}

function isWebMercator(sr: JsonRecord | undefined): boolean {
  if (!sr) return false
  const wkid = (sr.latestWkid as number | undefined) || (sr.wkid as number | undefined)
  return wkid === 3857 || wkid === 102100
}

function mapUrlFromWebmap(nodes: Record<string, JsonRecord>): string | null {
  for (const node of Object.values(nodes)) {
    if (node.type !== 'webmap' || !node.data || typeof node.data !== 'object') continue
    const data = node.data as JsonRecord
    const center = data.center as JsonRecord | undefined
    const extent = data.extent as JsonRecord | undefined
    const zoom = data.zoom as number | undefined

    let x: number | undefined
    let y: number | undefined
    let sr: JsonRecord | undefined

    if (
      center &&
      typeof center.x === 'number' &&
      typeof center.y === 'number'
    ) {
      x = center.x
      y = center.y
      sr = center.spatialReference as JsonRecord | undefined
    } else if (
      extent &&
      typeof extent.xmin === 'number' &&
      typeof extent.xmax === 'number' &&
      typeof extent.ymin === 'number' &&
      typeof extent.ymax === 'number'
    ) {
      x = (extent.xmin + extent.xmax) / 2
      y = (extent.ymin + extent.ymax) / 2
      sr = extent.spatialReference as JsonRecord | undefined
    } else {
      continue
    }

    let lat: number
    let lon: number
    if (isWebMercator(sr)) {
      ;({ lat, lon } = webMercatorToWgs84(x, y))
    } else if (sr && (sr.wkid === 4326 || sr.latestWkid === 4326)) {
      lon = x
      lat = y
    } else if (Math.abs(x) <= 180 && Math.abs(y) <= 90) {
      lon = x
      lat = y
    } else if (Math.abs(x) > 180) {
      ;({ lat, lon } = webMercatorToWgs84(x, y))
    } else {
      continue
    }

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) continue

    const z =
      typeof zoom === 'number' && Number.isFinite(zoom)
        ? Math.max(1, Math.min(21, Math.round(zoom)))
        : 18
    return `https://www.google.com/maps?q=${lat.toFixed(6)},${lon.toFixed(6)}&z=${z}`
  }
  return null
}

function resolveMapUrl(nodes: Record<string, JsonRecord>, text: string): string {
  return findGoogleMapsUrl(text) || mapUrlFromWebmap(nodes) || APP_CONFIG.unspecified
}

function findDate(text: string): string {
  const iso = text.match(/\b(20\d{2}-\d{2}-\d{2})\b/)
  if (iso?.[1]) return iso[1]
  const ar = text.match(
    /(?:تاريخ(?:\s+التصوير)?[:：]?\s*)(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/,
  )
  if (ar?.[1]) return ar[1]
  return APP_CONFIG.unspecified
}

function getCoverTitle(nodes: Record<string, JsonRecord>): string {
  for (const node of Object.values(nodes)) {
    if (node.type !== 'storycover' || !node.data || typeof node.data !== 'object') continue
    const title = (node.data as JsonRecord).title
    if (typeof title === 'string' && title.trim()) return title.trim()
  }
  return ''
}

function nearestHeading(
  nodes: Record<string, JsonRecord>,
  videoNodeId: string,
): string {
  const cover = getCoverTitle(nodes)
  if (cover) return cover

  for (const [id, node] of Object.entries(nodes)) {
    if (id === videoNodeId) continue
    if (node.type !== 'text' || !node.data || typeof node.data !== 'object') continue
    const data = node.data as JsonRecord
    if (
      ['h2', 'h3', 'h4', 'h1'].includes(String(data.type ?? '')) &&
      typeof data.text === 'string' &&
      data.text.trim()
    ) {
      return data.text.trim()
    }
  }
  return APP_CONFIG.unspecified
}

function classifyExternalUrl(url: string): VideoType {
  const u = url.toLowerCase()
  if (u.includes('youtube.com') || u.includes('youtu.be')) return 'youtube'
  if (u.includes('vimeo.com')) return 'vimeo'
  if (u.includes('.m3u8')) return 'hls'
  if (u.match(/\.(mp4|webm|ogg)(\?|$)/)) return 'mp4'
  return 'iframe'
}

function youtubeEmbed(url: string): string {
  try {
    const u = new URL(url)
    let id = u.searchParams.get('v')
    if (!id && u.hostname.includes('youtu.be')) {
      id = u.pathname.replace(/^\//, '')
    }
    if (!id && u.pathname.includes('/embed/')) {
      id = u.pathname.split('/embed/')[1] ?? null
    }
    return id ? `https://www.youtube.com/embed/${id}` : url
  } catch {
    return url
  }
}

function vimeoEmbed(url: string): string {
  const m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/)
  return m ? `https://player.vimeo.com/video/${m[1]}` : url
}

function resourceUrl(storyId: string, resourceName: string): string {
  return `${APP_CONFIG.portalUrl}/sharing/rest/content/items/${storyId}/resources/${resourceName}`
}

function extractVideosFromStory(
  storyId: string,
  item: JsonRecord,
  data: JsonRecord,
): { videos: VideoRecord[]; warnings: string[] } {
  const nodes = asNodes(data)
  const resources = asResources(data)
  const allText = collectText(nodes)
  const governorate = detectGovernorate(allText)
  const date = findDate(allText)
  const mapUrl = resolveMapUrl(nodes, allText)

  const itemUrl = typeof item.url === 'string' ? item.url : ''
  const baseStoryUrl =
    itemUrl || `${APP_CONFIG.portalUrl}/apps/storymaps/stories/${storyId}`
  const storyUrl = baseStoryUrl.includes('locale=')
    ? baseStoryUrl
    : `${baseStoryUrl}${baseStoryUrl.includes('?') ? '&' : '?'}locale=ar`

  const itemTitle =
    typeof item.title === 'string' && item.title.trim()
      ? item.title.trim()
      : ''
  const defaultName =
    getCoverTitle(nodes) || itemTitle || APP_CONFIG.unspecified

  const videos: VideoRecord[] = []
  const warnings: string[] = []

  for (const [nodeId, node] of Object.entries(nodes)) {
    if (node.type === 'video') {
      const nodeData = (node.data as JsonRecord | undefined) ?? {}
      const videoRef = nodeData.video
      const caption =
        (typeof nodeData.caption === 'string' && nodeData.caption) ||
        nearestHeading(nodes, nodeId) ||
        defaultName
      const name = String(caption).trim() || defaultName

      if (typeof videoRef !== 'string' || !resources[videoRef]) {
        warnings.push(`عقدة فيديو بدون مرجع مورد (${nodeId})`)
        continue
      }

      const res = resources[videoRef]
      const resData = ((res.data as JsonRecord | undefined) ?? {}) as JsonRecord

      if (resData.provider === 'item-resource' && typeof resData.resourceId === 'string') {
        const videoUrl = resourceUrl(storyId, resData.resourceId)
        const lower = resData.resourceId.toLowerCase()
        let videoType: VideoType = 'mp4'
        if (lower.endsWith('.m3u8')) videoType = 'hls'

        videos.push({
          id: `${storyId}-${nodeId}`,
          storyId,
          name,
          governorate,
          date,
          mapUrl,
          videoUrl,
          videoType,
          storyUrl,
          isLocal: true,
        })
      } else if (typeof resData.url === 'string' && resData.url) {
        const videoType = classifyExternalUrl(resData.url)
        let videoUrl = resData.url
        if (videoType === 'youtube') videoUrl = youtubeEmbed(resData.url)
        if (videoType === 'vimeo') videoUrl = vimeoEmbed(resData.url)
        videos.push({
          id: `${storyId}-${nodeId}`,
          storyId,
          name,
          governorate,
          date,
          mapUrl,
          videoUrl,
          videoType,
          storyUrl,
          isLocal: true,
        })
      } else {
        warnings.push(`تعذر حل مورد الفيديو (${nodeId})`)
      }
    }

    if (node.type === 'embed' || node.type === 'webpage') {
      const nodeData = (node.data as JsonRecord | undefined) ?? {}
      const url =
        (typeof nodeData.url === 'string' && nodeData.url) ||
        (typeof nodeData.src === 'string' && nodeData.src) ||
        (typeof nodeData.link === 'string' && nodeData.link) ||
        ''
      if (!url) continue
      const videoType = classifyExternalUrl(url)
      if (
        videoType !== 'youtube' &&
        videoType !== 'vimeo' &&
        videoType !== 'mp4' &&
        videoType !== 'hls'
      ) {
        continue
      }
      let videoUrl = url
      if (videoType === 'youtube') videoUrl = youtubeEmbed(url)
      if (videoType === 'vimeo') videoUrl = vimeoEmbed(url)
      const name =
        (typeof nodeData.caption === 'string' && nodeData.caption) ||
        nearestHeading(nodes, nodeId) ||
        defaultName
      videos.push({
        id: `${storyId}-${nodeId}`,
        storyId,
        name: String(name).trim() || defaultName,
        governorate,
        date,
        mapUrl,
        videoUrl,
        videoType,
        storyUrl,
        isLocal: true,
      })
    }
  }

  if (videos.length === 0) {
    warnings.push('لم يتم العثور على فيديوهات داخل خريطة القصة')
  }

  return { videos, warnings }
}

/** Fetch StoryMap item+data and extract video records. */
export async function extractFromStoryMapUrl(
  input: string,
  signal?: AbortSignal,
): Promise<StoryExtractResult> {
  const storyId = parseStoryId(input)
  if (!storyId) {
    throw new Error(
      'رابط غير صالح. الصق رابط ArcGIS StoryMap أو معرّف العنصر (32 حرفاً).',
    )
  }

  const base = portalBase()
  const itemUrl = `${base}/sharing/rest/content/items/${storyId}?f=json`
  const dataUrl = `${base}/sharing/rest/content/items/${storyId}/data?f=json`

  const [item, data] = await Promise.all([
    fetchPortalJson(itemUrl, signal),
    fetchPortalJson(dataUrl, signal),
  ])

  const { videos, warnings } = extractVideosFromStory(storyId, item, data)
  const storyTitle =
    (typeof item.title === 'string' && item.title.trim()) ||
    getCoverTitle(asNodes(data)) ||
    storyId

  const storyUrl =
    videos[0]?.storyUrl ||
    `${APP_CONFIG.portalUrl}/apps/storymaps/stories/${storyId}?locale=ar`

  return { storyId, storyTitle, storyUrl, videos, warnings }
}
