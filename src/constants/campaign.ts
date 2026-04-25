// src/constants/campaign.ts
//
// 闯关分段总设计（ISSUE-057 范围扩张后的全面重构，2026-04-17）
// ==============================================================
// 设计理念：
//   - 普通关：按单个或若干个同类知识点聚焦（必有 subtypeFilter）
//   - Boss 关：综合性检验（无 subtypeFilter）
//   - A01/A04/A08 两档（TOPIC_STAR_CAP=3）：S1 档1 / S2 档2 / S3 Boss
//   - 其余五题型三档（TOPIC_STAR_CAP=5）：S1 低档 / S2 中档 / S3 高档 / S4 Boss
// 生成器内部难度分档（对应 filter 归属）：
//   A01  d≤5 纯算术；d≥6 运算顺序+拆分技巧
//   A02  d≤5 低档；6-7 中档；d≥8 高档
//   A03  d≤5 低档（仅整数）；6-7 中档（引入小数）；d≥8 高档（扩倍/近似）
//   A04  d≤5 律的认识；d≥6 律的深化
//   A05  d≤5 小数基础性质；6-7 移位/规律；d≥8 循环/反直觉
//   A06  d≤5 去括号；6-7 添括号/除法性质；d≥8 嵌套/错误诊断
//   A07  d≤5 基础简便；6-7 变换辨析；d≥8 综合诊断
//   A08  d≤5 基础移项；d≥6 双向移项+T1-T4陷阱

import type { CampaignMap } from '@/types/gamification';

// ─── A01 基础计算（2 档） ───
const mentalArithmeticMap: CampaignMap = {
  topicId: 'mental-arithmetic',
  stages: [
    {
      stageId: 'mental-arithmetic-S1',
      stageLabel: '档1·纯算术口算',
      isBoss: false,
      lanes: [
        {
          laneId: 'mental-arithmetic-S1-LA',
          laneLabel: '加减主路',
          subtypeFilter: ['add', 'sub'],
          levels: [
            { levelId: 'mental-arithmetic-S1-LA-L1', difficulty: 2, questionCount: 10 },
            { levelId: 'mental-arithmetic-S1-LA-L3', difficulty: 4, questionCount: 15 },
          ],
        },
        {
          laneId: 'mental-arithmetic-S1-LB',
          laneLabel: '乘除支路',
          subtypeFilter: ['mul', 'div'],
          levels: [
            { levelId: 'mental-arithmetic-S1-LB-L1', difficulty: 3, questionCount: 12 },
            { levelId: 'mental-arithmetic-S1-LB-L2', difficulty: 4, questionCount: 15 },
          ],
        },
      ],
    },
    {
      stageId: 'mental-arithmetic-S2',
      stageLabel: '档2·运算顺序与口算陷阱',
      isBoss: false,
      lanes: [
        {
          laneId: 'mental-arithmetic-S2-LA',
          laneLabel: '运算顺序',
          subtypeFilter: ['order'],
          levels: [
            { levelId: 'mental-arithmetic-S2-LA-L1', difficulty: 6, questionCount: 15 },
            { levelId: 'mental-arithmetic-S2-LA-L3', difficulty: 8, questionCount: 20 },
          ],
        },
        {
          laneId: 'mental-arithmetic-S2-LB',
          laneLabel: '口算拆分技巧',
          subtypeFilter: ['mul', 'div'],
          levels: [
            { levelId: 'mental-arithmetic-S2-LB-L1', difficulty: 6, questionCount: 15 },
            { levelId: 'mental-arithmetic-S2-LB-L2', difficulty: 7, questionCount: 18 },
          ],
        },
      ],
    },
    {
      stageId: 'mental-arithmetic-S3',
      stageLabel: 'Boss战',
      isBoss: true,
      lanes: [
        {
          laneId: 'mental-arithmetic-S3-LA',
          laneLabel: 'Boss关',
          levels: [
            { levelId: 'mental-arithmetic-S3-LA-L1', difficulty: 9, questionCount: 25 },
          ],
        },
      ],
    },
  ],
};

