import { nanoid } from 'nanoid';
import { CAMPAIGN_MAX_HEARTS, PLAYER_TOPICS, getTopicDisplayName } from '@/constants';
import { generateQuestion } from '@/engine';
import { buildLongDivisionBoardData } from '@/engine/longDivision';
import { placeDecimalPoint } from '@/engine/verticalMultiplication';
import { getSubtypeEntries as getMentalArithmeticEntries } from '@/engine/generators/mental-arithmetic';
import { getSubtypeEntries as getNumberSenseEntries } from '@/engine/generators/number-sense';
import { getSubtypeEntries as getVerticalCalcEntries } from '@/engine/generators/vertical-calc';
import { getSubtypeEntries as getOperationLawsEntries } from '@/engine/generators/operation-laws';
import { getSubtypeEntries as getDecimalOpsEntries } from '@/engine/generators/decimal-ops';
import { getSubtypeEntries as getBracketOpsEntries } from '@/engine/generators/bracket-ops';
import { getSubtypeEntries as getMultiStepEntries } from '@/engine/generators/multi-step';
import { getSubtypeEntries as getEquationTransposeEntries } from '@/engine/generators/equation-transpose';
import { useSessionStore, useUIStore, useUserStore } from '@/store';
import type { PracticeSession, Question, TopicId } from '@/types';
import type { SubtypeDef } from '@/types/gamification';

export interface QuestionBrowserTopic {
  id: TopicId;
  label: string;
}

export interface QuestionBrowserSubtype {
  id: string;
  tag: string;
  label: string;
  difficulty: number;
  family?: string;
  description?: string;
  createQuestion?: (id: string) => Question;
}

interface StartQuestionBrowserPracticeParams {
  topicId: TopicId;
  subtypeId?: string;
  subtypeTag?: string;
  difficulty?: number;
}

type SubtypeEntryGetter = (difficulty: number) => SubtypeDef[];

const SUBTYPE_ENTRY_MAP: Record<TopicId, SubtypeEntryGetter> = {
  'mental-arithmetic': getMentalArithmeticEntries,
  'number-sense': () => getNumberSenseEntries(),
  'vertical-calc': getVerticalCalcEntries,
  'operation-laws': getOperationLawsEntries,
  'decimal-ops': getDecimalOpsEntries,
  'bracket-ops': getBracketOpsEntries,
  'multi-step': getMultiStepEntries,
  'equation-transpose': getEquationTransposeEntries,
};

const REPRESENTATIVE_DIFFICULTIES = [
  { difficulty: 4, tier: '普通' },
  { difficulty: 6, tier: '困难' },
  { difficulty: 9, tier: '魔王' },
] as const;

function tierLabel(difficulty: number): string {
  if (difficulty <= 5) return '普通';
  if (difficulty <= 7) return '困难';
  return '魔王';
}

function generateMatchingQuestion(params: {
  topicId: TopicId;
  difficulty: number;
  subtypeFilter: string[];
  matches: (question: Question) => boolean;
  maxAttempts?: number;
}): Question {
  const attempts = params.maxAttempts ?? 120;
  for (let i = 0; i < attempts; i++) {
    const question = generateQuestion(params.topicId, params.difficulty, params.subtypeFilter);
    if (params.matches(question)) return question;
  }
  throw new Error(
    `题型一览无法生成匹配样题：${params.topicId} / ${params.subtypeFilter.join(', ')}`,
  );
}

function createGeneratedSubtype(topicId: TopicId, difficulty: number, tag: string): (id: string) => Question {
  return () => generateQuestion(topicId, difficulty, [tag]);
}

function createMultiStepVariantQuestion(params: {
  difficulty: number;
  subtypeFilter: string[];
  subtype: NonNullable<Extract<Question['data'], { kind: 'multi-step' }>['subtype']>;
}): (id: string) => Question {
  return () => generateMatchingQuestion({
    topicId: 'multi-step',
    difficulty: params.difficulty,
    subtypeFilter: params.subtypeFilter,
    matches: question =>
      question.data.kind === 'multi-step' && question.data.subtype === params.subtype,
  });
}

