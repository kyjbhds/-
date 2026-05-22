/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BASE_TOKEN: string;
  readonly VITE_OPENAI_API_KEY: string;
  readonly VITE_FEISHU_BOT_WEBHOOK: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