// ─── A02 数感估算（3 档） ───
const numberSenseMap: CampaignMap = {
  topicId: 'number-sense',
  stages: [
    {
      stageId: 'number-sense-S1',
      stageLabel: '低档·基础估算与比较',
      isBoss: false,
      lanes: [
        {
          laneId: 'number-sense-S1-LA',
          laneLabel: '估算',
          subtypeFilter: ['estimate'],
          levels: [
            { levelId: 'number-sense-S1-LA-L1', difficulty: 2, questionCount: 10 },
            { levelId: 'number-sense-S1-LA-L2', difficulty: 3, questionCount: 12 },
          ],
        },
        {
          laneId: 'number-sense-S1-LB',
          laneLabel: '比较大小',
          subtypeFilter: ['compare'],
          levels: [
            { levelId: 'number-sense-S1-LB-L1', difficulty: 2, questionCount: 10 },
            { levelId: 'number-sense-S1-LB-L2', difficulty: 3, questionCount: 12 },
          ],
        },
      ],
    },
    {
      stageId: 'number-sense-S2',
      stageLabel: '中档·精确处理',
      isBoss: false,
      lanes: [
        {
          laneId: 'number-sense-S2-LA',
          laneLabel: '四舍五入',
          subtypeFilter: ['round'],
          levels: [
            { levelId: 'number-sense-S2-LA-L1', difficulty: 4, questionCount: 12 },
            { levelId: 'number-sense-S2-LA-L2', difficulty: 5, questionCount: 15 },
          ],
        },
        {
          laneId: 'number-sense-S2-LB',
          laneLabel: '去尾进一',
          subtypeFilter: ['floor-ceil'],
          levels: [
            { levelId: 'number-sense-S2-LB-L1', difficulty: 4, questionCount: 12 },
            { levelId: 'number-sense-S2-LB-L2', difficulty: 5, questionCount: 15 },
          ],
        },
        {
          laneId: 'number-sense-S2-LC',
          laneLabel: '逆向推理',
          subtypeFilter: ['reverse-round'],
          levels: [
            { levelId: 'number-sense-S2-LC-L1', difficulty: 5, questionCount: 12 },
            { levelId: 'number-sense-S2-LC-L2', difficulty: 6, questionCount: 15 },
          ],
        },
      ],
    },
    {
      stageId: 'number-sense-S3',
      stageLabel: '高档·深化',
      isBoss: false,
      lanes: [
        {
          laneId: 'number-sense-S3-LA',
          laneLabel: '估算深化',
          subtypeFilter: ['estimate'],
          levels: [
            { levelId: 'number-sense-S3-LA-L1', difficulty: 6, questionCount: 15 },
            { levelId: 'number-sense-S3-LA-L2', difficulty: 7, questionCount: 18 },
          ],
        },
        {
          laneId: 'number-sense-S3-LB',
          laneLabel: '比较深化',
          subtypeFilter: ['compare'],
          levels: [
            { levelId: 'number-sense-S3-LB-L1', difficulty: 7, questionCount: 18 },
            { levelId: 'number-sense-S3-LB-L2', difficulty: 8, questionCount: 20 },
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
            { levelId: 'number-sense-S4-LA-L1', difficulty: 9, questionCount: 25 },
          ],
        },
      ],
    },
  ],
};

