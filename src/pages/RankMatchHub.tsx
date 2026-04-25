// src/pages/RankMatchHub.tsx
// 段位赛大厅：展示五段位卡片、入场校验、活跃赛事恢复入口
// 路由：useUIStore.currentPage === 'rank-match-hub'（禁用 react-router）

import { useState } from 'react';
import { useUIStore, useSessionStore, useGameProgressStore } from '@/store';
import { useRankMatchStore, RankMatchRecoveryError } from '@/store/rank-match';
import { isTierUnlocked, getTierGaps } from '@/engine/rank-match/entry-gate';
import { getCurrentGameIndex } from '@/engine/rank-match/match-state';
import {
  getRankMatchTakeoverState,
  getTakeoverMinutesLeft,
} from '@/engine/rank-match/takeover-policy';
import { RANK_BEST_OF, RANK_WINS_TO_ADVANCE, TIER_LABEL, TIER_ORDER, type ChallengeableTier } from '@/constants/rank-match';
import { getTopicDisplayName } from '@/constants';
import RankBadge from '@/components/RankBadge';
import BottomNav from '@/components/BottomNav';
import Dialog from '@/components/Dialog';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import type { RankTier } from '@/types/gamification';

const TIER_DESC: Record<RankTier, string> = {
  apprentice: '初始段位，完成进阶训练后升级',
  rookie: `BO${RANK_BEST_OF.rookie}，${RANK_WINS_TO_ADVANCE.rookie}胜晋级`,
  pro: `BO${RANK_BEST_OF.pro}，${RANK_WINS_TO_ADVANCE.pro}胜晋级`,
  expert: `BO${RANK_BEST_OF.expert}，${RANK_WINS_TO_ADVANCE.expert}胜晋级`,
  master: `BO${RANK_BEST_OF.master}，${RANK_WINS_TO_ADVANCE.master}胜晋级`,
};

