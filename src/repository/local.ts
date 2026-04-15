// src/repository/local.ts
import type { User, PracticeSession } from '@/types';
import type { GameProgress } from '@/types/gamification';

const KEYS = {
  user: 'mq_user',
  gameProgress: 'mq_game_progress',
  sessions: 'mq_sessions',
  version: 'mq_version',
} as const;

const CURRENT_VERSION = 2;
const MAX_SESSIONS = 200;

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

export const repository = {
  init() {
    const version = read<number>(KEYS.version);
    if (version !== CURRENT_VERSION) {
      // 版本升级：清除旧数据，防止结构不兼容
      localStorage.removeItem('mq_progress');
      write(KEYS.version, CURRENT_VERSION);
    }
  },

  // User
  getUser(): User | null {
    return read<User>(KEYS.user);
  },

  saveUser(user: User): void {
    write(KEYS.user, user);
  },

  // GameProgress
  getGameProgress(userId: string): GameProgress {
    const raw = read<GameProgress>(KEYS.gameProgress);
    if (raw && raw.userId === userId) {
      // 向前兼容迁移：老数据无 advanceProgress 字段
      if (!raw.advanceProgress) raw.advanceProgress = {};
      return raw;
    }
    return {
      userId,
      campaignProgress: {},
      advanceProgress: {},
      wrongQuestions: [],
      totalQuestionsAttempted: 0,
      totalQuestionsCorrect: 0,
    };
  },

  saveGameProgress(progress: GameProgress): void {
    write(KEYS.gameProgress, progress);
  },

  // Sessions
  getSessions(): PracticeSession[] {
    return read<PracticeSession[]>(KEYS.sessions) ?? [];
  },

  saveSession(session: PracticeSession): void {
    const sessions = this.getSessions();
    sessions.push(session);
    if (sessions.length > MAX_SESSIONS) {
      sessions.splice(0, sessions.length - MAX_SESSIONS);
    }
    write(KEYS.sessions, sessions);
  },

  getRecentSessions(limit: number): PracticeSession[] {
    return this.getSessions().slice(-limit);
  },

  clearAll(): void {
    localStorage.removeItem(KEYS.user);
    localStorage.removeItem(KEYS.gameProgress);
    localStorage.removeItem(KEYS.sessions);
    localStorage.removeItem('mq_progress');
  },
};