function createEquationTrapQuestion(params: {
  difficulty: number;
  subtypeFilter: string[];
  trap: string;
}): (id: string) => Question {
  return () => generateMatchingQuestion({
    topicId: 'equation-transpose',
    difficulty: params.difficulty,
    subtypeFilter: params.subtypeFilter,
    matches: question =>
      question.data.kind === 'equation-transpose' && question.data.trap === params.trap,
  });
}

function createLongDivisionQuestion(params: {
  id: string;
  difficulty: number;
  prompt: string;
  dividend: number;
  divisor: number;
  finalAnswer: string;
  board: Parameters<typeof buildLongDivisionBoardData>[0];
  steps: string[];
  hints: string[];
}): Question {
  return {
    id: params.id,
    topicId: 'vertical-calc',
    type: 'vertical-fill',
    difficulty: params.difficulty,
    prompt: params.prompt,
    data: {
      kind: 'vertical-calc',
      operation: '÷',
      operands: [params.dividend, params.divisor],
      steps: [],
      longDivisionBoard: buildLongDivisionBoardData(params.board),
    },
    solution: {
      answer: params.finalAnswer,
      steps: params.steps,
      explanation: `${params.prompt.replace(/^列竖式计算: |^用竖式计算: /, '')} = ${params.finalAnswer}`,
    },
    hints: params.hints,
  };
}

function multiDigitMultiplicationSteps(a: number, b: number): string[] {
  const digits = String(b).split('').reverse().map(Number);
  const partials = digits.map((digit, index) => a * digit * (10 ** index));
  return [
    ...digits.map((digit, index) => {
      const placeName = index === 0 ? '个' : index === 1 ? '十' : '百';
      const shifted = a * digit * (10 ** index);
      return `${a} × ${digit}(${placeName}位) = ${a * digit}${index > 0 ? `，左移 ${index} 位得 ${shifted}` : ''}`;
    }),
    `部分积相加: ${partials.join(' + ')} = ${a * b}`,
  ];
}

function createIntegerMultiplicationQuestion(params: {
  id: string;
  difficulty: number;
  a: number;
  b: number;
  hints: string[];
}): Question {
  const answer = params.a * params.b;
  return {
    id: params.id,
    topicId: 'vertical-calc',
    type: 'vertical-fill',
    difficulty: params.difficulty,
    prompt: `用竖式计算: ${params.a} × ${params.b}`,
    data: {
      kind: 'vertical-calc',
      operation: '×',
      operands: [params.a, params.b],
      steps: [],
      multiplicationBoard: {
        mode: 'integer',
        integerOperands: [params.a, params.b],
        operandInputMode: 'static',
      },
    },
    solution: {
      answer,
      steps: multiDigitMultiplicationSteps(params.a, params.b),
      explanation: `${params.a} × ${params.b} = ${answer}`,
    },
    hints: params.hints,
  };
}

function createDecimalMultiplicationQuestion(params: {
  id: string;
  difficulty: number;
  originalOperands: [string, string];
  integerOperands: [number, number];
  operandDecimalPlaces: [number, number];
  decimalPlaces: number;
  hints: string[];
}): Question {
  const [aInt, bInt] = params.integerOperands;
  const [aText, bText] = params.originalOperands;
  const finalAnswer = placeDecimalPoint(String(aInt * bInt), params.decimalPlaces);
  const normalizedAnswer = finalAnswer.includes('.')
    ? finalAnswer.replace(/0+$/, '').replace(/\.$/, '')
    : finalAnswer;
  return {
    id: params.id,
    topicId: 'vertical-calc',
    type: 'vertical-fill',
    difficulty: params.difficulty,
    prompt: `列竖式计算: ${aText} × ${bText}`,
    data: {
      kind: 'vertical-calc',
      operation: '×',
      operands: [Number(aText), Number(bText)],
      steps: [],
      multiplicationBoard: {
        mode: 'decimal',
        integerOperands: params.integerOperands,
        operandInputMode: 'blank',
        originalOperands: params.originalOperands,
        operandDecimalPlaces: params.operandDecimalPlaces,
        decimalPlaces: params.decimalPlaces,
        finalAnswer,
      },
    },
    solution: {
      answer: normalizedAnswer,
      steps: [
        '先按整数乘法计算：忽略小数点',
        '再数两个因数共有几位小数，积就有几位小数',
      ],
      explanation: `${aText} × ${bText} = ${normalizedAnswer}`,
    },
    hints: params.hints,
  };
}

