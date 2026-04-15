import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useSessionStore, useUIStore } from '@/store';
import VerticalCalcBoard from '@/components/VerticalCalcBoard';
import DecimalTrainingGrid from '@/components/DecimalTrainingGrid';
import Hearts from '@/components/Hearts';
import Dialog from '@/components/Dialog';
import LoadingScreen from '@/components/LoadingScreen';
import ConfettiEffect from '@/components/ConfettiEffect';
import type { VerticalCalcData } from '@/types';
import {
  getPracticeFeedbackAnnouncement,
} from '@/utils/ui-accessibility';

export default function Practice() {
  const {
    currentQuestion, currentIndex, totalQuestions,
    hearts, showFeedback, lastAnswerCorrect,
    submitAnswer, nextQuestion, endSession, abandonSession,
    session,
  } = useSessionStore();
  const { setPage, setLastSession } = useUIStore();
  const isAdvance = session?.sessionMode === 'advance';

  const [answer, setAnswer] = useState('');
  const [remainderInput, setRemainderInput] = useState('');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [trainingComplete, setTrainingComplete] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [shakeWrong, setShakeWrong] = useState(false);
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Reset state when question changes
  useEffect(() => {
    setAnswer('');
    setRemainderInput('');
    setSelectedOption(null);
    setTrainingComplete(false);
    if (inputRef.current) inputRef.current.focus();
  }, [currentQuestion?.id]);

  if (!currentQuestion) return <LoadingScreen />;

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
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 1600);
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

