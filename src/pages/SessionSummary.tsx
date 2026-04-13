// src/pages/SessionSummary.tsx
import { useUIStore } from '@/store';
import { TOPICS } from '@/constants';

export default function SessionSummary() {
  const lastSession = useUIStore(s => s.lastSession);
  const setPage = useUIStore(s => s.setPage);

  if (!lastSession) {
    setPage('home');
    return null;
  }

  const topic = TOPICS.find(t => t.id === lastSession.topicId);
  const passed = lastSession.heartsRemaining > 0;
  const correctCount = lastSession.questions.filter(q => q.correct).length;
  const totalCount = lastSession.questions.length;
  const accuracy = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

  return (
    <div className="min-h-dvh bg-bg flex flex-col items-center justify-center safe-top px-4">
      <div className="max-w-sm w-full text-center space-y-6">
        {/* 通关/失败 Banner */}
        <div className={`py-6 rounded-3xl ${passed ? 'bg-success/10' : 'bg-error/10'}`}>
          <div className="text-5xl mb-2">{passed ? '🎉' : '💔'}</div>
          <h1 className="text-2xl font-bold">{passed ? '通关！' : '失败'}</h1>
          <p className="text-text-secondary text-sm mt-1">
            {topic?.name ?? '练习'} · {lastSession.sessionMode === 'campaign' ? '闯关' : '练习'}
          </p>
        </div>

        {/* 剩余心数（通关时展示） */}
        {passed && (
          <div>
            <p className="text-sm text-text-secondary mb-2">剩余心数</p>
            <div className="flex gap-2 justify-center">
              {[1, 2, 3].map(i => (
                <span key={i} className={`text-3xl ${i <= lastSession.heartsRemaining ? '' : 'opacity-20'}`}>
                  ❤️
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 答题统计 */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-bg-card rounded-2xl p-4 border border-border">
            <div className="text-2xl font-bold">{correctCount}/{totalCount}</div>
            <div className="text-xs text-text-secondary mt-1">答对题数</div>
          </div>
          <div className="bg-bg-card rounded-2xl p-4 border border-border">
            <div className="text-2xl font-bold">{accuracy}%</div>
            <div className="text-xs text-text-secondary mt-1">正确率</div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="space-y-3">
          <button
            onClick={() => setPage('campaign-map')}
            className="w-full py-3 rounded-2xl bg-primary text-white font-bold"
          >
            {passed ? '继续闯关' : '再试一次'}
          </button>
          <button
            onClick={() => setPage('home')}
            className="w-full py-3 rounded-2xl border border-border text-text-secondary"
          >
            回首页
          </button>
        </div>
      </div>
    </div>
  );
}
