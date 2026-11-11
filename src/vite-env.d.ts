/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_STORY_TOKEN?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
