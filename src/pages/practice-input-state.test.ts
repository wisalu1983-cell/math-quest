import { describe, expect, it } from 'vitest';
import type { Question } from '@/types';
import {
  createInitialPracticeAnswerState,
  practiceAnswerReducer,
} from './practice-input-state';

function makeQuestion(overrides: Partial<Question> = {}): Question {
  return {
    id: 'q-base',
    topicId: 'mental-arithmetic',
    type: 'numeric-input',
    difficulty: 3,
    prompt: '12 + 8 = ?',
    data: {
      kind: 'mental-arithmetic',
      expression: '12 + 8',
      operands: [12, 8],
      operator: '+',
    },
    solution: {
      answer: 20,
      explanation: '12 + 8 = 20',
    },
    hints: [],
    ...overrides,
  };
}

describe('createInitialPracticeAnswerState', () => {
  it('starts numeric input with an empty answer', () => {
    const state = createInitialPracticeAnswerState(makeQuestion());

    expect(state.answer).toBe('');
    expect(state.remainderInput).toBe('');
    expect(state.selectedOption).toBeNull();
    expect(state.selectedOptions).toEqual([]);
    expect(state.blankValues).toEqual([]);
    expect(state.trainingComplete).toBe(false);
    expect(state.trainingValues).toEqual([]);
  });

  it('starts division-with-remainder input with empty quotient and remainder fields', () => {
    const state = createInitialPracticeAnswerState(makeQuestion({
      id: 'q-division',
      data: {
        kind: 'mental-arithmetic',
        expression: '17 ÷ 5',
        operands: [17, 5],
        operator: '÷',
      },
      solution: {
        answer: '3...2',
        explanation: '17 ÷ 5 = 3...2',
      },
    }));

    expect(state.answer).toBe('');
    expect(state.remainderInput).toBe('');
  });

  it('starts multiple choice without a selected option', () => {
    const state = createInitialPracticeAnswerState(makeQuestion({
      id: 'q-choice',
      type: 'multiple-choice',
      data: {
        kind: 'number-sense',
        subtype: 'compare',
        options: ['>', '<', '='],
      },
      solution: {
        answer: '>',
        explanation: '12 is greater than 8',
      },
    }));

    expect(state.selectedOption).toBeNull();
  });

  it('starts multi select with no checked options', () => {
    const state = createInitialPracticeAnswerState(makeQuestion({
      id: 'q-multi-select',
      type: 'multi-select',
      data: {
        kind: 'number-sense',
        subtype: 'compare',
        options: ['A', 'B', 'C'],
      },
      solution: {
        answer: 'A,C',
        answers: ['A', 'C'],
        explanation: 'A and C are true',
      },
    }));

    expect(state.selectedOptions).toEqual([]);
  });

  it('sizes multi blank values from solution blanks', () => {
    const state = createInitialPracticeAnswerState(makeQuestion({
      id: 'q-blanks',
      type: 'multi-blank',
      data: {
        kind: 'multi-step',
        expression: '25 × 4',
        steps: [],
        template: '25 × 4 = ___ × ___ = ___',
      },
      solution: {
        answer: '100',
        blanks: [100, 4, 25],
        explanation: 'Fill each equivalent step',
      },
    }));

    expect(state.blankValues).toEqual(['', '', '']);
  });

  it('starts training fields as incomplete with no values', () => {
    const state = createInitialPracticeAnswerState(makeQuestion({
      id: 'q-training',
      topicId: 'vertical-calc',
      data: {
        kind: 'vertical-calc',
        operation: '×',
        operands: [1.25, 4],
        steps: [],
        trainingFields: [
          { label: '1.25 has decimal places', answer: '2' },
          { label: '4 has decimal places', answer: '0' },
        ],
      },
      solution: {
        answer: '5',
        explanation: '1.25 × 4 = 5',
      },
    }));

    expect(state.trainingComplete).toBe(false);
    expect(state.trainingValues).toEqual([]);
  });
});

describe('practiceAnswerReducer', () => {
  it('updates answer without changing other input state', () => {
    const initial = createInitialPracticeAnswerState(makeQuestion());

    const next = practiceAnswerReducer(initial, { type: 'setAnswer', value: '42' });

    expect(next.answer).toBe('42');
    expect(next.remainderInput).toBe('');
    expect(next.selectedOption).toBeNull();
    expect(next.blankValues).toEqual([]);
  });

  it('toggles multi-select options on and off', () => {
    const initial = createInitialPracticeAnswerState(makeQuestion());

    const selected = practiceAnswerReducer(initial, { type: 'toggleSelectedOption', value: 'A' });
    const selectedMore = practiceAnswerReducer(selected, { type: 'toggleSelectedOption', value: 'C' });
    const unselected = practiceAnswerReducer(selectedMore, { type: 'toggleSelectedOption', value: 'A' });

    expect(selected.selectedOptions).toEqual(['A']);
    expect(selectedMore.selectedOptions).toEqual(['A', 'C']);
    expect(unselected.selectedOptions).toEqual(['C']);
  });

  it('updates only the requested blank value', () => {
    const initial = createInitialPracticeAnswerState(makeQuestion({
      type: 'multi-blank',
      data: {
        kind: 'multi-step',
        expression: '25 × 4',
        steps: [],
      },
      solution: {
        answer: '100',
        blanks: [25, 4, 100],
        explanation: '',
      },
    }));

    const next = practiceAnswerReducer(initial, { type: 'setBlankValue', index: 1, value: '4' });

    expect(next.blankValues).toEqual(['', '4', '']);
  });

  it('resets all prior input and rebuilds blank values for the next question', () => {
    const first = makeQuestion({
      type: 'multi-blank',
      data: {
        kind: 'multi-step',
        expression: '25 × 4',
        steps: [],
      },
      solution: {
        answer: '100',
        blanks: [25, 4, 100],
        explanation: '',
      },
    });
    const second = makeQuestion({
      id: 'q-next',
      type: 'multi-blank',
      data: {
        kind: 'multi-step',
        expression: '18 + 12',
        steps: [],
      },
      solution: {
        answer: '30',
        blanks: [18, 12],
        explanation: '',
      },
    });
    const dirty = {
      ...createInitialPracticeAnswerState(first),
      answer: 'stale',
      remainderInput: '9',
      selectedOption: 'A',
      selectedOptions: ['B'],
      blankValues: ['25', '4', '100'],
      trainingComplete: true,
      trainingValues: ['2', '0'],
    };

    const next = practiceAnswerReducer(dirty, { type: 'resetForQuestion', question: second });

    expect(next).toEqual({
      answer: '',
      remainderInput: '',
      selectedOption: null,
      selectedOptions: [],
      blankValues: ['', ''],
      trainingComplete: false,
      trainingValues: [],
    });
  });

  it('clears training values and completion when resetting for a question', () => {
    const dirty = practiceAnswerReducer(
      practiceAnswerReducer(
        createInitialPracticeAnswerState(makeQuestion()),
        { type: 'setTrainingComplete', value: true },
      ),
      { type: 'setTrainingValues', values: ['1', '2'] },
    );

    const next = practiceAnswerReducer(dirty, { type: 'resetForQuestion', question: makeQuestion({ id: 'q-reset' }) });

    expect(next.trainingComplete).toBe(false);
    expect(next.trainingValues).toEqual([]);
  });
});
