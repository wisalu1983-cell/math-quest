// src/constants/campaign.ts
import type { CampaignMap } from '@/types/gamification';

// ─── A01 基础计算（偏线性：主干 + Stage1 有一条支线） ───
const mentalArithmeticMap: CampaignMap = {
  topicId: 'mental-arithmetic',
  stages: [
    {
      stageId: 'mental-arithmetic-S1',
      stageLabel: '整数口算',
      isBoss: false,
      lanes: [
        {
          laneId: 'mental-arithmetic-S1-LA',
          laneLabel: '加减主路',
          levels: [
            { levelId: 'mental-arithmetic-S1-LA-L1', difficulty: 2, questionCount: 10 },
            { levelId: 'mental-arithmetic-S1-LA-L2', difficulty: 3, questionCount: 12 },
            { levelId: 'mental-arithmetic-S1-LA-L3', difficulty: 4, questionCount: 15 },
          ],
        },
        {
          laneId: 'mental-arithmetic-S1-LB',
          laneLabel: '乘除支路',
          levels: [
            { levelId: 'mental-arithmetic-S1-LB-L1', difficulty: 2, questionCount: 10 },
            { levelId: 'mental-arithmetic-S1-LB-L2', difficulty: 3, questionCount: 12 },
          ],
        },
      ],
    },
    {
      stageId: 'mental-arithmetic-S2',
      stageLabel: '运算顺序',
      isBoss: false,
      lanes: [
        {
          laneId: 'mental-arithmetic-S2-LA',
          laneLabel: '主路线',
          levels: [
            { levelId: 'mental-arithmetic-S2-LA-L1', difficulty: 4, questionCount: 15 },
            { levelId: 'mental-arithmetic-S2-LA-L2', difficulty: 5, questionCount: 15 },
            { levelId: 'mental-arithmetic-S2-LA-L3', difficulty: 5, questionCount: 18 },
          ],
        },
      ],
    },
    {
      stageId: 'mental-arithmetic-S3',
      stageLabel: '综合挑战',
      isBoss: false,
      lanes: [
        {
          laneId: 'mental-arithmetic-S3-LA',
          laneLabel: '主路线',
          levels: [
            { levelId: 'mental-arithmetic-S3-LA-L1', difficulty: 6, questionCount: 18 },
            { levelId: 'mental-arithmetic-S3-LA-L2', difficulty: 7, questionCount: 20 },
            { levelId: 'mental-arithmetic-S3-LA-L3', difficulty: 7, questionCount: 20 },
          ],
        },
      ],
    },
    {
      stageId: 'mental-arithmetic-S4',
      stageLabel: 'Boss战',
      isBoss: true,
      lanes: [
        {
          laneId: 'mental-arithmetic-S4-LA',
          laneLabel: 'Boss关',
          levels: [
            { levelId: 'mental-arithmetic-S4-LA-L1', difficulty: 7, questionCount: 20 },
          ],
        },
      ],
    },
  ],
};

