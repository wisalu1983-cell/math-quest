import type { GameSessionMode, AdvanceSlot, RankTier } from './gamification';

export type TopicId =
  | 'number-sense'
  | 'mental-arithmetic'
  | 'vertical-calc'
  | 'multi-step'
  | 'decimal-ops'
  | 'operation-laws'
  | 'bracket-ops'
  | 'equation-transpose';

export interface User {
  id: string;
  nickname: string;
  avatarSeed: string;
  createdAt: number;
  grade?: number;
  supabaseId?: string;
  settings: UserSettings;
}

export interface UserSettings {
  soundEnabled: boolean;
  hapticsEnabled: boolean;
}

export type QuestionType =
  | 'numeric-input'
  | 'multiple-choice'
  | 'multi-select'
  | 'vertical-fill'
  | 'multi-blank'
  | 'expression-input'
  | 'equation-input'
  | 'multi-step-input'
  | 'expression-select'
  | 'true-false';

export interface Question {
  id: string;
  topicId: TopicId;
  type: QuestionType;
  difficulty: number;
  prompt: string;
  promptLatex?: string;
  data: QuestionData;
  solution: Solution;
  hints: string[];
  /** @deprecated 旧XP体系残留，计划移除 */
  xpBase?: number;
}

export type QuestionData =
  | NumberSenseData
  | MentalArithmeticData
  | VerticalCalcData
  | MultiStepData
  | DecimalOpsData
  | OperationLawsData
  | BracketOpsData
  | EquationTransposeData;

export interface NumberSenseData {
  kind: 'number-sense';
  subtype: 'estimate' | 'round' | 'compare';
  options?: string[];
  expressions?: string[];
  acceptedAnswers?: number[];
  /** estimate-basic 区间验证：接受精确值 × (1 ± tolerance) 内的答案（0.15=±15%，0.10=±10%）*/
  tolerance?: number;
}

export interface MentalArithmeticData {
  kind: 'mental-arithmetic';
  expression: string;
  operands: number[];
  operator: '+' | '-' | '×' | '÷';
}

export interface VerticalCalcData {
  kind: 'vertical-calc';
  operation: '+' | '-' | '×' | '÷';
  operands: number[];
  steps: VerticalCalcStep[];
  decimalPlaces?: number;
  trainingFields?: TrainingField[];
  multiplicationBoard?: MultiplicationBoardData;
}

export interface MultiplicationBoardData {
  mode: 'integer' | 'decimal';
  integerOperands: [number, number];
  operandInputMode: 'static' | 'blank';
  originalOperands?: [string, string];
  operandDecimalPlaces?: [number, number];
  decimalPlaces?: number;
  finalAnswer?: string;
}

export interface VerticalCalcStep {
  stepIndex: number;
  stepType: 'digit' | 'carry';
  column: number;
  row: number;
  expectedDigit: number;
  skippable: boolean;
  hint: string;
}

export interface TrainingField {
  label: string;
  answer: string;
  placeholder?: string;
}

export interface TrainingFieldMistake {
  label: string;
  userValue: string;
  expectedValue: string;
}

export interface MultiStepData {
  kind: 'multi-step';
  expression: string;
  steps: ComputationStep[];
  options?: string[];
  /** v2.2 新增：子题型标识，用于陷阱诊断、分档筛选、A04 S2-LB 等 lane 语义对齐 */
  subtype?:
    | 'recognize-simplifiable'
    | 'recognize-not-simplifiable'
    | 'fill-split-low'
    | 'fill-split-mid'
    | 'mid-pick-transform'
    | 'recognize-method'
    | 'recognize-multi'
    | 'error-diagnose'
    | 'hidden-factor-exec';
  /** v2.2 新增：multi-blank 题型展示用的模板字符串（含 ___ 占位） */
  template?: string;
}

export interface ComputationStep {
  stepIndex: number;
  subExpression: string;
  result: number;
  annotation: string;
}

export interface DecimalOpsData {
  kind: 'decimal-ops';
  expression: string;
  subtype: 'add-sub' | 'mul' | 'div' | 'shift' | 'compare' | 'trap';
  options?: string[];
}

export interface OperationLawsData {
  kind: 'operation-laws';
  law: 'commutative' | 'associative' | 'distributive';
  originalExpression: string;
  transformedExpression: string;
  options?: string[];
}

export interface BracketOpsData {
  kind: 'bracket-ops';
  subtype:
    | 'add-bracket'
    | 'remove-bracket'
    | 'division-property'
    | 'nested-bracket'
    | 'four-items-sign'
    | 'error-diagnose';
  originalExpression: string;
  options?: string[];
  /** v2.2 remove-bracket 新增：括号在原表达式中的相对位置（题面多样化用） */
  position?: 'front' | 'middle' | 'tail';
  /** v2.2 remove-bracket 新增：括号前的运算符（加法侧/减法侧），驱动去括号变号规则 */
  bracketSide?: 'plus' | 'minus';
}

