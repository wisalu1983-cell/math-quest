// src/store/index.ts
import { create } from 'zustand';
import type {
  User,
  TopicId,
  PracticeSession,
  Question,
  QuestionAttempt,
  WrongQuestion,
  TrainingField,
  TrainingFieldMistake,
} from '@/types';
import { repository } from '@/repository/local';
import { useGameProgressStore } from './gamification';
import { nanoid } from 'nanoid';
import { generateQuestion } from '@/engine';
import { CAMPAIGN_MAX_HEARTS } from '@/constants';
import { getCampaignLevel, getSubtypeFilter } from '@/constants/campaign';
import { buildAdvanceSlots } from '@/engine/advance';
import { ADVANCE_QUESTION_COUNT } from '@/constants/advance';
import {
  isNumericEqual,
  isMultiChoiceEqual,
  isMultiBlankEqual,
  isExpressionEquivalent,
  isEquationEquivalent,
  isTrivialSolution,
  hasAnyBracket,
  hasBracketAndEquivalent,
} from '@/engine/answerValidation';
import { pickQuestionsForGame } from '@/engine/rank-match/question-picker';
import { RANK_QUESTIONS_PER_GAME } from '@/constants/rank-match';
import { useRankMatchStore, RankMatchRecoveryError } from './rank-match';
import type { GameFinishedNextAction } from '@/engine/rank-match/match-state';
import { startNextGame as rankStartNextGame } from '@/engine/rank-match/match-state';

interface SubmitAnswerOptions {
  trainingValues?: string[];
}

interface SubmitAnswerResult {
  correct: boolean;
  trainingFieldMistakes: TrainingFieldMistake[];
}

function getTrainingFields(question: Question): TrainingField[] {
  if (
    question.type !== 'numeric-input' ||
    question.difficulty < 6 ||
    question.difficulty > 7 ||
    question.data == null ||
    !('trainingFields' in question.data)
  ) {
    return [];
  }

  return question.data.trainingFields ?? [];
}

function collectTrainingFieldMistakes(
  question: Question,
  trainingValues?: string[],
): TrainingFieldMistake[] {
  const fields = getTrainingFields(question);
  if (fields.length === 0 || !trainingValues || trainingValues.length === 0) {
    return [];
  }

  return fields.flatMap((field, index) => {
    const userValue = trainingValues[index]?.trim() ?? '';
    if (!userValue || userValue === field.answer) {
      return [];
    }

    return [{
      label: field.label,
      userValue,
      expectedValue: field.answer,
    }];
  });
}

function rebuildPendingWrongQuestions(session: PracticeSession): WrongQuestion[] {
  return session.questions
    .filter(attempt => !attempt.correct)
    .map(attempt => ({
      question: attempt.question,
      wrongAnswer: attempt.userAnswer,
      wrongAt: attempt.attemptedAt,
    }));
}

// ─── User Store ───
interface UserStore {
  user: User | null;
  setUser: (user: User) => void;
  loadUser: () => void;
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  setUser: (user) => {
    repository.saveUser(user);
    set({ user });
  },
  loadUser: () => {
    const user = repository.getUser();
    set({ user });
  },
}));

// ─── Session Store ───
interface SessionStore {
  active: boolean;
  session: PracticeSession | null;
  currentQuestion: Question | null;  currentIndex: number;
  totalQuestions: number;
  hearts: number;
  questionStartTime: number;
  showFeedback: boolean;
  lastAnswerCorrect: boolean;
  lastTrainingFieldMistakes: TrainingFieldMistake[];
  pendingWrongQuestions: WrongQuestion[];
  /** 段位赛预生成题序（由 startRankMatchGame 填充，nextQuestion 按 currentIndex 取） */
  rankQuestionQueue: Question[];
  /** 段位赛单局结束后的下一步行动（endSession 的 rank-match 分支写入，UI 据此决定路由） */
  lastRankMatchAction: GameFinishedNextAction | null;

