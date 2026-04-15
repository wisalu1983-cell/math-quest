// src/pages/Progress.tsx
import { useUIStore, useGameProgressStore } from '@/store';
import { TOPICS } from '@/constants';
import { CAMPAIGN_MAPS } from '@/constants/campaign';
import BottomNav from '@/components/BottomNav';
import ProgressBar from '@/components/ProgressBar';
import { TopicIcon } from '@/components/TopicIcon';

export default function Progress() {
  const setPage = useUIStore(s => s.setPage);
  const gameProgress = useGameProgressStore(s => s.gameProgress);

  return (
    <div className="min-h-dvh bg-bg pb-[120px] safe-top">
      <div className="sticky top-0 z-10 bg-card border-b-2 border-border-2 px-4 py-3">
        <div className="max-w-lg mx-auto">
          <h1 className="font-black text-[17px]">闯关进度</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-3 stagger-1">
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
            <div key={topic.id} className="bg-card rounded-2xl p-4 border-2 border-border-2"
                 style={{ boxShadow: '0 1px 5px rgba(0,0,0,.07)' }}>
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ color: topic.color, background: topic.color + '18' }}
                >
                  <TopicIcon topicId={topic.id} size={28} />
                </div>
                <div className="flex-1">
                  <div className="font-black text-sm">{topic.name}</div>
                  <div className="text-xs text-text-2">
                    {completedLevels}/{totalLevels} 关完成{allDone ? ' · ✓ 全通' : ''}
                  </div>
                </div>
                <div className="text-sm font-black" style={{ color: topic.color }}>{pct}%</div>
              </div>
              <ProgressBar
                value={completedLevels}
                max={totalLevels}
                height={7}
                color={allDone ? 'var(--color-success)' : topic.color}
                label={`${topic.name} ${completedLevels}/${totalLevels} 关`}
              />
            </div>
          );
        })}

        {/* 总体统计 */}
        {gameProgress && (
          <div className="bg-card rounded-2xl p-4 border-2 border-border-2 mt-1"
               style={{ boxShadow: '0 1px 5px rgba(0,0,0,.07)' }}>
            <h2 className="font-black text-sm mb-3">总体统计</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xl font-black">{gameProgress.totalQuestionsAttempted}</div>
                <div className="text-xs text-text-2">累计答题</div>
              </div>
              <div>
                <div className="text-xl font-black">
                  {gameProgress.totalQuestionsAttempted > 0
                    ? Math.round(gameProgress.totalQuestionsCorrect / gameProgress.totalQuestionsAttempted * 100)
                    : 0}%
                </div>
                <div className="text-xs text-text-2">总正确率</div>
              </div>
            </div>
            <button
              onClick={() => setPage('history')}
              className="w-full mt-4 py-2.5 text-sm font-black text-primary bg-primary-lt rounded-xl
                         hover:bg-primary-mid transition-colors"
            >
              查看练习记录 →
            </button>
          </div>
        )}
      </div>

      <BottomNav activeTab="progress" />
    </div>
  );
}