export interface EquationTransposeData {
  kind: 'equation-transpose';
  equation: string;
  variable: string;
  steps: string[];
  options?: string[];
  /** v2.2 新增：子题型标识，用于 A08 陷阱体系和 lane 语义对齐 */
  subtype?:
    | 'move-constant'
    | 'move-from-linear'
    | 'bracket-equation'
    | 'move-both-sides'
    | 'error-diagnose';
  /** v2.2 新增：A08 陷阱诊断使用的 trap 编号（T1/T2/T3/T4/T3+T4/T1-lite 等） */
  trap?: string;
}

export interface Solution {
  /** 单值答案（numeric-input / multiple-choice / vertical-fill） */
  answer: number | string;
  /** 多选答案（multi-select）——正确选项字母集合，如 ['A','C'] */
  answers?: string[];
  /** 多步填空答案（multi-blank）——按空位顺序的数组 */
  blanks?: Array<string | number>;
  /** 表达式/等式题的标准答案（expression-input / equation-input），供验证器调用 */
  standardExpression?: string;
  /** equation-input 题的变量名，默认 'x' */
  variable?: string;
  /** expression-input 题的附加约束，如 "去括号后不得含括号" */
  bracketPolicy?: 'must-not-have' | 'must-have' | 'none';
  steps?: string[];
  explanation: string;
}

export interface QuestionAttempt {
  questionId: string;
  question: Question;
  userAnswer: string;
  correct: boolean;
  timeMs: number;
  hintsUsed: number;
  attemptedAt: number;
}

export type HistoryResult = 'win' | 'lose' | 'incomplete';

export interface HistoryQuestionRecord {
  prompt: string;
  userAnswer: string;
  correctAnswer: string;
  correct: boolean;
  timeMs: number;
}

export interface HistoryRecord {
  id: string;
  userId: string;
  sessionMode: GameSessionMode;
  startedAt: number;
  endedAt?: number;
  completed: boolean;
  result: HistoryResult;
  topicId: TopicId;
  rankMatchMeta?: {
    primaryTopics: TopicId[];
  };
  questions: HistoryQuestionRecord[];
}

export interface PracticeSession {
  id: string;
  userId: string;
  /**
   * 兼容性主键。
   * - campaign/advance/wrong-review 场景下承载"本次练习的题型"语义
   * - rank-match 场景下降级为"兼容占位"：取值 = rankMatchMeta.primaryTopics[0]，
   *   不再表达该局的唯一语义主题；所有段位赛读路径一律走 rankMatchMeta
   *   （Spec 2026-04-18 §4.2）
   */
  topicId: TopicId;
  startedAt: number;
  endedAt?: number;
  difficulty: number;
  sessionMode: GameSessionMode;
  targetLevelId: string | null;
  questions: QuestionAttempt[];
  heartsRemaining: number;
  completed: boolean;
  advanceSlots?: AdvanceSlot[]; // 进阶模式专用：预生成的20道题槽位
  /** 段位赛专用：该局在 BO 赛事里的归属与主考项 */
  rankMatchMeta?: {
    rankSessionId: string;
    gameIndex: number;
    targetTier: Exclude<RankTier, 'apprentice'>;
    /**
     * 本局的主考题型集合（长度 ∈ [1, 3]）。
     * 由抽题器（M2）按 Spec §5.4 胜场编排规则计算；UI 题头据此展示"本局主考"徽标。
     */
    primaryTopics: TopicId[];
  };
  /**
   * 段位赛专用：本局预生成的完整题序（长度 = RANK_QUESTIONS_PER_GAME[tier]）。
   * 由 `startRankMatchGame` 写入并随 session 持久化，支持"单局中途刷新恢复"（ISSUE-060，Plan §4.1）。
   * - 非 rank-match session 不写入该字段
   * - `submitAnswer` 不改写本字段（queue 生成后固定，答题进度由 `questions.length` 派生）
   * - 恢复路径：`resumeRankMatchGame` 从存档读回，`currentIndex = questions.length`
   */
  rankQuestionQueue?: Question[];
}

export interface WrongQuestion {
  question: Question;
  wrongAnswer: string;
  wrongAt: number;
  reviewedAt?: number;
  reviewCorrect?: boolean;
}

export interface TopicMeta {
  id: TopicId;
  name: string;
  description: string;
  icon: string;
  color: string;
  unlockLevel: number;
}

export type {
  CampaignLevel,
  CampaignLane,
  CampaignStage,
  CampaignMap,
  LevelCompletion,
  TopicCampaignProgress,
  GameProgress,
  GameSessionMode,
  RankTier,
  RankMatchBestOf,
  RankMatchSessionStatus,
  RankMatchGame,
  RankMatchSession,
  RankProgress,
  AdvanceProgress,
} from './gamification';
