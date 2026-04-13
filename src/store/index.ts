// src/store/index.ts
import { create } from 'zustand';
import type { User, TopicId, PracticeSession, Question, QuestionAttempt, WrongQuestion } from '@/types';
import { repository } from '@/repository/local';
import { useGameProgressStore } from './gamification';
import { nanoid } from 'nanoid';
import { generateQuestion } from '@/engine';
import { CAMPAIGN_MAX_HEARTS } from '@/constants';
import { getCampaignLevel } from '@/constants/campaign';

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
  currentQuestion: Question | null;
  currentIndex: number;
  totalQuestions: number;
  hearts: number;
  questionStartTime: number;
  showFeedback: boolean;
  lastAnswerCorrect: boolean;
  pendingWrongQuestions: WrongQuestion[];

  startCampaignSession: (topicId: TopicId, levelId: string) => void;
  nextQuestion: () => void;
  submitAnswer: (answer: string) => { correct: boolean };
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
      pendingWrongQuestions: [],
    });

    get().nextQuestion();
  },

  nextQuestion: () => {
    const { session, currentIndex, totalQuestions } = get();
    if (!session || currentIndex >= totalQuestions) return;

    const question = generateQuestion(session.topicId, session.difficulty);

    set({
      currentQuestion: question,
      questionStartTime: Date.now(),
      showFeedback: false,
    });
  },

  submitAnswer: (answer) => {
    const { currentQuestion, questionStartTime, session, currentIndex, hearts } = get();
    if (!currentQuestion || !session) return { correct: false };

    const timeMs = Date.now() - questionStartTime;
    const correctAnswer = String(currentQuestion.solution.answer);

    const normalize = (s: string) => {
      let r = s.trim().replace(/\s+/g, '').replace(/\u2026/g, '...');
      if (r.includes('.')) {
        r = r.replace(/0+$/, '').replace(/\.$/, '');
      }
      return r;
    };

    let correct: boolean;
    const qData = currentQuestion.data;
    if (qData.kind === 'number-sense' && qData.subtype === 'estimate' && qData.acceptedAnswers) {
      const userNum = parseFloat(answer);
      correct = !isNaN(userNum) && qData.acceptedAnswers.includes(userNum);
    } else {
      correct = normalize(answer) === normalize(correctAnswer);
    }

    const attempt: QuestionAttempt = {
      questionId: currentQuestion.id,
      question: currentQuestion,
      userAnswer: answer,
      correct,
      timeMs,
      hintsUsed: 0,
      attemptedAt: Date.now(),
    };

    const updatedSession = {
      ...session,
      questions: [...session.questions, attempt],
    };

    const newHearts = correct ? hearts : hearts - 1;

    useGameProgressStore.getState().recordAttempt(correct);

    set({
      session: updatedSession,
      hearts: newHearts,
      showFeedback: true,
      lastAnswerCorrect: correct,
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

    return { correct };
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

    if (hearts > 0 && completedSession.targetLevelId && completedSession.sessionMode === 'campaign') {
      useGameProgressStore.getState().recordLevelCompletion(
        completedSession.topicId,
        completedSession.targetLevelId,
        hearts
      );
    }

    const gpStore = useGameProgressStore.getState();
    for (const wq of pendingWrongQuestions) {
      gpStore.addWrongQuestion(wq);
    }

    set({
      active: false,
      session: null,
      currentQuestion: null,
      showFeedback: false,
      pendingWrongQuestions: [],
    });

    return completedSession;
  },

  abandonSession: () => {
    set({
      active: false,
      session: null,
      currentQuestion: null,
      currentIndex: 0,
      hearts: CAMPAIGN_MAX_HEARTS,
      showFeedback: false,
      lastAnswerCorrect: false,
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
