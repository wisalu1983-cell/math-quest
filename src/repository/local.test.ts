// src/repository/local.test.ts
// ISSUE-057 闯关结构重构后的存档迁移（策略 X）单测
// + Phase 3 M1：v2→v3 迁移链 + 项目级存档升级原则（Spec 2026-04-18 §6.3）

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  migrateCampaignIfNeeded,
  migrateRankProgressIfNeeded,
  migrateV2ToV3,
  migrateV3ToV4,
  repository,
  setStorageNamespace,
  getStorageNamespace,
} from './local';
import type { GameProgress } from '@/types/gamification';
import { CAMPAIGN_MAPS, getAllLevelIds } from '@/constants/campaign';

// ─── localStorage mock（node vitest 环境默认无 DOM） ───

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

function emptyProgress(): GameProgress {
  return {
    userId: 'u1',
    campaignProgress: {},
    advanceProgress: {},
    wrongQuestions: [],
    totalQuestionsAttempted: 0,
    totalQuestionsCorrect: 0,
  };
}

describe('migrateCampaignIfNeeded（策略 X）', () => {
  it('空存档：不触发迁移，原对象返回', () => {
    const gp = emptyProgress();
    const result = migrateCampaignIfNeeded(gp);
    expect(result).toBe(gp); // 引用相等
  });

  it('全新结构存档：不触发迁移（幂等）', () => {
    const gp = emptyProgress();
    const newIds = getAllLevelIds('mental-arithmetic').slice(0, 3);
    gp.campaignProgress['mental-arithmetic'] = {
      topicId: 'mental-arithmetic',
      completedLevels: newIds.map(levelId => ({
        levelId,
        bestHearts: 3,
        completedAt: 1700000000000,
      })),
      campaignCompleted: false,
    };
    const result = migrateCampaignIfNeeded(gp);
    expect(result).toBe(gp);
    expect(result.campaignProgress['mental-arithmetic']!.completedLevels.length).toBe(3);
  });

  it('含旧 levelId + 旧 Boss 已通：新结构全关满星', () => {
    const gp = emptyProgress();
    gp.campaignProgress['mental-arithmetic'] = {
      topicId: 'mental-arithmetic',
      completedLevels: [
        { levelId: 'mental-arithmetic-S1-LA-L1', bestHearts: 2, completedAt: 1 }, // 新结构也有
        { levelId: 'mental-arithmetic-S4-LA-L1', bestHearts: 3, completedAt: 2 }, // 旧 Boss，新结构无
      ],
      campaignCompleted: true,
    };

    const result = migrateCampaignIfNeeded(gp);
    expect(result).not.toBe(gp); // 触发迁移

    const migrated = result.campaignProgress['mental-arithmetic']!;
    const allIds = getAllLevelIds('mental-arithmetic');
    expect(migrated.completedLevels.length).toBe(allIds.length); // 全关都在
    expect(migrated.completedLevels.every(l => l.bestHearts === 3)).toBe(true); // 全满星
    expect(migrated.campaignCompleted).toBe(true);
  });

  it('含旧 levelId + 旧 Boss 未通：丢弃孤儿记录，保留新结构内有效项', () => {
    const gp = emptyProgress();
    gp.campaignProgress['operation-laws'] = {
      topicId: 'operation-laws',
      completedLevels: [
        { levelId: 'operation-laws-S1-LA-L1', bestHearts: 3, completedAt: 1 }, // 新结构有
        { levelId: 'operation-laws-S2-LA-L1', bestHearts: 2, completedAt: 2 }, // 新结构有（d=6）
        { levelId: 'operation-laws-S3-OLD-L1', bestHearts: 1, completedAt: 3 }, // 旧结构 S3 已移除
        { levelId: 'operation-laws-S4-LA-L1', bestHearts: 0, completedAt: 4 }, // 旧 Boss
      ],
      campaignCompleted: false,
    };

    const result = migrateCampaignIfNeeded(gp);
    const migrated = result.campaignProgress['operation-laws']!;
    const validIds = new Set(getAllLevelIds('operation-laws'));

    // 所有保留的 level 都在新结构内
    expect(migrated.completedLevels.every(l => validIds.has(l.levelId))).toBe(true);
    // 有效项的 bestHearts 保留原值
    const s1LaL1 = migrated.completedLevels.find(l => l.levelId === 'operation-laws-S1-LA-L1');
    expect(s1LaL1?.bestHearts).toBe(3);
    // 未通不应变成已通
    expect(migrated.campaignCompleted).toBe(false);
  });

  it('多题型同时迁移：每个题型独立判断', () => {
    const gp = emptyProgress();
    // A01 已通
    gp.campaignProgress['mental-arithmetic'] = {
      topicId: 'mental-arithmetic',
      completedLevels: [
        { levelId: 'mental-arithmetic-S4-LA-L1', bestHearts: 3, completedAt: 1 },
      ],
      campaignCompleted: true,
    };
    // A04 未通，有孤儿
    gp.campaignProgress['operation-laws'] = {
      topicId: 'operation-laws',
      completedLevels: [
        { levelId: 'operation-laws-S3-NUKED-L1', bestHearts: 2, completedAt: 2 },
      ],
      campaignCompleted: false,
    };

    const result = migrateCampaignIfNeeded(gp);

    // A01：全关满星
    const a01 = result.campaignProgress['mental-arithmetic']!;
    expect(a01.completedLevels.length).toBe(getAllLevelIds('mental-arithmetic').length);
    expect(a01.campaignCompleted).toBe(true);

    // A04：孤儿清空
    const a04 = result.campaignProgress['operation-laws']!;
    expect(a04.completedLevels.length).toBe(0);
    expect(a04.campaignCompleted).toBe(false);
  });

  it('迁移后再跑一次：幂等（不再触发）', () => {
    const gp = emptyProgress();
    gp.campaignProgress['mental-arithmetic'] = {
      topicId: 'mental-arithmetic',
      completedLevels: [
        { levelId: 'mental-arithmetic-S4-LA-L1', bestHearts: 3, completedAt: 1 }, // 旧 Boss
      ],
      campaignCompleted: true,
    };

    const once = migrateCampaignIfNeeded(gp);
    const twice = migrateCampaignIfNeeded(once);

    expect(twice).toBe(once); // 引用相等 = 没触发迁移
  });

  it('8 题型 getAllLevelIds 总数 = 85（C1档内梯度规范化后总关卡数）', () => {
    // 防回归：8 题型各自关卡数总和
    // A01:9 + A02:15 + A03:11 + A04:7 + A05:12 + A06:9 + A07:13 + A08:9 = 85
    // C1变更: A01减2(S1-LA-L2+S2-LA-L2), A03/A04/A06各减1
    let total = 0;
    for (const topicId of Object.keys(CAMPAIGN_MAPS)) {
      total += getAllLevelIds(topicId).length;
    }
    expect(total).toBe(85);
  });
});

