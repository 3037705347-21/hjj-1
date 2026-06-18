/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string
  readonly VITE_APP_ENV: string
  readonly VITE_API_BASE_URL: string
  readonly VITE_MOCK_ENABLED: string
  readonly VITE_SOURCE_MAP: string
  readonly VITE_DEVTOOLS_ENABLED: string
  readonly VITE_PORT: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare const __APP_ENV__: string
declare const __MOCK_ENABLED__: boolean

