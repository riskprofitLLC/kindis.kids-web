/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string
  // ВРЕМЕННЫЙ dev-механизм:кнопки входа без пароля,только при import.meta.env.DEV.
  readonly VITE_DEV_LOGIN?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
