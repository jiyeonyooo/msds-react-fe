import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        // 개발 중 /api 요청을 Spring 서버로 넘겨 같은 오리진처럼 다룬다(별도 CORS 설정 불필요).
        // 백엔드 주소가 다르면 .env.development의 VITE_API_PROXY_TARGET으로 바꾼다.
        '/api': {
          target: env.VITE_API_PROXY_TARGET || 'http://localhost:8080',
          changeOrigin: true,
        },
      },
    },
  }
})
