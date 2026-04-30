import { useMemo, useRef, useState } from 'react';
import { Eye, RefreshCw, X } from 'lucide-react';
import {
  getQuestionBrowserSubtypes,
  getQuestionBrowserTopics,
  refreshQuestionBrowserPractice,
  startQuestionBrowserPractice,
  type QuestionBrowserSubtype,
} from './question-browser';
import type { Question, TopicId } from '@/types';

type DevNamespace = 'main' | 'dev';

interface LatestQuestion {
  topicLabel: string;
  subtype: QuestionBrowserSubtype;
  question: Question;
}

export interface QuestionBrowserSelection {
  topicId: TopicId;
  subtypeId: string;
}

interface QuestionBrowserPanelProps {
  namespace: DevNamespace;
  onClose: () => void;
  onLog: (msg: string, ok: boolean) => void;
  onShowQuestion?: () => void;
  initialTopicId?: TopicId;
  initialSubtypeId?: string;
  onSelectionChange?: (selection: QuestionBrowserSelection) => void;
}

function groupSubtypes(subtypes: QuestionBrowserSubtype[]): Array<{
  family: string;
  items: QuestionBrowserSubtype[];
}> {
  const groups = new Map<string, QuestionBrowserSubtype[]>();
  for (const subtype of subtypes) {
    const family = subtype.family ?? '子题型';
    const items = groups.get(family) ?? [];
    items.push(subtype);
    groups.set(family, items);
  }
  return Array.from(groups, ([family, items]) => ({ family, items }));
}

function formatQuestionMeta(question: Question): string {
  return `${question.type} · d${question.difficulty}`;
}

