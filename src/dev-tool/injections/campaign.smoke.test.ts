// F3 · campaign 注入冒烟：complete-all 后任一题型 campaignCompleted

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { repository, setStorageNamespace } from '@/repository/local';
import { useUserStore, useGameProgressStore } from '@/store';
import { isCampaignFullyCompleted } from '@/constants/campaign';
import { campaignInjections } from './campaign';
import type { User } from '@/types';
import type { GameProgress } from '@/types/gamification';

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
    id: 'u-camp',
    nickname: 'Camp',
    avatarSeed: 's',
    createdAt: 0,
    settings: { soundEnabled: true, hapticsEnabled: true },
  };
}

function emptyGp(userId: string): GameProgress {
  return {
    userId,
    campaignProgress: {},
    advanceProgress: {},
    rankProgress: { currentTier: 'apprentice', history: [] },
    wrongQuestions: [],
    totalQuestionsAttempted: 0,
    totalQuestionsCorrect: 0,
  };
}

describe('campaignInjections · smoke', () => {
  beforeEach(() => {
    installLocalStorageMock();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    localStorage.clear();
    setStorageNamespace('main');
    repository.init();
    const u = makeUser();
    repository.saveUser(u);
    repository.saveGameProgress(emptyGp(u.id));
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

  it('campaign.complete-all：mental-arithmetic 全关通关标记与 campaignCompleted 一致', async () => {
    const inj = campaignInjections.find(i => i.id === 'campaign.complete-all');
    expect(inj).toBeDefined();
    await inj!.run();
    const gp = useGameProgressStore.getState().gameProgress;
    expect(gp).not.toBeNull();
    const topic = gp!.campaignProgress['mental-arithmetic'];
    expect(topic).toBeDefined();
    const completedIds = new Set(topic!.completedLevels.map(l => l.levelId));
    expect(isCampaignFullyCompleted('mental-arithmetic', completedIds)).toBe(true);
    expect(topic!.campaignCompleted).toBe(true);
  });
});