function createMultiplicationApproximationQuestion(id: string): Question {
  const a = 2.47;
  const b = 3.68;
  const exactAnswer = a * b;
  const rounded = exactAnswer.toFixed(2);
  return {
    id,
    topicId: 'vertical-calc',
    type: 'numeric-input',
    difficulty: 9,
    prompt: `列竖式计算: ${a.toFixed(2)} × ${b.toFixed(2)}（精确到百分位）`,
    data: {
      kind: 'vertical-calc',
      operation: '×',
      operands: [a, b],
      steps: [],
    },
    solution: {
      answer: rounded,
      steps: [
        `先算出精确值: ${a.toFixed(2)} × ${b.toFixed(2)} = ${exactAnswer.toFixed(4)}`,
        `四舍五入到百分位: ≈ ${rounded}`,
      ],
      explanation: `${a.toFixed(2)} × ${b.toFixed(2)} ≈ ${rounded}（精确到百分位）`,
    },
    hints: ['先用竖式算出比要求多一位的结果，再四舍五入'],
  };
}

const VERTICAL_MULTIPLICATION_SUBTYPES: QuestionBrowserSubtype[] = [
  {
    id: 'vertical-calc.multiplication.legacy-3digit-by-1digit',
    tag: 'int-mul',
    label: 'int-mul · 三位×一位 · 普通',
    difficulty: 3,
    createQuestion: () => generateQuestion('vertical-calc', 3, ['int-mul']),
  },
  {
    id: 'vertical-calc.multiplication.integer-2digit-by-2digit',
    tag: 'int-mul',
    label: 'int-mul · 两位×两位 · 普通',
    difficulty: 4,
    createQuestion: id => createIntegerMultiplicationQuestion({
      id,
      difficulty: 4,
      a: 47,
      b: 36,
      hints: ['先用第二个数的个位乘第一个数，再用十位乘，最后把部分积相加'],
    }),
  },
  {
    id: 'vertical-calc.multiplication.integer-3digit-by-2digit',
    tag: 'int-mul',
    label: 'int-mul · 三位×两位 · 困难',
    difficulty: 7,
    createQuestion: id => createIntegerMultiplicationQuestion({
      id,
      difficulty: 7,
      a: 782,
      b: 14,
      hints: ['先算各位部分积，再按位对齐相加'],
    }),
  },
  {
    id: 'vertical-calc.multiplication.integer-internal-zero',
    tag: 'int-mul',
    label: 'int-mul · 含中间 0 · 魔王',
    difficulty: 9,
    createQuestion: id => createIntegerMultiplicationQuestion({
      id,
      difficulty: 9,
      a: 507,
      b: 24,
      hints: ['遇到中间 0 仍要保持部分积对齐'],
    }),
  },
  {
    id: 'vertical-calc.multiplication.decimal-by-integer',
    tag: 'dec-mul',
    label: 'dec-mul · 小数×整数 · 困难',
    difficulty: 6,
    createQuestion: id => createDecimalMultiplicationQuestion({
      id,
      difficulty: 6,
      originalOperands: ['4.06', '23'],
      integerOperands: [406, 23],
      operandDecimalPlaces: [2, 0],
      decimalPlaces: 2,
      hints: ['先按 406 × 23 计算，再把积的小数点向左移动 2 位'],
    }),
  },
  {
    id: 'vertical-calc.multiplication.decimal-by-decimal',
    tag: 'dec-mul',
    label: 'dec-mul · 小数×小数 · 魔王',
    difficulty: 9,
    createQuestion: id => createDecimalMultiplicationQuestion({
      id,
      difficulty: 9,
      originalOperands: ['3.14', '2.07'],
      integerOperands: [314, 207],
      operandDecimalPlaces: [2, 2],
      decimalPlaces: 4,
      hints: ['两个因数一共有 4 位小数，最终积也要移动 4 位'],
    }),
  },
  {
    id: 'vertical-calc.multiplication.approximation',
    tag: 'approximate',
    label: 'approximate · 乘法取近似 · 魔王',
    difficulty: 9,
    createQuestion: createMultiplicationApproximationQuestion,
  },
];

