import { useUIStore } from '@/store';
import { repository } from '@/repository/local';
import { TOPICS, DIFFICULTY_TIERS } from '@/constants';
import type { PracticeSession } from '@/types';

function formatDate(ts: number): string {
  const d = new Date(ts);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${month}/${day} ${h}:${m}`;
}

function formatDuration(startedAt: number, endedAt?: number): string {
  if (!endedAt) return '-';
  const sec = Math.round((endedAt - startedAt) / 1000);
  if (sec < 60) return `${sec}秒`;
  return `${Math.floor(sec / 60)}分${sec % 60}秒`;
}

function getDifficultyLabel(value: number): string {
  const tier = DIFFICULTY_TIERS.find(t => t.value === value);
  return tier ? `${tier.icon} ${tier.label}` : `难度${value}`;
}

function getTopicNames(session: PracticeSession): string {
  const topic = TOPICS.find(t => t.id === session.topicId);
  return topic ? topic.icon + topic.name : session.topicId;
}

export default function History() {
  const { setPage, setViewingSessionId } = useUIStore();
  const sessions = repository.getSessions().slice().reverse();

  const handleViewDetail = (sessionId: string) => {
    setViewingSessionId(sessionId);
    setPage('session-detail');
  };

  return (
    <div className="min-h-dvh bg-bg pb-20 safe-top">
      <div className="sticky top-0 z-10 bg-bg/90 backdrop-blur-md border-b border-border px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <button onClick={() => setPage('progress')} className="text-2xl">←</button>
          <h1 className="text-lg font-bold">练习记录</h1>
          <span className="ml-auto text-sm text-text-secondary">共 {sessions.length} 次</span>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4">
        {sessions.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">📋</div>
            <p className="text-text-secondary">还没有练习记录，去练一次吧！</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map(session => {
              const total = session.questions.length;
              const correct = session.questions.filter(q => q.correct).length;
              const accuracy = total > 0 ? Math.round(correct / total * 100) : 0;
              const isPerfect = total > 0 && correct === total;

              return (
                <button
                  key={session.id}
                  onClick={() => handleViewDetail(session.id)}
                  className="card w-full text-left hover:border-primary/40 transition-colors"
                >
                  {/* Top row: topics + time */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold truncate flex-1">
                      {getTopicNames(session)}
                    </span>
                    <span className="text-xs text-text-secondary ml-2 shrink-0">
                      {formatDate(session.startedAt)}
                    </span>
                  </div>

                  {/* Stats row */}
                  <div className="flex items-center gap-3 text-xs">
                    <span className={`font-bold ${isPerfect ? 'text-success' : accuracy >= 80 ? 'text-primary' : accuracy >= 60 ? 'text-warning' : 'text-danger'}`}>
                      {accuracy}% 准确率
                    </span>
                    <span className="text-text-secondary">{correct}/{total} 题</span>
                    <span className="text-text-secondary">{getDifficultyLabel(session.difficulty)}</span>
                    <span className="text-text-secondary">{formatDuration(session.startedAt, session.endedAt)}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-bg/90 backdrop-blur-md border-t border-border safe-bottom">
        <div className="max-w-lg mx-auto flex">
          {[
            { page: 'home' as const, icon: '🏠', label: '首页' },
            { page: 'progress' as const, icon: '📊', label: '进度' },
            { page: 'wrong-book' as const, icon: '📕', label: '错题本' },
            { page: 'profile' as const, icon: '👤', label: '我的' },
          ].map(item => (
            <button
              key={item.page}
              onClick={() => setPage(item.page)}
              className="flex-1 flex flex-col items-center py-2 text-xs text-text-secondary hover:text-text transition-colors"
            >
              <span className="text-xl">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
