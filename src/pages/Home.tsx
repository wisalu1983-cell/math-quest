// src/pages/Home.tsx
import { useUserStore, useUIStore } from '@/store';
import { useGameProgressStore } from '@/store/gamification';
import { TOPICS } from '@/constants';
import { CAMPAIGN_MAPS } from '@/constants/campaign';
import type { TopicId } from '@/types';

export default function Home() {
  const user = useUserStore(s => s.user);
  const gameProgress = useGameProgressStore(s => s.gameProgress);
  const { setPage, setSelectedTopicId } = useUIStore();

  if (!user || !gameProgress) return null;

  const handleTopicClick = (topicId: TopicId) => {
    setSelectedTopicId(topicId);
    setPage('campaign-map');
  };

  return (
    <div className="min-h-dvh bg-bg pb-20 safe-top">
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-bg/90 backdrop-blur-md border-b border-border px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <h1 className="text-lg font-bold">数学大冒险</h1>
          <div className="text-sm text-text-secondary">{user.nickname}</div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-lg mx-auto px-4 py-6">
        <p className="text-text-secondary text-sm mb-4">选择题型开始闯关</p>

        {/* Topic grid */}
        <div className="grid grid-cols-2 gap-3">
          {TOPICS.map((topic) => {
            const campaignProg = gameProgress.campaignProgress[topic.id];
            const map = CAMPAIGN_MAPS[topic.id];

            let totalLevels = 0;
            let completedLevels = 0;
            if (map) {
              for (const stage of map.stages) {
                for (const lane of stage.lanes) {
                  totalLevels += lane.levels.length;
                }
              }
            }
            if (campaignProg) {
              completedLevels = campaignProg.completedLevels.length;
            }

            const allDone = campaignProg?.campaignCompleted ?? false;

            return (
              <button
                key={topic.id}
                onClick={() => handleTopicClick(topic.id)}
                className="relative p-4 rounded-2xl border-2 border-border hover:border-primary/50 active:scale-95 bg-bg-card transition-all text-left"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                    style={{ backgroundColor: topic.color + '20' }}
                  >
                    {topic.icon}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-sm">{topic.name}</div>
                    {allDone && (
                      <div className="text-xs text-success">✓ 闯关完成</div>
                    )}
                  </div>
                </div>

                {/* 进度条 */}
                <div className="h-1.5 bg-bg-elevated rounded-full overflow-hidden mb-1">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: totalLevels > 0 ? `${(completedLevels / totalLevels) * 100}%` : '0%',
                      backgroundColor: allDone ? '#58cc02' : topic.color,
                    }}
                  />
                </div>
                <div className="text-xs text-text-secondary">
                  {completedLevels}/{totalLevels} 关
                </div>
              </button>
            );
          })}
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
                ${item.page === 'home' ? 'text-primary' : 'text-text-secondary hover:text-text'}`}
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
