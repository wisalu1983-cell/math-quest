import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// v0.2-1-1（F3 开发者工具栏）· 双构建双路径：
//   - `npm run build`                          → /math-quest/           纯净版（生产）
//   - `npm run build:with-dev-tool`            → /math-quest/dev/       带 F3 版（生产）
//   - `npm run dev`                            → /                       本地开发
export default defineConfig(() => {
  const isProd = process.env.NODE_ENV === 'production'
  const devToolEnabled = process.env.VITE_ENABLE_DEV_TOOL === '1'
  const base = !isProd
    ? '/'
    : devToolEnabled
      ? '/math-quest/dev/'
      : '/math-quest/'

  return {
    base,
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    test: {
      globals: true,
      include: ['src/**/*.test.ts'],
    },
  }
})