// ─── A03 竖式笔算（3 档） ───
const verticalCalcMap: CampaignMap = {
  topicId: 'vertical-calc',
  stages: [
    {
      stageId: 'vertical-calc-S1',
      stageLabel: '低档·整数笔算',
      isBoss: false,
      lanes: [
        {
          laneId: 'vertical-calc-S1-LA',
          laneLabel: '加减',
          subtypeFilter: ['int-add', 'int-sub'],
          levels: [
            { levelId: 'vertical-calc-S1-LA-L1', difficulty: 2, questionCount: 10 },
            { levelId: 'vertical-calc-S1-LA-L3', difficulty: 4, questionCount: 15 },
          ],
        },
        {
          laneId: 'vertical-calc-S1-LB',
          laneLabel: '乘除',
          subtypeFilter: ['int-mul', 'int-div'],
          levels: [
            { levelId: 'vertical-calc-S1-LB-L1', difficulty: 3, questionCount: 12 },
            { levelId: 'vertical-calc-S1-LB-L2', difficulty: 4, questionCount: 15 },
          ],
        },
      ],
    },
    {
      stageId: 'vertical-calc-S2',
      stageLabel: '中档·小数笔算',
      isBoss: false,
      lanes: [
        {
          laneId: 'vertical-calc-S2-LA',
          laneLabel: '小数加减',
          subtypeFilter: ['dec-add-sub'],
          levels: [
            { levelId: 'vertical-calc-S2-LA-L1', difficulty: 6, questionCount: 15 },
          ],
        },
        {
          laneId: 'vertical-calc-S2-LB',
          laneLabel: '小数乘除',
          subtypeFilter: ['dec-mul', 'dec-div'],
          levels: [
            { levelId: 'vertical-calc-S2-LB-L1', difficulty: 6, questionCount: 15 },
            { levelId: 'vertical-calc-S2-LB-L2', difficulty: 7, questionCount: 18 },
          ],
        },
      ],
    },
    {
      stageId: 'vertical-calc-S3',
      stageLabel: '高档·复杂笔算',
      isBoss: false,
      lanes: [
        {
          laneId: 'vertical-calc-S3-LA',
          laneLabel: '大数乘法',
          subtypeFilter: ['int-mul', 'dec-mul'],
          levels: [
            { levelId: 'vertical-calc-S3-LA-L1', difficulty: 7, questionCount: 18 },
            { levelId: 'vertical-calc-S3-LA-L2', difficulty: 8, questionCount: 20 },
          ],
        },
        {
          laneId: 'vertical-calc-S3-LB',
          laneLabel: '除法与近似',
          subtypeFilter: ['dec-div', 'approximate'],
          levels: [
            { levelId: 'vertical-calc-S3-LB-L1', difficulty: 8, questionCount: 20 },
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
            { levelId: 'vertical-calc-S4-LA-L1', difficulty: 9, questionCount: 25 },
          ],
        },
      ],
    },
  ],
};

// ─── A04 运算律（2 档） ───
// Legacy：仅供存档迁移、旧历史数据和内部兼容使用；玩家主链路已断联。
const operationLawsMap: CampaignMap = {
  topicId: 'operation-laws',
  stages: [
    {
      stageId: 'operation-laws-S1',
      stageLabel: '档1·律的认识',
      isBoss: false,
      lanes: [
        {
          laneId: 'operation-laws-S1-LA',
          laneLabel: '律的认识',
          subtypeFilter: ['identify-law', 'structure-blank', 'reverse-blank', 'simple-judge'],
          levels: [
            { levelId: 'operation-laws-S1-LA-L1', difficulty: 2, questionCount: 10 },
            { levelId: 'operation-laws-S1-LA-L3', difficulty: 4, questionCount: 15 },
          ],
        },
      ],
    },
    {
      stageId: 'operation-laws-S2',
      stageLabel: '档2·律的深化辨析',
      isBoss: false,
      lanes: [
        {
          laneId: 'operation-laws-S2-LA',
          laneLabel: '反例与易混',
          subtypeFilter: ['counter-example', 'easy-confuse', 'concept-reverse'],
          levels: [
            { levelId: 'operation-laws-S2-LA-L1', difficulty: 6, questionCount: 15 },
            { levelId: 'operation-laws-S2-LA-L2', difficulty: 7, questionCount: 18 },
          ],
        },
        {
          laneId: 'operation-laws-S2-LB',
          laneLabel: '陷阱与诊断',
          subtypeFilter: ['compound-law', 'distributive-trap', 'error-diagnose'],
          levels: [
            { levelId: 'operation-laws-S2-LB-L1', difficulty: 7, questionCount: 18 },
            { levelId: 'operation-laws-S2-LB-L2', difficulty: 8, questionCount: 20 },
          ],
        },
      ],
    },
    {
      stageId: 'operation-laws-S3',
      stageLabel: 'Boss战',
      isBoss: true,
      lanes: [
        {
          laneId: 'operation-laws-S3-LA',
          laneLabel: 'Boss关',
          levels: [
            { levelId: 'operation-laws-S3-LA-L1', difficulty: 9, questionCount: 25 },
          ],
        },
      ],
    },
  ],
};