// ─── Phase 3 M1：v2→v3 迁移链 ───

describe('migrateRankProgressIfNeeded（v2→v3 · Phase 3 M1）', () => {
  it('旧存档无 rankProgress → 补默认 apprentice + 空 history', () => {
    const gp = emptyProgress();
    const result = migrateRankProgressIfNeeded(gp);
    expect(result).not.toBe(gp); // 触发迁移
    expect(result.rankProgress).toEqual({ currentTier: 'apprentice', history: [] });
  });

  it('已有 rankProgress → 幂等，引用相等', () => {
    const gp: GameProgress = {
      ...emptyProgress(),
      rankProgress: { currentTier: 'rookie', history: [], activeSessionId: 'rs1' },
    };
    const result = migrateRankProgressIfNeeded(gp);
    expect(result).toBe(gp);
  });

  it('migrateV2ToV3 等价于 migrateRankProgressIfNeeded', () => {
    expect(migrateV2ToV3).toBe(migrateRankProgressIfNeeded);
  });
});

describe('migrateV3ToV4（v0.3 Phase 1）', () => {
  it('v3→v4 当前不改 GameProgress 结构，返回原引用', () => {
    const gp: GameProgress = {
      ...emptyProgress(),
      rankProgress: { currentTier: 'rookie', history: [] },
    };

    expect(migrateV3ToV4(gp)).toBe(gp);
  });
});

