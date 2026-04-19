// src/pages/RankMatchGameResult.tsx
// 单局结算中间页：展示本局胜负、BO 进度、3 秒后自动跳下一局（或结束）
// 路由：useUIStore.currentPage === 'rank-match-game-result'

import { useEffect, useState, useCallback } from 'react';
import { useUIStore, useSessionStore } from '@/store';
import { useRankMatchStore } from '@/store/rank-match';
import { TIER_LABEL } from '@/constants/rank-match';
import RankBadge from '@/components/RankBadge';

const AUTO_NEXT_SECONDS = 3;

export default function RankMatchGameResult() {
  const { setPage } = useUIStore();
  const { startRankMatchGame } = useSessionStore();
  const lastAction = useSessionStore(s => s.lastRankMatchAction);
  const rankSession = useRankMatchStore(s => s.activeRankSession);

  const [countdown, setCountdown] = useState(AUTO_NEXT_SECONDS);
  const [didNavigate, setDidNavigate] = useState(false);

  const navigateNext = useCallback(() => {
    if (didNavigate) return;
    setDidNavigate(true);
    if (!lastAction) {
      setPage('rank-match-hub');
      return;
    }
    if (lastAction.kind === 'start-next') {
      if (rankSession) {
        startRankMatchGame(rankSession.id, rankSession.games.length + 1);
        setPage('practice');
      } else {
        setPage('rank-match-hub');
      }
    } else {
      setPage('rank-match-result');
    }
  }, [didNavigate, lastAction, rankSession, setPage, startRankMatchGame]);

  useEffect(() => {
    if (countdown <= 0) {
      navigateNext();
      return;
    }
    const id = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(id);
  }, [countdown, navigateNext]);

  if (!rankSession) {
    return (
      <div className="min-h-dvh bg-bg flex flex-col items-center justify-center px-5">
        <p className="text-text-2 text-[14px] font-bold">加载中...</p>
      </div>
    );
  }

  // 计算胜负
  const finishedGames = rankSession.games.filter(g => g.finished);
  const wins = finishedGames.filter(g => g.won).length;
  const losses = finishedGames.filter(g => !g.won).length;
  const lastGame = finishedGames[finishedGames.length - 1];
  const won = lastGame?.won ?? false;

  return (
    <div className="min-h-dvh bg-bg flex flex-col items-center safe-top px-5 pt-10">
      <div className="w-full max-w-sm">

        {/* 结果横幅 */}
        <div
          className="w-full rounded-[24px] border-2 p-6 text-center mb-6"
          style={{
            background: won ? 'var(--color-success-lt)' : 'var(--color-danger-lt)',
            borderColor: won ? 'var(--color-success)' : 'var(--color-danger)',
          }}
        >
          <div className="text-4xl mb-2">{won ? '🎉' : '💪'}</div>
          <div className="text-[22px] font-black" style={{ color: won ? 'var(--color-success)' : 'var(--color-danger)' }}>
            {won ? '本局获胜！' : '本局告负'}
          </div>
          <div className="text-[14px] font-bold text-text-2 mt-1">
            {TIER_LABEL[rankSession.targetTier]} BO{rankSession.bestOf} · 第 {lastGame?.gameIndex ?? '?'} 局
          </div>
        </div>

        {/* BO 进度徽标 */}
        <div className="flex justify-center mb-2">
          <RankBadge tier={rankSession.targetTier} size="md" showLabel />
        </div>

        {/* 胜负矩阵 */}
        <div className="flex justify-center gap-2 mb-6">
          {rankSession.games.map(g => (
            <span key={g.gameIndex}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                  style={{
                    background: g.finished
                      ? g.won ? 'var(--color-success-lt)' : 'var(--color-danger-lt)'
                      : 'var(--color-border-2)',
                    border: '2px solid',
                    borderColor: g.finished
                      ? g.won ? 'var(--color-success)' : 'var(--color-danger)'
                      : 'var(--color-border)',
                  }}>
              {g.finished ? (g.won ? '✓' : '✗') : '○'}
            </span>
          ))}
        </div>

        {/* 比分 */}
        <div className="text-center mb-8">
          <span className="text-[32px] font-black text-text">{wins}</span>
          <span className="text-[20px] font-bold text-text-2 mx-2">-</span>
          <span className="text-[32px] font-black text-text">{losses}</span>
          <div className="text-[12px] text-text-2 mt-1">胜 - 负（需{rankSession.winsToAdvance}胜晋级）</div>
        </div>

        {/* 手动跳转按钮 + 倒计时 */}
        <button
          onClick={navigateNext}
          className="w-full btn-flat rounded-2xl text-center"
        >
          {lastAction?.kind === 'start-next'
            ? `开始下一局（${countdown}s）`
            : lastAction
            ? `查看赛事结果（${countdown}s）`
            : `返回大厅（${countdown}s）`}
        </button>
      </div>
    </div>
  );
}
