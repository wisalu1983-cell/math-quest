import { useGameProgressStore, useUIStore } from '@/store';
import { TOPICS } from '@/constants';
import type { WrongQuestion } from '@/types';

export default function WrongBook() {
  const gameProgress = useGameProgressStore(s => s.gameProgress);
  const { setPage } = useUIStore();

  if (!gameProgress) return null;

  const wrongQuestions = [...gameProgress.wrongQuestions].reverse();

  // Group by topic
  const grouped: Record<string, WrongQuestion[]> = {};
  for (const wq of wrongQuestions) {
    const topicId = wq.question.topicId;
    if (!grouped[topicId]) grouped[topicId] = [];
    grouped[topicId].push(wq);
  }

  return (
    <div className="min-h-dvh bg-bg pb-20 safe-top">
      <div className="sticky top-0 z-10 bg-bg/90 backdrop-blur-md border-b border-border px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <button onClick={() => setPage('home')} className="text-2xl">←</button>
          <h1 className="text-lg font-bold">错题本</h1>
          <span className="ml-auto text-sm text-text-secondary">{wrongQuestions.length}题</span>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4">
        {wrongQuestions.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🎉</div>
            <p className="text-text-secondary">还没有做错的题目，继续保持！</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([topicId, questions]) => {
              const topic = TOPICS.find(t => t.id === topicId);
              if (!topic) return null;

              return (
                <div key={topicId}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{topic.icon}</span>
                      <span className="font-bold text-sm">{topic.name}</span>
                      <span className="text-xs text-text-secondary">({questions.length}题)</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {questions.slice(0, 5).map((wq, i) => (
                      <div key={i} className="card">
                        <div className="text-sm font-medium mb-1">{wq.question.prompt}</div>
                        <div className="flex gap-4 text-xs">
                          <span className="text-danger">你的答案: {wq.wrongAnswer}</span>
                          <span className="text-success">正确答案: {String(wq.question.solution.answer)}</span>
                        </div>
                        {wq.question.solution.explanation && (
                          <div className="text-xs text-text-secondary mt-1">
                            {wq.question.solution.explanation}
                          </div>
                        )}
                      </div>
                    ))}

                    {questions.length > 5 && (
                      <p className="text-xs text-text-secondary text-center">
                        还有 {questions.length - 5} 题...
                      </p>
                    )}
                  </div>
                </div>
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
              className={`flex-1 flex flex-col items-center py-2 text-xs transition-colors
                ${item.page === 'wrong-book' ? 'text-primary' : 'text-text-secondary hover:text-text'}`}
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
