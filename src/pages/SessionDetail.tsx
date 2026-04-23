import { useUIStore } from '@/store';
import { repository } from '@/repository/local';
import {
  getHistoryDurationMs,
  getHistoryModeLabel,
  getHistoryResultLabel,
  getHistoryStats,
} from '@/utils/history';

function formatDate(ts: number): string {
  const d = new Date(ts);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function formatDuration(ms: number | null): string {
  if (ms === null) return '—';
  const sec = Math.round(ms / 1000);
  return sec < 60 ? `${sec}秒` : `${Math.floor(sec / 60)}分${sec % 60}秒`;
}

function getResultClasses(result: ReturnType<typeof repository.getHistory>[number]['result']): string {
  switch (result) {
    case 'win':
      return 'border-success/25 bg-success/10 text-success';
    case 'lose':
      return 'border-danger/20 bg-danger/10 text-danger';
    case 'incomplete':
    default:
      return 'border-border-2 bg-card-2 text-text-2';
  }
}

interface SessionDetailProps {
  recordId?: string | null;
}

export default function SessionDetail({ recordId: recordIdProp }: SessionDetailProps) {
  const setPage = useUIStore(s => s.setPage);
  const viewingSessionId = useUIStore(s => s.viewingSessionId);
  const recordId = recordIdProp ?? viewingSessionId;

  const record = repository.getHistory().find(item => item.id === recordId);
  if (!record) {
    return (
      <div className="min-h-dvh bg-bg flex items-center justify-center">
        <div className="text-center">
          <p className="text-text-2 mb-4">找不到该练习记录</p>
          <button className="btn-primary" onClick={() => setPage('progress')}>返回记录首页</button>
        </div>
      </div>
    );
  }

  const stats = getHistoryStats(record);
  const totalDuration = formatDuration(getHistoryDurationMs(record));

  return (
    <div className="min-h-dvh bg-bg pb-6 safe-top">
      <div className="sticky top-0 z-10 bg-card/95 border-b-2 border-border-2 px-4 py-3 backdrop-blur-sm">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <button
            onClick={() => setPage('progress')}
            aria-label="返回记录首页"
            className="text-2xl text-text-2 hover:text-text transition-colors"
          >
            ←
          </button>
          <div>
            <h1 className="text-[17px] font-black">练习详情</h1>
            <p className="text-[11px] text-text-2">逐题查看题干、对错、答案对比和耗时</p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        <section
          className="overflow-hidden rounded-[28px] border-2 border-border-2 bg-card p-4"
          style={{
            boxShadow: '0 1px 8px rgba(0,0,0,.06)',
            backgroundImage: 'linear-gradient(180deg, rgba(255,255,255,.92) 0%, rgba(244,240,231,.96) 100%)',
          }}
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-text px-3 py-1 text-xs font-black text-card">
              {getHistoryModeLabel(record.sessionMode)}
            </span>
            <span className={`rounded-full border px-3 py-1 text-xs font-black ${getResultClasses(record.result)}`}>
              {getHistoryResultLabel(record.result)}
            </span>
            <span className="ml-auto text-xs text-text-2">{formatDate(record.startedAt)}</span>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="rounded-2xl bg-card-2 px-3 py-3 text-center">
              <div className="text-xl font-black text-text">{stats.accuracy}%</div>
              <div className="mt-1 text-[11px] font-bold text-text-2">正确率</div>
            </div>
            <div className="rounded-2xl bg-card-2 px-3 py-3 text-center">
              <div className="text-xl font-black text-text">{stats.correct}/{stats.total}</div>
              <div className="mt-1 text-[11px] font-bold text-text-2">正确/总数</div>
            </div>
            <div className="rounded-2xl bg-card-2 px-3 py-3 text-center">
              <div className="text-xl font-black text-text">{totalDuration}</div>
              <div className="mt-1 text-[11px] font-bold text-text-2">总耗时</div>
            </div>
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-black text-text">逐题记录</h2>
            <span className="text-xs font-bold text-text-2">{record.questions.length} 题</span>
          </div>

          <div className="space-y-3">
            {record.questions.map((question, index) => (
              <article
                key={`${record.id}-${index}`}
                className={`rounded-[24px] border-2 bg-card p-4 ${
                  question.correct
                    ? 'border-success/20'
                    : 'border-danger/20'
                }`}
                style={{ boxShadow: '0 1px 6px rgba(0,0,0,.05)' }}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-black text-text-2">第 {index + 1} 题</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-text-2">{formatDuration(question.timeMs)}</span>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-black ${
                        question.correct
                          ? 'bg-success/10 text-success'
                          : 'bg-danger/10 text-danger'
                      }`}
                    >
                      {question.correct ? '正确' : '错误'}
                    </span>
                  </div>
                </div>

                <p className="mt-3 text-sm font-semibold leading-6 text-text">{question.prompt}</p>

                <div className="mt-4 space-y-2 text-xs">
                  {!question.correct ? (
                    <div className="rounded-2xl bg-danger/6 px-3 py-2 text-danger">
                      <span className="font-black">你的答案：</span>
                      <span>{question.userAnswer || '未填写'}</span>
                    </div>
                  ) : null}

                  <div className="rounded-2xl bg-card-2 px-3 py-2 text-text-2">
                    <span className="font-black text-text">
                      {question.correct ? '答案：' : '正确答案：'}
                    </span>
                    <span>{question.correctAnswer}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
