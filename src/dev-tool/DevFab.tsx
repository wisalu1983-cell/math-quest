// src/dev-tool/DevFab.tsx
// F3 右上角悬浮入口：DEV 工具 + 题型展示面板

import { useState } from 'react';
import DevDrawer from './DevDrawer';
import QuestionBrowserPanel, { type QuestionBrowserSelection } from './QuestionBrowserPanel';
import { useDevNamespace } from './namespace';

export default function DevFab() {
  const [open, setOpen] = useState(false);
  const [questionBrowserOpen, setQuestionBrowserOpen] = useState(false);
  const [questionBrowserSelection, setQuestionBrowserSelection] =
    useState<QuestionBrowserSelection | null>(null);
  const ns = useDevNamespace();
  const isDev = ns === 'dev';

  return (
    <>
      <div
        className="fixed right-4 top-20 z-[9998] flex gap-2"
        style={{ fontFamily: 'Nunito, system-ui, sans-serif' }}
      >
        <button
          type="button"
          aria-label="打开题型一览面板"
          title="题型一览"
          onClick={() => setQuestionBrowserOpen(true)}
          className="h-9 rounded-md border-2 border-[#2980B9] bg-[#EAF4FF] px-3 text-[12px] font-extrabold text-[#1C5C8F] shadow-[0_6px_18px_rgba(41,128,185,0.22)] transition-colors hover:bg-[#D8ECFF] focus:outline-none focus:ring-2 focus:ring-[#2980B9]/40 active:bg-[#CDE6FF]"
        >
          题型
        </button>
        <button
          type="button"
          aria-label="打开 DEV 工具抽屉"
          title="DEV 工具（F3）"
          onClick={() => setOpen(true)}
          className="h-9 rounded-md px-3 text-[12px] font-extrabold text-white shadow-[0_6px_18px_rgba(0,0,0,0.28)] transition-colors hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-[#181818]/30 active:brightness-95"
          style={{
            background: isDev ? '#3DBF6E' : '#181818',
            letterSpacing: '0.5px',
          }}
        >
          DEV
        </button>
      </div>
      {open && <DevDrawer onClose={() => setOpen(false)} />}
      {questionBrowserOpen && (
        <QuestionBrowserPanel
          namespace={ns}
          onClose={() => setQuestionBrowserOpen(false)}
          onLog={() => {}}
          initialTopicId={questionBrowserSelection?.topicId}
          initialSubtypeId={questionBrowserSelection?.subtypeId}
          onSelectionChange={setQuestionBrowserSelection}
        />
      )}
    </>
  );
}