// ─── A02 数感估算（树状：多条并行路线） ───
const numberSenseMap: CampaignMap = {
  topicId: 'number-sense',
  stages: [
    {
      stageId: 'number-sense-S1',
      stageLabel: '基础估算',
      isBoss: false,
      lanes: [
        {
          laneId: 'number-sense-S1-LA',
          laneLabel: '估算',
          levels: [
            { levelId: 'number-sense-S1-LA-L1', difficulty: 2, questionCount: 10 },
            { levelId: 'number-sense-S1-LA-L2', difficulty: 3, questionCount: 12 },
          ],
        },
        {
          laneId: 'number-sense-S1-LB',
          laneLabel: '比较大小',
          levels: [
            { levelId: 'number-sense-S1-LB-L1', difficulty: 2, questionCount: 10 },
            { levelId: 'number-sense-S1-LB-L2', difficulty: 3, questionCount: 12 },
          ],
        },
      ],
    },
    {
      stageId: 'number-sense-S2',
      stageLabel: '进阶估算',
      isBoss: false,
      lanes: [
        {
          laneId: 'number-sense-S2-LA',
          laneLabel: '四舍五入',
          levels: [
            { levelId: 'number-sense-S2-LA-L1', difficulty: 4, questionCount: 12 },
            { levelId: 'number-sense-S2-LA-L2', difficulty: 5, questionCount: 15 },
          ],
        },
        {
          laneId: 'number-sense-S2-LB',
          laneLabel: '去尾进一',
          levels: [
            { levelId: 'number-sense-S2-LB-L1', difficulty: 4, questionCount: 12 },
            { levelId: 'number-sense-S2-LB-L2', difficulty: 5, questionCount: 15 },
          ],
        },
        {
          laneId: 'number-sense-S2-LC',
          laneLabel: '逆向推理',
          levels: [
            { levelId: 'number-sense-S2-LC-L1', difficulty: 5, questionCount: 12 },
            { levelId: 'number-sense-S2-LC-L2', difficulty: 5, questionCount: 15 },
          ],
        },
      ],
    },
    {
      stageId: 'number-sense-S3',
      stageLabel: '高阶训练',
      isBoss: false,
      lanes: [
        {
          laneId: 'number-sense-S3-LA',
          laneLabel: '综合估算',
          levels: [
            { levelId: 'number-sense-S3-LA-L1', difficulty: 6, questionCount: 15 },
            { levelId: 'number-sense-S3-LA-L2', difficulty: 7, questionCount: 18 },
          ],
        },
        {
          laneId: 'number-sense-S3-LB',
          laneLabel: '逆向高阶',
          levels: [
            { levelId: 'number-sense-S3-LB-L1', difficulty: 6, questionCount: 15 },
            { levelId: 'number-sense-S3-LB-L2', difficulty: 7, questionCount: 18 },
          ],
        },
      ],
    },
    {
      stageId: 'number-sense-S4',
      stageLabel: 'Boss战',
      isBoss: true,
      lanes: [
        {
          laneId: 'number-sense-S4-LA',
          laneLabel: 'Boss关',
          levels: [
            { levelId: 'number-sense-S4-LA-L1', difficulty: 7, questionCount: 20 },
          ],
        },
      ],
    },
  ],
};

// ─── A03 竖式笔算（偏线性） ───
const verticalCalcMap: CampaignMap = {
  topicId: 'vertical-calc',
  stages: [
    {
      stageId: 'vertical-calc-S1',
      stageLabel: '整数笔算',
      isBoss: false,
      lanes: [
        {
          laneId: 'vertical-calc-S1-LA',
          laneLabel: '加减',
          levels: [
            { levelId: 'vertical-calc-S1-LA-L1', difficulty: 2, questionCount: 10 },
            { levelId: 'vertical-calc-S1-LA-L2', difficulty: 3, questionCount: 12 },
            { levelId: 'vertical-calc-S1-LA-L3', difficulty: 4, questionCount: 15 },
          ],
        },
        {
          laneId: 'vertical-calc-S1-LB',
          laneLabel: '乘除',
          levels: [
            { levelId: 'vertical-calc-S1-LB-L1', difficulty: 2, questionCount: 10 },
            { levelId: 'vertical-calc-S1-LB-L2', difficulty: 3, questionCount: 12 },
          ],
        },
      ],
    },
    {
      stageId: 'vertical-calc-S2',
      stageLabel: '小数笔算',
      isBoss: false,
      lanes: [
        {
          laneId: 'vertical-calc-S2-LA',
          laneLabel: '主路线',
          levels: [
            { levelId: 'vertical-calc-S2-LA-L1', difficulty: 4, questionCount: 12 },
            { levelId: 'vertical-calc-S2-LA-L2', difficulty: 5, questionCount: 15 },
            { levelId: 'vertical-calc-S2-LA-L3', difficulty: 6, questionCount: 18 },
          ],
        },
      ],
    },
    {
      stageId: 'vertical-calc-S3',
      stageLabel: '高阶笔算',
      isBoss: false,
      lanes: [
        {
          laneId: 'vertical-calc-S3-LA',
          laneLabel: '主路线',
          levels: [
            { levelId: 'vertical-calc-S3-LA-L1', difficulty: 6, questionCount: 15 },
            { levelId: 'vertical-calc-S3-LA-L2', difficulty: 7, questionCount: 18 },
            { levelId: 'vertical-calc-S3-LA-L3', difficulty: 7, questionCount: 20 },
          ],
        },
      ],
    },
    {
      stageId: 'vertical-calc-S4',
      stageLabel: 'Boss战',
      isBoss: true,
      lanes: [
        {
          laneId: 'vertical-calc-S4-LA',
          laneLabel: 'Boss关',
          levels: [
            { levelId: 'vertical-calc-S4-LA-L1', difficulty: 7, questionCount: 20 },
          ],
        },
      ],
    },
  ],
};

