// src/store/rank-match.ts
// 段位赛最小 store · Phase 3 M1
//
// 职责（最小 API）：
//   - activeRankSession：当前进行中的 BO 赛事（内存态，未持久化到 localStorage —— M2 再补）
//   - startRankMatch(targetTier)：入场校验 → 创建 RankMatchSession → 回写 rankProgress.activeSessionId
//   - handleGameFinished(practiceSessionSnapshot)：根据单局结果推进状态机并同步 rankProgress
//
// 明确不做：
//   - 不调用抽题器（M2）
//   - 不生成真实 PracticeSession —— 由外部传入 id，store 只持状态
//   - 不承接 UI 路由跳转（M3）

import { create } from 'zustand';
import { nanoid } from 'nanoid';
import type { PracticeSession } from '@/types';
import type {
  GameProgress,
  RankMatchSession,
  RankProgress,
  RankTier,
} from '@/types/gamification';
import {
  createRankMatchSession,
  onGameFinished,
  type GameFinishedNextAction,
} from '@/engine/rank-match/match-state';
import type { ChallengeableTier } from '@/constants/rank-match';
import { useUserStore } from './index';
import { useGameProgressStore } from './gamification';
import { repository } from '@/repository/local';

interface StartRankMatchOptions {
  /** 由调用方预分配的 PracticeSessionId（M2 会用它组装真实 PracticeSession） */
  firstPracticeSessionId?: string;
  /** 注入 now，方便单测 */
  now?: number;
}

export interface RankMatchStore {
  activeRankSession: RankMatchSession | null;

  /**
   * 开始挑战目标段位。
   * - 未满足入场星级 → 抛 Error（由 match-state.createRankMatchSession 抛出）
   * - 已有进行中赛事 → 抛 Error，禁止并存
   * - 成功后回写 rankProgress.activeSessionId
   */
  startRankMatch: (
    targetTier: ChallengeableTier,
    opts?: StartRankMatchOptions,
  ) => RankMatchSession;

  /**
   * 单局结束回调。
   * 根据 PracticeSession 快照推导该局胜负（won = completed && heartsRemaining >= 1），
   * 执行状态机并返回 nextAction 供调用方决定 UI 路由。
   * - 若赛事结束 → 同步 rankProgress.history / currentTier / activeSessionId
   */
  handleGameFinished: (practiceSessionSnapshot: PracticeSession) => GameFinishedNextAction;

  /** 仅为测试与恢复：直接设置活跃赛事引用 */
  _setActiveRankSession: (s: RankMatchSession | null) => void;
}

function writeRankProgress(patch: (prev: RankProgress) => RankProgress): void {
  const gpStore = useGameProgressStore.getState();
  const gp = gpStore.gameProgress;
  if (!gp) return;
  const prev = gp.rankProgress ?? { currentTier: 'apprentice' as RankTier, history: [] };
  const next: RankProgress = patch(prev);
  const updated: GameProgress = { ...gp, rankProgress: next };
  repository.saveGameProgress(updated);
  useGameProgressStore.setState({ gameProgress: updated });
}

export const useRankMatchStore = create<RankMatchStore>((set, get) => ({
  activeRankSession: null,

  startRankMatch: (targetTier, opts) => {
    if (get().activeRankSession) {
      throw new Error('Another rank match is already active');
    }
    const user = useUserStore.getState().user;
    if (!user) {
      throw new Error('Cannot start rank match: user not loaded');
    }
    const gp = useGameProgressStore.getState().gameProgress;
    if (!gp) {
      throw new Error('Cannot start rank match: game progress not loaded');
    }

    const firstPracticeSessionId = opts?.firstPracticeSessionId ?? nanoid(10);
    const session = createRankMatchSession({
      userId: user.id,
      targetTier,
      advanceProgress: gp.advanceProgress,
      firstPracticeSessionId,
      now: opts?.now,
    });

    writeRankProgress(prev => ({
      ...prev,
      activeSessionId: session.id,
    }));

    set({ activeRankSession: session });
    return session;
  },

  handleGameFinished: (practiceSessionSnapshot) => {
    const session = get().activeRankSession;
    if (!session) {
      throw new Error('No active rank match session');
    }
    const meta = practiceSessionSnapshot.rankMatchMeta;
    if (!meta || meta.rankSessionId !== session.id) {
      throw new Error('PracticeSession does not belong to active rank match');
    }

    const won = practiceSessionSnapshot.completed && practiceSessionSnapshot.heartsRemaining >= 1;
    const { session: nextSession, nextAction } = onGameFinished({
      session,
      gameIndex: meta.gameIndex,
      won,
    });

    if (nextAction.kind === 'start-next') {
      set({ activeRankSession: nextSession });
      return nextAction;
    }

    // 赛事结束：回写 rankProgress
    const outcome = nextAction.kind; // 'promoted' | 'eliminated'
    writeRankProgress(prev => {
      const nextHistory = [
        ...prev.history,
        {
          targetTier: nextSession.targetTier,
          outcome,
          startedAt: nextSession.startedAt,
          endedAt: nextSession.endedAt ?? Date.now(),
        },
      ];
      const nextCurrentTier =
        outcome === 'promoted' ? (nextSession.targetTier as RankTier) : prev.currentTier;
      return {
        ...prev,
        currentTier: nextCurrentTier,
        history: nextHistory,
        activeSessionId: undefined,
      };
    });

    set({ activeRankSession: nextSession });
    return nextAction;
  },

  _setActiveRankSession: (s) => set({ activeRankSession: s }),
}));
