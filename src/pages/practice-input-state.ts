import { useCallback, useEffect, useReducer, useRef } from 'react';
import type { Question } from '@/types';

export interface PracticeAnswerState {
  answer: string;
  remainderInput: string;
  selectedOption: string | null;
  selectedOptions: string[];
  blankValues: string[];
  trainingComplete: boolean;
  trainingValues: string[];
}

export type PracticeAnswerAction =
  | { type: 'resetForQuestion'; question: Question | null }
  | { type: 'setAnswer'; value: string }
  | { type: 'setRemainderInput'; value: string }
  | { type: 'selectOption'; value: string | null }
  | { type: 'toggleSelectedOption'; value: string }
  | { type: 'setBlankValue'; index: number; value: string }
  | { type: 'setTrainingComplete'; value: boolean }
  | { type: 'setTrainingValues'; values: string[] };

export function createInitialPracticeAnswerState(question: Question | null): PracticeAnswerState {
  return {
    answer: '',
    remainderInput: '',
    selectedOption: null,
    selectedOptions: [],
    blankValues: question?.type === 'multi-blank' && question.solution.blanks
      ? Array(question.solution.blanks.length).fill('')
      : [],
    trainingComplete: false,
    trainingValues: [],
  };
}

export function practiceAnswerReducer(
  state: PracticeAnswerState,
  action: PracticeAnswerAction,
): PracticeAnswerState {
  switch (action.type) {
    case 'resetForQuestion':
      return createInitialPracticeAnswerState(action.question);
    case 'setAnswer':
      return { ...state, answer: action.value };
    case 'setRemainderInput':
      return { ...state, remainderInput: action.value };
    case 'selectOption':
      return { ...state, selectedOption: action.value };
    case 'toggleSelectedOption':
      return {
        ...state,
        selectedOptions: state.selectedOptions.includes(action.value)
          ? state.selectedOptions.filter(option => option !== action.value)
          : [...state.selectedOptions, action.value],
      };
    case 'setBlankValue':
      return {
        ...state,
        blankValues: state.blankValues.map((value, index) =>
          index === action.index ? action.value : value
        ),
      };
    case 'setTrainingComplete':
      return { ...state, trainingComplete: action.value };
    case 'setTrainingValues':
      return { ...state, trainingValues: action.values };
  }
}

export function usePracticeInputState(question: Question | null) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, dispatch] = useReducer(
    practiceAnswerReducer,
    question,
    createInitialPracticeAnswerState,
  );

  const resetForQuestion = useCallback((nextQuestion: Question | null) => {
    dispatch({ type: 'resetForQuestion', question: nextQuestion });
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    // Practice treats the question object identity as the question boundary:
    // nextQuestion replaces it, while submitAnswer keeps the same reference.
    resetForQuestion(question);
  }, [question, resetForQuestion]);

  const setAnswer = useCallback((value: string) => {
    dispatch({ type: 'setAnswer', value });
  }, []);

  const setRemainderInput = useCallback((value: string) => {
    dispatch({ type: 'setRemainderInput', value });
  }, []);

  const selectOption = useCallback((value: string | null) => {
    dispatch({ type: 'selectOption', value });
  }, []);

  const toggleSelectedOption = useCallback((value: string) => {
    dispatch({ type: 'toggleSelectedOption', value });
  }, []);

  const setBlankValue = useCallback((index: number, value: string) => {
    dispatch({ type: 'setBlankValue', index, value });
  }, []);

  const setTrainingComplete = useCallback((value: boolean) => {
    dispatch({ type: 'setTrainingComplete', value });
  }, []);

  const setTrainingValues = useCallback((values: string[]) => {
    dispatch({ type: 'setTrainingValues', values });
  }, []);

  return {
    state,
    inputRef,
    setAnswer,
    setRemainderInput,
    selectOption,
    toggleSelectedOption,
    setBlankValue,
    setTrainingComplete,
    setTrainingValues,
  };
}
