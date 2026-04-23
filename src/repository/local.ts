// src/repository/local.ts
import type { User, PracticeSession, TopicId, HistoryRecord } from '@/types';
import type {
  GameProgress,
  RankMatchSession,
  RankMatchSessionStatus,
  TopicCampaignProgress,
} from '@/types/gamification';
import { CAMPAIGN_MAPS, getAllLevelIds, isCampaignFullyCompleted } from '@/constants/campaign';

/**
 * Storage Namespace（v0.2-1-1 / F3 开发者工具栏）
 *
 * 默认 prefix = 'mq_'，与历史行为完全一致。
 * F3 把 prefix 切到 'mq_dev_' 以构造"测试沙盒"，让注入操作不触碰真实用户数据。
 * 切换是**运行时**行为，切回 'main' 后 `mq_*` 数据原样可读。
 */
export type StorageNamespace = 'main' | 'dev';
const PREFIX_MAIN = 'mq_';
const PREFIX_DEV = 'mq_dev_';
let keyPrefix: typeof PREFIX_MAIN | typeof PREFIX_DEV = PREFIX_MAIN;

export function setStorageNamespace(ns: StorageNamespace): void {
  keyPrefix = ns === 'dev' ? PREFIX_DEV : PREFIX_MAIN;
}

export function getStorageNamespace(): StorageNamespace {
  return keyPrefix === PREFIX_DEV ? 'dev' : 'main';
}

// 供 F3 精确清理测试沙盒用：返回当前 namespace 下所有 key（main 下仅 mq_* 非 mq_dev_*；dev 下仅 mq_dev_*）
function listCurrentNamespaceKeys(): string[] {
  const out: string[] = [];
  const len = (localStorage as unknown as { length: number }).length;
  for (let i = 0; i < len; i++) {
    const k = localStorage.key(i);
    if (!k) continue;
    if (keyPrefix === PREFIX_MAIN) {
      // main：匹配所有 mq_* 但要排除 mq_dev_*
      if (k.startsWith(PREFIX_MAIN) && !k.startsWith(PREFIX_DEV)) out.push(k);
    } else {
      if (k.startsWith(PREFIX_DEV)) out.push(k);
    }
  }
  return out;
}

const KEYS = {
  user: () => `${keyPrefix}user`,
  gameProgress: () => `${keyPrefix}game_progress`,
  sessions: () => `${keyPrefix}sessions`,
  history: () => `${keyPrefix}history`,
  /** Spec §6.4：RankMatchSession 独立 key，与 PracticeSession 分存 */
  rankMatchSessions: () => `${keyPrefix}rank_match_sessions`,
  syncState: () => `${keyPrefix}sync_state`,
  authUserId: () => `${keyPrefix}auth_user_id`,
  version: () => `${keyPrefix}version`,
} as const;

/**
 * 当前存档版本。
 *
 * 版本升级 · 项目级原则（`CLAUDE.md` 非显然约束 / Spec 2026-04-18 §6.3）：
 *   - CURRENT_VERSION 每递增 1，必须新增对应的 migrateV{n}ToV{n+1} 纯函数并登记到 MIGRATIONS
 *   - repository.init 读到旧版本号后按 v{old} → v{old+1} → ... → CURRENT_VERSION 串行迁移
 *   - 迁移链中任何一步抛错 → 旧 gameProgress 落到 mq_backup_v{old}_{ts} 备份，当次启动走"新存档 + 告警"
 *   - 严禁用 clearAll() / 单独 removeItem(gameProgress) 作为"版本不一致"的兜底；clearAll 只能作为显式用户操作
 */
const CURRENT_VERSION = 4;
const MAX_SESSIONS = 200;

