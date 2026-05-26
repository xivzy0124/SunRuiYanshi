import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',       // 限制只监听本地
    port: 7000,
    strictPort: false,        // 如果端口被占用则报错，而不是自动更换
    open: true,              // 自动打开浏览器
    cors: {                  // 配置 CORS ⭐关键
      origin: 'http://localhost:5173',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true
    }
  }
})