  startCampaignSession: (topicId: TopicId, levelId: string) => void;
  startAdvanceSession: (topicId: TopicId) => void;
  /**
   * 启动段位赛单局。前置：useRankMatchStore.activeRankSession 存在且 rankSessionId 匹配。
   * - 调 pickQuestionsForGame 预生成本局 20~30 道题
   * - 构造 PracticeSession（topicId=primaryTopics[0] 为兼容占位，语义主题走 rankMatchMeta.primaryTopics）
   * - 复用 RankMatchGame.practiceSessionId 作为 session.id（Spec §3.3 避免双写）
   */
  startRankMatchGame: (rankSessionId: string, gameIndex: number) => void;
  /**
   * 段位赛单局中途刷新恢复（ISSUE-060 / Spec §5.8 / Plan §4.1）。
   * 前置：useRankMatchStore.activeRankSession 已由 loadActiveRankMatch 恢复。
   *
   * 从 mq_sessions 读 PracticeSession，按以下步骤重建 SessionStore 内存态：
   *   1) PracticeSession 存在、未 completed、rankMatchMeta 与 activeRankSession 一致
   *   2) rankQuestionQueue 存在、长度 = RANK_QUESTIONS_PER_GAME[targetTier]
   *   3) questions.length <= queue.length
   *   4) 以 currentIndex = questions.length, hearts = heartsRemaining 重建，
   *      currentQuestion = queue[currentIndex]（若 currentIndex < queue.length）
   *
   * 任一项不满足 → 抛 RankMatchRecoveryError，同时清 rankProgress.activeSessionId
   * 与 activeRankSession（Spec §5.8 明文禁止静默降级）。
   */
  resumeRankMatchGame: (practiceSessionId: string) => void;
  nextQuestion: () => void;
  submitAnswer: (answer: string, options?: SubmitAnswerOptions) => SubmitAnswerResult;
  endSession: () => PracticeSession;
  suspendRankMatchSession: () => void;
  cancelRankMatchSession: () => void;
  abandonSession: () => void;
}

