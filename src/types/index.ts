import type { GameSessionMode, AdvanceSlot } from './gamification';

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
  settings: UserSettings;
}

export interface UserSettings {
  soundEnabled: boolean;
  hapticsEnabled: boolean;
}

export type QuestionType =
  | 'numeric-input'
  | 'multiple-choice'
  | 'vertical-fill'
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

export interface MultiStepData {
  kind: 'multi-step';
  expression: string;
  steps: ComputationStep[];
  options?: string[];
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
  subtype: 'add-sub' | 'mul' | 'div' | 'shift' | 'compare';
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
  subtype: 'add-bracket' | 'remove-bracket' | 'division-property';
  originalExpression: string;
  options?: string[];
}

export interface EquationTransposeData {
  kind: 'equation-transpose';
  equation: string;
  variable: string;
  steps: string[];
  options?: string[];
}

export interface Solution {
  answer: number | string;
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

export interface PracticeSession {
  id: string;
  userId: string;
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

export type { CampaignLevel, CampaignLane, CampaignStage, CampaignMap, LevelCompletion, TopicCampaignProgress, GameProgress, GameSessionMode } from './gamification';
