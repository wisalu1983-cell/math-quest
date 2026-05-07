// src/pages/SessionSummary.tsx
import { useEffect, useRef, useState } from 'react';
import { useUIStore, useGameProgressStore } from '@/store';
import { getTopicDisplayName } from '@/constants';
import { TOPIC_STAR_CAP, STAR_THRESHOLDS_3, STAR_THRESHOLDS_5, ADVANCE_MAX_HEARTS } from '@/constants/advance';
import { getStars, getStarProgress } from '@/engine/advance';
import LoadingScreen from '@/components/LoadingScreen';
import Hearts from '@/components/Hearts';
import ConfettiEffect from '@/components/ConfettiEffect';
import type { TopicId } from '@/types';

// ─── 进阶结算视图 ───

type HeartStep = { stars: number; progress: number; leveledUp: boolean };

function computeHeartSteps(accBefore: number, heartsEarned: number, cap: 3 | 5): HeartStep[] {
  const steps: HeartStep[] = [];
  for (let i = 0; i < heartsEarned; i++) {
    const acc = accBefore + i + 1;
    const s = getStars(acc, cap);
    const p = getStarProgress(acc, cap);
    const prevStars = i === 0 ? getStars(Math.max(0, accBefore), cap) : steps[i - 1].stars;
    steps.push({ stars: s, progress: p, leveledUp: s > prevStars });
  }
  return steps;
}

