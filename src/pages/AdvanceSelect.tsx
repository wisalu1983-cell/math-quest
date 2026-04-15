// src/pages/AdvanceSelect.tsx
import { useGameProgressStore, useUIStore, useSessionStore } from '@/store';
import { TOPICS } from '@/constants';
import { TOPIC_STAR_CAP } from '@/constants/advance';
import { getStars, getStarProgress } from '@/engine/advance';
import BottomNav from '@/components/BottomNav';
import type { TopicId } from '@/types';

// ─── 星级进度条组件 ───

function StarProgressBar({ heartsAccumulated, topicId }: {
  heartsAccumulated: number;
  topicId: TopicId;
}) {
  const cap = TOPIC_STAR_CAP[topicId];
  const currentStars = getStars(heartsAccumulated, cap);
  const progress = getStarProgress(heartsAccumulated, cap);

  return (
    <div className="flex items-center gap-2">
      {/* 星星 */}
      <div className="flex gap-0.5">
        {Array.from({ length: cap }).map((_, i) => (
          <span key={i} className={`text-sm leading-none ${i < currentStars ? 'text-warning' : 'text-border-2'}`}>
            ★
          </span>
        ))}
      </div>
      {/* 当前星内进度条 */}
      {currentStars < cap && (
        <div className="flex-1 h-1.5 bg-border-2 rounded-full overflow-hidden min-w-[60px]">
          <div
            className="h-full bg-warning rounded-full transition-all duration-500"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>
      )}
      {currentStars >= cap && (
        <span className="text-[12px] font-bold text-warning">满级</span>
      )}
    </div>
  );
}

// ─── 主页面 ───

export default function AdvanceSelect() {
  const setPage = useUIStore(s => s.setPage);
  const gameProgress = useGameProgressStore(s => s.gameProgress);
  const isAdvanceUnlocked = useGameProgressStore(s => s.isAdvanceUnlocked);
  const startAdvanceSession = useSessionStore(s => s.startAdvanceSession);

  const handleStart = (topicId: TopicId) => {
    startAdvanceSession(topicId);
    setPage('practice');
  };

  const unlockedTopics = TOPICS.filter(t => isAdvanceUnlocked(t.id));
  const lockedTopics   = TOPICS.filter(t => !isAdvanceUnlocked(t.id));

  return (
    <div className="min-h-dvh bg-bg flex flex-col safe-top">
      {/* 顶栏 */}
      <div className="px-4 pt-4 pb-2 flex items-center gap-3">
        <button
          onClick={() => setPage('home')}
          className="w-9 h-9 rounded-full bg-card border-2 border-border-2 flex items-center justify-center text-text-2"
          aria-label="返回首页"
        >
          ←
        </button>
        <h1 className="text-[22px] font-black text-text-1">进阶训练</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-24 space-y-4 mt-2">
        {/* 已解锁题型 */}
        {unlockedTopics.length > 0 && (
          <section>
            <p className="text-xs font-bold text-text-2 mb-2 uppercase tracking-wide">已解锁</p>
            <div className="space-y-3">
              {unlockedTopics.map(topic => {
                const advProg = gameProgress?.advanceProgress[topic.id];
                const heartsAcc = advProg?.heartsAccumulated ?? 0;
                const sessionsPlayed = advProg?.sessionsPlayed ?? 0;

                return (
                  <div
                    key={topic.id}
                    className="bg-card rounded-2xl border-2 border-border-2 p-4 flex items-center gap-4"
                    style={{ boxShadow: '0 1px 5px rgba(0,0,0,.07)' }}
                  >
                    {/* 图标 */}
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0"
                      style={{ backgroundColor: `${topic.color}18` }}
                    >
                      {topic.icon}
                    </div>

                    {/* 信息区 */}
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-text-1 text-[15px]">{topic.name}</p>
                      <div className="mt-1">
                        <StarProgressBar heartsAccumulated={heartsAcc} topicId={topic.id} />
                      </div>
                      <p className="text-[12px] text-text-2 mt-1">
                        已练 {sessionsPlayed} 局 · 累计 {heartsAcc}❤️
                      </p>
                    </div>

                    {/* 开始按钮 */}
                    <button
                      onClick={() => handleStart(topic.id)}
                      className="btn-flat shrink-0 px-4 py-2 text-sm"
                      aria-label={`开始 ${topic.name} 进阶训练`}
                    >
                      开始
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* 未解锁题型 */}
        {lockedTopics.length > 0 && (
          <section>
            <p className="text-xs font-bold text-text-2 mb-2 uppercase tracking-wide">
              完成闯关后解锁
            </p>
            <div className="space-y-3">
              {lockedTopics.map(topic => (
                <div
                  key={topic.id}
                  className="bg-card rounded-2xl border-2 border-border-2 p-4 flex items-center gap-4 opacity-50"
                >
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 grayscale"
                    style={{ backgroundColor: `${topic.color}18` }}
                  >
                    {topic.icon}
                  </div>
                  <div className="flex-1">
                    <p className="font-black text-text-1 text-[15px]">{topic.name}</p>
                    <p className="text-[12px] text-text-2 mt-0.5">完成全部闯关关卡后解锁</p>
                  </div>
                  <span className="text-text-2 text-xl" aria-hidden>🔒</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 空状态 */}
        {unlockedTopics.length === 0 && lockedTopics.length === 0 && (
          <div className="text-center py-16 text-text-2">
            <p className="text-4xl mb-3">🗺️</p>
            <p className="font-bold">完成任意题型的全部闯关关卡，即可解锁进阶训练</p>
          </div>
        )}
      </div>

      <BottomNav activeTab="home" />
    </div>
  );
}
