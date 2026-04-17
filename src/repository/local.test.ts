// src/repository/local.test.ts
// ISSUE-057 闯关结构重构后的存档迁移（策略 X）单测
// 纯函数测试，不依赖 DOM / localStorage

import { describe, it, expect } from 'vitest';
import { migrateCampaignIfNeeded } from './local';
import type { GameProgress } from '@/types/gamification';
import { CAMPAIGN_MAPS, getAllLevelIds } from '@/constants/campaign';

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

  it('8 题型 getAllLevelIds 总数 = 90（新结构总关卡数）', () => {
    // 防回归：8 题型各自关卡数总和
    // A01:11 + A02:15 + A03:12 + A04:8 + A05:12 + A06:10 + A07:13 + A08:9 = 90
    let total = 0;
    for (const topicId of Object.keys(CAMPAIGN_MAPS)) {
      total += getAllLevelIds(topicId).length;
    }
    expect(total).toBe(90);
  });
});