const VERTICAL_LONG_DIVISION_SUBTYPES: QuestionBrowserSubtype[] = [
  {
    id: 'vertical-calc.long-division.integer-remainder',
    tag: 'int-div',
    label: 'int-div · 整数多轮 · 普通',
    difficulty: 4,
    createQuestion: id => createLongDivisionQuestion({
      id,
      difficulty: 4,
      prompt: '用竖式计算: 936 ÷ 4',
      dividend: 936,
      divisor: 4,
      finalAnswer: '234',
      board: { kind: 'integer', dividend: 936, divisor: 4, finalAnswer: '234' },
      steps: ['从最高位开始，逐位试商', '每轮写商、乘积、余数和落位'],
      hints: ['注意多次余数传递和落位'],
    }),
  },
  {
    id: 'vertical-calc.long-division.middle-zero',
    tag: 'int-div',
    label: 'int-div · 商中 0 · 普通',
    difficulty: 4,
    createQuestion: id => createLongDivisionQuestion({
      id,
      difficulty: 4,
      prompt: '用竖式计算: 824 ÷ 4',
      dividend: 824,
      divisor: 4,
      finalAnswer: '206',
      board: { kind: 'integer', dividend: 824, divisor: 4, finalAnswer: '206' },
      steps: ['遇到当前数不够除，也要在对应商位写 0', '继续落下一位再除'],
      hints: ['注意商中间 0 的占位'],
    }),
  },
  {
    id: 'vertical-calc.long-division.decimal-dividend',
    tag: 'dec-div',
    label: 'dec-div · 小数÷整数 · 困难',
    difficulty: 6,
    createQuestion: id => createLongDivisionQuestion({
      id,
      difficulty: 6,
      prompt: '列竖式计算: 5.76 ÷ 3',
      dividend: 5.76,
      divisor: 3,
      finalAnswer: '1.92',
      board: { kind: 'decimal-dividend', dividend: 5.76, divisor: 3, finalAnswer: '1.92' },
      steps: ['商的小数点与被除数的小数点对齐', '继续逐位除到小数部分'],
      hints: ['商的小数点要和被除数的小数点对齐'],
    }),
  },
  {
    id: 'vertical-calc.long-division.decimal-divisor',
    tag: 'dec-div',
    label: 'dec-div · 小数÷小数扩倍 · 魔王',
    difficulty: 9,
    createQuestion: id => createLongDivisionQuestion({
      id,
      difficulty: 9,
      prompt: '列竖式计算: 15.6 ÷ 0.24',
      dividend: 15.6,
      divisor: 0.24,
      finalAnswer: '65',
      board: { kind: 'decimal-divisor', dividend: 15.6, divisor: 0.24, finalAnswer: '65' },
      steps: ['除数是小数，先把除数和被除数同时扩大 100 倍', '再按 1560 ÷ 24 列竖式计算'],
      hints: ['先把除数变成整数，被除数同倍扩大'],
    }),
  },
  {
    id: 'vertical-calc.long-division.approximation',
    tag: 'approximate',
    label: 'approximate · 取近似 · 魔王',
    difficulty: 9,
    createQuestion: id => createLongDivisionQuestion({
      id,
      difficulty: 9,
      prompt: '列竖式计算: 8.5 ÷ 3（保留两位小数）',
      dividend: 8.5,
      divisor: 3,
      finalAnswer: '2.83',
      board: {
        kind: 'approximation',
        dividend: 8.5,
        divisor: 3,
        finalAnswer: '2.83',
        approximationPlaces: 2,
      },
      steps: ['先算到保留位后一位', '再按后一位四舍五入'],
      hints: ['先用竖式算出比要求多一位的结果，再四舍五入'],
    }),
  },
  {
    id: 'vertical-calc.long-division.cyclic',
    tag: 'cyclic-div',
    label: 'cyclic-div · 循环小数 · 魔王',
    difficulty: 9,
    createQuestion: id => createLongDivisionQuestion({
      id,
      difficulty: 9,
      prompt: '列竖式计算: 14 ÷ 135，写出循环节',
      dividend: 14,
      divisor: 135,
      finalAnswer: '0.1037',
      board: {
        kind: 'cyclic',
        dividend: 14,
        divisor: 135,
        finalAnswer: '0.1037',
        cyclic: { nonRepeating: '0.1', repeating: '037' },
      },
      steps: ['继续除到循环节第二次出现', '填写非循环部分和循环节'],
      hints: ['先把竖式继续算到循环节第二次出现', '最后填写完整非循环部分和循环节'],
    }),
  },
];

