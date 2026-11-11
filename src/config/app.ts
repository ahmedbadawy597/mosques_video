export const APP_CONFIG = {
  title: 'المنصة الرقمية للتصوير الجوى والرفع المساحى',
  orgName: 'وزارة الأوقاف المصرية',
  poweredBy: 'Powered by strategizeit-egypt',
  catalogUrl: '/videos.json',
  logoUrl: '/logo.jpg',
  unspecified: 'غير محدد',
  storageKey: 'mosques_videos_extra',
  deletedKey: 'mosques_videos_deleted',
  themeKey: 'mosques_theme',
  /** Public ArcGIS portal hosting Awqaf StoryMaps */
  portalUrl: 'https://geoportal.strategizeit.us/arcgis',
  /** Dev-only Vite proxy path (avoids browser CORS) */
  portalProxyPath: '/arcgis-portal',
  /** Optional sharing token for private items (Vite env) */
  storyToken: (import.meta.env.VITE_STORY_TOKEN as string | undefined) ?? '',
} as const
