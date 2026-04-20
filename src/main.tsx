import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/styles/globals.css'
import 'katex/dist/katex.min.css'
import App from './App.tsx'
import A03PlusComparisonPreview from './previews/A03PlusComparisonPreview.tsx'

const searchParams = new URLSearchParams(window.location.search)
const previewPage = import.meta.env.DEV ? searchParams.get('preview') : null
const rootPage = previewPage === 'a03plus' ? <A03PlusComparisonPreview /> : <App />

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {rootPage}
  </StrictMode>,
)

// F3 开发者工具栏（v0.2-1-1）
// 本地 dev 自动开；生产构建仅当 VITE_ENABLE_DEV_TOOL=1 时开（双构建双路径）
// 关键：通过动态 import 让 Rollup 的常量折叠 + DCE 把纯净版产物里的整块 dev-tool 代码丢弃
if (import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEV_TOOL === '1') {
  import('@/dev-tool').then(m => m.mountDevTool())
}
