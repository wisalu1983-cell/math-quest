// src/pages/SessionSummary.tsx
import { useEffect, useState } from 'react';
import { useUIStore, useGameProgressStore } from '@/store';
import { TOPICS } from '@/constants';
import { TOPIC_STAR_CAP, STAR_THRESHOLDS_3, STAR_THRESHOLDS_5 } from '@/constants/advance';
import { getStars, getStarProgress } from '@/engine/advance';
import LoadingScreen from '@/components/LoadingScreen';
import Hearts from '@/components/Hearts';
import ConfettiEffect from '@/components/ConfettiEffect';
import type { TopicId } from '@/types';

// ─── 进阶结算视图 ───

function AdvanceSummary({ topicId, heartsEarned, correctCount, totalCount, accuracy }: {
  topicId: TopicId;
  heartsEarned: number;
  correctCount: number;
  totalCount: number;
  accuracy: number;
}) {
  const setPage = useUIStore(s => s.setPage);
  const gameProgress = useGameProgressStore(s => s.gameProgress);
  const cap = TOPIC_STAR_CAP[topicId];
  const advProg = gameProgress?.advanceProgress[topicId] ?? null;
  const currentStars = advProg ? getStars(advProg.heartsAccumulated, cap) : 0;
  const progress = advProg;
  const topic = TOPICS.find(t => t.id === topicId);

  // 上一次的心数（结算前）
  const heartsAccAfter  = progress?.heartsAccumulated ?? 0;
  const heartsAccBefore = heartsAccAfter - heartsEarned;
  const starsBefore = getStars(Math.max(0, heartsAccBefore), cap);
  const starsAfter  = currentStars;
  const leveled     = starsAfter > starsBefore;

  const starProgressBefore = getStarProgress(Math.max(0, heartsAccBefore), cap);
  const starProgress = getStarProgress(heartsAccAfter, cap);

  // 进度条 before→after 动效
  const [animated, setAnimated] = useState(false);
  useEffect(() => {
    if (heartsEarned > 0) {
      const timer = setTimeout(() => setAnimated(true), 300);
      return () => clearTimeout(timer);
    }
  }, [heartsEarned]);

  // 下一星段所需心数增量
  const thresholds = cap === 3 ? STAR_THRESHOLDS_3 : STAR_THRESHOLDS_5;
  const nextThreshold = starsAfter < cap
    ? thresholds[starsAfter] - (starsAfter > 0 ? thresholds[starsAfter - 1] : 0)
    : 0;

  return (
    <div className="min-h-dvh bg-bg flex flex-col items-center justify-center safe-top px-4">
      <div className="max-w-sm w-full text-center space-y-5">

        {/* Banner */}
        <div className={`py-7 rounded-3xl border-2 stagger-1 ${
          leveled
            ? 'bg-warning-lt border-warning'
            : heartsEarned > 0
              ? 'bg-success-lt border-success-mid'
              : 'bg-card border-border-2'
        }`}>
          <div className="text-5xl mb-3">
            {leveled ? '🌟' : heartsEarned === 3 ? '🎉' : heartsEarned >= 1 ? '💪' : '😅'}
          </div>
          <h1 className="text-[22px] font-black">
            {leveled ? '升星啦！' : heartsEarned > 0 ? '练习完成！' : '白练一局，继续加油！'}
          </h1>
          <p className="text-text-2 text-sm font-bold mt-1.5">
            {topic?.name ?? '进阶训练'} · 进阶模式
          </p>
        </div>
        <ConfettiEffect active={leveled} />

        {/* 心数投入 */}
        <div className="bg-card rounded-2xl border-2 border-border-2 p-4 stagger-2"
             style={{ boxShadow: '0 1px 5px rgba(0,0,0,.07)' }}>
          <p className="text-xs font-bold text-text-2 mb-2">本次投入进度</p>
          <div className="flex items-center justify-center gap-2">
            <Hearts count={heartsEarned} />
            <span className="text-lg font-black text-primary">+{heartsEarned} ❤️</span>
          </div>
        </div>

        {/* 星级进度 */}
        <div className="bg-card rounded-2xl border-2 border-border-2 p-4 stagger-2"
             style={{ boxShadow: '0 1px 5px rgba(0,0,0,.07)' }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-text-2">星级进度</p>
            {leveled && (
              <span className="text-xs font-black text-warning bg-warning/10 px-2 py-0.5 rounded-full">
                ✨ 升星！
              </span>
            )}
          </div>

          {/* 星星 */}
          <div className="flex justify-center gap-1 mb-3">
            {Array.from({ length: cap }).map((_, i) => (
              <span
                key={i}
                className={`text-2xl transition-all duration-300 ${
                  i < starsAfter ? 'text-warning' : 'text-border-2'
                } ${leveled && i === starsAfter - 1 ? 'scale-125' : ''}`}
              >
                ★
              </span>
            ))}
          </div>

          {/* 进度条 */}
          {starsAfter < cap && (
            <div className="space-y-1">
              <div className="h-2 bg-border-2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-warning rounded-full transition-[width] duration-700 ease-out"
                  style={{ width: `${Math.round((animated ? starProgress : starProgressBefore) * 100)}%` }}
                />
              </div>
              <p className="text-[12px] text-text-2 text-right">
                {Math.round(starProgress * 100)}% → {starsAfter + 1}★
              </p>
              {heartsEarned > 0 && (
                <p className="text-[12px] text-text-2 text-center">
                  本局 +{heartsEarned} ❤️ | 进度 {Math.round(starProgressBefore * 100)}% → {Math.round(starProgress * 100)}%
                </p>
              )}
            </div>
          )}
          {starsAfter >= cap && (
            <p className="text-xs font-bold text-warning text-center">已达满级 🏆</p>
          )}

          {/* 心→星简注 */}
          {starsAfter < cap && nextThreshold > 0 && (
            <p className="text-[11px] text-text-2 text-center mt-2">
              每局最多 +3 ❤️ · 积 {nextThreshold} ❤️ 升 1★
            </p>
          )}
        </div>

        {/* 答题统计 */}
        <div className="grid grid-cols-2 gap-3 stagger-2">
          <div className="bg-card rounded-2xl p-4 border-2 border-border-2"
               style={{ boxShadow: '0 1px 5px rgba(0,0,0,.07)' }}>
            <div className="text-2xl font-black text-primary">{correctCount}/{totalCount}</div>
            <div className="text-xs font-bold text-text-2 mt-1">答对题数</div>
          </div>
          <div className="bg-card rounded-2xl p-4 border-2 border-border-2"
               style={{ boxShadow: '0 1px 5px rgba(0,0,0,.07)' }}>
            <div className={`text-2xl font-black ${accuracy >= 80 ? 'text-success' : accuracy >= 60 ? 'text-primary' : 'text-warning'}`}>
              {accuracy}%
            </div>
            <div className="text-xs font-bold text-text-2 mt-1">正确率</div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="space-y-3 stagger-3">
          <button
            onClick={() => setPage('advance-select')}
            className="btn-flat w-full"
          >
            再来一局 ▶
          </button>
          <button
            onClick={() => setPage('home')}
            className="btn-secondary w-full"
          >
            回首页
          </button>
        </div>

      </div>
    </div>
  );
}

// ─── 主组件（按 sessionMode 分发） ───

export default function SessionSummary() {
  const lastSession = useUIStore(s => s.lastSession);
  const setPage     = useUIStore(s => s.setPage);

  useEffect(() => {
    if (!lastSession) setPage('home');
  }, [lastSession, setPage]);

  if (!lastSession) return <LoadingScreen />;

  const topic        = TOPICS.find(t => t.id === lastSession.topicId);
  const correctCount = lastSession.questions.filter(q => q.correct).length;
  const totalCount   = lastSession.questions.length;
  const accuracy     = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

  // 进阶模式：单独渲染
  if (lastSession.sessionMode === 'advance') {
    return (
      <AdvanceSummary
        topicId={lastSession.topicId}
        heartsEarned={lastSession.heartsRemaining}
        correctCount={correctCount}
        totalCount={totalCount}
        accuracy={accuracy}
      />
    );
  }

  // 闯关 / 其他模式（原有逻辑）
  const passed = lastSession.heartsRemaining > 0;

  return (
    <div className="min-h-dvh bg-bg flex flex-col items-center justify-center safe-top px-4">
      <div className="max-w-sm w-full text-center space-y-5">

        {/* 通关/失败 Banner */}
        <div className={`py-7 rounded-3xl border-2 stagger-1 ${
          passed
            ? 'bg-success-lt border-success-mid'
            : 'bg-warning-lt border-warning'
        }`}>
          <div className="text-5xl mb-3">{passed ? '🎉' : '😅'}</div>
          <h1 className="text-[24px] font-black">{passed ? '太棒了，通关！' : '没关系，再来一次！'}</h1>
          <p className="text-text-2 text-sm font-bold mt-1.5">
            {topic?.name ?? '练习'} · 闯关模式
          </p>
        </div>

        {/* 剩余心数 */}
        {passed && (
          <div className="flex flex-col items-center gap-2 stagger-2">
            <p className="text-sm font-bold text-text-2">剩余心数</p>
            <Hearts count={lastSession.heartsRemaining} />
          </div>
        )}

        {/* 答题统计 */}
        <div className="grid grid-cols-2 gap-3 stagger-2">
          <div className="bg-card rounded-2xl p-4 border-2 border-border-2"
               style={{ boxShadow: '0 1px 5px rgba(0,0,0,.07)' }}>
            <div className="text-2xl font-black text-primary">{correctCount}/{totalCount}</div>
            <div className="text-xs font-bold text-text-2 mt-1">答对题数</div>
          </div>
          <div className="bg-card rounded-2xl p-4 border-2 border-border-2"
               style={{ boxShadow: '0 1px 5px rgba(0,0,0,.07)' }}>
            <div className={`text-2xl font-black ${accuracy >= 80 ? 'text-success' : accuracy >= 60 ? 'text-primary' : 'text-warning'}`}>
              {accuracy}%
            </div>
            <div className="text-xs font-bold text-text-2 mt-1">正确率</div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="space-y-3 stagger-3">
          <button
            onClick={() => setPage('campaign-map')}
            className="btn-flat w-full"
          >
            {passed ? '继续闯关 ▶' : '再试一次'}
          </button>
          <button
            onClick={() => setPage('home')}
            className="btn-secondary w-full"
          >
            回首页
          </button>
        </div>
      </div>
    </div>
  );
}
