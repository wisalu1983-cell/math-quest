// src/dev-tool/injections/in-game.ts
// F3 注入项：局内心数 / 结束当前局

import type { DevInjection } from '../types';
import { useSessionStore, useUIStore } from '@/store';
import { setDevHeartLockEnabled } from '@/utils/dev-tool-flags';

function requireActiveSession(): void {
  if (!useSessionStore.getState().active || !useSessionStore.getState().session) {
    throw new Error('当前没有进行中的对局（先进 Practice 再执行）');
  }
}

const setHearts: DevInjection[] = [1, 2, 3].map(h => ({
  id: `in-game.set-hearts.${h}`,
  group: 'in-game',
  label: `局内心数 → ${h}`,
  description: `把当前局的 hearts 直接改为 ${h}（同时更新 session.heartsRemaining）`,
  run() {
    requireActiveSession();
    useSessionStore.setState(prev => {
      if (!prev.session) return prev;
      return {
        hearts: h,
        session: { ...prev.session, heartsRemaining: h },
      };
    });
  },
}));

const finishSession: DevInjection = {
  id: 'in-game.finish-session',
  group: 'in-game',
  label: '结束当前局 → 走结算页',
  description: '调用 endSession()，自动进入结算/进阶/段位赛结果页',
  run() {
    requireActiveSession();
    const completed = useSessionStore.getState().endSession();
    const mode = completed.sessionMode;
    const ui = useUIStore.getState();
    ui.setLastSession(completed);
    if (mode === 'rank-match') {
      const action = useSessionStore.getState().lastRankMatchAction;
      if (action?.kind === 'start-next') {
        ui.setPage('rank-match-game-result');
      } else if (action?.kind === 'promoted' || action?.kind === 'eliminated') {
        ui.setPage('rank-match-result');
      } else {
        ui.setPage('rank-match-game-result');
      }
    } else {
      ui.setPage('summary');
    }
  },
};

const enableHeartLock: DevInjection = {
  id: 'in-game.lock-hearts.enable',
  group: 'in-game',
  label: '开启关内锁血',
  description: '开启后当前浏览器内错题仍记录，但不会扣 hearts',
  run() {
    setDevHeartLockEnabled(true);
  },
};

const disableHeartLock: DevInjection = {
  id: 'in-game.lock-hearts.disable',
  group: 'in-game',
  label: '关闭关内锁血',
  description: '恢复正常扣心逻辑',
  run() {
    setDevHeartLockEnabled(false);
  },
};

export const inGameInjections: DevInjection[] = [
  finishSession,
  enableHeartLock,
  disableHeartLock,
  ...setHearts,
];
