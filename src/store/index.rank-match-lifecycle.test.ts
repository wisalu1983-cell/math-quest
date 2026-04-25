import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useSessionStore, useUserStore, useGameProgressStore } from './index';
import { useRankMatchStore } from './rank-match';
import type { GameProgress, AdvanceProgress, TopicAdvanceProgress } from '@/types/gamification';
import type { User, TopicId } from '@/types';
import { repository } from '@/repository/local';

function installLocalStorageMock(): void {
  const store = new Map<string, string>();
  const mock = {
    getItem: (k: string) => (store.has(k) ? (store.get(k) as string) : null),
    setItem: (k: string, v: string) => { store.set(k, v); },
    removeItem: (k: string) => { store.delete(k); },
    clear: () => { store.clear(); },
    key: (i: number) => Array.from(store.keys())[i] ?? null,
    get length() { return store.size; },
  };
  (globalThis as Record<string, unknown>).localStorage = mock;
}

function makeAdvance(map: Partial<Record<TopicId, number>>): AdvanceProgress {
  const ap: AdvanceProgress = {};
  for (const [topic, hearts] of Object.entries(map) as Array<[TopicId, number]>) {
    const entry: TopicAdvanceProgress = {
      topicId: topic,
      heartsAccumulated: hearts,
      sessionsPlayed: 0,
      sessionsWhite: 0,
      unlockedAt: 0,
    };
    ap[topic] = entry;
  }
  return ap;
}

function rookieAdvance(): AdvanceProgress {
  return makeAdvance({
    'mental-arithmetic': 6,
    'number-sense': 6,
    'vertical-calc': 6,
    'multi-step': 6,
  });
}

function makeUser(): User {
  return {
    id: 'u1',
    nickname: 't',
    avatarSeed: 's',
    createdAt: 0,
    settings: { soundEnabled: true, hapticsEnabled: true },
  };
}

function makeGP(advance: AdvanceProgress): GameProgress {
  return {
    userId: 'u1',
    campaignProgress: {},
    advanceProgress: advance,
    rankProgress: { currentTier: 'apprentice', history: [] },
    wrongQuestions: [],
    totalQuestionsAttempted: 0,
    totalQuestionsCorrect: 0,
  };
}

function resetAllStores(gp: GameProgress): void {
  useUserStore.setState({ user: makeUser() });
  useGameProgressStore.setState({ gameProgress: gp });
  useRankMatchStore.setState({ activeRankSession: null, startedInThisSession: new Set() });
  useSessionStore.setState({
    active: false,
    session: null,
    currentQuestion: null,
    currentIndex: 0,
    totalQuestions: 0,
    hearts: 3,
    questionStartTime: 0,
    showFeedback: false,
    lastAnswerCorrect: false,
    lastTrainingFieldMistakes: [],
    pendingWrongQuestions: [],
    rankQuestionQueue: [],
    lastRankMatchAction: null,
  });
}

beforeEach(() => {
  installLocalStorageMock();
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  resetAllStores(makeGP(rookieAdvance()));
});

describe('SessionStore 段位赛中断/取消生命周期', () => {
  it('suspendRankMatchSession 会保存当前 PracticeSession，清空内存态，并把 RankMatchSession 标为 suspended', () => {
    const rank = useRankMatchStore.getState().startRankMatch('rookie');
    useSessionStore.getState().startRankMatchGame(rank.id, 1);
    const sessionId = useSessionStore.getState().session!.id;

    (useSessionStore.getState() as any).suspendRankMatchSession();

    expect(useSessionStore.getState().session).toBeNull();
    expect(useSessionStore.getState().active).toBe(false);
    expect(useRankMatchStore.getState().activeRankSession?.status).toBe('suspended');
    expect(repository.getSessions().find(s => s.id === sessionId)).toBeDefined();
  });

  it('cancelRankMatchSession 会清空当前 BO，并允许同段位重新 startRankMatch', () => {
    const rank = useRankMatchStore.getState().startRankMatch('rookie');
    useSessionStore.getState().startRankMatchGame(rank.id, 1);

    (useSessionStore.getState() as any).cancelRankMatchSession();

    expect(useSessionStore.getState().session).toBeNull();
    expect(useRankMatchStore.getState().activeRankSession).toBeNull();
    expect(useGameProgressStore.getState().gameProgress?.rankProgress?.activeSessionId).toBeUndefined();
    expect(repository.getRankMatchSession(rank.id)?.status).toBe('cancelled');

    const restarted = useRankMatchStore.getState().startRankMatch('rookie');
    expect(restarted.id).not.toBe(rank.id);
    expect(restarted.status).toBe('active');
  });
});
