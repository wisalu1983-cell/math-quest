// F3 · advance 注入：封顶心数反推 + clear.all

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { repository, setStorageNamespace } from '@/repository/local';
import { useUserStore, useGameProgressStore } from '@/store';
import { TOPIC_STAR_CAP, STAR_THRESHOLDS_3, STAR_THRESHOLDS_5 } from '@/constants/advance';
import { advanceInjections } from './advance';
import type { User } from '@/types';
import type { GameProgress, TopicAdvanceProgress } from '@/types/gamification';
import type { TopicId } from '@/types';

function installLocalStorageMock(): void {
  const store = new Map<string, string>();
  const mock = {
    getItem: (k: string) => (store.has(k) ? (store.get(k) as string) : null),
    setItem: (k: string, v: string) => {
      store.set(k, v);
    },
    removeItem: (k: string) => {
      store.delete(k);
    },
    clear: () => {
      store.clear();
    },
    key: (i: number) => Array.from(store.keys())[i] ?? null,
    get length() {
      return store.size;
    },
  };
  (globalThis as Record<string, unknown>).localStorage = mock;
}

function makeUser(): User {
  return {
    id: 'u-adv',
    nickname: 'Adv',
    avatarSeed: 's',
    createdAt: 0,
    settings: { soundEnabled: true, hapticsEnabled: true },
  };
}

function heartsAtCap(topicId: TopicId): number {
  const cap = TOPIC_STAR_CAP[topicId];
  const thresholds = cap === 3 ? STAR_THRESHOLDS_3 : STAR_THRESHOLDS_5;
  return thresholds[cap - 1];
}

function seedProgress(topics: Partial<Record<TopicId, number>>): GameProgress {
  const advanceProgress: Record<string, TopicAdvanceProgress> = {};
  const now = Date.now();
  for (const [topicId, hearts] of Object.entries(topics) as Array<[TopicId, number]>) {
    advanceProgress[topicId] = {
      topicId,
      heartsAccumulated: hearts,
      sessionsPlayed: 1,
      sessionsWhite: 0,
      unlockedAt: now,
    };
  }
  return {
    userId: 'u-adv',
    campaignProgress: {},
    advanceProgress,
    rankProgress: { currentTier: 'apprentice', history: [] },
    wrongQuestions: [],
    totalQuestionsAttempted: 0,
    totalQuestionsCorrect: 0,
  };
}

describe('advanceInjections', () => {
  beforeEach(() => {
    installLocalStorageMock();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    localStorage.clear();
    setStorageNamespace('main');
    repository.init();
    const u = makeUser();
    repository.saveUser(u);
    repository.saveGameProgress(seedProgress({ 'mental-arithmetic': 0, 'number-sense': 6 }));
    useUserStore.setState({ user: u });
    useGameProgressStore.getState().loadGameProgress(u.id);
  });

  afterEach(() => {
    localStorage.clear();
    setStorageNamespace('main');
    repository.init();
    useUserStore.setState({ user: null });
    useGameProgressStore.setState({ gameProgress: null });
    vi.restoreAllMocks();
  });

  it('advance.max.mental-arithmetic：heartsAccumulated 对齐 cap★ 门槛', async () => {
    const inj = advanceInjections.find(i => i.id === 'advance.max.mental-arithmetic');
    expect(inj).toBeDefined();
    await inj!.run();
    const hearts = useGameProgressStore.getState().gameProgress?.advanceProgress['mental-arithmetic']?.heartsAccumulated;
    expect(hearts).toBe(heartsAtCap('mental-arithmetic'));
  });

  it('advance.clear.all：所有题型 heartsAccumulated 归零（保留 unlock 条目）', async () => {
    const inj = advanceInjections.find(i => i.id === 'advance.clear.all');
    expect(inj).toBeDefined();
    await inj!.run();
    const gp = useGameProgressStore.getState().gameProgress;
    expect(gp).not.toBeNull();
    for (const v of Object.values(gp!.advanceProgress)) {
      expect(v.heartsAccumulated).toBe(0);
      expect(v.sessionsPlayed).toBe(0);
      expect(v.sessionsWhite).toBe(0);
    }
  });
});
