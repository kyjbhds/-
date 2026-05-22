import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api/bitable': {
        target: 'https://open.feishu.cn/open-apis/bitable/v1',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/bitable/, ''),
        timeout: 30000,
      }
    }
  }
})
