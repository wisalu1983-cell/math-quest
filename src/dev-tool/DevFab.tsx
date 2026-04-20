// src/dev-tool/DevFab.tsx
// F3 右下角悬浮按钮（FAB）

import { useState } from 'react';
import DevDrawer from './DevDrawer';
import { useDevNamespace } from './namespace';

export default function DevFab() {
  const [open, setOpen] = useState(false);
  const ns = useDevNamespace();
  const isDev = ns === 'dev';

  return (
    <>
      <button
        type="button"
        aria-label="打开 DEV 工具抽屉"
        title="DEV 工具（F3）"
        onClick={() => setOpen(true)}
        className="fixed right-4 bottom-4 z-[9998] size-14 rounded-full font-extrabold shadow-[0_6px_20px_rgba(0,0,0,0.35)] flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
        style={{
          background: isDev ? '#3DBF6E' : '#181818',
          color: '#fff',
          fontFamily: 'Nunito, system-ui, sans-serif',
          letterSpacing: '0.5px',
        }}
      >
        DEV
      </button>
      {open && <DevDrawer onClose={() => setOpen(false)} />}
    </>
  );
}