// ─── A04 运算律（严格线性：每阶段 1 条路线） ───
const operationLawsMap: CampaignMap = {
  topicId: 'operation-laws',
  stages: [
    {
      stageId: 'operation-laws-S1',
      stageLabel: '交换律结合律',
      isBoss: false,
      lanes: [
        {
          laneId: 'operation-laws-S1-LA',
          laneLabel: '主路线',
          levels: [
            { levelId: 'operation-laws-S1-LA-L1', difficulty: 2, questionCount: 10 },
            { levelId: 'operation-laws-S1-LA-L2', difficulty: 3, questionCount: 12 },
            { levelId: 'operation-laws-S1-LA-L3', difficulty: 4, questionCount: 18 },
          ],
        },
      ],
    },
    {
      stageId: 'operation-laws-S2',
      stageLabel: '分配律',
      isBoss: false,
      lanes: [
        {
          laneId: 'operation-laws-S2-LA',
          laneLabel: '主路线',
          levels: [
            { levelId: 'operation-laws-S2-LA-L1', difficulty: 4, questionCount: 15 },
            { levelId: 'operation-laws-S2-LA-L2', difficulty: 5, questionCount: 18 },
            { levelId: 'operation-laws-S2-LA-L3', difficulty: 5, questionCount: 20 },
          ],
        },
      ],
    },
    {
      stageId: 'operation-laws-S3',
      stageLabel: '综合运用',
      isBoss: false,
      lanes: [
        {
          laneId: 'operation-laws-S3-LA',
          laneLabel: '主路线',
          levels: [
            { levelId: 'operation-laws-S3-LA-L1', difficulty: 6, questionCount: 18 },
            { levelId: 'operation-laws-S3-LA-L2', difficulty: 7, questionCount: 20 },
            { levelId: 'operation-laws-S3-LA-L3', difficulty: 7, questionCount: 20 },
          ],
        },
      ],
    },
    {
      stageId: 'operation-laws-S4',
      stageLabel: 'Boss战',
      isBoss: true,
      lanes: [
        {
          laneId: 'operation-laws-S4-LA',
          laneLabel: 'Boss关',
          levels: [
            { levelId: 'operation-laws-S4-LA-L1', difficulty: 7, questionCount: 20 },
          ],
        },
      ],
    },
  ],
};

