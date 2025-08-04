/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PUBLIC_CLIENT_PLATFORM?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