// ─── A05 小数性质与规律（3 档） ───
const decimalOpsMap: CampaignMap = {
  topicId: 'decimal-ops',
  stages: [
    {
      stageId: 'decimal-ops-S1',
      stageLabel: '低档·小数基础',
      isBoss: false,
      lanes: [
        {
          laneId: 'decimal-ops-S1-LA',
          laneLabel: '位值与互换',
          subtypeFilter: ['add-sub'],
          levels: [
            { levelId: 'decimal-ops-S1-LA-L1', difficulty: 2, questionCount: 10 },
            { levelId: 'decimal-ops-S1-LA-L2', difficulty: 3, questionCount: 12 },
          ],
        },
        {
          laneId: 'decimal-ops-S1-LB',
          laneLabel: '简单移位',
          subtypeFilter: ['mul', 'div'],
          levels: [
            { levelId: 'decimal-ops-S1-LB-L1', difficulty: 3, questionCount: 12 },
            { levelId: 'decimal-ops-S1-LB-L2', difficulty: 4, questionCount: 15 },
          ],
        },
      ],
    },
    {
      stageId: 'decimal-ops-S2',
      stageLabel: '中档·性质与规律',
      isBoss: false,
      lanes: [
        {
          laneId: 'decimal-ops-S2-LA',
          laneLabel: '位数与移位',
          subtypeFilter: ['mul', 'div', 'shift'],
          levels: [
            { levelId: 'decimal-ops-S2-LA-L1', difficulty: 6, questionCount: 15 },
            { levelId: 'decimal-ops-S2-LA-L2', difficulty: 7, questionCount: 18 },
          ],
        },
        {
          laneId: 'decimal-ops-S2-LB',
          laneLabel: '反直觉与比较',
          subtypeFilter: ['compare', 'trap'],
          levels: [
            { levelId: 'decimal-ops-S2-LB-L1', difficulty: 6, questionCount: 15 },
            { levelId: 'decimal-ops-S2-LB-L2', difficulty: 7, questionCount: 18 },
          ],
        },
      ],
    },
    {
      stageId: 'decimal-ops-S3',
      stageLabel: '高档·循环与反直觉',
      isBoss: false,
      lanes: [
        {
          laneId: 'decimal-ops-S3-LA',
          laneLabel: '循环小数',
          subtypeFilter: ['div', 'cyclic-div'],
          levels: [
            { levelId: 'decimal-ops-S3-LA-L1', difficulty: 7, questionCount: 18 },
            { levelId: 'decimal-ops-S3-LA-L2', difficulty: 8, questionCount: 20 },
          ],
        },
        {
          laneId: 'decimal-ops-S3-LB',
          laneLabel: '反直觉性质',
          subtypeFilter: ['mul', 'trap', 'compare'],
          levels: [
            { levelId: 'decimal-ops-S3-LB-L1', difficulty: 8, questionCount: 20 },
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
            { levelId: 'decimal-ops-S4-LA-L1', difficulty: 9, questionCount: 25 },
          ],
        },
      ],
    },
  ],
};

// ─── A06 括号变换（3 档） ───
// Legacy：仅供存档迁移、旧历史数据和内部兼容使用；玩家主链路已断联。
const bracketOpsMap: CampaignMap = {
  topicId: 'bracket-ops',
  stages: [
    {
      stageId: 'bracket-ops-S1',
      stageLabel: '低档·去括号',
      isBoss: false,
      lanes: [
        {
          laneId: 'bracket-ops-S1-LA',
          laneLabel: '去括号',
          subtypeFilter: ['remove-bracket-plus', 'remove-bracket-minus'],
          levels: [
            { levelId: 'bracket-ops-S1-LA-L1', difficulty: 3, questionCount: 12 },
            { levelId: 'bracket-ops-S1-LA-L3', difficulty: 5, questionCount: 18 },
          ],
        },
      ],
    },
    {
      stageId: 'bracket-ops-S2',
      stageLabel: '中档·添括号与除法性质',
      isBoss: false,
      lanes: [
        {
          laneId: 'bracket-ops-S2-LA',
          laneLabel: '添括号',
          subtypeFilter: ['add-bracket'],
          levels: [
            { levelId: 'bracket-ops-S2-LA-L1', difficulty: 6, questionCount: 15 },
            { levelId: 'bracket-ops-S2-LA-L2', difficulty: 7, questionCount: 18 },
          ],
        },
        {
          laneId: 'bracket-ops-S2-LB',
          laneLabel: '除法性质',
          subtypeFilter: ['division-property'],
          levels: [
            { levelId: 'bracket-ops-S2-LB-L1', difficulty: 6, questionCount: 15 },
          ],
        },
      ],
    },
    {
      stageId: 'bracket-ops-S3',
      stageLabel: '高档·括号深化',
      isBoss: false,
      lanes: [
        {
          laneId: 'bracket-ops-S3-LA',
          laneLabel: '嵌套与变号',
          subtypeFilter: ['nested-bracket', 'four-items-sign'],
          levels: [
            { levelId: 'bracket-ops-S3-LA-L1', difficulty: 7, questionCount: 18 },
            { levelId: 'bracket-ops-S3-LA-L2', difficulty: 8, questionCount: 20 },
          ],
        },
        {
          laneId: 'bracket-ops-S3-LB',
          laneLabel: '错误诊断',
          subtypeFilter: ['error-diagnose'],
          levels: [
            { levelId: 'bracket-ops-S3-LB-L1', difficulty: 8, questionCount: 20 },
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
            { levelId: 'bracket-ops-S4-LA-L1', difficulty: 9, questionCount: 25 },
          ],
        },
      ],
    },
  ],
};