// ─── A05 小数运算（混合型） ───
const decimalOpsMap: CampaignMap = {
  topicId: 'decimal-ops',
  stages: [
    {
      stageId: 'decimal-ops-S1',
      stageLabel: '加减基础',
      isBoss: false,
      lanes: [
        {
          laneId: 'decimal-ops-S1-LA',
          laneLabel: '加法',
          levels: [
            { levelId: 'decimal-ops-S1-LA-L1', difficulty: 2, questionCount: 10 },
            { levelId: 'decimal-ops-S1-LA-L2', difficulty: 3, questionCount: 12 },
          ],
        },
        {
          laneId: 'decimal-ops-S1-LB',
          laneLabel: '减法',
          levels: [
            { levelId: 'decimal-ops-S1-LB-L1', difficulty: 2, questionCount: 10 },
            { levelId: 'decimal-ops-S1-LB-L2', difficulty: 3, questionCount: 12 },
          ],
        },
      ],
    },
    {
      stageId: 'decimal-ops-S2',
      stageLabel: '乘除基础',
      isBoss: false,
      lanes: [
        {
          laneId: 'decimal-ops-S2-LA',
          laneLabel: '乘法',
          levels: [
            { levelId: 'decimal-ops-S2-LA-L1', difficulty: 3, questionCount: 12 },
            { levelId: 'decimal-ops-S2-LA-L2', difficulty: 5, questionCount: 15 },
          ],
        },
        {
          laneId: 'decimal-ops-S2-LB',
          laneLabel: '除法',
          levels: [
            { levelId: 'decimal-ops-S2-LB-L1', difficulty: 3, questionCount: 12 },
            { levelId: 'decimal-ops-S2-LB-L2', difficulty: 5, questionCount: 15 },
          ],
        },
      ],
    },
    {
      stageId: 'decimal-ops-S3',
      stageLabel: '综合',
      isBoss: false,
      lanes: [
        {
          laneId: 'decimal-ops-S3-LA',
          laneLabel: '主路线',
          levels: [
            { levelId: 'decimal-ops-S3-LA-L1', difficulty: 5, questionCount: 15 },
            { levelId: 'decimal-ops-S3-LA-L2', difficulty: 6, questionCount: 18 },
            { levelId: 'decimal-ops-S3-LA-L3', difficulty: 7, questionCount: 20 },
          ],
        },
      ],
    },
    {
      stageId: 'decimal-ops-S4',
      stageLabel: 'Boss战',
      isBoss: true,
      lanes: [
        {
          laneId: 'decimal-ops-S4-LA',
          laneLabel: 'Boss关',
          levels: [
            { levelId: 'decimal-ops-S4-LA-L1', difficulty: 7, questionCount: 20 },
          ],
        },
      ],
    },
  ],
};

// ─── A06 括号变换（严格线性） ───
const bracketOpsMap: CampaignMap = {
  topicId: 'bracket-ops',
  stages: [
    {
      stageId: 'bracket-ops-S1',
      stageLabel: '添括号',
      isBoss: false,
      lanes: [
        {
          laneId: 'bracket-ops-S1-LA',
          laneLabel: '主路线',
          levels: [
            { levelId: 'bracket-ops-S1-LA-L1', difficulty: 2, questionCount: 12 },
            { levelId: 'bracket-ops-S1-LA-L2', difficulty: 3, questionCount: 15 },
            { levelId: 'bracket-ops-S1-LA-L3', difficulty: 4, questionCount: 18 },
          ],
        },
      ],
    },
    {
      stageId: 'bracket-ops-S2',
      stageLabel: '去括号',
      isBoss: false,
      lanes: [
        {
          laneId: 'bracket-ops-S2-LA',
          laneLabel: '主路线',
          levels: [
            { levelId: 'bracket-ops-S2-LA-L1', difficulty: 4, questionCount: 15 },
            { levelId: 'bracket-ops-S2-LA-L2', difficulty: 5, questionCount: 18 },
            { levelId: 'bracket-ops-S2-LA-L3', difficulty: 5, questionCount: 20 },
          ],
        },
      ],
    },
    {
      stageId: 'bracket-ops-S3',
      stageLabel: '除法性质',
      isBoss: false,
      lanes: [
        {
          laneId: 'bracket-ops-S3-LA',
          laneLabel: '主路线',
          levels: [
            { levelId: 'bracket-ops-S3-LA-L1', difficulty: 6, questionCount: 18 },
            { levelId: 'bracket-ops-S3-LA-L2', difficulty: 7, questionCount: 20 },
            { levelId: 'bracket-ops-S3-LA-L3', difficulty: 7, questionCount: 20 },
          ],
        },
      ],
    },
    {
      stageId: 'bracket-ops-S4',
      stageLabel: 'Boss战',
      isBoss: true,
      lanes: [
        {
          laneId: 'bracket-ops-S4-LA',
          laneLabel: 'Boss关',
          levels: [
            { levelId: 'bracket-ops-S4-LA-L1', difficulty: 7, questionCount: 20 },
          ],
        },
      ],
    },
  ],
};

