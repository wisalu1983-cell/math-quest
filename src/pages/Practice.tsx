import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useSessionStore, useUIStore } from '@/store';
import { useRankMatchStore } from '@/store/rank-match';
import VerticalCalcBoard from '@/components/VerticalCalcBoard';
import DecimalTrainingGrid from '@/components/DecimalTrainingGrid';
import Hearts from '@/components/Hearts';
import Dialog from '@/components/Dialog';

// 题干字号：按权重字符数自适应，确保 375px 视口（可用宽 303px）内单行显示
// 中文字符权重 1.0，ASCII/数字/运算符权重 0.6
function promptFontSize(prompt: string): number {
  const wLen = [...prompt].reduce(
    (acc, c) => acc + (/[\u4e00-\u9fff\uff00-\uffef，。？！：；]/.test(c) ? 1.0 : 0.6),
    0
  );
  return Math.max(14, Math.min(32, Math.floor(303 / wLen)));
}
import LoadingScreen from '@/components/LoadingScreen';
import ConfettiEffect from '@/components/ConfettiEffect';
import MathText from '@/components/MathText';
import type { VerticalCalcData, TrainingField } from '@/types';
import {
  getPracticeFeedbackAnnouncement,
} from '@/utils/ui-accessibility';
import { getMethodTip } from '@/utils/method-tips';