export default function QuestionBrowserPanel({
  namespace,
  onClose,
  onLog,
  onShowQuestion,
  initialTopicId,
  initialSubtypeId,
  onSelectionChange,
}: QuestionBrowserPanelProps) {
  const topics = useMemo(() => getQuestionBrowserTopics(), []);
  const topicStats = useMemo(
    () => topics.map(topic => ({
      ...topic,
      count: getQuestionBrowserSubtypes(topic.id).length,
    })),
    [topics],
  );
  const totalSubtypes = useMemo(
    () => topicStats.reduce((sum, topic) => sum + topic.count, 0),
    [topicStats],
  );
  const [activeTopicId, setActiveTopicId] = useState<TopicId>(() => {
    if (initialTopicId && topics.some(topic => topic.id === initialTopicId)) return initialTopicId;
    return topics[0]?.id ?? 'mental-arithmetic';
  });
  const subtypes = useMemo(() => getQuestionBrowserSubtypes(activeTopicId), [activeTopicId]);
  const [activeSubtypeId, setActiveSubtypeId] = useState<string>(() => {
    if (initialSubtypeId && subtypes.some(subtype => subtype.id === initialSubtypeId)) {
      return initialSubtypeId;
    }
    return subtypes[0]?.id ?? '';
  });
  const [latest, setLatest] = useState<LatestQuestion | null>(null);
  const [busySubtypeId, setBusySubtypeId] = useState<string | null>(null);
  const mainConfirmedRef = useRef(false);

  const activeTopic = topics.find(topic => topic.id === activeTopicId) ?? topics[0] ?? null;
  const activeSubtype =
    subtypes.find(subtype => subtype.id === activeSubtypeId) ?? subtypes[0] ?? null;
  const groupedSubtypes = useMemo(() => groupSubtypes(subtypes), [subtypes]);

  const confirmMainNamespace = (): boolean => {
    if (namespace !== 'main' || mainConfirmedRef.current) return true;
    const ok = window.confirm(
      '当前处于「正式数据」模式。启动题型一览样题后，如果继续答题/结算，可能写入正式记录，确认继续？',
    );
    mainConfirmedRef.current = ok;
    return ok;
  };

  const selectTopic = (topicId: TopicId): void => {
    const nextSubtypes = getQuestionBrowserSubtypes(topicId);
    const nextSubtypeId = nextSubtypes[0]?.id ?? '';
    setActiveTopicId(topicId);
    setActiveSubtypeId(nextSubtypeId);
    onSelectionChange?.({ topicId, subtypeId: nextSubtypeId });
    setLatest(null);
  };

  const launchSubtype = (
    subtype: QuestionBrowserSubtype | null,
    mode: 'open' | 'refresh',
  ): void => {
    if (!activeTopic || !subtype || !confirmMainNamespace()) return;

    setBusySubtypeId(subtype.id);
    try {
      const question = mode === 'refresh'
        ? refreshQuestionBrowserPractice({ topicId: activeTopicId, subtypeId: subtype.id })
        : startQuestionBrowserPractice({ topicId: activeTopicId, subtypeId: subtype.id });
      setLatest({ topicLabel: activeTopic.label, subtype, question });
      onLog(
        `${mode === 'refresh' ? '刷新题型一览' : '打开题型一览'}：${activeTopic.label} / ${subtype.tag} ✓ ${question.prompt}`,
        true,
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      onLog(`题型一览: ${msg}`, false);
    } finally {
      setBusySubtypeId(null);
    }
  };

  const viewQuestion = (): void => {
    onClose();
    onShowQuestion?.();
  };

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-start justify-center bg-[#121212]/55 px-3 py-4 sm:px-6"
      role="dialog"
      aria-label="题型展示面板"
      aria-modal="true"
      style={{ fontFamily: 'Nunito, system-ui, sans-serif' }}
    >
      <section className="flex max-h-[calc(100vh-32px)] w-full max-w-[1040px] flex-col overflow-hidden rounded-lg border border-[#BCD2E8] bg-[#F8FBFF] shadow-2xl">
        <header className="border-b border-[#D9E7F4] bg-white px-4 py-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-[18px] font-extrabold leading-tight text-[#181818]">
                题型展示面板
              </h2>
              <p className="mt-0.5 text-[11px] font-bold text-[#5E748A]">
                {topics.length} 个大题型 · {totalSubtypes} 个子题型
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="关闭题型展示面板"
              title="关闭"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-[#6B7480] transition-colors hover:bg-[#EEF4FA] hover:text-[#181818] focus:outline-none focus:ring-2 focus:ring-[#2980B9]/40"
            >
              <X size={18} strokeWidth={2.4} />
            </button>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-6">
            {topicStats.map(topic => {
              const active = topic.id === activeTopicId;
              return (
                <button
                  key={topic.id}
                  type="button"
                  onClick={() => selectTopic(topic.id)}
                  className={`min-w-0 rounded-md border px-2 py-2 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-[#2980B9]/40 ${
                    active
                      ? 'border-[#2980B9] bg-[#EAF4FF] text-[#174F7C]'
                      : 'border-[#D9E7F4] bg-white text-[#334155] hover:border-[#8DB5D9]'
                  }`}
                >
                  <span className="block truncate text-[12px] font-extrabold">
                    {topic.label}
                  </span>
                  <span className="mt-0.5 block text-[10px] font-bold opacity-70">
                    {topic.count} 项
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex flex-col gap-2 rounded-md border border-[#D9E7F4] bg-[#F8FBFF] px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="truncate text-[12px] font-extrabold text-[#181818]">
                {activeSubtype ? activeSubtype.label : '无子题型'}
              </p>
              <p className="mt-0.5 truncate text-[10px] font-semibold text-[#6B7480]">
                {activeTopic?.label ?? activeTopicId} / {activeSubtype?.tag ?? '-'}
              </p>
            </div>
            <button
              type="button"
              disabled={!activeSubtype || busySubtypeId != null}
              onClick={() => launchSubtype(activeSubtype, 'refresh')}
              title="刷新当前子题型"
              className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-md border-2 border-[#2980B9] bg-[#EAF4FF] px-3 text-[12px] font-extrabold text-[#1C5C8F] transition-colors hover:bg-[#D8ECFF] disabled:cursor-not-allowed disabled:border-[#C8C8C8] disabled:bg-white disabled:text-[#7A7A7A] focus:outline-none focus:ring-2 focus:ring-[#2980B9]/40"
            >
              <RefreshCw size={15} strokeWidth={2.4} />
              刷新
            </button>
          </div>
        </header>

        <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-h-0 overflow-y-auto px-4 py-3">
            <div className="space-y-3">
              {groupedSubtypes.map(group => (
                <section key={group.family}>
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <h3 className="truncate text-[11px] font-extrabold uppercase tracking-wider text-[#5E748A]">
                      {group.family}
                    </h3>
                    <span className="shrink-0 text-[10px] font-bold text-[#9AA8B6]">
                      {group.items.length}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 xl:grid-cols-3">
                    {group.items.map(subtype => {
                      const active = subtype.id === activeSubtype?.id;
                      const busy = busySubtypeId === subtype.id;
                      return (
                        <button
                          key={subtype.id}
                          type="button"
                          disabled={busySubtypeId != null}
                          onClick={() => {
                            setActiveSubtypeId(subtype.id);
                            onSelectionChange?.({ topicId: activeTopicId, subtypeId: subtype.id });
                            launchSubtype(subtype, 'open');
                          }}
                          title={subtype.id}
                          className={`min-h-[54px] min-w-0 rounded-md border px-2.5 py-2 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-[#2980B9]/40 disabled:cursor-progress disabled:opacity-70 ${
                            active
                              ? 'border-[#FF922B] bg-[#FFF3E4] text-[#633600]'
                              : 'border-[#D9E7F4] bg-white text-[#26384A] hover:border-[#FF922B]/70 hover:bg-[#FFF9F1]'
                          }`}
                        >
                          <span className="block truncate text-[12px] font-extrabold leading-tight">
                            {subtype.label}
                          </span>
                          <span className="mt-1 block truncate text-[10px] font-bold opacity-65">
                            {busy ? '生成中' : subtype.tag}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          </div>

          <aside className="min-h-0 border-t border-[#D9E7F4] bg-white px-4 py-3 lg:border-l lg:border-t-0">
            <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-[#5E748A]">
              当前样题
            </h3>
            {latest ? (
              <div className="mt-2 flex h-full min-h-0 flex-col gap-3">
                <div className="rounded-md border border-[#E6EEF6] bg-[#F8FBFF] px-3 py-2">
                  <p className="truncate text-[12px] font-extrabold text-[#181818]">
                    {latest.topicLabel} / {latest.subtype.label}
                  </p>
                  <p className="mt-0.5 text-[10px] font-bold text-[#6B7480]">
                    {formatQuestionMeta(latest.question)}
                  </p>
                </div>
                <div className="min-h-[132px] overflow-y-auto rounded-md border border-[#E6EEF6] bg-[#FFFDF9] px-3 py-2">
                  <p className="whitespace-pre-wrap break-words text-[13px] font-bold leading-relaxed text-[#242424]">
                    {latest.question.prompt}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => launchSubtype(latest.subtype, 'refresh')}
                    disabled={busySubtypeId != null}
                    className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-md border border-[#2980B9] bg-[#EAF4FF] px-3 text-[12px] font-extrabold text-[#1C5C8F] transition-colors hover:bg-[#D8ECFF] disabled:cursor-not-allowed disabled:border-[#C8C8C8] disabled:bg-white disabled:text-[#7A7A7A] focus:outline-none focus:ring-2 focus:ring-[#2980B9]/40"
                  >
                    <RefreshCw size={15} strokeWidth={2.4} />
                    再刷
                  </button>
                  <button
                    type="button"
                    onClick={viewQuestion}
                    className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-md border border-[#FF922B] bg-[#FFF3E4] px-3 text-[12px] font-extrabold text-[#633600] transition-colors hover:bg-[#FFE4C2] focus:outline-none focus:ring-2 focus:ring-[#FF922B]/40"
                  >
                    <Eye size={15} strokeWidth={2.4} />
                    查看
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-2 rounded-md border border-dashed border-[#C6D6E5] bg-[#F8FBFF] px-3 py-8 text-center text-[12px] font-bold text-[#6B7480]">
                选择一个子题型
              </div>
            )}
          </aside>
        </div>
      </section>
    </div>
  );
}
