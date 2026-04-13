import { useUserStore, useGameProgressStore, useUIStore } from '@/store';
import { TOPICS } from '@/constants';

export default function Profile() {
  const user = useUserStore(s => s.user);
  const gameProgress = useGameProgressStore(s => s.gameProgress);
  const { setPage, soundEnabled, toggleSound } = useUIStore();

  if (!user) return null;

  // 统计数据
  const totalQuestions = gameProgress?.totalQuestionsAttempted ?? 0;
  const totalCorrect = gameProgress?.totalQuestionsCorrect ?? 0;
  const accuracy = totalQuestions > 0 ? Math.round(totalCorrect / totalQuestions * 100) : 0;

  // 闯关进度
  const campaignProgress = gameProgress?.campaignProgress ?? {};
  const completedTopics = Object.values(campaignProgress).filter(t => t?.campaignCompleted).length;
  const totalTopics = TOPICS.length;

  // 错题数
  const wrongCount = gameProgress?.wrongQuestions.length ?? 0;

  return (
    <div className="min-h-dvh bg-bg pb-20 safe-top">
      <div className="sticky top-0 z-10 bg-bg/90 backdrop-blur-md border-b border-border px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <button onClick={() => setPage('home')} className="text-2xl">←</button>
          <h1 className="text-lg font-bold">个人中心</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-6">
        {/* Profile card */}
        <div className="card flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-3xl">
            {user.nickname[0]}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold">{user.nickname}</h2>
            <p className="text-sm text-text-secondary mt-1">{user.grade}年级 · 数学大冒险</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="card text-center py-3">
            <div className="text-xl font-bold text-primary">{totalQuestions}</div>
            <div className="text-[10px] text-text-secondary">总题数</div>
          </div>
          <div className="card text-center py-3">
            <div className="text-xl font-bold text-success">{accuracy}%</div>
            <div className="text-[10px] text-text-secondary">准确率</div>
          </div>
          <div className="card text-center py-3">
            <div className="text-xl font-bold text-warning">{completedTopics}/{totalTopics}</div>
            <div className="text-[10px] text-text-secondary">关卡通关</div>
          </div>
        </div>

        {/* Topic progress */}
        <div className="card">
          <h3 className="text-sm font-bold mb-3">各题型进度</h3>
          <div className="space-y-2">
            {TOPICS.map(topic => {
              const tp = campaignProgress[topic.id];
              const done = tp?.campaignCompleted ?? false;
              const count = tp?.completedLevels.length ?? 0;
              return (
                <div key={topic.id} className="flex items-center gap-3">
                  <span className="text-xl">{topic.icon}</span>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{topic.name}</div>
                    <div className="text-xs text-text-secondary">已通关 {count} 关</div>
                  </div>
                  {done && <span className="text-xs text-success font-bold">✓ 全通</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Settings */}
        <div className="card">
          <h3 className="text-sm font-bold mb-3">设置</h3>
          <div className="space-y-4">
            {/* Sound toggle */}
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm">音效</div>
                <div className="text-xs text-text-secondary">练习时的音效反馈</div>
              </div>
              <button
                onClick={toggleSound}
                className={`w-12 h-6 rounded-full transition-all ${soundEnabled ? 'bg-primary' : 'bg-border'}`}
              >
                <div className={`w-5 h-5 rounded-full bg-white shadow transition-all mx-0.5 ${soundEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>

            {/* Grade */}
            <div className="flex justify-between items-center">
              <span className="text-sm">年级</span>
              <span className="text-sm text-text-secondary">{user.grade}年级</span>
            </div>

            {/* Wrong book shortcut */}
            {wrongCount > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-sm">错题本</span>
                <button
                  onClick={() => setPage('wrong-book')}
                  className="text-sm text-primary font-bold"
                >
                  {wrongCount} 题 →
                </button>
              </div>
            )}
          </div>
        </div>
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
                ${item.page === 'profile' ? 'text-primary' : 'text-text-secondary hover:text-text'}`}
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