/**
 * ISSUE-057（2026-04-17）闯关结构全面重构后的一次性存档迁移（策略 X）
 *
 * 背景：8 个题型的 stage/lane/levelId 都发生了变化。旧结构里存在的
 *   levelId（如 'mental-arithmetic-S4-LA-L1' 老 Boss）在新结构里不存在，
 *   玩家进度如果不迁移就会变成孤儿数据。
 *
 * 策略：
 *   - 如果玩家曾通 Boss（campaignCompleted=true 或含任何旧 Boss levelId）
 *     → 新结构所有 levelId 直接标记通关（bestHearts=3）
 *   - 否则丢弃旧 completedLevels，玩家从新 S1 第 1 关开始
 *   - advanceProgress 不动
 *
 * 幂等：只有当 completedLevels 含"新结构外 levelId"时才触发；迁移一次后
 *   所有 levelId 都属于新结构，不再触发。
 */
export function migrateCampaignIfNeeded(gp: GameProgress): GameProgress {
  let changed = false;
  const newCampaignProgress: typeof gp.campaignProgress = { ...gp.campaignProgress };

  for (const topicId of Object.keys(CAMPAIGN_MAPS) as TopicId[]) {
    const topicProg = gp.campaignProgress[topicId];
    if (!topicProg) continue;

    const validIds = new Set(getAllLevelIds(topicId));
    const hasStaleId = topicProg.completedLevels.some(l => !validIds.has(l.levelId));

    if (!hasStaleId) continue;

    changed = true;
    const wasBossDone = topicProg.campaignCompleted === true;

    let migrated: TopicCampaignProgress;
    if (wasBossDone) {
      const now = Date.now();
      const allIds = getAllLevelIds(topicId);
      migrated = {
        topicId,
        completedLevels: allIds.map(levelId => ({
          levelId,
          bestHearts: 3,
          completedAt: now,
        })),
        campaignCompleted: isCampaignFullyCompleted(topicId, new Set(allIds)),
      };
    } else {
      const kept = topicProg.completedLevels.filter(l => validIds.has(l.levelId));
      const keptIds = new Set(kept.map(l => l.levelId));
      migrated = {
        topicId,
        completedLevels: kept,
        campaignCompleted: isCampaignFullyCompleted(topicId, keptIds),
      };
    }

    newCampaignProgress[topicId] = migrated;
  }

  if (!changed) return gp;
  return { ...gp, campaignProgress: newCampaignProgress };
}

/**
 * Phase 3 M1 v2→v3 迁移：为旧存档补默认 rankProgress。
 * 幂等：已有 rankProgress 则引用原样返回。
 */
export function migrateRankProgressIfNeeded(gp: GameProgress): GameProgress {
  if (gp.rankProgress) return gp;
  return {
    ...gp,
    rankProgress: {
      currentTier: 'apprentice',
      history: [],
    },
  };
}

/** v2 → v3：追加 rankProgress（Phase 3 M1） */
export const migrateV2ToV3 = migrateRankProgressIfNeeded;

/** v3 → v4：为 Supabase 认证与同步预留版本升级点，当前 GameProgress 结构不变 */
export function migrateV3ToV4(gp: GameProgress): GameProgress {
  return gp;
}

/**
 * 迁移链登记表：MIGRATIONS[n] 把 v{n} 提升到 v{n+1}。
 * 新增版本时在此追加条目，配套新增 migrateV{n}ToV{n+1} 纯函数。
 */
const MIGRATIONS: Record<number, (gp: GameProgress) => GameProgress> = {
  2: migrateV2ToV3,
  3: migrateV3ToV4,
};

/**
 * 串行执行 v{oldVersion} → v{CURRENT_VERSION} 的迁移链。
 * 任一版本缺少对应迁移函数 → 抛错（调用方走备份路径）。
 */
function runMigrationChain(oldVersion: number, gp: GameProgress): GameProgress {
  if (oldVersion === CURRENT_VERSION) return gp;
  if (oldVersion > CURRENT_VERSION) {
    throw new Error(`Unknown future version ${oldVersion}; no downgrade path`);
  }
  let current = gp;
  for (let v = oldVersion; v < CURRENT_VERSION; v++) {
    const step = MIGRATIONS[v];
    if (!step) {
      throw new Error(`No migration registered from v${v} to v${v + 1}`);
    }
    current = step(current);
  }
  return current;
}

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : null;
  } catch {
    return null;
  }
}

