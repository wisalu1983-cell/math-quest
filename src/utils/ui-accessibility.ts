export type AppPage =
  | 'onboarding'
  | 'home'
  | 'campaign-map'
  | 'advance-select'
  | 'practice'
  | 'summary'
  | 'progress'
  | 'profile'
  | 'wrong-book'
  | 'history'
  | 'session-detail'
  | 'rank-match-hub'
  | 'rank-match-game-result'
  | 'rank-match-result';

const PAGE_TITLES: Record<AppPage, string> = {
  onboarding: '数学大冒险',
  home: '数学大冒险 · 学习',
  'campaign-map': '数学大冒险 · 闯关',
  'advance-select': '数学大冒险 · 进阶',
  practice: '数学大冒险 · 答题中',
  summary: '数学大冒险 · 练习结果',
  progress: '数学大冒险 · 进度',
  profile: '数学大冒险 · 个人中心',
  'wrong-book': '数学大冒险 · 错题本',
  history: '数学大冒险 · 练习记录',
  'session-detail': '数学大冒险 · 练习详情',
  'rank-match-hub': '数学大冒险 · 段位赛',
  'rank-match-game-result': '数学大冒险 · 单局结算',
  'rank-match-result': '数学大冒险 · 赛事结算',
};

export function getDocumentTitle(page: AppPage): string {
  return PAGE_TITLES[page];
}

export function getHeartsAriaLabel(count: number, total = 3): string {
  return `剩余生命 ${count} 颗，共 ${total} 颗`;
}

export function getPracticeFeedbackAnnouncement(
  isCorrect: boolean | null,
  answer: string | number | null | undefined,
): string {
  if (isCorrect === null) return '';

  const normalizedAnswer = answer == null ? '' : String(answer);
  if (!normalizedAnswer) {
    return isCorrect ? '回答正确。' : '回答错误。';
  }

  return isCorrect
    ? `回答正确。正确答案是 ${normalizedAnswer}。`
    : `回答错误。正确答案是 ${normalizedAnswer}。`;
}