export const useSessionStore = create<SessionStore>((set, get) => ({
  active: false,
  session: null,
  currentQuestion: null,
  currentIndex: 0,
  totalQuestions: 0,
  hearts: CAMPAIGN_MAX_HEARTS,
  questionStartTime: 0,
  showFeedback: false,
  lastAnswerCorrect: false,
  lastTrainingFieldMistakes: [],
  pendingWrongQuestions: [],
  rankQuestionQueue: [],
  lastRankMatchAction: null,

  startCampaignSession: (topicId, levelId) => {
    const user = useUserStore.getState().user;
    if (!user) return;

    const levelDef = getCampaignLevel(topicId, levelId);
    if (!levelDef) return;

    const session: PracticeSession = {
      id: nanoid(10),
      userId: user.id,
      topicId,
      startedAt: Date.now(),
      difficulty: levelDef.difficulty,
      sessionMode: 'campaign',
      targetLevelId: levelId,
      questions: [],
      heartsRemaining: CAMPAIGN_MAX_HEARTS,
      completed: false,
    };

    set({
      active: true,
      session,
      currentIndex: 0,
      totalQuestions: levelDef.questionCount,
      hearts: CAMPAIGN_MAX_HEARTS,
      showFeedback: false,
      lastTrainingFieldMistakes: [],
      pendingWrongQuestions: [],
    });

    get().nextQuestion();
  },

  startRankMatchGame: (rankSessionId, gameIndex) => {
    const user = useUserStore.getState().user;
    if (!user) throw new Error('Cannot start rank match game: user not loaded');

    let rankSession = useRankMatchStore.getState().activeRankSession;
    if (!rankSession) throw new Error('Cannot start rank match game: no active rank match session');
    if (rankSession.id !== rankSessionId) {
      throw new Error('Cannot start rank match game: rankSessionId mismatch');
    }

    const gp = useGameProgressStore.getState().gameProgress;
    if (!gp) throw new Error('Cannot start rank match game: game progress not loaded');

    // M4 修复：若 UI 在"开始下一局"时传入 games.length + 1 的 gameIndex，
    // 且当前 session 无 outcome，则按需 inflate 一个 placeholder。
    // rank-match store 的 handleGameFinished 不会自动 push 下一局，
    // 以保持 `getCurrentGameIndex` 的"局间 undefined" 语义（刷新恢复依赖此约定）。
    let targetGame = rankSession.games.find(g => g.gameIndex === gameIndex);
    if (!targetGame && !rankSession.outcome && gameIndex === rankSession.games.length + 1) {
      const inflated = rankStartNextGame({
        session: rankSession,
        practiceSessionId: nanoid(),
      });
      useRankMatchStore.getState()._setActiveRankSession(inflated);
      repository.saveRankMatchSession(inflated);
      rankSession = inflated;
      targetGame = inflated.games.find(g => g.gameIndex === gameIndex);
    }
    if (!targetGame) {
      throw new Error(`Cannot start rank match game: gameIndex ${gameIndex} not found`);
    }
    if (targetGame.finished) {
      throw new Error(`Cannot start rank match game: gameIndex ${gameIndex} already finished`);
    }

    const { questions, primaryTopics } = pickQuestionsForGame({
      session: rankSession,
      gameIndex,
      advanceProgress: gp.advanceProgress,
      // ISSUE-061：把累积错题喂给抽题器，驱动复习桶按 §5.6 错题频次加权
      wrongQuestions: gp.wrongQuestions,
    });

    const session: PracticeSession = {
      id: targetGame.practiceSessionId,
      userId: user.id,
      topicId: primaryTopics[0],
      startedAt: Date.now(),
      difficulty: questions[0]?.difficulty ?? 0,
      sessionMode: 'rank-match',
      targetLevelId: null,
      questions: [],
      heartsRemaining: CAMPAIGN_MAX_HEARTS,
      completed: false,
      rankMatchMeta: {
        rankSessionId: rankSession.id,
        gameIndex,
        targetTier: rankSession.targetTier,
        primaryTopics,
      },
      // ISSUE-060：把整局题序写进 session，随 mq_sessions 持久化；刷新后可按 questions.length 指针恢复
      rankQuestionQueue: questions,
    };

    // ISSUE-060：启动瞬间就落盘，保证即使用户刚开局立刻刷新也能恢复
    repository.saveSession(session);

    set({
      active: true,
      session,
      currentIndex: 0,
      totalQuestions: RANK_QUESTIONS_PER_GAME[rankSession.targetTier],
      hearts: CAMPAIGN_MAX_HEARTS,
      showFeedback: false,
      lastTrainingFieldMistakes: [],
      pendingWrongQuestions: [],
      rankQuestionQueue: questions,
      lastRankMatchAction: null,
    });

    get().nextQuestion();
  },

  resumeRankMatchGame: (practiceSessionId) => {
    const user = useUserStore.getState().user;
    if (!user) throw new RankMatchRecoveryError('User not loaded', 'no-user');

    const clearAndThrow = (reason: string, message: string): never => {
      // Spec §5.8：一致性异常 → 清活跃赛事，UI 层回 Hub
      const gp = useGameProgressStore.getState().gameProgress;
      if (gp?.rankProgress) {
        const updated = {
          ...gp,
          rankProgress: { ...gp.rankProgress, activeSessionId: undefined },
        };
        repository.saveGameProgress(updated);
        useGameProgressStore.setState({ gameProgress: updated });
      }
      useRankMatchStore.getState()._setActiveRankSession(null);
      throw new RankMatchRecoveryError(message, reason);
    };

    const rankSession = useRankMatchStore.getState().activeRankSession;
    if (!rankSession) {
      return clearAndThrow(
        'no-active-rank-session',
        'Cannot resume rank match game: no active rank match session',
      );
    }

    const stored = repository.getSessions().find(s => s.id === practiceSessionId);
    if (!stored) {
      return clearAndThrow(
        'practice-session-not-found',
        `Cannot resume rank match game: PracticeSession ${practiceSessionId} not found`,
      );
    }
    if (stored.completed) {
      return clearAndThrow(
        'practice-session-already-completed',
        `Cannot resume rank match game: PracticeSession ${practiceSessionId} already completed`,
      );
    }
    if (!stored.rankMatchMeta) {
      return clearAndThrow(
        'missing-rank-match-meta',
        'Cannot resume rank match game: PracticeSession missing rankMatchMeta',
      );
    }
    if (stored.rankMatchMeta.rankSessionId !== rankSession.id) {
      return clearAndThrow(
        'rank-session-id-mismatch',
        'Cannot resume rank match game: rankSessionId mismatch',
      );
    }
    if (!stored.rankQuestionQueue || stored.rankQuestionQueue.length === 0) {
      return clearAndThrow(
        'missing-rank-question-queue',
        'Cannot resume rank match game: rankQuestionQueue missing or empty',
      );
    }

    const expectedLen = RANK_QUESTIONS_PER_GAME[rankSession.targetTier];
    if (stored.rankQuestionQueue.length !== expectedLen) {
      return clearAndThrow(
        'rank-question-queue-length-mismatch',
        `Cannot resume rank match game: queue length ${stored.rankQuestionQueue.length} != ${expectedLen}`,
      );
    }
    if (stored.questions.length > stored.rankQuestionQueue.length) {
      return clearAndThrow(
        'answered-exceeds-queue',
        'Cannot resume rank match game: answered count exceeds queue length',
      );
    }

    const currentIndex = stored.questions.length;
    const nextQ = currentIndex < stored.rankQuestionQueue.length
      ? stored.rankQuestionQueue[currentIndex]
      : null;
    const restoredPendingWrongQuestions = rebuildPendingWrongQuestions(stored);

    set({
      active: true,
      session: stored,
      currentIndex,
      totalQuestions: expectedLen,
      hearts: stored.heartsRemaining,
      questionStartTime: Date.now(),
      showFeedback: false,
      lastAnswerCorrect: false,
      lastTrainingFieldMistakes: [],
      pendingWrongQuestions: restoredPendingWrongQuestions,
      rankQuestionQueue: stored.rankQuestionQueue,
      currentQuestion: nextQ,
      lastRankMatchAction: null,
    });
  },

  startAdvanceSession: (topicId) => {
    const user = useUserStore.getState().user;
    if (!user) return;

    const gp = useGameProgressStore.getState().gameProgress;
    const heartsAccumulated = gp?.advanceProgress[topicId]?.heartsAccumulated ?? 0;
    const slots = buildAdvanceSlots(topicId, heartsAccumulated);

    const session: PracticeSession = {
      id: nanoid(10),
      userId: user.id,
      topicId,
      startedAt: Date.now(),
      difficulty: slots[0]?.difficulty ?? 4,
      sessionMode: 'advance',
      targetLevelId: null,
      questions: [],
      heartsRemaining: CAMPAIGN_MAX_HEARTS,
      completed: false,
      advanceSlots: slots,
    };

    set({
      active: true,
      session,
      currentIndex: 0,
      totalQuestions: ADVANCE_QUESTION_COUNT,
      hearts: CAMPAIGN_MAX_HEARTS,
      showFeedback: false,
      lastTrainingFieldMistakes: [],
      pendingWrongQuestions: [],
    });

    get().nextQuestion();
  },

  nextQuestion: () => {
    const { session, currentIndex, totalQuestions, rankQuestionQueue } = get();
    if (!session || currentIndex >= totalQuestions) return;

    let question: Question;

    if (session.sessionMode === 'rank-match') {
      // 段位赛：从 startRankMatchGame 预生成的 queue 取题，不再调 generateQuestion
      const preGenerated = rankQuestionQueue[currentIndex];
      if (!preGenerated) return;
      question = preGenerated;
    } else {
      let difficulty: number;
      let subtypeFilter: string[] | undefined;

      if (session.sessionMode === 'advance' && session.advanceSlots) {
        const slot = session.advanceSlots[currentIndex];
        difficulty = slot?.difficulty ?? session.difficulty;
        subtypeFilter = slot ? [slot.subtypeTag] : undefined;
      } else {
        difficulty = session.difficulty;
        subtypeFilter = session.targetLevelId
          ? getSubtypeFilter(session.topicId, session.targetLevelId)
          : undefined;
      }

      question = generateQuestion(session.topicId, difficulty, subtypeFilter);
    }

    set({
      currentQuestion: question,
      questionStartTime: Date.now(),
      showFeedback: false,
      lastTrainingFieldMistakes: [],
    });
  },

  submitAnswer: (answer, options) => {
    const { currentQuestion, questionStartTime, session, currentIndex, hearts } = get();
    if (!currentQuestion || !session) {
      return { correct: false, trainingFieldMistakes: [] };
    }

    const timeMs = Date.now() - questionStartTime;
    const correctAnswer = String(currentQuestion.solution.answer);

    let correct = false;
    const qData = currentQuestion.data;
    const solution = currentQuestion.solution;

    // 1. 估算题：acceptedAnswers 数组判定
    if (qData.kind === 'number-sense' && qData.subtype === 'estimate' && qData.acceptedAnswers) {
      const userNum = parseFloat(answer);
      correct = !isNaN(userNum) && qData.acceptedAnswers.includes(userNum);
    }
    // 2. 多选题：集合相等
    else if (currentQuestion.type === 'multi-select' && solution.answers) {
      correct = isMultiChoiceEqual(answer, solution.answers);
    }
    // 3. 多步填空：答案以 '|' 分隔，逐项比较
    else if (currentQuestion.type === 'multi-blank' && solution.blanks) {
      const parts = answer.split('|').map(s => s.trim());
      correct = isMultiBlankEqual(parts, solution.blanks);
    }
    // 4. 填写表达式（A06 去括号 / 添括号 / A07 简便变形）
    else if (currentQuestion.type === 'expression-input' && solution.standardExpression) {
      const policy = solution.bracketPolicy ?? 'none';
      if (policy === 'must-not-have' && hasAnyBracket(answer)) {
        correct = false;
      } else if (policy === 'must-have') {
        correct = hasBracketAndEquivalent(answer, solution.standardExpression);
      } else {
        correct = isExpressionEquivalent(answer, solution.standardExpression);
      }
    }
    // 5. 填写等式（A08 方程移项）
    else if (currentQuestion.type === 'equation-input' && solution.standardExpression) {
      const variable = solution.variable ?? 'x';
      if (isTrivialSolution(answer, variable)) {
        correct = false;
      } else {
        correct = isEquationEquivalent(answer, solution.standardExpression, variable);
      }
    }
    // 6. 其它（numeric-input, multiple-choice, vertical-fill）：字符串归一化比较
    else {
      correct = isNumericEqual(answer, correctAnswer);
    }

    const trainingFieldMistakes = correct
      ? collectTrainingFieldMistakes(currentQuestion, options?.trainingValues)
      : [];

    const attempt: QuestionAttempt = {
      questionId: currentQuestion.id,
      question: currentQuestion,
      userAnswer: answer,
      correct,
      timeMs,
      hintsUsed: 0,
      attemptedAt: Date.now(),
    };

    const newHearts = correct ? hearts : hearts - 1;

    const updatedSession = {
      ...session,
      questions: [...session.questions, attempt],
      heartsRemaining: newHearts,
    };

    useGameProgressStore.getState().recordAttempt(correct);

    // ISSUE-060：段位赛每答一题就增量落盘，保证中途刷新可恢复
    if (updatedSession.sessionMode === 'rank-match') {
      repository.saveSession(updatedSession);
    }

    set({
      session: updatedSession,
      hearts: newHearts,
      showFeedback: true,
      lastAnswerCorrect: correct,
      lastTrainingFieldMistakes: trainingFieldMistakes,
      currentIndex: currentIndex + 1,
    });

    if (!correct) {
      const wq: WrongQuestion = {
        question: currentQuestion,
        wrongAnswer: answer,
        wrongAt: Date.now(),
      };
      set(s => ({ pendingWrongQuestions: [...s.pendingWrongQuestions, wq] }));
    }

    return { correct, trainingFieldMistakes };
  },

  endSession: () => {
    const { session, hearts, pendingWrongQuestions } = get();
    if (!session) throw new Error('No active session');

    const completedSession: PracticeSession = {
      ...session,
      endedAt: Date.now(),
      heartsRemaining: hearts,
      completed: true,
    };

    repository.saveSession(completedSession);

    const gpStore = useGameProgressStore.getState();

    if (completedSession.sessionMode === 'campaign') {
      if (hearts > 0 && completedSession.targetLevelId) {
        gpStore.recordLevelCompletion(
          completedSession.topicId,
          completedSession.targetLevelId,
          hearts
        );
      }
    } else if (completedSession.sessionMode === 'advance') {
      gpStore.recordAdvanceSession(completedSession.topicId, hearts);
    }

    for (const wq of pendingWrongQuestions) {
      gpStore.addWrongQuestion(wq);
    }

    // 段位赛分支：把本局结果回写到 RankMatchSession 并拿到下一步行动
    // Plan §M2 原文说 "submitAnswer 钩子"，实施时按职责分层落地到 endSession：
    //   - submitAnswer 只管逐题记录，不承担 session 结束职责
    //   - endSession 是现有"本局结束"的唯一入口，在此派发 rank-match 分支更贴现有架构
    //   - 两处语义等价，实际触发时机都是"答完或心归零"那一刻
    let rankMatchAction: GameFinishedNextAction | null = null;
    if (completedSession.sessionMode === 'rank-match' && completedSession.rankMatchMeta) {
      rankMatchAction = useRankMatchStore.getState().handleGameFinished(completedSession);
    }

    set({
      active: false,
      session: null,
      currentQuestion: null,
      showFeedback: false,
      lastTrainingFieldMistakes: [],
      pendingWrongQuestions: [],
      rankQuestionQueue: [],
      lastRankMatchAction: rankMatchAction,
    });

    return completedSession;
  },

  suspendRankMatchSession: () => {
    const { session, hearts } = get();
    if (!session || session.sessionMode !== 'rank-match') return;

    repository.saveSession({
      ...session,
      heartsRemaining: hearts,
    });
    useRankMatchStore.getState().suspendActiveMatch();

    set({
      active: false,
      session: null,
      currentQuestion: null,
      currentIndex: 0,
      hearts: CAMPAIGN_MAX_HEARTS,
      showFeedback: false,
      lastAnswerCorrect: false,
      lastTrainingFieldMistakes: [],
      pendingWrongQuestions: [],
      rankQuestionQueue: [],
      lastRankMatchAction: null,
    });
  },

  cancelRankMatchSession: () => {
    const { session, hearts, pendingWrongQuestions } = get();
    if (!session || session.sessionMode !== 'rank-match') return;

    if (pendingWrongQuestions.length > 0) {
      const gpStore = useGameProgressStore.getState();
      for (const wq of pendingWrongQuestions) {
        gpStore.addWrongQuestion(wq);
      }
    }

    repository.saveSession({
      ...session,
      endedAt: Date.now(),
      heartsRemaining: hearts,
      completed: false,
    });
    useRankMatchStore.getState().cancelActiveMatch();

    set({
      active: false,
      session: null,
      currentQuestion: null,
      currentIndex: 0,
      hearts: CAMPAIGN_MAX_HEARTS,
      showFeedback: false,
      lastAnswerCorrect: false,
      lastTrainingFieldMistakes: [],
      pendingWrongQuestions: [],
      rankQuestionQueue: [],
      lastRankMatchAction: null,
    });
  },

  abandonSession: () => {
    const { session, hearts, pendingWrongQuestions } = get();

    if (pendingWrongQuestions.length > 0) {
      const gpStore = useGameProgressStore.getState();
      for (const wq of pendingWrongQuestions) {
        gpStore.addWrongQuestion(wq);
      }
    }

    if (session) {
      repository.saveSession({
        ...session,
        endedAt: Date.now(),
        heartsRemaining: hearts,
        completed: false,
      });
    }

    set({
      active: false,
      session: null,
      currentQuestion: null,
      currentIndex: 0,
      hearts: CAMPAIGN_MAX_HEARTS,
      showFeedback: false,
      lastAnswerCorrect: false,
      lastTrainingFieldMistakes: [],
      pendingWrongQuestions: [],
      rankQuestionQueue: [],
      lastRankMatchAction: null,
    });
  },
}));