const MULTI_STEP_CORE_SUBTYPES: QuestionBrowserSubtype[] = [
  {
    id: 'multi-step.core.recognize-simplifiable',
    tag: 'recognize-simplifiable',
    label: '识别可简便 · 普通',
    difficulty: 2,
    family: '核心简便',
    createQuestion: createMultiStepVariantQuestion({
      difficulty: 2,
      subtypeFilter: ['bracket-normal'],
      subtype: 'recognize-simplifiable',
    }),
  },
  {
    id: 'multi-step.core.fill-split-low',
    tag: 'fill-split-low',
    label: '凑整拆分填空 · 普通',
    difficulty: 3,
    family: '核心简便',
    createQuestion: createMultiStepVariantQuestion({
      difficulty: 3,
      subtypeFilter: ['bracket-normal'],
      subtype: 'fill-split-low',
    }),
  },
  {
    id: 'multi-step.core.recognize-not-simplifiable',
    tag: 'recognize-not-simplifiable',
    label: '识别不可简便 · 困难',
    difficulty: 6,
    family: '核心简便',
    createQuestion: createMultiStepVariantQuestion({
      difficulty: 6,
      subtypeFilter: ['bracket-hard'],
      subtype: 'recognize-not-simplifiable',
    }),
  },
  {
    id: 'multi-step.core.recognize-method',
    tag: 'recognize-method',
    label: '判断使用方法 · 困难',
    difficulty: 6,
    family: '核心简便',
    createQuestion: createMultiStepVariantQuestion({
      difficulty: 6,
      subtypeFilter: ['decimal-two-step'],
      subtype: 'recognize-method',
    }),
  },
  {
    id: 'multi-step.core.fill-split-mid',
    tag: 'fill-split-mid',
    label: '因数拆分路径 · 困难',
    difficulty: 6,
    family: '核心简便',
    createQuestion: createMultiStepVariantQuestion({
      difficulty: 6,
      subtypeFilter: ['extract-factor'],
      subtype: 'fill-split-mid',
    }),
  },
  {
    id: 'multi-step.core.mid-pick-transform',
    tag: 'mid-pick-transform',
    label: '选择变形式 · 困难',
    difficulty: 6,
    family: '核心简便',
    createQuestion: createMultiStepVariantQuestion({
      difficulty: 6,
      subtypeFilter: ['simplify-subtract'],
      subtype: 'mid-pick-transform',
    }),
  },
  {
    id: 'multi-step.core.recognize-multi',
    tag: 'recognize-multi',
    label: '多选可简便 · 魔王',
    difficulty: 9,
    family: '核心简便',
    createQuestion: createMultiStepVariantQuestion({
      difficulty: 9,
      subtypeFilter: ['decimal-multi-step'],
      subtype: 'recognize-multi',
    }),
  },
  {
    id: 'multi-step.core.simplify-error-diagnose',
    tag: 'simplify-error-diagnose',
    label: '简便错误诊断 · 魔王',
    difficulty: 9,
    family: '核心简便',
    createQuestion: createMultiStepVariantQuestion({
      difficulty: 9,
      subtypeFilter: ['bracket-demon'],
      subtype: 'simplify-error-diagnose',
    }),
  },
  {
    id: 'multi-step.core.hidden-factor-exec',
    tag: 'hidden-factor-exec',
    label: '隐藏公因数执行 · 魔王',
    difficulty: 9,
    family: '核心简便',
    createQuestion: createMultiStepVariantQuestion({
      difficulty: 9,
      subtypeFilter: ['extract-factor'],
      subtype: 'hidden-factor-exec',
    }),
  },
];

const MULTI_STEP_LAW_SPECS = [
  ['law-identify', '运算律识别', 3],
  ['law-simple-judge', '律性质判断', 3],
  ['law-structure-blank', '分配律结构填空', 3],
  ['law-reverse-blank', '反用分配律填空', 6],
  ['law-counter-example', '反例辨析', 6],
  ['law-concept-reverse', '概念反用', 6],
  ['law-easy-confuse', '易混公式', 6],
  ['law-compound-law', '复合运算律', 7],
  ['law-distributive-trap', '分配律陷阱', 7],
  ['law-error-diagnose', '运算律错误诊断', 8],
] as const;