// ─── A07 简便计算（3 档） ───
const multiStepMap: CampaignMap = {
  topicId: 'multi-step',
  stages: [
    {
      stageId: 'multi-step-S1',
      stageLabel: '低档·前置知识与基础应用',
      isBoss: false,
      lanes: [
        {
          laneId: 'multi-step-S1-LA',
          laneLabel: '运算律',
          subtypeFilter: [
            'law-identify',
            'law-simple-judge',
            'law-structure-blank',
            'law-reverse-blank',
            'law-counter-example',
            'law-concept-reverse',
            'law-easy-confuse',
            'law-compound-law',
            'law-distributive-trap',
            'law-error-diagnose',
          ],
          levels: [
            { levelId: 'multi-step-S1-LA-L1', difficulty: 2, questionCount: 10 },
            { levelId: 'multi-step-S1-LA-L2', difficulty: 5, questionCount: 12 },
          ],
        },
        {
          laneId: 'multi-step-S1-LB',
          laneLabel: '括号变换',
          subtypeFilter: [
            'bracket-remove-plus',
            'bracket-remove-minus',
            'bracket-add',
            'bracket-division-property',
            'bracket-four-items-sign',
            'bracket-error-diagnose',
          ],
          levels: [
            { levelId: 'multi-step-S1-LB-L1', difficulty: 2, questionCount: 10 },
            { levelId: 'multi-step-S1-LB-L2', difficulty: 5, questionCount: 12 },
          ],
        },
        {
          laneId: 'multi-step-S1-LC',
          laneLabel: '基础简便应用',
          subtypeFilter: ['bracket-normal', 'extract-factor', 'decimal-two-step'],
          levels: [
            { levelId: 'multi-step-S1-LC-L1', difficulty: 2, questionCount: 10 },
            { levelId: 'multi-step-S1-LC-L2', difficulty: 3, questionCount: 12 },
          ],
        },
      ],
    },
    {
      stageId: 'multi-step-S2',
      stageLabel: '中档·变换与辨析',
      isBoss: false,
      lanes: [
        {
          laneId: 'multi-step-S2-LA',
          laneLabel: '辨析与因数',
          subtypeFilter: ['bracket-hard', 'extract-factor'],
          levels: [
            { levelId: 'multi-step-S2-LA-L1', difficulty: 6, questionCount: 15 },
            { levelId: 'multi-step-S2-LA-L2', difficulty: 7, questionCount: 18 },
          ],
        },
        {
          laneId: 'multi-step-S2-LB',
          laneLabel: '方法选择',
          subtypeFilter: ['decimal-two-step'],
          levels: [
            { levelId: 'multi-step-S2-LB-L1', difficulty: 6, questionCount: 15 },
            { levelId: 'multi-step-S2-LB-L2', difficulty: 7, questionCount: 18 },
          ],
        },
        {
          laneId: 'multi-step-S2-LC',
          laneLabel: '变号陷阱',
          subtypeFilter: ['simplify-subtract'],
          levels: [
            { levelId: 'multi-step-S2-LC-L1', difficulty: 7, questionCount: 18 },
          ],
        },
      ],
    },
    {
      stageId: 'multi-step-S3',
      stageLabel: '高档·综合诊断',
      isBoss: false,
      lanes: [
        {
          laneId: 'multi-step-S3-LA',
          laneLabel: '错误诊断',
          subtypeFilter: ['bracket-demon'],
          levels: [
            { levelId: 'multi-step-S3-LA-L1', difficulty: 7, questionCount: 18 },
            { levelId: 'multi-step-S3-LA-L2', difficulty: 8, questionCount: 20 },
          ],
        },
        {
          laneId: 'multi-step-S3-LB',
          laneLabel: '隐藏因数与串联',
          subtypeFilter: ['extract-factor', 'decimal-multi-step', 'decimal-chain'],
          levels: [
            { levelId: 'multi-step-S3-LB-L1', difficulty: 8, questionCount: 20 },
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
            { levelId: 'multi-step-S4-LA-L1', difficulty: 9, questionCount: 25 },
          ],
        },
      ],
    },
  ],
};

