import { useUIStore } from '@/store';
import { repository } from '@/repository/local';
import { TOPICS, DIFFICULTY_TIERS } from '@/constants';

function formatTime(ts: number): string {
  const d = new Date(ts);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function formatMs(ms: number): string {
  const sec = Math.round(ms / 1000);
  return sec < 60 ? `${sec}秒` : `${Math.floor(sec / 60)}分${sec % 60}秒`;
}

export default function SessionDetail() {
  const { setPage, viewingSessionId } = useUIStore();

  const session = repository.getSessions().find(s => s.id === viewingSessionId);
  if (!session) {
    return (
      <div className="min-h-dvh bg-bg flex items-center justify-center">
        <div className="text-center">
          <p className="text-text-secondary mb-4">找不到该练习记录</p>
          <button className="btn-primary" onClick={() => setPage('history')}>返回</button>
        </div>
      </div>
    );
  }

  const total = session.questions.length;
  const correct = session.questions.filter(q => q.correct).length;
  const accuracy = total > 0 ? Math.round(correct / total * 100) : 0;
  const totalTime = session.endedAt ? session.endedAt - session.startedAt : 0;
  const avgTime = total > 0 ? Math.round(session.questions.reduce((s, q) => s + q.timeMs, 0) / total) : 0;
  const topicNames = [TOPICS.find(t => t.id === session.topicId)].filter(Boolean);
  const diffTier = DIFFICULTY_TIERS.find(t => t.value === session.difficulty);

  return (
    <div className="min-h-dvh bg-bg pb-6 safe-top">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-bg/90 backdrop-blur-md border-b border-border px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <button onClick={() => setPage('history')} className="text-2xl">←</button>
          <h1 className="text-lg font-bold">练习详情</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* Summary card */}
        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {topicNames.map(t => t && (
                <span key={t.id} className="text-sm font-bold flex items-center gap-1">
                  <span>{t.icon}</span>{t.name}
                </span>
              ))}
            </div>
            <span className="text-xs text-text-secondary">{formatTime(session.startedAt)}</span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className={`text-xl font-bold ${accuracy >= 80 ? 'text-success' : accuracy >= 60 ? 'text-warning' : 'text-danger'}`}>
                {accuracy}%
              </div>
              <div className="text-[10px] text-text-secondary">准确率</div>
            </div>
            <div>
              <div className="text-xl font-bold text-text">{correct}/{total}</div>
              <div className="text-[10px] text-text-secondary">正确/总数</div>
            </div>
            <div>
              <div className="text-xl font-bold text-text">{session.heartsRemaining} ♥</div>
              <div className="text-[10px] text-text-secondary">剩余心数</div>
            </div>
          </div>

          <div className="flex gap-4 text-xs text-text-secondary pt-1 border-t border-border">
            <span>难度: {diffTier ? `${diffTier.icon} ${diffTier.label}` : session.difficulty}</span>
            <span>用时: {formatMs(totalTime)}</span>
            <span>平均: {formatMs(avgTime)}/题</span>
          </div>
        </div>

        {/* Question list */}
        <div>
          <h2 className="text-sm font-bold text-text-secondary mb-3">逐题详情</h2>
          <div className="space-y-2">
            {session.questions.map((attempt, i) => (
              <div
                key={attempt.questionId}
                className={`card border-l-4 ${attempt.correct ? 'border-l-success' : 'border-l-danger'}`}
              >
                {/* Question header */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-text-secondary">
                    第 {i + 1} 题
                    <span className="ml-2">
                      {TOPICS.find(t => t.id === attempt.question.topicId)?.icon}
                    </span>
                  </span>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-text-secondary">{formatMs(attempt.timeMs)}</span>
                    <span className={`font-bold ${attempt.correct ? 'text-success' : 'text-danger'}`}>
                      {attempt.correct ? '正确' : '错误'}
                    </span>
                  </div>
                </div>

                {/* Question prompt */}
                <p className="text-sm font-medium mb-2">{attempt.question.prompt}</p>

                {/* Answer comparison */}
                <div className="flex gap-4 text-xs">
                  {!attempt.correct && (
                    <span className="text-danger">
                      你的答案: {attempt.userAnswer}
                    </span>
                  )}
                  <span className={attempt.correct ? 'text-success' : 'text-text-secondary'}>
                    {attempt.correct ? '答案' : '正确答案'}: {String(attempt.question.solution.answer)}
                  </span>
                </div>

                {/* Explanation for wrong answers */}
                {!attempt.correct && attempt.question.solution.explanation && (
                  <div className="mt-2 text-xs text-text-secondary bg-bg-elevated rounded-lg p-2">
                    {attempt.question.solution.explanation}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
