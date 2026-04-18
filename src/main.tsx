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