// ─── UI Store ───
interface UIStore {
  currentPage:
    | 'onboarding'
    | 'home'
    | 'campaign-map'
    | 'advance-select'
    | 'practice'
    | 'summary'
    | 'progress'
    | 'profile'
    | 'wrong-book'
    | 'history'
    | 'session-detail'
    | 'rank-match-hub'
    | 'rank-match-game-result'
    | 'rank-match-result';
  setPage: (page: UIStore['currentPage']) => void;
  selectedTopicId: TopicId | null;
  setSelectedTopicId: (id: TopicId | null) => void;
  lastSession: PracticeSession | null;
  setLastSession: (s: PracticeSession | null) => void;
  viewingSessionId: string | null;
  setViewingSessionId: (id: string | null) => void;
  soundEnabled: boolean;
  toggleSound: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  currentPage: 'onboarding',
  setPage: (page) => set({ currentPage: page }),
  selectedTopicId: null,
  setSelectedTopicId: (id) => set({ selectedTopicId: id }),
  lastSession: null,
  setLastSession: (s) => set({ lastSession: s }),
  viewingSessionId: null,
  setViewingSessionId: (id) => set({ viewingSessionId: id }),
  soundEnabled: true,
  toggleSound: () => set(s => ({ soundEnabled: !s.soundEnabled })),
}));

// 让其他文件可从 store/index 直接导入 useGameProgressStore
export { useGameProgressStore } from './gamification';

// E2E 测试钩子：仅在浏览器 DEV 环境暴露 store，供 Playwright 读取当前题目的正确答案
if (import.meta.env.DEV && typeof window !== 'undefined') {
  (window as any).__MQ_SESSION__ = useSessionStore;
  (window as any).__MQ_GAME_PROGRESS__ = useGameProgressStore;
  (window as any).__MQ_UI__ = useUIStore;
}
