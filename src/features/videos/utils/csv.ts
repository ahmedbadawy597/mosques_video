import type { VideoRecord } from '../types'

export function videosToCsv(videos: VideoRecord[]): string {
  const header = 'اسم المسجد,المحافظة,تاريخ التصوير,رابط الموقع,رابط خريطة القصة'
  const rows = videos.map((row) =>
    [
      row.name,
      row.governorate,
      row.date,
      row.mapUrl,
      row.storyUrl,
    ]
      .map((cell) => `"${String(cell ?? '').replaceAll('"', '""')}"`)
      .join(','),
  )
  return `\uFEFF${header}\n${rows.join('\n')}`
}

export function downloadCsv(filename: string, csvContent: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
