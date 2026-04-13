import { useState, useRef, useEffect, useCallback } from 'react';
import { useSessionStore, useUIStore } from '@/store';
import VerticalCalcBoard from '@/components/VerticalCalcBoard';
import DecimalTrainingGrid from '@/components/DecimalTrainingGrid';
import type { VerticalCalcData } from '@/types';

export default function Practice() {
  const {
    currentQuestion, currentIndex, totalQuestions,
    hearts, showFeedback, lastAnswerCorrect,
    submitAnswer, nextQuestion, endSession, abandonSession,
  } = useSessionStore();
  const { setPage, setLastSession } = useUIStore();

  const [answer, setAnswer] = useState('');
  const [remainderInput, setRemainderInput] = useState('');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [trainingComplete, setTrainingComplete] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [shakeWrong, setShakeWrong] = useState(false);
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);

  // Reset state when question changes
  useEffect(() => {
    setAnswer('');
    setRemainderInput('');
    setSelectedOption(null);
    setTrainingComplete(false);
    if (inputRef.current) inputRef.current.focus();
  }, [currentQuestion?.id]);

  if (!currentQuestion) return null;

  const isVerticalCalc = currentQuestion.type === 'vertical-fill';
  const isMultipleChoice = currentQuestion.type === 'multiple-choice';
  // Division in mental arithmetic uses two-field input (quotient + remainder)
  const isDivisionMental =
    currentQuestion.topicId === 'mental-arithmetic' &&
    (currentQuestion.data as { operator?: string })?.operator === '÷';
  // Decimal training grid: numeric-input questions with trainingFields, not demon difficulty
  const hasTrainingFields =
    currentQuestion.type === 'numeric-input' &&
    currentQuestion.data != null &&
    'trainingFields' in currentQuestion.data &&
    Array.isArray((currentQuestion.data as any).trainingFields) &&
    (currentQuestion.data as any).trainingFields.length > 0 &&
    currentQuestion.difficulty < 8;

  const handleSubmit = useCallback(() => {
    if (showFeedback) return;
    let userAnswer: string;
    if (isMultipleChoice) {
      userAnswer = selectedOption ?? '';
    } else if (isDivisionMental) {
      // Combine quotient + remainder; empty remainder treated as 0
      if (!answer.trim()) return;
      userAnswer = `${answer.trim()}...${remainderInput.trim() || '0'}`;
    } else {
      userAnswer = answer;
    }
    if (!userAnswer.trim()) return;

    const result = submitAnswer(userAnswer);

    if (result.correct) {
      // correct — no XP float in gamification redesign
    } else {
      setShakeWrong(true);
      setTimeout(() => setShakeWrong(false), 300);
    }
  }, [showFeedback, isMultipleChoice, isDivisionMental, selectedOption, answer, remainderInput, submitAnswer]);

  const handleNext = useCallback(() => {
    if (hearts <= 0 || currentIndex >= totalQuestions) {
      const session = endSession();
      setLastSession(session);
      setPage('summary');
    } else {
      nextQuestion();
    }
  }, [hearts, currentIndex, totalQuestions, endSession, setLastSession, setPage, nextQuestion]);

  // Global Enter key handler — submit answer OR advance to next question
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Enter') return;
      e.preventDefault();
      if (showFeedback) {
        handleNext();
      } else if (!isVerticalCalc) {
        handleSubmit();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showFeedback, handleNext, handleSubmit, isVerticalCalc]);

  const handleVerticalComplete = (correct: boolean) => {
    submitAnswer(correct ? String(currentQuestion.solution.answer) : '竖式计算有误');
  };

  const progressPercent = ((currentIndex) / totalQuestions) * 100;

  return (
    <div className="min-h-dvh bg-bg flex flex-col safe-top">
      {/* Top bar */}
      <div className="px-4 py-3 border-b border-border">
        <div className="max-w-lg mx-auto">
          {/* Progress + quit */}
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={() => setShowQuitConfirm(true)}
              className="text-text-secondary hover:text-text"
            >
              ✕
            </button>
            <div className="flex-1 h-3 bg-bg-elevated rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-sm text-text-secondary font-mono">
              {showFeedback ? currentIndex : currentIndex + 1}/{totalQuestions}
            </span>
          </div>

          {/* Hearts */}
          <div className="flex items-center justify-between">
            <div className="flex gap-0.5">
              {[1, 2, 3].map(i => (
                <span key={i} className={`text-xl ${i <= hearts ? 'text-red-500' : 'text-border'}`}>❤</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Question area */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 max-w-lg mx-auto w-full relative">
        {!showFeedback ? (
          <>
            {/* Question prompt */}
            <div className={`w-full ${shakeWrong ? 'animate-shake' : ''}`}>
              <h2 className="text-xl font-bold text-center mb-6">{currentQuestion.prompt}</h2>

              {/* Vertical calc board */}
              {isVerticalCalc && (
                <VerticalCalcBoard
                  data={currentQuestion.data as VerticalCalcData}
                  onComplete={handleVerticalComplete}
                />
              )}

              {/* Multiple choice */}
              {isMultipleChoice && currentQuestion.data && 'options' in currentQuestion.data && currentQuestion.data.options && (
                <div className="grid grid-cols-1 gap-3 mb-6">
                  {currentQuestion.data.options.map((opt: string) => (
                    <button
                      key={opt}
                      onClick={() => setSelectedOption(opt)}
                      className={`p-4 rounded-xl border-2 text-left font-medium transition-all
                        ${selectedOption === opt
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border bg-bg-card hover:border-border/80'
                        }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}

              {/* Numeric input — division mental arithmetic: two fields */}
              {currentQuestion.type === 'numeric-input' && isDivisionMental && (
                <div className="flex items-center gap-2 justify-center mb-6 flex-wrap">
                  <input
                    ref={inputRef}
                    type="text"
                    inputMode="numeric"
                    value={answer}
                    onChange={e => setAnswer(e.target.value)}
                    placeholder="商"
                    className="w-24 text-center text-2xl font-bold bg-bg-elevated border-2 border-border
                               rounded-2xl px-3 py-3 text-text focus:border-primary outline-none transition-colors"
                    autoFocus
                  />
                  <span className="text-xl font-bold text-text-secondary select-none">……（余）</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={remainderInput}
                    onChange={e => setRemainderInput(e.target.value)}
                    placeholder="余数"
                    className="w-24 text-center text-2xl font-bold bg-bg-elevated border-2 border-border
                               rounded-2xl px-3 py-3 text-text focus:border-primary outline-none transition-colors"
                  />
                </div>
              )}

              {/* Training grid for decimal mul/div */}
              {hasTrainingFields && (
                <DecimalTrainingGrid
                  fields={(currentQuestion.data as any).trainingFields}
                  difficulty={currentQuestion.difficulty}
                  onComplete={() => setTrainingComplete(true)}
                />
              )}

              {/* Numeric input — regular single field */}
              {currentQuestion.type === 'numeric-input' && !isDivisionMental && (
                <div className="flex justify-center mb-6">
                  <input
                    ref={inputRef}
                    type="text"
                    inputMode="decimal"
                    value={answer}
                    onChange={e => setAnswer(e.target.value)}
                    placeholder={hasTrainingFields && !trainingComplete ? '先完成训练格' : '输入答案'}
                    disabled={hasTrainingFields && !trainingComplete}
                    className={`w-48 text-center text-2xl font-bold bg-bg-elevated border-2 border-border
                               rounded-2xl px-4 py-3 text-text focus:border-primary outline-none transition-colors
                               ${hasTrainingFields && !trainingComplete ? 'opacity-40' : ''}`}
                    autoFocus
                  />
                </div>
              )}
            </div>

            {/* Submit button */}
            {!isVerticalCalc && (
              <button
                className="btn-primary w-full max-w-xs text-lg"
                onClick={handleSubmit}
                disabled={
                  (isMultipleChoice ? !selectedOption : !answer.trim()) ||
                  (hasTrainingFields && !trainingComplete)
                }
              >
                确认
              </button>
            )}
          </>
        ) : (
          /* Feedback overlay */
          <div className={`w-full p-6 rounded-2xl border-2 ${
            lastAnswerCorrect
              ? 'border-success bg-success/10'
              : 'border-danger bg-danger/10'
          }`}>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">{lastAnswerCorrect ? '🎉' : '😅'}</span>
              <span className={`text-xl font-bold ${lastAnswerCorrect ? 'text-success' : 'text-danger'}`}>
                {lastAnswerCorrect ? '正确！' : '再想想'}
              </span>
            </div>

            {!lastAnswerCorrect && (
              <div className="mb-3">
                <p className="text-sm text-text-secondary">正确答案:</p>
                <p className="text-lg font-bold text-text">{String(currentQuestion.solution.answer)}</p>
                <p className="text-sm text-text-secondary mt-1">{currentQuestion.solution.explanation}</p>
              </div>
            )}

            {lastAnswerCorrect && (
              <div className="mb-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm text-success font-medium">答案: {String(currentQuestion.solution.answer)}</span>
                </div>
                {currentQuestion.solution.explanation && (
                  <p className="text-xs text-text-secondary">{currentQuestion.solution.explanation}</p>
                )}
              </div>
            )}

            <button className="btn-primary w-full mt-2" onClick={handleNext}>
              {currentIndex >= totalQuestions || hearts <= 0 ? '查看结果' : '下一题'}
            </button>
          </div>
        )}
      </div>

      {/* Quit confirmation dialog */}
      {showQuitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-bg-card rounded-2xl p-6 mx-4 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-bold mb-2">确定退出吗？</h3>
            <p className="text-sm text-text-secondary mb-4">退出后本次练习不计入记录</p>
            <div className="flex gap-3">
              <button
                className="btn-secondary flex-1"
                onClick={() => setShowQuitConfirm(false)}
              >
                继续练习
              </button>
              <button
                className="btn-primary flex-1"
                onClick={() => {
                  abandonSession();
                  setPage('home');
                }}
              >
                退出
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