// ─── A07 简便计算（树状） ───
const multiStepMap: CampaignMap = {
  topicId: 'multi-step',
  stages: [
    {
      stageId: 'multi-step-S1',
      stageLabel: '基础简便',
      isBoss: false,
      lanes: [
        {
          laneId: 'multi-step-S1-LA',
          laneLabel: '交换结合',
          levels: [
            { levelId: 'multi-step-S1-LA-L1', difficulty: 2, questionCount: 10 },
            { levelId: 'multi-step-S1-LA-L2', difficulty: 3, questionCount: 12 },
          ],
        },
        {
          laneId: 'multi-step-S1-LB',
          laneLabel: '分配律',
          levels: [
            { levelId: 'multi-step-S1-LB-L1', difficulty: 2, questionCount: 10 },
            { levelId: 'multi-step-S1-LB-L2', difficulty: 3, questionCount: 12 },
          ],
        },
      ],
    },
    {
      stageId: 'multi-step-S2',
      stageLabel: '进阶技巧',
      isBoss: false,
      lanes: [
        {
          laneId: 'multi-step-S2-LA',
          laneLabel: '正向变换',
          levels: [
            { levelId: 'multi-step-S2-LA-L1', difficulty: 4, questionCount: 12 },
            { levelId: 'multi-step-S2-LA-L2', difficulty: 5, questionCount: 15 },
          ],
        },
        {
          laneId: 'multi-step-S2-LB',
          laneLabel: '变号陷阱',
          levels: [
            { levelId: 'multi-step-S2-LB-L1', difficulty: 4, questionCount: 12 },
            { levelId: 'multi-step-S2-LB-L2', difficulty: 5, questionCount: 15 },
          ],
        },
        {
          laneId: 'multi-step-S2-LC',
          laneLabel: '概念判断',
          levels: [
            { levelId: 'multi-step-S2-LC-L1', difficulty: 4, questionCount: 12 },
            { levelId: 'multi-step-S2-LC-L2', difficulty: 5, questionCount: 15 },
          ],
        },
      ],
    },
    {
      stageId: 'multi-step-S3',
      stageLabel: '高阶综合',
      isBoss: false,
      lanes: [
        {
          laneId: 'multi-step-S3-LA',
          laneLabel: '主路线',
          levels: [
            { levelId: 'multi-step-S3-LA-L1', difficulty: 6, questionCount: 15 },
            { levelId: 'multi-step-S3-LA-L2', difficulty: 7, questionCount: 18 },
            { levelId: 'multi-step-S3-LA-L3', difficulty: 7, questionCount: 20 },
          ],
        },
      ],
    },
    {
      stageId: 'multi-step-S4',
      stageLabel: 'Boss战',
      isBoss: true,
      lanes: [
        {
          laneId: 'multi-step-S4-LA',
          laneLabel: 'Boss关',
          levels: [
            { levelId: 'multi-step-S4-LA-L1', difficulty: 7, questionCount: 20 },
          ],
        },
      ],
    },
  ],
};