export default function RankMatchHub() {
  const { setPage } = useUIStore();
  const { startRankMatchGame, resumeRankMatchGame } = useSessionStore();
  const {
    activeRankSession,
    startedInThisSession,
    markAsStartedInThisSession,
    startRankMatch,
    reactivateSuspendedMatch,
    cancelActiveMatch,
  } = useRankMatchStore();
  const gameProgress = useGameProgressStore(s => s.gameProgress);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);
  const [showAbandonConfirm, setShowAbandonConfirm] = useState(false);
  const online = useOnlineStatus();

  const rankProgress = gameProgress?.rankProgress;
  const advanceProgress = gameProgress?.advanceProgress ?? {};
  const currentTier = rankProgress?.currentTier ?? 'apprentice';

  function handleStartChallenge(tier: Exclude<RankTier, 'apprentice'>) {
    setErrorMsg(null);
    if (!online) {
      setErrorMsg('段位赛需要联网才能进行');
      return;
    }
    try {
      const session = startRankMatch(tier as ChallengeableTier);
      startRankMatchGame(session.id, 1);
      setPage('practice');
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : '发起挑战失败，请稍后重试');
    }
  }

  function handleResumeMatch() {
    setErrorMsg(null);
    if (!activeRankSession) return;
    try {
      if (activeRankSession.status === 'suspended') {
        const reactivated = reactivateSuspendedMatch();
        const unfinished = reactivated.games.find(g => !g.finished);
        if (!unfinished) {
          throw new Error('找不到可继续的未完成对局');
        }
        resumeRankMatchGame(unfinished.practiceSessionId);
        setPage('practice');
        return;
      }

      const currentIdx = getCurrentGameIndex(activeRankSession);
      if (currentIdx !== undefined) {
        const targetGame = activeRankSession.games.find(g => g.gameIndex === currentIdx);
        if (!targetGame) {
          throw new Error(`找不到第 ${currentIdx} 局的 PracticeSession`);
        }
        resumeRankMatchGame(targetGame.practiceSessionId);
        markAsStartedInThisSession(activeRankSession.id);
        setPage('practice');
      } else {
        if (!online) {
          setErrorMsg('段位赛需要联网才能开始下一局');
          return;
        }
        // 局间：开始下一局
        const nextIdx = activeRankSession.games.length + 1;
        startRankMatchGame(activeRankSession.id, nextIdx);
        markAsStartedInThisSession(activeRankSession.id);
        setPage('practice');
      }
    } catch (e) {
      if (e instanceof RankMatchRecoveryError) {
        setPage('rank-match-hub');
      }
      setErrorMsg(e instanceof Error ? e.message : '继续挑战失败，请稍后重试');
    }
  }

  function handleRestartMatch() {
    setErrorMsg(null);
    if (!activeRankSession) return;
    if (!online) {
      setErrorMsg('段位赛需要联网才能重新开始');
      setShowRestartConfirm(false);
      return;
    }
    const targetTier = activeRankSession.targetTier;
    try {
      cancelActiveMatch();
      const restarted = startRankMatch(targetTier);
      startRankMatchGame(restarted.id, 1);
      setShowRestartConfirm(false);
      setPage('practice');
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : '重新开始失败，请稍后重试');
      setShowRestartConfirm(false);
    }
  }

  function handleTakeoverMatch() {
    setErrorMsg(null);
    if (!activeRankSession) return;

    try {
      const currentIdx = getCurrentGameIndex(activeRankSession);
      if (currentIdx !== undefined) {
        const targetGame = activeRankSession.games.find(g => g.gameIndex === currentIdx);
        if (!targetGame) {
          throw new Error(`找不到第 ${currentIdx} 局的 PracticeSession`);
        }
        resumeRankMatchGame(targetGame.practiceSessionId);
        markAsStartedInThisSession(activeRankSession.id);
        setPage('practice');
        return;
      }

      if (!online) {
        setErrorMsg('段位赛需要联网才能开始下一局');
        return;
      }

      const nextIdx = activeRankSession.games.length + 1;
      startRankMatchGame(activeRankSession.id, nextIdx);
      markAsStartedInThisSession(activeRankSession.id);
      setPage('practice');
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : '接管挑战失败，请稍后重试');
    }
  }

  function handleAbandonActiveMatch() {
    setErrorMsg(null);
    try {
      cancelActiveMatch();
      setShowAbandonConfirm(false);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : '放弃挑战失败，请稍后重试');
      setShowAbandonConfirm(false);
    }
  }

  // 活跃赛事优先展示
  if (activeRankSession && !activeRankSession.outcome) {
    const currentIdx = getCurrentGameIndex(activeRankSession);
    const wins = activeRankSession.games.filter(g => g.finished && g.won).length;
    const losses = activeRankSession.games.filter(g => g.finished && !g.won).length;
    const takeoverState = getRankMatchTakeoverState({
      session: activeRankSession,
      startedInThisSession,
      now: Date.now(),
    });
    const isAnotherDeviceActive = takeoverState === 'another-device-active';
    const isStaleActiveTakeoverable = takeoverState === 'stale-active-takeoverable';
    const minutesLeft = getTakeoverMinutesLeft(activeRankSession, Date.now());
    const statusLabel = activeRankSession.status === 'suspended'
      ? '中断中的挑战'
      : isAnotherDeviceActive
        ? '另一台设备正在进行中'
        : isStaleActiveTakeoverable
          ? '可在本设备接管'
          : '正在挑战';
    const statusSub = activeRankSession.status === 'suspended'
      ? '已保留当前挑战进度，可继续或放弃重开'
      : isAnotherDeviceActive
        ? `检测到另一台设备正在挑战，约 ${minutesLeft} 分钟后可在本设备接管`
        : isStaleActiveTakeoverable
          ? '这场挑战超过 10 分钟无响应，本设备可接管继续'
          : `${wins}胜 ${losses}负 · 需${activeRankSession.winsToAdvance}胜晋级`;

    return (
      <div className="min-h-dvh bg-bg pb-[88px] safe-top">
        <div className="sticky top-0 z-10 bg-card border-b-2 border-border-2 px-5 py-3.5 flex items-center gap-3">
          <button onClick={() => setPage('home')} className="text-text-2 text-xl" aria-label="返回主页">‹</button>
          <span className="text-[15px] font-black text-text">段位赛大厅</span>
        </div>

        <div className="max-w-lg mx-auto px-5 pt-6">
          <div className="bg-card rounded-[20px] border-2 p-5 mb-5"
               style={{ borderColor: `var(--rank-${activeRankSession.targetTier})` }}>
            <div className="flex items-center gap-3 mb-4">
              <RankBadge tier={activeRankSession.targetTier} size="lg" showLabel />
              <div className="flex-1">
                <div className="text-[13px] font-bold text-text-2 mb-0.5">
                  {statusLabel}
                </div>
                <div className="text-[17px] font-black text-text">
                  {TIER_LABEL[activeRankSession.targetTier]} BO{activeRankSession.bestOf}
                </div>
                <div className="text-[12px] text-text-2 mt-0.5">
                  {statusSub}
                </div>
              </div>
            </div>

            {/* 胜负矩阵 */}
            <div className="flex gap-1.5 mb-4">
              {activeRankSession.games.map(g => (
                <span key={g.gameIndex}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-base"
                      style={{
                        background: g.finished
                          ? g.won ? 'var(--color-success-lt)' : 'var(--color-danger-lt)'
                          : 'var(--color-border-2)',
                        border: '2px solid',
                        borderColor: g.finished
                          ? g.won ? 'var(--color-success)' : 'var(--color-danger)'
                          : 'var(--color-border)',
                      }}>
                  {g.finished ? (g.won ? '✓' : '✗') : (currentIdx === g.gameIndex ? '▶' : '○')}
                </span>
              ))}
            </div>

            {isAnotherDeviceActive ? (
              <div className="flex flex-col gap-3">
                <p className="text-[13px] text-text-2">
                  这场挑战正在另一台设备上进行。等待对方结束，或稍后在本设备接管继续。
                </p>
                <button
                  onClick={() => setShowAbandonConfirm(true)}
                  className="w-full btn-secondary rounded-2xl text-center"
                >
                  放弃这局挑战
                </button>
              </div>
            ) : isStaleActiveTakeoverable ? (
              <div className="flex flex-col gap-3">
                <p className="text-[13px] text-text-2">
                  这场挑战在另一台设备上超过 10 分钟无响应，本设备可接管继续。
                </p>
                <button
                  onClick={handleTakeoverMatch}
                  className="w-full btn-flat rounded-2xl text-center disabled:opacity-45"
                  disabled={!online && currentIdx === undefined}
                >
                  {currentIdx !== undefined ? `继续第 ${currentIdx} 局` : '开始下一局'}
                </button>
                <button
                  onClick={() => setShowRestartConfirm(true)}
                  className="w-full btn-secondary rounded-2xl text-center disabled:opacity-45"
                  disabled={!online}
                >
                  放弃，重新开始
                </button>
              </div>
            ) : activeRankSession.status === 'suspended' ? (
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleResumeMatch}
                  className="w-full btn-flat rounded-2xl text-center"
                >
                  {currentIdx !== undefined ? `继续第 ${currentIdx} 局` : '继续当前对局'}
                </button>
                <button
                  onClick={() => setShowRestartConfirm(true)}
                  className="w-full btn-secondary rounded-2xl text-center"
                >
                  放弃，重新开始
                </button>
              </div>
            ) : (
              <button
                onClick={handleResumeMatch}
                className="w-full btn-flat rounded-2xl text-center disabled:opacity-45"
                disabled={!online && currentIdx === undefined}
              >
                {currentIdx !== undefined ? `继续第 ${currentIdx} 局` : '开始下一局'}
              </button>
            )}
          </div>

          {errorMsg && (
            <div className="p-3 bg-danger-lt rounded-xl border border-danger/30 text-[13px] text-danger font-semibold">
              {errorMsg}
            </div>
          )}
          {!online && (
            <div className="mt-3 p-3 bg-warning-lt rounded-xl border border-warning/30 text-[13px] text-warning font-semibold">
              当前离线，段位赛需要联网才能开始新一局或重新开始。
            </div>
          )}
        </div>
        <Dialog
          open={showRestartConfirm}
          onClose={() => setShowRestartConfirm(false)}
          title="放弃，重新开始？"
        >
          <p className="text-sm text-text-2 mb-4">
            这会丢弃当前这场段位赛的进度，并从第 1 局重新开始。
          </p>
          <div className="flex gap-3">
            <button
              className="btn-secondary flex-1"
              onClick={() => setShowRestartConfirm(false)}
            >
              返回
            </button>
            <button
              className="btn-flat flex-1"
              onClick={handleRestartMatch}
            >
              确认重开
            </button>
          </div>
        </Dialog>
        <Dialog
          open={showAbandonConfirm}
          onClose={() => setShowAbandonConfirm(false)}
          title="放弃这局挑战？"
        >
          <p className="text-sm text-text-2 mb-4">
            这会把当前段位赛标记为已放弃，并同步到账号的其它设备。
          </p>
          <div className="flex gap-3">
            <button
              className="btn-secondary flex-1"
              onClick={() => setShowAbandonConfirm(false)}
            >
              返回
            </button>
            <button
              className="btn-flat flex-1"
              onClick={handleAbandonActiveMatch}
            >
              确认放弃
            </button>
          </div>
        </Dialog>
        <BottomNav activeTab="home" />
      </div>
    );
  }

  // 无活跃赛事：展示段位卡片列表
  return (
    <div className="min-h-dvh bg-bg pb-[88px] safe-top">
      <div className="sticky top-0 z-10 bg-card border-b-2 border-border-2 px-5 py-3.5 flex items-center gap-3">
        <button onClick={() => setPage('home')} className="text-text-2 text-xl" aria-label="返回主页">‹</button>
        <span className="text-[15px] font-black text-text">段位赛大厅</span>
      </div>

      <div className="max-w-lg mx-auto px-5 pt-5">
        <div className="mb-4">
          <p className="text-[13px] font-bold text-text-2">当前段位</p>
          <div className="flex items-center gap-2 mt-1">
            <RankBadge tier={currentTier} size="md" showLabel />
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-danger-lt rounded-xl border border-danger/30 text-[13px] text-danger font-semibold">
            {errorMsg}
          </div>
        )}

        {!online && (
          <div className="mb-4 p-3 bg-warning-lt rounded-xl border border-warning/30 text-[13px] text-warning font-semibold">
            当前离线，段位赛需要联网才能进行。恢复网络后可开始挑战。
          </div>
        )}

        <div className="space-y-3">
          {TIER_ORDER.filter(t => t !== 'apprentice').map((tier) => {
            const cTier = tier as ChallengeableTier;
            const unlocked = isTierUnlocked(tier, advanceProgress);
            const isPassed = rankProgress?.history.some(h => h.targetTier === cTier && h.outcome === 'promoted') ?? false;
            const gaps = !unlocked ? getTierGaps(tier, advanceProgress).slice(0, 3) : [];

            return (
              <div key={tier}
                   className="bg-card rounded-[18px] border-2 p-4 flex items-center gap-4"
                   style={{
                     borderColor: unlocked ? `var(--rank-${tier})` : 'var(--color-border-2)',
                     opacity: unlocked ? 1 : 0.7,
                     boxShadow: '0 1px 5px rgba(0,0,0,.07)',
                   }}>
                <RankBadge tier={tier} size="md" dimmed={!unlocked} />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[15px] font-black text-text">{TIER_LABEL[tier]}</span>
                    {isPassed && <span className="text-[11px] font-bold text-success">✓ 已通过</span>}
                  </div>
                  <p className="text-[12px] text-text-2">{TIER_DESC[tier]}</p>
                  {!unlocked && gaps.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {gaps.map(g => {
                        const topicName = getTopicDisplayName(g.topicId);
                        return (
                          <span key={g.topicId}
                                className="text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-warning-lt text-warning">
                            差 {topicName} {g.currentStars}★/{g.requiredStars}★
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
                {unlocked && (
                  <button
                    onClick={() => handleStartChallenge(cTier)}
                    disabled={!online}
                    className="shrink-0 px-4 py-2 rounded-2xl text-[13px] font-black text-white disabled:opacity-45"
                    style={{ background: online ? `var(--rank-${tier})` : 'var(--color-border)' }}
                    aria-label={`挑战${TIER_LABEL[tier]}段位`}
                  >
                    挑战
                  </button>
                )}
                {!unlocked && (
                  <span className="shrink-0 text-text-3 text-xl">🔒</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <BottomNav activeTab="home" />
    </div>
  );
}