function write<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('数据保存失败，可能存储空间已满', e);
  }
}

type StoredRankMatchSession = RankMatchSession & {
  status?: RankMatchSessionStatus;
};

function normalizeRankMatchSession(raw: StoredRankMatchSession): RankMatchSession {
  if (raw.status) return raw as RankMatchSession;
  return {
    ...raw,
    status: raw.outcome ? 'completed' : 'active',
  } as RankMatchSession;
}

export const repository = {
  /**
   * 启动时的版本探测 + 迁移。
   * - 没有旧版本号（全新用户）→ 写入 CURRENT_VERSION，不动任何数据
   * - 已是当前版本 → noop
   * - 旧版本 → 按 MIGRATIONS 串行迁移；失败落到 mq_backup_v{old}_{ts} + 丢弃原 gameProgress
   *   严禁 clearAll：用户历史进度是不可再生资产，未来任何 Phase 升级也必须沿用此原则
   *
   * namespace 感知：切到 'dev' 后再调 init，会在 mq_dev_* 上独立跑一次。
   */
  init() {
    const storedVersion = read<number>(KEYS.version());

    if (storedVersion === CURRENT_VERSION) return;

    if (storedVersion === null) {
      write(KEYS.version(), CURRENT_VERSION);
      return;
    }

    const rawGp = read<GameProgress>(KEYS.gameProgress());

    if (!rawGp) {
      write(KEYS.version(), CURRENT_VERSION);
      return;
    }

    try {
      const migrated = runMigrationChain(storedVersion, rawGp);
      write(KEYS.gameProgress(), migrated);
      write(KEYS.version(), CURRENT_VERSION);
    } catch (e) {
      const backupKey = `${keyPrefix}backup_v${storedVersion}_${Date.now()}`;
      write(backupKey, rawGp);
      localStorage.removeItem(KEYS.gameProgress());
      write(KEYS.version(), CURRENT_VERSION);
      console.warn(
        `[repository] 存档从 v${storedVersion} 迁移到 v${CURRENT_VERSION} 失败，已备份至 ${backupKey}，本次启动使用新存档。`,
        e,
      );
    }
  },

  getUser(): User | null {
    return read<User>(KEYS.user());
  },

  saveUser(user: User): void {
    write(KEYS.user(), user);
  },

  getGameProgress(userId: string): GameProgress {
    const raw = read<GameProgress>(KEYS.gameProgress());
    if (raw && raw.userId === userId) {
      if (!raw.advanceProgress) raw.advanceProgress = {};

      const afterCampaign = migrateCampaignIfNeeded(raw);
      const migrated = migrateRankProgressIfNeeded(afterCampaign);
      if (migrated !== raw) {
        write(KEYS.gameProgress(), migrated);
      }
      return migrated;
    }
    return {
      userId,
      campaignProgress: {},
      advanceProgress: {},
      rankProgress: { currentTier: 'apprentice', history: [] },
      wrongQuestions: [],
      totalQuestionsAttempted: 0,
      totalQuestionsCorrect: 0,
    };
  },

  saveGameProgress(progress: GameProgress): void {
    write(KEYS.gameProgress(), progress);
  },

  getSessions(): PracticeSession[] {
    return read<PracticeSession[]>(KEYS.sessions()) ?? [];
  },

  getHistory(): HistoryRecord[] {
    return read<HistoryRecord[]>(KEYS.history()) ?? [];
  },

  saveHistoryRecord(record: HistoryRecord): void {
    const history = this.getHistory();
    history.push(record);
    write(KEYS.history(), history);
  },

  clearHistory(): void {
    localStorage.removeItem(KEYS.history());
  },

  /**
   * 保存 PracticeSession。按 id upsert：已有同 id 条目则覆盖，否则追加。
   *
   * 历史行为（2026-04-18 前）是无条件 push —— 这在"每个 session 只 save 一次"的场景下没问题。
   * ISSUE-060 后段位赛单局会在 start / 每次 submitAnswer / endSession 多次 save，
   * 必须 upsert 才能保证 getSessions 回放出最新一份；否则恢复路径会拿到空 questions 的初版。
   * 对其它 sessionMode 也是更合理的语义（不会产生 id 重复条目）。
   */
  saveSession(session: PracticeSession): void {
    const sessions = this.getSessions();
    const idx = sessions.findIndex(s => s.id === session.id);
    if (idx >= 0) {
      sessions[idx] = session;
    } else {
      sessions.push(session);
      if (sessions.length > MAX_SESSIONS) {
        sessions.splice(0, sessions.length - MAX_SESSIONS);
      }
    }
    write(KEYS.sessions(), sessions);
  },

  getRecentSessions(limit: number): PracticeSession[] {
    return this.getSessions().slice(-limit);
  },

  // ─── RankMatchSession 持久化（Spec §6.4 / ISSUE-060 M2 遗留补做） ───
  //
  // 独立 key mq_rank_match_sessions，按 id 字典存储（upsert 语义）。
  // Plan §4.1 明文要求：段位赛单局刷新后需从 mq_sessions + mq_rank_match_sessions
  // 联合恢复；本层只负责 I/O，一致性校验由 store 层承担。

  getRankMatchSessions(): Record<string, RankMatchSession> {
    const raw = read<Record<string, StoredRankMatchSession>>(KEYS.rankMatchSessions()) ?? {};
    let changed = false;
    const normalized: Record<string, RankMatchSession> = {};
    for (const [id, session] of Object.entries(raw)) {
      const next = normalizeRankMatchSession(session);
      normalized[id] = next;
      if (next !== session) {
        changed = true;
      }
    }
    if (changed) {
      write(KEYS.rankMatchSessions(), normalized);
    }
    return normalized;
  },

  saveRankMatchSession(session: RankMatchSession): void {
    const all = this.getRankMatchSessions();
    all[session.id] = session;
    write(KEYS.rankMatchSessions(), all);
  },

  getRankMatchSession(id: string): RankMatchSession | null {
    const all = this.getRankMatchSessions();
    return all[id] ?? null;
  },

  deleteRankMatchSession(id: string): void {
    const all = this.getRankMatchSessions();
    if (!(id in all)) return;
    delete all[id];
    write(KEYS.rankMatchSessions(), all);
  },

  /**
   * 完整清空本地存档。
   * 仅保留给"用户显式点击 '清空存档' 按钮"这一路径使用；
   * 严禁在任何版本升级 / 启动探测分支中调用（Spec 2026-04-18 §6.3 项目级原则）。
   *
   * 清理范围限定在**当前 namespace** 下的 key：
   *   - namespace='main'：清 mq_* 下的业务 key + legacy `mq_progress`；不跨删 mq_dev_*
   *   - namespace='dev'：清 mq_dev_* 下的所有 key（"清空测试沙盒"）
   */
  clearAll(): void {
    if (keyPrefix === PREFIX_MAIN) {
      localStorage.removeItem(KEYS.user());
      localStorage.removeItem(KEYS.gameProgress());
      localStorage.removeItem(KEYS.sessions());
      localStorage.removeItem(KEYS.history());
      localStorage.removeItem(KEYS.rankMatchSessions());
      localStorage.removeItem('mq_progress');
      return;
    }
    // dev namespace：整组 removeItem（覆盖未来新增的 mq_dev_* key）
    const toRemove = listCurrentNamespaceKeys();
    for (const k of toRemove) {
      localStorage.removeItem(k);
    }
  },
};