const MULTI_STEP_LAW_SUBTYPES: QuestionBrowserSubtype[] = MULTI_STEP_LAW_SPECS.map(
  ([tag, title, difficulty]) => ({
    id: `multi-step.law.${tag}`,
    tag,
    label: `${title} · ${tierLabel(difficulty)}`,
    difficulty,
    family: '运算律知识',
    createQuestion: createGeneratedSubtype('multi-step', difficulty, tag),
  }),
);

const MULTI_STEP_BRACKET_SPECS = [
  ['bracket-remove-plus', '加号前去括号', 3],
  ['bracket-remove-minus', '减号前去括号', 3],
  ['bracket-add', '添括号', 3],
  ['bracket-division-property', '除法性质', 6],
  ['bracket-four-items-sign', '多项变号', 7],
  ['bracket-error-diagnose', '括号错误诊断', 8],
] as const;

const MULTI_STEP_BRACKET_SUBTYPES: QuestionBrowserSubtype[] = MULTI_STEP_BRACKET_SPECS.map(
  ([tag, title, difficulty]) => ({
    id: `multi-step.bracket.${tag}`,
    tag,
    label: `${title} · ${tierLabel(difficulty)}`,
    difficulty,
    family: '括号变换知识',
    createQuestion: createGeneratedSubtype('multi-step', difficulty, tag),
  }),
);

const EQUATION_TRAP_SUBTYPES: QuestionBrowserSubtype[] = [
  {
    id: 'equation-transpose.trap.T1-lite',
    tag: 'T1-lite',
    label: 'T1-lite · 减号后 x · 普通',
    difficulty: 3,
    family: '陷阱诊断',
    createQuestion: createEquationTrapQuestion({
      difficulty: 3,
      subtypeFilter: ['move-from-linear'],
      trap: 'T1-lite',
    }),
  },
  {
    id: 'equation-transpose.trap.T1',
    tag: 'T1',
    label: 'T1 · 丢负号 · 困难',
    difficulty: 6,
    family: '陷阱诊断',
    createQuestion: createEquationTrapQuestion({
      difficulty: 6,
      subtypeFilter: ['move-from-linear'],
      trap: 'T1',
    }),
  },
  {
    id: 'equation-transpose.trap.T2',
    tag: 'T2',
    label: 'T2 · 同侧漏移 · 困难',
    difficulty: 6,
    family: '陷阱诊断',
    createQuestion: createEquationTrapQuestion({
      difficulty: 6,
      subtypeFilter: ['move-from-linear'],
      trap: 'T2',
    }),
  },
  {
    id: 'equation-transpose.trap.T3',
    tag: 'T3',
    label: 'T3 · 括号漏乘 · 魔王',
    difficulty: 7,
    family: '陷阱诊断',
    createQuestion: createEquationTrapQuestion({
      difficulty: 7,
      subtypeFilter: ['bracket-equation'],
      trap: 'T3',
    }),
  },
  {
    id: 'equation-transpose.trap.T4',
    tag: 'T4',
    label: 'T4 · 两边含 x · 困难',
    difficulty: 6,
    family: '陷阱诊断',
    createQuestion: createEquationTrapQuestion({
      difficulty: 6,
      subtypeFilter: ['move-both-sides'],
      trap: 'T4',
    }),
  },
  {
    id: 'equation-transpose.trap.T3+T4',
    tag: 'T3+T4',
    label: 'T3+T4 · 展开再移项 · 魔王',
    difficulty: 7,
    family: '陷阱诊断',
    createQuestion: createEquationTrapQuestion({
      difficulty: 7,
      subtypeFilter: ['bracket-equation'],
      trap: 'T3+T4',
    }),
  },
];

export function getQuestionBrowserTopics(): QuestionBrowserTopic[] {
  return PLAYER_TOPICS.map(topic => ({
    id: topic.id,
    label: getTopicDisplayName(topic.id),
  }));
}