// ─── A08 方程移项（混合型） ───
const equationTransposeMap: CampaignMap = {
  topicId: 'equation-transpose',
  stages: [
    {
      stageId: 'equation-transpose-S1',
      stageLabel: '基础移项',
      isBoss: false,
      lanes: [
        {
          laneId: 'equation-transpose-S1-LA',
          laneLabel: '常数移项',
          levels: [
            { levelId: 'equation-transpose-S1-LA-L1', difficulty: 2, questionCount: 10 },
            { levelId: 'equation-transpose-S1-LA-L2', difficulty: 3, questionCount: 12 },
          ],
        },
        {
          laneId: 'equation-transpose-S1-LB',
          laneLabel: '系数处理',
          levels: [
            { levelId: 'equation-transpose-S1-LB-L1', difficulty: 2, questionCount: 10 },
            { levelId: 'equation-transpose-S1-LB-L2', difficulty: 3, questionCount: 12 },
          ],
        },
      ],
    },
    {
      stageId: 'equation-transpose-S2',
      stageLabel: '两步方程',
      isBoss: false,
      lanes: [
        {
          laneId: 'equation-transpose-S2-LA',
          laneLabel: '主路线',
          levels: [
            { levelId: 'equation-transpose-S2-LA-L1', difficulty: 4, questionCount: 15 },
            { levelId: 'equation-transpose-S2-LA-L2', difficulty: 5, questionCount: 18 },
            { levelId: 'equation-transpose-S2-LA-L3', difficulty: 5, questionCount: 20 },
          ],
        },
      ],
    },
    {
      stageId: 'equation-transpose-S3',
      stageLabel: '综合',
      isBoss: false,
      lanes: [
        {
          laneId: 'equation-transpose-S3-LA',
          laneLabel: '主路线',
          levels: [
            { levelId: 'equation-transpose-S3-LA-L1', difficulty: 6, questionCount: 18 },
            { levelId: 'equation-transpose-S3-LA-L2', difficulty: 7, questionCount: 20 },
            { levelId: 'equation-transpose-S3-LA-L3', difficulty: 7, questionCount: 20 },
          ],
        },
      ],
    },
    {
      stageId: 'equation-transpose-S4',
      stageLabel: 'Boss战',
      isBoss: true,
      lanes: [
        {
          laneId: 'equation-transpose-S4-LA',
          laneLabel: 'Boss关',
          levels: [
            { levelId: 'equation-transpose-S4-LA-L1', difficulty: 7, questionCount: 20 },
          ],
        },
      ],
    },
  ],
};

// ─── 导出地图索引 ───
export const CAMPAIGN_MAPS: Record<string, CampaignMap> = {
  'mental-arithmetic': mentalArithmeticMap,
  'number-sense': numberSenseMap,
  'vertical-calc': verticalCalcMap,
  'operation-laws': operationLawsMap,
  'decimal-ops': decimalOpsMap,
  'bracket-ops': bracketOpsMap,
  'multi-step': multiStepMap,
  'equation-transpose': equationTransposeMap,
};

/** 获取题型地图 */
export function getCampaignMap(topicId: string): CampaignMap | null {
  return CAMPAIGN_MAPS[topicId] ?? null;
}

/** 获取关卡定义 */
export function getCampaignLevel(topicId: string, levelId: string) {
  const map = getCampaignMap(topicId);
  if (!map) return null;
  for (const stage of map.stages) {
    for (const lane of stage.lanes) {
      for (const level of lane.levels) {
        if (level.levelId === levelId) return level;
      }
    }
  }
  return null;
}

/** 获取所有关卡 ID（按地图顺序） */
export function getAllLevelIds(topicId: string): string[] {
  const map = getCampaignMap(topicId);
  if (!map) return [];
  const ids: string[] = [];
  for (const stage of map.stages) {
    for (const lane of stage.lanes) {
      for (const level of lane.levels) {
        ids.push(level.levelId);
      }
    }
  }
  return ids;
}

/** 判断某题型的闯关是否全部完成（含 Boss 关）*/
export function isCampaignFullyCompleted(topicId: string, completedLevelIds: Set<string>): boolean {
  const map = getCampaignMap(topicId);
  if (!map) return false;
  return getAllLevelIds(topicId).every(id => completedLevelIds.has(id));
}
