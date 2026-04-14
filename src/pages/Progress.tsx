// src/pages/Progress.tsx
import { useUIStore } from '@/store';
import { useGameProgressStore } from '@/store/gamification';
import { TOPICS } from '@/constants';
import { CAMPAIGN_MAPS } from '@/constants/campaign';

export default function Progress() {
  const setPage = useUIStore(s => s.setPage);
  const gameProgress = useGameProgressStore(s => s.gameProgress);

  return (
    <div className="min-h-dvh bg-bg pb-20 safe-top">
      <div className="sticky top-0 z-10 bg-bg/90 backdrop-blur-md border-b border-border px-4 py-3">
        <div className="max-w-lg mx-auto">
          <h1 className="font-bold">闯关进度</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {TOPICS.map(topic => {
          const map = CAMPAIGN_MAPS[topic.id];
          const prog = gameProgress?.campaignProgress[topic.id];

          let totalLevels = 0;
          if (map) {
            for (const stage of map.stages) {
              for (const lane of stage.lanes) {
                totalLevels += lane.levels.length;
              }
            }
          }
          const completedLevels = prog?.completedLevels.length ?? 0;
          const pct = totalLevels > 0 ? Math.round((completedLevels / totalLevels) * 100) : 0;
          const allDone = prog?.campaignCompleted ?? false;

          return (
            <div key={topic.id} className="bg-bg-card rounded-2xl p-4 border border-border">
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                  style={{ backgroundColor: topic.color + '20' }}
                >
                  {topic.icon}
                </div>
                <div className="flex-1">
                  <div className="font-bold text-sm">{topic.name}</div>
                  <div className="text-xs text-text-secondary">
                    {completedLevels}/{totalLevels} 关完成
                    {allDone ? ' · ✓ 全通' : ''}
                  </div>
                </div>
                <div className="text-sm font-bold" style={{ color: topic.color }}>{pct}%</div>
              </div>
              <div className="h-2 bg-bg-elevated rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${pct}%`, backgroundColor: allDone ? '#58cc02' : topic.color }}
                />
              </div>
            </div>
          );
        })}

        {/* 总体统计 */}
        {gameProgress && (
          <div className="bg-bg-card rounded-2xl p-4 border border-border mt-4">
            <h2 className="font-bold text-sm mb-3">总体统计</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xl font-bold">{gameProgress.totalQuestionsAttempted}</div>
                <div className="text-xs text-text-secondary">累计答题</div>
              </div>
              <div>
                <div className="text-xl font-bold">
                  {gameProgress.totalQuestionsAttempted > 0
                    ? Math.round(gameProgress.totalQuestionsCorrect / gameProgress.totalQuestionsAttempted * 100)
                    : 0}%
                </div>
                <div className="text-xs text-text-secondary">总正确率</div>
              </div>
            </div>
            <button
              onClick={() => setPage('history')}
              className="w-full mt-4 py-2.5 text-sm font-bold text-primary bg-primary/10 rounded-xl
                         hover:bg-primary/20 transition-colors"
            >
              查看练习记录 →
            </button>
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
                ${item.page === 'progress' ? 'text-primary' : 'text-text-secondary hover:text-text'}`}
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
