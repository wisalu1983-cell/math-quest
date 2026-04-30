import {
  AlertTriangle,
  ClipboardList,
  Keyboard,
  ListChecks,
  MonitorSmartphone,
  MousePointer2,
  RotateCcw,
  Wand2,
} from 'lucide-react';
import { Fragment, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import PracticeMathKeyboard from '@/pages/PracticeMathKeyboard';
import {
  DECIMAL_KEYS,
  DIGIT_KEYS,
  sanitizeDecimalInput,
  sanitizeDigitInput,
  sanitizeSingleDigitInput,
} from '@/pages/practice-math-keyboard';
import type { MathInputSlot } from '@/pages/practice-math-keyboard';

type ScenarioId =
  | 'integer-remainder'
  | 'middle-zero'
  | 'decimal-dividend'
  | 'decimal-divisor'
  | 'approximation'
  | 'cyclic';

type GuidanceMode = 'medium' | 'high';
type DecimalDivisorVariant = 'integer' | 'fractional';

type FieldKind =
  | 'training'
  | 'setup-divisor'
  | 'setup-dividend'
  | 'quotient'
  | 'product'
  | 'remainder'
  | 'next'
  | 'result';

interface FieldSpec {
  id: string;
  kind: FieldKind;
  label: string;
  expected: string;
  helper?: string;
  allowDecimal?: boolean;
  maxLength?: number;
}

interface TrainingField {
  label: string;
  expected: string;
  suffix?: string;
  allowDecimal?: boolean;
}

interface ResultField {
  label: string;
  expected: string;
  helper?: string;
  allowDecimal?: boolean;
}

interface ConversionSetupFields {
  divisorExpected: string;
  dividendExpected: string;
  dividendDisplay?: string;
  mediumHint: string;
}

interface LongDivisionRound {
  current: string;
  sourceLabel: string;
  quotientDigit: string;
  product: string;
  remainder: string;
  nextPartialDividend?: string;
  bringLabel?: string;
  terminalNote?: string;
}

interface BoardModel {
  dividendDisplay: string;
  divisorDisplay: string;
  rounds: LongDivisionRound[];
  quotientStartColumn: number;
  quotientDecimalAfter: number | null;
  boardColumnCount: number;
}

interface Scenario {
  id: ScenarioId;
  title: string;
  shortTitle: string;
  badge: string;
  prompt: string;
  expression: string;
  coreExpression: string;
  dividendDisplay?: string;
  quotientStartColumn?: number;
  quotientDecimalAfter?: number;
  boardColumnCount?: number;
  quotientPreview: string;
  decimalHint?: string;
  focus: string;
  trainingFields?: TrainingField[];
  setupFields?: ConversionSetupFields;
  rounds: LongDivisionRound[];
  resultFields?: ResultField[];
  feedbackCategories: string[];
  structuredMistakes: Array<{ label: string; userValue: string; expectedValue: string }>;
  reviewNotes: string[];
}

const scenarios: Scenario[] = [
  {
    id: 'integer-remainder',
    title: '整数除法 · 多次余数传递',
    shortTitle: '整数多轮',
    badge: 'D2',
    prompt: '用竖式计算，每一步都要写完整',
    expression: '936 ÷ 4',
    coreExpression: '936 ÷ 4',
    quotientStartColumn: 0,
    quotientPreview: '234',
    focus: '低档主力样本，训练“商、乘、减、比、落”的完整轮次。',
    rounds: [
      {
        current: '9',
        sourceLabel: '先看 9',
        quotientDigit: '2',
        product: '8',
        remainder: '1',
        nextPartialDividend: '13',
        bringLabel: '落下 3',
      },
      {
        current: '13',
        sourceLabel: '上一轮新工作数',
        quotientDigit: '3',
        product: '12',
        remainder: '1',
        nextPartialDividend: '16',
        bringLabel: '落下 6',
      },
      {
        current: '16',
        sourceLabel: '上一轮新工作数',
        quotientDigit: '4',
        product: '16',
        remainder: '0',
        terminalNote: '余数为 0，本题结束',
      },
    ],
    feedbackCategories: ['商位判断错误', '乘积填写错误', '落位后新工作数错误'],
    structuredMistakes: [],
    reviewNotes: [
      '历史轮次保留在同一板内，当前轮用高亮和自动滚动保证可见。',
      '“比”只作为系统校验节点，不让学生额外填写。',
    ],
  },
  {
    id: 'middle-zero',
    title: '整数除法 · 商中间 0',
    shortTitle: '商中 0',
    badge: 'D3',
    prompt: '遇到不够除时，商位要补 0',
    expression: '824 ÷ 4',
    coreExpression: '824 ÷ 4',
    quotientStartColumn: 0,
    quotientPreview: '206',
    focus: '专门暴露“当前数小于除数仍要商 0，再落下一位”的心智。',
    rounds: [
      {
        current: '8',
        sourceLabel: '先看 8',
        quotientDigit: '2',
        product: '8',
        remainder: '0',
        nextPartialDividend: '2',
        bringLabel: '落下 2',
      },
      {
        current: '2',
        sourceLabel: '不够除也要写商位',
        quotientDigit: '0',
        product: '0',
        remainder: '2',
        nextPartialDividend: '24',
        bringLabel: '落下 4',
      },
      {
        current: '24',
        sourceLabel: '上一轮新工作数',
        quotientDigit: '6',
        product: '24',
        remainder: '0',
        terminalNote: '余数为 0，本题结束',
      },
    ],
    feedbackCategories: ['商位补 0 遗漏', '余数大小判断错误'],
    structuredMistakes: [],
    reviewNotes: [
      '第二轮标题直接写明“不够除也要写商位”，降低商中 0 的漏写概率。',
      '这一题应作为移动端截图必测样例。',
    ],
  },
  {
    id: 'decimal-dividend',
    title: '小数 ÷ 整数 · 小数点预置',
    shortTitle: '小数÷整数',
    badge: '小数点',
    prompt: '商的小数点由系统跟随被除数预置',
    expression: '5.76 ÷ 3',
    coreExpression: '576 ÷ 3',
    dividendDisplay: '5.76',
    quotientStartColumn: 0,
    quotientPreview: '1.92',
    decimalHint: '系统预置商的小数点，学生只填数字格。',
    focus: '避免把“小数点位置”变成额外输入负担，核心仍训练长除法过程。',
    rounds: [
      {
        current: '5',
        sourceLabel: '看 5',
        quotientDigit: '1',
        product: '3',
        remainder: '2',
        nextPartialDividend: '27',
        bringLabel: '落下 7',
      },
      {
        current: '27',
        sourceLabel: '小数点后继续除',
        quotientDigit: '9',
        product: '27',
        remainder: '0',
        nextPartialDividend: '6',
        bringLabel: '落下 6',
      },
      {
        current: '6',
        sourceLabel: '最后一位',
        quotientDigit: '2',
        product: '6',
        remainder: '0',
        terminalNote: '除尽，本题结束',
      },
    ],
    feedbackCategories: ['相减余数错误', '落位后新工作数错误'],
    structuredMistakes: [],
    reviewNotes: [
      '商的小数点固定显示，不注册为 MathInputSlot。',
      '键盘仍只开放数字和删除键。',
    ],
  },
  {
    id: 'decimal-divisor',
    title: '小数 ÷ 小数 · 扩倍训练格',
    shortTitle: '小数÷小数',
    badge: '扩倍',
    prompt: '先把除数转成整数，再列竖式',
    expression: '15.6 ÷ 0.24',
    coreExpression: '1560 ÷ 24',
    quotientStartColumn: 2,
    boardColumnCount: 4,
    quotientPreview: '65',
    focus: '先判断扩大的倍数，再在同一区块填写转换后的除数和被除数。',
    trainingFields: [
      { label: '除数扩大', expected: '100', suffix: '倍', allowDecimal: true },
    ],
    setupFields: {
      divisorExpected: '24',
      dividendExpected: '1560',
      mediumHint: '同扩 100 倍，填转换值。',
    },
    rounds: [
      {
        current: '156',
        sourceLabel: '先看 156',
        quotientDigit: '6',
        product: '144',
        remainder: '12',
        nextPartialDividend: '120',
        bringLabel: '落下 0',
      },
      {
        current: '120',
        sourceLabel: '上一轮新工作数',
        quotientDigit: '5',
        product: '120',
        remainder: '0',
        terminalNote: '除尽，本题结束',
      },
    ],
    feedbackCategories: ['乘积填写错误'],
    structuredMistakes: [
      { label: '扩倍倍数错误', userValue: '10', expectedValue: '100' },
      { label: '转换后的被除数错误', userValue: '156', expectedValue: '1560' },
    ],
    reviewNotes: [
      '前置转换区连续填写扩大倍数、转换后除数和转换后被除数。',
      '转换后除数或被除数填错时，先停留在转换区给非泄露式提示，不进入竖式板。',
    ],
  },
  {
    id: 'approximation',
    title: '取近似 · 算到保留位后一位',
    shortTitle: '取近似',
    badge: '保留 2 位',
    prompt: '算到第三位小数，再填写保留两位小数的结果',
    expression: '8.5 ÷ 3（保留两位小数）',
    coreExpression: '85 ÷ 3',
    dividendDisplay: '8.5',
    quotientStartColumn: 0,
    boardColumnCount: 4,
    quotientPreview: '2.833',
    decimalHint: '第 3 位只用于判断进位，不单独做训练格。',
    focus: '长除法过程算到 X+1 位，计算后只填写近似结果。',
    rounds: [
      {
        current: '8',
        sourceLabel: '整数部分',
        quotientDigit: '2',
        product: '6',
        remainder: '2',
        nextPartialDividend: '25',
        bringLabel: '落下 5',
      },
      {
        current: '25',
        sourceLabel: '十分位',
        quotientDigit: '8',
        product: '24',
        remainder: '1',
        nextPartialDividend: '10',
        bringLabel: '补 0',
      },
      {
        current: '10',
        sourceLabel: '百分位',
        quotientDigit: '3',
        product: '9',
        remainder: '1',
        nextPartialDividend: '10',
        bringLabel: '补 0',
      },
      {
        current: '10',
        sourceLabel: '千分位，用于取舍',
        quotientDigit: '3',
        product: '9',
        remainder: '1',
        terminalNote: '已算到保留位后一位',
      },
    ],
    resultFields: [
      { label: '保留两位小数', expected: '2.83', allowDecimal: true, helper: '只填写最终近似结果' },
    ],
    feedbackCategories: ['补 0 后新工作数错误'],
    structuredMistakes: [
      { label: '取近似结果错误', userValue: '2.84', expectedValue: '2.83' },
    ],
    reviewNotes: [
      '第 X+1 位数字由核心板过程产生，不额外再问一次。',
      '结果格放在核心板完成后，避免学生先猜最终答案。',
    ],
  },
  {
    id: 'cyclic',
    title: '循环小数 · 非循环部分 + 循环节',
    shortTitle: '循环小数',
    badge: '循环节',
    prompt: '识别重复余数后，填写循环小数结构',
    expression: '14 ÷ 135',
    coreExpression: '14.0000000 ÷ 135',
    dividendDisplay: '14',
    quotientStartColumn: 0,
    quotientDecimalAfter: 0,
    boardColumnCount: 8,
    quotientPreview: '0.1037',
    decimalHint: '极限样例：展示串 8 字符，循环节 3 位，竖式中至少出现 2 次。',
    focus: '删除复杂的“重复余数位置”字段，只保留学生最需要表达的结果结构。',
    rounds: [
      {
        current: '14',
        sourceLabel: '整数部分不够除',
        quotientDigit: '0',
        product: '0',
        remainder: '14',
        nextPartialDividend: '140',
        bringLabel: '补 0',
      },
      {
        current: '140',
        sourceLabel: '十分位为非循环部分',
        quotientDigit: '1',
        product: '135',
        remainder: '5',
        nextPartialDividend: '50',
        bringLabel: '补 0',
      },
      {
        current: '50',
        sourceLabel: '循环节第 1 位',
        quotientDigit: '0',
        product: '0',
        remainder: '50',
        nextPartialDividend: '500',
        bringLabel: '补 0',
      },
      {
        current: '500',
        sourceLabel: '循环节第 2 位',
        quotientDigit: '3',
        product: '405',
        remainder: '95',
        nextPartialDividend: '950',
        bringLabel: '补 0',
      },
      {
        current: '950',
        sourceLabel: '循环节第 3 位',
        quotientDigit: '7',
        product: '945',
        remainder: '5',
        nextPartialDividend: '50',
        bringLabel: '补 0',
      },
      {
        current: '50',
        sourceLabel: '循环节第二次出现',
        quotientDigit: '0',
        product: '0',
        remainder: '50',
        nextPartialDividend: '500',
        bringLabel: '补 0',
      },
      {
        current: '500',
        sourceLabel: '循环节第二次第 2 位',
        quotientDigit: '3',
        product: '405',
        remainder: '95',
        nextPartialDividend: '950',
        bringLabel: '补 0',
      },
      {
        current: '950',
        sourceLabel: '循环节第二次写完',
        quotientDigit: '7',
        product: '945',
        remainder: '5',
        terminalNote: '循环节 037 已出现 2 次',
      },
    ],
    resultFields: [
      { label: '非循环部分', expected: '0.1', allowDecimal: true, helper: '包含整数部分和小数点' },
      { label: '循环节', expected: '037', helper: '用最短重复片段填写' },
    ],
    feedbackCategories: ['余数大小判断错误'],
    structuredMistakes: [
      { label: '循环节错误', userValue: '37', expectedValue: '037' },
    ],
    reviewNotes: [
      '竖式板至少写到循环节第二次出现，再进入循环结构结果格。',
      '后置结构化字段展示明细，便于定位错误位置。',
    ],
  },
];

const decimalDivisorFractionalScenario: Scenario = {
  id: 'decimal-divisor',
  title: '小数 ÷ 小数 · 扩倍训练格',
  shortTitle: '小数÷小数',
  badge: '仍小数',
  prompt: '除数转整数，被除数小数点固定显示',
  expression: '1.234 ÷ 0.04',
  coreExpression: '123.4 ÷ 4',
  quotientStartColumn: 1,
  quotientDecimalAfter: 2,
  boardColumnCount: 5,
  quotientPreview: '30.85',
  focus: '验证转换后被除数仍带小数时，转换区可输入小数点，竖式板据此生成。',
  trainingFields: [
    { label: '除数扩大', expected: '100', suffix: '倍', allowDecimal: true },
  ],
  setupFields: {
    divisorExpected: '4',
    dividendExpected: '1234',
    dividendDisplay: '123.4',
    mediumHint: '同扩 100 倍，填转换值。',
  },
  rounds: [
    {
      current: '12',
      sourceLabel: '先看 12',
      quotientDigit: '3',
      product: '12',
      remainder: '0',
      nextPartialDividend: '3',
      bringLabel: '落下 3',
    },
    {
      current: '3',
      sourceLabel: '不够除也要写商位',
      quotientDigit: '0',
      product: '0',
      remainder: '3',
      nextPartialDividend: '34',
      bringLabel: '落下 4',
    },
    {
      current: '34',
      sourceLabel: '小数点后继续除',
      quotientDigit: '8',
      product: '32',
      remainder: '2',
      nextPartialDividend: '20',
      bringLabel: '补 0',
    },
    {
      current: '20',
      sourceLabel: '补 0 后继续除',
      quotientDigit: '5',
      product: '20',
      remainder: '0',
      terminalNote: '除尽，本题结束',
    },
  ],
  feedbackCategories: ['商位补 0 遗漏', '补 0 后新工作数错误'],
  structuredMistakes: [
    { label: '扩倍倍数错误', userValue: '10', expectedValue: '100' },
    { label: '转换后的被除数错误', userValue: '1234', expectedValue: '123.4' },
  ],
  reviewNotes: [
    '转换后的被除数允许仍带小数点；竖式板按输入值固定小数点列。',
    '转换值填错先在转换区提示并停住，不直接泄露正确值。',
  ],
};

const BASE_BOARD_FONT_PX = 16;
const KEYBOARD_RESERVED_REM = 14.5;
const COMPACT_FIELD_INPUT_REM = 6.75;
const REGULAR_FIELD_INPUT_REM = 7.5;

type BoardLayoutProfile = {
  id: 'comfortable' | 'font-compact' | 'gap-compact' | 'rail-compact' | 'edge-compact';
  label: string;
  minFontPx: number;
  digitCellRem: number;
  digitCellHeightRem: number;
  digitGapRem: number;
  decimalGapRem: number;
  dividerTrackRem: number;
  divisorTrackRem?: number;
  ellipsisTrackRem: number;
  paperPaddingRem: number;
  innerPaddingXRem: number;
  innerPaddingYRem: number;
};

const BOARD_LAYOUT_PROFILES: BoardLayoutProfile[] = [
  {
    id: 'comfortable',
    label: '舒展',
    minFontPx: 14,
    digitCellRem: 2.2,
    digitCellHeightRem: 2.2,
    digitGapRem: 0.65,
    decimalGapRem: 1.05,
    dividerTrackRem: 0.95,
    ellipsisTrackRem: 1.25,
    paperPaddingRem: 0.75,
    innerPaddingXRem: 0.75,
    innerPaddingYRem: 0.75,
  },
  {
    id: 'font-compact',
    label: '字号压缩',
    minFontPx: 12,
    digitCellRem: 2.2,
    digitCellHeightRem: 2.2,
    digitGapRem: 0.65,
    decimalGapRem: 1.05,
    dividerTrackRem: 0.95,
    ellipsisTrackRem: 1.25,
    paperPaddingRem: 0.75,
    innerPaddingXRem: 0.75,
    innerPaddingYRem: 0.75,
  },
  {
    id: 'gap-compact',
    label: '间距压缩',
    minFontPx: 12,
    digitCellRem: 2.15,
    digitCellHeightRem: 2.2,
    digitGapRem: 0.38,
    decimalGapRem: 0.55,
    dividerTrackRem: 0.78,
    ellipsisTrackRem: 1,
    paperPaddingRem: 0.6,
    innerPaddingXRem: 0.55,
    innerPaddingYRem: 0.65,
  },
  {
    id: 'rail-compact',
    label: '除号区压缩',
    minFontPx: 12,
    digitCellRem: 2.05,
    digitCellHeightRem: 2.18,
    digitGapRem: 0.31,
    decimalGapRem: 0.45,
    dividerTrackRem: 0.68,
    divisorTrackRem: 4.55,
    ellipsisTrackRem: 0.85,
    paperPaddingRem: 0.48,
    innerPaddingXRem: 0.45,
    innerPaddingYRem: 0.6,
  },
  {
    id: 'edge-compact',
    label: '边界压缩',
    minFontPx: 12,
    digitCellRem: 1.88,
    digitCellHeightRem: 2.12,
    digitGapRem: 0.22,
    decimalGapRem: 0.33,
    dividerTrackRem: 0.58,
    divisorTrackRem: 4.05,
    ellipsisTrackRem: 0.68,
    paperPaddingRem: 0.28,
    innerPaddingXRem: 0.3,
    innerPaddingYRem: 0.55,
  },
];

const scenarioById = new Map(scenarios.map(scenario => [scenario.id, scenario]));

function roundFieldId(scenarioId: ScenarioId, index: number, kind: 'quotient' | 'product' | 'remainder' | 'next') {
  return `${scenarioId}:round-${index}:${kind}`;
}

function trainingFieldId(scenarioId: ScenarioId, index: number) {
  return `${scenarioId}:training-${index}`;
}

function setupFieldId(scenarioId: ScenarioId, kind: 'setup-divisor' | 'setup-dividend') {
  return `${scenarioId}:${kind}`;
}

function resultFieldId(scenarioId: ScenarioId, index: number) {
  return `${scenarioId}:result-${index}`;
}

function isCoreBoardField(field: FieldSpec) {
  return (
    field.kind === 'quotient' ||
    field.kind === 'product' ||
    field.kind === 'remainder' ||
    field.kind === 'next'
  );
}

function digitSlotId(fieldId: string, index: number) {
  return `${fieldId}:digit-${index}`;
}

function parseDigitSlotId(slotId: string) {
  const match = /^(.*):digit-(\d+)$/.exec(slotId);
  if (!match) return null;
  return { fieldId: match[1], digitIndex: Number(match[2]) };
}

function buildFields(scenario: Scenario, boardRounds: LongDivisionRound[], includeBoardFields: boolean): FieldSpec[] {
  const training = scenario.trainingFields?.map((field, index) => ({
    id: trainingFieldId(scenario.id, index),
    kind: 'training' as const,
    label: field.label,
    expected: field.expected,
    helper: field.suffix,
    allowDecimal: field.allowDecimal,
  })) ?? [];

  const setup = scenario.setupFields
    ? [
        {
          id: setupFieldId(scenario.id, 'setup-divisor'),
          kind: 'setup-divisor' as const,
          label: '转换后除数',
          expected: scenario.setupFields.divisorExpected,
          allowDecimal: true,
          maxLength: Math.max(scenario.setupFields.divisorExpected.length + 3, 4),
        },
        {
          id: setupFieldId(scenario.id, 'setup-dividend'),
          kind: 'setup-dividend' as const,
          label: '转换后被除数',
          expected: scenario.setupFields.dividendDisplay ?? scenario.setupFields.dividendExpected,
          allowDecimal: true,
          maxLength: Math.max((scenario.setupFields.dividendDisplay ?? scenario.setupFields.dividendExpected).length + 3, 4),
        },
      ]
    : [];

  const roundFields = includeBoardFields ? boardRounds.flatMap((round, index) => {
    const fields: FieldSpec[] = [
      {
        id: roundFieldId(scenario.id, index, 'quotient'),
        kind: 'quotient',
        label: `第 ${index + 1} 轮商位`,
        expected: round.quotientDigit,
      },
      {
        id: roundFieldId(scenario.id, index, 'product'),
        kind: 'product',
        label: `第 ${index + 1} 轮乘积`,
        expected: round.product,
      },
    ];
    if (round.nextPartialDividend) {
      fields.push({
        id: roundFieldId(scenario.id, index, 'next'),
        kind: 'next',
        label: `第 ${index + 1} 轮余数与落位`,
        expected: round.nextPartialDividend,
      });
    } else {
      fields.push({
        id: roundFieldId(scenario.id, index, 'remainder'),
        kind: 'remainder',
        label: `第 ${index + 1} 轮最终余数`,
        expected: round.remainder,
      });
    }
    return fields;
  }) : [];

  const result = scenario.resultFields?.map((field, index) => ({
    id: resultFieldId(scenario.id, index),
    kind: 'result' as const,
    label: field.label,
    expected: field.expected,
    helper: field.helper,
    allowDecimal: field.allowDecimal,
  })) ?? [];

  return [...training, ...setup, ...roundFields, ...result];
}

function statusClass(status: 'idle' | 'correct' | 'wrong', active: boolean) {
  if (status === 'correct') return 'border-success bg-success-lt text-success';
  if (status === 'wrong') return 'border-danger bg-danger-lt text-danger animate-shake';
  if (active) return 'border-primary bg-primary-lt text-primary ring-2 ring-primary/25';
  return 'border-border bg-card text-text hover:border-primary/50';
}

function renderRecurringDecimalAnswer(nonRepeating: string, repeating: string) {
  const prefix = nonRepeating || '□';
  const cycleDigits = repeating ? repeating.split('') : ['□'];
  const ariaLabel = repeating
    ? `标准格式答数：${prefix}，循环节${repeating}`
    : `标准格式答数：${prefix}，循环节未填写`;

  return (
    <span
      data-cyclic-answer-preview="true"
      aria-label={ariaLabel}
      aria-live="polite"
      className="inline-flex items-end text-lg font-black leading-none text-primary tabular-nums"
    >
      <span>{prefix}</span>
      <span className="inline-flex items-end" aria-hidden="true">
        {cycleDigits.map((digit, index) => {
          const shouldDot = repeating.length <= 1
            ? index === 0
            : index === 0 || index === cycleDigits.length - 1;
          return (
            <span key={`${digit}-${index}`} className="relative inline-flex min-w-[0.58em] justify-center pt-2">
              {shouldDot && (
                <span
                  data-cyclic-dot="true"
                  className="absolute left-1/2 top-0 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-primary"
                />
              )}
              {digit}
            </span>
          );
        })}
      </span>
    </span>
  );
}

function normalize(value: string) {
  return value.trim().replace(/\s/g, '').replace(/^0+(?=\d)/, '');
}

function normalizeDecimalNumber(value: string) {
  const cleaned = value.trim().replace(/\s/g, '');
  if (!/^\d+(?:\.\d+)?$/.test(cleaned)) return null;
  const [whole = '0', fraction = ''] = cleaned.split('.');
  const normalizedWhole = whole.replace(/^0+(?=\d)/, '') || '0';
  const normalizedFraction = fraction.replace(/0+$/g, '');
  return normalizedFraction ? `${normalizedWhole}.${normalizedFraction}` : normalizedWhole;
}

function normalizeComparableValue(value: string) {
  return normalizeDecimalNumber(value) ?? normalize(value);
}

function fieldValueMatches(field: FieldSpec, value: string) {
  if (field.allowDecimal || field.kind === 'setup-divisor' || field.kind === 'setup-dividend') {
    return normalizeComparableValue(value) === normalizeComparableValue(field.expected);
  }
  return normalize(value) === normalize(field.expected);
}

function feedbackSummaryForFields(fields: FieldSpec[]) {
  const hasProcess = fields.some(field => isCoreBoardField(field));
  const hasStructured = fields.some(field => !isCoreBoardField(field));
  if (hasProcess && hasStructured) return '本题未通过：竖式过程和结构化字段都有误。';
  if (hasProcess) return '本题未通过：竖式过程有误。';
  if (fields.some(field => field.kind === 'training' || field.kind === 'setup-divisor' || field.kind === 'setup-dividend')) {
    return '本题未通过：扩倍结果有误。';
  }
  if (fields.some(field => field.kind === 'result')) return '本题未通过：结果表达有误。';
  return '本题未通过：存在错误答题项。';
}

function splitExpression(expression: string) {
  const [dividend = expression, divisor = ''] = expression.split(' ÷ ');
  return { dividend, divisor };
}

function decimalAfterColumn(value: string) {
  if (!value.includes('.')) return null;
  return value.split('.')[0].replace(/\D/g, '').length - 1;
}

function hasFilledExpectedLength(value: string, expected: string) {
  return normalize(value).length >= normalize(expected).length;
}

function hasFilledComparableConversionValue(value: string, expected: string) {
  const normalizedValue = normalize(value);
  const normalizedExpected = normalize(expected);
  if (!normalizedValue) return false;
  const valueDigits = normalizedValue.replace(/\D/g, '').length;
  const expectedDigits = normalizedExpected.replace(/\D/g, '').length;
  if (valueDigits >= expectedDigits) return true;
  return normalizedValue.length >= normalizedExpected.length;
}

function normalizeConvertedDecimal(value: string) {
  return normalizeDecimalNumber(value);
}

function isIntegerValue(value: string) {
  const normalized = normalizeDecimalNumber(value);
  return Boolean(normalized && !normalized.includes('.'));
}

function shouldAutoAdvanceField(field: FieldSpec, value: string) {
  if (field.kind === 'setup-divisor' && !isIntegerValue(value)) return false;
  return hasFilledExpectedLength(value, field.expected);
}

function buildBoardModelFromInput(dividendValue: string, divisorValue: string): BoardModel | null {
  const dividendDisplay = normalizeConvertedDecimal(dividendValue);
  if (!dividendDisplay) return null;
  const divisorDisplay = normalizeDecimalNumber(divisorValue);
  if (!divisorDisplay || divisorDisplay.includes('.')) return null;
  const divisor = Number(divisorDisplay);
  if (!Number.isInteger(divisor) || divisor <= 0) return null;

  const digits = dividendDisplay.replace(/[^\d]/g, '').split('');
  if (digits.length === 0) return null;
  const integerDigitCount = dividendDisplay.includes('.')
    ? dividendDisplay.split('.')[0].replace(/\D/g, '').length
    : digits.length;
  const dividendHasDecimal = dividendDisplay.includes('.');
  const extendedDigits = [...digits];
  const rounds: LongDivisionRound[] = [];
  const maxRounds = Math.max(6, digits.length + 3);
  let quotientStartColumn = 0;
  let started = false;
  let current = '';
  let remainder = 0;
  let column = 0;

  while (rounds.length < maxRounds) {
    if (column >= extendedDigits.length) extendedDigits.push('0');

    if (!started) {
      current += extendedDigits[column];
      const currentNumber = Number(current);
      const reachedOnesColumn = column >= Math.max(0, integerDigitCount - 1);
      if (currentNumber < divisor && !reachedOnesColumn) {
        column += 1;
        continue;
      }
      started = true;
      quotientStartColumn = column;
    } else {
      current = `${remainder > 0 ? remainder : ''}${extendedDigits[column]}` || '0';
    }

    const currentNumber = Number(current);
    const quotientDigit = Math.floor(currentNumber / divisor);
    const product = quotientDigit * divisor;
    remainder = currentNumber - product;

    let nextPartialDividend: string | undefined;
    if (remainder !== 0 || column + 1 < extendedDigits.length) {
      if (column + 1 >= extendedDigits.length) extendedDigits.push('0');
      const nextDigit = extendedDigits[column + 1] ?? '0';
      nextPartialDividend = remainder > 0 ? `${remainder}${nextDigit}` : nextDigit;
    }

    rounds.push({
      current,
      sourceLabel: rounds.length === 0 ? `先看 ${current}` : '上一轮新工作数',
      quotientDigit: String(quotientDigit),
      product: String(product),
      remainder: String(remainder),
      nextPartialDividend,
      bringLabel: nextPartialDividend ? `落下 ${extendedDigits[column + 1] ?? '0'}` : undefined,
      terminalNote: nextPartialDividend ? undefined : '除尽，本题结束',
    });

    if (!nextPartialDividend) break;
    column += 1;
  }

  if (rounds.length === 0) return null;

  const quotientDecimalAfter = dividendHasDecimal || extendedDigits.length > digits.length
    ? integerDigitCount - 1
    : null;
  const boardColumnCount = Math.max(
    extendedDigits.length,
    quotientStartColumn + rounds.length,
    quotientDecimalAfter == null ? 0 : quotientDecimalAfter + 2,
  );

  return {
    dividendDisplay,
    divisorDisplay,
    rounds,
    quotientStartColumn,
    quotientDecimalAfter,
    boardColumnCount,
  };
}

function replaceAtLeastOne(values: Record<string, string>, fields: FieldSpec[], kind: FieldKind, nextValue: string) {
  const target = fields.find(field => field.kind === kind);
  if (!target) return false;
  values[target.id] = nextValue;
  return true;
}

interface LongDivisionUiReviewPreviewProps {
  formal?: boolean;
}

export default function LongDivisionUiReviewPreview({ formal = false }: LongDivisionUiReviewPreviewProps = {}) {
  const [scenarioId, setScenarioId] = useState<ScenarioId>('integer-remainder');
  const [guidanceMode, setGuidanceMode] = useState<GuidanceMode>('medium');
  const [decimalDivisorVariant, setDecimalDivisorVariant] = useState<DecimalDivisorVariant>('integer');
  const [conversionSubmitted, setConversionSubmitted] = useState(false);
  const [conversionConfirmed, setConversionConfirmed] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const [activeSlotId, setActiveSlotId] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [boardMetrics, setBoardMetrics] = useState({ width: 0, height: 0, scale: 1 });
  const [boardLayoutIndex, setBoardLayoutIndex] = useState(0);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const feedbackRef = useRef<HTMLElement | null>(null);
  const boardViewportRef = useRef<HTMLDivElement | null>(null);
  const boardPaperRef = useRef<HTMLDivElement | null>(null);

  const baseScenario = scenarioById.get(scenarioId) ?? scenarios[0];
  const scenario = baseScenario.id === 'decimal-divisor' && decimalDivisorVariant === 'fractional'
    ? decimalDivisorFractionalScenario
    : baseScenario;
  const isDecimalDivisorScenario = baseScenario.id === 'decimal-divisor';
  const setupScaleFieldId = trainingFieldId(scenario.id, 0);
  const setupDivisorFieldId = setupFieldId(scenario.id, 'setup-divisor');
  const setupDividendFieldId = setupFieldId(scenario.id, 'setup-dividend');
  const expectedSetupDividend = scenario.setupFields?.dividendDisplay ?? scenario.setupFields?.dividendExpected ?? '';
  const setupScaleHasValue = normalize(values[setupScaleFieldId] ?? '').length > 0;
  const setupDivisorHasValue = normalize(values[setupDivisorFieldId] ?? '').length > 0;
  const setupDividendHasValue = normalize(values[setupDividendFieldId] ?? '').length > 0;
  const setupTrainingFilled = Boolean(
    scenario.setupFields &&
    setupScaleHasValue,
  );
  const setupTrainingReady = Boolean(
    scenario.setupFields &&
    normalizeComparableValue(values[setupScaleFieldId] ?? '') === normalizeComparableValue(scenario.trainingFields?.[0]?.expected ?? ''),
  );
  const setupValuesComplete = Boolean(
    scenario.setupFields &&
    setupTrainingFilled &&
    setupDivisorHasValue &&
    setupDividendHasValue,
  );
  const setupDivisorFormatError = Boolean(
    scenario.setupFields &&
    setupTrainingFilled &&
    values[setupDivisorFieldId] &&
    !isIntegerValue(values[setupDivisorFieldId] ?? ''),
  );
  const setupDivisorValueError = Boolean(
    scenario.setupFields &&
    setupTrainingReady &&
    !setupDivisorFormatError &&
    hasFilledExpectedLength(values[setupDivisorFieldId] ?? '', scenario.setupFields.divisorExpected) &&
    normalizeComparableValue(values[setupDivisorFieldId] ?? '') !== normalizeComparableValue(scenario.setupFields.divisorExpected),
  );
  const setupDividendValueError = Boolean(
    scenario.setupFields &&
    setupTrainingReady &&
    hasFilledComparableConversionValue(values[setupDividendFieldId] ?? '', expectedSetupDividend) &&
    normalizeComparableValue(values[setupDividendFieldId] ?? '') !== normalizeComparableValue(expectedSetupDividend),
  );
  const setupConversionValueError = setupDivisorValueError || setupDividendValueError;
  const dynamicBoardModel = useMemo(() => (
    scenario.setupFields && setupValuesComplete && !setupDivisorFormatError && !setupConversionValueError
      ? buildBoardModelFromInput(values[setupDividendFieldId] ?? '', values[setupDivisorFieldId] ?? '')
      : null
  ), [
    setupConversionValueError,
    scenario.setupFields,
    setupDivisorFormatError,
    setupDividendFieldId,
    setupDivisorFieldId,
    setupValuesComplete,
    values,
  ]);
  const activeBoardRounds = dynamicBoardModel?.rounds ?? scenario.rounds;
  const canRenderBoard = !scenario.setupFields || (conversionConfirmed && Boolean(dynamicBoardModel));
  const fields = useMemo(
    () => buildFields(scenario, activeBoardRounds, canRenderBoard),
    [activeBoardRounds, canRenderBoard, scenario],
  );
  const fieldById = useMemo(() => new Map(fields.map(field => [field.id, field])), [fields]);
  const inputSlotSpecs = useMemo(() => fields.flatMap(field => (
    isCoreBoardField(field)
      ? Array.from({ length: field.expected.length }, (_, digitIndex) => ({
          id: digitSlotId(field.id, digitIndex),
          field,
          digitIndex,
        }))
      : [{ id: field.id, field, digitIndex: null as number | null }]
  )), [fields]);
  const orderedInputIds = useMemo(() => inputSlotSpecs.map(spec => spec.id), [inputSlotSpecs]);
  const { dividend: coreDividend, divisor: staticDivisor } = splitExpression(scenario.coreExpression);
  const dividendDisplay = scenario.dividendDisplay ?? coreDividend;
  const boardDividendDisplay = dynamicBoardModel?.dividendDisplay ?? dividendDisplay;
  const divisor = dynamicBoardModel?.divisorDisplay ?? staticDivisor;
  const dividendDigits = boardDividendDisplay.replace(/[^\d]/g, '').split('');
  const dividendDecimalAfter = decimalAfterColumn(boardDividendDisplay);
  const setupDivisorField = scenario.setupFields
    ? fieldById.get(setupDivisorFieldId)
    : null;
  const setupDividendField = scenario.setupFields
    ? fieldById.get(setupDividendFieldId)
    : null;
  const setupScaleField = scenario.setupFields
    ? fieldById.get(setupScaleFieldId)
    : null;
  const conversionFields = useMemo(() => (
    [setupScaleField, setupDivisorField, setupDividendField]
      .filter((field): field is FieldSpec => Boolean(field))
  ), [setupDividendField, setupDivisorField, setupScaleField]);
  const conversionWrongFields = useMemo(() => (
    conversionFields.filter(field => !fieldValueMatches(field, values[field.id] ?? ''))
  ), [conversionFields, values]);
  const conversionHasError = Boolean(
    scenario.setupFields &&
    setupValuesComplete &&
    (setupDivisorFormatError || conversionWrongFields.length > 0),
  );
  const showSetupHint = Boolean(
    scenario.setupFields &&
    setupTrainingReady &&
    guidanceMode === 'medium' &&
    !conversionSubmitted,
  );
  const quotientStartColumn = dynamicBoardModel?.quotientStartColumn ?? scenario.quotientStartColumn ?? 0;
  const decimalGapAfterColumn = dynamicBoardModel?.quotientDecimalAfter ?? scenario.quotientDecimalAfter ?? dividendDecimalAfter;
  const boardColumnCount = Math.max(
    dynamicBoardModel?.boardColumnCount ?? scenario.boardColumnCount ?? 0,
    dividendDigits.length,
    quotientStartColumn + activeBoardRounds.length,
    decimalGapAfterColumn == null ? 0 : decimalGapAfterColumn + 2,
  );
  const boardLayout = BOARD_LAYOUT_PROFILES[boardLayoutIndex] ?? BOARD_LAYOUT_PROFILES[0];
  const minBoardScale = boardLayout.minFontPx / BASE_BOARD_FONT_PX;

  useEffect(() => {
    if (activeSlotId && orderedInputIds.includes(activeSlotId)) return;
    const focusTimer = window.setTimeout(() => {
      setActiveSlotId(orderedInputIds[0] ?? null);
    }, 0);
    return () => window.clearTimeout(focusTimer);
  }, [activeSlotId, orderedInputIds]);

  useEffect(() => {
    if (!activeSlotId || showFeedback) return;
    const field = fieldById.get(parseDigitSlotId(activeSlotId)?.fieldId ?? activeSlotId);
    if (!field || field.kind !== 'setup-dividend') return;
    if (!hasFilledComparableConversionValue(values[field.id] ?? '', field.expected)) return;
    const currentIndex = orderedInputIds.indexOf(activeSlotId);
    const nextId = orderedInputIds[currentIndex + 1];
    if (!nextId) return;
    const advanceTimer = window.setTimeout(() => {
      setActiveSlotId(nextId);
    }, 0);
    return () => window.clearTimeout(advanceTimer);
  }, [activeSlotId, fieldById, orderedInputIds, showFeedback, values]);

  useEffect(() => {
    if (!activeSlotId) return;
    if (showFeedback) return;
    if (window.innerWidth <= 768) return;
    window.setTimeout(() => {
      const target = inputRefs.current[activeSlotId];
      if (!target || document.activeElement === target) return;
      target.focus({ preventScroll: true });
    }, 0);
  }, [activeSlotId, showFeedback]);

  useEffect(() => {
    if (!activeSlotId) return;
    if (showFeedback) return;
    if (window.innerWidth > 768) return;
    window.setTimeout(() => {
      inputRefs.current[activeSlotId]?.scrollIntoView({ block: 'center', inline: 'nearest' });
    }, 0);
  }, [activeSlotId, showFeedback]);

  useEffect(() => {
    if (!showFeedback) return;
    window.setTimeout(() => {
      feedbackRef.current?.scrollIntoView({ block: 'center', inline: 'nearest' });
    }, 0);
  }, [showFeedback]);

  useLayoutEffect(() => {
    const updateBoardScale = () => {
      const viewport = boardViewportRef.current;
      const paper = boardPaperRef.current;
      if (!viewport || !paper) return;

      const rootFontPx = Number.parseFloat(window.getComputedStyle(document.documentElement).fontSize) || BASE_BOARD_FONT_PX;
      const keyboardReservePx = showFeedback ? 0 : KEYBOARD_RESERVED_REM * rootFontPx;
      const viewportRect = viewport.getBoundingClientRect();
      const naturalWidth = paper.scrollWidth;
      const naturalHeight = paper.scrollHeight;
      const availableWidth = Math.max(1, viewport.clientWidth - 8);
      const availableHeight = window.innerWidth <= 768
        ? Math.max(220, window.innerHeight - keyboardReservePx - viewportRect.top - 16)
        : Number.POSITIVE_INFINITY;
      const fitScale = Math.min(1, availableWidth / naturalWidth, availableHeight / naturalHeight);
      if (fitScale + 0.005 < minBoardScale && boardLayoutIndex < BOARD_LAYOUT_PROFILES.length - 1) {
        setBoardLayoutIndex(previous => Math.min(previous + 1, BOARD_LAYOUT_PROFILES.length - 1));
        return;
      }
      const nextScale = Math.max(minBoardScale, Math.min(1, fitScale));

      setBoardMetrics(previous => {
        if (
          Math.abs(previous.width - naturalWidth) < 1 &&
          Math.abs(previous.height - naturalHeight) < 1 &&
          Math.abs(previous.scale - nextScale) < 0.005
        ) {
          return previous;
        }
        return { width: naturalWidth, height: naturalHeight, scale: nextScale };
      });
    };

    const animationFrame = window.requestAnimationFrame(updateBoardScale);
    const resizeObserver = new ResizeObserver(updateBoardScale);
    if (boardViewportRef.current) resizeObserver.observe(boardViewportRef.current);
    if (boardPaperRef.current) resizeObserver.observe(boardPaperRef.current);
    window.addEventListener('resize', updateBoardScale);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateBoardScale);
    };
  }, [
    activeBoardRounds.length,
    boardLayoutIndex,
    boardLayout.minFontPx,
    canRenderBoard,
    minBoardScale,
    scenario.id,
    setupTrainingReady,
    showFeedback,
  ]);

  const isConversionField = (field: FieldSpec) => (
    Boolean(scenario.setupFields) &&
    (field.kind === 'training' || field.kind === 'setup-divisor' || field.kind === 'setup-dividend')
  );

  const setFieldValue = (field: FieldSpec, next: string) => {
    setValues(prev => ({ ...prev, [field.id]: next }));
    setSubmitted(false);
    if (isConversionField(field)) {
      setConversionSubmitted(false);
      setConversionConfirmed(false);
      setShowFeedback(false);
    }
  };

  const updateField = (field: FieldSpec, raw: string) => {
    const sanitizer = field.allowDecimal ? sanitizeDecimalInput : sanitizeDigitInput;
    const previous = values[field.id] ?? '';
    const next = sanitizer(raw, previous);
    setFieldValue(field, next);
    if (shouldAutoAdvanceField(field, next)) {
      const currentIndex = orderedInputIds.indexOf(field.id);
      const nextId = orderedInputIds[currentIndex + 1];
      if (nextId) setActiveSlotId(nextId);
    }
  };

  const updateFieldDigit = (field: FieldSpec, digitIndex: number, raw: string) => {
    const nextDigit = sanitizeSingleDigitInput(raw);
    setValues(prev => {
      const chars = (prev[field.id] ?? '').padEnd(field.expected.length, ' ').split('');
      chars[digitIndex] = nextDigit || ' ';
      return { ...prev, [field.id]: chars.join('').trimEnd() };
    });
    setSubmitted(false);
    if (nextDigit) {
      const currentId = digitSlotId(field.id, digitIndex);
      const currentIndex = orderedInputIds.indexOf(currentId);
      const nextId = orderedInputIds[currentIndex + 1];
      if (nextId) setActiveSlotId(nextId);
    }
  };

  const moveFocus = (currentId: string, shiftKey: boolean) => {
    const currentIndex = orderedInputIds.indexOf(currentId);
    if (currentIndex < 0) return;
    const nextId = orderedInputIds[currentIndex + (shiftKey ? -1 : 1)];
    if (nextId) setActiveSlotId(nextId);
  };

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>, field: FieldSpec) => {
    if (event.key !== 'Tab') return;
    event.preventDefault();
    moveFocus(field.id, event.shiftKey);
  };

  const buildExpectedFields = () => {
    if (!scenario.setupFields) return fields;
    const expectedModel = buildBoardModelFromInput(expectedSetupDividend, scenario.setupFields.divisorExpected);
    return buildFields(scenario, expectedModel?.rounds ?? scenario.rounds, Boolean(expectedModel));
  };

  const resetBoardLayout = () => {
    setBoardLayoutIndex(0);
    setBoardMetrics({ width: 0, height: 0, scale: 1 });
  };

  const fillExpected = () => {
    resetBoardLayout();
    const expectedFields = buildExpectedFields();
    setValues(Object.fromEntries(expectedFields.map(field => [field.id, field.expected])));
    setSubmitted(false);
    setShowFeedback(false);
    setConversionSubmitted(false);
    setConversionConfirmed(Boolean(scenario.setupFields));
  };

  const fillMistake = () => {
    resetBoardLayout();
    const expectedFields = buildExpectedFields();
    const next = Object.fromEntries(expectedFields.map(field => [field.id, field.expected]));
    const changedTraining = replaceAtLeastOne(next, expectedFields, 'training', '10');
    const changedSetup = replaceAtLeastOne(next, expectedFields, 'setup-divisor', '5');
    const changedProduct = replaceAtLeastOne(next, expectedFields, 'product', '0');
    const changedResult = replaceAtLeastOne(next, expectedFields, 'result', scenario.id === 'approximation' ? '2.84' : '66');
    if (!changedTraining && !changedSetup && !changedProduct && !changedResult && expectedFields[0]) {
      next[expectedFields[0].id] = expectedFields[0].expected === '0' ? '1' : '0';
    }
    setValues(next);
    setSubmitted(true);
    setShowFeedback(true);
    setConversionSubmitted(Boolean(scenario.setupFields));
    setConversionConfirmed(false);
  };

  const reset = () => {
    resetBoardLayout();
    setValues({});
    setSubmitted(false);
    setShowFeedback(false);
    setConversionSubmitted(false);
    setConversionConfirmed(false);
    setActiveSlotId(inputSlotSpecs[0]?.id ?? null);
  };

  const selectScenario = (nextScenarioId: ScenarioId) => {
    resetBoardLayout();
    setScenarioId(nextScenarioId);
    if (nextScenarioId === 'decimal-divisor') setDecimalDivisorVariant('integer');
    setValues({});
    setSubmitted(false);
    setShowFeedback(false);
    setConversionSubmitted(false);
    setConversionConfirmed(false);
    setActiveSlotId(null);
  };

  const selectDecimalDivisorVariant = (variant: DecimalDivisorVariant) => {
    resetBoardLayout();
    setDecimalDivisorVariant(variant);
    setValues({});
    setSubmitted(false);
    setShowFeedback(false);
    setConversionSubmitted(false);
    setConversionConfirmed(false);
    setActiveSlotId(null);
  };

  const slots: MathInputSlot[] = inputSlotSpecs.map(spec => {
    const { field, digitIndex } = spec;
    if (digitIndex != null) {
      return {
        id: spec.id,
        label: `${field.label}第 ${digitIndex + 1} 位`,
        value: (values[field.id] ?? '').padEnd(field.expected.length, ' ')[digitIndex]?.trim() ?? '',
        maxLength: 1,
        enabledKeys: DIGIT_KEYS,
        sanitizeInput: sanitizeSingleDigitInput,
        setValue: next => updateFieldDigit(field, digitIndex, next),
        shouldAutoAdvance: ({ nextValue }) => nextValue.trim().length >= 1,
      };
    }

    return {
      id: spec.id,
      label: field.label,
      value: values[field.id] ?? '',
      maxLength: field.maxLength ?? Math.max(field.expected.length, 1),
      enabledKeys: field.allowDecimal ? DECIMAL_KEYS : DIGIT_KEYS,
      sanitizeInput: field.allowDecimal ? sanitizeDecimalInput : sanitizeDigitInput,
      setValue: next => setFieldValue(field, next),
      shouldAutoAdvance: ({ nextValue }) => shouldAutoAdvanceField(field, nextValue),
    };
  });

  const collectWrongFields = () => fields.filter(field => !fieldValueMatches(field, values[field.id] ?? ''));
  const wrongFields = submitted ? collectWrongFields() : [];
  const processFeedbackCategories = wrongFields
    .filter(field => isCoreBoardField(field))
    .map(field => `${field.label}错误`);
  const structuredFeedbackMistakes = wrongFields
    .filter(field => !isCoreBoardField(field))
    .map(field => ({
      label: `${field.label}错误`,
      userValue: values[field.id] || '空',
      expectedValue: field.expected,
    }));
  const feedbackSummary = feedbackSummaryForFields(wrongFields);
  const allFilled = fields.every(field => {
    const normalizedValue = normalize(values[field.id] ?? '');
    return normalizedValue.length >= normalize(field.expected).length;
  });
  const isConversionPhase = Boolean(scenario.setupFields && !conversionConfirmed);
  const canConfirmConversion = Boolean(scenario.setupFields && setupValuesComplete);
  const canSubmitAnswer = allFilled && canRenderBoard;
  const primaryActionDisabled = isConversionPhase ? !canConfirmConversion : !canSubmitAnswer;
  const activeField = activeSlotId
    ? fieldById.get(parseDigitSlotId(activeSlotId)?.fieldId ?? activeSlotId)
    : null;
  const activeInputIndex = activeSlotId ? orderedInputIds.indexOf(activeSlotId) : -1;
  const fieldFirstInputIndex = useMemo(() => {
    const next = new Map<string, number>();
    inputSlotSpecs.forEach((slot, index) => {
      if (!next.has(slot.field.id)) next.set(slot.field.id, index);
    });
    return next;
  }, [inputSlotSpecs]);
  const shouldRevealField = (fieldId: string) => {
    const firstInputIndex = fieldFirstInputIndex.get(fieldId);
    const hasValue = normalize(values[fieldId] ?? '').length > 0;
    if (submitted || hasValue) return true;
    if (firstInputIndex == null) return false;
    if (activeInputIndex < 0) return firstInputIndex === 0;
    return firstInputIndex <= activeInputIndex;
  };
  const anyQuotientRevealed = activeBoardRounds.some((_, index) => (
    shouldRevealField(roundFieldId(scenario.id, index, 'quotient'))
  ));
  const lastQuotientFieldId = roundFieldId(scenario.id, activeBoardRounds.length - 1, 'quotient');
  const continuationMarkerVisible = scenario.id === 'cyclic' && shouldRevealField(lastQuotientFieldId);
  const visibleResultFields = scenario.resultFields?.map((field, index) => ({
    field,
    spec: fieldById.get(resultFieldId(scenario.id, index)),
  })).filter(item => item.spec && shouldRevealField(item.spec.id)) ?? [];
  const cyclicNonRepeatingFieldId = resultFieldId(scenario.id, 0);
  const cyclicRepeatingFieldId = resultFieldId(scenario.id, 1);
  const cyclicNonRepeatingValue = (values[cyclicNonRepeatingFieldId] ?? '').trim().replace(/\s/g, '');
  const cyclicRepeatingValue = (values[cyclicRepeatingFieldId] ?? '').trim().replace(/\s/g, '');
  const cyclicAnswerPreview = scenario.id === 'cyclic'
    ? { nonRepeating: cyclicNonRepeatingValue, repeating: cyclicRepeatingValue }
    : null;
  const showTrainingPanel = Boolean(scenario.trainingFields && (!formal || !conversionConfirmed));
  const conversionProcessHints = useMemo(() => {
    if (!scenario.setupFields || submitted || !conversionSubmitted) return [];
    return conversionFields.flatMap(field => {
      if (!field) return [];
      const value = normalize(values[field.id] ?? '');
      if (field.kind === 'setup-divisor' && !isIntegerValue(value)) return [];
      if (!value || fieldValueMatches(field, value)) return [];
      return [{
        id: field.id,
        text: field.kind === 'training'
          ? '扩倍倍数填写有误'
          : field.kind === 'setup-divisor'
            ? '转换后除数填写有误'
            : '转换后被除数填写有误',
      }];
    });
  }, [
    conversionFields,
    conversionSubmitted,
    scenario.setupFields,
    submitted,
    values,
  ]);

  const handleConfirmConversion = () => {
    if (!scenario.setupFields) return;
    setConversionSubmitted(true);
    if (conversionHasError) {
      setConversionConfirmed(false);
      if (guidanceMode === 'high') {
        setSubmitted(true);
        setShowFeedback(true);
        setActiveSlotId(null);
        return;
      }
      setSubmitted(false);
      setShowFeedback(false);
      setActiveSlotId(conversionWrongFields[0]?.id ?? setupDivisorFieldId);
      return;
    }

    const nextModel = buildBoardModelFromInput(values[setupDividendFieldId] ?? '', values[setupDivisorFieldId] ?? '');
    if (!nextModel) return;
    resetBoardLayout();
    setSubmitted(false);
    setShowFeedback(false);
    setConversionConfirmed(true);
    setActiveSlotId(digitSlotId(roundFieldId(scenario.id, 0, 'quotient'), 0));
  };

  const handleSubmitAnswer = () => {
    const nextWrongFields = collectWrongFields();
    setSubmitted(true);
    setShowFeedback(nextWrongFields.length > 0);
  };

  const renderInput = (field: FieldSpec, compact = false) => {
    const value = values[field.id] ?? '';
    const status = !submitted
      ? 'idle'
      : fieldValueMatches(field, value)
        ? 'correct'
        : 'wrong';
    return (
      <input
        key={field.id}
        ref={node => { inputRefs.current[field.id] = node; }}
        data-active-slot={activeSlotId === field.id ? 'true' : undefined}
        value={value}
        inputMode={field.allowDecimal ? 'decimal' : 'numeric'}
        aria-label={field.label}
        onChange={event => updateField(field, event.target.value)}
        onKeyDown={event => handleInputKeyDown(event, field)}
        onFocus={() => setActiveSlotId(field.id)}
        style={{
          width: `${compact ? COMPACT_FIELD_INPUT_REM : REGULAR_FIELD_INPUT_REM}rem`,
        }}
        className={`${compact ? 'h-10 px-2 text-lg' : 'h-11 px-3 text-xl'} rounded-lg border-2 text-center font-black outline-none transition-all ${statusClass(status, activeSlotId === field.id)}`}
      />
    );
  };

  const renderDigitCell = (field: FieldSpec, digitIndex: number) => {
    const slotId = digitSlotId(field.id, digitIndex);
    const value = (values[field.id] ?? '').padEnd(field.expected.length, ' ')[digitIndex]?.trim() ?? '';
    const expectedDigit = field.expected[digitIndex] ?? '';
    const status = !submitted
      ? 'idle'
      : value === expectedDigit
        ? 'correct'
        : 'wrong';

    return (
      <input
        key={slotId}
        ref={node => { inputRefs.current[slotId] = node; }}
        data-active-slot={activeSlotId === slotId ? 'true' : undefined}
        value={value}
        inputMode="numeric"
        aria-label={`${field.label}第 ${digitIndex + 1} 位`}
        onChange={event => updateFieldDigit(field, digitIndex, event.target.value)}
        onKeyDown={event => {
          if (event.key !== 'Tab') return;
          event.preventDefault();
          moveFocus(slotId, event.shiftKey);
        }}
        onFocus={() => setActiveSlotId(slotId)}
        style={{
          width: `${boardLayout.digitCellRem}rem`,
          height: `${boardLayout.digitCellHeightRem}rem`,
        }}
        className={`rounded-lg border-2 text-center text-base font-black outline-none transition-all ${statusClass(status, activeSlotId === slotId)}`}
      />
    );
  };

  const renderDigitCells = (fieldId: string) => {
    const field = fieldById.get(fieldId);
    if (!field) return null;
    return (
      <div
        className="grid"
        style={{
          columnGap: `${boardLayout.digitGapRem}rem`,
          gridTemplateColumns: `repeat(${field.expected.length}, ${boardLayout.digitCellRem}rem)`,
        }}
      >
        {Array.from({ length: field.expected.length }).map((_, digitIndex) => (
          renderDigitCell(field, digitIndex)
        ))}
      </div>
    );
  };

  const naturalDivisorTrackRem = Math.max(
    boardLayout.digitCellRem,
    divisor.length * boardLayout.digitCellRem + Math.max(0, divisor.length - 1) * boardLayout.digitGapRem,
  );
  const divisorTrackRem = boardLayout.divisorTrackRem ?? naturalDivisorTrackRem;

  const digitTracks = Array.from({ length: boardColumnCount }).flatMap((_, index) => {
    const tracks = [`${boardLayout.digitCellRem}rem`];
    if (index < boardColumnCount - 1) {
      tracks.push(`${index === decimalGapAfterColumn ? boardLayout.decimalGapRem : boardLayout.digitGapRem}rem`);
    }
    return tracks;
  });
  if (continuationMarkerVisible) {
    digitTracks.push('0rem', `${boardLayout.ellipsisTrackRem}rem`);
  }

  const boardGridStyle = {
    gridTemplateColumns: `${divisorTrackRem}rem ${boardLayout.digitGapRem}rem ${boardLayout.dividerTrackRem}rem ${boardLayout.digitGapRem}rem ${digitTracks.join(' ')}`,
    justifyContent: 'center',
  };

  const digitStartLine = (column: number) => 5 + column * 2;
  const digitEndLine = (column: number) => digitStartLine(column) + 1;
  const gridColumn = (start: number, end: number) => `${digitStartLine(start)} / ${digitEndLine(end)}`;
  const decimalGapColumn = (column: number) => `${digitEndLine(column)} / ${digitEndLine(column) + 1}`;

  const valuePosition = (value: string, endColumn: number) => {
    const length = Math.max(value.length, 1);
    const end = Math.min(boardColumnCount - 1, Math.max(0, endColumn));
    const start = Math.max(0, end - length + 1);
    return { start, end };
  };

  const renderQuotientDecimalPoint = () => {
    const quotientDecimalAfter = decimalGapAfterColumn;
    if (quotientDecimalAfter == null) return null;
    return (
      <span
        className="pointer-events-none z-10 self-center text-2xl font-black leading-none text-danger"
        style={{
          gridColumn: decimalGapColumn(quotientDecimalAfter),
          gridRow: '1',
          justifySelf: 'center',
        }}
      >
        .
      </span>
    );
  };

  const renderDividendDecimalPoint = () => {
    if (dividendDecimalAfter == null) return null;
    return (
      <span
        className="pointer-events-none z-10 self-center text-2xl font-black leading-none text-danger"
        style={{
          gridColumn: decimalGapColumn(dividendDecimalAfter),
          gridRow: '1',
          justifySelf: 'center',
        }}
      >
        .
      </span>
    );
  };

  const renderQuotientRow = () => (
    <div className="relative grid min-h-12 items-center" style={boardGridStyle}>
      {activeBoardRounds.map((_, index) => {
        const fieldId = roundFieldId(scenario.id, index, 'quotient');
        if (!shouldRevealField(fieldId)) return null;
        return (
          <div
            key={`quotient-${index}`}
            className="flex items-center justify-center"
            style={{ gridColumn: gridColumn(quotientStartColumn + index, quotientStartColumn + index), gridRow: '1' }}
          >
            {renderDigitCells(fieldId)}
          </div>
        );
      })}
      {anyQuotientRevealed && renderQuotientDecimalPoint()}
      {continuationMarkerVisible && (
        <div
          className="flex h-10 items-center justify-center text-2xl font-black text-text-2"
          style={{ gridColumn: gridColumn(quotientStartColumn + activeBoardRounds.length, quotientStartColumn + activeBoardRounds.length), gridRow: '1' }}
        >
          ...
        </div>
      )}
    </div>
  );

  const renderDividendRow = () => (
    <div className="relative grid items-stretch bg-card py-1" style={boardGridStyle}>
      <div
        className="flex h-14 items-center justify-center text-2xl font-black text-text"
        style={{ gridColumn: '1 / 2', gridRow: '1' }}
      >
        {divisor}
      </div>
      <div
        className="relative h-14 overflow-visible"
        style={{ gridColumn: '3 / 4', gridRow: '1' }}
      >
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute top-0 h-full text-text"
          style={{ left: '0.02rem', width: '0.78rem' }}
          viewBox="0 0 14 64"
          preserveAspectRatio="none"
        >
          <path
            d="M4 1 C12 12 12 52 4 63"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="2"
          />
        </svg>
      </div>
      <div
        className="pointer-events-none self-start border-t-2 border-text"
        style={{ gridColumn: gridColumn(0, boardColumnCount - 1), gridRow: '1' }}
      />
      {Array.from({ length: boardColumnCount }).map((_, index) => (
        <div
          key={index}
          className="relative flex h-12 items-center justify-center self-center text-2xl font-black text-text"
          style={{ gridColumn: gridColumn(index, index), gridRow: '1' }}
        >
          {dividendDigits[index] ?? ''}
        </div>
      ))}
      {renderDividendDecimalPoint()}
    </div>
  );

  const renderPositionedField = (fieldId: string, start: number, end: number) => {
    const field = fieldById.get(fieldId);
    if (!field) return null;
    if (isCoreBoardField(field)) {
      return (
        <>
          {Array.from({ length: field.expected.length }).map((_, digitIndex) => (
            <div
              key={`${field.id}-${digitIndex}`}
              className="flex items-center justify-center"
              style={{ gridColumn: gridColumn(start + digitIndex, start + digitIndex) }}
            >
              {renderDigitCell(field, digitIndex)}
            </div>
          ))}
        </>
      );
    }
    return (
      <div className="flex items-center justify-center" style={{ gridColumn: gridColumn(start, end) }}>
        {renderInput(field, true)}
      </div>
    );
  };

  const renderRule = (start: number, end: number) => (
    <div
      className="h-0 border-b-2 border-text"
      style={{ gridColumn: gridColumn(start, end) }}
    />
  );

  const renderPaperRow = (children: ReactNode, compact = false) => (
    <div className={`grid items-center ${compact ? 'h-2' : ''}`} style={boardGridStyle}>
      {children}
    </div>
  );

  const renderLongDivisionBoard = () => (
    <section className="mt-4 min-w-0" data-long-division-board-section="true">
      <div
        ref={boardViewportRef}
        data-long-division-board-viewport="true"
        className="flex min-w-0 justify-center overflow-x-auto overflow-y-visible pb-2"
      >
        <div
          className="relative shrink-0"
          style={boardMetrics.width && boardMetrics.height
            ? {
                width: `${boardMetrics.width * boardMetrics.scale}px`,
                height: `${boardMetrics.height * boardMetrics.scale}px`,
              }
            : undefined}
        >
          <div
            ref={boardPaperRef}
            data-long-division-adaptive-profile={boardLayout.id}
            data-long-division-board-scale={boardMetrics.scale.toFixed(3)}
            data-min-readable-font-px={boardLayout.minFontPx}
            className={`${boardMetrics.width ? 'absolute left-0 top-0' : ''} w-max rounded-[18px] border-2 border-border bg-bg p-3`}
            style={{
              padding: `${boardLayout.paperPaddingRem}rem`,
              transform: `scale(${boardMetrics.scale})`,
              transformOrigin: 'top left',
            }}
          >
            <div
              className="mx-auto max-w-2xl rounded-2xl border-2 border-border-2 bg-card px-3 py-3"
              style={{
                padding: `${boardLayout.innerPaddingYRem}rem ${boardLayout.innerPaddingXRem}rem`,
              }}
            >
              {renderQuotientRow()}
              {renderDividendRow()}

              <div className="mt-2 space-y-1.5 py-2 font-black text-text">
                {activeBoardRounds.map((round, index) => {
                  const quotientColumn = quotientStartColumn + index;
                  const product = valuePosition(round.product, quotientColumn);
                  const workingValue = round.nextPartialDividend ?? round.remainder;
                  const workingKind = round.nextPartialDividend ? 'next' : 'remainder';
                  const workingEndColumn = round.nextPartialDividend ? quotientColumn + 1 : quotientColumn;
                  const working = valuePosition(workingValue, workingEndColumn);
                  const ruleStart = Math.min(product.start, working.start);
                  const ruleEnd = Math.max(product.end, working.end);
                  const productFieldId = roundFieldId(scenario.id, index, 'product');
                  const workingFieldId = roundFieldId(scenario.id, index, workingKind);
                  const showProductRow = shouldRevealField(productFieldId);
                  const showWorkingRow = shouldRevealField(workingFieldId);
                  if (!showProductRow && !showWorkingRow) return null;

                  return (
                    <Fragment key={`${scenario.id}-paper-${index}`}>
                      {showProductRow && renderPaperRow(
                        <>
                          <div className="flex h-10 items-center justify-center text-xl text-danger">-</div>
                          {renderPositionedField(productFieldId, product.start, product.end)}
                        </>,
                      )}
                      {showProductRow && renderPaperRow(renderRule(ruleStart, ruleEnd), true)}
                      {showWorkingRow && renderPaperRow(
                        renderPositionedField(
                          workingFieldId,
                          working.start,
                          working.end,
                        ),
                      )}
                    </Fragment>
                  );
                })}
              </div>
            </div>

            {!formal && scenario.decimalHint && (
              <div className="mx-auto mt-3 max-w-md rounded-xl border border-success-mid bg-success-lt px-3 py-2 text-center text-sm font-bold text-success">
                {scenario.decimalHint}
              </div>
            )}

            {!formal && boardLayout.id !== 'comfortable' && (
              <div className="mx-auto mt-2 max-w-md rounded-xl border border-primary/30 bg-primary-lt px-3 py-2 text-center text-xs font-black text-primary">
                宽度自适应：{boardLayout.label} · 最小字号 {boardLayout.minFontPx}px
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );

  return (
    <main
      className="min-h-dvh bg-bg px-3 py-4 text-text sm:px-5 lg:px-6"
      style={showFeedback ? undefined : { paddingBottom: '14.5rem' }}
    >
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
        <header className="flex flex-col gap-3 rounded-[18px] border-2 border-border-2 bg-card px-4 py-4 shadow-[0_2px_10px_rgba(0,0,0,.08)] lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="text-[12px] font-black uppercase text-primary">
              {formal ? 'v0.5 Phase 4 · Formal Prototype' : 'v0.5 Phase 4 · BL-010 UI Review'}
            </p>
            <h1 className="mt-1 text-2xl font-black leading-tight text-text sm:text-3xl">
              {formal ? '竖式除法正式版高保真原型' : '竖式除法 UI 化答题审核稿'}
            </h1>
            {!formal && (
              <p className="mt-2 max-w-3xl text-sm font-semibold leading-relaxed text-text-2">
                预览重点是核心板形态、输入顺序、扩展训练格、失败反馈和 375px 手机竖屏下的键盘共存。
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <button
              type="button"
              onClick={fillExpected}
              className="flex items-center justify-center gap-2 rounded-xl border-2 border-success bg-success-lt px-3 py-2 text-sm font-black text-success transition-colors"
            >
              <Wand2 size={17} aria-hidden="true" />
              正确示例
            </button>
            <button
              type="button"
              onClick={fillMistake}
              className="flex items-center justify-center gap-2 rounded-xl border-2 border-warning bg-warning-lt px-3 py-2 text-sm font-black transition-colors"
              style={{ color: '#7A5C00' }}
            >
              <AlertTriangle size={17} aria-hidden="true" />
              错因预览
            </button>
            <button
              type="button"
              onClick={reset}
              className="flex items-center justify-center gap-2 rounded-xl border-2 border-border bg-bg px-3 py-2 text-sm font-black text-text transition-colors"
            >
              <RotateCcw size={17} aria-hidden="true" />
              重置
            </button>
          </div>
        </header>

        <section className={`grid min-w-0 gap-4 ${formal ? 'lg:grid-cols-[13rem_minmax(0,1fr)]' : 'lg:grid-cols-[14rem_minmax(0,1fr)_18rem]'}`}>
          <nav className="min-w-0 rounded-[18px] border-2 border-border-2 bg-card p-3 shadow-[0_2px_10px_rgba(0,0,0,.07)] lg:self-start">
            <div className="mb-3 flex items-center gap-2 text-sm font-black text-text">
              <MonitorSmartphone size={18} className="text-primary" aria-hidden="true" />
              {formal ? '题型类型' : '审核场景'}
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-1">
              {scenarios.map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => selectScenario(item.id)}
                  className={`min-w-0 rounded-xl border-2 px-3 py-2 text-left transition-all ${
                    scenario.id === item.id
                      ? 'border-primary bg-primary-lt text-primary'
                      : 'border-border bg-bg text-text hover:border-primary/50'
                  }`}
                >
                  <span className="block truncate text-sm font-black">{item.shortTitle}</span>
                  <span className="mt-1 inline-flex rounded-md border border-border-2 bg-card px-1.5 py-0.5 text-[11px] font-black text-text-2">
                    {item.badge}
                  </span>
                </button>
              ))}
            </div>
          </nav>

          <article className="min-w-0 rounded-[18px] border-2 border-border-2 bg-card p-3 shadow-[0_2px_10px_rgba(0,0,0,.08)] sm:p-4">
            <div className="flex flex-col gap-3 border-b-2 border-border-2 pb-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-lg bg-primary text-on-primary px-2 py-1 text-xs font-black">{scenario.badge}</span>
                  <h2 className="text-xl font-black leading-tight text-text">{scenario.title}</h2>
                </div>
                <p className="mt-2 text-sm font-bold text-text-2">{scenario.prompt}</p>
                <p className="mt-1 text-3xl font-black text-text">{scenario.expression}</p>
              </div>
              {!formal && (
                <div className="rounded-xl border-2 border-border bg-bg px-3 py-2 text-sm font-bold leading-relaxed text-text-2 sm:max-w-xs">
                  {scenario.focus}
                </div>
              )}
            </div>

            {showTrainingPanel && (
              <section data-conversion-panel="true" className="mt-4 rounded-2xl border-2 border-primary/20 bg-primary/[0.06] p-3">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-sm font-black text-primary-dark">
                    <ClipboardList size={17} aria-hidden="true" />
                    {formal ? '转换与表达' : '计算前训练格'}
                  </div>
                  {scenario.setupFields && (
                    <div className="inline-flex rounded-xl border-2 border-border bg-card p-1" aria-label="提示难度预览">
                      {([
                        ['medium', '中档提示'],
                        ['high', '高档无提示'],
                      ] as const).map(([mode, label]) => (
                        <button
                          key={mode}
                          type="button"
                          aria-pressed={guidanceMode === mode}
                          onClick={() => setGuidanceMode(mode)}
                          className={`rounded-lg px-2.5 py-1 text-xs font-black transition-colors ${
                            guidanceMode === mode ? 'bg-primary text-on-primary' : 'text-text-2 hover:text-primary'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {scenario.setupFields && (
                  <div className="mb-3 flex justify-center">
                    <div className="grid w-full max-w-sm grid-cols-2 gap-2 rounded-xl border-2 border-border bg-card p-1" aria-label="小数除小数答题步骤">
                      {([
                        ['1', '扩倍环节', !conversionConfirmed],
                        ['2', '实际计算', conversionConfirmed],
                      ] as const).map(([step, label, active]) => (
                        <div
                          key={step}
                          className={`rounded-lg px-3 py-1.5 text-center text-xs font-black transition-colors ${
                            active ? 'bg-primary text-on-primary' : 'text-text-2'
                          }`}
                        >
                          {step}. {label}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {isDecimalDivisorScenario && (
                  <div className="mb-3 flex justify-center">
                    <div className="inline-flex rounded-xl border-2 border-border bg-card p-1" aria-label="小数除小数转换结果类型">
                      {([
                        ['integer', '转换后整数'],
                        ['fractional', '转换后仍有小数'],
                      ] as const).map(([variant, label]) => (
                        <button
                          key={variant}
                          type="button"
                          aria-pressed={decimalDivisorVariant === variant}
                          onClick={() => selectDecimalDivisorVariant(variant)}
                          className={`rounded-lg px-3 py-1.5 text-xs font-black transition-colors ${
                            decimalDivisorVariant === variant ? 'bg-primary text-on-primary' : 'text-text-2 hover:text-primary'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex flex-wrap justify-center gap-2">
                  {(scenario.trainingFields ?? []).map((field, index) => {
                    const spec = fieldById.get(trainingFieldId(scenario.id, index));
                    if (!spec) return null;
                    return (
                      <label key={field.label} className="flex min-w-0 items-center justify-center gap-2 rounded-xl bg-card px-3 py-2 text-sm font-black text-text sm:min-w-64">
                        <span className="min-w-0 flex-1 truncate">{field.label}</span>
                        {renderInput(spec, true)}
                        {field.suffix && <span className="shrink-0 text-text-2">{field.suffix}</span>}
                      </label>
                    );
                  })}
                  {scenario.setupFields && [setupDivisorField, setupDividendField].map(spec => {
                    if (!spec) return null;
                    return (
                      <label key={spec.id} className="flex min-w-0 items-center justify-center gap-2 rounded-xl bg-card px-3 py-2 text-sm font-black text-text sm:min-w-64">
                        <span className="min-w-0 flex-1 truncate">{spec.label}</span>
                        {renderInput(spec, true)}
                      </label>
                    );
                  })}
                </div>
                {showSetupHint && scenario.setupFields && (
                  <div className="mt-3 rounded-xl border-2 border-success-mid bg-success-lt px-3 py-2 text-sm font-bold text-success">
                    {scenario.setupFields.mediumHint}
                  </div>
                )}
                {conversionProcessHints.length > 0 && (
                  <div className="mt-3 grid gap-2" role="status" aria-live="polite">
                    {conversionProcessHints.map(hint => (
                      <div key={hint.id} className="rounded-xl border-2 border-warning bg-warning-lt px-3 py-2 text-center text-sm font-black" style={{ color: '#7A5C00' }}>
                        {hint.text}
                      </div>
                    ))}
                  </div>
                )}
                {conversionSubmitted && setupDivisorFormatError && !showFeedback && (
                  <div className="mt-3 rounded-xl border-2 border-warning bg-warning-lt px-3 py-2 text-center text-sm font-black" style={{ color: '#7A5C00' }} role="alert">
                    转换后除数不是整数。
                  </div>
                )}
              </section>
            )}

            {canRenderBoard && renderLongDivisionBoard()}

            {scenario.resultFields && visibleResultFields.length > 0 && (
              <section className="mt-4 rounded-2xl border-2 border-success-mid bg-success-lt p-3">
                <div className="mb-3 flex items-center gap-2 text-sm font-black text-success">
                  <ListChecks size={17} aria-hidden="true" />
                  {formal ? '结果表达' : '计算后结构化结果格'}
                </div>
                <div className={`grid gap-2 ${scenario.id === 'cyclic' ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
                  {visibleResultFields.map(({ field, spec }) => {
                    if (!spec) return null;
                    return (
                      <label key={field.label} className="flex min-w-0 items-center gap-2 rounded-xl bg-card px-3 py-2 text-sm font-black text-text">
                        <span className="min-w-0 flex-1 truncate">{field.label}</span>
                        {renderInput(spec, true)}
                      </label>
                    );
                  })}
                  {cyclicAnswerPreview && (
                    <div className="flex min-w-0 items-center gap-2 rounded-xl bg-card px-3 py-2 text-sm font-black text-text">
                      <span className="min-w-0 flex-1 truncate">标准格式答数</span>
                      <span className="shrink-0 rounded-lg border-2 border-border bg-bg px-3 py-1.5">
                        {renderRecurringDecimalAnswer(
                          cyclicAnswerPreview.nonRepeating,
                          cyclicAnswerPreview.repeating,
                        )}
                      </span>
                    </div>
                  )}
                </div>
              </section>
            )}

            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                disabled={primaryActionDisabled}
                onClick={isConversionPhase ? handleConfirmConversion : handleSubmitAnswer}
                className={`inline-flex min-w-24 items-center justify-center rounded-2xl px-6 py-2 text-sm font-black transition-all ${
                  !primaryActionDisabled
                    ? 'bg-primary text-on-primary'
                    : 'cursor-not-allowed border-2 border-border bg-card-2 text-text-2'
                }`}
              >
                {isConversionPhase ? '确认扩倍' : '提交答案'}
              </button>
              <button
                type="button"
                onClick={reset}
                className="inline-flex min-w-24 items-center justify-center gap-1.5 rounded-2xl border-2 border-border bg-bg px-5 py-2 text-sm font-black text-text transition-colors hover:border-primary/50"
              >
                <RotateCcw size={16} aria-hidden="true" />
                重置
              </button>
            </div>

            {showFeedback && (
              <section
                ref={feedbackRef}
                data-feedback-panel="true"
                className="mt-4 rounded-2xl border-2 border-warning bg-warning-lt px-4 py-3"
              >
                <div className="flex items-center gap-2 text-sm font-black" style={{ color: '#7A5C00' }}>
                  <AlertTriangle size={17} aria-hidden="true" />
                  {formal ? '未通过原因' : '失败反馈预览'}
                </div>
                <p className="mt-2 text-sm font-bold text-text">
                  {feedbackSummary}
                </p>
                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  {processFeedbackCategories.map(category => (
                    <div key={category} className="rounded-xl bg-card/80 px-3 py-2 text-sm font-black text-text">
                      {category}
                    </div>
                  ))}
                  {structuredFeedbackMistakes.map(mistake => (
                    <div key={mistake.label} className="rounded-xl bg-card/80 px-3 py-2 text-sm text-text">
                      <p className="font-black text-text-2">{mistake.label}</p>
                      <p className="mt-1 font-semibold">
                        你填 <span className="font-black text-danger">{mistake.userValue}</span>
                        ，正确是 <span className="font-black text-success">{mistake.expectedValue}</span>
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </article>

          {!formal && (
          <aside className="min-w-0 rounded-[18px] border-2 border-border-2 bg-card p-4 shadow-[0_2px_10px_rgba(0,0,0,.07)] lg:self-start">
            <div className="flex items-center gap-2 text-sm font-black text-text">
              <MousePointer2 size={18} className="text-primary" aria-hidden="true" />
              交互说明
            </div>
            <div className="mt-3 space-y-3 text-sm font-semibold leading-relaxed text-text-2">
              <p>输入顺序固定为：前置训练格 → 每轮商、乘、余数与落位同一行 → 后置结果格。</p>
              <p>竖式板只显示当前已到达的格子；下一行和下一轮会随自动换格逐步出现。</p>
              <p>内置键盘读取同一份 slot 列表；不适用的符号键会置灰，删除不触发自动换格。</p>
              <p>过程格失败只显示类别；扩倍、取近似、循环节等结构化字段显示用户值和正确值。</p>
            </div>

            <div className="mt-4 rounded-2xl border-2 border-border bg-bg p-3">
              <div className="mb-2 flex items-center gap-2 text-sm font-black text-text">
                <Keyboard size={17} className="text-primary" aria-hidden="true" />
                当前 active slot
              </div>
              <p className="text-base font-black text-primary">{activeField?.label ?? '无'}</p>
              <p className="mt-1 text-xs font-bold text-text-2">
                标准长度：{activeField?.expected.length ?? 0}；自动换格由题型闭包判断。
              </p>
            </div>

            <div className="mt-4 rounded-2xl border-2 border-border bg-bg p-3">
              <div className="mb-2 flex items-center gap-2 text-sm font-black text-text">
                <ListChecks size={17} className="text-success" aria-hidden="true" />
                本场景审核点
              </div>
              <ul className="space-y-2 text-sm font-semibold text-text-2">
                {scenario.reviewNotes.map(note => (
                  <li key={note} className="rounded-xl bg-card px-3 py-2">{note}</li>
                ))}
              </ul>
            </div>
          </aside>
          )}
        </section>
      </div>

      {!showFeedback && (
        <PracticeMathKeyboard
          slots={slots}
          activeSlotId={activeSlotId}
          onActiveSlotChange={setActiveSlotId}
          announceActiveSlot={false}
        />
      )}
    </main>
  );
}
