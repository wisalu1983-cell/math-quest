// src/pages/CampaignMap.tsx
import { useEffect, useRef } from 'react';
import { useUIStore, useSessionStore, useGameProgressStore } from '@/store';
import { TOPICS } from '@/constants';
import { CAMPAIGN_MAPS } from '@/constants/campaign';
import type { TopicId } from '@/types';
import ProgressBar from '@/components/ProgressBar';
import { TopicIcon, LvlIcon, type LvlIconState } from '@/components/TopicIcon';

export default function CampaignMap() {
  const { selectedTopicId, setPage } = useUIStore();
  const { startCampaignSession } = useSessionStore();
  const isLevelCompleted = useGameProgressStore(s => s.isLevelCompleted);
  const gameProgress = useGameProgressStore(s => s.gameProgress);

  const topicId = selectedTopicId as TopicId;
  const map = topicId ? CAMPAIGN_MAPS[topicId] : null;
  const topic = TOPICS.find(t => t.id === topicId);
  const recommendedRef = useRef<HTMLDivElement>(null);

  // 找推荐关卡（第一个 playable + not completed）
  let recommendedLevelId: string | null = null;
  if (map && topic) {
    outer: for (let si = 0; si < map.stages.length; si++) {
      for (let li = 0; li < map.stages[si].lanes.length; li++) {
        for (let lvi = 0; lvi < map.stages[si].lanes[li].levels.length; lvi++) {
          const lvl = map.stages[si].lanes[li].levels[lvi];
          if (isLevelPlayable(si, li, lvi) && !isLevelCompleted(topicId, lvl.levelId)) {
            recommendedLevelId = lvl.levelId;
            break outer;
          }
        }
      }
    }
  }

  // 推荐关卡自动滚动
  useEffect(() => {
    if (recommendedRef.current) {
      const timer = setTimeout(() => {
        recommendedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [recommendedLevelId]);

  if (!map || !topic) {
    return (
      <div className="flex items-center justify-center min-h-dvh bg-bg">
        <button onClick={() => setPage('home')} className="text-primary font-bold">← 返回首页</button>
      </div>
    );
  }

  // ── 关卡解锁判断 ──

  function isStageUnlocked(stageIdx: number): boolean {
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
    if (!isStageUnlocked(stageIdx)) return false;
    if (levelIdx === 0) return true;
    const prevLevel = map!.stages[stageIdx].lanes[laneIdx].levels[levelIdx - 1];
    return isLevelCompleted(topicId, prevLevel.levelId);
  }

  function getBestHearts(levelId: string): number | null {
    const prog = gameProgress?.campaignProgress[topicId];
    if (!prog) return null;
    return prog.completedLevels.find(l => l.levelId === levelId)?.bestHearts ?? null;
  }

  // 关卡全局序号（用于显示"第N关"）
  let globalLevelIdx = 0;
  const levelNums: Record<string, number> = {};
  for (const stage of map.stages) {
    for (const lane of stage.lanes) {
      for (const level of lane.levels) {
        levelNums[level.levelId] = ++globalLevelIdx;
      }
    }
  }

  // 总进度
  let totalLevels = 0;
  for (const stage of map.stages) {
    for (const lane of stage.lanes) {
      totalLevels += lane.levels.length;
    }
  }
  const completedLevels = gameProgress?.campaignProgress[topicId]?.completedLevels.length ?? 0;

  function handleLevelClick(levelId: string) {
    startCampaignSession(topicId, levelId);
    setPage('practice');
  }

  return (
    <div className="min-h-dvh bg-bg safe-top">

      {/* ── 顶栏 ── */}
      <div className="bg-card border-b-2 border-border-2 px-5 pt-3.5 pb-4 stagger-1">
        {/* 返回行 */}
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={() => setPage('home')}
            aria-label="返回首页"
            className="w-9 h-9 rounded-[10px] bg-card-2 border-2 border-border flex items-center
                       justify-center text-[18px] font-black text-text-2 transition-all active:scale-95"
            style={{ boxShadow: '0 1px 5px rgba(0,0,0,.07)' }}
          >
            ←
          </button>
          <div>
            {/* 主题 chip */}
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-extrabold mb-1 border-2"
              style={{ color: topic.color, background: topic.color + '15', borderColor: topic.color + '50' }}
            >
              <span style={{ color: topic.color, width: 14, height: 14, display: 'inline-flex' }}>
                <TopicIcon topicId={topic.id} size={14} />
              </span>
              {topic.name}
            </div>
            <h1 className="text-[20px] font-black text-text">{topic.name}闯关地图</h1>
          </div>
        </div>

        {/* 进度卡 */}
        <div
          className="rounded-2xl border-2 p-3"
          style={{ background: topic.color + '12', borderColor: topic.color + '50' }}
        >
          <div className="flex justify-between text-[12px] font-bold mb-2"
               style={{ color: topic.color }}>
            <span>闯关进度</span>
            <span className="font-black">{completedLevels} / {totalLevels} 关</span>
          </div>
          <ProgressBar
            value={completedLevels}
            max={totalLevels}
            height={8}
            color={topic.color}
            label={`${topic.name} 进度 ${completedLevels}/${totalLevels}`}
          />
        </div>
      </div>

      {/* ── 关卡列表 ── */}
      <div className="max-w-lg mx-auto pb-20 safe-bottom" style={{ paddingTop: 10 }}>
        {map.stages.map((stage, stageIdx) => {
          const stageUnlocked = isStageUnlocked(stageIdx);
          return (
            <div key={stage.stageId} className={`${stageUnlocked ? '' : 'opacity-50'} stagger-${Math.min(stageIdx + 2, 6)}`}>
              {/* 章节分隔符 */}
              {stage.isBoss ? (
                <div className="mx-5 my-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex-1 h-0.5 bg-gradient-to-r from-transparent via-danger to-transparent" />
                  </div>
                  <div className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl bg-danger/10 border-2 border-danger/30">
                    <span className="text-lg">🔥</span>
                    <span className="text-[14px] font-black text-danger tracking-widest uppercase">
                      {stage.stageLabel}
                    </span>
                    <span className="text-lg">🔥</span>
                    {!stageUnlocked && (
                      <span className="text-[11px] font-bold text-text-3 ml-1">🔒 完成上一章解锁</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex-1 h-0.5 bg-gradient-to-r from-transparent via-danger to-transparent" />
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 mx-5 my-3.5">
                  <div className="flex-1 h-px bg-border-2" />
                  <span className="text-[12px] font-extrabold text-text-3 tracking-widest uppercase">
                    {stage.stageLabel}
                    {!stageUnlocked && ' · 🔒 完成上一章解锁'}
                  </span>
                  <div className="flex-1 h-px bg-border-2" />
                </div>
              )}

              {/* 每条 lane */}
              {stage.lanes.map((lane, laneIdx) => (
                <div key={lane.laneId} className={stageUnlocked ? '' : 'pointer-events-none'}>
                  {stage.lanes.length > 1 && (
                    <div className="text-[12px] font-bold text-text-2 mx-5 mb-2">{lane.laneLabel}</div>
                  )}
                  {/* 3 列关卡网格 */}
                  <div className="grid grid-cols-3 gap-2.5 mx-5 mb-3">
                    {lane.levels.map((level, levelIdx) => {
                      const playable = isLevelPlayable(stageIdx, laneIdx, levelIdx);
                      const completed = isLevelCompleted(topicId, level.levelId);
                      const isRec = level.levelId === recommendedLevelId;
                      const bestHearts = getBestHearts(level.levelId);
                      const num = levelNums[level.levelId] ?? (levelIdx + 1);

                      let state: LvlIconState = 'lock';
                      if (completed) state = 'done';
                      else if (playable) state = 'play';

                      let btnClass = 'w-full rounded-[18px] border-2 flex flex-col items-center justify-between transition-all active:scale-95';
                      const btnStyle: React.CSSProperties = stage.isBoss
                        ? { height: 120, padding: '12px 8px 12px' }
                        : { height: 96, padding: '10px 8px 10px' };

                      if (completed) {
                        btnClass += ' bg-success-lt border-success-mid text-success';
                      } else if (stage.isBoss && isRec) {
                        btnClass += ' bg-danger border-danger text-white animate-bounce-rec';
                        btnStyle.boxShadow = '0 4px 16px rgba(255,75,75,.45)';
                      } else if (stage.isBoss && playable) {
                        btnClass += ' bg-danger/10 border-danger/60 text-danger hover:border-danger';
                      } else if (isRec) {
                        btnClass += ' bg-primary border-primary-dark text-white animate-bounce-rec';
                        btnStyle.boxShadow = '0 4px 14px rgba(255,107,53,.38)';
                      } else if (playable) {
                        btnClass += ' bg-primary-lt border-primary-mid text-primary-dark hover:border-primary';
                      } else {
                        btnClass += ' bg-[#F8F6F4] border-border text-text-3 cursor-not-allowed opacity-55';
                      }

                      return (
                        <div key={level.levelId} className="relative" ref={isRec ? recommendedRef : undefined}>
                          {/* NEW 徽章 */}
                          {isRec && (
                            <span
                              className="absolute -top-2.5 -right-1 z-10 text-[11px] font-black
                                         px-1.5 py-0.5 rounded-full border-2 border-white"
                              style={{ background: 'var(--color-warning)', color: '#7A5C00',
                                       boxShadow: '0 1px 5px rgba(0,0,0,.07)' }}
                            >
                              NEW
                            </span>
                          )}
                          {/* 可互动关卡用 button，锁定关卡用 div（移出 tab 焦点序列）*/}
                          {playable ? (
                            <button
                              onClick={() => handleLevelClick(level.levelId)}
                              className={btnClass}
                              style={btnStyle}
                              aria-label={`${stage.isBoss ? 'Boss关' : `第${num}关`}，${level.questionCount}题，${completed ? '已完成' : isRec ? '推荐关卡' : '可挑战'}`}
                            >
                              <span className="self-start text-[12px] font-extrabold opacity-60 leading-none">
                                {stage.isBoss ? '👹 Boss' : `第${num}关`}
                              </span>
                              <span className="flex flex-1 items-center justify-center">
                                <LvlIcon state={state} size={stage.isBoss ? 44 : 36} />
                              </span>
                              <span className="text-[12px] font-extrabold text-center leading-none">
                                {completed && bestHearts !== null
                                  ? '❤'.repeat(bestHearts) + '🤍'.repeat(3 - bestHearts)
                                  : `${level.questionCount}题`}
                              </span>
                            </button>
                          ) : (
                            <div
                              className={btnClass}
                              style={btnStyle}
                              role="img"
                              aria-label={`${stage.isBoss ? 'Boss关' : `第${num}关`}，${level.questionCount}题，未解锁，完成前序关卡解锁`}
                            >
                              <span className="self-start text-[12px] font-extrabold opacity-60 leading-none">
                                {stage.isBoss ? '👹 Boss' : `第${num}关`}
                              </span>
                              <span className="flex flex-1 items-center justify-center">
                                <LvlIcon state={state} size={stage.isBoss ? 44 : 36} />
                              </span>
                              <span className="text-[12px] font-extrabold text-center leading-none">
                                {level.questionCount}题
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