// ─── Phase 3 M1：repository.init 迁移链 + 备份（项目级原则） ───

describe('repository.init · 项目级存档升级原则（Spec §6.3）', () => {
  beforeEach(() => {
    installLocalStorageMock();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('全新用户（无任何 key）→ 写入当前版本号，不触发备份', () => {
    repository.init();
    expect(localStorage.getItem('mq_version')).toBe('4');
    const keys: string[] = [];
    for (let i = 0; i < (localStorage as unknown as { length: number }).length; i++) {
      const k = localStorage.key(i);
      if (k) keys.push(k);
    }
    expect(keys.some(k => k.startsWith('mq_backup_'))).toBe(false);
  });

  it('v2 存档 + 有 gameProgress → 自动迁移到 v4，rankProgress 补默认值', () => {
    const v2Gp: GameProgress = {
      userId: 'u1',
      campaignProgress: {},
      advanceProgress: {},
      wrongQuestions: [],
      totalQuestionsAttempted: 10,
      totalQuestionsCorrect: 8,
    };
    localStorage.setItem('mq_version', '2');
    localStorage.setItem('mq_game_progress', JSON.stringify(v2Gp));

    repository.init();

    expect(localStorage.getItem('mq_version')).toBe('4');
    const stored = JSON.parse(localStorage.getItem('mq_game_progress') ?? '{}') as GameProgress;
    expect(stored.rankProgress).toEqual({ currentTier: 'apprentice', history: [] });
    expect(stored.totalQuestionsAttempted).toBe(10); // 原数据保留
    expect(stored.totalQuestionsCorrect).toBe(8);
  });

  it('v3 存档 + 有 gameProgress → 自动迁移到 v4，不改已有数据', () => {
    const v3Gp: GameProgress = {
      userId: 'u1',
      campaignProgress: {},
      advanceProgress: {},
      rankProgress: { currentTier: 'rookie', history: [] },
      wrongQuestions: [],
      totalQuestionsAttempted: 0,
      totalQuestionsCorrect: 0,
    };
    localStorage.setItem('mq_version', '3');
    localStorage.setItem('mq_game_progress', JSON.stringify(v3Gp));

    repository.init();

    expect(localStorage.getItem('mq_version')).toBe('4');
    const stored = JSON.parse(localStorage.getItem('mq_game_progress') ?? '{}') as GameProgress;
    expect(stored.rankProgress).toEqual({ currentTier: 'rookie', history: [] });
  });

  it('v4 存档 → noop（幂等）', () => {
    const v4Gp: GameProgress = {
      userId: 'u1',
      campaignProgress: {},
      advanceProgress: {},
      rankProgress: { currentTier: 'rookie', history: [] },
      wrongQuestions: [],
      totalQuestionsAttempted: 0,
      totalQuestionsCorrect: 0,
    };
    localStorage.setItem('mq_version', '4');
    localStorage.setItem('mq_game_progress', JSON.stringify(v4Gp));

    repository.init();

    const stored = JSON.parse(localStorage.getItem('mq_game_progress') ?? '{}') as GameProgress;
    expect(localStorage.getItem('mq_version')).toBe('4');
    expect(stored.rankProgress).toEqual({ currentTier: 'rookie', history: [] });
  });

  it('未知更老版本（v1）→ 走备份路径，不 clearAll（严禁静默擦除）', () => {
    const oldGp = {
      userId: 'u1',
      someOldField: 'legacy',
      advanceProgress: {},
    };
    localStorage.setItem('mq_version', '1');
    localStorage.setItem('mq_game_progress', JSON.stringify(oldGp));
    localStorage.setItem('mq_user', JSON.stringify({ id: 'u1', nickname: 'x', avatarSeed: 's', createdAt: 0, settings: { soundEnabled: true, hapticsEnabled: true } }));
    localStorage.setItem('mq_sessions', JSON.stringify([{ fake: 'session' }]));

    repository.init();

    // 版本更新到当前版本
    expect(localStorage.getItem('mq_version')).toBe('4');

    // 旧 gameProgress 落到备份 key
    const backupKeys: string[] = [];
    const len = (localStorage as unknown as { length: number }).length;
    for (let i = 0; i < len; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('mq_backup_v1_')) backupKeys.push(k);
    }
    expect(backupKeys).toHaveLength(1);
    expect(JSON.parse(localStorage.getItem(backupKeys[0]) ?? '{}')).toMatchObject({ someOldField: 'legacy' });

    // 原 gameProgress 被清掉（走新存档路径）
    expect(localStorage.getItem('mq_game_progress')).toBeNull();

    // 但 user / sessions 未被 clearAll：项目级原则要求只做"gameProgress 备份 + 新起"
    expect(localStorage.getItem('mq_user')).not.toBeNull();
    expect(localStorage.getItem('mq_sessions')).not.toBeNull();
  });

  it('v2 存档但没有 gameProgress（极少数：手动 removeItem 过）→ 仅升级版本号', () => {
    localStorage.setItem('mq_version', '2');

    repository.init();

    expect(localStorage.getItem('mq_version')).toBe('4');
    expect(localStorage.getItem('mq_game_progress')).toBeNull();
    // 无备份生成
    const len = (localStorage as unknown as { length: number }).length;
    const keys: string[] = [];
    for (let i = 0; i < len; i++) {
      const k = localStorage.key(i);
      if (k) keys.push(k);
    }
    expect(keys.some(k => k.startsWith('mq_backup_'))).toBe(false);
  });
});

// ─── Phase 3 M1：repository.getGameProgress 默认 rankProgress ───

describe('repository.getGameProgress · 默认 rankProgress（Phase 3 M1）', () => {
  beforeEach(() => {
    installLocalStorageMock();
  });

  it('不存在的 userId → 返回带默认 apprentice rankProgress 的空进度', () => {
    const gp = repository.getGameProgress('new-user');
    expect(gp.rankProgress).toEqual({ currentTier: 'apprentice', history: [] });
  });

  it('已存在的 v2 存档（无 rankProgress）→ 读取时自动补默认值并回写', () => {
    const v2Gp = {
      userId: 'u1',
      campaignProgress: {},
      advanceProgress: {},
      wrongQuestions: [],
      totalQuestionsAttempted: 0,
      totalQuestionsCorrect: 0,
    };
    localStorage.setItem('mq_game_progress', JSON.stringify(v2Gp));

    const gp = repository.getGameProgress('u1');
    expect(gp.rankProgress).toEqual({ currentTier: 'apprentice', history: [] });

    const reread = JSON.parse(localStorage.getItem('mq_game_progress') ?? '{}') as GameProgress;
    expect(reread.rankProgress).toEqual({ currentTier: 'apprentice', history: [] });
  });
});

describe('repository 历史记录（v0.2-5-1）', () => {
  beforeEach(() => {
    installLocalStorageMock();
    setStorageNamespace('main');
  });

  afterEach(() => {
    setStorageNamespace('main');
  });

  it('新账号无记录 → getHistory 返回 []', () => {
    const historyRepo = repository as unknown as {
      getHistory?: () => unknown[];
    };

    expect(typeof historyRepo.getHistory).toBe('function');
    expect(historyRepo.getHistory?.()).toEqual([]);
  });

  it('saveHistoryRecord 追加写入 mq_history，保留时间顺序', () => {
    const historyRepo = repository as unknown as {
      getHistory?: () => Array<{ id: string; result: string }>;
      saveHistoryRecord?: (record: unknown) => void;
    };

    expect(typeof historyRepo.saveHistoryRecord).toBe('function');

    historyRepo.saveHistoryRecord?.({
      id: 'h-1',
      userId: 'u1',
      sessionMode: 'campaign',
      startedAt: 1000,
      endedAt: 2000,
      completed: true,
      result: 'win',
      topicId: 'mental-arithmetic',
      questions: [],
    });
    historyRepo.saveHistoryRecord?.({
      id: 'h-2',
      userId: 'u1',
      sessionMode: 'advance',
      startedAt: 3000,
      endedAt: 4000,
      completed: true,
      result: 'lose',
      topicId: 'number-sense',
      questions: [],
    });

    expect(historyRepo.getHistory?.()).toEqual([
      expect.objectContaining({ id: 'h-1', result: 'win' }),
      expect.objectContaining({ id: 'h-2', result: 'lose' }),
    ]);
    expect(localStorage.getItem('mq_history')).not.toBeNull();
  });
});

// ─── Phase 3 M1：clearAll 作为显式用户操作保留 ───

describe('repository.clearAll · 仅作为显式用户操作保留（Spec §6.3）', () => {
  beforeEach(() => {
    installLocalStorageMock();
  });

  it('显式调用 clearAll → 清掉 user/gameProgress/sessions/legacy mq_progress', () => {
    localStorage.setItem('mq_user', 'u');
    localStorage.setItem('mq_game_progress', 'gp');
    localStorage.setItem('mq_sessions', 'ss');
    localStorage.setItem('mq_history', 'hh');
    localStorage.setItem('mq_progress', 'legacy');
    localStorage.setItem('mq_version', '3');

    repository.clearAll();

    expect(localStorage.getItem('mq_user')).toBeNull();
    expect(localStorage.getItem('mq_game_progress')).toBeNull();
    expect(localStorage.getItem('mq_sessions')).toBeNull();
    expect(localStorage.getItem('mq_history')).toBeNull();
    expect(localStorage.getItem('mq_progress')).toBeNull();
    // version 自身保留（显式清数据不等于回滚版本号）
    expect(localStorage.getItem('mq_version')).toBe('3');
  });
});

// ─── ISSUE-060 补做：RankMatchSession 持久化 ───

import type { RankMatchSession } from '@/types/gamification';

function makeRankSession(id: string, userId = 'u1'): RankMatchSession {
  return {
    id,
    userId,
    targetTier: 'rookie',
    bestOf: 3,
    winsToAdvance: 2,
    games: [
      { gameIndex: 1, finished: false, practiceSessionId: 'ps-1', startedAt: 1000 },
    ],
    startedAt: 1000,
    status: 'active',
  } as RankMatchSession;
}

describe('repository.saveRankMatchSession / getRankMatchSession（ISSUE-060 M2 遗留补做）', () => {
  beforeEach(() => {
    installLocalStorageMock();
  });

  it('saveRankMatchSession 后 getRankMatchSession(id) 能读回完整对象', () => {
    const s = makeRankSession('rs-a');
    repository.saveRankMatchSession(s);
    expect(repository.getRankMatchSession('rs-a')).toEqual(s);
  });

  it('不存在的 id → getRankMatchSession 返回 null', () => {
    expect(repository.getRankMatchSession('not-exist')).toBeNull();
  });

  it('同 id 二次保存覆盖旧值（upsert 语义）', () => {
    const s1 = makeRankSession('rs-b');
    repository.saveRankMatchSession(s1);
    const s2: RankMatchSession = {
      ...s1,
      games: [
        { gameIndex: 1, finished: true, won: true, practiceSessionId: 'ps-1', startedAt: 1000, endedAt: 2000 },
      ],
    };
    repository.saveRankMatchSession(s2);
    const got = repository.getRankMatchSession('rs-b');
    expect(got?.games[0]).toMatchObject({ finished: true, won: true });
  });

  it('多条记录共存：getRankMatchSession 按 id 精确命中', () => {
    repository.saveRankMatchSession(makeRankSession('rs-x', 'u1'));
    repository.saveRankMatchSession(makeRankSession('rs-y', 'u2'));
    expect(repository.getRankMatchSession('rs-x')?.userId).toBe('u1');
    expect(repository.getRankMatchSession('rs-y')?.userId).toBe('u2');
  });

  it('deleteRankMatchSession 按 id 删除；不影响其他 id', () => {
    repository.saveRankMatchSession(makeRankSession('rs-k', 'u1'));
    repository.saveRankMatchSession(makeRankSession('rs-l', 'u1'));
    repository.deleteRankMatchSession('rs-k');
    expect(repository.getRankMatchSession('rs-k')).toBeNull();
    expect(repository.getRankMatchSession('rs-l')).not.toBeNull();
  });

  it('走独立 key mq_rank_match_sessions，不与 mq_sessions 混存', () => {
    repository.saveRankMatchSession(makeRankSession('rs-m'));
    expect(localStorage.getItem('mq_rank_match_sessions')).not.toBeNull();
    expect(localStorage.getItem('mq_sessions')).toBeNull();
  });
});

// ─── v0.2-1-1 · F3 开发者工具栏：Storage Namespace 切换 ───

describe('Storage Namespace（F3 · v0.2-1-1）', () => {
  beforeEach(() => {
    installLocalStorageMock();
    setStorageNamespace('main'); // 保险起见：每条用例前显式归位
  });

  afterEach(() => {
    setStorageNamespace('main'); // 避免串用例
  });

  it('默认 namespace=main，key 前缀为 mq_', () => {
    expect(getStorageNamespace()).toBe('main');
    repository.saveUser({ id: 'u1', nickname: 'Alice', avatarSeed: 's', createdAt: 0, settings: { soundEnabled: true, hapticsEnabled: true } });
    expect(localStorage.getItem('mq_user')).not.toBeNull();
    expect(localStorage.getItem('mq_dev_user')).toBeNull();
  });

  it('切到 dev 后，key 构造为 mq_dev_*', () => {
    setStorageNamespace('dev');
    expect(getStorageNamespace()).toBe('dev');
    repository.saveUser({ id: 'u1', nickname: 'DevAlice', avatarSeed: 's', createdAt: 0, settings: { soundEnabled: true, hapticsEnabled: true } });
    expect(localStorage.getItem('mq_dev_user')).not.toBeNull();
    expect(localStorage.getItem('mq_user')).toBeNull();
  });

  it('切回 main 读取的仍是原来的 mq_* 数据（不互相覆盖）', () => {
    // main 写入
    repository.saveUser({ id: 'u-main', nickname: 'Main', avatarSeed: 'm', createdAt: 0, settings: { soundEnabled: true, hapticsEnabled: true } });
    // 切 dev，写入不同数据
    setStorageNamespace('dev');
    repository.saveUser({ id: 'u-dev', nickname: 'Dev', avatarSeed: 'd', createdAt: 0, settings: { soundEnabled: true, hapticsEnabled: true } });
    // 切回 main
    setStorageNamespace('main');
    expect(repository.getUser()?.nickname).toBe('Main');
    // dev 数据仍然独立存在
    setStorageNamespace('dev');
    expect(repository.getUser()?.nickname).toBe('Dev');
  });

  it('saveUser / getUser 保留 supabaseId 字段', () => {
    repository.saveUser({
      id: 'u-supabase',
      nickname: 'Alice',
      avatarSeed: 'seed',
      createdAt: 0,
      supabaseId: 'sb-user-1',
      settings: { soundEnabled: true, hapticsEnabled: true },
    });

    expect(repository.getUser()?.supabaseId).toBe('sb-user-1');
  });

  it('dev namespace 下 repository.init 独立跑一次，不影响 mq_version', () => {
    localStorage.setItem('mq_version', '4');
    setStorageNamespace('dev');
    repository.init();
    expect(localStorage.getItem('mq_dev_version')).toBe('4');
    expect(localStorage.getItem('mq_version')).toBe('4'); // main 侧不变
  });

  it('dev 模式 clearAll 只清 mq_dev_*，不跨删 mq_*', () => {
    // main 侧数据
    localStorage.setItem('mq_user', 'main-user');
    localStorage.setItem('mq_game_progress', 'main-gp');
    localStorage.setItem('mq_progress', 'legacy');
    // dev 侧数据
    setStorageNamespace('dev');
    localStorage.setItem('mq_dev_user', 'dev-user');
    localStorage.setItem('mq_dev_sessions', 'dev-ss');
    localStorage.setItem('mq_dev_rank_match_sessions', 'dev-rm');
    localStorage.setItem('mq_dev_history', 'dev-history');

    repository.clearAll();

    expect(localStorage.getItem('mq_dev_user')).toBeNull();
    expect(localStorage.getItem('mq_dev_sessions')).toBeNull();
    expect(localStorage.getItem('mq_dev_rank_match_sessions')).toBeNull();
    expect(localStorage.getItem('mq_dev_history')).toBeNull();
    // main 侧完整保留
    expect(localStorage.getItem('mq_user')).toBe('main-user');
    expect(localStorage.getItem('mq_game_progress')).toBe('main-gp');
    expect(localStorage.getItem('mq_progress')).toBe('legacy');
  });

  it('main 模式 clearAll 不跨删 mq_dev_*', () => {
    localStorage.setItem('mq_user', 'u');
    localStorage.setItem('mq_dev_user', 'dev-u');
    localStorage.setItem('mq_dev_game_progress', 'dev-gp');

    repository.clearAll();

    expect(localStorage.getItem('mq_user')).toBeNull();
    expect(localStorage.getItem('mq_dev_user')).toBe('dev-u');
    expect(localStorage.getItem('mq_dev_game_progress')).toBe('dev-gp');
  });
});

describe('repository.getRankMatchSessions · 旧 rank-match 存档归一化', () => {
  beforeEach(() => {
    installLocalStorageMock();
  });

  it('缺 status 且无 outcome 的旧会话 → 归一化为 active', () => {
    localStorage.setItem('mq_rank_match_sessions', JSON.stringify({
      legacyActive: {
        id: 'legacy-active',
        userId: 'u1',
        targetTier: 'rookie',
        bestOf: 3,
        winsToAdvance: 2,
        games: [{ gameIndex: 1, finished: false, practiceSessionId: 'ps-1', startedAt: 1000 }],
        startedAt: 1000,
      },
    }));

    const all = repository.getRankMatchSessions() as Record<string, RankMatchSession & { status?: string }>;
    expect(all.legacyActive?.status).toBe('active');
  });

  it('缺 status 但已有 outcome 的旧会话 → 归一化为 completed', () => {
    localStorage.setItem('mq_rank_match_sessions', JSON.stringify({
      legacyCompleted: {
        id: 'legacy-completed',
        userId: 'u1',
        targetTier: 'rookie',
        bestOf: 3,
        winsToAdvance: 2,
        games: [{ gameIndex: 1, finished: true, won: true, practiceSessionId: 'ps-1', startedAt: 1000, endedAt: 1200 }],
        outcome: 'promoted',
        startedAt: 1000,
        endedAt: 1200,
      },
    }));

    const all = repository.getRankMatchSessions() as Record<string, RankMatchSession & { status?: string }>;
    expect(all.legacyCompleted?.status).toBe('completed');
  });
});
