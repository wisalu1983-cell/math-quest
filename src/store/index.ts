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

  startCampaignSession: (topicId: TopicId, levelId: string) => void;
  startAdvanceSession: (topicId: TopicId) => void;
  nextQuestion: () => void;
  submitAnswer: (answer: string, options?: SubmitAnswerOptions) => SubmitAnswerResult;
  endSession: () => PracticeSession;
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
    const { session, currentIndex, totalQuestions } = get();
    if (!session || currentIndex >= totalQuestions) return;

    let difficulty: number;
    let subtypeFilter: string[] | undefined;

    if (session.sessionMode === 'advance' && session.advanceSlots) {
      // 进阶：按预生成槽位取 difficulty 和单一子题型
      const slot = session.advanceSlots[currentIndex];
      difficulty = slot?.difficulty ?? session.difficulty;
      subtypeFilter = slot ? [slot.subtypeTag] : undefined;
    } else {
      // 闯关：固定 difficulty，按路线 subtypeFilter
      difficulty = session.difficulty;
      subtypeFilter = session.targetLevelId
        ? getSubtypeFilter(session.topicId, session.targetLevelId)
        : undefined;
    }

    const question = generateQuestion(session.topicId, difficulty, subtypeFilter);

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
      // 进阶结算：hearts 即为 heartsEarned（0~3）
      gpStore.recordAdvanceSession(completedSession.topicId, hearts);
    }

    for (const wq of pendingWrongQuestions) {
      gpStore.addWrongQuestion(wq);
    }

    set({
      active: false,
      session: null,
      currentQuestion: null,
      showFeedback: false,
      lastTrainingFieldMistakes: [],
      pendingWrongQuestions: [],
    });

    return completedSession;
  },

  abandonSession: () => {
    const { session, hearts, pendingWrongQuestions } = get();

    // 保存错题（无论哪种模式）
    if (pendingWrongQuestions.length > 0) {
      const gpStore = useGameProgressStore.getState();
      for (const wq of pendingWrongQuestions) {
        gpStore.addWrongQuestion(wq);
      }
    }

    // 保存中止历史
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
    | 'session-detail';
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
}