// ─── A08 方程移项（2 档） ───
const equationTransposeMap: CampaignMap = {
  topicId: 'equation-transpose',
  stages: [
    {
      stageId: 'equation-transpose-S1',
      stageLabel: '档1·基础移项',
      isBoss: false,
      lanes: [
        {
          laneId: 'equation-transpose-S1-LA',
          laneLabel: '常数移项',
          subtypeFilter: ['move-constant'],
          levels: [
            { levelId: 'equation-transpose-S1-LA-L1', difficulty: 2, questionCount: 10 },
            { levelId: 'equation-transpose-S1-LA-L2', difficulty: 3, questionCount: 12 },
          ],
        },
        {
          laneId: 'equation-transpose-S1-LB',
          laneLabel: '系数与概念',
          subtypeFilter: ['move-from-linear', 'solve-after-transpose', 'equation-concept'],
          levels: [
            { levelId: 'equation-transpose-S1-LB-L1', difficulty: 3, questionCount: 12 },
            { levelId: 'equation-transpose-S1-LB-L2', difficulty: 4, questionCount: 15 },
          ],
        },
      ],
    },
    {
      stageId: 'equation-transpose-S2',
      stageLabel: '档2·双向移项与陷阱',
      isBoss: false,
      lanes: [
        {
          laneId: 'equation-transpose-S2-LA',
          laneLabel: '双向移项',
          subtypeFilter: ['move-both-sides', 'move-from-linear'],
          levels: [
            { levelId: 'equation-transpose-S2-LA-L1', difficulty: 6, questionCount: 15 },
            { levelId: 'equation-transpose-S2-LA-L2', difficulty: 7, questionCount: 18 },
          ],
        },
        {
          laneId: 'equation-transpose-S2-LB',
          laneLabel: '括号与诊断',
          subtypeFilter: ['bracket-equation', 'error-diagnose', 'solve-after-transpose', 'division-equation'],
          levels: [
            { levelId: 'equation-transpose-S2-LB-L1', difficulty: 7, questionCount: 18 },
            { levelId: 'equation-transpose-S2-LB-L2', difficulty: 8, questionCount: 20 },
          ],
        },
      ],
    },
    {
      stageId: 'equation-transpose-S3',
      stageLabel: 'Boss战',
      isBoss: true,
      lanes: [
        {
          laneId: 'equation-transpose-S3-LA',
          laneLabel: 'Boss关',
          levels: [
            { levelId: 'equation-transpose-S3-LA-L1', difficulty: 9, questionCount: 25 },
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

/** 获取关卡所在路线的 subtypeFilter */
export function getSubtypeFilter(topicId: string, levelId: string): string[] | undefined {
  const map = getCampaignMap(topicId);
  if (!map) return undefined;
  for (const stage of map.stages) {
    for (const lane of stage.lanes) {
      for (const level of lane.levels) {
        if (level.levelId === levelId) return lane.subtypeFilter;
      }
    }
  }
  return undefined;
}

/** 判断某题型的闯关是否全部完成（含 Boss 关）*/
export function isCampaignFullyCompleted(topicId: string, completedLevelIds: Set<string>): boolean {
  const map = getCampaignMap(topicId);
  if (!map) return false;
  return getAllLevelIds(topicId).every(id => completedLevelIds.has(id));
}
