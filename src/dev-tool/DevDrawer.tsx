// src/dev-tool/DevDrawer.tsx
// F3 侧栏抽屉：namespace 切换 + 分组注入项列表 + 执行日志

import { useMemo, useState } from 'react';
import { useDevNamespace, switchDevNamespace, clearDevSandbox } from './namespace';
import { allInjections } from './injections/_registry';
import type { DevInjection, DevInjectionGroup } from './types';

const GROUP_LABEL: Record<DevInjectionGroup, string> = {
  campaign: '闯关',
  advance: '进阶',
  rank: '段位赛',
  'in-game': '局内',
  navigation: '跳转 & 题型直达',
  ext: '扩展',
};

const GROUP_ORDER: DevInjectionGroup[] = [
  'navigation',
  'campaign',
  'advance',
  'rank',
  'in-game',
  'ext',
];

interface LogEntry {
  id: string;
  msg: string;
  ok: boolean;
  at: number;
}

export default function DevDrawer({ onClose }: { onClose: () => void }) {
  const ns = useDevNamespace();
  const [running, setRunning] = useState<string | null>(null);
  const [log, setLog] = useState<LogEntry[]>([]);

  const grouped = useMemo(() => {
    const out = new Map<DevInjectionGroup, DevInjection[]>();
    for (const g of GROUP_ORDER) out.set(g, []);
    for (const inj of allInjections) {
      const arr = out.get(inj.group) ?? [];
      arr.push(inj);
      out.set(inj.group, arr);
    }
    return out;
  }, []);

  const runInjection = async (inj: DevInjection): Promise<void> => {
    if (ns === 'main') {
      const ok = window.confirm(
        `⚠️ 当前处于「正式数据」模式。\n执行 "${inj.label}" 会改动真实进度，确认继续？`,
      );
      if (!ok) return;
    }
    setRunning(inj.id);
    try {
      await inj.run();
      setLog(l =>
        [{ id: inj.id, msg: `${inj.label} ✓`, ok: true, at: Date.now() }, ...l].slice(0, 30),
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setLog(l =>
        [{ id: inj.id, msg: `${inj.label}: ${msg}`, ok: false, at: Date.now() }, ...l].slice(0, 30),
      );
    } finally {
      setRunning(null);
    }
  };

  const handleClearSandbox = (): void => {
    if (!window.confirm('清空测试沙盒所有数据？（不影响正式数据）')) return;
    try {
      clearDevSandbox();
      setLog(l =>
        [{ id: 'clear-sandbox', msg: '清空测试沙盒 ✓', ok: true, at: Date.now() }, ...l].slice(0, 30),
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setLog(l =>
        [{ id: 'clear-sandbox', msg: `清空测试沙盒: ${msg}`, ok: false, at: Date.now() }, ...l].slice(0, 30),
      );
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex"
      role="dialog"
      aria-label="DEV 工具抽屉"
      aria-modal="true"
      style={{ fontFamily: 'Nunito, system-ui, sans-serif' }}
    >
      <div
        className="flex-1 bg-black/40 animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside className="w-[400px] max-w-full bg-[#FFF8F3] shadow-2xl flex flex-col">
        <header className="px-4 py-3 border-b border-[#EED9CC] flex items-center justify-between bg-white">
          <div>
            <h2 className="text-[17px] font-extrabold text-[#181818]">DEV 工具</h2>
            <p className="text-[11px] text-[#7A7A7A] mt-0.5">仅本地/内部版可见（F3 · v0.2-1-1）</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭"
            className="w-8 h-8 rounded-md text-[#7A7A7A] hover:bg-[#EED9CC]/40 hover:text-[#181818] text-2xl leading-none flex items-center justify-center"
          >
            ×
          </button>
        </header>

        <div
          className={`px-4 py-3 border-b ${
            ns === 'main' ? 'bg-[#FFF5F5] border-[#FF6B6B]/30' : 'bg-[#EAF9F0] border-[#3DBF6E]/30'
          }`}
        >
          <div className="flex items-center gap-2 text-[13px] font-semibold text-[#181818]">
            {ns === 'main' ? (
              <span>⚠️ 当前：正式数据（mq_*）</span>
            ) : (
              <span>🧪 当前：测试沙盒（mq_dev_*）</span>
            )}
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => switchDevNamespace('main')}
              className={`px-2 py-1.5 rounded-md text-[12px] font-bold border-2 transition-colors ${
                ns === 'main'
                  ? 'bg-[#FF6B35] text-[#3D1400] border-[#FF6B35]'
                  : 'bg-white text-[#181818] border-[#EED9CC] hover:border-[#FF6B35]'
              }`}
            >
              正式数据
            </button>
            <button
              type="button"
              onClick={() => switchDevNamespace('dev')}
              className={`px-2 py-1.5 rounded-md text-[12px] font-bold border-2 transition-colors ${
                ns === 'dev'
                  ? 'bg-[#3DBF6E] text-white border-[#3DBF6E]'
                  : 'bg-white text-[#181818] border-[#EED9CC] hover:border-[#3DBF6E]'
              }`}
            >
              测试沙盒
            </button>
          </div>
          {ns === 'dev' && (
            <button
              type="button"
              onClick={handleClearSandbox}
              className="mt-2 w-full px-2 py-1.5 rounded-md text-[12px] font-semibold bg-white text-[#FF6B6B] border border-[#FF6B6B]/60 hover:bg-[#FFF5F5]"
            >
              清空测试沙盒
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-3">
          {GROUP_ORDER.map(group => {
            const items = grouped.get(group) ?? [];
            if (items.length === 0) return null;
            return (
              <section key={group} className="mb-4">
                <h3 className="text-[11px] font-extrabold text-[#7A7A7A] uppercase tracking-wider mb-1.5 px-1">
                  {GROUP_LABEL[group]}
                  <span className="ml-1 text-[10px] text-[#C8C8C8]">({items.length})</span>
                </h3>
                <div className="flex flex-col gap-1.5">
                  {items.map(inj => (
                    <button
                      key={inj.id}
                      type="button"
                      disabled={running === inj.id}
                      onClick={() => runInjection(inj)}
                      title={inj.description}
                      className="text-left px-3 py-2 rounded-md bg-white border border-[#EED9CC] hover:border-[#FF6B35] hover:shadow-sm disabled:opacity-50 disabled:cursor-progress transition-colors"
                    >
                      <div className="text-[13px] font-bold text-[#181818] leading-tight">
                        {inj.label}
                      </div>
                      <div className="text-[11px] text-[#7A7A7A] mt-1 leading-snug">
                        {inj.description}
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        {log.length > 0 && (
          <div className="border-t border-[#EED9CC] bg-white px-3 py-2 max-h-[160px] overflow-y-auto">
            <h3 className="text-[11px] font-extrabold text-[#7A7A7A] uppercase tracking-wider mb-1 px-1">
              执行记录（最近 {log.length}）
            </h3>
            <ul className="space-y-0.5">
              {log.map((l, i) => (
                <li
                  key={`${l.id}-${l.at}-${i}`}
                  className={`text-[11px] font-mono leading-tight ${l.ok ? 'text-[#3DBF6E]' : 'text-[#FF6B6B]'}`}
                >
                  {l.msg}
                </li>
              ))}
            </ul>
          </div>
        )}
      </aside>

    </div>
  );
}