return (
    <div className="min-h-dvh bg-bg flex flex-col safe-top">
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {showFeedback
          ? getPracticeFeedbackAnnouncement(lastAnswerCorrect, currentQuestion.solution.answer)
          : ''}
      </div>

      {/* Top bar */}
      <div className="px-4 py-3 bg-card border-b-2 border-border-2">
        <div className="max-w-lg mx-auto">
          {/* 退出 + 圆点进度 + 心数 */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowQuitConfirm(true)}
              className="w-9 h-9 rounded-[10px] bg-danger-lt border-2 flex items-center justify-center
                         text-[13px] font-black text-danger flex-shrink-0 transition-all active:scale-95"
              style={{ borderColor: '#FFD5D5' }}
              aria-label="退出练习"
            >
              ✕
            </button>

            {/* 圆点进度 */}
            <div
              className="flex-1 flex justify-center gap-1.5 items-center"
              role="progressbar"
              aria-valuenow={showFeedback ? currentIndex : currentIndex + 1}
              aria-valuemin={0}
              aria-valuemax={totalQuestions}
              aria-label={`答题进度 ${showFeedback ? currentIndex : currentIndex + 1}/${totalQuestions}`}
            >
              {Array.from({ length: totalQuestions }, (_, i) => {
                const isDone = i < currentIndex;
                const isCurrent = i === currentIndex && !showFeedback;
                return (
                  <div
                    key={i}
                    aria-hidden="true"
                    className="h-2 rounded-full transition-all duration-300 bg-border flex-shrink-0"
                    style={{
                      width: isCurrent ? 22 : 8,
                      background: (isDone || (i < currentIndex + 1 && showFeedback))
                        ? 'var(--color-primary)'
                        : isCurrent
                          ? 'var(--color-primary)'
                          : 'var(--color-border)',
                      boxShadow: isCurrent ? '0 0 8px rgba(255,107,53,.4)' : undefined,
                    }}
                  />
                );
              })}
            </div>

            <Hearts count={hearts} />
          </div>
        </div>
      </div>

      {/* Question area */}
      <div className="flex-1 flex flex-col items-center justify-center py-6 px-4 max-w-lg mx-auto w-full relative">
        {!showFeedback ? (
          <>
            {/* Question card */}
            <div
              className={`w-full bg-card rounded-[20px] border-2 border-border-2 px-5 py-8 mb-4 stagger-1 ${shakeWrong ? 'animate-shake' : ''}`}
              style={{ boxShadow: '0 2px 10px rgba(0,0,0,.09)' }}
            >
              <h2 className="text-[32px] font-black text-center text-text leading-snug tracking-tight mb-0">
                {currentQuestion.prompt}
              </h2>

              {/* Vertical calc board — stays inside card */}
              {isVerticalCalc && (
                <div className="mt-6">
                  <VerticalCalcBoard
                    data={currentQuestion.data as VerticalCalcData}
                    onComplete={handleVerticalComplete}
                  />
                </div>
              )}

              {/* Multiple choice — stays inside card */}
              {isMultipleChoice && currentQuestion.data && 'options' in currentQuestion.data && currentQuestion.data.options && (
                <div className="grid grid-cols-1 gap-3 mt-6 text-left">
                  {currentQuestion.data.options.map((opt: string) => (
                    <button
                      key={opt}
                      onClick={() => setSelectedOption(opt)}
                      className={`p-4 rounded-xl border-2 text-left font-medium transition-all
                        ${selectedOption === opt
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border bg-card-2 hover:border-primary/40'
                        }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Inputs — below card */}
            <div className="w-full stagger-2">
              {/* Division: two fields */}
              {currentQuestion.type === 'numeric-input' && isDivisionMental && (
                <div className="flex items-center gap-2 justify-center mb-4 flex-wrap">
                  <input
                    ref={inputRef}
                    type="text"
                    inputMode="numeric"
                    value={answer}
                    onChange={e => setAnswer(e.target.value)}
                    placeholder="商"
                    aria-label="商（除法结果的商数部分）"
                    className="w-24 text-center text-2xl font-bold bg-card-2 border-2 border-border
                               rounded-2xl px-3 py-3 text-text focus:border-primary outline-none transition-colors"
                    autoFocus
                  />
                  <span className="text-xl font-bold text-text-2 select-none">……（余）</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={remainderInput}
                    onChange={e => setRemainderInput(e.target.value)}
                    placeholder="余数"
                    aria-label="余数（除法结果的余数部分）"
                    className="w-24 text-center text-2xl font-bold bg-card-2 border-2 border-border
                               rounded-2xl px-3 py-3 text-text focus:border-primary outline-none transition-colors"
                  />
                </div>
              )}

              {/* Training grid */}
              {hasTrainingFields && (
                <DecimalTrainingGrid
                  fields={(currentQuestion.data as any).trainingFields}
                  difficulty={currentQuestion.difficulty}
                  onComplete={() => setTrainingComplete(true)}
                />
              )}

              {/* Regular single input */}
              {currentQuestion.type === 'numeric-input' && !isDivisionMental && (
                <div className="flex justify-center mb-4">
                  <input
                    ref={inputRef}
                    type="text"
                    inputMode="decimal"
                    value={answer}
                    onChange={e => setAnswer(e.target.value)}
                    placeholder={hasTrainingFields && !trainingComplete ? '先完成训练格' : '输入答案'}
                    disabled={hasTrainingFields && !trainingComplete}
                    aria-label="输入答案"
                    className={`w-48 text-center text-2xl font-bold bg-card-2 border-2 border-border
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
                className="btn-flat w-full max-w-xs stagger-3"
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
          /* Feedback panel */
          <div className={`w-full p-6 rounded-2xl border-2 ${
            lastAnswerCorrect
              ? 'border-success-mid bg-success-lt'
              : 'border-warning bg-warning-lt'
          }`}>
            <div className="flex items-center gap-3 mb-3">
              {lastAnswerCorrect ? (
                <div className="flex gap-1">
                  {[0, 1, 2].map(i => (
                    <motion.span
                      key={i}
                      className="text-2xl"
                      initial={{ scale: 0, rotate: -20 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{
                        delay: i * 0.1,
                        duration: 0.4,
                        ease: [0.34, 1.56, 0.64, 1],
                      }}
                    >
                      ⭐
                    </motion.span>
                  ))}
                </div>
              ) : (
                <span className="text-3xl">😅</span>
              )}
              <span className={`text-xl font-black ${lastAnswerCorrect ? 'text-success' : ''}`}
                    style={!lastAnswerCorrect ? { color: '#7A5C00' } : undefined}>
                {lastAnswerCorrect ? '太棒了！' : '没关系，继续加油！💪'}
              </span>
            </div>

            {!lastAnswerCorrect && (
              <div className="mb-3">
                <p className="text-sm font-bold text-text-2">正确答案：</p>
                <p className="text-lg font-black text-text">{String(currentQuestion.solution.answer)}</p>
                <p className="text-sm text-text-2 mt-1">{currentQuestion.solution.explanation}</p>
              </div>
            )}

            {lastAnswerCorrect && (
              <div className="mb-3">
                <span className="text-sm text-success font-bold">
                  {String(currentQuestion.solution.answer)}，答对了！
                </span>
                {currentQuestion.solution.explanation && (
                  <p className="text-xs text-text-2 mt-1">{currentQuestion.solution.explanation}</p>
                )}
              </div>
            )}

            <button className="btn-flat w-full mt-2" onClick={handleNext}>
              {currentIndex >= totalQuestions || hearts <= 0 ? '查看结果' : '下一题'}
            </button>
          </div>
        )}
      </div>

      {/* Quit confirmation dialog */}
      <Dialog
        open={showQuitConfirm}
        onClose={() => setShowQuitConfirm(false)}
        title="确定退出吗？"
      >
        <p className="text-sm text-text-2 mb-4">
          {isAdvance
            ? '退出不计入进度，但已答错的题会保存到错题本'
            : '退出后本次练习不计入记录'}
        </p>
        <div className="flex gap-3">
          <button
            className="btn-secondary flex-1"
            onClick={() => setShowQuitConfirm(false)}
          >
            继续练习
          </button>
          <button
            className="btn-flat flex-1"
            onClick={() => {
              abandonSession();
              setPage('home');
            }}
          >
            退出
          </button>
        </div>
      </Dialog>
      <ConfettiEffect active={showConfetti} />
    </div>
  );
}
