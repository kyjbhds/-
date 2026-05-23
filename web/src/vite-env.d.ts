/// <reference types="vite/client" />

declare module '*.svg' {
  const content: React.FC<React.SVGProps<SVGSVGElement>>;
  export default content;
}

declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.jpg' {
  const content: string;
  export default content;
}

interface ImportMetaEnv {
  readonly VITE_BASE_TOKEN: string;
  readonly VITE_GLM_API_KEY: string;
  readonly VITE_FEISHU_APP_ID: string;
  readonly VITE_FEISHU_APP_SECRET: string;
  readonly VITE_FEISHU_CHAT_ID: string;
  readonly VITE_ADMIN_PASSWORD: string;
  readonly VITE_ALIYUN_FC_URL: string;
  readonly PROD: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
