import { TOPICS } from '@/constants';
import { repository } from '@/repository/local';
import { useUIStore, useUserStore } from '@/store';
import type { HistoryQuestionRecord, HistoryRecord, TopicId } from '@/types';
import type { DevInjection } from '../types';

type CoveredSessionMode = Extract<HistoryRecord['sessionMode'], 'campaign' | 'advance' | 'rank-match'>;

const COVERED_MODES: CoveredSessionMode[] = ['campaign', 'advance', 'rank-match'];
const COVERED_RESULTS: HistoryRecord['result'][] = ['win', 'lose', 'incomplete'];
const OPERATORS = ['+', '-', '×'] as const;

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickOperator() {
  return OPERATORS[randomInt(0, OPERATORS.length - 1)];
}

function calcAnswer(left: number, right: number, operator: (typeof OPERATORS)[number]): number {
  switch (operator) {
    case '-':
      return left - right;
    case '×':
      return left * right;
    case '+':
    default:
      return left + right;
  }
}

function getCorrectCount(result: HistoryRecord['result'], total: number): number {
  switch (result) {
    case 'win':
      return Math.max(total - 1, 1);
    case 'lose':
      return Math.max(1, Math.floor(total / 3));
    case 'incomplete':
    default:
      return Math.max(1, Math.floor(total / 2));
  }
}

function buildQuestionRecords(
  topicName: string,
  result: HistoryRecord['result'],
  recordIndex: number,
): HistoryQuestionRecord[] {
  const total = randomInt(3, 6);
  const correctCount = getCorrectCount(result, total);

  return Array.from({ length: total }, (_, questionIndex) => {
    const operator = pickOperator();
    const left = randomInt(6, 30);
    const right = operator === '-' ? randomInt(1, left - 1) : randomInt(2, 12);
    const answer = calcAnswer(left, right, operator);
    const correct = questionIndex < correctCount;

    return {
      prompt: `[${topicName}] 第 ${recordIndex + 1} 局第 ${questionIndex + 1} 题：${left} ${operator} ${right} = ?`,
      userAnswer: correct ? String(answer) : String(answer + randomInt(1, 3)),
      correctAnswer: String(answer),
      correct,
      timeMs: randomInt(800, 4200),
    };
  });
}

function buildRankMatchMeta(recordIndex: number): HistoryRecord['rankMatchMeta'] {
  const topicIds = TOPICS.map(topic => topic.id);
  const primaryCount = randomInt(1, 3);
  const primaryTopics = Array.from({ length: primaryCount }, (_, offset) => topicIds[(recordIndex + offset) % topicIds.length]);
  return { primaryTopics };
}

function buildRandomHistoryRecord(
  userId: string,
  mode: CoveredSessionMode,
  result: HistoryRecord['result'],
  topicId: TopicId,
  recordIndex: number,
  now: number,
): HistoryRecord {
  const topicName = TOPICS.find(topic => topic.id === topicId)?.name ?? topicId;
  const startedAt = now - randomInt((recordIndex + 2) * 60 * 60 * 1000, (recordIndex + 3) * 9 * 60 * 60 * 1000);
  const completed = result !== 'incomplete';

  return {
    id: `dev-history-${now}-${recordIndex}`,
    userId,
    sessionMode: mode,
    startedAt,
    endedAt: startedAt + randomInt(2 * 60 * 1000, 18 * 60 * 1000),
    completed,
    result,
    topicId,
    rankMatchMeta: mode === 'rank-match' ? buildRankMatchMeta(recordIndex) : undefined,
    questions: buildQuestionRecords(topicName, result, recordIndex),
  };
}

function requireCurrentUserId(): string {
  const userId = useUserStore.getState().user?.id ?? repository.getUser()?.id;
  if (!userId) {
    throw new Error('当前 namespace 没有用户，无法生成历史记录');
  }
  return userId;
}

function appendCoveredRandomHistoryRecords(): void {
  const userId = requireCurrentUserId();
  const now = Date.now();
  const records: HistoryRecord[] = [];

  COVERED_MODES.forEach((mode, modeIndex) => {
    COVERED_RESULTS.forEach((result, resultIndex) => {
      const recordIndex = modeIndex * COVERED_RESULTS.length + resultIndex;
      const topicId = TOPICS[recordIndex % TOPICS.length]!.id;
      records.push(buildRandomHistoryRecord(userId, mode, result, topicId, recordIndex, now));
    });
  });

  records.forEach(record => {
    repository.saveHistoryRecord(record);
  });
}

function clearCurrentHistory(): void {
  const confirmed = typeof globalThis.confirm === 'function'
    ? globalThis.confirm('清空当前 namespace 下的全部历史记录？此操作不可恢复。')
    : true;
  if (!confirmed) return;

  repository.clearHistory();
  useUIStore.getState().setViewingSessionId(null);
  if (useUIStore.getState().currentPage === 'session-detail') {
    useUIStore.getState().setPage('history');
  }
}

export const historyRecordInjections: DevInjection[] = [
  {
    id: 'history.records.append-random-covered',
    group: 'ext',
    label: '追加随机历史记录（全覆盖）',
    description: '追加 9 条测试历史，覆盖闯关/进阶/段位赛 + 胜利/失败/未完成，并轮转 8 个题型',
    run() {
      appendCoveredRandomHistoryRecords();
    },
  },
  {
    id: 'history.records.clear',
    group: 'ext',
    label: '清空历史记录',
    description: '只清当前 namespace 的历史记录，不触碰 sessions / gameProgress / rank_match_sessions',
    run() {
      clearCurrentHistory();
    },
  },
];
