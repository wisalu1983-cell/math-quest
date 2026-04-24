// src/dev-tool/injections/navigation.ts
// F3 注入项：页面跳转 + 题型直达首关

import type { DevInjection } from '../types';
import { TOPICS } from '@/constants';
import { useUIStore, useSessionStore, useUserStore } from '@/store';
import { getAllLevelIds } from '@/constants/campaign';

type Page = ReturnType<typeof useUIStore.getState>['currentPage'];

const PAGES: Array<{ id: Page; label: string }> = [
  { id: 'home', label: '首页' },
  { id: 'campaign-map', label: '闯关地图' },
  { id: 'advance-select', label: '进阶选择' },
  { id: 'practice', label: '练习中' },
  { id: 'summary', label: '结算页' },
  { id: 'progress', label: '成长页' },
  { id: 'profile', label: '个人中心' },
  { id: 'wrong-book', label: '错题本' },
  { id: 'history', label: '历史记录' },
  { id: 'session-detail', label: 'Session 详情' },
  { id: 'onboarding', label: 'Onboarding' },
  { id: 'rank-match-hub', label: '段位赛大厅' },
  { id: 'rank-match-game-result', label: '段位赛单局结果' },
  { id: 'rank-match-result', label: '段位赛最终结果' },
];

const gotoPageInjections: DevInjection[] = PAGES.map(p => ({
  id: `nav.goto-page.${p.id}`,
  group: 'navigation',
  label: `跳转 → ${p.label}`,
  description: `UIStore.setPage('${p.id}')`,
  run() {
    useUIStore.getState().setPage(p.id);
  },
}));

const gotoTopicInjections: DevInjection[] = TOPICS.map(t => ({
  id: `nav.goto-topic.${t.id}`,
  group: 'navigation',
  label: `${t.name} · 直达首关`,
  description: `startCampaignSession(${t.id}, 首关) → 进入 practice 页`,
  run() {
    const user = useUserStore.getState().user;
    if (!user) {
      throw new Error('当前 namespace 没有用户，无法开始对局');
    }
    const [firstLevelId] = getAllLevelIds(t.id);
    if (!firstLevelId) {
      throw new Error(`${t.name} 没有配置关卡`);
    }
    useSessionStore.getState().startCampaignSession(t.id, firstLevelId);
    useUIStore.getState().setPage('practice');
  },
}));

export const navigationInjections: DevInjection[] = [
  ...gotoPageInjections,
  ...gotoTopicInjections,
];
