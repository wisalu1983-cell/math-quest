// src/dev-tool/index.tsx
// F3 开发者工具栏入口（v0.2-1-1）
//
// 这个模块被**动态 import**（`import('@/dev-tool')`）。守卫在 main.tsx 完成：
//   只有 `import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEV_TOOL === '1'` 为真时
//   才会触发 import。生产纯净构建下常量求值为 false，Rollup DCE 会把整块 import 丢弃，
//   从而不生成 dev-tool 相关 chunk。
//
// 因此这里保留 top-level import，不再做二次守卫。

import { createRoot } from 'react-dom/client';
import DevFab from './DevFab';

const MOUNT_NODE_ID = 'mq-dev-tool-root';

export function mountDevTool(): void {
  if (typeof document === 'undefined') return;
  if (document.getElementById(MOUNT_NODE_ID)) return;
  const el = document.createElement('div');
  el.id = MOUNT_NODE_ID;
  document.body.appendChild(el);
  createRoot(el).render(<DevFab />);
}