function AdvanceSummary({ topicId, heartsEarned, correctCount, totalCount, accuracy }: {
  topicId: TopicId;
  heartsEarned: number;
  correctCount: number;
  totalCount: number;
  accuracy: number;
}) {
  const setPage      = useUIStore(s => s.setPage);
  const gameProgress = useGameProgressStore(s => s.gameProgress);
  const cap          = TOPIC_STAR_CAP[topicId];
  const advProg      = gameProgress?.advanceProgress[topicId] ?? null;
  const topicName    = getTopicDisplayName(topicId);

  const heartsAccAfter    = advProg?.heartsAccumulated ?? 0;
  const heartsAccBefore   = heartsAccAfter - heartsEarned;
  const starsBefore       = getStars(Math.max(0, heartsAccBefore), cap);
  const starsAfter        = advProg ? getStars(heartsAccAfter, cap) : 0;
  const starProgressBefore = getStarProgress(Math.max(0, heartsAccBefore), cap);
  const starProgressAfter  = getStarProgress(heartsAccAfter, cap);
  const thresholds        = cap === 3 ? STAR_THRESHOLDS_3 : STAR_THRESHOLDS_5;
  const heartsNeeded      = starsAfter < cap ? thresholds[starsAfter] - heartsAccAfter : 0;
  const steps             = computeHeartSteps(heartsAccBefore, heartsEarned, cap);

  // ── animation state ──
  const [displayStars,   setDisplayStars]   = useState(starsBefore);
  const [displayProgress, setDisplayProgress] = useState(starProgressBefore);
  const [withTransition, setWithTransition] = useState(true);
  const [heartVisible,   setHeartVisible]   = useState(() => Array(heartsEarned).fill(false) as boolean[]);
  const [heartSpent,     setHeartSpent]     = useState(() => Array(heartsEarned).fill(false) as boolean[]);
  const [heartPulsing,   setHeartPulsing]   = useState(false);
  const [bannerLeveled,  setBannerLeveled]  = useState(false);
  const [showConfetti,   setShowConfetti]   = useState(false);
  const [showDelta,      setShowDelta]      = useState(false);
  const [bouncingStarIdx, setBouncingStarIdx] = useState<number | null>(null);

  // ── refs ──
  const heartRefs  = useRef<(HTMLSpanElement | null)[]>([]);
  const trackRef   = useRef<HTMLDivElement>(null);
  const progressRef = useRef(starProgressBefore);
  const timers     = useRef<ReturnType<typeof setTimeout>[]>([]);

  function addTimer(fn: () => void, ms: number) {
    const id = setTimeout(fn, ms);
    timers.current.push(id);
    return id;
  }

  function setDP(value: number, transition = true) {
    progressRef.current = value;
    setWithTransition(transition);
    setDisplayProgress(value);
  }

  function flyHeart(idx: number, onLand: () => void) {
    const heartEl = heartRefs.current[idx];
    const trackEl = trackRef.current;
    if (!heartEl || !trackEl) { onLand(); return; }

    const hr = heartEl.getBoundingClientRect();
    const tr = trackRef.current!.getBoundingClientRect();
    const fillRight = tr.left + progressRef.current * tr.width;
    const fillMidY  = tr.top  + tr.height / 2;

    // dim the source heart
    setHeartSpent(prev => { const n = [...prev]; n[idx] = true; return n; });

    const flier = document.createElement('div');
    flier.setAttribute('data-mq-flier', '');
    flier.style.cssText = `
      position:fixed;
      left:${hr.left + hr.width / 2 - 14}px;
      top:${hr.top}px;
      font-size:26px;
      z-index:1001;
      pointer-events:none;
    `;
    flier.textContent = '❤️';
    document.body.appendChild(flier);

    const dx = fillRight - (hr.left + hr.width / 2 - 14);
    const dy = fillMidY  - (hr.top  + hr.height / 2);

    const anim = flier.animate([
      { transform: 'translate(0,0) scale(1)',                    opacity: 1 },
      { transform: `translate(${dx * .25}px,-18px) scale(0.72)`, opacity: 1, offset: 0.3 },
      { transform: `translate(${dx}px,${dy}px) scale(0.18)`,    opacity: 0 },
    ], { duration: 420, easing: 'cubic-bezier(0.4,0,0.2,1)', fill: 'forwards' });

    anim.onfinish = () => { flier.remove(); onLand(); };
  }

  useEffect(() => {
    const activeTimers = timers.current;

    // Scene 1: hearts bounce in, 120 ms stagger
    for (let i = 0; i < heartsEarned; i++) {
      addTimer(() => {
        setHeartVisible(prev => { const n = [...prev]; n[i] = true; return n; });
      }, 500 + i * 120);
    }

    if (heartsEarned === 0) return;

    const allEnteredAt = 500 + heartsEarned * 120;
    addTimer(() => setHeartPulsing(true), allEnteredAt + 300);

    // Scene 2: inject hearts one by one
    function inject(idx: number) {
      if (idx >= heartsEarned) {
        addTimer(() => setShowDelta(true), 300);
        return;
      }

      setHeartPulsing(false);
      const step = steps[idx];

      flyHeart(idx, () => {
        if (step.leveledUp) {
          // fill to 100% first
          setDP(1.0);
          addTimer(() => {
            // star bounces into gold
            setDisplayStars(step.stars);
            setBouncingStarIdx(step.stars - 1);
            addTimer(() => setBouncingStarIdx(null), 450);

            setShowConfetti(true);
            setBannerLeveled(true);
            addTimer(() => setShowConfetti(false), 2500);

            // instant-reset progress bar, then grow to new segment
            addTimer(() => {
              setDP(0, false);
              requestAnimationFrame(() => requestAnimationFrame(() => {
                setDP(step.progress, true);
                addTimer(() => inject(idx + 1), 850);
              }));
            }, 500);
          }, 380);
        } else {
          setDP(step.progress);
          addTimer(() => inject(idx + 1), 650);
        }
      });
    }

    addTimer(() => inject(0), allEnteredAt + 550);

    return () => {
      activeTimers.forEach(clearTimeout);
      document.querySelectorAll('[data-mq-flier]').forEach(el => el.remove());
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-dvh bg-bg flex flex-col items-center justify-center safe-top px-4">
      <div className="max-w-sm w-full text-center space-y-3">

        {/* Banner — compact horizontal */}
        <div className={`py-3.5 px-5 rounded-2xl border-2 stagger-1 text-center
          transition-[background-color,border-color] duration-500 ${
          bannerLeveled
            ? 'bg-warning-lt border-warning'
            : heartsEarned > 0
              ? 'bg-success-lt border-success-mid'
              : 'bg-card border-border-2'
        }`}>
          <div className="inline-flex items-center gap-3">
            <span className="text-4xl leading-none">
              {bannerLeveled ? '🌟' : heartsEarned === 3 ? '🎉' : heartsEarned >= 1 ? '💪' : '😅'}
            </span>
            <div className="text-left">
              <p className="text-[18px] font-black leading-tight">
                {bannerLeveled ? '升星啦！' : heartsEarned > 0 ? '练习完成！' : '白练一局，继续加油！'}
              </p>
              <p className="text-text-2 text-xs font-bold mt-0.5">
                {topicName} · 进阶模式
              </p>
            </div>
          </div>
        </div>

        <ConfettiEffect active={showConfetti} />

        {/* 合并进阶进度卡片：星星行 + 心行 + 进度条 */}
        <div className="bg-card rounded-2xl border-2 border-border-2 p-4 stagger-2"
             style={{ boxShadow: '0 1px 5px rgba(0,0,0,.07)' }}>

          {/* Stars */}
          <div className="flex justify-center gap-1.5 mb-4">
            {Array.from({ length: cap }).map((_, i) => (
              <span
                key={i}
                className={`text-[30px] leading-none transition-colors duration-300 ${
                  i < displayStars ? 'text-warning' : 'text-border-2'
                } ${bouncingStarIdx === i ? 'animate-star-bounce' : ''}`}
              >★</span>
            ))}
          </div>

          {/* Hearts */}
          {heartsEarned > 0 && (
            <div className="flex justify-center gap-3.5 mb-4">
              {Array.from({ length: heartsEarned }).map((_, i) => (
                <span
                  key={i}
                  ref={el => { heartRefs.current[i] = el; }}
                  className={`text-[28px] leading-none transition-[opacity,transform] duration-300 ${
                    heartSpent[i]
                      ? 'opacity-15 scale-50'
                      : heartVisible[i]
                        ? `opacity-100 scale-100 ${heartPulsing ? 'animate-bounce-rec' : ''}`
                        : 'opacity-0 scale-0'
                  }`}
                >❤️</span>
              ))}
            </div>
          )}

          {/* Progress bar */}
          {starsAfter < cap && (
            <div className="space-y-1.5">
              <div ref={trackRef} className="h-2.5 bg-border-2 rounded-full overflow-hidden">
                <div
                  className={`h-full bg-warning rounded-full ${
                    withTransition ? 'transition-[width] duration-500 ease-out' : ''
                  }`}
                  style={{ width: `${Math.round(displayProgress * 100)}%` }}
                />
              </div>
              <p className={`text-[11px] text-text-2 text-center transition-opacity duration-500 ${
                showDelta ? 'opacity-100' : 'opacity-0'
              }`}>
                {starsBefore}★ {Math.round(starProgressBefore * 100)}% → {starsAfter}★ {Math.round(starProgressAfter * 100)}%
              </p>
            </div>
          )}
          {starsAfter >= cap && (
            <p className="text-xs font-bold text-warning text-center">已达满级 🏆</p>
          )}

          {/* 心→星简注 */}
          {heartsNeeded > 0 && (
            <p className="text-[11px] text-text-2 text-center mt-2.5">
              每局最多+{ADVANCE_MAX_HEARTS} ❤️，还差 {heartsNeeded}❤️升到{starsAfter + 1}★
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
            <div className={`text-2xl font-black ${
              accuracy >= 80 ? 'text-success' : accuracy >= 60 ? 'text-primary' : 'text-warning'
            }`}>{accuracy}%</div>
            <div className="text-xs font-bold text-text-2 mt-1">正确率</div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="space-y-3 stagger-3">
          <button onClick={() => setPage('advance-select')} className="btn-flat w-full">
            再来一局 ▶
          </button>
          <button onClick={() => setPage('home')} className="btn-secondary w-full">
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

  const topicName    = getTopicDisplayName(lastSession.topicId);
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
            {topicName} · 闯关模式
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