export default function Practice() {
  const {
    currentQuestion, currentIndex, totalQuestions,
    hearts, showFeedback, lastAnswerCorrect, lastTrainingFieldMistakes,
    submitAnswer, nextQuestion, endSession, abandonSession,
    session,
    startRankMatchGame,
    suspendRankMatchSession,
    cancelRankMatchSession,
  } = useSessionStore();
  const { setPage, setLastSession } = useUIStore();
  const activeRankSession = useRankMatchStore(s => s.activeRankSession);
  const isAdvance = session?.sessionMode === 'advance';
  const isRankMatch = session?.sessionMode === 'rank-match';

  const [answer, setAnswer] = useState('');
  const [remainderInput, setRemainderInput] = useState('');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [blankValues, setBlankValues] = useState<string[]>([]);
  const [trainingComplete, setTrainingComplete] = useState(false);
  const [trainingValues, setTrainingValues] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const [shakeWrong, setShakeWrong] = useState(false);
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Reset state when question changes
  useEffect(() => {
    setAnswer('');
    setRemainderInput('');
    setSelectedOption(null);
    setSelectedOptions([]);
    setTrainingComplete(false);
    setTrainingValues([]);
    if (currentQuestion?.type === 'multi-blank' && currentQuestion.solution.blanks) {
      setBlankValues(Array(currentQuestion.solution.blanks.length).fill(''));
    } else {
      setBlankValues([]);
    }
    if (inputRef.current) inputRef.current.focus();
  }, [currentQuestion?.id, currentQuestion?.type, currentQuestion?.solution.blanks]);

  // 注意：不要在此处 early return。下方还有 useCallback / useEffect 等 hooks，
  // 若 currentQuestion 从 truthy 变 null（例如 endSession 后），early return 会使
  // 后续 hooks 数量减少，触发 React "Rendered fewer hooks than expected" 崩溃。
  // 所有 hooks 调用完成后再做 loading fallback（见本函数 JSX 返回前的 early return）。
  const isVerticalCalc = currentQuestion?.type === 'vertical-fill';
  const isMultipleChoice = currentQuestion?.type === 'multiple-choice';
  const isMultiSelect = currentQuestion?.type === 'multi-select';
  const isMultiBlank = currentQuestion?.type === 'multi-blank';
  const isExpressionInput = currentQuestion?.type === 'expression-input';
  const isEquationInput = currentQuestion?.type === 'equation-input';
  const isFreeTextInput = isExpressionInput || isEquationInput;
  const isDivisionMental =
    currentQuestion?.topicId === 'mental-arithmetic' &&
    currentQuestion?.type === 'numeric-input' &&
    (currentQuestion?.data as { operator?: string } | undefined)?.operator === '÷' &&
    typeof currentQuestion?.solution.answer === 'string' &&
    String(currentQuestion?.solution.answer).includes('...');
  const dataTrainingFields =
    currentQuestion?.type === 'numeric-input' &&
    currentQuestion?.data != null &&
    'trainingFields' in currentQuestion.data
      ? (currentQuestion.data as { trainingFields?: TrainingField[] }).trainingFields
      : undefined;
  const hasTrainingFields =
    dataTrainingFields != null &&
    dataTrainingFields.length > 0 &&
    !!currentQuestion &&
    currentQuestion.difficulty < 8;

  const handleSubmit = useCallback(() => {
    if (showFeedback) return;
    let userAnswer: string;
    if (isMultipleChoice) {
      userAnswer = selectedOption ?? '';
    } else if (isMultiSelect) {
      if (selectedOptions.length === 0) return;
      userAnswer = selectedOptions.slice().sort().join(',');
    } else if (isMultiBlank) {
      if (blankValues.some(v => !v.trim())) return;
      userAnswer = blankValues.map(v => v.trim()).join('|');
    } else if (isDivisionMental) {
      if (!answer.trim()) return;
      userAnswer = `${answer.trim()}...${remainderInput.trim() || '0'}`;
    } else {
      userAnswer = answer;
    }
    if (!userAnswer.trim()) return;

    const result = submitAnswer(userAnswer, hasTrainingFields ? { trainingValues } : undefined);

    if (result.correct) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 1600);
    } else {
      setShakeWrong(true);
      setTimeout(() => setShakeWrong(false), 300);
    }
  }, [showFeedback, isMultipleChoice, isMultiSelect, isMultiBlank, isDivisionMental, selectedOption, selectedOptions, blankValues, answer, remainderInput, submitAnswer, hasTrainingFields, trainingValues]);

  const handleNext = useCallback(() => {
    if (hearts <= 0 || currentIndex >= totalQuestions) {
      const completedSession = endSession();
      setLastSession(completedSession);
      if (completedSession.sessionMode === 'rank-match') {
        setPage('rank-match-game-result');
      } else {
        setPage('summary');
      }
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
    if (!currentQuestion) return;
    submitAnswer(correct ? String(currentQuestion.solution.answer) : '竖式计算有误');
  };

  const handleSuspendRankMatch = () => {
    setShowQuitConfirm(false);
    suspendRankMatchSession();
    setPage('rank-match-hub');
  };

  const handleRestartRankMatch = () => {
    const targetTier = session?.rankMatchMeta?.targetTier;
    if (!targetTier) return;
    setShowRestartConfirm(false);
    setShowQuitConfirm(false);
    try {
      cancelRankMatchSession();
      const restarted = useRankMatchStore.getState().startRankMatch(targetTier);
      startRankMatchGame(restarted.id, 1);
      setPage('practice');
    } catch (e) {
      console.warn('[RankMatch] 放弃并重开失败，回大厅', e);
      setPage('rank-match-hub');
    }
  };

  if (!currentQuestion) return <LoadingScreen />;

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
          {/* 段位赛 BO 进度徽标（rank-match 专属）*/}
          {isRankMatch && session?.rankMatchMeta && (
            <div className="flex items-center justify-center gap-1.5 mb-1.5 text-[12px] font-bold"
                 style={{ color: `var(--rank-${session.rankMatchMeta.targetTier})` }}>
              <span>{
                { rookie: '新秀', pro: '高手', expert: '专家', master: '大师' }[session.rankMatchMeta.targetTier] ?? ''
              }</span>
              <span className="text-text-3">·</span>
              <span>BO{activeRankSession?.bestOf ?? '?'}</span>
              <span className="text-text-3">·</span>
              <span>第 {session.rankMatchMeta.gameIndex} 局</span>
            </div>
          )}
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

            {/* 圆点进度 / 数字进度 */}
            {totalQuestions > 15 ? (
              <div
                className="flex-1 flex justify-center items-center min-w-0"
                role="progressbar"
                aria-valuenow={showFeedback ? currentIndex : currentIndex + 1}
                aria-valuemin={0}
                aria-valuemax={totalQuestions}
                aria-label={`答题进度 ${showFeedback ? currentIndex : currentIndex + 1}/${totalQuestions}`}
              >
                <span className="text-[14px] font-black text-primary tabular-nums">
                  {showFeedback ? currentIndex : currentIndex + 1}
                  <span className="text-text-3 font-bold"> / {totalQuestions}</span>
                </span>
              </div>
            ) : (
              <div
                className="flex-1 flex justify-center gap-1.5 items-center overflow-hidden min-w-0"
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
            )}

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
              {currentQuestion.promptLatex ? (
                // v2.2 S1-T2 修复：prompt 与 promptLatex 并存时都渲染，
                // 否则 A05 分数题、A08 方程题的指令文字会被 promptLatex 完全覆盖。
                // prompt 含 "\n" 时取第一段做指令（避免把核心表达式再文本重复一次），
                // 无 "\n" 时整段作指令；promptLatex 则以大号 LaTeX 呈现。
                <div className="flex flex-col items-center gap-3 mb-0">
                  <div className="text-[16px] font-medium text-text-muted text-center leading-snug whitespace-normal px-2">
                    {(currentQuestion.prompt.split('\n')[0] || '').trim()}
                  </div>
                  <div className="font-black text-text text-[32px] leading-tight text-center">
                    <MathText latex={currentQuestion.promptLatex} />
                  </div>
                </div>
              ) : (
                <h2
                className="font-black text-center text-text leading-snug tracking-tight mb-0 whitespace-normal"
                style={{ fontSize: `${promptFontSize(currentQuestion.prompt)}px` }}
              >
                  {currentQuestion.prompt.includes('$') ? (
                    <MathText text={currentQuestion.prompt} />
                  ) : (
                    currentQuestion.prompt
                  )}
                </h2>
              )}

              {/* Vertical calc board — stays inside card */}
              {isVerticalCalc && (
                <div className="mt-6">
                  <VerticalCalcBoard
                    data={currentQuestion.data as VerticalCalcData}
                    onComplete={handleVerticalComplete}
                  />
                </div>
              )}

              {/* Multiple choice — 单选 */}
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

              {/* Multi-select — 多选 */}
              {isMultiSelect && currentQuestion.data && 'options' in currentQuestion.data && currentQuestion.data.options && (
                <div className="grid grid-cols-1 gap-3 mt-6 text-left">
                  <p className="text-sm text-text-2 font-bold mb-1">可多选</p>
                  {currentQuestion.data.options.map((opt: string, idx: number) => {
                    const letter = String.fromCharCode(65 + idx); // A/B/C/...
                    const checked = selectedOptions.includes(letter);
                    return (
                      <button
                        key={opt}
                        onClick={() =>
                          setSelectedOptions(prev =>
                            checked ? prev.filter(l => l !== letter) : [...prev, letter]
                          )
                        }
                        aria-pressed={checked}
                        className={`p-4 rounded-xl border-2 text-left font-medium transition-all flex items-center gap-3
                          ${checked
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border bg-card-2 hover:border-primary/40'
                          }`}
                      >
                        <span className={`w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0 ${checked ? 'border-primary bg-primary text-white' : 'border-border-2'}`}>
                          {checked ? '✓' : ''}
                        </span>
                        <span>{opt}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Method tip — 题干阶段，最低档次时显示 */}
            {(() => {
              const tip = getMethodTip(currentQuestion);
              if (!tip) return null;
              return (
                <div className="w-full mb-3">
                  <div className="rounded-xl bg-primary/[0.07] border border-primary/20 px-4 py-2.5 flex items-start gap-2">
                    <span className="text-primary text-base leading-none mt-0.5 flex-shrink-0">💡</span>
                    <p className="text-sm font-semibold text-primary leading-snug">{tip}</p>
                  </div>
                </div>
              );
            })()}

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
              {hasTrainingFields && dataTrainingFields && (
                <DecimalTrainingGrid
                  fields={dataTrainingFields}
                  difficulty={currentQuestion.difficulty}
                  onComplete={() => setTrainingComplete(true)}
                  onValuesChange={setTrainingValues}
                />
              )}

              {/* Regular single input */}
              {currentQuestion.type === 'numeric-input' && !isDivisionMental && (
                <div className="flex flex-col items-center mb-4 gap-1">
                  {hasTrainingFields && !trainingComplete && (
                    <p id="training-hint" className="text-sm font-bold text-warning">
                      先完成上方训练格
                    </p>
                  )}
                  <input
                    ref={inputRef}
                    type="text"
                    inputMode="decimal"
                    value={answer}
                    onChange={e => setAnswer(e.target.value)}
                    placeholder="输入答案"
                    disabled={hasTrainingFields && !trainingComplete}
                    aria-label="输入答案"
                    aria-describedby={hasTrainingFields && !trainingComplete ? 'training-hint' : undefined}
                    className={`w-48 text-center text-2xl font-bold bg-card-2 border-2 border-border
                               rounded-2xl px-4 py-3 text-text focus:border-primary outline-none transition-colors
                               ${hasTrainingFields && !trainingComplete ? 'opacity-40' : ''}`}
                    autoFocus
                  />
                </div>
              )}

              {/* Multi-blank input（多步填空） */}
              {isMultiBlank && currentQuestion.solution.blanks && (
                <div className="flex flex-wrap justify-center gap-2 mb-4">
                  {currentQuestion.solution.blanks.map((_, idx: number) => (
                    <input
                      key={idx}
                      ref={idx === 0 ? inputRef : undefined}
                      type="text"
                      inputMode="decimal"
                      value={blankValues[idx] ?? ''}
                      onChange={e => {
                        const next = [...blankValues];
                        next[idx] = e.target.value;
                        setBlankValues(next);
                      }}
                      aria-label={`第 ${idx + 1} 空`}
                      placeholder={`${idx + 1}`}
                      className="w-20 text-center text-xl font-bold bg-card-2 border-2 border-border
                                 rounded-xl px-2 py-2 text-text focus:border-primary outline-none transition-colors"
                    />
                  ))}
                </div>
              )}

              {/* Expression / Equation input（填写式子/填写完整等式） */}
              {isFreeTextInput && (
                <div className="flex flex-col items-center mb-4 gap-1">
                  <input
                    ref={inputRef}
                    type="text"
                    value={answer}
                    onChange={e => setAnswer(e.target.value)}
                    placeholder={isEquationInput ? '写出移项后的完整等式' : '直接写出变换后的式子'}
                    aria-label={isEquationInput ? '输入移项后的等式' : '输入变换后的式子'}
                    className="w-full max-w-sm text-center text-xl font-bold bg-card-2 border-2 border-border
                               rounded-2xl px-4 py-3 text-text focus:border-primary outline-none transition-colors"
                    autoFocus
                  />
                  <p className="text-xs text-text-3">支持 + − × ÷ 和 * /，括号使用 ( )</p>
                </div>
              )}
            </div>

            {/* Submit button */}
            {!isVerticalCalc && (
              <button
                className="btn-flat w-full max-w-xs stagger-3"
                onClick={handleSubmit}
                disabled={
                  (isMultipleChoice && !selectedOption) ||
                  (isMultiSelect && selectedOptions.length === 0) ||
                  (isMultiBlank && blankValues.some(v => !v.trim())) ||
                  (!isMultipleChoice && !isMultiSelect && !isMultiBlank && !answer.trim()) ||
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
                <motion.span
                  className="text-3xl text-success"
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ duration: 0.35, ease: [0.34, 1.56, 0.64, 1] }}
                >
                  ✓
                </motion.span>
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

            {lastAnswerCorrect && lastTrainingFieldMistakes.length > 0 && (
              <div className="mb-3 rounded-xl border-2 border-warning bg-warning-lt px-4 py-3">
                <p className="text-sm font-black" style={{ color: '#7A5C00' }}>
                  过程格有 {lastTrainingFieldMistakes.length} 处错误，但本题仍判定通过
                </p>
                <ul className="mt-2 space-y-2 text-sm text-text">
                  {lastTrainingFieldMistakes.map((mistake, index) => (
                    <li key={`${mistake.label}-${index}`} className="rounded-lg bg-card/70 px-3 py-2">
                      <p className="font-bold text-text-2">{mistake.label}</p>
                      <p className="mt-1">
                        你填 <span className="font-black text-danger">{mistake.userValue || '空白'}</span>
                        ，正确是 <span className="font-black text-success">{mistake.expectedValue}</span>
                      </p>
                    </li>
                  ))}
                </ul>
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
        {isRankMatch ? (
          <>
            <p className="text-sm text-text-2 mb-4">
              你可以先中断并保存，稍后从段位赛大厅继续；如果选择“放弃，重新开始”，当前挑战进度会被丢弃，并从第 1 局重新开始。
            </p>
            <div className="flex flex-col gap-3">
              <button
                className="btn-secondary w-full"
                onClick={() => setShowQuitConfirm(false)}
              >
                继续练习
              </button>
              <button
                className="btn-flat w-full"
                onClick={handleSuspendRankMatch}
              >
                中断并保存
              </button>
              <button
                className="btn-secondary w-full"
                onClick={() => {
                  setShowQuitConfirm(false);
                  setShowRestartConfirm(true);
                }}
              >
                放弃，重新开始
              </button>
            </div>
          </>
        ) : (
          <>
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
          </>
        )}
      </Dialog>
      <Dialog
        open={showRestartConfirm}
        onClose={() => setShowRestartConfirm(false)}
        title="放弃，重新开始？"
      >
        <p className="text-sm text-text-2 mb-4">
          这会结束当前段位赛，并从第 1 局重新开始。当前挑战进度不会保留。
        </p>
        <div className="flex gap-3">
          <button
            className="btn-secondary flex-1"
            onClick={() => setShowRestartConfirm(false)}
          >
            返回
          </button>
          <button
            className="btn-flat flex-1"
            onClick={handleRestartRankMatch}
          >
            确认重开
          </button>
        </div>
      </Dialog>
      <ConfettiEffect active={showConfetti} />
    </div>
  );
}
