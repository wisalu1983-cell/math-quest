// src/engine/rank-match/match-state.ts
// 段位赛 BO 赛事生命周期状态机 · 纯函数（Spec 2026-04-18 §7.2 / §7.4）
//
// 设计要点：
//   - 不依赖 store / repository，所有状态转换都是"输入旧 session → 输出新 session"
//   - 不冗余 currentGameIndex：活跃局由 getCurrentGameIndex 从 games 派生（Spec §3.4）
//   - 不冗余答题明细：RankMatchGame 只记 practiceSessionId；对错/心数等一律反查 PracticeSession（Spec §3.3）
//   - BO 提前结束是强制规则：一旦落后方翻盘数学上不可能即立即 eliminated，不得生成下一局（Spec §7.4）

import { nanoid } from 'nanoid';
import type {
  AdvanceProgress,
  RankMatchGame,
  RankMatchSession,
  RankTier,
} from '@/types/gamification';
import { isTierUnlocked } from './entry-gate';
import {
  RANK_BEST_OF,
  RANK_WINS_TO_ADVANCE,
  type ChallengeableTier,
} from '@/constants/rank-match';

/**
 * 从 games 数组派生当前活跃局号（1-based）。
 * - 已有 outcome → 无活跃局
 * - 最后一局未 finished → 该局即活跃局
 * - 最后一局已 finished 但尚未生成下一局 → 无活跃局（调用方应立即 startNextGame 或判定结束）
 */
export function getCurrentGameIndex(session: RankMatchSession): number | undefined {
  if (session.outcome) return undefined;
  const last = session.games[session.games.length - 1];
  if (last && !last.finished) return last.gameIndex;
  return undefined;
}

export interface CreateRankMatchSessionParams {
  userId: string;
  targetTier: ChallengeableTier;
  advanceProgress: AdvanceProgress;
  /** 第 1 局对应的 PracticeSession.id（调用方预先生成） */
  firstPracticeSessionId: string;
  /** 注入时间戳，方便单测；缺省走 Date.now() */
  now?: number;
  /** 注入 id 生成器，方便单测；缺省走 nanoid(10) */
  makeId?: () => string;
}

/**
 * 创建一个新的 BO 赛事。
 * 入场校验强制调用 entry-gate.isTierUnlocked；未解锁即抛错，不得绕过（Spec §7.1）。
 */
export function createRankMatchSession(params: CreateRankMatchSessionParams): RankMatchSession {
  const { userId, targetTier, advanceProgress, firstPracticeSessionId } = params;
  if (!isTierUnlocked(targetTier, advanceProgress)) {
    throw new Error(`Tier "${targetTier}" is not unlocked for this user`);
  }
  const now = params.now ?? Date.now();
  const makeId = params.makeId ?? (() => nanoid(10));

  const firstGame: RankMatchGame = {
    gameIndex: 1,
    finished: false,
    practiceSessionId: firstPracticeSessionId,
    startedAt: now,
  };

  return {
    id: makeId(),
    userId,
    targetTier,
    bestOf: RANK_BEST_OF[targetTier],
    winsToAdvance: RANK_WINS_TO_ADVANCE[targetTier],
    games: [firstGame],
    status: 'active',
    startedAt: now,
  };
}

export interface StartNextGameParams {
  session: RankMatchSession;
  practiceSessionId: string;
  now?: number;
}

/**
 * 在现有 session 后追加一局。
 * 要求：上一局必须已 finished，且 session 未出 outcome。
 */
export function startNextGame(params: StartNextGameParams): RankMatchSession {
  const { session, practiceSessionId } = params;
  if (session.outcome) {
    throw new Error('Cannot start next game: session already has outcome');
  }
  const last = session.games[session.games.length - 1];
  if (last && !last.finished) {
    throw new Error('Cannot start next game: previous game not finished');
  }
  if (session.games.length >= session.bestOf) {
    throw new Error('Cannot start next game: BO limit reached');
  }
  const now = params.now ?? Date.now();
  const nextGame: RankMatchGame = {
    gameIndex: session.games.length + 1,
    finished: false,
    practiceSessionId,
    startedAt: now,
  };
  return { ...session, games: [...session.games, nextGame] };
}

export interface OnGameFinishedParams {
  session: RankMatchSession;
  gameIndex: number;
  won: boolean;
  now?: number;
}

/**
 * 下一步行动：
 *  - start-next：应调用 startNextGame 开下一局
 *  - promoted：赛事晋级结束
 *  - eliminated：赛事淘汰结束（含 BO 提前结束）
 */
export type GameFinishedNextAction =
  | { kind: 'start-next' }
  | { kind: 'promoted' }
  | { kind: 'eliminated' };

export interface GameFinishedResult {
  session: RankMatchSession;
  nextAction: GameFinishedNextAction;
}

/**
 * 单局结束处理。
 *
 * 强制规则（Spec §7.4）：
 *   - totalWins ≥ winsToAdvance         → outcome = 'promoted'
 *   - remainingGames < requiredMoreWins → outcome = 'eliminated'（BO 提前结束）
 *   - 其它                              → 等待 startNextGame
 *
 * 严禁：已达提前结束条件后仍生成下一局。
 */
export function onGameFinished(params: OnGameFinishedParams): GameFinishedResult {
  const { session, gameIndex, won } = params;
  if (session.outcome) {
    throw new Error('Cannot finish game: session already has outcome');
  }

  const targetIdx = session.games.findIndex(g => g.gameIndex === gameIndex);
  if (targetIdx < 0) {
    throw new Error(`Game ${gameIndex} not found in session`);
  }
  if (session.games[targetIdx].finished) {
    throw new Error(`Game ${gameIndex} already finished`);
  }

  const now = params.now ?? Date.now();
  const finishedGame: RankMatchGame = {
    ...session.games[targetIdx],
    finished: true,
    won,
    endedAt: now,
  };
  const games = session.games.map((g, i) => (i === targetIdx ? finishedGame : g));

  const totalWins = games.filter(g => g.finished && g.won).length;
  const remainingGames = session.bestOf - games.length;
  const requiredMoreWins = session.winsToAdvance - totalWins;

  if (totalWins >= session.winsToAdvance) {
    return {
      session: { ...session, games, status: 'completed', outcome: 'promoted', endedAt: now },
      nextAction: { kind: 'promoted' },
    };
  }
  if (remainingGames < requiredMoreWins) {
    return {
      session: { ...session, games, status: 'completed', outcome: 'eliminated', endedAt: now },
      nextAction: { kind: 'eliminated' },
    };
  }
  return {
    session: { ...session, games },
    nextAction: { kind: 'start-next' },
  };
}

/** 供 RankTier 窄化后的辅助断言（类型层） */
export function assertChallengeable(tier: RankTier): asserts tier is ChallengeableTier {
  if (tier === 'apprentice') {
    throw new Error('Apprentice tier has no rank match; cannot be challenged');
  }
}
