/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ICS_PROXY_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