export function getQuestionBrowserSubtypes(topicId: TopicId): QuestionBrowserSubtype[] {
  if (topicId === 'multi-step') {
    return [
      ...MULTI_STEP_CORE_SUBTYPES,
      ...MULTI_STEP_LAW_SUBTYPES,
      ...MULTI_STEP_BRACKET_SUBTYPES,
    ];
  }

  const getter = SUBTYPE_ENTRY_MAP[topicId];
  const byTag = new Map<string, QuestionBrowserSubtype>();
  const verticalManualTags = new Set([
    ...VERTICAL_MULTIPLICATION_SUBTYPES.map(item => item.tag),
    ...VERTICAL_LONG_DIVISION_SUBTYPES.map(item => item.tag),
  ]);

  for (const { difficulty, tier } of REPRESENTATIVE_DIFFICULTIES) {
    for (const entry of getter(difficulty)) {
      if (entry.weight <= 0 || byTag.has(entry.tag)) continue;
      if (topicId === 'vertical-calc' && verticalManualTags.has(entry.tag)) continue;
      byTag.set(entry.tag, {
        id: `${topicId}.${entry.tag}`,
        tag: entry.tag,
        label: `${entry.tag} · ${tier}`,
        difficulty,
        family: '生成器标签',
      });
    }
  }

  const genericSubtypes = Array.from(byTag.values()).sort((a, b) => a.tag.localeCompare(b.tag));
  if (topicId === 'equation-transpose') return [...genericSubtypes, ...EQUATION_TRAP_SUBTYPES];
  if (topicId !== 'vertical-calc') return genericSubtypes;
  return [...genericSubtypes, ...VERTICAL_MULTIPLICATION_SUBTYPES, ...VERTICAL_LONG_DIVISION_SUBTYPES];
}

function findQuestionBrowserSubtype(params: StartQuestionBrowserPracticeParams): QuestionBrowserSubtype {
  const subtypes = getQuestionBrowserSubtypes(params.topicId);
  const byId = params.subtypeId
    ? subtypes.find(subtype => subtype.id === params.subtypeId)
    : null;
  if (byId) return byId;

  const byTag = params.subtypeTag
    ? subtypes.find(subtype =>
        subtype.tag === params.subtypeTag &&
        (params.difficulty == null || subtype.difficulty === params.difficulty),
      ) ?? subtypes.find(subtype => subtype.tag === params.subtypeTag)
    : null;
  if (byTag) return byTag;

  throw new Error('未找到题型一览子题型入口');
}

export function startQuestionBrowserPractice({
  topicId,
  subtypeId,
  subtypeTag,
  difficulty,
}: StartQuestionBrowserPracticeParams): Question {
  const user = useUserStore.getState().user;
  if (!user) {
    throw new Error('当前 namespace 没有用户，无法启动题型一览样题');
  }

  const subtype = findQuestionBrowserSubtype({ topicId, subtypeId, subtypeTag, difficulty });
  const question = subtype.createQuestion
    ? subtype.createQuestion(nanoid(10))
    : generateQuestion(topicId, difficulty ?? subtype.difficulty, [subtype.tag]);
  const session: PracticeSession = {
    id: nanoid(10),
    userId: user.id,
    topicId,
    startedAt: Date.now(),
    difficulty: question.difficulty,
    sessionMode: 'campaign',
    targetLevelId: null,
    questions: [],
    heartsRemaining: CAMPAIGN_MAX_HEARTS,
    completed: false,
  };

  useSessionStore.setState({
    active: true,
    session,
    currentQuestion: question,
    currentIndex: 0,
    totalQuestions: 1,
    hearts: CAMPAIGN_MAX_HEARTS,
    questionStartTime: Date.now(),
    showFeedback: false,
    lastAnswerCorrect: false,
    lastTrainingFieldMistakes: [],
    lastProcessWarning: null,
    lastFailureReason: null,
    lastFailureDetail: null,
    pendingWrongQuestions: [],
    rankQuestionQueue: [],
    sessionDuplicateSignatures: new Set<string>(),
    lastRankMatchAction: null,
  });
  useUIStore.getState().setPage('practice');

  return question;
}

export function refreshQuestionBrowserPractice(params: StartQuestionBrowserPracticeParams): Question {
  return startQuestionBrowserPractice(params);
}
