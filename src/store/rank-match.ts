// src/store/rank-match.ts
// 段位赛 store · Phase 3 M1 → M2 遗留补做（ISSUE-060）
//
// 职责：
//   - activeRankSession：当前进行中的 BO 赛事
//   - startRankMatch(targetTier)：入场校验 → 创建 RankMatchSession → 回写 rankProgress.activeSessionId
//     + 立即落盘至 mq_rank_match_sessions（ISSUE-060）
//   - handleGameFinished(practiceSessionSnapshot)：推进状态机 + 同步 rankProgress + 每次落盘
//   - loadActiveRankMatch(userId)：启动时从存档恢复活跃赛事（ISSUE-060 / Plan §4.1）
//
// 明确不做：
//   - 不调用抽题器（由 useSessionStore.startRankMatchGame 负责）
//   - 不恢复 PracticeSession 层（由 useSessionStore.resumeRankMatchGame 负责）
//   - 不承接 UI 路由跳转

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

/**
 * 段位赛"刷新恢复"一致性异常（ISSUE-060 / Spec §5.8）。
 * 任一数据不一致（存档缺失 / 状态冲突 / queue 损坏等）都走此异常——不允许静默降级。
 * 抛错时 store 层已清 rankProgress.activeSessionId + activeRankSession，
 * UI 捕获后应路由回 RankMatchHub。
 */
export class RankMatchRecoveryError extends Error {
  readonly reason: string;

  constructor(message: string, reason: string) {
    super(message);
    this.name = 'RankMatchRecoveryError';
    this.reason = reason;
  }
}

export interface RankMatchStore {
  activeRankSession: RankMatchSession | null;

  /**
   * 开始挑战目标段位。
   * - 未满足入场星级 → 抛 Error（由 match-state.createRankMatchSession 抛出）
   * - 已有进行中赛事 → 抛 Error，禁止并存
   * - 成功后回写 rankProgress.activeSessionId 并将 session 落盘至 mq_rank_match_sessions
   */
  startRankMatch: (
    targetTier: ChallengeableTier,
    opts?: StartRankMatchOptions,
  ) => RankMatchSession;

  /**
   * 单局结束回调。
   * 根据 PracticeSession 快照推导该局胜负（won = completed && heartsRemaining >= 1），
   * 执行状态机并返回 nextAction 供调用方决定 UI 路由。
   * - 每次调用都将最新 RankMatchSession 落盘（ISSUE-060）
   * - 若赛事结束 → 同步 rankProgress.history / currentTier / activeSessionId
   */
  handleGameFinished: (practiceSessionSnapshot: PracticeSession) => GameFinishedNextAction;

  /**
   * 启动时从 mq_rank_match_sessions 恢复活跃赛事（ISSUE-060 / Plan §4.1）。
   * - rankProgress.activeSessionId 缺失 / 存档不存在 / userId 不匹配 / outcome 已出
   *   → 视为无可恢复赛事，清 activeSessionId 返回 null（不抛异常——启动路径应安静）
   * - 成功 → 写入 activeRankSession 并返回该 session
   *
   * 注意：本方法只恢复"BO 赛事层"。对"正在作答的 PracticeSession"的恢复由
   * useSessionStore.resumeRankMatchGame 承担；两层拆开便于 UI 分步路由。
   */
  loadActiveRankMatch: (userId: string) => RankMatchSession | null;

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

    // ISSUE-060：立即落盘，保证刷新后可恢复
    repository.saveRankMatchSession(session);

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
      // ISSUE-060：每一局结束都把最新 session 落盘（BO 中间态）
      // 注：不在这里 push 下一局 placeholder；由 session 层 `startRankMatchGame`
      // 在 UI 触发"开始下一局"时按需 inflate（见 store/index.ts），
      // 这样 `getCurrentGameIndex(nextSession) === undefined` 仍成立，
      // 刷新恢复时 Hub 能正确走"局间 / GameResult"分支。
      repository.saveRankMatchSession(nextSession);
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

    // ISSUE-060：赛事结束也落盘（完整终态包含 outcome/endedAt，供 analytics 或二次恢复路径读取）
    repository.saveRankMatchSession(nextSession);

    set({ activeRankSession: nextSession });
    return nextAction;
  },

  loadActiveRankMatch: (userId) => {
    const gp = useGameProgressStore.getState().gameProgress;
    const activeSessionId = gp?.rankProgress?.activeSessionId;
    if (!activeSessionId) {
      return null;
    }

    const clearActiveId = (): void => {
      writeRankProgress(prev => ({ ...prev, activeSessionId: undefined }));
      set({ activeRankSession: null });
    };

    const stored = repository.getRankMatchSession(activeSessionId);
    if (!stored) {
      // 一致性异常：activeSessionId 指向的存档不存在。
      // 启动路径下视为"无可恢复"并清 id，不抛错（Spec §5.8 允许启动路径安静收尾）。
      clearActiveId();
      return null;
    }
    if (stored.userId !== userId) {
      clearActiveId();
      return null;
    }
    if (stored.outcome) {
      // BO 已出结果但 activeSessionId 残留（可能是 handleGameFinished 写盘后未清 id 的遗留/崩溃）
      clearActiveId();
      return null;
    }

    set({ activeRankSession: stored });
    return stored;
  },

  _setActiveRankSession: (s) => set({ activeRankSession: s }),
}));

// E2E 测试钩子：仅在浏览器 DEV 环境暴露 store，供 Playwright / DevTools 读写活跃赛事
if (import.meta.env.DEV && typeof window !== 'undefined') {
  (window as any).__MQ_RANK_MATCH__ = useRankMatchStore;
}
