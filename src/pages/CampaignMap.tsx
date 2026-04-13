// src/pages/CampaignMap.tsx
import { useUIStore, useSessionStore } from '@/store';
import { useGameProgressStore } from '@/store/gamification';
import { TOPICS } from '@/constants';
import { CAMPAIGN_MAPS } from '@/constants/campaign';
import type { TopicId } from '@/types';

export default function CampaignMap() {
  const { selectedTopicId, setPage } = useUIStore();
  const { startCampaignSession } = useSessionStore();
  const isLevelCompleted = useGameProgressStore(s => s.isLevelCompleted);
  const gameProgress = useGameProgressStore(s => s.gameProgress);

  const topicId = selectedTopicId as TopicId;
  const map = topicId ? CAMPAIGN_MAPS[topicId] : null;
  const topic = TOPICS.find(t => t.id === topicId);

  if (!map || !topic) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <button onClick={() => setPage('home')} className="text-primary">← 返回首页</button>
      </div>
    );
  }

  function isLaneFirstLevelUnlocked(stageIdx: number): boolean {
    if (stageIdx === 0) return true;
    const prevStage = map!.stages[stageIdx - 1];
    for (const lane of prevStage.lanes) {
      for (const level of lane.levels) {
        if (!isLevelCompleted(topicId, level.levelId)) return false;
      }
    }
    return true;
  }

  function isLevelPlayable(stageIdx: number, laneIdx: number, levelIdx: number): boolean {
    if (!isLaneFirstLevelUnlocked(stageIdx)) return false;
    if (levelIdx === 0) return true;
    const prevLevel = map!.stages[stageIdx].lanes[laneIdx].levels[levelIdx - 1];
    return isLevelCompleted(topicId, prevLevel.levelId);
  }

  function getLevelHearts(levelId: string): number | null {
    const prog = gameProgress?.campaignProgress[topicId];
    if (!prog) return null;
    const completion = prog.completedLevels.find(l => l.levelId === levelId);
    return completion?.bestHearts ?? null;
  }

  function handleLevelClick(levelId: string) {
    startCampaignSession(topicId, levelId);
    setPage('practice');
  }

  function renderHearts(count: number | null) {
    if (count === null) return null;
    return (
      <div className="flex gap-0.5 justify-center mt-1">
        {[1, 2, 3].map(i => (
          <span key={i} className={`text-[10px] ${i <= count ? 'text-red-500' : 'text-gray-300'}`}>❤</span>
        ))}
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-bg safe-top">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-bg/90 backdrop-blur-md border-b border-border px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <button
            onClick={() => setPage('home')}
            className="text-text-secondary hover:text-text transition-colors text-lg"
          >
            ←
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xl">{topic.icon}</span>
            <h1 className="font-bold">{topic.name}闯关</h1>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="max-w-lg mx-auto px-4 py-6 space-y-8">
        {map.stages.map((stage, stageIdx) => {
          const stageUnlocked = isLaneFirstLevelUnlocked(stageIdx);
          return (
            <div key={stage.stageId}>
              {/* Stage header */}
              <div className={`mb-3 flex items-center gap-2 ${stageUnlocked ? '' : 'opacity-40'}`}>
                {stage.isBoss && <span className="text-red-500">⚔️</span>}
                <h2 className="font-bold text-base">{stage.stageLabel}</h2>
                {!stageUnlocked && (
                  <span className="text-xs text-text-secondary">🔒 完成上一阶段解锁</span>
                )}
              </div>

              {/* Lanes */}
              <div className={`space-y-4 ${stageUnlocked ? '' : 'opacity-40 pointer-events-none'}`}>
                {stage.lanes.map((lane, laneIdx) => (
                  <div key={lane.laneId}>
                    {stage.lanes.length > 1 && (
                      <div className="text-xs text-text-secondary mb-2 ml-1">{lane.laneLabel}</div>
                    )}
                    <div className="flex gap-3 flex-wrap">
                      {lane.levels.map((level, levelIdx) => {
                        const playable = isLevelPlayable(stageIdx, laneIdx, levelIdx);
                        const completed = isLevelCompleted(topicId, level.levelId);
                        const hearts = getLevelHearts(level.levelId);

                        return (
                          <button
                            key={level.levelId}
                            onClick={() => playable && handleLevelClick(level.levelId)}
                            disabled={!playable}
                            className={`
                              w-16 h-16 rounded-2xl border-2 flex flex-col items-center justify-center
                              transition-all active:scale-95
                              ${completed
                                ? 'border-success bg-success/10 text-success'
                                : playable
                                  ? 'border-primary bg-primary/10 text-primary hover:bg-primary/20'
                                  : 'border-border bg-bg-elevated text-text-secondary cursor-not-allowed opacity-50'
                              }
                            `}
                          >
                            <span className="text-lg">
                              {completed ? '✓' : playable ? '▶' : '🔒'}
                            </span>
                            <span className="text-[10px]">{level.questionCount}题</span>
                            {renderHearts(hearts)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
